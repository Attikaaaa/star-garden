'use strict';
// Wildgrove: frozen edges. In winter thin ice creeps out from the shores: on every water tile outdoors that meets the
// land, a ragged band of pale ice one to three pixels wide lies along that side, a white glint here and there, its
// shape from the tile alone (`wgFrostRim`, baked once per side and shape). Only to look at: the water is water still.
// Drawn flat through a `wgChunkUpkeep` wrapper; none with the weather effects off.
const WG_RIM_SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // north, east, south, west
function wgFrostRim(side, v) { // a band of ice along one side of a tile, in one of four shapes
  const key = 'rim_' + side + '_' + v; if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 16, 16, (g) => {
    for (let i = 0; i < 16; i++) {
      const h = hash(i, side, v * 7 + 3), n = 1 + (h % 3 === 0 ? 2 : h % 3 === 1 ? 1 : 0); // how far out the ice reaches here
      for (let k = 0; k < n; k++) {
        const [x, y] = side === 0 ? [i, k] : side === 1 ? [15 - k, i] : side === 2 ? [i, 15 - k] : [k, i];
        wgPx(g, x, y, k === 0 ? ((h >>> 5) % 5 === 0 ? 'w' : 'L') : k === n - 1 ? 'C' : 'l');
      }
    }
  }, false);
}
const _wgUpkeepRim = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepRim(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world || wgSeason() !== 3 || !wgOpt().wx) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (GROUND[wgGround(w, 'o', tx, ty)].liq !== 'water') continue;
    for (let s = 0; s < 4; s++) {
      const [i, j] = WG_RIM_SIDES[s], g = GROUND[wgGround(w, 'o', tx + i, ty + j)]; if (g.liq || g.void) continue;
      ctx.drawImage(wgFrostRim(s, hash(tx, ty, s + 41) & 3), tx * 16 - cx0, ty * 16 - cy0);
    }
  }
};
