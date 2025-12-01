import {
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateNoteDto {
  @ApiProperty({ description: 'Note title' })
  @IsString()
  @MinLength(1, { message: 'Title must not be empty' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({ description: 'Note content (supports rich text)' })
  @IsString()
  @MinLength(1, { message: 'Content must not be empty' })
  @MaxLength(50000, { message: 'Content must not exceed 50000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 tags allowed' })
  @IsString({ each: true })
  @MaxLength(50, { each: true, message: 'Each tag must not exceed 50 characters' })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((tag: string) => tag?.trim()) : value,
  )
  tags?: string[];
}
