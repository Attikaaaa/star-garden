'use strict';
// Scenery: what a room is dressed in. The ground, the wall caps around the room, the top
// wall's face, water and chasms, rock groups, tall grass and the little things lying
// around all come from the room's seed and tiles, so every co-op screen dresses a room the
// same way. It is baked into the room's static canvas (renderRoomStatic); tall pieces
// (trees, palms, pillars) are drawn with the actors so heroes can walk behind them.
// Lands not in SCN_LANDS keep their tile renderer (renderRoomPlain, level.js).
const SCN_LANDS = new Set(['meadow', 'beach', 'crystal', 'well']);

// ---------- Noise (pure functions of position and seed) ----------
const _u = (h) => h / 4294967296;
function vnoise(x, y, cell, seed) {
  const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy);
  let tx = fx - ix, ty = fy - iy;
  tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
  const a = _u(hash(ix, iy, seed)), b = _u(hash(ix + 1, iy, seed)), c = _u(hash(ix, iy + 1, seed)), d = _u(hash(ix + 1, iy + 1, seed));
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}
// Cellular noise: distance to the nearest and second nearest feature point, and the
// nearest point's id and offset (for shading round clumps lit from the top left).
const _W = { f1: 0, f2: 0, id: 0, dx: 0, dy: 0 };
function worley(x, y, cell, seed, sy) {
  const cx = Math.floor(x / cell), cy = Math.floor(y / (cell * (sy || 1)));
  const ch = cell * (sy || 1);
  let f1 = 1e9, f2 = 1e9, id = 0, fx = 0, fy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const h = hash(cx + i, cy + j, seed);
    const dx = x - (cx + i + 0.15 + (h & 1023) / 1450) * cell, dy = y - (cy + j + 0.15 + ((h >>> 10) & 1023) / 1450) * ch;
    const d = dx * dx + dy * dy;
    if (d < f1) { f2 = f1; f1 = d; id = h; fx = dx; fy = dy; } else if (d < f2) f2 = d;
  }
  _W.f1 = Math.sqrt(f1); _W.f2 = Math.sqrt(f2); _W.id = id; _W.dx = fx; _W.dy = fy;
  return _W;
}
// The same two, for every pixel of the room's interior at once: the lattice is hashed once
// per room instead of once per pixel (the values are exactly those of vnoise / worley).
// Adds wt * vnoise(x, y, cell, seed) to acc.
function noiseInto(acc, cell, seed, wt) {
  const gx0 = Math.floor(IN_X0 / cell), gy0 = Math.floor(IN_Y0 / cell);
  const gw = Math.floor((IN_X1 - 1) / cell) - gx0 + 2, gh = Math.floor((IN_Y1 - 1) / cell) - gy0 + 2;
  const L = new Float64Array(gw * gh), TX = new Float64Array(VW), IX = new Int32Array(VW);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) L[j * gw + i] = _u(hash(gx0 + i, gy0 + j, seed));
  for (let x = IN_X0; x < IN_X1; x++) { const f = x / cell, ix = Math.floor(f), t = f - ix; TX[x] = t * t * (3 - 2 * t); IX[x] = ix - gx0; }
  for (let y = IN_Y0; y < IN_Y1; y++) {
    const f = y / cell, iy = Math.floor(f), u = f - iy, ty = u * u * (3 - 2 * u), row = (iy - gy0) * gw;
    for (let x = IN_X0; x < IN_X1; x++) {
      const q = row + IX[x], a = L[q], b = L[q + 1], c = L[q + gw], d = L[q + gw + 1], tx = TX[x];
      acc[y * VW + x] += wt * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
    }
  }
  return acc;
}
// worley()'s feature points for the whole view; worleyAt(P, x, y) then needs no hashing.
function worleyPts(cell, seed, sy) {
  const ch = cell * (sy || 1), gx = Math.floor((VW - 1) / cell) + 3, gy = Math.floor((VH - 1) / ch) + 3;
  const P = { cell, ch, gx, x: new Float64Array(gx * gy), y: new Float64Array(gx * gy), id: new Uint32Array(gx * gy) };
  for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
    const h = hash(i - 1, j - 1, seed), k = j * gx + i;
    P.x[k] = (i - 1 + 0.15 + (h & 1023) / 1450) * cell; P.y[k] = (j - 1 + 0.15 + ((h >>> 10) & 1023) / 1450) * ch; P.id[k] = h;
  }
  return P;
}
function worleyAt(P, x, y) {
  const cx = Math.floor(x / P.cell), cy = Math.floor(y / P.ch);
  let f1 = 1e9, f2 = 1e9, id = 0, fx = 0, fy = 0;
  for (let j = 0; j <= 2; j++) for (let i = 0; i <= 2; i++) {
    const k = (cy + j) * P.gx + cx + i, dx = x - P.x[k], dy = y - P.y[k], d = dx * dx + dy * dy;
    if (d < f1) { f2 = f1; f1 = d; id = P.id[k]; fx = dx; fy = dy; } else if (d < f2) f2 = d;
  }
  _W.f1 = Math.sqrt(f1); _W.f2 = Math.sqrt(f2); _W.id = id; _W.dx = fx; _W.dy = fy;
  return _W;
}
const _nA = new Float64Array(VW * VH), _nB = new Float64Array(VW * VH);
// Light on a round bump (top-left sun), -1..1.
function litBump(dx, dy, r) {
  const nx = dx / r, ny = dy / r, q = nx * nx + ny * ny;
  return -0.5 * nx - 0.62 * ny + 0.6 * Math.sqrt(Math.max(0, 1 - q));
}

// ---------- Pixel buffers ----------
const _P32 = Object.create(null);
function p32(k) {
  let v = _P32[k];
  if (v === undefined) { const [r, g, b] = _rgb(PAL[k]); v = _P32[k] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; }
  return v;
}
function pixBuf(w, h) { const img = new ImageData(w, h); return { w, h, img, px: new Uint32Array(img.data.buffer) }; }
function bufCanvas(b) { const c = document.createElement('canvas'); c.width = b.w; c.height = b.h; c.getContext('2d').putImageData(b.img, 0, 0); return c; }
// Stamp a glyph (rows of palette keys, '.' clear) into a buffer.
function glyph(b, rows, x, y, map) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j], Y = y + j;
    if (Y < 0 || Y >= b.h) continue;
    for (let i = 0; i < row.length; i++) {
      let k = row[i];
      if (k === '.') continue;
      if (map && map[k]) k = map[k];
      const X = x + i;
      if (X >= 0 && X < b.w) b.px[Y * b.w + X] = p32(k);
    }
  }
}
const _G = (s) => s.trim().split(/\s+/);

