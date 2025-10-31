import express from 'express';
import { CartController } from '../controllers/cartController';
import { CartService } from '../services/cartService';
import { createAuthMiddleware } from '../middleware/auth';
import { Pool } from 'pg';

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management endpoints
 */

const createCartRouter = (db: Pool, jwtSecret: string) => {
  const router = express.Router();
  const cartService = new CartService(db);
  const cartController = new CartController(cartService);
  const authMiddleware = createAuthMiddleware(db, jwtSecret);

  // All cart routes require authentication (both user and admin can use cart)
  router.use(authMiddleware.authenticate);

  /**
   * @swagger
   * /api/cart/count:
   *   get:
   *     summary: Get cart item count
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Cart count retrieved successfully"
   *                 count:
   *                   type: integer
   *                   example: 3
   *                   description: Total number of items in cart
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  router.get('/count', cartController.getCartItemCount);

  /**
   * @swagger
   * /api/cart:
   *   get:
   *     summary: Get user's cart items
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bought
   *         schema:
   *            type: boolean
   *         description: Filter products by bought state
   *         required: true
   *     responses:
   *       200:
   *         description: Cart items retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Cart items retrieved successfully"
   *                 cart:
   *                   type: object
   *                   properties:
   *                     items:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/CartItem'
   *                     total:
   *                       type: number
   *                       example: 1299.98
   *                     itemCount:
   *                       type: integer
   *                       example: 2
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  router.get('/', cartController.getCart);

  /**
   * @swagger
   * /api/cart:
   *   post:
   *     summary: Add item to cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - courseId
   *             properties:
   *               courseId:
   *                 type: integer
   *                 example: 1
   *                 description: ID of the course to add to cart
   *     responses:
   *       201:
   *         description: Item added to cart successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Item added to cart successfully"
   *                 cartItem:
   *                   $ref: '#/components/schemas/CartItem'
   *                 cartSummary:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: number
   *                       example: 1299.98
   *                     itemCount:
   *                       type: integer
   *                       example: 2
   *       400:
   *         description: Validation error or item already in cart
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               validation_error:
   *                 value:
   *                   success: false
   *                   message: "Validation error"
   *                   error: "Course ID is required"
   *               already_in_cart:
   *                 value:
   *                   success: false
   *                   message: "Item already in cart"
   *                   error: "This course is already in your cart"
   *       404:
   *         description: Course not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Course not found"
   *               error: "The requested course does not exist"
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  router.post('/', cartController.addToCart);

  /**
   * @swagger
   * /api/cart/items/{courseId}:
   *   delete:
   *     summary: Remove item from cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Course ID to remove from cart
   *         example: 1
   *     responses:
   *       200:
   *         description: Item removed from cart successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Item removed from cart successfully"
   *                 cartSummary:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: number
   *                       example: 649.99
   *                     itemCount:
   *                       type: integer
   *                       example: 1
   *       404:
   *         description: Cart item not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Cart item not found"
   *               error: "This item is not in your cart"
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       400:
   *         description: Invalid course ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Validation error"
   *               error: "Invalid course ID"
   */
  router.delete('/items/:courseId', cartController.removeFromCart);

  /**
   * @swagger
   * /api/cart/clear:
   *   delete:
   *     summary: Clear all items from cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bought
   *         schema:
   *            type: boolean
   *         description: Filter products by bought state
   *         required: true
   *     responses:
   *       200:
   *         description: Cart cleared successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Cart cleared successfully"
   *                 cartSummary:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: number
   *                       example: 0
   *                     itemCount:
   *                       type: integer
   *                       example: 0
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  router.delete('/clear', cartController.clearCart);

  return router;
};

export default createCartRouter;
