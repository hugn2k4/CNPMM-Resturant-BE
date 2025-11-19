// src/controller/auth.controller.js
import * as authService from "../services/auth.service.js";
import { buildAuthUrl, exchangeCode, verifyIdToken } from "../services/google.service.js";

const envFromProcess = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

export const googleLogin = async (req, res) => {
  const env = envFromProcess();

  // --- LOG DEBUG ---
  console.log("[GOOGLE ENV]", {
    clientId: env.clientId,
    redirectUri: env.redirectUri,
    clientSecret: env.clientSecret ? "***" : undefined,
  });

  try {
    const url = await buildAuthUrl(env);

    // --- LOG DEBUG ---
    console.log("[AUTH URL]", url);

    return res.redirect(url);
  } catch (e) {
    console.error("googleLogin error:", e);
    return res.status(500).json({
      success: false,
      message: e?.message || String(e),
    });
  }
};

export const googleCallback = async (req, res) => {
  const env = envFromProcess();

  // --- LOG DEBUG ---
  console.log("[CALLBACK QUERY]", req.query);

  try {
    const profile = await exchangeCode({ ...req.query }, env);

    // --- LOG DEBUG ---
    console.log("[PROFILE]", {
      sub: profile?.sub,
      email: profile?.email,
      email_verified: profile?.email_verified,
      name: profile?.name,
      picture: profile?.picture ? "yes" : "no",
    });

    const user = await authService.upsertGoogleUser(profile);
    const token = authService.signAccessToken(user, process.env.JWT_SECRET);

    // set cookie httpOnly (tùy bạn)
    res.cookie("access_token", token, { httpOnly: true, sameSite: "lax", secure: false });

    return res.redirect(`${process.env.FRONTEND_URL}/?login=success`);
  } catch (e) {
    console.error("OAuth callback error:", e);
    // để dễ debug có thể trả JSON thay vì redirect:
    // return res.status(500).json({ success:false, message: e?.message || String(e) });
    return res.redirect(`${process.env.FRONTEND_URL}/?login=failed`);
  }
};

export const me = async (req, res) => {
  res.json({ ok: true, user: req.user });
};

// Xử lý idToken từ frontend (Google Identity Services)
export const googleIdTokenLogin = async (req, res) => {
  const env = envFromProcess();
  const { idToken } = req.body;

  // --- LOG DEBUG ---
  console.log("[GOOGLE ID TOKEN LOGIN]", { hasToken: !!idToken });

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: "Missing idToken",
    });
  }

  try {
    // Verify idToken với Google
    const profile = await verifyIdToken(idToken, env);

    // --- LOG DEBUG ---
    console.log("[ID TOKEN PROFILE]", {
      sub: profile?.sub,
      email: profile?.email,
      email_verified: profile?.email_verified,
      name: profile?.name,
    });

    // Tạo hoặc cập nhật user trong DB
    const user = await authService.upsertGoogleUser(profile);

    // Tạo JWT token
    const accessToken = authService.signAccessToken(user, process.env.JWT_SECRET);

    // Trả về token cho frontend với format giống local login
    return res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          role: user.role,
          image: user.image,
          avatar: user.avatar,
        },
      },
    });
  } catch (e) {
    console.error("Google ID Token verification error:", e);
    return res.status(401).json({
      success: false,
      message: e?.message || "Invalid token",
    });
  }
};

// ========== LOCAL AUTHENTICATION CONTROLLERS ==========

export const register = async (req, res, next) => {
  try {
    const resp = await authService.register(req.body);
    return res.json({
      success: resp.success,
      code: resp.code,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (err) {
    next(err);
  }
};

export const confirm = async (req, res, next) => {
  try {
    const resp = await authService.confirmOTP(req.body);
    return res.json({
      success: resp.success,
      code: resp.code,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    console.log("🔐 [LOGIN] Request:", { email: req.body.email });
    const data = await authService.login(req.body);
    console.log("🔐 [LOGIN] Service response:", {
      hasAccessToken: !!data.accessToken,
      message: data.message,
    });

    if (!data.accessToken) {
      return res.status(401).json({
        success: false,
        code: "401",
        message: data.message,
        data: null,
      });
    }

    // set refresh token cookie (httpOnly)
    const refreshToken = data.refreshToken;
    const cookieOptions = {
      httpOnly: true,
      // secure: true, // enable in production with HTTPS
      sameSite: "Strict",
      maxAge: parseInt(process.env.JWT_REFRESH_EXPIRATION || "86400000"),
      path: "/",
    };
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.json({
      success: true,
      code: "200",
      message: "Đăng nhập thành công!",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      return res.status(400).json({ success: false, message: "Missing refresh token" });
    }
    const resp = await authService.refreshToken({ refreshToken: token });

    // set new cookie
    res.cookie("refreshToken", resp.refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      maxAge: parseInt(process.env.JWT_REFRESH_EXPIRATION || "86400000"),
      path: "/",
    });

    return res.json({ success: true, message: resp.message, data: resp });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      return res.status(400).json({ success: false, message: "Missing refresh token" });
    }
    await authService.logout({ refreshToken: token });
    res.clearCookie("refreshToken", { path: "/" });
    return res.json({ success: true, message: "Đã logout" });
  } catch (err) {
    next(err);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.resendOtp(email);
    return res.json({
      success: true,
      code: "200",
      message: "Đã gửi lại mã OTP mới!",
    });
  } catch (err) {
    next(err);
  }
};

export const requestForgotPassword = async (req, res, next) => {
  try {
    const email = (req.body && req.body.email) || req.query?.email;
    if (!email) {
      return res.status(400).json({ success: false, message: "Missing email" });
    }
    const resp = await authService.requestForgotPassword(email);
    return res.json({
      success: resp.success,
      code: resp.code,
      message: resp.message,
    });
  } catch (err) {
    next(err);
  }
};

export const setNewPassword = async (req, res, next) => {
  try {
    const resp = await authService.setNewPassword(req.body);
    return res.json({
      success: resp.success,
      code: resp.code,
      message: resp.message,
      data: resp.data,
    });
  } catch (err) {
    next(err);
  }
};
