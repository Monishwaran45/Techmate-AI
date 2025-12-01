import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: '6-digit 2FA code' })
  @IsString()
  @Length(6, 6, { message: '2FA token must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: '2FA token must contain only digits' })
  token: string;

  @ApiProperty({ example: 'temp-jwt-token' })
  @IsString()
  @Length(10, 1000, { message: 'Invalid temporary token format' })
  tempToken: string;
}
