"use strict";

import mongoose from "mongoose";

const productViewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      // Allow null for guest users (will use sessionId instead)
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
      // For guest users who are not logged in
      default: null,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
productViewSchema.index({ userId: 1, viewedAt: -1 });
productViewSchema.index({ sessionId: 1, viewedAt: -1 });
productViewSchema.index({ productId: 1, viewedAt: -1 });

// Index to prevent duplicate views within short time (optional optimization)
productViewSchema.index({ userId: 1, productId: 1, viewedAt: -1 });
productViewSchema.index({ sessionId: 1, productId: 1, viewedAt: -1 });

export default mongoose.models.ProductView || mongoose.model("ProductView", productViewSchema);

