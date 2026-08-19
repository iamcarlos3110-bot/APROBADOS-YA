const CACHE_NAME = 'aprobados-ya-v63';

// Recursos estrictamente estáticos para arrancar la UI (solo rutas verificadas)
const STATIC_ASSETS = [
  './',
  './index.html',
  './style_v2.css',
  './app_v3.js',
  './data.js',
  './auth.js',
  './sync.js',
  './manifest.json',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/apple-touch-icon.png',
  './images/logo.png'
];

// URLs que NUNCA deben cachearse
const IGNORED_URLS = [
  'supabase.co',
  'stripe.com',
  '/api/',
  'chrome-extension'
];

self.addEventListener('install', (event) => {
  // Forzar instalación inmediata
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(err => console.warn('[SW] Non-critical asset cache skip:', url)))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  // Reclamar clientes inmediatamente y limpiar cachés antiguas
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Omitir caché para peticiones API, Supabase, Stripe o no-GET
  const isIgnored = IGNORED_URLS.some(url => requestUrl.href.includes(url));
  if (event.request.method !== 'GET' || isIgnored) {
    return; // El navegador hace el fetch normal, no intervenimos
  }

  // 2. Estrategia Network First (con fallback a Cache) para el HTML
  // Así siempre tienen la última versión si hay conexión
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Si no hay red, servir la copia cacheada
          return caches.match(event.request).then((response) => {
            if (response) return response;
            // Si tampoco está en caché, no podemos hacer mucho más, 
            // pero el HTML base debería estar ahí.
            return new Response('Sin conexión a Internet. No se pudo cargar Aprobados Ya.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            });
          });
        })
    );
    return;
  }

  // 3. Estrategia Cache First (con fallback a Network) para JS, CSS, Imágenes
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En background, actualizar la caché si hay red
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// Escuchar mensajes desde el cliente (p. ej. forzar recarga)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
