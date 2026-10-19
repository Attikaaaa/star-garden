'use strict';
// Wildgrove: little touches. Rain dimples the water: while it rains outdoors, rings spread on the water in view
// (`WGDT.rings`, about `WG_RING_RATE` a second, each `WG_RING_T` s), drawn flat through a `wgChunkUpkeep` wrapper,
// none with the weather effects off. A hot drink in hand steams (`WG_HOT`: the teas, cider and cocoa), two wisps
// rising from the cup over your hero (a `wgDrawPlayer` wrapper). Walking through tall grass, ferns, reeds or wild
// wheat (`WG_RUSTLE`) rustles it: a few green bits and a soft sound, every `WG_RUSTLE_GAP` s at most, your hero only,
// the bits none with the particles off.
const WG_RING_RATE = 14, WG_RING_T = 0.7, WG_RUSTLE_GAP = 0.28;
const WG_RUSTLE = ['tallgrass', 'fern', 'reeds', 'wild_wheat', 'beachgrass'];
const WGDT = { rings: [], acc: 0, rustle: 0, x: 0, y: 0 };
const wgHotHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!s && (WG_TEA.includes(s.id) || s.id === 'hot_cider' || s.id === 'hot_cocoa'); };
const _wgUpdDetails = updateWG;
updateWG = function (dt) {
  _wgUpdDetails(dt);
  const w = WGS.world, p = WGS.p, T = WGS.t, R = WGDT.rings;
  while (R.length && (T - R[0].t > WG_RING_T || R[0].t > T)) R.shift();
  if (!w || !p || WGS.scr !== 'play') return;
  if (WGS.dim === 'o' && wgOpt().wx && WGS.weather && WGS.weather.kind === 'rain') { // new rings where the drops land on water
    WGDT.acc += dt * WG_RING_RATE;
    for (; WGDT.acc >= 1; WGDT.acc--) for (let k = 0; k < 6; k++) {
      const x = WGS.cam.x - SCR.w / 2 + Math.random() * SCR.w, y = WGS.cam.y - SCR.h / 2 + Math.random() * SCR.h;
      if (GROUND[wgGround(w, 'o', Math.floor(x / 16), Math.floor(y / 16))].liq === 'water' && !wgObjAt(w, 'o', Math.floor(x / 16), Math.floor(y / 16))) { R.push({ x: Math.round(x), y: Math.round(y), t: T }); break; }
    }
    if (R.length > 60) R.splice(0, R.length - 60);
  } else WGDT.acc = 0;
  const moved = Math.hypot(p.x - WGDT.x, p.y - WGDT.y) > 0.3; WGDT.x = p.x; WGDT.y = p.y;
  if (!moved || p.hidden || T - WGDT.rustle < WG_RUSTLE_GAP && T >= WGDT.rustle) return;
  const o = OBJ[wgObjAt(w, WGS.dim, Math.floor(p.x / 16), Math.floor((p.y - 2) / 16))]; if (!o || !WG_RUSTLE.includes(o.id)) return;
  WGDT.rustle = T; wgSfx('rustle');
  if (wgOpt().part) wgPart(p.x, p.y - 4, 2, { c: o.id === 'wild_wheat' ? ['y', 'O'] : ['G', 'h'], s: 14, up: 12, life: 0.45 });
};
const _wgUpkeepRings = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepRings(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world || !WGDT.rings.length) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2, T = WGS.t;
  for (const q of WGDT.rings) { // a ring spreading and fading: a dot, then a widening oval of eight
    const u = (T - q.t) / WG_RING_T, x = q.x - cx0, y = q.y - cy0; ctx.globalAlpha = 0.7 * (1 - u);
    if (u < 0.2) rect(x, y, 1, 1, 'w');
    else { const r = 1 + Math.round(u * 3), ry = Math.max(1, Math.round(r * 0.6)); rect(x - r, y, 1, 1, 'C'); rect(x + r, y, 1, 1, 'C'); rect(x, y - ry, 1, 1, 'C'); rect(x, y + ry, 1, 1, 'C'); if (r > 2) { rect(x - r + 1, y - ry + 1, 1, 1, 'C'); rect(x + r - 1, y - ry + 1, 1, 1, 'C'); rect(x - r + 1, y + ry - 1, 1, 1, 'C'); rect(x + r - 1, y + ry - 1, 1, 1, 'C'); } }
  }
  ctx.globalAlpha = 1;
};
// a hot drink in hand: two wisps of steam curling up from the cup (held as wgDrawPlayer draws it)
const _wgDrawPlayerSteam = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  _wgDrawPlayerSteam(e, cx0, cy0);
  const p = e.p; if (p !== WGS.p || p.hidden || p.sit || !wgHotHeld()) return;
  if (GROUND[wgGround(WGS.world, WGS.dim, Math.floor(p.x / 16), Math.floor(p.y / 16))].liq) return;
  const sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0), side = p.face === 'l' ? -1 : 1, T = WGS.t;
  const hx = p.face === 'u' ? sx + 6 : p.face === 'd' ? sx - 8 : sx + side * 7 - 8, hy = sy - 18 + (p.face === 'u' ? -2 : 0);
  for (let k = 0; k < 2; k++) {
    const u = (T * 0.7 + k * 0.5) % 1, x = hx + 5 + k * 3 + Math.round(Math.sin(u * 6 + k * 2) * 1.2), y = hy + 1 - Math.round(u * 8);
    ctx.globalAlpha = 0.65 * (1 - u); rect(x, y, 1, 1, 'L'); if (u < 0.5) rect(x, y + 1, 1, 1, 'L');
  }
  ctx.globalAlpha = 1;
};
