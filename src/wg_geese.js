'use strict';
// Wildgrove: wild geese. In spring they fly north and in autumn south, high over the land in a V, wings beating in a
// wave down the line, their small shadows far below. Flocks keep to lanes laid out from the world's seed and move with
// the world's own clock (`wgGeeseList`), so every co-op screen sees the same flock in the same place; a few minutes
// apart in each lane, by day only, outdoors, none with the ambient life switched off. The first flock to pass right over
// you each way is told, and WILD GEESE lights once you have seen both.
const WG_GEESE_LANE = 640, WG_GEESE_LOOP = 6000, WG_GEESE_V = 24; // lanes apart, flocks apart in a lane, speed (px, px/s)
const WGGS = { t: 0 };
const wgGeeseDir = () => { const s = wgSeason(); return s === 0 ? -1 : s === 2 ? 1 : 0; }; // north in spring, south in autumn
function wgGeeseList(x0, y0, x1, y1) { // the flocks' leaders over a stretch of the world: [x, y, how many, hash]
  const dir = wgGeeseDir(), out = []; if (!dir || !WGS.world) return out;
  const T = wgCloudT(), s = WGS.world.seed | 0;
  for (let L = Math.floor((x0 - 60) / WG_GEESE_LANE); L <= Math.floor((x1 + 60) / WG_GEESE_LANE); L++) {
    const h = hash(L, 7, s * 13 + 2029), lx = L * WG_GEESE_LANE + 60 + (h >>> 4) % (WG_GEESE_LANE - 120);
    const ph = ((T * WG_GEESE_V + (h >>> 8) % WG_GEESE_LOOP) % WG_GEESE_LOOP) * dir; // where this lane's flocks are, one LOOP apart
    for (let k = Math.floor((y0 - 60 - ph) / WG_GEESE_LOOP); k * WG_GEESE_LOOP + ph <= y1 + 60; k++) out.push([lx, ph + k * WG_GEESE_LOOP, 5 + (h >>> 20) % 5, h]);
  }
  return out;
}
const wgGeeseUp = () => !!WGS.world && WGS.dim === 'o' && wgOpt().amb && wgNight(WGS.clock) < 0.4;
(function () {
  WG_ACH.push(['geese', 'WILD GEESE', 'SEE GEESE FLY NORTH AND SOUTH', (c) => ((c.st.geese | 0) & 3) === 3]);
})();
// a flock right over the hero is noted (and told, the first time each way)
const _wgUpdGeese = updateWG;
updateWG = function (dt) {
  _wgUpdGeese(dt);
  const p = WGS.p; if (WGS.scr !== 'play' || !p || !wgGeeseUp()) return;
  WGGS.t -= dt; if (WGGS.t > 0) return; WGGS.t = 0.5;
  const dir = wgGeeseDir(); if (!dir || !wgGeeseList(p.x - 40, p.y - 160, p.x + 40, p.y + 40).some(([x, y]) => Math.abs(x - p.x) < 60 && y > p.y - 150 && y < p.y + 20)) return;
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }), bit = dir < 0 ? 1 : 2;
  if (!((st.geese | 0) & bit)) { st.geese = (st.geese | 0) | bit; wgToast(dir < 0 ? 'GEESE FLYING NORTH' : 'GEESE FLYING SOUTH', 2.5); }
};
const _wgAmbGeese = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbGeese(cx0, cy0);
  if (!wgGeeseUp()) return;
  const dir = wgGeeseDir(); if (!dir) return;
  const T = wgCloudT(), x0 = cx0 - SCR.ox, y0 = cy0 - SCR.oy;
  for (const [x, y, n, h] of wgGeeseList(x0, y0, x0 + SCR.w, y0 + SCR.h)) for (let i = 0; i < n; i++) {
    const r = (i + 1) >> 1, side = i & 1 ? -1 : 1, gh = hash(h & 0xffff, i, 3); // the leader, then two by two along the V
    const gx = Math.round(x + side * r * 9 + gh % 3 - 1 - cx0), gy = Math.round(y - dir * r * 6 + (gh >>> 3) % 3 - 1 - cy0);
    if (gx < -SCR.ox - 8 || gx > SCR.w - SCR.ox + 8 || gy < -SCR.oy - 8 || gy > SCR.h - SCR.oy + 52) continue;
    shadow(gx, gy + 46, 4); // far below on the ground
    ctx.drawImage(wgGooseArt(dir, Math.floor(T * 3 - r * 0.6) & 1), gx - 6, gy - 4);
  }
};
// a goose seen from above: a black head and neck, grey wings out or raised with their leading edges lit, a white tail patch
function wgGooseArt(dir, f) {
  const key = 'goose_' + dir + '_' + f; if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 13, 8, (g) => {
    if (dir > 0) { g.translate(0, 8); g.scale(1, -1); } // flying south: head down the screen
    wgPaint(g, 0, 0, f ? ['.............', '......x......', '......x......', '..mmmXlXmmm..', '.XX..XlX..XX.', '......d......', '.....xwx.....', '.............']
      : ['.............', '......x......', '...m..x..m...', '...XmmlmmX...', '....XXdXX....', '......d......', '.....xwx.....', '.............'],
      { x: 'x', w: 'w', X: 'X', m: 'm', l: 'l', d: 'd' });
  });
}
