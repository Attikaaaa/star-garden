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

  // ---------- Mole Mayor (Bloom Meadow) ----------
  // A plump mole in a little top hat with huge digging claws. In phase 3 the hat is gone
  // (the 'mayor3' set) and he sweats.
  const HAT = `
    ..000000..
    ..0XXxx0..
    ..0XXxx0..
    ..0yyyo0..
    .00XXxx00.
    0XXXxxxxx0
    .00000000.`;
  const mayor = (f, bare) => {
    const dy = f.st || f.d ? 3 : f.tl ? 1 : 0, px = f.a ? 1 : 0;
    const py = 21 + dy + (f.tl ? -6 : f.a ? 1 : 0);
    let r = sculpt(36, 32, [
      { e: [18, 20 + dy / 2, 12.5, 11 - dy / 2], ramp: 'nNNa' },
      { e: [18, 25 + dy / 2, 7.5, 5.5], ramp: 'eaaA', hi: false, noLine: true },
      { e: [5 - px, py + (f.m ? -2 : 0), 4.5, 4.5], ramp: 'pPPq' },
      { e: [31 + px, py + (f.m ? 2 : 0), 4.5, 4.5], ramp: 'pPPq' },
    ]);
    r = rim(r, { n: 'p' });
    // claws: three pale hooks on each paw
    for (const [x, y] of [[1 - px, py + (f.m ? 2 : 4)], [28 + px, py + (f.m ? 6 : 4)]]) r = stamp(r, x, y, 'L0L0L\nL0L0L\n0.0.0');
    const ey = 14 + dy;
    r = bossEyes(r, 11, ey, 10, f.face);
    // the pink nose, and a wide mouth under it
    r = stamp(r, 15, ey + 4, '.0000.\n0qPPP0\n0PPPp0\n.0pp0.');
    r = stamp(r, 16, ey + 8, f.a || f.face === 'mad' ? '0000\n0ww0\n.00.' : MOUTH[f.face]);
    r = stamp(r, 9, ey + 5, f.p ? 'rr' : 'qq');
    r = stamp(r, 25, ey + 5, f.p ? 'rr' : 'qq');
    // the hat: straight, tipped when angry, lying on the ground once he is beaten
    if (f.d) return stamp(r, 26, 25, HAT);
    if (bare) return f.st ? r : stamp(stamp(r, 11, ey - 3, 'C\nc'), 25, ey - 2, 'C\nc');
    return stamp(r, f.p ? 14 : 13, 1 + dy - (f.tl ? 1 : 0), HAT);
  };
  bossFrames('mayor', (f) => mayor(f), o);
  bossFrames('mayor3', (f) => mayor(f, true), o);
  // under the ground: a travelling mound, the hat (or the bare nose) poking out
  const mound = (hat) => {
    let r = sculpt(36, 17, [{ e: [18, 16, 16, 9], ramp: 'nNNa', cut: 15 }]);
    for (const [x, y] of [[8, 11], [14, 13], [22, 12], [27, 10], [11, 8]]) r = stamp(r, x, y, 'nn');
    return stamp(r, hat ? 13 : 15, hat ? 1 : 5, hat ? HAT : '.0000.\n0qPPP0\n0PPPp0\n.0000.');
  };
  def('mayor_mound', mound(true), o);
  def('mayor3_mound', mound(false), o);
  // the molehills he raises in phase 2 (they lob clods); _1 is the moment before a throw
  const hill = (up) => stamp(stamp(sculpt(18, 14, [{ e: [9, 13, 8.5, 9], ramp: 'nNNa', cut: 12 }]), 6, 5, up ? '.0000.\n0nNNn0\n0NNnn0\n.0000.' : '.0000.\n000000\n.0000.'), 2, 8, 'h..........G');
  def('mhill_0', hill(false), { flash: true });
  def('mhill_1', hill(true), { flash: true });

  // ---------- Tide Turtle (Sunny Shore) ----------
  // A huge sea turtle seen from the front: a coral shell with a pearl star on top, an aqua
  // head and flippers. Dazed, she lies on her back and shows the star on her belly.
  const PEARL = '..000..\n.0LwL0.\n0LwYwl0\n0LYYYl0\n0lwYll0\n.0lll0.\n..000..';
  // the shell: a rim band, the dome, dark seams between the plates, the pearl in the middle
  const shell = (x, y, k, p) => {
    return (g) => {
      for (const [sx, sy, t] of [[x - 12 + k, y - 1, 'n\nn\nn'], [x + 11 + k, y - 1, 'n\nn\nn'], [x - 7 + k, y - 6, 'nn'], [x + 6 + k, y - 6, 'nn'], [x - 7 + k, y + 4, 'nnn'], [x + 5 + k, y + 4, 'nnn']]) g = stamp(g, sx, sy, t);
      return stamp(g, x - 3 + k, y - 4, p ? PEARL.replace(/Y/g, 'P').replace(/w/g, 'q') : PEARL);
    };
  };
  const turtle = (f) => {
    if (f.st) {
      // on her back: the pale belly up, flippers waving, the pearl star showing underneath
      let r = sculpt(40, 32, [
        { e: [20, 22, 19, 8], ramp: 'nroR', cut: 27 },
        { e: [20, 19, 15, 7], ramp: 'eaAA' },
        { e: [4, 13, 3.5, 5], ramp: 'tTTC' }, { e: [36, 13, 3.5, 5], ramp: 'tTTC' },
        { e: [20, 27, 6, 4], ramp: 'tTTC' },
      ]);
      r = rim(r, { a: 'e', A: 'a', T: 't' });
      r = stamp(r, 9, 19, 'e.............e\n.eeeeeeeeeeeee.');
      r = stamp(r, 17, 13, PEARL);
      return bossEyes(r, 15, 25, 7, 'daze');
    }
    const dy = f.d ? 3 : 0, hy = f.tl ? -2 : f.a ? 1 : 0, fl = f.b || f.m ? 1 : 0;
    const sh = shell(20, 11 + dy, 0, f.p);
    let r = sculpt(40, 32, [
      { e: [5, 21 - fl * 2 + dy, 5, 3.5], ramp: 'tTTC' },
      { e: [35, 21 + fl * 2 - (f.m ? 3 : 0) + dy, 5, 3.5], ramp: 'tTTC' },
      { e: [20, 24 + hy + dy, 8, 7], ramp: 'tTTC' },
      { e: [20, 12 + dy, 19, 10], ramp: 'nroR', cut: 20 + dy }, { e: [20, 11 + dy, 15.5, 8.5], ramp: 'roRO' },
    ]);
    r = rim(r, { R: 'r', O: 'R', T: 't' });
    r = sh(r);
    const ey = 22 + hy + dy;
    r = bossEyes(r, 14, ey, 8, f.face);
    r = stamp(r, 12, ey + 5, f.p ? 'rr' : 'qq');
    r = stamp(r, 26, ey + 5, f.p ? 'rr' : 'qq');
    return stamp(r, 18, ey + 5, f.a ? '.00.\n0tt0\n.00.' : MOUTH[f.face]);
  };
  bossFrames('turtle', turtle, o);
  // tucked into her shell for the spin: the plates slide past to show it rolling
  for (const k of [0, 1]) {
    let r = sculpt(40, 32, [{ e: [20, 19, 19, 10], ramp: 'nroR', cut: 28 }, { e: [20, 18, 15.5, 8.5], ramp: 'roRO' }]);
    def('turtle_shell_' + k, shell(20, 18, k * 3 - 1)(rim(r, { R: 'r', O: 'R' })), o);
  }
  // the tide's tell: arrows along the wall the wave comes from
  def('tide_arrow', ['00.....', '0w00...', '0wCC00.', '0CCCTT0', '0CTT00.', '0T00...', '00.....'], { flip: true });

  // ---------- Geode Spider (Crystal Cave) ----------
  // A dark-purple spider with crystal legs and six eyes, its back a broken geode. In phase 3
  // (the 'geode3' set) the geode has cracked wide open and glows.
  // legs per side, back to front: [hip, knee, tip]; walk frames lift every other leg
  const LEGS = [[[13, 10], [5, 3], [1, 10]], [[12, 14], [3, 10], [0, 19]], [[12, 19], [4, 18], [1, 27]], [[14, 23], [8, 25], [6, 31]]];
  const legs = (f) => {
    const g = grid(40, 32);
    LEGS.forEach(([h, k, t], i) => {
      for (const s of [0, 1]) {
        const up = f.leg % 2 === 0 && (i + s + f.leg / 2) % 2 === 0 ? 2 : 0;
        let kx = k[0], ky = k[1] - up, tx = t[0], ty = t[1] - up;
        if (f.tl && i === 3) { kx = 4; ky = 21; tx = 5; ty = 11; } // rears its front legs
        if (f.a) { kx -= 1; tx -= 1; ky += 1; }
        if (f.st || f.d) { kx += 3; ky += 4; tx = kx + 3; ty = ky - 3; } // curled up
        const X = (x) => (s ? 39 - x : x);
        g.line(X(h[0]) + 1, h[1] + 1, X(kx) + 1, ky + 1, 'B').line(X(kx) + 1, ky + 1, X(tx) + 1, ty, 'B');
        g.line(X(h[0]), h[1], X(kx), ky, 'c').line(X(kx), ky, X(tx), ty, 'c');
        g.px(X(kx), ky, 'C').px(X(tx), ty, 'w');
      }
    });
    return g.rows();
  };
  const geode = (f, open) => {
    const dy = f.st || f.d ? 3 : f.tl ? -1 : f.a ? 1 : f.b ? 1 : 0;
    let r = sculpt(40, 32, [
      { e: [20, 10 + dy, 9.5, 8], ramp: '1223' },
      { e: [20, 21 + dy, 8, 6.5], ramp: '1234' },
    ]);
    r = rim(r, { 1: 'p', 2: 'p' });
    // the geode: a jagged break in the back, crystals inside; wide open and glowing in phase 3
    r = open ? stamp(r, 14, dy, `
      ...0...0....
      ..0w0.0C0.0.
      .0CwC0CwC0w0
      0cCwwCCwwCc0
      0BcCw${f.p || f.st ? 'P' : 'Y'}wCcBB0
      .0BccPccBB0.
      ..00000000..`) : stamp(r, 16, 4 + dy, `
      ..0..0..
      .0w00C0.
      0cwCcCC0
      0BcCwcB0
      .0BccB0.
      ..0000..`);
    // two big eyes, four small ones above them
    const ey = 19 + dy;
    r = bossEyes(r, 14, ey, 8, f.face);
    if (!f.d && !f.st) r = stamp(r, 15, ey - 3, 'w0....w0\n00....00');
    // crystal fangs; the mouth between them
    r = stamp(r, 16, ey + 5, f.a || f.face === 'mad' ? '0.0000.0\nC0wqqw0C\n0..00..0' : '0......0\nC0....0C\n0......0');
    if (!(f.a || f.face === 'mad')) r = stamp(r, 18, ey + 5, MOUTH[f.face]);
    // legs go behind the body
    const L = legs(f);
    r = autoOutline(r.map((row, y) => row.split('').map((c, x) => (c === '.' ? L[y][x] : c)).join('')));
    return r;
  };
  for (const [t, open] of [['geode', false], ['geode3', true]]) {
    bossFrames(t, (f) => geode(f, open), o);
    // four walk frames, calm and angry
    for (let k = 0; k < 4; k++) {
      def(t + '_walk' + k, geode({ face: 'calm', m: 1, leg: k }, open), o);
      def(t + '_pwalk' + k, geode({ face: 'mad', m: 1, leg: k, p: 1 }, open), o);
    }
  }
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
    clod: [['.hG.', 'aNNn', 'NNnn', '.nn.'], ['.h.G..', 'aNhNN.', 'aNNNNn', 'NNNnnn', 'NNnnnn', '.nnnn.']],
    foam: [['.wC.', 'wCTT', 'CTTt', '.Tt.'], ['.wwCC.', 'wwCCTT', 'wCCTTT', 'CCTTTt', 'CTTTtt', '.TTtt.']],
    geode: [['..w..', '.wCc.', 'wCcBB', '.cBB.', '..B..'], ['...w...', '..wCc..', '.wCCcB.', 'wCCPcBB', '.cCcBB.', '..cBB..', '...B...']],
    nstar: [['..q..', 'qqwPP', '.qPp.', '.P.p.'], ['...q...', '..qqP..', 'qqqwPPp', '.qqPPp.', '..qPp..', '.qp.pp.', '.p...p.']],
  };
  for (const k in B) {
    def('eb_' + k, pad(B[k][0])); def('ebb_' + k, pad(B[k][1]));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
})();