// A tiny seeded stream for placing things (never the gameplay streams).
function scnRand(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- Ground ----------
// The floor inside the walls: big soft patches (light and shade of the land's ground),
// fine texture, then little things lying around, thicker along the walls.
const IN_X0 = 16, IN_X1 = VW - 16, IN_Y0 = OY + 32, IN_Y1 = OY + 192;
const SCN_GROUND = {
  meadow: { base: 'h', dark: 'G', light: 'H', tuft: { h: 'G', G: 'g', H: 'h' }, speck: { h: 'H', G: 'h', H: 'w' }, hi: 0.72, lo: 0.2 },
  beach: { base: 'a', dark: 'A', light: 'e', tuft: { a: 'e', A: 'a', e: 'N' }, speck: { a: 'A', A: 'w', e: 'a' }, hi: 0.64, lo: 0.2 },
  crystal: { base: 'l', dark: 'm', light: 'L', tuft: { l: 'm', m: 'd', L: 'l' }, speck: { l: 'L', m: 'l', L: 'w' }, hi: 0.72, lo: 0.2 },
  well: { base: '2', dark: '1', light: '3', tuft: { 2: '1', 1: '0', 3: '2' }, speck: { 2: '3', 1: '2', 3: '4' }, hi: 0.75, lo: 0.22 },
};
const TUFTS = [_G('x.x .x.'), _G('x .'), _G('.x. x.x'), _G('x..x .xx.')];
// stone floors get chips and grit instead of tufts
const CHIPS = [_G('xx'), _G('x. .x'), _G('.x x.'), _G('x')];
SCN_GROUND.crystal.glyphs = SCN_GROUND.well.glyphs = CHIPS;
function bakeGround(room, theme) {
  const R = SCN_GROUND[theme] || SCN_GROUND.meadow, b = pixBuf(VW, VH), s = room.seed | 0;
  const cls = new Uint8Array(VW * VH); // 0 base, 1 dark patch, 2 light patch
  _nA.fill(0); noiseInto(_nA, 48, s, 0.7); noiseInto(_nA, 17, s + 7, 0.24); noiseInto(_nA, 6, s + 9, 0.06);
  for (let y = IN_Y0; y < IN_Y1; y++) for (let x = IN_X0; x < IN_X1; x++) {
    const n = _nA[y * VW + x];
    cls[y * VW + x] = n > R.hi ? 1 : n < R.lo ? 2 : 0;
  }
  smoothCls(cls, 2);
  const keys = [R.base, R.dark, R.light];
  for (let y = IN_Y0; y < IN_Y1; y++) for (let x = IN_X0; x < IN_X1; x++) b.px[y * VW + x] = p32(keys[cls[y * VW + x]]);
  if (GROUND_TEX[theme]) GROUND_TEX[theme](b, cls, s, keys);
  // tufts and specks on a jittered grid, coloured by the patch they sit in: they gather in
  // the dark patches and leave the open ground calm, so foes and bullets read at a glance
  const rnd2 = scnRand(s ^ 0x7a11), set = R.glyphs || TUFTS, TUFT_P = R.glyphs ? [0.05, 0.16, 0.02] : [0.08, 0.3, 0.03];
  for (let y = IN_Y0; y < IN_Y1 - 2; y += 7) for (let x = IN_X0; x < IN_X1 - 3; x += 8) {
    const gx = x + Math.floor(rnd2() * 6), gy = y + Math.floor(rnd2() * 5), c = cls[gy * VW + gx], k = keys[c], r = rnd2();
    if (r < TUFT_P[c]) glyph(b, set[Math.floor(rnd2() * set.length)], gx, gy, { x: R.tuft[k] });
    else if (r > 0.9) b.px[gy * VW + gx] = p32(R.speck[k]);
  }
  if (room.type === 'boss' || room.type === 'arena' || room.type === 'warden') drawRingPx(b, theme);
  scatterDecals(b, room, theme, cls, keys);
  return bufCanvas(b);
}
// Round off patch edges: every pixel takes the class most of its 3x3 neighbours have.
const _cls2 = new Uint8Array(VW * VH);
function smoothCls(cls, passes) {
  for (let p = 0; p < passes; p++) {
    _cls2.set(cls);
    for (let y = IN_Y0 + 1; y < IN_Y1 - 1; y++) for (let x = IN_X0 + 1; x < IN_X1 - 1; x++) {
      let n0 = 0, n1 = 0, n2 = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const v = _cls2[(y + j) * VW + x + i]; if (v === 0) n0++; else if (v === 1) n1++; else n2++; }
      const c = _cls2[y * VW + x], nc = c === 0 ? n0 : c === 1 ? n1 : n2;
      cls[y * VW + x] = nc >= 4 ? c : n0 >= n1 && n0 >= n2 ? 0 : n1 >= n2 ? 1 : 2;
    }
  }
}
// Extra texture per land, drawn before the tufts.
const GROUND_TEX = {
  // wind ripples in the sand
  beach(b, cls, s, keys) {
    _nB.fill(0); noiseInto(_nB, 26, s + 3, 1);
    for (let y = IN_Y0; y < IN_Y1; y++) for (let x = IN_X0; x < IN_X1; x++) {
      const w = Math.sin(x * 0.21 + y * 0.62 + _nB[y * VW + x] * 7);
      if (w > 0.95 && vnoise(x, y, 9, s + 5) > 0.56) {
        const c = cls[y * VW + x];
        b.px[y * VW + x] = p32(c === 1 ? 'a' : c === 2 ? 'N' : 'e');
      }
    }
  },
  // the cave floor: worn slabs in places, bare rock with cracks elsewhere
  crystal(b, cls, s) {
    _nB.fill(0); noiseInto(_nB, 64, s + 13, 1);
    const P1 = worleyPts(21, s + 11, 0.8), P2 = worleyPts(34, s + 11, 0.8);
    for (let y = IN_Y0; y < IN_Y1; y++) for (let x = IN_X0; x < IN_X1; x++) {
      const i = y * VW + x, paved = _nB[i] > 0.64;
      const w = worleyAt(paved ? P1 : P2, x, y), e = w.f2 - w.f1;
      if (paved) {
        if (e < 1.1) b.px[i] = p32(cls[i] === 1 ? 'd' : 'm');
        else if (e < 2.2 && w.dx < 0 && w.dy < 0 && cls[i] !== 1) b.px[i] = p32('L');
      } else if (e < 0.8 && vnoise(x, y, 7, s + 17) > 0.78) b.px[i] = p32(cls[i] === 1 ? 'd' : 'm');
    }
  },
  // old star-stone flags with lit edges, worn smooth between them
  well(b, cls, s) {
    _nB.fill(0); noiseInto(_nB, 60, s + 13, 1);
    const P1 = worleyPts(22, s + 11, 0.8), P2 = worleyPts(36, s + 11, 0.8);
    for (let y = IN_Y0; y < IN_Y1; y++) for (let x = IN_X0; x < IN_X1; x++) {
      const i = y * VW + x;
      if (cls[i] === 1) continue;
      const paved = _nB[i] > 0.64;
      const w = worleyAt(paved ? P1 : P2, x, y), e = w.f2 - w.f1;
      if (paved) {
        if (e < 1.1) b.px[i] = p32('1');
        else if (e < 2.2 && w.dx < 0 && w.dy < 0) b.px[i] = p32(cls[i] === 2 ? '4' : '3');
      } else if (e < 0.8 && vnoise(x, y, 7, s + 17) > 0.78) b.px[i] = p32('1');
    }
  },
};

