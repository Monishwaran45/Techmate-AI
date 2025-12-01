import React, { Suspense, ComponentType } from 'react';

interface LazyLoadProps {
  fallback?: React.ReactNode;
}

/**
 * Loading fallback component
 */
const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Higher-order component for lazy loading with Suspense
 * @param Component - The component to lazy load
 * @param fallback - Optional custom loading fallback
 */
export function withLazyLoad<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode,
) {
  return (props: P) => (
    <Suspense fallback={fallback || <DefaultFallback />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Lazy load wrapper component
 */
export const LazyLoad: React.FC<LazyLoadProps & { children: React.ReactNode }> = ({
  children,
  fallback,
}) => {
  return <Suspense fallback={fallback || <DefaultFallback />}>{children}</Suspense>;
};
