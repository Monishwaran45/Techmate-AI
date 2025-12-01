import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService, FEATURE_GATES } from '../subscription.service';
import { TRACK_USAGE_KEY } from '../decorators/track-usage.decorator';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string>(
      TRACK_USAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!feature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if feature is a usage-limited feature
    const usageLimitFeatures = Object.keys(FEATURE_GATES.FREE_LIMITS);
    
    if (!usageLimitFeatures.includes(feature)) {
      return true;
    }

    // Check usage limit
    const withinLimit = await this.subscriptionService.checkUsageLimit(
      userId,
      feature as any,
    );

    if (!withinLimit) {
      const subscription = await this.subscriptionService.getSubscription(userId);
      const limit = FEATURE_GATES.FREE_LIMITS[feature as keyof typeof FEATURE_GATES.FREE_LIMITS];
      const currentUsage = subscription.usageTracking?.[feature] || 0;

      throw new ForbiddenException({
        message: `You have reached your monthly limit for ${feature}`,
        feature,
        limit,
        currentUsage,
        upgradeRequired: true,
      });
    }

    return true;
  }
}
