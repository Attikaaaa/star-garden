'use strict';
// Wildgrove: dandelions. In spring a few grass tiles with nothing on them grow one (`wgDandAt`, from the tile and the
// world's seed alone, so every screen has the same): a yellow flower for the season's first `WG_DAND_BLOOM` days, a
// white clock of seeds after. Walking through a clock, yours or a friend's, or USE on it blows it: its seeds float off
// on the wind (`wgWindA`, the weather vane's), rising and drifting, and a bare stem stands until it grows a new clock
// `WG_DAND_BACK` s later (`WGDN.gone`, each screen its own). Drawn on the ground through a `wgChunkUpkeep` wrapper, the
// seeds over everything by a `wgDrawAmbient` wrapper (none with the particles off). The MAKE A WISH star after twelve.
const WG_DAND_BLOOM = 3, WG_DAND_BACK = 90, WG_DAND_FLY = 5; // days in flower; seconds to grow a new clock; seconds a seed flies
const WGDN = { gone: new Map(), fluff: [], w: null, t: 0 }; // blown clocks: key to when it is back; the seeds in the air
(function () {
  WG_ACH.push(['dand', 'MAKE A WISH', 'BLOW TWELVE DANDELION CLOCKS', (c) => (c.st.dand | 0) >= 12]);
})();
function wgDandAt(tx, ty) { // the dandelion on a tile, or null: its spot in the tile and whether it is in flower yet
  const w = WGS.world; if (!w || wgSeason() !== 0) return null;
  const h = hash(tx, ty, (w.seed | 0) * 37 + 5113) >>> 0; if (h % 1000 >= 16) return null;
  if (wgGround(w, 'o', tx, ty) !== G_ID.grass || wgObjAt(w, 'o', tx, ty)) return null;
  return { dx: ((h >>> 10) % 9) - 4, dy: ((h >>> 14) % 5) - 2, flower: (WGS.day | 0) % 8 < WG_DAND_BLOOM };
}
const wgDandKey = (tx, ty) => tx + ',' + ty;
const wgDandBare = (tx, ty) => { const t = WGDN.gone.get(wgDandKey(tx, ty)); return t !== undefined && WGS.t < t; };
function wgDandBlow(tx, ty, mine) { // blows the clock on a tile if there is one: true when it did
  const D = wgDandAt(tx, ty); if (!D || D.flower || wgDandBare(tx, ty)) return false;
  WGDN.gone.set(wgDandKey(tx, ty), WGS.t + WG_DAND_BACK); if (WGDN.gone.size > 300) WGDN.gone.clear();
  const x = tx * 16 + 8 + D.dx, y = ty * 16 + 12 + D.dy;
  if (wgOpt().part) for (let i = 0; i < 7; i++) WGDN.fluff.push({ x, y, i, s: (hash(tx, ty, i) >>> 0) % 1000, t0: WGS.t });
  if (WGDN.fluff.length > 70) WGDN.fluff.splice(0, WGDN.fluff.length - 70);
  if (mine) {
    wgSfx('swish');
    const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.dand = Math.min(9999, (st.dand | 0) + 1);
  }
  return true;
}
const _wgUpdDand = updateWG;
updateWG = function (dt) {
  _wgUpdDand(dt);
  if (WGDN.w !== WGS.world) { WGDN.w = WGS.world; WGDN.gone.clear(); WGDN.fluff.length = 0; }
  const L = WGDN.fluff; while (L.length && (WGS.t - L[0].t0 > WG_DAND_FLY || L[0].t0 > WGS.t)) L.shift();
  const w = WGS.world, p = WGS.p; if (!w || !p || WGS.scr !== 'play' || WGS.dim !== 'o' || wgSeason() !== 0) return;
  if ((WGDN.t += dt) < 0.05) return; WGDN.t = 0;
  for (const q of [p].concat(WGS.remote || [])) { // walked through: yours or a friend's
    if (!q || q.hidden || (q !== p && q.dim !== 'o')) continue;
    const tx0 = Math.floor(q.x / 16), ty0 = Math.floor(q.y / 16);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const D = wgDandAt(tx0 + i, ty0 + j); if (!D || D.flower) continue;
      if (Math.abs(q.x - ((tx0 + i) * 16 + 8 + D.dx)) < 6 && Math.abs(q.y - ((ty0 + j) * 16 + 12 + D.dy)) < 5) wgDandBlow(tx0 + i, ty0 + j, q === p);
    }
  }
};
const _wgUseDand = wgUse;
wgUse = function (tx, ty) { return (WGS.world && WGS.dim === 'o' && wgDandBlow(tx, ty, true)) || _wgUseDand(tx, ty); };
// drawn on the ground, under everything that stands: a flower, a clock or a bare stem
const _wgUpkeepDand = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepDand(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world || wgSeason() !== 0) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const D = wgDandAt(tx, ty); if (!D) continue;
    const c = wgDandArt(D.flower ? 0 : wgDandBare(tx, ty) ? 2 : 1);
    ctx.drawImage(c, tx * 16 + 8 + D.dx - cx0 - 3, ty * 16 + 12 + D.dy - cy0 - c.height + 1);
  }
};
// the seeds in the air: a little white tuft over its seed, rising off the clock and drifting away on the wind
const _wgAmbDand = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbDand(cx0, cy0);
  const L = WGDN.fluff; if (!L.length) return;
  const T = WGS.t, wa = wgWindA(), wx = Math.cos(wa), wy = Math.sin(wa) * 0.5;
  for (const f of L) {
    const k = T - f.t0, sp = 10 + f.s % 9, up = 7 + 20 * (1 - Math.exp(-k / 1.6)) + Math.sin(k * 2 + f.s) * 2;
    const x = Math.round(f.x + (f.i - 3) * 1.5 * Math.min(1, k * 2) + wx * sp * k + Math.sin(k * 1.7 + f.s) * 3 - cx0);
    const y = Math.round(f.y + wy * sp * k - up - cy0);
    ctx.globalAlpha = Math.min(1, (WG_DAND_FLY - k) / 1.2); rect(x - 1, y, 3, 1, 'w'); rect(x, y + 1, 1, 1, 'L');
  }
  ctx.globalAlpha = 1;
};
function wgDandArt(k) { // 0 a yellow flower, 1 a white clock of seeds, 2 a bare stem: on a short stem with a leaf, lit from the top left
  const key = 'dand_' + k; if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 9, 11, (g) => {
    wgRc(g, 4, 5, 1, 5, 'g'); wgPx(g, 3, 8, 'G'); wgPx(g, 2, 9, 'G'); wgPx(g, 5, 9, 'g');
    if (k === 0) { wgRc(g, 3, 2, 3, 3, 'y'); wgPx(g, 4, 1, 'y'); wgPx(g, 2, 3, 'y'); wgPx(g, 6, 3, 'o'); wgPx(g, 4, 5, 'o'); wgPx(g, 3, 2, 'Y'); wgPx(g, 4, 3, 'O'); }
    else if (k === 1) { wgRc(g, 2, 1, 5, 4, 'L'); wgRc(g, 3, 0, 3, 6, 'L'); wgRc(g, 2, 1, 3, 2, 'w'); wgPx(g, 3, 0, 'w'); wgPx(g, 1, 2, 'w'); wgPx(g, 4, 3, 'e'); }
    else { wgPx(g, 4, 4, 'h'); }
  });
}
