import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionService, SubscriptionTier } from './subscription.service';
import { StripeService } from './stripe.service';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved' })
  async getSubscription(@Request() req) {
    return this.subscriptionService.getSubscription(req.user.id);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get usage statistics for current billing period' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved' })
  async getUsageStats(@Request() req) {
    return this.subscriptionService.getUsageStats(req.user.id);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade subscription to premium tier' })
  @ApiResponse({ status: 200, description: 'Subscription upgraded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment method or tier' })
  async upgradeSubscription(
    @Request() req,
    @Body() upgradeDto: UpgradeSubscriptionDto,
  ) {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get or create Stripe customer
    let subscription = await this.subscriptionService.getSubscription(userId);
    
    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      customerId = await this.stripeService.createCustomer(userEmail, userId);
      subscription.stripeCustomerId = customerId;
    }

    // Attach payment method if provided
    if (upgradeDto.paymentMethodId) {
      await this.stripeService.attachPaymentMethod(
        customerId,
        upgradeDto.paymentMethodId,
      );
    }

    // Get price ID for the tier
    const tier = upgradeDto.tier as unknown as SubscriptionTier;
    const priceId = await this.stripeService.getPriceId(tier);

    // Create Stripe subscription
    const stripeSubscription = await this.stripeService.createSubscription(
      customerId,
      priceId,
      userId,
      tier,
    );

    // Update local subscription
    const updatedSubscription = await this.subscriptionService.updateSubscriptionTier(
      userId,
      tier,
      stripeSubscription.id,
    );

    return {
      subscription: updatedSubscription,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent
        ?.client_secret,
    };
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription (maintains access until end of billing period)' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(@Request() req) {
    const subscription = await this.subscriptionService.getSubscription(
      req.user.id,
    );

    if (subscription.stripeSubscriptionId) {
      await this.stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
      );
    }

    return this.subscriptionService.cancelSubscription(req.user.id);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint for payment events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing request body');
    }

    return this.stripeService.handleWebhook(rawBody, signature);
  }
}
