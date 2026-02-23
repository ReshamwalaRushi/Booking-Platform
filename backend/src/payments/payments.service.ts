import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: any;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (stripeKey) {
      const Stripe = require('stripe');
      this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd', metadata: Record<string, string> = {}): Promise<any> {
    if (!this.stripe) {
      throw new BadRequestException('Payment service not configured');
    }
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    });
    return paymentIntent;
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    if (!this.stripe) {
      throw new BadRequestException('Payment service not configured');
    }
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<any> {
    if (!this.stripe) {
      throw new BadRequestException('Payment service not configured');
    }
    const params: any = { payment_intent: paymentIntentId };
    if (amount) params.amount = amount;
    return this.stripe.refunds.create(params);
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<any> {
    if (!this.stripe) {
      throw new BadRequestException('Payment service not configured');
    }
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        this.logger.log(`Payment succeeded: ${event.data.object.id}`);
        break;
      case 'payment_intent.payment_failed':
        this.logger.log(`Payment failed: ${event.data.object.id}`);
        break;
    }

    return { received: true };
  }
}
