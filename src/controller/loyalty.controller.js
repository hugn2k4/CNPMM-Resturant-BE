import asyncHandler from "../middlewares/asyncHandler.js";
import loyaltyService from "../services/loyalty.service.js";

class LoyaltyController {
  // Get loyalty account details
  getLoyaltyAccount = asyncHandler(async (req, res) => {
    const account = await loyaltyService.getLoyaltyAccount(req.user.id);

    res.status(200).json({
      success: true,
      data: account,
    });
  });

  // Get transaction history
  getTransactionHistory = asyncHandler(async (req, res) => {
    const { type, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await loyaltyService.getTransactionHistory(req.user.id, filters, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  });

  // Validate points redemption
  validatePointsRedemption = asyncHandler(async (req, res) => {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số điểm không hợp lệ",
      });
    }

    const result = await loyaltyService.redeemPoints(req.user.id, points);

    res.status(200).json({
      success: true,
      message: "Có thể đổi điểm",
      data: result,
    });
  });

  // Calculate potential points for order amount
  calculatePotentialPoints = asyncHandler(async (req, res) => {
    const { orderAmount } = req.body;

    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền đơn hàng không hợp lệ",
      });
    }

    // Get user's tier
    const account = await loyaltyService.getLoyaltyAccount(req.user.id);
    const potentialPoints = loyaltyService.calculatePotentialPoints(req.user.id, orderAmount, account.tier);

    res.status(200).json({
      success: true,
      data: {
        orderAmount,
        potentialPoints,
        tier: account.tier,
      },
    });
  });

  // Get leaderboard
  getLeaderboard = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const leaderboard = await loyaltyService.getLeaderboard(parseInt(limit));

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  });

  // Admin: Adjust user points
  adjustPoints = asyncHandler(async (req, res) => {
    const { userId, points, description } = req.body;

    if (!userId || !points || !description) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    const result = await loyaltyService.adjustPoints(userId, points, description, req.user.id);

    res.status(200).json({
      success: true,
      message: "Điều chỉnh điểm thành công",
      data: result,
    });
  });

  // Admin: Get user loyalty account
  getUserLoyaltyAccount = asyncHandler(async (req, res) => {
    const account = await loyaltyService.getLoyaltyAccount(req.params.userId);

    res.status(200).json({
      success: true,
      data: account,
    });
  });
}

export default new LoyaltyController();
