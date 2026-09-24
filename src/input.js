'use strict';
// Keyboard + mouse. Positions are converted to game pixels.
// Phones and tablets (a coarse primary pointer) start in touch mode.
const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const Input = {
  down: Object.create(null),   // currently held (by e.code)
  hit: Object.create(null),    // pressed this frame
  mx: VW / 2, my: VH / 2, mouseDown: false, mouseHit: false, mouseSeen: false,
  lastAim: IS_TOUCH ? 'touch' : 'mouse', // 'mouse' | 'keys' | 'pad' | 'touch'
};
// no pinch-zoom or double-tap zoom on iOS
for (const ev of ['gesturestart', 'gesturechange', 'dblclick']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });

// Short vibration for big moments (Android; tied to the screen-shake setting).
function buzz(ms) {
  if (navigator.vibrate && Input.lastAim === 'touch' && Save.settings.shake) navigator.vibrate(ms);
}
// Fullscreen + landscape lock. Browsers only allow it from inside a user gesture.
function goFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || !document.fullscreenEnabled || !el.requestFullscreen) return;
  el.requestFullscreen({ navigationUI: 'hide' }).then(() => {
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  }).catch(() => {});
}

const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', 'ShiftLeft', 'ShiftRight', 'KeyE', 'Enter', 'Escape', 'KeyP', 'KeyM']);

window.addEventListener('keydown', e => {
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (!Input.down[e.code]) Input.hit[e.code] = true;
  Input.down[e.code] = true;
  if (e.code.startsWith('Arrow')) Input.lastAim = 'keys';
  Audio_.unlock();
});
window.addEventListener('keyup', e => { Input.down[e.code] = false; });
window.addEventListener('blur', () => { for (const k in Input.down) Input.down[k] = false; Input.mouseDown = false; });

