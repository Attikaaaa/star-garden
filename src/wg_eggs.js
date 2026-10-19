'use strict';
// Wildgrove: the spring egg hunt. On spring days painted eggs lie hidden in the grass beside tall grass, ferns and
// flowers, a new set each day; where they lie comes from the tile, the world's seed and the day alone (`wgEggAt`), so
// every screen has the same, but the hunt is each hero's own: walk onto one (or USE it) to pick it up. The day's finds
// are kept in `w.meta.eggs`, so a reload does not bring them back. Six eggs make an egg basket to set out. The EGG HUNT
// star after ten.
const WG_EGG_COLS = [['P', 'q'], ['B', 'C'], ['y', 'Y'], ['o', 'O'], ['3', '4']]; // each egg: its colour and its stripes
(function () {
  wgItem('painted_egg', 'PAINTED EGG', 'res', {});
  wgObj('egg_basket', { name: 'EGG BASKET', kind: 'deco', tool: 'hand', hp: 1, drops: [DR('egg_basket', 1, 1)] });
  wgItem('egg_basket', 'EGG BASKET', 'place', { place: 'egg_basket' }); PLACE.egg_basket = 'egg_basket'; wgRec('egg_basket', 1, { painted_egg: 6, fiber: 3 }, 'hand');
  WG_ACH.push(['eggs', 'EGG HUNT', 'FIND TEN PAINTED EGGS', (c) => (c.st.eggs | 0) >= 10]);
})();
function wgEggAt(tx, ty) { // the egg on a tile today, or null: its colours and its spot in the tile
  const w = WGS.world; if (!w || wgSeason() !== 0) return null;
  const h = hash(tx, ty, (w.seed | 0) * 29 + (WGS.day | 0) * 131 + 4441) >>> 0;
  if (h % 1000 >= 12) return null;
  const gid = wgGround(w, 'o', tx, ty); if ((gid !== G_ID.grass && gid !== G_ID.jungle) || wgObjAt(w, 'o', tx, ty)) return null;
  let hid = false; // tucked in beside something that grows
  for (const [i, j] of WG_LEAF_N8) { const o = OBJ[wgObjAt(w, 'o', tx + i, ty + j)]; if (o && (o.kind === 'plant' || o.id.startsWith('flower_'))) { hid = true; break; } }
  return hid ? { v: (h >>> 8) % WG_EGG_COLS.length, s: (h >>> 11) & 1, dx: ((h >>> 12) % 7) - 3, dy: ((h >>> 15) % 3) - 1 } : null;
}
const wgEggKey = (tx, ty) => tx + ',' + ty;
function wgEggFound(tx, ty) { const E = WGS.world.meta.eggs; return !!(E && E.d === (WGS.day | 0) && E.k.includes(wgEggKey(tx, ty))); }
function wgEggTake(tx, ty) { // picks up the egg on a tile if there is one: true when it did
  const w = WGS.world, E0 = wgEggAt(tx, ty); if (!E0 || wgEggFound(tx, ty)) return false;
  const m = w.meta; if (!m.eggs || m.eggs.d !== (WGS.day | 0)) m.eggs = { d: WGS.day | 0, k: [] };
  if (m.eggs.k.length < 200) m.eggs.k.push(wgEggKey(tx, ty));
  const x = tx * 16 + 8 + E0.dx, y = ty * 16 + 11 + E0.dy, left = wgInvAdd(WGS.inv, 'painted_egg', 1); if (left) wgDrop(x, y, 'painted_egg', left);
  wgToast('A PAINTED EGG!', 2); wgSfx('chime'); wgPart(x, y - 3, 7, { c: WG_EGG_COLS[E0.v].concat(['w']), s: 18, up: 24, life: 0.7 });
  const st = m.stats || (m.stats = { kills: 0, far: 0 }); st.eggs = Math.min(9999, (st.eggs | 0) + 1);
  return true;
}
const _wgUpdEgg = updateWG;
updateWG = function (dt) {
  _wgUpdEgg(dt);
  const w = WGS.world, p = WGS.p;
  if (!w || !p || p.hidden || WGS.scr !== 'play' || WGS.dim !== 'o' || wgSeason() !== 0) return;
  wgEggTake(Math.floor(p.x / 16), Math.floor((p.y - 2) / 16)); // walked onto one
};
const _wgUseEgg = wgUse;
wgUse = function (tx, ty) { return (WGS.world && WGS.dim === 'o' && wgEggTake(tx, ty)) || _wgUseEgg(tx, ty); };
// drawn on the ground, under everything that stands
const _wgUpkeepEgg = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepEgg(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world || wgSeason() !== 0) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const E = wgEggAt(tx, ty); if (!E || wgEggFound(tx, ty)) continue;
    const c = WGA.cache['egg_' + E.v + '_' + E.s]; if (c) ctx.drawImage(c, tx * 16 + 8 + E.dx - cx0 - 3, ty * 16 + 12 + E.dy - cy0 - 8);
  }
};
const _wgTipEgg = wgTipLines;
wgTipLines = function (s) { const L = _wgTipEgg(s); if (s.id === 'painted_egg') L.push('HIDDEN IN THE GRASS IN SPRING'); return L; };
// ---------- art: a little egg in each colour, striped or spotted, lit from the top left; the basket; the icon ----------
function wgEggPaint(g, x, y, c, s) {
  const [a, b] = WG_EGG_COLS[c];
  wgRc(g, x + 1, y, 3, 1, b); wgRc(g, x, y + 1, 5, 4, a); wgRc(g, x + 1, y + 5, 3, 1, a); wgPx(g, x + 1, y + 1, 'w');
  if (s) { wgRc(g, x, y + 3, 5, 1, b); } else { wgPx(g, x + 3, y + 2, b); wgPx(g, x + 1, y + 4, b); }
}
const _wgBuildEgg = wgBuildAll;
wgBuildAll = function () {
  _wgBuildEgg();
  for (let v = 0; v < WG_EGG_COLS.length; v++) for (const s of [0, 1]) wgMake('egg_' + v + '_' + s, 7, 8, (g) => wgEggPaint(g, 1, 1, v, s));
  wgReg('egg_basket', [wgMake('egg_basket', 18, 14, (g) => { // a wicker basket heaped with eggs, its handle over them
    for (const [x, y, c, s] of [[3, 3, 0, 1], [7, 2, 2, 0], [11, 3, 1, 1], [5, 5, 3, 0], [9, 5, 4, 1]]) wgEggPaint(g, x, y, c, s);
    wgRc(g, 2, 8, 14, 5, 'N'); wgRc(g, 2, 8, 14, 1, 'a'); wgRc(g, 3, 12, 12, 1, 'n');
    for (let x = 3; x <= 15; x += 3) wgRc(g, x, 9, 1, 3, 'n');
    wgLine(g, 2, 7, 4, 2, 'n'); wgLine(g, 15, 7, 13, 2, 'n'); wgRc(g, 5, 1, 8, 1, 'n');
  })]);
};
const _wgIconEgg = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'painted_egg') return _wgIconEgg(id);
  const [c, g] = wgCv(16, 16); // a big egg: pink with a yellow band and blue dots
  wgBlob(g, 8, 8.5, 4.6, 6, ['P', 'P', 'q', 'q']); wgRc(g, 4, 9, 9, 2, 'y'); wgRc(g, 4, 9, 9, 1, 'Y');
  for (const [x, y] of [[6, 5], [10, 6], [7, 13], [10, 12]]) wgPx(g, x, y, 'B'); wgRc(g, 6, 4, 2, 1, 'w');
  wgOutline(c); WGA.cache[key] = c; return c;
};
