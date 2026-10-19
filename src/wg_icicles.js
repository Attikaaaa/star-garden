'use strict';
// Wildgrove: snowy walls and icicles. In winter, where wg_snowcap lets snow lie (outdoors, not on a floor, sand or ash),
// the top of every wall and cliff is white with snow, its lit edges brightest, a little sparkle and a soft shade where
// it meets the wall's face, and from a face that shows a lip of snow hangs over with a few icicles under it. A snowy
// copy of each wall piece is made once (`wgWallSnow`, the icicles placed by the piece's own variant, so a wall keeps
// them from frame to frame and on every screen) and lent by a `wgWall` wrapper while a `wgDrawObj` wrapper draws a wall.
const WGIC = { now: false, art: new WeakMap() };
function wgWallSnow(c, mask, v) { // a snowy copy of one wall piece (16 by 22: the top 16 rows its top, the rest its face)
  const had = WGIC.art.get(c); if (had) return had;
  const [o, g] = wgCv(16, 22, true); g.drawImage(c, 0, 0);
  const im = g.getImageData(0, 0, 16, 22), d = im.data, rgb = (k) => parseInt(PAL[k].slice(1), 16), O = rgb('0');
  const op = (x, y) => x >= 0 && x < 16 && y >= 0 && y < 22 && d[(y * 16 + x) * 4 + 3] >= 8, col = (x, y) => { const i = (y * 16 + x) * 4; return (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; };
  const put = (x, y, k) => { const i = (y * 16 + x) * 4, q = rgb(k); d[i] = q >> 16; d[i + 1] = (q >> 8) & 255; d[i + 2] = q & 255; d[i + 3] = 255; };
  const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
  const seen = new Map(); let base = -1, most = 0; // the top's own colour; its marks (mortar, grain, speckles) show faintly through the snow
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (op(x, y) && col(x, y) !== O) { const q = col(x, y), n = (seen.get(q) || 0) + 1; seen.set(q, n); if (n > most) { most = n; base = q; } }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!op(x, y) || col(x, y) === O) continue;
    const h = hash(x, y, mask * 3 + (v | 0) + 71) % 13;
    put(x, y, (!N && y === 1) || (!W && x === 1) ? 'w' : (!E && x === 14) || (!S && y === 15) || (col(x, y) !== base && (x + y) % 2) ? 'l' : h === 0 ? 'w' : 'L');
  }
  if (!S) { // a lip of snow over the face, icicles under it
    for (let x = 0; x < 16; x++) if (op(x, 16) && col(x, 16) !== O) put(x, 16, x % 5 === 2 ? 'l' : 'L');
    for (let x = 1; x < 15; x++) {
      const h = hash(x, mask, (v | 0) * 13 + 5), n = h % 7 < 2 || x === 3 + (v | 0) * 4 ? 2 + (h >>> 4) % 3 : 0; // a few columns, two to four long
      for (let k = 0; k < n; k++) if (op(x, 17 + k) && col(x, 17 + k) !== O) put(x, 17 + k, k === 0 ? 'w' : k === n - 1 ? 'c' : 'C');
    }
  }
  g.putImageData(im, 0, 0); WGIC.art.set(c, o); return o;
}
const _wgWallIcicles = wgWall;
wgWall = function (oid, mask, v) { const c = _wgWallIcicles(oid, mask, v); return WGIC.now ? wgWallSnow(c, mask, v) : c; };
const _wgDrawObjIcicles = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!WGSC.on || WGS.dim !== 'o' || !o || o.kind !== 'wall' || o.fence || !wgSnowcapTile(tx, ty)) return _wgDrawObjIcicles(id, tx, ty, sx, sy);
  WGIC.now = true; try { return _wgDrawObjIcicles(id, tx, ty, sx, sy); } finally { WGIC.now = false; }
};
