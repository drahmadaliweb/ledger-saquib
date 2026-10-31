const CACHE = 'daily-ledger-shell-v31';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './supabase-config.js', './cloud.js', './groq_ai_import.js', './report_builder.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/') || url.pathname.includes('/functions/v1/')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && event.request.destination !== 'document') caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});
