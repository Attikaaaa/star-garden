'use strict';
// Wildgrove: the herb garden. Lavender and mint grow as crops (`WG_HERBS`), their cuttings now and then in cut grass;
// lavender tea and mint tea at the fire are cups best enjoyed sitting down (wg_rest's teas), mint lemonade is a quick
// cool drink, and a clay planter of both herbs sets out on a sill or a table. The HERB GARDEN star. Ids are appended,
// so old worlds stay valid.
const WG_HERBS = ['lav', 'mint'];
(function () {
  Object.assign(CROP, { lav: 90, mint: 70 });
  wgItem('lavender', 'LAVENDER', 'res', {}); wgItem('mint', 'MINT', 'food', { food: 1 });
  wgItem('seed_lav', 'LAVENDER CUTTING', 'seed', { crop: 'lav' }); wgItem('seed_mint', 'MINT SPRIG', 'seed', { crop: 'mint' });
  wgObj('crop_lav', { name: 'LAVENDER', kind: 'crop', hp: 1, solid: 0, crop: 'lav', drops: [DR('lavender', 2, 3), DR('seed_lav', 0, 1, 0.5)], seed: 'seed_lav' });
  wgObj('crop_mint', { name: 'MINT', kind: 'crop', hp: 1, solid: 0, crop: 'mint', drops: [DR('mint', 2, 4), DR('seed_mint', 0, 1, 0.5)], seed: 'seed_mint' });
  OBJ[O_ID.tallgrass].drops.push(DR('seed_lav', 1, 1, 0.02), DR('seed_mint', 1, 1, 0.02));
  wgRec('seed_lav', 2, { lavender: 1 }); wgRec('seed_mint', 2, { mint: 1 });
  for (const [id, name, food, buff, rec, at] of [['lavender_tea', 'LAVENDER TEA', 3, 'regen', { lavender: 2 }, 'fire'], ['mint_tea', 'MINT TEA', 3, 'regen', { mint: 2 }, 'fire'],
    ['mint_lemonade', 'MINT LEMONADE', 5, 'speed', { mint: 1, lemon: 1, sugar: 1 }, 'hand']]) { wgItem(id, name, 'food', { food, buff }); wgRec(id, 1, rec, at); }
  WG_TEA.push('lavender_tea', 'mint_tea');
  wgObj('herb_planter', { name: 'HERB PLANTER', kind: 'deco', tool: 'hand', hp: 1, solid: 0, drops: [DR('herb_planter', 1, 1)] });
  wgItem('herb_planter', 'HERB PLANTER', 'place', { place: 'herb_planter' }); PLACE.herb_planter = 'herb_planter';
  wgRec('herb_planter', 1, { clay: 2, lavender: 1, mint: 1 }, 'bench');
  WG_ACH.push(['herbs', 'HERB GARDEN', 'GROW LAVENDER AND MINT', (c) => c.seen.lavender && c.seen.mint]);
})();
const _wgTipHerbs = wgTipLines;
wgTipLines = function (s) { const L = _wgTipHerbs(s); if (s.id === 'seed_lav' || s.id === 'seed_mint') L.push('SOMETIMES IN CUT GRASS'); return L; };
// ---------- art: four stages of each herb, the planter, the icons ----------
const _wgBuildHerbs = wgBuildAll;
wgBuildAll = function () {
  _wgBuildHerbs();
  const crop = (id, stages) => wgReg(id, stages.map((fn, k) => wgMake(id + k, 16, 16, fn, false)));
  const G4 = ['g', 'G', 'h', 'H'], MINT = ['t', 'G', 'h', 'H'];
  const sprout = (g, n, k) => { for (let i = 0; i < n; i++) { const x = Math.round(3 + i * (10 / Math.max(1, n - 1))); wgPx(g, x, 14, k[0]); wgPx(g, x - 1, 13, k[2]); wgPx(g, x + 1, 13, k[2]); wgPx(g, x, 12, k[3]); } };
  const lav = (g, h, bloom) => { // grey-green tufts with tall stems, purple spikes on top in bloom
    for (const x of [3, 7, 11]) { wgBlob(g, x + 1, 13, 2.6, 2.2, ['g', 'G', 'h', 'h']); for (const d of [-1, 0, 1]) { const top = 13 - h + Math.abs(d); wgLine(g, x + 1 + d, 13, x + 1 + d, top, 'G'); if (bloom) { wgRc(g, x + 1 + d, top - 3, 1, 3, d ? '2' : '3'); wgPx(g, x + 1 + d, top - 3, '4'); } } }
  };
  const mint = (g, r, flowers) => { // round bright leaves in pairs, little white flowers at the tips
    for (const [x, y] of [[4, 11], [11, 11], [7.5, 8]].slice(0, r)) { wgBlob(g, x, y, 3.2, 2.8, MINT); wgPx(g, Math.round(x) - 1, Math.round(y) - 1, 'H'); if (flowers) { wgPx(g, Math.round(x), Math.round(y) - 3, 'w'); wgPx(g, Math.round(x) + 1, Math.round(y) - 3, 'L'); } }
  };
  crop('crop_lav', [(g) => sprout(g, 3, G4), (g) => lav(g, 3, false), (g) => lav(g, 6, false), (g) => lav(g, 7, true)]);
  crop('crop_mint', [(g) => sprout(g, 2, MINT), (g) => mint(g, 2, false), (g) => mint(g, 3, false), (g) => mint(g, 3, true)]);
  wgReg('herb_planter', [wgMake('herb_planter', 18, 14, (g) => { // a long clay trough, lavender at the left, mint at the right
    for (const x of [3, 5, 7]) { wgLine(g, x, 8, x, 3, 'G'); wgRc(g, x, 1, 1, 3, x === 5 ? '3' : '2'); wgPx(g, x, 1, '4'); }
    wgBlob(g, 12, 6, 3, 2.4, MINT); wgBlob(g, 14.5, 7, 2, 1.8, MINT); wgPx(g, 11, 5, 'H');
    wgRc(g, 1, 8, 16, 5, 'n'); wgRc(g, 1, 8, 16, 1, 'N'); wgRc(g, 1, 8, 1, 5, 'N'); wgRc(g, 2, 12, 15, 1, 'u'); wgRc(g, 1, 8, 16, 1, 'N');
  })]);
};
const WG_HERB_ICON = {
  lavender: (g) => { for (const [x, d] of [[5, 1], [8, 0], [11, -1]]) { wgLine(g, x, 14, x + d, 7, 'G'); wgRc(g, x + d, 2, 1, 5, '2'); wgPx(g, x + d, 2, '4'); wgPx(g, x + d - 1, 4, '3'); } wgRc(g, 4, 11, 8, 1, 'P'); },
  mint: (g) => { wgLine(g, 8, 14, 8, 4, 'g'); for (const [x, y] of [[5, 6], [11, 6], [5, 10], [11, 10], [8, 3]]) { wgBlob(g, x, y, 2.4, 1.8, ['t', 'G', 'h', 'H']); } },
  seed_lav: (g) => { wgLine(g, 4, 13, 11, 6, 'G'); wgRc(g, 11, 3, 1, 4, '2'); wgPx(g, 11, 3, '4'); wgPx(g, 6, 10, 'h'); wgPx(g, 8, 9, 'h'); },
  seed_mint: (g) => { wgLine(g, 5, 13, 10, 6, 'g'); wgBlob(g, 10, 5, 2.4, 1.8, ['t', 'G', 'h', 'H']); wgBlob(g, 6, 10, 2, 1.5, ['t', 'G', 'h', 'H']); },
  lavender_tea: (g) => { wgRc(g, 3, 6, 9, 8, 'w'); wgRc(g, 3, 6, 9, 1, 'L'); wgRc(g, 11, 7, 1, 7, 'l'); wgRc(g, 4, 7, 7, 2, '3'); wgRc(g, 4, 7, 7, 1, '4'); wgRc(g, 12, 8, 2, 1, 'w'); wgRc(g, 13, 9, 1, 2, 'w'); wgRc(g, 12, 11, 2, 1, 'w'); wgRc(g, 4, 14, 7, 1, 'l'); for (const x of [5, 8]) { wgPx(g, x, 4, 'L'); wgPx(g, x + 1, 2, 'L'); } },
  mint_tea: (g) => { wgRc(g, 3, 6, 9, 8, 'w'); wgRc(g, 3, 6, 9, 1, 'L'); wgRc(g, 11, 7, 1, 7, 'l'); wgRc(g, 4, 7, 7, 2, 'G'); wgRc(g, 4, 7, 7, 1, 'h'); wgRc(g, 12, 8, 2, 1, 'w'); wgRc(g, 13, 9, 1, 2, 'w'); wgRc(g, 12, 11, 2, 1, 'w'); wgRc(g, 4, 14, 7, 1, 'l'); for (const x of [5, 8]) { wgPx(g, x, 4, 'L'); wgPx(g, x + 1, 2, 'L'); } },
  mint_lemonade: (g) => { wgRc(g, 4, 4, 8, 11, 'C'); wgRc(g, 5, 6, 6, 8, 'Y'); wgRc(g, 5, 6, 6, 1, 'w'); wgRc(g, 5, 13, 6, 1, 'y'); wgRc(g, 5, 7, 1, 6, 'w'); wgBlob(g, 9, 5, 2, 1.4, ['t', 'G', 'h', 'H']); wgBlob(g, 12, 6, 2, 2, ['O', 'y', 'Y', 'Y']); },
  herb_planter: (g) => { const c = WGA.cache.herb_planter; if (c) g.drawImage(c, -1, 1); },
};
const _wgIconHerbs = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, f = WG_HERB_ICON[id]; if (WGA.cache[key] || !f) return _wgIconHerbs(id);
  const [c, g] = wgCv(16, 16); f(g); if (id !== 'herb_planter') wgOutline(c); WGA.cache[key] = c; return c;
};
