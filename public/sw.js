const CACHE_NAME = 'gestione-contabilita-v1';

// Assets to pre-cache (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin and CDN requests
  if (request.method !== 'GET') return;

  // Network-first strategy for navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match('/').then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // Cache-first for icons and manifest
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Network-first for everything else (Firebase, ESM modules, etc.)
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || Response.error())
    )
  );
});
