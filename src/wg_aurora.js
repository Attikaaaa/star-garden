'use strict';
// Wildgrove: the northern lights. On two winter nights in three (`wgAuroraTonight`, from the night and the seed) soft
// green curtains with a pink hem drift slowly across the top of the view while it is dark, fading in at dusk and out
// before dawn. They move with the world's own clock, so every co-op screen sees them alike; outdoors only, never under
// rain or snow, none with the weather effects off. Each ribbon is baked once, in 2px cells, its rays dithered as they
// fade; it is drawn twice side by side as it slides. The NORTHERN LIGHTS star.
const WG_AURORA_W = 480; // a ribbon's width; it tiles
const WGAU = { art: [], k: 0 };
(function () {
  WG_ACH.push(['aurora', 'NORTHERN LIGHTS', 'SEE THE NORTHERN LIGHTS ON A WINTER NIGHT', (c) => c.st.aurora]);
})();
function wgAuroraTonight() { // the lights are out tonight (a night belongs to the evening it began on)
  const n = WGS.day - (WGS.clock < 0.5 ? 1 : 0); if (!WGS.world || Math.floor(n / 8) % 4 !== 3) return false; // a winter evening's night, as wgSeason counts
  return hash(n, WGS.world.seed | 0, 97) % 3 !== 0;
}
function wgAuroraArt(i) { // a curtain: a wavy top edge, rays hanging from it that fade downward; green, the second one teal with a pink hem
  if (WGAU.art[i]) return WGAU.art[i];
  const W = WG_AURORA_W, H = 64, [c, g] = wgCv(W, H), top = i ? ['q', 'h', 'c'] : ['H', 'h', 'G'], P = Math.PI * 2 / W;
  for (let x = 0; x < W; x += 2) {
    const yc = 14 + Math.sin(x * P * 2 + i * 2.1) * 7 + Math.sin(x * P * 5 + i) * 3, len = 22 + Math.sin(x * P * 7 + i * 1.3) * 9 + Math.sin(x * P * 13) * 4;
    for (let y = 0; y < len; y += 2) {
      const v = 1 - y / len; if (v < 0.5 && ((x + y) >> 1) % 2) continue; if (v < 0.22 && (x >> 1) % 2) continue; // dithered as the rays fade
      g.fillStyle = PAL[top[y < 3 ? 0 : v > 0.55 ? 1 : 2]]; g.fillRect(x, Math.round(yc / 2) * 2 + y, 2, 2);
    }
  }
  return (WGAU.art[i] = c);
}
const _wgUpdAurora = updateWG;
updateWG = function (dt) { // fade in with the dark on a night of lights, out under weather or underground
  _wgUpdAurora(dt);
  const want = WGS.world && WGS.dim === 'o' && wgOpt().wx && !WGS.weather && wgAuroraTonight() ? Math.min(1, wgNight(WGS.clock) * 1.4) : 0; // full well before midnight
  WGAU.k += (want - WGAU.k) * Math.min(1, dt * 0.5); if (Math.abs(want - WGAU.k) < 0.01) WGAU.k = want;
  if (WGAU.k > 0.6 && WGS.scr === 'play') { const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); if (!st.aurora) { st.aurora = 1; wgToast('THE NORTHERN LIGHTS!', 3); } }
};
const _wgFxAurora = wgDrawWeatherFX;
wgDrawWeatherFX = function () {
  _wgFxAurora();
  if (WGAU.k < 0.05 || WGS.dim !== 'o' || !wgOpt().wx || !WGS.world) return;
  const T = wgCloudT(), x0 = -SCR.ox, y0 = -SCR.oy;
  for (let i = 0; i < 2; i++) {
    const a = WGAU.k * (0.44 + 0.08 * Math.sin(T * 0.4 + i * 2)) * (i ? 0.8 : 1); // a slow shimmer
    ctx.globalAlpha = Math.round(a * 20) / 20; if (!ctx.globalAlpha) continue;
    const off = ((T * (i ? -2.2 : 3) + i * 170) % WG_AURORA_W + WG_AURORA_W) % WG_AURORA_W, art = wgAuroraArt(i), y = y0 + 2 + i * 12;
    for (let x = x0 - Math.round(off); x < x0 + SCR.w; x += WG_AURORA_W) ctx.drawImage(art, x, y);
  }
  ctx.globalAlpha = 1;
};
