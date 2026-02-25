import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: any;
  private razorpay: any;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (stripeKey) {
      const Stripe = require('stripe');
      this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    }

    const razorpayKeyId = this.configService.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = this.configService.get('RAZORPAY_KEY_SECRET');
    if (razorpayKeyId && razorpayKeySecret) {
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
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

  // ── Razorpay ───────────────────────────────────────────────

  async createRazorpayOrder(bookingId: string, amount: number, currency: string = 'INR'): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> {
    if (!this.razorpay) {
      // Return a mock response for development if Razorpay is not configured
      this.logger.warn('Razorpay not configured, returning mock order');
      return {
        orderId: `order_${Date.now()}`,
        amount,
        currency,
        keyId: this.configService.get('RAZORPAY_KEY_ID') || 'rzp_test_demo',
      };
    }

    const order = await this.razorpay.orders.create({
      amount,
      currency: currency.toUpperCase(),
      receipt: `receipt_${bookingId.slice(-8)}`,
      notes: { bookingId },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.configService.get('RAZORPAY_KEY_ID'),
    };
  }

  verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = this.configService.get('RAZORPAY_KEY_SECRET', '');
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    return expectedSignature === signature;
  }
}
