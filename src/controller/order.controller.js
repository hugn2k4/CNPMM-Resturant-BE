"use strict";

import asyncHandler from "../middlewares/asyncHandler.js";
import orderService from "../services/order.service.js";

class OrderController {
  // Tạo đơn hàng mới
  createOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const orderData = req.body;

    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng phải có ít nhất 1 sản phẩm",
      });
    }

    if (!orderData.shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin địa chỉ giao hàng",
      });
    }

    const order = await orderService.createOrder(userId, orderData);

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công",
      data: order,
    });
  });

  // Lấy danh sách đơn hàng của user
  getMyOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, status } = req.query;

    const result = await orderService.getMyOrders(userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn hàng thành công",
      data: result,
    });
  });

  // Lấy chi tiết đơn hàng
  getOrderDetail = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await orderService.getOrderById(orderId, userId);

    res.status(200).json({
      success: true,
      message: "Lấy chi tiết đơn hàng thành công",
      data: order,
    });
  });

  // Hủy đơn hàng
  cancelOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await orderService.cancelOrder(orderId, userId, reason);

    res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order,
    });
  });

  // Xác nhận đã nhận hàng
  confirmReceived = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await orderService.confirmReceived(orderId, userId);

    res.status(200).json({
      success: true,
      message: "Xác nhận nhận hàng thành công",
      data: order,
    });
  });

  // Admin: Lấy tất cả đơn hàng
  getAllOrders = asyncHandler(async (req, res) => {
    const { page, limit, status, userId, orderNumber } = req.query;

    const result = await orderService.getAllOrders({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      userId,
      orderNumber,
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn hàng thành công",
      data: result,
    });
  });

  // Admin: Cập nhật trạng thái đơn hàng
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Thiếu trạng thái đơn hàng",
      });
    }

    const order = await orderService.updateOrderStatus(orderId, status);

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  });
}

export default new OrderController();
