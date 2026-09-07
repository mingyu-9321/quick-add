// 앱 셸 캐싱 — 오프라인에서도 화면은 열립니다.
// (실제 저장은 온라인 + Google 로그인이 필요합니다)
const CACHE = 'quick-add-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.request ? e.request.request.url : e.request.url);
  // Google API/인증 요청은 절대 캐시하지 않고 항상 네트워크로
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com') ||
      url.hostname.includes('gstatic.com')) {
    return; // 브라우저 기본 처리(네트워크)
  }
  // 그 외(앱 셸)는 캐시 우선, 없으면 네트워크
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});
