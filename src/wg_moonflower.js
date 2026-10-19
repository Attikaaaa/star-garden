'use strict';
// Wildgrove: moonflowers. Tall grass cut by hand at night now and then gives moonflower seeds (`WG_MOONSEED_CH`, a
// `wgBreak` wrapper), planted on soft ground. A moonflower keeps its bud shut by day and opens through the evening
// (`wgMoonOpen`), its pale petals giving a soft light at night, a little more under a full moon, with motes rising
// from it (a `wgDrawObj` wrapper). USE on an open one picks a moon petal, once a night: the tile's meta is the night's
// mark, so it goes over co-op with the tile. Two petals make MOONFLOWER TEA at the fire, best enjoyed sitting down.
// Five open in view light the MOONLIT GARDEN star.
const WG_MOONSEED_CH = 0.06, WG_MOONFL_N = 5;
const WGMF = { t: 0 };
(function () {
  wgObj('moonflower', { name: 'MOONFLOWER', kind: 'plant', hp: 1, solid: 0, moonfl: 1, drops: [DR('moon_seed', 1, 1)] });
  wgItem('moon_seed', 'MOONFLOWER SEEDS', 'place', { place: 'moonflower' }); PLACE.moon_seed = 'moonflower';
  wgItem('moon_petal', 'MOON PETAL', 'res', {});
  wgItem('moon_tea', 'MOONFLOWER TEA', 'food', { food: 3, buff: 'regen' }); wgRec('moon_tea', 1, { moon_petal: 2 }, 'fire'); WG_TEA.push('moon_tea');
  WG_ACH.push(['moonfl', 'MOONLIT GARDEN', 'SEE FIVE MOONFLOWERS OPEN AT NIGHT', (c) => (c.st.moonfl | 0) > 0]);
})();
const wgMoonOpen = () => { const k = wgNight(WGS.clock); return k < 0.25 ? 0 : k < 0.6 ? 1 : 2; }; // shut, half open, open
const wgMoonMark = () => ((wgGazeNight() % 255) + 255) % 255 + 1;
const _wgCanPlaceMoon = wgCanPlaceAt;
wgCanPlaceAt = function (tx, ty, item) {
  if (item.place !== 'moonflower') return _wgCanPlaceMoon(tx, ty, item);
  const g = wgGroundAtT(tx, ty); return /^(grass|dirt|tilled|jungle|mud)$/.test(g.id) && _wgCanPlaceMoon(tx, ty, item);
};
const _wgBreakMoon = wgBreak;
wgBreak = function (tx, ty, byPlayer) {
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)], r = _wgBreakMoon(tx, ty, byPlayer);
  if (o && o.id === 'tallgrass' && byPlayer && WGS.dim === 'o' && wgNight(WGS.clock) > 0.5 && Math.random() < WG_MOONSEED_CH) wgDrop(tx * 16 + 8, ty * 16 + 10, 'moon_seed', 1);
  return r;
};
const _wgUseMoon = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty);
  if (!id || !OBJ[id].moonfl) return _wgUseMoon(tx, ty);
  if (wgMoonOpen() < 2) { wgToast('IT OPENS AT NIGHT'); return true; }
  if (wgMetaAt(w, dim, tx, ty) === wgMoonMark()) { wgToast('COME BACK TOMORROW NIGHT'); return true; }
  wgSetObj(w, dim, tx, ty, id, wgMoonMark());
  const left = wgInvAdd(WGS.inv, 'moon_petal', 1); if (left) wgDrop(tx * 16 + 8, ty * 16 + 10, 'moon_petal', left);
  wgPart(tx * 16 + 8, ty * 16 + 4, 5, { c: ['C', 'L', 'w'], s: 12, up: 14, life: 0.7 }); wgSfx('chime');
  return true;
};
const _wgUpdMoonfl = updateWG;
updateWG = function (dt) { // once a second at night: five open in view light the star
  _wgUpdMoonfl(dt);
  const w = WGS.world; if (!w || WGS.scr !== 'play' || (WGMF.t -= dt) > 0) return; WGMF.t = 1;
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); if (st.moonfl || WGS.dim !== 'o' || wgMoonOpen() < 2) return;
  const x0 = Math.floor((WGS.cam.x - VW / 2) / 16), y0 = Math.floor((WGS.cam.y - VH / 2) / 16); let n = 0;
  for (let y = y0; y <= y0 + 14; y++) for (let x = x0; x <= x0 + 24; x++) { const id = wgObjAt(w, 'o', x, y); if (id && OBJ[id].moonfl) n++; }
  if (n >= WG_MOONFL_N) st.moonfl = 1;
};
const _wgDrawObjMoon = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.moonfl) return _wgDrawObjMoon(id, tx, ty, sx, sy);
  const f = wgMoonOpen(), h = hash(tx, ty, 23); ctx.drawImage(wgMoonflArt(f), sx + 2, sy);
  if (f < 2) return;
  const full = typeof wgMoonPhase === 'function' && wgMoonPhase() === 4;
  if (WGS.dim === 'o') WGR.lights.push({ x: sx + 8, y: sy + 6, r: full ? 22 : 16, f: 0.2 });
  if (wgOpt().amb) for (let i = 0; i < 2; i++) { // motes drifting up from the petals
    const u = (WGS.t * 0.35 + i * 0.5 + (h & 15) / 16) % 1; if (u > 0.8) continue;
    rect(Math.round(sx + 8 + Math.sin(u * 6 + i * 2 + h) * 3), Math.round(sy + 4 - u * 16), 1, 1, u < 0.4 ? 'w' : 'C');
  }
};
function wgMoonflArt(f) { // a stem with two leaves under a pale bud, a half-open cup or an open flower with a golden heart
  const key = 'moonfl_' + f; if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 12, 16, (g) => {
    wgRc(g, 6, 8, 1, 7, 'g'); wgRc(g, 4, 11, 2, 1, 'G'); wgPx(g, 3, 10, 'h'); wgRc(g, 7, 12, 2, 1, 'G'); wgPx(g, 9, 11, 'G');
    if (f === 0) { wgBlob(g, 6, 5.5, 1.6, 2.6, ['g', 'G', 'h', 'H']); wgPx(g, 6, 2, 'L'); }
    else if (f === 1) { wgBlob(g, 6, 5.5, 2.8, 2.4, ['C', 'L', 'L', 'w']); wgRc(g, 5, 8, 3, 1, 'G'); wgPx(g, 6, 4, 'Y'); }
    else { wgBlob(g, 6, 5, 4.6, 3.6, ['C', 'L', 'L', 'w']); for (const [x, y] of [[2, 4], [10, 5], [6, 1], [4, 8], [8, 8]]) wgPx(g, x, y, 'C'); wgRc(g, 5, 4, 2, 2, 'y'); wgPx(g, 5, 4, 'Y'); }
  });
}
const _wgTipMoon = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipMoon(s);
  if (s.id === 'moon_seed') L.push('FROM TALL GRASS AT NIGHT', 'PLANT ON SOFT GROUND');
  else if (s.id === 'moon_petal') L.push('FROM A MOONFLOWER, ONCE A NIGHT');
  return L;
};
const _wgBuildMoon = wgBuildAll;
wgBuildAll = function () { _wgBuildMoon(); wgReg('moonflower', [wgMoonflArt(2)]); };
const _wgIconMoon = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if ((id !== 'moon_seed' && id !== 'moon_petal' && id !== 'moon_tea') || WGA.cache[key]) return _wgIconMoon(id);
  const c = wgMake(key, 16, 16, (g) => {
    if (id === 'moon_seed') for (const [x, y] of [[5, 8], [9, 6], [8, 10]]) { wgRc(g, x, y, 2, 3, 'X'); wgPx(g, x, y, 'C'); } // dark seeds with a pale gleam
    else if (id === 'moon_petal') { wgBlob(g, 8, 8, 4, 2.6, ['C', 'L', 'L', 'w']); wgPx(g, 5, 8, 'w'); wgRc(g, 11, 8, 2, 1, 'C'); }
    else { wgRc(g, 3, 6, 9, 8, 'w'); wgRc(g, 3, 6, 9, 1, 'L'); wgRc(g, 11, 7, 1, 7, 'l'); wgRc(g, 4, 7, 7, 2, 'C'); wgRc(g, 4, 7, 7, 1, 'w'); wgRc(g, 12, 8, 2, 1, 'w'); wgRc(g, 13, 9, 1, 2, 'w'); wgRc(g, 12, 11, 2, 1, 'w'); wgPx(g, 6, 7, 'Y'); } // a cup of pale tea with a petal afloat
  });
  WGA.cache[key] = c; return c;
};
