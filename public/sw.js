const CACHE_NAME = "liftly-shell-v2";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/liftly-icon.png",
  "/liftly-icon-192.png",
  "/liftly-icon-512.png",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(async () => {
        const cache = await caches.open(CACHE_NAME);
        const page = await cache.match("/");
        if (!page) return;
        const html = await page.clone().text();
        const assetPaths = Array.from(
          html.matchAll(/(?:src|href)=["'](\/[^"']+\.(?:js|css|woff2?))[^"']*["']/g),
          (match) => match[1],
        );
        await Promise.allSettled(assetPaths.map(async (path) => {
          const response = await fetch(path);
          if (response.ok) await cache.put(path, response);
        }));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) || (await caches.match("/")),
        ),
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    }),
  );
});
