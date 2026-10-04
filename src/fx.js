'use strict';
// Screen-wide effects: diamond wipe transitions, ambient life per land, animated pits.

// ---------- Diamond wipe ----------
const WIPE_D = 0.32, WIPE_S = 0.6;
const Wipe = { t: -1, cb: null };
const _diamonds = [];
function diamond(r) {
  if (_diamonds[r]) return _diamonds[r];
  const c = document.createElement('canvas');
  c.width = c.height = r * 2 + 1;
  const g = c.getContext('2d');
  g.fillStyle = PAL['0'];
  for (let y = -r; y <= r; y++) { const h = r - Math.abs(y); g.fillRect(r - h, y + r, h * 2 + 1, 1); }
  return (_diamonds[r] = c);
}
function wipe(cb) {
  if (Wipe.t >= 0) return;
  Wipe.t = 0; Wipe.cb = cb;
  Audio_.sfx('wipe');
}
// Returns true while the screen is closing (the world should stay frozen).
function updateWipe(dt) {
  if (Wipe.t < 0) return false;
  const prev = Wipe.t;
  Wipe.t += dt;
  if (prev < WIPE_D && Wipe.t >= WIPE_D) { const cb = Wipe.cb; Wipe.cb = null; cb(); }
  if (Wipe.t >= WIPE_D * 2) Wipe.t = -1;
  return prev < WIPE_D;
}
function drawWipe() {
  if (Wipe.t < 0) return;
  const closing = Wipe.t < WIPE_D, u = closing ? Wipe.t / WIPE_D : Wipe.t / WIPE_D - 1;
  const cols = Math.ceil(SCR.w / 16) + 1, rows = Math.ceil(SCR.h / 16) + 1;
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const d = (cx + cy) / (cols + rows);
    let k = closing ? u * (1 + WIPE_S) - WIPE_S * d : 1 - (u * (1 + WIPE_S) - WIPE_S * d);
    k = Math.max(0, Math.min(1, k));
    const r = Math.round(k * 16);
    if (!r) continue;
    ctx.drawImage(diamond(r), cx * 16 + 8 - r - SCR.ox, cy * 16 + 8 - r - SCR.oy);
  }
}

