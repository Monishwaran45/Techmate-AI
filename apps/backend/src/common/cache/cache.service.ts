import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    await this.cacheManager.set(key, value, options?.ttl);
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clear all cache
   * Note: cache-manager v5+ uses clear() instead of reset()
   */
  async reset(): Promise<void> {
    // cache-manager v5+ uses clear() method
    if (typeof (this.cacheManager as any).clear === 'function') {
      await (this.cacheManager as any).clear();
    } else if (typeof (this.cacheManager as any).reset === 'function') {
      await (this.cacheManager as any).reset();
    }
    // If neither method exists, silently continue (in-memory cache may not support this)
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate cache by pattern (for Redis)
   * @param _pattern - The pattern to match keys against (unused in basic implementation)
   */
  async invalidatePattern(_pattern: string): Promise<void> {
    // This requires Redis SCAN command
    // For now, we'll implement a simple version
    // In production, you might want to use ioredis directly for this
    await this.reset();
  }

  /**
   * Generate cache key for AI responses
   */
  generateAICacheKey(prompt: string, model: string): string {
    // Create a hash of the prompt for consistent keys
    const hash = Buffer.from(prompt).toString('base64').substring(0, 32);
    return `ai:${model}:${hash}`;
  }

  /**
   * Generate cache key for API responses
   */
  generateAPICacheKey(
    endpoint: string,
    params: Record<string, any>,
  ): string {
    const paramString = JSON.stringify(params);
    const hash = Buffer.from(paramString).toString('base64').substring(0, 32);
    return `api:${endpoint}:${hash}`;
  }
}
