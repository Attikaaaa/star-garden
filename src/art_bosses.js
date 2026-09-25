'use strict';
// The alternate bosses (one per land) and the Night Moth. Round bodies are sculpted
// (shaded shapes with automatic outlines), details are stamped on by hand.
(function newBosses() {
  const o = { flip: true, flash: true, glow: true };
  // recolour the pixels of some columns (stripes) where they hold one of the given colours
  const stripe = (rows, xs, from, to) => rows.map(r => r.split('').map((c, x) => (xs.includes(x) && from.includes(c) ? to[from.indexOf(c)] : c)).join(''));

  // Frame sets and faces follow the Art Bible (bossFrames / bossEyes in art_chars.js).
  const MOUTH = { calm: '0..0\n.00.', squint: '.00.\n0ww0\n.00.', mad: '.00.\n0ww0\n.00.', daze: '.0.\n0q0\n.0.', dead: '.00.\n0..0' };
  // wings: idle flaps between up and down, move and tell hold them up, the attack beats down
  const wingUp = (f) => (f.m || f.tl || f.b) && !f.st && !f.d;

  // ---------- Queen Bee (Bloom Meadow) ----------
  const queen = (f) => {
    const up = wingUp(f), dy = f.st || f.d ? 2 : 0, hx = f.tl ? 1 : f.a ? -1 : 0;
    let r = sculpt(34, 28, [
      { e: [14, up ? 5 : 7 + dy, 7, 4], ramp: 'cCww', noLine: true },
      { e: [23, up ? 4 : 6 + dy, 7, 4], ramp: 'cCww', noLine: true },
      { e: [21 + hx, 17 + dy, 11, 8], ramp: 'oyYw' },
      { e: [9 + hx, 15 + dy, 7, 7], ramp: 'oyYw' },
    ]);
    r = stripe(r, [17, 18, 23, 24, 29].map(x => x + hx), 'oyYw', '1122');
    r = rim(r, { o: 'R' });
    r = bossEyes(r, 4 + hx, 11 + dy, 6, f.face);
    r = stamp(r, 3 + hx, 16 + dy, f.p ? 'r' : 'q');
    r = stamp(r, 14 + hx, 16 + dy, f.p ? 'r' : 'q');
    r = stamp(r, 7 + hx, 16 + dy, MOUTH[f.face]);
    // the crown (a Big Star bent to fit) tips over when she is angry
    r = stamp(r, 4 + hx + (f.p ? 1 : 0), 4 + dy + (f.st ? 2 : 0), f.d ? '.' : f.p ? `
      ..Y.Y.Y
      .YyYyY.
      0yyryy0
      .00000.` : `
      .Y.Y.Y.
      .YyYyY.
      0yyryy0
      .00000.`);
    // the stinger comes out to aim and thrusts on the attack
    return stamp(r, 31, 17 + dy, f.tl || f.a ? (f.p ? '0.\nr0\n0.' : '0.\no0\n0.') : '0.\n00\n..');
  };
  bossFrames('queen', queen, o);

  // ---------- Pearl Octopus (Shore) ----------
  const octo = (f) => {
    const k = f.b || f.m ? 1 : 0, sq = f.tl ? 1 : f.st || f.d ? -2 : 0, legs = [];
    for (let i = 0; i < 6; i++) {
      const up = f.a ? (i % 2) * 2 : ((i + k) % 2) * 2;
      legs.push({ r: [2 + i * 5, 16 + up - Math.min(0, sq), 6, 10 - up + Math.min(0, sq), 3], ramp: 'pPqq', hi: false });
    }
    let r = sculpt(34, 28, legs.concat([
      { e: [17, 11 - sq, 12 + sq, 10 + sq], ramp: 'pPqw', cut: 20 },
      { e: [17, 23, 3.5, 3.5], ramp: f.d ? 'dmll' : f.p ? 'yYYw' : 'lLww' },
    ]));
    r = rim(r, { p: '3' });
    r = bossEyes(r, 11, 9 - sq, 8, f.face);
    r = stamp(r, 9, 14 - sq, f.p ? 'rr' : 'qq');
    r = stamp(r, 23, 14 - sq, f.p ? 'rr' : 'qq');
    return stamp(r, 15, 15 - sq, f.a ? '.00.\n0110\n.00.' : MOUTH[f.face]);
  };
  bossFrames('octo', octo, o);

  // ---------- Crystal Moth (Crystal Cave) ----------
  const cmoth = (f) => {
    const up = wingUp(f), dy = f.st || f.d ? 2 : 0;
    let r = sculpt(36, 26, [
      { e: [9, up ? 7 : 10 + dy, 9, up ? 7 : 8], ramp: '2344' },
      { e: [27, up ? 7 : 10 + dy, 9, up ? 7 : 8], ramp: '2344' },
      { e: [10, 19, 6, 5], ramp: '1233' },
      { e: [26, 19, 6, 5], ramp: '1233' },
      { r: [15, 9, 6, 15, 3], ramp: 'bBcC' },
      { e: [18, 8 + dy, 6.5, 4.5], ramp: 'bBcC' },
    ]);
    r = rim(r, { 2: 'B', b: '2' });
    const gem = f.p ? 'P' : 'C', wy = up ? 6 : 8 + dy;
    r = stamp(r, 5, wy, gem + '..' + gem);
    r = stamp(r, 27, wy, gem + '..' + gem);
    r = stamp(r, 7, wy + 3, '.' + gem + gem + '.');
    r = stamp(r, 27, wy + 3, '.' + gem + gem + '.');
    r = bossEyes(r, 13, 6 + dy, 6, f.face);
    return stamp(r, 15, dy, f.d ? '.' : `
      3....3
      .3..3.
      ..33..`);
  };
  bossFrames('cmoth', cmoth, o);

  // ---------- The Night Moth (the Star Well) ----------
  const nmoth = (f) => {
    const up = wingUp(f), dy = f.st || f.d ? 2 : 0;
    let r = sculpt(44, 32, [
      { e: [11, up ? 9 : 12 + dy, 11, up ? 9 : 10], ramp: '1223' },
      { e: [33, up ? 9 : 12 + dy, 11, up ? 9 : 10], ramp: '1223' },
      { e: [12, 23, 8, 6], ramp: '1122' },
      { e: [32, 23, 8, 6], ramp: '1122' },
      { r: [18, 10, 8, 18, 4], ramp: '1234' },
      { e: [22, 10 + dy, 7, 5], ramp: '1234' },
    ]);
    r = rim(r, { 1: 'p' });
    // stars stolen from the sky, caught in its wings (they burn pink once it is angry)
    for (const [x, y] of [[6, 8], [12, 5], [9, 14], [15, 11], [31, 6], [37, 9], [34, 14], [29, 11], [10, 22], [34, 22], [14, 25], [30, 25]]) {
      r = stamp(r, x, y + (up ? -2 : y < 18 ? dy : 0), f.d ? '3' : y % 2 ? (f.p ? 'P' : 'Y') : 'w');
    }
    // glowing red eyes
    const red = (k) => BOSS_EYE[k].replace(/0w00/, '0Rr0').replace(/\n0000\n/, '\n0rr0\n');
    const two = f.face === 'mad' || f.face === 'squint';
    r = stamp(r, 16, 8 + dy, red(two ? f.face + 'L' : f.face));
    r = stamp(r, 24, 8 + dy, red(two ? f.face + 'R' : f.face));
    r = stamp(r, 20, 9 + dy, f.face === 'mad' || f.a ? '.00.\n0rr0\n.00.' : f.d ? '.00.\n0..0' : '0..0\n.00.');
    return stamp(r, 18, dy, f.d ? '.' : `
      4......4
      .4....4.
      ..4..4..
      ...44...`);
  };
  bossFrames('nmoth', nmoth, o);
})();

