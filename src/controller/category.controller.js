"use strict";

import categoryService from "../services/category.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class CategoryController {
  // GET /api/categories
  getAllCategories = asyncHandler(async (req, res) => {
    const { isActive } = req.query;
    const categories = await categoryService.getAllCategories({ 
      isActive: isActive === 'false' ? false : isActive === 'true' ? true : undefined 
    });

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories
    });
  });

  // GET /api/categories/:id
  getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);

    res.status(200).json({
      success: true,
      message: 'Category fetched successfully',
      data: category
    });
  });

  // GET /api/categories/slug/:slug
  getCategoryBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);

    res.status(200).json({
      success: true,
      message: 'Category fetched successfully',
      data: category
    });
  });

  // POST /api/categories
  createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  });

  // PUT /api/categories/:id
  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  });

  // DELETE /api/categories/:id
  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await categoryService.deleteCategory(id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });
}

export default new CategoryController();
