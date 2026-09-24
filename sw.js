// Offline support: every file is cached on install; later visits are served from the cache
// and refreshed in the background. Bump VERSION with each release.
const VERSION = 'star-garden-v10';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'src/palette.js', 'src/save.js', 'src/gfx.js', 'src/font.js', 'src/art_chars.js', 'src/art_world.js', 'src/art_ui.js',
  'src/audio.js', 'src/input.js', 'src/data.js', 'src/level.js', 'src/entities.js', 'src/enemies.js', 'src/fx.js',
  'src/ui.js', 'src/meta.js', 'src/main.js', 'src/net.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || fresh;
  }));
});
