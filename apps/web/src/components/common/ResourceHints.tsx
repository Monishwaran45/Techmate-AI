import { useEffect } from 'react';

interface ResourceHintsProps {
  preloadFonts?: string[];
  preloadImages?: string[];
  prefetchRoutes?: string[];
  dnsPrefetch?: string[];
}

/**
 * Component to add resource hints for performance optimization
 * - Preload: Critical resources needed immediately
 * - Prefetch: Resources needed for future navigation
 * - DNS Prefetch: Resolve DNS for external domains early
 */
export const ResourceHints: React.FC<ResourceHintsProps> = ({
  preloadFonts = [],
  preloadImages = [],
  prefetchRoutes = [],
  dnsPrefetch = [],
}) => {
  useEffect(() => {
    // Preload fonts
    preloadFonts.forEach((font) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = font;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Preload critical images
    preloadImages.forEach((image) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = image;
      document.head.appendChild(link);
    });

    // Prefetch routes for faster navigation
    prefetchRoutes.forEach((route) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });

    // DNS prefetch for external domains
    dnsPrefetch.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }, [preloadFonts, preloadImages, prefetchRoutes, dnsPrefetch]);

  return null;
};

/**
 * Hook to dynamically add resource hints
 */
export function useResourceHints(hints: ResourceHintsProps) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    // Preload fonts
    hints.preloadFonts?.forEach((font) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = font;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      links.push(link);
    });

    // Preload images
    hints.preloadImages?.forEach((image) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = image;
      document.head.appendChild(link);
      links.push(link);
    });

    // Prefetch routes
    hints.prefetchRoutes?.forEach((route) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
      links.push(link);
    });

    // DNS prefetch
    hints.dnsPrefetch?.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
      links.push(link);
    });

    // Cleanup
    return () => {
      links.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [hints]);
}
