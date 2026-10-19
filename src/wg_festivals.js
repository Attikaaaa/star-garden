'use strict';
// Wildgrove: festival days. The last day of each season is its festival (`wgFestival`, from the day alone, so every screen
// keeps it): BLOSSOM DAY fills the air with petals, MIDSUMMER NIGHT sends lanterns up into the night sky far off, the
// HARVEST FAIR drifts with autumn leaves while everything grows twice as fast (the host, a `wgGrowTick` wrapper), and
// STARLIGHT EVE brings a gentle snowfall at night. The air and the sky are drawn over the view by a `wgDrawWeatherFX`
// wrapper (`wgFestDraw`), outdoors only, never under real weather, and off with the ambient life. The festival is told
// once a day (`WGFS.told`) and noted in `stats.fest`; all four light A YEAR OF FESTIVALS.
const WG_FESTIVALS = [['BLOSSOM DAY', 'IT IS BLOSSOM DAY!'], ['MIDSUMMER NIGHT', 'IT IS MIDSUMMER NIGHT!'], ['HARVEST FAIR', 'IT IS THE HARVEST FAIR!'], ['STARLIGHT EVE', 'IT IS STARLIGHT EVE!']];
const WGFS = { told: -1 };
(function () {
  WG_ACH.push(['fest', 'A YEAR OF FESTIVALS', 'ENJOY ALL FOUR FESTIVALS', (c) => ((c.st.fest | 0) & 15) === 15]);
})();
const wgFestival = () => ((WGS.day | 0) % 8 === 7 ? wgSeason() : -1); // which festival today is, or -1
const _wgUpdFest = updateWG;
updateWG = function (dt) {
  _wgUpdFest(dt);
  const w = WGS.world, f = wgFestival(); if (!w || !WGS.p || f < 0 || WGS.scr !== 'play' || WGS.dim !== 'o' || WGFS.told === (WGS.day | 0)) return;
  WGFS.told = WGS.day | 0; wgToast(WG_FESTIVALS[f][1], 4); wgSfx('chime');
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.fest = (st.fest | 0) | (1 << f);
};
const _wgGrowFest = wgGrowTick;
wgGrowTick = function (dt) { // the harvest fair: a second growing step each second
  _wgGrowFest(dt);
  if (WGS.growT === 1 && wgFestival() === 2) { WGS.growT = 0; _wgGrowFest(0); }
};
function wgFestDraw(f) { // the festival's air or sky over the whole view
  const l = -SCR.ox, t = -SCR.oy, w = SCR.w, h = SCR.h, T = WGS.t, night = wgNight(WGS.clock);
  if (f === 1) { // lanterns rising far off, smaller as they climb, fading at the top
    if (night < 0.3) return;
    for (let i = 0; i < 14; i++) {
      const ph = (T / 60 + i / 14 + (i * 0.37) % 0.1) % 1, x = Math.round(l + (i * 83.3 + 17) % w + Math.sin(T * 0.3 + i) * 3), y = Math.round(t + h * 0.8 - ph * h * 0.95);
      ctx.globalAlpha = Math.min(1, ph * 8, (1 - ph) * 4) * Math.min(1, (night - 0.3) * 4);
      if (ph < 0.5) { rect(x - 1, y - 1, 3, 4, 'o'); rect(x, y, 1, 2, 'Y'); rect(x - 2, y + 1, 1, 1, 'O'); rect(x + 2, y + 1, 1, 1, 'O'); } else { rect(x, y, 2, 2, 'o'); rect(x, y, 1, 1, 'Y'); }
    }
    ctx.globalAlpha = 1; return;
  }
  if (f === 3 && night < 0.3) return; // the starlight eve's snow falls after dark
  const n = (IS_TOUCH ? 24 : 40), cols = f === 0 ? ['q', 'P', 'w', 'q'] : f === 2 ? ['o', 'O', 'r', 'y', 'n'] : ['w', 'L'];
  for (let i = 0; i < n; i++) {
    const vx = f === 3 ? 3 : 12 + (i % 3) * 4, vy = f === 3 ? 14 + (i % 4) * 3 : 10 + (i % 4) * 3;
    const x = (i * 53.7 + T * vx + Math.sin(T * 0.8 + i) * (f === 3 ? 4 : 10)) % w, y = (i * 97.1 + T * vy) % h;
    const X = Math.round(l + (x + w) % w), Y = Math.round(t + y), c = cols[i % cols.length];
    if (f === 3) rect(X, Y, 1 + (i % 2), 1 + (i % 2), c); else if ((Math.floor(T * 3 + i) & 1)) rect(X, Y, 2, 1, c); else rect(X, Y, 1, 2, c); // petals and leaves flutter
  }
}
const _wgWxFest = wgDrawWeatherFX;
wgDrawWeatherFX = function () {
  _wgWxFest();
  const f = wgFestival(); if (f < 0 || !WGS.world || WGS.dim !== 'o' || WGS.weather || !wgOpt().amb) return;
  wgFestDraw(f);
};
if (typeof wgCalEvents === 'function') { // the calendar marks each festival by its name, under a little string of flags
  WG_FESTIVALS.forEach((F, i) => { WG_CAL_EV['fest' + i] = F[0]; });
  const _wgCalEvFest = wgCalEvents; wgCalEvents = function (d) { const L = _wgCalEvFest(d); return d % 8 === 7 ? L.concat('fest' + Math.floor(d / 8) % 4) : L; };
  const _wgCalIconFest = wgCalIcon; wgCalIcon = function (k, x, y) { if (!k.startsWith('fest')) return _wgCalIconFest(k, x, y); ctx.drawImage(wgFestArt(), x, y); };
}
function wgFestArt() { // three pennants on a string
  return WGA.cache.fest_flags || wgMake('fest_flags', 16, 16, (g) => {
    for (let x = 1; x < 15; x++) wgPx(g, x, 3 + (x > 4 && x < 11 ? 1 : 0), 'n');
    [[2, 'r', 'R'], [6, 'y', 'Y'], [10, 'B', 'c']].forEach(([x0, c, h], k) => { const y0 = k === 1 ? 5 : 4; for (let j = 0; j < 6; j++) for (let i = j >> 1; i < 4 - (j >> 1); i++) wgPx(g, x0 + i, y0 + j, j === 0 && i === 0 ? h : c); });
  });
}
