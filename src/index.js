import dotenv from "dotenv";
import express from "express";
import connect from "./config/configdb.js";
// serve API/health endpoints only
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import errorHandler from "./middlewares/errorHandler.js";
import initApiRoutes from "./routes/api/index.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

// built-in body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// security middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.set("trust proxy", 1);
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }));

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

function printRoutes() {
  const st = app._router?.stack || [];
  console.log("[boot] routes:");
  st.filter(l => l.route).forEach(l =>
    console.log(" -", Object.keys(l.route.methods).join(","), l.route.path)
  );
}
printRoutes();

