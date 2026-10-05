'use strict';
// Wildgrove art, all drawn from code with PAL colours: ground textures, soft edges between grounds,
// animated water and lava, oblique wall blocks, trees, rocks, plants, crops, furniture and item icons.
// Light always comes from the top left; every standing thing has a 1px '0' outline.
const WGA = { cache: Object.create(null), ov: Object.create(null), wall: Object.create(null) };
function wgCv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
const wgCol = (k) => PAL[k] || k;
function wgPx(g, x, y, k) { g.fillStyle = wgCol(k); g.fillRect(x, y, 1, 1); }
function wgRc(g, x, y, w, h, k) { g.fillStyle = wgCol(k); g.fillRect(x, y, w, h); }
function wgRng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// A shaded ellipse: the ramp's four tones fall from the top left to the bottom right.
function wgBlob(g, cx, cy, rx, ry, ramp, bias) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy > 1) continue;
    const s = -(dx * 0.62 + dy * 0.78) + (bias || 0);
    wgPx(g, x, y, ramp[s > 0.5 ? 3 : s > 0.0 ? 2 : s > -0.55 ? 1 : 0]);
  }
}
// 1px deep-indigo outline around every opaque pixel (4-neighbour), drawn into the transparent ring.
function wgOutline(c, col) {
  const w = c.width, h = c.height, g = c.getContext('2d'), d = g.getImageData(0, 0, w, h).data, o = g.getImageData(0, 0, w, h);
  const a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 8;
  const [r, gg, b] = [0x2b, 0x1a, 0x47];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a(x, y)) continue;
    if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) { const i = (y * w + x) * 4; o.data[i] = r; o.data[i + 1] = gg; o.data[i + 2] = b; o.data[i + 3] = 255; }
  }
  g.putImageData(o, 0, 0);
  return c;
}
function wgMake(name, w, h, fn, outline) {
  const [c, g] = wgCv(w, h);
  fn(g, w, h);
  if (outline !== false) wgOutline(c);
  WGA.cache[name] = c;
  return c;
}
const wgSpr = (n) => WGA.cache[n];

