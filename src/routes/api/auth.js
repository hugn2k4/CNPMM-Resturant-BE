import express from "express";
import { body, validationResult } from "express-validator";
import authService from "../../services/authService.js";

const router = express.Router();

// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("fullName").notEmpty(),
    body("phoneNumber").notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

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
  }
);

// POST /api/auth/confirm
router.post(
  "/confirm",
  [body("email").isEmail().normalizeEmail(), body("otp").notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

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
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const data = await authService.login(req.body);
      if (!data.accessToken) {
        return res.status(200).json({
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
  }
);

// POST /api/auth/request-forgot-password
router.post("/request-forgot-password", async (req, res, next) => {
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
});

// POST /api/auth/set-new-password
router.post(
  "/set-new-password",
  [
    body("email").isEmail().normalizeEmail(),
    body("otp").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
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
  }
);

// POST /api/auth/resend-otp
router.post(
  "/resend-otp",
  [body("email").isEmail().normalizeEmail()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
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
  }
);

// POST /api/auth/refresh
router.post("/refresh", async (req, res, next) => {
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
});

// POST /api/auth/logout
router.post("/logout", async (req, res, next) => {
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
});

export default router;