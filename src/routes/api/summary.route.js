"use strict";

import { Router } from "express";
import summaryController from "../../controller/summary.controller.js";
import { authenticateUser, requireRole } from "../../middlewares/auth.middleware.js";

const router = Router();

// All summary endpoints require authenticated admin
router.get(
  "/revenue",
  authenticateUser,
  requireRole("ADMIN"),
  summaryController.getRevenue
);

router.get("/delivered-orders", authenticateUser, requireRole("ADMIN"), summaryController.getDeliveredOrders);
router.get("/cashflow", authenticateUser, requireRole("ADMIN"), summaryController.getCashflow);
router.get("/new-customers", authenticateUser, requireRole("ADMIN"), summaryController.getNewCustomers);
router.get("/top-products", authenticateUser, requireRole("ADMIN"), summaryController.getTopProducts);

export default router;
