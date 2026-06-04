// ============================================================================
// Kernel — Service Worker (MVP)
// ============================================================================
// Basic app shell caching for PWA. No offline OCR support in MVP.
// Caches the app shell so the app loads quickly on repeat visits.

const CACHE_NAME = "kernel-v1";

// App shell URLs to cache on install
const APP_SHELL = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/receipts",
  "/scan",
  "/settings",
];

// Install event — cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

// Activate event — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event — network-first with cache fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API requests (they need fresh data)
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(event.request).then((cached) => {
          return cached ?? new Response("Offline", { status: 503 });
        });
      })
  );
});
