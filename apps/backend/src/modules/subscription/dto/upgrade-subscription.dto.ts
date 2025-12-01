import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpgradeSubscriptionDto {
  @ApiProperty({
    description: 'Subscription tier to upgrade to',
    enum: ['premium', 'enterprise'],
    example: 'premium',
  })
  @IsEnum(['premium', 'enterprise'], {
    message: 'Tier must be one of: premium, enterprise',
  })
  tier: 'premium' | 'enterprise';

  @ApiPropertyOptional({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: 'Payment method ID must not exceed 200 characters',
  })
  paymentMethodId?: string;
}
