import { lazy, ComponentType } from 'react';

/**
 * Retry mechanism for lazy loading components
 * Helps handle network failures during chunk loading
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000,
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (attemptsLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft === 1) {
              reject(error);
              return;
            }
            
            setTimeout(() => {
              console.log(`Retrying component load... (${retries - attemptsLeft + 1}/${retries})`);
              attemptLoad(attemptsLeft - 1);
            }, interval);
          });
      };

      attemptLoad(retries);
    });
  });
}

/**
 * Preload a lazy component
 * Useful for prefetching routes the user is likely to visit
 */
export function preloadComponent(componentImport: () => Promise<any>): void {
  // Start loading the component
  componentImport().catch((error) => {
    console.error('Failed to preload component:', error);
  });
}

/**
 * Create a lazy component with automatic retry and preload support
 */
export function createLazyComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options?: {
    retries?: number;
    retryInterval?: number;
    preload?: boolean;
  },
): React.LazyExoticComponent<T> {
  const { retries = 3, retryInterval = 1000, preload = false } = options || {};

  if (preload) {
    // Preload on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadComponent(componentImport));
    } else {
      setTimeout(() => preloadComponent(componentImport), 1);
    }
  }

  return lazyWithRetry(componentImport, retries, retryInterval);
}
