import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ProductivityController } from './productivity.controller';
import { ProductivityService } from './productivity.service';
import { Task } from '../../entities/task.entity';
import { Note } from '../../entities/note.entity';
import { TimerSession } from '../../entities/timer-session.entity';
import { Reminder } from '../../entities/reminder.entity';
import { User } from '../../entities/user.entity';
import { AIModule } from '../ai/ai.module';
import { ReminderCheckProcessor } from './jobs/reminder-check.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Note, TimerSession, Reminder, User]),
    BullModule.registerQueue({
      name: 'productivity-reminders',
    }),
    AIModule,
    CacheModule.register({
      ttl: 3600, // 1 hour cache TTL
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [ProductivityController],
  providers: [ProductivityService, ReminderCheckProcessor],
  exports: [ProductivityService],
})
export class ProductivityModule {}
