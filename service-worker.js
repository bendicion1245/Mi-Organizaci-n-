/* =========================================================
   MI ORGANIZACIÓN — SERVICE WORKER
   Guarda en caché todo lo necesario para que la app funcione
   sin conexión a Internet una vez instalada.

   IMPORTANTE (flujo de actualización):
   Cada vez que subas una nueva versión de index.html a GitHub,
   subí el service-worker.js con CACHE_NAME cambiado también
   (por ejemplo 'miorg-v1.0.1'), para forzar que el navegador
   descargue los archivos nuevos. Si no cambiás el nombre del
   caché, el navegador puede seguir mostrando la versión vieja.
   Para probar una versión nueva: modo incógnito, o desinstalar
   y reinstalar la PWA.
   ========================================================= */

const CACHE_NAME = 'miorg-v2.7.2';

const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

// --- Instalación: descarga y guarda los archivos base ---
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARCHIVOS_CACHE).catch(()=>{
        // Si algún ícono todavía no existe en el repo, no bloquea
        // la instalación del resto de la app.
      });
    })
  );
  self.skipWaiting();
});

// --- Activación: elimina cachés de versiones anteriores ---
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) => {
      return Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      );
    })
  );
  self.clients.claim();
});

// --- Estrategia de red: caché primero, con respaldo de red ---
self.addEventListener('fetch', (evento) => {
  if(evento.request.method !== 'GET') return;

  evento.respondWith(
    caches.match(evento.request).then((respuestaCache) => {
      if(respuestaCache) return respuestaCache;

      return fetch(evento.request)
        .then((respuestaRed) => {
          // Guarda copia en caché para la próxima vez que esté offline
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(evento.request, respuestaRed.clone());
            return respuestaRed;
          });
        })
        .catch(() => {
          // Sin conexión y sin caché disponible: si pidieron una
          // página HTML, se muestra el index como respaldo.
          if(evento.request.mode === 'navigate'){
            return caches.match('./index.html');
          }
        });
    })
  );
});
