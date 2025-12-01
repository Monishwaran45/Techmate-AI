import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsSanitizedString } from '../../../common/validators/sanitize.validator';

export class ExplainConceptDto {
  @ApiProperty({
    description: 'The concept to explain',
    example: 'React hooks',
  })
  @IsString()
  @IsNotEmpty({ message: 'Concept is required' })
  @MinLength(2, { message: 'Concept must be at least 2 characters long' })
  @MaxLength(200, { message: 'Concept must not exceed 200 characters' })
  @IsSanitizedString(200)
  @Transform(({ value }) => value?.trim())
  concept: string;

  @ApiProperty({
    description: 'Optional context from user roadmap',
    example: 'I am learning React and want to understand hooks better',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Context must not exceed 1000 characters' })
  @IsSanitizedString(1000)
  @Transform(({ value }) => value?.trim())
  context?: string;
}
