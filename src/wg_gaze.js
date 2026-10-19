'use strict';
// Wildgrove: the stargazing pack. A telescope, USEd under the night sky (above the clouds even in rain), opens a round
// view of the stars. Each night one of eight star signs hides there, its stars a little brighter; sweep the view over
// them to light them, and once all shine its lines draw in and it goes onto your star chart. The night and the world's
// seed pick the sign, so friends see the same one. A star chart on an easel shows the signs found. Shooting stars pass
// now and then. Ids are appended, so old worlds stay valid.
const WG_SIGNS = [ // name, stars (x, y from the view's middle), lines between them
  ['FROG', [[-30, -30], [30, -30], [-45, 0], [45, 0], [-20, 20], [20, 20], [-50, 40], [50, 40]], [[0, 1], [0, 2], [2, 4], [4, 5], [5, 3], [3, 1], [2, 6], [3, 7]]],
  ['TEAPOT', [[0, -42], [-25, -25], [25, -25], [-28, 28], [28, 28], [-58, -12], [52, 0]], [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 5], [5, 3], [2, 6], [6, 4]]],
  ['KITE', [[0, -50], [-30, -15], [30, -15], [0, 20], [15, 40], [-2, 56]], [[0, 1], [0, 2], [1, 3], [2, 3], [1, 2], [3, 4], [4, 5]]],
  ['WHALE', [[-55, 0], [-25, -20], [15, -22], [45, 0], [65, -20], [65, 15], [-10, 20], [-42, -38]], [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [3, 6], [6, 0], [1, 7]]],
  ['ACORN', [[4, -52], [0, -34], [-34, -18], [34, -18], [-26, 14], [26, 14], [0, 42]], [[0, 1], [1, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 6], [5, 6]]],
  ['LANTERN', [[0, -55], [-18, -35], [18, -35], [-22, 25], [22, 25], [0, 42]], [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 5]]],
  ['CAT', [[-36, -50], [-10, -50], [-22, -24], [22, -8], [-24, 40], [28, 40], [62, 10]], [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [4, 5], [5, 3], [5, 6]]],
  ['CROWN', [[-45, 25], [45, 25], [-45, -25], [-22, 0], [0, -40], [22, 0], [45, -25]], [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1]]],
];
const WG_GAZE_X = 192, WG_GAZE_Y = 106, WG_GAZE_R = 86; // the eyepiece on screen
const WGGZ = { key: '', c: null, tw: [], chart: '', cc: null }; // the baked view and its brighter stars; the baked chart
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 4, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  dec('telescope', 'TELESCOPE', { gaze: 1 }, { copper: 3, glass: 2, wood: 3 }, 'anvil');
  dec('star_chart', 'STAR CHART', { chart: 1 }, { wood: 3, leather: 1, coal: 1 }, 'bench');
  WG_ACH.push(['gaze', 'STARGAZER', 'FIND ALL EIGHT STAR SIGNS', (c) => c.st.signs === 255]);
})();
const wgGazeNight = () => WGS.day - (WGS.clock < 0.5 ? 1 : 0); // a night belongs to the evening it began on
const wgSignTonight = () => ((wgGazeNight() + (WGS.world.seed | 0)) % WG_SIGNS.length + WG_SIGNS.length) % WG_SIGNS.length; // eight nights, eight signs
const wgGazeStats = () => { const m = WGS.world.meta; return m.stats || (m.stats = { kills: 0, far: 0 }); };
function wgGazeStars(n, night) { // where tonight's sign sits in the view
  const h = hash(night, n, 733), ox = h % 13 - 6, oy = (h >>> 8) % 13 - 6;
  return WG_SIGNS[n][1].map(([x, y]) => [WG_GAZE_X + ox + x, WG_GAZE_Y + oy + y]);
}
function wgGazeOpen(mode) {
  const K = WGS.gaze = { mode, n: 0, night: 0, lit: [], cx: 0, cy: 0, done: 0, isNew: false, t0: WGS.t, ring: [], shoot: null, shT: 3 + Math.random() * 4, wish: 0 };
  if (mode === 'sky') {
    const st = wgGazeStats(); K.n = wgSignTonight(); K.night = wgGazeNight();
    if (st.signN === K.night && st.signs & (1 << K.n)) { K.lit = WG_SIGNS[K.n][1].map(() => 1); K.done = WGS.t - 9; } // found tonight already
  }
  WGS.scr = 'gaze'; WGS.ui = {}; wgSfx('select');
}
function wgGazeClose() { WGS.scr = 'play'; WGS.gaze = null; WGS.ui = {}; }
const _wgUseGaze = wgUse;
wgUse = function (tx, ty) {
  const id = wgObjAt(WGS.world, WGS.dim, tx, ty), o = id && OBJ[id];
  if (!o || (!o.gaze && !o.chart)) return _wgUseGaze(tx, ty);
  if (o.chart) wgGazeOpen('chart');
  else if (WGS.dim === 'u') wgToast('NO SKY DOWN HERE');
  else if (wgNight(WGS.clock) < 0.25) wgToast('THE STARS COME OUT AT NIGHT');
  else if (WGS.weather && WGS.dim === 'o') wgToast('TOO CLOUDY TONIGHT');
  else wgGazeOpen('sky');
  return true;
};
const _wgTipGaze = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipGaze(s);
  if (s.id === 'telescope') L.push('USE IT AT NIGHT TO WATCH THE STARS', 'A STAR SIGN HIDES THERE EVERY NIGHT');
  else if (s.id === 'star_chart') L.push('SHOWS THE STAR SIGNS YOU FOUND');
  return L;
};

