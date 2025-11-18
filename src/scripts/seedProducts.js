"use strict";

import mongoose from "mongoose";
import Category from "../models/category.js";
import Product from "../models/product.js";
import Image from "../models/image.js";
import configdb from "../config/configdb.js";

const categories = [
  { name: "Khai vị", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800" },
  { name: "Món chính", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800" },
  { name: "Tráng miệng", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800" },
  { name: "Đồ uống", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800" },
  { name: "Salad", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800" },
  { name: "Súp", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800" },
];

const products = [
  {
    name: "Phở Bò Đặc Biệt",
    description: "Phở bò với các loại thịt bò tái, nạm, gân, sách. Nước dùng được ninh từ xương trong 24 giờ, thơm ngon đậm đà.",
    price: 85000,
    images: [
      "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800",
      "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800",
      "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800",
    ],
    categoryName: "Món chính",
    stock: 25,
    status: "available",
    rating: 4.8,
    reviewCount: 156,
    preparationTime: "15-20 phút",
    calories: 450,
  },
  {
    name: "Bún Chả Hà Nội",
    description: "Bún chả truyền thống Hà Nội với thịt nướng thơm phức, nước mắm chua ngọt hài hòa.",
    price: 75000,
    images: [
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
      "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=800",
    ],
    categoryName: "Món chính",
    stock: 18,
    status: "available",
    rating: 4.7,
    reviewCount: 203,
    preparationTime: "10-15 phút",
    calories: 520,
  },
  {
    name: "Gỏi Cuốn Tôm Thịt",
    description: "Gỏi cuốn tươi mát với tôm, thịt, bún và rau sống, chấm với nước mắm đặc biệt.",
    price: 45000,
    images: [
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
    ],
    categoryName: "Khai vị",
    stock: 30,
    status: "available",
    rating: 4.6,
    reviewCount: 89,
    preparationTime: "5-10 phút",
    calories: 180,
  },
  {
    name: "Cơm Sườn Bì Chả",
    description: "Cơm tấm với sườn nướng, bì và chả trứng, kèm theo nước mắm và đồ chua.",
    price: 65000,
    images: [
      "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    ],
    categoryName: "Món chính",
    stock: 22,
    status: "available",
    rating: 4.5,
    reviewCount: 142,
    preparationTime: "10-15 phút",
    calories: 680,
  },
  {
    name: "Chè Ba Màu",
    description: "Chè truyền thống với đậu đỏ, đậu xanh, thạch và nước cốt dừa béo ngậy.",
    price: 30000,
    images: [
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
    ],
    categoryName: "Tráng miệng",
    stock: 40,
    status: "available",
    rating: 4.4,
    reviewCount: 78,
    preparationTime: "5 phút",
    calories: 320,
  },
  {
    name: "Cà Phê Sữa Đá",
    description: "Cà phê phin truyền thống với sữa đặc, đậm đà và thơm ngon.",
    price: 25000,
    images: [
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800",
    ],
    categoryName: "Đồ uống",
    stock: 50,
    status: "available",
    rating: 4.9,
    reviewCount: 312,
    preparationTime: "5 phút",
    calories: 150,
  },
  {
    name: "Salad Rau Củ Tươi",
    description: "Salad với các loại rau củ tươi, sốt mè rang thơm béo.",
    price: 55000,
    images: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    ],
    categoryName: "Salad",
    stock: 15,
    status: "available",
    rating: 4.3,
    reviewCount: 67,
    preparationTime: "5 phút",
    calories: 120,
  },
  {
    name: "Súp Hải Sản",
    description: "Súp hải sản với tôm, mực, cua và rau củ, đậm đà hương vị biển.",
    price: 95000,
    images: [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    ],
    categoryName: "Súp",
    stock: 12,
    status: "available",
    rating: 4.7,
    reviewCount: 98,
    preparationTime: "20-25 phút",
    calories: 280,
  },
];

async function seedDatabase() {
  try {
    // Kết nối database
    await configdb();
    console.log("✓ Connected to database");

    // Xóa dữ liệu cũ
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Image.deleteMany({}),
    ]);
    console.log("✓ Cleared old data");

    // Xóa index slug cũ nếu có
    try {
      await Category.collection.dropIndex("slug_1");
      console.log("✓ Dropped old slug index");
    } catch (err) {
      console.log("  (No old slug index to drop)");
    }

    // Tạo categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✓ Created ${createdCategories.length} categories`);

    // Tạo category map
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Tạo products với images
    const productsToCreate = [];
    
    for (const product of products) {
      // Tạo Image documents cho product này
      const imageDocuments = product.images.map(url => ({
        url: url,
        alt: product.name
      }));
      
      const createdImages = await Image.insertMany(imageDocuments);
      
      // Tạo product với listProductImage references
      productsToCreate.push({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: categoryMap[product.categoryName],
        stock: product.stock,
        status: product.status,
        rating: product.rating,
        reviewCount: product.reviewCount,
        preparationTime: product.preparationTime,
        calories: product.calories,
        listProductImage: createdImages.map(img => img._id)
      });
    }

    const createdProducts = await Product.insertMany(productsToCreate);
    console.log(`✓ Created ${createdProducts.length} products`);

    console.log("\n🎉 Seed completed successfully!");
    console.log("\nCategories:");
    createdCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat._id})`);
    });

    console.log("\nProducts:");
    createdProducts.forEach(prod => {
      console.log(`  - ${prod.name} - ${prod.price}đ (${prod.stock} available)`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedDatabase();
