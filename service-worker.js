const CACHE_NAME = 'lembretes-edutec-shell-v64';
const OFFLINE_DEPENDENCIES = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://www.gstatic.com/firebasejs/13.3.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/13.3.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-compat.js'
];
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await cache.addAll(APP_SHELL);
        await Promise.all(OFFLINE_DEPENDENCIES.map(url => cache.add(url).catch(error => {
          console.warn('Não foi possível preparar um recurso offline:', url, error);
        })));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const offlineDependency = OFFLINE_DEPENDENCIES.includes(request.url);
  if (request.method !== 'GET' || (new URL(request.url).origin !== self.location.origin && !offlineDependency)) return;

  if (offlineDependency) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok || response.type === 'opaque') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || Response.error()))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});











