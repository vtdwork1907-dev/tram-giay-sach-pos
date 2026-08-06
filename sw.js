const CACHE_NAME = 'tgs-offline-shell-v5';

// Lắng nghe cài đặt
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.clients.claim();
});

// Chặn các request khi offline để không bao giờ hiện màn hình trắng của Safari
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Bỏ qua các API Supabase/Worker khi offline
    if (url.hostname.includes('supabase.co') || url.hostname.includes('workers.dev')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            // Nếu mất mạng hoàn toàn, trả về trang index.html từ cache của trình duyệt
            return caches.match(event.request) || caches.match('./index.html');
        })
    );
});
