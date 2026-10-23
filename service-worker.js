const CACHE_NAME = 'hp-calculator-modern-v2-pink';
const PRECACHE = [
  './',
  './index.html',
  './modern.html',
  './modern.css',
  './modern.js',
  './theme.js',
  './calculator-core.js',
  './manifest.json',
  './Assets/10bii-icon.svg',
  './legacy.html',
  './calculator.js',
  './styles.css',
  './help.js',
  './faq-data.json',
  './Assets/AmyCalc_HP_12c_Background.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(PRECACHE.map(async url => {
        try { await cache.add(url); }
        catch (error) { console.warn('Offline cache skipped:', url, error); }
      }));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
