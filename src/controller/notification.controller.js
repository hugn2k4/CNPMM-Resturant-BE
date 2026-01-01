"use strict";

import asyncHandler from "../middlewares/asyncHandler.js";
import notificationService from "../services/notification.service.js";

class NotificationController {
  // GET /api/notifications
  getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, isRead } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      isRead: isRead === "true" ? true : isRead === "false" ? false : null,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Notifications fetched successfully",
    });
  });

  // GET /api/notifications/unread-count
  getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
      message: "Unread count fetched successfully",
    });
  });

  // PUT /api/notifications/:id/read
  markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  });

  // PUT /api/notifications/read-all
  markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      data: result,
      message: "All notifications marked as read",
    });
  });

  // DELETE /api/notifications/:id
  deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.deleteNotification(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  });
}

export default new NotificationController();