import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export class GenerateRoadmapDto {
  @ApiProperty({
    description: 'Learning goals for the roadmap (1-5 goals)',
    example: ['Learn React', 'Master TypeScript'],
    minItems: 1,
    maxItems: 5,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one goal is required' })
  @ArrayMaxSize(5, { message: 'Maximum 5 goals allowed' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(200, { each: true, message: 'Each goal must not exceed 200 characters' })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((goal: string) => goal?.trim()) : value,
  )
  goals: string[];

  @ApiProperty({
    description: 'Current skill level',
    enum: SkillLevel,
    example: SkillLevel.BEGINNER,
  })
  @IsEnum(SkillLevel, {
    message: 'Skill level must be one of: beginner, intermediate, advanced',
  })
  skillLevel: SkillLevel;
}
