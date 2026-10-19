'use strict';
// Wildgrove: candles. Beeswax and string make candles (`WG_CANDLES`: white, and red and blue from petals), small lights
// to set out, and three of them on an iron candelabra. Their flames flicker, each from its own tile's hash (a
// `wgDrawObj` wrapper), and moths come to the candelabra. Making a candelabra lights CANDLELIGHT.
const WG_CANDLES = [['candle', 'WHITE CANDLE', null, ['L', 'w']], ['candle_r', 'RED CANDLE', 'petal_r', ['r', 'R']], ['candle_b', 'BLUE CANDLE', 'petal_b', ['B', 'c']]]; // id, name, dye, the wax: shade, light
(function () {
  for (const [id, name, dye] of WG_CANDLES) {
    wgObj(id, { name, kind: 'light', light: 44, tool: 'hand', hp: 1, solid: 0, candle: 1, drops: [DR(id, 1, 1)] });
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 2, dye ? { honey: 1, string: 1, [dye]: 1 } : { honey: 1, string: 1 }, 'bench');
  }
  wgObj('candelabra', { name: 'CANDELABRA', kind: 'light', light: 80, tool: 'pick', hp: 3, solid: 0, candle: 3, drops: [DR('candelabra', 1, 1)] });
  wgItem('candelabra', 'CANDELABRA', 'place', { place: 'candelabra' }); PLACE.candelabra = 'candelabra'; wgRec('candelabra', 1, { candle: 3, iron: 1 }, 'anvil');
  WG_MOTH_LAMPS.push('candelabra');
  WG_ACH.push(['candle', 'CANDLELIGHT', 'MAKE A CANDELABRA', (c) => c.seen.candelabra]);
})();
const WG_WICKS = { 1: [[3, 3]], 3: [[3, 6], [8, 3], [13, 6]] }; // the wicks on a candle's and a candelabra's canvas
function wgFlame(x, y, h) { // a candle flame standing on the wick below x, y: it leans and shrinks a little now and then
  const T = WGS.t + (h % 97) / 10, k = Math.floor(T * 7) % 4, lean = k === 1 ? -1 : k === 3 ? 1 : 0, tall = Math.floor(T * 5 + (h >>> 4)) % 3 ? 3 : 2;
  rect(x, y, 1, 1, 'o'); if (tall === 3) rect(x, y - 1, 1, 1, 'w'); rect(x + lean, y - tall + 1, 1, 1, 'Y');
}
const _wgDrawObjCandle = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjCandle(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!o || !o.candle) return;
  const sp = WGA.obj[o.id][0], h = hash(tx, ty, 61);
  for (const [wx, wy] of WG_WICKS[o.candle]) wgFlame(sx + sp.ox + wx, sy + sp.oy + wy - 1, h + wx * 31);
};
const _wgBuildCandle = wgBuildAll;
wgBuildAll = function () {
  _wgBuildCandle();
  for (const [id, , , [D, Lt]] of WG_CANDLES) wgReg(id, [wgMake(id, 8, 14, (g) => { // a candle in a little brass dish; room above it for the flame
    wgRc(g, 3, 4, 2, 7, D); wgRc(g, 3, 4, 1, 7, Lt); wgPx(g, 4, 4, Lt); wgPx(g, 3, 3, 'u'); wgPx(g, 4, 5, Lt); // the wax, a drip down its front, the wick
    wgRc(g, 1, 11, 6, 1, 'o'); wgRc(g, 2, 12, 4, 1, 'n'); wgPx(g, 1, 11, 'Y');
  })]);
  wgReg('candelabra', [wgMake('candelabra', 16, 22, (g) => { // three white candles on an iron stand with two arms
    for (const [x, y] of [[2, 7], [7, 4], [12, 7]]) { wgRc(g, x, y, 2, 5, 'L'); wgPx(g, x, y, 'w'); wgPx(g, x + 1, y - 1, 'u'); wgRc(g, x - 1, y + 5, 4, 1, 'm'); } // the candles in their cups
    wgRc(g, 2, 13, 12, 1, 'd'); wgRc(g, 7, 10, 2, 9, 'd'); wgRc(g, 7, 10, 1, 9, 'm'); // the arms, the stem
    wgRc(g, 4, 19, 8, 2, 'd'); wgRc(g, 5, 19, 6, 1, 'm'); // the foot
  })]);
};
