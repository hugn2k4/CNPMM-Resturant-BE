"use strict";

import express from "express";
import favoriteController from "../../controller/favorite.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All favorite routes require authentication
router.use(authenticateUser);

// POST /api/favorites/:productId - Add product to favorites
router.post("/:productId", favoriteController.addFavorite);

// DELETE /api/favorites/:productId - Remove product from favorites
router.delete("/:productId", favoriteController.removeFavorite);

// GET /api/favorites - Get user's favorite products
router.get("/", favoriteController.getUserFavorites);

// GET /api/favorites/:productId/check - Check if product is favorited (optional)
router.get("/:productId/check", favoriteController.checkFavorite);

export default router;

