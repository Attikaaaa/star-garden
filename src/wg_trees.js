'use strict';
// Wildgrove: the seasons on the trees (wg_trees). The season is already the same on every screen (wgSeason, from the day); now
// the trees show it: apple trees in white blossom in spring, oaks in orange, red or gold in autumn (each tree keeps its
// colour), birches gold, fruit trees warm; in winter snow lies along the tops of the crowns. Citrus trees and pines stay
// green. Each tree's sprites are recoloured once per season from its own art and swapped in whole, so drawing costs
// nothing more. ALL FOUR SEASONS after a year.
const WG_AUT = { o: ['n', 'o', 'O', 'y'], r: ['p', 'r', 'R', 'O'], g: ['o', 'O', 'y', 'Y'] };
const WG_WIN = ['z', 'g', 'G', 'h']; // winter's deeper, colder green under the snow
const WG_SEASON_TREES = { // id: [the crown's ramp, autumn ramps (one tree in each), winter ramp (else the crown's own)]
  oak: [['g', 'G', 'h', 'H'], [WG_AUT.o, WG_AUT.r, WG_AUT.g], WG_WIN], birch: [['G', 'h', 'H', 'Y'], [WG_AUT.g], ['g', 'G', 'h', 'H']], pine: [['z', 'g', 'G', 'h'], null],
  tree_apple: [['g', 'G', 'h', 'H'], [WG_AUT.o, WG_AUT.r], WG_WIN], tree_apple_r: [['g', 'G', 'h', 'H'], [WG_AUT.g], WG_WIN],
  tree_cherry: [['p', 'P', 'q', 'w'], [WG_AUT.r, WG_AUT.o], WG_WIN], tree_cherry_r: [['z', 'g', 'G', 'h'], [WG_AUT.g]],
  tree_orange: [['z', 'g', 'G', 'h'], null], tree_orange_r: [['z', 'g', 'G', 'h'], null], tree_lemon: [['g', 'G', 'h', 'H'], null, WG_WIN], tree_lemon_r: [['g', 'G', 'h', 'H'], null, WG_WIN],
};
const WGSE = { now: null, base: {}, made: {} };
WG_ACH.push(['year', 'ALL FOUR SEASONS', 'SEE A WHOLE YEAR GO BY', () => (WGS.day || 0) >= 32]);
function wgSeasonTrees() { // swap every tree's sprites for this season's (built the first time they are needed)
  const se = wgSeason(), want = se === 0 ? 's' : se === 2 ? 'a' : se === 3 ? 'w' : '';
  if (want === WGSE.now) return;
  for (const id in WG_SEASON_TREES) {
    const cur = WGA.obj[id]; if (!cur) continue;
    if (cur !== WGSE.base[id] && !Object.values(WGSE.made[id] || {}).includes(cur)) { WGSE.base[id] = cur; WGSE.made[id] = {}; } // fresh art
    const M = WGSE.made[id] || (WGSE.made[id] = {});
    WGA.obj[id] = want ? (M[want] || (M[want] = wgSeasonArt(id, want))) : WGSE.base[id];
  }
  WGSE.now = want;
}
function wgSeasonArt(id, want) {
  const base = WGSE.base[id], [crown, aut, win] = WG_SEASON_TREES[id];
  if (want === 's') return id === 'tree_apple' ? base.map(sp => wgTreeTint(sp, crown, crown, false, true)) : base;
  if (want === 'a') return aut ? aut.flatMap(r => base.map(sp => wgTreeTint(sp, crown, r, false))) : base; // palette after palette, so each tree keeps its shape
  return base.map(sp => wgTreeTint(sp, crown, win || crown, id === 'pine' ? 1 : 0.5));
}
function wgTreeTint(sp, from, to, snow, bloom) { // a recoloured copy of one sprite: the crown's ramp mapped, snow on the tops (down to a share of the crown), or blossom
  const s = sp.c, [c, g] = wgCv(s.width, s.height, true); g.drawImage(s, 0, 0);
  const im = g.getImageData(0, 0, s.width, s.height), d = im.data, W = s.width, rgb = (k) => parseInt(PAL[k].slice(1), 16);
  const map = new Map(from.map((k, i) => [rgb(k), rgb(to[i])])), crown = new Set(to.map(rgb)), O = rgb('0');
  const at = (x, y) => (y < 0 ? -1 : d[(y * W + x) * 4 + 3] < 8 ? -1 : (d[(y * W + x) * 4] << 16) | (d[(y * W + x) * 4 + 1] << 8) | d[(y * W + x) * 4 + 2]);
  const put = (i, v) => { d[i] = v >> 16; d[i + 1] = (v >> 8) & 255; d[i + 2] = v & 255; };
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 8) continue; const v = map.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); if (v !== undefined) put(i, v); }
  let top = s.height, bot = 0; if (snow) for (let y = 0; y < s.height; y++) for (let x = 0; x < W; x++) if (crown.has(at(x, y))) { top = Math.min(top, y); bot = Math.max(bot, y); }
  const open = (x, y) => { const u = at(x, y - 1); return u === O || u === -1; }, low = top + (bot - top) * snow;
  if (snow) for (let x = 0; x < W; x++) for (let y = 1; y <= low; y++) { // snow where the crown meets the sky above, on a stretch, not a step down its side
    const v = at(x, y); if (!crown.has(v) || !open(x, y) || (snow < 1 && !((crown.has(at(x - 1, y)) && open(x - 1, y)) || (crown.has(at(x + 1, y)) && open(x + 1, y))))) continue; // a pine's tiers take it on every step
    put((y * W + x) * 4, rgb('w')); // a cap two pixels deep, its lower edge soft
    if (crown.has(at(x, y + 1))) { put(((y + 1) * W + x) * 4, rgb(x & 1 ? 'L' : 'w')); if ((x % 3 === 0) && crown.has(at(x, y + 2))) put(((y + 2) * W + x) * 4, rgb('L')); }
  }
  if (bloom) { const r = wgRng(s.width * 7 + s.height); for (let n = 0; n < 40; n++) { const x = Math.floor(r() * W), y = Math.floor(r() * s.height * 0.6); const i = (y * W + x) * 4; if (crown.has(at(x, y)) && crown.has(at(x + 1, y)) && crown.has(at(x, y + 1))) { put(i, rgb('w')); put(i + 4, rgb('q')); } } } // white and pink blossom
  g.putImageData(im, 0, 0); return { c, ox: sp.ox, oy: sp.oy };
}
const _wgDrawSeasons = drawWG;
drawWG = function () { if (WGS.world) wgSeasonTrees(); return _wgDrawSeasons.apply(this, arguments); };
