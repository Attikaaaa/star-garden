'use strict';
// Wildgrove: winter treats. A jungle tree felled now and then gives cocoa beans; at the fire they make HOT COCOA with
// milk and sugar, a cup best enjoyed sitting down (wg_rest's teas). Flour and honey bake gingerbread men, and four of
// them with sugar icing make a gingerbread house to set out, its windows aglow at night. The GINGERBREAD HOME star.
(function () {
  wgItem('cocoa', 'COCOA BEANS', 'res', {});
  const J = OBJ[O_ID.jungle]; if (J && !J.drops.some(d => d[0] === 'cocoa')) J.drops.push(DR('cocoa', 1, 2, 0.35));
  wgItem('hot_cocoa', 'HOT COCOA', 'food', { food: 4, buff: 'regen' }); wgRec('hot_cocoa', 1, { cocoa: 1, milk: 1, sugar: 1 }, 'fire');
  WG_TEA.push('hot_cocoa');
  wgItem('gingerbread', 'GINGERBREAD MAN', 'food', { food: 3 }); wgRec('gingerbread', 4, { flour: 1, honey: 1 }, 'fire');
  wgObj('ginger_house', { name: 'GINGERBREAD HOUSE', kind: 'deco', tool: 'hand', hp: 2, light: 34, drops: [DR('ginger_house', 1, 1)] });
  wgItem('ginger_house', 'GINGERBREAD HOUSE', 'place', { place: 'ginger_house' }); PLACE.ginger_house = 'ginger_house';
  wgRec('ginger_house', 1, { gingerbread: 4, sugar: 2 }, 'bench');
  WG_ACH.push(['ginger', 'GINGERBREAD HOME', 'BAKE A GINGERBREAD HOUSE', (c) => c.seen.ginger_house]);
})();
const _wgTipCocoa = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipCocoa(s);
  if (s.id === 'cocoa') L.push('FROM JUNGLE TREES');
  else if (s.id === 'ginger_house') L.push('ITS WINDOWS GLOW AT NIGHT');
  return L;
};
// ---------- art: the gingerbread house with icing on its roof and candy on its walls; the icons ----------
const _wgBuildCocoa = wgBuildAll;
wgBuildAll = function () {
  _wgBuildCocoa();
  wgReg('ginger_house', [wgMake('ginger_house', 16, 17, (g) => {
    wgRc(g, 2, 8, 12, 8, 'N'); wgRc(g, 2, 8, 1, 8, 'A'); wgRc(g, 13, 8, 1, 8, 'n'); wgRc(g, 2, 15, 12, 1, 'n'); // the walls, lit from the left
    for (let y = 0; y < 7; y++) { wgRc(g, 7 - y, 1 + y, 2 + y * 2, 1, y < 3 ? 'n' : 'u'); wgPx(g, 7 - y, 1 + y, 'w'); wgPx(g, 8 + y, 1 + y, 'L'); } // a chocolate roof, iced along its edges
    wgRc(g, 1, 7, 14, 1, 'w'); for (const x of [2, 5, 8, 11, 14]) wgPx(g, x, 8, 'L'); // icing dripping from the eaves
    for (const [x, y, k] of [[6, 4, 'r'], [9, 5, 'G'], [5, 6, 'P'], [10, 3, 'y']]) wgPx(g, x, y, k); // gumdrops on the roof
    wgRc(g, 7, 11, 3, 5, 'n'); wgRc(g, 7, 11, 3, 1, 'w'); wgPx(g, 9, 13, 'y'); // the door with its icing lintel
    for (const x of [3, 11]) { wgRc(g, x, 10, 2, 2, 'y'); wgPx(g, x, 10, 'Y'); wgRc(g, x - 1, 9, 4, 1, 'w'); } // windows aglow, iced above
    for (const [x, y, k] of [[4, 13, 'r'], [12, 13, 'G'], [3, 14, 'B'], [12, 15, 'P']]) wgPx(g, x, y, k); // candy buttons
  })]);
};
const WG_COCOA_ICON = {
  cocoa: (g) => { for (const [x, y] of [[5, 8], [10, 7], [8, 11]]) { wgBlob(g, x, y, 2.6, 2, ['n', 'n', 'N', 'N']); wgPx(g, x - 1, y - 1, 'A'); } },
  hot_cocoa: (g) => { wgRc(g, 3, 6, 9, 8, 'r'); wgRc(g, 3, 6, 9, 1, 'R'); wgRc(g, 11, 7, 1, 7, 'p'); wgRc(g, 4, 7, 7, 2, 'n'); wgRc(g, 5, 6, 3, 1, 'w'); wgRc(g, 12, 8, 2, 1, 'r'); wgRc(g, 13, 9, 1, 2, 'r'); wgRc(g, 12, 11, 2, 1, 'r'); for (const x of [5, 8]) { wgPx(g, x, 4, 'L'); wgPx(g, x + 1, 2, 'L'); } },
  gingerbread: (g) => {
    wgBlob(g, 8, 4.5, 2.6, 2.4, ['n', 'N', 'N', 'A']); wgRc(g, 5, 7, 7, 5, 'N'); wgRc(g, 3, 8, 11, 2, 'N'); wgRc(g, 5, 12, 2, 3, 'N'); wgRc(g, 10, 12, 2, 3, 'N');
    wgRc(g, 3, 8, 11, 1, 'A'); wgPx(g, 7, 4, 'u'); wgPx(g, 9, 4, 'u'); wgRc(g, 7, 6, 3, 1, 'w'); wgPx(g, 8, 8, 'r'); wgPx(g, 8, 10, 'G'); wgRc(g, 3, 9, 1, 1, 'w'); wgRc(g, 13, 9, 1, 1, 'w');
  },
  ginger_house: (g) => { const c = WGA.cache.ginger_house; if (c) g.drawImage(c, 0, -1); },
};
const _wgIconCocoa = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, f = WG_COCOA_ICON[id]; if (WGA.cache[key] || !f) return _wgIconCocoa(id);
  const [c, g] = wgCv(16, 16); f(g); if (id !== 'ginger_house') wgOutline(c); WGA.cache[key] = c; return c;
};
