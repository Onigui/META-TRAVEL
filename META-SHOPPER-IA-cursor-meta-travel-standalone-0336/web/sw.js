const CACHE = 'meta-travel-v1';

function basePath() {
  const path = self.location.pathname.replace(/\/sw\.js$/, '');
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

self.addEventListener('install', (event) => {
  const base = basePath();
  const assets = [`${base}/`, `${base}/index.html`, `${base}/styles.css`, `${base}/app.js`, `${base}/manifest.json`];
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
