import {
  IsArray,
  IsOptional,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class JobPreferencesDto {
  @ApiProperty({ description: 'Preferred job titles', type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one job title is required' })
  @ArrayMaxSize(20, { message: 'Maximum 20 job titles allowed' })
  @IsString({ each: true })
  @MaxLength(100, {
    each: true,
    message: 'Each job title must not exceed 100 characters',
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((t: string) => t?.trim()) : value,
  )
  jobTitles: string[];

  @ApiProperty({ description: 'Required skills', type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one skill is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 skills allowed' })
  @IsString({ each: true })
  @MaxLength(50, {
    each: true,
    message: 'Each skill must not exceed 50 characters',
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((s: string) => s?.trim()) : value,
  )
  skills: string[];

  @ApiProperty({
    description: 'Preferred locations',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Maximum 20 locations allowed' })
  @IsString({ each: true })
  @MaxLength(100, {
    each: true,
    message: 'Each location must not exceed 100 characters',
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((l: string) => l?.trim()) : value,
  )
  locations?: string[];

  @ApiProperty({
    description: 'Experience level',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Experience level must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  experienceLevel?: string;
}
