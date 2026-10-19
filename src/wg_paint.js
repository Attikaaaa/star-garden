'use strict';
// Wildgrove: an easel to paint on. USE it to paint a little 12x12 picture in eight colours (the bare canvas and seven
// paints): click or drag with the mouse or a finger (right click rubs out), or walk a cursor with the arrows or the pad
// (Space / A paints, the numbers or LB / RB pick the colour). DONE keeps it, and it stands on the easel in the world,
// one pixel a dab. The pictures live in the world's meta (paints, by dim + 'x,y'), saved with it; a guest's goes to the
// host as a 'paint' message, which checks the easel is there, rate-limits it and passes it on; a friend who joins gets
// them all in the welcome. A broken easel loses its picture. The LITTLE ARTIST star.
const WG_PAINT_N = 12, WG_PAINT_COLS = ['A', '0', 'r', 'y', 'G', 'B', 'P', 'n']; // the canvas and seven paints
const WG_PAINT_RE = /^[0-7]{144}$/, WG_PAINT_KEY = /^([a-z])(-?\d+),(-?\d+)$/, WG_PAINT_MAX = 300;
const WGPT = { cache: new Map() }; // a picture's 12x12 canvas by its string
(function () {
  wgObj('easel', { name: 'EASEL', kind: 'deco', tool: 'axe', hp: 4, paint: 1, drops: [DR('easel', 1, 1)] });
  wgItem('easel', 'EASEL', 'place', { place: 'easel' }); PLACE.easel = 'easel'; wgRec('easel', 1, { wood: 4, stick: 2, wool: 1 }, 'bench');
  WG_ACH.push(['paint', 'LITTLE ARTIST', 'PAINT A PICTURE ON AN EASEL', (c) => c.st.paint]);
})();
const wgPaints = () => { const m = WGS.world.meta; return m.paints || (m.paints = {}); };
function wgPaintSet(k, v) { // sets (or with a bare canvas clears) a picture; the host checks the easel is still there
  const m = WG_PAINT_KEY.exec(String(k || '')); if (!m || !WGS.world || typeof v !== 'string' || !WG_PAINT_RE.test(v)) return false;
  if (WGN.role !== 'client') { const id = wgObjAt(WGS.world, m[1], +m[2], +m[3]); if (!id || !OBJ[id].paint) return false; }
  const P = wgPaints();
  if (/^0+$/.test(v)) { delete P[k]; return true; }
  if (!P[k] && Object.keys(P).length >= WG_PAINT_MAX) return false;
  P[k] = v; return true;
}
function wgPaintCanvas(v) {
  let c = WGPT.cache.get(v); if (c) return c;
  if (WGPT.cache.size > 64) WGPT.cache.clear();
  const [cv, g] = wgCv(WG_PAINT_N, WG_PAINT_N); for (let i = 0; i < 144; i++) wgPx(g, i % WG_PAINT_N, (i / WG_PAINT_N) | 0, WG_PAINT_COLS[+v[i]]);
  WGPT.cache.set(v, cv); return cv;
}
// a broken easel loses its picture, on every screen (a guest applies the host's tile change through here too)
const _wgSetObjPaint = wgSetObj;
wgSetObj = function (w, dim, x, y, id, meta) {
  if (w === WGS.world && w.meta && w.meta.paints) { const k = dim + x + ',' + y; if (w.meta.paints[k] && !(id && OBJ[id].paint)) delete w.meta.paints[k]; }
  return _wgSetObjPaint(w, dim, x, y, id, meta);
};
// the net
const _wgnHostPaint = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostPaint(L, m);
  if (!m || m.t !== 'paint' || !(L.pid > 0)) return;
  const now = performance.now(); if (now - (L.paintT || 0) < 500) return; L.paintT = now;
  const at = WG_PAINT_KEY.exec(String(m.k || '')); // only an easel beside the guest's hero, so a message never wakes far ground
  if (!at || at[1] !== L.dim || !(Math.hypot(+at[2] * 16 + 8 - L.x, +at[3] * 16 + 8 - L.y) < 16 * 8)) return;
  if (wgPaintSet(m.k, m.v)) wgnAll({ t: 'paint', k: m.k, v: m.v }, L);
};
const _wgnClientPaint = wgnClientMsg;
wgnClientMsg = function (L, m) { _wgnClientPaint(L, m); if (m && m.t === 'paint') wgPaintSet(m.k, m.v); };
if (typeof wgnWelcome === 'function') {
  const _wgnWelcomePaint = wgnWelcome;
  wgnWelcome = function (L) { const o = _wgnWelcomePaint(L); o.paints = Object.assign({}, WGS.world.meta.paints || {}); return o; };
  const _wgnEnterPaint = wgnEnter;
  wgnEnter = function (wl) {
    _wgnEnterPaint(wl); const P = WGS.world.meta.paints = {}; let n = 0;
    for (const k in (wl && wl.paints) || {}) if (n < WG_PAINT_MAX && WG_PAINT_KEY.test(k) && typeof wl.paints[k] === 'string' && WG_PAINT_RE.test(wl.paints[k])) { P[k] = wl.paints[k]; n++; }
  };
}
// ---------- the painting screen ----------
const _wgUsePaint = wgUse;
wgUse = function (tx, ty) {
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (!o || !o.paint) return _wgUsePaint(tx, ty);
  const k = WGS.dim + tx + ',' + ty, v = wgPaints()[k] || '0'.repeat(144);
  WGS.paintAt = { k, tx, ty, c: [...v].map(Number), col: 1, cx: 6, cy: 6, t0: WGS.t }; WGS.scr = 'paint'; WGS.ui = {}; wgSfx('select');
  return true;
};
function wgPaintLayout() { const gx = VW / 2 - 104, gy = 36; return { gx, gy, cell: 8, px: gx + 112, py: gy, bx: gx + 112, by: gy + 50 }; } // the grid, the paints, the buttons
function wgPaintClose(save) {
  const A = WGS.paintAt; WGS.paintAt = null; WGS.scr = 'play';
  if (!save || !A) { wgSfx('select'); return; }
  const v = A.c.join('');
  if (wgPaintSet(A.k, v)) {
    if (WGN.role) { const msg = { t: 'paint', k: A.k, v }; if (WGN.role === 'host') wgnAll(msg, null); else wgnSend(WGN.link, msg); }
    if (/[1-7]/.test(v)) { const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.paint = 1; wgToast('THE PAINTING IS DONE'); } else wgToast('THE CANVAS IS BARE');
  }
  wgSfx('confirm');
}
const WG_PAINT_BTNS = [['CLEAR', 0], ['DONE', 1], ['CANCEL', 2]];
const _wgUpdPaint = updateWG;
updateWG = function (dt) {
  _wgUpdPaint(dt);
  if (WGS.scr !== 'paint' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  const A = WGS.paintAt; if (!A) { WGS.scr = 'play'; return; }
  const id = wgObjAt(WGS.world, WGS.dim, A.tx, A.ty); if (!id || !OBJ[id].paint) { wgPaintClose(false); return; } // broken while open
  if (WGS.t <= A.t0) return; // not on the press that opened it
  if (pressed('Escape', 'PadB')) { wgPaintClose(false); return; }
  if (pressed('Enter', 'PadStart')) { wgPaintClose(true); return; }
  const N = WG_PAINT_N, L = wgPaintLayout(), moved = (dx, dy) => { A.cx = (A.cx + dx + N) % N; A.cy = (A.cy + dy + N) % N; A.keys = true; };
  if (pressed('ArrowLeft', 'KeyA', 'PadLeft')) moved(-1, 0); if (pressed('ArrowRight', 'KeyD', 'PadRight')) moved(1, 0);
  if (pressed('ArrowUp', 'KeyW', 'PadUp')) moved(0, -1); if (pressed('ArrowDown', 'KeyS', 'PadDown')) moved(0, 1);
  if (pressed('Space', 'PadA')) { A.c[A.cy * N + A.cx] = A.col; A.keys = true; wgSfx('select'); }
  if (pressed('PadX')) { A.c[A.cy * N + A.cx] = 0; A.keys = true; }
  if (pressed('PadLB')) A.col = (A.col + 7) % 8; if (pressed('PadRB')) A.col = (A.col + 1) % 8;
  for (let i = 0; i < 8; i++) if (pressed('Digit' + (i + 1))) A.col = i;
  const mx = Input.mx, my = Input.my, ci = Math.floor((mx - L.gx) / L.cell), cj = Math.floor((my - L.gy) / L.cell), inGrid = ci >= 0 && cj >= 0 && ci < N && cj < N;
  if (Input.mx !== A.lmx || Input.my !== A.lmy) { A.lmx = Input.mx; A.lmy = Input.my; A.keys = false; }
  if (inGrid && Input.mouseDown) A.c[cj * N + ci] = A.col; // a dab, or a stroke while held
  if (inGrid && Input.rDown) A.c[cj * N + ci] = 0;
  if (Input.mouseHit) {
    for (let i = 0; i < 8; i++) { const x = L.px + (i % 4) * 22, y = L.py + Math.floor(i / 4) * 22; if (mx >= x && mx < x + 18 && my >= y && my < y + 18) { A.col = i; wgSfx('select'); } }
    for (const [lab, n] of WG_PAINT_BTNS) { const y = L.by + n * 18; if (mx >= L.bx && mx < L.bx + 62 && my >= y && my < y + 14) { if (n === 0) { A.c.fill(0); wgSfx('select'); } else { wgPaintClose(n === 1); return; } } }
  }
};
const _wgDrawPaint = drawWG;
drawWG = function () {
  _wgDrawPaint();
  const A = WGS.paintAt; if (WGS.scr !== 'paint' || !A || !WGS.world) return;
  const N = WG_PAINT_N, L = wgPaintLayout(), mx = Input.mx, my = Input.my;
  dim(0.45); panel(L.gx - 12, L.gy - 22, 232, 140);
  wtext('PAINT A PICTURE', VW / 2, L.gy - 15, 'Y', 1, 1);
  rect(L.gx - 2, L.gy - 2, N * L.cell + 4, N * L.cell + 4, '0'); rect(L.gx - 1, L.gy - 1, N * L.cell + 2, N * L.cell + 2, 'u');
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = A.c[j * N + i]; rect(L.gx + i * L.cell, L.gy + j * L.cell, L.cell, L.cell, WG_PAINT_COLS[k]); if (!k && (i + j) % 2) rect(L.gx + i * L.cell, L.gy + j * L.cell, L.cell, L.cell, 'a'); } // the bare canvas in a faint check
  const blink = Math.floor(WGS.t * 3) % 2, cur = (x, y) => { ctx.strokeStyle = blink ? '#ffffff' : PAL['0']; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, L.cell - 1, L.cell - 1); };
  if (A.keys || Input.lastAim === 'pad') cur(L.gx + A.cx * L.cell, L.gy + A.cy * L.cell);
  else { const ci = Math.floor((mx - L.gx) / L.cell), cj = Math.floor((my - L.gy) / L.cell); if (ci >= 0 && cj >= 0 && ci < N && cj < N) cur(L.gx + ci * L.cell, L.gy + cj * L.cell); }
  for (let i = 0; i < 8; i++) { // the paints, the one in use ringed
    const x = L.px + (i % 4) * 22, y = L.py + Math.floor(i / 4) * 22, on = A.col === i;
    rect(x - 2, y - 2, 22, 22, on ? 'Y' : '1'); rect(x - 1, y - 1, 20, 20, '0'); rect(x, y, 18, 18, WG_PAINT_COLS[i]); if (!i) { rect(x, y, 9, 9, 'a'); rect(x + 9, y + 9, 9, 9, 'a'); }
    wgRawText(String(i + 1), x + 15, y + 11, i === 1 || i === 5 || i === 7 ? 'w' : '0', 0, 1);
  }
  const vx = L.bx + 70, vy = L.by + 12; rect(vx - 2, vy - 2, 16, 16, '0'); rect(vx - 1, vy - 1, 14, 14, 'u'); ctx.drawImage(wgPaintCanvas(A.c.join('')), vx, vy); // as it will stand, one dab a pixel
  for (const [lab, n] of WG_PAINT_BTNS) {
    const y = L.by + n * 18, on = mx >= L.bx && mx < L.bx + 62 && my >= y && my < y + 14 && Input.lastAim !== 'pad';
    rect(L.bx + 1, y, 60, 14, '0'); rect(L.bx, y + 1, 62, 12, '0'); rect(L.bx + 1, y + 1, 60, 12, on ? 'o' : n === 1 ? 'h' : '2'); rect(L.bx + 2, y + 2, 58, 10, on ? 'y' : n === 1 ? 'g' : '1');
    wtext(lab, L.bx + 31, y + 4, on ? '0' : 'w', on ? 0 : 1, 1);
  }
  const hint = Input.lastAim === 'pad' ? 'A: PAINT  X: RUB OUT  LB RB: COLOUR  START: DONE' : Input.lastAim === 'touch' ? 'TAP OR DRAG TO PAINT' : 'CLICK OR DRAG  RIGHT CLICK: RUB OUT  1-8: COLOUR';
  wtext(hint, VW / 2, L.gy + 104, 'l', 0, 1);
};
// ---------- the easel in the world, its picture on it; tips; art ----------
const _wgDrawObjPaint = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjPaint(id, tx, ty, sx, sy);
  if (!OBJ[id].paint) return;
  const v = WGS.world.meta.paints && WGS.world.meta.paints[WGS.dim + tx + ',' + ty]; if (v) ctx.drawImage(wgPaintCanvas(v), sx + 2, sy - 8);
};
const _wgTipPaint = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipPaint(s);
  if (s.id === 'easel') L.push('USE IT TO PAINT A PICTURE', 'FRIENDS SEE IT TOO');
  return L;
};
const _wgBuildPaint = wgBuildAll;
wgBuildAll = function () { // a wooden easel: the canvas up top (2,2 to 13,13), its ledge, three legs
  _wgBuildPaint();
  wgReg('easel', [wgMake('easel', 16, 26, (g) => {
    wgRc(g, 6, 0, 4, 2, 'n'); wgRc(g, 6, 0, 4, 1, 'N'); // the top clamp
    wgRc(g, 1, 1, 14, 14, 'u'); wgRc(g, 2, 2, 12, 12, 'A'); wgRc(g, 2, 2, 12, 1, 'w'); wgRc(g, 2, 2, 1, 12, 'w'); wgRc(g, 13, 3, 1, 11, 'a'); wgRc(g, 3, 13, 11, 1, 'a'); // the canvas
    wgLine(g, 7, 15, 7, 24, 'u'); wgLine(g, 4, 15, 1, 25, 'n'); wgLine(g, 5, 15, 2, 25, 'N'); wgLine(g, 11, 15, 14, 25, 'n'); wgLine(g, 10, 15, 13, 25, 'u'); // three legs
    wgRc(g, 0, 15, 16, 2, 'n'); wgRc(g, 0, 15, 16, 1, 'N'); // the ledge
  })]);
};
