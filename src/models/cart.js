"use strict";

import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Lưu giá tại thời điểm thêm vào giỏ để tránh thay đổi giá sau này
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// Middleware để tự động tính totalAmount và totalItems trước khi save
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  this.totalItems = this.items.reduce((sum, item) => {
    return sum + item.quantity;
  }, 0);
  
  next();
});

// Index để tìm kiếm nhanh
cartSchema.index({ userId: 1 });
cartSchema.index({ 'items.productId': 1 });

export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);

