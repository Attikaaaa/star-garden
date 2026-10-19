'use strict';
// Wildgrove: cloud shadows. On a clear day soft shadows of clouds drift slowly over the land, the hero and everything
// on it. The field of clouds is laid out from the world's seed in cells and slides with the world's own clock (the day
// and the hour), so every co-op screen sees the same shadows in the same places. They fade away at dusk and under rain
// or snow, and stay out underground and with the weather effects off. Each shadow is baked once, in 2px cells, faint,
// with a dithered rim.
const WG_CLOUD_W = 176, WG_CLOUD_H = 80, WG_CLOUD_CX = 520, WG_CLOUD_CY = 360, WG_CLOUD_V = [6, 2];
const WG_CLOUD_SHAPES = [
  [[60, 44, 52, 26], [112, 36, 50, 26], [90, 54, 64, 22]],
  [[52, 40, 44, 24], [96, 34, 40, 22], [134, 46, 36, 20], [92, 54, 60, 18]],
  [[88, 40, 80, 30], [56, 50, 40, 20], [128, 30, 34, 18]],
];
const WGCS = { art: [], k: 0 };
function wgCloudArt(i) {
  if (WGCS.art[i]) return WGCS.art[i];
  const [c, g] = wgCv(WG_CLOUD_W, WG_CLOUD_H); g.fillStyle = 'rgba(43,26,71,0.12)'; // the outline indigo, faint
  for (let y = 0; y < WG_CLOUD_H; y += 2) for (let x = 0; x < WG_CLOUD_W; x += 2) {
    let v = 0; for (const [bx, by, rx, ry] of WG_CLOUD_SHAPES[i]) v = Math.max(v, 1 - ((x + 1 - bx) / rx) ** 2 - ((y + 1 - by) / ry) ** 2);
    if (v <= 0 || (v < 0.3 && ((x + y) >> 1) % 2)) continue; // a dithered rim
    g.fillRect(x, y, 2, 2);
  }
  return (WGCS.art[i] = c);
}
const wgCloudT = () => ((WGS.day | 0) + (WGS.clock % 1)) * wgDayLen(); // the world's clock in seconds
function wgCloudList(x0, y0, x1, y1) { // the shadows over a stretch of the world: [x, y, shape]
  const T = wgCloudT(), ox = T * WG_CLOUD_V[0], oy = T * WG_CLOUD_V[1], s = WGS.world.seed | 0, out = [];
  const gx0 = Math.floor((x0 - ox - WG_CLOUD_W) / WG_CLOUD_CX), gx1 = Math.floor((x1 - ox) / WG_CLOUD_CX), gy0 = Math.floor((y0 - oy - WG_CLOUD_H) / WG_CLOUD_CY), gy1 = Math.floor((y1 - oy) / WG_CLOUD_CY);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const h = hash(gx, gy, s * 7 + 4711); if (h % 5 < 2) continue; // three cells in five have a cloud
    out.push([Math.round(gx * WG_CLOUD_CX + (h >>> 4) % (WG_CLOUD_CX - WG_CLOUD_W) + ox), Math.round(gy * WG_CLOUD_CY + (h >>> 12) % (WG_CLOUD_CY - WG_CLOUD_H) + oy), (h >>> 20) % WG_CLOUD_SHAPES.length]);
  }
  return out;
}
const _wgUpdClouds = updateWG;
updateWG = function (dt) { // fade in on a clear day, out at dusk or under weather
  _wgUpdClouds(dt);
  const want = WGS.world && WGS.dim === 'o' && wgOpt().wx && !WGS.weather ? Math.max(0, 1 - wgNight(WGS.clock) * 3) : 0;
  WGCS.k += (want - WGCS.k) * Math.min(1, dt * 0.6); if (Math.abs(want - WGCS.k) < 0.01) WGCS.k = want;
};
const _wgAmbClouds = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) { // under the butterflies and birds, over the ground and all that stands on it
  if (WGCS.k > 0.02 && WGS.world && WGS.dim === 'o') {
    const x0 = cx0 - SCR.ox, y0 = cy0 - SCR.oy;
    ctx.globalAlpha = WGCS.k > 0.66 ? 1 : WGCS.k > 0.33 ? 0.66 : 0.33; // in three steps
    for (const [x, y, i] of wgCloudList(x0, y0, x0 + SCR.w, y0 + SCR.h)) ctx.drawImage(wgCloudArt(i), x - cx0, y - cy0);
    ctx.globalAlpha = 1;
  }
  _wgAmbClouds(cx0, cy0);
};
