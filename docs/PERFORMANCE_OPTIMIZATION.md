# Performance Optimization Guide

This document describes the performance optimizations implemented in TechMate AI platform.

## Backend Optimizations

### 1. Caching Strategy

#### Redis Caching
- **Location**: `apps/backend/src/common/cache/`
- **Implementation**: Redis-based caching with cache-manager
- **Features**:
  - API response caching (5-minute default TTL)
  - AI response caching (1-hour TTL for deterministic queries)
  - Embedding caching (1-hour TTL)
  - Query result caching

#### Cache Configuration
```typescript
// Default TTL: 5 minutes (300000ms)
// AI responses: 1 hour (3600000ms)
// Embeddings: 1 hour (3600000ms)
```

#### Usage Example
```typescript
// In a service
constructor(private cacheService: CacheService) {}

async getData(key: string) {
  return this.cacheService.getOrSet(
    key,
    async () => {
      // Expensive operation
      return await this.fetchData();
    },
    { ttl: 300000 } // 5 minutes
  );
}
```

#### CDN Caching Headers
- Static assets: 1 year (`max-age=31536000, immutable`)
- GET API responses: 5 minutes (`max-age=300, must-revalidate`)
- Varies by Authorization header

### 2. Database Query Optimization

#### Connection Pooling
- **Max connections**: 20
- **Min connections**: 5
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds

#### Query Result Caching
- **Duration**: 30 seconds
- **Backend**: Redis
- **Automatic**: Enabled for all queries

#### Indexes
Added performance indexes for common queries:
- User lookups by email
- User-scoped queries (userId indexes)
- Status-based queries
- Date range queries
- Composite indexes for common patterns

**Migration**: `1700000005000-AddPerformanceIndexes.ts`

#### Query Optimizer Service
Location: `apps/backend/src/database/query-optimizer.service.ts`

Features:
- Pagination helpers
- User-scoped query builders
- Date range filters
- Sorting utilities
- Field selection optimization
- Relation loading optimization

Usage:
```typescript
const query = this.queryOptimizer.createUserQuery(
  this.taskRepository,
  userId,
  {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    cache: true,
  }
);
```

## Frontend Optimizations

### 1. Code Splitting

#### Route-based Splitting
All pages are lazy-loaded using React.lazy():
```typescript
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
```

#### Vendor Chunking
Vite configuration splits vendor code into separate chunks:
- `react-vendor`: React, React DOM, React Router
- `state-vendor`: Zustand, React Query
- `ui-vendor`: Axios and other UI libraries

### 2. Lazy Loading

#### Component Lazy Loading
- All route components are lazy-loaded
- Suspense boundaries with loading fallbacks
- Automatic code splitting at route level

#### Image Lazy Loading
- **Component**: `LazyImage` (`apps/web/src/components/common/LazyImage.tsx`)
- **Features**:
  - Intersection Observer API
  - Placeholder images
  - Fade-in transitions
  - Native lazy loading attribute

Usage:
```typescript
<LazyImage
  src="/path/to/image.jpg"
  alt="Description"
  placeholder="data:image/svg+xml,..."
/>
```

### 3. Asset Optimization

#### Image Optimization
- **Utilities**: `apps/web/src/utils/imageOptimization.ts`
- **Features**:
  - Responsive image srcset generation
  - Device pixel ratio optimization
  - WebP format detection
  - Lazy loading with Intersection Observer
  - Image preloading for critical assets

#### Build Optimization
- **Minification**: Terser with console.log removal in production
- **Compression**: Gzip and Brotli compression
- **Source maps**: Hidden in production
- **Chunk size limit**: 1000KB warning threshold

#### Bundle Analysis
Run `npm run build` to see bundle size analysis.

### 4. Performance Monitoring

#### Web Vitals Tracking
Location: `apps/web/src/utils/performanceMonitoring.ts`

Tracked metrics:
- **LCP** (Largest Contentful Paint): Target ≤ 2.5s
- **FID** (First Input Delay): Target ≤ 100ms
- **CLS** (Cumulative Layout Shift): Target ≤ 0.1
- **TTFB** (Time to First Byte): Target ≤ 600ms

Usage:
```typescript
reportWebVitals((metric) => {
  // Send to analytics
  console.log(metric);
});
```

## Performance Best Practices

### Backend

1. **Use caching for expensive operations**
   - AI responses
   - Database queries
   - External API calls

2. **Optimize database queries**
   - Use indexes for common queries
   - Select only needed fields
   - Use pagination for large result sets
   - Enable query result caching

3. **Connection pooling**
   - Reuse database connections
   - Configure appropriate pool size
   - Set idle timeout

### Frontend

1. **Code splitting**
   - Lazy load routes
   - Split vendor bundles
   - Use dynamic imports

2. **Image optimization**
   - Use lazy loading
   - Implement responsive images
   - Compress images
   - Use modern formats (WebP)

3. **Bundle optimization**
   - Minimize bundle size
   - Remove unused code
   - Enable compression
   - Use production builds

4. **Caching**
   - Cache API responses
   - Use service workers (future)
   - Implement stale-while-revalidate

## Monitoring

### Development
- Console logs for performance metrics
- Bundle size analysis
- React DevTools Profiler

### Production
- Web Vitals reporting
- Sentry performance monitoring
- CDN analytics
- Database query performance

## Future Optimizations

1. **Service Workers**: Offline support and caching
2. **Progressive Web App**: Install prompt and offline mode
3. **HTTP/2 Server Push**: Push critical resources
4. **Edge Caching**: CDN edge locations
5. **Database Read Replicas**: Separate read/write databases
6. **GraphQL**: Reduce over-fetching
7. **Image CDN**: Automatic image optimization

## Performance Targets

### Backend
- API response time (p95): < 500ms
- Database query time (p95): < 100ms
- AI response time (p95): < 5s
- Cache hit rate: > 80%

### Frontend
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- TTFB: < 600ms
- Bundle size: < 500KB (gzipped)

## Testing Performance

### Backend
```bash
# Run load tests
npm run test:load

# Analyze database queries
npm run db:analyze
```

### Frontend
```bash
# Build and analyze bundle
npm run build
npm run analyze

# Lighthouse audit
npm run lighthouse
```

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)
- [TypeORM Caching](https://typeorm.io/caching)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
