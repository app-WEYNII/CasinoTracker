/* ═══════════════════════════════════════════════════════════════════
 * Casino Tracker — Service Worker
 * ═══════════════════════════════════════════════════════════════════
 * Strategy:
 *  - App shell (HTML/manifest/icons): cache-first with background revalidation.
 *  - Navigation requests: network-first, fallback to cached index.html (offline).
 *  - Cross-origin (Dexie CDN): cache-first (immutable versioned URL).
 *  - Bump CACHE_VERSION on every release so old assets are evicted.
 * ═══════════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'v4';
const CACHE_NAME    = `casino-tracker-${CACHE_VERSION}`;

/* Pre-cache the full app shell on install. Paths are relative so the SW
   works whether deployed at root or under a subpath (GitHub Pages). */
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon-16.png',
  './favicon-32.png',
  './favicon.ico',
  './apple-touch-icon-120.png',
  './apple-touch-icon-152.png',
  './apple-touch-icon-167.png',
  './apple-touch-icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  /* External — Dexie. Versioned & immutable, safe to cache long-term. */
  'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.2.7/dexie.min.js',
];

/* ─── INSTALL: pre-cache app shell ─────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      /* addAll is atomic — if any URL fails, the whole install fails.
         Use individual adds to be tolerant of one-off network hiccups. */
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[SW] precache failed for', url, err);
          })
        )
      );
    })
  );
  /* Don't auto-activate — let the page decide via SKIP_WAITING message. */
});

/* ─── ACTIVATE: purge old cache versions ───────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('casino-tracker-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ─── MESSAGE: allow page to force-activate a waiting worker ───────── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ─── FETCH: route requests by type ────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  /* Only handle GET — let POST/PUT/etc. pass through untouched. */
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Navigation (HTML page loads): network-first → cached index → offline. */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          /* Update cached copy in the background. */
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  /* Same-origin assets + Dexie CDN: cache-first with background refresh. */
  const isSameOrigin = url.origin === self.location.origin;
  const isDexie      = url.href.startsWith('https://cdnjs.cloudflare.com/ajax/libs/dexie/');

  if (isSameOrigin || isDexie) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            /* Only cache valid responses (skip opaque errors, partials). */
            if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached); /* offline → return cached if any */
        return cached || network;
      })
    );
    return;
  }

  /* Anything else (third-party APIs, etc.): straight to network. */
});
