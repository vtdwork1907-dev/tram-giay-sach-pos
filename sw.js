// Đặt tên phiên bản Cache. Khi nào bạn cập nhật code lớn, hãy đổi 'v1' thành 'v2' để nó tự làm mới.
const CACHE_NAME = 'tgs-pos-cache-v1';

// Danh sách các file và thư viện tĩnh cần tải sẵn vào ổ cứng để chạy Offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap',
    'https://pub-d0286c0054894952a1babf1f9cc3e58d.r2.dev/uploads/1785661533368_ttzv4cr.png' // Logo
];

// SỰ KIỆN INSTALL: Cài đặt Service Worker và lưu các file vào Cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Đang lưu trữ cache ban đầu...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Ép kích hoạt ngay lập tức
});

// SỰ KIỆN ACTIVATE: Dọn dẹp các bản Cache cũ nếu có cập nhật phiên bản (v1 -> v2)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Đang xóa cache cũ:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// SỰ KIỆN FETCH: Xử lý khi ứng dụng yêu cầu tải một file hay dữ liệu
self.addEventListener('fetch', (event) => {
    // BỎ QUA các request không phải là lấy dữ liệu (như POST up ảnh, INSERT vào database)
    if (event.request.method !== 'GET') return;

    // BỎ QUA các API bên ngoài (Supabase, Cloudflare Worker API) 
    // Chúng ta quản lý dữ liệu offline bằng IndexedDB, không dùng Cache cho API để tránh loạn data.
    const url = new URL(event.request.url);
    if (url.hostname.includes('supabase.co') || url.hostname.includes('workers.dev')) {
        return;
    }

    // CHIẾN LƯỢC: NETWORK FIRST, FALLBACK TO CACHE
    // 1. Luôn thử ra Internet lấy file mới nhất trước
    // 2. Nếu mất mạng (lỗi fetch), thì nhảy vào Cache lấy file cũ ra xài
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Nếu tải thành công từ mạng, cập nhật lại vào cache để xài cho lần cúp mạng sau
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Nếu fetch thất bại (mất mạng), lấy từ Cache
                console.log('[Service Worker] Mất mạng, đang tải từ bộ nhớ đệm:', event.request.url);
                return caches.match(event.request);
            })
    );
});
