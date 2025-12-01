/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and other performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Report Core Web Vitals to analytics
 */
export function reportWebVitals(onPerfEntry?: (metric: PerformanceMetric) => void): void {
  if (onPerfEntry && typeof window !== 'undefined') {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        
        onPerfEntry({
          name: 'LCP',
          value: lcp,
          rating: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor',
        });
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Ignore if not supported
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          
          onPerfEntry({
            name: 'FID',
            value: fid,
            rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor',
          });
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Ignore if not supported
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        onPerfEntry({
          name: 'CLS',
          value: clsValue,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
        });
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Ignore if not supported
      }
    }

    // Time to First Byte (TTFB)
    if ('performance' in window && 'timing' in window.performance) {
      const timing = window.performance.timing as any;
      const ttfb = timing.responseStart - timing.requestStart;
      
      if (ttfb > 0) {
        onPerfEntry({
          name: 'TTFB',
          value: ttfb,
          rating: ttfb <= 600 ? 'good' : ttfb <= 1500 ? 'needs-improvement' : 'poor',
        });
      }
    }
  }
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string): () => void {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
  };
}

/**
 * Measure API call duration
 */
export function measureAPICall(endpoint: string): () => void {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] API call to ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Get bundle size information
 */
export function getBundleSize(): void {
  if ('performance' in window && 'getEntriesByType' in window.performance) {
    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    let totalSize = 0;
    const resourceSizes: Record<string, number> = {};
    
    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      totalSize += size;
      
      const type = resource.name.split('.').pop() || 'other';
      resourceSizes[type] = (resourceSizes[type] || 0) + size;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Total bundle size:', (totalSize / 1024).toFixed(2), 'KB');
      console.log('[Performance] Resource sizes:', resourceSizes);
    }
  }
}
