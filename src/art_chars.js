'use strict';
// Character art: the hero, enemies, bosses, merchant.
// Light always comes from the top-left; outlines use '0'.

// ---------- Hero: Pip the little star wizard (16x19) ----------
(function hero() {
  const blank = '................';
  const FRONT = [
    '..........00....',
    '.........0cB0...',
    '........0cBb0...',
    '.......0cyBb0...',
    '......0cyyyb0...',
    '.....0cBByBb0...',
    '....0qPPPPPp0...',
    '.0cBBBBBBBBBBb0.',
    '.0bbbbbbbbbbbb0.',
    '.00oOOoOOoOOo00.',
    '..0os0ssss0so0..',
    '..0ks0ssss0sk0..',
    '..0kqsskkssqk0..',
    '..00qPPPPPPp00..',
    '..0scBBBBBPbs0..',
    '...0bbbbbbbb0...',
  ];
  const BACK = [
    '..........00....',
    '.........0cB0...',
    '........0cBb0...',
    '.......0cBBb0...',
    '......0cBBBb0...',
    '.....0cBBBBb0...',
    '....0qPPPPPp0...',
    '.0cBBBBBBBBBBb0.',
    '.0bbbbbbbbbbbb0.',
    '.00oOOOOOOOOo00.',
    '..0oOOOOOOOOo0..',
    '..0ooOOOOOOoo0..',
    '..0oooooooooo0..',
    '..00qPPPPPPp00..',
    '..0scBPBBBBbs0..',
    '...0bbPbbbbb0...',
  ];
  const SIDE = [
    '..000...........',
    '.0cB0...........',
    '..0cBb00........',
    '..0cBBBb00......',
    '...0cBBByb0.....',
    '...0cBByyyb0....',
    '...0qPPPyPPp0...',
    '.0cBBBBBBBBBBb0.',
    '.0bbbbbbbbbbbb0.',
    '.00oOOOOOkkkk00.',
    '..0oOOOsss0ss0..',
    '..0ooOOsss0sss0.',
    '..0oooksssqss0..',
    '..00qPPPPPPp00..',
    '...0cBBBBBsb0...',
    '...0bbbbbbbb0...',
  ];
  const LEGS = {
    idle: ['....0nn00nn0....', '.....00..00.....'],
    stepA: ['....0nn00nn0....', '....0nn0.00.....', '.....00.........'],
    stepB: ['....0nn00nn0....', '.....00.0nn0....', '.........00.....'],
    sideIdle: ['....0nn0nnn0....', '.....00.0000....'],
    sideA: ['....0nn0.0nn0...', '...0nn0...0nn0..', '....00.....00...'],
    sideB: ['.....0nnnnn0....', '.....0nn0nn0....', '......00.00.....'],
  };
  const idle = (up, legs) => [blank].concat(up, legs);
  const step = (up, legs) => up.concat(legs);
  // robe colours the player can choose (see ROBES): sprite names get '', '#1', '#2'...
  const SKINS = [null, { c: 'q', B: 'P', b: 'p', q: 'Y', P: 'y', p: 'o' }, { c: 'H', B: 'G', b: 'g' }, { c: '4', B: '3', b: '2' },
    { c: 'Y', B: 'y', b: 'o', q: 'C', P: 'c', p: 'B' }, { c: 'R', B: 'r', b: 'p', q: 'Y', P: 'y', p: 'o' }, { c: 'T', B: 't', b: 'g' }, { c: 'L', B: 'l', b: 'm' }];
  for (let k = 0; k < SKINS.length; k++) {
    const sk = k ? '#' + k : '';
    const o = { flip: true, flash: true, legend: SKINS[k] };
    const def = (name, rows, opts) => window.def(name + sk, rows, opts);
    def('hero_d0', idle(FRONT, LEGS.idle), o);
    def('hero_d1', step(FRONT, LEGS.stepA), o);
    def('hero_d2', step(FRONT, LEGS.stepB), o);
    def('hero_u0', idle(BACK, LEGS.idle), o);
    def('hero_u1', step(BACK, LEGS.stepA), o);
    def('hero_u2', step(BACK, LEGS.stepB), o);
    def('hero_s0', idle(SIDE, LEGS.sideIdle), o);
    def('hero_s1', step(SIDE, LEGS.sideA), o);
    def('hero_s2', step(SIDE, LEGS.sideB), o);
    // blink: the upper eye pixels close
    const shut = (rows, cols) => rows.map((r, i) => i === 10 ? r.split('').map((c, x) => cols.includes(x) ? 's' : c).join('') : r);
    def('hero_d0b', idle(shut(FRONT, [5, 10]), LEGS.idle), o);
    def('hero_s0b', idle(shut(SIDE, [10]), LEGS.sideIdle), o);
    // hurt: squeezed ><-eyes and an open mouth
    const hurtF = FRONT.slice(), hurtS = SIDE.slice();
    hurtF[10] = '..0o0ssssss0o0..'; hurtF[12] = '..0k0ss00ss0k0..';
    hurtS[10] = '..0oOOOss0sss0..'; hurtS[12] = '..0oookss0qs00..';
    def('hero_d0h', idle(hurtF, LEGS.idle), o);
    def('hero_s0h', idle(hurtS, LEGS.sideIdle), o);
  }
})();

