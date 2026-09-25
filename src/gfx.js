'use strict';
// Low level graphics: sprite registry, atlas baking, pixel-perfect drawing.
const VW = 384, VH = 216, TILE = 16;
// The canvas is as big as the screen (in game pixels); the 384x216 play view sits centred
// in it at (SCR.ox, SCR.oy) and the margins show more of the surroundings.
const SCR = { w: VW, h: VH, ox: 0, oy: 0 };
// Fill the whole screen (callers draw in play-view coordinates).
function fillScreen(style) { ctx.fillStyle = style; ctx.fillRect(-SCR.ox, -SCR.oy, SCR.w, SCR.h); }

const cv = document.getElementById('game');
// `let`: the corner HUD swaps in its own canvas while it draws (hudOn / hudOff in main.js)
let ctx = cv.getContext('2d', { alpha: false });
cv.width = VW; cv.height = VH;
ctx.imageSmoothingEnabled = false;

const _defs = [];
const SPR = Object.create(null);
let ATLAS = null;

function parseArt(name, art) {
  const rows = typeof art === 'string' ? art.split('\n').map(s => s.trim()).filter(Boolean) : art;
  const w = rows[0].length;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length !== w) throw new Error(`sprite ${name}: row ${i} has ${rows[i].length} px, expected ${w}`);
  }
  return rows;
}

// Register a sprite. opts: { flip, flash, glow, sil: paletteKey, legend }
function def(name, art, opts) {
  _defs.push({ name, rows: parseArt(name, art), opts: opts || {} });
}

// Another name for a registered sprite (shares its atlas pixels).
const _aliases = [];
function alias(name, src) { _aliases.push([name, src]); }

// Register a sprite once per land, with the land's slot legend (see THEMES).
function defT(name, art, opts) {
  const rows = parseArt(name, art);
  for (const t of THEME_ORDER) def(name + '@' + t, rows, Object.assign({}, opts, { theme: THEMES[t] }));
}

function _rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const _rgbCache = Object.create(null);
function _col(ch, theme, legend) {
  let hex;
  if (legend && legend[ch]) hex = PAL[legend[ch]] || legend[ch];
  else if (theme && theme[ch] && ch !== '0' && ch !== 'w') hex = PAL[theme[ch]];
  else hex = PAL[ch];
  if (!hex) throw new Error('unknown palette key "' + ch + '"');
  return _rgbCache[hex] || (_rgbCache[hex] = _rgb(hex));
}

const WHITE = [255, 255, 255], GLOW = _rgb(PAL.Y);
// Pack every registered sprite (plus flipped / white-flash variants) into one atlas.
function bakeAtlas() {
  const rects = [];
  for (const d of _defs) {
    const h = d.rows.length, w = d.rows[0].length;
    const s = { w, h, x: [], y: [] };
    SPR[d.name] = s;
    const vars = [0];
    if (d.opts.flip) vars.push(1);
    if (d.opts.flash) { vars.push(2); if (d.opts.flip) vars.push(3); }
    if (d.opts.sil) vars.push(4);
    for (const v of vars) rects.push({ d, s, v, w, h });
    if (d.opts.glow) {
      rects.push({ d, s, v: 'glow', w: w + 2, h: h + 2 });
      if (d.opts.flip) rects.push({ d, s, v: 'glowf', w: w + 2, h: h + 2 });
    }
  }
  rects.sort((a, b) => b.h - a.h || b.w - a.w);
  const AW = 1024;
  let x = 0, y = 0, rowH = 0;
  for (const r of rects) {
    if (x + r.w > AW) { x = 0; y += rowH + 1; rowH = 0; }
    r.ax = x; r.ay = y;
    x += r.w + 1; rowH = Math.max(rowH, r.h);
  }
  const AH = y + rowH + 1;
  ATLAS = document.createElement('canvas');
  ATLAS.width = AW; ATLAS.height = AH;
  const actx = ATLAS.getContext('2d');
  const img = actx.createImageData(AW, AH);
  const px = img.data;
  for (const r of rects) {
    const { d, s, v, w, h } = r;
    if (v === 'glow' || v === 'glowf') {
      // 8-neighbour dilation of the silhouette
      const W0 = w - 2, H0 = h - 2, fl = v === 'glowf';
      const on = (x, y) => x >= 0 && y >= 0 && x < W0 && y < H0 && d.rows[y][fl ? W0 - 1 - x : x] !== '.';
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        let hit = false;
        for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1; dx++) if (on(i - 1 + dx, j - 1 + dy)) { hit = true; break; }
        if (!hit) continue;
        const o = ((r.ay + j) * AW + r.ax + i) * 4;
        px[o] = GLOW[0]; px[o + 1] = GLOW[1]; px[o + 2] = GLOW[2]; px[o + 3] = 255;
      }
      if (fl) { s.gfx = r.ax; s.gfy = r.ay; } else { s.gx = r.ax; s.gy = r.ay; }
      continue;
    }
    const flip = v === 1 || v === 3, flash = v === 2 || v === 3;
    const sil = v === 4 ? _col(d.opts.sil) : null;
    for (let j = 0; j < h; j++) {
      const row = d.rows[j];
      for (let i = 0; i < w; i++) {
        const ch = row[flip ? w - 1 - i : i];
        if (ch === '.') continue;
        const c = sil || (flash ? WHITE : _col(ch, d.opts.theme, d.opts.legend));
        const o = ((r.ay + j) * AW + r.ax + i) * 4;
        px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
      }
    }
    s.x[v] = r.ax; s.y[v] = r.ay;
  }
  actx.putImageData(img, 0, 0);
  for (const [n, src] of _aliases) SPR[n] = SPR[src];
  _defs.length = 0; _aliases.length = 0;
}

