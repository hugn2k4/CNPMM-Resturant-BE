import ChatMessage from "../models/chatMessage.js";

class ChatService {
  // Lưu tin nhắn vào database
  async saveMessage(userId, message, senderType) {
    try {
      const chatMessage = await ChatMessage.create({
        userId,
        message,
        senderType,
      });

      return await chatMessage.populate("userId", "fullname email avatar");
    } catch (error) {
      throw new Error(`Error saving message: ${error.message}`);
    }
  }

  // Lấy lịch sử chat của user
  async getChatHistory(userId, limit = 50, skip = 0) {
    try {
      const messages = await ChatMessage.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate("userId", "fullname email avatar");

      return messages.reverse(); // Đảo ngược để tin nhắn cũ nhất ở đầu
    } catch (error) {
      throw new Error(`Error getting chat history: ${error.message}`);
    }
  }

  // Đánh dấu tin nhắn đã đọc
  async markMessagesAsRead(userId, messageIds) {
    try {
      const result = await ChatMessage.updateMany(
        {
          _id: { $in: messageIds },
          userId: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

      return result;
    } catch (error) {
      throw new Error(`Error marking messages as read: ${error.message}`);
    }
  }

  // Lấy số lượng tin nhắn chưa đọc
  async getUnreadCount(userId) {
    try {
      const count = await ChatMessage.countDocuments({
        userId,
        senderType: "admin",
        isRead: false,
      });

      return count;
    } catch (error) {
      throw new Error(`Error getting unread count: ${error.message}`);
    }
  }

  // Lấy danh sách tất cả các cuộc hội thoại (cho admin)
  async getAllConversations(limit = 20, skip = 0) {
    try {
      // Lấy các user có tin nhắn
      const conversations = await ChatMessage.aggregate([
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: "$userId",
            lastMessage: { $first: "$message" },
            lastMessageTime: { $first: "$createdAt" },
            unreadCount: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$senderType", "user"] }, { $eq: ["$isRead", false] }] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { lastMessageTime: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            userId: "$_id",
            lastMessage: 1,
            lastMessageTime: 1,
            unreadCount: 1,
            user: {
              _id: "$user._id",
              fullname: "$user.fullname",
              email: "$user.email",
              avatar: "$user.avatar",
            },
          },
        },
      ]);

      return conversations;
    } catch (error) {
      throw new Error(`Error getting conversations: ${error.message}`);
    }
  }

  // Xóa lịch sử chat
  async deleteConversation(userId) {
    try {
      const result = await ChatMessage.deleteMany({ userId });
      return result;
    } catch (error) {
      throw new Error(`Error deleting conversation: ${error.message}`);
    }
  }
}

export default new ChatService();
