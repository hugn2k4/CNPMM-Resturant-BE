"use strict";

import productService from "../services/product.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class ProductController {
  // GET /api/products - Lấy danh sách sản phẩm
  getAllProducts = asyncHandler(async (req, res) => {
    const { page, limit, categoryId, status, search, sortBy, sortOrder } = req.query;
    
    const result = await productService.getAllProducts({
      page,
      limit,
      categoryId,
      status,
      search,
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: result
    });
  });

  // GET /api/products/featured - Lấy sản phẩm nổi bật
  getFeaturedProducts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const products = await productService.getFeaturedProducts(limit);

    res.status(200).json({
      success: true,
      message: 'Featured products fetched successfully',
      data: products
    });
  });

  // GET /api/products/:id - Lấy chi tiết sản phẩm
  getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      message: 'Product fetched successfully',
      data: product
    });
  });

  // POST /api/products - Tạo sản phẩm mới
  createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  });

  // PUT /api/products/:id - Cập nhật sản phẩm
  updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  });

  // DELETE /api/products/:id - Xóa sản phẩm
  deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  // PATCH /api/products/:id/stock - Cập nhật tồn kho
  updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    const product = await productService.updateStock(id, quantity, operation);

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });
  });

  // GET /api/products/category/:categoryId - Lấy sản phẩm theo danh mục
  getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { page, limit } = req.query;

    const result = await productService.getProductsByCategory(categoryId, { page, limit });

    res.status(200).json({
      success: true,
      message: 'Products by category fetched successfully',
      data: result
    });
  });
}

export default new ProductController();
