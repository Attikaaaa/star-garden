'use strict';
// Wildgrove: a bird feeder. A little roofed tray on a post; USE seeds on it to fill it (the tile's meta, up to
// WG_FEED_FULL, so friends see the same). While it holds seeds, on dry days four birds that live nowhere else come
// to eat: a goldfinch, a cardinal, a bluebird and a greenfinch. Who comes is worked out from the feeder's tile and the
// world's clock (`wgFeedVisit`, a visit every WG_FEED_SLOT seconds), so every screen sees the same birds; they keep
// away from a hero standing right beside it. The host lets them eat it down. Seeing all four lights BIRDWATCHER.
const WG_FEED_FULL = 6, WG_FEED_SLOT = 16, WG_FEED_SHY = 30;
const WG_FEED_BIRDS = [ // name, ramp (dark, mid, light, wing), a crest
  ['GOLDFINCH', ['o', 'y', 'Y', 'x'], 0], ['CARDINAL', ['p', 'r', 'R', 'x'], 1], ['BLUEBIRD', ['b', 'B', 'c', 'o'], 0], ['GREENFINCH', ['g', 'G', 'h', 'y'], 0]];
const WGFD = { list: [], t: 1 };
(function () {
  wgObj('birdfeeder', { name: 'BIRD FEEDER', kind: 'deco', tool: 'axe', hp: 3, feeder: 1, drops: [DR('birdfeeder', 1, 1)] });
  wgItem('birdfeeder', 'BIRD FEEDER', 'place', { place: 'birdfeeder' }); PLACE.birdfeeder = 'birdfeeder'; wgRec('birdfeeder', 1, { wood: 3, stick: 2 }, 'bench');
  WG_ACH.push(['birds', 'BIRDWATCHER', 'SEE ALL FOUR BIRDS AT A FEEDER', (c) => (c.st.birds | 0) === 15]);
})();
const wgFeedDay = () => WGS.dim === 'o' && wgNight(WGS.clock) < 0.3 && !WGS.weather;
const wgFeedT = () => ((WGS.day | 0) + WGS.clock % 1) * wgDayLen(); // the world's clock in seconds, the same on every screen
function wgFeedVisit(tx, ty, b, T) { // perch b's bird in the visit at time T: its kind and how far through (u 0..1), or null
  const n = Math.floor(T / WG_FEED_SLOT), h = hash(tx, ty, n * 2 + b + 1);
  if (h % 5 >= (b ? 2 : 4)) return null;
  return { k: hash(tx, ty, n * 8 + b + 5) % 4, u: T / WG_FEED_SLOT - n, a: (h >>> 4) % 4 * 0.04 + b * 0.1 };
}
const _wgUseFeed = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty);
  if (!id || !OBJ[id].feeder) return _wgUseFeed(tx, ty);
  const m = wgMetaAt(w, dim, tx, ty), s = WGS.inv[WGS.sel], it = s && WGI[s.id];
  if (!it || it.kind !== 'seed') { wgToast(m ? 'BIRDS COME HERE BY DAY' : 'IT NEEDS SEEDS'); return true; }
  if (m >= WG_FEED_FULL) { wgToast('IT IS FULL OF SEEDS'); return true; }
  wgInvTake(WGS.inv, s.id, 1); wgSetObj(w, dim, tx, ty, id, Math.min(WG_FEED_FULL, m + 2)); wgSfx('place'); wgToast('THE BIRDS WILL LOVE IT', 2);
  wgPart(tx * 16 + 8, ty * 16 - 2, 5, { c: ['e', 'a', 'N'], s: 14, up: 10 });
  return true;
};
// the host: the birds eat it down, a little at a time on dry days
const _wgUpdFeed = updateWG;
updateWG = function (dt) {
  _wgUpdFeed(dt);
  const w = WGS.world; if (!w || WGN.role === 'client' || !wgFeedDay() || (WGFD.t -= dt) > 0) return;
  WGFD.t = 1; const CS = WG.CS, id = O_ID.birdfeeder;
  for (const [key, ch] of w.chunks) {
    if (ch.dim !== 'o' && key[0] !== 'o') continue;
    for (let k = 0; k < CS * CS; k++) if (ch.o[k] === id && ch.m[k] > 0 && Math.random() < 1 / 90) wgSetObj(w, 'o', ch.cx * CS + k % CS, ch.cy * CS + Math.floor(k / CS), id, ch.m[k] - 1);
  }
};
// ---------- drawing: seeds on the tray by its fill; feeders in view are noted and their birds drawn with the ambient life ----------
const _wgDrawObjFeed = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjFeed(id, tx, ty, sx, sy);
  if (!OBJ[id].feeder) return;
  const m = wgMetaAt(WGS.world, WGS.dim, tx, ty); // the tray's top is sprite row 12, the sprite stands 12 px above its tile
  if (m) { const n = Math.ceil(m * 5 / WG_FEED_FULL); for (let i = 0; i < n; i++) rect(sx + 3 + i * 2, sy - 1, 2, 1, i & 1 ? 'a' : 'e'); if (n >= 4) rect(sx + 6, sy - 2, 4, 1, 'a'); } // a heap on the tray
  if (m && WGFD.list.length < 12) WGFD.list.push(tx, ty);
};
const _wgAmbFeed = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbFeed(cx0, cy0);
  const L = WGFD.list; if (!L.length) return;
  const p = WGS.p, T = wgFeedT(), day = wgFeedDay() && wgOpt().amb;
  for (let i = 0; day && i < L.length; i += 2) {
    const tx = L[i], ty = L[i + 1], hx = tx * 16 + 8, hy = ty * 16 + 14, dist = p ? Math.hypot(p.x - hx, p.y - hy) : 1e9;
    if (dist < WG_FEED_SHY) continue; // shy of a hero right beside it
    for (let b = 0; b < 2; b++) {
      const v = wgFeedVisit(tx, ty, b, T); if (!v) continue;
      const px = tx * 16 + (b ? 11 : 5), py = ty * 16 - 1, side = (hash(tx, ty, Math.floor(T / WG_FEED_SLOT) * 8 + b + 3) & 1) ? 1 : -1, fin = v.a + 0.08, fout = 0.86 + b * 0.04;
      let x = px, y = py, fly = 0;
      if (v.u < v.a || v.u > fout + 0.08) continue;
      if (v.u < fin) { const f = (v.u - v.a) / 0.08; x = px + side * 34 * (1 - f); y = py - 26 * (1 - f) + Math.sin(f * Math.PI) * -3; fly = 1; } // flying in
      else if (v.u > fout) { const f = (v.u - fout) / 0.08; x = px - side * 34 * f; y = py - 30 * f; fly = 1; } // and off again
      else if (Math.floor(WGS.t * 3 + b * 2 + tx) % 5 === 0) y += 1; // a peck
      const left = fly ? side > 0 : (hash(tx, ty, Math.floor(T / 2.3) * 2 + b) & 1) === 1;
      if (fly) shadow(Math.round(x - cx0), Math.round(hy - cy0), 3);
      ctx.drawImage(wgFeedBirdSpr(v.k, left, fly && Math.floor(WGS.t * 12) % 2), Math.round(x - cx0) - 4, Math.round(y - cy0) - 7);
      if (!fly && dist < 170 && WGN.role !== 'client') { // spotted
        const w = WGS.world, st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }), bit = 1 << v.k;
        if (!((st.birds | 0) & bit)) { st.birds = (st.birds | 0) | bit; wgToast('A ' + WG_FEED_BIRDS[v.k][0] + ' CAME TO EAT', 2.5); }
      }
    }
  }
  L.length = 0;
};
const _wgTipFeed = wgTipLines;
wgTipLines = function (s) { const L = _wgTipFeed(s); if (s.id === 'birdfeeder') L.push('FILL IT WITH SEEDS', 'BIRDS VISIT BY DAY'); return L; };
// ---------- art: four songbirds seen from the side (a crest on the cardinal), wings up in flight; the feeder ----------
function wgFeedBirdSpr(kind, left, flap) {
  const key = 'fbird' + kind + (left ? 'l' : 'r') + (flap ? 'f' : ''); if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(9, 8), [, R, crest] = WG_FEED_BIRDS[kind];
  if (!left) { const m = wgFeedBirdSpr(kind, true, flap); g.save(); g.scale(-1, 1); g.drawImage(m, -9, 0); g.restore(); WGA.cache[key] = c; return c; }
  wgBlob(g, 4.6, 4.6, 2.6, 1.7, [R[0], R[1], R[1], R[2]]); wgBlob(g, 2.8, 3.4, 1.5, 1.5, [R[1], R[1], R[2], R[2]]);
  wgPx(g, 1, 3, 'O'); wgPx(g, 2, 3, '0'); wgRc(g, 6, 4, 2, 1, R[0]);
  if (crest) wgPx(g, 3, 1, R[1]);
  if (flap) wgRc(g, 4, 2, 2, 2, R[3]); else { wgRc(g, 3, 5, 3, 1, R[3]); wgPx(g, 4, 7, 'O'); wgPx(g, 5, 7, 'O'); }
  wgOutline(c); WGA.cache[key] = c; return c;
}
const _wgBuildFeed = wgBuildAll;
wgBuildAll = function () {
  _wgBuildFeed();
  const W = ['u', 'n', 'N'];
  // a post, a tray with a lip, two little uprights and a red roof
  wgReg('birdfeeder', [wgMake('birdfeeder', 16, 28, (g) => {
    wgRc(g, 7, 14, 2, 13, W[1]); wgRc(g, 7, 14, 1, 13, W[2]); wgRc(g, 5, 26, 6, 1, W[0]);
    wgRc(g, 2, 12, 12, 2, W[1]); wgRc(g, 2, 12, 12, 1, W[2]); wgRc(g, 3, 14, 10, 1, W[0]); // the tray
    for (const x of [3, 12]) wgRc(g, x, 5, 1, 7, W[1]);
    for (let i = 0; i < 4; i++) wgRc(g, 1 + i, 4 - i, 14 - i * 2, 1, i ? 'r' : 'p'); wgRc(g, 1, 4, 1, 1, 'R'); wgRc(g, 6, 1, 4, 1, 'R'); // the roof, high enough for the birds below it
  })]);
};
