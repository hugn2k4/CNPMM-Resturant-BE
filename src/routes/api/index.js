// src/routes/api/index.js
import { Router } from "express";
import authRoute from "./auth.route.js";
import categoryRoute from "./category.route.js";
import orderRoute from "./order.route.js";
import productRoute from "./product.route.js";
import reviewRoute from "./review.route.js";
import userRoute from "./user.route.js";

export default function initApiRoutes(app) {
  const router = Router();

  // test nhanh
  router.get("/ping", (_req, res) => res.send("api ok"));

  // nhóm auth -> /api/auth/*
  router.use("/auth", authRoute);

  // nhóm products -> /api/products/*
  router.use("/products", productRoute);

  // nhóm categories -> /api/categories/*
  router.use("/categories", categoryRoute);

  // nhóm reviews -> /api/reviews/*
  router.use("/reviews", reviewRoute);

  // nhóm users -> /api/users/*
  router.use("/users", userRoute);

  // nhóm orders -> /api/orders/*
  router.use("/orders", orderRoute);

  // mount dưới /api
  app.use("/api", router);

  console.log(
    "[routes] mounted: /api, /api/ping, /api/auth/*, /api/products/*, /api/categories/*, /api/reviews/*, /api/users/*, /api/orders/*"
  );
}
