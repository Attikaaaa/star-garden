'use strict';
// Art for the scenery (scenery.js): more obstacles and breakables per land, the tall 2x2
// pieces (trees, palms, a sandcastle, crystal spires), what hangs on the top wall's face,
// lily pads. Light from the top left, a '0' outline on everything.
(function sceneryArt() {
  const A = (name, art, opts) => def(name, autoOutline(parseArt(name, art)), opts);
  const blank = (w, h) => Array.from({ length: h }, () => '.'.repeat(w));
  // Paint parts back to front: [[rows, x, y], ...]
  const comp = (w, h, parts) => parts.reduce((rows, [art, x, y]) => stamp(rows, x, y, art), blank(w, h));
  const rowsOf = (name) => _defs.find(d => d.name === name).rows;

  // ---------- Obstacles (16x16, fill their tile) ----------
  // Bloom Meadow: a tree stump, two mossy stones, a stone lantern
  def('ob_stump', stamp(stamp(sculpt(16, 16, [
    { e: [8, 14, 7.5, 2], ramp: 'unNN' },
    { r: [3, 5, 10, 10, 3], ramp: 'unNO' },
    { e: [8, 6, 5, 2.6], ramp: 'NaaA', hi: false },
  ]), 5, 5, '.NNNN.\nN.aa.N\n.NNNN.'), 1, 12, 'h............h\nG............G'));
  def('ob_stones', stamp(sculpt(16, 16, [
    { e: [11, 11, 4.5, 4], ramp: 'dmlL' },
    { e: [6, 9.5, 5.5, 5.5], ramp: 'dmlL' },
  ]), 3, 4, '.hHh.\nhGGhG\n.g.G.'));
  A('ob_lantern', `
    ................
    .......ll.......
    .....llllll.....
    ...lllllllllm...
    ..mmmmmmmmmmmm..
    ....mYYYYYYd....
    ....lYwwwwYd....
    ....mYYYYYYd....
    ...lmmmmmmmmd...
    ......lmmd......
    ......lmmd......
    ......lmmd......
    .....llmmdd.....
    ....lmmmmmmd....
    ................
    ................`);
  // Sunny Shore: a rock with barnacles, a big shell, a mooring post
  def('ob_barnacle', stamp(sculpt(16, 16, [{ e: [8, 9.5, 7, 6], ramp: 'dmlL' }]), 3, 6,
    '..lw.....\n..dl..lw.\n.......dl\nlw.......\ndl....g..\n.....gGg.'));
  def('ob_shell', stamp(sculpt(16, 16, [
    { e: [8, 9.5, 6.5, 5.5], ramp: 'pPqw' },
    { e: [12.5, 11.5, 2.5, 2.5], ramp: 'RRqq', hi: false },
  ]), 4, 7, '..pp.\n.p..p\n.p.p.\n..p..'));
  def('ob_post', stamp(sculpt(16, 16, [
    { e: [8, 14, 6.5, 1.8], ramp: 'eaaA' },
    { r: [5, 3, 6, 12, 2], ramp: 'unNO' },
    { e: [8, 3.5, 3, 1.5], ramp: 'NaaA', hi: false },
  ]), 5, 8, 'AAAAAA\neeeeee'));
  // Crystal Cave: a pink cluster, a stalagmite, a rock with gold in it
  def('ob_cluster', rowsOf('rock_crystal'), { legend: { C: 'q', c: 'P', b: 'p' } });
  A('ob_stalag', grid(16, 16).fill((x, y) => {
    const tall = (cx, top, bot, k) => {
      if (y < top || y > bot) return null;
      const half = 0.6 + (y - top) * k, d = x + 0.5 - cx;
      if (Math.abs(d) > half) return null;
      const t = (d + half) / (2 * half), band = (bot - y) % 4 === 0 && y > top + 2;
      return t < 0.3 ? (band ? '3' : '4') : t < 0.62 ? (band ? '2' : '3') : (band ? '1' : '2');
    };
    return tall(7, 1, 14, 0.38) || tall(12.5, 8, 14, 0.4);
  }).rows());
  def('ob_ore', stamp(sculpt(16, 16, [{ e: [8, 9.5, 7.5, 6.2], ramp: '1233' }]), 4, 6, 'Y......\nO..y...\n....Yy.\n.y...O.'));
  // The Star Well: a broken pillar with a star
  def('ob_pillar', stamp(sculpt(16, 16, [
    { r: [4, 3, 8, 12, 1], ramp: '1234' },
    { e: [8, 3.5, 4, 1.8], ramp: '2344', hi: false },
  ]), 6, 7, '.Y.\nYwY\n.Y.'));

  // ---------- Breakables ----------
  def('bk_pot', sculpt(16, 16, [
    { e: [5.5, 5, 3.2, 3], ramp: 'gGhH' }, { e: [10.5, 5, 3.2, 3], ramp: 'gGhH' }, { e: [8, 3.5, 3, 2.5], ramp: 'gGhH' },
    { r: [4, 9, 8, 6, 2], ramp: 'nNOO' },
    { r: [3, 7, 10, 3, 1], ramp: 'nNOY', hi: false },
  ]));
  A('bk_pot_f', `
    ....P...y.....
    ...PqP.yYy....
    ....P...y.....`);
  def('bk_hay', stamp(sculpt(16, 16, [{ r: [2, 4, 12, 11, 3], ramp: 'oOyY' }]), 2, 6, 'nnnnnnnnnnnn\n............\n............\n............\n............\nnnnnnnnnnnnn'));
  A('bk_crate', grid(16, 16).fill((x, y) => {
    if (x < 2 || x > 13 || y < 3 || y > 14) return null;
    const i = x - 2, j = y - 3;
    if (j === 0 || i === 0) return 'O';
    if (j === 11 || i === 11) return 'n';
    if (i + j === 11) return 'O';
    if (i + j === 12) return 'n';
    return j % 4 === 0 ? 'n' : 'N';
  }).rows());
  def('bk_amphora', sculpt(16, 16, [
    { e: [8, 10, 5.5, 5], ramp: 'nNOO' },
    { r: [6, 2, 4, 5, 1], ramp: 'nNOO' },
    { r: [5, 1, 6, 2, 1], ramp: 'nNOY', hi: false },
  ]));
  def('bk_jar', stamp(sculpt(16, 16, [
    { r: [4, 4, 8, 11, 2], ramp: 'bBcC' },
    { r: [5, 2, 6, 3, 1], ramp: 'unNO', hi: false },
  ]), 5, 6, 'w.....\nw.qq..\n..qPp.\n..Pp..\n...p..'));
  def('bk_jar_well', rowsOf('bk_jar'), { legend: { q: 'Y', P: 'y', p: 'O' } });
  // Crystal Cave veins: shards in a cracked lump (the crack says it breaks)
  A('bk_vein', grid(16, 16).fill((x, y) => {
    const nx = (x + 0.5 - 8) / 6.5, ny = (y + 0.5 - 12.5) / 2.8, q = nx * nx + ny * ny;
    if (q <= 1) {
      if (y === 12 + ((x >> 1) & 1) && x >= 5 && x <= 11) return '1';
      const v = -0.5 * nx - 0.62 * ny + 0.6 * Math.sqrt(1 - q);
      return v > 0.75 ? '4' : v > 0.35 ? '3' : v > -0.1 ? '2' : '1';
    }
    const shard = (cx, top, k) => {
      if (y < top || y > 12) return null;
      const half = 0.6 + (y - top) * k, d = x + 0.5 - cx;
      if (Math.abs(d) > half) return null;
      const t = (d + half) / (2 * half);
      return y === top ? 'w' : t < 0.4 ? 'C' : t < 0.7 ? 'c' : 'b';
    };
    return shard(4, 4, 0.27) || shard(12.5, 5, 0.27) || shard(8.5, 1, 0.27); // the side shards stand in front
  }).rows());

  // ---------- Tall pieces on a 2x2 block (drawn with the actors, feet at the block's foot) ----------
  // Lines between parts of one body in a dark tone of the body instead of the outline.
  const soften = (rows, k) => rows.map((row, y) => row.split('').map((c, x) => {
    if (c !== '0') return c;
    const at = (i, j) => (rows[j] && rows[j][i]) || '.';
    return at(x - 1, y) !== '.' && at(x + 1, y) !== '.' && at(x, y - 1) !== '.' && at(x, y + 1) !== '.' && at(x - 1, y - 1) !== '.' && at(x + 1, y + 1) !== '.' ? k : c;
  }).join(''));
  // An old tree: a wide clumpy crown on a short trunk, roots in the grass.
  const crown = sculpt(44, 46, [
    { e: [22, 13, 17, 12], ramp: 'gGhH' },
    { e: [9.5, 19, 9, 8], ramp: 'gGhH' }, { e: [34.5, 19, 9, 8], ramp: 'gGhH' },
    { e: [16, 24, 9, 6.5], ramp: 'gGhH' }, { e: [29, 24, 9, 6.5], ramp: 'gGhH' },
    { e: [15, 8, 8, 6], ramp: 'gGhH' },
  ]);
  const trunk = sculpt(44, 46, [
    { e: [22, 43.5, 11, 2.5], ramp: 'unNN' },
    { r: [17, 24, 10, 20, 3], ramp: 'unNO' },
  ]);
  def('gi_tree', comp(44, 46, [
    [trunk, 0, 0],
    [['.u.', 'uu.'], 20, 34],
    [soften(crown, 'g'), 0, 0],
    [['h.....G', 'G.h..hG'], 7, 43], [['.h', 'GG'], 34, 43],
    [['R', 'r'], 14, 6], [['R', 'r'], 27, 9], [['R', 'r'], 8, 15], [['R', 'r'], 35, 14],
    [['R', 'r'], 21, 17], [['R', 'r'], 30, 22], [['R', 'r'], 12, 23],
  ]));
  def('gi_bloom', rowsOf('gi_tree'), { legend: { g: 'p', G: 'P', h: 'q', H: 'w', r: 'y', R: 'Y' } });

  // A palm on a sandy mound with two rocks.
  const palm = grid(46, 50);
  const tx = (y) => 22 + Math.round(Math.pow((44 - y) / 30, 2) * 4);
  for (let y = 15; y <= 44; y++) {
    const c = tx(y), seg = (y - 15) % 4 === 0;
    for (let i = -2; i <= 2; i++) palm.px(c + i, y, seg ? (i < 0 ? 'N' : 'n') : i === -2 ? 'O' : i < 1 ? 'N' : i === 1 ? 'n' : 'u');
  }
  const fr = grid(46, 50), cx = tx(15), cy = 13;
  const frond = (dx, len, lift, droop) => {
    for (let t = 0; t <= 1.0001; t += 1 / (len * 2)) {
      const x = cx + dx * len * t, y = cy - lift * len * t + droop * len * t * t;
      const th = Math.max(1, Math.round(3 * (1 - t) + 0.6));
      for (let k = 0; k < th; k++) fr.px(Math.round(x), Math.round(y) + k, k === 0 ? 'h' : k === th - 1 ? 'g' : 'G');
      if (t > 0.2 && Math.round(t * len * 2) % 3 === 0) fr.px(Math.round(x), Math.round(y) + th, 'g');
    }
  };
  frond(-1, 20, 0.35, 0.9); frond(1, 20, 0.35, 0.9);
  frond(-0.8, 13, 0.9, 0.9); frond(0.8, 13, 0.9, 0.9);
  frond(-0.35, 9, 1.0, 0.25); frond(0.45, 10, 0.8, 0.5);
  frond(-1, 14, -0.1, 0.9); frond(1, 14, -0.1, 0.9);
  const mound = sculpt(46, 50, [
    { e: [23, 45, 17, 4.5], ramp: 'eaaA' },
    { e: [11, 45, 6, 4], ramp: 'dmlL' }, { e: [35, 46, 5, 3.5], ramp: 'dmlL' },
  ]);
  const nuts = sculpt(46, 50, [{ e: [cx - 2, cy + 3, 2.2, 2.2], ramp: 'unNN' }, { e: [cx + 2, cy + 3.5, 2.2, 2.2], ramp: 'unNN' }, { e: [cx, cy + 5, 2.2, 2.2], ramp: 'unNN' }]);
  def('gi_palm', comp(46, 50, [[mound, 0, 0], [autoOutline(palm.rows()), 0, 0], [nuts, 0, 0], [autoOutline(fr.rows()), 0, 0]]));

  // A sandcastle with three towers and a flag.
  const castle = sculpt(40, 46, [
    { r: [2, 14, 11, 31, 2], ramp: 'eaaA' }, { r: [27, 14, 11, 31, 2], ramp: 'eaaA' },
    { r: [13, 8, 14, 37, 2], ramp: 'eaaA' },
    { r: [5, 27, 30, 18, 2], ramp: 'eaaA' },
  ]);
  const merl = (x, y, n) => Array.from({ length: n }, (_, i) => [autoOutline(['....', '.aA.', '.ea.', '....']), x + i * 3, y]);
  def('gi_castle', comp(40, 46, [
    ...merl(1, 11, 4), ...merl(25, 11, 4), ...merl(12, 5, 5),
    [castle, 0, 0],
    [autoOutline(['......', '..y...', '..Nrr.', '..NrRr', '..Nrr.', '..N...', '......']), 17, 0],
    [autoOutline(['......', '..nn..', '.nuun.', '.nuun.', '.nuun.', '......']), 17, 36],
    [['.n.', 'nun'], 6, 21], [['.n.', 'nun'], 31, 21], [['.n.', 'nun'], 18, 17],
    [['.o.', 'oOo', '.o.'], 9, 33], [['.q.', 'qwq'], 28, 37], [['A.', '.A'], 24, 31],
  ]));

  // Crystal spires: three prisms on a rocky foot.
  const prism = (w, h, tip) => grid(w, h).fill((x, y) => {
    const half = w / 2, d = x + 0.5 - half;
    const hw = y < tip ? half * (y + 1) / (tip + 1) : half;
    if (Math.abs(d) > hw) return null;
    if (y < tip) return d < 0 ? 'w' : 'c';
    if (d < -half + 1.5) return 'C';
    if (d < 0) return y % 7 === 3 && d > -half + 2 ? 'w' : 'C';
    return d > half - 1.5 ? 'B' : 'c';
  }).rows();
  const spires = comp(40, 50, [
    [autoOutline(prism(12, 40, 6)), 14, 1],
    [autoOutline(prism(9, 26, 5)), 5, 16],
    [autoOutline(prism(9, 30, 5)), 26, 13],
    [sculpt(40, 50, [{ e: [9, 44, 7, 5], ramp: '1234' }, { e: [31, 45, 7, 4.5], ramp: '1234' }, { e: [20, 46, 8, 3.5], ramp: '1234' }]), 0, 0],
  ]);
  def('gi_spire', spires);
  def('gi_spire_p', spires, { legend: { C: 'q', c: 'P', B: 'p' } });

  // The Star Well: an obelisk with a glowing star.
  def('gi_obelisk', comp(32, 48, [
    [sculpt(32, 48, [
      { r: [4, 38, 24, 9, 2], ramp: '1234' },
      { r: [9, 8, 14, 32, 1], ramp: '1234' },
    ]), 0, 0],
    [autoOutline(['..........', '....4.....', '...443....', '..44332...', '.4433221..', '..........']), 11, 2],
    [['..Y..', '.YwY.', 'YwwwY', '.YwY.', '..Y..'], 13, 16],
    [['3.3.3.3'], 12, 30],
  ]));

  // ---------- On the top wall's face ----------
  // Bloom Meadow: a lamp (the flame is drawn live), a flower box, a little window
  A('fc_lamp', `
    .........
    ...nNn...
    ..nOOOn..
    ..N...n..
    ..N...n..
    ..N...n..
    ..NnnNn..
    ....n....
    .........`);
  A('fc_box', `
    ..............
    .P.y..q..P.w..
    PqPyY.qPqPwyw.
    GPGhGhGPGhGwG.
    NOOOOOOOOOOOn.
    NNNNNNNNNNNNn.
    nnnnnnnnnnnnn.
    ..............`);
  A('fc_window', `
    ..........
    ...NNNN...
    ..NbbBBn..
    .NbbBcCBn.
    .NbbBBcBn.
    .NnnnNnnn.
    .NbbBNbBn.
    .NbbbNbBn.
    .OOOOOOOO.
    ..........`);
  // Sunny Shore: a life ring, a porthole, a starfish
  A('fc_ring', `
    ...........
    ...wwrr....
    ..wwwrrr...
    .wwr..rrr..
    .rr....ww..
    .rr....ww..
    .rrr..www..
    ..rrrwww...
    ...rrww....
    ...........`);
  A('fc_port', `
    ..........
    ...yyyO...
    ..yCCcBO..
    .yCwcBBbO.
    .yCcBBbbO.
    .OBBbbbbn.
    ..OBbbbn..
    ...OOnn...
    ..........`);
  A('fc_star', `
    .........
    ....o....
    ....O....
    .ooOyOoo.
    ..oOOOo..
    ..oO.Oo..
    .oo...oo.
    .........`);
  // Crystal Cave: a timber post, a crystal growing out of the wall, a hanging lantern
  A('fc_beam', `
    .NNNNn.
    .NOOOn.
    .NONNn.
    .NONNn.
    .NONnn.
    .NONNn.
    .NOyNn.
    .NONNn.
    .NONNn.
    .NONnn.
    .NONNn.
    .NONNn.
    .NOyNn.
    .NONNn.
    .nnnnu.`);
  A('fc_vein', `
    ........
    ...w....
    ..wCc...
    .wCCcB..
    .CCccB..
    ..Cc.cB.
    ..C..CB.
    .....c..
    ........`);
  A('fc_hang', `
    .......
    ...X...
    ...X...
    ..XXX..
    .X...X.
    .X...X.
    .X...X.
    ..XXX..
    .......`);
  // The Star Well: a carved star
  A('fc_rune', `
    .........
    ....Y....
    ....4....
    .YY444YY.
    ...444...
    ..44.44..
    .Y.....Y.
    .........`);
  // Flames for lamps and lanterns (live, three frames)
  def('fl_0', '.Y.\nYwY\nyYy');
  def('fl_1', '..Y\nYwY\nyYy');
  def('fl_2', 'Y..\nYwY\nyYy');

  // ---------- Tall grass: a tile of tufts (poking 4px above it), and tufts for in front of feet ----------
  const TUFT = parseArt('tuft', `
    ..........
    ..H....H..
    ..h..H.h..
    .hG..h.Gh.
    .hGG.GhGG.
    hGGghGGgG.
    GGggGGggGh
    gGggGggggG
    .gggggggg.`);
  const tuftAt = (rows, x, y, flip) => stamp(rows, x, y, flip ? TUFT.map(r => r.split('').reverse().join('')) : TUFT);
  const GRASS_COL = { meadow: null, beach: { H: 'A', h: 'H', G: 'h', g: 'G' }, crystal: { H: 'C', h: 'c', G: '3', g: '2' }, well: { H: 'Y', h: '4', G: '3', g: '1' } };
  // three rows of two tufts; the next tile's tufts fill the gaps, so a patch's rim stays ragged
  const GRASS_V = [[0, 6, 3, 1], [1, 6, 0, 5], [0, 5, 2, 6]];
  GRASS_V.forEach(([a1, a2, b1, c1], v) => {
    let t = blank(16, 20);
    t = tuftAt(t, a1, 0, v === 1); t = tuftAt(t, a2, 1, v !== 2);
    t = tuftAt(t, b1, 5, v === 2); t = tuftAt(t, b1 + 6 > 6 ? 6 : b1 + 6, 6, v === 0);
    t = tuftAt(t, c1, 10, v !== 1); t = tuftAt(t, c1 > 2 ? 0 : 6, 11, v === 2);
    t = autoOutline(t);
    for (const th in GRASS_COL) def('grass_' + th + '_' + v, t, GRASS_COL[th] ? { legend: GRASS_COL[th] } : undefined);
  });
  const front = autoOutline(tuftAt(tuftAt(blank(15, 9), 0, 0, false), 5, 0, true));
  for (const th in GRASS_COL) def('grassf_' + th, front, GRASS_COL[th] ? { legend: GRASS_COL[th] } : undefined);

  // ---------- In the water ----------
  A('lily_0', `
    .........
    ..GhhG...
    .GhHhhGg.
    .GGhhG.g.
    ..gGGgg..
    .........`);
  A('lily_1', `
    .........
    ...qPq...
    ..GPwPG..
    .GhqPqGg.
    ..gGGgg..
    .........`);
  A('lily_2', `
    ......
    .GhG..
    .gGGg.
    ......`);
})();
