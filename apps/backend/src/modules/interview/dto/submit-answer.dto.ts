import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsSanitizedString } from '../../../common/validators/sanitize.validator';

export class SubmitAnswerDto {
  @ApiProperty({
    description: 'Question ID being answered',
  })
  @IsUUID('4', { message: 'Question ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Question ID is required' })
  questionId: string;

  @ApiProperty({
    description: 'Answer content (text)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Answer content is required' })
  @MinLength(1, { message: 'Answer must not be empty' })
  @MaxLength(10000, { message: 'Answer must not exceed 10000 characters' })
  @IsSanitizedString(10000)
  @Transform(({ value }) => value?.trim())
  content: string;

  @ApiProperty({
    description: 'Audio URL if voice mode is enabled',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'Audio URL must be a valid URL' })
  @MaxLength(500, { message: 'Audio URL must not exceed 500 characters' })
  audioUrl?: string;
}
