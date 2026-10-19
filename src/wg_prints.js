'use strict';
// Wildgrove: footprints. Every step on snow, sand or mud leaves a little print, left foot and right, that fades away
// over WG_PRINT_T seconds; friends leave theirs on your screen too, from where their heroes walk. Nobody on a bike, in
// a boat or seated leaves any. They are each screen's own and are never saved; at most WG_PRINT_MAX lie about.
const WG_PRINT_T = 24, WG_PRINT_MAX = 180;
const WG_PRINT_G = { snow: 'd', sand: 'n', mud: 'u' }; // the ground and the colour its prints show in
const WGFP = { list: [], w: null, last: new Map() }; // prints: x, y, dim, time, colour, upright; last step seen per hero
function wgPrintStep(key, q, dim, walkT, still) {
  const n = Math.floor(walkT), was = WGFP.last.get(key); WGFP.last.set(key, n);
  if (still || was === undefined || was === n) return;
  const g = GROUND[wgGround(WGS.world, dim, Math.floor(q.x / 16), Math.floor((q.y - 2) / 16))], c = g && WG_PRINT_G[g.id]; if (!c) return;
  const up = q.face === 'u' || q.face === 'd', side = n & 1 ? 1 : -1;
  WGFP.list.push({ x: Math.round(q.x) - 1 + (up ? side * 2 : 0), y: Math.round(q.y) - 2 + (up ? 0 : side), d: dim, t: WGS.t, c, up });
  if (WGFP.list.length > WG_PRINT_MAX) WGFP.list.shift();
}
const _wgUpdPrint = updateWG;
updateWG = function (dt) {
  _wgUpdPrint(dt);
  const w = WGS.world, p = WGS.p; if (WGFP.w !== w) { WGFP.w = w; WGFP.list.length = 0; WGFP.last.clear(); }
  if (!w || !p || WGS.scr !== 'play') return;
  const L = WGFP.list; while (L.length && (WGS.t - L[0].t > WG_PRINT_T || L[0].t > WGS.t)) L.shift();
  wgPrintStep(-1, p, WGS.dim, p.walkT || 0, !p.moving || p.hidden || p.sit || (typeof wgBikeHeld === 'function' && wgBikeHeld()) || (typeof wgBoatHeld === 'function' && wgBoatHeld()));
  for (const q of WGS.remote || []) wgPrintStep(q.pid, q, q.dim, +q.walkT || 0, !q.moving || q.bike || q.boat || q.face === 'S');
};
// drawn on the ground, under everything that stands: the chunk upkeep runs right after the ground is painted
const _wgUpkeepPrint = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepPrint(w, dim, cx0c, cy0c, cx1c, cy1c);
  const L = WGFP.list; if (!L.length || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2, T = WGS.t;
  for (const f of L) {
    if (f.d !== dim) continue;
    const age = T - f.t, sx = f.x - cx0, sy = f.y - cy0; if (sx < -SCR.ox - 4 || sy < -SCR.oy - 4 || sx > SCR.w - SCR.ox || sy > SCR.h - SCR.oy) continue;
    ctx.globalAlpha = age < WG_PRINT_T * 0.6 ? 0.42 : age < WG_PRINT_T * 0.8 ? 0.27 : 0.13; // fading in three steps
    rect(sx, sy, 2, 2, f.c);
  }
  ctx.globalAlpha = 1;
};
