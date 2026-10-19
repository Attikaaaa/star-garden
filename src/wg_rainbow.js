'use strict';
// Wildgrove: a rainbow after the rain. When a daytime rain stops outdoors, a soft rainbow arcs over the view for a
// while, fading in and out. Every screen sees it, since a guest's weather follows the host's; with the weather effects
// turned off there is none. The arc is drawn once per screen size. The OVER THE RAINBOW star.
const WG_BOW_T = 45, WG_BOW_COLS = ['r', 'o', 'y', 'G', 'c', 'B', '2']; // seconds a rainbow lasts; its bands, outside in
const WGBOW = { wet: false, t0: -1, c: null, key: '' };
(function () {
  WG_ACH.push(['bow', 'OVER THE RAINBOW', 'SEE A RAINBOW AFTER THE RAIN', (c) => c.st.bow]);
})();
const _wgUpdBow = updateWG;
updateWG = function (dt) {
  _wgUpdBow(dt);
  if (!WGS.world || !WGS.p) { WGBOW.wet = false; WGBOW.t0 = -1; return; }
  const wet = !!(WGS.weather && WGS.weather.kind === 'rain');
  if (WGBOW.wet && !wet && WGS.dim === 'o' && wgNight(WGS.clock) < 0.3) { WGBOW.t0 = WGS.t; const m = WGS.world.meta; (m.stats || (m.stats = { kills: 0, far: 0 })).bow = 1; }
  WGBOW.wet = wet; if (WGBOW.t0 > WGS.t) WGBOW.t0 = -1; // another world's clock
};
const wgBowAlpha = (k) => (k < 0 || k > WG_BOW_T ? 0 : 0.3 * Math.min(1, k / 5, (WG_BOW_T - k) / 10)); // in over 5 s, out over the last 10
function wgBowArt() { // the arc across the whole screen, high and flat, its foot below the sides; two pixels a band
  const key = SCR.w + 'x' + SCR.h; if (WGBOW.key === key) return WGBOW.c;
  const w = SCR.w, h = SCR.h, [c, g] = wgCv(w, h), R = h * 1.34, cy = h * 1.4, cx = w / 2;
  for (let x = 0; x < w; x++) WG_BOW_COLS.forEach((k, i) => { const r = R - i * 2, dx = x + 0.5 - cx; if (Math.abs(dx) < r) wgRc(g, x, Math.round(cy - Math.sqrt(r * r - dx * dx)), 1, 2, k); });
  WGBOW.key = key; WGBOW.c = c; return c;
}
const _wgFxBow = wgDrawWeatherFX;
wgDrawWeatherFX = function () {
  _wgFxBow();
  if (WGBOW.t0 < 0 || WGS.dim !== 'o' || !wgOpt().wx || !WGS.world) return;
  const a = wgBowAlpha(WGS.t - WGBOW.t0); if (!a) return;
  ctx.globalAlpha = a; ctx.drawImage(wgBowArt(), -SCR.ox, -SCR.oy); ctx.globalAlpha = 1;
};