// ---------- Decals: flowers, shells, shards ----------
// Rows of palette keys. Clusters gather near a few centres; singles fall anywhere.
const SCN_DECALS = {
  meadow: {
    cluster: [
      [_G('.w. wyw .w.'), 5], [_G('.P. PqP .P.'), 4], [_G('.y. yOy .y.'), 3], [_G('.q. qwq .q.'), 2], [_G('.B. BcB .B.'), 1],
    ],
    single: [
      [_G('.GG. GhhG GhG. .g..'), 3], // clover
      [_G('.rr. rwrr .ww. ..'), 1], // toadstool
      [_G('.r..r rwrrw .w..w'), 1], // two toadstools
      [_G('.ml. mlLl .dm.'), 3], // pebble
      [_G('.d. dm.'), 2],
      [_G('..n. .nNn nNNn'), 1], // molehill
      [_G('w.w .y. w.w'), 1], // dandelion fluff
    ],
    wall: [_G('.G.G G.G.'), _G('G.G .G.'), _G('.w. wyw .w.'), _G('.P. PqP .P.')],
    // fight rooms grow the Bloom Loop's flowers (lands.js), so nothing there looks like one
    fightCluster: [[_G('.GG. GhhG GhG. .g..'), 3], [_G('G.G .G.'), 2], [_G('.G.G G.G.'), 2]],
    fightWall: [_G('.G.G G.G.'), _G('G.G .G.'), _G('.G. GhG'), _G('G.. .G.')],
  },
  beach: {
    cluster: [[_G('.e. eNe'), 3], [_G('.A. AwA'), 2]],
    single: [
      [_G('.qq. qwqq .qP. ..'), 3], // scallop
      [_G('..o.. .oOo. ooOoo .o.o.'), 2], // starfish
      [_G('.RR. RwRR .RR.'), 1], // pink shell
      [_G('.OA. OAAN .NN.'), 2], // spiral shell
      [_G('.ml. mlLl .dm.'), 2], // pebble
      [_G('g.g. gtg. .g..'), 2], // seaweed
      [_G('e.e. .e.e'), 2], // footprints
    ],
    wall: [_G('.A. AAA'), _G('qq. qwq'), _G('g.g .g.')],
  },
  crystal: {
    cluster: [[_G('.C. cCc .B.'), 3], [_G('.q. PqP .p.'), 2]],
    single: [
      [_G('.C. CcB .B.'), 3], // shard
      [_G('..C .Cc cB.'), 2],
      [_G('.q. PqP'), 2], // pink shard
      [_G('.Y. YwY .Y.'), 1], // glint
      [_G('.CC. CccC .CC.'), 2], // puddle
      [_G('.TT. TcTT .TT.'), 1], // glow moss
      [_G('.md. mdd.'), 3], // rubble
    ],
    wall: [_G('.d. dmd'), _G('.C. cB.'), _G('m. dm')],
  },
  well: {
    cluster: [[_G('.Y. YwY .Y.'), 3], [_G('.c. cCc .c.'), 1]],
    single: [[_G('.3. 343 .3.'), 3], [_G('.Y. YwY .Y.'), 2], [_G('3. .3'), 2]],
    wall: [_G('.3. 343'), _G('1. 21')],
  },
};
function pickW(list, r) {
  let sum = 0;
  for (const it of list) sum += it[1];
  let v = r * sum;
  for (const it of list) if ((v -= it[1]) < 0) return it[0];
  return list[0][0];
}
function scatterDecals(b, room, theme, cls) {
  const D = SCN_DECALS[theme] || SCN_DECALS.meadow, r = scnRand((room.seed | 0) ^ 0x2d1c);
  const fits = (rows, x, y) => x >= IN_X0 + 1 && y >= IN_Y0 + 2 && x + rows[0].length < IN_X1 - 1 && y + rows.length < IN_Y1 - 1;
  // clusters (flower beds, shell drifts, shard fields), more in quiet rooms
  const quiet = room.type !== 'normal' && room.type !== 'challenge' && room.type !== 'boss' && room.type !== 'arena' && room.type !== 'warden';
  const fight = !quiet || room.type === 'start', CL = fight && D.fightCluster ? D.fightCluster : D.cluster;
  const nc = (quiet ? 2 : 1) + (r() < 0.4 ? 1 : 0);
  for (let k = 0; k < nc; k++) {
    const cx = IN_X0 + 12 + r() * (IN_X1 - IN_X0 - 24), cy = IN_Y0 + 10 + r() * (IN_Y1 - IN_Y0 - 20);
    const n = 3 + Math.floor(r() * 5), sp = 5 + r() * 8, pal = pickW(CL, r());
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * sp;
      const g = r() < 0.75 ? pal : pickW(CL, r()), x = Math.round(cx + Math.cos(a) * d * 1.4), y = Math.round(cy + Math.sin(a) * d);
      if (fits(g, x, y)) glyph(b, g, x, y);
    }
  }
  // singles anywhere
  const ns = 4 + Math.floor(r() * 4);
  for (let k = 0; k < ns; k++) {
    const g = pickW(D.single, r()), x = Math.round(IN_X0 + 4 + r() * (IN_X1 - IN_X0 - 12)), y = Math.round(IN_Y0 + 4 + r() * (IN_Y1 - IN_Y0 - 12));
    if (fits(g, x, y)) glyph(b, g, x, y);
  }
  // the foot of the walls: tufts, drifts and rubble
  const WL = fight && D.fightWall ? D.fightWall : D.wall;
  const along = (x0, y0, x1, y1, step) => {
    for (let t = 0; t < 1; t += step / Math.max(x1 - x0, y1 - y0)) {
      if (r() < 0.65) continue;
      const g = WL[Math.floor(r() * WL.length)];
      const x = Math.round(x0 + (x1 - x0) * t + r() * 3), y = Math.round(y0 + (y1 - y0) * t + r() * 2);
      glyph(b, g, Math.min(IN_X1 - g[0].length, Math.max(IN_X0, x)), Math.min(IN_Y1 - g.length, Math.max(IN_Y0, y)));
    }
  };
  along(IN_X0 + 2, IN_Y0 + 4, IN_X1 - 6, IN_Y0 + 4, 9);
  along(IN_X0 + 1, IN_Y0 + 6, IN_X0 + 1, IN_Y1 - 6, 11);
  along(IN_X1 - 4, IN_Y0 + 6, IN_X1 - 4, IN_Y1 - 6, 11);
  along(IN_X0 + 2, IN_Y1 - 4, IN_X1 - 6, IN_Y1 - 4, 10);
}

