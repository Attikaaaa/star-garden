'use strict';
// Wildgrove: leaf piles. In autumn the fallen leaves gather in soft heaps on the grass beside the trees that turn
// (WG_SEASON_TREES with autumn colours). Walk into one and it bursts in a flurry of leaves; it lies scattered for a
// while, then the wind heaps it up again, small and then full. A friend walking through scatters it on your screen
// too. Where the heaps lie comes from the tile and the world's seed alone, the season from the shared day, so every
// screen has the same; what is scattered is each screen's own. Nothing is saved. The LEAF LEAPER star after ten.
const WG_LEAF_BACK = 90; // seconds a scattered heap takes to gather again (half of it small)
const WGLF = { gone: new Map(), w: null, tile: '', fr: new Map() }; // gone: tile key -> when it was scattered
(function () {
  WG_ACH.push(['leaves', 'LEAF LEAPER', 'JUMP INTO TEN LEAF PILES', (c) => (c.st.leaves | 0) >= 10]);
})();
const WG_LEAF_N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
function wgLeafPile(tx, ty) { // the heap on a tile in autumn, or null: its colours (0-2) and its spot in the tile
  if (wgSeason() !== 2 || !WGS.world) return null;
  const w = WGS.world, h = hash(tx, ty, (w.seed | 0) * 13 + 7717) >>> 0;
  if (h % 1000 >= 70) return null;
  const gid = wgGround(w, 'o', tx, ty); if ((gid !== G_ID.grass && gid !== G_ID.jungle) || wgObjAt(w, 'o', tx, ty)) return null;
  let tree = false;
  for (const [i, j] of WG_LEAF_N8) { const o = OBJ[wgObjAt(w, 'o', tx + i, ty + j)], T = o && o.kind === 'tree' && WG_SEASON_TREES[o.id]; if (T && T[1]) { tree = true; break; } }
  return tree ? { v: (h >>> 8) % 3, dx: ((h >>> 12) % 5) - 2, dy: ((h >>> 15) % 3) - 1 } : null;
}
function wgLeafBurst(x, y, k) { // the flurry, in the heap's own colours
  wgPart(x, y - 3, 10, { c: [['o', 'O', 'y', 'n'], ['r', 'R', 'o', 'n'], ['y', 'Y', 'O', 'e']][k], s: 26, up: 30, g: 70, life: 0.9 });
}
const _wgUpdLeaf = updateWG;
updateWG = function (dt) {
  _wgUpdLeaf(dt);
  const w = WGS.world, p = WGS.p; if (WGLF.w !== w) { WGLF.w = w; WGLF.gone.clear(); WGLF.fr.clear(); WGLF.tile = ''; }
  if (!w || !p || WGS.scr !== 'play' || WGS.dim !== 'o' || wgSeason() !== 2) return;
  for (const [k, t] of WGLF.gone) if (WGS.t - t > WG_LEAF_BACK || t > WGS.t) WGLF.gone.delete(k);
  const into = (q, mine) => { // a hero walking onto a heap scatters it
    const tx = Math.floor(q.x / 16), ty = Math.floor((q.y - 2) / 16), k = tx + ',' + ty;
    if (WGLF.gone.has(k)) return k; const L = wgLeafPile(tx, ty); if (!L) return '';
    WGLF.gone.set(k, WGS.t); wgLeafBurst(tx * 16 + 8 + L.dx, ty * 16 + 11 + L.dy, L.v); wgSfx('cut');
    if (mine) { const m = w.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.leaves = Math.min(9999, (st.leaves | 0) + 1); }
    return k;
  };
  if (!p.hidden) WGLF.tile = into(p, true);
  for (const q of WGS.remote || []) if (q.dim === 'o') into(q, false);
};
// drawn on the ground, under everything that stands: the chunk upkeep runs right after the ground is painted
const _wgUpkeepLeaf = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepLeaf(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world || wgSeason() !== 2) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const L = wgLeafPile(tx, ty); if (!L) continue;
    const t = WGLF.gone.get(tx + ',' + ty), k = t === undefined ? WG_LEAF_BACK : WGS.t - t;
    const c = WGA.cache['leaf_' + (k < WG_LEAF_BACK / 2 ? 'bits' : k < WG_LEAF_BACK ? 'small' : 'pile') + L.v]; if (!c) continue;
    ctx.drawImage(c, Math.round(tx * 16 + 8 + L.dx - cx0 - (c.width >> 1)), Math.round(ty * 16 + 13 + L.dy - cy0 - c.height));
  }
};
// ---------- art: a heap lit from the top left in three autumn mixes, a smaller one, and the leaves strewn about ----------
const _wgBuildLeaf = wgBuildAll;
wgBuildAll = function () {
  _wgBuildLeaf();
  const mixes = [{ a: 'y', b: 'O', c: 'o', d: 'n' }, { a: 'R', b: 'r', c: 'o', d: 'n' }, { a: 'Y', b: 'y', c: 'O', d: 'e' }]; // light, base, mid, shade
  mixes.forEach((K, v) => {
    wgMake('leaf_pile' + v, 16, 8, (g) => wgPaint(g, 1, 1, ['....abbc......', '..abbacbbc....', '.abacbbbcbbc..', 'abbbbcbbbbcbc.', 'bcbbbbcbbcbbcd', '.ddcdddcddddd.'], K));
    wgMake('leaf_small' + v, 12, 6, (g) => wgPaint(g, 1, 1, ['...abbc...', '.abacbbcb.', 'abbbbcbbcd', '.dddcdddd.'], K));
    wgMake('leaf_bits' + v, 18, 6, (g) => wgPaint(g, 0, 0, ['..b.......c.......', '.......a.......b..', 'c...b.......d.....', '..........b....c..', '.d.....c.......a..', '.....b.....b......'], K), false);
  });
};
