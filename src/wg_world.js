'use strict';
// Wildgrove: noise, world generation and the chunk store. The world is endless and made
// from the seed alone, so only chunks the player changed are ever saved. Generation uses
// integer hashing and + - * / only (no sin or pow), so every machine makes the same world.
const WGW = {
  n: (s, x, y) => { // value noise in -1..1
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const v = (a, b) => (hash(a, b, s) >>> 8) / 8388608 - 1;
    const a = v(x0, y0), b = v(x0 + 1, y0), c = v(x0, y0 + 1), d = v(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  },
  f: (s, x, y, oct) => { // fractal, roughly -1..1
    let a = 0, amp = 1, tot = 0;
    for (let i = 0; i < oct; i++) { a += WGW.n(s + i * 977, x, y) * amp; tot += amp; x *= 2; y *= 2; amp *= 0.5; }
    return a / tot;
  },
  r: (x, y, s) => hash(x, y, s) / 4294967296, // 0..1
};
const WG_SPAWN = [0, 0];

// What the surface is at a world tile: { b: biome id, g: ground index, e, m, t }
function wgSurface(seed, x, y) {
  const x0 = x, y0 = y; // domain warp: biome borders wander instead of running straight
  x = x0 + WGW.n(seed + 30, x0 / 11, y0 / 11) * 7 + WGW.n(seed + 31, x0 / 4, y0 / 4) * 1.5; y = y0 + WGW.n(seed + 32, x0 / 11, y0 / 11) * 7 + WGW.n(seed + 34, x0 / 4, y0 / 4) * 1.5;
  let e = WGW.f(seed + 1, x / 120, y / 120, 4) * 1.15 + WGW.f(seed + 5, x / 380, y / 380, 2) * 0.35;
  let t = WGW.f(seed + 2, x / 260, y / 260, 3) * 1.25, m = WGW.f(seed + 3, x / 190, y / 190, 3) * 1.2;
  const d = Math.sqrt(x0 * x0 + y0 * y0);
  if (d < 46) { const k = 1 - d / 46; e = e + (0.18 - e) * k; t = t + (0 - t) * k; m = m + (0.1 - m) * k; }
  // rivers: thin bands where a second noise crosses zero
  const rv = WGW.f(seed + 7, x / 150, y / 150, 3);
  let b;
  if (e < -0.34) b = 'ocean';
  else if (e < -0.2) b = 'ocean';
  else if (e < -0.1) b = 'beach';
  else if (e > 0.62) b = t < -0.2 ? 'highland' : 'mountain';
  else if (e > 0.5 && t > 0.45 && WGW.f(seed + 9, x / 70, y / 70, 2) > 0.1) b = 'volcano';
  else if (t < -0.32) b = 'snow';
  else if (t > 0.42 && m < -0.1) b = 'desert';
  else if (t > 0.38 && m > 0.12) b = 'jungle';
  else if (m > 0.42) b = 'swamp';
  else if (m > 0.02) b = 'forest';
  else b = 'meadow';
  let g = b === 'ocean' ? (e < -0.34 ? 'deep' : 'shallow') : BIOMES[b].ground;
  const river = Math.abs(rv) < 0.018 && e > -0.08 && b !== 'mountain' && b !== 'highland' && b !== 'volcano' && d > 14;
  if (river) { g = 'shallow'; b = b === 'desert' ? 'desert' : b; }
  if (b === 'volcano' && e > 0.58 && WGW.f(seed + 11, x / 22, y / 22, 2) > 0.25) g = 'lava';
  if (b === 'beach' && t < -0.3) g = 'snow';
  if (b === 'mountain' && t < -0.1 && e > 0.72) g = 'snow';
  if (b === 'highland') g = e > 0.8 ? 'snow' : 'rock';
  if (b === 'snow' && e < -0.04) g = 'ice';
  if (b === 'meadow' && WGW.f(seed + 13, x / 12, y / 12, 2) > 0.62) g = 'dirt';
  return { b, g: G_ID[g], e, m, t, river, gid: g };
}

// Where the cave stairs of a 56x56 region are (or null)
function wgStairPoint(seed, rx, ry) {
  if (hash(rx, ry, seed + 31) % 100 > 70) return null;
  return [rx * 56 + 6 + hash(rx, ry, seed + 32) % 44, ry * 56 + 6 + hash(rx, ry, seed + 33) % 44];
}
// Structures of 64x64 regions: kind + origin
const WG_STRUCTS = ['ruin', 'camp', 'shrine', 'well', 'grave', 'cottage', 'farm', 'tower', 'cottage', 'farm', 'camp', 'pond'];
function wgStructPoint(seed, rx, ry) {
  const h = hash(rx, ry, seed + 41);
  if (h % 100 > 62) return null;
  if (rx === 0 && ry === 0) return null;
  return { k: WG_STRUCTS[(h >>> 7) % WG_STRUCTS.length], x: rx * 64 + 8 + (h >>> 11) % 40, y: ry * 64 + 8 + (h >>> 17) % 40, h };
}

// ---------- Chunk ----------
function wgNewChunk(cx, cy, dim) {
  const n = WG.CS * WG.CS;
  return { cx, cy, dim, g: new Uint8Array(n), o: new Uint16Array(n), m: new Uint8Array(n), cont: new Map(), mod: false, art: null, artDirty: true, light: null };
}
function wgPickVeg(list, h) {
  let tot = 0; for (const v of list) tot += v[1];
  let r = (h % 100000) / 100000 * tot;
  for (const v of list) { r -= v[1]; if (r <= 0) return v[0]; }
  return list[0][0];
}
function wgGenOver(seed, ch) {
  const CS = WG.CS, X0 = ch.cx * CS, Y0 = ch.cy * CS;
  for (let j = 0; j < CS; j++) for (let i = 0; i < CS; i++) {
    const x = X0 + i, y = Y0 + j, k = j * CS + i, s = wgSurface(seed, x, y);
    ch.g[k] = s.g;
    const gr = GROUND[s.g], B = BIOMES[s.b];
    if (gr.liq) {
      if (s.g === G_ID.shallow && (s.b === 'swamp' || s.b === 'beach' || s.b === 'ocean') && hash(x, y, seed + 19) % 100 < 9 && !s.river) ch.o[k] = O_ID.lilypad;
      continue;
    }
    if (!B || !B.veg) continue;
    if (x * x + y * y < 20) continue;
    // stone ridges and mesas: natural cliff walls with open passes between them
    const rb = s.b === 'mountain' || s.b === 'highland' ? 0.3 : s.b === 'desert' ? 0.52 : s.b === 'volcano' ? 0.4 : s.b === 'snow' ? 0.62 : 9;
    if (rb < 9 && WGW.f(seed + 14, x / 10, y / 10, 2) > rb && !s.river) { ch.o[k] = O_ID[s.b === 'desert' ? 'cliff_sand' : s.b === 'highland' || s.b === 'snow' ? 'cliff_ice' : s.b === 'volcano' ? 'cliff_ash' : 'cliff_hi']; continue; }
    const f = (WGW.f(seed + 21, x / 16, y / 16, 2) + 1) / 2, dens = B.dens * (0.35 + 1.5 * f * f);
    if (WGW.r(x, y, seed + 22) < dens) ch.o[k] = O_ID[wgPickVeg(B.veg, hash(x, y, seed + 23))];
    // a berry bush or tree that is not in its home ground is swapped for grass
    if (s.g === G_ID.snow && ch.o[k] && OBJ[ch.o[k]].id === 'oak') ch.o[k] = O_ID.snowpine;
  }
  // cave stairs
  for (let ry = Math.floor((Y0 - 4) / 56); ry <= Math.floor((Y0 + CS + 4) / 56); ry++) for (let rx = Math.floor((X0 - 4) / 56); rx <= Math.floor((X0 + CS + 4) / 56); rx++) {
    const p = wgStairPoint(seed, rx, ry);
    if (!p) continue;
    const s = wgSurface(seed, p[0], p[1]);
    if (GROUND[s.g].liq) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const lx = p[0] + dx - X0, ly = p[1] + dy - Y0;
      if (lx < 0 || ly < 0 || lx >= CS || ly >= CS) continue;
      const k = ly * CS + lx;
      if (GROUND[ch.g[k]].liq) ch.g[k] = G_ID.rock;
      ch.o[k] = dx === 0 && dy === 0 ? O_ID.stairs_down : 0;
      if (Math.abs(dx) === 2 || Math.abs(dy) === 2) { if (hash(lx, ly, seed + 51) % 3 === 0) ch.o[k] = O_ID.pebbles; }
      else if (dx || dy) ch.g[k] = G_ID.rock;
    }
  }
  wgStamp(seed, ch);
}
// structure stamping: a tiny scripted layout per kind. (lx, ly) are tiles inside the footprint.
function wgStructTiles(st, seed) {
  const out = []; // [dx, dy, ground|null, obj|null]
  const R = (a, b) => hash(a, b, st.h);
  const put = (dx, dy, g, o) => out.push([dx, dy, g, o]);
  if (st.k === 'ruin') {
    for (let dx = 0; dx < 9; dx++) for (let dy = 0; dy < 7; dy++) {
      const edge = dx === 0 || dx === 8 || dy === 0 || dy === 6;
      put(dx, dy, 'f_stone', edge && R(dx, dy) % 100 < 62 && !(dx === 4 && dy === 6) ? (R(dx, dy + 9) % 4 === 0 ? 'ruin_pillar' : 'w_stone') : null);
    }
    put(4, 3, 'f_stone', 'ruin_chest'); put(2, 2, null, 'bones'); put(6, 4, null, 'cobweb');
  } else if (st.k === 'camp') {
    put(2, 2, 'dirt', 'campfire'); put(0, 1, 'dirt', 'bed'); put(4, 1, 'dirt', 'chest'); put(4, 3, 'dirt', 'barrel'); put(0, 3, 'dirt', 'sign');
    for (const [dx, dy] of [[1, 1], [3, 1], [1, 3], [3, 3], [2, 1], [2, 3], [1, 2], [3, 2]]) put(dx, dy, 'dirt', null);
  } else if (st.k === 'shrine') {
    for (let dx = 0; dx < 5; dx++) for (let dy = 0; dy < 5; dy++) put(dx, dy, 'f_stone', (dx === 2 && dy === 2) ? 'altar' : ((dx === 0 || dx === 4) && (dy === 0 || dy === 4) ? 'ruin_pillar' : null));
  } else if (st.k === 'well') {
    for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) put(dx, dy, 'path', dx === 1 && dy === 1 ? 'well' : null);
  } else if (st.k === 'cottage') { // a little wooden house: bed, table, chest, light, a garden fence out front
    for (let dx = -1; dx < 8; dx++) for (let dy = -1; dy < 7; dy++) if (dx < 0 || dx > 6 || dy > 5) put(dx, dy, 'path', null);
    for (let dx = 0; dx < 7; dx++) for (let dy = 0; dy < 6; dy++) {
      const edge = dx === 0 || dx === 6 || dy === 0 || dy === 5, win = (dx === 0 || dx === 6) && dy === 2 || dy === 0 && dx === 3;
      put(dx, dy, 'f_wood', edge ? (dx === 3 && dy === 5 ? 'door' : win ? 'w_glass' : 'w_wood') : null);
    }
    put(1, 1, 'f_wood', 'bed'); put(5, 1, 'f_wood', 'chest'); put(3, 2, 'f_red', 'table'); put(2, 2, 'f_red', null); put(4, 2, 'f_red', 'chair'); put(5, 4, 'f_wood', 'lantern'); put(1, 4, 'f_wood', 'bookshelf'); put(3, 3, 'f_red', null);
    for (const dx of [-1, 0, 1, 5, 6, 7]) put(dx, 6, 'path', 'fence'); put(8, 3, 'path', 'sign');
  } else if (st.k === 'farm') { // a fenced field with rows of crops and a scarecrow
    for (let dx = 0; dx < 8; dx++) for (let dy = 0; dy < 6; dy++) {
      const edge = dx === 0 || dx === 7 || dy === 0 || dy === 5;
      if (edge) put(dx, dy, 'dirt', dx === 3 && dy === 5 ? null : 'fence');
      else put(dx, dy, 'tilled', dy === 2 && dx === 3 ? 'scarecrow' : ['crop_wheat', 'crop_carrot', 'crop_potato', 'crop_pumpkin'][(dx + dy * 2) % 4]);
    }
    put(8, 3, 'dirt', 'barrel');
  } else if (st.k === 'tower') { // a broken watchtower with a chest inside
    for (let dx = 0; dx < 5; dx++) for (let dy = 0; dy < 5; dy++) {
      const edge = dx === 0 || dx === 4 || dy === 0 || dy === 4, gap = dx === 2 && dy === 4 || (dx === 4 && dy === 1 && R(1, 1) % 2);
      put(dx, dy, 'f_stone', edge && !gap ? (R(dx, dy) % 5 === 0 ? 'ruin_pillar' : 'w_stone') : null);
    }
    put(2, 2, 'f_stone', 'ruin_chest'); put(1, 1, null, 'torch'); put(3, 1, null, 'bones'); put(3, 3, null, 'cobweb');
  } else if (st.k === 'pond') { // a small pond with reeds and lilies
    for (let dx = 0; dx < 7; dx++) for (let dy = 0; dy < 6; dy++) {
      const d = Math.hypot(dx - 3, (dy - 2.5) * 1.15);
      if (d < 2.1) put(dx, dy, d < 1.2 ? 'deep' : 'shallow', d > 1.2 && R(dx, dy) % 3 === 0 ? 'lilypad' : null);
      else if (d < 3.1 && R(dx, dy) % 2 === 0) put(dx, dy, null, R(dx, dy + 3) % 3 ? 'reeds' : 'flower_y');
    }
  } else if (st.k === 'grave') {
    for (let dx = 0; dx < 5; dx++) for (let dy = 0; dy < 4; dy++) put(dx, dy, 'dirt', (dy === 1 && dx % 2 === 0) ? 'ruin_pillar' : (dy === 2 && dx === 2 ? 'bones' : null));
    put(2, 3, 'dirt', 'ruin_chest');
  }
  return out;
}
function wgStamp(seed, ch) {
  const CS = WG.CS, X0 = ch.cx * CS, Y0 = ch.cy * CS;
  for (let ry = Math.floor((Y0 - 12) / 64); ry <= Math.floor((Y0 + CS) / 64); ry++) for (let rx = Math.floor((X0 - 12) / 64); rx <= Math.floor((X0 + CS) / 64); rx++) {
    const st = wgStructPoint(seed, rx, ry);
    if (!st) continue;
    const s = wgSurface(seed, st.x + 3, st.y + 3);
    if (GROUND[s.g].liq || s.b === 'ocean' || s.b === 'volcano' || s.b === 'beach') continue;
    const tl = wgStructTiles(st, seed);
    let x0 = 99, y0 = 99, x1 = -99, y1 = -99; for (const t of tl) { x0 = Math.min(x0, t[0]); y0 = Math.min(y0, t[1]); x1 = Math.max(x1, t[0]); y1 = Math.max(y1, t[1]); }
    for (let dy = y0 - 2; dy <= y1 + 2; dy++) for (let dx = x0 - 2; dx <= x1 + 2; dx++) { // a clearing round it
      const lx = st.x + dx - X0, ly = st.y + dy - Y0; if (lx < 0 || ly < 0 || lx >= CS || ly >= CS) continue;
      const k = ly * CS + lx, ob = OBJ[ch.o[k]]; if (ob && (ob.kind === 'tree' || ob.kind === 'plant' && ob.solid)) ch.o[k] = 0;
    }
    for (const [dx, dy, g, o] of tl) {
      const lx = st.x + dx - X0, ly = st.y + dy - Y0;
      if (lx < 0 || ly < 0 || lx >= CS || ly >= CS) continue;
      const k = ly * CS + lx;
      if (GROUND[ch.g[k]].liq && !g) continue;
      if (g) ch.g[k] = G_ID[g];
      ch.o[k] = o ? O_ID[o] : 0;
      if (o === 'ruin_chest') { ch.cont.set(k, wgLoot(st.h + k)); }
    }
  }
}
function wgLoot(h) {
  const t = ['flint', 'coal', 'copper', 'string', 'leather', 'iron', 'glass', 'arrow', 'honey', 'crystal', 'feather', 'bone', 'stew', 'apple'], out = [];
  const n = 3 + h % 3;
  for (let i = 0; i < n; i++) { const it = t[hash(i, h, 7) % t.length]; out.push({ id: it, n: 1 + hash(i, h, 9) % (it === 'arrow' ? 10 : 3) }); }
  if (hash(1, h, 3) % 6 === 0) out.push({ id: ['bow', 'wand_spark', 'sword_copper', 'pick_copper'][hash(2, h, 5) % 4], n: 1 });
  return out;
}

