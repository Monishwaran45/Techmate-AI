import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

/**
 * Interceptor to cache API responses
 * Use with @UseInterceptors(CacheInterceptor)
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query, user } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key based on URL, query params, and user
    const userId = user?.id || 'anonymous';
    const cacheKey = this.cacheService.generateAPICacheKey(url, {
      ...query,
      userId,
    });

    // Try to get from cache
    const cachedResponse = await this.cacheService.get(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // If not in cache, execute request and cache the response
    return next.handle().pipe(
      tap(async (response) => {
        // Cache for 5 minutes (300000ms)
        await this.cacheService.set(cacheKey, response, { ttl: 300000 });
      }),
    );
  }
}
