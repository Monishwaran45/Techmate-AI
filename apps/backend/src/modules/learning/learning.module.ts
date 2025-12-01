import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { Roadmap } from '../../entities/roadmap.entity';
import { Milestone } from '../../entities/milestone.entity';
import { Progress } from '../../entities/progress.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { AIModule } from '../ai/ai.module';
import { WeeklyReminderProcessor } from './jobs/weekly-reminder.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roadmap, Milestone, Progress, User, UserProfile]),
    BullModule.registerQueue({
      name: 'learning-reminders',
    }),
    AIModule,
  ],
  controllers: [LearningController],
  providers: [LearningService, WeeklyReminderProcessor],
  exports: [LearningService],
})
export class LearningModule {}
