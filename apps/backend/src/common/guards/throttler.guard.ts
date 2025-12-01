import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Use user ID if authenticated, otherwise use IP
    const user = req.user as any;
    return user?.id || req.ip || 'anonymous';
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const response = context.switchToHttp().getResponse<Response>();
    
    // Add rate limit headers
    response.header('X-RateLimit-Limit', '100');
    response.header('X-RateLimit-Remaining', '0');
    response.header('X-RateLimit-Reset', new Date(Date.now() + 3600000).toISOString());
    
    throw new ThrottlerException('Too many requests. Please try again later.');
  }
}
