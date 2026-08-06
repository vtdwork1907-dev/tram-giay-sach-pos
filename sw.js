const CACHE_NAME = 'tramgiaysach-pos-v2';

// Danh sách các tệp tĩnh cần tải sẵn xuống ổ cứng máy
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://pub-d0286c0054894952a1babf1f9cc3e58d.r2.dev/uploads/1785661533368_ttzv4cr.png' // Logo app
];

// Cài đặt: Tải và lưu giao diện vào Cache
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Kích hoạt: Xóa bộ nhớ đệm cũ (nếu có bản cập nhật v3, v4)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
});

// Chặn request: Ưu tiên mạng, nếu mất mạng lôi từ ổ cứng ra dùng
self.addEventListener('fetch', event => {
  // Bỏ qua các API fetch data
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) return response;
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
