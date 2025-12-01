import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountDeletionService } from './account-deletion.service';
import { AccountDeletionProcessor } from './jobs/account-deletion.processor';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserProfile, Subscription } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Subscription]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountDeletionService,
    AccountDeletionProcessor,
    JwtStrategy,
  ],
  exports: [AuthService, AccountDeletionService, JwtStrategy, PassportModule],
})
export class AuthModule {}
