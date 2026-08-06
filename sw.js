const CACHE_NAME = 'tgs-pos-cache-v3';

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
            console.log('[SW] Caching assets');
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

    // Bắt và giả lập phản hồi cho API nếu mất mạng để tránh văng app (crash)
    if (url.hostname.includes('supabase.co') || url.hostname.includes('workers.dev')) {
        if (!navigator.onLine) {
            event.respondWith(
                new Response(JSON.stringify({ error: "Offline mode" }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        }
        return; 
    }

    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return networkResponse;
            })
            .catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(event.request);
                
                if (cachedResponse) return cachedResponse;

                // CHÌA KHÓA FIX LỖI OFFLINE: Điều hướng request trang chủ (Navigation) về index.html
                if (event.request.mode === 'navigate') {
                    return cache.match('./index.html') || cache.match('/index.html');
                }
            })
    );
});
