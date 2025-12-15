import express from "express";
import {
  deleteConversation,
  getAllConversations,
  getChatHistory,
  getUnreadCount,
  getUserChatHistory,
  markAsRead,
  sendMessage,
} from "../../controller/chat.controller.js";
import { authenticateUser, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// User routes
router.get("/history", authenticateUser, getChatHistory);
router.post("/send", authenticateUser, sendMessage);
router.post("/mark-read", authenticateUser, markAsRead);
router.get("/unread-count", authenticateUser, getUnreadCount);

// Admin routes (require admin role)
router.get("/admin/conversations", authenticateUser, requireRole("admin"), getAllConversations);
router.get("/admin/conversation/:userId", authenticateUser, requireRole("admin"), getUserChatHistory);
router.delete("/admin/conversation/:userId", authenticateUser, requireRole("admin"), deleteConversation);

export default router;
