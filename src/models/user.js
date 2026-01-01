"use strict";

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, select: false }, // optional cho google
    firstName: { type: String },
    lastName: { type: String },
    fullName: { type: String }, // Thêm cho local auth
    address: { type: String },
    phoneNumber: { type: String, sparse: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER", "male", "female", "other"] },
    image: { type: String }, // map từ Google: picture
    role: { type: String, default: "user" }, // user, admin, etc.
    roleId: { type: String },
    positionId: { type: String },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" },

    // >>> thêm cho OAuth
    authProvider: { type: String, enum: ["local", "google"], default: "local", index: true },
    providerId: { type: String, index: true }, // Google sub
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    // googleRefreshToken: { type: String, select: false }, // nếu cần gọi API Google
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
