'use strict';
// Wildgrove: paper boats. Folded from plant fiber at a bench; USE one on water within reach and it is set afloat
// there: it drifts slowly with the wind (`wgWindA`, the weather vane's), bobbing and wandering a little on its own,
// until it runs ashore and rests there; after `WG_PB_T` s it is gone. Friends see it: the launch goes out as a 'pboat'
// message (the host checks it came from beside that guest, rate-limits it and passes it on) and each screen sails it
// from its own clock (`WGPBT.list`, at most `WG_PB_MAX`). Slotted into the depth order by a `wgEntities` wrapper. The
// SET SAIL star after five.
const WG_PB_T = 45, WG_PB_MAX = 12, WG_PB_V = 7; // seconds afloat; boats at once; drift speed (px/s)
const WGPBT = { list: [], w: null }; // boats: x, y, dim, seed, start, when it ran ashore
(function () {
  wgItem('paper_boat', 'PAPER BOAT', 'res', {}); wgRec('paper_boat', 2, { fiber: 3 }, 'bench');
  WG_ACH.push(['pboat', 'SET SAIL', 'FLOAT FIVE PAPER BOATS', (c) => (c.st.pboats | 0) >= 5]);
})();
const wgPbWater = (x, y) => { const w = WGS.world; return !!w && GROUND[wgGround(w, WGS.dim, Math.floor(x / 16), Math.floor(y / 16))].liq === 'water'; };
function wgPbAdd(x, y, d, s) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e7 || Math.abs(y) > 1e7 || typeof d !== 'string' || d.length > 2) return false;
  const L = WGPBT.list; L.push({ x, y, d, s: Math.abs(s | 0) % 10000, t0: WGS.t, ashore: 0 }); if (L.length > WG_PB_MAX) L.shift();
  return true;
}
const _wgUsePb = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel], w = WGS.world; if (!s || s.id !== 'paper_boat' || !w) return _wgUsePb(tx, ty);
  if (GROUND[wgGround(w, WGS.dim, tx, ty)].liq !== 'water' || wgObjAt(w, WGS.dim, tx, ty)) return _wgUsePb(tx, ty);
  const x = tx * 16 + 8, y = ty * 16 + 10, seed = Math.floor(Math.random() * 10000);
  wgInvTake(WGS.inv, 'paper_boat', 1); wgPbAdd(x, y, WGS.dim, seed); wgSfx('place'); wgPart(x, y, 4, { c: ['C', 'w'], s: 10, up: 6, life: 0.4 });
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.pboats = (st.pboats | 0) + 1;
  if (WGN.role) { const msg = { t: 'pboat', x, y, d: WGS.dim, s: seed }; if (WGN.role === 'host') wgnAll(msg, null); else wgnSend(WGN.link, msg); }
  return true;
};
const _wgnHostPb = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostPb(L, m);
  if (!m || m.t !== 'pboat' || !WGS.world || !(L.pid > 0)) return;
  const now = performance.now(); if (now - (L.pbT || 0) < 400) return;
  const q = (WGS.remote || []).find(r => r.pid === L.pid); if (!q || q.dim !== m.d || Math.hypot(q.x - m.x, q.y - m.y) > 64) return;
  L.pbT = now; if (wgPbAdd(+m.x, +m.y, m.d, +m.s)) wgnAll({ t: 'pboat', x: +m.x, y: +m.y, d: m.d, s: +m.s | 0 }, L);
};
const _wgnClientPb = wgnClientMsg;
wgnClientMsg = function (L, m) {
  _wgnClientPb(L, m);
  if (m && m.t === 'pboat' && WGS.world) wgPbAdd(+m.x, +m.y, m.d, +m.s);
};
// afloat: the wind pushes, the boat wanders a little of its own, and stops where the water does
const _wgUpdPb = updateWG;
updateWG = function (dt) {
  _wgUpdPb(dt);
  if (WGPBT.w !== WGS.world) { WGPBT.w = WGS.world; WGPBT.list.length = 0; }
  const L = WGPBT.list; while (L.length && (WGS.t - L[0].t0 > WG_PB_T || L[0].t0 > WGS.t)) L.shift();
  if (!L.length || !WGS.world) return;
  const a = wgWindA(), T = WGS.t;
  for (const b of L) {
    if (b.ashore || b.d !== WGS.dim) continue;
    const k = T - b.t0, wob = Math.sin(k * 0.4 + b.s) * 0.8, v = WG_PB_V * Math.min(1, k / 2);
    const nx = b.x + Math.cos(a + wob) * v * dt, ny = b.y + Math.sin(a + wob) * v * 0.6 * dt;
    if (wgPbWater(nx, ny)) { b.x = nx; b.y = ny; } else b.ashore = T;
  }
};
const _wgEntsPb = wgEntities;
wgEntities = function (x0, y0, x1, y1) {
  const out = _wgEntsPb(x0, y0, x1, y1);
  for (const b of WGPBT.list) if (b.d === WGS.dim && b.x > x0 - 16 && b.x < x1 + 16 && b.y > y0 - 16 && b.y < y1 + 16) out.push({ x: b.x, y: b.y, b, draw: wgPbDraw });
  return out;
};
function wgPbDraw(e, cx0, cy0) { // bobbing on its own ripple, facing the way it drifts, fading at the end
  const b = e.b, k = WGS.t - b.t0, x = Math.round(b.x - cx0), y = Math.round(b.y - cy0), bob = b.ashore ? 0 : Math.round(Math.sin(k * 2.6 + b.s) * 0.7);
  ctx.globalAlpha = Math.max(0, Math.min(1, (WG_PB_T - k) / 3, k * 4));
  if (!b.ashore) { ctx.globalAlpha *= 0.5; rect(x - 5, y, 11, 1, 'C'); ctx.globalAlpha /= 0.5; } // its ripple
  ctx.drawImage(wgPbArt(Math.cos(wgWindA()) < 0), x - 5, y - 7 + bob); ctx.globalAlpha = 1;
}
function wgPbArt(left) { // a folded paper boat side on: its hull and its peaked sail, lit from the top left
  const key = 'pboat_' + (left ? 1 : 0); if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 11, 8, (g) => {
    if (left) { g.translate(11, 0); g.scale(-1, 1); }
    wgPaint(g, 1, 1, ['....w....', '...wL....', '..wLLl...', 'w.wLLl..l', 'LwwwwwwLl', '.LLLLLll.'], { w: 'w', L: 'L', l: 'l' });
  });
}
const _wgTipPb = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPb(s); if (s.id === 'paper_boat') L.push('USE IT ON WATER', 'IT DRIFTS WITH THE WIND'); return L; };
const _wgIconPb = wgIcon;
wgIcon = function (id) { // the boat, big
  const key = 'ic_' + id; if (id !== 'paper_boat' || WGA.cache[key]) return _wgIconPb(id);
  const [c, g] = wgCv(16, 16);
  wgPaint(g, 1, 3, ['......w.......', '.....wL.......', '....wLLl......', '...wLLLl......', 'w..wLLLl....l.', 'LwwwwwwwwwwLl.', '.LLLLLLLLLll..', '..lllllllll...'], { w: 'w', L: 'L', l: 'l' });
  wgOutline(c); WGA.cache[key] = c; return c;
};
