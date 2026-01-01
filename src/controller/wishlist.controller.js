"use strict";

import wishlistService from "../services/wishlist.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class WishlistController {
  // Add product to wishlist
  addItem = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    const result = await wishlistService.addItem(userId, productId);

    res.status(201).json({
      success: true,
      message: result.message,
    });
  });

  // Remove product from wishlist
  removeItem = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    const result = await wishlistService.removeItem(userId, productId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  // Get all product IDs in user's wishlist
  getWishlist = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const productIds = await wishlistService.getProductIds(userId);

    res.status(200).json({
      success: true,
      data: productIds,
    });
  });

  // Get wishlist with full product details (for MyFavoritesPage)
  getWishlistWithProducts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = req.query;

    const result = await wishlistService.getWishlistWithProducts(userId, { page, limit });

    res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: result,
    });
  });
}

export default new WishlistController();

