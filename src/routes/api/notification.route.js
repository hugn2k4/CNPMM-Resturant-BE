"use strict";

import { Router } from "express";
import notificationController from "../../controller/notification.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

// Tất cả routes đều cần authentication
router.use(authenticateUser);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/:id/read", notificationController.markAsRead);
router.put("/read-all", notificationController.markAllAsRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;