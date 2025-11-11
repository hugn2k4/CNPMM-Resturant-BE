"use strict";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/refreshToken.js";
import User from "../models/user.js";
import emailService from "./emailService.js";

const refreshTokenExpiration = parseInt(process.env.JWT_REFRESH_EXPIRATION || "86400000");
const accessTokenExpiry = process.env.JWT_ACCESS_EXPIRATION || "1h";

// Store pending registrations and OTPs
const pendingOtps = new Map();

const generateOTP = () => String(Math.floor(Math.random() * 900000) + 100000);

// Clean up expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pendingOtps) {
    if (v.expiryTime <= now) pendingOtps.delete(k);
  }
}, 60 * 1000);

const generateAccessToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_SECRET || "changeme", {
    expiresIn: accessTokenExpiry,
  });
};

// REGISTER USER
const register = async (registerRequest) => {
  const { email, password, phoneNumber, fullName } = registerRequest;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return {
      success: false,
      code: "400",
      message: "Email đã được đăng ký!",
    };
  }

  // Check if phone number already exists
  if (phoneNumber) {
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return {
        success: false,
        code: "400",
        message: "Số điện thoại đã được đăng ký!",
      };
    }
  }

  // Check if there's already a pending registration for this email
  const existing = pendingOtps.get(email);
  if (existing && existing.expiryTime > Date.now() && existing.attempts > 0) {
    return {
      success: true,
      code: "200",
      message: "Vui lòng kiểm tra email, mã OTP vẫn còn hiệu lực!",
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);

  // Store pending registration data
  pendingOtps.set(email, {
    otpHash,
    expiryTime: Date.now() + 300000, // 5 minutes
    attempts: 5,
    userData: {
      email,
      password: hashedPassword,
      phoneNumber,
      fullName,
      role: "USER",
      status: "INACTIVE", // Will be activated after OTP confirmation
    },
  });

  // Send OTP email
  const sent = await emailService.sendOTPToEmail(email, otp);
  if (!sent) {
    pendingOtps.delete(email);
    return {
      success: false,
      code: "400",
      message: "Không thể gửi email OTP, vui lòng thử lại!",
    };
  }

  return {
    success: true,
    code: "201",
    message: "Đã gửi mã OTP tới email!",
  };
};

// CONFIRM OTP
const confirmOTP = async (confirmRequest) => {
  const { email, otp } = confirmRequest;

  const pending = pendingOtps.get(email);
  if (!pending || pending.expiryTime <= Date.now()) {
    pendingOtps.delete(email);
    return {
      success: false,
      code: "400",
      message: "Mã OTP không tồn tại hoặc đã hết hạn!",
    };
  }

  if (pending.attempts <= 0) {
    pendingOtps.delete(email);
    return {
      success: false,
      code: "400",
      message: "Bạn đã nhập sai OTP quá 5 lần, vui lòng thử lại!",
    };
  }

  // Verify OTP
  const match = await bcrypt.compare(otp, pending.otpHash);
  if (!match) {
    pending.attempts--;
    return {
      success: false,
      code: "400",
      message: "OTP không đúng!",
      data: { attempts: pending.attempts },
    };
  }

  // Create user
  const newUser = new User(pending.userData);
  newUser.status = "ACTIVE"; // Activate user
  await newUser.save();

  // Clean up
  pendingOtps.delete(email);

  return {
    success: true,
    code: "200",
    message: "Đăng ký thành công!",
    data: {
      id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
    },
  };
};

