import express from "express";
import authRoutes from "./auth.js";

const router = express.Router();

const initApiRoutes = (app) => {
  router.use("/auth", authRoutes);
  app.use("/api", router);
};

export default initApiRoutes;
