"use strict";

import Product from "../models/product.js";
import Category from "../models/category.js";
import Image from "../models/image.js";

class ProductService {
  // Lấy tất cả sản phẩm với filter và pagination
  async getAllProducts({ page = 1, limit = 20, categoryId, status, search, sortBy = 'createdAt', sortOrder = 'desc' }) {
    try {
      const query = { isDeleted: false };

      // Filter by category
      if (categoryId) {
        query.categoryId = categoryId;
      }

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Search by name or description
      if (search) {
        query.$text = { $search: search };
      }

      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('categoryId', 'name slug image')
          .populate('listProductImage', 'url alt')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query)
      ]);

      return {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
  }

  // Lấy chi tiết sản phẩm theo ID
  async getProductById(productId) {
    try {
      const product = await Product.findOne({ _id: productId, isDeleted: false })
        .populate('categoryId', 'name slug image')
        .populate('listProductImage', 'url alt')
        .populate({
          path: 'listReview',
          populate: {
            path: 'userId',
            select: 'firstName lastName image'
          },
          options: { sort: { createdAt: -1 } }
        })
        .lean();

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      throw new Error(`Error fetching product: ${error.message}`);
    }
  }

  // Tạo sản phẩm mới
  async createProduct(productData) {
    try {
      // Verify category exists
      const category = await Category.findById(productData.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      const product = new Product(productData);
      await product.save();
      
      return await this.getProductById(product._id);
    } catch (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }
  }

  // Cập nhật sản phẩm
  async updateProduct(productId, updateData) {
    try {
      // Verify category if being updated
      if (updateData.categoryId) {
        const category = await Category.findById(updateData.categoryId);
        if (!category) {
          throw new Error('Category not found');
        }
      }

      const product = await Product.findOneAndUpdate(
        { _id: productId, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      return await this.getProductById(product._id);
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  // Xóa sản phẩm (soft delete)
  async deleteProduct(productId) {
    try {
      const product = await Product.findOneAndUpdate(
        { _id: productId, isDeleted: false },
        { $set: { isDeleted: true, status: 'unavailable' } },
        { new: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  // Cập nhật stock
  async updateStock(productId, quantity, operation = 'set') {
    try {
      const product = await Product.findOne({ _id: productId, isDeleted: false });
      
      if (!product) {
        throw new Error('Product not found');
      }

      let newStock;
      if (operation === 'set') {
        newStock = quantity;
      } else if (operation === 'increase') {
        newStock = product.stock + quantity;
      } else if (operation === 'decrease') {
        newStock = product.stock - quantity;
        if (newStock < 0) {
          throw new Error('Insufficient stock');
        }
      }

      product.stock = newStock;
      
      // Auto update status based on stock
      if (newStock === 0) {
        product.status = 'out_of_stock';
      } else if (product.status === 'out_of_stock') {
        product.status = 'available';
      }

      await product.save();
      return await this.getProductById(product._id);
    } catch (error) {
      throw new Error(`Error updating stock: ${error.message}`);
    }
  }

  // Lấy sản phẩm theo category
  async getProductsByCategory(categoryId, { page = 1, limit = 20 }) {
    return await this.getAllProducts({ page, limit, categoryId });
  }

  // Lấy sản phẩm featured/popular
  async getFeaturedProducts(limit = 10) {
    try {
      const products = await Product.find({ 
        isDeleted: false, 
        status: 'available',
        stock: { $gt: 0 }
      })
        .populate('categoryId', 'name slug image')
        .populate('listProductImage', 'url alt')
        .sort({ rating: -1, reviewCount: -1 })
        .limit(limit)
        .lean();

      return products;
    } catch (error) {
      throw new Error(`Error fetching featured products: ${error.message}`);
    }
  }
}

export default new ProductService();
