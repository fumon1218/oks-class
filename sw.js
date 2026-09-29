// ok's class - 오프라인(설치형) 사용을 위한 서비스 워커
// 내용을 바꿀 때마다 CACHE_NAME 뒤 숫자를 올려주세요 (그래야 브라우저가 업데이트를 감지합니다)
const CACHE_NAME = 'oks-class-v20';
const ASSETS = [
  './',
  './index.html',
  './career/cafe.html',
  './korean/index.html',
  './korean/catch.html',
  './lobby/lobby-v2.css',
  './curriculum/catalog.json',
  './curriculum/game-blueprint.json',
  './minigames/index.html',
  './minigames/packs.js',
  './curriculum/teacher-guide.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// 화면(HTML)은 항상 최신을 먼저 받아오고, 오프라인일 때만 저장본을 씀(네트워크 우선).
// 아이콘 등 잘 안 바뀌는 파일은 저장본을 먼저 씀(캐시 우선) — 그래야 배포 직후에도 바로 새 화면이 보입니다.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isPage = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isPage) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
