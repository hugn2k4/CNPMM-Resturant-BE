"use strict";

import express from "express";
import categoryController from "../../controller/category.controller.js";

const router = express.Router();

// GET /api/categories/slug/:slug - Lấy category theo slug
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// GET /api/categories/:id - Lấy category theo ID
router.get("/:id", categoryController.getCategoryById);

// GET /api/categories - Lấy tất cả categories
router.get("/", categoryController.getAllCategories);

// POST /api/categories - Tạo category mới (cần auth admin)
router.post("/", categoryController.createCategory);

// PUT /api/categories/:id - Cập nhật category (cần auth admin)
router.put("/:id", categoryController.updateCategory);

// DELETE /api/categories/:id - Xóa category (cần auth admin)
router.delete("/:id", categoryController.deleteCategory);

export default router;
