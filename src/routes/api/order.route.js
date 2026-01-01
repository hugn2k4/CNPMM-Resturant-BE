"use strict";

import express from "express";
import orderController from "../../controller/order.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateUser);

// User routes
router.post("/", orderController.createOrder);
router.get("/my-orders", orderController.getMyOrders);
router.patch("/:orderId/cancel", orderController.cancelOrder);
router.patch("/:orderId/confirm-received", orderController.confirmReceived);

// Admin routes
router.get("/", orderController.getAllOrders);
router.patch("/admin/:orderId/status", orderController.updateOrderStatus);

// Order detail - must be last to avoid conflict
router.get("/:orderId", orderController.getOrderDetail);

export default router;
