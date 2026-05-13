/* Phase F.4 — offline-first cache for versioned static assets (same-origin). */
const CACHE = 'lemonroom-static-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || req.headers.has('range')) return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (!/\.(js|mjs|css|woff2?|ttf|png|jpe?g|webp|avif|svg|ktx2|ico)$/i.test(url.pathname)) return

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((hit) => {
        if (hit) return hit
        return fetch(req).then((res) => {
          if (res.ok) void cache.put(req, res.clone())
          return res
        })
      }),
    ),
  )
})
