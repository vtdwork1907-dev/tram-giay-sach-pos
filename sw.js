// Tên bộ nhớ đệm
const CACHE_NAME = 'tramgiaysach-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap'
];

// Sự kiện Cài đặt (Install) - Lưu đệm các file tĩnh cần thiết
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Ép kích hoạt Service Worker ngay lập tức
});

// Sự kiện Kích hoạt (Activate) - Dọn dẹp cache cũ
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Sự kiện Fetch - Áp dụng chiến lược "Network First, falling back to Cache"
self.addEventListener('fetch', event => {
  // Chỉ can thiệp các request GET dạng tĩnh hoặc document
  if (event.request.method !== 'GET') return;
  
  // Bỏ qua các API của Supabase (để trình duyệt tự xử lý network offline error)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
