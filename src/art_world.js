'use strict';
// World art: land tiles (themed via slot legends), doors, obstacles, pickups, shots.

// ---------- Themed tiles (16x16). Slots: see THEMES in palette.js ----------
defT('floor_0', `
  2222222222222222
  2222222222222222
  2222222222222222
  2222212122222222
  2222221222222222
  2222222222222222
  2222222222222232
  2222222222222222
  2222222222222222
  2232222222222222
  2222222222212122
  2222222222221222
  2222222222222222
  2222222222222222
  2222223222222222
  2222222222222222`);
defT('floor_1', `
  2222222222222222
  2222222222223222
  2222222222222222
  2222222222222222
  2212122222222222
  2221222222222222
  2222222222222222
  2222222222222222
  2222222223222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222212122222
  2222232221222222
  2222222222222222
  2222222222222222`);
defT('floor_2', `
  2222222222222222
  2222222222222222
  2222422222222222
  2224542222222222
  2222422222222222
  2222122222226222
  2222222222265622
  2222222222226222
  2222222222221222
  2222222222222222
  2222222222222222
  2222222422222222
  2222224542222222
  2222222422222222
  2222222122222222
  2222222222222222`);
defT('floor_3', `
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222223322222
  2222222231132222
  2222222221122222
  2222222222222222
  2222222222222222
  2233222222222222
  2311322222222222
  2211222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222`);
defT('cap', `
  8889999888888887
  8899999988888877
  8888888888888877
  7888888878888877
  7788888777888777
  7777777777777777
  8888888788999988
  8888887789999998
  8888887788888888
  8888877778888888
  8778777777788877
  7777777777777777
  9998888888889999
  9999888888899999
  8888888888888888
  8888888778888888`);
defT('face_0', `
  0000000000000000
  cccccccccccccccc
  bcbbbbbabcbbbbba
  bbbbbbbabbbbbbba
  bbbbbbbabbbbbbba
  aaaaaaaaaaaaaaaa
  bbbabcbbbbbbbabc
  bbbabbbbbbbbbabb
  bbbabbbbbbbbbabb
  aaaaaaaaaaaaaaaa
  bcbbbbbabcbbbbba
  bbbbbbbabbbbbbba
  bbbbbbbabbbbbbba
  aaaaaaaaaaaaaaaa
  aaaaaaaaaaaaaaaa
  0000000000000000`);
defT('face_1', `
  0000000000000000
  cciicccccccccccc
  bijibbbabcbbbbba
  bbjibbbabbbbbbba
  bbibbbbabbbbbbba
  aajaaaaaaaaaaaaa
  bbbibcbbbbbbbabc
  bbbjbbbbbbbbbabb
  bbbabbbbbbbbbabb
  aaaaaaaaaaaaaaaa
  bcbbbbbabcbbbbba
  bbbbbbbabbbbbbba
  bbbbbbbabbbbbbba
  aaaaaaaaaaaaaaaa
  aaaaaaaaaaaaaaaa
  0000000000000000`);
defT('pit', `
  ffffffffffffffff
  ffffffffffffffff
  fffffgggffffffff
  ffffggffggffffff
  ffffffffffffffff
  ffffffffffffffff
  fffffffffffhffff
  ffffffffffffffff
  ffffffffffffffff
  ffffffffffgggfff
  fhfffffffggffggf
  ffffffffffffffff
  ffffffffffffffff
  ffggffffffffffff
  fgffgfffffffffff
  ffffffffffffffff`);

