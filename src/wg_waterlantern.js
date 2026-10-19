'use strict';
// Wildgrove: water lanterns. A little paper lantern on a wooden float, set out on water only (like a lily pad), that
// bobs gently on its own beat and glows warm at night (`light`); its paper is white, pink or yellow by the tile
// (`WG_WLAN_COLS`, from the tile's hash, the same on every screen). Drawn by a `wgDrawObj` wrapper.
const WG_WLAN_COLS = [['L', 'w', 'l'], ['P', 'q', 'p'], ['y', 'Y', 'o']]; // the paper: its colour, its lit side, its shade
(function () {
  wgObj('water_lantern', { name: 'WATER LANTERN', kind: 'deco', tool: 'hand', hp: 1, solid: 0, water: 1, light: 3, wlan: 1, drops: [DR('water_lantern', 1, 1)] });
  wgItem('water_lantern', 'WATER LANTERN', 'place', { place: 'water_lantern' }); PLACE.water_lantern = 'water_lantern';
  wgRec('water_lantern', 2, { wood: 1, fiber: 2, torch: 1 }, 'bench');
})();
const _wgCanPlaceWLan = wgCanPlaceAt;
wgCanPlaceAt = function (tx, ty, item) { return item.place === 'water_lantern' && wgGroundAtT(tx, ty).liq !== 'water' ? false : _wgCanPlaceWLan(tx, ty, item); };
function wgWLanArt(k, lit) { // a square paper lantern with a tiny roof on a float; lit, its paper glows from inside
  const key = 'wlan_' + k + (lit ? 'l' : ''); if (WGA.cache[key]) return WGA.cache[key];
  const [m, l, d] = WG_WLAN_COLS[k];
  return wgMake(key, 12, 13, (g) => {
    wgRc(g, 1, 9, 10, 2, 'n'); wgRc(g, 1, 9, 10, 1, 'N'); wgRc(g, 2, 11, 8, 1, 'u'); // the float
    wgRc(g, 3, 3, 6, 6, m); wgRc(g, 3, 3, 1, 6, l); wgRc(g, 8, 3, 1, 6, d); // the paper
    if (lit) { wgRc(g, 4, 4, 4, 4, 'Y'); wgRc(g, 5, 5, 2, 2, 'w'); wgPx(g, 4, 4, 'y'); } else { wgRc(g, 4, 6, 4, 1, d); wgPx(g, 6, 5, 'o'); } // a candle's glow, or a band and the wick
    wgRc(g, 2, 2, 8, 1, 'n'); wgRc(g, 4, 1, 4, 1, 'N'); // its little roof
  });
}
const _wgDrawObjWLan = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.wlan) return _wgDrawObjWLan(id, tx, ty, sx, sy);
  const h = hash(tx, ty, 29), bob = Math.round(Math.sin(WGS.t * 1.4 + (h & 63) / 10)), lit = WGS.dim !== 'o' || wgNight(WGS.clock) > 0.25;
  ctx.globalAlpha = 0.5; rect(sx + 3, sy + 14, 10, 1, 'C'); ctx.globalAlpha = 1; // a ripple round its float
  ctx.drawImage(wgWLanArt(h % WG_WLAN_COLS.length, lit), sx + 2, sy + 3 + bob);
  WGR.lights.push({ x: sx + 8, y: sy + 8, r: o.light, f: 1 });
};
const _wgBuildWLan = wgBuildAll;
wgBuildAll = function () { _wgBuildWLan(); wgReg('water_lantern', [wgWLanArt(0, false)]); };
const _wgTipWLan = wgTipLines;
wgTipLines = function (s) { const L = _wgTipWLan(s); if (s.id === 'water_lantern') L.push('FLOATS ON WATER', 'GLOWS AT NIGHT'); return L; };