// ---------- Enemies (authored in their base colours; variants use legends) ----------
(function enemies() {
  const o = { flip: true, flash: true, glow: true };
  // Slime: idle / squash / stretch. Base green; recoloured per land.
  const SLIME = {
    idle: `
      .....000000.....
      ...00hhhhhh00...
      ..0hHHhhhhhhG0..
      .0hHwHhhhhhhhG0.
      .0hHHhhhhhhhGG0.
      .0hhh0hhhh0hGG0.
      0hhhh0hhhh0hGGg0
      0hhhqhh00hhqGgg0
      0GGhhhhhhhhhGgg0
      0gGGGGGGGGGGggg0
      .0gggggggggggg0.
      ..000000000000..`,
    squash: `
      ....00000000....
      ..00hhhhhhhh00..
      .0hHHhhhhhhhhG0.
      0hHwHhhhhhhhhGG0
      0hhh0hhhhhh0hGg0
      0hhh0hhhhhh0GGg0
      0hhqhhh00hhhqgg0
      0GGhhhhhhhhhhgg0
      0gGGGGGGGGGGGgg0
      .00000000000000.`,
    stretch: `
      ......0000......
      .....0hhhh0.....
      ....0hHhhhG0....
      ...0hHwHhhhG0...
      ...0hHHhhhhG0...
      ...0hhhhhhhG0...
      ...0h0hhhh0G0...
      ...0h0hhhh0G0...
      ...0qhh00hqG0...
      ...0hhhhhhGg0...
      ...0GhhhhhGg0...
      ..0GGGGGGGGgg0..
      ..0gggggggggg0..
      ...0000000000...`,
    mini: `
      ...000000...
      .00hhhhhG00.
      0hHwhhhhhGG0
      0hh0hh0hGGg0
      0hhhq00qGgg0
      0gGGGGGGGgg0
      .0000000000.`,
  };
  const SLIME_COL = {
    gold: { g: 'o', G: 'y', h: 'Y', H: 'w', q: 'O' },
    green: null,
    blue: { g: 'b', G: 'B', h: 'c', H: 'C' },
    pink: { g: 'p', G: 'P', h: 'q', H: 'w', q: 'R' },
  };
  for (const c in SLIME_COL) for (const f in SLIME) def('slime_' + c + '_' + f, SLIME[f], { flash: true, glow: true, legend: SLIME_COL[c] });

  // Bee (faces right): two wing frames.
  const BEE_BODY = [
    '....0000000.....',
    '...0Yyy1yy1yy0..',
    '..0Yyyy1yy1yyy0.',
    '.0yyyyy1yy1w0y0.',
    '0oyyyyy1yy100y0.',
    '.0oyyyy1yy1yRy0.',
    '..0oooo1oo1oo0..',
    '...0000000000...',
  ];
  def('bee_0', [
    '.....000.000....',
    '....0CCw0CCw0...',
    '....0CCC0CCC0...',
    '.....000.000....',
  ].concat(BEE_BODY), o);
  def('bee_1', [
    '................',
    '..000......000..',
    '.0CCw0....0CCw0.',
    '..0CC000000CC0..',
  ].concat(BEE_BODY), o);

  // Mushroom: idle / charge (cap swells) / shoot (mouth open).
  def('shroom_0', `
    ................
    .....000000.....
    ...00qqPPPP00...
    ..0qwwqPPwwPp0..
    .0PqwwPPPwwPPp0.
    .0PPqPPPPPPPPp0.
    0PPPPPwwPPPPppp0
    0pPPPPwwPPPPppp0
    .0pppppppppppp0.
    ..000000000000..
    ....0AAAAAa0....
    ....0A0AA0a0....
    ....0A0AA0a0....
    ....0qAAAAq0....
    ...0aAAAAAaa0...
    ...0000000000...`, o);
  def('shroom_1', `
    .....000000.....
    ...00qqPPPP00...
    ..0qwwqPPwwPp0..
    .0PqwwPPPwwPPp0.
    0PPPqPPPPPPPPpp0
    0PPPPPPwwPPPPpp0
    0pPPPPPwwPPPPpp0
    0ppPPPPPPPPPppp0
    .0pppppppppppp0.
    ..000000000000..
    ....0AAAAAa0....
    ....0A0AA0a0....
    ....0A0AA0a0....
    ....0qAAAAq0....
    ...0aAAAAAaa0...
    ...0000000000...`, o);
  def('shroom_2', `
    ................
    ................
    .....000000.....
    ...00qqPPPP00...
    ..0qwwqPPwwPp0..
    .0PqwwPPPwwPPp0.
    0PPPPPwwPPPPppp0
    0pPPPPwwPPPPppp0
    .0pppppppppppp0.
    ..000000000000..
    ....0A0AA0a0....
    ....0A0AA0a0....
    ....0qA00Aq0....
    ....0AA00Aa0....
    ...0aAAAAAaa0...
    ...0000000000...`, o);

  // Crab: symmetric; claws up / claws down (legs alternate).
  const CRAB_BODY = (legA) => [
    '...0R000000R0...',
    '..0RwRRRRRRRr0..',
    '.0RwRRRRRRRRrr0.',
    '.0RRRRRRRRRRrr0.',
    (legA ? '0.0' : '.00') + 'RRR0RR0Rrr' + (legA ? '0.0' : '00.'),
    (legA ? '.00' : '0.0') + 'rRRR00RRrr' + (legA ? '00.' : '0.0'),
    (legA ? '0..' : '.0.') + '0rrrrrrrr0' + (legA ? '..0' : '.0.'),
    '....00000000....',
  ];
  def('crab_0', [
    '00.00......00.00',
    '0R0R0......0R0R0',
    '0RRR000..000RRR0',
    '.0RR0w0..0w0RR0.',
    '..0R000..000R0..',
  ].concat(CRAB_BODY(true)), o);
  def('crab_1', [
    '................',
    '.000........000.',
    '0RRR000..000RRR0',
    '0RwR0w0..0w0RwR0',
    '.000000..000000.',
  ].concat(CRAB_BODY(false)), o);

  // Flower turret: idle / charge (squint) / shoot (mouth wide).
  const FLOWER = [
    '....00.00.00....',
    '...0qP0qP0Pp0...',
    '..0qPPPPPPPPp0..',
    '.0qPP000000Ppp0.',
    '.0PP0Yyyyyy0pp0.',
    '0qPP0y0yy0y0Ppp0',
    '0PPP0y0yy0o0ppp0',
    '0PPP0yyyyyo0ppp0',
    '.0Pp0yo00oo0pp0.',
    '.0PPp000000ppp0.',
    '..0pPpppppppp0..',
    '...0pp0gg0pp0...',
    '......0Gg0......',
    '..000.0Gg0.000..',
    '.0hGG00Gg00GGg0.',
    '..000000000000..',
  ];
  const edit = (rows, ed) => rows.map((r, i) => ed[i] || r);
  def('flower_0', FLOWER, o);
  def('flower_1', edit(FLOWER, { 5: '0qPP0yyyyyy0Ppp0', 6: '0PPP0y0yy0o0ppp0', 8: '.0Pp0yoooooo0pp0'.slice(0, 16) }), o);
  def('flower_2', edit(FLOWER, { 7: '0PPP0yy00yo0ppp0', 8: '.0Pp0y0000o0pp0.' }), o);

  // Wisp: flickering spirit, three frames.
  const WISP_BODY = [
    '..0CwwwwwwCcc0..',
    '..0Cww0ww0wCc0..',
    '.0Cwww0ww0wwCc0.',
    '.0Cwqwwwwwwqwc0.',
    '.0cCwwwwwwwwCc0.',
    '.0ccCwwwwwwCcc0.',
    '..0ccCCCCCCcc0..',
  ];
  def('wisp_0', [
    '.......00.......',
    '......0Cc0......',
    '.....0CwCc0.....',
    '....0CwwCcc0....',
    '...0CwwwwCcc0...',
  ].concat(WISP_BODY, [
    '..0c0cc00cc0c0..',
    '...0.00..00.0...',
    '................',
  ]), o);
  def('wisp_1', [
    '......00........',
    '.....0Cc0.......',
    '.....0CwCc0.....',
    '....0CwwCcc0....',
    '...0CwwwwCcc0...',
  ].concat(WISP_BODY, [
    '..00cc0cc0cc00..',
    '....00.00.00....',
    '................',
  ]), o);
  def('wisp_2', [
    '........00......',
    '.......0cC0.....',
    '.....0CwCc0.....',
    '....0CwwCcc0....',
    '...0CwwwwCcc0...',
  ].concat(WISP_BODY, [
    '..0cc0cccc0cc0..',
    '...00.0000.00...',
    '................',
  ]), o);
})();

