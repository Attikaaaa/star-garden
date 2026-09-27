'use strict';
// European roulette and the Big Wheel. Both wheels are rasters drawn from polar tables at
// the current angle (wheelRaster in casino.js), so they turn without rotating a bitmap.

const TAU = Math.PI * 2;
// Light from the top left on a rim: screen angle 0 is up, clockwise, so top left is -PI/4.
const rimLit = (sa) => Math.cos(sa + Math.PI / 4);
const rouCol = (n) => n === 0 ? 'g' : ROU_RED.includes(n) ? 'r' : 'x';

// ---------- The wheels ----------
function rouDisk(R) {
  return wheelRaster('rou' + R, R, 37, [
    [0, R * 0.14, (s, a, r, sa) => rimLit(sa) > 0.3 ? 'Y' : 'y'],
    [R * 0.14, R * 0.2, () => '0'],
    // the cone: dark wood with four brass spokes that turn with the wheel
    [R * 0.2, R * 0.5, (s, a) => (Math.floor(a / TAU * 4 * 37 + 0.5) % 37 === 0 ? 'O' : (s & 1 ? 'N' : 'n'))],
    [R * 0.5, R * 0.54, () => '0'],
    // the pockets, split by brass frets
    [R * 0.54, R * 0.7, (s, a) => { const f = a / TAU * 37 + 0.5; return f - Math.floor(f) < 0.12 && R > 12 ? 'O' : rouCol(ROU_ORDER[s]); }],
    // the number ring, a lighter band of the same colours
    [R * 0.7, R * 0.8, (s) => { const n = ROU_ORDER[s]; return n === 0 ? 'G' : ROU_RED.includes(n) ? 'R' : 'X'; }],
    [R * 0.8, R * 0.83, () => '0'],
    // the ball track and the wooden bowl, lit from the top left
    [R * 0.83, R * 0.95, (s, a, r, sa) => { const l = rimLit(sa); return l > 0.55 ? 'A' : l > -0.2 ? 'N' : 'n'; }],
    [R * 0.95, R + 0.5, () => '0'],
  ]);
}
// The Big Wheel: 54 segments, the multiplier is what a winning bet returns.
const WOF_KINDS = [
  { id: 'x2', m: 2, n: 25, col: 'B', label: 'X2' },
  { id: 'x4', m: 4, n: 12, col: 'G', label: 'X4' },
  { id: 'x6', m: 6, n: 8, col: 'y', label: 'X6' },
  { id: 'x10', m: 10, n: 5, col: 'P', label: 'X10' },
  { id: 'x25', m: 25, n: 2, col: 'o', label: 'X25' },
  { id: 'star', m: 50, n: 1, col: 'r', label: 'STAR', icon: 'sus_0' },
  { id: 'frog', m: 50, n: 1, col: 'h', label: 'FROG', icon: 'frog_0' },
];
const WOF_FREE = { x2: 10, x4: 20, x6: 30, x10: 50, x25: 125, star: 500, frog: 250 };
// The segments' order: the rare ones first, each spread evenly round the wheel.
const WOF_SEGS = (() => {
  const a = new Array(54).fill(-1);
  for (let k = WOF_KINDS.length - 1; k >= 0; k--) {
    const K = WOF_KINDS[k];
    for (let j = 0; j < K.n; j++) {
      let i = Math.round((j + (k === 6 ? 0.5 : k * 0.137)) * 54 / K.n) % 54;
      while (a[i] >= 0) i = (i + 1) % 54;
      a[i] = k;
    }
  }
  return a;
})();
function wofDisk(R) {
  return wheelRaster('wof' + R, R, 54, [
    [0, R * 0.16, (s, a, r, sa) => rimLit(sa) > 0.3 ? 'Y' : 'y'],
    [R * 0.16, R * 0.2, () => '0'],
    [R * 0.2, R * 0.86, (s, a, r) => {
      const f = a / TAU * 54 + 0.5, fr = f - Math.floor(f);
      if (R > 24 && (fr < 0.07 || fr > 0.97)) return '0';
      const K = WOF_KINDS[WOF_SEGS[s]];
      // a lighter band near the rim, where the label sits
      return r > R * 0.7 && R > 24 ? (K.col === 'y' ? 'Y' : K.col === 'B' ? 'c' : K.col === 'G' ? 'h' : K.col === 'P' ? 'q' : K.col === 'o' ? 'O' : K.col === 'r' ? 'R' : 'H') : K.col;
    }],
    [R * 0.86, R * 0.9, () => '0'],
    // the gold rim with a peg at every segment edge
    [R * 0.9, R + 0.5, (s, a, r, sa) => {
      const f = a / TAU * 54 + 0.5, fr = f - Math.floor(f);
      if (r > R - 0.5) return '0';
      if (R > 24 && fr < 0.12 && r < R * 0.97) return 'w';
      return rimLit(sa) > 0.4 ? 'Y' : rimLit(sa) > -0.3 ? 'y' : 'O';
    }],
  ]);
}

