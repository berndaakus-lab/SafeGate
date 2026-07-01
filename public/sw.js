const CACHE = "safegate-v2";

// Only pre-cache truly static assets
const STATIC_ASSETS = ["/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never intercept API routes, auth, or dynamic pages — let them go to network
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/guard/verify/") ||
    url.pathname.startsWith("/_next/") ||
    url.origin !== location.origin
  ) {
    return;
  }

  // Cache-first for static assets (icons, manifest)
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Network-first for everything else (pages)
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