// ---------- Ground textures ----------
function wgGroundTex(gid, v, tone) {
  tone = tone || 0;
  const se0 = (GROUND[gid].id === 'grass' || GROUND[gid].id === 'jungle') && WGS.dim === 'o' ? wgSeason() : 0; // autumn and winter recolour the leaves of the ground
  const key = 'g' + gid + '_' + v + (tone ? 't' + tone : '') + (se0 > 1 ? 's' + se0 : '');
  if (WGA.cache[key]) return WGA.cache[key];
  const gr = GROUND[gid], R = se0 === 2 ? ['#6f7a2a', '#98932f', '#b8a23a', '#d9892b'] : se0 === 3 ? ['#5f8f78', '#a4c9b8', '#d3e8e2', '#ffffff'] : gr.ramp, rng = wgRng(gid * 131 + v * 17 + 7), [c, g] = wgCv(16, 16);
  const base = { cloud: 1, dirt: 1, mud: 0, snow: 2, ice: 1, cave: 0, path: 1, tilled: 1, ash: 1, moss: 1, rock: 1, sand: 1, grass: 1, jungle: 1, deep: 1, shallow: 1, lava: 1 }[gr.id];
  const sc = (n, col, w, h) => { for (let i = 0; i < n; i++) wgRc(g, Math.floor(rng() * 16), Math.floor(rng() * 16), w || 1, h || 1, col); };
  const b = base === undefined ? 1 : base;
  wgRc(g, 0, 0, 16, 16, R[b]);
  switch (gr.id) {
    case 'grass': case 'jungle': {
      sc(5, R[0]); sc(2, R[2]);
      // tufts: a 3 px blade fan, darker at the root
      for (let i = 0; i < 1; i++) { const x = 1 + Math.floor(rng() * 13), y = 3 + Math.floor(rng() * 11); wgPx(g, x, y, R[0]); wgPx(g, x - 1, y - 1, R[2]); wgPx(g, x + 1, y - 1, R[2]); wgPx(g, x, y - 1, R[3]); }
      break;
    }
    case 'sand': sc(8, R[0]); sc(5, R[2]); sc(1, R[3]); for (let i = 0; i < 2; i++) { const x = Math.floor(rng() * 14), y = Math.floor(rng() * 14); wgRc(g, x, y, 2, 1, R[0]); wgPx(g, x, y - 1, R[2]); } break;
    case 'dirt': case 'path': sc(8, R[0]); sc(5, R[2]); sc(2, R[3]); for (let i = 0; i < 2; i++) { const x = Math.floor(rng() * 13), y = Math.floor(rng() * 13); wgRc(g, x, y, 2, 2, R[3]); wgRc(g, x + 1, y + 1, 1, 1, R[0]); } break;
    case 'snow': sc(14, R[1]); sc(10, R[3]); sc(3, 'c'); break;
    case 'rock': {
      sc(10, R[0]); sc(12, R[2]); sc(3, R[3]);
      for (let i = 0; i < 2; i++) { const x = Math.floor(rng() * 10) + 2, y = Math.floor(rng() * 12) + 2; wgRc(g, x, y, 4, 1, R[0]); wgPx(g, x + 4, y + 1, R[0]); wgRc(g, x + 1, y + 1, 3, 1, R[2]); }
      break;
    }
    case 'mud': sc(16, R[1]); sc(8, R[0]); sc(4, R[2]); if (rng() < 0.6) { const x = 2 + Math.floor(rng() * 9), y = 2 + Math.floor(rng() * 9); wgRc(g, x, y, 4, 2, R[2]); wgRc(g, x + 1, y, 2, 1, R[3]); } break;
    case 'ash': sc(7, R[0]); sc(5, R[2]); sc(2, R[3]); if (v === 1 || v === 3) { let x = 1 + Math.floor(rng() * 6), y = 2 + Math.floor(rng() * 10); for (let i = 0; i < 7; i++) { wgPx(g, x, y, i % 3 ? 'o' : 'O'); x += 1 + (rng() < 0.4 ? 1 : 0); y += rng() < 0.5 ? 1 : rng() < 0.5 ? -1 : 0; } } break; // glowing cracks
    case 'moss': sc(7, R[2]); sc(5, R[0]); sc(3, R[3]); break;
    case 'cave': sc(14, R[1]); sc(8, R[2]); sc(2, R[3]); break;
    case 'cloud': sc(10, R[2]); sc(6, R[0]); sc(3, R[3]); for (let i = 0; i < 2; i++) { const x = Math.floor(rng() * 11), y = Math.floor(rng() * 13); wgRc(g, x, y, 4, 1, R[3]); wgRc(g, x + 1, y + 1, 3, 1, R[2]); } break;
    case 'ice': for (let i = 0; i < 3; i++) { const x = Math.floor(rng() * 12), y = Math.floor(rng() * 14); wgRc(g, x, y, 4, 1, R[2]); wgPx(g, x + 4, y + 1, R[3]); } sc(4, R[3]); break;
    case 'tilled': for (let y = 2; y < 16; y += 5) { wgRc(g, 0, y, 16, 2, R[0]); wgRc(g, 0, y + 2, 16, 1, R[2]); } sc(10, R[3]); break;
    case 'deep': case 'shallow': case 'lava': break; // drawn as animated backdrop
    case 'f_wood': {
      wgRc(g, 0, 0, 16, 16, R[1]);
      for (let y = 0; y < 16; y += 4) { wgRc(g, 0, y, 16, 1, R[0]); wgRc(g, 0, y + 1, 16, 1, R[2]); const sx = (y * 5 + v * 7) % 12 + 2; wgRc(g, sx, y, 1, 4, R[0]); }
      sc(5, R[3]); break;
    }
    case 'f_stone': {
      wgRc(g, 0, 0, 16, 16, R[1]);
      wgRc(g, 0, 0, 16, 1, R[0]); wgRc(g, 0, 8, 16, 1, R[0]); wgRc(g, 0, 0, 1, 8, R[0]); wgRc(g, 8, 8, 1, 8, R[0]);
      wgRc(g, 1, 1, 7, 1, R[3]); wgRc(g, 9, 9, 7, 1, R[3]); wgRc(g, 1, 9, 7, 1, R[2]); wgRc(g, 9, 1, 7, 1, R[2]);
      sc(6, R[2]); sc(4, R[0]); break;
    }
    case 'f_brick': {
      wgRc(g, 0, 0, 16, 16, R[1]);
      for (let y = 0; y < 16; y += 4) { wgRc(g, 0, y, 16, 1, R[0]); wgRc(g, 0, y + 1, 16, 1, R[2]); const o = (y / 4) % 2 ? 4 : 0; wgRc(g, (o + 4) % 16, y, 1, 4, R[0]); wgRc(g, (o + 12) % 16, y, 1, 4, R[0]); }
      sc(5, R[3]); break;
    }
    case 'f_red': case 'f_blue': case 'f_green': {
      wgRc(g, 0, 0, 16, 16, R[1]);
      wgRc(g, 0, 0, 16, 1, R[0]); wgRc(g, 0, 15, 16, 1, R[0]); wgRc(g, 0, 0, 1, 16, R[0]); wgRc(g, 15, 0, 1, 16, R[0]);
      wgRc(g, 2, 2, 12, 1, R[3]); wgRc(g, 2, 13, 12, 1, R[3]); wgRc(g, 2, 2, 1, 12, R[3]); wgRc(g, 13, 2, 1, 12, R[3]);
      wgRc(g, 6, 6, 4, 4, R[2]); wgPx(g, 7, 7, R[3]); sc(4, R[2]); break;
    }
  }
  if (tone) { // broad patches of shade (1) and sun (2): a loose pixel dither over the base
    const col = tone === 1 ? R[0] : R[2];
    for (let y = 0; y < 16; y += 2) for (let x = 0; x < 16; x += 2) if (((x + y) >> 1) % 2 === 0 && rng() < 0.5) wgRc(g, x + (rng() < 0.3 ? 1 : 0), y, 1, 1, col);
  }
  WGA.cache[key] = c;
  return c;
}
// animated liquid: 4 frames of a 32x32 tile so the pattern does not repeat visibly
function wgLiquid(kind, f) {
  const key = 'liq_' + kind + f;
  if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(32, 32), rng = wgRng(kind === 'lava' ? 91 : 53);
  const R = kind === 'lava' ? ['r', 'o', 'O', 'y'] : kind === 'shallow' ? ['B', 'c', 'C', 'w'] : ['b', 'B', 'c', 'C'];
  wgRc(g, 0, 0, 32, 32, R[1]);
  const spots = [];
  for (let i = 0; i < 22; i++) spots.push([Math.floor(rng() * 32), Math.floor(rng() * 32), 3 + Math.floor(rng() * 4)]);
  for (const [x, y, w] of spots) { // wave streaks drift sideways; the frame moves them one pixel
    const xx = (x + f) % 32;
    wgRc(g, xx, y, w, 1, R[0]); wgRc(g, (xx + 1) % 32, (y + 1) % 32, w - 1, 1, R[2]);
    if (w > 4) wgPx(g, (xx + 2) % 32, (y + 2) % 32, R[3]);
  }
  for (let i = 0; i < 10; i++) wgPx(g, Math.floor(rng() * 32), Math.floor(rng() * 32), R[0]);
  if (kind === 'lava') for (let i = 0; i < 6; i++) { const x = (Math.floor(rng() * 28) + f * 2) % 32, y = Math.floor(rng() * 30); wgRc(g, x, y, 3, 1, 'y'); wgPx(g, x + 1, y + 1, 'O'); }
  else if (f % 2 === 0) for (let i = 0; i < 4; i++) wgPx(g, Math.floor(rng() * 32), Math.floor(rng() * 32), 'w');
  WGA.cache[key] = c;
  return c;
}

