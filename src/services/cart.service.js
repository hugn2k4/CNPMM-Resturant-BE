"use strict";

import Cart from "../models/cart.js";
import Product from "../models/product.js";

class CartService {
  // Lấy giỏ hàng của user
  async getCartByUserId(userId) {
    try {
      let cart = await Cart.findOne({ userId })
        .populate({
          path: 'items.productId',
          select: 'name price listProductImage status stock discount discountPrice',
          populate: {
            path: 'listProductImage',
            select: 'url alt'
          }
        });

      // Nếu chưa có giỏ hàng, tạo mới
      if (!cart) {
        cart = new Cart({ userId, items: [] });
        await cart.save();
      }

      return cart;
    } catch (error) {
      throw new Error(`Error fetching cart: ${error.message}`);
    }
  }

  // Thêm sản phẩm vào giỏ hàng
  async addItemToCart(userId, productId, quantity = 1) {
    try {
      // Kiểm tra sản phẩm có tồn tại và còn hàng không
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Sản phẩm không tồn tại");
      }

      if (product.status !== 'available') {
        throw new Error("Sản phẩm không khả dụng");
      }

      if (product.stock < quantity) {
        throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
      }

      // Lấy hoặc tạo giỏ hàng
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      // Tính giá (ưu tiên discountPrice nếu có)
      const itemPrice = product.discountPrice || product.price;

      // Kiểm tra sản phẩm đã có trong giỏ chưa
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId.toString()
      );

      if (existingItemIndex !== -1) {
        // Cập nhật số lượng
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        // Kiểm tra stock
        if (newQuantity > product.stock) {
          throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        // Cập nhật giá nếu giá hiện tại khác giá mới
        cart.items[existingItemIndex].price = itemPrice;
      } else {
        // Thêm mới vào giỏ
        cart.items.push({
          productId,
          quantity,
          price: itemPrice
        });
      }

      await cart.save();

      // Populate để trả về thông tin đầy đủ
      await cart.populate({
        path: 'items.productId',
        select: 'name price listProductImage status stock discount discountPrice',
        populate: {
          path: 'listProductImage',
          select: 'url alt'
        }
      });

      return cart;
    } catch (error) {
      throw new Error(`Error adding item to cart: ${error.message}`);
    }
  }

  // Cập nhật số lượng sản phẩm trong giỏ
  async updateItemQuantity(userId, productId, quantity) {
    try {
      if (quantity < 1) {
        throw new Error("Số lượng phải lớn hơn 0");
      }

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error("Giỏ hàng không tồn tại");
      }

      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId.toString()
      );

      if (itemIndex === -1) {
        throw new Error("Sản phẩm không có trong giỏ hàng");
      }

      // Kiểm tra stock
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Sản phẩm không tồn tại");
      }

      if (quantity > product.stock) {
        throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
      }

      cart.items[itemIndex].quantity = quantity;
      await cart.save();

      await cart.populate({
        path: 'items.productId',
        select: 'name price listProductImage status stock discount discountPrice',
        populate: {
          path: 'listProductImage',
          select: 'url alt'
        }
      });

      return cart;
    } catch (error) {
      throw new Error(`Error updating cart item: ${error.message}`);
    }
  }

  // Xóa sản phẩm khỏi giỏ hàng
  async removeItemFromCart(userId, productId) {
    try {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error("Giỏ hàng không tồn tại");
      }

      cart.items = cart.items.filter(
        item => item.productId.toString() !== productId.toString()
      );

      await cart.save();

      await cart.populate({
        path: 'items.productId',
        select: 'name price listProductImage status stock discount discountPrice',
        populate: {
          path: 'listProductImage',
          select: 'url alt'
        }
      });

      return cart;
    } catch (error) {
      throw new Error(`Error removing item from cart: ${error.message}`);
    }
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(userId) {
    try {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error("Giỏ hàng không tồn tại");
      }

      cart.items = [];
      await cart.save();

      return cart;
    } catch (error) {
      throw new Error(`Error clearing cart: ${error.message}`);
    }
  }

  // Lấy số lượng items trong giỏ hàng (để hiển thị badge)
  async getCartItemCount(userId) {
    try {
      const cart = await Cart.findOne({ userId });
      if (!cart || !cart.items || cart.items.length === 0) {
        return 0;
      }
      return cart.totalItems || cart.items.reduce((sum, item) => sum + item.quantity, 0);
    } catch (error) {
      return 0;
    }
  }
}

export default new CartService();

