'use strict';
// Wildgrove: a bubble wand. Held in hand, USE blows a puff of three to five soap bubbles toward the aim, even with the
// aim out of reach: they drift off the wand, slow down, bob on the air and wander with the wind (`wgWindA`, the weather
// vane's), shimmering, until each one pops (`wgBubAt`, all from the puff's seed). The wand is never used up. Friends see
// them: a guest sends 'bub' to the host, which checks it, rate-limits it and passes it on, and each screen blows the
// puff from its own clock (`WGBB.list`, at most `WG_BUB_MAX` puffs), the pops heard within `WG_BUB_NEAR` px. Drawn by a
// `wgDrawAmbient` wrapper with faint shadows below them. The BUBBLE BLOWER star after a hundred bubbles.
const WG_BUB_MAX = 16, WG_BUB_NEAR = 240, WG_BUB_GAP = 0.45; // puffs at once; how near a pop is heard; seconds between puffs
const WGBB = { list: [], t: -1, w: null, popT: 0 }; // puffs: world x, y, aim, seed, dim, the start on this screen's clock
(function () {
  wgItem('bubble_wand', 'BUBBLE WAND', 'tool', { tool: 'bubbles', stack: 1 }); wgRec('bubble_wand', 1, { stick: 1, fiber: 2, sugar: 1 }, 'bench');
  WG_ACH.push(['bubbles', 'BUBBLE BLOWER', 'BLOW A HUNDRED SOAP BUBBLES', (c) => (c.st.bubbles | 0) >= 100]);
})();
const wgBubHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!(s && s.id === 'bubble_wand'); };
const wgBubN = (s) => 3 + s % 3; // bubbles in a puff
const wgBubLife = (P, i) => 2.6 + ((hash(P.s, i, 7717) >>> 0) % 1000) / 300; // seconds before bubble i of a puff pops
function wgBubAt(P, i, k) { // bubble i of a puff k seconds on: where it floats (ground x, y and height) and its size
  const h = hash(P.s, i, 7717) >>> 0, a = P.a + (((h >>> 10) % 100) / 100 - 0.5) * 0.9, v = 22 + (h >>> 17) % 26, ph = (h >>> 5) % 628 / 100;
  const go = v * 0.9 * (1 - Math.exp(-k / 0.9)), wa = wgWindA(), drift = 5 + (h >>> 23) % 5; // off the wand, then the wind's
  return {
    x: P.x + Math.cos(P.a) * 9 + Math.cos(a) * go + Math.cos(wa) * drift * k + Math.sin(k * 2.1 + ph) * 2,
    y: P.y + Math.sin(P.a) * 4 + Math.sin(a) * go * 0.6 + Math.sin(wa) * drift * k * 0.5,
    z: Math.max(3, 15 + Math.sin(k * 1.4 + ph) * 4 + (((h >>> 27) % 5) - 1.5) * k),
    r: (h >>> 2) % 3,
  };
}
function wgBubAdd(x, y, a, s, d) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(a) || Math.abs(x) > 1e7 || Math.abs(y) > 1e7 || typeof d !== 'string' || d.length > 2) return false;
  const L = WGBB.list; L.push({ x, y, a: Math.max(-4, Math.min(4, a)), s: Math.abs(s | 0) % 100000, d, t0: WGS.t }); if (L.length > WG_BUB_MAX) L.shift();
  return true;
}
function wgBubBlow() { // your hero blows a puff toward the aim
  const p = WGS.p; if (!p || !WGS.world || p.hidden || WGS.t - WGBB.t < WG_BUB_GAP && WGS.t >= WGBB.t) return false;
  WGBB.t = WGS.t; p.swing = 0.15;
  const s = Math.floor(Math.random() * 100000), a = Math.round((WGS.aim || 0) * 100) / 100, x = Math.round(p.x), y = Math.round(p.y);
  wgBubAdd(x, y, a, s, WGS.dim); wgSfx('bubble');
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.bubbles = (st.bubbles | 0) + wgBubN(s);
  if (WGN.role) { const msg = { t: 'bub', x, y, a, s, d: WGS.dim }; if (WGN.role === 'host') wgnAll(msg, null); else wgnSend(WGN.link, msg); }
  return true;
}
// the net: a guest's puff is checked on the host (it must come from beside that guest), blown there and passed on
const _wgnHostBub = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostBub(L, m);
  if (!m || m.t !== 'bub' || !WGS.world || !(L.pid > 0)) return;
  const now = performance.now(); if (now - (L.bubT || 0) < 350) return;
  const q = (WGS.remote || []).find(r => r.pid === L.pid); if (!q || q.dim !== m.d || Math.hypot(q.x - m.x, q.y - m.y) > 48) return;
  L.bubT = now;
  if (wgBubAdd(+m.x, +m.y, +m.a, +m.s, m.d)) wgnAll({ t: 'bub', x: +m.x, y: +m.y, a: +m.a, s: +m.s | 0, d: m.d }, L);
};
const _wgnClientBub = wgnClientMsg;
wgnClientMsg = function (L, m) {
  _wgnClientBub(L, m);
  if (m && m.t === 'bub' && WGS.world) wgBubAdd(+m.x, +m.y, +m.a, +m.s, m.d);
};
// USE blows, a door or a chest under the aim first; with the aim out of reach it blows all the same
const _wgUseBub = wgUse;
wgUse = function (tx, ty) {
  if (!wgBubHeld()) return _wgUseBub(tx, ty);
  return _wgUseBub(tx, ty) || (wgBubBlow(), true);
};
const _wgUpdBub = updateWG;
updateWG = function (dt) {
  const fresh = WGS.scr === 'play' && wgBubHeld() && (Input.rHit || pressed(wgKey('use'), 'KeyK', 'PadX', 'PadLT') || (WGS.touch && WGS.touch.use));
  _wgUpdBub(dt);
  if (WGBB.w !== WGS.world) { WGBB.w = WGS.world; WGBB.list.length = 0; }
  if (fresh && WGS.scr === 'play' && !WGS.target) wgBubBlow();
  const L = WGBB.list; while (L.length && (WGS.t - L[0].t0 > 6.2 || L[0].t0 > WGS.t)) L.shift();
};
// drawn over the ground and all that stands on it: a faint shadow, the bubble shimmering as it bobs, a little pop at its end
const _wgAmbBub = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbBub(cx0, cy0);
  const L = WGBB.list; if (!L.length) return;
  const T = WGS.t, p = WGS.p, fr = Math.floor(T * 4) % 2; let pops = 0;
  for (const P of L) {
    if (P.d !== WGS.dim) continue;
    const k = T - P.t0, n = wgBubN(P.s), near = p && Math.hypot(P.x - p.x, P.y - p.y) < WG_BUB_NEAR;
    for (let i = 0; i < n; i++) {
      const life = wgBubLife(P, i);
      if (k > life) { // just popped: four droplets flying apart for a fifth of a second
        const u = (k - life) / 0.2; if (u > 1) continue;
        const E = wgBubAt(P, i, life); if (u < 0.25 && near) pops++;
        const x = Math.round(E.x - cx0), y = Math.round(E.y - E.z - cy0), d = 2 + E.r + Math.round(u * 3);
        ctx.globalAlpha = 1 - u; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rect(x + dx * d, y + dy * d, 1, 1, 'C');
        ctx.globalAlpha = 1; continue;
      }
      const B = wgBubAt(P, i, k);
      const x = Math.round(B.x - cx0), y = Math.round(B.y - cy0), c = wgBubArt(B.r, (fr + i) % 2);
      const a = Math.min(1, k / 0.15);
      ctx.globalAlpha = 0.35 * a; shadow(x, y, 2 + B.r); ctx.globalAlpha = a;
      ctx.drawImage(c, x - (c.width >> 1), Math.round(y - B.z) - (c.height >> 1));
    }
  }
  ctx.globalAlpha = 1;
  if (pops && T - WGBB.popT > 0.12) { WGBB.popT = T; wgSfx('soap'); }
};
function wgBubArt(r, f) { // a soap bubble, radius 2 to 4: a thin rim with a shimmer that turns, a white glint at the top left
  const key = 'bub_' + r + '_' + f; if (WGA.cache[key]) return WGA.cache[key];
  const R = r + 2, S = R * 2 + 1, sheen = f ? ['q', '4', 'Y', 'C'] : ['4', 'Y', 'C', 'q'];
  return wgMake(key, S, S, (g) => {
    g.globalAlpha = 0.18; for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (Math.hypot(x - R, y - R) < R - 0.5) wgPx(g, x, y, 'C');
    g.globalAlpha = 1;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - R, y - R); if (d < R - 0.5 || d >= R + 0.5) continue;
      const ang = Math.atan2(y - R, x - R), q = ((Math.floor((ang + Math.PI) / (Math.PI / 2)) % 4) + 4) % 4;
      wgPx(g, x, y, x + y > S ? sheen[q] : 'C'); // the shimmer on the lower right, the pale rim on the upper left
    }
    wgPx(g, R - Math.ceil(R / 2), R - Math.ceil(R / 2), 'w'); if (r > 1) wgPx(g, R - Math.ceil(R / 2) + 1, R - Math.ceil(R / 2), 'w');
  }, false);
}
const _wgTipBub = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipBub(s);
  if (s.id === 'bubble_wand') L.push('USE BLOWS BUBBLES', 'THEY DRIFT WITH THE WIND');
  return L;
};
const _wgIconBub = wgIcon;
wgIcon = function (id) { // a wooden handle with a loop of wire at its top and a bubble floating off it
  const key = 'ic_' + id; if (id !== 'bubble_wand' || WGA.cache[key]) return _wgIconBub(id);
  const [c, g] = wgCv(16, 16);
  wgLine(g, 3, 13, 7, 9, 'N'); wgLine(g, 4, 13, 8, 9, 'n');
  for (const [x, y] of [[8, 6], [9, 5], [10, 5], [11, 6], [11, 7], [10, 8], [9, 8], [8, 7]]) wgPx(g, x, y, 'y');
  wgPx(g, 9, 6, 'C'); wgPx(g, 10, 6, 'C'); wgPx(g, 9, 7, 'C'); wgPx(g, 10, 7, 'q');
  for (const [x, y, k] of [[13, 2, 'C'], [14, 3, 'q'], [13, 4, '4'], [12, 3, 'C']]) wgPx(g, x, y, k);
  wgOutline(c); WGA.cache[key] = c; return c;
};
