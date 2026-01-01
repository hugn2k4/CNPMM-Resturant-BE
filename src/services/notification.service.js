"use strict";

import Notification from "../models/notification.js";
import User from "../models/user.js";
import emailService from "./emailService.js";

class NotificationService {
  // Tạo notification và gửi email
  async createNotification(userId, type, title, message, data = {}, sendEmail = true) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data,
      });

      await notification.save();

      // Gửi email nếu được yêu cầu
      if (sendEmail) {
        const user = await User.findById(userId);
        if (user && user.email) {
          const emailSent = await emailService.sendNotificationEmail(
            user.email,
            title,
            message,
            type
          );
          notification.emailSent = emailSent;
          await notification.save();
        }
      }

      return notification;
    } catch (error) {
      console.error("[NotificationService] Error creating notification:", error);
      throw error;
    }
  }

  // Tạo notification cho nhiều users (ví dụ: admin)
  async createNotificationForUsers(userIds, type, title, message, data = {}) {
    try {
      const notifications = userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        data,
      }));

      const created = await Notification.insertMany(notifications);

      // Gửi email cho tất cả users
      for (const notification of created) {
        const user = await User.findById(notification.userId);
        if (user && user.email) {
          const emailSent = await emailService.sendNotificationEmail(
            user.email,
            title,
            message,
            type
          );
          notification.emailSent = emailSent;
          await notification.save();
        }
      }

      return created;
    } catch (error) {
      console.error("[NotificationService] Error creating notifications:", error);
      throw error;
    }
  }

  // Lấy notifications của user
  async getUserNotifications(userId, { page = 1, limit = 20, isRead = null } = {}) {
    try {
      const query = { userId };
      if (isRead !== null) {
        query.isRead = isRead;
      }

      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("[NotificationService] Error fetching notifications:", error);
      throw error;
    }
  }

  // Đánh dấu đã đọc
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      console.error("[NotificationService] Error marking as read:", error);
      throw error;
    }
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return result;
    } catch (error) {
      console.error("[NotificationService] Error marking all as read:", error);
      throw error;
    }
  }

  // Đếm số notification chưa đọc
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        isRead: false,
      });
      return count;
    } catch (error) {
      console.error("[NotificationService] Error getting unread count:", error);
      throw error;
    }
  }

  // Xóa notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId,
      });

      return notification;
    } catch (error) {
      console.error("[NotificationService] Error deleting notification:", error);
      throw error;
    }
  }
}

export default new NotificationService();