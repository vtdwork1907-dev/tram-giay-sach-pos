const CACHE_NAME = 'tgs-pos-cache-v6';

// 1. Cài đặt và nạp sẵn các file tĩnh vào cache
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './manifest.json',
                'https://cdn.tailwindcss.com',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
                'https://cdn.jsdelivr.net/npm/chart.js',
                'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
                'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap',
                'https://pub-d0286c0054894952a1babf1f9cc3e58d.r2.dev/uploads/1785661533368_ttzv4cr.png'
            ]).catch(err => console.log('Cache addAll error:', err));
        })
    );
});

// 2. Kích hoạt và dọn dẹp cache cũ
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

// 3. Đón nhận mọi request fetch, tuyệt đối không bao giờ trả về null
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Bỏ qua các API của Supabase hoặc Cloudflare Worker
    if (url.hostname.includes('supabase.co') || url.hostname.includes('workers.dev')) {
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
                
                // Nếu tìm thấy trong cache thì trả về luôn
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Nếu là yêu cầu mở trang web (navigate) mà không có mạng lẫn cache, trả về index.html dự phòng
                if (event.request.mode === 'navigate') {
                    const fallbackHtml = await cache.match('./index.html') || await cache.match('/index.html');
                    if (fallbackHtml) return fallbackHtml;
                    
                    // TUYỆT ĐỐI KHÔNG NULL: Trả về một trang HTML thông báo nhẹ nhàng nếu mất mạng từ đầu
                    return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Trạm Giày Sạch Offline</title></head><body style="font-family:sans-serif;text-align:center;padding-top:80px;background:#0a2347;color:white;padding:20px;"><h2>TRẠM GIÀY SẠCH (OFFLINE)</h2><p style="font-size:14px;opacity:0.8;margin-bottom:20px;">Vui lòng kết nối mạng ít nhất 1 lần để ứng dụng khởi tạo dữ liệu ngoại tuyến.</p><button onclick="location.reload()" style="padding:12px 24px;background:#10b981;color:white;border:none;border-radius:12px;font-weight:bold;font-size:14px;">Tải Lại Trang</button></body></html>', {
                        status: 200,
                        headers: { 'Content-Type': 'text/html; charset=utf-8' }
                    });
                }

                // Đối với các tài nguyên phụ khác, trả về lỗi 404 giả lập để không bị sập app
                return new Response('Offline fallback error', { status: 404, statusText: 'Not Found' });
            })
    );
});
