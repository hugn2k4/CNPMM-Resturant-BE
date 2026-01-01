"use strict";

import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/user.js";
import chatService from "../services/chat.service.js";

let io = null;

const userSocketMap = new Map();
const adminSocketMap = new Map(); // Track admin connections

export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.userId || decoded.uid;
      let user = null;

      if (userId) {
        user = await User.findById(userId);
      }

      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email });
      }

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      const finalUserId = user._id.toString();

      socket.userId = finalUserId;
      socket.user = user;
      next();
    } catch (error) {
      console.error("[Socket] Authentication error:", error.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userIdStr = String(socket.userId);
    userSocketMap.set(userIdStr, socket.id);
    socket.join(`user_${userIdStr}`);

    // Check if user is admin
    if (socket.user && socket.user.role === "admin") {
      adminSocketMap.set(userIdStr, socket.id);
      socket.join("admin_room");
      console.log(`[Socket] Admin connected: ${socket.user.email}`);
    }

    console.log(`[Socket] User connected: ${userIdStr}`);

    // Handle chat message from user
    socket.on("chat:send_message", async (data) => {
      try {
        const { message } = data;

        if (!message || !message.trim()) {
          socket.emit("chat:error", { message: "Message cannot be empty" });
          return;
        }

        // Save message to database
        const savedMessage = await chatService.saveMessage(socket.userId, message.trim(), "user");

        // Send confirmation to sender
        socket.emit("chat:message_sent", {
          message: savedMessage,
          tempId: data.tempId, // For client-side message tracking
        });

        // Notify all admins about new message
        io.to("admin_room").emit("chat:new_user_message", {
          message: savedMessage,
          userId: socket.userId,
        });

        console.log(`[Chat] Message from user ${socket.userId}: ${message.substring(0, 50)}`);
      } catch (error) {
        console.error("[Chat] Error sending message:", error);
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    // Handle chat message from admin
    socket.on("chat:admin_send_message", async (data) => {
      try {
        const { message, targetUserId } = data;

        if (!socket.user || socket.user.role !== "admin") {
          socket.emit("chat:error", { message: "Unauthorized" });
          return;
        }

        if (!message || !message.trim() || !targetUserId) {
          socket.emit("chat:error", { message: "Invalid data" });
          return;
        }

        // Save message to database
        const savedMessage = await chatService.saveMessage(targetUserId, message.trim(), "admin");

        // Send to target user
        io.to(`user_${targetUserId}`).emit("chat:new_message", {
          message: savedMessage,
        });

        // Send confirmation to admin
        socket.emit("chat:message_sent", {
          message: savedMessage,
          tempId: data.tempId,
        });

        console.log(`[Chat] Admin message to user ${targetUserId}: ${message.substring(0, 50)}`);
      } catch (error) {
        console.error("[Chat] Error sending admin message:", error);
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("chat:typing", (data) => {
      const { isTyping, targetUserId } = data;

      if (socket.user && socket.user.role === "admin" && targetUserId) {
        // Admin typing to user
        io.to(`user_${targetUserId}`).emit("chat:admin_typing", { isTyping });
      } else {
        // User typing to admin
        io.to("admin_room").emit("chat:user_typing", {
          userId: socket.userId,
          isTyping,
        });
      }
    });

    // Handle mark messages as read
    socket.on("chat:mark_read", async (data) => {
      try {
        const { messageIds } = data;

        if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
          await chatService.markMessagesAsRead(socket.userId, messageIds);
          socket.emit("chat:marked_read", { messageIds });
        }
      } catch (error) {
        console.error("[Chat] Error marking messages as read:", error);
      }
    });

    socket.on("disconnect", () => {
      const userIdStr = String(socket.userId);
      userSocketMap.delete(userIdStr);

      if (socket.user && socket.user.role === "admin") {
        adminSocketMap.delete(userIdStr);
      }

      console.log(`[Socket] User disconnected: ${userIdStr}`);
    });

    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("leave_room", (room) => {
      socket.leave(room);
    });
  });

  return io;
};

export const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    return;
  }

  const room = `user_${userId}`;
  io.to(room).emit("notification", notification);
};

export const sendNotificationToUsers = (userIds, notification) => {
  if (!io) {
    return;
  }

  userIds.forEach((userId) => {
    io.to(`user_${userId}`).emit("notification", notification);
  });
};

export const sendNotificationToRoom = (room, notification) => {
  if (!io) {
    return;
  }

  io.to(room).emit("notification", notification);
};

export const broadcastNotification = (notification) => {
  if (!io) {
    return;
  }

  io.emit("notification", notification);
};

export default io;