// ---------- Doors (stone / boss / treasure frames) ----------
(function doors() {
  const RAMPS = { n: 'dmlL', b: 'prRq', t: 'oOyY', c: '1234' };
  const arch = (ramp) => {
    let r = sculpt(32, 24, [{ r: [3, 0, 26, 26, 11], ramp }]);
    r = r.map((row, y) => row.split('').map((c, x) => {
      const inX = x >= 9 && x <= 22;
      const top = y >= 6 || (y >= 4 && x >= 10 && x <= 21) || (y >= 3 && x >= 12 && x <= 19);
      return inX && top ? '.' : c;
    }).join(''));
    // outline the opening
    return r.map((row, y) => row.split('').map((c, x) => {
      if (c === '.') return c;
      const open = (X, Y) => Y >= 0 && Y < 24 && X >= 0 && X < 32 && r[Y][X] === '.' && X >= 9 && X <= 22 && Y >= 3;
      return open(x - 1, y) || open(x + 1, y) || open(x, y + 1) ? '0' : c;
    }).join(''));
  };
  const openFill = (r) => r.map((row, y) => row.split('').map((c, x) => {
    if (c !== '.' || x < 9 || x > 22 || y < 3) return c;
    if (y < 10) return '0';
    if (y < 16) return (x + y) % 2 ? '1' : '0';
    return y < 21 ? '1' : '2';
  }).join(''));
  const closedFill = (r) => r.map((row, y) => row.split('').map((c, x) => {
    if (c !== '.' || x < 9 || x > 22 || y < 3) return c;
    if (x === 15 || x === 16) return '0';
    if (y === 23) return '0';
    if (x === 9 || x === 22) return 'n';
    if ((x === 12 || x === 19) && y > 5) return 'n';
    return y < 6 ? 'N' : x === 10 || x === 17 ? 'O' : 'N';
  }).join(''));
  for (const k in RAMPS) {
    const a = arch(RAMPS[k]);
    def('door_t_' + k + '_open', openFill(a));
    def('door_t_' + k + '_shut', stamp(closedFill(a), 13, 12, '.0000.\n0yYYy0\n0y00y0\n.0000.'));
    // half-open: the two leaves swing back toward the frame
    const op = openFill(a), cl = closedFill(a);
    def('door_t_' + k + '_mid', cl.map((row, y) => row.split('').map((c, x) =>
      y < 3 || x < 9 || x > 22 || a[y][x] !== '.' ? c : x >= 13 && x <= 18 ? op[y][x] : x === 12 || x === 19 ? '0' : c).join('')));
  }
  // Side door (left wall; mirrored for right). 16x32 gap in the wall cap.
  // st: 0 open, 1 half (gate slid up), 2 shut
  const side = (ramp, st) => {
    const shut = st > 0;
    let r = sculpt(16, 32, [{ r: [0, 0, 16, 8, 3], ramp }, { r: [0, 24, 16, 8, 3], ramp }]);
    return r.map((row, y) => row.split('').map((c, x) => {
      if (y < 8 || y >= 24) return c;
      const top = st === 2 ? 23 : 15;
      if (shut && x >= 9 && x <= 12 && y <= top) return x === 9 || x === 12 || y === 8 || y === top || y % 5 === 0 ? '0' : x === 10 ? 'O' : 'N';
      return x < 5 ? '0' : x < 10 ? ((x + y) % 2 ? '1' : '0') : x < 14 ? '1' : '2';
    }).join(''));
  };
  const bottom = (ramp, st) => {
    const shut = st > 0;
    let r = sculpt(32, 16, [{ r: [0, 0, 8, 16, 3], ramp }, { r: [24, 0, 8, 16, 3], ramp }]);
    return r.map((row, y) => row.split('').map((c, x) => {
      if (x < 8 || x >= 24) return c;
      const end = st === 2 ? 23 : 15;
      if (shut && y >= 4 && y <= 7 && x <= end) return y === 4 || y === 7 || x === 8 || x === end || x % 5 === 0 ? '0' : y === 5 ? 'O' : 'N';
      return y > 11 ? '0' : y > 6 ? ((x + y) % 2 ? '1' : '0') : y > 2 ? '1' : '2';
    }).join(''));
  };
  for (const k in RAMPS) {
    ['open', 'mid', 'shut'].forEach((n, st) => {
      def('door_s_' + k + '_' + n, side(RAMPS[k], st), { flip: true });
      def('door_b_' + k + '_' + n, bottom(RAMPS[k], st));
    });
  }
})();

