import { Router } from "express";
import { body, validationResult } from "express-validator";
import * as authController from "../../controller/auth.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

// Health check
router.get("/ping", (_req, res) => res.send("auth ok"));

// ========== LOCAL AUTHENTICATION ROUTES ==========

// Register with validation
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    body("password").isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
    body("fullName").notEmpty().withMessage("Họ tên không được để trống"),
    body("phoneNumber").optional(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  authController.register
);

// Confirm OTP
router.post(
  "/confirm",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    body("otp").notEmpty().withMessage("OTP không được để trống"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  authController.confirm
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  authController.login
);

// Refresh token
router.post("/refresh", authController.refresh);

// Logout
router.post("/logout", authController.logout);

// Resend OTP
router.post(
  "/resend-otp",
  [body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ")],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  authController.resendOtp
);

// Request forgot password
router.post("/request-forgot-password", authController.requestForgotPassword);

// Set new password
router.post(
  "/set-new-password",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    body("otp").notEmpty().withMessage("OTP không được để trống"),
    body("newPassword").isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  authController.setNewPassword
);

// ========== GOOGLE AUTHENTICATION ROUTES ==========

router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);
router.post("/google", authController.googleIdTokenLogin); // Endpoint cho frontend GIS

// ========== PROTECTED ROUTES ==========

router.get("/me", authenticateUser, authController.me);

export default router;
