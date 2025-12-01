import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { ResumeParserService } from './resume-parser.service';
import { ResumeScoringService } from './resume-scoring.service';
import { ResumeOptimizationService } from './resume-optimization.service';
import { JobMatchingService } from './job-matching.service';
import { JobNotificationService } from './job-notification.service';
import { JobNotificationProcessor } from './jobs/job-notification.processor';
import { Resume } from '../../entities/resume.entity';
import { ResumeScore } from '../../entities/resume-score.entity';
import { JobMatch } from '../../entities/job-match.entity';
import { User } from '../../entities/user.entity';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume, ResumeScore, JobMatch, User]),
    BullModule.registerQueue({
      name: 'job-notifications',
    }),
    ScheduleModule.forRoot(),
    AIModule,
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    ResumeParserService,
    ResumeScoringService,
    ResumeOptimizationService,
    JobMatchingService,
    JobNotificationService,
    JobNotificationProcessor,
  ],
  exports: [JobsService, JobNotificationService],
})
export class JobsModule {}
