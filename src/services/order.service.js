"use strict";

import Cart from "../models/cart.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import UserVoucher from "../models/userVoucher.js";
import Voucher from "../models/voucher.js";
import loyaltyService, { LoyaltyService } from "./loyalty.service.js";
import notificationService from "./notification.service.js";
import { sendNotificationToUser, sendNotificationToRoom } from "../socket/socketServer.js";

class OrderService {
  // Tạo đơn hàng mới
  async createOrder(userId, orderData) {
    try {
      const { items, shippingAddress, paymentMethod, totalAmount, shippingFee, note, voucherCode, pointsToUse } =
        orderData;

      // Validate items
      if (!items || items.length === 0) {
        throw new Error("Đơn hàng phải có ít nhất 1 sản phẩm");
      }

      // Kiểm tra và cập nhật thông tin sản phẩm
      const orderItems = [];
      let calculatedTotal = 0;

      for (const item of items) {
        const product = await Product.findById(item.productId).populate("listProductImage");

        if (!product) {
          throw new Error(`Sản phẩm ${item.productId} không tồn tại`);
        }

        if (product.status !== "available") {
          throw new Error(`Sản phẩm ${product.name} không khả dụng`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Sản phẩm ${product.name} chỉ còn ${product.stock} trong kho`);
        }

        // Giảm số lượng tồn kho
        product.stock -= item.quantity;
        await product.save();

        // Tính tổng tiền
        const itemPrice = product.discountPrice || product.price;
        calculatedTotal += itemPrice * item.quantity;

        orderItems.push({
          productId: product._id,
          quantity: item.quantity,
          price: itemPrice,
          name: product.name,
          image: product.listProductImage?.[0]?.url || "",
        });
      }

      // Tạo mã đơn hàng
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const orderNumber = `ORD${timestamp}${random}`;

      // Khởi tạo giá trị discount
      let voucherDiscount = 0;
      let voucherId = null;
      let pointsDiscount = 0;
      let pointsUsed = 0;

      // Áp dụng voucher nếu có
      if (voucherCode) {
        const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });

        if (voucher && voucher.isValid) {
          // Kiểm tra usage của user
          let userVoucher = await UserVoucher.findOne({ user: userId, voucher: voucher._id });
          const userUsageCount = userVoucher ? userVoucher.usageCount : 0;

          const validation = voucher.isValidForOrder(calculatedTotal, userId, userUsageCount);

          if (validation.valid) {
            voucherDiscount = voucher.calculateDiscount(calculatedTotal);
            voucherId = voucher._id;

            // Increment usage count
            voucher.usageCount += 1;
            await voucher.save();

            // Update user voucher
            if (!userVoucher) {
              userVoucher = new UserVoucher({ user: userId, voucher: voucher._id });
            }
            await userVoucher.incrementUsage();
          }
        }
      }

      // Áp dụng điểm tích lũy nếu có
      if (pointsToUse && pointsToUse > 0) {
        try {
          const loyaltyAccount = await loyaltyService.getOrCreateLoyaltyAccount(userId);

          if (loyaltyAccount.availablePoints >= pointsToUse) {
            pointsUsed = pointsToUse;
            // Tỷ lệ: 1 điểm = 10 VND (100 điểm = 1,000 VND)
            // Ví dụ: 10 điểm = 100 VND, 100 điểm = 1,000 VND
            const CURRENCY_PER_POINT = 10; // Đảm bảo dùng đúng tỷ lệ
            pointsDiscount = pointsToUse * CURRENCY_PER_POINT;
            console.log(`[Order] Using ${pointsToUse} points = ${pointsDiscount} VND discount`);
          }
        } catch (error) {
          console.log("Error applying loyalty points:", error.message);
        }
      }

      // Tính finalAmount
      const subtotal = calculatedTotal + (shippingFee || 0);
      const totalDiscount = voucherDiscount + pointsDiscount;
      const finalAmount = Math.max(0, subtotal - totalDiscount);

      // Tạo đơn hàng
      const order = new Order({
        userId,
        orderNumber,
        items: orderItems,
        shippingAddress,
        paymentMethod: paymentMethod || "COD",
        totalAmount: calculatedTotal,
        shippingFee: shippingFee || 0,
        voucherDiscount,
        voucherCode: voucherCode ? voucherCode.toUpperCase() : null,
        voucherId,
        pointsDiscount,
        pointsUsed,
        finalAmount,
        note,
      });

      await order.save();

      // Deduct loyalty points nếu đã sử dụng
      if (pointsUsed > 0) {
        try {
          await loyaltyService.applyPointsToOrder(userId, pointsUsed, order._id);
        } catch (error) {
          console.log("Error deducting loyalty points:", error.message);
        }
      }

      // Tính điểm tích lũy từ đơn hàng (sau khi trừ discount)
      if (finalAmount > 0) {
        try {
          const earnedPointsResult = await loyaltyService.earnPointsFromOrder(userId, finalAmount, order._id);
          order.pointsEarned = earnedPointsResult.earnedPoints;
          await order.save();
        } catch (error) {
          console.log("Error earning loyalty points:", error.message);
        }
      }

      // Xóa giỏ hàng sau khi đặt hàng thành công
      await Cart.findOneAndUpdate({ userId }, { items: [] });

      // Populate thông tin user và product
      await order.populate([
        {
          path: "userId",
          select: "email fullName phoneNumber",
        },
        {
          path: "items.productId",
          select: "name price listProductImage",
        },
      ]);

      // Gửi notification (wrap trong try-catch để không làm fail order creation)
      try {
        const notification = await notificationService.createNotification(
          userId,
          "ORDER_NEW",
          "Đơn hàng mới",
          `Đơn hàng #${order.orderNumber} của bạn đã được tạo thành công.`,
          { orderId: order._id, orderNumber: order.orderNumber },
          true // Gửi email
        );
      
        // Gửi qua WebSocket
        sendNotificationToUser(userId, notification);
      } catch (notifError) {
        console.error("[OrderService] Error sending notification:", notifError);
        // Không throw error, vì order đã được tạo thành công
      }
    
      // Gửi notification cho admin (nếu có room admin)
      try {
        sendNotificationToRoom("admin", {
          type: "ORDER_NEW",
          title: "Đơn hàng mới",
          message: `Có đơn hàng mới #${order.orderNumber}`,
          data: { orderId: order._id },
        });
      } catch (adminNotifError) {
        console.error("[OrderService] Error sending admin notification:", adminNotifError);
        // Không throw error
      }
      
      return order;
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }

  // Lấy danh sách đơn hàng của user
  async getMyOrders(userId, { page = 1, limit = 10, status }) {
    try {
      const query = { userId };
      if (status) {
        query.orderStatus = status;
      }

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate({
            path: "items.productId",
            select: "name price listProductImage",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query),
      ]);

      return {
        orders,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }
  }

  // Lấy chi tiết đơn hàng
  async getOrderById(orderId, userId) {
    try {
      const order = await Order.findOne({ _id: orderId, userId })
        .populate({
          path: "userId",
          select: "email fullName phoneNumber",
        })
        .populate({
          path: "items.productId",
          select: "name price listProductImage description",
        })
        .lean();

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      return order;
    } catch (error) {
      throw new Error(`Error fetching order: ${error.message}`);
    }
  }

  // Hủy đơn hàng
  async cancelOrder(orderId, userId, reason) {
    try {
      const order = await Order.findOne({ _id: orderId, userId });

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      // Chỉ cho phép hủy đơn ở trạng thái pending hoặc confirmed
      if (!["pending", "confirmed"].includes(order.orderStatus)) {
        throw new Error("Không thể hủy đơn hàng ở trạng thái này");
      }

      // Hoàn lại số lượng sản phẩm vào kho
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }

      order.orderStatus = "cancelled";
      order.cancelledAt = new Date();
      order.cancelReason = reason || "Khách hàng hủy đơn";
      await order.save();

      // Gửi notification
      const notification = await notificationService.createNotification(
        userId,
        "ORDER_CANCELLED",
        "Đơn hàng đã bị hủy",
        `Đơn hàng #${order.orderNumber} của bạn đã bị hủy.${reason ? ` Lý do: ${reason}` : ""}`,
        { orderId: order._id, orderNumber: order.orderNumber },
        true
      );
      sendNotificationToUser(userId, notification);

      return order;
    } catch (error) {
      throw new Error(`Error cancelling order: ${error.message}`);
    }
  }

  // Xác nhận đã nhận hàng
  async confirmReceived(orderId, userId) {
    try {
      const order = await Order.findOne({ _id: orderId, userId });

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      if (order.orderStatus !== "shipping") {
        throw new Error("Chỉ có thể xác nhận đơn hàng đang giao");
      }

      order.orderStatus = "delivered";
      order.deliveredAt = new Date();
      order.paymentStatus = "paid"; // COD -> đã nhận hàng = đã thanh toán
      await order.save();

      // Gửi notification
      const notification = await notificationService.createNotification(
        userId,
        "ORDER_DELIVERED",
        "Đơn hàng đã được giao thành công",
        `Đơn hàng #${order.orderNumber} của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!`,
        { orderId: order._id, orderNumber: order.orderNumber },
        true
      );
      sendNotificationToUser(userId, notification);

      return order;
    } catch (error) {
      throw new Error(`Error confirming order: ${error.message}`);
    }
  }

  // Admin: Lấy tất cả đơn hàng
  async getAllOrders({ page = 1, limit = 20, status, userId, orderNumber }) {
    try {
      const query = {};
      if (status) query.orderStatus = status;
      if (userId) query.userId = userId;
      if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: "i" };

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate({
            path: "userId",
            select: "email fullName phoneNumber",
          })
          .populate({
            path: "items.productId",
            select: "name price listProductImage",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query),
      ]);

      return {
        orders,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching all orders: ${error.message}`);
    }
  }

  // Admin: Cập nhật trạng thái đơn hàng
  async updateOrderStatus(orderId, status) {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      // Validate status transition
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["preparing", "cancelled"],
        preparing: ["shipping"],
        shipping: ["delivered"],
        delivered: [],
        cancelled: [],
      };

      if (!validTransitions[order.orderStatus].includes(status)) {
        throw new Error(`Không thể chuyển từ ${order.orderStatus} sang ${status}`);
      }

      order.orderStatus = status;

      if (status === "delivered") {
        order.deliveredAt = new Date();
        order.paymentStatus = "paid";
      } else if (status === "cancelled") {
        order.cancelledAt = new Date();
        // Hoàn lại số lượng sản phẩm
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
          });
        }
      }

      await order.save();

      // Gửi notification cho user dựa trên trạng thái mới
      let notificationType, title, message;
      switch (status) {
        case "confirmed":
          notificationType = "ORDER_CONFIRMED";
          title = "Đơn hàng đã được xác nhận";
          message = `Đơn hàng #${order.orderNumber} của bạn đã được xác nhận. Chúng tôi sẽ bắt đầu chuẩn bị ngay!`;
          break;
        case "preparing":
          notificationType = "ORDER_PREPARING";
          title = "Đơn hàng đang được chuẩn bị";
          message = `Đơn hàng #${order.orderNumber} của bạn đang được chuẩn bị. Sẽ sẵn sàng sớm!`;
          break;
        case "shipping":
          notificationType = "ORDER_SHIPPING";
          title = "Đơn hàng đang được giao";
          message = `Đơn hàng #${order.orderNumber} của bạn đang được giao. Vui lòng chuẩn bị nhận hàng!`;
          break;
        case "delivered":
          notificationType = "ORDER_DELIVERED";
          title = "Đơn hàng đã được giao thành công";
          message = `Đơn hàng #${order.orderNumber} của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!`;
          break;
        case "cancelled":
          notificationType = "ORDER_CANCELLED";
          title = "Đơn hàng đã bị hủy";
          message = `Đơn hàng #${order.orderNumber} của bạn đã bị hủy.`;
          break;
        default:
          return order; // Không gửi notification cho các trạng thái khác
      }

      if (notificationType) {
        const notification = await notificationService.createNotification(
          order.userId,
          notificationType,
          title,
          message,
          { orderId: order._id, orderNumber: order.orderNumber },
          true
        );
        sendNotificationToUser(order.userId, notification);
      }

      return order;
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  }
}

export default new OrderService();
