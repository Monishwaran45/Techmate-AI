import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountDeletionService } from '../account-deletion.service';

/**
 * Scheduled job processor for permanent account deletion
 * Runs daily to delete accounts that have passed the 30-day retention period
 */
@Injectable()
export class AccountDeletionProcessor {
  private readonly logger = new Logger(AccountDeletionProcessor.name);

  constructor(
    private readonly accountDeletionService: AccountDeletionService,
  ) {}

  /**
   * Run daily at midnight to permanently delete expired accounts
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePermanentDeletion() {
    this.logger.log('Running permanent account deletion job');

    try {
      const deletedCount =
        await this.accountDeletionService.permanentlyDeleteExpiredAccounts();

      this.logger.log(`Permanently deleted ${deletedCount} accounts`);
    } catch (error) {
      this.logger.error('Failed to permanently delete accounts', error);
    }
  }
}
