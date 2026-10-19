'use strict';
// Wildgrove: a day at the beach. A deck chair (a seat, like the others of wg_rest) in striped canvas and a beach
// umbrella with a striped canopy, each in three colours picked by the tile's hash, so a row of them is never all alike.
// Sitting in a deck chair on sand lights BEACH DAY.
const WG_BEACH_COLS = [['r', 'R'], ['b', 'B'], ['o', 'O']]; // the stripes: shade and light, each beside white canvas
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 3, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  dec('deckchair', 'DECK CHAIR', { seat: 1, solid: 0 }, { wood: 3, wool: 2 }, 'loom');
  dec('parasol', 'BEACH UMBRELLA', { parasol: 1 }, { stick: 3, wool: 3 }, 'loom');
  WG_ACH.push(['beach', 'BEACH DAY', 'SIT IN A DECK CHAIR ON THE SAND', (c) => c.st.beach]);
})();
const _wgUpdBeach = updateWG;
updateWG = function (dt) {
  _wgUpdBeach(dt);
  const w = WGS.world, p = WGS.p, S = p && p.sit; if (!S || S.dim !== WGS.dim || w.meta.stats && w.meta.stats.beach) return;
  if (wgObjAt(w, S.dim, S.tx, S.ty) === O_ID.deckchair && wgGroundAtT(S.tx, S.ty).id === 'sand') { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.beach = 1; }
};
// the umbrella's shade on the sand, wider than its pole's
const _wgDrawObjBeach = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) { if (OBJ[id].parasol) shadow(sx + 8, sy + 14, 22); _wgDrawObjBeach(id, tx, ty, sx, sy); };
const _wgTipBeach = wgTipLines;
wgTipLines = function (s) { const L = _wgTipBeach(s); if (s.id === 'parasol') L.push('SHADE FOR A SUNNY DAY'); return L; };
const _wgBuildBeach = wgBuildAll;
wgBuildAll = function () {
  _wgBuildBeach();
  const W = ['u', 'n', 'N'];
  // a deck chair from the front: a striped sling hung between two wooden frames, sagging into a seat, the front legs crossed by a bar
  wgReg('deckchair', WG_BEACH_COLS.map(([d, l], v) => wgMake('deckchair_' + v, 22, 20, (g) => {
    for (let y = 3; y <= 13; y++) for (let x = 4; x <= 17; x++) { const k = Math.floor((x - 4) / 2) % 2; wgPx(g, x, y, k ? (x === 17 || y === 13 ? 'l' : 'L') : (x === 17 || y === 13 ? d : l)); }
    wgRc(g, 4, 3, 14, 1, 'L'); wgRc(g, 5, 14, 12, 1, d); // the top hem, the sling's dip
    for (const x of [2, 18]) { wgRc(g, x, 1, 2, 18, W[1]); wgRc(g, x, 1, 1, 18, W[2]); } wgRc(g, 2, 1, 18, 1, W[2]); wgRc(g, 4, 16, 14, 1, W[0]);
  })));
  // a beach umbrella: a domed canopy in stripes with a scalloped hem and a gold knob, its pole in a little heap of sand
  wgReg('parasol', WG_BEACH_COLS.map(([d, l], v) => wgMake('parasol_' + v, 26, 34, (g) => {
    wgRc(g, 12, 9, 2, 22, 'L'); wgRc(g, 13, 9, 1, 22, 'l');
    for (let y = 2; y <= 10; y++) {
      const hw = Math.round(Math.sqrt(Math.max(0, 1 - ((10 - y) / 8.6) ** 2)) * 12);
      for (let x = 13 - hw; x <= 12 + hw; x++) { const k = Math.floor((x - 1) / 4) % 2; wgPx(g, x, y, k ? (y > 8 ? 'l' : 'L') : (y > 8 || x > 18 ? d : l)); }
    }
    for (let x = 1; x <= 24; x++) if (x % 4 === 1 || x % 4 === 2) wgPx(g, x, 11, Math.floor((x - 1) / 4) % 2 ? 'l' : d); // the scalloped hem
    wgRc(g, 12, 0, 2, 2, 'y'); wgPx(g, 12, 0, 'Y');
    wgBlob(g, 13, 31.5, 4.5, 1.6, ['e', 'a', 'a', 'A']);
  })));
};
