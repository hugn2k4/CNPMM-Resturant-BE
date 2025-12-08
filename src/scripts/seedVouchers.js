import dotenv from "dotenv";
import mongoose from "mongoose";
import Voucher from "../models/voucher.js";

dotenv.config();

const sampleVouchers = [
  {
    code: "WELCOME10",
    name: "Chào mừng thành viên mới",
    description: "Giảm 10% cho đơn hàng đầu tiên, áp dụng cho đơn từ 100,000đ",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscountAmount: 50000,
    minOrderAmount: 100000,
    maxUsage: 1000,
    maxUsagePerUser: 1,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isActive: true,
    isPublic: true,
  },
  {
    code: "SUMMER2024",
    name: "Ưu đãi mùa hè",
    description: "Giảm 15% cho tất cả đơn hàng từ 200,000đ",
    discountType: "PERCENTAGE",
    discountValue: 15,
    maxDiscountAmount: 100000,
    minOrderAmount: 200000,
    maxUsage: 500,
    maxUsagePerUser: 3,
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-08-31"),
    isActive: true,
    isPublic: true,
  },
  {
    code: "FREESHIP",
    name: "Miễn phí vận chuyển",
    description: "Giảm 30,000đ phí vận chuyển cho đơn từ 150,000đ",
    discountType: "FIXED_AMOUNT",
    discountValue: 30000,
    minOrderAmount: 150000,
    maxUsage: 2000,
    maxUsagePerUser: 5,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isActive: true,
    isPublic: true,
  },
  {
    code: "MEGA50",
    name: "Siêu giảm giá",
    description: "Giảm 50,000đ cho đơn hàng từ 300,000đ",
    discountType: "FIXED_AMOUNT",
    discountValue: 50000,
    minOrderAmount: 300000,
    maxUsage: 200,
    maxUsagePerUser: 2,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    isActive: true,
    isPublic: true,
  },
  {
    code: "VIP20",
    name: "Ưu đãi VIP",
    description: "Giảm 20% không giới hạn cho đơn từ 500,000đ",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxDiscountAmount: 200000,
    minOrderAmount: 500000,
    maxUsage: 100,
    maxUsagePerUser: 10,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isActive: true,
    isPublic: true,
  },
  {
    code: "WEEKEND25",
    name: "Cuối tuần vui vẻ",
    description: "Giảm 25% cho đơn cuối tuần từ 250,000đ",
    discountType: "PERCENTAGE",
    discountValue: 25,
    maxDiscountAmount: 150000,
    minOrderAmount: 250000,
    maxUsage: 300,
    maxUsagePerUser: 4,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    isActive: true,
    isPublic: true,
  },
];

async function seedVouchers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/siupo";
    console.log("🔌 Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing vouchers (optional)
    const deleteResult = await Voucher.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing vouchers`);

    // Insert sample vouchers
    const result = await Voucher.insertMany(sampleVouchers);
    console.log(`Successfully created ${result.length} vouchers:`);

    result.forEach((voucher) => {
      console.log(`  - ${voucher.code}: ${voucher.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding vouchers:", error);
    process.exit(1);
  }
}

// Run the seed function
seedVouchers();
