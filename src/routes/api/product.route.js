"use strict";

import express from "express";
import productController from "../../controller/product.controller.js";

const router = express.Router();

// ===== API TRANG CHỦ =====
// GET /api/products/home - Lấy tất cả dữ liệu cho trang chủ
router.get("/home", productController.getHomePageData);

// GET /api/products/newest - Lấy sản phẩm mới nhất
router.get("/newest", productController.getNewestProducts);

// GET /api/products/best-selling - Lấy sản phẩm bán chạy nhất
router.get("/best-selling", productController.getBestSellingProducts);

// GET /api/products/most-viewed - Lấy sản phẩm được xem nhiều nhất
router.get("/most-viewed", productController.getMostViewedProducts);

// GET /api/products/top-discount - Lấy sản phẩm khuyến mãi cao nhất
router.get("/top-discount", productController.getTopDiscountProducts);

// ===== API CŨ =====
// GET /api/products/featured - Lấy sản phẩm nổi bật
router.get("/featured", productController.getFeaturedProducts);

// GET /api/products/category/:categoryId - Lấy sản phẩm theo danh mục
router.get("/category/:categoryId", productController.getProductsByCategory);

// GET /api/products/:id - Lấy chi tiết sản phẩm
router.get("/:id", productController.getProductById);

// GET /api/products - Lấy danh sách sản phẩm
router.get("/", productController.getAllProducts);

// POST /api/products - Tạo sản phẩm mới (cần auth admin)
router.post("/", productController.createProduct);

// PUT /api/products/:id - Cập nhật sản phẩm (cần auth admin)
router.put("/:id", productController.updateProduct);

// DELETE /api/products/:id - Xóa sản phẩm (cần auth admin)
router.delete("/:id", productController.deleteProduct);

// PATCH /api/products/:id/stock - Cập nhật tồn kho (cần auth admin)
router.patch("/:id/stock", productController.updateStock);

export default router;