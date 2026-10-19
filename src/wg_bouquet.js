'use strict';
// Wildgrove: a bouquet for the frog. Four petals and a plant fiber tied by hand make a bouquet; USEd on the frog while it
// visits (wg_visit) it is given away, once a visit (each hero's own, the day in `w.meta.frogb`): the frog says how lovely
// it is, hearts fly and two little gifts from `WG_GIFTS` come back. For the rest of that visit the frog holds the flowers
// (a `wgFrogDraw` wrapper). Flowers given count in `stats.bouquet`; the first lights SAY IT WITH FLOWERS.
(function () {
  wgItem('bouquet', 'BOUQUET', 'res', { stack: 16 }); wgRec('bouquet', 1, { petal_r: 1, petal_y: 1, petal_p: 1, petal_w: 1, fiber: 1 }, 'hand');
  WG_ACH.push(['bouquet', 'SAY IT WITH FLOWERS', 'GIVE THE FROG A BOUQUET', (c) => (c.st.bouquet | 0) > 0]);
})();
const wgFrogHasFlowers = () => !!WGS.world && WGS.world.meta.frogb === (WGS.day | 0);
const _wgUseBouquet = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel], S = WGFV.spot, w = WGS.world;
  if (!s || s.id !== 'bouquet' || !S || S.tx !== tx || S.ty !== ty || !wgFrogVisits() || wgObjAt(w, WGS.dim, tx, ty) || wgFrogHasFlowers()) return _wgUseBouquet(tx, ty);
  const day = WGS.day | 0, p = WGS.p; wgInvTake(WGS.inv, 'bouquet', 1); w.meta.frogb = day;
  for (const k of [151, 163]) { const g = WG_GIFTS[hash(day, w.seed | 0, k) % WG_GIFTS.length], left = wgInvAdd(WGS.inv, g[0], g[1]); if (left) wgDrop(p.x, p.y, g[0], left); }
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.bouquet = (st.bouquet | 0) + 1;
  WGFV.say = { s: 'FOR ME? THEY ARE LOVELY!', t0: WGS.t }; wgToast('TWO LITTLE GIFTS FOR YOU', 3); wgSfx('croak'); wgSfx('chime');
  wgPart(tx * 16 + 8, ty * 16 - 4, 10, { c: ['r', 'R', 'q', 'P'], s: 30, up: 24, life: 1 });
  return true;
};
const _wgFrogDrawBouquet = wgFrogDraw;
wgFrogDraw = function (e, cx0, cy0) {
  _wgFrogDrawBouquet(e, cx0, cy0);
  if (!wgFrogHasFlowers()) return;
  const sx = Math.round(e.x - cx0), sy = Math.round(e.y - cy0), q = [WGS.p].concat(WGS.remote || []).filter(h => h && h.dim === WGS.dim).sort((a, b) => Math.abs(a.x - e.x) + Math.abs(a.y - e.y) - Math.abs(b.x - e.x) - Math.abs(b.y - e.y))[0];
  ctx.drawImage(wgBouquetArt(), q && q.x > e.x + 2 ? sx + 4 : sx - 13, sy - 10); // held at its side, the side it faces
};
function wgBouquetArt() { // four blooms over green stalks, tied with a bow
  return WGA.cache.bouquet_held || wgMake('bouquet_held', 9, 12, (g) => {
    for (const [x, y, c, h] of [[2, 2, 'r', 'R'], [5, 1, 'y', 'Y'], [3, 4, '2', '3'], [6, 4, 'L', 'w']]) { wgRc(g, x, y, 2, 2, c); wgPx(g, x, y, h); }
    wgPx(g, 4, 1, 'G'); wgPx(g, 1, 4, 'G'); wgPx(g, 7, 3, 'G');
    wgRc(g, 4, 6, 1, 5, 'g'); wgPx(g, 3, 6, 'G'); wgPx(g, 5, 6, 'g'); wgRc(g, 3, 8, 3, 1, 'P'); wgPx(g, 2, 9, 'P'); wgPx(g, 6, 9, 'P');
  });
}
const _wgTipBouquet = wgTipLines;
wgTipLines = function (s) { const L = _wgTipBouquet(s); if (s.id === 'bouquet') L.push('THE FROG WOULD LOVE IT'); return L; };
const _wgIconBouquet = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'bouquet') return _wgIconBouquet(id);
  return wgMake(key, 16, 16, (g) => { // blooms in a paper cone
    for (const [x, y, c, h] of [[3, 2, 'r', 'R'], [7, 1, 'y', 'Y'], [10, 3, 'L', 'w'], [5, 5, '2', '3'], [9, 6, 'r', 'R']]) { wgRc(g, x, y, 3, 3, c); wgPx(g, x, y, h); wgPx(g, x + 1, y + 1, 'o'); }
    wgPx(g, 2, 6, 'G'); wgPx(g, 12, 7, 'G'); wgPx(g, 6, 4, 'G');
    for (let y = 8; y < 15; y++) { const a = 3 + ((y - 8) >> 1), b = 12 - ((y - 8) >> 1); wgRc(g, a, y, b - a + 1, 1, 'A'); wgPx(g, b, y, 'a'); wgPx(g, a, y, 'w'); }
    wgRc(g, 5, 10, 6, 1, 'P');
  });
};