// the caves: a second endless layer. Open floor where the cave noise is high, worms of tunnel, rock everywhere else.
function wgCaveOpen(seed, x, y) {
  const a = WGW.f(seed + 61, x / 20, y / 20, 3);
  if (a > 0.12) return true;
  const w = WGW.f(seed + 62, x / 34, y / 34, 2);
  return Math.abs(w) < 0.055;
}
function wgGenUnder(seed, ch) {
  const CS = WG.CS, X0 = ch.cx * CS, Y0 = ch.cy * CS;
  for (let j = 0; j < CS; j++) for (let i = 0; i < CS; i++) {
    const x = X0 + i, y = Y0 + j, k = j * CS + i, d = Math.sqrt(x * x + y * y);
    const sf = wgSurface(seed, x, y);
    const cl = sf.b === 'snow' || sf.b === 'highland' ? 'cliff_ice' : (sf.b === 'desert' || sf.b === 'beach') ? 'cliff_sand' : sf.b === 'volcano' ? 'cliff_ash' : 'cliff';
    const open = wgCaveOpen(seed, x, y);
    ch.g[k] = G_ID.cave;
    if (!open) {
      let o = cl;
      const r = hash(x, y, seed + 71) % 10000;
      const near = WGW.f(seed + 72, x / 9, y / 9, 2) > 0.25; // ore likes to cluster
      if (r < (near ? 520 : 70)) {
        const pool = [['u_coal', 0, 10]];
        if (d > 30) pool.push(['u_copper', 40, 8]);
        if (d > 110) pool.push(['u_iron', 120, 6]);
        if (d > 280) pool.push(['u_crystal', 300, 3]);
        if (d > 650) pool.push(['u_star', 700, 1.2]);
        let tot = 0; for (const p of pool) tot += p[2];
        let q = (hash(x, y, seed + 73) % 1000) / 1000 * tot;
        for (const p of pool) { q -= p[2]; if (q <= 0) { o = p[0]; break; } }
      }
      ch.o[k] = O_ID[o];
    } else {
      const r = hash(x, y, seed + 74) % 1000;
      if (d > 220 && WGW.f(seed + 75, x / 26, y / 26, 2) > 0.5) ch.g[k] = G_ID.lava;
      else if (WGW.f(seed + 76, x / 30, y / 30, 2) > 0.52) ch.g[k] = G_ID.shallow;
      else if (r < 14) ch.o[k] = O_ID.glowcap;
      else if (r < 22) ch.o[k] = O_ID.bigmush;
      else if (r < 30) ch.o[k] = O_ID.cobweb;
      else if (r < 36) ch.o[k] = O_ID.bones;
      else if (r < 60) ch.o[k] = O_ID.pebbles;
      else if (r < 70) ch.o[k] = O_ID.mush_brown;
      else if (r < 74) ch.o[k] = O_ID.ore_crystal;
      if (ch.g[k] === G_ID.cave && WGW.f(seed + 77, x / 15, y / 15, 2) > 0.4) ch.g[k] = G_ID.moss;
    }
  }
  for (let ry = Math.floor((Y0 - 4) / 56); ry <= Math.floor((Y0 + CS + 4) / 56); ry++) for (let rx = Math.floor((X0 - 4) / 56); rx <= Math.floor((X0 + CS + 4) / 56); rx++) {
    const p = wgStairPoint(seed, rx, ry);
    if (!p) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const lx = p[0] + dx - X0, ly = p[1] + dy - Y0;
      if (lx < 0 || ly < 0 || lx >= CS || ly >= CS) continue;
      const k = ly * CS + lx;
      ch.g[k] = G_ID.rock; ch.o[k] = dx === 0 && dy === 0 ? O_ID.stairs_up : 0;
    }
  }
  // the star rift: a quiet round room far from the middle, where the Star Warden can be called
  const rr = hash(ch.cx, ch.cy, seed + 78);
  if (Math.sqrt(X0 * X0 + Y0 * Y0) > 200 && (rr >>> 3) % 17 === 3) {
    const px = 9 + (rr >>> 7) % 14, py = 9 + (rr >>> 13) % 14;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { if (dx * dx + dy * dy > 28) continue; const k = (py + dy) * CS + px + dx; ch.g[k] = G_ID.rock; ch.o[k] = 0; ch.cont.delete(k); if (dx * dx + dy * dy >= 20 && (dx + dy) % 2 === 0) ch.o[k] = O_ID.ruin_pillar; }
    ch.o[py * CS + px] = O_ID.rift; return;
  }
  // deep ruins: a chest in a few open spots
  if (rr % 5 === 0) {
    const lx = 4 + (rr >>> 5) % 24, ly = 4 + (rr >>> 11) % 24, k = ly * CS + lx;
    if (ch.g[k] === G_ID.cave && !ch.o[k]) { ch.o[k] = O_ID.ruin_chest; ch.cont.set(k, wgLoot(rr)); }
  }
}

