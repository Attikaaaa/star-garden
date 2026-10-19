'use strict';
// Wildgrove: the moon's phases. The moon waxes and wanes over `WG_MOON_DAYS` nights (`wgMoonPhase`, the night counted
// from its evening as the stargazing does, so every screen has the same moon): a full moon lights the night a little
// (`WG_MOON_LIGHT` off the darkness, a `wgAmbient` wrapper), a new moon leaves it a touch darker. The dial at the top
// right shows tonight's moon in its phase (a `wgDrawHud` wrapper draws it over the round dot). Standing out under a
// full moon at midnight lights the MOONLIGHT star.
const WG_MOON_DAYS = 8, WG_MOON_LIGHT = 0.14;
(function () {
  WG_ACH.push(['moon', 'MOONLIGHT', 'STAND OUT UNDER A FULL MOON AT MIDNIGHT', (c) => (c.st.fullmoon | 0) > 0]);
})();
const wgMoonPhase = () => ((wgGazeNight() % WG_MOON_DAYS) + WG_MOON_DAYS) % WG_MOON_DAYS; // 0 new, 4 full
const wgMoonLit = (k) => (1 - Math.cos(k / WG_MOON_DAYS * Math.PI * 2)) / 2; // how much of it is lit, 0 to 1
const _wgAmbMoon = wgAmbient;
wgAmbient = function () {
  const a = _wgAmbMoon(); if (WGS.dim !== 'o' || !WGS.world) return a;
  const n = wgNight(WGS.clock), f = wgMoonLit(wgMoonPhase());
  return wgClamp(a - n * WG_MOON_LIGHT * f + n * 0.04 * (1 - f), 0, 0.88);
};
const _wgUpdMoon = updateWG;
updateWG = function (dt) {
  _wgUpdMoon(dt);
  const w = WGS.world; if (!w || WGS.scr !== 'play' || WGS.dim !== 'o' || wgMoonPhase() !== WG_MOON_DAYS / 2 || wgNight(WGS.clock) < 0.95) return;
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); if (!st.fullmoon) { st.fullmoon = 1; wgToast('A FULL MOON TONIGHT', 2.5); }
};
const _wgHudMoon = wgDrawHud;
wgDrawHud = function () {
  _wgHudMoon();
  if (!WGS.world || WGS.dim === 'u' || wgNight(WGS.clock) <= 0.5) return;
  const R = -SCR.ox + SCR.w, T0 = -SCR.oy, cx = R - 20, cy = T0 + 20, a = (WGS.clock - 0.25) * 6.283;
  const x = cx + Math.round(Math.cos(a) * 6), y = cy + Math.round(-Math.sin(a) * 6), k = wgMoonPhase();
  ctx.drawImage(wgMoonArt(k), x - 3, y - 3);
};
function wgMoonArt(k) { // the moon, 6 by 6: lit from the right as it waxes and from the left as it wanes, the rest the night's own blue
  const key = 'moonph_' + k; if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 6, 6, (g) => {
    const t = Math.cos(k / WG_MOON_DAYS * Math.PI * 2); // where the shadow's edge crosses: 1 all dark, -1 all lit
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const dx = (x + 0.5 - 3) / 3, dy = (y + 0.5 - 3) / 3; if (dx * dx + dy * dy > 1.05) continue;
      const half = Math.sqrt(Math.max(0, 1 - dy * dy)), s = k <= WG_MOON_DAYS / 2 ? dx : -dx; // the lit side
      wgPx(g, x, y, s > t * half ? (dx < -0.3 && dy < -0.3 ? 'w' : 'L') : '2');
    }
  }, false);
}
