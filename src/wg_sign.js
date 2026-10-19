'use strict';
// Wildgrove: signs you can write on. Placing a sign opens the board, using one opens it again; the words show in a
// small bubble over the sign while you stand near it. Typed on a keyboard, or tapped / picked with the pad from the
// letter grid. The words live in WGS.signs (dim + 'x,y'), saved with the world; the host shares them (wgNetSign).
const SIGN_MAX = 32, SIGN_ROW = 16;
const SIGN_RE = /^[A-Za-z0-9 .,!?:\-+\/'()%<>ÁÉÍÓÖŐÚÜŰáéíóöőúüű]$/;
function wgSignClean(v) { return String(v || '').toUpperCase().replace(/[^A-Z0-9 .,!?:\-+\/'()%<>ÁÉÍÓÖŐÚÜŰ]/g, '').replace(/ +/g, ' ').slice(0, SIGN_MAX); }
// Player words are drawn as they are, never looked up in the language table.
function wgRawText(s, x, y, c, st, al) { TR_RAW = true; try { wtext(s, x, y, c, st, al); } finally { TR_RAW = false; } }
function wgRawW(s, st) { TR_RAW = true; try { return textW(s, st); } finally { TR_RAW = false; } }
// Word wrap into lines of at most SIGN_ROW letters (a word longer than that is cut).
function wgSignLines(s) {
  const out = []; let cur = '';
  for (const wd of s.split(' ')) {
    if (!wd) continue;
    const t = cur ? cur + ' ' + wd : wd;
    if (t.length <= SIGN_ROW) cur = t; else { if (cur) out.push(cur); cur = wd.slice(0, SIGN_ROW); }
  }
  if (cur) out.push(cur);
  return out;
}
// Sets (or with no words clears) a sign. A host checks the sign is still there; a client takes the host's word.
function wgSignSet(k, v) {
  const m = /^([a-z])(-?\d+),(-?\d+)$/.exec(String(k || '')); if (!m || !WGS.world) return false;
  if (WGN.role !== 'client') { const id = wgObjAt(WGS.world, m[1], +m[2], +m[3]); if (!id || OBJ[id].kind !== 'sign') return false; }
  const s = wgSignClean(v).trim(); WGS.signs = WGS.signs || {};
  if (s) WGS.signs[k] = s; else delete WGS.signs[k];
  WGU.signV = (WGU.signV || 0) + 1; return true;
}
// A sign that breaks loses its words, on every screen (a client applies the host's tile change through here too).
const _wgSetObjSign = wgSetObj;
wgSetObj = function (w, dim, x, y, id, meta) {
  if (w === WGS.world && WGS.signs) { const k = dim + x + ',' + y; if (WGS.signs[k] && !(id && OBJ[id].kind === 'sign')) { delete WGS.signs[k]; WGU.signV = (WGU.signV || 0) + 1; } }
  return _wgSetObjSign(w, dim, x, y, id, meta);
};

// ---------- the board ----------
function wgSignOpen(tx, ty) {
  const k = WGS.dim + tx + ',' + ty;
  WGS.signAt = { k, tx, ty }; WGU.signF = { v: wgSignText(tx, ty), max: SIGN_MAX, re: SIGN_RE }; WGU.edit = WGU.signF;
  WGS.scr = 'sign'; WGS.ui = {}; wgSfx('select');
}
function wgSignClose(save) {
  const A = WGS.signAt, f = WGU.signF;
  if (save && A) {
    const v = wgSignClean(f.v).trim();
    if (wgSignSet(A.k, v)) { wgNetSign(A.k, v); wgToast(v ? 'THE SIGN IS WRITTEN' : 'THE SIGN IS BLANK'); }
  }
  if (WGU.edit === f) WGU.edit = null;
  WGS.signAt = null; WGS.scr = 'play'; wgSfx(save ? 'confirm' : 'select');
}
const SIGN_GRID = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', '0123456789.!?', "ÁÉÍÓÖŐÚÜŰ,-:'"];
// Every key of the board with its box, rows top to bottom (the pad walks them).
function wgSignKeys() {
  if (WGU.signK) return WGU.signK;
  const P = 17, x0 = VW / 2 - (13 * P - 1) / 2, y0 = 82, rows = [];
  SIGN_GRID.forEach((r, j) => rows.push([...r].map((ch, i) => ({ k: ch, x: x0 + i * P, y: y0 + j * 15, w: 16 }))));
  const y4 = y0 + 4 * 15, y5 = y0 + 5 * 15 + 3;
  rows.push([{ k: 'SPACE', x: x0, y: y4, w: 4 * P - 1 }].concat(['<', '>', '(', ')'].map((ch, i) => ({ k: ch, x: x0 + (4 + i) * P, y: y4, w: 16 })), [{ k: 'DEL', x: x0 + 8 * P, y: y4, w: 5 * P - 1 }]));
  rows.push([{ k: 'SAVE', x: x0, y: y5, w: 6 * P + 7 }, { k: 'CANCEL', x: x0 + 13 * P - 1 - (6 * P + 7), y: y5, w: 6 * P + 7 }]);
  return (WGU.signK = rows);
}
function wgSignKey(k) {
  const f = WGU.signF;
  if (k === 'SAVE') return wgSignClose(true);
  if (k === 'CANCEL') return wgSignClose(false);
  if (k === 'DEL') f.v = f.v.slice(0, -1);
  else if (f.v.length < SIGN_MAX) f.v += k === 'SPACE' ? ' ' : k;
  wgSfx('select');
}
function wgSignUpdate(dt) {
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  const A = WGS.signAt, f = WGU.signF; if (!A || !f) { WGS.scr = 'play'; return; }
  const id = wgObjAt(WGS.world, WGS.dim, A.tx, A.ty);
  if (!id || OBJ[id].kind !== 'sign') { wgSignClose(false); return; } // broken while open
  if (f.end) { const e = f.end; f.end = null; wgSignClose(e === 'Enter'); return; } // the keyboard: Enter keeps, Esc leaves
  if (WGU.edit !== f) WGU.edit = f;
  const rows = wgSignKeys(), ui = WGS.ui;
  let j = ui.kr || 0, i = ui.kc || 0;
  if (pressed('PadB')) { wgSignClose(false); return; }
  if (pressed('PadStart')) { wgSignClose(true); return; }
  if (pressed('PadX')) { wgSignKey('DEL'); return; }
  const mid = (c) => c.x + c.w / 2, near = (r, x) => { let b = 0; r.forEach((c, n) => { if (Math.abs(mid(c) - x) < Math.abs(mid(r[b]) - x)) b = n; }); return b; };
  if (pressed('PadLeft', 'ArrowLeft')) i = (i + rows[j].length - 1) % rows[j].length;
  if (pressed('PadRight', 'ArrowRight')) i = (i + 1) % rows[j].length;
  if (pressed('PadUp', 'ArrowUp')) { const x = mid(rows[j][i]); j = (j + rows.length - 1) % rows.length; i = near(rows[j], x); }
  if (pressed('PadDown', 'ArrowDown')) { const x = mid(rows[j][i]); j = (j + 1) % rows.length; i = near(rows[j], x); }
  if (j !== (ui.kr || 0) || i !== (ui.kc || 0)) { ui.kr = j; ui.kc = i; ui.pad = true; wgSfx('select'); }
  if (Input.mx !== ui.lmx || Input.my !== ui.lmy) { ui.lmx = Input.mx; ui.lmy = Input.my; ui.pad = false; }
  if (pressed('PadA')) { wgSignKey(rows[j][i].k); return; }
  if (Input.mouseHit) for (const r of rows) for (const c of r) if (Input.mx >= c.x && Input.mx < c.x + c.w && Input.my >= c.y && Input.my < c.y + 13) { Input.mouseHit = false; wgSignKey(c.k); return; }
}
function wgDrawSign() {
  const f = WGU.signF; if (!f) return;
  fillScreen('rgba(20,12,40,0.35)');
  panel(VW / 2 - 124, 14, 248, 178);
  wtext('WRITE ON THE SIGN', VW / 2, 21, 'Y', 1, 1);
  // the board itself, lit from the top left, with the words as they will stand
  const bx = VW / 2 - 92, by = 32;
  rect(bx, by, 184, 36, '0'); rect(bx + 1, by + 1, 182, 34, 'n'); rect(bx + 1, by + 1, 182, 1, 'N'); rect(bx + 1, by + 1, 1, 34, 'N'); rect(bx + 2, by + 34, 181, 1, 'u'); rect(bx + 182, by + 2, 1, 33, 'u');
  rect(bx + 3, by + 3, 2, 2, 'u'); rect(bx + 179, by + 3, 2, 2, 'u'); rect(bx + 3, by + 31, 2, 2, 'u'); rect(bx + 179, by + 31, 2, 2, 'u');
  const lines = wgSignLines(f.v), blink = Math.floor(WGS.t * 2) % 2;
  if (!lines.length) lines.push('');
  const ly = by + 18 - lines.length * 5;
  lines.forEach((s, n) => wgRawText(s + (n === lines.length - 1 && blink ? '_' : ''), VW / 2, ly + n * 10, 'w', 2, 1));
  wtext(f.v.length + ' / ' + SIGN_MAX, bx + 184, by + 40, f.v.length >= SIGN_MAX ? 'R' : 'l', 0, 2);
  const ui = WGS.ui, rows = wgSignKeys();
  rows.forEach((r, j) => r.forEach((c, i) => {
    const hov = !ui.pad && Input.lastAim !== 'pad' && Input.mx >= c.x && Input.mx < c.x + c.w && Input.my >= c.y && Input.my < c.y + 13;
    const on = hov || ((ui.pad || Input.lastAim === 'pad') && (ui.kr || 0) === j && (ui.kc || 0) === i), big = c.w > 16, act = c.k === 'SAVE';
    rect(c.x, c.y, c.w, 13, '0'); rect(c.x + 1, c.y + 1, c.w - 2, 11, on ? 'o' : act ? 'h' : '2'); rect(c.x + 2, c.y + 2, c.w - 4, 9, on ? 'y' : act ? 'g' : '1');
    (big ? wtext : wgRawText)(c.k, c.x + c.w / 2, c.y + 3, on ? '0' : 'w', on ? 0 : 1, 1);
  }));
  const hint = Input.lastAim === 'pad' ? 'A: LETTER  X: DELETE  START: SAVE  B: BACK' : Input.lastAim === 'touch' ? 'TAP THE LETTERS' : 'TYPE IT  ENTER: SAVE  ESC: BACK';
  wtext(hint, VW / 2, 180, 'l', 0, 1);
}

// ---------- the words in the world ----------
// The two nearest written signs within three tiles show a bubble, fading out with distance.
function wgSignList() {
  const C = WGU.signC;
  if (C && C.v === (WGU.signV || 0) && C.s === WGS.signs) return C.list;
  const list = [];
  for (const k in WGS.signs || {}) { const m = /^([a-z])(-?\d+),(-?\d+)$/.exec(k); if (m) list.push({ d: m[1], x: +m[2], y: +m[3], lines: wgSignLines(WGS.signs[k]) }); }
  WGU.signC = { v: WGU.signV || 0, s: WGS.signs, list }; return list;
}
function wgDrawSigns(cx0, cy0) {
  if (WGS.scr !== 'play' || WGS.photo) return;
  const p = WGS.p, R = 48, pick = [];
  for (const q of wgSignList()) {
    if (q.d !== WGS.dim) continue;
    const d = Math.hypot(q.x * 16 + 8 - p.x, q.y * 16 + 10 - p.y);
    if (d < R) pick.push([d, q]);
  }
  if (!pick.length) return;
  pick.sort((a, b) => a[0] - b[0]);
  for (const [d, q] of pick.slice(0, 2)) {
    const a = wgClamp((R - d) / 14, 0, 1), w = q.w || (q.w = Math.max(...q.lines.map(s => wgRawW(s, 0))) + 8), h = q.lines.length * 9 + 4;
    const x = Math.round(q.x * 16 + 8 - cx0 - w / 2), y = Math.round(q.y * 16 - cy0 - 4 - h);
    ctx.globalAlpha = a;
    rect(x + 1, y, w - 2, h, '0'); rect(x, y + 1, w, h - 2, '0'); rect(x + 1, y + 1, w - 2, h - 2, '1'); rect(x + 2, y + 1, w - 4, 1, '2');
    rect(x + (w >> 1) - 2, y + h, 5, 1, '0'); rect(x + (w >> 1) - 1, y + h + 1, 3, 1, '0'); rect(x + (w >> 1) - 1, y + h - 1, 3, 1, '1'); rect(x + (w >> 1), y + h, 1, 1, '1');
    q.lines.forEach((s, n) => wgRawText(s, x + w / 2, y + 3 + n * 9, 'w', 0, 1));
    ctx.globalAlpha = 1;
  }
}

// ---------- the loop ----------
const _wgUpdSign = updateWG;
updateWG = function (dt) {
  _wgUpdSign(dt);
  if (WGS.scr === 'sign' && WGS.world) wgSignUpdate(dt);
  else if (WGU.signF && WGU.edit === WGU.signF) WGU.edit = null; // left some other way (a hit, the host leaving): typing goes back to the game
};
const _wgDrawSign0 = drawWG;
drawWG = function () {
  _wgDrawSign0();
  if (WGS.scr === 'sign' && WGS.world) wgDrawSign();
};
