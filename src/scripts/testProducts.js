"use strict";

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Image from "../models/image.js";

dotenv.config();

const testProducts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/node_fulltask";
    console.log("🔌 Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected\n");

    // Test 1: Count products
    const totalProducts = await Product.countDocuments({});
    console.log(`📦 Tổng số products: ${totalProducts}`);

    // Test 2: Count products with isDeleted filter
    const activeProducts = await Product.countDocuments({ isDeleted: false });
    console.log(`✅ Products không bị xóa: ${activeProducts}`);

    // Test 3: Get products without populate
    const productsRaw = await Product.find({ isDeleted: false }).limit(5).lean();
    console.log(`\n📋 Sample products (raw, không populate):`);
    productsRaw.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - categoryId: ${p.categoryId}, images: ${p.listProductImage?.length || 0}`);
    });

    // Test 4: Check categories
    const categories = await Category.find({});
    console.log(`\n📁 Tổng số categories: ${categories.length}`);
    categories.forEach((c) => {
      console.log(`  - ${c.name} (${c._id})`);
    });

    // Test 5: Check images
    const images = await Image.find({});
    console.log(`\n🖼️  Tổng số images: ${images.length}`);

    // Test 6: Try populate
    console.log(`\n🔍 Testing populate...`);
    const productsWithPopulate = await Product.find({ isDeleted: false })
      .populate('categoryId', 'name slug')
      .populate('listProductImage', 'url alt')
      .limit(3)
      .lean();

    console.log(`✅ Products với populate (${productsWithPopulate.length}):`);
    productsWithPopulate.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}`);
      console.log(`     Category: ${p.categoryId ? p.categoryId.name : 'NULL'}`);
      console.log(`     Images: ${p.listProductImage?.length || 0}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

testProducts();

