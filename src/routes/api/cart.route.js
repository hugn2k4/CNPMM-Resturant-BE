"use strict";

import express from "express";
import cartController from "../../controller/cart.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateUser);

router.get("/", cartController.getCart);

router.post("/items", cartController.addItem);

router.put("/items/:productId", cartController.updateItemQuantity);

router.delete("/items/:productId", cartController.removeItem);

router.delete("/", cartController.clearCart);

router.get("/count", cartController.getCartItemCount);

export default router;

