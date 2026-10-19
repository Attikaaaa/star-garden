// Offline support: every file is cached on install, straight from the network (never from the
// browser's HTTP cache, or a release could be stored with last release's files). Later visits
// are served from the cache and refreshed in the background. Bump VERSION with each release.
const VERSION = 'star-garden-v159';
const FILES = [
  './', 'index.html', 'live.json', 'manifest.webmanifest', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'src/palette.js', 'src/save.js', 'src/online.js', 'src/rng.js', 'src/gfx.js', 'src/font.js', 'src/lang.js', 'src/lang_hu.js', 'src/lang_hu_wg.js', 'src/art_chars.js', 'src/art_heroes.js', 'src/art_world.js', 'src/art_ui.js', 'src/art_more.js', 'src/art_items.js', 'src/art_foes.js', 'src/art_bosses.js', 'src/art_rooms.js', 'src/art_garden.js', 'src/art_scenery.js',
  'src/audio.js', 'src/input.js', 'src/data.js', 'src/level.js', 'src/scenery.js', 'src/entities.js', 'src/enemies.js', 'src/fx.js',
  'src/ui.js', 'src/meta.js', 'src/progress.js', 'src/firstrun.js', 'src/screens.js',
  'src/quests.js', 'src/stars.js', 'src/hub.js', 'src/book.js', 'src/items2.js', 'src/mail.js',
  'src/mods.js', 'src/daily.js', 'src/loot.js', 'src/affix.js',
  'src/foes.js', 'src/bosses.js', 'src/duel.js', 'src/story.js', 'src/rooms.js',
  'src/heroes.js', 'src/options.js', 'src/couch.js', 'src/cloud.js', 'src/yard.js', 'src/casino.js', 'src/art_casino.js', 'src/slot.js', 'src/cards.js', 'src/roulette.js', 'src/scratch.js', 'src/lounge.js', 'src/holdem.js', 'src/events.js', 'src/road.js', 'src/lands.js', 'src/wardens.js', 'src/woods.js', 'src/toy.js', 'src/snow.js', 'src/sun.js', 'src/library.js', 'src/forge.js', 'src/deep.js', 'src/moon.js', 'src/items3.js', 'src/wg_data.js', 'src/wg_world.js', 'src/wg_art.js', 'src/wg_art2.js', 'src/wg_extra.js', 'src/wg_game.js', 'src/wg_render.js', 'src/wg_mobs.js', 'src/wg_store.js', 'src/wg_net.js', 'src/wg_ui.js', 'src/wg_main.js', 'src/wg_map.js', 'src/wg_cozy.js', 'src/wg_sign.js', 'src/wg_fish.js', 'src/wg_garden.js', 'src/wg_orchard.js', 'src/wg_rest.js', 'src/wg_farm.js', 'src/wg_album.js', 'src/wg_music.js', 'src/wg_post.js', 'src/wg_bugs.js', 'src/wg_home.js', 'src/wg_winter.js', 'src/wg_gaze.js', 'src/wg_breeze.js', 'src/wg_paths.js', 'src/wg_swing.js', 'src/wg_pond.js', 'src/wg_hearth.js', 'src/wg_dairy.js', 'src/wg_trees.js', 'src/wg_hats.js', 'src/wg_pondlife.js', 'src/wg_bike.js', 'src/wg_ways.js', 'src/wg_pets.js', 'src/wg_wardrobe.js', 'src/wg_rainbow.js', 'src/wg_lanterns.js', 'src/wg_puddles.js', 'src/wg_mallow.js', 'src/wg_emote.js', 'src/wg_leaves.js', 'src/wg_prints.js', 'src/wg_hats2.js', 'src/wg_wishes.js', 'src/wg_paint.js', 'src/wg_tank.js', 'src/wg_clock.js', 'src/wg_books.js', 'src/wg_festive.js', 'src/wg_drift.js', 'src/wg_garland.js', 'src/wg_skip.js', 'src/wg_clouds.js', 'src/wg_sparkler.js', 'src/wg_seaside.js', 'src/wg_vane.js', 'src/wg_rainbarrel.js', 'src/wg_petbed.js', 'src/wg_fireworks.js', 'src/wg_beach.js', 'src/wg_feeder.js', 'src/wg_eggs.js', 'src/wg_hats3.js', 'src/wg_icefish.js', 'src/wg_skates.js', 'src/wg_bottle.js', 'src/wg_geese.js', 'src/wg_aurora.js', 'src/wg_hammock.js', 'src/wg_mist.js', 'src/wg_laundry.js', 'src/wg_ocarina.js', 'src/wg_fairy.js', 'src/wg_snowball.js', 'src/wg_umbrella.js', 'src/wg_drizzle.js', 'src/wg_treasure.js', 'src/wg_spring.js', 'src/wg_pottery.js', 'src/wg_gnome.js', 'src/wg_squirrel.js', 'src/wg_jam.js', 'src/wg_topiary.js', 'src/wg_hedgehog.js', 'src/wg_windmill.js', 'src/wg_moths.js', 'src/wg_bees.js', 'src/wg_tent.js', 'src/wg_owl.js', 'src/wg_candles.js', 'src/wg_bonsai.js', 'src/wg_chalk.js', 'src/wg_picnic.js', 'src/wg_sunflower.js', 'src/wg_crickets.js', 'src/wg_dew.js', 'src/wg_smoke.js', 'src/wg_windfall.js', 'src/wg_woodpile.js', 'src/wg_quilt.js', 'src/wg_snowcap.js', 'src/wg_icicles.js', 'src/wg_frostrim.js', 'src/wg_breath.js', 'src/wg_bunting.js', 'src/wg_duskbats.js', 'src/wg_leap.js', 'src/wg_lilyfrog.js', 'src/wg_nests.js', 'src/wg_forage.js', 'src/wg_press.js', 'src/wg_starwater.js', 'src/wg_waterlantern.js', 'src/wg_shake.js', 'src/wg_crows.js', 'src/wg_bubbles.js', 'src/wg_dandelion.js', 'src/wg_balloon.js', 'src/wg_cocoa.js', 'src/wg_train.js', 'src/wg_sleep.js', 'src/wg_chorus.js', 'src/wg_hats4.js', 'src/wg_soundscape.js', 'src/wg_cairn.js', 'src/wg_tidepool.js', 'src/wg_herbs.js', 'src/wg_paperboat.js', 'src/wg_terrarium.js', 'src/wg_details.js', 'src/wg_daily.js', 'src/wg_moonphase.js', 'src/main.js', 'src/qr.js', 'src/net.js', 'src/overlay.js',
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
