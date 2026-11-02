/*
 * Hizmet çalışanı (service worker): kitaplığın tamamını cihaza indirir ve
 * internet olmadığında her şeyi önbellekten sunar.
 * BUILD bölümü `node tools/build.mjs` tarafından otomatik güncellenir.
 */
/* BUILD:START */
const VERSION = '03097740164b';
const ASSETS = [
  "./",
  "css/app.css",
  "data/library.js",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/icon-maskable.svg",
  "icons/icon.svg",
  "index.html",
  "js/app.js",
  "js/bundle.js",
  "js/config.js",
  "js/markdown.js",
  "js/pdf.js",
  "js/search.js",
  "js/storage.js",
  "manifest.webmanifest",
  "vendor/pdfmake/pdfmake.min.js",
  "vendor/pdfmake/vfs_fonts.js"
];
/* BUILD:END */

const CACHE = 'kk-' + VERSION;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return cache.addAll(ASSETS.map(function (u) { return new Request(u, { cache: 'reload' }); }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf('kk-') === 0 && k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Sayfa gezintileri: her zaman uygulama kabuğunu döndür (çevrim dışı da açılır)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html', { ignoreSearch: true }).then(function (cached) {
        return cached || fetch(req);
      }).catch(function () { return caches.match('index.html'); })
    );
    return;
  }

  // Diğer her şey: önce önbellek, yoksa ağ (ve önbelleğe ekle)
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
