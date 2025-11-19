// src/routes/api/user.route.js
import { Router } from "express";
import { body, validationResult } from "express-validator";
import * as userController from "../../controller/user.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

// All user routes require authentication
router.use(authenticateUser);

// GET /api/users/profile - Get current user profile
router.get("/profile", userController.getProfile);

// PUT /api/users/profile - Update current user profile
router.put(
  "/profile",
  [
    body("fullName").optional().trim().notEmpty().withMessage("Full name cannot be empty"),
    body("phoneNumber").optional().trim(),
    body("dateOfBirth")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true; // Allow empty string
        // Accept both ISO8601 format and simple date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(value)) return true;
        // Try to parse as ISO8601
        const date = new Date(value);
        if (!isNaN(date.getTime())) return true;
        throw new Error("Invalid date format");
      })
      .withMessage("Invalid date format"),
    body("gender")
      .optional()
      .isIn(["MALE", "FEMALE", "OTHER", "male", "female", "other"])
      .withMessage("Invalid gender"),
    body("image").optional().trim(),
  ],
  (req, res, next) => {
    console.log("📝 PUT /users/profile - Request body:", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  userController.updateProfile
);

export default router;
