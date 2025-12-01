import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache_ttl';

/**
 * Decorator to set custom cache TTL for endpoints
 * @param ttl Time to live in milliseconds
 * 
 * @example
 * @CacheTTL(600000) // Cache for 10 minutes
 * @Get('news')
 * async getTechNews() { ... }
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);

/**
 * Decorator to disable caching for specific endpoints
 */
export const NoCache = () => SetMetadata(CACHE_TTL_KEY, 0);