// ---------- Ambient life ----------
// Meadow: drifting petals and butterflies. Beach: sun glints and bubbles in the water.
// Crystal: slow twinkling motes. Purely decorative, never touches gameplay.
const AMB = [];
function amb(kind, x, y, vx, vy, life) {
  let a = null;
  for (let i = 0; i < AMB.length; i++) if (AMB[i].life <= 0) { a = AMB[i]; break; }
  if (!a) { if (AMB.length > 80) return; a = {}; AMB.push(a); }
  a.kind = kind; a.x = x; a.y = y; a.vx = vx; a.vy = vy; a.life = a.max = life; a.ph = Math.random() * 6; a.dir = vx < 0 ? -1 : 1;
}
const PETAL = ['P', 'q', 'w', 'Y'];
function spawnAmbient(theme, anywhere) {
  const y0 = anywhere ? rnd(-SCR.oy, SCR.h - SCR.oy) : -SCR.oy - 4, xl = -SCR.ox, xr = SCR.w - SCR.ox;
  if (theme === 'meadow') {
    if (Math.random() < 0.9) amb('petal', rnd(xl - 60, xr), y0, rnd(10, 18), rnd(9, 15), 30);
    else if (AMB.filter(a => a.life > 0 && a.kind === 'fly').length < 2) { const l = Math.random() < 0.5; amb('fly', l ? xl - 8 : xr + 8, rnd(60, 180), l ? 1 : -1, 0, 30); }
  } else if (theme === 'beach') {
    amb('glint', rnd(20, VW - 20), rnd(44, 196), 0, 0, 0.6);
    const pits = G.room && G.room.pits;
    if (pits && pits.length) { const p = pick(pits); amb('bubble', p[0] + rnd(3, 13), p[1] + rnd(6, 13), 0, -6, 0.9); }
  } else if (theme === 'cloud') {
    // little clouds drifting by, over the margins and the room alike
    amb('wisp', anywhere ? rnd(xl, xr) : xl - 16, rnd(-SCR.oy, SCR.h - SCR.oy), rnd(5, 11), 0, rnd(80, 100));
  } else if (theme === 'lantern') {
    // fireflies, and now and then a leaf coming down
    if (Math.random() < 0.8) { if (AMB.filter(a => a.life > 0 && a.kind === 'ffly').length < 14) amb('ffly', rnd(16, VW - 16), rnd(44, 200), rnd(-6, 6), rnd(-6, 6), rnd(8, 14)); }
    else amb('leaf', rnd(xl - 40, xr), y0, rnd(6, 12), rnd(10, 14), 30);
  } else if (theme === 'snow') {
    // snowfall in three layers: far flakes slow and small, near ones big and quick
    const l = Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : 2;
    amb('flake' + l, rnd(xl, xr), y0, rnd(-4, 4), [9, 15, 24][l], 40);
  } else if (theme === 'sun') {
    // sand drifting in on a warm wind, and dust motes turning gold in the light
    if (Math.random() < 0.7) amb('sand', anywhere ? rnd(xl, xr) : xl - 4, rnd(-SCR.oy, SCR.h - SCR.oy), rnd(22, 40), rnd(-2, 3), 30);
    else amb('mote', rnd(16, VW - 16), rnd(44, 200), rnd(-2, 2), rnd(-5, -2), rnd(3, 6));
  } else if (theme === 'forge') {
    // embers rising from the floor, and violet smoke from the chimneys
    if (Math.random() < 0.75) amb('ember', rnd(16, VW - 16), rnd(120, 205), rnd(-4, 4), rnd(-22, -12), rnd(2, 4));
    else amb('smoke', rnd(xl, xr), SCR.h - SCR.oy + 4, rnd(-3, 3), rnd(-12, -8), 40);
  } else if (theme === 'deep') {
    // glowing plankton drifting up, and now and then a far-off fish crossing the margin
    if (Math.random() < 0.85) amb('plank', rnd(xl, xr), rnd(40, 210), rnd(-3, 3), rnd(-6, -2), rnd(5, 9));
    else if (AMB.filter(a => a.life > 0 && a.kind === 'dfish').length < 3) { const l = Math.random() < 0.5; amb('dfish', l ? xl - 8 : xr + 8, rnd(-SCR.oy + 10, SCR.h - SCR.oy - 10), l ? rnd(8, 14) : -rnd(8, 14), 0, 60); }
  } else if (theme === 'moon') {
    // petals drifting down, and now and then a shooting star over the margins
    if (Math.random() < 0.85) amb('petal', rnd(xl - 60, xr), y0, rnd(6, 12), rnd(7, 11), 30);
    else amb('shoot', rnd(xl, xr - 60), rnd(-SCR.oy, 40), rnd(110, 150), rnd(30, 50), 0.7);
  } else if (theme === 'library') {
    // loose pages drifting down, and dust in the reading light
    if (Math.random() < 0.4) amb('scrap', rnd(xl - 30, xr), y0, rnd(4, 9), rnd(8, 12), 30);
    else amb('mote', rnd(16, VW - 16), rnd(44, 200), rnd(-2, 2), rnd(-5, -2), rnd(3, 6));
  } else {
    amb('mote', rnd(16, VW - 16), anywhere ? rnd(40, 200) : rnd(120, 205), rnd(-3, 3), rnd(-9, -4), rnd(3, 6));
  }
}
const AMB_RATE = { meadow: 2.6, beach: 5, crystal: 3.4, cloud: 0.25, well: 4, lantern: 1.5, toy: 3, snow: 9, sun: 5, library: 2, forge: 4, deep: 4, moon: 2.4 };
let ambAcc = 0;
function resetAmbient(theme) {
  for (const a of AMB) a.life = 0;
  if (theme !== 'beach') for (let i = 0; i < (theme === 'cloud' ? 5 : 10); i++) spawnAmbient(theme, true);
}
function updateAmbient(dt, theme) {
  ambAcc += dt * AMB_RATE[theme];
  while (ambAcc >= 1) { ambAcc--; spawnAmbient(theme, false); }
  for (const a of AMB) {
    if (a.life <= 0) continue;
    a.life -= dt; a.ph += dt;
    if (a.kind === 'fly') {
      a.vx = a.dir * 16 + Math.sin(a.ph * 1.3) * 10;
      a.vy = Math.sin(a.ph * 2.1) * 14;
    } else if (a.kind === 'ffly') fireflyDrift(a, dt);
    a.x += (a.kind === 'petal' || a.kind === 'leaf' || a.kind === 'scrap' ? a.vx + Math.sin(a.ph * 2) * 8 : a.vx) * dt;
    a.y += a.vy * dt;
    if (a.x > SCR.w - SCR.ox + 70 || a.y > SCR.h - SCR.oy + 6 || a.x < -SCR.ox - 80 || a.y < -SCR.oy - 10) a.life = 0;
  }
}
// A firefly wanders toward the nearest dark lamp, and hovers round it.
function fireflyDrift(a, dt) {
  const room = G.room;
  let tx = null, ty = 0, best = 1e9;
  if (room && room.tiles) for (let i = 0; i < room.tiles.length; i++) {
    if (room.tiles[i] !== T_LAMP) continue;
    const x = (i % COLS) * 16 + 8, y = OY + ((i / COLS) | 0) * 16 - 2, d = Math.hypot(x - a.x, y - a.y);
    if (d < best) { best = d; tx = x; ty = y; }
  }
  let ax = Math.sin(a.ph * 1.7 + a.max) * 20, ay = Math.cos(a.ph * 1.3 + a.max * 2) * 20;
  if (tx !== null) { const d = Math.max(1, best); ax += (tx - a.x) / d * (d < 14 ? -10 : 18); ay += (ty - a.y) / d * (d < 14 ? -10 : 18); }
  a.vx = Math.max(-16, Math.min(16, a.vx + ax * dt)); a.vy = Math.max(-16, Math.min(16, a.vy + ay * dt));
}
function drawAmbient(ox, oy) {
  for (const a of AMB) {
    if (a.life <= 0) continue;
    const x = Math.round(ox + a.x), y = Math.round(oy + a.y);
    switch (a.kind) {
      case 'petal': {
        const c = PETAL[Math.floor(a.max * 7) % 4];
        if (Math.floor(a.ph * 4) % 2) rect(x, y, 2, 1, c); else rect(x, y, 1, 2, c);
        break;
      }
      case 'leaf': { const c = ['o', 'O', 'V', 'n'][Math.floor(a.max * 7) % 4]; if (Math.floor(a.ph * 3) % 2) rect(x, y, 2, 1, c); else { rect(x, y, 1, 1, c); rect(x + 1, y + 1, 1, 1, c); } break; }
      case 'ffly': if ((a.ph * 0.9 + a.max) % 2.2 < 1.6) { rect(x, y, 1, 1, 'Y'); if ((a.ph * 0.9 + a.max) % 2.2 < 1.1) { rect(x - 1, y, 1, 1, 'y'); rect(x + 1, y, 1, 1, 'y'); rect(x, y - 1, 1, 1, 'y'); rect(x, y + 1, 1, 1, 'y'); } } break;
      case 'fly': drawS(S('bfly_' + (Math.floor(a.ph * 8) % 2)), x - 3, y - 2, a.vx < 0 ? 1 : 0); break;
      case 'glint': drawS(S(a.life / a.max > 0.5 ? 'sparkle_1' : 'sparkle_0'), x - 1, y - 1); break;
      case 'bubble': if (a.life > 0.15) drawS(S('bubble'), x - 1, y - 1); else rect(x, y, 1, 1, 'w'); break;
      case 'wisp': { const w = 6 + Math.floor(a.max * 7) % 5; rect(x, y, w, 1, 'w'); rect(x + 2, y - 1, w - 4, 1, 'w'); rect(x + 1, y + 1, w - 1, 1, 'C'); break; }
      case 'flake0': rect(x + Math.round(Math.sin(a.ph * 1.3 + a.max) * 2), y, 1, 1, 'C'); break;
      case 'flake1': rect(x + Math.round(Math.sin(a.ph * 1.7 + a.max) * 3), y, 1, 1, 'w'); break;
      case 'flake2': { const sx = x + Math.round(Math.sin(a.ph * 2 + a.max) * 4); rect(sx, y, 2, 2, 'w'); rect(sx + 1, y + 1, 1, 1, 'C'); break; }
      case 'sand': rect(x, y + Math.round(Math.sin(a.ph * 2 + a.max) * 1.5), Math.floor(a.max * 5) % 3 ? 1 : 2, 1, ['A', 'e', 'N'][Math.floor(a.max * 7) % 3]); break;
      case 'scrap': if (Math.floor(a.ph * 3) % 2) { rect(x, y, 3, 2, 'L'); rect(x + 1, y, 1, 1, 'l'); } else rect(x, y, 1, 2, 'L'); break;
      case 'ember': if (a.life > 0.3 || Math.floor(a.ph * 10) % 2) rect(x + Math.round(Math.sin(a.ph * 3 + a.max) * 1.5), y, 1, 1, a.life / a.max > 0.6 ? 'y' : a.life / a.max > 0.3 ? 'O' : 'o'); break;
      case 'smoke': { const w = 2 + Math.floor(a.max * 3) % 3; rect(x + Math.round(Math.sin(a.ph * 0.8 + a.max) * 4), y, w, w, Math.floor(a.max * 7) % 2 ? 'V' : '3'); break; }
      case 'shoot': { const k = a.life / a.max; rect(x, y, 1, 1, 'w'); rect(x - 2, y - 1, 2, 1, 'Y'); if (k > 0.3) rect(x - 5, y - 2, 3, 1, '4'); break; }
      case 'plank': if ((a.ph + a.max) % 3 < 2.4) rect(x + Math.round(Math.sin(a.ph * 1.1 + a.max) * 2), y, 1, 1, ['H', 'T', 'q', 'C'][Math.floor(a.max * 7) % 4]); break;
      case 'dfish': { if (a.x > -4 && a.x < VW + 4) break; /* far behind the room: seen only in the margins */ const d = a.vx > 0 ? 1 : -1; rect(x - 2, y, 5, 2, '1'); rect(x - 3 * d, y - 1, 1, 4, '1'); rect(x + 2 * d, y, 1, 1, '2'); break; }
      case 'mote': rect(x, y, 1, 1, ['c', 'q', 'Y', 'w'][Math.floor(a.ph * 3 + a.max) % 4]); break;
    }
  }
}