// ---------- Obstacles (16x16, fill their tile) ----------
(function obstacles() {
  const rock = (ramp) => sculpt(16, 16, [{ e: [8, 9, 7.5, 6.5], ramp }]);
  def('rock_meadow', stamp(rock('dmlL'), 9, 12, '.h.\nGhG'));
  def('rock_beach', stamp(rock('dmlL'), 3, 10, '.o.\nooo\n.o.'));
  def('rock_crystal', `
    ......00........
    .....0CC0.......
    .....0Ccb0..0...
    ..0..0Ccb0.0C0..
    .0C0.0Ccb0.0cb0.
    .0Cb00Ccbb00cb0.
    .0cb0Cccbb0Ccb0.
    00cb0Cccbb0ccbb0
    0Ccbb0Ccbb0ccb0.
    0ccbb0ccbb0cbb0.
    .0cbb0ccbb0cb00.
    .0cbbb0cb00bb0..
    ..0bbbb00bbbb0..
    ..00bbbbbbbb00..
    ....00000000....
    ................`);
  def('brk_meadow', stamp(sculpt(16, 16, [
    { e: [5, 10, 5, 5], ramp: 'gGhH' }, { e: [11, 10, 5, 5], ramp: 'gGhH' }, { e: [8, 7, 5.5, 5.5], ramp: 'gGhH' },
  ]), 4, 5, 'P...\n....\n...P'));
  def('brk_beach', `
    ................
    ..........000...
    ..........0y0...
    .........0y0....
    ...000000y000...
    ..0RaAAAAyAaR0..
    ..0RRRRRRRRRr0..
    ...0RwRRRRRr0...
    ...0RwRRRRRr0...
    ...0yYyyyyyo0...
    ...0RRRRRRrr0...
    ....0RRRRRr0....
    ....0RRRRrr0....
    ....0rrrrrr0....
    .....000000.....
    ................`);
  def('brk_crystal', stamp(sculpt(16, 16, [
    { e: [8, 10, 6.5, 6], ramp: '1234' }, { r: [5, 1, 6, 5, 1], ramp: '1234', hi: false },
  ]), 6, 9, '.c.\ncCc\n.c.'));
})();

// ---------- Pickups, shots, props ----------
def('coin_0', `
  ..0000..
  .0yYYy0.
  0yYyyyo0
  0yYyyyo0
  0yYyyyo0
  0yyyyoo0
  .0oooo0.
  ..0000..`);
def('coin_1', `
  ..0000..
  ..0yyo0.
  .0yYyo0.
  .0yYyo0.
  .0yYyo0.
  .0yyoo0.
  ..0oo0..
  ..0000..`);
def('coin_2', `
  ...00...
  ...0y0..
  ...0Y0..
  ...0y0..
  ...0y0..
  ...0o0..
  ...0o0..
  ...00...`);
def('gem', `
  ..0000..
  .0CwcB0.
  0CwccBb0
  0cccBBb0
  .0cBBb0.
  ..0Bb0..
  ...00...`);
def('heart', `
  .00...00.
  0RwR0rRr0
  0RRrrrrr0
  0rrrrrrp0
  .0rrrrp0.
  ..0rrp0..
  ...0p0...
  ....0....`, { flash: true });
def('heart_half', `
  .00......
  0RwR0....
  0RRr0....
  0rrr0....
  .0rr0....
  ..0r0....
  ...00....
  .........`, { flash: true });
def('pedestal', stamp(sculpt(16, 12, [
  { r: [3, 4, 10, 8, 2], ramp: 'dmlL', hi: false }, { e: [8, 3.5, 7.5, 3.5], ramp: 'dmlL', hi: false },
]), 4, 2, '.llll.\nlLLLLl'));
def('rug', grid(176, 28).fill((x, y) => {
  if (x < 3 || x > 172) return y > 1 && y < 26 && y % 2 === 0 ? (x === 1 || x === 174 ? 'Y' : x === 0 || x === 175 ? null : 'y') : null;
  if (y === 0 || y === 27 || x === 3 || x === 172) return '0';
  if (y === 1 || y === 26 || x === 4 || x === 171) return 'o';
  if (y === 2 || y === 25 || x === 5 || x === 170) return 'y';
  if (y === 3 || y === 24 || x === 6 || x === 169) return 'o';
  const dx = (x - 6) % 16 - 8, dy = y - 13.5;
  return Math.abs(dx) + Math.abs(dy) < 6 ? (Math.abs(dx) + Math.abs(dy) < 3 ? 'y' : 'P') : 'p';
}).rows());

