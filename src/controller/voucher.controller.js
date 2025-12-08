import asyncHandler from "../middlewares/asyncHandler.js";
import voucherService from "../services/voucher.service.js";

class VoucherController {
  // Admin: Create new voucher
  createVoucher = asyncHandler(async (req, res) => {
    const voucher = await voucherService.createVoucher(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: "Tạo voucher thành công",
      data: voucher,
    });
  });

  // Admin: Update voucher
  updateVoucher = asyncHandler(async (req, res) => {
    const voucher = await voucherService.updateVoucher(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Cập nhật voucher thành công",
      data: voucher,
    });
  });

  // Admin: Delete voucher
  deleteVoucher = asyncHandler(async (req, res) => {
    await voucherService.deleteVoucher(req.params.id);

    res.status(200).json({
      success: true,
      message: "Xóa voucher thành công",
    });
  });

  // Admin: Get all vouchers
  getAllVouchers = asyncHandler(async (req, res) => {
    const { isActive, discountType, code, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (discountType) filters.discountType = discountType;
    if (code) filters.code = code;

    const result = await voucherService.getAllVouchers(filters, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      data: result.vouchers,
      pagination: result.pagination,
    });
  });

  // User: Get available public vouchers
  getAvailableVouchers = asyncHandler(async (req, res) => {
    console.log("🎫 Getting available vouchers for user:", req.user.id);
    const { page = 1, limit = 20 } = req.query;

    const result = await voucherService.getAvailableVouchers(req.user.id, parseInt(page), parseInt(limit));

    console.log(`✅ Found ${result.vouchers.length} vouchers`);
    res.status(200).json({
      success: true,
      data: result.vouchers,
      pagination: result.pagination,
    });
  });

  // User: Get saved vouchers
  getSavedVouchers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const result = await voucherService.getSavedVouchers(req.user.id, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      data: result.vouchers,
      pagination: result.pagination,
    });
  });

  // User: Save/Unsave voucher
  toggleSaveVoucher = asyncHandler(async (req, res) => {
    const result = await voucherService.toggleSaveVoucher(req.user.id, req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { isSaved: result.isSaved },
    });
  });

  // User: Validate voucher for order
  validateVoucher = asyncHandler(async (req, res) => {
    const { code, orderData } = req.body;

    if (!code || !orderData) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin code hoặc orderData",
      });
    }

    const result = await voucherService.validateVoucher(code, req.user.id, orderData);

    res.status(200).json({
      success: true,
      message: "Voucher hợp lệ",
      data: result,
    });
  });

  // Get voucher by code (public or authenticated)
  getVoucherByCode = asyncHandler(async (req, res) => {
    const voucher = await voucherService.getVoucherByCode(req.params.code);

    res.status(200).json({
      success: true,
      data: voucher,
    });
  });

  // Get voucher by ID
  getVoucherById = asyncHandler(async (req, res) => {
    const voucher = await voucherService.getVoucherById(req.params.id);

    res.status(200).json({
      success: true,
      data: voucher,
    });
  });
}

export default new VoucherController();
