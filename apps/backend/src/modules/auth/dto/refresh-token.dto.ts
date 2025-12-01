import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT refresh token' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  @Length(10, 1000, { message: 'Invalid refresh token format' })
  refreshToken: string;
}
