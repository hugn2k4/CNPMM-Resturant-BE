import mongoose from "mongoose";

const userVoucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
    savedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate user-voucher pairs
userVoucherSchema.index({ user: 1, voucher: 1 }, { unique: true });

// Method to increment usage count
userVoucherSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

export default mongoose.models.UserVoucher || mongoose.model("UserVoucher", userVoucherSchema);
