"use strict";

import Order from "../models/order.js";
import User from "../models/user.js";
import Product from "../models/product.js";

class SummaryService {
  // Revenue timeseries for delivered orders
  async getRevenue({ from, to, interval = "day" } = {}) {
    const match = { orderStatus: "delivered" };
    if (from || to) match.deliveredAt = {};
    if (from) match.deliveredAt.$gte = new Date(from);
    if (to) match.deliveredAt.$lte = new Date(to);

    const dateFormat = interval === "month" ? "%Y-%m" : "%Y-%m-%d";

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$deliveredAt" } },
          totalRevenue: { $sum: "$finalAmount" },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const result = await Order.aggregate(pipeline);
    return result;
  }

  // List of delivered orders (for table)
  async getDeliveredOrders({ page = 1, limit = 20, from, to } = {}) {
    const query = { orderStatus: "delivered" };
    if (from || to) query.deliveredAt = {};
    if (from) query.deliveredAt.$gte = new Date(from);
    if (to) query.deliveredAt.$lte = new Date(to);

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate({ path: "userId", select: "fullName email phoneNumber" })
        .populate({ path: "items.productId", select: "name listProductImage" })
        .sort({ deliveredAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return { orders, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  // Cashflow summary
  async getCashflow({ from, to } = {}) {
    const match = {};
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: "$orderStatus",
          total: { $sum: "$finalAmount" },
          count: { $sum: 1 },
        },
      },
    ];

    const rows = await Order.aggregate(pipeline);

    const result = { delivered: 0, shipping: 0, pending: 0, cancelled: 0 };
    for (const r of rows) {
      if (r._id === "delivered") result.delivered = r.total;
      else if (r._id === "shipping") result.shipping = r.total;
      else if (r._id === "pending") result.pending = r.total;
      else if (r._id === "cancelled") result.cancelled = r.total;
    }

    return result;
  }

  // Count new customers in time window
  async getNewCustomersCount({ from, to } = {}) {
    const query = {};
    if (from || to) query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);

    const count = await User.countDocuments(query);
    return { count };
  }

  // Top products by quantity sold
  async getTopProducts({ from, to, limit = 10 } = {}) {
    const match = { orderStatus: "delivered" };
    if (from || to) match.deliveredAt = {};
    if (from) match.deliveredAt.$gte = new Date(from);
    if (to) match.deliveredAt.$lte = new Date(to);

    const pipeline = [
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: "$_id",
          totalQuantity: 1,
          totalRevenue: 1,
          product: { _id: "$product._id", name: "$product.name", price: "$product.price", listProductImage: "$product.listProductImage" },
        },
      },
    ];

    const rows = await Order.aggregate(pipeline);
    return rows;
  }
}

export default new SummaryService();
