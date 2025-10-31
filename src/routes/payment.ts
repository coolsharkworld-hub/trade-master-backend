import { Router } from 'express';
import dotenv from 'dotenv';

import { PaymentController } from '../controllers/paymentController';
import { StripeService } from '../services/stripeService';

dotenv.config();

const router = Router();
const stripeService = new StripeService(
  process.env.STRIPE_SECRET_KEY || 'sk_test',
);
const paymentController = new PaymentController(stripeService);

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Stripe Payment
 */

const createPaymentRouter = () => {
  /**
   * @swagger
   * /api/payment:
   *   post:
   *     summary: Create payment
   *     tags: [Payment]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePayment'
   *           example:
   *             amount: 15
   *             currency: "USD"
   *     responses:
   *       200:
   *         description: Payment created successfully
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
   *                   example: "User registered successfully"
   *                 intent:
   *                   type: object
   *       500:
   *         description: Failed to create payment
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Failed to create payment"
   *               error: "..."
   */
  router.post('/', paymentController.createPayment.bind(paymentController));

  /**
   * @swagger
   * /api/payment/{id}:
   *   get:
   *     summary: Retrieve payment
   *     tags: [Payment]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Payment ID
   *     responses:
   *       200:
   *         description: Retrieve payment successfully
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
   *                   example: "Course deleted successfully"
   *                 intent:
   *                   type: object
   *       500:
   *         description: Failed to retrieve payment
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Failed to retrieve payment"
   *               error: "..."
   */
  router.get('/:id', paymentController.retrievePayment.bind(paymentController));
  return router;
};

export default createPaymentRouter;
