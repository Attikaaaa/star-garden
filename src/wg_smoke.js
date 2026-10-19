'use strict';
// Wildgrove: campfire smoke. Three soft puffs at a time curl up from every campfire, growing and fading as they rise
// and leaning with the wind (`wgWindA`, the weather vane's, from the world's clock), so on every screen the smoke drifts
// the same way. A `wgDrawObj` wrapper draws them after the fire; off with the ambient life option.
const WG_SMOKE_N = 3, WG_SMOKE_UP = 28;
const _wgDrawObjSmoke = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjSmoke(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!o || o.id !== 'campfire' || !wgOpt().amb) return;
  const T = WGS.t, h = (hash(tx, ty, 41) & 255) / 256, lean = Math.sin(wgWindA()) * 12;
  for (let i = 0; i < WG_SMOKE_N; i++) {
    const k = (T * 0.28 + i / WG_SMOKE_N + h) % 1, n = k < 0.3 ? 1 : k < 0.65 ? 2 : 3;
    const x = Math.round(sx + 8 + lean * k * k + Math.sin(k * 6 + i * 2) * 1.5 - n / 2), y = Math.round(sy + 3 - k * WG_SMOKE_UP);
    ctx.globalAlpha = Math.min(1, k / 0.1) * (1 - k * k) * 0.9; rect(x, y, n, n, k < 0.5 ? 'w' : 'L'); if (n > 1) rect(x + n - 1, y + n - 1, 1, 1, 'l'); // lit on its top left
  }
  ctx.globalAlpha = 1;
};
