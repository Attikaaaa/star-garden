'use strict';
// Wildgrove: leaping fish. Where fish swim in deep water (wg_pondlife's cells), now and then one leaps clear: up out of
// the water in a little arc and back in, rings spreading where it left and where it fell, a few drops flying. Each pond
// has its own beat (`WG_LEAP_EVERY` s and a little more) and each leap its own spot and way; ambient life, each screen
// its own, drawn by a `wgDrawAmbient` wrapper, off with the ambient life option.
const WG_LEAP_EVERY = 12, WG_LEAP_T = 0.7, WG_LEAP_RING = 0.6;
const WG_LEAP_ART = { // a silver fish side on, facing right: rising, at the top, falling
  up: ['...lL', '..lLl', '.mlm.', 'mm...'], top: ['m.lll.', 'mmLLLl', 'm.mmm.'], down: ['mm...', '.mlm.', '..lLl', '...lL'],
};
function wgLeapArt(k, left) {
  const key = 'leap_' + k + (left ? 'l' : ''); if (WGA.cache[key]) return WGA.cache[key];
  const rows = WG_LEAP_ART[k], W = rows[0].length + 2;
  return wgMake(key, W, rows.length + 2, (g) => { if (left) { g.translate(W, 0); g.scale(-1, 1); } wgPaint(g, 1, 1, rows, { m: 'm', l: 'l', L: 'L' }); });
}
function wgLeapRing(x, y, u) { // a ring spreading on the water, u from 0 to 1
  const r = 1 + Math.round(u * 6); ctx.globalAlpha = (1 - u) * 0.85;
  rect(x - r, y - 1, r * 2 + 1, 1, 'C'); rect(x - r, y + 1, r * 2 + 1, 1, 'C'); rect(x - r - 1, y, 1, 1, 'C'); rect(x + r + 1, y, 1, 1, 'C');
  ctx.globalAlpha = 1;
}
const _wgAmbLeap = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbLeap(cx0, cy0);
  if (WGS.dim !== 'o' || !wgOpt().amb || wgSeason() === 3) return;
  const t = WGS.t;
  wgPondCells(cx0, cy0, ([kind, ax, ay, ph], gx, gy) => {
    if (kind !== 0) return;
    const per = WG_LEAP_EVERY + hash(gx, gy, 5) % 7, c = (t + ph * 7) / per, n = Math.floor(c), u = (c - n) * per;
    if (u > WG_LEAP_T + WG_LEAP_RING) return;
    const j = hash(n, gx * 31 + gy, 3), dir = j & 1 ? 1 : -1, ox = (j >>> 1) % 21 - 10, oy = (j >>> 6) % 9 - 4;
    const x0 = Math.round(ax + ox - 8 * dir - cx0), x1 = Math.round(ax + ox + 8 * dir - cx0), y0 = Math.round(ay + oy - cy0);
    if (u < WG_LEAP_RING) wgLeapRing(x0, y0, u / WG_LEAP_RING);
    if (u > WG_LEAP_T) { wgLeapRing(x1, y0, (u - WG_LEAP_T) / WG_LEAP_RING); return; }
    const k = u / WG_LEAP_T, x = Math.round(x0 + (x1 - x0) * k), y = Math.round(y0 - Math.sin(k * Math.PI) * 11), a = wgLeapArt(k < 0.33 ? 'up' : k < 0.67 ? 'top' : 'down', dir < 0);
    ctx.drawImage(a, x - (a.width >> 1), y - a.height + 2);
    if (k < 0.2 || k > 0.8) { const s = k < 0.2 ? x0 : x1, e = k < 0.2 ? k / 0.2 : (1 - k) / 0.2; rect(s - 2, y0 - 2 - Math.round(e * 3), 1, 1, 'w'); rect(s + 2, y0 - 1 - Math.round(e * 4), 1, 1, 'w'); } // drops thrown up
  });
};
