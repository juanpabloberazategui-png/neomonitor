// ── NeoMonitor SW v1 ──
const CACHE = 'neomonitor-v1';

// Recursos que se cachean al instalar (app shell)
const SHELL = [
  './monitor_neonatal_15_.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalar: cachear app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para app shell, network-first para Firebase
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase y Google Fonts: siempre red (datos en tiempo real)
  if (url.includes('firebaseio.com') ||
      url.includes('firebase') ||
      url.includes('gstatic.com/firebasejs')) {
    return; // dejar pasar sin interceptar
  }

  // Todo lo demás: cache-first con fallback a red
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cachear respuestas válidas
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin cache: para el HTML devolver la app cacheada
        if (e.request.destination === 'document') {
          return caches.match('./monitor_neonatal_15_.html');
        }
      });
    })
  );
});
