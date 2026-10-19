'use strict';
// Wildgrove: pottery. A potter's wheel is a station (`WG_AT.potwheel`) where clay becomes vases in four glazes
// (`WG_VASES`: plain clay, blue from petals, yellow from petals, white from bone meal), a tall amphora and a vase of
// flowers, all to set out. While a hero stands at the wheel its head turns with a lump of clay on it (a `wgDrawObj`
// wrapper). Setting out a vase of every glaze lights the POTTER star (`stats.vases`, a bitmask, by a `wgSetObj`
// wrapper, as the laundry posts count).
const WG_VASES = [ // id, name, the glaze's ramp (light, colour, shade), its band, what glazes it
  ['vase_clay', 'CLAY VASE', ['O', 'N', 'n'], 'u', null], ['vase_blue', 'BLUE VASE', ['c', 'B', 'b'], 'w', 'petal_b'],
  ['vase_yellow', 'YELLOW VASE', ['Y', 'y', 'o'], 'r', 'petal_y'], ['vase_white', 'WHITE VASE', ['w', 'L', 'l'], 'B', 'bonemeal']];
const WG_VASE_ROWS = [[2, 6], [3, 5], [3, 5], [2, 6], [1, 7], [0, 8], [0, 8], [0, 8], [0, 8], [1, 7], [1, 7], [2, 6]]; // the vase's span, row by row
(function () {
  const dec = (id, name, rec, o) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'pick', hp: 2, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, 'potwheel');
  };
  wgObj('potwheel', { name: "POTTER'S WHEEL", kind: 'station', st: 'potwheel', tool: 'axe', hp: 5, solid: 1, drops: [DR('potwheel', 1, 1)] });
  wgItem('potwheel', "POTTER'S WHEEL", 'place', { place: 'potwheel' }); PLACE.potwheel = 'potwheel'; wgRec('potwheel', 1, { wood: 4, stone: 4, clay: 2 }, 'bench');
  WG_AT.potwheel = "AT A POTTER'S WHEEL";
  for (const [id, name, , , glaze] of WG_VASES) dec(id, name, glaze ? { clay: 3, [glaze]: glaze === 'bonemeal' ? 1 : 2 } : { clay: 3 });
  dec('amphora', 'AMPHORA', { clay: 6 }); dec('vase_flowers', 'VASE OF FLOWERS', { clay: 3, petal_r: 1, petal_y: 1, petal_w: 1 });
  WG_ACH.push(['potter', 'POTTER', 'SET OUT A VASE OF EVERY GLAZE', (c) => ((c.st.vases | 0) & 15) === 15]);
})();
const _wgUsePot = wgUse;
wgUse = function (tx, ty) { // the wheel opens the recipe book like any station
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (o && o.id === 'potwheel') { WGS.scr = 'inv'; WGS.ui = { tab: 'craft' }; return true; }
  return _wgUsePot(tx, ty);
};
const _wgSetObjPot = wgSetObj;
wgSetObj = function (w, dim, tx, ty, id, meta) { // a vase set out counts toward POTTER
  const r = _wgSetObjPot(w, dim, tx, ty, id, meta), o = id && OBJ[id], k = o ? WG_VASES.findIndex(v => v[0] === o.id) : -1;
  if (k >= 0 && w === WGS.world && !(typeof WGN !== 'undefined' && WGN.applying)) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.vases = (st.vases | 0) | (1 << k); }
  return r;
};
const _wgDrawObjPot = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) { // the wheel's head turning while someone stands at it
  _wgDrawObjPot(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!o || o.id !== 'potwheel') return;
  const p = WGS.p, near = p && Math.hypot(p.x - (tx * 16 + 8), p.y - (ty * 16 + 12)) < 26 || (WGS.remote || []).some(q => q.dim === WGS.dim && Math.hypot(q.x - (tx * 16 + 8), q.y - (ty * 16 + 12)) < 26);
  if (!near) return;
  const f = Math.floor(WGS.t * 10) % 6, a = f / 6 * Math.PI * 2;
  rect(sx + 8 + Math.round(Math.cos(a) * 5), sy + 6 + Math.round(Math.sin(a) * 1.5), 1, 1, 'w'); // a glint going round the head
  rect(sx + 7 + (f % 2), sy + 3, 1, 1, 'O'); // the clay's highlight shifting as it turns
};
function wgVaseArt(k) { // a vase in its glaze: a rim, a narrow neck, a round body and a band, lit from the top left
  const [, , [L, M, D], band] = WG_VASES[k];
  return wgMake('vase_' + k, 11, 14, (g) => {
    WG_VASE_ROWS.forEach(([a, b], j) => { for (let c = a; c <= b; c++) { const u = (c - a) / Math.max(1, b - a); wgPx(g, c + 1, j + 1, u < 0.3 ? L : u > 0.7 ? D : M); } });
    wgRc(g, 4, 1, 3, 1, D); wgPx(g, 2, 6, 'w'); // the mouth, a shine
    if (band === 'B') for (const c of [2, 4, 6, 8]) wgPx(g, c, 8, band); else wgRc(g, 2, 8, 7, 1, band); // dots or a band
  });
}
const _wgBuildPot = wgBuildAll;
wgBuildAll = function () {
  _wgBuildPot();
  WG_VASES.forEach(([id], k) => wgReg(id, [wgVaseArt(k)]));
  wgReg('amphora', [wgMake('amphora', 15, 18, (g) => { // a tall terracotta jar with two handles and a black-figure band
    const rows = [[4, 8], [5, 7], [5, 7], [4, 8], [3, 9], [2, 10], [2, 10], [2, 10], [2, 10], [2, 10], [3, 9], [3, 9], [4, 8], [5, 7], [4, 8]];
    rows.forEach(([a, b], j) => { for (let c = a; c <= b; c++) { const u = (c - a) / Math.max(1, b - a); wgPx(g, c + 1, j + 1, u < 0.3 ? 'O' : u > 0.7 ? 'n' : 'N'); } });
    wgRc(g, 6, 1, 3, 1, 'n'); wgRc(g, 3, 7, 9, 2, 'u'); wgPx(g, 5, 7, 'N'); wgPx(g, 9, 8, 'N'); wgPx(g, 4, 6, 'w');
    wgRc(g, 2, 3, 1, 4, 'n'); wgRc(g, 3, 3, 2, 1, 'n'); wgRc(g, 12, 3, 1, 4, 'n'); wgRc(g, 10, 3, 2, 1, 'n'); // the handles
  })]);
  wgReg('vase_flowers', [wgMake('vase_flowers', 13, 20, (g) => { // the blue vase with a red, a yellow and a white bloom
    WG_VASE_ROWS.forEach(([a, b], j) => { for (let c = a; c <= b; c++) { const u = (c - a) / Math.max(1, b - a); wgPx(g, c + 2, j + 7, u < 0.3 ? 'c' : u > 0.7 ? 'b' : 'B'); } });
    wgRc(g, 4, 14, 7, 1, 'w'); wgPx(g, 3, 12, 'w');
    for (const [x, y, c, s] of [[3, 1, 'r', 'R'], [7, 0, 'y', 'Y'], [10, 2, 'w', 'L']]) { wgRc(g, x, y, 2, 2, c); wgPx(g, x, y, s); }
    wgLine(g, 4, 3, 5, 7, 'g'); wgLine(g, 7, 2, 6, 7, 'G'); wgLine(g, 10, 4, 7, 7, 'g'); wgPx(g, 9, 5, 'G');
  })]);
  wgReg('potwheel', [wgMake('potwheel', 18, 15, (g) => { // a wooden stand, the round stone head, a lump of clay on it
    wgRc(g, 2, 8, 14, 5, 'n'); wgRc(g, 2, 8, 14, 1, 'N'); wgRc(g, 3, 13, 2, 1, 'u'); wgRc(g, 13, 13, 2, 1, 'u'); wgRc(g, 8, 9, 2, 4, 'u');
    wgBlob(g, 9, 6.5, 6.4, 2.2, ['d', 'm', 'l', 'L']); wgBlob(g, 9, 4, 2.6, 2, ['n', 'N', 'N', 'O']);
  })]);
};
const _wgTipPot = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPot(s); if (s.id === 'potwheel') L.push('CLAY BECOMES VASES HERE'); return L; };
