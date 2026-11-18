const CACHE_NAME = 'ksvh-qc-static-__BUILD_ID__'
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // TUYỆT ĐỐI KHÔNG CACHE API HOẶC CÁC YÊU CẦU DỮ LIỆU ĐỘNG / PHI-GET
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/v3/')) {
    return
  }

  // 1. Điều hướng SPA (Navigation) và index.html: Network-First
  // Khi có mạng: tải bản mới nhất từ server và cập nhật cache cho lần sau
  // Khi mất mạng: trả về index.html từ cache để ứng dụng hoạt động offline bình thường
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone)
              cache.put('/index.html', clone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/index.html')
          })
        })
    )
    return
  }

  // 2. Tài nguyên tĩnh đã được hash (/assets/) hoặc các icon cố định: Cache-First, fallback Network
  if (url.pathname.startsWith('/assets/') || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }
})
