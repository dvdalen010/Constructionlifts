// Service worker: zorgt dat de app ook offline (op de bouw zonder bereik) werkt.
// Strategie "eerst netwerk": met bereik altijd de nieuwste versie (en die wordt opgeslagen),
// zonder bereik de laatst opgeslagen versie. Zo komen updates vanzelf binnen.
const CACHE = 'liftmaat-v4';
const BESTANDEN = ['./', './index.html', './style.css', './app.js', './manifest.json', './leren.js', './leerstof.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(antwoord => {
        const kopie = antwoord.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopie));
        return antwoord;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
