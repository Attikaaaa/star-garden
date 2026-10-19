'use strict';
// Wildgrove: skipping stones. USE a stone in hand on water and it flies from the hero's hand toward the aim, skipping
// over the water in hops that grow shorter and lower, a ring spreading where it touches, until it sinks or comes to
// rest on the far shore. How many skips it may make is drawn when it is thrown; the path comes from the tiles alone
// (wgSkipPath), so a friend's stone goes out as a 'skip' message (checked on the host, which passes it on) and every
// screen near it flies the same one. The STONE SKIPPER star for five skips.
const WG_SKIP_MAX = 8, WG_SKIP_HOP = 0.34, WG_SKIP_NEAR = 480;
const WGSK = { list: [], w: null };
(function () {
  WG_ACH.push(['skip', 'STONE SKIPPER', 'SKIP A STONE FIVE TIMES', (c) => c.st.skip5]);
})();
const wgSkipWet = (w, dim, x, y) => { const g = GROUND[wgGround(w, dim, Math.floor(x / 16), Math.floor(y / 16))]; return !!g && g.liq === 'water'; };
function wgSkipPath(w, dim, x, y, a, n, l0) { // where it touches down, hop by hop (the first at the aim, l0 away); it sinks after n skips, or rests where it lands on dry ground
  const pts = [], tm = [0]; let len = l0, cx = x, cy = y, t = 0, dur = WG_SKIP_HOP, skips = 0, wet = false;
  for (let i = 0; i <= n; i++) {
    cx += Math.cos(a) * len; cy += Math.sin(a) * len; t += dur;
    wet = wgSkipWet(w, dim, cx, cy); pts.push([Math.round(cx), Math.round(cy), Math.min(len, 34), wet]); tm.push(t);
    if (!wet) break;
    if (i < n) skips++;
    len = i ? len * 0.76 : 30; dur *= 0.85;
  }
  return { pts, tm, skips, sink: wet };
}
function wgSkipAdd(x, y, a, n, l, d, own) {
  if (![x, y, a, l].every(Number.isFinite) || Math.abs(x) > 1e7 || Math.abs(y) > 1e7 || d !== WGS.dim) return false;
  n = Math.max(0, Math.min(7, n | 0)); l = Math.max(8, Math.min(80, l));
  const p = WGS.p; if (!own && (!p || Math.hypot(x - p.x, y - p.y) > WG_SKIP_NEAR)) return true; // too far to see: nothing to fly here
  const P = wgSkipPath(WGS.world, d, x, y, a, n, l), L = WGSK.list;
  L.push(Object.assign(P, { x, y, d, t0: WGS.t, own })); if (L.length > WG_SKIP_MAX) L.shift();
  return true;
}
const _wgUseSkip = wgUse;
wgUse = function (tx, ty) {
  if (_wgUseSkip(tx, ty)) return true;
  const s = WGS.inv[WGS.sel], p = WGS.p, w = WGS.world; if (!s || s.id !== 'stone' || !w || !wgSkipWet(w, WGS.dim, tx * 16 + 8, ty * 16 + 8)) return false;
  const x = Math.round(p.x), y = Math.round(p.y), a = Math.round(Math.atan2(ty * 16 + 8 - y, tx * 16 + 8 - x) * 1000) / 1000, l = Math.round(Math.hypot(ty * 16 + 8 - y, tx * 16 + 8 - x));
  const n = Math.floor(Math.random() * Math.random() * 8 + 0.85); // mostly two or three, now and then a long run, rarely a plop
  wgInvTake(WGS.inv, 'stone', 1); wgSkipAdd(x, y, a, n, l, WGS.dim, true); wgSfx('swing'); p.swing = 0.25;
  if (WGN.role) { const msg = { t: 'skip', x, y, a, n, l, d: WGS.dim }; if (WGN.role === 'host') wgnAll(msg, null); else wgnSend(WGN.link, msg); }
  return true;
};
// the net: a guest's stone is checked on the host (thrown from beside that guest), flown there and passed on
const _wgnHostSkip = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostSkip(L, m);
  if (!m || m.t !== 'skip' || !WGS.world || m.d !== L.dim || !(Math.hypot(+m.x - L.x, +m.y - L.y) < 48)) return;
  const now = performance.now(); if (now - (L.skipT || 0) < 400) return; L.skipT = now;
  if (wgSkipAdd(+m.x, +m.y, +m.a, +m.n, +m.l, m.d, false)) wgnAll({ t: 'skip', x: +m.x, y: +m.y, a: +m.a, n: Math.max(0, Math.min(7, +m.n | 0)), l: +m.l, d: m.d }, L);
};
const _wgnClientSkip = wgnClientMsg;
wgnClientMsg = function (L, m) { _wgnClientSkip(L, m); if (m && m.t === 'skip' && WGS.world) wgSkipAdd(+m.x, +m.y, +m.a, +m.n, +m.l, m.d, false); };
const _wgUpdSkip = updateWG;
updateWG = function (dt) {
  _wgUpdSkip(dt);
  const w = WGS.world, L = WGSK.list;
  if (WGSK.w !== w) { WGSK.w = w; L.length = 0; }
  for (let i = L.length - 1; i >= 0; i--) {
    const s = L[i], T = WGS.t - s.t0, end = s.tm[s.tm.length - 1];
    if (s.own && !s.told && T >= end) { // it has come to a stop: how did it go?
      s.told = 1; wgToast(s.skips > 1 ? s.skips + ' SKIPS!' : s.skips ? 'ONE SKIP!' : 'PLOP!', 1.8); if (s.sink) wgSfx('bubble');
      if (s.skips >= 5 && w) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.skip5 = 1; }
    }
    if (T > end + 1.2 || T < 0 || s.d !== WGS.dim) L.splice(i, 1);
  }
};
// drawing: the stone in its hop over its shadow, a ring at every touch
function wgSkipRing(x, y, k) { // a flat ring, k from 0 (a dot) to 1 (wide and faint)
  const r = 1.5 + k * 5, q = r * 0.5;
  ctx.globalAlpha = k < 0.5 ? 1 : k < 0.8 ? 0.6 : 0.3; ctx.fillStyle = PAL.C;
  let lx = 1e9, ly = 0; // each pixel once, so the faded ring stays even
  for (let i = 0; i < 32; i++) { const an = i * Math.PI / 16, px = Math.round(x + Math.cos(an) * r), py = Math.round(y + Math.sin(an) * q); if (px !== lx || py !== ly) ctx.fillRect(px, py, 1, 1); lx = px; ly = py; }
  ctx.globalAlpha = 1;
}
const _wgAmbSkip = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbSkip(cx0, cy0);
  const L = WGSK.list; if (!L.length) return;
  for (const s of L) {
    const T = WGS.t - s.t0, P = s.pts, tm = s.tm;
    for (let j = 0; j < P.length; j++) { const k = (T - tm[j + 1]) / 0.8; if (P[j][3] && k >= 0 && k < 1) wgSkipRing(P[j][0] - cx0, P[j][1] - cy0, k); }
    let i = 0; while (i < P.length && T >= tm[i + 1]) i++;
    if (i >= P.length) { if (!s.sink && T < tm[tm.length - 1] + 1.2) { const [x, y] = P[P.length - 1]; rect(Math.round(x - cx0), Math.round(y - cy0) - 1, 2, 2, 'm'); } continue; } // at rest on the shore a while
    const [x0, y0] = i ? P[i - 1] : [s.x, s.y], [x1, y1, len] = P[i], f = (T - tm[i]) / (tm[i + 1] - tm[i]);
    const gx = x0 + (x1 - x0) * f, gy = y0 + (y1 - y0) * f, z = Math.sin(Math.PI * f) * len * 0.22 + (i ? 0 : (1 - f) * 10); // the first flight starts at the hand
    const sx = Math.round(gx - cx0), sy = Math.round(gy - cy0);
    shadow(sx + 1, sy + 1, 4); rect(sx, sy - Math.round(z) - 1, 2, 2, 'm'); rect(sx, sy - Math.round(z) - 1, 1, 1, 'l');
  }
};
const _wgTipSkip = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipSkip(s);
  if (s.id === 'stone') L.push('USE IT ON WATER TO SKIP IT');
  return L;
};
