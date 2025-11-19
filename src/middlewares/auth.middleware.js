import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Middleware để verify JWT token
export function jwtGuard(req, res, next) {
  // Lấy token từ cookie hoặc Authorization header
  const raw = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];

  if (!raw) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - No token provided",
    });
  }

  try {
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// Middleware để verify và lấy thông tin user đầy đủ
export async function authenticateUser(req, res, next) {
  const raw = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];

  if (!raw) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - No token provided",
    });
  }

  try {
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);

    // Lấy thông tin user từ database
    const user = await User.findOne({
      $or: [{ email: decoded.email }, { _id: decoded.uid }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    // Attach user info to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// Middleware để check role
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Insufficient permissions",
      });
    }

    next();
  };
}
