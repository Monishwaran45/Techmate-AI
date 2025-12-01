import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ProjectDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export class GenerateIdeasDto {
  @ApiProperty({
    description: 'Project difficulty level',
    enum: ProjectDifficulty,
    example: ProjectDifficulty.INTERMEDIATE,
  })
  @IsEnum(ProjectDifficulty, {
    message: 'Difficulty must be one of: beginner, intermediate, advanced',
  })
  difficulty: ProjectDifficulty;

  @ApiProperty({
    description: 'Technologies to use in the project',
    example: ['React', 'Node.js', 'PostgreSQL'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one technology is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 technologies allowed' })
  @IsString({ each: true })
  @MaxLength(50, {
    each: true,
    message: 'Each technology must not exceed 50 characters',
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((t: string) => t?.trim()) : value,
  )
  technologies: string[];

  @ApiProperty({
    description: 'Number of ideas to generate',
    example: 3,
    required: false,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt({ message: 'Count must be an integer' })
  @Min(1, { message: 'Count must be at least 1' })
  @Max(10, { message: 'Count must not exceed 10' })
  count?: number;
}
