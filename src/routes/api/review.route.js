"use strict";

import express from "express";
import reviewController from "../../controller/review.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/product/:productId", reviewController.getReviewsByProduct);

router.get("/user/:userId", reviewController.getReviewsByUser);

router.get("/stats/:productId", reviewController.getProductRatingStats);

router.post("/", authenticateUser, reviewController.createReview);

router.put("/:id", authenticateUser, reviewController.updateReview);

router.delete("/:id", authenticateUser, reviewController.deleteReview);

export default router;
