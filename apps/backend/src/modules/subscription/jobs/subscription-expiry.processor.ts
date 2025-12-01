import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription } from '../../../entities/subscription.entity';
import { SubscriptionService, SubscriptionStatus } from '../subscription.service';

@Processor('subscription-expiry')
@Injectable()
export class SubscriptionExpiryProcessor {
  private readonly logger = new Logger(SubscriptionExpiryProcessor.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private subscriptionService: SubscriptionService,
  ) {}

  @Process('check-expired')
  async handleExpiryCheck(): Promise<void> {
    this.logger.log('Checking for expired subscriptions...');

    try {
      // Find all subscriptions that have expired (endDate < now) and are still active or cancelled
      const now = new Date();
      const expiredSubscriptions = await this.subscriptionRepository.find({
        where: [
          {
            endDate: LessThan(now),
            status: SubscriptionStatus.ACTIVE,
          },
          {
            endDate: LessThan(now),
            status: SubscriptionStatus.CANCELLED,
          },
        ],
      });

      this.logger.log(
        `Found ${expiredSubscriptions.length} expired subscriptions`,
      );

      // Process each expired subscription
      for (const subscription of expiredSubscriptions) {
        try {
          await this.subscriptionService.expireSubscription(
            subscription.userId,
          );
          this.logger.log(
            `Expired subscription for user ${subscription.userId}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to expire subscription for user ${subscription.userId}`,
            error,
          );
        }
      }

      this.logger.log('Subscription expiry check completed');
    } catch (error) {
      this.logger.error('Error during subscription expiry check', error);
      throw error;
    }
  }
}
