"use strict";

import productViewService from "../services/productView.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class ProductViewController {
  // Log a product view
  logProductView = asyncHandler(async (req, res) => {
    const { id: productId } = req.params;
    const userId = req.user?.id || null;
    const sessionId = req.body.sessionId || req.cookies?.sessionId || null;

    const view = await productViewService.logProductView(productId, userId, sessionId);

    // Set session cookie if not logged in
    if (!userId && !req.cookies?.sessionId) {
      res.cookie("sessionId", view.sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: "lax",
      });
    }

    res.status(201).json({
      success: true,
      message: "Product view logged",
      data: view,
    });
  });

  // Get recently viewed products
  getRecentViews = asyncHandler(async (req, res) => {
    const userId = req.user?.id || null;
    const sessionId = req.body.sessionId || req.cookies?.sessionId || null;
    const { limit } = req.query;

    const result = await productViewService.getRecentViews(userId, sessionId, {
      limit: parseInt(limit) || 10,
    });

    res.status(200).json({
      success: true,
      message: "Recent views fetched successfully",
      data: result,
    });
  });
}

export default new ProductViewController();