// A chip on the table: the biggest denomination that fits, with the amount under it.
// Table limits per spot; the Gold card (the VIP lounge) raises them and swaps the 1 chip for 500.
const CAS_LIMIT = { rou: [200, 2000], wof: [100, 100], sic: [1000, 1000] };
const casVipT = () => casTier() >= 2;
const casLimit = (g) => CAS_LIMIT[g][casVipT() ? 1 : 0];
const chipSet = (g) => g === 'wof' ? [1, 5, 25, 100] : g === 'sic' || casVipT() ? [5, 25, 100, 500] : [1, 5, 25, 100];
function casOver(g, now, add) {
  if (now + add <= casLimit(g)) return false;
  toast('THE TABLE LIMIT IS ' + casLimit(g) + ' A SPOT'); Audio_.sfx('deny');
  return true;
}
function drawChipAt(x, y, amt, small) {
  const d = [500, 100, 25, 5, 1].find(v => amt >= v) || 1;
  drawS(S('cz_chip_' + d), x - 4, y - 5);
  if (!small || amt > 1) text(String(amt), x, y + 7, 'w', 2, 1);
}
// A chip picker: one button per value, the chosen one lit. Returns the new index.
function casChips(x, y, i, busy, g) {
  chipSet(g).forEach((v, k) => {
    if (cbtn('chip' + v, x + k * 30, y, 28, 16, String(v), { icon: 'cz_chip_' + v, on: k === i, keys: ['Digit' + (k + 1)], disabled: busy, nofocus: true, quiet: true })) { Audio_.sfx('chip'); i = k; }
  });
  return i;
}

