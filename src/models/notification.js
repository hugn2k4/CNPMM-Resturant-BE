"use strict";

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "ORDER_NEW",
        "ORDER_CONFIRMED",
        "ORDER_PREPARING",
        "ORDER_SHIPPING",
        "ORDER_DELIVERED",
        "ORDER_CANCELLED",
        "REVIEW_NEW",
        "REVIEW_REPLY",
        "VOUCHER_NEW",
        "EVENT_NEW",
        "CHAT_MESSAGE",
        "SYSTEM",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Lưu thông tin bổ sung (orderId, reviewId, etc.)
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);