// The Star Well's rocks (dark stone with a star) and breakable star lanterns.
(function wellProps() {
  def('rock_well', stamp(sculpt(16, 16, [{ e: [8, 9, 7.5, 6.5], ramp: '1233' }]), 6, 6, '.Y.\nYwY\n.Y.'));
  def('brk_well', stamp(sculpt(16, 16, [
    { r: [4, 3, 8, 11, 3], ramp: '2344' }, { r: [6, 1, 4, 3, 1], ramp: '1233', hi: false },
  ]), 6, 7, '.Y.\nYwY\n.Y.\n...'));
})();

// Each boss has its own bullet family (ebullet colour = family name), small and big.
// Colour-blind mode already tells them apart by shape, so their cb names are aliases.
(function bossBullets() {
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  const B = {
    goo: [['.qw.', 'qqqP', 'qPPp', '.Pp.'], ['.qwqq.', 'qwqqqP', 'q0qq0P', 'qqqPPp', 'qPPPpp', '.Pppp.']],
    bubble: [['.wc.', 'wCCc', 'cCcB', '.cB.'], ['.cccc.', 'cwwCCc', 'cwCCCB', 'cCCCCB', 'cCCCBB', '.cBBB.']],
    shard: [['.w3.', '4432', '3321', '.21.'], ['..4w..', '.44w3.', '443332', '433221', '.3221.', '..21..']],
    honey: [['.Yw.', 'YyyO', 'yyOo', '.Oo.'], ['..Yw..', '.Ywyy.', 'YwyyyO', 'YyyyOO', 'yyyOOo', '.yOoo.']],
    ink: [['.32.', '3w21', '2211', '.11.'], ['.332.2', '3w221.', '322211', '222111', '.2111.', '..11..']],
    pearl: [['.wL.', 'wLLq', 'LLqq', '.qP.'], ['.wLLq.', 'wwLLqq', 'wLLLqq', 'LLLqqP', 'LLqqPP', '.qqPP.']],
    dust: [['.C..', 'C43.', '.332', '..2.'], ['..C...', '.C43..', 'C4433.', '.43322', '..322.', '...2..']],
    nstar: [['..q..', 'qqwPP', '.qPp.', '.P.p.'], ['...q...', '..qqP..', 'qqqwPPp', '.qqPPp.', '..qPp..', '.qp.pp.', '.p...p.']],
  };
  for (const k in B) {
    def('eb_' + k, pad(B[k][0])); def('ebb_' + k, pad(B[k][1]));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
})();
