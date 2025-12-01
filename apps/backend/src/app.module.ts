import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { LearningModule } from './modules/learning/learning.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { InterviewModule } from './modules/interview/interview.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ProductivityModule } from './modules/productivity/productivity.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { SyncModule } from './modules/sync/sync.module';
import { LoggerModule } from './common/logger/logger.module';
import { HealthModule } from './health/health.module';
import { CacheModule } from './common/cache/cache.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),

    // Database with connection pooling and caching
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST') || 'localhost',
        port: configService.get<number>('DATABASE_PORT') || 5432,
        username: configService.get<string>('DATABASE_USER') || 'postgres',
        password: configService.get<string>('DATABASE_PASSWORD') || 'password',
        database: configService.get<string>('DATABASE_NAME') || 'techmate_dev',
        autoLoadEntities: true,
        synchronize: true, // Auto-sync schema in development
        logging: process.env.NODE_ENV === 'development',
        // Connection pooling configuration
        extra: {
          max: 20, // Maximum number of connections in the pool
          min: 5, // Minimum number of connections in the pool
          idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
          connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
        },
        // Query result caching with Redis
        cache: {
          duration: 30000, // Cache query results for 30 seconds
          type: 'redis',
          options: {
            host: configService.get('REDIS_HOST') || 'localhost',
            port: configService.get('REDIS_PORT') || 6379,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Redis & Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 3600000, // 1 hour in milliseconds
        limit: 100, // 100 requests per hour (default for free tier)
      },
    ]),

    // Common modules
    LoggerModule,
    HealthModule,
    CacheModule,

    // Feature modules
    AuthModule,
    LearningModule,
    ProjectsModule,
    InterviewModule,
    JobsModule,
    ProductivityModule,
    SubscriptionModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
