const CACHE_NAME = 'cerita-bahasa-beta-v1';
const BASE_PATH = '/beta/';

const urlsToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}halaman-bahasa.html`,
  `${BASE_PATH}css/style.css`,
  `${BASE_PATH}js/auth.js`,
  `${BASE_PATH}js/main.js`,
  `${BASE_PATH}js/video.js`,
  `${BASE_PATH}js/comments.js`,
  `${BASE_PATH}js/analytics.js`,
  `${BASE_PATH}assets/favicon-192.png`,
  `${BASE_PATH}assets/favicon-512.png`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