// ---------- Roulette ----------
const RB = { x0: 120, y0: 34, cw: 20, ch: 16 }; // the number grid
const rouNum = (c, r) => c * 3 + 3 - r;
// The numbers a lattice spot covers: cells, the lines between them (splits, corners) and
// the bottom edge (streets, six lines).
function rouLattice(gx, gy) {
  const c = gx >> 1, r = gy >> 1, ex = gx & 1, ey = gy & 1;
  if (gy === 5) { const a = [0, 1, 2].map(q => rouNum(c, q)); return ex ? a.concat([0, 1, 2].map(q => rouNum(c + 1, q))) : a; }
  const cols = ex ? [c, c + 1] : [c], rows = ey ? [r, r + 1] : [r], out = [];
  for (const cc of cols) for (const rr of rows) out.push(rouNum(cc, rr));
  return out;
}
const ROU_OUT = [
  { id: '1-18', f: n => n >= 1 && n <= 18 }, { id: 'EVEN', f: n => n > 0 && n % 2 === 0 },
  { id: 'RED', f: n => ROU_RED.includes(n) }, { id: 'BLACK', f: n => n > 0 && !ROU_RED.includes(n) },
  { id: 'ODD', f: n => n % 2 === 1 }, { id: '19-36', f: n => n >= 19 },
];
const ROU_DOZ = [0, 1, 2].map(i => ({ id: (i * 12 + 1) + '-' + (i * 12 + 12), f: n => n > i * 12 && n <= i * 12 + 12 }));
const ROU_COL = [0, 1, 2].map(r => ({ id: 'COL' + (3 - r), f: n => n > 0 && n % 3 === (3 - r) % 3 }));
const rouNums = (f) => { const a = []; for (let n = 1; n <= 36; n++) if (f(n)) a.push(n); return a; };
// A cursor spot: { id, nums, x, y } in screen pixels.
function rouSpot(cur) {
  const { x0, y0, cw, ch } = RB;
  if (cur.z === 'zero') return { id: '0', nums: [0], x: 112, y: y0 + ch * 1.5 };
  if (cur.z === 'col') return { id: ROU_COL[cur.r].id, nums: rouNums(ROU_COL[cur.r].f), x: x0 + 12 * cw + 10, y: y0 + cur.r * ch + 8 };
  if (cur.z === 'doz') return { id: ROU_DOZ[cur.i].id, nums: rouNums(ROU_DOZ[cur.i].f), x: x0 + cur.i * 80 + 40, y: y0 + 3 * ch + 7 };
  if (cur.z === 'out') return { id: ROU_OUT[cur.i].id, nums: rouNums(ROU_OUT[cur.i].f), x: x0 + cur.i * 40 + 20, y: y0 + 3 * ch + 21 };
  const n = rouLattice(cur.gx, cur.gy);
  const x = cur.gx & 1 ? x0 + ((cur.gx + 1) >> 1) * cw : x0 + (cur.gx >> 1) * cw + cw / 2;
  const y = cur.gy === 5 ? y0 + 3 * ch : cur.gy & 1 ? y0 + ((cur.gy + 1) >> 1) * ch : y0 + (cur.gy >> 1) * ch + ch / 2;
  return { id: n.slice().sort((a, b) => a - b).join('/'), nums: n, x, y };
}
// The spot under the mouse, or null.
function rouHit(mx, my) {
  const { x0, y0, cw, ch } = RB;
  if (mx >= 104 && mx < x0 && my >= y0 && my < y0 + 3 * ch) return { z: 'zero' };
  if (mx >= x0 + 12 * cw && mx < x0 + 12 * cw + 20 && my >= y0 && my < y0 + 3 * ch) return { z: 'col', r: Math.floor((my - y0) / ch) };
  if (mx >= x0 && mx < x0 + 12 * cw && my >= y0 + 3 * ch + 3 && my < y0 + 3 * ch + 14) return { z: 'doz', i: Math.floor((mx - x0) / 80) };
  if (mx >= x0 && mx < x0 + 12 * cw && my >= y0 + 3 * ch + 14 && my < y0 + 3 * ch + 28) return { z: 'out', i: Math.floor((mx - x0) / 40) };
  if (mx < x0 || mx >= x0 + 12 * cw || my < y0 || my > y0 + 3 * ch + 2) return null;
  const lx = mx - x0, ly = my - y0, c = Math.min(11, Math.floor(lx / cw)), r = Math.min(2, Math.floor(ly / ch)), fx = lx - c * cw, fy = ly - r * ch;
  let gx = c * 2, gy = r * 2;
  if (fx < 4 && c > 0) gx--; else if (fx >= cw - 4 && c < 11) gx++;
  if (ly >= 3 * ch - 2) gy = 5;
  else if (fy < 4 && r > 0) gy--; else if (fy >= ch - 4 && r < 2) gy++;
  return { z: 'in', gx, gy };
}
function rouMove(cur, dx, dy) {
  const c = cur;
  if (c.z === 'in') {
    if (dx < 0) return c.gx > 0 ? { z: 'in', gx: c.gx - 1, gy: c.gy } : { z: 'zero' };
    if (dx > 0) return c.gx < 22 ? { z: 'in', gx: c.gx + 1, gy: c.gy } : { z: 'col', r: Math.min(2, c.gy >> 1) };
    if (dy < 0) return { z: 'in', gx: c.gx, gy: Math.max(0, c.gy - 1) };
    return c.gy < 5 ? { z: 'in', gx: c.gx, gy: c.gy + 1 } : { z: 'doz', i: Math.min(2, (c.gx >> 1) >> 2) };
  }
  if (c.z === 'zero') return dx > 0 ? { z: 'in', gx: 0, gy: 2 } : c;
  if (c.z === 'col') return dx < 0 ? { z: 'in', gx: 22, gy: c.r * 2 } : dy ? { z: 'col', r: Math.max(0, Math.min(2, c.r + dy)) } : c;
  if (c.z === 'doz') {
    if (dy < 0) return { z: 'in', gx: c.i * 8 + 3, gy: 5 };
    if (dy > 0) return { z: 'out', i: c.i * 2 };
    const i = c.i + dx;
    return i < 0 ? { z: 'zero' } : { z: 'doz', i: Math.min(2, i) };
  }
  if (dy < 0) return { z: 'doz', i: c.i >> 1 };
  if (dy > 0) return c;
  return { z: 'out', i: Math.max(0, Math.min(5, c.i + dx)) };
}

