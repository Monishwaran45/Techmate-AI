// Service Worker for caching static assets with optimized strategies
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `techmate-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `techmate-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `techmate-images-${CACHE_VERSION}`;
const FONT_CACHE = `techmate-fonts-${CACHE_VERSION}`;

// Cache size limits to prevent excessive storage usage
const CACHE_LIMITS = {
  [DYNAMIC_CACHE]: 50,
  [IMAGE_CACHE]: 100,
};

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.includes(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Helper: Limit cache size to prevent excessive storage
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

// Fetch event - serve from cache with optimized strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (use network-first for fresh data)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Determine cache strategy based on resource type
  const isImage = url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|avif)$/);
  const isFont = url.pathname.match(/\.(woff|woff2|ttf|eot)$/);
  const isScript = url.pathname.match(/\.(js)$/);
  const isStyle = url.pathname.match(/\.(css)$/);

  // Images: Cache-first with size limit
  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseClone);
              limitCacheSize(IMAGE_CACHE, CACHE_LIMITS[IMAGE_CACHE]);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Fonts: Cache-first, long-term (fonts rarely change)
  if (isFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(FONT_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // JS/CSS: Stale-while-revalidate (serve cached, update in background)
  if (isScript || isStyle) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Cache-first for other static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
          limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE]);
        });

        return response;
      });
    })
  );
});
