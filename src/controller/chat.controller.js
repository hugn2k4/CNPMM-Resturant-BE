import asyncHandler from "../middlewares/asyncHandler.js";
import chatService from "../services/chat.service.js";

// Lấy lịch sử chat
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const skip = parseInt(req.query.skip) || 0;

  const messages = await chatService.getChatHistory(userId, limit, skip);

  res.status(200).json({
    success: true,
    data: messages,
  });
});

// Gửi tin nhắn (qua API, ngoài WebSocket)
export const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message is required",
    });
  }

  const savedMessage = await chatService.saveMessage(userId, message.trim(), "user");

  res.status(201).json({
    success: true,
    data: savedMessage,
  });
});

// Đánh dấu tin nhắn đã đọc
export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { messageIds } = req.body;

  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Message IDs are required",
    });
  }

  await chatService.markMessagesAsRead(userId, messageIds);

  res.status(200).json({
    success: true,
    message: "Messages marked as read",
  });
});

// Lấy số lượng tin nhắn chưa đọc
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await chatService.getUnreadCount(userId);

  res.status(200).json({
    success: true,
    data: { count },
  });
});

// Admin: Lấy danh sách tất cả các cuộc hội thoại
export const getAllConversations = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const skip = parseInt(req.query.skip) || 0;

  const conversations = await chatService.getAllConversations(limit, skip);

  res.status(200).json({
    success: true,
    data: conversations,
  });
});

// Admin: Lấy lịch sử chat của một user cụ thể
export const getUserChatHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const skip = parseInt(req.query.skip) || 0;

  const messages = await chatService.getChatHistory(userId, limit, skip);

  res.status(200).json({
    success: true,
    data: messages,
  });
});

// Admin: Xóa cuộc hội thoại
export const deleteConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  await chatService.deleteConversation(userId);

  res.status(200).json({
    success: true,
    message: "Conversation deleted successfully",
  });
});
