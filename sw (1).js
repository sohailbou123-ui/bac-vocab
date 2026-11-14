// Service Worker — يجلب الصفحة من الإنترنت أولاً (فيصل التحديث فوراً)، ولا يستخدم النسخة المخزّنة إلا عند انقطاع الاتصال.
const CACHE = 'vocab-trainer-v3';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.json'])).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k !== CACHE);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.length) {   // كان عند المستخدم نسخة قديمة مخزّنة: أعد تحميل الصفحات المفتوحة لتظهر النسخة الجديدة
      const wins = await self.clients.matchAll({ type: 'window' });
      wins.forEach(w => { try { w.navigate(w.url); } catch (_) {} });
    }
  })());
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(r, { cache: 'no-store' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('./index.html')))
  );
});