// ---------- Wall caps: one endless texture per land ----------
// A pure function of play-view position, so the room's caps and the screen margins
// around it (drawBackdrop) meet without a seam.
const CAP_SEED = { meadow: 101, beach: 202, crystal: 303, well: 404 };
const CAP = {
  // a clipped hedge: big leafy clumps lit from the top left, now and then a flower
  meadow(x, y, s) {
    const w = worley(x, y, 11, s, 0.72), id = w.id;
    if (w.f2 - w.f1 < 1.3) return 'g';
    if ((id & 31) === 7) {
      const d = Math.abs(Math.round(w.dx)) + Math.abs(Math.round(w.dy));
      if (d === 0) return 'y';
      if (d === 1) return (id >> 5) & 1 ? 'P' : 'w';
    }
    const v = litBump(w.dx, w.dy, 7.5) - ((id >>> 8) & 3) * 0.08;
    // small leaves inside the lit part of a clump
    if (v > 0.25 && v < 0.75) { const l = worley(x, y, 3.2, s + 1, 0.8); if (l.f2 - l.f1 < 0.7 && l.dy > 0) return 'g'; }
    return v > 0.75 ? 'h' : v > 0.25 ? 'G' : 'g';
  },
  // the sea: long swells, a white crest on each with a darker trough behind it
  beach(x, y, s) {
    const yy = y + Math.sin(x * 0.13 + vnoise(x, y, 34, s) * 5) * 2.6;
    const band = ((yy % 11) + 11) % 11, seg = vnoise(x, y * 1.6, 9, s + 1);
    if (band < 1 && seg > 0.52) return seg > 0.7 ? 'w' : 'C';
    if (band >= 1 && band < 2 && seg > 0.52) return 't';
    if ((hash(x, y, s + 5) & 1023) === 0) return 'w';
    return 'T';
  },
  // the cave roof: big knobbly rocks, now and then a crystal tip
  crystal(x, y, s) {
    const w = worley(x, y, 12, s, 0.8), id = w.id;
    if (w.f2 - w.f1 < 1.2) return '1';
    if ((id & 15) === 3) {
      const ax = Math.abs(w.dx + 0.5), d = -w.dy;
      if (ax < 2 && d > -3 && d < 5 - ax * 2.2) return d - ax * 2 > 0 || w.dx < -0.5 ? 'C' : 'c';
      if (ax < 3 && d > -4 && d < 6 - ax * 2.2) return '0';
    }
    const v = litBump(w.dx, w.dy, 8.5) - ((id >>> 8) & 3) * 0.07;
    return v > 0.8 ? '4' : v > 0.35 ? '3' : v > -0.15 ? '2' : '1';
  },
  well(x, y, s) {
    const w = worley(x, y, 12, s, 0.8);
    if (w.f2 - w.f1 < 1.2) return '0';
    if ((hash(x, y, s + 3) & 511) === 0) return 'Y';
    const v = litBump(w.dx, w.dy, 8.5);
    return v > 0.65 ? '3' : v > 0.1 ? '2' : '1';
  },
};
function capKey(theme, x, y) { return (CAP[theme] || CAP.meadow)(x, y, CAP_SEED[theme] || 101); }
// The caps under the play view (cached per land): rooms copy their wall tiles out of it.
const _capLayer = Object.create(null);
function capLayer(theme) {
  let c = _capLayer[theme];
  if (c) return c;
  const b = pixBuf(VW, VH);
  for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) b.px[y * VW + x] = p32(capKey(theme, x, y));
  return (_capLayer[theme] = bufCanvas(b));
}
// Caps for a screen-sized area whose play view sits at (ox, oy).
function capArea(theme, w, h, ox, oy) {
  const b = pixBuf(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.px[y * w + x] = p32(capKey(theme, x - ox, y - oy));
  return bufCanvas(b);
}

// ---------- Tile regions (pits, rock groups): rounded masks rendered per pixel ----------
// mask: 1 inside. Convex corners are rounded by `rc`; `inset` pulls exposed sides in.
function regionMask(room, test, rc, inset) {
  const m = new Uint8Array(VW * VH);
  const isT = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && test(room.tiles[r * COLS + c], c, r);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!isT(c, r)) continue;
    const up = isT(c, r - 1), dn = isT(c, r + 1), lf = isT(c - 1, r), rt = isT(c + 1, r);
    const x0 = c * 16 + (lf ? 0 : inset), x1 = c * 16 + 16 - (rt ? 0 : inset), y0 = OY + r * 16 + (up ? 0 : inset), y1 = OY + r * 16 + 16 - (dn ? 0 : inset);
    for (let y = Math.max(0, y0); y < Math.min(VH, y1); y++) for (let x = x0; x < x1; x++) {
      // round the corners where both sides are open
      const lx = x - x0, rx = x1 - 1 - x, ty = y - y0, by = y1 - 1 - y;
      const cut = (a, bb) => a < rc && bb < rc && (rc - a - 0.5) * (rc - a - 0.5) + (rc - bb - 0.5) * (rc - bb - 0.5) > rc * rc;
      if ((!up && !lf && cut(lx, ty)) || (!up && !rt && cut(rx, ty)) || (!dn && !lf && cut(lx, by)) || (!dn && !rt && cut(rx, by))) continue;
      m[y * VW + x] = 1;
    }
  }
  return m;
}
const inM = (m, x, y) => x >= 0 && y >= 0 && x < VW && y < VH && m[y * VW + x] === 1;
// distance (in px, up to max) from (x, y) to the mask's edge going in direction (dx, dy)
function scnRun(m, x, y, dx, dy, max) {
  let n = 0;
  while (n < max && inM(m, x + dx * (n + 1), y + dy * (n + 1))) n++;
  return n;
}

// Water and chasms. The far bank is seen from above as a face (`face`, top row first);
// below it lie the water and its ripples, or the dark with crystals glinting far down.
const PIT = {
  meadow: { face: ['h', 'G', 'n', 'n', 'u'], shade: 'b', body: 'B', deep: 'b', ripple: 'c', edge: 'c', foam: null },
  beach: { face: ['A', 'a', 'e', 'N'], shade: 't', body: 'T', deep: 'T', ripple: 'C', edge: 'C', foam: 'w' },
  crystal: { face: ['L', 'l', 'm', 'm', 'd', 'd', '1', '1', '0'], glint: ['1', '1', '1', '2', 'c'], tooth: _G('0C0 0c0 .0.') },
  well: { face: ['4', '3', '2', '2', '1', '1', '0'], glint: ['1', '2', 'Y', 'w', 'c'], tooth: _G('0Y0 .0.') },
};
function drawPitsPx(b, room, theme) {
  const P = PIT[theme] || PIT.meadow, m = regionMask(room, (t) => t === T_PIT, 3, 0), s = room.seed | 0;
  const F = P.face.length, water = !P.glint;
  for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
    const i = y * VW + x;
    if (!m[i]) {
      // wet sand around the pools
      if (P.foam && y >= IN_Y0 && y < IN_Y1 && x >= IN_X0 && x < IN_X1 && (inM(m, x, y + 1) || inM(m, x, y - 1) || inM(m, x - 1, y) || inM(m, x + 1, y) || inM(m, x, y + 2) || inM(m, x - 2, y) || inM(m, x + 2, y))) b.px[i] = p32('e');
      continue;
    }
    if (!inM(m, x - 1, y) || !inM(m, x + 1, y) || !inM(m, x, y - 1) || !inM(m, x, y + 1)) { b.px[i] = p32('0'); continue; }
    const up = scnRun(m, x, y, 0, -1, 14);
    // the far bank: rows of the face, wavy where they meet, a few dark cracks
    const wob = (hash(x >> 1, 5, s) & 3) === 0 ? 1 : 0;
    if (up - wob < F) {
      let k = P.face[Math.max(0, up - wob)];
      if (!water && up > 1 && (hash(x, 9, s) & 15) === 0) k = P.face[Math.min(F - 1, up + 2)];
      b.px[i] = p32(k);
      continue;
    }
    const dn = scnRun(m, x, y, 0, 1, 9), side = Math.min(scnRun(m, x, y, -1, 0, 9), scnRun(m, x, y, 1, 0, 9));
    let k;
    if (water) {
      const dist = Math.min(dn, side);
      k = up - wob < F + 2 ? P.shade : dist + vnoise(x, y, 11, s + 6) * 5 > 8 && up > F + 6 ? P.deep : P.body;
      if (dist === 0) k = P.edge;
      if (P.foam && dist <= 1 && vnoise(x, y, 4, s) > 0.45) k = P.foam;
      // short ripples, in rows
      if (k === P.body && y % 3 === 0 && (hash((x + y * 5) >> 2, y, s) & 7) === 0) k = P.ripple;
    } else {
      k = '0';
      if (up > F + 2 && (hash(x, y, s + 1) & 255) === 0) k = P.glint[hash(x, y, s + 2) % P.glint.length];
    }
    b.px[i] = p32(k);
  }
  if (P.tooth) {
    // crystals grow out of the foot of the far face
    const t = P.tooth;
    for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
      if (!inM(m, x, y) || inM(m, x, y - 1) || (hash(x, 7, s) % 11) !== 0) continue;
      const ty = y + F - 2;
      let ok = true;
      for (let j = 0; j <= t.length && ok; j++) for (let q = -1; q <= t[0].length; q++) if (!inM(m, x - 1 + q, ty + j)) ok = false;
      if (ok) glyph(b, t, x - 1, ty);
    }
  }
}

// The Shore's high tide (lands.js draws it): shallow water inside each pool's own bank,
// under the far bank's face, with a white waterline. Two frames, kept until the pools change.
function shallowLayer(room) {
  const key = baseKey(room, 'beach');
  if (room.shallow && room.shallowKey === key) return room.shallow;
  const m = regionMask(room, (t) => t === T_PIT, 3, 0), s = room.seed | 0, F = PIT.beach.face.length;
  room.shallowKey = key;
  return (room.shallow = [0, 1].map(f => {
    const c = document.createElement('canvas');
    c.width = VW; c.height = VH;
    const g = c.getContext('2d'), sp = S('shallow_' + f);
    for (const [x, y] of room.pits) blit(g, sp, x, y);
    const img = g.getImageData(0, 0, VW, VH), px = new Uint32Array(img.data.buffer);
    for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
      const i = y * VW + x;
      if (!px[i]) continue;
      const up = scnRun(m, x, y, 0, -1, 14) - ((hash(x >> 1, 5, s) & 3) === 0 ? 1 : 0);
      if (!m[i] || !inM(m, x - 1, y) || !inM(m, x + 1, y) || !inM(m, x, y + 1) || up < F) px[i] = 0;
      else if (up === F) px[i] = p32('w');
    }
    g.putImageData(img, 0, 0);
    return c;
  }));
}

