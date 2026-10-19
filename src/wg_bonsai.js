'use strict';
// Wildgrove: bonsai. At the potter's wheel a sapling and clay become a little tree in a shallow pot (`WG_BONSAI`: an
// oak in a blue pot, a pine in a clay one, a cherry in blossom in a cream one), to set out on a shelf or a table's
// tile. One of each set out lights BONSAI GARDENER, `stats.bonsai` a bitmask kept by a `wgSetObj` wrapper.
const WG_BONSAI = [ // id, name, sapling, the pads' ramp, the pot: light, shade
  ['bonsai_oak', 'OAK BONSAI', 'sap_oak', ['g', 'G', 'h', 'H'], ['B', 'b']],
  ['bonsai_pine', 'PINE BONSAI', 'sap_pine', ['g', 'g', 'G', 'h'], ['N', 'n']],
  ['bonsai_cherry', 'CHERRY BONSAI', 'sap_cherry', ['p', 'P', 'q', 'w'], ['w', 'L']]];
(function () {
  for (const [id, name, sap] of WG_BONSAI) {
    wgObj(id, { name, kind: 'deco', tool: 'hand', hp: 1, solid: 0, drops: [DR(id, 1, 1)] });
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, { [sap]: 1, clay: 2 }, 'potwheel');
  }
  WG_ACH.push(['bonsai', 'BONSAI GARDENER', 'SET OUT ALL THREE BONSAI', (c) => ((c.st.bonsai | 0) & 7) === 7]);
})();
const _wgSetObjBonsai = wgSetObj;
wgSetObj = function (w, dim, tx, ty, id, meta) { // a bonsai set out counts toward BONSAI GARDENER
  const r = _wgSetObjBonsai(w, dim, tx, ty, id, meta), o = id && OBJ[id], k = o ? WG_BONSAI.findIndex(b => b[0] === o.id) : -1;
  if (k >= 0 && w === WGS.world && !(typeof WGN !== 'undefined' && WGN.applying)) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.bonsai = (st.bonsai | 0) | (1 << k); }
  return r;
};
const _wgBuildBonsai = wgBuildAll;
wgBuildAll = function () {
  _wgBuildBonsai();
  const PADS = { // the foliage: x, y, rx, ry
    bonsai_oak: [[4.6, 7, 3.4, 2.3], [11.4, 5.6, 3.4, 2.2], [8, 3.2, 3, 2]],
    bonsai_pine: [[4.4, 8.4, 3.6, 1.5], [11.6, 6.4, 3.6, 1.5], [7.4, 3.4, 3.2, 1.5]],
    bonsai_cherry: [[4.6, 7, 3.4, 2.4], [11.4, 5.6, 3.4, 2.3], [8, 3.2, 3.1, 2.1]],
  };
  for (const [id, , , ramp, [PL, PD]] of WG_BONSAI) wgReg(id, [wgMake(id, 16, 18, (g) => { // a twisting trunk over a shallow glazed pot
    for (const [x, y] of [[8, 12], [8, 11], [7, 10], [7, 9], [8, 8], [9, 7], [9, 6]]) { wgPx(g, x, y, 'n'); wgPx(g, x + 1, y, 'u'); }
    wgPx(g, 6, 8, 'n'); wgPx(g, 5, 7, 'n'); wgPx(g, 10, 6, 'n'); wgPx(g, 11, 5, 'n'); // the branches out to the pads
    for (const [x, y, rx, ry] of PADS[id]) wgBlob(g, x, y, rx, ry, ramp);
    if (id === 'bonsai_cherry') for (const [x, y] of [[3, 7], [12, 5], [8, 2]]) wgPx(g, x, y, 'w');
    wgRc(g, 3, 12, 10, 1, 'u'); // the soil
    wgRc(g, 2, 13, 12, 1, PL); wgRc(g, 3, 14, 10, 2, PD); wgRc(g, 3, 14, 1, 2, PL); wgPx(g, 4, 16, PD); wgPx(g, 11, 16, PD); // the pot and its feet
  })]);
};
