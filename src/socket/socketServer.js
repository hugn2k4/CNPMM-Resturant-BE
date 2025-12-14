"use strict";

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

let io = null;

const userSocketMap = new Map();

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

    socket.on("disconnect", () => {
      const userIdStr = String(socket.userId);
      userSocketMap.delete(userIdStr);
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