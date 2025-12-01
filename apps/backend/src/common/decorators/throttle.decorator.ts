import { SetMetadata } from '@nestjs/common';

export const THROTTLE_LIMIT_KEY = 'throttle_limit';
export const THROTTLE_TTL_KEY = 'throttle_ttl';

export interface ThrottleOptions {
  limit: number;
  ttl: number; // in seconds
}

export const Throttle = (options: ThrottleOptions) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      SetMetadata(THROTTLE_LIMIT_KEY, options.limit)(target, propertyKey, descriptor);
      SetMetadata(THROTTLE_TTL_KEY, options.ttl)(target, propertyKey, descriptor);
    }
  };
};

// Predefined throttle configurations
export const ThrottleConfig = {
  // Standard API endpoints
  DEFAULT: { limit: 100, ttl: 3600 }, // 100 requests per hour
  
  // AI-powered endpoints (more expensive)
  AI_ENDPOINT: { limit: 20, ttl: 3600 }, // 20 requests per hour
  
  // Authentication endpoints
  AUTH: { limit: 5, ttl: 900 }, // 5 requests per 15 minutes
  
  // File upload endpoints
  UPLOAD: { limit: 10, ttl: 3600 }, // 10 uploads per hour
  
  // Premium tier (higher limits)
  PREMIUM: { limit: 1000, ttl: 3600 }, // 1000 requests per hour
};
