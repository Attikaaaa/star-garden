'use strict';
// Wildgrove: fireworks. Made at the workbench, three at a time; USE one in hand at dusk or at night under the open sky
// and it goes up from beside the hero with a little trail, then bursts into a ring of sparks in one of WG_FW_COLS that
// spread, sag and twinkle out, lighting the ground for a moment. Like sky lanterns, a launch goes out as an 'fw' message
// (the host passes a guest's on) and each screen flies it from its own clock and the firework's seed, so everyone sees
// the same burst. The FIREWORKS NIGHT star after five.
const WG_FW_UP = 1.1, WG_FW_T = 3.4, WG_FW_MAX = 12, WG_FW_N = 32, WG_FW_OUT = 20; // seconds rising; seconds in all; most aloft at once; sparks a burst, of them the outer ring
const WG_FW_COLS = [['r', 'R', 'y'], ['B', 'c', 'C'], ['P', 'q', 'L'], ['y', 'Y', 'w'], ['G', 'h', 'H'], ['2', '3', '4']];
const WGFW = { list: [], w: null };
(function () {
  wgItem('firework', 'FIREWORK', 'res', {}); wgRec('firework', 3, { stick: 1, coal: 1, string: 1 }, 'bench');
  WG_ACH.push(['fireworks', 'FIREWORKS NIGHT', 'SEND FIVE FIREWORKS UP', (c) => (c.st.fireworks | 0) >= 5]);
})();
function wgFwAdd(x, y, d, s) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e7 || Math.abs(y) > 1e7 || (d !== 'o' && d !== 'k')) return false;
  const L = WGFW.list; L.push({ x, y, d, s: Math.abs(s | 0) % 10000, t0: WGS.t, pop: 0 }); if (L.length > WG_FW_MAX) L.shift();
  return true;
}
const _wgUseFw = wgUse;
wgUse = function (tx, ty) {
  if (_wgUseFw(tx, ty)) return true;
  const s = WGS.inv[WGS.sel], p = WGS.p; if (!s || s.id !== 'firework' || !WGS.world) return false;
  if (!wgSkyOpen()) { wgToast('IT NEEDS THE OPEN SKY'); return true; }
  if (wgNight(WGS.clock) < 0.1) { wgToast('IT SHINES BEST AT NIGHT'); return true; }
  const seed = Math.floor(Math.random() * 10000), x = Math.round(p.x + (p.face === 'l' ? -10 : 10)), y = Math.round(p.y);
  wgInvTake(WGS.inv, 'firework', 1); wgFwAdd(x, y, WGS.dim, seed); wgSfx('swish');
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.fireworks = (st.fireworks | 0) + 1;
  if (WGN.role) { const msg = { t: 'fw', x, y, d: WGS.dim, s: seed }; if (WGN.role === 'host') wgnAll(msg, null); else wgnSend(WGN.link, msg); }
  return true;
};
// the net: a guest's firework is checked on the host, flown there and passed on (one a third of a second per friend at most)
const _wgnHostFw = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostFw(L, m);
  if (!m || m.t !== 'fw' || !WGS.world) return;
  const now = performance.now(); if (now - (L.fwT || 0) < 330) return; L.fwT = now;
  if (wgFwAdd(+m.x, +m.y, m.d, +m.s)) wgnAll({ t: 'fw', x: +m.x, y: +m.y, d: m.d, s: +m.s | 0 }, L);
};
const _wgnClientFw = wgnClientMsg;
wgnClientMsg = function (L, m) {
  _wgnClientFw(L, m);
  if (m && m.t === 'fw' && WGS.world && L && L.open) wgFwAdd(+m.x, +m.y, m.d, +m.s);
};
const _wgUpdFw = updateWG;
updateWG = function (dt) {
  _wgUpdFw(dt);
  if (WGFW.w !== WGS.world) { WGFW.w = WGS.world; WGFW.list.length = 0; } // another world: its sky is empty
  const L = WGFW.list, p = WGS.p; while (L.length && (WGS.t - L[0].t0 > WG_FW_T || L[0].t0 > WGS.t)) L.shift();
  for (const f of L) if (!f.pop && WGS.t - f.t0 >= WG_FW_UP) { f.pop = 1; if (p && f.d === WGS.dim && Math.hypot(f.x - p.x, f.y - p.y) < 320) wgSfx('star'); } // the bang, for those near
};
const _wgTipFw = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipFw(s);
  if (s.id === 'firework') L.push('USE IT AT NIGHT UNDER THE OPEN SKY', 'FRIENDS SEE IT BURST');
  return L;
};
// where it is: rising with a slight lean and slowing to the top, then each spark flies out, slows and sags
function wgFwTop(f) { return { x: f.x + ((f.s % 7) - 3) * 3, y: f.y - 16 - 70 - f.s % 30 }; }
function wgFwAt(f, k) { // the rocket's place while it rises (k from 0 to WG_FW_UP)
  const u = Math.min(1, k / WG_FW_UP), e = 1 - (1 - u) * (1 - u), T = wgFwTop(f);
  return { x: f.x + (T.x - f.x) * u, y: f.y - 16 + (T.y - f.y + 16) * e };
}
function wgFwSpark(f, i, k, out) { // spark i, k seconds after the burst
  const o = i < WG_FW_OUT, a = (o ? i / WG_FW_OUT : (i - WG_FW_OUT + 0.5) / (WG_FW_N - WG_FW_OUT)) * Math.PI * 2 + (f.s % 10) * 0.1; // two rings, like a chrysanthemum
  const T = wgFwTop(f), v = (o ? 38 : 20) + (hash(f.s, i, 41) % 10) * 1.2, r = v * (1 - Math.exp(-2.2 * k)) / 2.2;
  out.x = T.x + Math.cos(a) * r; out.y = T.y + Math.sin(a) * r * 0.85 + 10 * k * k; return out;
}
const WGFW_P = { x: 0, y: 0 }, WGFW_Q = { x: 0, y: 0 };
// drawn over the dark: the rocket and its trail, then the burst with a flash of light on the ground below
const _wgLightFw = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  const L = WGFW.list, T = WGS.t;
  for (const f of L) { const k = T - f.t0 - WG_FW_UP; if (f.d === WGS.dim && k >= 0 && k < 0.4) { const P = wgFwTop(f); WGR.lights.push({ x: P.x - cx0, y: P.y + 30 - cy0, r: 44, f: 1 }); } }
  _wgLightFw(cx0, cy0);
  for (const f of L) {
    if (f.d !== WGS.dim) continue;
    const k = T - f.t0;
    if (k < WG_FW_UP) { // the rocket: a bright head and a few falling sparks behind it
      const P = wgFwAt(f, k), sx = Math.round(P.x - cx0), sy = Math.round(P.y - cy0);
      rect(sx, sy, 1, 2, 'Y');
      for (let j = 1; j <= 3; j++) { const Q = wgFwAt(f, Math.max(0, k - j * 0.05)); if ((hash(f.s, j, Math.floor(T * 20)) & 3) !== 0) rect(Math.round(Q.x - cx0) + (j & 1), Math.round(Q.y - cy0) + 2, 1, 1, j < 2 ? 'O' : 'o'); }
      continue;
    }
    const b = k - WG_FW_UP, life = WG_FW_T - WG_FW_UP, C = WG_FW_COLS[f.s % WG_FW_COLS.length];
    ctx.globalAlpha = b < life * 0.55 ? 1 : Math.max(0, (life - b) / (life * 0.45));
    for (let i = 0; i < WG_FW_N; i++) {
      if (b > 0.8 && (Math.floor(T * 12) + i) % 3 === 0) continue; // twinkling out
      const P = wgFwSpark(f, i, b, WGFW_P), sx = Math.round(P.x - cx0), sy = Math.round(P.y - cy0);
      for (const d of [0.05, 0.11]) if (b > d) { const Q = wgFwSpark(f, i, b - d, WGFW_Q); rect(Math.round(Q.x - cx0), Math.round(Q.y - cy0), 1, 1, C[0]); } // its trail
      rect(sx, sy, 1, 1, b < 0.15 ? 'w' : C[1 + (i & 1)]);
    }
    if (b < 0.12) { const P = wgFwTop(f); rect(Math.round(P.x - cx0) - 1, Math.round(P.y - cy0) - 1, 3, 3, 'w'); } // the flash
    ctx.globalAlpha = 1;
  }
};
const _wgIconFw = wgIcon;
wgIcon = function (id) { // a red rocket on its stick: a gold cone, a white band
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'firework') return _wgIconFw(id);
  const [c, g] = wgCv(16, 16);
  wgRc(g, 6, 4, 4, 7, 'r'); wgRc(g, 6, 4, 1, 7, 'R'); wgRc(g, 9, 4, 1, 7, 'p'); wgRc(g, 6, 7, 4, 1, 'L'); wgRc(g, 9, 7, 1, 1, 'l');
  wgRc(g, 7, 2, 2, 2, 'y'); wgPx(g, 7, 2, 'Y'); wgRc(g, 6, 3, 4, 1, 'y'); wgPx(g, 9, 3, 'O'); wgPx(g, 8, 1, 'O');
  wgRc(g, 8, 11, 1, 4, 'N'); wgPx(g, 9, 11, 'u');
  wgOutline(c); WGA.cache[key] = c; return c;
};
