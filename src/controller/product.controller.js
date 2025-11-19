"use strict";

import productService from "../services/product.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class ProductController {
  // Lấy tất cả sản phẩm
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

  // Lấy chi tiết sản phẩm
  getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    
    res.status(200).json({
      success: true,
      message: 'Product fetched successfully',
      data: product
    });
  });

  // Tạo sản phẩm mới
  createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  });

  // Cập nhật sản phẩm
  updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  });

  // Xóa sản phẩm
  deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  // Cập nhật tồn kho
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

  // Lấy sản phẩm theo category
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

  // Lấy sản phẩm featured
  getFeaturedProducts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const products = await productService.getFeaturedProducts(parseInt(limit) || 10);
    
    res.status(200).json({
      success: true,
      message: 'Featured products fetched successfully',
      data: products
    });
  });

  // ===== CÁC API MỚI CHO TRANG CHỦ =====

  // Lấy sản phẩm mới nhất
  getNewestProducts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const products = await productService.getNewestProducts(parseInt(limit) || 8);
    
    res.status(200).json({
      success: true,
      message: 'Newest products fetched successfully',
      data: products
    });
  });

  // Lấy sản phẩm bán chạy nhất
  getBestSellingProducts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const products = await productService.getBestSellingProducts(parseInt(limit) || 6);
    
    res.status(200).json({
      success: true,
      message: 'Best selling products fetched successfully',
      data: products
    });
  });

  // Lấy sản phẩm được xem nhiều nhất
  getMostViewedProducts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const products = await productService.getMostViewedProducts(parseInt(limit) || 8);
    
    res.status(200).json({
      success: true,
      message: 'Most viewed products fetched successfully',
      data: products
    });
  });

  // Lấy sản phẩm khuyến mãi cao nhất
  getTopDiscountProducts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const products = await productService.getTopDiscountProducts(parseInt(limit) || 4);
    
    res.status(200).json({
      success: true,
      message: 'Top discount products fetched successfully',
      data: products
    });
  });

  // Lấy tất cả dữ liệu cho trang chủ
  getHomePageData = asyncHandler(async (req, res) => {
    const data = await productService.getHomePageData();
    
    res.status(200).json({
      success: true,
      message: 'Home page data fetched successfully',
      data
    });
  });
}

export default new ProductController();