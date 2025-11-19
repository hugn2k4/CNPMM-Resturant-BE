"use strict";

import mongoose from "mongoose";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Image from "../models/image.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/siupo");
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log("🗑️  Đang xóa dữ liệu cũ...");
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Image.deleteMany({});

    // Tạo Categories
    console.log("📁 Đang tạo categories...");
    const categoriesData = [
      { name: "Món chính", slug: "mon-chinh", description: "Các món ăn chính", isActive: true },
      { name: "Khai vị", slug: "khai-vi", description: "Món khai vị", isActive: true },
      { name: "Tráng miệng", slug: "trang-mieng", description: "Món tráng miệng", isActive: true },
      { name: "Đồ uống", slug: "do-uong", description: "Nước uống các loại", isActive: true },
      { name: "Salad", slug: "salad", description: "Salad tươi ngon", isActive: true },
    ];
    const categories = await Category.insertMany(categoriesData);

    // Tạo Images với Unsplash URLs
    console.log("🖼️  Đang tạo images...");
    const imagesData = [
      { url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", alt: "Salad tươi" },
      { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", alt: "Pizza" },
      { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", alt: "Burger" },
      { url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800", alt: "Món ăn" },
      { url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800", alt: "Bữa sáng" },
      { url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800", alt: "Pancakes" },
      { url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800", alt: "Salad bát" },
      { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", alt: "Healthy" },
      { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800", alt: "Pasta" },
      { url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800", alt: "Sushi" },
      { url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800", alt: "Cocktail" },
      { url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800", alt: "Smoothie" },
      { url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800", alt: "Dessert" },
      { url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800", alt: "Soup" },
      { url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800", alt: "Steak" },
    ];
    const images = await Image.insertMany(imagesData);

    // Dữ liệu sản phẩm thực tế
    console.log("🍔 Đang tạo products...");
    
    const productsData = [
      // MÓN CHÍNH - Best sellers
      {
        name: "Bò bít tết Úc cao cấp",
        description: "Thịt bò Úc nhập khẩu, nướng chín vừa, phục vụ kèm khoai tây nghiền và rau củ",
        price: 450000,
        categoryId: categories[0]._id,
        listProductImage: [images[14]._id],
        stock: 25,
        status: "available",
        preparationTime: "25-30 phút",
        calories: 680,
        rating: 4.8,
        reviewCount: 245,
        viewCount: 5200,
        soldCount: 680,
        discount: 0,
      },
      {
        name: "Cơm gà Hải Nam",
        description: "Gà luộc mềm, cơm thơm béo, nước chấm đậm đà",
        price: 85000,
        categoryId: categories[0]._id,
        listProductImage: [images[4]._id],
        stock: 50,
        status: "available",
        preparationTime: "20-25 phút",
        calories: 520,
        rating: 4.7,
        reviewCount: 389,
        viewCount: 8500,
        soldCount: 1250,
        discount: 15,
      },
      {
        name: "Spaghetti Carbonara",
        description: "Mì Ý sốt kem trứng, thịt xông khói giòn",
        price: 120000,
        categoryId: categories[0]._id,
        listProductImage: [images[8]._id],
        stock: 35,
        status: "available",
        preparationTime: "15-20 phút",
        calories: 580,
        rating: 4.6,
        reviewCount: 312,
        viewCount: 6800,
        soldCount: 890,
        discount: 20,
      },
      {
        name: "Burger bò phô mai đặc biệt",
        description: "Bánh mì tự làm, thịt bò Wagyu, phô mai Cheddar tan chảy",
        price: 165000,
        categoryId: categories[0]._id,
        listProductImage: [images[2]._id],
        stock: 40,
        status: "available",
        preparationTime: "18-22 phút",
        calories: 720,
        rating: 4.9,
        reviewCount: 456,
        viewCount: 9200,
        soldCount: 1580,
        discount: 10,
      },
      {
        name: "Pizza Margherita",
        description: "Pizza truyền thống Ý với cà chua tươi, phô mai Mozzarella",
        price: 180000,
        categoryId: categories[0]._id,
        listProductImage: [images[1]._id],
        stock: 30,
        status: "available",
        preparationTime: "22-25 phút",
        calories: 640,
        rating: 4.7,
        reviewCount: 278,
        viewCount: 7100,
        soldCount: 920,
        discount: 25,
      },
      {
        name: "Sushi combo đặc biệt",
        description: "12 miếng sushi cá hồi, cá ngừ tươi sống",
        price: 320000,
        categoryId: categories[0]._id,
        listProductImage: [images[9]._id],
        stock: 20,
        status: "available",
        preparationTime: "20-25 phút",
        calories: 450,
        rating: 4.8,
        reviewCount: 198,
        viewCount: 4500,
        soldCount: 560,
        discount: 0,
      },

      // KHAI VỊ
      {
        name: "Salad Caesar",
        description: "Rau xà lách tươi, phô mai Parmesan, sốt Caesar",
        price: 75000,
        categoryId: categories[1]._id,
        listProductImage: [images[0]._id],
        stock: 45,
        status: "available",
        preparationTime: "10-12 phút",
        calories: 280,
        rating: 4.5,
        reviewCount: 167,
        viewCount: 3200,
        soldCount: 420,
        discount: 0,
      },
      {
        name: "Gỏi cuốn tôm thịt",
        description: "Gỏi cuốn tươi ngon, tôm thịt đầy đủ",
        price: 55000,
        categoryId: categories[1]._id,
        listProductImage: [images[3]._id],
        stock: 60,
        status: "available",
        preparationTime: "8-10 phút",
        calories: 180,
        rating: 4.6,
        reviewCount: 234,
        viewCount: 4800,
        soldCount: 780,
        discount: 0,
      },
      {
        name: "Soup bí đỏ",
        description: "Soup bí đỏ béo ngậy, hạt điều rang",
        price: 45000,
        categoryId: categories[1]._id,
        listProductImage: [images[13]._id],
        stock: 0,
        status: "out_of_stock",
        preparationTime: "12-15 phút",
        calories: 220,
        rating: 4.4,
        reviewCount: 89,
        viewCount: 1500,
        soldCount: 180,
        discount: 0,
      },

      // TRÁNG MIỆNG
      {
        name: "Tiramisu Ý",
        description: "Bánh tiramisu truyền thống, cà phê Espresso",
        price: 65000,
        categoryId: categories[2]._id,
        listProductImage: [images[12]._id],
        stock: 25,
        status: "available",
        preparationTime: "5 phút",
        calories: 320,
        rating: 4.7,
        reviewCount: 156,
        viewCount: 3400,
        soldCount: 450,
        discount: 0,
      },
      {
        name: "Pancake dâu tây",
        description: "Bánh pancake xốp mềm, sốt dâu tây tươi",
        price: 55000,
        categoryId: categories[2]._id,
        listProductImage: [images[5]._id],
        stock: 35,
        status: "available",
        preparationTime: "12-15 phút",
        calories: 380,
        rating: 4.8,
        reviewCount: 289,
        viewCount: 6200,
        soldCount: 820,
        discount: 15,
      },
      {
        name: "Kem vanilla Madagascar",
        description: "Kem vanilla nguyên chất từ Madagascar",
        price: 42000,
        categoryId: categories[2]._id,
        listProductImage: [images[12]._id],
        stock: 50,
        status: "available",
        preparationTime: "3 phút",
        calories: 240,
        rating: 4.6,
        reviewCount: 178,
        viewCount: 4100,
        soldCount: 620,
        discount: 0,
      },

      // ĐỒ UỐNG
      {
        name: "Cà phê sữa đá Việt Nam",
        description: "Cà phê phin truyền thống, sữa đặc ngọt ngào",
        price: 35000,
        categoryId: categories[3]._id,
        listProductImage: [images[10]._id],
        stock: 100,
        status: "available",
        preparationTime: "5-7 phút",
        calories: 180,
        rating: 4.9,
        reviewCount: 567,
        viewCount: 12000,
        soldCount: 2300,
        discount: 0,
      },
      {
        name: "Sinh tố bơ",
        description: "Sinh tố bơ sánh mịn, bổ dưỡng",
        price: 45000,
        categoryId: categories[3]._id,
        listProductImage: [images[11]._id],
        stock: 80,
        status: "available",
        preparationTime: "5 phút",
        calories: 280,
        rating: 4.7,
        reviewCount: 412,
        viewCount: 8900,
        soldCount: 1450,
        discount: 0,
      },
      {
        name: "Trà sữa trân châu đường đen",
        description: "Trà sữa thơm ngon, trân châu mềm dẻo",
        price: 42000,
        categoryId: categories[3]._id,
        listProductImage: [images[10]._id],
        stock: 120,
        status: "available",
        preparationTime: "7-8 phút",
        calories: 320,
        rating: 4.8,
        reviewCount: 689,
        viewCount: 15000,
        soldCount: 2800,
        discount: 20,
      },
      {
        name: "Nước ép cam tươi",
        description: "Cam tươi vắt 100%, không đường",
        price: 38000,
        categoryId: categories[3]._id,
        listProductImage: [images[11]._id],
        stock: 0,
        status: "out_of_stock",
        preparationTime: "5 phút",
        calories: 120,
        rating: 4.6,
        reviewCount: 234,
        viewCount: 5200,
        soldCount: 980,
        discount: 0,
      },

      // SALAD
      {
        name: "Salad Hy Lạp",
        description: "Cà chua bi, dưa chuột, phô mai Feta, olive đen",
        price: 85000,
        categoryId: categories[4]._id,
        listProductImage: [images[6]._id],
        stock: 30,
        status: "available",
        preparationTime: "10 phút",
        calories: 240,
        rating: 4.7,
        reviewCount: 145,
        viewCount: 3100,
        soldCount: 380,
        discount: 0,
      },
      {
        name: "Salad rau củ quả hỗn hợp",
        description: "Rau củ quả tươi, sốt dầu olive",
        price: 70000,
        categoryId: categories[4]._id,
        listProductImage: [images[7]._id],
        stock: 40,
        status: "available",
        preparationTime: "8-10 phút",
        calories: 180,
        rating: 4.5,
        reviewCount: 178,
        viewCount: 3800,
        soldCount: 520,
        discount: 30,
      },
    ];

    await Product.insertMany(productsData);
    
    console.log(`✅ Đã tạo ${productsData.length} products`);
    console.log("\n📊 THỐNG KÊ:");
    console.log(`   - Có khuyến mãi: ${productsData.filter(p => p.discount > 0).length}`);
    console.log(`   - Hết hàng: ${productsData.filter(p => p.stock === 0).length}`);
    console.log(`   - Best sellers (sold > 1000): ${productsData.filter(p => p.soldCount > 1000).length}`);
    console.log(`   - Highest rated (4.8+): ${productsData.filter(p => p.rating >= 4.8).length}`);

  } catch (error) {
    console.error("❌ Lỗi:", error);
  }
};

const main = async () => {
  await connectDB();
  await seedData();
  console.log("\n✅ HOÀN TẤT!");
  process.exit(0);
};

main();