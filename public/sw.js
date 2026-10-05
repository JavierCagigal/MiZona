// La versión anterior (PWA "FitLog") instalaba aquí un service worker que servía todo desde caché.
// Este lo sustituye: borra esa caché, se desinstala y recarga la página para que cargue la app nueva.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) await caches.delete(key);
      await self.registration.unregister();
      for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
    })()
  );
});
