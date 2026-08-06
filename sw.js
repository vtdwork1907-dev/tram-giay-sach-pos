const CACHE_NAME = 'tgs-pos-cache-v4'; // Đổi tên cache để ép máy tải lại

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap',
    'https://pub-d0286c0054894952a1babf1f9cc3e58d.r2.dev/uploads/1785661533368_ttzv4cr.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Chặn API để lừa hệ thống khi mất mạng
    if (url.hostname.includes('supabase.co') || url.hostname.includes('workers.dev')) {
        if (!navigator.onLine) {
            event.respondWith(
                new Response(JSON.stringify({ error: "Offline mode active" }), {
                    status: 503, headers: { 'Content-Type': 'application/json' }
                })
            );
        }
        return; 
    }

    if (event.request.method !== 'GET') return;

    // CHÌA KHÓA FIX LỖI TẮT APP MẤT MẠNG TRÊN IOS
    // Yêu cầu điều hướng trang (Mở app lên từ màn hình chính)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('./index.html') || caches.match('/index.html') || caches.match('/');
            })
        );
        return;
    }

    // Các yêu cầu file tĩnh (JS, CSS, Ảnh)
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
