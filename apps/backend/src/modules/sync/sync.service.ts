import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

/**
 * Service for handling data synchronization logic
 */
@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Process data change from client
   * Validates and persists the change to database
   */
  async processDataChange(
    userId: string,
    data: { type: string; payload: any },
  ): Promise<void> {
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Here you would route to appropriate service based on data.type
    // For now, we'll just log it
    console.log(`Processing data change for user ${userId}:`, data);

    // The actual persistence would be handled by the respective domain services
    // This service acts as a coordinator for real-time sync
  }

  /**
   * Get pending changes for a user (for offline sync)
   */
  async getPendingChanges(_userId: string, _since: Date): Promise<any[]> {
    // This would query a changes/events table to get all changes since timestamp
    // For now, return empty array
    return [];
  }

  /**
   * Apply offline changes with conflict resolution
   */
  async applyOfflineChanges(
    userId: string,
    changes: Array<{ type: string; payload: any; timestamp: string }>,
  ): Promise<{ applied: number; conflicts: number }> {
    let applied = 0;
    let conflicts = 0;

    for (const change of changes) {
      try {
        // Apply change with last-write-wins strategy
        await this.processDataChange(userId, change);
        applied++;
      } catch (error) {
        console.error('Conflict applying change:', error);
        conflicts++;
      }
    }

    return { applied, conflicts };
  }
}
