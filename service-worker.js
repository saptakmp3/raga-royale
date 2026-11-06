/* Raga Royale service worker. Bump VERSION whenever you change index.html so devices pick up the update. */
const VERSION = "v1";
const CACHE = "raga-royale-" + VERSION;
const SHELL = ["./", "./index.html", "./manifest.json",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png", "./icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("raga-royale-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {           // network first (3s), fall back to cache
    e.respondWith(new Promise(res => {
      const t = setTimeout(() => caches.match("./index.html").then(r => r && res(r)), 3000);
      fetch(req).then(r => { clearTimeout(t); const cp = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); res(r); })
        .catch(() => { clearTimeout(t); caches.match("./index.html").then(r => res(r || Response.error())); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => {
    const cp = n.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return n;
  })));
});
