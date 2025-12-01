import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({
    enum: ['dsa', 'system_design', 'behavioral'],
    description: 'Type of interview session',
  })
  @IsEnum(['dsa', 'system_design', 'behavioral'])
  type: 'dsa' | 'system_design' | 'behavioral';

  @ApiProperty({
    description: 'Enable voice mode for speech-to-text and text-to-speech',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  voiceModeEnabled?: boolean;
}
