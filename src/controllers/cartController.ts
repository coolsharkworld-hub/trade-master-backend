import { Request, Response } from 'express';
import { CartService } from '../services/cartService';
import logger from '../config/logger';

export class CartController {
  private cartService: CartService;

  constructor(cartService: CartService) {
    this.cartService = cartService;
  }

  addToCart = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { courseId } = req.body;

      if (!courseId || isNaN(parseInt(courseId))) {
        res.status(400).json({
          success: false,
          message: 'Valid course ID is required',
        });
        return;
      }

      const item = await this.cartService.addToCart(
        req.user.id,
        parseInt(courseId),
      );

      logger.info(`Course ${courseId} added to cart for user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Course added to cart successfully',
        item,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Add to cart error:', error);

      if (err.message === 'Course not found') {
        res.status(404).json({
          success: false,
          message: err.message
        });
      } else if (err.message === 'Course already in cart') {
        res.status(409).json({
          success: false,
          message: err.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  };

  removeFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { courseId } = req.params;

      if (!courseId || isNaN(parseInt(courseId))) {
        res.status(400).json({
          success: false,
          message: 'Valid course ID is required',
        });
        return;
      }

      const removed = await this.cartService.removeFromCart(
        req.user.id,
        parseInt(courseId),
      );

      if (!removed) {
        res.status(404).json({
          success: false,
          message: 'Course not found in cart',
        });
        return;
      }

      logger.info(
        `Course ${courseId} removed from cart for user ${req.user.id}`,
      );

      res.status(200).json({
        success: true,
        message: 'Course removed from cart successfully',
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };

  getCart = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const cart = await this.cartService.getItems(req.user.id, req.query.bought == 'true');

      res.status(200).json({
        success: true,
        message: 'Cart retrieved successfully',
        cart,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };

  clearCart = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const cleared = await this.cartService.clearCart(req.user.id, req.query.bought == 'true');

      if (!cleared) {
        res.status(404).json({
          success: false,
          message: 'Cart is already empty',
        });
        return;
      }

      logger.info(`Cart cleared for user ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };

  getCartItemCount = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const count = await this.cartService.getCartItemCount(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Cart item count retrieved successfully',
        count,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Get cart item count error:', error);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };

  checkItemInCart = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const courseId = parseInt(req.params.courseId);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Valid course ID is required',
        });
        return;
      }

      const isInCart = await this.cartService.isInCart(req.user.id, courseId);

      res.status(200).json({
        success: true,
        message: 'Cart item status retrieved successfully',
        isInCart,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Check item in cart error:', error);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };
}
