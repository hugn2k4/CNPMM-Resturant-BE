"use strict";

import favoriteService from "../services/favorite.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class FavoriteController {
  // Add product to favorites
  addFavorite = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    const favorite = await favoriteService.addFavorite(userId, productId);

    res.status(201).json({
      success: true,
      message: "Product added to favorites",
      data: favorite,
    });
  });

  // Remove product from favorites
  removeFavorite = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    const result = await favoriteService.removeFavorite(userId, productId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  // Get user's favorite products
  getUserFavorites = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = req.query;

    const result = await favoriteService.getUserFavorites(userId, { page, limit });

    res.status(200).json({
      success: true,
      message: "Favorites fetched successfully",
      data: result,
    });
  });

  // Check if product is favorited (optional helper endpoint)
  checkFavorite = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    const isFavorited = await favoriteService.isFavorited(userId, productId);

    res.status(200).json({
      success: true,
      data: { isFavorited },
    });
  });
}

export default new FavoriteController();

