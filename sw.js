const CACHE_NAME = 'angry-birds-pwa-v17';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.json?v=17',
  '/public/icons/icon.svg',
  '/public/icons/icon-192.png',
  '/public/icons/icon-192.png?v=10',
  '/public/icons/icon-512.png',
  '/public/icons/icon-512.png?v=10',
  '/public/icons/icon.png',
  '/public/icons/apple-touch-icon.png',
  '/public/icons/apple-touch-icon.png?v=10',
  '/public/vendor/matter.min.js',
  '/src/style.css',
  '/src/sound.js',
  '/src/levels.js',
  '/src/game.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // HTML 내비게이션 요청인 경우 (홈 화면 앱 실행 등)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/').then((res) => res || caches.match('/index.html'));
        })
    );
    return;
  }

  // 정적 리소스 (Cache First, Network Fallback)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        });
    })
  );
});
