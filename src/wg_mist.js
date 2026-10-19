'use strict';
// Wildgrove: morning mist. On some mornings (`wgMistToday`: most often in autumn, seldom in summer) pale banks of mist lie
// over the land at dawn, drift slowly on the breeze and thin away as the sun climbs. The banks are laid out from the
// world's seed in cells and move with the world's own clock, as the cloud shadows do, so every co-op screen sees the same;
// outdoors only, none under rain or snow or with the weather effects off. Drawn over the world and its dark, as the
// rainbow is; each bank is baked once, in 2px cells, with a dithered rim. The MISTY MORNING star the first time.
const WG_MIST_W = 240, WG_MIST_H = 96, WG_MIST_CX = 300, WG_MIST_CY = 170, WG_MIST_V = [4, 1];
const WG_MIST_SHAPES = [ // each bank is a few long, thin wisps lying one over another
  [[70, 28, 60, 6], [130, 40, 90, 8], [96, 54, 74, 7], [160, 66, 62, 6], [80, 78, 46, 5]],
  [[110, 26, 70, 6], [70, 40, 60, 7], [150, 50, 80, 8], [100, 64, 90, 7], [180, 78, 44, 5]],
  [[120, 32, 96, 8], [60, 46, 48, 6], [170, 58, 60, 7], [110, 70, 80, 6]],
]
const WGMI = { art: [], k: 0 };
(function () {
  WG_ACH.push(['mist', 'MISTY MORNING', 'BE OUT IN THE MORNING MIST', (c) => c.st.mist]);
})();
function wgMistToday() { // a misty morning today: five days in fifteen in spring and winter, three in summer, ten in autumn
  const w = WGS.world; if (!w) return false;
  return hash(WGS.day | 0, w.seed | 0, 131) % 15 < [5, 3, 10, 5][wgSeason()];
}
function wgMistAt(c) { // how thick the mist is at this time of the morning: up before dawn, gone by mid-morning
  return c < 0.1 || c > 0.34 ? 0 : c < 0.17 ? (c - 0.1) / 0.07 : c < 0.24 ? 1 : (0.34 - c) / 0.1;
}
function wgMistArt(i) {
  if (WGMI.art[i]) return WGMI.art[i];
  const [c, g] = wgCv(WG_MIST_W, WG_MIST_H); g.fillStyle = 'rgba(255,255,255,0.24)';
  for (let y = 0; y < WG_MIST_H; y += 2) for (let x = 0; x < WG_MIST_W; x += 2) {
    let v = 0; for (const [bx, by, rx, ry] of WG_MIST_SHAPES[i]) v = Math.max(v, 1 - ((x + 1 - bx) / rx) ** 2 - ((y + 1 - by) / ry) ** 2);
    if (v <= 0 || (v < 0.45 && ((x >> 1) + (y >> 1) * 3) % 4 === 0) || (v < 0.2 && ((x + y) >> 1) % 2)) continue; // frayed ends
    g.fillRect(x, y, 2, 2); if (v > 0.4) g.fillRect(x, y, 2, 2); if (v > 0.75) g.fillRect(x, y, 2, 2); // thicker along the middle
  }
  return (WGMI.art[i] = c);
}
function wgMistList(x0, y0, x1, y1) { // the banks over a stretch of the world: [x, y, shape]
  const T = wgCloudT(), ox = T * WG_MIST_V[0], oy = T * WG_MIST_V[1], s = WGS.world.seed | 0, out = [];
  const gx0 = Math.floor((x0 - ox - WG_MIST_W) / WG_MIST_CX), gx1 = Math.floor((x1 - ox) / WG_MIST_CX), gy0 = Math.floor((y0 - oy - WG_MIST_H) / WG_MIST_CY), gy1 = Math.floor((y1 - oy) / WG_MIST_CY);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const h = hash(gx, gy, s * 11 + 6151); if (h % 4 === 0) continue; // three cells in four
    out.push([Math.round(gx * WG_MIST_CX + (h >>> 4) % (WG_MIST_CX - 40) - 40 + ox), Math.round(gy * WG_MIST_CY + (h >>> 12) % (WG_MIST_CY - 30) - 30 + oy), (h >>> 20) % WG_MIST_SHAPES.length]);
  }
  return out;
}
const _wgUpdMist = updateWG;
updateWG = function (dt) { // thicken and thin with the morning, at once gone under weather or indoors
  _wgUpdMist(dt);
  const want = WGS.world && WGS.dim === 'o' && wgOpt().wx && !WGS.weather && wgMistToday() ? wgMistAt(WGS.clock % 1) : 0;
  WGMI.k += (want - WGMI.k) * Math.min(1, dt * 0.5); if (Math.abs(want - WGMI.k) < 0.01) WGMI.k = want;
  if (WGMI.k > 0.6 && WGS.scr === 'play') { const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); if (!st.mist) { st.mist = 1; wgToast('A MISTY MORNING', 2.5); } }
};
const _wgFxMist = wgDrawWeatherFX;
wgDrawWeatherFX = function () { // a pale haze over everything, the dawn's dark included
  _wgFxMist();
  if (WGMI.k < 0.05 || !WGS.world || WGS.dim !== 'o' || !wgOpt().wx) return;
  const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, x0 = cx0 - SCR.ox, y0 = cy0 - SCR.oy;
  ctx.globalAlpha = WGMI.k > 0.66 ? 1 : WGMI.k > 0.33 ? 0.66 : 0.33; // in three steps
  for (const [x, y, i] of wgMistList(x0, y0, x0 + SCR.w, y0 + SCR.h)) ctx.drawImage(wgMistArt(i), x - cx0, y - cy0);
  ctx.globalAlpha = 1;
};
