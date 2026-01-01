"use strict";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.js";

const createDefaultAdmin = async () => {
  try {
    // Kiểm tra xem đã có admin LOCAL với email cnpmm@admin.com chưa
    const localAdmin = await User.findOne({
      email: "cnpmm@admin.com",
      authProvider: "local",
    }).select("+password");

    console.log("🔍 Checking for local admin (cnpmm@admin.com)... Found:", localAdmin ? "Yes" : "No");

    if (!localAdmin) {
      console.log("🔧 No local admin found. Creating default admin account...");

      // Hash password
      const hashedPassword = await bcrypt.hash("Admin@123456", 10);

      // Tạo admin mặc định
      const adminUser = await User.create({
        email: "cnpmm@admin.com",
        password: hashedPassword,
        fullName: "Administrator",
        firstName: "Admin",
        lastName: "System",
        role: "admin",
        authProvider: "local",
        isEmailVerified: true,
        status: "ACTIVE",
      });

      console.log("✅ Default admin created successfully!");
      console.log("📧 Email: cnpmm@admin.com");
      console.log("🔑 Password: Admin@123456");
      console.log("⚠️  Please change the password after first login!");

      // Verify creation
      const verify = await User.findOne({ email: "cnpmm@admin.com" }).select("+password");
      console.log("🔐 Password hash saved:", verify?.password ? `✓ (${verify.password.length} chars)` : "❌ FAILED!");
    } else {
      console.log("✅ Local admin account already exists");
      console.log(
        "🔐 Password status:",
        localAdmin.password ? `✓ (${localAdmin.password.length} chars)` : "❌ MISSING!"
      );
      console.log("👤 Current role:", localAdmin.role);

      let needUpdate = false;

      // If admin exists but no password, update it
      if (!localAdmin.password) {
        console.log("⚠️  Admin exists but has no password. Adding password...");
        const hashedPassword = await bcrypt.hash("Admin@123456", 10);
        localAdmin.password = hashedPassword;
        needUpdate = true;
      }

      // Fix role case if needed (ADMIN -> admin)
      if (localAdmin.role !== "admin") {
        console.log(`⚠️  Admin role is "${localAdmin.role}", updating to "admin"...`);
        localAdmin.role = "admin";
        needUpdate = true;
      }

      if (needUpdate) {
        await localAdmin.save();
        console.log("✅ Admin account updated successfully!");
      }
    }
  } catch (err) {
    console.error("❌ Error creating default admin:", err.message);
    console.error(err);
  }
};

const connectMongo = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/siupo";
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected:", uri);

    // Tạo admin mặc định sau khi kết nối thành công
    await createDefaultAdmin();
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
};

export default connectMongo;
