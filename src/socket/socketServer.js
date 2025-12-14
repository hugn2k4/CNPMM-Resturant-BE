"use strict";

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

let io = null;

// Map để lưu userId -> socketId
const userSocketMap = new Map();

export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware để xác thực JWT
  io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
        
        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        socket.userId = decoded.userId;
        socket.user = user;
        next();
      } catch (error) {
        console.error("[Socket] Authentication error:", error.message);
        next(new Error("Authentication error"));
      }
    });

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.userId}`);

    // Lưu mapping userId -> socketId
    userSocketMap.set(socket.userId, socket.id);

    // Join room theo userId để dễ gửi notification
    socket.join(`user_${socket.userId}`);

    // Xử lý disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.userId}`);
      userSocketMap.delete(socket.userId);
    });

    // Xử lý join room (ví dụ: admin room)
    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`[Socket] User ${socket.userId} joined room: ${room}`);
    });

    // Xử lý leave room
    socket.on("leave_room", (room) => {
      socket.leave(room);
      console.log(`[Socket] User ${socket.userId} left room: ${room}`);
    });
  });

  return io;
};

// Hàm gửi notification đến user cụ thể
export const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    console.warn("[Socket] Socket server not initialized");
    return;
  }

  io.to(`user_${userId}`).emit("notification", notification);
  console.log(`[Socket] Notification sent to user ${userId}`);
};

// Hàm gửi notification đến nhiều users
export const sendNotificationToUsers = (userIds, notification) => {
  if (!io) {
    console.warn("[Socket] Socket server not initialized");
    return;
  }

  userIds.forEach((userId) => {
    io.to(`user_${userId}`).emit("notification", notification);
  });
  console.log(`[Socket] Notification sent to ${userIds.length} users`);
};

// Hàm gửi notification đến room (ví dụ: admin room)
export const sendNotificationToRoom = (room, notification) => {
  if (!io) {
    console.warn("[Socket] Socket server not initialized");
    return;
  }

  io.to(room).emit("notification", notification);
  console.log(`[Socket] Notification sent to room: ${room}`);
};

// Hàm broadcast notification
export const broadcastNotification = (notification) => {
  if (!io) {
    console.warn("[Socket] Socket server not initialized");
    return;
  }

  io.emit("notification", notification);
  console.log("[Socket] Notification broadcasted to all users");
};

export default io;