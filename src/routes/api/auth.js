import express from "express";
import { body, validationResult } from "express-validator";

const router = express.Router();

// POST /api/v1/auth/login
// Simplified: accept only account 'abc' with password '1'
router.post("/login", [body("email").notEmpty(), body("password").notEmpty()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    if (email === "hcl2k4@gmail.com" && password === "Hung123@") {
      // return a simple success response (could include token)
      return res.json({ success: true, message: "Login successful" });
    }

    return res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (err) {
    next(err);
  }
});

export default router;
