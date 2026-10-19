'use strict';
// Wildgrove: seagulls. By day one or two gulls stand on the sand by the water in some `WG_GULL_CELL` px cells
// (`wgGullSpot`, from the cell and the seed, worked out once), strolling and pecking, slotted into the world's depth order
// by a `wgEntities` wrapper; a hero who comes within `WG_GULL_SHY` px sends one up with a cry, wheeling off over its
// shadow, and it comes back after `WG_GULL_BACK` seconds once nobody is close (`WGGL.fly`). Over open water a gull
// circles high, drawn by a `wgDrawAmbient` wrapper with its shadow on the waves. Ambient life, each screen its own.
const WG_GULL_CELL = 160, WG_GULL_SHY = 40, WG_GULL_BACK = 30, WG_GULL_UP = 3.5; // cell size; how near scares one; seconds away; seconds of the flight
const WGGL = { spots: new Map(), fly: new Map(), w: null, cry: 0 };
function wgGullSpot(gx, gy) { // a cell's gulls, or null: [x, y, how many, phase, over the sea]
  const S = WGGL.spots, w = WGS.world; if (WGGL.w !== w || S.size > 600) { S.clear(); WGGL.fly.clear(); WGGL.w = w; }
  const key = gx * 65536 + gy; if (S.has(key)) return S.get(key);
  const h = hash(gx, gy, 7717 + (w.seed | 0)), x = gx * WG_GULL_CELL + 32 + (h & 95), y = gy * WG_GULL_CELL + 32 + ((h >>> 7) & 95);
  const G = (a, b) => GROUND[wgGround(w, 'o', Math.floor(a / 16), Math.floor(b / 16))], wet = (a, b) => G(a, b).liq === 'water';
  let s = null;
  if (h % 3 === 0 && G(x, y).id === 'sand' && !wgObjAt(w, 'o', Math.floor(x / 16), Math.floor(y / 16))) { // on the sand within a couple of steps of the water
    for (let a = 0; a < 8 && !s; a++) if (wet(x + Math.cos(a * 0.785) * 28, y + Math.sin(a * 0.785) * 22)) s = [x, y, 1 + ((h >>> 14) & 1), (h >>> 16) % 628 / 100, false];
  } else if (h % 5 === 1 && G(x, y).id === 'deep') { let ok = true; for (let a = 0; a < 8 && ok; a++) ok = wet(x + Math.cos(a * 0.785) * 56, y + Math.sin(a * 0.785) * 40); if (ok) s = [x, y, 1, (h >>> 16) % 628 / 100, true]; }
  S.set(key, s); return s;
}
const wgGullOn = () => WGS.world && WGS.dim === 'o' && wgOpt().amb && wgNight(WGS.clock) < 0.3 && !(WGS.weather && WGS.weather.storm);
function wgGullsIn(x0, y0, x1, y1, fn) { // every shore gull in this box: fn(key, x, y, i, phase)
  const C = WG_GULL_CELL, T = WGS.t;
  for (let gy = Math.floor((y0 - 40) / C); gy <= Math.floor((y1 + 40) / C); gy++) for (let gx = Math.floor((x0 - 40) / C); gx <= Math.floor((x1 + 40) / C); gx++) {
    const s = wgGullSpot(gx, gy); if (!s || s[4]) continue;
    for (let i = 0; i < s[2]; i++) fn((gx * 65536 + gy) * 4 + i, Math.round(s[0] + i * 14 - (s[2] - 1) * 7 + Math.sin(T * 0.25 + s[3] + i * 2) * 8), s[1] + i * 3, i, s[3]);
  }
}
const _wgUpdGull = updateWG;
updateWG = function (dt) { // a hero close by sends a gull up; it comes back when nobody is near
  _wgUpdGull(dt);
  if (!wgGullOn() || WGS.scr !== 'play' || !WGS.p) return;
  const T = WGS.t, cx = WGS.cam.x, cy = WGS.cam.y, heroes = [WGS.p].concat((WGS.remote || []).filter(q => q.dim === WGS.dim));
  const near = (x, y, r) => heroes.some(q => Math.abs(q.x - x) < r && Math.abs(q.y - y) < r * 0.8);
  wgGullsIn(cx - VW / 2, cy - VH / 2, cx + VW / 2, cy + VH / 2, (k, x, y) => {
    const f = WGGL.fly.get(k);
    if (f) { if (T - f.t0 > WG_GULL_BACK && !near(x, y, WG_GULL_SHY * 1.6)) WGGL.fly.delete(k); return; }
    if (near(x, y, WG_GULL_SHY)) { WGGL.fly.set(k, { t0: T, d: WGS.p.x < x ? 1 : -1 }); if (T - WGGL.cry > 1.5) { WGGL.cry = T; wgSfx('gull'); } }
  });
};
const _wgEntsGull = wgEntities;
wgEntities = function (x0, y0, x1, y1) {
  const out = _wgEntsGull(x0, y0, x1, y1);
  if (wgGullOn()) wgGullsIn(x0, y0, x1, y1, (k, x, y, i, ph) => { if (!WGGL.fly.has(k)) out.push({ x, y, k, i, ph, draw: wgGullDraw }); });
  return out;
};
function wgGullDraw(e, cx0, cy0) { // standing: strolling one way or the other, now and then pecking at the sand
  const T = WGS.t, sx = e.x - cx0, sy = e.y - cy0, left = Math.cos(T * 0.25 + e.ph + e.i * 2) < 0, peck = Math.floor(T * 0.7 + e.i * 1.3 + e.ph) % 5 === 0;
  shadow(sx, sy, 6); const S = wgGullArt(peck ? 'peck' : 'stand', left); ctx.drawImage(S, sx - (S.width >> 1), sy - S.height + 1);
}
const _wgAmbGull = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) { // in the air: the ones sent up, and those circling over open water
  _wgAmbGull(cx0, cy0);
  if (!wgGullOn()) return;
  const T = WGS.t, fl = Math.floor(T * 4) % 2, C = WG_GULL_CELL;
  wgGullsIn(cx0, cy0, cx0 + SCR.w, cy0 + SCR.h, (k, x, y) => {
    const f = WGGL.fly.get(k); if (!f) return; const u = T - f.t0; if (u > WG_GULL_UP) return;
    const gx = Math.round(x + f.d * u * 46 - cx0), gy = Math.round(y - u * 10 - cy0), alt = Math.round(6 + u * 26);
    ctx.globalAlpha = u > WG_GULL_UP - 1 ? Math.max(0.25, Math.ceil((WG_GULL_UP - u) * 4) / 4) : 1;
    shadow(gx, gy, 5); const S = wgGullArt(fl ? 'fly1' : 'fly0', f.d < 0); ctx.drawImage(S, gx - (S.width >> 1), gy - alt);
    ctx.globalAlpha = 1;
  });
  for (let gy = Math.floor((cy0 - 80) / C); gy <= Math.floor((cy0 + SCR.h + 80) / C); gy++) for (let gx = Math.floor((cx0 - 80) / C); gx <= Math.floor((cx0 + SCR.w + 80) / C); gx++) {
    const s = wgGullSpot(gx, gy); if (!s || !s[4]) continue;
    const a = T * 0.35 + s[3], x = Math.round(s[0] + Math.cos(a) * 44 - cx0), y = Math.round(s[1] + Math.sin(a) * 26 - cy0);
    if (x < -30 || y < -60 || x > SCR.w + 30 || y > SCR.h + 30) continue;
    shadow(x, y, 5); const S = wgGullArt(Math.floor(T * 2 + s[3]) % 3 ? 'fly1' : 'fly0', Math.sin(a) > 0); ctx.drawImage(S, x - (S.width >> 1), y - 46);
  }
};
function wgGullArt(k, left) { // a white gull with grey wings, a yellow bill and orange legs, facing left (mirrored for right)
  const key = 'gull_' + k + (left ? 'l' : 'r'); if (WGA.cache[key]) return WGA.cache[key];
  if (!left) { const L = wgGullArt(k, true), [c, g] = wgCv(L.width, L.height); g.scale(-1, 1); g.drawImage(L, -L.width, 0); return (WGA.cache[key] = c); }
  const R = { stand: ['.ww.....', 'ywxw....', '..wwwmm.', '..wwwmml', '...LwmmL', '....LL..', '....O.O.'], peck: ['........', '........', '...wwmm.', '.wwwwmml', 'yxwwwmmL', '....LL..', '....O.O.'],
    fly0: ['d.......d', 'mm.....mm', '.mmwwwmm.', '..ywwwL..'], fly1: ['.........', 'mmmwwwmmm', 'd.ywwwL.d', '.........'] }[k];
  return wgMake(key, R[0].length + 2, R.length + 2, (g) => wgPaint(g, 1, 1, R, { w: 'w', L: 'L', m: 'm', l: 'l', d: 'd', y: 'y', x: 'x', O: 'O' }));
}
