"use strict";

import Review from "../models/review.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import loyaltyService from "./loyalty.service.js";

class ReviewService {
  // Lấy reviews của sản phẩm
  async getReviewsByProduct(productId, { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) {
    try {
      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [reviews, total] = await Promise.all([
        Review.find({ productId })
          .populate('userId', 'firstName lastName image')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments({ productId })
      ]);

      return {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching reviews: ${error.message}`);
    }
  }

  // Lấy reviews của user
  async getReviewsByUser(userId, { page = 1, limit = 10 }) {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ userId })
          .populate('productId', 'name images price')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments({ userId })
      ]);

      return {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching user reviews: ${error.message}`);
    }
  }

  // Kiểm tra user đã mua sản phẩm thành công chưa
  async hasUserPurchasedProduct(userId, productId) {
    try {
      // Tìm order có sản phẩm này và đã được giao thành công
      // orderStatus: 'delivered' - đã giao hàng thành công
      const order = await Order.findOne({
        userId: userId,
        orderStatus: 'delivered',
        'items.productId': productId
      }).lean();

      return !!order;
    } catch (error) {
      console.error('Error checking purchase:', error);
      return false;
    }
  }

  // Tặng điểm khi đánh giá thành công
  async grantReviewPoints(userId, productId) {
    try {
      const REVIEW_POINTS = 100; // Tặng 100 điểm khi đánh giá
      
      // Lấy hoặc tạo loyalty account
      const account = await loyaltyService.getOrCreateLoyaltyAccount(userId);
      
      // Tặng điểm với mô tả
      const product = await Product.findById(productId).select('name');
      const productName = product?.name || 'sản phẩm';
      
      await account.addPoints(
        REVIEW_POINTS,
        `Tặng điểm đánh giá sản phẩm: ${productName}`,
        null
      );

      return {
        points: REVIEW_POINTS,
        newBalance: account.availablePoints,
        message: `Bạn đã nhận được ${REVIEW_POINTS} điểm (tương đương ${REVIEW_POINTS * 10} VND)`
      };
    } catch (error) {
      console.error('Error granting review points:', error);
      throw new Error(`Không thể tặng điểm: ${error.message}`);
    }
  }

  // Tạo review mới
  async createReview(reviewData) {
    try {
      // Verify product exists
      const product = await Product.findOne({ _id: reviewData.productId, isDeleted: false });
      if (!product) {
        throw new Error('Product not found');
      }

      // Kiểm tra user đã mua sản phẩm chưa
      const hasPurchased = await this.hasUserPurchasedProduct(
        reviewData.userId,
        reviewData.productId
      );

      if (!hasPurchased) {
        throw new Error('Bạn chỉ có thể đánh giá sản phẩm đã mua thành công');
      }

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        userId: reviewData.userId,
        productId: reviewData.productId
      });

      if (existingReview) {
        throw new Error('You have already reviewed this product');
      }

      // Tạo review với isVerifiedPurchase = true
      const review = new Review({
        ...reviewData,
        isVerifiedPurchase: true
      });
      await review.save();

      // Add review to product's listReview
      await Product.findByIdAndUpdate(reviewData.productId, {
        $push: { listReview: review._id }
      });

      // Tự động tặng điểm khi đánh giá thành công
      let pointsResult = null;
      try {
        pointsResult = await this.grantReviewPoints(reviewData.userId, reviewData.productId);
      } catch (pointsError) {
        console.error('Failed to grant points, but review was created:', pointsError);
        // Không throw error, vì review đã được tạo thành công
        // Có thể log để admin biết
      }

      const reviewResult = await Review.findById(review._id)
        .populate('userId', 'firstName lastName image')
        .lean();

      return {
        review: reviewResult,
        points: pointsResult ? {
          points: pointsResult.points,
          newBalance: pointsResult.newBalance,
          message: pointsResult.message
        } : null
      };
    } catch (error) {
      throw new Error(`Error creating review: ${error.message}`);
    }
  }

  // Cập nhật review
  async updateReview(reviewId, userId, updateData) {
    try {
      const review = await Review.findOne({ _id: reviewId, userId });

      if (!review) {
        throw new Error('Review not found or you are not authorized');
      }

      Object.assign(review, updateData);
      await review.save();

      return await Review.findById(review._id)
        .populate('userId', 'firstName lastName image')
        .lean();
    } catch (error) {
      throw new Error(`Error updating review: ${error.message}`);
    }
  }

  // Xóa review
  async deleteReview(reviewId, userId) {
    try {
      const review = await Review.findOne({ _id: reviewId, userId });

      if (!review) {
        throw new Error('Review not found or you are not authorized');
      }

      // Remove review from product's listReview
      await Product.findByIdAndUpdate(review.productId, {
        $pull: { listReview: review._id }
      });

      await Review.findByIdAndDelete(reviewId);

      return { message: 'Review deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting review: ${error.message}`);
    }
  }

  // Lấy thống kê rating của sản phẩm
  async getProductRatingStats(productId) {
    try {
      const reviews = await Review.find({ productId }).lean();
      
      const stats = {
        totalReviews: reviews.length,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      };

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rate, 0);
        stats.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

        reviews.forEach(review => {
          stats.ratingDistribution[review.rate]++;
        });
      }

      return stats;
    } catch (error) {
      throw new Error(`Error fetching rating stats: ${error.message}`);
    }
  }
}

export default new ReviewService();
