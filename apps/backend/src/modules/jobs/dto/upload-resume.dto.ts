import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadResumeDto {
  @ApiProperty({ description: 'User ID uploading the resume' })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
