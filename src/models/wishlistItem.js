"use strict";

import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
  {
    wishlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wishlist",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound unique index to ensure one product per wishlist
wishlistItemSchema.index({ wishlistId: 1, productId: 1 }, { unique: true });

// Index for efficient queries
wishlistItemSchema.index({ wishlistId: 1 });
wishlistItemSchema.index({ productId: 1 });

export default mongoose.models.WishlistItem || mongoose.model("WishlistItem", wishlistItemSchema);

