'use strict';
// Wildgrove: bats at dusk. From dusk into the early night and again before dawn (`wgBatsOut`), in every season but
// winter and never in the rain, a bat flits about over one cell in three of the woods and meadows (`WG_BAT_C` px cells,
// chosen by the cell and the seed): looping, swerving and dipping on its own path, wings beating fast. Ambient life,
// each screen its own, drawn by a `wgDrawLight` wrapper over the dark so its shape shows against the dusk, with a faint
// shadow far below; off with the ambient life option.
const WG_BAT_C = 160, WG_BAT_LANDS = ['forest', 'meadow', 'swamp', 'highland', 'jungle'];
const WG_BAT_ART = [['X.......X', 'XX.x.x.XX', '.XXxxxXX.', '....x....'], ['...x.x...', '.XXxxxXX.', 'XX..x..XX', 'X.......X']]; // wings up, wings down, its ears up
function wgBatsOut() { const n = wgNight(WGS.clock); return WGS.dim === 'o' && wgSeason() !== 3 && n > 0.12 && n < 0.7 && !(WGS.weather && WGS.weather.kind === 'rain'); }
function wgBatArt(f) { return WGA.cache['dbat_' + f] || wgMake('dbat_' + f, 11, 6, (g) => wgPaint(g, 1, 1, WG_BAT_ART[f], { X: 'X', x: 'x' })); }
function wgBatsInView(cx0, cy0, fn) { // each bat near the view: its place in the air and on the ground under it
  const w = WGS.world, C = WG_BAT_C, T = WGS.t;
  for (let gy = Math.floor((cy0 - SCR.oy) / C) - 1; gy <= Math.floor((cy0 - SCR.oy + SCR.h) / C) + 1; gy++) for (let gx = Math.floor((cx0 - SCR.ox) / C) - 1; gx <= Math.floor((cx0 - SCR.ox + SCR.w) / C) + 1; gx++) {
    const h = hash(gx, gy, (w.seed | 0) * 3 + 5150); if (h % 3) continue;
    const ax = gx * C + 40 + (h >>> 4) % 80, ay = gy * C + 40 + (h >>> 11) % 80; if (!WG_BAT_LANDS.includes(wgSurface(w.seed, Math.floor(ax / 16), Math.floor(ay / 16)).b)) continue;
    const ph = (h >>> 18) % 628 / 100, x = ax + Math.sin(T * 0.9 + ph) * 40 + Math.sin(T * 3.1 + ph * 2) * 8, gy0 = ay + Math.cos(T * 1.3 + ph) * 14;
    fn(x, gy0 - 30 + Math.sin(T * 4.7 + ph) * 3, gy0, Math.floor(T * 12 + ph * 3) % 2);
  }
}
const _wgLightBats = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  _wgLightBats(cx0, cy0);
  if (!WGS.world || !wgOpt().amb || !wgBatsOut()) return;
  wgBatsInView(cx0, cy0, (x, y, gy, f) => {
    const sx = Math.round(x - cx0), sy = Math.round(y - cy0);
    ctx.globalAlpha = 0.5; shadow(sx, Math.round(gy - cy0), 2); ctx.globalAlpha = 1;
    ctx.drawImage(wgBatArt(f), sx - 5, sy - 3);
  });
};
