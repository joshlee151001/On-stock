// On-stock 서비스 워커: 홈 화면 앱으로 열리게 + 인터넷이 느릴 때 저장해 둔 화면 먼저
const CACHE = "onstock-v2";
const LIB = "onstock-lib-13.1.0";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== LIB).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.href.startsWith("https://www.gstatic.com/firebasejs/13.1.0/")) {
    e.respondWith(caches.open(LIB).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const net = fetch(e.request).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); } return r; });
    const cached = await caches.match(e.request);
    if (!cached) return net.catch(() => caches.match("./index.html"));
    return Promise.race([net.catch(() => cached), new Promise((r) => setTimeout(() => r(cached), 3000))]);
  })());
});