function S(name) {
  const s = SPR[name];
  if (!s) throw new Error('missing sprite ' + name);
  return s;
}

// v: 0 normal, 1 mirrored, 2 white flash, 3 white flash mirrored, 4 solid silhouette
function drawS(s, x, y, v) {
  let i = v | 0;
  if (s.x[i] === undefined) i = i & 1 && s.x[1] !== undefined ? 1 : 0;
  ctx.drawImage(ATLAS, s.x[i], s.y[i], s.w, s.h, Math.round(x), Math.round(y), s.w, s.h);
}

// Pale-yellow halo around a sprite (elite enemies).
function drawGlow(s, x, y, flip) {
  if (s.gx === undefined) return;
  const f = flip && s.gfx !== undefined;
  ctx.drawImage(ATLAS, f ? s.gfx : s.gx, f ? s.gfy : s.gy, s.w + 2, s.h + 2, Math.round(x) - 1, Math.round(y) - 1, s.w + 2, s.h + 2);
}

// Draw a sprite so that (x, y) is its bottom-centre (the "feet").
function drawFeet(s, x, y, v) { drawS(s, x - (s.w >> 1), y - s.h, v); }

function rect(x, y, w, h, key) {
  ctx.fillStyle = PAL[key] || key;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// Pixel-clean filled ellipse (used for shadows and telegraph circles).
const _ellCache = Object.create(null);
function ellipseSprite(w, h, color) {
  const key = w + 'x' + h + color;
  let c = _ellCache[key];
  if (c) return c;
  c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = color;
  const rx = w / 2, ry = h / 2;
  for (let j = 0; j < h; j++) {
    const dy = (j + 0.5 - ry) / ry;
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)));
    if (half > 0) g.fillRect(Math.round(rx - half), j, half * 2, 1);
  }
  return (_ellCache[key] = c);
}
function shadow(x, y, w) {
  const h = Math.max(3, Math.round(w * 0.4));
  ctx.drawImage(ellipseSprite(w, h, SHADOW), Math.round(x - w / 2), Math.round(y - h / 2));
}

// Ring outline (for telegraphs). Cached per radius.
const _ringCache = Object.create(null);
function ringSprite(r, key) {
  const k = r + key;
  let c = _ringCache[k];
  if (c) return c;
  const d = r * 2 + 1;
  c = document.createElement('canvas');
  c.width = d; c.height = Math.ceil(d * 0.6) + 1;
  const g = c.getContext('2d');
  g.fillStyle = PAL[key];
  const ry = r * 0.6;
  let px = -1, py = -1;
  for (let a = 0; a < 720; a++) {
    const t = a / 720 * Math.PI * 2;
    const x = Math.round(r + Math.cos(t) * r), y = Math.round(ry + Math.sin(t) * ry);
    if (x !== px || y !== py) g.fillRect(x, y, 1, 1);
    px = x; py = y;
  }
  return (_ringCache[k] = c);
}