// Pointer position in play-view coordinates (the canvas is bigger than the play view).
function _mousePos(e) {
  const r = cv.getBoundingClientRect();
  Input.mx = (e.clientX - r.left) / r.width * SCR.w - SCR.ox;
  Input.my = (e.clientY - r.top) / r.height * SCR.h - SCR.oy;
}
window.addEventListener('mousemove', e => { _mousePos(e); Input.mouseSeen = true; Input.lastAim = 'mouse'; });
cv.addEventListener('mousedown', e => {
  _mousePos(e);
  if (G.state === 'settings' && G.tapFull && Input.my >= G.tapFull[0] && Input.my < G.tapFull[1]) toggleFullscreen();
  if (e.button === 0) { Input.mouseDown = true; Input.mouseHit = true; Input.lastAim = 'mouse'; }
  Audio_.unlock();
});
window.addEventListener('mouseup', e => { if (e.button === 0) Input.mouseDown = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());

const key = (c) => !!Input.down[c];
const pressed = (...codes) => codes.some(c => Input.hit[c]);
function endInputFrame() {
  for (const k in Input.hit) delete Input.hit[k];
  Input.mouseHit = false;
}

// ---------- Gamepad (standard mapping) ----------
// Left stick / d-pad: move and navigate. Right stick: aim and shoot. A/LB/LT: roll.
// X/Y: interact. Start: pause. In menus A confirms, B goes back.
const PAD_BTN = { 0: 'PadA', 1: 'PadB', 2: 'PadX', 3: 'PadY', 4: 'PadLB', 5: 'PadRB', 6: 'PadLT', 7: 'PadRT', 9: 'PadStart', 12: 'PadUp', 13: 'PadDown', 14: 'PadLeft', 15: 'PadRight' };
Input.pad = { mx: 0, my: 0, ax: 0, ay: 0, prev: [], navY: 0, navX: 0 };
function pollPad() {
  const P = Input.pad;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null;
  for (const g of pads) if (g && g.connected) { gp = g; break; }
  if (!gp) { P.mx = P.my = P.ax = P.ay = 0; return; }
  const dz = (v) => (Math.abs(v || 0) < 0.22 ? 0 : v);
  P.mx = dz(gp.axes[0]); P.my = dz(gp.axes[1]);
  P.ax = gp.axes[2] || 0; P.ay = gp.axes[3] || 0;
  if (Math.hypot(P.ax, P.ay) < 0.4) P.ax = P.ay = 0;
  const b = gp.buttons.map(x => x.pressed || x.value > 0.5);
  if (b[12]) P.my = -1; if (b[13]) P.my = 1; if (b[14]) P.mx = -1; if (b[15]) P.mx = 1;
  let any = false;
  for (const i in PAD_BTN) {
    if (b[i] && !P.prev[i]) { Input.hit[PAD_BTN[i]] = true; any = true; }
    Input.down[PAD_BTN[i]] = !!b[i];
  }
  P.prev = b;
  // stick flicks navigate menus like the d-pad
  const ny = P.my < -0.6 ? -1 : P.my > 0.6 ? 1 : 0, nx = P.mx < -0.6 ? -1 : P.mx > 0.6 ? 1 : 0;
  if (ny && ny !== P.navY && !b[12] && !b[13]) Input.hit[ny < 0 ? 'PadUp' : 'PadDown'] = true;
  if (nx && nx !== P.navX && !b[14] && !b[15]) Input.hit[nx < 0 ? 'PadLeft' : 'PadRight'] = true;
  P.navY = ny; P.navX = nx;
  if (any || P.mx || P.my || P.ax || P.ay) Input.lastAim = 'pad';
}

// ---------- Touch: floating twin sticks + buttons ----------
// Left half: move stick. Right half: aim stick (shoots while held). Round buttons: roll,
// Starfall, pause. Tapping the item tooltip uses it. Outside play, a tap is a click.
// Screen edges in play-view coordinates; buttons hug the edges (in the side margins on phones).
function screenEdges() { return { l: -SCR.ox, t: -SCR.oy, r: SCR.w - SCR.ox, b: SCR.h - SCR.oy }; }
function touchBtns() {
  const e = screenEdges();
  return { dash: [e.r - 34, e.b - 36, 17], star: [e.r - 34, e.b - 82, 14], pause: [e.l + 15, e.t + 49, 11] };
}
const STICK_R = 18;
Input.touch = { move: null, aim: null, mx: 0, my: 0, ax: 0, ay: 0 };
function _tpos(e) {
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * SCR.w - SCR.ox, (e.clientY - r.top) / r.height * SCR.h - SCR.oy];
}
const _inBtn = (b, x, y) => Math.hypot(x - b[0], y - b[1]) <= b[2] + 4;
cv.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  e.preventDefault();
  Audio_.unlock();
  Input.lastAim = 'touch';
  const [x, y] = _tpos(e), T = Input.touch;
  Input.mx = x; Input.my = y; Input.mouseSeen = true;
  if (G.state === 'title') goFullscreen();
  if (G.state === 'settings' && G.tapFull && y >= G.tapFull[0] && y < G.tapFull[1]) toggleFullscreen();
  if (G.state !== 'play') { Input.mouseHit = true; return; }
  const B = touchBtns();
  if (_inBtn(B.pause, x, y)) { Input.hit.TouchPause = true; return; }
  if (_inBtn(B.dash, x, y)) { Input.hit.TouchDash = true; return; }
  if (_inBtn(B.star, x, y)) { Input.hit.TouchStar = true; return; }
  const tr = G.tipRect;
  if (tr && x >= tr[0] && x < tr[0] + tr[2] && y >= tr[1] && y < tr[1] + tr[3]) { Input.hit.TouchUse = true; return; }
  const s = { id: e.pointerId, ox: x, oy: y, x, y };
  if (x + SCR.ox < SCR.w / 2) { if (!T.move) T.move = s; } else if (!T.aim) T.aim = s;
}, { passive: false });
cv.addEventListener('pointermove', e => {
  if (e.pointerType !== 'touch') return;
  const T = Input.touch, [x, y] = _tpos(e);
  for (const s of [T.move, T.aim]) {
    if (!s || s.id !== e.pointerId) continue;
    s.x = x; s.y = y;
    // the stick base follows a thumb that wanders too far
    const dx = x - s.ox, dy = y - s.oy, d = Math.hypot(dx, dy);
    if (d > STICK_R * 1.5) { s.ox = x - dx / d * STICK_R * 1.5; s.oy = y - dy / d * STICK_R * 1.5; }
  }
});
function _tend(e) {
  const T = Input.touch;
  if (T.move && T.move.id === e.pointerId) T.move = null;
  if (T.aim && T.aim.id === e.pointerId) T.aim = null;
}
cv.addEventListener('pointerup', _tend);
cv.addEventListener('pointercancel', _tend);
function pollTouch() {
  const T = Input.touch;
  const vec = (s, dead) => {
    if (!s) return [0, 0];
    let dx = (s.x - s.ox) / STICK_R, dy = (s.y - s.oy) / STICK_R;
    const l = Math.hypot(dx, dy);
    if (l < dead) return [0, 0];
    if (l > 1) { dx /= l; dy /= l; }
    return [dx, dy];
  };
  [T.mx, T.my] = vec(T.move, 0.2);
  [T.ax, T.ay] = vec(T.aim, 0.25);
}
