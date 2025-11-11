import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import connect from "./config/configdb.js";
// serve API/health endpoints only
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import errorHandler from "./middlewares/errorHandler.js";
import initApiRoutes from "./routes/api/index.js";
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kiểm tra file .env có tồn tại không
const envPath = path.resolve(__dirname, '../.env');
console.log('Đường dẫn file .env:', envPath);
console.log('File .env tồn tại:', fs.existsSync(envPath));

// Load env file
dotenv.config({ path: envPath });

console.log('=== KIỂM TRA BIẾN MÔI TRƯỜNG ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'CHƯA ĐƯỢC SET');
console.log('SMTP_USER:', process.env.SMTP_USER || 'CHƯA ĐƯỢC SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'ĐÃ SET' : 'CHƯA SET');
console.log('PORT:', process.env.PORT || '8080 (mặc định)');
console.log('=== KẾT THÚC KIỂM TRA ===');
// built-in body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// security middlewares
app.use(helmet());
// In development allow the React dev server origin or echo origin for convenience
const corsOptions =
  process.env.NODE_ENV === "development"
    ? { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], credentials: true }
    : {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
      };
app.use(cors(corsOptions));
// No explicit app.options needed — `app.use(cors(corsOptions))` above handles CORS and preflight.
// Remove the explicit options route which caused path-to-regexp errors on some setups.
app.set("trust proxy", 1);
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }));
app.use(cookieParser());

// connect to DB
connect();

// simple health/landing route: show DB connection status
app.get("/", (req, res) => {
  const state = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
  const ok = state === 1;
  const html = `<!doctype html><html><head><title>API</title></head><body><h1>${
    ok ? "Connected to DB" : "Not connected"
  }</h1><p>DB state: ${state}</p></body></html>`;
  if (ok) return res.status(200).send(html);
  return res.status(503).send(html);
});

// mount API routes
initApiRoutes(app);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Backend nodejs is running on the port: " + port);
});

// error handler (last middleware)
app.use(errorHandler);
