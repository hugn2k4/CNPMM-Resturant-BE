"use strict";

import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Compound index to ensure unique user-product combination
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);

