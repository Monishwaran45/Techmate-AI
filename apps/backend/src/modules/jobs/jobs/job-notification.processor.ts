import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JobMatch } from '../../../entities/job-match.entity';
import { User } from '../../../entities/user.entity';

export interface JobNotificationJob {
  userId: string;
  jobMatchId: string;
}

@Processor('job-notifications')
export class JobNotificationProcessor {
  private readonly logger = new Logger(JobNotificationProcessor.name);

  constructor(
    @InjectRepository(JobMatch)
    private readonly jobMatchRepository: Repository<JobMatch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Process('notify-new-jobs')
  async handleJobNotification(job: Job<JobNotificationJob>) {
    this.logger.log(
      `Processing job notification for user ${job.data.userId}, job match ${job.data.jobMatchId}`,
    );

    try {
      // Get user and job match
      const user = await this.userRepository.findOne({
        where: { id: job.data.userId },
        relations: ['profile'],
      });

      const jobMatch = await this.jobMatchRepository.findOne({
        where: { id: job.data.jobMatchId },
      });

      if (!user || !jobMatch) {
        this.logger.warn(
          `User or job match not found for notification job ${job.id}`,
        );
        return;
      }

      // Check if already notified
      if (jobMatch.notified) {
        this.logger.log(
          `Job match ${jobMatch.id} already notified, skipping`,
        );
        return;
      }

      // Send notification
      await this.sendNotification(user, jobMatch);

      // Mark as notified
      jobMatch.notified = true;
      await this.jobMatchRepository.save(jobMatch);

      this.logger.log(
        `Successfully sent job notification to ${user.email} for ${jobMatch.jobTitle} at ${jobMatch.company}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process job notification: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Process('check-new-jobs')
  async handleCheckNewJobs(job: Job<{ userId: string }>) {
    this.logger.log(`Checking for new jobs for user ${job.data.userId}`);

    try {
      // Find unnotified job matches created in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const unnotifiedMatches = await this.jobMatchRepository.find({
        where: {
          userId: job.data.userId,
          notified: false,
          createdAt: LessThan(twentyFourHoursAgo),
        },
        order: { matchScore: 'DESC' },
      });

      if (unnotifiedMatches.length === 0) {
        this.logger.log(`No new jobs to notify for user ${job.data.userId}`);
        return;
      }

      this.logger.log(
        `Found ${unnotifiedMatches.length} new job matches for user ${job.data.userId}`,
      );

      // Get user for notification
      const user = await this.userRepository.findOne({
        where: { id: job.data.userId },
        relations: ['profile'],
      });

      if (!user) {
        this.logger.warn(`User ${job.data.userId} not found`);
        return;
      }

      // Send batch notification for all new matches
      await this.sendBatchNotification(user, unnotifiedMatches);

      // Mark all as notified
      for (const match of unnotifiedMatches) {
        match.notified = true;
      }
      await this.jobMatchRepository.save(unnotifiedMatches);

      this.logger.log(
        `Successfully notified user ${user.email} about ${unnotifiedMatches.length} new job matches`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to check new jobs: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Send notification for a single job match
   */
  private async sendNotification(
    user: User,
    jobMatch: JobMatch,
  ): Promise<void> {
    const userName = user.profile?.name || user.email;

    // In a real implementation, this would send an email or push notification
    // For now, we'll just log it
    this.logger.log(`
      ===== Job Notification =====
      To: ${user.email}
      Subject: New Job Match: ${jobMatch.jobTitle} at ${jobMatch.company}
      
      Hi ${userName},
      
      We found a new job that matches your preferences!
      
      Position: ${jobMatch.jobTitle}
      Company: ${jobMatch.company}
      Location: ${jobMatch.location || 'Not specified'}
      Match Score: ${jobMatch.matchScore}%
      
      Why this matches:
      ${jobMatch.matchReasons.map((reason) => `- ${reason}`).join('\n      ')}
      
      ${jobMatch.jobUrl ? `Apply here: ${jobMatch.jobUrl}` : ''}
      
      Good luck with your application!
      
      Best regards,
      TechMate AI Team
      ============================
    `);

    // TODO: Integrate with email service
    // await this.emailService.send({
    //   to: user.email,
    //   subject: `New Job Match: ${jobMatch.jobTitle} at ${jobMatch.company}`,
    //   template: 'job-notification',
    //   context: {
    //     userName,
    //     jobTitle: jobMatch.jobTitle,
    //     company: jobMatch.company,
    //     location: jobMatch.location,
    //     matchScore: jobMatch.matchScore,
    //     matchReasons: jobMatch.matchReasons,
    //     jobUrl: jobMatch.jobUrl,
    //     description: jobMatch.description,
    //   },
    // });

    // TODO: Send push notification if user has enabled it
    // await this.pushNotificationService.send({
    //   userId: user.id,
    //   title: 'New Job Match!',
    //   body: `${jobMatch.jobTitle} at ${jobMatch.company} - ${jobMatch.matchScore}% match`,
    //   data: {
    //     type: 'job_match',
    //     jobMatchId: jobMatch.id,
    //   },
    // });
  }

  /**
   * Send batch notification for multiple job matches
   */
  private async sendBatchNotification(
    user: User,
    jobMatches: JobMatch[],
  ): Promise<void> {
    const userName = user.profile?.name || user.email;
    const topMatches = jobMatches.slice(0, 5); // Show top 5 in email

    // In a real implementation, this would send an email or push notification
    this.logger.log(`
      ===== Job Batch Notification =====
      To: ${user.email}
      Subject: ${jobMatches.length} New Job Matches Found!
      
      Hi ${userName},
      
      We found ${jobMatches.length} new jobs that match your preferences!
      
      Top Matches:
      ${topMatches
        .map(
          (match, index) => `
      ${index + 1}. ${match.jobTitle} at ${match.company}
         Match Score: ${match.matchScore}%
         Location: ${match.location || 'Not specified'}
         ${match.jobUrl ? `Apply: ${match.jobUrl}` : ''}
      `,
        )
        .join('\n')}
      
      ${jobMatches.length > 5 ? `\nAnd ${jobMatches.length - 5} more matches waiting for you!` : ''}
      
      Log in to TechMate AI to view all your job matches and apply.
      
      Best regards,
      TechMate AI Team
      ==================================
    `);

    // TODO: Integrate with email service
    // await this.emailService.send({
    //   to: user.email,
    //   subject: `${jobMatches.length} New Job Matches Found!`,
    //   template: 'job-batch-notification',
    //   context: {
    //     userName,
    //     totalMatches: jobMatches.length,
    //     topMatches: topMatches.map(match => ({
    //       jobTitle: match.jobTitle,
    //       company: match.company,
    //       location: match.location,
    //       matchScore: match.matchScore,
    //       jobUrl: match.jobUrl,
    //     })),
    //   },
    // });

    // TODO: Send push notification
    // await this.pushNotificationService.send({
    //   userId: user.id,
    //   title: 'New Job Matches!',
    //   body: `${jobMatches.length} new jobs match your preferences`,
    //   data: {
    //     type: 'job_matches',
    //     count: jobMatches.length,
    //   },
    // });
  }
}
