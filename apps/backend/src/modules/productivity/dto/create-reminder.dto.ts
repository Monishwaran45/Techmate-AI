import {
  IsString,
  IsNotEmpty,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsSanitizedString } from '../../../common/validators/sanitize.validator';

export class CreateReminderDto {
  @ApiProperty({
    description: 'Reminder message',
    example: 'Review project documentation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(1, { message: 'Message must not be empty' })
  @MaxLength(500, { message: 'Message must not exceed 500 characters' })
  @IsSanitizedString(500)
  @Transform(({ value }) => value?.trim())
  message: string;

  @ApiProperty({
    description: 'Scheduled time for the reminder (ISO 8601 format)',
    example: '2024-12-01T10:00:00Z',
  })
  @IsDateString({}, { message: 'Scheduled time must be a valid ISO date string' })
  scheduledFor: string;
}
