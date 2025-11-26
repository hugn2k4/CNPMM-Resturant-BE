// src/controller/user.controller.js
import * as userService from "../services/user.service.js";

// GET /api/users/profile - Get current user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        role: user.role,
        image: user.image,
        avatar: user.image, // alias for consistency
      },
    });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

// PUT /api/users/profile - Update current user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, phoneNumber, dateOfBirth, gender, image } = req.body;

    const updatedUser = await userService.updateUserProfile(userId, {
      fullName,
      phoneNumber,
      dateOfBirth,
      gender,
      image,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser._id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        role: updatedUser.role,
        image: updatedUser.image,
        avatar: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};
