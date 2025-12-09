"use strict";

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true 
  },
  rate: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true
  },
  images: [{
    type: String
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isFiltered: {
    type: Boolean,
    default: false
  },
  originalContent: {
    type: String,
    select: false // Không trả về khi query thông thường
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'approved'
  }
}, { timestamps: true });

// Index để query nhanh
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rate: -1 });

// Middleware cập nhật rating của product sau khi review
reviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const reviews = await mongoose.model('Review').find({ productId: this.productId });
  
  const totalReviews = reviews.length;
  const avgRating = reviews.reduce((sum, review) => sum + review.rate, 0) / totalReviews;
  
  await Product.findByIdAndUpdate(this.productId, {
    rating: Math.round(avgRating * 10) / 10, // Làm tròn 1 chữ số
    reviewCount: totalReviews
  });
});

// Middleware cập nhật rating khi xóa review
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Product = mongoose.model('Product');
    const reviews = await mongoose.model('Review').find({ productId: doc.productId });
    
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rate, 0) / totalReviews 
      : 0;
    
    await Product.findByIdAndUpdate(doc.productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: totalReviews
    });
  }
});

export default mongoose.models.Review || mongoose.model("Review", reviewSchema);