// ---------- Gravity wells: where a bent bullet is going ----------
// A foe bullet near a well (room.wells) shows its arc as faint dots for its first moments, so the
// gap in a bending volley is readable. Capped: the newest WELL_ARCS bullets, a few steps each.
const WELL_ARCS = 24, ARC_STEPS = 9, ARC_DT = 0.1;
function drawWellArcs(ox, oy, room) {
  const W = room.wells;
  if (!W || !W.length) return;
  let n = 0;
  for (let i = EBULLETS.length - 1; i >= 0 && n < WELL_ARCS; i--) {
    const b = EBULLETS[i];
    if (b.life <= 0 || b.t > 0.8) continue;
    n++;
    let x = b.x, y = b.y, vx = b.vx, vy = b.vy;
    for (let k = 1; k <= ARC_STEPS; k++) {
      const w = wellTurn(W, x, y, vx, vy) * ARC_DT, c = Math.cos(w), sn = Math.sin(w), nx = vx * c - vy * sn;
      vy = vx * sn + vy * c; vx = nx; x += vx * ARC_DT; y += vy * ARC_DT;
      if (k % 2 && k > 1) rect(Math.round(ox + x), Math.round(oy + y), 1, 1, b.t > 0.5 && k > 5 ? 'q' : 'P');
    }
  }
}

