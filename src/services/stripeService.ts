import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2020-08-27' });
  }

  public async createPaymentIntent(data: { amount: number; currency: string }) {

    return await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      //set Application fee amount
      // application_fee_amount: data.amount * 0.03,
    
    });
  }

  public async retrievePaymentIntent(id: string) {
    return await this.stripe.paymentIntents.retrieve(id);
  }
}
