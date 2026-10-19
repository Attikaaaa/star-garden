'use strict';
// Wildgrove: snowball fights. USE a snowball in hand and it is thrown toward the aim (up to WG_SNOW_R px, even with
// the aim out of reach) in a low arc over its shadow; it bursts on the first solid thing in its way (`wgSnowPath`, from
// the tiles alone), on a hero it meets on the way, or where it lands, leaving a white splat on the ground for a while.
// Nobody is hurt. A friend's throw goes out as a 'snow' message (checked on the host, which passes it on with the
// thrower's pid), and every screen near it flies the same ball; each screen judges the heroes it shows, so a friend
// struck sees SPLAT and the thrower is told of a hit. The SNOWBALL FIGHT star for the first friend hit.
const WG_SNOW_R = 112, WG_SNOW_V = 150, WG_SNOW_NEAR = 480, WG_SNOW_MARK = 6; // reach, speed, how near a throw is flown, a splat's seconds
const WGSB = { list: [], marks: [], w: null, t: -1 }; // balls in flight, splats on the ground, when you last threw
(function () {
  WG_ACH.push(['snowfight', 'SNOWBALL FIGHT', 'HIT A FRIEND WITH A SNOWBALL', (c) => c.st.snowhit]);
})();
const wgSnowHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!(s && s.id === 'snowball'); };
function wgSnowPath(w, dim, x, y, a, r) { // how far it flies before something solid stops it
  for (let d = 8; d < r; d += 4) {
    const id = wgObjAt(w, dim, Math.floor((x + Math.cos(a) * d) / 16), Math.floor((y + Math.sin(a) * d) / 16)), o = id && OBJ[id];
    if (o && o.solid !== 0) return d;
  }
  return r;
}
function wgSnowAdd(x, y, a, r, d, pid) { // pid: who threw it (-1 for you)
  if (![x, y, a, r].every(Number.isFinite) || Math.abs(x) > 1e7 || Math.abs(y) > 1e7 || d !== WGS.dim || !WGS.world) return false;
  r = Math.max(8, Math.min(WG_SNOW_R, r));
  const p = WGS.p; if (pid !== -1 && (!p || Math.hypot(x - p.x, y - p.y) > WG_SNOW_NEAR)) return true; // too far to see: nothing to fly here
  const L = WGSB.list; L.push({ x, y, a, r: wgSnowPath(WGS.world, d, x, y, a, r), d, pid, t0: WGS.t }); if (L.length > 12) L.shift();
  return true;
}
function wgSnowThrow() { // your hero throws one toward the aim
  const p = WGS.p, w = WGS.world; if (!p || !w || !wgSnowHeld() || (WGS.t - WGSB.t < 0.3 && WGS.t >= WGSB.t)) return false;
  WGSB.t = WGS.t; const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const a = Math.round((WGS.aim || 0) * 1000) / 1000, x = Math.round(p.x), y = Math.round(p.y);
  const r = Input.lastAim === 'mouse' || Input.lastAim === 'touch' ? Math.round(Math.min(WG_SNOW_R, Math.max(16, Math.hypot(Input.mx + cx0 - x, Input.my + cy0 - y)))) : WG_SNOW_R;
  wgInvTake(WGS.inv, 'snowball', 1); wgSnowAdd(x, y, a, r, WGS.dim, -1); wgSfx('swing'); p.swing = 0.25;
  if (WGN.role) { const msg = { t: 'snow', x, y, a, r, d: WGS.dim }; if (WGN.role === 'host') wgnAll(Object.assign({ pid: 0 }, msg), null); else wgnSend(WGN.link, msg); }
  return true;
}
const _wgnHostSnow = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostSnow(L, m);
  if (!m || m.t !== 'snow' || !WGS.world || !(L.pid > 0) || m.d !== L.dim || !(Math.hypot(+m.x - L.x, +m.y - L.y) < 48)) return;
  const now = performance.now(); if (now - (L.snowT || 0) < 250) return; L.snowT = now;
  if (wgSnowAdd(+m.x, +m.y, +m.a, +m.r, m.d, L.pid)) wgnAll({ t: 'snow', pid: L.pid, x: +m.x, y: +m.y, a: +m.a, r: Math.max(8, Math.min(WG_SNOW_R, +m.r)), d: m.d }, L);
};
const _wgnClientSnow = wgnClientMsg;
wgnClientMsg = function (L, m) {
  _wgnClientSnow(L, m);
  if (m && m.t === 'snow' && Number.isInteger(m.pid) && m.pid >= 0 && m.pid !== WGN.pid) wgSnowAdd(+m.x, +m.y, +m.a, +m.r, m.d, m.pid);
};
const _wgUseSnow = wgUse;
wgUse = function (tx, ty) {
  if (!wgSnowHeld()) return _wgUseSnow(tx, ty);
  return _wgUseSnow(tx, ty) || (wgSnowThrow(), true);
};
// flight: where the ball is at a moment, and who it meets on the way
const wgSnowAt = (b, T) => { const d = Math.min(b.r, T * WG_SNOW_V); return [b.x + Math.cos(b.a) * d, b.y + Math.sin(b.a) * d, d]; };
function wgSnowBurst(b, x, y) {
  b.done = 1; WGSB.marks.push({ x: Math.round(x), y: Math.round(y), d: b.d, t: WGS.t }); if (WGSB.marks.length > 16) WGSB.marks.shift();
  wgPart(x, y - 4, 7, { c: ['w', 'L', 'l'], s: 24, up: 18, life: 0.5 }); const p = WGS.p; if (p && Math.hypot(x - p.x, y - p.y) < 240) wgSfx('cut');
}
const _wgUpdSnow = updateWG;
updateWG = function (dt) {
  const fresh = WGS.scr === 'play' && wgSnowHeld() && (Input.rHit || pressed(wgKey('use'), 'KeyK', 'PadX', 'PadLT') || (WGS.touch && WGS.touch.use));
  _wgUpdSnow(dt);
  if (fresh && WGS.scr === 'play' && !WGS.target) wgSnowThrow(); // the aim out of reach: thrown all the same
  const w = WGS.world, p = WGS.p, L = WGSB.list; if (WGSB.w !== w) { WGSB.w = w; L.length = 0; WGSB.marks.length = 0; }
  while (WGSB.marks.length && (WGS.t - WGSB.marks[0].t > WG_SNOW_MARK || WGSB.marks[0].t > WGS.t)) WGSB.marks.shift();
  for (let i = L.length - 1; i >= 0; i--) {
    const b = L[i], T = WGS.t - b.t0; if (T < 0 || b.d !== WGS.dim) { L.splice(i, 1); continue; }
    if (!b.done) {
      const [x, y, d] = wgSnowAt(b, T);
      if (d > 14 && p && b.pid !== -1 && !p.hidden && Math.hypot(x - p.x, y - (p.y - 4)) < 8) { wgSnowBurst(b, x, y); wgToast('SPLAT!', 1.5); } // it got you
      else if (d > 14) for (const q of WGS.remote || []) if (q.pid !== b.pid && q.dim === b.d && Math.hypot(x - q.x, y - (q.y - 4)) < 8) {
        wgSnowBurst(b, x, y);
        if (b.pid === -1 && w) { wgToast('A DIRECT HIT!', 1.8); const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.snowhit = 1; }
        break;
      }
      if (!b.done && d >= b.r) wgSnowBurst(b, x, y);
    }
    if (b.done && T > b.r / WG_SNOW_V + 0.1) L.splice(i, 1);
  }
};
// drawing: the ball in its arc over its shadow; the splats on the ground
const _wgAmbSnow = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbSnow(cx0, cy0);
  for (const b of WGSB.list) {
    if (b.done) continue;
    const T = WGS.t - b.t0, [x, y, d] = wgSnowAt(b, T), f = d / Math.max(1, b.r), h = Math.round(10 * (1 - f) + 4 * b.r / 112 * 4 * f * (1 - f) * 2);
    const sx = Math.round(x - cx0), sy = Math.round(y - cy0); shadow(sx, sy, 5); ctx.drawImage(wgSnowArt(), sx - 3, sy - h - 4);
  }
};
const _wgUpkeepSnow = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepSnow(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (!WGSB.marks.length || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  for (const m of WGSB.marks) {
    if (m.d !== dim) continue;
    const age = WGS.t - m.t; ctx.globalAlpha = age < WG_SNOW_MARK * 0.6 ? 1 : 0.5; // melting in two steps
    ctx.drawImage(wgSnowSplat(), m.x - cx0 - 4, m.y - cy0 - 3);
  }
  ctx.globalAlpha = 1;
};
function wgSnowSplat() { // a burst of snow, flat on the ground: white with a shaded rim, so it shows on snow as on grass
  if (WGA.cache.snowball_splat) return WGA.cache.snowball_splat;
  return wgMake('snowball_splat', 9, 6, (g) => wgPaint(g, 0, 0, ['.l..m..l.', '..lwwwl..', 'lwwwwwwlm', '.lwwLwwwl', 'm.lllll..', '.l.....l.'], { w: 'w', l: 'l', L: 'L' }), false);
}
function wgSnowArt() { // a little snowball, lit from the top left
  if (WGA.cache.snowball_fly) return WGA.cache.snowball_fly;
  return wgMake('snowball_fly', 7, 7, (g) => wgPaint(g, 1, 1, ['.wLL.', 'wwLLl', 'LLLll', 'LLllm', '.llm.'], { w: 'w', L: 'L', l: 'l', m: 'm' }));
}
const _wgTipSnow = wgTipLines;
wgTipLines = function (s) { const L = _wgTipSnow(s); if (s.id === 'snowball') L.push('USE THROWS IT'); return L; };
