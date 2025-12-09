"use strict";

import ProductView from "../models/productView.js";
import Product from "../models/product.js";

class ProductViewService {
  // Log a product view
  async logProductView(productId, userId = null, sessionId = null) {
    try {
      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // If no sessionId provided and user is not logged in, generate one
      if (!userId && !sessionId) {
        // Generate a simple session ID using timestamp and random number
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      }

      // Create view record
      const view = new ProductView({
        productId,
        userId: userId || null,
        sessionId: sessionId || null,
        viewedAt: new Date(),
      });

      await view.save();

      // Increment product viewCount
      await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });

      return view;
    } catch (error) {
      throw new Error(`Error logging product view: ${error.message}`);
    }
  }

  // Get recently viewed products for a user or session
  async getRecentViews(userId = null, sessionId = null, { limit = 10 } = {}) {
    try {
      const query = {};

      if (userId) {
        query.userId = userId;
      } else if (sessionId) {
        query.sessionId = sessionId;
      } else {
        return { views: [], products: [] };
      }

      // Get recent views, grouped by product (most recent view per product)
      const views = await ProductView.find(query)
        .sort({ viewedAt: -1 })
        .limit(limit * 2) // Get more to account for duplicates
        .lean();

      // Get unique products (most recent view for each product)
      const productMap = new Map();
      views.forEach((view) => {
        const productId = view.productId.toString();
        if (!productMap.has(productId) || view.viewedAt > productMap.get(productId).viewedAt) {
          productMap.set(productId, view);
        }
      });

      // Get unique product IDs
      const productIds = Array.from(productMap.values())
        .slice(0, limit)
        .map((view) => view.productId);

      // Fetch products with details
      const products = await Product.find({
        _id: { $in: productIds },
        isDeleted: false,
      })
        .populate("categoryId", "name slug image")
        .populate("listProductImage", "url alt")
        .lean();

      // Sort products by view order
      const sortedProducts = productIds
        .map((id) => products.find((p) => p._id.toString() === id.toString()))
        .filter((p) => p !== undefined);

      return {
        views: Array.from(productMap.values()).slice(0, limit),
        products: sortedProducts,
      };
    } catch (error) {
      throw new Error(`Error fetching recent views: ${error.message}`);
    }
  }
}

export default new ProductViewService();

