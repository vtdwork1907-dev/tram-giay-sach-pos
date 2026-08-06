const CACHE_NAME = 'tramgiaysach-pos-v1';

// Các tệp tĩnh cần lưu vào ổ cứng điện thoại
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://pub-d0286c0054894952a1babf1f9cc3e58d.r2.dev/uploads/1785661533368_ttzv4cr.png' // Logo app
];

// 1. Khi cài đặt: Tải và lưu giao diện vào Cache
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Đã mở cache thành công');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Dọn dẹp cache cũ nếu có bản cập nhật (v2, v3...)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Khi mất mạng: Chặn request và trả về giao diện từ ổ cứng
self.addEventListener('fetch', event => {
  // Chỉ xử lý các request GET (Giao diện, ảnh, css). Không can thiệp API POST/PUT.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // Chiến lược: Ưu tiên lấy mạng (Network First) để luôn có app mới nhất. 
    // Nếu rớt mạng -> Mới lôi từ Cache ra dùng.
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        // Nếu URL không có trong cache, trả về trang chủ index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
