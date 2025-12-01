import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { Subscription } from '../../entities/subscription.entity';
import { SubscriptionService } from './subscription.service';
import { StripeService } from './stripe.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionExpiryProcessor } from './jobs/subscription-expiry.processor';
import { UsageResetProcessor } from './jobs/usage-reset.processor';
import { SubscriptionSchedulerService } from './subscription-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    ConfigModule,
    BullModule.registerQueue(
      {
        name: 'subscription-expiry',
      },
      {
        name: 'usage-reset',
      },
    ),
    ScheduleModule.forRoot(),
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    StripeService,
    SubscriptionExpiryProcessor,
    UsageResetProcessor,
    SubscriptionSchedulerService,
  ],
  exports: [SubscriptionService, StripeService],
})
export class SubscriptionModule {}