// Rock groups of two or more tiles become one built shape: a hedge, a stone wall, a rock
// ridge. A top that catches the light, a lit lip, then the front face below it.
const RIDGE = {
  meadow: {
    top: 'gGhH', cell: 9, h: 6,
    front(x, y, row, s) { const l = worley(x, y, 3.6, s + 3, 0.7); return l.f2 - l.f1 < 0.8 || litBump(l.dx, l.dy, 2.8) < 0.15 ? 'g' : 'G'; },
  },
  beach: {
    top: 'dmlL', cell: 8, h: 7,
    // stacked stones, three rows to a course
    front(x, y, row, s) {
      const c = Math.floor(row / 3), r = row % 3, j = (x + c * 4 + (hash(c, x >> 4, s) & 1)) % 7;
      return r === 2 || j === 0 ? 'd' : r === 0 && j === 1 ? 'l' : 'm';
    },
  },
  crystal: { top: '1234', cell: 10, h: 7, front(x, y, row, s) { return (hash(x >> 1, 3, s) & 3) === 0 || row === 6 ? '1' : '2'; } },
  well: { top: '0123', cell: 10, h: 7, front(x, y, row, s) { return (hash(x >> 1, 3, s) & 3) === 0 || row === 6 ? '0' : '1'; } },
};
function drawRidgesPx(b, room, theme, groups) {
  const R = RIDGE[theme] || RIDGE.meadow, s = (room.seed | 0) + 77;
  const ridge = new Set();
  for (const g of groups) if (g.kind === 'ridge') for (const i of g.tiles) ridge.add(i);
  if (!ridge.size) return;
  const m = regionMask(room, (t, c, r) => ridge.has(r * COLS + c), 4, 1);
  for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
    const i = y * VW + x;
    if (!m[i]) continue;
    if (!inM(m, x - 1, y) || !inM(m, x + 1, y) || !inM(m, x, y - 1) || !inM(m, x, y + 1)) { b.px[i] = p32('0'); continue; }
    const dn = scnRun(m, x, y, 0, 1, R.h + 1);
    let k;
    if (dn < R.h) k = R.front(x, y, R.h - 1 - dn, s);
    else if (dn === R.h) k = R.top[2];
    else {
      const w = worley(x, y, R.cell, s, 0.8);
      if (w.f2 - w.f1 < 1.2) k = R.top[0];
      else {
        const v = litBump(w.dx, w.dy, R.cell * 0.75) - ((w.id >>> 8) & 3) * 0.06;
        k = v > 0.82 ? R.top[3] : v > 0.36 ? R.top[2] : R.top[1];
      }
      if (scnRun(m, x, y, 0, -1, 2) === 0) k = R.top[2];
    }
    b.px[i] = p32(k);
  }
  // flowers on the hedges, crystals on the cave ridges
  const deco = theme === 'meadow' ? [_G('.P. PqP .P.'), _G('.w. wyw .w.')] : theme === 'crystal' ? [_G('.0. 0C0 0cB 0B0 .0.'), _G('.0. 0q0 0Pp 0p0 .0.')] : null;
  if (!deco) return;
  const r = scnRand(s ^ 0x77);
  for (const g of groups) if (g.kind === 'ridge') for (const t of g.tiles) {
    if (r() > 0.38) { r(); r(); r(); continue; }
    const c = t % COLS, rr = (t / COLS) | 0, d = deco[r() < 0.6 ? 0 : 1];
    const x = c * 16 + 3 + Math.floor(r() * 8), y = OY + rr * 16 + 2 + Math.floor(r() * 3);
    // only where the whole thing sits on the top surface
    if (inM(m, x - 1, y - 1) && inM(m, x + 4, y - 1) && scnRun(m, x + 1, y, 0, 1, R.h + 8) > R.h + d.length) glyph(b, d, x, y);
  }
}

// ---------- The plan: which rock is a lone boulder, a 2x2 giant or part of a ridge ----------
function rockGroups(room) {
  const seen = new Uint8Array(COLS * ROWS), out = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    if (seen[i] || room.tiles[i] !== T_ROCK) continue;
    const q = [i], tiles = [];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop(), c = j % COLS, r = (j / COLS) | 0;
      tiles.push(j);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr, n = nr * COLS + nc;
        if (nc < 1 || nr < 2 || nc >= COLS - 1 || nr >= ROWS - 1 || seen[n] || room.tiles[n] !== T_ROCK) continue;
        seen[n] = 1; q.push(n);
      }
    }
    tiles.sort((a, b) => a - b);
    let kind = tiles.length === 1 ? 'single' : 'ridge';
    if (tiles.length === 4 && tiles[1] === tiles[0] + 1 && tiles[2] === tiles[0] + COLS && tiles[3] === tiles[0] + COLS + 1) kind = 'giant';
    out.push({ kind, tiles });
  }
  return out;
}

