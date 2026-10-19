'use strict';
// Wildgrove: the flower press. A little wooden press is a station (`WG_AT.flower_press`) where petals, a bit of wood
// and glass become a pressed flower in a standing frame, one for each petal colour (`WG_PRESSED`), to set out on a shelf
// or a table. Setting out all five lights the HERBARIUM star (`stats.pressed`, a bitmask, by a `wgSetObj` wrapper, as
// the vases count).
const WG_PRESSED = [ // id, name, petal, the flower's ramp (shade, colour, light), its heart
  ['pressed_r', 'PRESSED POPPY', 'petal_r', ['p', 'r', 'R'], 'x'], ['pressed_y', 'PRESSED BUTTERCUP', 'petal_y', ['o', 'y', 'Y'], 'O'],
  ['pressed_b', 'PRESSED CORNFLOWER', 'petal_b', ['b', 'B', 'c'], 'C'], ['pressed_w', 'PRESSED DAISY', 'petal_w', ['l', 'L', 'w'], 'y'],
  ['pressed_p', 'PRESSED VIOLET', 'petal_p', ['1', '2', '3'], 'y']];
(function () {
  wgObj('flower_press', { name: 'FLOWER PRESS', kind: 'station', st: 'flower_press', tool: 'axe', hp: 4, solid: 1, drops: [DR('flower_press', 1, 1)] });
  wgItem('flower_press', 'FLOWER PRESS', 'place', { place: 'flower_press' }); PLACE.flower_press = 'flower_press'; wgRec('flower_press', 1, { wood: 4, stone: 2 }, 'bench');
  WG_AT.flower_press = 'AT A FLOWER PRESS';
  for (const [id, name, petal] of WG_PRESSED) {
    wgObj(id, { name, kind: 'deco', tool: 'axe', hp: 2, solid: 0, drops: [DR(id, 1, 1)] });
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, { [petal]: 3, wood: 1, glass: 1 }, 'flower_press');
  }
  WG_ACH.push(['pressed', 'HERBARIUM', 'SET OUT A PRESSED FLOWER OF EVERY COLOUR', (c) => ((c.st.pressed | 0) & 31) === 31]);
})();
const _wgUsePress = wgUse;
wgUse = function (tx, ty) { // the press opens the recipe book like any station
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (o && o.id === 'flower_press') { WGS.scr = 'inv'; WGS.ui = { tab: 'craft' }; return true; }
  return _wgUsePress(tx, ty);
};
const _wgSetObjPress = wgSetObj;
wgSetObj = function (w, dim, tx, ty, id, meta) { // a frame set out counts toward HERBARIUM
  const r = _wgSetObjPress(w, dim, tx, ty, id, meta), o = id && OBJ[id], k = o ? WG_PRESSED.findIndex(v => v[0] === o.id) : -1;
  if (k >= 0 && w === WGS.world && !(typeof WGN !== 'undefined' && WGN.applying)) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.pressed = (st.pressed | 0) | (1 << k); }
  return r;
};
const _wgTipPress = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPress(s); if (WG_PRESSED.some(v => v[0] === s.id)) L.push('A FLOWER KEPT FOREVER'); return L; };
const _wgBuildPress = wgBuildAll;
wgBuildAll = function () {
  _wgBuildPress();
  WG_PRESSED.forEach(([id, , , [d, m, l], heart], k) => wgReg(id, [wgMake('pressed_' + k, 12, 15, (g) => { // a standing frame: wood round cream paper, a flower flat on it, a foot behind
    wgRc(g, 1, 1, 10, 12, 'N'); wgRc(g, 1, 1, 10, 1, 'O'); wgRc(g, 1, 1, 1, 12, 'O'); wgRc(g, 10, 2, 1, 11, 'n'); wgRc(g, 2, 12, 9, 1, 'n');
    wgRc(g, 2, 2, 8, 10, 'A'); wgRc(g, 2, 2, 8, 1, 'w'); wgRc(g, 9, 3, 1, 9, 'a'); // the paper under the glass, a shine along its top
    wgRc(g, 6, 6, 1, 5, 'g'); wgPx(g, 5, 9, 'G'); wgPx(g, 4, 8, 'G'); wgPx(g, 7, 8, 'G'); wgPx(g, 8, 7, 'G'); // the stem and its leaves
    for (const [x, y, c] of [[6, 3, m], [5, 4, m], [7, 4, d], [4, 5, l], [8, 5, d], [5, 6, m], [7, 6, m]]) wgPx(g, x, y, c); wgPx(g, 6, 5, heart); // the flower pressed open
    wgRc(g, 4, 13, 4, 1, 'u'); // the foot
  })]));
  wgReg('flower_press', [wgMake('flower_press', 16, 16, (g) => { // two boards with paper between, a screw with a wing nut at each corner
    wgRc(g, 1, 9, 14, 5, 'N'); wgRc(g, 1, 9, 14, 1, 'O'); wgRc(g, 1, 13, 14, 1, 'n'); // the bottom board
    wgRc(g, 2, 8, 12, 1, 'A'); wgPx(g, 6, 8, 'P'); wgPx(g, 10, 8, 'y'); // paper and petals peeking out
    wgRc(g, 1, 5, 14, 3, 'N'); wgRc(g, 1, 5, 14, 1, 'O'); wgRc(g, 1, 7, 14, 1, 'n'); // the top board
    for (const x of [2, 12]) { wgRc(g, x, 2, 2, 4, 'm'); wgPx(g, x, 2, 'l'); wgRc(g, x - 1, 2, 4, 1, 'l'); wgPx(g, x - 1, 1, 'L'); wgPx(g, x + 2, 1, 'l'); } // screws and wing nuts
    wgRc(g, 2, 14, 2, 1, 'u'); wgRc(g, 12, 14, 2, 1, 'u'); // its feet
  })]);
};
