import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title must not be empty' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    enum: ['todo', 'in_progress', 'done'],
    description: 'Task status',
  })
  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'], {
    message: 'Status must be one of: todo, in_progress, done',
  })
  status?: 'todo' | 'in_progress' | 'done';

  @ApiPropertyOptional({
    enum: ['low', 'medium', 'high'],
    description: 'Task priority',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], {
    message: 'Priority must be one of: low, medium, high',
  })
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: 'Due date in ISO format' })
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string;
}
