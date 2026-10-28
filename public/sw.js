const CACHE = 'qarib-v4';
const SHELL = ['./', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
const keep = (req, r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r; };
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // البطاقات والصفحة نفسها: الشبكة أولًا ثم المحفوظ (ليصل التحديث بعد كل نشر ويعمل التطبيق دون إنترنت)
  if (url.pathname.endsWith('/cards.json') || req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => keep(req, r)).catch(() => caches.match(req).then((hit) => hit || caches.match('./'))));
    return;
  }
  // الملفات ذات الأسماء المُرقّمة (js/css/الخطوط) لا تتغيّر: المحفوظ أولًا
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => keep(req, r)).catch(() => caches.match('./'))));
});
self.addEventListener('notificationclick', (e) => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('./')))); });