// ---------- Bosses ----------
(function bosses() {
  const o = { flash: true };
  // 1. King Slime (32x32)
  const CROWN = `
    .0....00....0.
    0Y0..0YY0..0y0
    0YY00YyyY00yy0
    0YyyYyyyyyyyo0
    0yPyyyPPyyyPo0
    0yyyyyyyyyyoo0
    00000000000000`;
  const king = (rx, ry, cy, crownY, eyeDx) => {
    let r = sculpt(32, 32, [{ e: [16, cy, rx, ry], ramp: 'gGhH', cut: 30 }]);
    const ey = Math.round(cy) - 2, ex1 = 16 - eyeDx - 2, ex2 = 16 + eyeDx;
    const eye = `
      00
      w0
      00`;
    r = stamp(r, ex1, ey, eye);
    r = stamp(r, ex2, ey, eye);
    r = stamp(r, ex1 - 2, ey + 4, 'qq');
    r = stamp(r, ex2 + 2, ey + 4, 'qq');
    r = stamp(r, 13, ey + 4, `
      0....0
      .0000.`);
    r = stamp(r, Math.round(16 - rx * 0.5), Math.round(cy - ry * 0.55), `
      ww.
      w..`);
    return stamp(r, 9, crownY, CROWN);
  };
  def('king_0', king(15.5, 14, 20, 1, 5), o);
  def('king_1', king(16, 11, 23, 7, 6), o);
  def('king_2', king(12, 15.5, 19.5, 0, 4), o);

  // 2. Giant Crab (40x30)
  const crab = (clawY, angry, legA) => {
    let r = sculpt(40, 30, [
      { e: [20, 18.5, 14.5, 9], ramp: 'nrRA' },
      { e: [8.5, 16 + clawY * 0.5, 3.5, 2.5], ramp: 'nrRA', hi: false },
      { e: [31.5, 16 + clawY * 0.5, 3.5, 2.5], ramp: 'nrRA', hi: false },
      { e: [5.5, 9 + clawY, 5.5, 5.5], ramp: 'nrRA' },
      { e: [34.5, 9 + clawY, 5.5, 5.5], ramp: 'nrRA' },
    ]);
    // pincer notches
    r = stamp(r, 4, 3 + clawY, '_0\n_0\n0.');
    r = stamp(r, 34, 3 + clawY, '0_\n0_\n.0');
    // eye stalks
    const eye = angry ? `
      0000
      0w00
      0000
      .00.` : `
      .00.
      0ww0
      0w00
      .00.`;
    r = stamp(r, 13, 4, eye);
    r = stamp(r, 23, 4, eye);
    r = stamp(r, 13, 8, '.00.\n.00.');
    r = stamp(r, 23, 8, '.00.\n.00.');
    // mouth
    r = stamp(r, 17, 19, angry ? '000000\n0wwww0\n.0000.' : '0....0\n.0000.');
    r = stamp(r, 12, 18, 'qq');
    r = stamp(r, 26, 18, 'qq');
    // legs
    const L = legA ? ['0.0.0', '.0.0.'] : ['.0.0.', '0.0.0'];
    r = stamp(r, 6, 25, L.join('\n'));
    r = stamp(r, 29, 25, L.join('\n'));
    return r;
  };
  def('bcrab_0', crab(0, false, true), o);
  def('bcrab_1', crab(1, false, false), o);
  def('bcrab_2', crab(-1, true, true), o);

  // 3. Crystal Golem (32x32)
  const golem = (armY, eyes) => {
    let r = sculpt(32, 32, [
      { r: [8, 24, 7, 8, 2], ramp: 'dmlL', hi: false },
      { r: [17, 24, 7, 8, 2], ramp: 'dmlL', hi: false },
      { r: [5, 11, 22, 16, 5], ramp: 'dmlL' },
      { r: [10, 3, 12, 11, 4], ramp: 'dmlL' },
      { r: [0, 12 + armY, 7, 13, 3], ramp: 'dmlL' },
      { r: [25, 12 + armY, 7, 13, 3], ramp: 'dmlL' },
    ]);
    const crystal = `
      .0.
      0C0
      0cb
      0c0`;
    r = stamp(r, 1, 9 + armY, crystal);
    r = stamp(r, 3, 8 + armY, '.0.\n0C0\n0cb\n0cb\n0c0');
    r = stamp(r, 26, 8 + armY, '.0.\n0C0\n0cb\n0cb\n0c0');
    r = stamp(r, 28, 9 + armY, crystal);
    r = stamp(r, 13, 0, '.0..0.\n0C00C0\n0cbCcb\n0cb0cb');
    r = stamp(r, 12, 7, eyes);
    // heart gem in the chest
    r = stamp(r, 13, 16, `
      .0000.
      0qwPP0
      0qPPp0
      .0Pp0.
      ..00..`);
    return r;
  };
  const EYES = '.00..00.\n0cw00wc0\n.00..00.';
  const EYES_MAD = '0000.0000\n.0cw0wc0.\n..00.00..';
  def('golem_0', golem(0, EYES), o);
  def('golem_1', golem(1, EYES), o);
  def('golem_2', golem(-4, EYES_MAD), o);
})();

