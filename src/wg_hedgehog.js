'use strict';
// Wildgrove: hedgehogs. From dusk to dawn, out of winter and on dry nights, a hedgehog may live in a `WG_HOG_CELL` px
// cell, found from the cell and the seed (`wgHogSpot`: its home on grass-like ground with nothing solid on it, and how
// dark it must be before it comes out), so they come out one by one as night falls and are gone by morning. It trots
// about its home, stops to sniff, and curls into a prickly ball while a hero is close, uncurling a while after they
// go. Slotted into the world's depth order by a `wgEntities` wrapper. Ambient life: each screen its own, moving with
// the world's clock, off with the ambient life option. The first one that curls up for you lights HEDGEHOG HELLO.
const WG_HOG_CELL = 144, WG_HOG_GROUNDS = ['grass', 'moss', 'dirt', 'jungle'], WG_HOG_NEAR = 26;
const WGHH = { live: new Map(), spots: new Map(), w: null, t: 0, stamp: 0 };
(function () { WG_ACH.push(['hog', 'HEDGEHOG HELLO', 'MEET A HEDGEHOG ON A NIGHT WALK', (c) => c.st.hog]); })();
function wgHogFree(x, y) {
  const w = WGS.world, tx = Math.floor(x / 16), ty = Math.floor(y / 16), g = GROUND[wgGround(w, 'o', tx, ty)], o = OBJ[wgObjAt(w, 'o', tx, ty)];
  return WG_HOG_GROUNDS.includes(g.id) && !(o && o.solid !== 0);
}
function wgHogSpot(cx, cy) { // a cell's hedgehog, or null: its home and the darkness it comes out at
  const key = cx + ',' + cy, S = WGHH.spots; if (S.has(key)) return S.get(key);
  const w = WGS.world, h = hash(cx, cy, (w.seed | 0) * 41 + 7717); let s = null;
  if (h % 5 === 0) for (let k = 0; k < 4 && !s; k++) { // one cell in five, its home the first free spot of four
    const q = k ? hash(cx, cy, (w.seed | 0) * 41 + 7717 + k * 613) : h, x = cx * WG_HOG_CELL + 20 + (q >>> 4) % (WG_HOG_CELL - 40), y = cy * WG_HOG_CELL + 20 + (q >>> 12) % (WG_HOG_CELL - 40);
    if (wgHogFree(x, y)) s = { hx: x, hy: y, thr: 0.15 + ((h >>> 20) % 60) / 100 };
  }
  if (S.size > 400) S.clear(); S.set(key, s); return s;
}
const wgHogNight = () => wgSeason() !== 3 && !(WGS.weather && WGS.weather.kind === 'rain') ? wgNight(WGS.clock) : 0; // how dark, for a hedgehog
const _wgUpdHog = updateWG;
updateWG = function (dt) {
  _wgUpdHog(dt);
  const w = WGS.world, p = WGS.p, L = WGHH.live, T = WGS.t, d = Math.min(0.1, Math.max(0, T - WGHH.t)); WGHH.t = T;
  if (WGHH.w !== w) { WGHH.w = w; L.clear(); WGHH.spots.clear(); }
  if (!w || !p || WGS.dim !== 'o' || !wgOpt().amb) { L.clear(); return; }
  const k = wgHogNight(); if (k < 0.15 && !L.size) return;
  const C = WG_HOG_CELL, left = Math.round(WGS.cam.x) - VW / 2 - SCR.ox - 24, top = Math.round(WGS.cam.y) - VH / 2 - SCR.oy - 24, stamp = ++WGHH.stamp;
  for (let cy = Math.floor(top / C); cy <= Math.floor((top + SCR.h + 48) / C); cy++) for (let cx = Math.floor(left / C); cx <= Math.floor((left + SCR.w + 48) / C); cx++) {
    const key = cx + ',' + cy; let c = L.get(key);
    if (!c) {
      const s = wgHogSpot(cx, cy); if (!s || k <= s.thr) continue;
      c = { hx: s.hx, hy: s.hy, thr: s.thr, x: s.hx, y: s.hy, gx: s.hx, gy: s.hy, st: 'sniff', t0: T, wait: 1 + Math.random() * 2, born: T, gone: 0, flip: Math.random() < 0.5, shy: -9 };
      L.set(key, c);
    }
    c.stamp = stamp;
    if (k <= c.thr) { if (!c.gone) c.gone = T; } else c.gone = 0;
  }
  for (const [key, c] of L) { if (c.stamp !== stamp || (c.gone && T - c.gone > 0.6)) L.delete(key); else if (!c.gone) wgHogMove(c, T, d, p, w); }
};
function wgHogMove(c, T, d, p, w) {
  const dist = p.hidden ? 999 : Math.hypot(p.x - c.x, p.y - c.y);
  if (dist < WG_HOG_NEAR) { // into a ball, and stays so while the hero is about
    if (c.st !== 'ball') { c.st = 'ball'; c.t0 = T; wgPart(c.x, c.y - 4, 3, { c: ['N', 'O'], s: 10, up: 6, life: 0.3 }); const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.hog = 1; }
    c.shy = T; return;
  }
  if (c.st === 'ball') { if (dist > WG_HOG_NEAR + 14 && T - c.shy > 2.5) { c.st = 'sniff'; c.t0 = T; c.wait = 0.8; } else if (dist <= WG_HOG_NEAR + 14) c.shy = T; return; }
  if (c.st === 'sniff') {
    if (T - c.t0 < c.wait) return;
    for (let i = 0; i < 5; i++) { // a spot to trot to, about its home
      const a = Math.random() * 6.283, r = 6 + Math.random() * 22, x = c.hx + Math.cos(a) * r, y = c.hy + Math.sin(a) * r * 0.7;
      if (wgHogFree(x, y)) { c.gx = x; c.gy = y; c.st = 'trot'; c.t0 = T; return; }
    }
    c.t0 = T; return;
  }
  const dx = c.gx - c.x, dy = c.gy - c.y, l = Math.hypot(dx, dy), v = 15 * d; // trotting
  if (Math.abs(dx) > 0.5) c.flip = dx < 0;
  if (l <= v) { c.x = c.gx; c.y = c.gy; c.st = 'sniff'; c.t0 = T; c.wait = 1.2 + Math.random() * 2.6; }
  else { c.x += dx / l * v; c.y += dy / l * v; }
}
const _wgEntsHog = wgEntities;
wgEntities = function (x0, y0, x1, y1) {
  const out = _wgEntsHog(x0, y0, x1, y1);
  if (WGHH.live.size && WGS.dim === 'o') for (const c of WGHH.live.values()) if (c.x > x0 - 16 && c.x < x1 + 16 && c.y > y0 - 16 && c.y < y1 + 16) out.push({ x: c.x, y: c.y, c, draw: wgHogDraw });
  return out;
};
function wgHogDraw(e, cx0, cy0) {
  const c = e.c, T = WGS.t, sx = Math.round(c.x - cx0), sy = Math.round(c.y - cy0);
  const a = Math.min(1, (T - c.born) / 0.6) * (c.gone ? Math.max(0, 1 - (T - c.gone) / 0.6) : 1); if (a <= 0) return;
  ctx.globalAlpha = a; shadow(sx, sy, 5);
  if (c.st === 'ball') { const u = T - c.t0, j = u < 0.25 ? Math.round(Math.sin(u * 40)) : 0; ctx.drawImage(wgHogArt('ball'), sx - 5 + j, sy - 9); }
  else {
    const f = c.st === 'trot' ? (Math.floor(T * 8) % 2 ? 'walk1' : 'walk0') : Math.floor((T - c.t0) * 5) % 4 === 1 ? 'sniff' : 'walk0';
    ctx.drawImage(wgHogArt(f + (c.flip ? '_l' : '')), sx - 7, sy - 8);
  }
  ctx.globalAlpha = 1;
}
const WG_HOG_ART = { // facing right; u the spines, N their tips, A the face and belly, 0 an eye and the nose
  walk0: ['...N.N.N....', '..NuNuNuN...', '.NuNuuNuuA..', 'NuuNuuNuAA0.', 'uuuuuuuuAAA0', '.uuuuuuuAA..', '..n..n.n.n..'],
  walk1: ['...N.N.N....', '..NuNuNuN...', '.NuNuuNuuA..', 'NuuNuuNuAA0.', 'uuuuuuuuAAA0', '.uuuuuuuAA..', '...n.n..n.n.'],
  sniff: ['...N.N.N....', '..NuNuNuN...', '.NuNuuNuuA..', 'NuuNuuNuAA0.', 'uuuuuuuuAAA.', '.uuuuuuuAAA0', '..n..n.n.n..'],
  ball: ['..N.N.N..', '.NuNuNuN.', 'NuuNuNuuN', 'uuNuuuNuu', 'uuuuuuuuu', '.uuuuuuu.', '..uuuuu..'],
};
function wgHogArt(k) {
  const key = 'hog_' + k; if (WGA.cache[key]) return WGA.cache[key];
  const flip = k.endsWith('_l'), rows = WG_HOG_ART[flip ? k.slice(0, -2) : k], map = { u: 'u', N: 'N', A: 'A', 0: '0', n: 'n' };
  return wgMake(key, rows[0].length + 2, rows.length + 2, (g, w) => { if (flip) { g.translate(w, 0); g.scale(-1, 1); } wgPaint(g, 1, 1, rows, map); });
}
