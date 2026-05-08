const CACHE_NAME = "fishing-app-v1";

const STATIC_FILES = [
  "./",
  "./home.html",
  "./index.html",
  "./post.html",
  "./map.html",
  "./weather.html",
  "./analysis.html",
  "./admin.html",
  "./points.html",
  "./point-list.html",
  "./users.html",
  "./manifest.json",
  "./css/style.css",
  "./js/config.js",
  "./js/header.js",
  "./js/bottomTab.js",
  "./js/index.js",
  "./js/post.js",
  "./js/map.js",
  "./js/weather.js",
  "./js/analysis.js",
  "./js/admin.js",
  "./js/points.js",
  "./js/point-list.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});