// ---------- The top wall's face ----------
// Courses of stones of uneven length in the land's three face colours, weathering along
// the foot, and a few things hung on it. The door's columns stay bare.
const FACE_GROW = {
  meadow: { foot: ['G', 'g'], n: 0.45, ivy: true },
  beach: { foot: ['A', 'a'], n: 0.3, net: true },
  crystal: { foot: ['C', 'c'], n: 0.1 },
  well: { foot: ['Y', '3'], n: 0.06 },
};
// Things on the face: [sprite, weight, y offset, width, flame offset]
const FACE_THINGS = {
  meadow: [['fc_window', 2, 3, 10], ['fc_box', 2, 7, 14], ['fc_lamp', 0.6, 3, 9, [3, 3]]],
  beach: [['fc_ring', 2, 3, 11], ['fc_port', 2, 4, 10], ['fc_star', 2, 5, 9]],
  crystal: [['fc_beam', 2, 0, 7], ['fc_vein', 3, 5, 8], ['fc_hang', 1, 1, 7, [2, 4]]],
  well: [['fc_rune', 3, 5, 9], ['fc_lamp', 1, 3, 9, [3, 3]]],
};
const FACE_LAMP = { meadow: 'fc_lamp', beach: 'fc_lamp', crystal: 'fc_hang', well: 'fc_lamp' };
// `F`: where the strip goes ({ x0, x1, y0 }) and the door gap to keep bare ([from, to]).
const FACE_ROOM = { x0: 16, x1: VW - 16, y0: OY + 16, gap: [160, 224] };
function drawFacePx(b, room, theme, things, F) {
  F = F || FACE_ROOM;
  const th = THEMES[theme], A = th.a, B = th.b, C = th.c, s = room.seed | 0, y0 = F.y0, X0 = F.x0, X1 = F.x1;
  const gap = (x0, x1) => F.gap && x1 > F.gap[0] && x0 < F.gap[1];
  const put = (x, y, k) => { if (x >= X0 && x < X1) b.px[y * b.w + x] = p32(k); };
  for (let x = X0; x < X1; x++) { put(x, y0, '0'); put(x, y0 + 1, C); put(x, y0 + 14, A); put(x, y0 + 15, '0'); }
  for (let k = 0; k < 3; k++) {
    const ty = y0 + 2 + k * 4;
    let x = X0 - (hash(k, 1, s) % 7);
    while (x < X1) {
      const len = 5 + hash(x, k, s) % 5, h = hash(x, k + 7, s), lit = (h & 7) === 1, chip = (h & 7) === 2;
      for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) put(x + i, ty + j, i === len - 1 ? A : (j === 0 && (lit ? i < len - 2 : i < 2)) ? C : B);
        put(x + i, ty + 3, A);
      }
      if (chip) put(x + 1 + (h >>> 8) % (len - 2), ty + 1 + ((h >>> 12) & 1), A);
      x += len;
    }
  }
  // weathering along the foot
  const G = FACE_GROW[theme] || FACE_GROW.meadow, r = scnRand(s ^ 0xf00d);
  for (let x = X0 + 1; x < X1 - 1; x++) {
    if (r() > G.n || gap(x, x + 1)) continue;
    const hgt = 1 + Math.floor(r() * 3);
    for (let j = 0; j < hgt; j++) put(x, y0 + 14 - j, G.foot[j === hgt - 1 ? 0 : 1]);
  }
  const free = (x0, w) => x0 >= X0 + 4 && x0 + w <= X1 - 4 && !gap(x0, x0 + w) && !things.some(t => x0 < t.x + t.w + 6 && x0 + w + 6 > t.x);
  // ivy hanging from the top in the meadow, a fishing net on the shore
  if (G.ivy) for (let n = 0, m = Math.max(3, Math.round((X1 - X0) / 120)); n < m; n++) {
    const x = X0 + 4 + Math.floor(r() * (X1 - X0 - 8)), len = 5 + Math.floor(r() * 8);
    if (!free(x - 2, 5)) continue;
    for (let j = 0; j < len; j++) {
      const X = x + (((j + 1) >> 2) & 1);
      put(X, y0 + 1 + j, 'g');
      if (j % 2 === 1) put(X + (j % 4 === 1 ? -1 : 1), y0 + 1 + j, j % 4 === 1 ? 'G' : 'h');
    }
    put(x + 1, y0 + len, 'G');
  }
  if (G.net && r() < 0.6) {
    const w = 18 + Math.floor(r() * 10), x0 = X0 + 8 + Math.floor(r() * (X1 - X0 - 16 - w));
    if (free(x0, w)) {
      for (let j = 0; j < 11; j++) for (let i = 0; i < w; i++) {
        const sag = Math.round(Math.sin(Math.PI * i / (w - 1)) * 2);
        if (j > 8 + sag - (i % 3 === 0 ? 1 : 0)) continue;
        if ((i + j) % 4 === 0 || (i - j + 400) % 4 === 0) put(x0 + i, y0 + 2 + j, (i + j) % 8 === 0 ? 'n' : 'N');
      }
      for (let i = 0; i < w; i++) put(x0 + i, y0 + 2, 'n');
      things.push({ x: x0, w });
    }
  }
}
// Pick the face's things (before the stones are drawn, so ivy and nets keep clear of them).
function faceThings(room, theme) {
  const L = FACE_THINGS[theme] || FACE_THINGS.meadow, r = scnRand((room.seed | 0) ^ 0xface), out = [];
  const ok = (x, w) => x >= 22 && x + w <= VW - 22 && (x + w < 158 || x > 226) && !out.some(t => x < t.x + t.w + 10 && x + w + 10 > t.x);
  // lamps either side of a top door
  if (room.doors && room.doors.u && !hiddenDoor(room, 'u')) {
    const l = L.find(t => t[0] === FACE_LAMP[theme]) || ['fc_lamp', 1, 3, 9, [3, 3]];
    for (const x of [158 - l[3], 227]) out.push({ s: l[0], x, y: l[2], w: l[3], fl: l[4] });
  }
  const n = 3 + Math.floor(r() * 3);
  for (let k = 0, tries = 0; k < n && tries < 40; tries++) {
    const t = pickW(L.map(q => [q, q[1]]), r()), x = 22 + Math.floor(r() * (VW - 44 - t[3]));
    if (!ok(x, t[3])) continue;
    out.push({ s: t[0], x, y: t[2], w: t[3], fl: t[4] });
    k++;
  }
  return out;
}

// ---------- Obstacles, breakables and tall pieces per land ----------
const OBSTACLES = {
  meadow: ['rock_meadow', 'ob_stump', 'ob_stones', 'ob_lantern'],
  beach: ['rock_beach', 'ob_barnacle', 'ob_shell', 'ob_post'],
  crystal: ['rock_crystal', 'ob_cluster', 'ob_stalag', 'ob_ore'],
  well: ['rock_well', 'ob_pillar'],
};
const BREAKABLES = {
  meadow: ['brk_meadow', 'bk_pot', 'bk_hay'],
  beach: ['brk_beach', 'bk_crate', 'bk_amphora'],
  crystal: ['brk_crystal', 'bk_jar', 'bk_crate'],
  well: ['brk_well', 'bk_jar_well'],
};
// What flies when a breakable breaks.
const BRK_BITS = {
  brk_meadow: ['G', 'h', 'g'], bk_pot: ['n', 'N', 'G'], bk_hay: ['y', 'O', 'Y'],
  brk_beach: ['r', 'R', 'y'], bk_crate: ['N', 'n', 'O'], bk_amphora: ['n', 'N', 'O'],
  brk_crystal: ['2', '3', 'c'], bk_jar: ['C', 'c', 'q'], brk_well: ['2', '3', 'Y'], bk_jar_well: ['C', 'c', 'Y'],
  bk_vein: ['C', 'c', 'w', '3'],
};
// A land's own room shapes built of breakables are built of one kind (lands.js LAND_LAYOUTS).
const LAY_BRK = { maze: 'brk_meadow', wreck: 'bk_crate', vein: 'bk_vein' };
const TALL = {
  meadow: ['gi_tree', 'gi_tree', 'gi_bloom'],
  beach: ['gi_palm', 'gi_castle'],
  crystal: ['gi_spire', 'gi_spire_p'],
  well: ['gi_obelisk'],
};
// Each room uses two of a land's kinds, so a room looks planned rather than random.
function roomPick(list, room, salt, c, r) {
  const s = room.seed | 0, n = list.length, a = hash(salt, 1, s) % n, b = n > 1 ? (a + 1 + hash(salt, 2, s) % (n - 1)) % n : a;
  return list[(hash(c, r, s + salt) & 3) === 0 ? b : a];
}
function brkSprite(room, theme, c, r) { return LAY_BRK[room.lay] || roomPick(BREAKABLES[theme] || BREAKABLES.meadow, room, 31, c, r); }
function brkBits(room, theme, c, r) { return SCN_LANDS.has(theme) ? BRK_BITS[brkSprite(room, theme, c, r)] || ['2', '3', 'c'] : null; }

// ---------- Boss and arena floors: a ring laid into the ground ----------
const RING = {
  meadow: { line: 'G', dot: ['P', 'w', 'y'] },
  beach: { line: 'e', dot: ['q', 'o', 'w'] },
  crystal: { line: 'm', dot: ['c', 'C', 'q'] },
  well: { line: '1', dot: ['Y', 'w', 'c'] },
};
function drawRingPx(b, theme) {
  const R = RING[theme] || RING.meadow, cx = VW / 2, cy = OY + 112;
  for (let y = IN_Y0; y < IN_Y1; y++) for (let x = IN_X0; x < IN_X1; x++) {
    const dx = (x + 0.5 - cx) / 1.6, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy);
    if (Math.abs(d - 46) < 0.6 || Math.abs(d - 40) < 0.5) b.px[y * VW + x] = p32(R.line);
  }
  for (let k = 0; k < 16; k++) {
    const a = k / 16 * Math.PI * 2, x = Math.round(cx + Math.cos(a) * 43 * 1.6), y = Math.round(cy + Math.sin(a) * 43);
    glyph(b, _G('.x. xwx .x.'), x - 1, y - 1, { x: R.dot[k % 3], w: k % 2 ? 'w' : R.dot[(k + 1) % 3] });
  }
}

