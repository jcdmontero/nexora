const CACHE_VERSION = 'nexora-v2'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PAGE_CACHE = `${CACHE_VERSION}-pages`

// Assets que Vite genera con hash en el filename
const STATIC_ASSETS = [
  '/',
]

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

// Activate: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// Helper: guardar operación offline en IndexedDB vía el client
async function saveOfflineOperation(request) {
  const clone = request.clone()
  const body = await clone.json()
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({
      type: 'OFFLINE_OPERATION',
      payload: body,
    })
  })
}

// Fetch: estrategia según tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) return

  // POST/PUT/PATCH a rutas de datos: interceptar si offline
  if (
    (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') &&
    !url.pathname.startsWith('/build/') &&
    !url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      fetch(request).catch(async () => {
        // Offline: guardar en cola vía message al client
        try {
          await saveOfflineOperation(request)
        } catch {}
        // Retornar respuesta synthetic
        return new Response(
          JSON.stringify({ queued: true, message: 'Operación encolada para sincronización offline' }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      })
    )
    return
  }

  // Navegación (HTML): Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    )
    return
  }

  // Assets estáticos (JS, CSS, fuentes, imágenes): Cache First
  if (
    url.pathname.startsWith('/build/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // Todo lo demás: Network only
})
