"use strict";

import reviewService from "../services/review.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class ReviewController {
  // GET /api/reviews/product/:productId
  getReviewsByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query;

    const result = await reviewService.getReviewsByProduct(productId, {
      page,
      limit,
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      data: result
    });
  });

  // GET /api/reviews/user/:userId
  getReviewsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const result = await reviewService.getReviewsByUser(userId, { page, limit });

    res.status(200).json({
      success: true,
      message: 'User reviews fetched successfully',
      data: result
    });
  });

  // GET /api/reviews/stats/:productId
  getProductRatingStats = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const stats = await reviewService.getProductRatingStats(productId);

    res.status(200).json({
      success: true,
      message: 'Rating stats fetched successfully',
      data: stats
    });
  });

  // POST /api/reviews
  createReview = asyncHandler(async (req, res) => {
    // Assuming userId comes from auth middleware
    const userId = req.user?._id || req.body.userId;
    
    const reviewData = {
      ...req.body,
      userId
    };

    const review = await reviewService.createReview(reviewData);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  });

  // PUT /api/reviews/:id
  updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId;

    const review = await reviewService.updateReview(id, userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  });

  // DELETE /api/reviews/:id
  deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId;

    const result = await reviewService.deleteReview(id, userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });
}

export default new ReviewController();
