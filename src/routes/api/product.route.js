"use strict";

import express from "express";
import productController from "../../controller/product.controller.js";

const router = express.Router();

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
