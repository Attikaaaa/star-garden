'use strict';
// Wildgrove: bees at work. On dry days out of winter three bees go out from each beehive in view to the flowers within
// `WG_BEE_REACH` tiles of it, hover at one a while and come home, round and round (`WG_BEE_LOOP` s a trip, each bee a
// third of a trip after the last); with no flower near they loop about the hive. The hives and their flowers are
// looked over every second (`WGBE.hives`); each bee's trip and flower come from the hive, the trip and the bee alone
// (`wgBeeAt`), moving with this screen's clock, drawn small over a speck of shadow by a `wgDrawAmbient` wrapper.
// Ambient life, each screen its own, off with the ambient life option.
const WG_BEE_REACH = 5, WG_BEE_LOOP = 7.5;
const WGBE = { hives: [], scanT: 0, w: null, t: 0 };
const wgBeeDay = () => WGS.dim === 'o' && wgOpt().amb && wgNight(WGS.clock) < 0.3 && wgSeason() !== 3 && !(WGS.weather && WGS.weather.kind === 'rain');
const _wgUpdBee = updateWG;
updateWG = function (dt) {
  _wgUpdBee(dt);
  const w = WGS.world, T = WGS.t, d = Math.min(0.1, Math.max(0, T - WGBE.t)); WGBE.t = T;
  if (!w || WGBE.w !== w || !wgBeeDay()) { WGBE.w = w; WGBE.hives.length = 0; WGBE.scanT = 0; return; }
  if ((WGBE.scanT -= d) > 0) return;
  WGBE.scanT = 1; const H = WGBE.hives, cam = WGS.cam, R = WG_BEE_REACH; H.length = 0;
  const x0 = Math.floor((cam.x - VW / 2 - SCR.ox) / 16) - 3, x1 = x0 + Math.ceil(SCR.w / 16) + 6, y0 = Math.floor((cam.y - VH / 2 - SCR.oy) / 16) - 3, y1 = y0 + Math.ceil(SCR.h / 16) + 6;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const o = OBJ[wgObjAt(w, 'o', x, y)]; if (!o || o.id !== 'beehive') continue;
    const fl = [];
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const f = OBJ[wgObjAt(w, 'o', x + i, y + j)]; if (f && f.id.startsWith('flower_')) fl.push([(x + i) * 16 + 8, (y + j) * 16 + 9]); }
    H.push({ x: x * 16 + 8, y: y * 16 + 6, tx: x, ty: y, fl });
  }
};
function wgBeeAt(hv, b, T, out) { // where bee b of a hive is: x, y on the ground, z above it; false while it is in the hive
  const t = T / WG_BEE_LOOP + b / 3 + (hash(hv.tx, hv.ty, b) % 100) / 300, n = Math.floor(t), u = t - n;
  if (u > 0.93) return false;
  const ph = b * 2.1 + n;
  if (!hv.fl.length) { const a = T * 2.2 + ph; out.x = hv.x + Math.cos(a) * 14; out.y = hv.y + 8 + Math.sin(a) * 7; out.z = 9 + Math.sin(T * 5 + ph) * 2; return true; }
  const [fx, fy] = hv.fl[hash(hv.tx * 7 + b, hv.ty, n) % hv.fl.length];
  if (u < 0.3 || u > 0.65) { // out to the flower or home again, in a wavering line
    const k = u < 0.3 ? u / 0.3 : 1 - (u - 0.65) / 0.28, s = Math.sin(k * Math.PI);
    out.x = hv.x + (fx - hv.x) * k + Math.sin(T * 6 + ph) * 3 * s; out.y = hv.y + 6 + (fy - hv.y - 6) * k + Math.cos(T * 5 + ph) * 2 * s; out.z = 4 + 10 * s;
  } else { out.x = fx + Math.sin(T * 7 + ph) * 2; out.y = fy + Math.cos(T * 5 + ph); out.z = 5 + Math.sin(T * 9 + ph) * 1.5; } // hovering over it
  return true;
}
const WGBE_P = { x: 0, y: 0, z: 0 };
const _wgAmbBee = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbBee(cx0, cy0);
  if (!WGBE.hives.length || !wgBeeDay()) return;
  const T = WGS.t, P = WGBE_P;
  for (const hv of WGBE.hives) for (let b = 0; b < 3; b++) {
    if (!wgBeeAt(hv, b, T, P)) continue;
    const x = Math.round(P.x - cx0), y = Math.round(P.y - cy0), z = Math.round(P.z);
    shadow(x + 0.5, y, 3); // its speck of shadow
    rect(x - 1, y - z, 1, 1, 'Y'); rect(x, y - z, 1, 1, 'u'); rect(x + 1, y - z, 1, 1, 'Y'); // the striped body
    rect(x - (Math.floor(T * 30 + b) % 2), y - z - 1, 1, 1, 'w'); // the wings, a blur
  }
};