// ---------- the view: the cross follows the mouse or a finger, or moves with the arrows and a stick ----------
const _wgUpdGaze = updateWG;
updateWG = function (dt) {
  _wgUpdGaze(dt);
  if (WGS.scr !== 'gaze' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  const K = WGS.gaze;
  if (!K || WGS.t > K.t0 && (pressed('Escape', 'PadB', wgKey('use'), wgKey('bag')) || Input.rHit)) { wgGazeClose(); return; } // not on the press that opened it
  if (K.mode !== 'sky') return;
  if (Input.lastAim === 'mouse' || Input.lastAim === 'touch') { K.cx = Input.mx - WG_GAZE_X; K.cy = Input.my - WG_GAZE_Y; }
  else {
    const kd = (n, a) => Input.down[wgKey(n)] || Input.down[a];
    K.cx += ((kd('right', 'ArrowRight') ? 1 : 0) - (kd('left', 'ArrowLeft') ? 1 : 0) + Input.pad.mx) * 110 * dt;
    K.cy += ((kd('down', 'ArrowDown') ? 1 : 0) - (kd('up', 'ArrowUp') ? 1 : 0) + Input.pad.my) * 110 * dt;
  }
  const r = Math.hypot(K.cx, K.cy), R = WG_GAZE_R - 4; if (r > R) { K.cx *= R / r; K.cy *= R / r; }
  if (!K.done) {
    const S = wgGazeStars(K.n, K.night); let n = K.lit.filter(Boolean).length;
    S.forEach(([x, y], i) => {
      if (K.lit[i] || Math.hypot(x - WG_GAZE_X - K.cx, y - WG_GAZE_Y - K.cy) > 8) return;
      K.lit[i] = 1; K.ring.push(x, y, WGS.t); wgSfx('bell' + (n++ % 4));
    });
    if (n === S.length) { // the sign is whole: its lines draw in, and it goes onto the chart
      const st = wgGazeStats(); K.done = WGS.t; K.isNew = !((st.signs || 0) & (1 << K.n));
      st.signs = (st.signs || 0) | (1 << K.n); st.signN = K.night; wgSfx('cgate');
      for (const [x, y] of S) K.ring.push(x, y, WGS.t + 0.3);
    }
  }
  if (K.shoot) { if ((K.shoot.t += dt) > 0.7) K.shoot = null; }
  else if ((K.shT -= dt) <= 0) { // a shooting star now and then
    const a = Math.random() * 6.283, r0 = 30 + Math.random() * 40;
    K.shoot = { x: Math.cos(a) * r0, y: Math.sin(a) * r0 - 20, vx: (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 60), vy: 50 + Math.random() * 30, t: 0 };
    K.shT = 7 + Math.random() * 8; K.wish = WGS.t + 2.4;
  }
};
const _wgDrawGaze = drawWG;
drawWG = function () {
  _wgDrawGaze();
  if (WGS.scr !== 'gaze' || !WGS.world || !WGS.gaze) return;
  const K = WGS.gaze, ui = WGS.ui;
  fillScreen(PAL['0']);
  if (K.mode === 'sky') wgGazeSky(K); else wgGazeChart();
  wgUiBegin(ui); if (K.mode === 'sky' && (Input.lastAim === 'pad' || Input.lastAim === 'keys')) ui.sel = -1; // under the sky A and Enter do nothing, B and Escape close
  if (K.mode === 'sky' ? wgButton(ui, 'CLOSE', 312, 196, 64) : wgButton(ui, 'CLOSE', 266, 190, 64)) wgGazeClose();
  wgUiEnd(ui);
};
function wgGazeSky(K) {
  const t = WGS.t, X = WG_GAZE_X, Y = WG_GAZE_Y, S = wgGazeStars(K.n, K.night), tw = WGGZ.tw;
  const v = wgGazeView(K); ctx.drawImage(v, X - (v.width >> 1), Y - (v.height >> 1));
  for (let i = 0; i < tw.length; i += 2) if (Math.sin(t * 1.7 + i * 2.3) > 0.9) { rect(tw[i] - 1, tw[i + 1], 3, 1, 'l'); rect(tw[i], tw[i + 1] - 1, 1, 3, 'l'); rect(tw[i], tw[i + 1], 1, 1, 'w'); } // a few twinkle
  if (K.done) { // the sign's lines, drawn in from each star, dotted, never over a star
    const k = Math.min(1, (t - K.done) / 1.2);
    for (const [a, b] of WG_SIGNS[K.n][2]) {
      const [x0, y0] = S[a], [x1, y1] = S[b], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let j = 4; j <= n - 4; j += 2) if (j / n <= k) rect(Math.round(x0 + (x1 - x0) * j / n), Math.round(y0 + (y1 - y0) * j / n), 1, 1, 'c');
    }
  }
  S.forEach(([x, y], i) => {
    if (K.lit[i]) { rect(x - 2, y, 5, 1, 'y'); rect(x, y - 2, 1, 5, 'y'); rect(x - 1, y, 3, 1, 'Y'); rect(x, y - 1, 1, 3, 'Y'); rect(x, y, 1, 1, 'w'); }
    else { const c = Math.sin(t * 2.2 + i * 1.7) > 0.3 ? 'l' : 'm'; rect(x - 1, y, 3, 1, c); rect(x, y - 1, 1, 3, c); rect(x, y, 1, 1, 'w'); }
  });
  for (let i = K.ring.length - 3; i >= 0; i -= 3) { // a little burst as a star lights
    const a = t - K.ring[i + 2]; if (a > 0.45) { K.ring.splice(i, 3); continue; } if (a < 0) continue;
    const r = Math.round(3 + a * 16), x = K.ring[i], y = K.ring[i + 1];
    rect(x - r, y, 1, 1, 'Y'); rect(x + r, y, 1, 1, 'Y'); rect(x, y - r, 1, 1, 'Y'); rect(x, y + r, 1, 1, 'Y');
  }
  const sh = K.shoot;
  if (sh) for (let j = 0; j < 7; j++) { // a streak and its fading tail, inside the eyepiece only
    const x = Math.round(X + sh.x + sh.vx * (sh.t - j * 0.012)), y = Math.round(Y + sh.y + sh.vy * (sh.t - j * 0.012));
    if (Math.hypot(x - X, y - Y) < WG_GAZE_R - 2) rect(x, y, 1, 1, j ? j < 3 ? 'Y' : 'l' : 'w');
  }
  const cx = Math.round(X + K.cx), cy = Math.round(Y + K.cy); // the view's cross: four little corners
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { rect(cx + sx * 6 - (sx > 0 ? 2 : 0), cy + sy * 6, 3, 1, 'C'); rect(cx + sx * 6, cy + sy * 6 - (sy > 0 ? 2 : 0), 1, 3, 'C'); }
  if (K.done && t - K.done > 0.8) wtext(WG_SIGNS[K.n][0], X, 5, 'Y', 2, 1); else if (!K.done) wtext('FIND THE BRIGHT STARS', X, 5, 'l', 1, 1); // the sign's name above the view, never over its stars
  if (K.wish > t) wtext('MAKE A WISH...', X, 202, 'Y', 1, 1); else if (K.done && t - K.done > 0.8) wtext(K.isNew ? 'A NEW STAR SIGN!' : 'IT IS ON YOUR CHART', X, 202, 'c', 1, 1);
  wgGazeCount(8, 200);
}
function wgGazeCount(x, y) { const b = wgGazeStats().signs || 0; let n = 0; for (let i = 0; i < WG_SIGNS.length; i++) if (b & (1 << i)) n++; wtext('STAR SIGNS ' + n + '/' + WG_SIGNS.length, x, y, 'l', 1); }
function wgGazeView(K) { // the round view through the eyepiece, baked once a night: a brass ring, the milky way, faint stars
  const key = K.night + ':' + K.n; if (WGGZ.key === key) return WGGZ.c;
  const R = WG_GAZE_R, m = R + 4, [c, g] = wgCv(m * 2 + 1, m * 2 + 1), tw = [], sign = wgGazeStars(K.n, K.night);
  for (let y = -m; y <= m; y++) for (let x = -m; x <= m; x++) {
    const d = Math.hypot(x, y); if (d > R + 3.5) continue;
    const lit = (x + y) / (d || 1); let col; // below -0.6 the ring faces the top left
    if (d > R + 2.5) col = '0';
    else if (d > R + 1.5) col = lit < -0.6 ? 'O' : lit > 0.6 ? 'n' : 'o';
    else if (d > R - 0.5) col = lit < -0.6 ? 'Y' : lit > 0.6 ? 'o' : 'y';
    else if (d > R - 1.5) col = 'x';
    else { const b = Math.abs(x * 0.5 + y * 0.866 + Math.sin(x * 0.06) * 6); col = b < 6 || (b < 16 && !((x + y) & 1)) ? '1' : '0'; }
    wgPx(g, x + m, y + m, col);
  }
  for (let i = 0; i < 130; i++) { // 90 strewn about, 40 along the milky way
    const u = (hash(i, K.night, 401) & 4095) / 4096, v = (hash(i, K.night, 402) & 4095) / 4096, b = hash(i, K.night, 403) % 10;
    let x, y;
    if (i < 90) { const r = Math.sqrt(u) * (R - 5), a = v * 6.283; x = Math.round(Math.cos(a) * r); y = Math.round(Math.sin(a) * r); }
    else { const s = (u * 2 - 1) * (R - 8), o = (v * 2 - 1) * 10; x = Math.round(s * 0.866 + o * 0.5); y = Math.round(-s * 0.5 + o * 0.866); if (Math.hypot(x, y) > R - 5) continue; }
    if (sign.some(([sx, sy]) => Math.hypot(sx - WG_GAZE_X - x, sy - WG_GAZE_Y - y) < 7)) continue; // the sign's stars stand alone
    const col = i >= 90 ? (b < 6 ? 'd' : 'm') : b < 5 ? 'd' : b < 8 ? 'm' : b < 9 ? 'l' : 'w';
    wgPx(g, x + m, y + m, col); if (col === 'l' || col === 'w') tw.push(WG_GAZE_X + x, WG_GAZE_Y + y);
  }
  WGGZ.key = key; WGGZ.c = c; WGGZ.tw = tw; return c;
}
// the star chart: eight cells, a found sign drawn small with its lines and name, the others still a question
function wgGazeChart() {
  const b = wgGazeStats().signs || 0, x0 = 46, y0 = 12;
  ctx.drawImage(wgChartArt(b), x0, y0);
  wtext('STAR CHART', WG_GAZE_X, y0 + 7, 'Y', 2, 1);
  WG_SIGNS.forEach(([name], i) => {
    const x = x0 + 9 + (i % 4) * 70, y = y0 + 24 + Math.floor(i / 4) * 76;
    if (b & (1 << i)) wtext(name, x + 32, y + 60, 'Y', 0, 1); else { wtext('?', x + 32, y + 24, '3', 1, 1); wtext('???', x + 32, y + 60, '3', 0, 1); }
  });
  wgGazeCount(x0 + 10, y0 + 180);
}
function wgChartArt(b) { // the frame, the paper and the found signs, baked when a sign is added
  if (WGGZ.chart === b && WGGZ.cc) return WGGZ.cc;
  const [c, g] = wgCv(292, 196);
  wgRc(g, 0, 0, 292, 196, '0'); wgRc(g, 1, 1, 290, 194, 'n'); wgRc(g, 1, 1, 290, 1, 'N'); wgRc(g, 1, 1, 1, 194, 'N'); wgRc(g, 3, 3, 286, 190, '0'); wgRc(g, 4, 4, 284, 188, '1');
  WG_SIGNS.forEach(([, P, E], i) => {
    const x = 9 + (i % 4) * 70, y = 24 + Math.floor(i / 4) * 76, mx = x + 32, my = y + 27;
    wgRc(g, x, y, 64, 70, '0');
    for (let k = 0; k < 9; k++) wgPx(g, x + 3 + hash(i, k, 91) % 58, y + 3 + hash(i, k, 92) % 50, 'd'); // faint stars
    if (!(b & (1 << i))) return;
    const Q = P.map(([px, py]) => [Math.round(mx + px * 0.42), Math.round(my + py * 0.42)]);
    for (const [a, e] of E) { const [ax, ay] = Q[a], [ex, ey] = Q[e], n = Math.max(Math.abs(ex - ax), Math.abs(ey - ay)); for (let j = 2; j <= n - 2; j++) wgPx(g, Math.round(ax + (ex - ax) * j / n), Math.round(ay + (ey - ay) * j / n), 'b'); }
    for (const [qx, qy] of Q) { wgPx(g, qx - 1, qy, 'y'); wgPx(g, qx + 1, qy, 'y'); wgPx(g, qx, qy - 1, 'y'); wgPx(g, qx, qy + 1, 'y'); wgPx(g, qx, qy, 'w'); }
  });
  WGGZ.chart = b; WGGZ.cc = c; return c;
}

