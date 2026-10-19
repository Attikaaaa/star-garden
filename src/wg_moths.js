'use strict';
// Wildgrove: moths at the lamps. On dry nights outdoors one to three pale moths flutter round each lamp in view
// (`WG_MOTH_LAMPS`), looping about its flame and now and then bumping into the glass. The lamps in view are looked over
// twice a second (`WGMO.lamps`); the moths move with this screen's clock and are drawn by a `wgDrawLight` wrapper over
// the dark, so they show pale against the night. Ambient life, each screen its own, off with the ambient life option.
const WG_MOTH_LAMPS = ['lamppost', 'lantern', 'torch', 'jacklantern', 'pearl_lamp', 'ice_lantern', 'light_post'];
const WGMO = { lamps: [], scanT: 0, w: null, t: 0 };
const wgMothNight = () => WGS.dim === 'o' && wgOpt().amb && wgNight(WGS.clock) > 0.35 && !WGS.weather; // moths are about
const _wgUpdMoth = updateWG;
updateWG = function (dt) {
  _wgUpdMoth(dt);
  const w = WGS.world, T = WGS.t, d = Math.min(0.1, Math.max(0, T - WGMO.t)); WGMO.t = T;
  if (!w || WGMO.w !== w || !wgMothNight()) { WGMO.w = w; WGMO.lamps.length = 0; WGMO.scanT = 0; return; }
  if ((WGMO.scanT -= d) > 0) return;
  WGMO.scanT = 0.5; const L = WGMO.lamps, cam = WGS.cam; L.length = 0;
  const x0 = Math.floor((cam.x - VW / 2 - SCR.ox) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y0 = Math.floor((cam.y - VH / 2 - SCR.oy) / 16) - 1, y1 = y0 + Math.ceil(SCR.h / 16) + 4;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const o = OBJ[wgObjAt(w, 'o', x, y)]; if (!o || !WG_MOTH_LAMPS.includes(o.id)) continue;
    const sp = WGA.obj[o.id] && WGA.obj[o.id][0], h = hash(x, y, 8821);
    L.push({ x: x * 16 + 8, y: y * 16 + (sp ? sp.oy + 4 : 0), n: 1 + h % 3, h });
  }
};
const _wgLightMoth = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  _wgLightMoth(cx0, cy0);
  if (!WGMO.lamps.length || !wgMothNight()) return;
  const T = WGS.t;
  for (const l of WGMO.lamps) for (let k = 0; k < l.n; k++) {
    const ph = ((l.h >>> (k * 5)) & 31) / 5, dir = (l.h >>> (k + 16)) & 1 ? 1 : -1, a = T * (1.5 + k * 0.45) * dir + ph;
    const r = 5 + 3.5 * Math.sin(T * 1.3 + ph * 2) + (Math.sin(T * 0.7 + ph) > 0.85 ? -4 : 0); // now and then a bump at the glass
    const x = Math.round(l.x + Math.cos(a) * r * 1.3 + Math.sin(T * 9 + ph) - cx0), y = Math.round(l.y + Math.sin(a) * r * 0.75 + Math.cos(T * 7 + ph) - cy0);
    if (Math.floor(T * 14 + ph * 3) % 2) { rect(x - 1, y, 3, 1, 'L'); rect(x, y, 1, 1, 'w'); } else rect(x, y - 1, 1, 2, 'L'); // wings open, wings up
  }
};
