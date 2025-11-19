"use strict";

import express from "express";
import reviewController from "../../controller/review.controller.js";

const router = express.Router();

// GET /api/reviews/product/:productId - Lấy reviews của sản phẩm
router.get("/product/:productId", reviewController.getReviewsByProduct);

// GET /api/reviews/user/:userId - Lấy reviews của user
router.get("/user/:userId", reviewController.getReviewsByUser);

// GET /api/reviews/stats/:productId - Lấy thống kê rating
router.get("/stats/:productId", reviewController.getProductRatingStats);

// POST /api/reviews - Tạo review mới (cần auth)
router.post("/", reviewController.createReview);

// PUT /api/reviews/:id - Cập nhật review (cần auth)
router.put("/:id", reviewController.updateReview);

// DELETE /api/reviews/:id - Xóa review (cần auth)
router.delete("/:id", reviewController.deleteReview);

export default router;
