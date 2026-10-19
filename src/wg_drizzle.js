'use strict';
// Wildgrove: rainy-day critters. While it rains, and a little while after, little frogs and snails come out on the
// grass outdoors: one may live in a `WG_DZ_CELL` px cell, found from the cell and the seed (`wgDrizSpot`: its kind, its
// home on grass-like ground with nothing solid on it, and the wetness at which it comes out), so they appear one by
// one as `WGDZ.k` rises with the rain and slip away again as it dries. A frog sits, hops about its home now and then,
// hops off from a hero who comes close and croaks now and again; a snail creeps about its home, leaving a faint shiny
// trail, and keeps to its shell while a hero is near. They are slotted into the world's depth order by a `wgEntities`
// wrapper. Ambient life: each screen its own, moving with the world's clock, off with the ambient life option.
const WG_DZ_CELL = 112, WG_DZ_GROUNDS = ['grass', 'jungle', 'moss', 'mud'];
const WGDZ = { k: 0, live: new Map(), spots: new Map(), w: null, t: 0, croak: 0, stamp: 0 }; // wetness 0..1; critters in view; spots by cell
function wgDrizFree(x, y) { // grass-like ground with nothing solid on it
  const w = WGS.world, tx = Math.floor(x / 16), ty = Math.floor(y / 16), g = GROUND[wgGround(w, 'o', tx, ty)], o = OBJ[wgObjAt(w, 'o', tx, ty)];
  return WG_DZ_GROUNDS.includes(g.id) && !(o && o.solid !== 0);
}
function wgDrizSpot(cx, cy) { // a cell's critter, or null: its kind, its home and the wetness it comes out at
  const key = cx + ',' + cy, S = WGDZ.spots; if (S.has(key)) return S.get(key);
  const w = WGS.world, h = hash(cx, cy, (w.seed | 0) * 31 + 5501), r = h % 12; let s = null;
  if (r < 3) for (let k = 0; k < 4 && !s; k++) { // a critter in about one cell in four, two frogs to a snail, its home the first free spot of four
    const q = k ? hash(cx, cy, (w.seed | 0) * 31 + 5501 + k * 977) : h, x = cx * WG_DZ_CELL + 16 + (q >>> 4) % (WG_DZ_CELL - 32), y = cy * WG_DZ_CELL + 16 + (q >>> 12) % (WG_DZ_CELL - 32);
    if (wgDrizFree(x, y)) s = { kind: r === 2 ? 'snail' : 'frog', hx: x, hy: y, thr: 0.12 + ((h >>> 20) % 72) / 100 };
  }
  if (S.size > 400) S.clear(); S.set(key, s); return s;
}
const _wgUpdDriz = updateWG;
updateWG = function (dt) {
  _wgUpdDriz(dt);
  const w = WGS.world, p = WGS.p, L = WGDZ.live, T = WGS.t, d = Math.min(0.1, Math.max(0, T - WGDZ.t)); WGDZ.t = T; // the world's clock: nothing moves while it stands still
  if (WGDZ.w !== w) { WGDZ.w = w; WGDZ.k = 0; L.clear(); WGDZ.spots.clear(); }
  if (!w || !p || WGS.dim !== 'o' || !wgOpt().amb) { WGDZ.k = 0; L.clear(); return; }
  WGDZ.k = wgClamp(WGDZ.k + (WGS.weather && WGS.weather.kind === 'rain' ? d / 8 : -d / 40), 0, 1);
  if (!WGDZ.k && !L.size) return;
  const C = WG_DZ_CELL, left = Math.round(WGS.cam.x) - VW / 2 - SCR.ox - 24, top = Math.round(WGS.cam.y) - VH / 2 - SCR.oy - 24, stamp = ++WGDZ.stamp;
  for (let cy = Math.floor(top / C); cy <= Math.floor((top + SCR.h + 48) / C); cy++) for (let cx = Math.floor(left / C); cx <= Math.floor((left + SCR.w + 48) / C); cx++) {
    const key = cx + ',' + cy; let c = L.get(key);
    if (!c) {
      const s = wgDrizSpot(cx, cy); if (!s || WGDZ.k <= s.thr) continue;
      c = { kind: s.kind, hx: s.hx, hy: s.hy, thr: s.thr, x: s.hx, y: s.hy, born: T, gone: 0, next: T + 0.5 + Math.random() * 2, t0: -9, fx: 0, fy: 0, tx: 0, ty: 0, flip: Math.random() < 0.5, dir: Math.random() * 6.283, trail: [], tt: T, puff: -9, shy: -9 };
      L.set(key, c);
    }
    c.stamp = stamp;
    if (WGDZ.k <= c.thr) { if (!c.gone) c.gone = T; } else c.gone = 0; // slipping away as it dries, or back before it was gone
  }
  for (const [key, c] of L) { if (c.stamp !== stamp || (c.gone && T - c.gone > 0.6)) L.delete(key); else if (!c.gone) wgDrizMove(c, T, d, p); }
};
function wgDrizMove(c, T, d, p) {
  const near = !p.hidden && Math.hypot(p.x - c.x, p.y - c.y) < (c.kind === 'frog' ? 26 : 22);
  if (c.kind === 'frog') {
    if (c.t0 >= 0) { // in the air
      const u = (T - c.t0) / 0.3; if (u < 1) { c.x = c.fx + (c.tx - c.fx) * u; c.y = c.fy + (c.ty - c.fy) * u; return; }
      c.x = c.tx; c.y = c.ty; c.t0 = -9;
    }
    if (T < c.next && !near) { // sitting; a croak now and then, never two at once
      if (WGDZ.k > 0.5 && T > WGDZ.croak && Math.random() < d * 0.04 && Math.hypot(p.x - c.x, p.y - c.y) < 150) { WGDZ.croak = T + 7; c.puff = T; wgSfx('croak'); }
      return;
    }
    let a, r;
    if (near) { a = Math.atan2(c.y - p.y, c.x - p.x) + (Math.random() - 0.5) * 0.8; r = 14; } // away from the hero
    else if (Math.hypot(c.x - c.hx, c.y - c.hy) > 18) { a = Math.atan2(c.hy - c.y, c.hx - c.x); r = 10; } // back toward home
    else { a = Math.random() * 6.283; r = 7 + Math.random() * 6; }
    const tx = c.x + Math.cos(a) * r, ty = c.y + Math.sin(a) * r * 0.8;
    c.next = T + (near ? 0.35 : 1.6 + Math.random() * 3);
    if (!wgDrizFree(tx, ty)) return;
    c.fx = c.x; c.fy = c.y; c.tx = tx; c.ty = ty; c.t0 = T; if (Math.abs(tx - c.x) > 1) c.flip = tx < c.x;
  } else { // a snail: into its shell while a hero is near, and a while after
    if (near) { c.shy = T; return; }
    if (T - c.shy < 2.5) return;
    c.dir += (Math.random() - 0.5) * d * 1.5;
    if (Math.hypot(c.x - c.hx, c.y - c.hy) > 14) c.dir += Math.sin(Math.atan2(c.hy - c.y, c.hx - c.x) - c.dir) * d * 2;
    const nx = c.x + Math.cos(c.dir) * 2.4 * d, ny = c.y + Math.sin(c.dir) * 1.7 * d;
    if (!wgDrizFree(nx, ny)) { c.dir += Math.PI; return; }
    c.x = nx; c.y = ny; if (Math.abs(Math.cos(c.dir)) > 0.2) c.flip = Math.cos(c.dir) < 0;
    if (T - c.tt > 0.7) { c.tt = T; c.trail.push(Math.round(c.x), Math.round(c.y)); if (c.trail.length > 12) c.trail.splice(0, 2); }
  }
}
// drawing, in the world's depth order
const _wgEntsDriz = wgEntities;
wgEntities = function (x0, y0, x1, y1) {
  const out = _wgEntsDriz(x0, y0, x1, y1);
  if (WGDZ.live.size && WGS.dim === 'o') for (const c of WGDZ.live.values()) if (c.x > x0 - 16 && c.x < x1 + 16 && c.y > y0 - 16 && c.y < y1 + 16) out.push({ x: c.x, y: c.y, c, draw: wgDrizDraw });
  return out;
};
function wgDrizDraw(e, cx0, cy0) {
  const c = e.c, T = WGS.t, sx = Math.round(c.x - cx0), sy = Math.round(c.y - cy0);
  const a = Math.min(1, (T - c.born) / 0.6) * (c.gone ? Math.max(0, 1 - (T - c.gone) / 0.6) : 1); if (a <= 0) return;
  if (c.kind === 'frog') {
    const u = c.t0 >= 0 ? (T - c.t0) / 0.3 : -1, z = u >= 0 ? Math.round(Math.sin(Math.min(1, u) * Math.PI) * 5) : 0;
    ctx.globalAlpha = a; shadow(sx, sy, 4);
    ctx.drawImage(wgDrizArt(u >= 0 ? 'frog1' : 'frog0'), sx - 5, sy - 7 - z);
    if (T - c.puff < 0.45) { rect(sx - 1, sy - 3 - z, 3, 2, 'H'); rect(sx - 1, sy - 3 - z, 1, 1, 'Y'); } // a puffed-out throat
  } else {
    for (let i = 0; i < c.trail.length; i += 2) { ctx.globalAlpha = a * 0.5 * (i + 2) / c.trail.length; rect(c.trail[i] - cx0, c.trail[i + 1] - cy0, 1, 1, 'C'); }
    ctx.globalAlpha = a; shadow(sx, sy, 3);
    ctx.drawImage(wgDrizArt((T - c.shy < 2.5 ? 'shell' : 'snail') + (c.flip ? '_l' : '')), sx - 5, sy - 6);
  }
  ctx.globalAlpha = 1;
}
const WG_DZ_ART = { // little critters lit from the top left; a frog seen from the front, a snail side on (facing right)
  frog0: ['.hG...hG.', 'hw0GGGw0g', 'GhhGGGGGg', 'GhGHHHGgg', '.gGGGGGg.', 'gg.....gg'],
  frog1: ['.hG...hG.', 'hw0GGGw0g', 'GhhGGGGGg', 'GhGHHHGgg', 'ggGGGGGgg', 'g.......g'],
  snail: ['.nnnn...e.', 'nNOONn..ae', 'nOnnNn.aa.', 'nNNnNnaaa.', '.eaaaaaae.'],
  shell: ['.nnnn.....', 'nNOONn....', 'nOnnNn....', 'nNNnNn....', '.eaaae....'],
};
function wgDrizArt(k) {
  const key = 'driz_' + k; if (WGA.cache[key]) return WGA.cache[key];
  const flip = k.endsWith('_l'), rows = WG_DZ_ART[flip ? k.slice(0, -2) : k], map = {}; for (const ch of 'nNOae0w') map[ch] = ch;
  if (k.startsWith('frog')) Object.assign(map, { g: 'G', G: 'h', h: 'H', H: 'Y' }); // a tree frog, a shade lighter than the grass it sits on
  return wgMake(key, rows[0].length + 2, rows.length + 2, (g, w) => { if (flip) { g.translate(w, 0); g.scale(-1, 1); } wgPaint(g, 1, 1, rows, map); });
}
