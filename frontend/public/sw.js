// AgroLens Offline-First Service Worker
const CACHE_NAME = "agrolens-cache-v1";
const OFFLINE_ASSETS = [
  "/",
  "/dashboard",
  "/class_names.json",
  "/agronomy_knowledge.json",
  "/crop_stage_knowledge.json",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icons.svg",
  "/ort/ort.wasm.min.js",
  "/ort/ort-wasm.wasm",
  "/ort/ort-wasm-simd.wasm",
  "/ort/ort-wasm-threaded.wasm",
  "/ort/ort-wasm-simd-threaded.wasm"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching core offline assets");
      return cache.addAll(OFFLINE_ASSETS).catch((err) => {
        console.warn("[ServiceWorker] Optional pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass through non-GET and API calls directly to network
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful responses for offline assets
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request);
        });
    })
  );
});
