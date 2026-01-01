import Product from "../models/product.js";
import UserVoucher from "../models/userVoucher.js";
import Voucher from "../models/voucher.js";
import User from "../models/user.js";
import notificationService from "./notification.service.js";
import { sendNotificationToRoom, sendNotificationToUsers } from "../socket/socketServer.js";

class VoucherService {
  // Admin: Create voucher
  async createVoucher(voucherData, adminId) {
    // Validate dates
    if (new Date(voucherData.startDate) >= new Date(voucherData.endDate)) {
      throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
    }

    // Validate discount value
    if (voucherData.discountType === "PERCENTAGE" && voucherData.discountValue > 100) {
      throw new Error("Phần trăm giảm giá không được vượt quá 100%");
    }

    const voucher = await Voucher.create({
      ...voucherData,
      createdBy: adminId,
    });

    // Gửi notification cho users nếu voucher là public
    if (voucher.isPublic && voucher.isActive) {
      try {
        // Lấy danh sách users đã lưu voucher (nếu có)
        const savedUserVouchers = await UserVoucher.find({ isSaved: true }).select("user").lean();
        const savedUserIds = savedUserVouchers.map((uv) => uv.user.toString());

        // Nếu có users đã lưu voucher, gửi notification cho họ
        if (savedUserIds.length > 0) {
          const discountText =
            voucher.discountType === "PERCENTAGE"
              ? `${voucher.discountValue}%`
              : `${voucher.discountValue.toLocaleString("vi-VN")} VND`;

          const notifications = await notificationService.createNotificationForUsers(
            savedUserIds,
            "VOUCHER_NEW",
            "Voucher mới đã có sẵn",
            `Voucher "${voucher.name}" với mã ${voucher.code} đã có sẵn. Giảm ${discountText}!`,
            { voucherId: voucher._id, voucherCode: voucher.code }
          );

          // Gửi qua WebSocket
          const notificationData = {
            type: "VOUCHER_NEW",
            title: "Voucher mới đã có sẵn",
            message: `Voucher "${voucher.name}" với mã ${voucher.code} đã có sẵn. Giảm ${discountText}!`,
            data: { voucherId: voucher._id, voucherCode: voucher.code },
          };
          sendNotificationToUsers(savedUserIds, notificationData);
        }

        // Gửi notification cho admin room
        sendNotificationToRoom("admin", {
          type: "VOUCHER_NEW",
          title: "Voucher mới đã được tạo",
          message: `Voucher "${voucher.name}" (${voucher.code}) đã được tạo thành công`,
          data: { voucherId: voucher._id },
        });
      } catch (notifError) {
        console.error("Error sending voucher notification:", notifError);
        // Không throw error, vì voucher đã được tạo thành công
      }
    }

    return voucher;
  }

  // Admin: Update voucher
  async updateVoucher(voucherId, updateData) {
    // Validate dates if being updated
    if (updateData.startDate && updateData.endDate) {
      if (new Date(updateData.startDate) >= new Date(updateData.endDate)) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }
    }

    const voucher = await Voucher.findByIdAndUpdate(voucherId, updateData, { new: true, runValidators: true });

    if (!voucher) {
      throw new Error("Không tìm thấy voucher");
    }

