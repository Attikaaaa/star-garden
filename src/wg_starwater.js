'use strict';
// Wildgrove: stars on the water. On clear nights the deep water outdoors holds the stars: one deep tile in
// `WG_STARW_ONE` shows a reflected star at a spot of its own (`wgStarWater`, from the tile and the seed), twinkling on
// its own beat, a few of them brighter with a little cross. They fade in with the dark (`wgNight` from 0.45) and stay
// away in the rain, underground and with the weather effects off. Drawn by a `wgDrawLight` wrapper over the dark, so
// they shine, on open water only: never on a tile with something on it or under a hero.
const WG_STARW_ONE = 4;
function wgStarWater(tx, ty) { // the star reflected on a tile, or null: its spot, its beat and whether it is a bright one
  const w = WGS.world, h = hash(tx, ty, (w.seed | 0) * 13 + 6007) >>> 0; if (h % WG_STARW_ONE) return null;
  return { dx: 2 + (h >>> 3) % 12, dy: 2 + (h >>> 7) % 12, ph: (h >>> 11) % 628 / 100, sp: 1.2 + (h >>> 20) % 9 / 5, big: (h >>> 24) % 6 === 0, c: (h >>> 27) % 3 ? 'w' : 'Y' };
}
const _wgLightStarW = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  _wgLightStarW(cx0, cy0);
  const w = WGS.world; if (!w || WGS.dim !== 'o' || !wgOpt().wx || (WGS.weather && WGS.weather.kind === 'rain')) return;
  const k = Math.min(1, (wgNight(WGS.clock) - 0.45) / 0.25); if (k <= 0) return;
  const T = WGS.t, heroes = [WGS.p].concat((WGS.remote || []).filter(q => q.dim === 'o'));
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const S = wgStarWater(tx, ty); if (!S || !GROUND[wgGround(w, 'o', tx, ty)].swim || wgObjAt(w, 'o', tx, ty)) continue;
    const wx = tx * 16 + S.dx, wy = ty * 16 + S.dy; if (heroes.some(q => q && !q.hidden && Math.abs(q.x - wx) < 10 && wy > q.y - 28 && wy < q.y + 4)) continue; // not over a swimmer
    const a = k * (0.35 + 0.65 * Math.max(0, Math.sin(T * S.sp + S.ph))); if (a < 0.08) continue;
    const x = wx - cx0, y = wy - cy0;
    ctx.globalAlpha = a; rect(x, y, 1, 1, S.c);
    if (S.big && a > 0.6) { ctx.globalAlpha = a * 0.5; rect(x - 1, y, 1, 1, S.c); rect(x + 1, y, 1, 1, S.c); rect(x, y - 1, 1, 1, S.c); rect(x, y + 1, 1, 1, S.c); }
  }
  ctx.globalAlpha = 1;
};
