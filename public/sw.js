// WatermarkPro - Complete Offline Service Worker
// Version: 2.1.0

const CACHE_VERSION = "v3";
const STATIC_CACHE = `watermarkpro-static-${CACHE_VERSION}`;
const CSS_JS_CACHE = `watermarkpro-css-js-${CACHE_VERSION}`;
const FONTS_CACHE = `watermarkpro-fonts-${CACHE_VERSION}`;
const PAGES_CACHE = `watermarkpro-pages-${CACHE_VERSION}`;

const ALL_CACHES = [STATIC_CACHE, CSS_JS_CACHE, FONTS_CACHE, PAGES_CACHE];

// Core static files to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/watermark",
  "/icon.svg",
  "/manifest.webmanifest",
];

// 1. Install Event: Pre-cache core assets & activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use individual puts or all with graceful error handling
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: "reload" })
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch((err) => {
              console.warn(`[SW] Failed to pre-cache asset: ${url}`, err);
            })
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated cache versions & claim all open clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => {
            console.log(`[SW] Deleting stale cache: ${key}`);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Helper: Determine if request is for Next.js CSS or JS chunk
function isNextStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/") || // Cache ALL Next.js assets (crucial for dev mode)
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webp")
  );
}

// Helper: Determine if request is for Google Fonts
function isGoogleFont(url) {
  return (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

// 3. Fetch Event: Multi-tiered smart caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests and browser extensions/schemes
  if (request.method !== "GET" || !request.url.startsWith("http")) {
    return;
  }

  // Skip Webpack HMR (Hot Module Replacement) and Dev Server requests
  if (
    request.url.includes("/_next/webpack-hmr") ||
    request.url.includes("hot-update.json") ||
    request.url.includes("hot-update.js")
  ) {
    return;
  }

  const url = new URL(request.url);

  // Strategy A: HTML Navigation (Network-First with fallback to cached page)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(PAGES_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log(`[SW] Offline navigation fallback for: ${request.url}`);
          // 1. Try exact requested page in pages cache (ignoring query strings like ?ts=)
          const exactMatch = await caches.match(request, { ignoreSearch: true });
          if (exactMatch) return exactMatch;

          // 2. Try matching /watermark
          const studioMatch = await caches.match("/watermark", { ignoreSearch: true });
          if (studioMatch) return studioMatch;

          // 3. Fallback to root /
          const rootMatch = await caches.match("/", { ignoreSearch: true });
          if (rootMatch) return rootMatch;

          // 4. Return offline HTML page fallback
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>WatermarkPro - Offline</title>
              <style>
                body { background: #0b0f19; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                .card { background: #111827; padding: 2rem; border-radius: 1rem; border: 1px solid #1f293d; max-width: 420px; }
                h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #6366f1; }
                p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
                a { display: inline-block; margin-top: 1rem; padding: 0.5rem 1.25rem; background: #6366f1; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>WatermarkPro Offline</h1>
                <p>You are currently offline. Please click below to open the cached Watermark Studio.</p>
                <a href="/watermark">Open Watermark Studio</a>
              </div>
            </body>
            </html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        })
    );
    return;
  }

  // Strategy B: Google Fonts (Cache-First)
  if (isGoogleFont(url)) {
    event.respondWith(
      caches.open(FONTS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request, { ignoreSearch: true });
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Graceful fallback if font is not yet in cache
          return new Response("", { status: 408, headers: { "Content-Type": "text/css" } });
        }
      })
    );
    return;
  }

  // Strategy C: Next.js Static Assets: CSS, JS Chunks, Media (Stale-While-Revalidate with Auto-Cache)
  if (isNextStaticAsset(url)) {
    event.respondWith(
      caches.open(CSS_JS_CACHE).then(async (cache) => {
        // ignoreSearch is crucial because Next.js dev server appends ?ts= timestamps to assets
        const cachedResponse = await cache.match(request, { ignoreSearch: true });

        // Background network fetch to keep cache fresh
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // If offline and not in cache, return safe empty response matching content type
            if (!cachedResponse) {
              if (url.pathname.endsWith(".css")) {
                return new Response("/* Offline CSS fallback */", {
                  headers: { "Content-Type": "text/css" },
                });
              }
              if (url.pathname.endsWith(".js") || url.pathname.includes(".js")) {
                return new Response("// Offline JS fallback", {
                  headers: { "Content-Type": "application/javascript" },
                });
              }
            }
            return cachedResponse;
          });

        // Return cached version immediately if available, else wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy D: Other requests (Cache-First with Network fallback)
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback response
          return new Response("", { status: 408, statusText: "Offline" });
        });
    })
  );
});

// 4. Message Event: Allow web app to communicate with service worker
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
