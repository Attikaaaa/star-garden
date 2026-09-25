// Offline support: every file is cached on install, straight from the network (never from the
// browser's HTTP cache, or a release could be stored with last release's files). Later visits
// are served from the cache and refreshed in the background. Bump VERSION with each release.
const VERSION = 'star-garden-v19';
const FILES = [
  './', 'index.html', 'live.json', 'manifest.webmanifest', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'src/palette.js', 'src/save.js', 'src/online.js', 'src/rng.js', 'src/gfx.js', 'src/font.js', 'src/lang.js', 'src/lang_hu.js', 'src/art_chars.js', 'src/art_heroes.js', 'src/art_world.js', 'src/art_ui.js', 'src/art_more.js', 'src/art_items.js', 'src/art_foes.js', 'src/art_bosses.js', 'src/art_rooms.js', 'src/art_garden.js',
  'src/audio.js', 'src/input.js', 'src/data.js', 'src/level.js', 'src/entities.js', 'src/enemies.js', 'src/fx.js',
  'src/ui.js', 'src/meta.js', 'src/progress.js', 'src/firstrun.js', 'src/screens.js',
  'src/quests.js', 'src/stars.js', 'src/hub.js', 'src/book.js', 'src/items2.js', 'src/mail.js',
  'src/mods.js', 'src/daily.js', 'src/loot.js', 'src/affix.js',
  'src/foes.js', 'src/bosses.js', 'src/duel.js', 'src/story.js', 'src/rooms.js',
  'src/heroes.js', 'src/options.js', 'src/couch.js', 'src/cloud.js', 'src/yard.js', 'src/events.js', 'src/main.js', 'src/qr.js', 'src/net.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const live = new URL(e.request.url).pathname.endsWith('/live.json');
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    // live.json (events, news) is network-first, so live changes reach players at once
    if (live) return fresh.then(r => r || hit);
    return hit || fresh;
  }));
});
// Bloom reminders from the game server carry no data: the message is always the same.
self.addEventListener('push', e => {
  e.waitUntil(self.registration.showNotification('Star Garden', { body: 'A star flower has bloomed in your garden!', icon: 'icon-192.png', badge: 'favicon.png', tag: 'bloom' }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => (list.length ? list[0].focus() : self.clients.openWindow('./'))));
});
