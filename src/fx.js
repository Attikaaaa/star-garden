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
  } else {
    amb('mote', rnd(16, VW - 16), anywhere ? rnd(40, 200) : rnd(120, 205), rnd(-3, 3), rnd(-9, -4), rnd(3, 6));
  }
}
const AMB_RATE = { meadow: 2.6, beach: 5, crystal: 3.4, well: 4 };
let ambAcc = 0;
function resetAmbient(theme) {
  for (const a of AMB) a.life = 0;
  if (theme !== 'beach') for (let i = 0; i < 10; i++) spawnAmbient(theme, true);
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
    }
    a.x += (a.kind === 'petal' ? a.vx + Math.sin(a.ph * 2) * 8 : a.vx) * dt;
    a.y += a.vy * dt;
    if (a.x > SCR.w - SCR.ox + 70 || a.y > SCR.h - SCR.oy + 6 || a.x < -SCR.ox - 80 || a.y < -SCR.oy - 10) a.life = 0;
  }
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
      case 'fly': drawS(S('bfly_' + (Math.floor(a.ph * 8) % 2)), x - 3, y - 2, a.vx < 0 ? 1 : 0); break;
      case 'glint': drawS(S(a.life / a.max > 0.5 ? 'sparkle_1' : 'sparkle_0'), x - 1, y - 1); break;
      case 'bubble': if (a.life > 0.15) drawS(S('bubble'), x - 1, y - 1); else rect(x, y, 1, 1, 'w'); break;
      case 'mote': rect(x, y, 1, 1, ['c', 'q', 'Y', 'w'][Math.floor(a.ph * 3 + a.max) % 4]); break;
    }
  }
}

// ---------- Moving water / twinkling void in pits ----------
function drawPitLife(room, theme, ox, oy) {
  if (!room.pits) return;
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
