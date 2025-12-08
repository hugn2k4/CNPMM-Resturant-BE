import mongoose from "mongoose";

const pointTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["EARN", "REDEEM", "EXPIRED", "ADMIN_ADJUSTMENT"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
pointTransactionSchema.index({ user: 1, createdAt: -1 });
pointTransactionSchema.index({ type: 1 });
pointTransactionSchema.index({ order: 1 });

export default mongoose.models.PointTransaction || mongoose.model("PointTransaction", pointTransactionSchema);
