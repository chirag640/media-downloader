// ═══════════════════════════════════════════════════════════════
// MediaDrop Studio — Enhanced Service Worker v2
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = "mediadrop-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const STATIC_ASSETS = [
    "/",
    "/static/style.css",
    "/static/app.js",
    "/static/manifest.json",
];

const API_CACHEABLE_PATTERNS = [
    /\/api\/diagnostics/,
    /\/api\/health/,
    /\/api\/stats/,
    /\/api\/lan_info/,
    /\/api\/presets/,
];

const MAX_DYNAMIC_ENTRIES = 50;
const MAX_API_ENTRIES = 30;
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────
// Install: Pre-cache static assets
// ─────────────────────────────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                // Some assets may fail (e.g., if offline), that's ok
                console.warn("[SW] Pre-cache warning:", err);
            });
        }).then(() => self.skipWaiting())
    );
});

// ─────────────────────────────────────────────
// Activate: Clean up old caches
// ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key.startsWith("mediadrop-") && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE && key !== ASSET_CACHE)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// ─────────────────────────────────────────────
// Helper: trim cache to max entries
// ─────────────────────────────────────────────
async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        // Delete oldest entries (entries are sorted by insertion order)
        const toDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(toDelete.map((request) => cache.delete(request)));
    }
}

// ─────────────────────────────────────────────
// Helper: is request cacheable API
// ─────────────────────────────────────────────
function isCacheableApi(url) {
    return API_CACHEABLE_PATTERNS.some((pattern) => pattern.test(url));
}

// ─────────────────────────────────────────────
// Helper: is request a static asset
// ─────────────────────────────────────────────
function isStaticAsset(url) {
    const urlObj = new URL(url);
    return (
        urlObj.pathname.startsWith("/static/") &&
        (urlObj.pathname.endsWith(".js") ||
         urlObj.pathname.endsWith(".css") ||
         urlObj.pathname.endsWith(".json") ||
         urlObj.pathname.endsWith(".png") ||
         urlObj.pathname.endsWith(".svg") ||
         urlObj.pathname.endsWith(".ico") ||
         urlObj.pathname.endsWith(".webp"))
    );
}

// ─────────────────────────────────────────────
// Helper: is request a media file (for preview)
// ─────────────────────────────────────────────
function isMediaFile(url) {
    const pathname = new URL(url).pathname;
    return (
        pathname.startsWith("/api/jobs/") && pathname.endsWith("/file")
    );
}

// ─────────────────────────────────────────────
// Helper: is navigation request
// ─────────────────────────────────────────────
function isNavigationRequest(request) {
    return request.mode === "navigate";
}

// ─────────────────────────────────────────────
// Fetch: smart caching strategy
// ─────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = request.url;

    // Only handle GET requests
    if (request.method !== "GET") return;

    // Skip non-http(s) requests (e.g., chrome-extension://)
    if (!url.startsWith("http")) return;

    // ── 1. Static assets: Cache-first ──
    if (isStaticAsset(url)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                }).catch(() => {
                    // Offline fallback: return a minimal placeholder
                    return new Response("", { status: 408, statusText: "Offline" });
                });
            })
        );
        return;
    }

    // ── 2. API requests: Network-first with cache fallback ──
    if (url.includes("/api/")) {
        // Media file requests bypass cache (they're large downloads)
        if (isMediaFile(url)) {
            event.respondWith(fetch(request));
            return;
        }

        // Thumbnail requests: network-first
        if (url.includes("/api/thumbnail")) {
            event.respondWith(
                fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(ASSET_CACHE).then((cache) => {
                            cache.put(request, clone);
                            trimCache(ASSET_CACHE, 30);
                        });
                    }
                    return response;
                }).catch(() => caches.match(request))
            );
            return;
        }

        // Cacheable API endpoints (GET only, diagnostics/stats)
        if (isCacheableApi(url)) {
            event.respondWith(
                fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(API_CACHE).then((cache) => {
                            cache.put(request, clone);
                            trimCache(API_CACHE, MAX_API_ENTRIES);
                        });
                    }
                    return response;
                }).catch(() => caches.match(request))
            );
            return;
        }

        // Job status polling: network-first, no caching
        if (url.includes("/api/jobs/")) {
            event.respondWith(fetch(request));
            return;
        }

        // Default for other API: network-only
        return;
    }

    // ── 3. Navigation requests: Network-first with offline HTML fallback ──
    if (isNavigationRequest(request)) {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match("/").then((cached) => {
                    return cached || new Response("Offline", { status: 503 });
                });
            })
        );
        return;
    }

    // ── 4. Other requests (fonts, external): Network-first ──
    event.respondWith(
        fetch(request).then((response) => {
            // Cache Google Fonts and other external resources
            if (response.ok && response.type === "basic") {
                const clone = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(request, clone);
                    trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
                });
            }
            return response;
        }).catch(() => caches.match(request))
    );
});

// ─────────────────────────────────────────────
// Message handler: skip waiting for updates
// ─────────────────────────────────────────────
self.addEventListener("message", (event) => {
    if (event.data === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
