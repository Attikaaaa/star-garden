'use strict';
// Wildgrove: hot-air balloons. On fair days a balloon now and then drifts east high over the land, its striped envelope
// in two colours (`WG_BALLOON_COLS`), the burner flaring now and then, its shadow far below. Balloons keep to lanes laid
// out from the world's seed, one every `WG_BALLOON_LOOP` px in a lane, and move with the world's clock
// (`wgBalloonList`), so every co-op screen sees the same one in the same place. By day, outdoors, not under weather,
// none with the ambient life switched off. The first to pass right over you is told: the UP AND AWAY star.
const WG_BALLOON_LANE = 700, WG_BALLOON_LOOP = 4000, WG_BALLOON_V = 10, WG_BALLOON_UP = 74; // lanes apart, balloons apart, px/s, height
const WG_BALLOON_COLS = [ // each balloon's two gores: light, mid and shade
  [['R', 'r', 'p'], ['Y', 'y', 'O']], [['C', 'B', 'b'], ['w', 'L', 'l']], [['q', 'P', 'p'], ['Y', 'y', 'O']],
  [['h', 'G', 'g'], ['Y', 'y', 'O']], [['4', '3', '2'], ['C', 'c', 'B']], [['O', 'o', 'n'], ['R', 'r', 'p']],
];
const WGBL = { t: 0 };
(function () {
  WG_ACH.push(['balloon', 'UP AND AWAY', 'SEE A HOT-AIR BALLOON PASS OVER YOU', (c) => (c.st.balloon | 0) > 0]);
})();
function wgBalloonList(x0, y0, x1, y1) { // the balloons over a stretch of the world, by their shadows: [x, y, colours, hash]
  const out = []; if (!WGS.world) return out;
  const T = wgCloudT(), s = WGS.world.seed | 0;
  for (let L = Math.floor((y0 - 20) / WG_BALLOON_LANE); L <= Math.floor((y1 + WG_BALLOON_UP + 40) / WG_BALLOON_LANE); L++) {
    const h = hash(L, 11, s * 17 + 3061) >>> 0, ly = L * WG_BALLOON_LANE + 100 + h % (WG_BALLOON_LANE - 200);
    const ph = (T * WG_BALLOON_V + (h >>> 8) % WG_BALLOON_LOOP) % WG_BALLOON_LOOP; // where this lane's balloons are, one LOOP apart
    for (let k = Math.floor((x0 - 40 - ph) / WG_BALLOON_LOOP); k * WG_BALLOON_LOOP + ph <= x1 + 40; k++) {
      const hk = hash(L, k, s + 5) >>> 0;
      out.push([ph + k * WG_BALLOON_LOOP, ly + Math.sin(T / 37 + hk) * 30, hk % WG_BALLOON_COLS.length, hk]);
    }
  }
  return out;
}
const wgBalloonUp = () => !!WGS.world && WGS.dim === 'o' && wgOpt().amb && wgNight(WGS.clock) < 0.2 && !WGS.weather;
// one right over the hero is noted (and told, the first time)
const _wgUpdBalloon = updateWG;
updateWG = function (dt) {
  _wgUpdBalloon(dt);
  const p = WGS.p; if (WGS.scr !== 'play' || !p || !wgBalloonUp()) return;
  WGBL.t -= dt; if (WGBL.t > 0) return; WGBL.t = 0.5;
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); if (st.balloon) return;
  if (wgBalloonList(p.x - 60, p.y - 20, p.x + 60, p.y + 20).some(([x, y]) => Math.abs(x - p.x) < 50 && Math.abs(y - p.y) < 50)) { st.balloon = 1; wgToast('A HOT-AIR BALLOON!', 2.5); }
};
// drawn over everything on the ground: the shadow far below, the balloon swaying a little, the burner flaring now and then
const _wgAmbBalloon = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbBalloon(cx0, cy0);
  if (!wgBalloonUp()) return;
  const T = wgCloudT(), x0 = cx0 - SCR.ox, y0 = cy0 - SCR.oy;
  for (const [x, y, c, h] of wgBalloonList(x0, y0, x0 + SCR.w, y0 + SCR.h)) {
    const gx = Math.round(x - cx0), gy = Math.round(y - cy0), by = gy - WG_BALLOON_UP + Math.round(Math.sin(T * 0.6 + h) * 2);
    if (gx < -SCR.ox - 20 || gx > SCR.w - SCR.ox + 20 || by > SCR.h - SCR.oy + 30 || gy < -SCR.oy - 10) continue;
    ctx.globalAlpha = 0.6; shadow(gx, gy, 14); ctx.globalAlpha = 1;
    const fire = (T + (h % 97)) % 9 < 0.9, art = wgBalloonArt(c, fire ? 1 : 0);
    ctx.drawImage(art, gx - (art.width >> 1), by - art.height);
  }
};
// a balloon: a round envelope in five gores that follow its curve, lit from the top left, ropes down to a wicker basket
function wgBalloonArt(c, fire) {
  const key = 'balloon_' + c + '_' + fire; if (WGA.cache[key]) return WGA.cache[key];
  const [A, B] = WG_BALLOON_COLS[c], W = 21, H = 30, cx = 10;
  return wgMake(key, W, H, (g) => {
    for (let y = 1; y <= 19; y++) {
      const r = y <= 11 ? Math.sqrt(Math.max(0, 1 - ((y - 10) / 9.5) ** 2)) * 9.5 : 9.5 - (y - 11) * 0.82; // round on top, tapering to the mouth
      for (let x = Math.round(cx - r); x <= Math.round(cx + r); x++) {
        const nx = (x - cx) / Math.max(1, r), ny = (y - 9) / 10, gore = Math.min(4, Math.floor((nx + 1) * 2.5)), R = gore & 1 ? B : A;
        const lit = -nx * 0.6 - ny * 0.55; wgPx(g, x, y, lit > 0.45 ? R[0] : lit < -0.3 ? R[2] : R[1]);
      }
    }
    wgRc(g, cx - 2, 20, 5, 1, 'n'); if (fire) { wgPx(g, cx, 21, 'y'); wgPx(g, cx, 22, 'Y'); wgPx(g, cx - 1, 22, 'o'); wgPx(g, cx + 1, 22, 'o'); }
    wgLine(g, cx - 2, 21, cx - 3, 24, 'n'); wgLine(g, cx + 2, 21, cx + 3, 24, 'n');
    wgRc(g, cx - 3, 25, 7, 4, 'N'); wgRc(g, cx - 3, 25, 7, 1, 'e'); wgRc(g, cx - 3, 28, 7, 1, 'n'); wgPx(g, cx - 1, 26, 'n'); wgPx(g, cx + 1, 27, 'n');
  });
}