def('shot_0', `
  ...0...
  ..0Y0..
  00YwY00
  0YwwwY0
  00YwY00
  ..0Y0..
  ...0...`);
def('shoth_0', `
  ...0...
  ..0Y0..
  00YwY00
  0YwwwY0
  00YwY00
  ..0Y0..
  ...0...`, { legend: { Y: 'H' } });
def('shotc_0', `
  ...0...
  ..0Y0..
  00YwY00
  0YwwwY0
  00YwY00
  ..0Y0..
  ...0...`, { legend: { Y: 'C' } });
def('shotp_0', `
  ...0...
  ..0Y0..
  00YwY00
  0YwwwY0
  00YwY00
  ..0Y0..
  ...0...`, { legend: { Y: 'q' } });
def('shot_1', `
  .0...0.
  0Y0.0Y0
  .0YwY0.
  ..www..
  .0YwY0.
  0Y0.0Y0
  .0...0.`);
def('shoth_1', `
  .0...0.
  0Y0.0Y0
  .0YwY0.
  ..www..
  .0YwY0.
  0Y0.0Y0
  .0...0.`, { legend: { Y: 'H' } });
def('shotc_1', `
  .0...0.
  0Y0.0Y0
  .0YwY0.
  ..www..
  .0YwY0.
  0Y0.0Y0
  .0...0.`, { legend: { Y: 'C' } });
def('shotp_1', `
  .0...0.
  0Y0.0Y0
  .0YwY0.
  ..www..
  .0YwY0.
  0Y0.0Y0
  .0...0.`, { legend: { Y: 'q' } });
def('shotbig_0', `
  ....0....
  ...0Y0...
  ...0Y0...
  000YwY000
  0YYwwwYY0
  000YwY000
  ...0Y0...
  ...0Y0...
  ....0....`);
def('shotbigh_0', `
  ....0....
  ...0Y0...
  ...0Y0...
  000YwY000
  0YYwwwYY0
  000YwY000
  ...0Y0...
  ...0Y0...
  ....0....`, { legend: { Y: 'H' } });
def('shotbigc_0', `
  ....0....
  ...0Y0...
  ...0Y0...
  000YwY000
  0YYwwwYY0
  000YwY000
  ...0Y0...
  ...0Y0...
  ....0....`, { legend: { Y: 'C' } });
def('shotbigp_0', `
  ....0....
  ...0Y0...
  ...0Y0...
  000YwY000
  0YYwwwYY0
  000YwY000
  ...0Y0...
  ...0Y0...
  ....0....`, { legend: { Y: 'q' } });
def('shotbig_1', `
  0.......0
  .0Y...Y0.
  ..0Y.Y0..
  ...YwY...
  ...www...
  ...YwY...
  ..0Y.Y0..
  .0Y...Y0.
  0.......0`);
def('shotbigh_1', `
  0.......0
  .0Y...Y0.
  ..0Y.Y0..
  ...YwY...
  ...www...
  ...YwY...
  ..0Y.Y0..
  .0Y...Y0.
  0.......0`, { legend: { Y: 'H' } });
def('shotbigc_1', `
  0.......0
  .0Y...Y0.
  ..0Y.Y0..
  ...YwY...
  ...www...
  ...YwY...
  ..0Y.Y0..
  .0Y...Y0.
  0.......0`, { legend: { Y: 'C' } });
def('shotbigp_1', `
  0.......0
  .0Y...Y0.
  ..0Y.Y0..
  ...YwY...
  ...www...
  ...YwY...
  ..0Y.Y0..
  .0Y...Y0.
  0.......0`, { legend: { Y: 'q' } });
def('moon', `
  ..000..
  .0YY00.
  0YY0...
  0Yy0...
  0yy0...
  .0yy00.
  ..000..`);
