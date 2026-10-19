'use strict';
// Wildgrove: tide pools. A few sand tiles beside the water (within two tiles of it, nothing on them) hold a small
// pool (`wgPoolAt`, from the tile and the world's seed alone, so every screen has the same), and in each lives one of
// `WG_POOLS`: a starfish, a sea anemone swaying, a sea urchin or a little crab that scuttles from side to side. Drawn
// flat on the sand through a `wgChunkUpkeep` wrapper. USE on one has a look and tells what lives there; every kind
// found is a bit in `stats.pools`, and the TIDE POOLER star is for all four.
const WG_POOLS = [['star', 'A STARFISH!'], ['anemone', 'A SEA ANEMONE!'], ['urchin', 'A SEA URCHIN!'], ['crab', 'A LITTLE CRAB!']];
(function () {
  WG_ACH.push(['pools', 'TIDE POOLER', 'FIND ALL FOUR TIDE POOL CREATURES', (c) => ((c.st.pools | 0) & 15) === 15]);
})();
function wgPoolAt(tx, ty) { // the tide pool on a tile, or null: what lives in it and its spot in the tile
  const w = WGS.world; if (!w || WGS.dim !== 'o') return null;
  const h = hash(tx, ty, (w.seed | 0) * 53 + 7121) >>> 0; if (h % 1000 >= 45) return null;
  if (GROUND[wgGround(w, 'o', tx, ty)].id !== 'sand' || wgObjAt(w, 'o', tx, ty)) return null;
  let wet = false; for (let j = -2; j <= 2 && !wet; j++) for (let i = -2; i <= 2; i++) if (GROUND[wgGround(w, 'o', tx + i, ty + j)].liq === 'water') { wet = true; break; }
  return wet ? { k: (h >>> 10) % WG_POOLS.length, dx: ((h >>> 13) % 3) - 1, dy: ((h >>> 16) % 3) - 1 } : null;
}
const _wgUsePool = wgUse;
wgUse = function (tx, ty) {
  const P = WGS.world && !WGS.inv[WGS.sel] && wgPoolAt(tx, ty); if (!P) return _wgUsePool(tx, ty);
  wgToast(WG_POOLS[P.k][1], 2); wgSfx('bubble'); wgPart(tx * 16 + 8 + P.dx, ty * 16 + 9 + P.dy, 3, { c: ['C', 'w'], s: 8, up: 8, life: 0.4 });
  const st = WGS.world.meta.stats || (WGS.world.meta.stats = { kills: 0, far: 0 }); st.pools = (st.pools | 0) | (1 << P.k);
  return true;
};
// drawn flat on the sand: the pool, and its creature (the anemone sways, the crab scuttles)
const _wgUpkeepPool = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepPool(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2, T = WGS.t;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const P = wgPoolAt(tx, ty); if (!P) continue;
    const x = tx * 16 + 8 + P.dx - cx0, y = ty * 16 + 9 + P.dy - cy0, k = WG_POOLS[P.k][0];
    ctx.drawImage(wgPoolArt('pool'), x - 7, y - 4);
    const f = k === 'anemone' ? Math.floor(T * 1.5 + tx) & 1 : 0, cx = k === 'crab' ? Math.round(Math.sin(T * 0.7 + ty) * 2) : 0;
    ctx.drawImage(wgPoolArt(k + f), x - 3 + cx, y - 2);
  }
};
function wgPoolArt(k) { // the pool (14 by 9, a damp rim round it) and its creatures (7 by 5), lit from the top left
  const key = 'pool_' + k; if (WGA.cache[key]) return WGA.cache[key];
  if (k === 'pool') return wgMake(key, 14, 9, (g) => { wgBlob(g, 7, 4.5, 6.6, 4, ['e', 'e', 'e', 'a']); wgBlob(g, 7, 4.5, 5.5, 3, ['B', 'c', 'c', 'C']); wgPx(g, 4, 3, 'w'); wgPx(g, 9, 6, 'b'); }, false);
  const rows = {
    star0: ['...o...', '.ooOoo.', '..oOo..', '.o...o.'], anemone0: ['.P.P.P.', '..PPP..', '.pPPPp.', '..ppp..'], anemone1: ['P..P..P', '.PPPPP.', '.pPPPp.', '..ppp..'],
    urchin0: ['.2.2.2.', '2.111.2', '.21112.', '2.2.2.2'], crab0: ['r.....r', '.rRRRr.', 'r.rrr.r', '.r...r.'],
  }[k];
  return wgMake(key, 7, 5, (g) => wgPaint(g, 0, 0, rows, { o: 'o', O: 'O', P: 'P', p: 'p', 1: '1', 2: '2', r: 'r', R: 'R' }), false);
}
