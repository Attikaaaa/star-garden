'use strict';
// Wildgrove: ice skates. Held in hand on ice they carry the hero quicker than walking and steer true instead of sliding
// about, and let go of the keys the hero glides on a little way (WGKS.vx, vy) before coming to rest. Blades show under
// the boots, and the skater leaves a thin, swaying line behind on the ice that fades in WG_SKATE_MARK s (each screen its
// own, friends' too, never saved). Friends see you skate: a guest sends 'sa' in the 'p' message, the host lists it at
// index 15 of 'ps' (wg_net). The ICE DANCER star after 200 tiles skated.
const WG_SKATE = 1.6, WG_SKATE_GLIDE = 2.4, WG_SKATE_MARK = 9, WG_SKATE_MARKS = 220; // speed on ice; how fast a glide dies away; marks
const WGKS = { vx: 0, vy: 0, marks: [], w: null, last: new Map() }; // the glide; marks: x0, y0, x1, y1, dim, time; last place per skater
(function () {
  wgItem('skates', 'ICE SKATES', 'res', { stack: 1 }); wgRec('skates', 1, { iron: 2, leather: 2, string: 1 }, 'anvil');
  WG_ACH.push(['skate', 'ICE DANCER', 'SKATE 200 TILES ON ICE', (c) => (c.st.skate | 0) >= 200]);
})();
const wgSkatesHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!(s && s.id === 'skates'); };
const wgOnIce = (q, dim) => { const g = GROUND[wgGround(WGS.world, dim, Math.floor(q.x / 16), Math.floor(q.y / 16))]; return !!(g && g.id === 'ice'); };
const wgSkating = () => { const p = WGS.p; return !!(WGS.world && p && wgSkatesHeld() && !p.sit && p.face !== 'S' && wgOnIce(p, WGS.dim)); };
// a line on the ice from where the skater was to where they are, swaying from side to side as the feet push
function wgSkateMark(key, q, dim) {
  const was = WGKS.last.get(key), x = q.x, y = q.y;
  if (!was || was.dim !== dim) { WGKS.last.set(key, { x, y, dim, s: 0 }); return; }
  const d = Math.hypot(x - was.x, y - was.y); if (d < 4) return;
  if (d > 24 || !wgOnIce(q, dim) || !wgOnIce(was, dim)) { WGKS.last.set(key, { x, y, dim, s: was.s }); return; } // a jump or off the ice: start again
  const s = was.s + d, nx = -(y - was.y) / d, ny = (x - was.x) / d, k0 = Math.sin(was.s / 14) * 2, k1 = Math.sin(s / 14) * 2;
  WGKS.marks.push({ x0: Math.round(was.x + nx * k0), y0: Math.round(was.y - 1 + ny * k0), x1: Math.round(x + nx * k1), y1: Math.round(y - 1 + ny * k1), d: dim, t: WGS.t });
  if (WGKS.marks.length > WG_SKATE_MARKS) WGKS.marks.shift();
  WGKS.last.set(key, { x, y, dim, s });
}
// skating: the ice under the hero is quick and sure while the hero's move runs, then put back (only the hero reads it)
const _wgUpdSkate = updateWG;
updateWG = function (dt) {
  const w = WGS.world, p = WGS.p; if (WGKS.w !== w) { WGKS.w = w; WGKS.marks.length = 0; WGKS.last.clear(); WGKS.vx = WGKS.vy = 0; }
  const on = WGS.scr === 'play' && wgSkating();
  if (!on) { WGKS.vx = WGKS.vy = 0; _wgUpdSkate(dt); }
  else {
    const g = GROUND[G_ID.ice], s0 = g.speed, sl = g.slip, x0 = p.x, y0 = p.y;
    g.speed = s0 * WG_SKATE; g.slip = 0;
    try { _wgUpdSkate(dt); } finally { g.speed = s0; g.slip = sl; }
    const mx = p.x - x0, my = p.y - y0;
    if (p.moving && dt > 0 && Math.hypot(mx, my) < 8) { WGKS.vx = mx / dt; WGKS.vy = my / dt; } // pushing: the glide is the way you go
    else if (!p.moving && WGS.scr === 'play' && wgSkating() && (WGKS.vx || WGKS.vy)) { // let go: glide on, slower and slower
      const k = Math.exp(-dt * WG_SKATE_GLIDE); WGKS.vx *= k; WGKS.vy *= k;
      if (Math.hypot(WGKS.vx, WGKS.vy) < 6) WGKS.vx = WGKS.vy = 0;
      else { const ax = p.x; wgMoveBox(p, WGKS.vx * dt, 0, 4, 2); if (p.x === ax) WGKS.vx = 0; const ay = p.y; wgMoveBox(p, 0, WGKS.vy * dt, 4, 2); if (p.y === ay) WGKS.vy = 0; }
    } else WGKS.vx = WGKS.vy = 0;
    const d = Math.hypot(p.x - x0, p.y - y0); if (d > 0 && d < 8) { const m = w.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.skate = Math.min(99999, (st.skate || 0) + d / 16); }
  }
  if (!w || !p || WGS.scr !== 'play') return;
  const L = WGKS.marks; while (L.length && (WGS.t - L[0].t > WG_SKATE_MARK || L[0].t > WGS.t)) L.shift();
  if (wgSkating()) wgSkateMark(-1, p, WGS.dim); else WGKS.last.delete(-1);
  for (const q of WGS.remote || []) if (q.skate) wgSkateMark(q.pid, q, q.dim); else WGKS.last.delete(q.pid);
};
// the marks, on the ground under everything that stands: the chunk upkeep runs right after the ground is painted
const _wgUpkeepSkate = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepSkate(w, dim, cx0c, cy0c, cx1c, cy1c);
  const L = WGKS.marks; if (!L.length || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2, T = WGS.t;
  ctx.fillStyle = PAL.w;
  for (const m of L) {
    if (m.d !== dim) continue;
    const sx = m.x0 - cx0, sy = m.y0 - cy0; if (sx < -SCR.ox - 30 || sy < -SCR.oy - 30 || sx > SCR.w - SCR.ox + 30 || sy > SCR.h - SCR.oy + 30) continue;
    const age = T - m.t; ctx.globalAlpha = age < WG_SKATE_MARK * 0.5 ? 0.6 : age < WG_SKATE_MARK * 0.8 ? 0.38 : 0.18; // fading in three steps
    const dx = m.x1 - m.x0, dy = m.y1 - m.y0, n = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i < n; i++) ctx.fillRect(Math.round(sx + dx * i / n), Math.round(sy + dy * i / n), 1, 1);
  }
  ctx.globalAlpha = 1;
};
// a skater stands tall on the blades and glides, the feet together; the blades under the boots, the toe curled up
const _wgDrawPlayerSkate = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p, on = p === WGS.p ? wgSkating() : p.skate && p.dim === WGS.dim && wgOnIce(p, p.dim);
  if (!on) return _wgDrawPlayerSkate(e, cx0, cy0);
  const mv = p.moving; p.moving = false; try { _wgDrawPlayerSkate(e, cx0, cy0); } finally { p.moving = mv; }
  if (p.hidden || (p.inv > 0 && Math.floor(WGS.t * 20) % 2)) return;
  const sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0);
  if (p.face === 'l' || p.face === 'r') { // side on: one blade under both boots (sx - 1 .. sx + 3 facing left, mirrored facing right)
    const l = p.face === 'l', x = l ? sx - 3 : sx - 5, toe = l ? x : x + 7, out = l ? -1 : 1;
    rect(x - 1, sy, 10, 2, '0'); rect(x, sy, 8, 1, 'm'); rect(l ? x + 1 : x + 6, sy, 1, 1, 'L'); // the blade, a glint near the toe
    rect(toe, sy - 1, 1, 1, 'm'); rect(toe + out, sy - 1, 1, 1, '0'); rect(toe, sy - 2, 1, 1, '0'); // the toe curling up
  } else for (const x of [sx - 2, sx + 2]) { rect(x - 1, sy, 3, 2, '0'); rect(x, sy, 1, 1, 'l'); } // end on: a thin blade under each boot
};
const _wgTipSkate = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipSkate(s);
  if (s.id === 'skates') L.push('HOLD THEM TO SKATE ON ICE', 'YOU STEER TRUE AND GLIDE ON');
  return L;
};
const _wgIconSkate = wgIcon;
wgIcon = function (id) { // a white boot with red laces on a silver blade, the toe curled up
  const key = 'ic_' + id; if (id !== 'skates' || WGA.cache[key]) return _wgIconSkate(id);
  const [c, g] = wgCv(16, 16);
  wgPaint(g, 0, 0, ['................', '................', '....wLLl........', '....wrLl........', '....wLLl........', '....wrLl........', '....wLLlL.......',
    '....wrLLLl......', '....wLLLLLl.....', '....wLLLLLLl....', '....nnnnnnnn....', '.....d....d..m..', '...Lmmmmmmmmm...', '................', '................', '................'],
    { w: 'w', L: 'L', l: 'l', r: 'r', n: 'n', d: 'd', m: 'm' });
  wgOutline(c); WGA.cache[key] = c; return c;
};
