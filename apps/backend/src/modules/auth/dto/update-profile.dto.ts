import {
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
  IsUrl,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  @MaxLength(500, { message: 'Avatar URL must not exceed 500 characters' })
  avatar?: string;

  @ApiProperty({
    example: ['JavaScript', 'TypeScript', 'React'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50, { message: 'Maximum 50 skills allowed' })
  @IsString({ each: true })
  @MaxLength(50, {
    each: true,
    message: 'Each skill must not exceed 50 characters',
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((s: string) => s?.trim()) : value,
  )
  skills?: string[];

  @ApiProperty({
    example: ['Learn Node.js', 'Build a SaaS'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Maximum 20 goals allowed' })
  @IsString({ each: true })
  @MaxLength(200, {
    each: true,
    message: 'Each goal must not exceed 200 characters',
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((g: string) => g?.trim()) : value,
  )
  goals?: string[];

  @ApiProperty({ example: 'intermediate', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Experience must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  experience?: string;

  @ApiProperty({
    example: { theme: 'dark', notifications: true, language: 'en' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    language?: string;
  };
}