// ---------- Land-specific newcomers ----------
(function newcomers() {
  const o = { flip: true, flash: true, glow: true };
  // Jellyfish (beach): relaxed / contracted pulse.
  def('jelly_0', `
    ................
    .....000000.....
    ...00qwwqqq00...
    ..0qwwqqqqqqP0..
    .0qwqqqqqqqqPP0.
    .0qqq0qqqq0qPP0.
    .0qqq0qqqq0qPP0.
    .0qRqqq00qqRPP0.
    0PPPPPPPPPPPPpp0
    0PP0PP0PP0PP0pp0
    .00q00q00q00q00.
    ..q..q..q..q....
    ...q..q..q..q...
    ..3..3..3..3....
    ................
    ................`, o);
  def('jelly_1', `
    ......0000......
    ....00qwwq00....
    ...0qwwqqqqP0...
    ...0qwqqqqqP0...
    ..0qqq0qq0qPP0..
    ..0qqq0qq0qPP0..
    ..0qRqq00qRPP0..
    ..0PPPPPPPPPp0..
    ...0PP0PP0Pp0...
    ....00q00q00....
    .....q..q..q....
    .....q..q..q....
    .....3..3..3....
    ......3....3....
    ................
    ................`, o);
  // Bat (crystal cave): wings up / level / down, drawn in colour and auto-outlined.
  const bat = (art) => autoOutline(parseArt('bat', art));
  def('bat_0', bat(`
    ................
    .P...2....2...P.
    .PP..22..22..PP.
    .pPP.322222.PPp.
    ..pPP3w22w2PPp..
    ...pP322222Pp...
    ....p12ww21p....
    .....111111.....
    ......1..1......
    ................`), o);
  def('bat_1', bat(`
    ................
    .....2....2.....
    .....22..22.....
    .....322222.....
    .PPPP3w22w2PPPP.
    ..ppP322222Ppp..
    ....p12ww21p....
    .....111111.....
    ......1..1......
    ................`), o);
  def('bat_2', bat(`
    ................
    .....2....2.....
    .....22..22.....
    .....322222.....
    ...PP3w22w2PP...
    ..pPP322222PPp..
    .pPp.12ww21.pPp.
    .Pp..111111..pP.
    .p....1..1....p.
    ................`), o);
})();
