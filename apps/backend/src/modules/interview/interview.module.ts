import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { VoiceService } from './voice.service';
import { InterviewSession } from '../../entities/interview-session.entity';
import { Question } from '../../entities/question.entity';
import { Answer } from '../../entities/answer.entity';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InterviewSession, Question, Answer]),
    AIModule,
    ConfigModule,
  ],
  controllers: [InterviewController],
  providers: [InterviewService, VoiceService],
  exports: [InterviewService, VoiceService],
})
export class InterviewModule {}