// Edge bleed: a higher priority neighbour grows into this tile with a wobbly rim.
// nbits: bit0..7 = N, E, S, W, NE, SE, SW, NW (does the neighbour of type `nid` sit there).
const WG_D8 = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];
function wgOverlay(nid, nbits, v, foam) {
  const key = nid + '_' + nbits + '_' + v + (foam ? 'f' : '');
  let c = WGA.ov[key];
  if (c) return c;
  const [cv, g] = wgCv(16, 16), tex = wgGroundTex(nid, v), rng = wgRng(nbits * 31 + nid);
  const td = tex.getContext('2d').getImageData(0, 0, 16, 16).data;
  const out = g.getImageData(0, 0, 16, 16);
  const W = 2.6, noise = [];
  for (let i = 0; i < 256; i++) noise.push(rng() * 1.6 - 0.8);
  const dist = (x, y) => {
    let best = 99;
    for (let k = 0; k < 8; k++) {
      if (!(nbits & (1 << k))) continue;
      const [dx, dy] = WG_D8[k];
      // distance from the pixel centre to that neighbour cell's rectangle
      const rx0 = dx < 0 ? -16 : dx > 0 ? 16 : 0, rx1 = dx < 0 ? 0 : dx > 0 ? 32 : 16, ry0 = dy < 0 ? -16 : dy > 0 ? 16 : 0, ry1 = dy < 0 ? 0 : dy > 0 ? 32 : 16;
      const ex = Math.max(rx0 - (x + 0.5), 0, (x + 0.5) - rx1), ey = Math.max(ry0 - (y + 0.5), 0, (y + 0.5) - ry1);
      best = Math.min(best, Math.sqrt(ex * ex + ey * ey));
    }
    return best;
  };
  const col = (k) => { const h = wgCol(k); return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = dist(x, y), n = d - noise[y * 16 + x] * 0.9, i = (y * 16 + x) * 4;
    if (n < W) {
      if (n > W - 1.05 && n >= 0) { // the rim: a darker line on land, foam on water
        const rc = foam ? col('w') : col(GROUND[nid].ramp[0]);
        out.data[i] = rc[0]; out.data[i + 1] = rc[1]; out.data[i + 2] = rc[2]; out.data[i + 3] = foam ? 255 : 200;
      } else { out.data[i] = td[i]; out.data[i + 1] = td[i + 1]; out.data[i + 2] = td[i + 2]; out.data[i + 3] = 255; }
    } else if (foam && n < W + 1.35) { // a pale band of surf a pixel outside
      const rc = col('C'); out.data[i] = rc[0]; out.data[i + 1] = rc[1]; out.data[i + 2] = rc[2]; out.data[i + 3] = ((x + y) & 1) ? 255 : 120;
    }
  }
  g.putImageData(out, 0, 0);
  WGA.ov[key] = cv;
  return cv;
}

// ---------- Oblique wall blocks ----------
// A block is 16 wide and 22 tall: the top face covers the tile shifted up 6px, the front face shows 6px below it.
// mask: bit0 N, bit1 E, bit2 S, bit3 W = a wall (of any kind) stands on that side.
function wgWallMat(o) {
  const id = o.id;
  return /wood|^door|^fence/.test(id) ? 'wood' : /brick/.test(id) ? 'brick' : /sand/.test(id) ? 'sand' : /ice/.test(id) ? 'ice' : /glass/.test(id) ? 'glass' : /iron/.test(id) ? 'iron' : o.ore ? 'ore' : 'stone';
}
function wgWall(oid, mask, v) {
  const key = oid + '_' + mask + '_' + (v | 0);
  if (WGA.wall[key]) return WGA.wall[key];
  const o = OBJ[oid], R = o.ramp, mat = wgWallMat(o), [c, g] = wgCv(16, 22), rng = wgRng(oid * 13 + mask * 3 + (v | 0) * 101);
  const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
  const sc = (n, k, x0, y0, w, h) => { for (let i = 0; i < n; i++) wgPx(g, x0 + Math.floor(rng() * w), y0 + Math.floor(rng() * h), k); };
  // top face
  wgRc(g, 0, 0, 16, 16, R[2]);
  if (mat === 'stone' || mat === 'ore' || mat === 'sand') {
    sc(12, R[3], 0, 0, 16, 16); sc(9, R[1], 0, 0, 16, 16);
    for (let i = 0; i < 2; i++) { const x = 2 + Math.floor(rng() * 9), y = 3 + Math.floor(rng() * 10); wgRc(g, x, y, 4, 1, R[1]); wgPx(g, x + 4, y + 1, R[1]); wgRc(g, x, y - 1, 3, 1, R[3]); }
    if (mat === 'ore') { const oc = o.ore; for (let i = 0; i < 3; i++) { const x = 1 + Math.floor(rng() * 12), y = 1 + Math.floor(rng() * 12); wgRc(g, x, y, 3, 2, oc[1]); wgPx(g, x, y, oc[3]); wgPx(g, x + 2, y + 1, oc[0]); wgPx(g, x + 1, y + 2, oc[0]); } }
  } else if (mat === 'wood') {
    for (let y = 0; y < 16; y += 4) { wgRc(g, 0, y, 16, 1, R[1]); wgRc(g, 0, y + 1, 16, 1, R[3]); wgRc(g, (y * 3 + 5) % 14 + 1, y + 2, 1, 2, R[1]); }
    sc(5, R[3], 0, 0, 16, 16);
  } else if (mat === 'brick') {
    for (let y = 0; y < 16; y += 4) { wgRc(g, 0, y, 16, 1, R[1]); const off = (y / 4) % 2 ? 4 : 0; for (let x = off; x < 16 + off; x += 8) wgRc(g, x % 16, y, 1, 4, R[1]); wgRc(g, 0, y + 1, 16, 1, R[3]); }
  } else if (mat === 'ice' || mat === 'glass') {
    wgRc(g, 0, 0, 16, 16, mat === 'glass' ? 'C' : R[2]);
    for (let i = 0; i < 3; i++) { const x = 1 + i * 5, y = 1 + (i * 7) % 9; for (let k = 0; k < 5; k++) wgPx(g, x + k, y + k, 'w'); }
    sc(4, 'w', 0, 0, 16, 16);
  } else if (mat === 'iron') {
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) { wgPx(g, x, y, R[3]); wgPx(g, x + 1, y + 1, R[0]); }
    wgRc(g, 0, 7, 16, 1, R[1]); wgRc(g, 7, 0, 1, 16, R[1]); wgRc(g, 0, 8, 16, 1, R[3]);
  }
  if (!N) { wgRc(g, 0, 1, 16, 1, R[3]); }
  if (!W) { wgRc(g, 1, 0, 1, 16, R[3]); }
  if (!E) { wgRc(g, 14, 1, 1, 15, R[1]); }
  // front face (only drawn where nothing stands south)
  if (!S) {
    wgRc(g, 0, 16, 16, 6, R[1]);
    wgRc(g, 0, 16, 16, 1, R[2]); wgRc(g, 0, 20, 16, 2, R[0]);
    if (mat === 'brick') { wgRc(g, 0, 18, 16, 1, R[0]); wgRc(g, 4, 16, 1, 2, R[0]); wgRc(g, 12, 16, 1, 2, R[0]); wgRc(g, 8, 19, 1, 1, R[0]); wgRc(g, 0, 17, 16, 1, R[2]); }
    else if (mat === 'wood') { for (const x of [3, 7, 11]) wgRc(g, x, 17, 1, 3, R[0]); wgRc(g, 0, 17, 16, 1, R[2]); sc(3, R[2], 0, 17, 16, 3); }
    else if (mat === 'ice' || mat === 'glass') { wgRc(g, 0, 16, 16, 5, mat === 'glass' ? 'c' : R[1]); wgRc(g, 0, 17, 6, 1, 'w'); wgRc(g, 0, 20, 16, 2, R[0]); }
    else if (mat === 'iron') { wgRc(g, 0, 18, 16, 1, R[0]); wgPx(g, 2, 17, R[3]); wgPx(g, 13, 17, R[3]); }
    else { for (const x of [5, 11]) wgRc(g, x, 17, 1, 3, R[0]); sc(4, R[2], 0, 17, 16, 3); sc(3, R[0], 0, 17, 16, 3); if (mat === 'ore') { const oc = o.ore; wgRc(g, 2 + (v | 0) % 5, 17, 2, 2, oc[1]); wgPx(g, 2 + (v | 0) % 5, 17, oc[3]); } }
  }
  // outline on every exposed side
  wgRc(g, 0, 0, 16, 0, '0');
  if (!N) wgRc(g, 0, 0, 16, 1, '0');
  const bot = S ? 15 : 21;
  if (!W) wgRc(g, 0, 0, 1, bot + 1, '0');
  if (!E) wgRc(g, 15, 0, 1, bot + 1, '0');
  if (!S) wgRc(g, 0, 21, 16, 1, '0');
  // rounded corners where two sides are exposed
  if (!N && !W) g.clearRect(0, 0, 1, 1);
  if (!N && !E) g.clearRect(15, 0, 1, 1);
  if (!S && !W) g.clearRect(0, 21, 1, 1);
  if (!S && !E) g.clearRect(15, 21, 1, 1);
  WGA.wall[key] = c;
  return c;
}

