/**
 * NexusAI Service Worker — PWA Offline & Caching Layer
 * 
 * Strategy:
 * - App Shell (HTML, CSS, JS): Cache-first, update in background
 * - API/Firestore: Network-first, fall back to cache
 * - Images: Cache-first with long expiry
 * - Offline fallback: Show cached app shell when offline
 */

const CACHE_NAME = 'nexus-v2';
const OFFLINE_URL = '/';

// Files to pre-cache on install (app shell)
const PRECACHE_URLS = [
    '/',
];

// ─── Install: Pre-cache the app shell ─────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    // Activate immediately without waiting for old SW to die
    self.skipWaiting();
});

// ─── Activate: Clean old caches ───────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Take control of all open tabs immediately
    self.clients.claim();
});

// ─── Fetch: Smart caching strategy ───────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests (POST, PUT, etc.)
    if (request.method !== 'GET') return;

    // Skip internal API routes (proxy, etc.) — never cache
    if (url.pathname.startsWith('/api/')) return;

    // Skip Firebase/Firestore, Google Auth, and external API requests — always network
    if (
        url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('identitytoolkit') ||
        url.hostname.includes('securetoken') ||
        url.hostname.includes('accounts.google.com') ||
        url.hostname.includes('apis.google.com') ||
        url.hostname.includes('gstatic.com') ||
        url.protocol === 'chrome-extension:'
    ) {
        return;
    }

    // For navigation requests (HTML pages): Network-first, fallback to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the latest version
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    return response;
                })
                .catch(() => {
                    // Offline: serve from cache
                    return caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL));
                })
        );
        return;
    }

    // For static assets (JS, CSS, images): Cache-first, network fallback
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot|ico)$/) ||
        url.pathname.startsWith('/_next/')
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    // Return cached, but also update in background (stale-while-revalidate)
                    const fetchPromise = fetch(request).then((response) => {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
                        }
                        return response;
                    }).catch(() => cached);

                    return cached;
                }
                // Not cached: fetch and cache
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Everything else: Network-first
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});
