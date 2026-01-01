"use strict";

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import User from "../models/user.js";
import Product from "../models/product.js";
import Order from "../models/order.js";

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/node_fulltask";

const connect = async () => {
  try {
    console.log("Connecting to", mongoUri);
    await mongoose.connect(mongoUri, { autoIndex: true });
    console.log("Mongo connected");
  } catch (err) {
    console.error("Mongo connect error", err);
    process.exit(1);
  }
};

const loadJson = (fileName) => JSON.parse(fs.readFileSync(path.resolve("./src/scripts/data", fileName), "utf-8"));

const createUsers = async (users) => {
  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log("User exists:", u.email);
      continue;
    }
    const created = new User(u);
    await created.save();
    console.log("Created user:", u.email);
  }
};

const createOrders = async (orders) => {
  for (const o of orders) {
    const user = await User.findOne({ email: o.userEmail });
    if (!user) {
      console.warn("Skipping order, user not found:", o.userEmail);
      continue;
    }

    const orderItems = [];
    let calculatedTotal = 0;

    for (const it of o.items) {
      const product = await Product.findOne({ name: it.productName });
      if (!product) {
        console.warn("Product not found, skipping item:", it.productName);
        continue;
      }
      const price = product.discountPrice || product.price || 0;
      orderItems.push({ productId: product._id, quantity: it.quantity, price, name: product.name, image: product.listProductImage?.[0]?.url || "" });
      calculatedTotal += price * it.quantity;
      // reduce stock for realism if available
      if (typeof product.stock === "number") {
        product.stock = Math.max(0, product.stock - it.quantity);
        await product.save();
      }
    }

    const subtotal = calculatedTotal;
    const finalAmount = subtotal; // no voucher/points in sample

    const order = new Order({
      userId: user._id,
      items: orderItems,
      shippingAddress: o.shippingAddress,
      paymentMethod: o.paymentMethod || "COD",
      totalAmount: subtotal,
      shippingFee: 0,
      voucherDiscount: 0,
      pointsDiscount: 0,
      finalAmount,
      orderStatus: o.orderStatus || "delivered",
      paymentStatus: o.orderStatus === "delivered" ? "paid" : "pending",
      deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : undefined,
    });

    await order.save();
    console.log("Created order for", o.userEmail, "orderId:", order._id.toString());
  }
};

const run = async () => {
  await connect();

  const users = loadJson("sampleUsers.json");
  const orders = loadJson("sampleOrders.json");

  await createUsers(users);
  await createOrders(orders);

  console.log("Done seeding sample data.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
