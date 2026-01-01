import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Voucher code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [4, "Code must be at least 4 characters"],
      maxlength: [20, "Code must be less than 20 characters"],
    },
    name: {
      type: String,
      required: [true, "Voucher name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED_AMOUNT"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value must be positive"],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Max discount amount must be positive"],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Min order amount must be positive"],
    },
    maxUsage: {
      type: Number,
      default: null,
      min: [1, "Max usage must be at least 1"],
    },
    maxUsagePerUser: {
      type: Number,
      default: 1,
      min: [1, "Max usage per user must be at least 1"],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to check if voucher is valid
voucherSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.startDate <= now &&
    this.endDate >= now &&
    (this.maxUsage === null || this.usageCount < this.maxUsage)
  );
});

// Method to check if voucher is valid for a specific order
voucherSchema.methods.isValidForOrder = function (orderAmount, userId, userUsageCount) {
  if (!this.isValid) return { valid: false, message: "Voucher không còn hiệu lực" };

  if (orderAmount < this.minOrderAmount) {
    return {
      valid: false,
      message: `Đơn hàng tối thiểu ${this.minOrderAmount.toLocaleString("vi-VN")}đ`,
    };
  }

  if (userUsageCount >= this.maxUsagePerUser) {
    return {
      valid: false,
      message: "Bạn đã sử dụng hết lượt áp dụng voucher này",
    };
  }

  return { valid: true };
};

// Method to calculate discount amount
voucherSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;

  if (this.discountType === "PERCENTAGE") {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === "FIXED_AMOUNT") {
    discount = this.discountValue;
  }

  // Discount cannot exceed order amount
  return Math.min(discount, orderAmount);
};

// Indexes for better query performance
voucherSchema.index({ code: 1 });
voucherSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
voucherSchema.index({ applicableProducts: 1 });
voucherSchema.index({ applicableCategories: 1 });

export default mongoose.models.Voucher || mongoose.model("Voucher", voucherSchema);
