"use strict";

import Category from "../models/category.js";

class CategoryService {
  // Lấy tất cả categories
  async getAllCategories({ isActive = true } = {}) {
    try {
      const query = isActive !== undefined ? { isActive } : {};
      
      const categories = await Category.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .lean();

      return categories;
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  }

  // Lấy category theo ID
  async getCategoryById(categoryId) {
    try {
      const category = await Category.findById(categoryId).lean();
      
      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      throw new Error(`Error fetching category: ${error.message}`);
    }
  }

  // Lấy category theo slug
  async getCategoryBySlug(slug) {
    try {
      const category = await Category.findOne({ slug }).lean();
      
      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      throw new Error(`Error fetching category: ${error.message}`);
    }
  }

  // Tạo category mới
  async createCategory(categoryData) {
    try {
      const category = new Category(categoryData);
      await category.save();
      
      return category;
    } catch (error) {
      throw new Error(`Error creating category: ${error.message}`);
    }
  }

  // Cập nhật category
  async updateCategory(categoryId, updateData) {
    try {
      const category = await Category.findByIdAndUpdate(
        categoryId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      throw new Error(`Error updating category: ${error.message}`);
    }
  }

  // Xóa category
  async deleteCategory(categoryId) {
    try {
      const Product = (await import("../models/product.js")).default;
      
      // Check if any products use this category
      const productsCount = await Product.countDocuments({ 
        categoryId, 
        isDeleted: false 
      });

      if (productsCount > 0) {
        throw new Error(`Cannot delete category with ${productsCount} active products`);
      }

      const category = await Category.findByIdAndDelete(categoryId);

      if (!category) {
        throw new Error('Category not found');
      }

      return { message: 'Category deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }
  }
}

export default new CategoryService();
