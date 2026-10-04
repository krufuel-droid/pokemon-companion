/**
 * Poké Companion service worker.
 *
 * Strategy (deliberately conservative — a bad service worker is worse than none):
 * - Navigations: network-first, cache the OK response, fall back to cache,
 *   then a tiny offline page. Pages never go stale.
 * - Same-origin /api/* and ALL cross-origin requests (Supabase auth/data):
 *   network-only. Authenticated responses are NEVER cached.
 * - /_next/static/* (hashed, immutable): cache-first.
 * - Pokédex data (/learnsets/*.json) and sprites: cache-first, lazy-populated.
 * - Other same-origin static files (icons, manifest): cache-first.
 * - Only GET requests are intercepted. Everything else passes through.
 *
 * Bump VERSION to force clients onto a fresh cache; old pc-* caches are
 * deleted on activate.
 */

const VERSION = "pc-v1";
const PAGE_CACHE = `pc-pages-${VERSION}`;
const STATIC_CACHE = `pc-static-${VERSION}`;
const DATA_CACHE = `pc-data-${VERSION}`;

/** Minimal app shell precached at install. Non-fatal if offline. */
const PRECACHE_URLS = ["/", "/manifest.webmanifest"];

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline — Poké Companion</title>
<style>body{font-family:system-ui,sans-serif;background:#fafaf9;color:#1e293b;
display:flex;min-height:100vh;align-items:center;justify-content:center;
margin:0;padding:24px;text-align:center}
.card{max-width:320px}.dot{font-size:48px}
h1{font-size:20px;margin:12px 0 8px}p{font-size:14px;color:#64748b}
a{display:inline-block;margin-top:16px;padding:10px 20px;border-radius:12px;
background:#059669;color:#fff;text-decoration:none;font-weight:600}</style>
</head><body><div class="card"><div class="dot">🔌</div>
<h1>You're offline</h1>
<p>Poké Companion needs a connection for this page. Pages and Pokédex data
you've already visited are available offline.</p>
<a href="/">Try again</a></div></body></html>`;

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("pc-") && !k.endsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Cache-first with lazy population; only stores successful same-origin responses. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && new URL(request.url).origin === self.location.origin) {
    cache.put(request, res.clone());
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Cross-origin traffic (Supabase API/auth, CDNs): never intercept.
  if (url.origin !== self.location.origin) return;

  // Same-origin API routes: network-only. Authenticated data is never cached.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first so pages and logged-in state never go stale.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((hit) => hit || offlineResponse()),
        ),
    );
    return;
  }

  // Hashed Next.js assets: immutable, safe to cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Pokédex JSON data and sprites: cache-first, populated on first visit.
  if (
    url.pathname.startsWith("/learnsets/") ||
    url.pathname.startsWith("/sprites/")
  ) {
    event.respondWith(cacheFirst(req, DATA_CACHE));
    return;
  }

  // Remaining same-origin static files (icons, manifest, favicon): cache-first.
  event.respondWith(cacheFirst(req, STATIC_CACHE));
});