const ROU = { bets: new Map(), undo: [], last: null, chip: 1, cur: { z: 'in', gx: 8, gy: 2 }, spin: null, hist: [], rot: 0, ball: null, res: null, win: 0, total: 0 };
const rouTotal = () => { let t = 0; for (const b of ROU.bets.values()) t += b.amt; return t; };
function rouPlace(sp, amt) {
  const t = rouTotal(), b = ROU.bets.get(sp.id);
  if (casOver('rou', b ? b.amt : 0, amt)) return false;
  if (!b && ROU.bets.size >= 12) { toast('TWELVE SPOTS A SPIN'); Audio_.sfx('deny'); return false; }
  if (t + amt > cas().chips) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('deny'); return false; }
  if (b) b.amt += amt; else ROU.bets.set(sp.id, { nums: sp.nums, amt, x: sp.x, y: sp.y });
  ROU.undo.push([sp.id, amt]);
  Audio_.sfx('chip');
  return true;
}
function rouSpin() {
  const total = rouTotal();
  if (!total || !casinoBet('rou', total)) { Audio_.sfx('deny'); return; }
  const n = crand(37);
  let pay = 0;
  for (const b of ROU.bets.values()) if (b.nums.includes(n)) pay += b.amt * 36 / b.nums.length;
  casPend('rou', pay);
  ROU.last = [...ROU.bets.entries()].map(([id, b]) => [id, Object.assign({}, b)]);
  // the wheel turns one way, the ball the other; the ball's pocket is known from the start
  const idx = ROU_ORDER.indexOf(n), r0 = ROU.rot, r1 = r0 + TAU * (1.5 + crandf());
  const b1 = r1 + idx * TAU / 37, b0 = b1 + TAU * (5 + crand(2));
  ROU.spin = { t: 0, T: 5.2, n, pay, total, r0, r1, b0, b1, last: 0 };
  ROU.res = null;
  Audio_.sfx('ball');
}
CAS_GAMES.rou = {
  name: 'ROULETTE',
  enter() { ROU.bets.clear(); ROU.undo = []; ROU.spin = null; ROU.res = null; ROU.win = 0; Audio_.sfx('chip'); },
  leave() { ROU.bets.clear(); },
  odds() {
    return ['A EUROPEAN WHEEL: 37 POCKETS, ONE ZERO.', 'A BET ON N NUMBERS PAYS 36/N TIMES THE BET BACK.', 'ONE NUMBER 36X, SPLIT 18X, STREET 12X, CORNER 9X,', 'SIX LINE 6X, DOZEN OR COLUMN 3X, RED, ODD, 1-18... 2X.', 'THE ZERO LOSES EVERY OUTSIDE BET.', 'THE HOUSE KEEPS 2.7 OF EVERY 100 CHIPS BET.', 'UP TO 12 SPOTS A SPIN, ' + casLimit('rou') + ' CHIPS A SPOT.'];
  },
  update(dt) {
    const busy = !!ROU.spin;
    // the board owns the arrow keys: no button focus here
    CB.focus = null; CB.nav = false;
    casTop(this, busy);
    ROU.chip = casChips(104, 196, ROU.chip, busy, 'rou');
    const t = rouTotal();
    if (cbtn('undo', 228, 196, 36, 16, 'UNDO', { keys: ['KeyZ', 'Backspace', 'PadLB'], disabled: busy || !ROU.undo.length, nofocus: true })) {
      const [id, a] = ROU.undo.pop(), b = ROU.bets.get(id);
      if (b && (b.amt -= a) <= 0) ROU.bets.delete(id);
    }
    if (cbtn('clear', 228, 176, 36, 16, 'CLEAR', { keys: ['KeyC'], disabled: busy || !t, nofocus: true })) { ROU.bets.clear(); ROU.undo = []; }
    const canRe = !busy && !t && ROU.last && ROU.last.length;
    if (cbtn('re', 268, 176, 44, 16, 'REPEAT', { keys: ['KeyR'], disabled: !canRe, nofocus: true })) for (const [id, b] of ROU.last) rouPlace({ id, nums: b.nums, x: b.x, y: b.y }, b.amt);
    if (cbtn('dbl', 268, 196, 44, 16, 'DOUBLE', { keys: ['KeyX'], disabled: busy || !t, nofocus: true })) for (const [id, b] of [...ROU.bets.entries()]) rouPlace({ id, nums: b.nums, x: b.x, y: b.y }, b.amt);
    if (cbtn('spin', 316, 176, 62, 36, 'SPIN', { primary: true, keys: ['PadX', 'PadStart'], disabled: busy || !t, nofocus: true })) rouSpin();
    if (!busy) {
      // the board: arrows or the mouse move the cursor, OK drops a chip there
      const dx = pressed('ArrowLeft', 'KeyA', 'PadLeft') ? -1 : pressed('ArrowRight', 'KeyD', 'PadRight') ? 1 : 0, dy = pressed('ArrowUp', 'KeyW', 'PadUp') ? -1 : pressed('ArrowDown', 'KeyS', 'PadDown') ? 1 : 0;
      if (dx || dy) { ROU.cur = rouMove(ROU.cur, dx, dy); Audio_.sfx('select'); }
      const h = mouseOn() ? rouHit(Input.mx, Input.my) : null;
      if (h && (Input.lastAim === 'mouse' || Input.mouseHit)) ROU.cur = h;
      if ((h && Input.mouseHit && !CB.fired) || pressed('Enter', 'KeyE', 'PadA')) rouPlace(rouSpot(ROU.cur), chipSet('rou')[ROU.chip]);
      return;
    }
    // the spin: both ease out; the ball drops in over the last third
    const s = ROU.spin;
    s.t += dt;
    const u = Math.min(1, s.t / s.T), e = 1 - Math.pow(1 - u, 3);
    ROU.rot = s.r0 + (s.r1 - s.r0) * e;
    const ba = s.b0 + (s.b1 - s.b0) * e, fall = Math.max(0, Math.min(1, (u - 0.62) / 0.3));
    ROU.ball = { a: ba, r: 0.89 - 0.27 * fall - (fall > 0 && fall < 1 ? Math.abs(Math.sin(fall * 14)) * 0.05 * (1 - fall) : 0) };
    // a click each time the ball crosses a fret while it bounces
    const fret = Math.floor((ba - ROU.rot) / TAU * 37);
    if (fall > 0 && fall < 1 && fret !== s.last) { s.last = fret; Audio_.sfx('ball'); }
    if (s.t >= s.T + 0.4) {
      ROU.spin = null;
      casSettle();
      ROU.res = s.n; ROU.win = s.pay;
      ROU.hist.unshift(s.n); if (ROU.hist.length > 12) ROU.hist.pop();
      if (s.pay > 0) casWin(s.pay, s.total, 56, 76); else Audio_.sfx('rstop');
      ROU.bets.clear(); ROU.undo = [];
    }
  },
  draw() {
    ctx.drawImage(casFelt('felt'), 0, 0);
    drawCasTop(this);
    // the wheel in its bowl
    const cx = 56, cy = 76, R = 40;
    ctx.drawImage(rouDisk(R)(ROU.rot), cx - R, cy - R);
    if (ROU.ball) {
      const b = ROU.ball, bx = Math.round(cx + Math.sin(b.a) * R * b.r), by = Math.round(cy - Math.cos(b.a) * R * b.r);
      rect(bx - 1, by - 2, 3, 5, '0'); rect(bx - 2, by - 1, 5, 3, '0');
      rect(bx - 1, by - 1, 3, 3, 'L'); rect(bx - 1, by - 1, 1, 1, 'w'); rect(bx + 1, by + 1, 1, 1, 'l');
    }
    // the result, then the last numbers
    if (ROU.res !== null) {
      const n = ROU.res, c = rouCol(n);
      rect(cx - 17, 122, 34, 22, '0'); rect(cx - 16, 123, 32, 20, c === 'g' ? 'G' : c === 'r' ? 'r' : 'X');
      rect(cx - 15, 123, 30, 1, c === 'g' ? 'h' : c === 'r' ? 'R' : 'm');
      text(String(n), cx, 133, 'w', 3, 1);
      text(ROU.win ? 'WIN ' + ROU.win : 'NO WIN', cx, 152, ROU.win ? 'Y' : '3', 1, 1);
    } else if (ROU.spin) text('NO MORE BETS', cx, 133, 'Y', 1, 1);
    else text('PLACE BETS', cx, 133, 'w', 1, 1);
    text('LAST', 8, 164, '3', 0);
    ROU.hist.forEach((n, i) => {
      const x = 8 + (i % 6) * 15, y = 170 + Math.floor(i / 6) * 12, c = rouCol(n);
      rect(x, y, 14, 11, '0'); rect(x + 1, y + 1, 12, 9, c === 'g' ? 'G' : c === 'r' ? 'r' : 'X');
      text(String(n), x + 7, y + 6, 'w', 0, 1);
    });
    this.drawBoard();
    CB.focus = null; // the board has the cursor, not the buttons
    drawBtns();
    const t = rouTotal();
    text('BET ' + t, 104, 184, t ? 'Y' : '3', 1);
  },
  drawBoard() {
    const { x0, y0, cw, ch } = RB, H = 3 * ch;
    // the table's lines are white; a thin '0' frame holds it all
    rect(103, y0 - 1, x0 + 12 * cw + 22 - 103, H + 30, '0');
    rect(104, y0, 15, H, 'G'); rect(105, y0, 1, H, 'h');
    text('0', 112, y0 + H / 2, 'w', 1, 1);
    for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) {
      const n = rouNum(c, r), x = x0 + c * cw, y = y0 + r * ch, red = ROU_RED.includes(n);
      rect(x, y, cw - 1, ch - 1, red ? 'r' : 'x');
      rect(x, y, cw - 1, 1, red ? 'R' : 'X');
      text(String(n), x + cw / 2, y + ch / 2, 'w', 1, 1);
    }
    for (let r = 0; r < 3; r++) { const y = y0 + r * ch; rect(x0 + 12 * cw, y, 20, ch - 1, 'z'); rect(x0 + 12 * cw, y, 20, 1, 'G'); text('2:1', x0 + 12 * cw + 10, y + ch / 2, 'Y', 1, 1); }
    ROU_DOZ.forEach((d, i) => { const x = x0 + i * 80; rect(x, y0 + H, 79, 13, 'z'); rect(x, y0 + H, 79, 1, 'G'); text(['1ST 12', '2ND 12', '3RD 12'][i], x + 40, y0 + H + 7, 'Y', 1, 1); });
    ROU_OUT.forEach((o, i) => {
      const x = x0 + i * 40, y = y0 + H + 14;
      rect(x, y, 39, 13, 'z'); rect(x, y, 39, 1, 'G');
      if (o.id === 'RED' || o.id === 'BLACK') { rect(x + 12, y + 3, 15, 8, '0'); rect(x + 13, y + 4, 13, 6, o.id === 'RED' ? 'r' : 'x'); rect(x + 13, y + 4, 13, 1, o.id === 'RED' ? 'R' : 'X'); }
      else { const l = tr(o.id); text(textW(l) > 37 ? l.slice(0, 5) + '.' : l, x + 20, y + 7, 'w', 1, 1); } // a long translation is cut to fit the cell
    });
    // which numbers the cursor covers
    const busy = !!ROU.spin, sp = rouSpot(ROU.cur);
    if (!busy) {
      for (const n of sp.nums) {
        let x, y;
        if (n === 0) { x = 104; y = y0; rect(x, y, 15, 1, 'Y'); rect(x, y + H - 1, 15, 1, 'Y'); continue; }
        const c = Math.floor((n - 1) / 3), r = 2 - ((n - 1) % 3);
        x = x0 + c * cw; y = y0 + r * ch;
        rect(x, y, cw - 1, 1, 'Y'); rect(x, y + ch - 2, cw - 1, 1, 'Y'); rect(x, y, 1, ch - 1, 'Y'); rect(x + cw - 2, y, 1, ch - 1, 'Y');
      }
    }
    // the chips on the table
    for (const b of ROU.bets.values()) drawChipAt(b.x, b.y, b.amt, true);
    if (ROU.spin && ROU.last) for (const [, b] of ROU.last) drawChipAt(b.x, b.y, b.amt, true);
    // the cursor: a blinking ring where the next chip lands
    if (!busy && Input.lastAim !== 'touch') {
      const bl = Math.floor(G.time * 4) % 2 ? 'Y' : 'w';
      rect(sp.x - 5, sp.y - 6, 11, 1, bl); rect(sp.x - 5, sp.y + 5, 11, 1, bl); rect(sp.x - 6, sp.y - 5, 1, 10, bl); rect(sp.x + 5, sp.y - 5, 1, 10, bl);
      const k = sp.nums.length, pay = k === 1 ? 'PAYS 36X' : 'PAYS ' + (36 / k) + 'X';
      text(sp.id + ': ' + pay, 250, 138, 'Y', 1, 1);
    }
  },
};

