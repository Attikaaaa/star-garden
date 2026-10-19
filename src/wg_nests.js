'use strict';
// Wildgrove: nests in spring. By day in spring one broadleaf tree in `WG_NEST_ONE` (`wgNestTree`: oaks, birches,
// willows and the fruit trees, chosen by the tile and the seed, the same on every screen) has a twig nest in its crown,
// swaying with it, where two or three chicks bob up now and then with their beaks open, cheeping (the `cheep` sound for
// a nest close by, never two within `WG_NEST_GAP` s). Drawn by a `wgDrawObj` wrapper after the tree; off with the
// ambient life option.
const WG_NEST_ONE = 10, WG_NEST_GAP = 5, WG_NEST_TREES = ['oak', 'birch', 'willow'];
const WGNS = { cheep: 0 };
function wgNestTree(o, tx, ty) {
  const w = WGS.world; if (!w || WGS.dim !== 'o' || wgSeason() !== 0 || !o || o.kind !== 'tree' || !(WG_NEST_TREES.includes(o.id) || o.fruit)) return false;
  return hash(tx, ty, (w.seed | 0) * 11 + 3303) % WG_NEST_ONE === 0;
}
function wgNestArt(n, open) { // a twig cup seen from the front, n chicks' heads over its rim, their beaks shut or open
  const key = 'nest_' + n + (open ? 'o' : ''); if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 11, 8, (g) => {
    for (let i = 0; i < n; i++) { const x = 2 + i * 3; wgRc(g, x, 1, 2, 2, 'L'); wgPx(g, x, 1, 'w'); wgPx(g, x + 1, 2, 'l'); wgPx(g, x + 1, 1, '0'); if (open) { wgPx(g, x, 0, 'O'); wgPx(g, x + 1, 0, 'o'); } else wgPx(g, x + 1, 0, 'O'); }
    wgRc(g, 1, 3, 9, 3, 'n'); wgRc(g, 1, 3, 9, 1, 'N'); wgRc(g, 2, 6, 7, 1, 'u'); // the cup, lit along its rim
    for (const [x, y] of [[2, 4], [5, 5], [7, 4], [4, 3], [8, 3]]) wgPx(g, x, y, (x + y) % 2 ? 'u' : 'N'); // twigs
  });
}
const _wgDrawObjNest = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjNest(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!wgNestTree(o, tx, ty) || !wgOpt().amb || wgNight(WGS.clock) > 0.3) return;
  const L = WGA.obj[o.id]; if (!L) return;
  const sp = L[hash(tx, ty, 3) % L.length], c = sp.c, T = WGS.t, h = hash(tx, ty, 5);
  const sway = Math.round(Math.sin(T * 1.6 + tx * 0.7 + ty * 0.3) * 0.9 + (WGS.weather && WGS.weather.wind ? WGS.weather.wind * Math.sin(T * 5 + tx) : 0));
  const per = 6 + h % 5, k = (T + (h >>> 3) % 60 / 10) % per, up = k < 1.6, open = up && Math.floor(k * 6) % 2 === 0, n = 2 + (h >>> 9) % 2;
  const x = sx + sp.ox + (c.width >> 1) - 5 + (h % 7) - 3 + sway, y = sy + sp.oy + Math.round(c.height * 0.3) - 4;
  ctx.drawImage(wgNestArt(up ? n : 0, open), x, y); // ducked down, only the cup shows
  if (open) { const p = WGS.p; if (WGS.t > WGNS.cheep && p && Math.hypot(p.x - (tx * 16 + 8), p.y - (ty * 16)) < 110) { WGNS.cheep = WGS.t + WG_NEST_GAP; wgSfx('cheep'); } }
};
