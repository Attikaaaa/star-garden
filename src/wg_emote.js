'use strict';
// Wildgrove: emotes. G (or the right trigger, or the touch button with friends in the world) opens a small row of six
// bubbles: a wave, a heart, a smile, a note, a question and a sleepy Zz; the one picked floats over the hero's head
// for three seconds. Friends see it: a guest sends 'emo' to the host, which checks it, rate-limits it and passes it on
// with the guest's pid; the host's own go out with pid 0. Nothing is saved. The SAY IT WITH A SMILE star for all six.
const WG_EMO_N = 6, WG_EMO_T = 3; // emotes; seconds one shows
const WGEM = { me: null, f: new Map(), w: null }; // your emote and each friend's by pid: { k, t } on this screen's clock
(function () {
  WG_ACH.push(['emo', 'SAY IT WITH A SMILE', 'SHOW ALL SIX EMOTES', (c) => ((c.st.emo | 0) & 63) === 63]);
})();
function wgEmote(k) {
  if (!Number.isInteger(k) || k < 0 || k >= WG_EMO_N || !WGS.world) return;
  WGEM.me = { k, t: WGS.t }; wgSfx('place');
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.emo = (st.emo | 0) | (1 << k);
  if (WGN.role === 'host') wgnAll({ t: 'emo', pid: 0, k }, null); else if (WGN.role === 'client') wgnSend(WGN.link, { t: 'emo', k });
}
const _wgnHostEmo = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostEmo(L, m);
  if (!m || m.t !== 'emo' || !(L.pid > 0) || !Number.isInteger(m.k) || m.k < 0 || m.k >= WG_EMO_N) return;
  const now = performance.now(); if (now - (L.emoT || 0) < 400) return; L.emoT = now;
  WGEM.f.set(L.pid, { k: m.k, t: WGS.t }); wgnAll({ t: 'emo', pid: L.pid, k: m.k }, L);
};
const _wgnClientEmo = wgnClientMsg;
wgnClientMsg = function (L, m) {
  _wgnClientEmo(L, m);
  if (m && m.t === 'emo' && Number.isInteger(m.pid) && m.pid >= 0 && m.pid !== WGN.pid && Number.isInteger(m.k) && m.k >= 0 && m.k < WG_EMO_N) WGEM.f.set(m.pid, { k: m.k, t: WGS.t });
};
// ---------- the row of bubbles ----------
const wgEmoOpen = () => { WGS.scr = 'emote'; WGS.ui = {}; WGS.emo = { t0: WGS.t }; wgSfx('select'); };
const _wgUpdEmo = updateWG;
updateWG = function (dt) {
  _wgUpdEmo(dt);
  if (WGEM.w !== WGS.world) { WGEM.w = WGS.world; WGEM.me = null; WGEM.f.clear(); }
  if (!WGS.world) return;
  if (WGS.scr === 'play' && !(typeof WGU !== 'undefined' && WGU.chatOpen) && pressed('KeyG', 'PadRT')) { wgEmoOpen(); return; }
  if (WGS.scr !== 'emote') return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  const ui = WGS.ui;
  if (pressed(...K_LEFT)) { ui.sel = ((ui.sel || 0) + WG_EMO_N - 1) % WG_EMO_N; wgSfx('select'); }
  if (pressed(...K_RIGHT)) { ui.sel = ((ui.sel || 0) + 1) % WG_EMO_N; wgSfx('select'); }
  for (let k = 0; k < WG_EMO_N; k++) if (pressed('Digit' + (k + 1))) { WGS.scr = 'play'; wgEmote(k); return; }
  if (WGS.t > WGS.emo.t0 && pressed('Escape', 'PadB', 'KeyG', 'PadRT')) WGS.scr = 'play';
};
const _wgDrawEmo = drawWG;
drawWG = function () {
  _wgDrawEmo();
  if (WGS.scr !== 'emote' || !WGS.world) return;
  const ui = WGS.ui, W = 24, gap = 4, n = WG_EMO_N, x0 = Math.round(VW / 2 - (n * W + (n - 1) * gap) / 2), y = VH - 64;
  panel(x0 - 8, y - 8, n * W + (n - 1) * gap + 16, 36);
  wgUiBegin(ui);
  for (let k = 0; k < n; k++) {
    const x = x0 + k * (W + gap); if (wgButton(ui, '', x, y, W, { h: 20 })) { WGS.scr = 'play'; wgEmote(k); }
    const b = WGA.cache.emo_bub, c = WGA.cache['emo_' + k]; if (!b || !c) continue; // each sign in its white bubble, as over a head
    const bx = x + ((W - 15) >> 1), by = y + 3; ctx.drawImage(b, 0, 0, 15, 11, bx, by, 15, 11); rect(bx + 2, by + 11, 11, 1, '0'); rect(bx + 1, by + 10, 13, 1, 'l'); rect(bx, by + 10, 1, 1, '0'); rect(bx + 14, by + 10, 1, 1, '0');
    ctx.drawImage(c, bx + 1 + ((13 - c.width) >> 1), by + 1 + ((10 - c.height) >> 1));
  }
  wgUiEnd(ui);
};
// ---------- the bubbles over heads: after the world, so nothing standing in front hides them ----------
const _wgAmbEmo = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbEmo(cx0, cy0);
  const T = WGS.t, show = (q, E) => {
    if (!E || T - E.t > WG_EMO_T || T < E.t) return;
    const b = WGA.cache.emo_bub, c = WGA.cache['emo_' + E.k]; if (!b || !c) return;
    const k = T - E.t, up = k < 0.12 ? 2 : 0, a = Math.min(1, (WG_EMO_T - k) / 0.4), x = Math.round(q.x - cx0) - 7, y = Math.round(q.y - cy0) - 50 + up + Math.round(Math.sin(T * 3) * 0.6);
    ctx.globalAlpha = a; ctx.drawImage(b, x, y); ctx.drawImage(c, x + 1 + ((13 - c.width) >> 1), y + 1 + ((10 - c.height) >> 1)); ctx.globalAlpha = 1;
  };
  if (WGS.p && !WGS.p.hidden) show(WGS.p, WGEM.me);
  for (const q of WGS.remote || []) if (q.dim === WGS.dim) show(q, WGEM.f.get(q.pid));
};
// ---------- touch: a heart button under the map's, only with friends in the world ----------
const _wgTouchBtnsEmo = wgTouchBtns;
wgTouchBtns = function () {
  const B = _wgTouchBtnsEmo();
  if (WGN.role) B.emo = [B.map[0], B.map[1] + 26, 11];
  return B;
};
const _wgTouchDownEmo = wgTouchDown;
wgTouchDown = function (x, y, e) {
  const B = wgTouchBtns(); if (B.emo && Math.hypot(x - B.emo[0], y - B.emo[1]) <= B.emo[2] + 4) { wgEmoOpen(); return; }
  return _wgTouchDownEmo(x, y, e);
};
const _wgDrawTouchEmo = wgDrawTouch;
wgDrawTouch = function () {
  _wgDrawTouchEmo();
  const q = wgTouchBtns().emo, c = WGA.cache.emo_1; if (!q || !c) return;
  ctx.globalAlpha = 0.75; rect(q[0] - q[2], q[1] - q[2] + 2, q[2] * 2, q[2] * 2 - 4, '0'); rect(q[0] - q[2] + 2, q[1] - q[2], q[2] * 2 - 4, q[2] * 2, '0');
  rect(q[0] - q[2] + 1, q[1] - q[2] + 3, q[2] * 2 - 2, q[2] * 2 - 6, '2'); rect(q[0] - q[2] + 3, q[1] - q[2] + 1, q[2] * 2 - 6, q[2] * 2 - 2, '2'); ctx.globalAlpha = 1;
  ctx.drawImage(c, q[0] - (c.width >> 1), q[1] - (c.height >> 1));
};
// ---------- art: a white speech bubble with its tail, and the six signs, each in its own colours ----------
const _wgBuildEmo = wgBuildAll;
wgBuildAll = function () {
  _wgBuildEmo();
  const mid = '0wwwwwwwwwwwwl0';
  wgMake('emo_bub', 15, 14, (g) => wgPaint(g, 0, 0, ['..00000000000..', '.0wwwwwwwwwww0.', mid, mid, mid, mid, mid, mid, mid, mid, '.0wllllllllll0.', '..0wl00000000..', '...0l0.........', '...00..........'], { 0: '0', w: 'w', l: 'l' }), false);
  const K = { s: 's', k: 'k', r: 'r', R: 'R', q: 'q', y: 'y', Y: 'Y', o: 'o', 0: '0', 2: '2', 3: '3', B: 'B', b: 'b', c: 'c' };
  const art = [
    ['.k.k.k...', '.s.s.s.k.', '.s.s.s.s.', 'ksssssssk', '.kssssk..', '..kkkk...'], // a waving hand
    ['.rr.rr.', 'rqRrrrr', 'rRrrrrr', '.rrrrr.', '..rrr..', '...r...'], // a heart
    ['..yyy..', '.yYyyy.', 'yy0y0yo', 'yyyyyyo', 'y0yyy0o', '.y000o.', '..ooo..'], // a smile
    ['...3...', '...23..', '...2.3.', '...2..2', '.222...', '2222...', '.22....'], // a note
    ['.BBB.', 'B...B', '...B.', '..B..', '.....', '..B..'], // a question
    ['.....bbbb', '.......b.', '......b..', '.....bbbb', 'BBBBB....', '...B.....', '..B......', '.B.......', 'BBBBB....'], // sleepy: Zz
  ];
  art.forEach((rows, k) => wgMake('emo_' + k, rows[0].length, rows.length, (g) => wgPaint(g, 0, 0, rows, K), false));
};
