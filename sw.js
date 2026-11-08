// ElektroCoach PRO – Service Worker v5
// Network-First mit Cache-Fallback: Code-Updates sind sofort aktiv, offline läuft alles aus dem Cache.
// Der Lernstand liegt in localStorage/IndexedDB und wird vom Cache-Wechsel NICHT berührt.
const CACHE_NAME = 'elektrocoach-pro-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/data.js',
  '/js/tools_guide.js',
  '/js/logo_simulator.js',
  '/js/math_scaffold.js',
  '/js/math_trainer.js',
  '/js/simulators.js',
  '/js/study_planer.js',
  '/js/app.js',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('/index.html');
          return Response.error();
        })
      )
  );
});
