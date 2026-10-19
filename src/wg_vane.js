'use strict';
// Wildgrove: a weather vane. A copper rooster on an arrow turns with the wind over a post with its four arms; the
// wind's heading comes from the world's clock alone (`wgWindA`), so every co-op screen shows it pointing the same way,
// and it swings about in the rain. USE it for a forecast (`wgForecast`): fair weather, rain on its way, rain that will
// last or a sky that will clear soon. Only the host knows the weather's timer, so it rides in the `clk` message as `fc`
// for its friends. Reading that rain is on its way just before it comes lights WEATHER WISE.
const WG_VANE_SAY = ['FAIR WEATHER AHEAD', 'RAIN IS ON ITS WAY', 'THE RAIN WILL LAST A WHILE', 'THE SKY WILL CLEAR SOON', 'THE STORM WILL LAST A WHILE'];
const WGVN = { fc: 0, said: -1e9, wk: null };
(function () {
  wgObj('weathervane', { name: 'WEATHER VANE', kind: 'deco', tool: 'pick', hp: 4, vane: 1, drops: [DR('weathervane', 1, 1)] });
  wgItem('weathervane', 'WEATHER VANE', 'place', { place: 'weathervane' }); PLACE.weathervane = 'weathervane'; wgRec('weathervane', 1, { copper: 3, stick: 2 }, 'anvil');
  WG_ACH.push(['vane', 'WEATHER WISE', 'HEAR FROM A WEATHER VANE THAT RAIN IS COMING', (c) => c.st.vane]);
})();
function wgForecast() { // 0 fair, 1 rain coming, 2 rain that lasts, 3 clearing soon, 4 a storm that lasts
  if (WGN.role === 'client') return WGVN.fc | 0;
  const W = WGS.weather, T = WGS.wxT; if (T === undefined) return 0;
  if (!W) return T < 70 ? 1 : 0;
  return T < 25 ? 3 : W.storm ? 4 : 2;
}
const wgWindA = () => { // the wind's heading, from the world's clock: slow swings, gusty in the rain
  const T = ((WGS.day | 0) + WGS.clock % 1) * wgDayLen();
  return 1.7 * Math.sin(T / 97) + 1.2 * Math.sin(T / 41 + 1) + (WGS.weather ? 0.5 * Math.sin(T * 1.9) : 0);
};
const _wgUseVane = wgUse;
wgUse = function (tx, ty) {
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (!o || !o.vane) return _wgUseVane(tx, ty);
  if (WGS.dim !== 'o') { wgToast('THE AIR IS STILL DOWN HERE'); return true; }
  const fc = wgForecast(); wgToast(WG_VANE_SAY[fc] || WG_VANE_SAY[0], 2.5); wgSfx('select');
  if (fc === 1) WGVN.said = WGS.t;
  return true;
};
// the host and friends: the forecast rides in the clock message; rain that comes after the vane said so lights the star
const _wgnAllVane = wgnAll;
wgnAll = function (msg, except, unreliable) { if (msg && msg.t === 'clk') msg.fc = wgForecast(); return _wgnAllVane(msg, except, unreliable); };
const _wgnClientVane = wgnClientMsg;
wgnClientMsg = function (L, m) { if (m && m.t === 'clk' && L && L.open) WGVN.fc = Math.max(0, Math.min(4, m.fc | 0)); return _wgnClientVane(L, m); };
const _wgUpdVane = updateWG;
updateWG = function (dt) {
  _wgUpdVane(dt);
  const w = WGS.world, wk = WGS.wk || null, was = WGVN.wk; WGVN.wk = wk; if (!w || WGN.role === 'client') return;
  if (wk && !was && WGS.t - WGVN.said < 240) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.vane = 1; WGVN.said = -1e9; }
};
// ---------- drawing: the rooster turns over the post, side on, three-quarter or end on ----------
const _wgDrawObjVane = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjVane(id, tx, ty, sx, sy);
  if (!OBJ[id].vane) return;
  const d = WGS.dim === 'o' ? Math.cos(wgWindA() + hash(tx, ty, 31) % 3 * 0.05) : 1, f = d > 0.72 ? 0 : d > 0.28 ? 1 : d > -0.28 ? 2 : d > -0.72 ? 3 : 4;
  const A = WGA.cache.vane_arms, sp = WGA.cache['vane' + f]; if (A) ctx.drawImage(A, sx, sy - 2); if (sp) ctx.drawImage(sp, sx, sy - 18); // the frame's pivot (7, 11) sits on the post's gold ball
};
const _wgTipVane = wgTipLines;
wgTipLines = function (s) { const L = _wgTipVane(s); if (s.id === 'weathervane') L.push('USE IT FOR A FORECAST'); return L; };
const _wgBuildVane = wgBuildAll;
wgBuildAll = function () {
  _wgBuildVane();
  const CU = ['n', 'N', 'N', 'O'];
  // a rooster on an arrow, k its width (1 side on, 0.5 three-quarter); s is -1 for one facing left
  const frame = (k, s) => {
    const [c, g] = wgCv(14, 13), X = (x) => Math.round(7 + (x - 7) * k * s);
    if (k > 0) {
      for (let x = 1; x <= 12; x++) wgPx(g, X(x), 10, x < 3 ? 'O' : 'N'); // the arrow: its head into the wind, the feathers behind
      wgPx(g, X(2), 9, 'O'); wgPx(g, X(2), 11, 'O'); wgPx(g, X(11), 9, 'n'); wgPx(g, X(12), 9, 'n'); wgPx(g, X(11), 11, 'n'); wgPx(g, X(12), 11, 'n');
      wgBlob(g, 7 + (7.5 - 7) * k * s, 6.2, Math.max(1, 3 * k), 1.8, CU); wgBlob(g, 7 + (4.5 - 7) * k * s, 3.6, Math.max(1, 1.5 * k), 1.5, CU); // the body, the head
      for (const [x, y, q] of [[10, 5, 'N'], [10, 4, 'N'], [11, 3, 'n'], [11, 4, 'O'], [9, 4, 'n'], [12, 2, 'n'], [10, 3, 'O']]) wgPx(g, X(x), y, q); // the tail
      wgPx(g, X(4), 1, 'r'); wgPx(g, X(5), 1, 'r'); wgPx(g, X(4), 2, 'R'); wgPx(g, X(3), 3, 'y'); wgPx(g, X(2), 3, 'O'); wgPx(g, X(4), 3, '0'); // comb, beak, eye
      wgPx(g, X(7), 8, 'n'); wgPx(g, 7, 9, 'x'); wgPx(g, 7, 11, 'x');
    } else { // end on: a sliver of rooster over a short arrow
      wgRc(g, 6, 2, 2, 6, 'N'); wgRc(g, 6, 2, 1, 6, 'O'); wgPx(g, 6, 1, 'r'); wgPx(g, 7, 1, 'r'); wgRc(g, 6, 8, 2, 1, 'n');
      wgRc(g, 7, 9, 1, 3, 'x'); wgPx(g, 6, 10, 'N'); wgPx(g, 8, 10, 'n');
    }
    wgOutline(c); return c;
  };
  [[1, 1], [0.5, 1], [0, 1], [0.5, -1], [1, -1]].forEach(([k, s], i) => { WGA.cache['vane' + i] = frame(k, s); });
  // the post: wood on a stone foot, a gold ball where the rooster turns; its four arms seen from above at a slant,
  // thin iron rods with gold tips (a flat X, so it never reads as a cross), drawn over it without an outline
  wgReg('weathervane', [wgMake('weathervane', 16, 30, (g) => {
    wgRc(g, 7, 10, 2, 17, 'n'); wgRc(g, 7, 10, 1, 17, 'N');
    wgRc(g, 5, 26, 6, 3, 'm'); wgRc(g, 5, 26, 6, 1, 'l'); wgRc(g, 10, 27, 1, 2, 'd');
    wgBlob(g, 8, 9.5, 1.6, 1.6, ['O', 'y', 'y', 'Y']);
  })]);
  const [a, g] = wgCv(16, 7); wgLine(g, 2, 1, 13, 5, 'X'); wgLine(g, 13, 1, 2, 5, 'X'); for (const [x, y] of [[2, 1], [13, 1], [2, 5], [13, 5]]) wgPx(g, x, y, 'y');
  WGA.cache.vane_arms = a;
};
