import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobMatch } from '../../entities/job-match.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class JobNotificationService {
  private readonly logger = new Logger(JobNotificationService.name);

  constructor(
    @InjectQueue('job-notifications')
    private readonly jobNotificationQueue: Queue,
    @InjectRepository(JobMatch)
    private readonly jobMatchRepository: Repository<JobMatch>,
  ) {}

  /**
   * Schedule a notification for a new job match
   * Notification will be sent within 24 hours
   */
  async scheduleJobNotification(
    userId: string,
    jobMatchId: string,
  ): Promise<void> {
    // Calculate delay (random time within 24 hours to avoid spam)
    // For immediate testing, we can use a shorter delay
    const maxDelayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const minDelayMs = 5 * 60 * 1000; // 5 minutes minimum
    const delayMs =
      Math.floor(Math.random() * (maxDelayMs - minDelayMs)) + minDelayMs;

    await this.jobNotificationQueue.add(
      'notify-new-jobs',
      {
        userId,
        jobMatchId,
      },
      {
        delay: delayMs,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Scheduled job notification for user ${userId}, job match ${jobMatchId} with delay ${Math.round(delayMs / 1000 / 60)} minutes`,
    );
  }

  /**
   * Schedule notifications for multiple job matches
   */
  async scheduleMultipleNotifications(
    userId: string,
    jobMatchIds: string[],
  ): Promise<void> {
    for (const jobMatchId of jobMatchIds) {
      await this.scheduleJobNotification(userId, jobMatchId);
    }

    this.logger.log(
      `Scheduled ${jobMatchIds.length} job notifications for user ${userId}`,
    );
  }

  /**
   * Check for new jobs periodically (runs every 6 hours)
   * This is a background job that checks if there are unnotified matches
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkForNewJobs(): Promise<void> {
    this.logger.log('Running periodic check for new jobs');

    try {
      // Find all users with unnotified job matches
      const unnotifiedMatches = await this.jobMatchRepository
        .createQueryBuilder('jobMatch')
        .select('DISTINCT jobMatch.userId', 'userId')
        .where('jobMatch.notified = :notified', { notified: false })
        .getRawMany();

      const userIds = unnotifiedMatches.map((m) => m.userId);

      if (userIds.length === 0) {
        this.logger.log('No users with unnotified job matches');
        return;
      }

      this.logger.log(
        `Found ${userIds.length} users with unnotified job matches`,
      );

      // Schedule check jobs for each user
      for (const userId of userIds) {
        await this.jobNotificationQueue.add(
          'check-new-jobs',
          { userId },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }

      this.logger.log(
        `Scheduled check-new-jobs for ${userIds.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to check for new jobs: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  /**
   * Manually trigger notification check for a specific user
   */
  async triggerNotificationCheck(userId: string): Promise<void> {
    await this.jobNotificationQueue.add(
      'check-new-jobs',
      { userId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`Manually triggered notification check for user ${userId}`);
  }

  /**
   * Get notification queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.jobNotificationQueue.getWaitingCount(),
      this.jobNotificationQueue.getActiveCount(),
      this.jobNotificationQueue.getCompletedCount(),
      this.jobNotificationQueue.getFailedCount(),
      this.jobNotificationQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }
}
