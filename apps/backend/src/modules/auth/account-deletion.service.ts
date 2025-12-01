import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../../entities/user.entity';

/**
 * Service for handling account deletion with 30-day retention
 */
@Injectable()
export class AccountDeletionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Soft delete a user account
   * Sets deletedAt timestamp and schedules permanent deletion in 30 days
   */
  async softDeleteAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.deletedAt) {
      throw new Error('Account already marked for deletion');
    }

    const now = new Date();
    const permanentDeletionDate = new Date(now);
    permanentDeletionDate.setDate(permanentDeletionDate.getDate() + 30);

    user.deletedAt = now;
    user.permanentDeletionAt = permanentDeletionDate;

    await this.userRepository.save(user);
  }

  /**
   * Cancel account deletion (restore account)
   * Can only be done before permanent deletion
   */
  async cancelDeletion(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.deletedAt) {
      throw new Error('Account is not marked for deletion');
    }

    user.deletedAt = null;
    user.permanentDeletionAt = null;

    await this.userRepository.save(user);
  }

  /**
   * Permanently delete accounts that have passed the 30-day retention period
   * This should be run as a scheduled job
   */
  async permanentlyDeleteExpiredAccounts(): Promise<number> {
    const now = new Date();

    // Find all users scheduled for permanent deletion
    const usersToDelete = await this.userRepository.find({
      where: {
        permanentDeletionAt: LessThan(now),
      },
    });

    // Delete each user
    for (const user of usersToDelete) {
      await this.userRepository.remove(user);
    }

    return usersToDelete.length;
  }

  /**
   * Get accounts scheduled for deletion
   */
  async getScheduledDeletions(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        deletedAt: LessThan(new Date()),
      },
      order: {
        permanentDeletionAt: 'ASC',
      },
    });
  }

  /**
   * Get days remaining until permanent deletion
   */
  getDaysUntilPermanentDeletion(user: User): number | null {
    if (!user.permanentDeletionAt) {
      return null;
    }

    const now = new Date();
    const diff = user.permanentDeletionAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