// ---------- Art tooling (runs once at load) ----------
// Build a sprite from shaded primitives: later shapes are in front, every shape gets a
// 1px outline where it borders emptiness or a shape in front of it. Light is top-left.
// shape: { e: [cx, cy, rx, ry] | r: [x, y, w, h, corner], ramp: 'dark base light hi', hi?: false, cut?: y }
function sculpt(w, h, shapes) {
  const id = new Int16Array(w * h).fill(-1);
  const col = new Array(w * h).fill('.');
  shapes.forEach((sh, k) => {
    const ramp = sh.ramp;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let nx, ny, nz, inside;
      const px = x + 0.5, py = y + 0.5;
      if (sh.e) {
        const [cx, cy, rx, ry] = sh.e;
        nx = (px - cx) / rx; ny = (py - cy) / ry;
        const r2 = nx * nx + ny * ny;
        inside = r2 <= 1;
        nz = Math.sqrt(Math.max(0, 1 - r2));
      } else {
        const [rx0, ry0, rw, rh, cr] = sh.r;
        const cx = rx0 + rw / 2, cy = ry0 + rh / 2;
        const qx = Math.max(0, Math.abs(px - cx) - (rw / 2 - cr)), qy = Math.max(0, Math.abs(py - cy) - (rh / 2 - cr));
        inside = Math.abs(px - cx) <= rw / 2 && Math.abs(py - cy) <= rh / 2 && qx * qx + qy * qy <= cr * cr;
        const edge = Math.min(rw, rh) * 0.45;
        nx = Math.sign(px - cx) * Math.max(0, Math.abs(px - cx) - (rw / 2 - edge)) / edge;
        ny = Math.sign(py - cy) * Math.max(0, Math.abs(py - cy) - (rh / 2 - edge)) / edge;
        const r2 = Math.min(1, nx * nx + ny * ny);
        nz = Math.sqrt(1 - r2);
      }
      if (!inside || (sh.cut !== undefined && y > sh.cut)) continue;
      const v = -0.45 * nx - 0.55 * ny + 0.7 * nz;
      let c;
      if (sh.hi !== false && v > 0.93) c = ramp[3];
      else if (v > 0.68) c = ramp[2];
      else if (v > 0.2) c = ramp[1];
      else c = ramp[0];
      id[y * w + x] = k; col[y * w + x] = c;
    }
  });
  const out = col.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, k = id[i];
    if (k < 0) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of nb) {
      const X = x + dx, Y = y + dy;
      const kk = X < 0 || Y < 0 || X >= w || Y >= h ? -1 : id[Y * w + X];
      if (kk === -1 || (kk > k && !shapes[kk].noLine)) { out[i] = '0'; break; }
    }
  }
  const rows = [];
  for (let y = 0; y < h; y++) rows.push(out.slice(y * w, y * w + w).join(''));
  return rows;
}

// Overlay hand-drawn detail onto rows ('.' keeps the pixel underneath).
function stamp(rows, x, y, art) {
  const st = typeof art === 'string' ? parseArt('stamp', art) : art;
  const r = rows.map(s => s.split(''));
  st.forEach((line, j) => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== '.' && r[y + j] && r[y + j][x + i] !== undefined) r[y + j][x + i] = line[i] === '_' ? '.' : line[i];
    }
  });
  return r.map(a => a.join(''));
}

// Add a 1px '0' outline around every coloured pixel (4-neighbourhood).
function autoOutline(rows) {
  const h = rows.length, w = rows[0].length;
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== '.' && rows[y][x] !== '0';
  return rows.map((row, y) => row.split('').map((c, x) =>
    c === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? '0' : c).join(''));
}

// Tiny raster helper for drawing icons with lines and pixels.
function grid(w, h) {
  const a = [];
  for (let y = 0; y < h; y++) a.push(new Array(w).fill('.'));
  const g = {
    px(x, y, c) { if (a[y] && a[y][x] !== undefined) a[y][x] = c; return g; },
    line(x0, y0, x1, y1, c) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) g.px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
      return g;
    },
    fill(fn) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c) a[y][x] = c; } return g; },
    rows() { return a.map(r => r.join('')); },
  };
  return g;
}

// Hue-shifted rim light: recolour (by `map`) the body pixels just inside the outer outline
// on the right edge, and on the bottom edge of the right half (light is top-left).
function rim(rows, map) {
  const h = rows.length, w = rows[0].length;
  const out = (x, y) => y < 0 || y >= h || x < 0 || x >= w || rows[y][x] === '.';
  return rows.map((row, y) => row.split('').map((c, x) =>
    map[c] && ((row[x + 1] === '0' && out(x + 2, y)) || (x >= w / 2 && y + 1 < h && rows[y + 1][x] === '0' && out(x, y + 2))) ? map[c] : c).join(''));
}
