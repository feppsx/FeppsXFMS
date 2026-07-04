// Minimal service worker for 360 Integrated PWA.
// Strategy:
//   - Precache the offline fallback + core icons on install.
//   - Network-first for HTML navigations; fall back to /offline.html.
//   - Stale-while-revalidate for static assets (images, JS chunks, css).
//   - Skip API/auth/Supabase requests — never cache those.
//
// Bump CACHE_VERSION whenever you deploy a schema/UI change that must invalidate.

const CACHE_VERSION = "v1";
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const PRECACHE      = `precache-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([RUNTIME_CACHE, PRECACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function shouldSkip(url) {
  // Don't touch cross-origin requests (Supabase, etc.) or Next server actions.
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith("/api/"))    return true;
  if (url.pathname.startsWith("/auth/"))   return true;
  if (url.pathname.startsWith("/_next/data")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (shouldSkip(url)) return;

  // HTML navigations: network-first, fall back to offline.html.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline.html");
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((res) => {
              if (res && res.status === 200) cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});