// LOGIN
const login = async (loginRequest) => {
  const { email, password } = loginRequest;
  const user = await User.findOne({ email });
  if (!user) {
    return {
      message: "Đăng nhập thất bại: Tài khoản không tồn tại",
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }

  // Check if user is active
  if (user.status !== "ACTIVE") {
    return {
      message: "Tài khoản chưa được kích hoạt hoặc đã bị khóa",
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return {
      message: "Đăng nhập thất bại: Mật khẩu không đúng",
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }

  // Revoke existing tokens
  await RefreshToken.updateMany({ user: user._id, revoked: false }, { revoked: true });

  const accessToken = generateAccessToken(user.email);

  let refreshTokenValue;
  do {
    refreshTokenValue = crypto.randomUUID();
  } while (await RefreshToken.exists({ token: refreshTokenValue }));

  const refreshDoc = new RefreshToken({
    token: refreshTokenValue,
    user: user._id,
    expiryDate: new Date(Date.now() + refreshTokenExpiration),
    revoked: false,
  });
  await refreshDoc.save();

  const userDTO = {
    id: user._id,
    email: user.email,
    fullName: user.fullName || "",
    phoneNumber: user.phoneNumber || "",
    role: user.role || "USER",
  };

  return {
    message: "Đăng nhập thành công",
    accessToken,
    refreshToken: refreshTokenValue,
    user: userDTO,
  };
};

// REFRESH TOKEN
const refreshToken = async (refreshTokenRequest) => {
  const { refreshToken: tokenValue } = refreshTokenRequest;
  const now = new Date();
  const refresh = await RefreshToken.findOne({
    token: tokenValue,
    revoked: false,
    expiryDate: { $gt: now },
  }).populate("user");

  if (!refresh) {
    throw new Error("Refresh token không hợp lệ hoặc đã hết hạn!");
  }

  const user = refresh.user;

  const newAccessToken = generateAccessToken(user.email);

  // Rotate refresh token
  refresh.revoked = true;
  await refresh.save();

  let newRefreshValue;
  do {
    newRefreshValue = crypto.randomUUID();
  } while (await RefreshToken.exists({ token: newRefreshValue }));

  const newRefresh = new RefreshToken({
    token: newRefreshValue,
    user: user._id,
    expiryDate: new Date(Date.now() + refreshTokenExpiration),
    revoked: false,
  });
  await newRefresh.save();

  return {
    message: "Refresh token thành công",
    accessToken: newAccessToken,
    refreshToken: newRefreshValue,
  };
};

// LOGOUT
const logout = async (logoutRequest) => {
  const { refreshToken: tokenValue } = logoutRequest;
  const refresh = await RefreshToken.findOne({ token: tokenValue }).orFail();
  refresh.revoked = true;
  await refresh.save();
};

// RESEND OTP
const resendOtp = async (email) => {
  const pending = pendingOtps.get(email);
  if (!pending) {
    throw new Error("Không tìm thấy yêu cầu đăng ký nào cho email này!");
  }

  const newOtp = generateOTP();
  const newOtpHash = await bcrypt.hash(newOtp, 10);
  const newExpiry = Date.now() + 300000;

  pendingOtps.set(email, {
    ...pending,
    otpHash: newOtpHash,
    expiryTime: newExpiry,
    attempts: 5,
  });

  const sent = await emailService.sendOTPToEmail(email, newOtp);
  if (!sent) {
    throw new Error("Gửi lại email OTP thất bại!");
  }
};

// REQUEST FORGOT PASSWORD
const requestForgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, code: "400", message: "Email chưa được đăng ký!" };
  }

  const existing = pendingOtps.get(email);

  // If there's still a valid OTP, don't send a new one
  if (existing && existing.expiryTime > Date.now() && existing.attempts > 0) {
    return {
      success: true,
      code: "200",
      message: "Vui lòng kiểm tra email, mã OTP vẫn còn hiệu lực!",
    };
  }

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);

  pendingOtps.set(email, {
    otpHash,
    expiryTime: Date.now() + 300000, // 5 minutes
    attempts: 5,
  });

  const sent = await emailService.sendOTPToEmail(email, otp);
  if (!sent) {
    pendingOtps.delete(email);
    return {
      success: false,
      code: "400",
      message: "Không thể gửi email OTP, vui lòng thử lại!",
    };
  }

  return { success: true, code: "201", message: "Đã gửi mã OTP tới email!" };
};

// SET NEW PASSWORD
const setNewPassword = async (request) => {
  const { email, otp, newPassword } = request;
  const pending = pendingOtps.get(email);

  if (!pending || pending.expiryTime <= Date.now()) {
    pendingOtps.delete(email);
    return {
      success: false,
      code: "400",
      message: "Yêu cầu đặt lại mật khẩu không tồn tại hoặc đã hết hạn!",
    };
  }

  if (pending.attempts <= 0) {
    pendingOtps.delete(email);
    return {
      success: false,
      code: "400",
      message: "Bạn đã nhập sai OTP quá 5 lần, vui lòng thử lại!",
    };
  }

  const match = await bcrypt.compare(otp, pending.otpHash);
  if (!match) {
    pending.attempts--;
    return {
      success: false,
      code: "400",
      message: "OTP không đúng!",
      data: { attempt: pending.attempts },
    };
  }

  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, code: "400", message: "Người dùng không tồn tại!" };
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  pendingOtps.delete(email);

  return { success: true, code: "200", message: "Đặt lại mật khẩu thành công!" };
};

export default {
  register,
  confirmOTP,
  login,
  refreshToken,
  logout,
  resendOtp,
  requestForgotPassword,
  setNewPassword,
};