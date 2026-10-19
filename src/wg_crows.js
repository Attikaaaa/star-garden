'use strict';
// Wildgrove: crows and scarecrows. By day, out of the rain, a crow comes down beside one crop in `WG_CROW_ONE` (chosen
// by the tile, the seed and the day, so every screen sees the same field) to peck about and hop, unless a scarecrow
// stands within `WG_CROW_GUARD` tiles: that is what a scarecrow is for. A hero coming within `WG_CROW_SHY` px sends it
// flapping up and away, and that crow stays off for `WG_CROW_BACK` s (`WGCW.gone`, this screen's own). They only look:
// no crop is harmed. Slotted into the world's depth order by a `wgEntities` wrapper; off with the ambient life option.
const WG_CROW_ONE = 24, WG_CROW_GUARD = 4, WG_CROW_SHY = 40, WG_CROW_BACK = 40;
const WGCW = { gone: new Map() };
const WG_CROW_ART = { // facing left: standing, pecking, flying
  stand: ['..xx.....', '.xwxx....', 'Xxxxxxx..', '..xxxxxxx', '...xXxxx.', '...X.X...'],
  peck: ['.........', '..xx.....', '.xwxxxx..', 'Xxxxxxxxx', '...xXxxx.', '...X.X...'],
  fly: ['X.......X', 'XX.....XX', '.xxXxxxx.', '..xxxx...', '...x.....', '.........'],
};
function wgCrowArt(k, right) {
  const key = 'crow_' + k + (right ? 'r' : ''); if (WGA.cache[key]) return WGA.cache[key];
  const rows = WG_CROW_ART[k];
  return wgMake(key, 11, 8, (g) => { if (right) { g.translate(11, 0); g.scale(-1, 1); } wgPaint(g, 1, 1, rows, { x: 'x', X: 'X', w: 'w' }); });
}
function wgCrowGuarded(tx, ty) { // a scarecrow keeps this crop
  const w = WGS.world, R = WG_CROW_GUARD;
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const id = wgObjAt(w, 'o', tx + i, ty + j); if (id && OBJ[id].id === 'scarecrow') return true; }
  return false;
}
function wgCrowAt(tx, ty) { // the crow beside this crop today, or null
  const w = WGS.world, h = hash(tx, ty, (w.seed | 0) * 7 + (WGS.day | 0) * 31 + 4049) >>> 0; if (h % WG_CROW_ONE) return null;
  const id = wgObjAt(w, 'o', tx, ty); if (!id || OBJ[id].kind !== 'crop' || wgCrowGuarded(tx, ty)) return null;
  return { x: tx * 16 + 8 + ((h >>> 4) % 9) - 4, y: ty * 16 + 14, ph: (h >>> 9) % 628 / 100, right: !!((h >>> 13) & 1) };
}
const wgCrowsOut = () => WGS.dim === 'o' && wgOpt().amb && wgNight(WGS.clock) < 0.3 && !(WGS.weather && WGS.weather.kind === 'rain');
const _wgEntsCrow = wgEntities;
wgEntities = function (x0, y0, x1, y1) {
  const out = _wgEntsCrow(x0, y0, x1, y1);
  if (!WGS.world || !wgCrowsOut()) return out;
  const T = WGS.t, heroes = [WGS.p].concat((WGS.remote || []).filter(q => q.dim === WGS.dim));
  for (let ty = Math.floor(y0 / 16); ty <= Math.floor(y1 / 16); ty++) for (let tx = Math.floor(x0 / 16); tx <= Math.floor(x1 / 16); tx++) {
    const C = wgCrowAt(tx, ty); if (!C) continue;
    const key = tx + ',' + ty, gone = WGCW.gone.get(key);
    if (gone !== undefined && T < gone) { if (T - (gone - WG_CROW_BACK) < 1.4) out.push({ x: C.x, y: C.y, C, s: gone - WG_CROW_BACK, draw: wgCrowDraw }); continue; }
    if (gone !== undefined) WGCW.gone.delete(key);
    if (heroes.some(q => q && !q.hidden && Math.hypot(q.x - C.x, q.y - C.y) < WG_CROW_SHY)) { WGCW.gone.set(key, T + WG_CROW_BACK); if (WGCW.gone.size > 200) WGCW.gone.clear(); out.push({ x: C.x, y: C.y, C, s: T, draw: wgCrowDraw }); continue; }
    out.push({ x: C.x, y: C.y, C, draw: wgCrowDraw });
  }
  return out;
};
function wgCrowDraw(e, cx0, cy0) {
  const C = e.C, T = WGS.t;
  if (e.s !== undefined) { // flapping up and away from the hero
    const u = T - e.s, dir = C.right ? 1 : -1, x = Math.round(C.x + dir * u * 70 - cx0), y = Math.round(C.y - u * 50 - cy0);
    ctx.globalAlpha = Math.max(0, Math.min(1, (1.4 - u) * 2)); shadow(Math.round(C.x + dir * u * 70 - cx0), Math.round(C.y - cy0), 3);
    ctx.drawImage(wgCrowArt(Math.floor(u * 10) % 2 ? 'fly' : 'stand', C.right), x - 5, y - 8); ctx.globalAlpha = 1; return;
  }
  const k = (T * 0.8 + C.ph) % 3, hop = Math.floor((T * 0.8 + C.ph) / 3) % 2 ? 2 : -2, peck = k < 0.25 || (k > 1.2 && k < 1.45);
  const x = Math.round(C.x + hop - cx0), y = Math.round(C.y - cy0) - (k > 2.85 ? 2 : 0); // a little hop to a new spot now and then
  shadow(x, Math.round(C.y - cy0), 3); ctx.drawImage(wgCrowArt(peck ? 'peck' : 'stand', C.right), x - 5, y - 7);
}
