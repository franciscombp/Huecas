/* ============================================================
   Service worker de Huecas — la app instalada juega sin internet.

   Estrategia: app shell completa en caché, nombrada con la versión
   (huecas-v24, huecas-v25…). Publicar una versión nueva cambia el
   nombre → el navegador instala este SW de nuevo, cachea todo al
   lado, y app.js le avisa al jugador que hay versión nueva. Solo
   cuando acepta (o al siguiente arranque) se activa y se limpian
   las cachés viejas: nunca se le cambia el juego a mitad de partida.
   ============================================================ */

importScripts('version.js');

const CACHE = 'huecas-' + APP_VERSION;
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './icons.js',
  './data.js',
  './recetario.js',
  './version.js',
  './icon.svg',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('huecas-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* el jugador aceptó actualizar: este SW toma el control ya */
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   /* fuentes de Google etc.: que las maneje el navegador */

  /* caché primero (el juego abre aunque no haya señal); si no está,
     red y se guarda para la próxima */
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: url.pathname.endsWith('/index.html') || url.pathname.endsWith('/') });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res.ok) { const c = await caches.open(CACHE); c.put(e.request, res.clone()); }
      return res;
    } catch (err) {
      /* sin red y sin caché: al menos la portada */
      const shell = await caches.match('./index.html');
      if (shell) return shell;
      throw err;
    }
  })());
});
