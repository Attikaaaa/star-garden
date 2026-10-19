'use strict';
// Wildgrove: ice cream. An ice cream cart is a station (`WG_AT.icecart`; USE opens the recipe book) where milk, sugar
// and ice from the snowy lands fill a waffle cone with vanilla, strawberry, chocolate or mint, and lemons make a sorbet
// (`WG_ICES`). In summer a cold one now and then gives a BRAIN FREEZE (a `wgEat` wrapper). Each one tasted is a bit of
// `stats.ices`; all five light the ICE CREAM DREAM star.
const WG_ICES = [['ice_vanilla', 'VANILLA CONE', ['a', 'A', 'Y', 'w']], ['ice_straw', 'STRAWBERRY CONE', ['p', 'P', 'q', 'w']],
  ['ice_choc', 'CHOCOLATE CONE', ['u', 'n', 'N', 'A']], ['ice_mint', 'MINT CONE', ['t', 'T', 'C', 'w']], ['ice_lemon', 'LEMON SORBET', ['o', 'y', 'Y', 'w']]]; // id, name, scoop ramp
const WG_ICE_FREEZE = 0.2; // the chance of a brain freeze in summer
(function () {
  wgItem('waffle_cone', 'WAFFLE CONE', 'res', {}); wgRec('waffle_cone', 3, { flour: 1, sugar: 1, egg: 1 }, 'fire');
  wgObj('icecart', { name: 'ICE CREAM CART', kind: 'station', st: 'icecart', tool: 'axe', hp: 5, solid: 1, drops: [DR('icecart', 1, 1)] });
  wgItem('icecart', 'ICE CREAM CART', 'place', { place: 'icecart' }); PLACE.icecart = 'icecart'; wgRec('icecart', 1, { wood: 4, iron: 1, ice_shard: 2, petal_r: 1 }, 'bench');
  const base = { milk: 1, sugar: 1, ice_shard: 1, waffle_cone: 1 };
  for (const [id, name] of WG_ICES) wgItem(id, name, 'food', { food: id === 'ice_lemon' ? 3 : 4 });
  wgRec('ice_vanilla', 1, base, 'icecart'); wgRec('ice_straw', 1, Object.assign({ strawberry: 2 }, base), 'icecart');
  wgRec('ice_choc', 1, Object.assign({ cocoa: 1 }, base), 'icecart'); wgRec('ice_mint', 1, Object.assign({ mint: 2 }, base), 'icecart');
  wgRec('ice_lemon', 2, { lemon: 2, sugar: 1, ice_shard: 2 }, 'icecart');
  WG_AT.icecart = 'AT AN ICE CREAM CART';
  WG_ACH.push(['icecream', 'ICE CREAM DREAM', 'TASTE EVERY ICE CREAM', (c) => ((c.st.ices | 0) & 31) === 31]);
})();
const _wgUseCream = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, id = w && wgObjAt(w, WGS.dim, tx, ty);
  if (id && OBJ[id].st === 'icecart') { WGS.scr = 'inv'; WGS.ui = { tab: 'craft' }; return true; }
  return _wgUseCream(tx, ty);
};
const _wgEatCream = wgEat;
wgEat = function (slot) {
  const s = WGS.inv[slot], i = s ? WG_ICES.findIndex(q => q[0] === s.id) : -1, r = _wgEatCream(slot);
  if (!r || i < 0) return r;
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }), p = WGS.p; st.ices = (st.ices | 0) | (1 << i);
  if (wgSeason() === 1 && Math.random() < WG_ICE_FREEZE) { wgToast('BRAIN FREEZE!', 2); wgPart(p.x, p.y - 22, 6, { c: ['C', 'c', 'w'], s: 18, up: 6, life: 0.6 }); }
  return r;
};
function wgIceArt(k) { // the cart with its striped parasol and three tubs on top; a scoop on a waffle cone, or sorbet in a cup
  const key = 'ice_' + k; if (WGA.cache[key]) return WGA.cache[key];
  if (k === 'cart') return wgMake(key, 20, 24, (g) => {
    for (let y = 0; y < 5; y++) { const hw = [5, 7, 8, 9, 9][y]; for (let x = 10 - hw; x < 10 + hw; x++) wgPx(g, x, 1 + y, Math.floor((x - 1) / 3) % 2 ? 'w' : y < 2 && x < 10 ? 'P' : 'p'); } // the parasol, lit from the left
    for (let x = 1; x < 19; x += 3) wgRc(g, x, 6, 2, 1, Math.floor((x - 1) / 3) % 2 ? 'L' : 'p'); // its scalloped hem
    wgRc(g, 9, 6, 1, 7, 'l'); wgRc(g, 10, 6, 1, 7, 'm'); // the pole
    wgRc(g, 3, 11, 3, 2, 'C'); wgRc(g, 8, 11, 3, 2, 'q'); wgRc(g, 13, 11, 3, 2, 'Y'); for (const x of [3, 8, 13]) wgPx(g, x, 11, 'w'); // tubs of mint, strawberry and vanilla
    wgRc(g, 2, 13, 15, 6, 'L'); wgRc(g, 2, 13, 1, 6, 'w'); wgRc(g, 16, 13, 1, 6, 'l'); wgRc(g, 2, 13, 15, 1, 'w'); wgRc(g, 3, 15, 13, 1, 'P'); wgRc(g, 3, 16, 13, 1, 'p'); // the box with its pink band
    wgRc(g, 17, 14, 2, 1, 'n'); wgPx(g, 18, 15, 'n'); // the handle
    wgBlob(g, 6, 20, 2.6, 2.6, ['x', 'X', 'X', 'm']); wgPx(g, 6, 20, 'l'); wgRc(g, 13, 19, 1, 4, 'u'); // a wheel and a leg
  });
  const i = +k.slice(1), [D, M, L, W] = WG_ICES[i][2];
  return wgMake(key, 16, 16, (g) => {
    if (WG_ICES[i][0] === 'ice_lemon') { // a paper cup, white with a blue band
      for (let y = 8; y < 15; y++) { const a = 3 + ((y - 8) >> 1), b = 15 - a, band = y === 10 || y === 11; wgRc(g, a, y, b - a + 1, 1, band ? 'B' : 'L'); wgPx(g, a, y, band ? 'c' : 'w'); wgPx(g, b, y, band ? 'b' : 'l'); }
      wgBlob(g, 7.5, 6.5, 4.6, 3, [D, M, L, W]); wgPx(g, 7, 2, 'g'); wgPx(g, 8, 3, 'G'); // a mint leaf on top
      return;
    }
    for (let y = 9; y < 15; y++) { const a = 4 + ((y - 9) * 3 >> 2), b = 15 - a; for (let x = a; x <= b; x++) wgPx(g, x, y, (x + y) % 3 === 0 ? 'n' : x === a ? 'a' : 'N'); } // the cone: waffle squares, narrowing to its tip
    wgBlob(g, 7.5, 6.5, 4.8, 3.8, [D, M, L, W]); wgRc(g, 4, 9, 8, 1, M); wgPx(g, 5, 10, M); wgPx(g, 10, 10, D); // the scoop and its drips
    if (WG_ICES[i][0] === 'ice_mint') for (const [x, y] of [[6, 5], [9, 7], [7, 8]]) wgPx(g, x, y, 'u'); // chocolate chips
    if (WG_ICES[i][0] === 'ice_straw') wgPx(g, 8, 4, 'r');
  });
}
function wgConeArt() {
  if (WGA.cache.ice_cone) return WGA.cache.ice_cone;
  return wgMake('ice_cone', 16, 16, (g) => { // a waffle cone, its rolled rim on top
    for (let y = 3; y < 14; y++) { const a = 3 + Math.round((y - 3) * 0.4), b = 15 - a; for (let x = a; x <= b; x++) wgPx(g, x, y, y < 5 ? (x === a || y === 3 ? 'A' : 'a') : (x + y) % 3 === 0 ? 'n' : x === a ? 'a' : 'N'); }
  });
}
const _wgTipCream = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipCream(s);
  if (s.id === 'icecart') L.push('MAKES ICE CREAM');
  else if (s.id === 'waffle_cone') L.push('FOR ICE CREAM');
  return L;
};
const _wgBuildCream = wgBuildAll;
wgBuildAll = function () { _wgBuildCream(); wgReg('icecart', [wgIceArt('cart')]); };
const _wgIconCream = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, i = WG_ICES.findIndex(q => q[0] === id);
  if (WGA.cache[key] || (id !== 'icecart' && id !== 'waffle_cone' && i < 0)) return _wgIconCream(id);
  let c;
  if (i >= 0) c = wgIceArt('s' + i);
  else if (id === 'waffle_cone') c = wgConeArt();
  else c = wgMake('ice_carticon', 16, 16, (g) => { // the cart, small
    for (let y = 0; y < 3; y++) { const hw = [4, 6, 7][y]; for (let x = 8 - hw; x < 8 + hw; x++) wgPx(g, x, 1 + y, Math.floor((x - 1) / 3) % 2 ? 'w' : y < 1 && x < 8 ? 'P' : 'p'); }
    wgRc(g, 7, 4, 1, 4, 'm'); wgRc(g, 3, 7, 3, 1, 'C'); wgRc(g, 10, 7, 3, 1, 'q');
    wgRc(g, 2, 8, 12, 5, 'L'); wgRc(g, 2, 8, 1, 5, 'w'); wgRc(g, 13, 8, 1, 5, 'l'); wgRc(g, 3, 10, 10, 1, 'P');
    wgBlob(g, 5, 13.5, 1.8, 1.8, ['x', 'X', 'X', 'm']); wgRc(g, 11, 13, 1, 2, 'u');
  });
  WGA.cache[key] = c; return c;
};
