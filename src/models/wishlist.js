"use strict";

import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
wishlistSchema.index({ userId: 1 });

export default mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);

