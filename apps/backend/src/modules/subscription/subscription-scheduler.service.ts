import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    @InjectQueue('subscription-expiry')
    private subscriptionExpiryQueue: Queue,
    @InjectQueue('usage-reset')
    private usageResetQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Subscription scheduler initialized');
    // Run initial check on startup
    await this.scheduleExpiryCheck();
  }

  /**
   * Check for expired subscriptions every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleExpiryCheck() {
    this.logger.log('Scheduling subscription expiry check');
    await this.subscriptionExpiryQueue.add('check-expired', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  /**
   * Reset monthly usage on the first day of each month at midnight
   */
  @Cron('0 0 1 * *') // At 00:00 on day 1 of every month
  async scheduleMonthlyUsageReset() {
    this.logger.log('Scheduling monthly usage reset');
    await this.usageResetQueue.add('reset-monthly', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }
}
