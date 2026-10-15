// sw.js : ระบบออฟไลน์ (เปลี่ยนเลข CACHE ทุกครั้งที่แก้ไฟล์ในแอป)
const CACHE = 'tiw-v5-0-0';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(new Promise(function (resolve) {
    let done = false;
    function finish(res) { if (!done && res) { done = true; resolve(res); } }
    function fromCache() {
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || caches.match('./index.html');
      });
    }
    const timer = setTimeout(function () { fromCache().then(finish); }, 4000);
    fetch(req).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      finish(res);
    }).catch(function () {
      clearTimeout(timer);
      fromCache().then(function (r) {
        finish(r || new Response('ออฟไลน์', { status: 503 }));
      });
    });
  }));
});
