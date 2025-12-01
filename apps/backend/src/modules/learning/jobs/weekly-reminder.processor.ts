import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roadmap } from '../../../entities/roadmap.entity';
import { User } from '../../../entities/user.entity';

export interface WeeklyReminderJob {
  userId: string;
  roadmapId: string;
}

@Processor('learning-reminders')
export class WeeklyReminderProcessor {
  private readonly logger = new Logger(WeeklyReminderProcessor.name);

  constructor(
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Process('weekly-reminder')
  async handleWeeklyReminder(job: Job<WeeklyReminderJob>) {
    this.logger.log(
      `Processing weekly reminder for user ${job.data.userId}, roadmap ${job.data.roadmapId}`,
    );

    try {
      // Get user and roadmap
      const user = await this.userRepository.findOne({
        where: { id: job.data.userId },
      });

      const roadmap = await this.roadmapRepository.findOne({
        where: { id: job.data.roadmapId },
        relations: ['milestones'],
      });

      if (!user || !roadmap) {
        this.logger.warn(
          `User or roadmap not found for reminder job ${job.id}`,
        );
        return;
      }

      // Calculate progress
      const completedMilestones = roadmap.milestones.filter(
        (m) => m.completed,
      ).length;
      const totalMilestones = roadmap.milestones.length;
      const progressPercentage =
        totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

      // In a real implementation, this would send an email
      // For now, we'll just log it
      this.logger.log(
        `Weekly reminder sent to ${user.email}: ${roadmap.title} - ${progressPercentage}% complete`,
      );

      // TODO: Integrate with email service
      // await this.emailService.send({
      //   to: user.email,
      //   subject: `Weekly Learning Update: ${roadmap.title}`,
      //   template: 'weekly-reminder',
      //   context: {
      //     userName: user.profile?.name || user.email,
      //     roadmapTitle: roadmap.title,
      //     completedMilestones,
      //     totalMilestones,
      //     progressPercentage,
      //   },
      // });
    } catch (error) {
      this.logger.error(
        `Failed to process weekly reminder: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
