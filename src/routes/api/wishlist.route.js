"use strict";

import express from "express";
import wishlistController from "../../controller/wishlist.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticateUser);

// GET /api/wishlist/products - Get wishlist with full product details (for MyFavoritesPage)
// Must come before /:productId routes to avoid conflicts
router.get("/products", wishlistController.getWishlistWithProducts);

// GET /api/wishlist - Get all product IDs in user's wishlist
router.get("/", wishlistController.getWishlist);

// POST /api/wishlist/:productId - Add product to wishlist
router.post("/:productId", wishlistController.addItem);

// DELETE /api/wishlist/:productId - Remove product from wishlist
router.delete("/:productId", wishlistController.removeItem);

export default router;

