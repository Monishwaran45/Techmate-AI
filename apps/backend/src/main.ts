import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  // Initialize Sentry (without profiling in development due to native module issues)
  if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== 'https://your-sentry-dsn@sentry.io/project-id') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }

  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      // Cross-Origin policies
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      // Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      // Prevent MIME type sniffing
      noSniff: true,
      // Disable X-Powered-By header
      hidePoweredBy: true,
      // Prevent clickjacking
      frameguard: {
        action: 'deny',
      },
      // XSS Protection (legacy browsers)
      xssFilter: true,
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      // Permissions Policy (formerly Feature Policy)
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
    })
  );

  // Enable CORS with proper configuration
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) only in development
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // In production, require origin header
      if (!origin && process.env.NODE_ENV === 'production') {
        return callback(new Error('Origin header required'));
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: [
      'X-RateLimit-Limit', 
      'X-RateLimit-Remaining', 
      'X-RateLimit-Reset',
    ],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
      validationError: {
        target: false, // Don't expose target object in errors (security)
        value: false, // Don't expose value in errors (security)
      },
      disableErrorMessages: process.env.NODE_ENV === 'production' ? false : false,
      stopAtFirstError: false, // Return all validation errors
    })
  );

  // Global exception filter and interceptor
  const logger = app.get(LoggerService);
  app.useGlobalFilters(new SentryExceptionFilter(logger));
  app.useGlobalInterceptors(new SentryInterceptor());

  // CDN caching headers for static assets and API responses
  app.use((req, res, next) => {
    // Cache static assets for 1 year
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache GET API responses for 5 minutes (can be overridden per endpoint)
    else if (req.method === 'GET' && req.url.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      res.setHeader('Vary', 'Authorization'); // Vary cache by auth header
    }
    next();
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('TechMate AI API')
    .setDescription(
      'AI-powered tech mentorship platform API providing personalized learning, ' +
      'project generation, interview preparation, job matching, and productivity tools.\n\n' +
      '## Authentication\n' +
      'Most endpoints require JWT authentication. Use the `/api/auth/login` endpoint to obtain a token, ' +
      'then include it in the Authorization header as `Bearer <token>`.\n\n' +
      '## Rate Limiting\n' +
      'API requests are rate-limited based on subscription tier:\n' +
      '- Free tier: 100 requests/hour\n' +
      '- Premium tier: 1000 requests/hour\n\n' +
      '## Error Responses\n' +
      'All errors follow a consistent format with `error.code`, `error.message`, and `error.details` fields.'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User registration, login, and profile management')
    .addTag('Learning', 'AI-powered learning roadmaps and concept explanations')
    .addTag('Projects', 'Project idea generation and code scaffolding')
    .addTag('Interview', 'Mock interview sessions and practice questions')
    .addTag('Jobs', 'Resume parsing, scoring, and job matching')
    .addTag('Productivity', 'Task management, focus timer, notes, and reminders')
    .addTag('Subscription', 'Subscription management and billing')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.techmate.ai', 'Production server')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'TechMate AI API Documentation',
    customfavIcon: 'https://techmate.ai/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 TechMate AI Backend running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
