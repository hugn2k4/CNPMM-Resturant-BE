"use strict";

import reviewService from "../services/review.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import contentFilterService from "../services/contentFilter.service.js";

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
    if(!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'You need to login to comment'
      });
    }
    const userId = req.user.id;
    
    //filter content
    const content = req.body.content;
    const filteredContent = contentFilterService.filterContent(content);

    if(!filteredContent.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is not valid',
        error: filteredContent.violations,
        filteredContent: filteredContent.filteredContent
      });
    }

    const reviewData = {
      ...req.body,
      content: filteredContent.filteredContent,
      userId
    };

    const result = await reviewService.createReview(reviewData);

    res.status(201).json({
      success: true,
      message: result.points 
        ? `Bình luận đã được tạo thành công! Bạn đã nhận được ${result.points.points} điểm (tương đương ${result.points.points * 10} VND).`
        : 'Review created successfully',
      data: result.review,
      points: result.points
    });
  });

  // PUT /api/reviews/:id
  updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!req.user.id || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'You need to login to update comment'
      });
    }
    const userId = req.user.id;

    if (req.body.content) {
      const filteredContent = contentFilterService.filterContent(req.body.content);
      if(!filteredContent.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is not valid',
          error: filteredContent.violations,
          filteredContent: filteredContent.filteredContent
        });
      }
      req.body.content = filteredContent.filteredContent;
    }
    
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