// ---------- art ----------
const _wgBuildGaze = wgBuildAll;
wgBuildAll = function () {
  _wgBuildGaze();
  const one = (id, w, h, fn) => wgReg(id, [wgMake(id, w, h, fn)]);
  // a brass telescope on a wooden tripod, aimed at the sky
  one('telescope', 16, 24, (g) => {
    wgLine(g, 7, 12, 3, 22, 'n'); wgLine(g, 8, 12, 12, 22, 'n'); wgLine(g, 8, 13, 8, 21, 'N'); // the legs
    wgRc(g, 6, 9, 4, 4, 'X'); wgRc(g, 6, 9, 4, 1, 'l'); // the mount
    for (let i = 0; i <= 11; i++) { const x = 2 + i, y = Math.round(11 - i * 0.55); wgPx(g, x, y - 1, 'y'); wgPx(g, x, y, 'O'); wgPx(g, x, y + 1, 'o'); } // the tube, lit along its top
    wgRc(g, 13, 2, 2, 5, 'O'); wgRc(g, 13, 2, 1, 5, 'y'); wgPx(g, 14, 3, 'C'); wgPx(g, 14, 4, 'c'); // the lens end
    wgRc(g, 1, 11, 1, 2, 'X'); // the eyepiece
  });
  // a star chart on an easel: a dark blue sheet in a wooden frame, a star sign drawn on it
  one('star_chart', 14, 22, (g) => {
    wgLine(g, 4, 2, 2, 20, 'n'); wgLine(g, 9, 2, 11, 20, 'n'); wgLine(g, 7, 6, 7, 20, 'u'); // the easel's legs, the back one in shade
    wgRc(g, 1, 3, 12, 11, 'N'); wgRc(g, 1, 3, 12, 1, 'A'); wgRc(g, 12, 4, 1, 10, 'n'); wgRc(g, 1, 13, 12, 1, 'n'); wgRc(g, 2, 4, 10, 9, 'b'); // the frame and the sheet
    wgLine(g, 3, 11, 5, 8, 'B'); wgLine(g, 5, 8, 8, 9, 'B'); wgLine(g, 8, 9, 10, 5, 'B');
    for (const [x, y] of [[3, 11], [5, 8], [8, 9]]) wgPx(g, x, y, 'Y'); wgPx(g, 10, 5, 'w');
    wgRc(g, 2, 14, 10, 1, 'n'); // the ledge
  });
};