// ---------- Natural objects ----------
// Every sprite is drawn bottom-centred on its tile: WGA.obj[id] = [canvas variants, ox, oy].
WGA.obj = Object.create(null);
function wgReg(id, list, anchorW, anchorH) { WGA.obj[id] = list.map(c => ({ c, ox: 8 - (c.width >> 1), oy: 16 - c.height })); }
function wgLine(g, x0, y0, x1, y1, k) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) wgPx(g, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), k);
}
function wgTrunk(g, cx, y0, y1, w, R, flare) {
  for (let y = y0; y <= y1; y++) {
    const f = flare && y > y1 - 3 ? (y - (y1 - 3)) : 0, hw = w / 2 + f * 0.8;
    for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) {
      const rel = (x - (cx - hw)) / (hw * 2);
      wgPx(g, x, y, rel < 0.28 ? R[2] : rel < 0.68 ? R[1] : R[0]);
    }
  }
}
function wgCrown(g, blobs, R, rng) {
  for (const [cx, cy, rx, ry] of blobs) wgBlob(g, cx, cy, rx, ry, R);
  // leaf specks
  for (let i = 0; i < 26; i++) {
    const [cx, cy, rx, ry] = blobs[Math.floor(rng() * blobs.length)], a = rng() * 6.283, d = rng() * 0.8;
    const x = Math.round(cx + Math.cos(a) * rx * d), y = Math.round(cy + Math.sin(a) * ry * d);
    wgPx(g, x, y, (x - cx) + (y - cy) < 0 ? R[3] : R[0]);
  }
}
function wgBuildNature() {
  for (let v = 0; v < 2; v++) {
    const j = (a) => a + (v ? 1 : 0);
    // oak: a rounded crown of lumps over a gnarled trunk
    wgReg('oak', [...(WGA.obj.oak || []).map(o => o.c), wgMake('oak' + v, 32, 40, (g) => {
      const rng = wgRng(11 + v); wgTrunk(g, 16, 25, 38, 6, ['u', 'n', 'N', 'O'], true);
      wgPx(g, 13, 29, 'u'); wgPx(g, 18, 33, 'u');
      wgCrown(g, [[j(21), 15, 8, 6], [10, 17, 7, 6], [22, 17, 7, 6], [16, 20, 10, 5], [11, 10, 8, 7], [21, 10, 8, 7], [16, 8, 9, 7]], ['g', 'G', 'h', 'H'], rng);
    })]);
    wgReg('birch', [...(WGA.obj.birch || []).map(o => o.c), wgMake('birch' + v, 28, 40, (g) => {
      const rng = wgRng(21 + v);
      wgTrunk(g, 14, 20, 38, 4, ['m', 'l', 'L', 'w'], true);
      for (const y of [23, 27, 31, 35]) { wgRc(g, 12 + (y % 3), y, 2, 1, '0'); }
      wgCrown(g, [[14, 9, 8, 7], [8, 14, 6, 6], [20, 14, 6, 6], [14, 17, 8, 5]], ['G', 'h', 'H', 'Y'], rng);
    })]);
    wgReg('pine', [...(WGA.obj.pine || []).map(o => o.c), wgMake('pine' + v, 26, 44, (g) => {
      wgTrunk(g, 13, 36, 42, 4, ['u', 'n', 'N', 'O'], true);
      const R = ['z', 'g', 'G', 'h'];
      for (const [apex, h, hw] of [[1, 13, 6], [9, 14, 8], [18, 15, 10]]) {
        for (let r = 0; r < h; r++) {
          const w = Math.round(hw * (r + 1) / h) + (r > h - 3 ? 1 : 0) - (r === h - 1 && v ? 1 : 0), y = apex + r;
          for (let x = 13 - w; x <= 13 + w; x++) {
            const rel = (x - (13 - w)) / Math.max(1, w * 2);
            wgPx(g, x, y, (r === h - 1 && ((x + v) & 1)) || rel > 0.78 ? R[0] : rel < 0.22 || r < 2 ? R[2] : R[1]);
          }
          if (r % 4 === 3) wgPx(g, 13 - w + 2, y, R[3]);
        }
      }
    })]);
    wgReg('snowpine', [...(WGA.obj.snowpine || []).map(o => o.c), wgMake('snowpine' + v, 26, 44, (g) => {
      wgTrunk(g, 13, 36, 42, 4, ['u', 'n', 'N', 'O'], true);
      for (const [apex, h, hw] of [[1, 13, 6], [9, 14, 8], [18, 15, 10]]) {
        for (let r = 0; r < h; r++) {
          const w = Math.round(hw * (r + 1) / h) + (r > h - 3 ? 1 : 0), y = apex + r;
          for (let x = 13 - w; x <= 13 + w; x++) {
            const rel = (x - (13 - w)) / Math.max(1, w * 2), top = r < Math.ceil(h * 0.55) - (v ? 1 : 0);
            wgPx(g, x, y, top ? (rel > 0.8 ? 'm' : rel < 0.25 ? 'w' : 'L') : (rel > 0.75 ? 'z' : rel < 0.25 ? 'G' : 'g'));
          }
        }
      }
    })]);
    wgReg('palm', [...(WGA.obj.palm || []).map(o => o.c), wgMake('palm' + v, 32, 40, (g) => {
      const lean = v ? -1 : 1;
      for (let y = 38; y >= 14; y--) { const t = (38 - y) / 24, x = Math.round(15 + lean * Math.sin(t * 1.3) * 5); wgRc(g, x, y, 4, 1, 'N'); wgPx(g, x, y, 'O'); wgPx(g, x + 3, y, 'n'); wgPx(g, x + 2, y, 'n'); if (y % 3 === 0) wgRc(g, x + 1, y, 2, 1, 'u'); }
      const tx = Math.round(15 + lean * Math.sin(1.3) * 5) + 1, ty = 14;
      const fr = [[-15, -1], [-12, -8], [-6, -12], [4, -12], [12, -8], [15, -1], [-11, 4], [11, 4], [0, -14]];
      for (const [fx, fy] of fr) {
        for (let i = 0; i <= 16; i++) {
          const t = i / 16, x = Math.round(tx + fx * t), y = Math.round(ty + fy * t + Math.sin(t * 3.14) * -3 + t * t * 8);
          wgPx(g, x, y, t < 0.55 ? 'G' : 'g'); wgPx(g, x, y + 1, 'g'); wgPx(g, x + (fx > 0 ? -1 : 1), y + 1, 'g'); if (i % 2 === 1) wgPx(g, x, y - 1, 'h'); if (i % 4 === 2) wgPx(g, x, y + 2, 'g');
        }
      }
      wgBlob(g, tx, ty + 1, 2.5, 2.5, ['n', 'N', 'O', 'Y']); wgPx(g, tx - 2, ty + 3, 'n'); wgPx(g, tx + 2, ty + 3, 'n');
    })]);
    wgReg('jungle', [...(WGA.obj.jungle || []).map(o => o.c), wgMake('jungle' + v, 40, 48, (g) => {
      const rng = wgRng(61 + v);
      wgTrunk(g, 20, 28, 46, 8, ['u', 'n', 'N', 'O'], true);
      for (const y of [31, 35, 40]) wgRc(g, 17 + (y % 4), y, 3, 1, 'u');
      wgCrown(g, [[20, 9, 11, 8], [9, 15, 9, 8], [31, 15, 9, 8], [20, 19, 13, 7], [11, 24, 7, 4], [29, 24, 7, 4], [15, 12, 9, 6], [26, 12, 9, 6]], ['z', 'g', 'G', 'h'], rng);
      for (const [x, y] of [[8, 20], [30, 21], [16, 26], [24, 25]]) { wgRc(g, x, y, 1, 6 + (x % 3), 'G'); wgPx(g, x, y + 6 + (x % 3), 'h'); }
      for (const [x, y] of [[14, 8], [26, 10], [20, 15], [9, 17]]) { wgPx(g, x, y, 'P'); wgPx(g, x + 1, y, 'q'); }
    })]);
    wgReg('dead', [...(WGA.obj.dead || []).map(o => o.c), wgMake('dead' + v, 28, 36, (g) => {
      wgTrunk(g, 14, 18, 34, 4, ['x', 'u', 'n', 'N'], true);
      const br = v ? [[-9, -9], [8, -11], [-5, -17], [4, -6]] : [[-10, -7], [9, -9], [3, -16], [-4, -3]];
      for (const [bx, by] of br) { wgLine(g, 14, 22 + (bx > 0 ? 2 : 4), 14 + bx, 22 + by + 4, 'u'); wgLine(g, 15, 22 + (bx > 0 ? 2 : 4), 15 + bx, 22 + by + 4, 'n'); }
    })]);
    wgReg('willow', [...(WGA.obj.willow || []).map(o => o.c), wgMake('willow' + v, 36, 44, (g) => {
      const rng = wgRng(71 + v);
      wgTrunk(g, 18, 18, 42, 6, ['u', 'n', 'N', 'O'], true);
      wgCrown(g, [[18, 9, 12, 7], [9, 14, 8, 6], [27, 14, 8, 6]], ['t', 'g', 'G', 'h'], rng);
      for (let x = 5; x < 32; x += 2) { const len = 8 + ((x * 7 + v * 3) % 9); for (let i = 0; i < len; i++) wgPx(g, x, 14 + i, i > len - 3 ? 'h' : (x % 4 ? 'G' : 'g')); }
    })]);
    wgReg('cactus', [...(WGA.obj.cactus || []).map(o => o.c), wgMake('cactus' + v, 20, 26, (g) => {
      const R = ['g', 'G', 'h', 'H'];
      wgRc(g, 7, 4, 6, 21, R[1]); wgRc(g, 7, 4, 2, 21, R[2]); wgRc(g, 11, 4, 2, 21, R[0]); wgRc(g, 8, 3, 4, 1, R[2]);
      for (let y = 6; y < 24; y += 3) wgPx(g, 10, y, R[0]);
      const arm = (side, y) => { const x = side < 0 ? 2 : 13; wgRc(g, x, y, 5, 3, R[1]); wgRc(g, side < 0 ? 2 : 16, y - 5, 2 + 1, 6, R[1]); wgPx(g, side < 0 ? 2 : 16, y - 5, R[2]); wgRc(g, side < 0 ? 4 : 18, y - 5, 1, 7, R[0]); };
      if (v) { arm(-1, 14); arm(1, 10); } else arm(1, 13);
      wgPx(g, 9, 2, 'P'); wgPx(g, 10, 2, 'q'); wgPx(g, 10, 3, 'y');
    })]);
  }
  wgReg('bigmush', [wgMake('bigmush', 34, 40, (g) => {
    wgRc(g, 14, 18, 7, 20, 'l'); wgRc(g, 14, 18, 2, 20, 'L'); wgRc(g, 19, 18, 2, 20, 'm'); wgRc(g, 13, 36, 9, 2, 'm');
    wgBlob(g, 17, 12, 15, 10, ['p', 'r', 'R', 'q']); wgRc(g, 4, 18, 26, 2, 'p');
    for (const [x, y, r] of [[9, 9, 2], [20, 6, 3], [26, 13, 2], [14, 14, 2], [6, 15, 1]]) wgBlob(g, x, y, r, r, ['l', 'L', 'w', 'w']);
  })]);
  for (const t of ['oak', 'birch', 'pine', 'palm', 'jungle']) {
    const big = WGA.obj[t][0].c;
    wgReg('sap_' + t, [wgMake('sap_' + t, 14, 16, (g) => {
      const R = t === 'pine' ? ['z', 'g', 'G', 'h'] : ['g', 'G', 'h', 'H'];
      wgRc(g, 6, 9, 2, 6, 'n'); wgBlob(g, 7, 6, 5, 5, R); wgPx(g, 4, 7, R[3]); wgPx(g, 10, 5, R[0]); wgPx(g, 7, 2, R[3]);
    })]);
  }
  // rocks and ores
  const stone = (id, ramp, w, h, fn) => wgReg(id, [0, 1].map(v => wgMake(id + v, w, h, (g) => {
    const rng = wgRng(id.length * 31 + v * 7);
    wgBlob(g, w / 2, h - 7 + (v ? 1 : 0), w / 2 - 1, 6.5, ramp); wgRc(g, 3, h - 3, w - 6, 2, ramp[0]);
    wgBlob(g, w / 2 - 2, h - 9, 4, 3, ramp, 0.5);
    if (fn) fn(g, rng, v);
  })));
  stone('boulder', ['d', 'm', 'l', 'L'], 18, 16, (g, rng, v) => { wgLine(g, 8, 7, 10, 11, 'd'); wgLine(g, 10, 11, 9, 13, 'd'); wgPx(g, 5, 8, 'L'); if (v) wgLine(g, 12, 8, 13, 10, 'd'); });
  const ore = (id, base, fl) => stone(id, base, 18, 16, (g, rng) => { for (let i = 0; i < 5; i++) { const x = 4 + Math.floor(rng() * 10), y = 5 + Math.floor(rng() * 7); wgRc(g, x, y, 2, 2, fl[1]); wgPx(g, x, y, fl[3]); wgPx(g, x + 1, y + 1, fl[0]); } });
  ore('ore_coal', ['x', 'd', 'm', 'l'], ['x', 'x', 'X', 'X']);
  ore('ore_copper', ['d', 'm', 'l', 'L'], ['n', 'N', 'O', 'Y']);
  ore('ore_iron', ['d', 'm', 'l', 'L'], ['n', 'k', 'R', 's']);
  ore('obsidian', ['x', '1', '2', '3'], ['0', '2', '3', 'w']);
  stone('iceblock', ['B', 'c', 'C', 'w'], 18, 16, (g) => { wgLine(g, 6, 6, 9, 10, 'w'); wgLine(g, 11, 6, 12, 9, 'C'); wgPx(g, 5, 9, 'w'); });
  for (const [id, ramp, n] of [['ore_crystal', ['b', 'B', 'c', 'C'], 3], ['ore_star', ['o', 'y', 'Y', 'w'], 3]]) wgReg(id, [0, 1].map(v => wgMake(id + v, 20, 22, (g) => {
    wgBlob(g, 10, 17, 9, 4, ['d', 'm', 'l', 'L']);
    const sp = v ? [[5, 14, 3, 9], [10, 18, 4, 14], [15, 14, 3, 8]] : [[6, 15, 3, 9], [10, 18, 4, 13], [14, 14, 3, 10]];
    for (const [cx, by, w, h] of sp) for (let r = 0; r < h; r++) { const hw = r < 2 ? Math.max(1, w - 2 + r) : w; const y = by - r; for (let x = cx - Math.floor(hw / 2); x <= cx + Math.floor(hw / 2); x++) wgPx(g, x, y - (h - 8), x < cx ? ramp[3] : x === cx ? ramp[2] : ramp[0]); }
    wgPx(g, 8, 6, 'w');
  })));
  wgReg('pebbles', [0, 1].map(v => wgMake('pebbles' + v, 16, 10, (g) => { for (const [x, y, r] of (v ? [[4, 6, 2], [10, 7, 2.4], [8, 3, 1.6]] : [[5, 6, 2.4], [11, 5, 1.8], [9, 8, 1.6]])) wgBlob(g, x, y, r, r * 0.8, ['d', 'm', 'l', 'L']); })));
  wgReg('clayrock', [wgMake('clayrock', 16, 10, (g) => { wgBlob(g, 8, 6, 7, 3.5, ['n', 'N', 'k', 's']); wgPx(g, 6, 5, 's'); wgPx(g, 10, 7, 'n'); }, false)]);
  wgReg('sandpile', [wgMake('sandpile', 16, 12, (g) => { wgBlob(g, 8, 8, 7.5, 4, ['e', 'a', 'A', 'w']); wgRc(g, 3, 9, 10, 1, 'e'); })]);
}

