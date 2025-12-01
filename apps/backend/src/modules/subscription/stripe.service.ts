import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionService, SubscriptionTier } from './subscription.service';

@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    private subscriptionService: SubscriptionService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey || apiKey.startsWith('sk_test_your')) {
      this.logger.warn('STRIPE_SECRET_KEY is not configured. Payment features will not work.');
    } else {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
  }

  private ensureStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
    }
    return this.stripe;
  }

  async createCustomer(email: string, userId: string): Promise<string> {
    const customer = await this.ensureStripe().customers.create({
      email,
      metadata: {
        userId,
      },
    });

    return customer.id;
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    userId: string,
    tier: SubscriptionTier,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.ensureStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        tier,
      },
    });

    return subscription;
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<void> {
    await this.ensureStripe().paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    await this.ensureStripe().customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  async cancelSubscription(
    stripeSubscriptionId: string,
  ): Promise<Stripe.Subscription> {
    // Cancel at period end to maintain access until billing period ends
    return this.ensureStripe().subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.ensureStripe().webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleSubscriptionUpdate(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = subscription.metadata.userId;
    const tier = subscription.metadata.tier as SubscriptionTier;

    if (!userId || !tier) {
      console.error('Missing userId or tier in subscription metadata');
      return;
    }

    // Update subscription in database
    await this.subscriptionService.updateSubscriptionTier(
      userId,
      tier,
      subscription.id,
    );
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = subscription.metadata.userId;

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    // Expire subscription and revert to free tier
    await this.subscriptionService.expireSubscription(userId);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment succeeded for invoice: ${invoice.id}`);
    // Additional logic can be added here (e.g., send receipt email)
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment failed for invoice: ${invoice.id}`);
    // Additional logic can be added here (e.g., send payment failure notification)
  }

  async getPriceId(tier: SubscriptionTier): Promise<string> {
    // In production, these would be actual Stripe price IDs
    // For now, return mock IDs that would be configured via environment variables
    const priceIds = {
      [SubscriptionTier.PREMIUM]: this.configService.get<string>(
        'STRIPE_PREMIUM_PRICE_ID',
        'price_premium_monthly',
      ),
      [SubscriptionTier.ENTERPRISE]: this.configService.get<string>(
        'STRIPE_ENTERPRISE_PRICE_ID',
        'price_enterprise_monthly',
      ),
    };

    return priceIds[tier] || '';
  }
}
