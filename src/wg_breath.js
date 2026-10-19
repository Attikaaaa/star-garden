'use strict';
// Wildgrove: frosty breath. In the cold (outdoors in winter, or on snow and ice in any season) every hero's breath
// shows: a small puff in front of the face every `WG_BREATH_T` seconds that swells, drifts up and away and fades. Each
// hero breathes on their own beat (from the pid); drawn by a `wgDrawAmbient` wrapper for you and every friend in view.
// None facing away, wading or soaking in a spring, none with the ambient life option off.
const WG_BREATH_T = 2.8, WG_BREATH_LIFE = 1.1;
function wgColdAt(x, y) { // is the air cold here
  if (WGS.dim !== 'o') return false;
  const g = GROUND[wgGround(WGS.world, 'o', Math.floor(x / 16), Math.floor(y / 16))];
  return !!g && !g.liq && (wgSeason() === 3 || g.id === 'snow' || g.id === 'ice');
}
function wgBreathPuff(q, seed, cx0, cy0) { // one hero's breath, if it shows now
  if (!q || q.hidden || q.face === 'u' || !wgColdAt(q.x, q.y)) return;
  const k = ((WGS.t + (seed % 97) / 97 * WG_BREATH_T) % WG_BREATH_T) / WG_BREATH_LIFE; if (k >= 1) return;
  const sat = q.sit || q.face === 'S', side = sat ? 0 : q.face === 'l' ? -1 : q.face === 'r' ? 1 : 0, n = k < 0.3 ? 1 : k < 0.65 ? 2 : 3;
  const x = Math.round(q.x - cx0 + side * (5 + k * 6) + (side ? 0 : 1) - n / 2), y = Math.round(q.y - cy0 - 16 + (sat ? 5 : 0) + (side ? 0 : 2) - k * 7);
  ctx.globalAlpha = Math.min(1, k / 0.12) * (1 - k) * 0.75; rect(x, y, n, n, 'w'); if (n === 3) rect(x + 1, y - 1, 1, 1, 'w');
  ctx.globalAlpha = 1;
}
const _wgAmbBreath = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbBreath(cx0, cy0);
  if (!WGS.world || WGS.dim !== 'o' || !wgOpt().amb) return;
  wgBreathPuff(WGS.p, 0, cx0, cy0);
  for (const q of WGS.remote || []) if (q.dim === WGS.dim) wgBreathPuff(q, hash(q.pid | 0, 7, 3), cx0, cy0);
};
