import { Request, Response } from 'express';
import { StripeService } from '../services/stripeService';

export class PaymentController {
  private stripeService: StripeService;

  constructor(stripeService: StripeService) {
    this.stripeService = stripeService;
  }

  public async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentIntent = await this.stripeService.createPaymentIntent({
        ...req.body,
      });
      res.status(200).json({
        success: true,
        message: 'Payment created successfully',
        intent: paymentIntent,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to create payment',
        error: message,
      });
    }
  }

  public async retrievePayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentIntent = await this.stripeService.retrievePaymentIntent(
        req.params.id,
      );
      res.status(200).json({
        success: true,
        message: 'Retrieve payment successsfully',
        intent: paymentIntent,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment',
        error: message,
      });
    }
  }
}
