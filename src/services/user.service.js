// src/services/user.service.js
import User from "../models/user.js";

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).select("-password");
    return user;
  } catch (error) {
    console.error("getUserById error:", error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { fullName, phoneNumber, dateOfBirth, gender, image } = profileData;

    const updateFields = {};
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
    // Chỉ set gender nếu nó là giá trị hợp lệ, không phải false hoặc 'false'
    if (gender !== undefined) {
      const validGenders = ["MALE", "FEMALE", "OTHER", "male", "female", "other"];
      if (gender === false || gender === 'false' || gender === null || gender === '') {
        updateFields.gender = undefined;
      } else if (validGenders.includes(gender)) {
        updateFields.gender = gender;
      } else {
        // Nếu giá trị không hợp lệ, không set (giữ nguyên giá trị hiện tại)
        // Hoặc có thể throw error nếu muốn strict validation
      }
    }
    if (image !== undefined) updateFields.image = image;

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    }).select("-password");

    return updatedUser;
  } catch (error) {
    console.error("updateUserProfile error:", error);
    throw error;
  }
};
