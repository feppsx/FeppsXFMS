// Minimal service worker for 360 Integrated PWA.
//
// Cache strategy:
//   * PRECACHE the offline fallback + core icons on install.
//   * DO NOT cache HTML navigations or RSC fetches — always go to network.
//     (Previous versions cached HTML which caused stale ticket lists.)
//   * Stale-while-revalidate for /_next/static/ chunks (immutable, cache-safe).
//
// Bump CACHE_VERSION to invalidate all runtime caches on every user's device.

const CACHE_VERSION = "v3-notcachehtml";
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const PRECACHE      = `precache-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([RUNTIME_CACHE, PRECACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch API, auth, Supabase, RSC payloads, or Next data:
  if (url.pathname.startsWith("/api/"))       return;
  if (url.pathname.startsWith("/auth/"))      return;
  if (url.pathname.startsWith("/_next/data")) return;
  // RSC refresh requests carry the ?_rsc= query param — never intercept them.
  if (url.searchParams.has("_rsc"))           return;

  // HTML page navigations: pure network. Only fall back to offline.html on
  // hard failure. We never cache the response, so the tech's job list is
  // never served stale.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // /_next/static/* chunks are content-hashed and safe to cache forever.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request).then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Static images / fonts / css from /public — stale-while-revalidate.
  if (/\.(png|jpg|jpeg|webp|svg|ico|woff2?|css)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request).then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});