// ---------- Moving water / twinkling void in pits ----------
function drawPitLife(room, theme, ox, oy) {
  if (!room.pits || theme === 'cloud') return; // the open sky is still
  const crystal = theme === 'crystal' || theme === 'well', key = crystal ? 'Y' : THEMES[theme].h;
  for (const [x, y, h] of room.pits) {
    if (crystal) {
      if (Math.floor(G.time * 2 + (h % 7)) % 4 === 0) rect(ox + x + 3 + (h % 10), oy + y + 6 + ((h >> 4) % 7), 1, 1, key);
      continue;
    }
    const ph = (G.time * 0.6 + (h % 97) / 97) % 1;
    const wx = x + 2 + Math.floor(ph * 9), wy = y + 6 + ((h >> 5) % 6);
    const len = ph < 0.15 || ph > 0.85 ? 1 : 3;
    rect(ox + wx, oy + wy, len, 1, key);
  }
}

// ---------- Darkness and light (Lantern Woods) ----------
// Low resolution on purpose: light is judged per 2x2 cell and shown as four dithered bands of
// the outline colour (like SHADOW), never black and never a soft gradient. Every frame the
// land calls lightReset(), lightAdd() for each lamp and hero, then drawLight(). lightAt() gives
// game logic the same level (0 dark .. 4 lit) from play-view coordinates, with no screen maths.
const LIGHT_CELL = 2, LIGHT_BAND = 6;
const LIGHT = { n: 0, xs: new Float32Array(64), ys: new Float32Array(64), rs: new Float32Array(64), amb: 0, cv: null, g: null, img: null, px: null, lv: null, w: 0, h: 0 };
// Bayer 4x4: a pixel is dark when its threshold is below the band's coverage (16 12 8 4 0)
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function lightReset(amb) { LIGHT.n = 0; LIGHT.amb = amb || 0; }
function lightAdd(x, y, r) {
  if (LIGHT.n >= 64) return;
  LIGHT.xs[LIGHT.n] = x; LIGHT.ys[LIGHT.n] = y; LIGHT.rs[LIGHT.n] = r; LIGHT.n++;
}
const lightLevel = (d, r) => d >= r ? 0 : Math.min(4, Math.ceil((r - d) / LIGHT_BAND));
function lightAt(x, y) {
  let lv = LIGHT.amb;
  for (let i = 0; i < LIGHT.n && lv < 4; i++) lv = Math.max(lv, lightLevel(Math.hypot(x - LIGHT.xs[i], y - LIGHT.ys[i]), LIGHT.rs[i]));
  return lv;
}
// alpha: how deep the dusk is (the assist option lifts it with lightReset's ambient level)
function drawLight(ox, oy, alpha) {
  const L = LIGHT, cw = Math.ceil(SCR.w / LIGHT_CELL), ch = Math.ceil(SCR.h / LIGHT_CELL);
  if (!L.cv || L.w !== cw * LIGHT_CELL || L.h !== ch * LIGHT_CELL) {
    L.w = cw * LIGHT_CELL; L.h = ch * LIGHT_CELL;
    L.cv = document.createElement('canvas'); L.cv.width = L.w; L.cv.height = L.h;
    L.g = L.cv.getContext('2d'); L.img = L.g.createImageData(L.w, L.h);
    L.px = new Uint32Array(L.img.data.buffer); L.lv = new Uint8Array(cw * ch);
  }
  const lv = L.lv, px = L.px, W = L.w;
  lv.fill(L.amb);
  // screen cell (cx, cy) has its centre at play-view (cx*2 + 1 - SCR.ox - ox, ...)
  const sx = SCR.ox + ox, sy = SCR.oy + oy;
  for (let i = 0; i < L.n; i++) {
    const x = L.xs[i] + sx, y = L.ys[i] + sy, r = L.rs[i];
    const c0 = Math.max(0, Math.floor((x - r) / LIGHT_CELL)), c1 = Math.min(cw - 1, Math.floor((x + r) / LIGHT_CELL));
    const r0 = Math.max(0, Math.floor((y - r) / LIGHT_CELL)), r1 = Math.min(ch - 1, Math.floor((y + r) / LIGHT_CELL));
    for (let cy = r0; cy <= r1; cy++) {
      const dy = cy * LIGHT_CELL + 1 - y;
      for (let cx = c0; cx <= c1; cx++) {
        const k = cy * cw + cx, l = lightLevel(Math.hypot(cx * LIGHT_CELL + 1 - x, dy), r);
        if (l > lv[k]) lv[k] = l;
      }
    }
  }
  const dark = ((Math.round(alpha * 255) << 24) | (0x47 << 16) | (0x1a << 8) | 0x2b) >>> 0; // '0' as ABGR
  // lut[(row phase * 5 + level) * 4 + column phase]: the pixel for that spot of the pattern
  const lut = L.lut || (L.lut = new Uint32Array(80));
  for (let yp = 0; yp < 4; yp++) for (let l = 0; l < 5; l++) for (let xp = 0; xp < 4; xp++) lut[(yp * 5 + l) * 4 + xp] = BAYER4[yp * 4 + xp] < 16 - l * 4 ? dark : 0;
  // the dither is anchored to screen pixels, so it stays still while the lights move
  for (let y = 0; y < L.h; y++) {
    const row = y * W, lrow = (y >> 1) * cw, b = (y & 3) * 20;
    for (let x = 0; x < W; x++) px[row + x] = lut[b + lv[lrow + (x >> 1)] * 4 + (x & 3)];
  }
  L.g.putImageData(L.img, 0, 0);
  ctx.drawImage(L.cv, -SCR.ox, -SCR.oy);
}

