"use strict";

import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  name: String,
  image: String,
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  ward: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  note: {
    type: String,
    trim: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD"],
      default: "COD",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index compound cho query hiệu quả
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

// Pre-save hook để tính finalAmount và tạo orderNumber
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    // Tạo order number nếu chưa có
    if (!this.orderNumber) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      this.orderNumber = `ORD${timestamp}${random}`;
    }

    // Tính finalAmount
    this.finalAmount = this.totalAmount + (this.shippingFee || 0);
  }
  next();
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
