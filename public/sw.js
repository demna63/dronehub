const CACHE_NAME = 'dronehub-shell-v4';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/brand/dhg-logo.webp', '/brand/dhg-logo.avif', '/brand/dhg-logo.png', '/brand/favicon.ico', '/brand/icon.svg', '/brand/icon-192.png', '/brand/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

/** Hashed assets are immutable, so only the newest MAX_ASSET_ENTRIES are worth keeping. */
const MAX_ASSET_ENTRIES = 80;

const pruneAssetCache = async () => {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  const assets = keys.filter((request) => new URL(request.url).pathname.startsWith('/assets/'));
  // Oldest first: cache.keys() preserves insertion order.
  const excess = assets.length - MAX_ASSET_ENTRIES;
  if (excess > 0) await Promise.all(assets.slice(0, excess).map((request) => cache.delete(request)));
};

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      // Within the current cache, hashed assets accumulated with no eviction at
      // all — the cache grew forever until someone bumped CACHE_NAME by hand.
      .then(pruneAssetCache)
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache a GOOD shell. Firebase Hosting rewrites ** -> /index.html,
          // so without this check a 500 or an error page returned during a bad
          // deploy was written straight over the cached shell and then served
          // as the offline fallback indefinitely.
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (APP_SHELL.some((path) => url.pathname === path) || url.pathname.startsWith('/assets/') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.avif') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          // On a cache miss AND a network failure this resolved to `undefined`,
          // and respondWith(undefined) throws — the request hard-failed instead
          // of falling through to the shell.
          .catch(() => cached || caches.match('/index.html'));

        return cached || networkFetch;
      })
    );
  }
});
