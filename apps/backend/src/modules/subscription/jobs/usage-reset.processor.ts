import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../../entities/subscription.entity';
import { SubscriptionTier } from '../subscription.service';

@Processor('usage-reset')
@Injectable()
export class UsageResetProcessor {
  private readonly logger = new Logger(UsageResetProcessor.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  @Process('reset-monthly')
  async handleMonthlyReset(): Promise<void> {
    this.logger.log('Starting monthly usage reset...');

    try {
      // Reset usage for all free-tier subscriptions
      const freeSubscriptions = await this.subscriptionRepository.find({
        where: {
          tier: SubscriptionTier.FREE,
        },
      });

      this.logger.log(
        `Resetting usage for ${freeSubscriptions.length} free-tier subscriptions`,
      );

      for (const subscription of freeSubscriptions) {
        try {
          subscription.usageTracking = {};
          await this.subscriptionRepository.save(subscription);
        } catch (error) {
          this.logger.error(
            `Failed to reset usage for subscription ${subscription.id}`,
            error,
          );
        }
      }

      this.logger.log('Monthly usage reset completed');
    } catch (error) {
      this.logger.error('Error during monthly usage reset', error);
      throw error;
    }
  }
}