// ---------- The Big Wheel ----------
const WOF = { bets: {}, chip: 0, rot: 0, spin: null, res: -1, win: 0, last: null, free: false };
const wofFreeReady = () => cas().wheel !== dayKey();
const wofTotal = () => { let t = 0; for (const k in WOF.bets) t += WOF.bets[k]; return t; };
function wofSpin(free) {
  const total = wofTotal();
  if (!free && (!total || !casinoBet('wof', total))) { Audio_.sfx('deny'); return; }
  const seg = crand(54), K = WOF_KINDS[WOF_SEGS[seg]];
  let pay = 0;
  if (free) { cas().wheel = dayKey(); pay = WOF_FREE[K.id]; }
  else pay = (WOF.bets[K.id] || 0) * K.m;
  casPend('wof', pay);
  if (!free) WOF.last = Object.assign({}, WOF.bets);
  // segment i sits at angle rot + i*step; the pointer is at the top
  const r0 = WOF.rot, step = TAU / 54, base = -seg * step, turns = 3 + crand(2);
  let r1 = base + Math.ceil((r0 - base) / TAU) * TAU;
  r1 = r1 - TAU * turns + (crandf() - 0.5) * step * 0.6;
  WOF.spin = { t: 0, T: 5.5, seg, pay, total, free, r0, r1, tick: Math.floor(r0 / step) };
  WOF.res = -1;
  Audio_.sfx('reel');
}
CAS_GAMES.wof = {
  name: 'THE BIG WHEEL',
  enter() { WOF.bets = {}; WOF.spin = null; WOF.res = -1; WOF.win = 0; },
  leave() {},
  odds() {
    return ['54 SEGMENTS. A BET RETURNS ITS MULTIPLIER:', 'X2 ON 25 SEGMENTS, X4 ON 12, X6 ON 8, X10 ON 5,', 'X25 ON 2, STAR X50 ON 1, FROG X50 ON 1.', 'THE HOUSE KEEPS 7 TO 11 OF EVERY 100 CHIPS BET.', 'ONE FREE SPIN A DAY, FOR A PRIZE ON EVERY SEGMENT.'];
  },
  update(dt) {
    const busy = !!WOF.spin;
    casTop(this, busy);
    WOF_KINDS.forEach((K, i) => {
      const x = 196 + (i % 4) * 46, y = 36 + Math.floor(i / 4) * 44;
      if (cbtn('w' + K.id, x, y, 42, 38, '', { col: K.col, hi: 'w', lo: '0', disabled: busy, quiet: true })) {
        const a = chipSet('wof')[WOF.chip];
        if (casOver('wof', WOF.bets[K.id] || 0, a)) { /* told */ }
        else if (wofTotal() + a > cas().chips) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('deny'); }
        else { WOF.bets[K.id] = (WOF.bets[K.id] || 0) + a; Audio_.sfx('chip'); }
      }
    });
    WOF.chip = casChips(196, 130, WOF.chip, busy, 'wof');
    const t = wofTotal();
    if (cbtn('clear', 322, 130, 56, 16, 'CLEAR', { keys: ['KeyC'], disabled: busy || !t })) WOF.bets = {};
    if (cbtn('re', 196, 154, 56, 16, 'REPEAT', { keys: ['KeyR'], disabled: busy || !!t || !WOF.last })) {
      const L = WOF.last, sum = Object.values(L).reduce((a, b) => a + b, 0);
      if (sum > cas().chips) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('deny'); } else { WOF.bets = Object.assign({}, L); Audio_.sfx('chip'); }
    }
    const fr = wofFreeReady();
    if (cbtn('free', 256, 154, 62, 16, 'FREE SPIN', { keys: ['KeyF'], disabled: busy || !fr, col: 'h', lo: 'g' })) wofSpin(true);
    if (cbtn('spin', 196, 176, 182, 30, 'SPIN', { primary: true, keys: ['PadX'], disabled: busy || !t })) wofSpin(false);
    if (!busy) return;
    const s = WOF.spin, step = TAU / 54;
    s.t += dt;
    const u = Math.min(1, s.t / s.T), e = 1 - Math.pow(1 - u, 3);
    WOF.rot = s.r0 + (s.r1 - s.r0) * e;
    const tick = Math.floor(WOF.rot / step + 0.5);
    if (tick !== s.tick) { s.tick = tick; Audio_.sfx('tick'); }
    if (s.t >= s.T + 0.5) {
      WOF.spin = null;
      casSettle();
      WOF.res = s.seg; WOF.win = s.pay;
      if (s.free) { Audio_.sfx('cwin'); casBurst(96, 120, 10); toast('FREE SPIN: +' + s.pay + ' CHIPS'); }
      else if (s.pay) casWin(s.pay, s.total, 96, 120); else Audio_.sfx('rstop');
      WOF.bets = {};
    }
  },
  draw() {
    ctx.drawImage(casFelt('plum'), 0, 0);
    drawCasTop(this);
    const cx = 96, cy = 116, R = 64;
    // the stand behind the wheel
    rect(cx - 6, cy, 12, 90, '0'); rect(cx - 5, cy, 10, 90, 'O'); rect(cx - 5, cy, 3, 90, 'Y');
    ctx.drawImage(wofDisk(R)(WOF.rot), cx - R, cy - R);
    // the star and frog segments carry their picture
    for (let i = 0; i < 54; i++) {
      const K = WOF_KINDS[WOF_SEGS[i]];
      const a = WOF.rot + i * TAU / 54, r = R * 0.78, x = Math.round(cx + Math.sin(a) * r), y = Math.round(cy - Math.cos(a) * r);
      if (K.id === 'star') drawS(S('sus_0'), x - 2, y - 2);
      else if (K.id === 'frog') rect(x - 1, y - 1, 3, 3, 'g');
      else if (K.m >= 10) rect(x, y, 1, 1, 'w');
    }
    // the pointer, a gold flap at the top
    drawS(S('cz_pointer'), cx - 3, cy - R - 3);
    // what the pointer shows
    const seg = WOF.spin ? ((Math.round(-WOF.rot / (TAU / 54)) % 54) + 54) % 54 : WOF.res;
    if (seg >= 0) {
      const K = WOF_KINDS[WOF_SEGS[seg]];
      panel(cx - 30, 188, 60, 16);
      text(K.label, cx, 196, WOF.spin ? 'w' : 'Y', 1, 1);
    }
    drawBtns();
    // each bet spot: its picture, its odds, the chips on it
    WOF_KINDS.forEach((K, i) => {
      const x = 196 + (i % 4) * 46, y = 36 + Math.floor(i / 4) * 44;
      if (K.icon) drawS(S(K.icon), x + 21 - (S(K.icon).w >> 1), y + 4);
      text(K.label, x + 21, K.icon ? y + 18 : y + 12, 'w', 2, 1);
      text(K.n + '/54', x + 21, y + (K.icon ? 28 : 24), '0', 0, 1);
      const a = WOF.bets[K.id] || (WOF.spin && WOF.last && !WOF.spin.free ? WOF.last[K.id] : 0);
      if (a) drawChipAt(x + 36, y + 30, a, true);
    });
    const t = wofTotal();
    text('BET ' + t, 322, 160, t ? 'Y' : '3', 1);
    if (WOF.res >= 0 && !WOF.spin) text(WOF.win ? 'WIN ' + WOF.win : 'NO WIN', cx, 180, WOF.win ? 'Y' : '3', 2, 1);
    if (wofFreeReady() && !WOF.spin) text('A FREE SPIN IS WAITING!', 287, 26, 'h', 1, 1);
  },
};
