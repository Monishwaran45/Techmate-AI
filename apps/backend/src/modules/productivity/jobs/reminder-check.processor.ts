import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Reminder } from '../../../entities/reminder.entity';
// User is loaded via relation, not directly queried

export interface ReminderCheckJob {
  checkTime: Date;
}

@Processor('productivity-reminders')
export class ReminderCheckProcessor {
  private readonly logger = new Logger(ReminderCheckProcessor.name);

  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
  ) {}

  @Process('check-reminders')
  async handleReminderCheck(job: Job<ReminderCheckJob>) {
    this.logger.log(`Checking for due reminders at ${job.data.checkTime}`);

    try {
      // Find all unsent reminders that are due (scheduled time <= current time)
      const dueReminders = await this.reminderRepository.find({
        where: {
          sent: false,
          scheduledFor: LessThanOrEqual(job.data.checkTime),
        },
        relations: ['user'],
      });

      this.logger.log(`Found ${dueReminders.length} due reminders`);

      // Process each reminder
      for (const reminder of dueReminders) {
        try {
          await this.sendReminder(reminder);
        } catch (error) {
          this.logger.error(
            `Failed to send reminder ${reminder.id}: ${(error as Error).message}`,
            (error as Error).stack,
          );
          // Continue processing other reminders even if one fails
        }
      }

      this.logger.log(`Completed reminder check job ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process reminder check: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private async sendReminder(reminder: Reminder): Promise<void> {
    this.logger.log(
      `Sending reminder ${reminder.id} to user ${reminder.userId}`,
    );

    // In a real implementation, this would send an email or push notification
    // For now, we'll just log it and mark as sent
    this.logger.log(
      `Reminder notification sent to ${reminder.user.email}: ${reminder.message}`,
    );

    // TODO: Integrate with notification service
    // await this.notificationService.send({
    //   to: reminder.user.email,
    //   subject: 'Reminder from TechMate AI',
    //   template: 'reminder',
    //   context: {
    //     userName: reminder.user.profile?.name || reminder.user.email,
    //     message: reminder.message,
    //     scheduledFor: reminder.scheduledFor,
    //   },
    // });

    // Mark reminder as sent
    reminder.sent = true;
    reminder.sentAt = new Date();
    await this.reminderRepository.save(reminder);

    this.logger.log(`Reminder ${reminder.id} marked as sent`);
  }
}
