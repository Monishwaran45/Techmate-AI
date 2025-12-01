import {
  IsArray,
  IsOptional,
  IsString,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetTechNewsDto {
  @ApiProperty({
    description: 'Topics to filter news by',
    example: ['React', 'TypeScript', 'Node.js'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10, { message: 'Maximum 10 topics allowed' })
  @MaxLength(50, {
    each: true,
    message: 'Each topic must not exceed 50 characters',
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((t: string) => t?.trim()) : value,
  )
  topics?: string[];
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  source: string;
}