// Lily pads on the meadow's ponds (never on the bank or the water's edge).
function lilyPads(b, room) {
  const m = regionMask(room, (t) => t === T_PIT, 3, 0), r = scnRand((room.seed | 0) ^ 0x111);
  const pads = [_G('.GhhG.. GhHhhGg GGhhG.g .gGGgg.'), _G('..qPq.. .GPwPG. GhqPqGg .gGGgg.'), _G('.GhG. gGGg.')];
  const leaf = [p32('G'), p32('g'), p32('h')], pits = [];
  for (let i = 0; i < room.tiles.length; i++) if (room.tiles[i] === T_PIT) pits.push(i);
  for (let n = 0; n < pits.length; n++) {
    const t = pits[Math.floor(r() * pits.length)], u = r(), p = pads[u < 0.25 ? 1 : u < 0.55 ? 2 : 0];
    const x = (t % COLS) * 16 + Math.floor(r() * 12), y = OY + ((t / COLS) | 0) * 16 + Math.floor(r() * 12);
    if (r() > 0.5) continue;
    let ok = true;
    for (let j = -2; j <= p.length + 1 && ok; j++) for (let i = -2; i <= p[0].length + 1; i++) {
      if (!inM(m, x + i, y + j) || scnRun(m, x + i, y + j, 0, -1, 12) < 9 || leaf.includes(b.px[(y + j) * VW + x + i])) { ok = false; break; }
    }
    if (ok) glyph(b, p, x, y);
  }
}

// ---------- The room's base layer: ground, water, ridges, walls (baked when they change) ----------
const _ov = pixBuf(VW, VH), _ovCv = document.createElement('canvas');
_ovCv.width = VW; _ovCv.height = VH;
function baseKey(room, theme) {
  let k = theme;
  for (let i = 0; i < room.tiles.length; i++) { const t = room.tiles[i]; k += t === T_BRK || t >= T_PRISM ? 0 : t; }
  return k;
}
function bakeBase(room, theme) {
  const c = room.base || document.createElement('canvas');
  c.width = VW; c.height = VH;
  const g = c.getContext('2d'), groups = rockGroups(room), s = room.seed | 0;
  if (!room.ground || room.groundTheme !== theme) { room.ground = bakeGround(room, theme); room.groundTheme = theme; }
  g.drawImage(room.ground, 0, 0);
  // water, chasms, ridges and the face, per pixel
  _ov.px.fill(0);
  drawPitsPx(_ov, room, theme);
  if (theme === 'meadow') lilyPads(_ov, room);
  drawRidgesPx(_ov, room, theme, groups);
  const things = faceThings(room, theme);
  drawFacePx(_ov, room, theme, things);
  _ovCv.getContext('2d').putImageData(_ov.img, 0, 0);
  g.drawImage(_ovCv, 0, 0);
  // caps on every wall tile but the face
  const caps = capLayer(theme);
  g.drawImage(caps, 0, 0, VW, OY, 0, 0, VW, OY);
  for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) {
    const t = room.tiles[r * COLS + cc];
    if ((t !== T_WALL && t !== T_DOOR) || (r === 1 && cc > 0 && cc < COLS - 1)) continue;
    const h = Math.min(16, VH - OY - r * 16);
    g.drawImage(caps, cc * 16, OY + r * 16, 16, h, cc * 16, OY + r * 16, 16, h);
  }
  // cap rims against the floor
  const col = (slot) => PAL[THEMES[theme][slot]];
  g.fillStyle = PAL['0'];
  g.fillRect(15, OY + 16, 1, 176);
  g.fillRect(COLS * 16 - 16, OY + 16, 1, 176);
  g.fillRect(16, OY + 192, VW - 32, 1);
  g.fillStyle = col('9');
  g.fillRect(16, OY + 193, VW - 32, 1);
  g.fillRect(14, OY + 16, 1, 176);
  g.fillRect(COLS * 16 - 15, OY + 16, 1, 176);
  // things on the face
  room.lamps = [];
  for (const t of things) {
    if (!t.s) continue;
    blit(g, S(t.s), t.x, OY + 16 + t.y);
    if (t.fl) room.lamps.push([t.x + t.fl[0], OY + 16 + t.y + t.fl[1], hash(t.x, 4, s)]);
  }
  // soft shadow the walls cast on the floor, and into the corners of the top wall's face
  g.fillStyle = SHADOW;
  g.fillRect(16, OY + 32, VW - 32, 4);
  g.fillRect(16, OY + 36, 3, 156);
  g.fillRect(16, OY + 17, 3, 14);
  g.fillRect(16, OY + 17, 1, 14);
  g.fillRect(VW - 18, OY + 17, 2, 14);
  // tall pieces: their shadow goes on the ground, the piece itself is drawn with the actors
  room.tall = [];
  const TL = TALL[theme] || TALL.meadow;
  for (const q of groups) {
    if (q.kind !== 'giant') continue;
    const c0 = q.tiles[0] % COLS, r0 = (q.tiles[0] / COLS) | 0, x = c0 * 16 + 16, y = OY + r0 * 16 + 32;
    g.drawImage(ellipseSprite(36, 12, SHADOW), x - 18, y - 11);
    room.tall.push({ x, y, s: TL[hash(c0, r0, s + 5) % TL.length] });
  }
  return c;
}
// The tall pieces of a room, for the display list (main.js) and room slides.
function drawTall(t, ox, oy) { drawFeet(S(t.s), ox + t.x, oy + t.y); }
function drawTallTo(g, room, theme, ox, oy) { for (const t of room.tall || []) { const sp = S(t.s); blit(g, sp, ox + t.x - (sp.w >> 1), oy + t.y - sp.h); } }
// Flames in the lamps.
function drawSceneryLive(room, ox, oy) {
  if (!room.lamps) return;
  for (const [x, y, h] of room.lamps) drawS(S('fl_' + (Math.floor(G.time * 7 + (h & 7)) % 3)), ox + x, oy + y);
}

// ---------- Tall grass ----------
// Clumps on open floor in fight rooms, grown from the room's seed. Shots and rolls cut it
// (on the host); feet of heroes and walking foes standing in it hide in the blades.
// room.grass: 1 grass, 2 cut (a land's floor things keep off both), 0 none. A land keeps
// grass off its own floor pieces with LAND_MECH[id].noGrass(room, c, r). Nothing grows in
// the Star Well.
const GRASS_ROOMS = new Set(['normal', 'challenge', 'start']);
const GRASS_BITS = { meadow: ['G', 'h', 'g'], beach: ['G', 'h', 'H'], crystal: ['2', 'c', 'C'], well: ['1', '3', 'Y'] };
function growGrass(room, land) {
  if (!land || !SCN_LANDS.has(land.theme) || land.theme === 'well' || !GRASS_ROOMS.has(room.type)) return null;
  const m = LAND_MECH[land.id], skip = m && m.noGrass;
  const g = new Uint8Array(COLS * ROWS), s = room.seed | 0, lim = 0.64 + (hash(1, 1, s) % 100) / 100 * 0.1, cand = [];
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    const i = r * COLS + c;
    if (room.tiles[i] !== T_FLOOR) continue;
    // door approaches stay clear
    if ((c >= 10 && c <= 13 && (r <= 3 || r >= ROWS - 3)) || ((r === 6 || r === 7) && (c <= 2 || c >= COLS - 3))) continue;
    if (skip && skip(room, c, r)) continue;
    const v = vnoise(c, r, 3.3, s + 21);
    if (v > lim) cand.push([v, i]);
  }
  // a few patches, never a jungle
  cand.sort((a, b) => b[0] - a[0]);
  cand.length = Math.min(cand.length, 7 + hash(2, 1, s) % 6);
  for (const [, i] of cand) g[i] = 1;
  return cand.length ? g : null;
}
function grassAt(room, x, y) {
  if (!room.grass) return false;
  const c = Math.floor(x / 16), r = Math.floor((y - OY) / 16);
  return c >= 0 && r >= 0 && c < COLS && r < ROWS && room.grass[r * COLS + c] === 1;
}
// Host and solo only; clients hear about it through netFx.
function cutGrass(room, c, r) {
  const i = r * COLS + c;
  if (!room.grass || room.grass[i] !== 1) return;
  room.grass[i] = 2; room.dirty = true;
  const x = c * 16 + 8, y = OY + r * 16 + 10;
  burst(x, y - 4, 7, GRASS_BITS[G.floor.theme] || GRASS_BITS.meadow, 55, 0.45, { g: 120 });
  Audio_.sfx('cut');
  if (typeof netFx === 'function') netFx('grass', c, r);
  if (grand() < 0.05) spawnPickup('coin', x, y);
}
function cutGrassAt(room, x, y) { if (grassAt(room, x, y)) cutGrass(room, Math.floor(x / 16), Math.floor((y - OY) / 16)); }
// A co-op client's roll, which the host only sees in steps: cut along the way.
function cutGrassLine(room, x0, y0, x1, y1) {
  const n = Math.min(40, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4));
  for (let k = 0; k <= n; k++) cutGrassAt(room, x0 + (x1 - x0) * k / (n || 1), y0 - 2 + (y1 - y0) * k / (n || 1));
}
// Blades in front of the feet of someone standing in the grass.
function grassFront(o, ox, oy) {
  const room = G.room;
  if (!room.grass || o.dead || o.fly || (o.z || 0) > 3 || !grassAt(room, o.x, o.y - 1)) return;
  drawS(S('grassf_' + G.floor.theme), ox + Math.round(o.x) - 7, oy + Math.round(o.y) - 6);
}

