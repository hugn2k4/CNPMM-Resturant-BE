// src/routes/api/index.js
import { Router } from "express";
import authRoute from "./auth.route.js";   // NHỚ có .js

export default function initApiRoutes(app) {
  const router = Router();

  // test nhanh
  router.get("/ping", (_req, res) => res.send("api ok"));

  // nhóm auth -> /api/auth/*
  router.use("/auth", authRoute);

  // mount dưới /api
  app.use("/api", router);

  console.log("[routes] mounted: /api, /api/ping, /api/auth/*");
}