// ---------- plants, crops, furniture ----------
function wgBuildPlants() {
  const blades = (g, rng, n, R, h, w) => { for (let i = 0; i < n; i++) { const x = 1 + Math.floor(rng() * (w - 2)), hh = 3 + Math.floor(rng() * h); for (let y = 0; y < hh; y++) wgPx(g, x + (y > hh - 3 ? (i % 2 ? 1 : -1) : 0), 15 - y, y > hh - 3 ? R[3] : y > 1 ? R[2] : R[1]); wgPx(g, x, 15, R[0]); } };
  wgReg('tallgrass', [0, 1, 2].map(v => wgMake('tallgrass' + v, 16, 16, (g) => { const rng = wgRng(5 + v); blades(g, rng, 6 + v, ['g', 'G', 'h', 'H'], 6, 14); }, false)));
  wgReg('fern', [0, 1].map(v => wgMake('fern' + v, 16, 14, (g) => { const R = ['g', 'G', 'h', 'H']; for (const [dx, dy] of [[-6, -3], [-3, -7], [0, -9], [3, -7], [6, -3]]) { wgLine(g, 8, 13, 8 + dx, 13 + dy + (v ? 1 : 0), R[1]); wgLine(g, 8, 13, 8 + Math.round(dx * 0.7), 13 + Math.round(dy * 0.7), R[2]); wgPx(g, 8 + dx, 13 + dy, R[3]); } wgPx(g, 8, 13, R[0]); }, false)));
  wgReg('reeds', [0, 1].map(v => wgMake('reeds' + v, 16, 22, (g) => { for (const [x, h] of (v ? [[4, 14], [8, 19], [11, 12]] : [[5, 16], [9, 20], [12, 13]])) { for (let y = 0; y < h; y++) wgPx(g, x, 21 - y, y > h - 4 ? 'N' : y % 5 === 2 ? 'g' : 'G'); wgRc(g, x - 1, 21 - h, 3, 3, 'u'); wgPx(g, x, 20 - h, 'n'); } }, false)));
  wgReg('deadbush', [wgMake('deadbush', 16, 14, (g) => { wgLine(g, 8, 13, 8, 6, 'u'); wgLine(g, 8, 11, 3, 6, 'n'); wgLine(g, 8, 10, 13, 4, 'n'); wgLine(g, 8, 8, 5, 3, 'u'); wgPx(g, 3, 5, 'N'); wgPx(g, 13, 3, 'N'); }, false)]);
  for (const [k, R, c] of [['r', ['p', 'r', 'R', 'q'], 'y'], ['y', ['o', 'y', 'Y', 'w'], 'o'], ['b', ['b', 'B', 'c', 'C'], 'y'], ['w', ['m', 'l', 'L', 'w'], 'y'], ['p', ['1', '2', '3', '4'], 'y']])
    wgReg('flower_' + k, [0, 1, 2].map(v => wgMake('flower_' + k + v, 16, 16, (g) => {
      const fx = [6, 9, 7][v], fy = [6, 5, 7][v];
      wgLine(g, fx, 15, fx, fy + 2, 'g'); wgPx(g, fx + 1, 12, 'G'); wgPx(g, fx - 1, 13, 'G');
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) wgPx(g, fx + dx, fy + dy, R[2]);
      wgPx(g, fx - 1, fy - 1, R[3]); wgPx(g, fx + 1, fy + 1, R[1]); wgPx(g, fx, fy, c);
      if (v === 1) { wgLine(g, 3, 15, 3, 10, 'g'); wgPx(g, 3, 9, R[2]); wgPx(g, 2, 9, R[3]); wgPx(g, 4, 9, R[1]); wgPx(g, 3, 8, R[2]); }
    }, false)));
  wgReg('mush_red', [0, 1].map(v => wgMake('mush_red' + v, 14, 12, (g) => { const x = v ? 5 : 6; wgRc(g, x, 6, 3, 5, 'L'); wgBlob(g, x + 1.5, 5, 4, 3.4, ['p', 'r', 'R', 'q']); wgPx(g, x, 3, 'w'); wgPx(g, x + 3, 5, 'w'); if (!v) { wgRc(g, 1, 8, 2, 3, 'L'); wgBlob(g, 2, 7.5, 2.4, 2, ['p', 'r', 'R', 'q']); } })));
  wgReg('mush_brown', [0, 1].map(v => wgMake('mush_brown' + v, 14, 12, (g) => { const x = v ? 6 : 5; wgRc(g, x, 6, 3, 5, 'k'); wgBlob(g, x + 1.5, 5, 4.4, 3.2, ['u', 'n', 'N', 'O']); wgRc(g, 9, 8, 2, 3, 'k'); wgBlob(g, 10, 7.5, 2.4, 1.8, ['u', 'n', 'N', 'O']); })));
  wgReg('glowcap', [wgMake('glowcap', 14, 14, (g) => { wgRc(g, 6, 7, 2, 6, 'C'); wgBlob(g, 7, 6, 5, 4, ['t', 'T', 'C', 'w']); wgPx(g, 4, 5, 'w'); wgPx(g, 9, 4, 'q'); wgRc(g, 2, 10, 2, 2, 'T'); })]);
  wgReg('lilypad', [0, 1].map(v => wgMake('lilypad' + v, 14, 8, (g) => { wgBlob(g, 7, 4, 6, 3, ['g', 'G', 'h', 'H']); wgPx(g, 7, 4, 'c'); wgPx(g, 8, 4, 'c'); wgPx(g, 9, 3, 'c'); if (v) { wgPx(g, 6, 2, 'P'); wgPx(g, 7, 1, 'q'); wgPx(g, 7, 2, 'y'); } }, false)));
  wgReg('wild_wheat', [wgMake('wild_wheat', 16, 18, (g) => { for (const [x, h] of [[4, 14], [7, 17], [10, 15], [13, 12]]) { wgLine(g, x, 17, x, 17 - h + 4, 'a'); for (let k = 0; k < 4; k++) { wgPx(g, x - 1, 17 - h + 4 + k * 2, 'y'); wgPx(g, x + 1, 17 - h + 3 + k * 2, 'O'); } wgPx(g, x, 17 - h + 2, 'Y'); } }, false)]);
  wgReg('wild_carrot', [wgMake('wild_carrot', 16, 14, (g) => { for (const [dx, dy] of [[-4, -5], [-1, -8], [2, -7], [5, -4]]) wgLine(g, 8, 12, 8 + dx, 12 + dy, 'G'); wgPx(g, 8, 12, 'g'); wgRc(g, 7, 11, 3, 2, 'o'); wgPx(g, 7, 11, 'O'); }, false)]);
  wgReg('wild_potato', [wgMake('wild_potato', 16, 14, (g) => { for (const [dx, dy] of [[-5, -4], [-2, -7], [2, -6], [5, -3]]) { wgLine(g, 8, 12, 8 + dx, 12 + dy, 'G'); wgPx(g, 8 + dx, 12 + dy, 'h'); } wgPx(g, 8, 12, 'g'); wgPx(g, 5, 6, 'w'); wgPx(g, 11, 7, 'w'); wgRc(g, 6, 11, 4, 2, 'N'); wgPx(g, 6, 11, 'n'); }, false)]);
  wgReg('wild_pumpkin', [wgMake('wild_pumpkin', 18, 16, (g) => { wgBlob(g, 9, 9, 7, 5.6, ['n', 'o', 'O', 'Y']); wgLine(g, 6, 5, 6, 13, 'n'); wgLine(g, 12, 5, 12, 13, 'n'); wgRc(g, 8, 2, 2, 3, 'g'); wgPx(g, 10, 2, 'G'); wgLine(g, 2, 13, 5, 10, 'G'); wgLine(g, 13, 11, 16, 13, 'G'); })]);
  wgReg('shellrock', [0, 1].map(v => wgMake('shellrock' + v, 16, 10, (g) => { wgBlob(g, 5, 6, 3.2, 2.6, ['p', 'P', 'q', 'w']); wgLine(g, 5, 4, 5, 8, 'p'); wgBlob(g, 11, 6 + v, 2.4, 2, ['e', 'a', 'A', 'w']); wgPx(g, 9, 3, 'w'); })));
  for (const [id, ripe] of [['berrybush', false], ['berrybush_r', true]])
    wgReg(id, [0, 1].map(v => wgMake(id + v, 18, 16, (g) => {
      wgBlob(g, 9, 9, 8, 6, ['g', 'G', 'h', 'H']); wgBlob(g, 5, 7, 4, 3.5, ['g', 'G', 'h', 'H']); wgBlob(g, 13, 8, 4, 3.5, ['g', 'G', 'h', 'H']);
      if (ripe) for (const [x, y] of v ? [[6, 6], [11, 5], [9, 10], [14, 9], [4, 9]] : [[5, 7], [10, 6], [8, 11], [13, 10], [12, 5]]) { wgPx(g, x, y, 'r'); wgPx(g, x - 1, y - 1, 'R'); wgPx(g, x, y + 1, 'p'); }
    })));
  wgReg('cobweb', [wgMake('cobweb', 16, 16, (g) => { wgLine(g, 0, 0, 15, 15, 'L'); wgLine(g, 15, 0, 0, 15, 'l'); wgLine(g, 8, 0, 8, 15, 'L'); wgLine(g, 0, 8, 15, 8, 'l'); for (const r of [3, 6]) for (let a = 0; a < 16; a++) { wgPx(g, Math.round(8 + Math.cos(a / 16 * 6.283) * r), Math.round(8 + Math.sin(a / 16 * 6.283) * r), 'w'); } }, false)]);
  wgReg('bones', [0, 1].map(v => wgMake('bones' + v, 16, 10, (g) => { wgRc(g, 3, 5 + v, 8, 2, 'L'); wgBlob(g, 3, 6 + v, 2, 2, ['m', 'l', 'L', 'w']); wgBlob(g, 11, 5 + v, 2, 2, ['m', 'l', 'L', 'w']); wgBlob(g, 8, 3, 3, 2.4, ['m', 'l', 'L', 'w']); wgPx(g, 7, 3, '0'); wgPx(g, 9, 3, '0'); })));
  wgReg('geyser', [0, 1].map(v => wgMake('geyser' + v, 16, 18, (g) => { wgBlob(g, 8, 14, 7, 3.4, ['x', 'X', 'd', 'm']); wgBlob(g, 8, 14, 3.5, 1.8, ['0', 'x', 'o', 'O']); for (let i = 0; i < 4; i++) wgPx(g, 8 + (i % 2 ? 1 : -1) * (v ? 1 : 0), 11 - i * 3, 'w'); })));
  // crops: four stages each
  const crop = (id, stages) => wgReg(id, stages.map((fn, k) => wgMake(id + k, 16, 16, fn, false)));
  const sprout = (g, R, n) => { for (let i = 0; i < n; i++) { const x = 3 + i * (10 / Math.max(1, n - 1)); wgPx(g, x, 14, R[0]); wgPx(g, x - 1, 13, R[2]); wgPx(g, x + 1, 13, R[2]); wgPx(g, x, 12, R[3]); } };
  const G4 = ['g', 'G', 'h', 'H'];
  crop('crop_wheat', [(g) => sprout(g, G4, 3), (g) => { for (const x of [4, 8, 12]) { wgLine(g, x, 15, x, 9, 'G'); wgPx(g, x - 1, 10, 'h'); wgPx(g, x + 1, 11, 'h'); } }, (g) => { for (const x of [3, 6, 9, 12]) { wgLine(g, x, 15, x, 6, 'h'); wgPx(g, x, 5, 'a'); wgPx(g, x - 1, 7, 'G'); } }, (g) => { for (const x of [3, 6, 9, 12]) { wgLine(g, x, 15, x, 5, 'a'); for (let k = 0; k < 3; k++) { wgPx(g, x - 1, 2 + k * 2, 'y'); wgPx(g, x + 1, 3 + k * 2, 'O'); } wgPx(g, x, 1, 'Y'); } }]);
  crop('crop_carrot', [(g) => sprout(g, G4, 4), (g) => { for (const x of [4, 8, 12]) { wgLine(g, x, 15, x - 1, 10, 'G'); wgLine(g, x, 15, x + 1, 10, 'h'); } }, (g) => { for (const x of [4, 8, 12]) { for (const d of [-2, 0, 2]) wgLine(g, x, 14, x + d, 7, d ? 'G' : 'h'); } }, (g) => { for (const x of [4, 8, 12]) { for (const d of [-2, 0, 2]) wgLine(g, x, 12, x + d, 5, d ? 'G' : 'h'); wgRc(g, x - 1, 12, 3, 2, 'o'); wgPx(g, x - 1, 12, 'O'); wgPx(g, x, 14, 'n'); } }]);
  crop('crop_potato', [(g) => sprout(g, G4, 3), (g) => { for (const x of [4, 8, 12]) { wgBlob(g, x, 12, 2.6, 2.4, G4); } }, (g) => { for (const x of [4, 8, 12]) { wgBlob(g, x, 10, 3, 3.4, G4); wgPx(g, x, 8, 'w'); } }, (g) => { for (const x of [4, 8, 12]) { wgBlob(g, x, 9, 3.2, 3.4, G4); wgPx(g, x, 7, 'q'); wgPx(g, x + 1, 7, 'w'); } wgPx(g, 6, 14, 'N'); wgPx(g, 10, 15, 'N'); }]);
  crop('crop_pumpkin', [(g) => sprout(g, G4, 2), (g) => { wgBlob(g, 8, 11, 5, 3.6, G4); wgLine(g, 2, 14, 6, 12, 'g'); }, (g) => { wgBlob(g, 8, 10, 6, 4.4, G4); wgBlob(g, 8, 12, 2.6, 2.2, ['n', 'o', 'O', 'Y']); }, (g) => { wgBlob(g, 8, 10, 7, 5.4, ['n', 'o', 'O', 'Y']); wgLine(g, 5, 6, 5, 14, 'n'); wgLine(g, 11, 6, 11, 14, 'n'); wgRc(g, 7, 3, 2, 3, 'g'); wgPx(g, 9, 3, 'G'); wgLine(g, 0, 13, 3, 11, 'G'); }]);
}
