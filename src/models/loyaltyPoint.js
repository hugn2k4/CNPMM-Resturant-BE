import mongoose from "mongoose";

const loyaltyPointSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    availablePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ["BRONZE", "SILVER", "GOLD", "PLATINUM"],
      default: "BRONZE",
    },
  },
  {
    timestamps: true,
  }
);

// Method to update tier based on lifetime points
loyaltyPointSchema.methods.updateTier = function () {
  if (this.lifetimePoints >= 10000) {
    this.tier = "PLATINUM";
  } else if (this.lifetimePoints >= 5000) {
    this.tier = "GOLD";
  } else if (this.lifetimePoints >= 2000) {
    this.tier = "SILVER";
  } else {
    this.tier = "BRONZE";
  }
};

// Method to add points
loyaltyPointSchema.methods.addPoints = async function (points, description, orderId) {
  this.totalPoints += points;
  this.availablePoints += points;
  this.lifetimePoints += points;
  this.updateTier();

  // Create transaction record
  const PointTransaction = mongoose.model("PointTransaction");
  await PointTransaction.create({
    user: this.user,
    type: "EARN",
    points: points,
    description: description,
    order: orderId,
    balanceAfter: this.availablePoints,
  });

  return this.save();
};

// Method to deduct points
loyaltyPointSchema.methods.deductPoints = async function (points, description, orderId) {
  if (this.availablePoints < points) {
    throw new Error("Không đủ điểm để thực hiện giao dịch");
  }

  this.availablePoints -= points;

  // Create transaction record
  const PointTransaction = mongoose.model("PointTransaction");
  await PointTransaction.create({
    user: this.user,
    type: "REDEEM",
    points: points,
    description: description,
    order: orderId,
    balanceAfter: this.availablePoints,
  });

  return this.save();
};

// Index for user lookup
loyaltyPointSchema.index({ user: 1 });

export default mongoose.models.LoyaltyPoint || mongoose.model("LoyaltyPoint", loyaltyPointSchema);
