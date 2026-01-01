import LoyaltyPoint from "../models/loyaltyPoint.js";
import PointTransaction from "../models/pointTransaction.js";

class LoyaltyService {
  // Configuration
  static POINTS_PER_CURRENCY = 1; // 1 point per 1000 VND
  static CURRENCY_PER_POINT = 10; // 1 point = 10 VND (100 điểm = 1000 VND)
  static MIN_POINTS_TO_REDEEM = 100; // Minimum 100 points to redeem

  // Get or create loyalty account for user
  async getOrCreateLoyaltyAccount(userId) {
    let loyaltyAccount = await LoyaltyPoint.findOne({ user: userId });

    if (!loyaltyAccount) {
      loyaltyAccount = await LoyaltyPoint.create({
        user: userId,
        totalPoints: 0,
        availablePoints: 0,
        lifetimePoints: 0,
        tier: "BRONZE",
      });
    }

    return loyaltyAccount;
  }

  // Get loyalty account details
  async getLoyaltyAccount(userId) {
    const account = await this.getOrCreateLoyaltyAccount(userId);

    return {
      totalPoints: account.totalPoints,
      availablePoints: account.availablePoints,
      lifetimePoints: account.lifetimePoints,
      tier: account.tier,
      tierBenefits: this.getTierBenefits(account.tier),
      nextTier: this.getNextTierInfo(account.lifetimePoints),
      conversionRate: {
        pointsPerCurrency: LoyaltyService.POINTS_PER_CURRENCY,
        currencyPerPoint: LoyaltyService.CURRENCY_PER_POINT,
      },
    };
  }

  // Get tier benefits
  getTierBenefits(tier) {
    const benefits = {
      BRONZE: {
        pointsMultiplier: 1,
        birthdayBonus: 100,
        description: "Thành viên đồng",
      },
      SILVER: {
        pointsMultiplier: 1.2,
        birthdayBonus: 200,
        description: "Thành viên bạc - Tích điểm x1.2",
      },
      GOLD: {
        pointsMultiplier: 1.5,
        birthdayBonus: 500,
        description: "Thành viên vàng - Tích điểm x1.5",
      },
      PLATINUM: {
        pointsMultiplier: 2,
        birthdayBonus: 1000,
        description: "Thành viên bạch kim - Tích điểm x2",
      },
    };

    return benefits[tier];
  }

  // Get next tier information
  getNextTierInfo(currentLifetimePoints) {
    if (currentLifetimePoints >= 10000) {
      return null; // Already at max tier
    }

    const tiers = [
      { name: "SILVER", requiredPoints: 2000 },
      { name: "GOLD", requiredPoints: 5000 },
      { name: "PLATINUM", requiredPoints: 10000 },
    ];

    const nextTier = tiers.find((t) => t.requiredPoints > currentLifetimePoints);

    if (nextTier) {
      return {
        tier: nextTier.name,
        requiredPoints: nextTier.requiredPoints,
        pointsNeeded: nextTier.requiredPoints - currentLifetimePoints,
      };
    }

    return null;
  }

  // Earn points from order
  async earnPointsFromOrder(userId, orderAmount, orderId) {
    const account = await this.getOrCreateLoyaltyAccount(userId);

    // Calculate points based on order amount and tier multiplier
    const tierBenefits = this.getTierBenefits(account.tier);
    const basePoints = Math.floor(orderAmount / 1000) * LoyaltyService.POINTS_PER_CURRENCY;
    const earnedPoints = Math.floor(basePoints * tierBenefits.pointsMultiplier);

    if (earnedPoints > 0) {
      await account.addPoints(earnedPoints, `Tích điểm từ đơn hàng #${orderId}`, orderId);
    }

    return {
      earnedPoints,
      newBalance: account.availablePoints,
      tier: account.tier,
    };
  }

  // Redeem points for discount
  async redeemPoints(userId, pointsToRedeem) {
    if (pointsToRedeem < LoyaltyService.MIN_POINTS_TO_REDEEM) {
      throw new Error(`Tối thiểu ${LoyaltyService.MIN_POINTS_TO_REDEEM} điểm để đổi quà`);
    }

    const account = await this.getOrCreateLoyaltyAccount(userId);

    if (account.availablePoints < pointsToRedeem) {
      throw new Error("Không đủ điểm để thực hiện giao dịch");
    }

    // Tỷ lệ: 1 điểm = 10 VND (100 điểm = 1,000 VND)
    const CURRENCY_PER_POINT = 10;
    const discountAmount = pointsToRedeem * CURRENCY_PER_POINT;

    return {
      pointsToRedeem,
      discountAmount,
      remainingPoints: account.availablePoints - pointsToRedeem,
    };
  }

  // Apply points redemption to order
  async applyPointsToOrder(userId, pointsToRedeem, orderId) {
    const account = await this.getOrCreateLoyaltyAccount(userId);

    // Tỷ lệ: 1 điểm = 10 VND (100 điểm = 1,000 VND)
    // Đảm bảo dùng đúng tỷ lệ
    const CURRENCY_PER_POINT = 10;
    const discountAmount = pointsToRedeem * CURRENCY_PER_POINT;
    
    console.log(`[Loyalty] Redeeming ${pointsToRedeem} points = ${discountAmount} VND discount`);

    await account.deductPoints(pointsToRedeem, `Đổi điểm cho đơn hàng #${orderId}`, orderId);

    return {
      pointsRedeemed: pointsToRedeem,
      discountAmount,
      newBalance: account.availablePoints,
    };
  }

  // Get transaction history
  async getTransactionHistory(userId, filters = {}, page = 1, limit = 20) {
    const query = { user: userId };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      PointTransaction.find(query)
        .populate("order", "orderNumber totalAmount status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PointTransaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  // Admin: Adjust points manually
  async adjustPoints(userId, points, description, adminId) {
    const account = await this.getOrCreateLoyaltyAccount(userId);

    if (points > 0) {
      await account.addPoints(points, description, null);
    } else if (points < 0) {
      await account.deductPoints(Math.abs(points), description, null);
    }

    return {
      adjustedPoints: points,
      newBalance: account.availablePoints,
      description,
    };
  }

  // Get leaderboard
  async getLeaderboard(limit = 10) {
    const topUsers = await LoyaltyPoint.find().populate("user", "name email").sort({ lifetimePoints: -1 }).limit(limit);

    return topUsers.map((lp, index) => ({
      rank: index + 1,
      user: lp.user,
      lifetimePoints: lp.lifetimePoints,
      tier: lp.tier,
    }));
  }

  // Calculate potential points for order
  calculatePotentialPoints(userId, orderAmount, tier = "BRONZE") {
    const tierBenefits = this.getTierBenefits(tier);
    const basePoints = Math.floor(orderAmount / 1000) * LoyaltyService.POINTS_PER_CURRENCY;
    const earnedPoints = Math.floor(basePoints * tierBenefits.pointsMultiplier);

    return earnedPoints;
  }
}

const loyaltyServiceInstance = new LoyaltyService();
export default loyaltyServiceInstance;
export { LoyaltyService };
