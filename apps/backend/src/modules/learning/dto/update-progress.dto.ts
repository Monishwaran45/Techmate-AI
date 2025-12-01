import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export class UpdateProgressDto {
  @ApiProperty({
    description: 'Progress status',
    enum: ProgressStatus,
    example: ProgressStatus.COMPLETED,
  })
  @IsEnum(ProgressStatus)
  @IsOptional()
  status?: ProgressStatus;
}