// ---------- Page turn (Story Library) ----------
// The interior (22x10 tiles) is a page. u / v run from the turning corner across it; the fold is
// the diagonal u + v = s. Before it the new page (the room's layer) shows, past it the old one
// (room.turn.cv), with the lifted flap lying along the fold. Drawn in 1px rows: no rotation.
const PAGE_X = 16, PAGE_Y = OY + 32, PAGE_W = 352, PAGE_H = 160, FLAP_W = 12;
function pageRow(corner, v) { return corner & 2 ? PAGE_Y + PAGE_H - 1 - v : PAGE_Y + v; }
function pageSpan(corner, u0, u1) { return corner & 1 ? PAGE_X + PAGE_W - u1 : PAGE_X + u0; } // left x of [u0, u1)
function drawPageTurn(room, ox, oy) {
  const T = room.turn, p = (G.time - T.at) / PAGE_T;
  if (p >= 1 || !Save.settings.shake) { room.turn = null; return; } // SCREEN SHAKE off: the page swaps without the sweep
  const e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
  const s = Math.round(e * (PAGE_W + PAGE_H + FLAP_W)), c = T.corner;
  for (let v = 0; v < PAGE_H; v++) {
    const cut = s - v, y = pageRow(c, v);
    if (cut < PAGE_W) { // the old page past the fold
      const u0 = Math.max(0, cut), x = pageSpan(c, u0, PAGE_W);
      ctx.drawImage(T.cv, x, y, PAGE_W - u0, 1, ox + x, oy + y, PAGE_W - u0, 1);
    }
    if (cut <= 0) continue;
    const fw = Math.min(cut, FLAP_W), u1 = Math.min(PAGE_W, cut + fw);
    if (u1 <= cut) continue;
    const band = (col, a, b) => {
      a = Math.max(a, 0); b = Math.min(b, PAGE_W);
      if (b > a) { ctx.fillStyle = col; ctx.fillRect(ox + pageSpan(c, a, b), oy + y, b - a, 1); }
    };
    band(SHADOW, u1, u1 + 3); // the flap's shadow on the old page
    band(PAL.A, cut, u1); // the back of the page
    band(PAL.e, cut, cut + 1); // the crease
    if (cut + fw <= PAGE_W) band(PAL['0'], u1 - 1, u1); // its edge
  }
}
// The tell: a dog-ear lifts at the corner and flutters.
function drawPageCurl(room, ox, oy) {
  const C = room.curl, t = G.time - C.at;
  if (t >= (C.dur || CURL_T)) { room.curl = null; return; }
  const k = Math.round(4 + 8 * Math.min(1, t / 0.3)) + (Math.sin(t * 24) > 0 ? 1 : 0), c = C.corner;
  for (let v = 0; v < k + 1; v++) {
    const y = pageRow(c, v), fill = (col, a, b) => {
      if (b > a) { ctx.fillStyle = col; ctx.fillRect(ox + pageSpan(c, a, b), oy + y, b - a, 1); }
    };
    if (v === k) { fill(SHADOW, 1, k + 1); continue; } // shadow under the ear's lower edge
    fill(SHADOW, 0, k - v); // the gap the corner left
    fill(PAL.A, k - v, k);
    if (v) fill(PAL.e, k - v, k - v + 1);
    fill(PAL['0'], k - 1, k);
    fill(SHADOW, k, k + 1);
    if (v === k - 1) fill(PAL['0'], k - v, k);
  }
}
