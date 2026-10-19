'use strict';
// Wildgrove: morning dew. At dawn, on dry mornings outdoors, beads of dew glint on some grass tiles with nothing on them
// (from the tile and the seed, `wgDewAt`), twinkling and drying away as the morning warms (`wgDewK`); in winter it is
// frost, more of it, lasting a little longer. Drawn flat on the ground through a `wgChunkUpkeep` wrapper; off with the
// ambient life option.
const WG_DEW_GROUNDS = ['grass', 'moss'];
function wgDewK() { // how much dew, 0..1, by the hour
  if (WGS.dim !== 'o' || !wgOpt().amb || WGS.weather) return 0;
  const c = WGS.clock % 1, end = wgSeason() === 3 ? 0.42 : 0.36;
  return c < 0.2 || c > end ? 0 : Math.min(1, (c - 0.2) / 0.03, (end - c) / 0.06);
}
function wgDewAt(tx, ty) { // the beads on a tile: 0, 1 or 2
  const h = hash(tx, ty, ((WGS.world && WGS.world.seed) | 0) * 7 + 333);
  return h % (wgSeason() === 3 ? 4 : 7) ? 0 : 1 + ((h >>> 8) & 1);
}
const _wgUpkeepDew = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, a, b, c, d) {
  _wgUpkeepDew(w, dim, a, b, c, d);
  const k = w === WGS.world ? wgDewK() : 0; if (!k) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2, T = WGS.t, frost = wgSeason() === 3;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  ctx.globalAlpha = k;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const n = wgDewAt(tx, ty); if (!n || wgObjAt(w, 'o', tx, ty) || !WG_DEW_GROUNDS.includes(GROUND[wgGround(w, 'o', tx, ty)].id)) continue;
    const h = hash(tx, ty, 919);
    for (let i = 0; i < n; i++) {
      const q = h >>> (i * 8), x = tx * 16 + 2 + (q % 11) - cx0, y = ty * 16 + 3 + ((q >>> 4) % 11) - cy0, glint = Math.sin(T * 2.6 + (q & 63)) > 0.85;
      if (frost) { rect(x, y, 1, 1, 'w'); rect(x - 1, y + 1, 3, 1, glint ? 'w' : 'L'); }
      else { rect(x, y, 1, 1, glint ? 'w' : 'C'); if (glint) rect(x + 1, y - 1, 1, 1, 'w'); }
    }
  }
  ctx.globalAlpha = 1;
};
