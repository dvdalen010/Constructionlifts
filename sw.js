// Service worker: zorgt dat de app ook offline (op de bouw zonder bereik) werkt.
const CACHE = 'liftmaat-v2';
const BESTANDEN = ['./', './index.html', './style.css', './app.js', './manifest.json', './leren.js', './leerstof.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
