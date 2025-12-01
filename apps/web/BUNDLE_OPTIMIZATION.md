# Frontend Bundle Optimization Guide

This document describes the bundle optimization strategies implemented in the TechMate AI web application.

## Implemented Optimizations

### 1. Code Splitting

#### Feature-Based Splitting
The application uses intelligent code splitting to separate features into individual chunks:

- **React Vendor**: Core React libraries (react, react-dom, react-router-dom)
- **State Vendor**: State management libraries (zustand, @tanstack/react-query)
- **HTTP Vendor**: HTTP client (axios)
- **Feature Chunks**: Separate chunks for each major feature:
  - Learning features
  - Projects features
  - Interview features
  - Jobs features
  - Productivity features

#### Route-Based Splitting
All pages are lazy-loaded using React.lazy():
- Login page
- Signup page
- Profile setup page
- Dashboard page

### 2. Lazy Loading

#### Component Lazy Loading
- Pages are loaded on-demand using React.lazy()
- Suspense boundaries provide loading states
- Retry mechanism handles network failures during chunk loading

#### Image Lazy Loading
- Images load only when entering viewport (Intersection Observer)
- Native lazy loading attribute for browser support
- Support for modern image formats (AVIF, WebP) with fallbacks
- Placeholder images during loading

### 3. Asset Optimization

#### Image Optimization
- Lazy loading with Intersection Observer
- Modern format support (AVIF, WebP)
- Automatic fallback to standard formats
- Inline small assets (<4KB) as base64

#### File Organization
- Organized output structure:
  - `/assets/js/` - JavaScript chunks
  - `/assets/images/` - Image files
  - `/assets/fonts/` - Font files

### 4. Build Optimizations

#### Minification
- Terser minification with aggressive settings
- Console statements removed in production
- Dead code elimination
- Multiple compression passes

#### Compression
- Gzip compression for all assets >10KB
- Brotli compression for better compression ratios
- Pre-compressed files served by CDN

#### Tree Shaking
- ES modules for better tree shaking
- Unused code elimination
- Side-effect-free modules marked

### 5. Caching Strategy

#### Service Worker
- Static asset caching
- Dynamic content caching
- Cache-first strategy for assets
- Network-first for API calls

#### Browser Caching
- Long-term caching for hashed assets
- Immutable cache headers
- CDN edge caching

### 6. Performance Monitoring

#### Web Vitals
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- First Contentful Paint (FCP)
- Time to First Byte (TTFB)

## Usage

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Analyze Bundle
```bash
npm run build:analyze
```

This will generate a detailed report of bundle sizes and provide optimization recommendations.

## Best Practices

### Adding New Features
1. Keep feature components in their respective directories
2. Use lazy loading for large components
3. Avoid importing entire libraries (use tree-shakeable imports)
4. Use dynamic imports for conditional features

### Image Usage
```tsx
import { LazyImage } from '@/components/common/LazyImage';

// Basic usage
<LazyImage src="/image.jpg" alt="Description" />

// With modern formats
<LazyImage 
  src="/image.jpg" 
  webpSrc="/image.webp"
  avifSrc="/image.avif"
  alt="Description" 
/>
```

### Lazy Component Loading
```tsx
import { createLazyComponent } from '@/utils/lazyLoadUtils';

const MyComponent = createLazyComponent(
  () => import('./MyComponent'),
  { retries: 3, preload: true }
);
```

## Performance Targets

- **Initial Bundle**: < 200KB (gzipped)
- **Largest Chunk**: < 500KB (gzipped)
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## Monitoring

Monitor bundle sizes after each build:
```bash
npm run build:analyze
```

Review the output for:
- Total bundle size
- Individual chunk sizes
- Large files (>500KB)
- Optimization opportunities

## Recent Improvements (Task 17.3)

### Enhanced Code Splitting
- ✅ Improved lazy loading with retry mechanism for better reliability
- ✅ Feature-based code splitting for all major modules
- ✅ Vendor chunk optimization (React, State, HTTP separated)

### Advanced Lazy Loading
- ✅ Component-level lazy loading with `createLazyComponent` utility
- ✅ Automatic retry on chunk load failures (3 retries with exponential backoff)
- ✅ Route preloading based on user authentication state
- ✅ Idle-time preloading for non-critical resources

### Image & Asset Optimization
- ✅ LazyImage component with Intersection Observer
- ✅ Modern format support (AVIF, WebP) with automatic fallbacks
- ✅ Responsive image loading with srcset
- ✅ Placeholder images during loading
- ✅ Optimized asset inlining (<4KB as base64)

### Service Worker Enhancements
- ✅ Intelligent caching strategies per resource type:
  - Images: Cache-first with size limits (100 items max)
  - Fonts: Cache-first, long-term (fonts rarely change)
  - JS/CSS: Stale-while-revalidate (serve cached, update in background)
  - API: Network-first (always fresh data)
- ✅ Cache size limits to prevent excessive storage usage
- ✅ Automatic cache cleanup on version updates

### Resource Hints
- ✅ DNS prefetch for external domains (OpenAI API, Google Fonts)
- ✅ Preload critical resources (fonts, images)
- ✅ Prefetch likely navigation routes
- ✅ Dynamic resource hints via `useResourceHints` hook

### Bundle Analysis
- ✅ Enhanced bundle analyzer with compression metrics
- ✅ Gzip and Brotli compression analysis
- ✅ File type grouping and statistics
- ✅ Performance recommendations based on bundle size
- ✅ Optimization checklist with pass/fail indicators

## Future Optimizations

- [ ] Implement HTTP/2 Server Push
- [ ] Optimize font loading with font-display: swap
- [ ] Implement progressive image loading (blur-up technique)
- [ ] Add bundle size CI checks to prevent regressions
- [ ] Implement predictive prefetching based on user behavior
- [ ] Add WebP/AVIF conversion pipeline for uploaded images
