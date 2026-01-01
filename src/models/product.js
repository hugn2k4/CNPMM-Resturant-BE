"use strict";

import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  listProductImage: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Image'
  }],
  listReview: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Review' 
  }],
  status: { 
    type: String, 
    enum: ['available', 'unavailable', 'out_of_stock'], 
    default: 'available' 
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    required: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  preparationTime: {
    type: String
  },
  calories: {
    type: Number,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Thêm các trường mới
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Phần trăm giảm giá
  },
  discountPrice: {
    type: Number,
    min: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Virtual để check còn hàng
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && this.stock > 0;
});

// Virtual để lấy category info
productSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Virtual để tính giá sau giảm
productSchema.virtual('finalPrice').get(function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Index để tìm kiếm nhanh
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ viewCount: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ discount: -1 });

// Middleware để tự động tính discountPrice
productSchema.pre('save', function(next) {
  if (this.discount > 0) {
    this.discountPrice = this.price * (1 - this.discount / 100);
  } else {
    this.discountPrice = this.price;
  }
  next();
});

// Đảm bảo virtual fields được serialize
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.models.Product || mongoose.model("Product", productSchema);