for (const [k, r] of [['pink', 'pPqw'], ['cyan', 'bcCw'], ['orange', 'oOYw'], ['purple', '134w']]) {
  def('eb_' + k, `
    .0000.
    0${r[2]}${r[3]}${r[2]}${r[1]}0
    0${r[3]}${r[3]}${r[2]}${r[1]}0
    0${r[2]}${r[2]}${r[1]}${r[0]}0
    0${r[1]}${r[1]}${r[0]}${r[0]}0
    .0000.`);
  def('ebb_' + k, `
    ..0000..
    .0${r[2]}${r[3]}${r[2]}${r[2]}0.
    0${r[2]}${r[3]}${r[3]}${r[2]}${r[2]}${r[1]}0
    0${r[3]}${r[3]}${r[2]}${r[2]}${r[1]}${r[1]}0
    0${r[2]}${r[2]}${r[2]}${r[1]}${r[1]}${r[0]}0
    0${r[2]}${r[1]}${r[1]}${r[1]}${r[0]}${r[0]}0
    .0${r[1]}${r[0]}${r[0]}${r[0]}0.
    ..0000..`);
}
// Puff of smoke / sparkle / hit spark
def('poof_0', `
  ..........
  ..........
  ...0000...
  ..0wwwL0..
  ..0wwLl0..
  ..0wLll0..
  ..0Llll0..
  ...0000...
  ..........
  ..........`);
def('poof_1', `
  ...000....
  ..0wwL0000
  .0wwLl0wL0
  .0wLll0Ll0
  ..0000l00.
  .0wL00000.
  0wwLl0wL0.
  0wLll0Ll0.
  .0ll0.000.
  ..00......`);
def('poof_2', `
  .00....00.
  0wL0..0wL0
  0Ll0..0Ll0
  .00....00.
  ..........
  ..........
  .00....00.
  0wL0..0Ll0
  .00....00.
  ..........`);
def('sparkle_0', '.Y.\nYwY\n.Y.');
def('sparkle_1', 'Y.Y\n.w.\nY.Y');
def('sparkle_c', '.C.\nCwC\n.C.');
// Stardrop: the Star Rain event's pickup (a fallen shooting star)
def('stardrop', autoOutline(parseArt('stardrop', `
  ...........
  .....w.....
  ....wYy....
  .wwwYYyyyO.
  ..wYYYYyO..
  ...YYyyO...
  ..Yyy.yyO..
  ..yO...yO..
  ...........`)));

// Star gate that appears after a boss: a swirling flat disc on the floor.
for (let f = 0; f < 3; f++) {
  def('portal_' + f, autoOutline(grid(32, 20).fill((x, y) => {
    const nx = (x + 0.5 - 16) / 14.5, ny = (y + 0.5 - 10) / 8.5, d = Math.hypot(nx, ny);
    if (d > 1) return null;
    if (d < 0.22) return 'w';
    const a = Math.atan2(ny, nx) / (Math.PI * 2);
    const band = ((Math.floor(a * 6 + d * 3 - f * 2 / 3) % 4) + 4) % 4;
    return d > 0.86 ? 'Y' : '3PqC'[band];
  }).rows()));
}

// Ambient critters and bubbles (see fx.js)
def('bfly_0', autoOutline(parseArt('bfly', `
  .........
  .Yy...Yy.
  .yyy1yyy.
  ..yo1oy..
  ...o.o...
  .........`)), { flip: true });
def('bfly_1', autoOutline(parseArt('bfly', `
  .........
  .........
  ..Yy.Yy..
  ..yy1yy..
  ...o1o...
  .........`)), { flip: true });
def('bubble', `
  .CC.
  Cw.C
  C..C
  .CC.`);

// Treasure chest (closed / open)
def('chest_0', `
  ..000000000000..
  .0AAOOOOOOOOON0.
  .0OOOOOOOOOONn0.
  0yyyyyyyyyyyyyo0
  0NNNNN0yy0NNNNn0
  0000000yY0000000
  0yNNNN0yo0NNNNy0
  0yNNNNN00NNNNNy0
  0ynnnnnnnnnnnny0
  0yNNNNNNNNNNNNy0
  0yNNNNNNNNNNNNy0
  0onnnnnnnnnnnno0
  .00000000000000.`);
