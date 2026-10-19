'use strict';
// Wildgrove: snow on things. In winter snow lies along the tops of what stands outdoors, as it does on the crowns of the
// trees: chests, barrels, benches, rocks, fences, signs and the rest. A snowy copy of each sprite is made once from its
// own art (`wgSnowcapArt`: where a column's top meets the sky, the first pixels under the outline turn white, softer on
// every other column, never down a steep side or on a lone spike), and a `wgDrawObj` wrapper lends an object those
// copies while it is drawn (fences through a `wgFence` wrapper, art an object draws itself through `wgSnowy`). Nothing warm (lights, fires, flickering things), nothing
// that grows, nothing flat on the ground, and nothing indoors (on a floor), on sand or on ash takes snow.
const WG_SNOWCAP_SKIP = new Set(['tree', 'plant', 'sapling', 'crop', 'light', 'door', 'stairs', 'rain', 'sprinkler', 'compost']);
const WGSC = { on: false, now: false, art: new WeakMap(), lists: new WeakMap() };
const wgSnowcapOk = (o) => !!o && !WG_SNOWCAP_SKIP.has(o.kind) && (o.kind !== 'wall' || o.fence) && !o.light && !o.anim && o.st !== 'fire' && !o.chalk;
function wgSnowcapTile(tx, ty) { // is this tile out in the snow: not on a floor, sand or ash
  const g = GROUND[wgGround(WGS.world, 'o', tx, ty)]; return !!g && !g.floor && !g.liq && g.id !== 'sand' && g.id !== 'ash';
}
function wgSnowcapArt(c) { // a snowy copy of one sprite canvas, or the canvas itself when snow finds nowhere to lie
  const had = WGSC.art.get(c); if (had) return had;
  const W = c.width, H = c.height; let out = c;
  if (H >= 6) {
    const [o, g] = wgCv(W, H, true); g.drawImage(c, 0, 0);
    const im = g.getImageData(0, 0, W, H), d = im.data, rgb = (k) => parseInt(PAL[k].slice(1), 16), O = rgb('0');
    const op = (x, y) => y >= 0 && y < H && d[(y * W + x) * 4 + 3] >= 8, col = (x, y) => { const i = (y * W + x) * 4; return (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; };
    const put = (x, y, k) => { const i = (y * W + x) * 4, v = rgb(k); d[i] = v >> 16; d[i + 1] = (v >> 8) & 255; d[i + 2] = v & 255; };
    const top = []; for (let x = 0; x < W; x++) { let y = 0; while (y < H && !op(x, y)) y++; top.push(y); }
    let n = 0;
    for (let x = 0; x < W; x++) {
      const y = top[x]; if (y > H - 5) continue; // nothing in this column, or only a low edge on the ground
      const l = x > 0 ? top[x - 1] : H, r = x < W - 1 ? top[x + 1] : H;
      if (Math.abs(l - y) > 1 && Math.abs(r - y) > 1) continue; // a lone spike, a steep side
      let k = col(x, y) === O ? 1 : 0; const k0 = k;
      for (; k <= k0 + 1; k++) { // two pixels deep under the outline, the lower one on every other column
        if (!op(x, y + k) || col(x, y + k) === O) break;
        if (k === k0) put(x, y + k, 'w'); else if (x & 1) put(x, y + k, 'L');
      }
      n++;
    }
    if (n >= 2) { g.putImageData(im, 0, 0); out = o; }
  }
  WGSC.art.set(c, out); return out;
}
function wgSnowcapList(L) { // a sprite list's snowy copy, made once
  let S = WGSC.lists.get(L); if (!S) { S = L.map(sp => Object.assign({}, sp, { c: wgSnowcapArt(sp.c) })); WGSC.lists.set(L, S); }
  return S;
}
const wgSnowy = (c) => (WGSC.now ? wgSnowcapArt(c) : c); // a canvas an object draws itself, snowy while snow lies on it
const _wgDrawSnowcapWG = drawWG;
drawWG = function () { WGSC.on = !!WGS.world && WGS.dim === 'o' && wgSeason() === 3; return _wgDrawSnowcapWG.apply(this, arguments); };
const _wgDrawObjSnowcap = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!WGSC.on || WGS.dim !== 'o' || !wgSnowcapOk(o) || !wgSnowcapTile(tx, ty)) return _wgDrawObjSnowcap(id, tx, ty, sx, sy);
  const L = WGA.obj[o.id], S = L && wgSnowcapList(L);
  if (S) WGA.obj[o.id] = S; WGSC.now = true;
  try { return _wgDrawObjSnowcap(id, tx, ty, sx, sy); } finally { WGSC.now = false; if (S) WGA.obj[o.id] = L; }
};
const _wgFenceSnowcap = wgFence;
wgFence = function (mask) { const c = _wgFenceSnowcap(mask); return WGSC.now ? wgSnowcapArt(c) : c; };
