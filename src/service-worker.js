const CACHE_NAME = 'nurseflow-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin or firestore requests (Firestore has its own persistence)
  if (event.request.url.includes('firestore.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchedResponse = fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });

      return cachedResponse || fetchedResponse;
    }).catch(() => {
      // Offline Fallback for Page Navigation
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