// ---------- World store (in memory) ----------
function wgNewWorld(meta) {
  return { meta, seed: meta.seed | 0, chunks: new Map(), dim: 'o', players: [], gen: 0 };
}
function wgCKey(dim, cx, cy) { return dim + ':' + cx + ',' + cy; }
function wgChunk(w, dim, cx, cy, make) {
  const key = wgCKey(dim, cx, cy);
  let ch = w.chunks.get(key);
  if (!ch && make !== false) {
    ch = wgNewChunk(cx, cy, dim);
    if (w.saved && w.saved.has(key)) wgReadChunk(ch, w.saved.get(key));
    else if (dim === 'o') wgGenOver(w.seed, ch); else wgGenUnder(w.seed, ch);
    w.chunks.set(key, ch);
    if (typeof wgNetChunk === 'function') wgNetChunk(w, dim, cx, cy);
  }
  return ch;
}
function wgChunkAt(w, dim, x, y) { return wgChunk(w, dim, Math.floor(x / WG.CS), Math.floor(y / WG.CS)); }
const wgMod = (a, n) => ((a % n) + n) % n;
function wgGround(w, dim, x, y) { const ch = wgChunkAt(w, dim, x, y); return ch.g[wgMod(y, WG.CS) * WG.CS + wgMod(x, WG.CS)]; }
function wgObjAt(w, dim, x, y) { const ch = wgChunkAt(w, dim, x, y); return ch.o[wgMod(y, WG.CS) * WG.CS + wgMod(x, WG.CS)]; }
function wgMetaAt(w, dim, x, y) { const ch = wgChunkAt(w, dim, x, y); return ch.m[wgMod(y, WG.CS) * WG.CS + wgMod(x, WG.CS)]; }
function wgDirty(w, dim, x, y, ch) {
  ch.mod = true; ch.artDirty = true;
  // neighbours' edges depend on this tile
  const lx = wgMod(x, WG.CS), ly = wgMod(y, WG.CS);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    if ((dx < 0 && lx > 0) || (dx > 0 && lx < WG.CS - 1) || (dy < 0 && ly > 0) || (dy > 0 && ly < WG.CS - 1)) {
      if (dx !== 0 && ((dx < 0 && lx > 0) || (dx > 0 && lx < WG.CS - 1)) && dy === 0) continue;
      if (dy !== 0 && ((dy < 0 && ly > 0) || (dy > 0 && ly < WG.CS - 1)) && dx === 0) continue;
    }
    const n = wgChunk(w, dim, Math.floor((x + dx) / WG.CS), Math.floor((y + dy) / WG.CS), false);
    if (n && n !== ch) n.artDirty = true;
  }
}
function wgSetObj(w, dim, x, y, id, meta) {
  const ch = wgChunkAt(w, dim, x, y), k = wgMod(y, WG.CS) * WG.CS + wgMod(x, WG.CS);
  ch.o[k] = id; ch.m[k] = meta || 0;
  if (!id) ch.cont.delete(k);
  wgDirty(w, dim, x, y, ch);
  if (typeof wgNetTile === 'function') wgNetTile(dim, x, y);
}
function wgSetGround(w, dim, x, y, id) {
  const ch = wgChunkAt(w, dim, x, y), k = wgMod(y, WG.CS) * WG.CS + wgMod(x, WG.CS);
  ch.g[k] = id; wgDirty(w, dim, x, y, ch);
  if (typeof wgNetTile === 'function') wgNetTile(dim, x, y);
}
function wgCont(w, dim, x, y, make) {
  const ch = wgChunkAt(w, dim, x, y), k = wgMod(y, WG.CS) * WG.CS + wgMod(x, WG.CS);
  let c = ch.cont.get(k);
  if (!c && make) { c = []; ch.cont.set(k, c); ch.mod = true; }
  return c;
}
// walkable test for a tile
function wgSolidTile(w, dim, x, y) {
  const ch = wgChunkAt(w, dim, x, y), k = wgMod(y, WG.CS) * WG.CS + wgMod(x, WG.CS), o = ch.o[k];
  if (o && OBJ[o].solid) return true;
  const g = GROUND[ch.g[k]];
  return !!(g.swim && !w.canSwim) ? false : false;
}

// ---------- Saved chunk (de)serialisation: raw arrays, run-length coded ----------
function wgRLE(arr) { // Uint8Array/Uint16Array -> array of [value, run] flattened
  const out = []; let v = arr[0], n = 1;
  for (let i = 1; i < arr.length; i++) { if (arr[i] === v && n < 65535) n++; else { out.push(v, n); v = arr[i]; n = 1; } }
  out.push(v, n); return out;
}
function wgUnRLE(src, arr) { let p = 0; for (let i = 0; i < src.length; i += 2) for (let n = 0; n < src[i + 1]; n++) arr[p++] = src[i]; }
function wgPackChunk(ch) {
  const cont = []; for (const [k, v] of ch.cont) cont.push([k, v]);
  return { g: wgRLE(ch.g), o: wgRLE(ch.o), m: wgRLE(ch.m), c: cont };
}
function wgReadChunk(ch, d) {
  wgUnRLE(d.g, ch.g); wgUnRLE(d.o, ch.o); wgUnRLE(d.m, ch.m);
  for (const [k, v] of d.c || []) ch.cont.set(k, v);
  ch.mod = true;
}
