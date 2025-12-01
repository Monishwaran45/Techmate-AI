import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      error: {
        code: exception instanceof HttpException ? exception.name : 'INTERNAL_ERROR',
        message,
        timestamp: new Date().toISOString(),
        requestId: (request as any).requestId,
        path: request.url,
      },
    };

    // Log error
    this.logger.error(message, exception instanceof Error ? exception.stack : '', {
      requestId: (request as any).requestId,
      method: request.method,
      url: request.url,
      statusCode: status,
      userId: (request as any).user?.id,
    });

    // Send to Sentry for non-4xx errors
    if (status >= 500) {
      Sentry.captureException(exception, {
        tags: {
          endpoint: request.url,
          method: request.method,
        },
        user: {
          id: (request as any).user?.id,
        },
        extra: {
          requestId: (request as any).requestId,
          body: request.body,
          query: request.query,
        },
      });
    }

    response.status(status).json(errorResponse);
  }
}