def('chest_1', `
  ..000000000000..
  .0nNNNNNNNNNNn0.
  .0nNNNNNNNNNNn0.
  0yyyyyyyyyyyyyo0
  0yYwYyYYwYyYwYy0
  0oyYyoyYyoyYyoo0
  0nnnnnnnnnnnnnn0
  0yNNNNNNNNNNNNy0
  0ynnnnnnnnnnnny0
  0yNNNNNNNNNNNNy0
  0yNNNNNNNNNNNNy0
  0onnnnnnnnnnnno0
  .00000000000000.`);

// ---------- Potions and the turret kit (belt items) ----------
const POTION_ART = autoOutline(parseArt('potion', `
  ...........
  ....NNN....
  ....nNn....
  ....lLl....
  ....lLl....
  ...lLLLl...
  ..lXXXXXl..
  ..lXwXXxl..
  ..lXXXXxl..
  ..lXXXxxl..
  ...lxxxl...
  ....lll....
  ...........`));
const POTION_COL = { regen: { X: 'P', x: 'p' }, haste: { X: 'y', x: 'o' }, power: { X: 'R', x: 'r' }, guard: { X: 'c', x: 'B' } };
for (const k in POTION_COL) def('pot_' + k, POTION_ART, { legend: POTION_COL[k] });
def('pot_turret', autoOutline(parseArt('kit', `
  ...........
  .....Y.....
  ....YwY....
  ...YYYYy...
  ....Yyo....
  ...Yy.yo...
  ...........
  ...3344....
  ..3322221..
  ..3222211..
  ..mmmmmmd..
  ..mllmmdd..
  ...........`)));

// ---------- Star turret (placed by the hero) ----------
(function turret() {
  for (let f = 0; f < 2; f++) {
    let r = sculpt(16, 20, [{ r: [3, 11, 10, 9, 2], ramp: 'dmlL', hi: false }, { e: [8, 8, 5.5, 5.5], ramp: '1234' }]);
    r = stamp(r, 6, 6, f ? '.w.\nwYw\n.w.' : '.Y.\nYwY\n.Y.');
    r = stamp(r, 4, 15, 'dddddddd');
    def('turret_' + f, r, { flash: true });
  }
})();

// ---------- Projectiles of the other wands ----------
for (let f = 0; f < 2; f++) {
  def('shotcomet_' + f, stamp(sculpt(9, 9, [{ e: [4.5, 4.5, 4.4, 4.4], ramp: 'oOyY' }]), f ? 2 : 3, f ? 2 : 3, f ? 'ww\nw.' : 'w'));
}
def('shotspark_0', autoOutline(parseArt('spark', '.......\n...Y...\n..YwY..\n...Y...\n.......')));
def('shotspark_1', autoOutline(parseArt('spark', '.......\n..Y.Y..\n...w...\n..Y.Y..\n.......')));
def('shotbubble_0', `
  ..000..
  .0CwC0.
  0CwCCc0
  0CCCCc0
  0CCCcc0
  .0ccc0.
  ..000..`);
def('shotbubble_1', `
  .......
  ..000..
  .0CwC0.
  0CwCCc0
  0CCCcc0
  .0ccc0.
  ..000..`);
// Moon boomerang, four spin poses from three drawings (the side pose is mirrored).
def('shotboom_d', autoOutline(parseArt('boom', `
  .........
  .YY...YY.
  .Yyy.yyo.
  ..yyyyo..
  ...yoo...
  .........`)));
def('shotboom_u', autoOutline(parseArt('boom', `
  .........
  ...YYy...
  ..Yyyyo..
  .Yyy.yoo.
  .yo...oo.
  .........`)));
def('shotboom_s', autoOutline(parseArt('boom', `
  .......
  .YY....
  .Yyy...
  ..yyy..
  ..yyo..
  .yyo...
  .yo....
  .......`)), { flip: true });
