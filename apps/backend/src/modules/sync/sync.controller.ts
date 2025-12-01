import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService } from './sync.service';

/**
 * Controller for handling data synchronization endpoints
 */
@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * Apply offline changes with conflict resolution
   */
  @Post('apply')
  async applyOfflineChanges(
    @Request() req,
    @Body() body: { type: string; payload: any; timestamp: string },
  ) {
    const userId = req.user.sub;

    await this.syncService.processDataChange(userId, {
      type: body.type,
      payload: body.payload,
    });

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Apply multiple offline changes in batch
   */
  @Post('apply-batch')
  async applyBatchChanges(
    @Request() req,
    @Body() body: { changes: Array<{ type: string; payload: any; timestamp: string }> },
  ) {
    const userId = req.user.sub;

    const result = await this.syncService.applyOfflineChanges(
      userId,
      body.changes,
    );

    return {
      success: true,
      applied: result.applied,
      conflicts: result.conflicts,
      timestamp: new Date().toISOString(),
    };
  }
}
