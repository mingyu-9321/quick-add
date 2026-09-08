// 네트워크 우선(Network-first) 방식.
// 열 때 항상 최신 파일을 먼저 받아오고, 인터넷이 안 될 때만 캐시를 사용합니다.
// 캐시 이름에 버전을 넣어, 배포 때마다 옛 캐시를 자동 정리합니다.
const CACHE = 'quick-add-v3';
const ASSETS = [
  './',
  './index.html',
  './privacy.html',
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
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Google API/인증 요청은 서비스워커가 건드리지 않음 (항상 네트워크)
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com') ||
      url.hostname.includes('gstatic.com')) {
    return;
  }

  // GET 이외(POST 등)는 그대로 통과
  if (req.method !== 'GET') return;

  // 네트워크 우선: 최신을 먼저 받아오고 캐시에 갱신, 실패 시 캐시로 폴백
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
