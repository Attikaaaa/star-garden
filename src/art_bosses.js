'use strict';
// The alternate bosses (one per land) and the Night Moth. Round bodies are sculpted
// (shaded shapes with automatic outlines), details are stamped on by hand.
(function newBosses() {
  const o = { flip: true, flash: true, glow: true };
  // recolour the pixels of some columns (stripes) where they hold one of the given colours
  const stripe = (rows, xs, from, to) => rows.map(r => r.split('').map((c, x) => (xs.includes(x) && from.includes(c) ? to[from.indexOf(c)] : c)).join(''));

  // ---------- Queen Bee (Bloom Meadow) ----------
  const queen = (up) => {
    let r = sculpt(34, 28, [
      { e: [14, up ? 5 : 7, 7, 4], ramp: 'cCww', noLine: true },
      { e: [23, up ? 4 : 6, 7, 4], ramp: 'cCww', noLine: true },
      { e: [21, 17, 11, 8], ramp: 'oyYw' },
      { e: [9, 15, 7, 7], ramp: 'oyYw' },
    ]);
    r = stripe(r, [17, 18, 23, 24, 29], 'oyYw', '1122');
    r = stamp(r, 5, 13, `
      0w..0w
      00..00`);
    r = stamp(r, 6, 17, '.rr.');
    r = stamp(r, 4, 4, `
      .Y.Y.Y.
      .YyYyY.
      0yyryy0
      .00000.`);
    r = stamp(r, 31, 17, `
      0.
      o0
      0.`);
    return r;
  };
  def('queen_0', queen(false), o);
  def('queen_1', queen(true), o);

  // ---------- Pearl Octopus (Sunny Shore) ----------
  const octo = (k) => {
    const legs = [];
    for (let i = 0; i < 6; i++) legs.push({ r: [2 + i * 5, 16 + ((i + k) % 2) * 2, 6, 10 - ((i + k) % 2) * 2, 3], ramp: 'pPqq', hi: false });
    let r = sculpt(34, 28, legs.concat([
      { e: [17, 11, 12, 10], ramp: 'pPqw', cut: 20 },
      { e: [17, 23, 3.5, 3.5], ramp: 'lLww' },
    ]));
    r = stamp(r, 10, 9, `
      0ww0...0ww0
      0w00...0w00
      .00.....00.`);
    r = stamp(r, 14, 16, '.0000.'.slice(0, 6));
    return r;
  };
  def('octo_0', octo(0), o);
  def('octo_1', octo(1), o);

  // ---------- Crystal Moth (Crystal Cave) ----------
  const cmoth = (up) => {
    let r = sculpt(36, 26, [
      { e: [9, up ? 7 : 10, 9, up ? 7 : 8], ramp: '2344' },
      { e: [27, up ? 7 : 10, 9, up ? 7 : 8], ramp: '2344' },
      { e: [10, 19, 6, 5], ramp: '1233' },
      { e: [26, 19, 6, 5], ramp: '1233' },
      { r: [15, 6, 6, 17, 3], ramp: 'bBcC' },
    ]);
    r = stamp(r, 5, up ? 6 : 8, 'C..C');
    r = stamp(r, 27, up ? 6 : 8, 'C..C');
    r = stamp(r, 7, up ? 9 : 11, '.CC.');
    r = stamp(r, 27, up ? 9 : 11, '.CC.');
    r = stamp(r, 16, 8, `
      0..0
      w..w`);
    r = stamp(r, 15, 1, `
      3....3
      .3..3.
      ..33..`);
    return r;
  };
  def('cmoth_0', cmoth(false), o);
  def('cmoth_1', cmoth(true), o);

  // ---------- The Night Moth (the Star Well) ----------
  const nmoth = (up) => {
    let r = sculpt(44, 32, [
      { e: [11, up ? 9 : 12, 11, up ? 9 : 10], ramp: '1223' },
      { e: [33, up ? 9 : 12, 11, up ? 9 : 10], ramp: '1223' },
      { e: [12, 23, 8, 6], ramp: '1122' },
      { e: [32, 23, 8, 6], ramp: '1122' },
      { r: [18, 7, 8, 21, 4], ramp: '1234' },
    ]);
    // stars stolen from the sky, caught in its wings
    for (const [x, y] of [[6, 8], [12, 5], [9, 14], [15, 11], [31, 6], [37, 9], [34, 14], [29, 11], [10, 22], [34, 22], [14, 25], [30, 25]]) r = stamp(r, x, y + (up ? -2 : 0), y % 2 ? 'Y' : 'w');
    r = stamp(r, 19, 10, `
      rr..rr
      Rr..Rr`);
    r = stamp(r, 17, 1, `
      4......4
      .4....4.
      ..4..4..
      ...44...`);
    return r;
  };
  def('nmoth_0', nmoth(false), o);
  def('nmoth_1', nmoth(true), o);
})();

// The Star Well's rocks (dark stone with a star) and breakable star lanterns.
(function wellProps() {
  def('rock_well', stamp(sculpt(16, 16, [{ e: [8, 9, 7.5, 6.5], ramp: '1233' }]), 6, 6, '.Y.\nYwY\n.Y.'));
  def('brk_well', stamp(sculpt(16, 16, [
    { r: [4, 3, 8, 11, 3], ramp: '2344' }, { r: [6, 1, 4, 3, 1], ramp: '1233', hi: false },
  ]), 6, 7, '.Y.\nYwY\n.Y.\n...'));
})();
