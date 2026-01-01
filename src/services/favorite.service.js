"use strict";

import Favorite from "../models/favorite.js";
import Product from "../models/product.js";

class FavoriteService {
  // Add product to favorites
  async addFavorite(userId, productId) {
    try {
      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check if already favorited
      const existing = await Favorite.findOne({ userId, productId });
      if (existing) {
        return existing;
      }

      // Create new favorite
      const favorite = new Favorite({ userId, productId });
      await favorite.save();

      // Populate product details
      await favorite.populate({
        path: "productId",
        populate: {
          path: "categoryId",
          select: "name slug",
        },
      });
      await favorite.populate({
        path: "productId",
        populate: {
          path: "listProductImage",
          select: "url alt",
        },
      });

      return favorite;
    } catch (error) {
      throw new Error(`Error adding favorite: ${error.message}`);
    }
  }

  // Remove product from favorites
  async removeFavorite(userId, productId) {
    try {
      const favorite = await Favorite.findOneAndDelete({ userId, productId });
      if (!favorite) {
        throw new Error("Favorite not found");
      }
      return { message: "Favorite removed successfully" };
    } catch (error) {
      throw new Error(`Error removing favorite: ${error.message}`);
    }
  }

  // Get user's favorite products
  async getUserFavorites(userId, { page = 1, limit = 20 } = {}) {
    try {
      const skip = (page - 1) * limit;

      const [favorites, total] = await Promise.all([
        Favorite.find({ userId })
          .populate({
            path: "productId",
            populate: [
              {
                path: "categoryId",
                select: "name slug image",
              },
              {
                path: "listProductImage",
                select: "url alt",
              },
            ],
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Favorite.countDocuments({ userId }),
      ]);

      // Filter out deleted products
      const validFavorites = favorites.filter((fav) => fav.productId && !fav.productId.isDeleted);

      return {
        favorites: validFavorites,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching favorites: ${error.message}`);
    }
  }

  // Check if product is favorited by user
  async isFavorited(userId, productId) {
    try {
      const favorite = await Favorite.findOne({ userId, productId });
      return !!favorite;
    } catch (error) {
      return false;
    }
  }

  // Get favorite status for multiple products
  async getFavoriteStatus(userId, productIds) {
    try {
      const favorites = await Favorite.find({
        userId,
        productId: { $in: productIds },
      }).lean();

      const favoriteMap = {};
      favorites.forEach((fav) => {
        favoriteMap[fav.productId.toString()] = true;
      });

      return favoriteMap;
    } catch (error) {
      return {};
    }
  }
}

export default new FavoriteService();

