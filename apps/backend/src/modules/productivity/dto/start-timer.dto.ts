import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartTimerDto {
  @ApiProperty({
    description: 'Timer duration in seconds',
    minimum: 60,
    maximum: 7200,
    example: 1500,
  })
  @IsInt()
  @Min(60)
  @Max(7200)
  duration: number;
}
