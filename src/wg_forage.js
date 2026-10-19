'use strict';
// Wildgrove: foraging through the year. Each season something wild grows on bare ground for the picking
// (`WG_FORAGE`): wild garlic under the trees in spring, low blueberry sprigs in summer, golden chanterelles beside the
// trees in autumn and rose hips on bare twigs in winter, each in its own lands. Where they grow comes from the tile, the
// world's seed and the day alone (`wgForageAt`), a new few each day, so every screen has the same, but the picking is
// each hero's own, like the egg hunt: walk onto a patch (or USE it) to gather one or two, the day's finds kept in
// `w.meta.forage`. Drawn on the ground through a `wgChunkUpkeep` wrapper. Each makes a dish (garlic bread, blueberry
// muffins, chanterelle soup, rose hip tea, a tea best drunk sitting down). The FORAGER star for all four.
const WG_FORAGE = [ // season, item, name, food, lands, beside a tree, in a thousand tiles
  [0, 'wild_garlic', 'WILD GARLIC', 2, ['forest', 'swamp', 'jungle'], true, 9],
  [1, 'blueberries', 'BLUEBERRIES', 2, ['forest', 'highland', 'meadow'], false, 5],
  [2, 'chanterelle', 'CHANTERELLE', 2, ['forest', 'jungle', 'swamp'], true, 9],
  [3, 'rosehip', 'ROSE HIPS', 1, ['meadow', 'forest', 'highland', 'snow'], false, 5],
];
const WG_FORAGE_ON = ['grass', 'jungle', 'moss', 'snow'];
(function () {
  for (const [, id, name, food] of WG_FORAGE) wgItem(id, name, 'food', { food });
  for (const [id, name, food, buff, n, rec] of [
    ['garlic_bread', 'GARLIC BREAD', 9, null, 1, { bread: 1, wild_garlic: 1 }], ['blueberry_muffin', 'BLUEBERRY MUFFIN', 7, null, 2, { flour: 1, sugar: 1, blueberries: 2 }],
    ['chanterelle_soup', 'CHANTERELLE SOUP', 11, 'regen', 1, { chanterelle: 2, milk: 1 }], ['rosehip_tea', 'ROSE HIP TEA', 3, 'regen', 1, { rosehip: 2 }]]) {
    wgItem(id, name, 'food', buff ? { food, buff } : { food }); wgRec(id, n, rec, 'fire');
  }
  WG_TEA.push('rosehip_tea'); // a cup best enjoyed sitting down (wg_rest)
  WG_ACH.push(['forage', 'FORAGER', 'GATHER SOMETHING WILD IN EVERY SEASON', (c) => ((c.st.forage | 0) & 15) === 15]);
})();
function wgForageAt(tx, ty) { // what grows wild on a tile today, or null: its kind and its spot in the tile
  const w = WGS.world; if (!w) return null;
  const F = WG_FORAGE[wgSeason()], h = hash(tx, ty, (w.seed | 0) * 41 + (WGS.day | 0) * 173 + 9091) >>> 0;
  if (h % 1000 >= F[6] || wgObjAt(w, 'o', tx, ty) || !WG_FORAGE_ON.includes(GROUND[wgGround(w, 'o', tx, ty)].id) || !F[4].includes(wgSurface(w.seed, tx, ty).b)) return null;
  if (F[5] && !WG_LEAF_N8.some(([i, j]) => { const o = OBJ[wgObjAt(w, 'o', tx + i, ty + j)]; return o && o.kind === 'tree'; })) return null;
  return { k: wgSeason(), n: 1 + ((h >>> 12) & 1), dx: ((h >>> 14) % 5) - 2, dy: ((h >>> 17) % 3) - 1 };
}
function wgForageFound(tx, ty) { const F = WGS.world.meta.forage; return !!(F && F.d === (WGS.day | 0) && F.k.includes(tx + ',' + ty)); }
function wgForageTake(tx, ty) { // gathers what grows on a tile: true when it did
  const w = WGS.world, F0 = wgForageAt(tx, ty); if (!F0 || wgForageFound(tx, ty)) return false;
  const m = w.meta; if (!m.forage || m.forage.d !== (WGS.day | 0)) m.forage = { d: WGS.day | 0, k: [] };
  if (m.forage.k.length < 300) m.forage.k.push(tx + ',' + ty);
  const id = WG_FORAGE[F0.k][1], x = tx * 16 + 8 + F0.dx, y = ty * 16 + 11 + F0.dy, left = wgInvAdd(WGS.inv, id, F0.n); if (left) wgDrop(x, y, id, left);
  wgToast(WG_FORAGE[F0.k][2], 1.5); wgSfx('pickup'); wgPart(x, y - 3, 5, { c: ['G', 'h', 'w'], s: 14, up: 14, life: 0.5 });
  const st = m.stats || (m.stats = { kills: 0, far: 0 }); st.forage = (st.forage | 0) | (1 << F0.k);
  return true;
}
const _wgUpdForage = updateWG;
updateWG = function (dt) {
  _wgUpdForage(dt);
  const w = WGS.world, p = WGS.p; if (!w || !p || p.hidden || WGS.scr !== 'play' || WGS.dim !== 'o') return;
  wgForageTake(Math.floor(p.x / 16), Math.floor((p.y - 2) / 16)); // walked onto a patch
};
const _wgUseForage = wgUse;
wgUse = function (tx, ty) { return (WGS.world && WGS.dim === 'o' && wgForageTake(tx, ty)) || _wgUseForage(tx, ty); };
// drawn on the ground, under everything that stands
const _wgUpkeepForage = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepForage(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const F = wgForageAt(tx, ty); if (!F || wgForageFound(tx, ty)) continue;
    const c = WGA.cache['forage_' + F.k]; if (c) ctx.drawImage(c, tx * 16 + 8 + F.dx - cx0 - (c.width >> 1), ty * 16 + 13 + F.dy - cy0 - c.height);
  }
};
const _wgTipForage = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipForage(s), F = WG_FORAGE.find(f => f[1] === s.id);
  if (F) L.push(['FOUND IN THE WOODS IN SPRING', 'FOUND ON SUMMER HILLSIDES', 'FOUND BESIDE THE TREES IN AUTUMN', 'FOUND ON BARE TWIGS IN WINTER'][F[0]]);
  return L;
};
// ---------- art: each patch small, lit from the top left; the icons ----------
const WG_FORAGE_ART = [ // on the ground: a key per colour
  ['...w.w...', '..wGhGw..', '.GhGGhGG.', 'GhGg.GhGg', '.g..g..g.'], // wild garlic: broad leaves and starry white flowers
  ['..G.h.G..', '.GBcGBcG.', 'GbBGbBGBc', '.gGbgGbB.', '..g...g..'], // blueberries on a low sprig
  ['.yOy..yO.', 'yOOOy.Oo.', '.oaO..a..', '..a...a..', '.eae..e..'], // chanterelles: golden funnels on pale stems
  ['.R...R...', 'Rrn.Rrn..', '.rn..r.n.', '..n.n..n.', '...nu....'], // rose hips on a bare twig
];
const _wgBuildForage = wgBuildAll;
wgBuildAll = function () {
  _wgBuildForage();
  WG_FORAGE_ART.forEach((rows, k) => wgMake('forage_' + k, rows[0].length + 2, rows.length + 2, (g) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') wgPx(g, x + 1, y + 1, r[x]); })));
};
const WG_FORAGE_ICON = {
  wild_garlic: (g) => { for (const [x, y, d] of [[3, 13, 1], [7, 13, 0], [11, 13, -1]]) for (let i = 0; i < 9; i++) { const yy = y - i, xx = x + Math.round(d * i * 0.4); wgPx(g, xx, yy, i > 6 ? 'h' : 'G'); wgPx(g, xx + 1, yy, i > 2 && i < 8 ? 'G' : 'g'); } for (const [x, y] of [[5, 3], [9, 2], [12, 4]]) { wgPx(g, x, y, 'w'); wgPx(g, x - 1, y + 1, 'w'); wgPx(g, x + 1, y + 1, 'w'); wgPx(g, x, y + 1, 'y'); } },
  blueberries: (g) => { wgRc(g, 4, 2, 2, 2, 'G'); wgRc(g, 6, 1, 3, 2, 'h'); for (const [x, y] of [[3, 6], [8, 5], [6, 9], [10, 9], [4, 11], [9, 12]]) wgBlob(g, x + 1.5, y + 1.5, 2, 2, ['b', 'B', 'B', 'c']); },
  chanterelle: (g) => { wgRc(g, 6, 8, 3, 6, 'a'); wgRc(g, 6, 8, 1, 6, 'A'); wgRc(g, 8, 9, 1, 5, 'e'); wgRc(g, 2, 3, 12, 2, 'y'); wgRc(g, 3, 5, 10, 2, 'O'); wgRc(g, 5, 7, 6, 1, 'o'); wgRc(g, 3, 2, 10, 1, 'Y'); wgPx(g, 2, 2, 'O'); wgPx(g, 13, 2, 'O'); for (const x of [5, 8, 11]) wgPx(g, x, 6, 'o'); },
  rosehip: (g) => { wgLine(g, 2, 14, 13, 3, 'n'); wgLine(g, 3, 14, 14, 3, 'u'); for (const [x, y] of [[4, 6], [9, 9]]) { wgBlob(g, x + 2, y + 2, 2, 2.6, ['p', 'r', 'R', 'q']); wgPx(g, x + 2, y - 1, 'n'); } },
  garlic_bread: (g) => { wgBlob(g, 8, 9, 7, 3.6, ['n', 'N', 'a', 'A']); wgRc(g, 3, 8, 10, 2, 'A'); for (const [x, y] of [[4, 8], [7, 9], [10, 8], [12, 9]]) wgPx(g, x, y, 'G'); for (const x of [5, 9]) wgPx(g, x, 11, 'n'); },
  blueberry_muffin: (g) => { for (let y = 9; y < 15; y++) wgRc(g, 4 + (y - 9) * 0.3 | 0, y, 9 - ((y - 9) * 0.6 | 0), 1, y % 2 ? 'q' : 'P'); wgBlob(g, 8, 6.5, 6, 3.6, ['n', 'N', 'a', 'A']); for (const [x, y] of [[5, 5], [8, 4], [10, 6], [6, 7], [11, 8]]) { wgPx(g, x, y, 'b'); wgPx(g, x, y - 1, 'B'); } },
  chanterelle_soup: (g) => { wgRc(g, 2, 7, 12, 2, 'O'); wgRc(g, 2, 7, 12, 1, 'y'); for (const x of [4, 8, 11]) wgPx(g, x, 7, 'o'); wgPx(g, 6, 8, 'L'); for (let y = 9; y < 14; y++) wgRc(g, 2 + (y - 9), y, 12 - (y - 9) * 2, 1, y === 9 ? 'L' : y < 12 ? 'l' : 'm'); wgRc(g, 5, 14, 6, 1, 'm'); for (const x of [6, 9]) { wgPx(g, x, 4, 'L'); wgPx(g, x + 1, 2, 'L'); } },
  rosehip_tea: (g) => { wgRc(g, 3, 6, 9, 8, 'w'); wgRc(g, 3, 6, 9, 1, 'L'); wgRc(g, 11, 7, 1, 7, 'l'); wgRc(g, 4, 7, 7, 2, 'r'); wgRc(g, 4, 7, 7, 1, 'R'); wgRc(g, 12, 8, 2, 1, 'w'); wgRc(g, 13, 9, 1, 2, 'w'); wgRc(g, 12, 11, 2, 1, 'w'); wgRc(g, 4, 14, 7, 1, 'l'); for (const x of [5, 8]) { wgPx(g, x, 4, 'L'); wgPx(g, x + 1, 2, 'L'); } },
};
const _wgIconForage = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, f = WG_FORAGE_ICON[id]; if (WGA.cache[key] || !f) return _wgIconForage(id);
  const [c, g] = wgCv(16, 16); f(g); wgOutline(c); WGA.cache[key] = c; return c;
};
