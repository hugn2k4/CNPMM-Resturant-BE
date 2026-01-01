"use strict";

import Wishlist from "../models/wishlist.js";
import WishlistItem from "../models/wishlistItem.js";
import Product from "../models/product.js";

class WishlistService {
  // Get or create wishlist for user
  async getOrCreateWishlist(userId) {
    try {
      let wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        wishlist = new Wishlist({ userId });
        await wishlist.save();
      }

      return wishlist;
    } catch (error) {
      throw new Error(`Error getting or creating wishlist: ${error.message}`);
    }
  }

  // Add product to wishlist
  async addItem(userId, productId) {
    try {
      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Get or create wishlist
      const wishlist = await this.getOrCreateWishlist(userId);

      // Check if item already exists
      const existingItem = await WishlistItem.findOne({
        wishlistId: wishlist._id,
        productId,
      });

      if (existingItem) {
        return { message: "Product already in wishlist" };
      }

      // Create new wishlist item
      const wishlistItem = new WishlistItem({
        wishlistId: wishlist._id,
        productId,
      });

      await wishlistItem.save();

      return { message: "Product added to wishlist successfully" };
    } catch (error) {
      // Handle duplicate key error (unique constraint violation)
      if (error.code === 11000) {
        return { message: "Product already in wishlist" };
      }
      throw new Error(`Error adding item to wishlist: ${error.message}`);
    }
  }

  // Remove product from wishlist
  async removeItem(userId, productId) {
    try {
      // Find user's wishlist
      const wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        throw new Error("Wishlist not found");
      }

      // Find and delete the item
      const wishlistItem = await WishlistItem.findOneAndDelete({
        wishlistId: wishlist._id,
        productId,
      });

      if (!wishlistItem) {
        throw new Error("Product not found in wishlist");
      }

      return { message: "Product removed from wishlist successfully" };
    } catch (error) {
      throw new Error(`Error removing item from wishlist: ${error.message}`);
    }
  }

  // Get all product IDs in user's wishlist
  async getProductIds(userId) {
    try {
      // Find user's wishlist
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        return [];
      }

      // Get all product IDs from wishlist items
      const items = await WishlistItem.find({ wishlistId: wishlist._id })
        .select("productId")
        .lean();

      // Extract product IDs as strings
      const productIds = items.map((item) => item.productId.toString());

      return productIds;
    } catch (error) {
      throw new Error(`Error fetching wishlist product IDs: ${error.message}`);
    }
  }

  // Get full wishlist with product details (for MyFavoritesPage)
  async getWishlistWithProducts(userId, { page = 1, limit = 20 } = {}) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        return {
          products: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0,
          },
        };
      }

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        WishlistItem.find({ wishlistId: wishlist._id })
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
        WishlistItem.countDocuments({ wishlistId: wishlist._id }),
      ]);

      // Filter out deleted products and extract products
      const products = items
        .map((item) => item.productId)
        .filter((product) => product && !product.isDeleted);

      return {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching wishlist products: ${error.message}`);
    }
  }
}

export default new WishlistService();

