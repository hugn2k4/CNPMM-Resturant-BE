"use strict";

import cartService from "../services/cart.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class CartController {
  // Lấy giỏ hàng của user hiện tại
  getCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const cart = await cartService.getCartByUserId(userId);
    
    res.status(200).json({
      success: true,
      message: 'Cart fetched successfully',
      data: cart
    });
  });

  // Thêm sản phẩm vào giỏ hàng
  addItem = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const cart = await cartService.addItemToCart(userId, productId, quantity);
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  });

  // Cập nhật số lượng sản phẩm
  updateItemQuantity = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await cartService.updateItemQuantity(userId, productId, quantity);
    
    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    });
  });

  // Xóa sản phẩm khỏi giỏ hàng
  removeItem = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await cartService.removeItemFromCart(userId, productId);
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });
  });

  // Xóa toàn bộ giỏ hàng
  clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const cart = await cartService.clearCart(userId);
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  });

  // Lấy số lượng items trong giỏ hàng (cho badge)
  getCartItemCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const count = await cartService.getCartItemCount(userId);
    
    res.status(200).json({
      success: true,
      message: 'Cart item count fetched successfully',
      data: { count }
    });
  });
}

export default new CartController();

