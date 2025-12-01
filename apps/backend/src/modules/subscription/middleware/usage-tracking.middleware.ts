import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../subscription.service';

/**
 * Middleware to track API usage for subscription limits
 * This can be applied to specific routes that need usage tracking
 */
@Injectable()
export class UsageTrackingMiddleware implements NestMiddleware {
  constructor(private subscriptionService: SubscriptionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    const feature = (req as any).usageFeature; // Set by route decorator

    if (user && feature) {
      try {
        // Track usage after successful response
        res.on('finish', async () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            await this.subscriptionService.trackUsage(user.id, feature, 1);
          }
        });
      } catch (error) {
        // Don't block request if tracking fails
        console.error('Usage tracking error:', error);
      }
    }

    next();
  }
}
