import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTasksDto {
  @ApiPropertyOptional({
    enum: ['todo', 'in_progress', 'done'],
    description: 'Filter by task status',
  })
  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  status?: 'todo' | 'in_progress' | 'done';

  @ApiPropertyOptional({
    enum: ['low', 'medium', 'high'],
    description: 'Filter by task priority',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status'],
    default: 'createdAt',
    description: 'Sort by field',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status'])
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  search?: string;
}
