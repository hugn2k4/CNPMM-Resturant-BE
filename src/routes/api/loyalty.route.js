import express from "express";
import loyaltyController from "../../controller/loyalty.controller.js";
import { authenticateUser, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// User routes
router.get("/account", loyaltyController.getLoyaltyAccount);
router.get("/transactions", loyaltyController.getTransactionHistory);
router.post("/validate-redemption", loyaltyController.validatePointsRedemption);
router.post("/calculate", loyaltyController.calculatePotentialPoints);
router.get("/leaderboard", loyaltyController.getLeaderboard);

// Admin routes
router.use(requireRole("admin"));
router.post("/adjust", loyaltyController.adjustPoints);
router.get("/user/:userId", loyaltyController.getUserLoyaltyAccount);

export default router;
