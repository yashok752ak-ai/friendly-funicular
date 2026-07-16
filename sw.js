// Jimit Pet LLP — Service Worker
const CACHE = "jimit-pet-v2";
const ASSETS = [
  "./JimitPetLLP_Final.html",
  "./manifest.json"
];

// Install — cache assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", e => {
  // Google Sheets API — DO NOT intercept. Previously this SW re-fetched these
  // requests itself, but that internal fetch was failing with CORS errors in
  // some browsers/networks even when the real internet connection was fine —
  // silently returning a synthetic {"error":"offline"} response and causing
  // real pushed data to be lost. Now we simply let the browser handle these
  // requests natively, with zero involvement from the service worker.
  if(e.request.url.includes("script.google.com")) {
    return;
  }
  // App files — network first, then cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