// ---------- The room's static layer: the base plus what can break ----------
function renderRoomStatic(room, theme) {
  if (!SCN_LANDS.has(theme)) return renderRoomPlain(room, theme);
  if (!room.canvas) {
    room.canvas = document.createElement('canvas');
    room.canvas.width = VW; room.canvas.height = VH;
  }
  const key = baseKey(room, theme);
  if (room.baseKey !== key) { room.base = bakeBase(room, theme); room.baseKey = key; }
  const g = room.canvas.getContext('2d');
  g.clearRect(0, 0, VW, VH);
  g.drawImage(room.base, 0, 0);
  // lone rocks and breakables with contact shadows
  const OB = OBSTACLES[theme] || OBSTACLES.meadow;
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    const t = room.tiles[r * COLS + c];
    if (t !== T_BRK && t !== T_ROCK) continue;
    if (t === T_ROCK && (tileAt(room, c - 1, r) === T_ROCK || tileAt(room, c + 1, r) === T_ROCK || tileAt(room, c, r - 1) === T_ROCK || tileAt(room, c, r + 1) === T_ROCK)) continue;
    const x = c * 16, y = OY + r * 16;
    g.drawImage(ellipseSprite(14, 5, SHADOW), x + 1, y + 12);
    blit(g, S(t === T_ROCK ? roomPick(OB, room, 17, c, r) : brkSprite(room, theme, c, r)), x, y);
  }
  // a land's own pieces (prisms, bells, the clock's gate), as the tile renderer draws them
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    const t = room.tiles[r * COLS + c];
    if (t < T_PRISM || t === T_PUFF || t === T_ICE || t >= T_QSAND) continue;
    const x = c * 16, y = OY + r * 16, sp = S(tileArt(room, c, r, t));
    g.drawImage(ellipseSprite(14, 5, SHADOW), x + 1, y + 12);
    blit(g, sp, x, y + 16 - sp.h);
  }
  if (room.grass) for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    if (room.grass[r * COLS + c] === 1) blit(g, S('grass_' + theme + '_' + hash(c, r, room.seed | 0) % 3), c * 16, OY + r * 16 - 4);
  }
  room.dirty = false;
}

// ---------- The title screen: the meadow scrolling past under the garden wall ----------
// The ground is periodic in x (period VW), so it scrolls without a seam.
function vnoiseP(x, y, cell, seed, per) {
  const n = per / cell, fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy);
  let tx = fx - ix, ty = fy - iy;
  tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
  const i0 = ((ix % n) + n) % n, i1 = (i0 + 1) % n;
  const a = _u(hash(i0, iy, seed)), b = _u(hash(i1, iy, seed)), c = _u(hash(i0, iy + 1, seed)), d = _u(hash(i1, iy + 1, seed));
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}
function bakeTitleGround(h) {
  const R = SCN_GROUND.meadow, b = pixBuf(VW, h), s = 77, keys = [R.base, R.dark, R.light], r = scnRand(s);
  const cls = new Uint8Array(VW * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < VW; x++) {
    const n = vnoiseP(x, y, 48, s, VW) * 0.7 + vnoiseP(x, y, 16, s + 7, VW) * 0.24 + vnoiseP(x, y, 6, s + 9, VW) * 0.06;
    cls[y * VW + x] = n > R.hi ? 1 : n < R.lo ? 2 : 0;
  }
  for (let i = 0; i < cls.length; i++) b.px[i] = p32(keys[cls[i]]);
  // glyphs wrap around the strip's ends
  const put = (rows, x, y, map) => { glyph(b, rows, x, y, map); if (x + rows[0].length > VW) glyph(b, rows, x - VW, y, map); };
  for (let y = 0; y < h - 3; y += 7) for (let x = 0; x < VW; x += 8) {
    const gx = x + Math.floor(r() * 6), gy = y + Math.floor(r() * 5), k = keys[cls[gy * VW + (gx % VW)]], q = r();
    if (q < 0.42) put(TUFTS[Math.floor(r() * TUFTS.length)], gx, gy, { x: R.tuft[k] });
    else if (q < 0.6) b.px[gy * VW + (gx % VW)] = p32(R.speck[k]);
  }
  const D = SCN_DECALS.meadow;
  for (let k = 0; k < 7; k++) {
    const cx = r() * VW, cy = 10 + r() * (h - 24), pal = pickW(D.cluster, r());
    for (let i = 0, n = 5 + Math.floor(r() * 6); i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 12;
      put(r() < 0.75 ? pal : pickW(D.cluster, r()), Math.round(cx + Math.cos(a) * d * 1.4 + VW) % VW, Math.round(cy + Math.sin(a) * d));
    }
  }
  for (let k = 0; k < 14; k++) put(pickW(D.single, r()), Math.floor(r() * VW), Math.floor(4 + r() * (h - 12)));
  return bufCanvas(b);
}
// The wall along the top of the title screen, as wide as the screen.
function bakeTitleWall(w) {
  const b = pixBuf(w, 16), things = [], fake = { seed: 4242 };
  for (let x = 24 + (hash(1, 2, 3) % 40); x < w - 30; x += 70 + hash(x, 5, 6) % 50) {
    const t = FACE_THINGS.meadow[hash(x, 1, 9) % 2];
    things.push({ s: t[0], x, y: t[2], w: t[3] });
  }
  drawFacePx(b, fake, 'meadow', things, { x0: 0, x1: w, y0: 0, gap: null });
  const c = bufCanvas(b), g = c.getContext('2d');
  for (const t of things) if (t.s) blit(g, S(t.s), t.x, t.y);
  return c;
}
let _title = null;
function drawTitleScene(scroll) {
  const top = 40, h = SCR.h - SCR.oy - top + 8;
  if (!_title || _title.w !== SCR.w || _title.h < h) _title = { w: SCR.w, h, ground: bakeTitleGround(h), wall: bakeTitleWall(SCR.w), caps: capArea('meadow', SCR.w, 24 + SCR.oy, SCR.ox, SCR.oy) };
  const off = ((Math.floor(scroll) % VW) + VW) % VW;
  for (let x = -SCR.ox - VW + off; x < SCR.w - SCR.ox; x += VW) ctx.drawImage(_title.ground, x, top);
  return _title;
}
function drawTitleWall() {
  ctx.drawImage(_title.caps, -SCR.ox, -SCR.oy);
  ctx.drawImage(_title.wall, -SCR.ox, 24);
}