    return voucher;
  }

  // Admin: Delete voucher
  async deleteVoucher(voucherId) {
    const voucher = await Voucher.findByIdAndDelete(voucherId);
    if (!voucher) {
      throw new Error("Không tìm thấy voucher");
    }

    // Delete all user voucher records
    await UserVoucher.deleteMany({ voucher: voucherId });

    return voucher;
  }

  // Admin: Get all vouchers with filters
  async getAllVouchers(filters = {}, page = 1, limit = 20) {
    const query = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.discountType) {
      query.discountType = filters.discountType;
    }

    if (filters.code) {
      query.code = { $regex: filters.code, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [vouchers, total] = await Promise.all([
      Voucher.find(query)
        .populate("createdBy", "name email")
        .populate("applicableProducts", "name price")
        .populate("applicableCategories", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Voucher.countDocuments(query),
    ]);

    return {
      vouchers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  // User: Get available public vouchers
  async getAvailableVouchers(userId, page = 1, limit = 20) {
    const now = new Date();
    // Use start of today so vouchers expiring today are still considered valid
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const query = {
      isActive: true,
      isPublic: true,
      startDate: { $lte: startOfToday },
      endDate: { $gte: startOfToday },
      $or: [
        { maxUsage: null },
        { maxUsage: { $exists: false } },
        { $expr: { $lt: ["$usageCount", "$maxUsage"] } },
      ],
    };

    console.log("🔍 Query vouchers:", JSON.stringify(query, null, 2));
    console.log("📅 Current date:", now);

    const skip = (page - 1) * limit;

    const [vouchers, total, userVouchers] = await Promise.all([
      Voucher.find(query)
        .select("-createdBy")
        .populate("applicableProducts", "name")
        .populate("applicableCategories", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Voucher.countDocuments(query),
      UserVoucher.find({ user: userId }).select("voucher usageCount isSaved"),
    ]);

    console.log(`🔎 Voucher query returned total=${total}, fetched=${Array.isArray(vouchers)?vouchers.length:0}, userVouchers=${Array.isArray(userVouchers)?userVouchers.length:0}`);
    try {
      const debugVouchers = (vouchers || []).map((v) => ({
        id: v._id?.toString(),
        code: v.code,
        startDate: v.startDate,
        endDate: v.endDate,
        isActive: v.isActive,
        isPublic: v.isPublic,
        maxUsage: v.maxUsage,
        usageCount: v.usageCount,
      }));
      console.log("🔍 Voucher docs:", JSON.stringify(debugVouchers, null, 2));
    } catch (e) {
      console.log("Could not stringify vouchers for debug", e);
    }

    try {
      const uvDebug = (userVouchers || []).map((uv) => ({ voucher: uv.voucher?.toString(), usageCount: uv.usageCount, isSaved: uv.isSaved }));
      console.log("🧾 UserVoucher docs:", JSON.stringify(uvDebug, null, 2));
    } catch (e) {
      console.log("Could not stringify userVouchers for debug", e);
    }

    // Map user voucher data to vouchers
    const userVoucherMap = {};
    userVouchers.forEach((uv) => {
      userVoucherMap[uv.voucher.toString()] = {
        usageCount: uv.usageCount,
        isSaved: uv.isSaved,
      };
    });

    const vouchersWithUserData = vouchers.map((v) => {
      const voucherObj = v.toObject();
      const userData = userVoucherMap[v._id.toString()] || { usageCount: 0, isSaved: false };
      return {
        ...voucherObj,
        userUsageCount: userData.usageCount,
        isSaved: userData.isSaved,
        canUse: userData.usageCount < v.maxUsagePerUser,
      };
    });

    return {
      vouchers: vouchersWithUserData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  // User: Get saved vouchers
  async getSavedVouchers(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [userVouchers, total] = await Promise.all([
      UserVoucher.find({ user: userId, isSaved: true })
        .populate({
          path: "voucher",
          populate: [
            { path: "applicableProducts", select: "name" },
            { path: "applicableCategories", select: "name" },
          ],
        })
        .sort({ savedAt: -1 })
        .skip(skip)
        .limit(limit),
      UserVoucher.countDocuments({ user: userId, isSaved: true }),
    ]);

    const vouchers = userVouchers
      .filter((uv) => uv.voucher) // Filter out if voucher was deleted
      .map((uv) => ({
        ...uv.voucher.toObject(),
        userUsageCount: uv.usageCount,
        isSaved: true,
        canUse: uv.usageCount < uv.voucher.maxUsagePerUser && uv.voucher.isValid,
      }));

    return {
      vouchers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  // User: Save/unsave voucher
  async toggleSaveVoucher(userId, voucherId) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw new Error("Không tìm thấy voucher");
    }

    let userVoucher = await UserVoucher.findOne({ user: userId, voucher: voucherId });

    if (!userVoucher) {
      userVoucher = await UserVoucher.create({
        user: userId,
        voucher: voucherId,
        isSaved: true,
        savedAt: new Date(),
      });
      return { isSaved: true, message: "Đã lưu voucher" };
    } else {
      userVoucher.isSaved = !userVoucher.isSaved;
      userVoucher.savedAt = userVoucher.isSaved ? new Date() : null;
      await userVoucher.save();
      return {
        isSaved: userVoucher.isSaved,
        message: userVoucher.isSaved ? "Đã lưu voucher" : "Đã bỏ lưu voucher",
      };
    }
  }

  // Validate voucher for order
  async validateVoucher(code, userId, orderData) {
    const voucher = await Voucher.findOne({ code: code.toUpperCase() })
      .populate("applicableProducts")
      .populate("applicableCategories");

    if (!voucher) {
      throw new Error("Mã voucher không tồn tại");
    }

    // Check if voucher is valid (active, within date range, usage limit)
    if (!voucher.isValid) {
      throw new Error("Voucher không còn hiệu lực");
    }

    // Get user voucher usage
    let userVoucher = await UserVoucher.findOne({ user: userId, voucher: voucher._id });
    const userUsageCount = userVoucher ? userVoucher.usageCount : 0;

    // Check if user can use this voucher
    const validation = voucher.isValidForOrder(orderData.subtotal, userId, userUsageCount);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Check if voucher applies to products in cart
    if (voucher.applicableProducts.length > 0 || voucher.applicableCategories.length > 0) {
      const hasApplicableProduct = await this.checkProductEligibility(
        orderData.items,
        voucher.applicableProducts,
        voucher.applicableCategories
      );

      if (!hasApplicableProduct) {
        throw new Error("Voucher không áp dụng cho sản phẩm trong giỏ hàng");
      }
    }

    // Calculate discount
    const discountAmount = voucher.calculateDiscount(orderData.subtotal);

    return {
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      },
      discountAmount,
      finalAmount: orderData.subtotal - discountAmount,
    };
  }

  // Check if products are eligible for voucher
  async checkProductEligibility(orderItems, applicableProducts, applicableCategories) {
    if (applicableProducts.length === 0 && applicableCategories.length === 0) {
      return true; // No restrictions
    }

    const productIds = orderItems.map((item) => item.product.toString());
    const applicableProductIds = applicableProducts.map((p) => p._id.toString());
    const applicableCategoryIds = applicableCategories.map((c) => c._id.toString());

    // Check if any product is in applicable products list
    const hasApplicableProduct = productIds.some((id) => applicableProductIds.includes(id));
    if (hasApplicableProduct) return true;

    // Check if any product belongs to applicable categories
    const products = await Product.find({ _id: { $in: productIds } }).select("category");
    const hasApplicableCategory = products.some((p) => applicableCategoryIds.includes(p.category.toString()));

    return hasApplicableCategory;
  }

  // Get voucher by code
  async getVoucherByCode(code) {
    const voucher = await Voucher.findOne({ code: code.toUpperCase() })
      .populate("applicableProducts", "name price")
      .populate("applicableCategories", "name");

    if (!voucher) {
      throw new Error("Không tìm thấy voucher");
    }

    return voucher;
  }

  // Get voucher by ID
  async getVoucherById(voucherId) {
    const voucher = await Voucher.findById(voucherId)
      .populate("applicableProducts", "name price image")
      .populate("applicableCategories", "name")
      .populate("createdBy", "name email");

    if (!voucher) {
      throw new Error("Không tìm thấy voucher");
    }

    return voucher;
  }
}

export default new VoucherService();
