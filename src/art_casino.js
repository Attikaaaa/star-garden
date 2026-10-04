'use strict';
// Art for the Star Casino: chips, the hall's furniture, playing cards, dice and the
// Prize Counter's goods. Big pieces are painted with grid() from a few shaded boxes
// (light from the top left, a '0' outline); small ones are drawn by hand.

// A shaded box: '0' outline, `hi` on the top and left inner edge, `lo` on the bottom and right.
function czBox(g, x, y, w, h, base, hi, lo, round) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = i === 0 || i === w - 1, cy = j === 0 || j === h - 1;
    if (round && cx && cy) continue;
    let c = base;
    if (cx || cy || (round && (i === 1 || i === w - 2) && (j === 1 || j === h - 2) && false)) c = '0';
    else if (j === 1 || i === 1) c = hi;
    else if (j === h - 2 || i === w - 2) c = lo;
    g.px(x + i, y + j, c);
  }
  return g;
}
// Every filled pixel that touches the transparent outside becomes '0'.
const czOutline = (g) => { const r = autoOutline(g.rows().map(s => s)); return r; };

// ---------- Chips ----------
(function chips() {
  const chip = `
    ..00000..
    .0RwRwR0.
    0wRRRRRw0
    0RRyyyRr0
    0wRyYyrw0
    0RRyyyrr0
    0wrrrrrw0
    .0rwrwr0.
    ..00000..`;
  def('cz_chip', chip);
  const L = { 1: { R: 'L', r: 'm' }, 5: {}, 25: { R: 'G', r: 'g' }, 100: { R: '3', r: '1' }, 500: { R: 'O', r: 'n' } };
  for (const v in L) def('cz_chip_' + v, chip, { legend: L[v] });
  // a short stack of chips, seen from the side (the Cashier's tray, the prize shelf)
  def('cz_stack', `
    .0000000.
    0RwRRwRr0
    0rrrrrrr0
    0GhGGhGg0
    0ggggggg0
    0LwLLwLm0
    0mmmmmmm0
    .0000000.`);
  // the banner icons (12x12)
  def('icon_chip', `
    ...000000...
    ..0RRwwRR0..
    .0wRRRRRRw0.
    0RRRyyyyRRr0
    0wRyYYyyyRw0
    0wRyYyyyyrw0
    0RRyyyyyyrr0
    0RRyyyyyyrr0
    0wrryyyyrrw0
    .0wrrrrrrw0.
    ..0rrwwrr0..
    ...000000...`);
  def('icon_card', `
    ............
    .000000000..
    .0YYYYYYYy0.
    .0YwwwwwYy0.
    .0YOOOOOYy0.
    .0YYYYYYYy0.
    .0YYY0YYYy0.
    .0YY0y0YYy0.
    .0YYY0YYYy0.
    .0yyyyyyyO0.
    .000000000..
    ............`);
})();

// ---------- The hall's people ----------
(function people() {
  // Cosmo the owl, the casino's host, in a bow tie (frame 1 blinks)
  const owl = (blink) => {
    let r = sculpt(16, 19, [
      { e: [8, 11.5, 7, 7.5], ramp: ['n', 'N', 'O', 'Y'] },
      { e: [8, 14.5, 4.5, 4], ramp: ['e', 'a', 'A', 'A'], noLine: true, hi: false },
    ]);
    r = stamp(r, 2, 1, `
      .0..........0.
      0N0........0N0
      0NN0......0NN0`);
    r = stamp(r, 3, 6, blink ? `
      .AAAAAAAAA.
      AAAAAAAAAAA
      A000AAA000A
      AAAAAyAAAAA
      .AAAAyAAAA.` : `
      .AAAAAAAAA.
      AwwwAAAwwwA
      Aw00wAw00wA
      Aw0wwywwY0A
      .AwwAyAwwA.`);
    r = stamp(r, 5, 12, `
      r0.0r
      rr0rR
      r0.0r`);
    r = stamp(r, 4, 17, `
      .y.y..y.y`);
    return r;
  };
  def('cz_owl_0', owl(false));
  def('cz_owl_1', owl(true));
  // the Cashier, a bunny in a green dealer's visor (seen above the booth's counter)
  const bun = (f) => autoOutline(parseArt('czbun', `
    ..............
    ...LL...LL....
    ...Lq...Lq....
    ...Lq...Lq....
    ...LL...LL....
    ..GhhhhhhhG...
    .GGGGGGGGGGg..
    ..LLLLLLLLl...
    ..LL0LLL0Ll...
    ..LLLLqLLLl...
    ..qLL0.0LLq...
    ...lLLLLLl....
    ..rLLLLLLLr...
    .wwrrrLrrrww..
    .wwwwrwrwwww..
    .wwwwwwwwwww..`.split('\n').map(s => s.trim()).filter(Boolean).map((s, j) => f && j >= 1 && j <= 4 ? (j === 1 ? '..LL.....LL...' : j === 2 ? '..Lq.....Lq...' : j === 3 ? '...Lq...Lq....' : '...LL...LL....') : s)));
  def('cz_bunny_0', bun(0));
  def('cz_bunny_1', bun(1));
})();

// ---------- The hall's furniture ----------
(function hall() {
  // a slot cabinet (20x36): marquee, bezel and reels, the button deck, a coin tray, a lever
  const cab = (off) => {
    const g = grid(20, 36);
    // body
    czBox(g, 0, 4, 18, 32, 'p', 'P', '1');
    // marquee: a rounded lit crown
    czBox(g, 1, 0, 16, 7, off ? '1' : 'y', off ? '2' : 'Y', off ? '0' : 'O', true);
    if (!off) g.px(8, 2, 'w').px(9, 2, 'w').px(8, 3, 'r').px(9, 3, 'r').px(7, 3, 'w').px(10, 3, 'o').px(8, 4, 'o').px(9, 4, 'o');
    else g.px(8, 3, '2').px(9, 3, '2');
    // bezel and screen
    czBox(g, 2, 8, 14, 12, 'O', 'Y', 'n');
    for (let j = 10; j < 18; j++) for (let i = 4; i < 14; i++) g.px(i, j, off ? '0' : (i === 7 || i === 10) ? '0' : j === 10 ? 'w' : j === 17 ? 'l' : 'L');
    if (!off) {
      // three little symbols on the payline, and the payline itself
      g.px(5, 13, 'r').px(5, 14, 'r').px(6, 13, 'r').px(6, 14, 'r');
      g.px(8, 13, 'y').px(9, 13, 'y').px(8, 14, 'y').px(9, 14, 'O');
      g.px(11, 13, 'B').px(12, 13, 'c').px(11, 14, 'b').px(12, 14, 'B');
      g.px(3, 14, 'r').px(14, 14, 'r');
    }
    // button deck, sticking out a little
    czBox(g, 1, 20, 16, 5, 'q', 'w', 'p');
    g.px(4, 22, off ? '2' : 'r').px(5, 22, off ? '2' : 'R').px(8, 22, off ? '2' : 'y').px(9, 22, off ? '2' : 'Y').px(12, 22, off ? '2' : 'G').px(13, 22, off ? '2' : 'h');
    // coin tray
    czBox(g, 4, 28, 10, 4, 'n', 'N', 'u');
    g.px(6, 29, 'y').px(10, 29, 'y');
    // lever
    g.px(18, 14, '0').px(19, 14, '0').px(18, 15, '0').px(19, 15, '0');
    for (let j = 6; j < 14; j++) g.px(18, j, '0').px(19, j, j === 6 ? '0' : 'l');
    g.px(18, 4, '0').px(19, 4, '0').px(18, 5, 'r').px(19, 5, 'R').px(18, 3, '0').px(19, 3, '0').px(20, 4, '0');
    return autoOutline(g.rows());
  };
  const onRows = cab(false), offRows = cab(true);
  const L = { classic: {}, meadow: { p: 'G', P: 'h', q: 'H', '1': 'g' }, beach: { p: 'B', P: 'c', q: 'C', '1': 'b' }, crystal: { p: '2', P: '3', q: '4', '1': '1' }, mint: { p: 't', P: 'T', q: 'C', '1': 'g' }, gold: { p: 'o', P: 'y', q: 'Y', '1': 'n' } };
  for (const k in L) { def('cz_cab_' + k, onRows, { legend: L[k] }); def('cz_cab_' + k + '_off', offRows, { legend: L[k] }); }

  // video poker (18x30): a slant-top machine with five cards on its screen
  const vp = grid(18, 30);
  czBox(vp, 0, 3, 18, 27, 'b', 'B', '1');
  czBox(vp, 1, 0, 16, 5, 'c', 'C', 'B', true);
  czBox(vp, 2, 6, 14, 10, 'O', 'Y', 'n');
  for (let j = 8; j < 14; j++) for (let i = 4; i < 14; i++) vp.px(i, j, 'z');
  for (let k = 0; k < 5; k++) for (let j = 9; j < 13; j++) vp.px(4 + k * 2, j, j === 9 ? 'w' : 'L');
  vp.px(4, 11, 'r').px(8, 11, 'r').px(10, 10, '0');
  czBox(vp, 1, 17, 16, 4, 'C', 'w', 'c');
  for (let k = 0; k < 5; k++) vp.px(3 + k * 3, 18, 'y');
  czBox(vp, 5, 23, 8, 4, 'n', 'N', 'u');
  def('cz_vp', vp.rows());

  // the Cashier's booth (40x26): a striped awning on gold posts over a wooden counter
  const bo = grid(40, 26);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 40; i++) bo.px(i, j, j === 0 ? '0' : Math.floor(i / 4) % 2 ? (j === 1 ? 'w' : 'L') : (j === 1 ? 'R' : 'r'));
  for (let i = 0; i < 40; i++) { const s = i % 4; bo.px(i, 5, s === 0 || s === 3 ? '0' : Math.floor(i / 4) % 2 ? 'l' : 'p'); if (s === 1 || s === 2) bo.px(i, 6, '0'); }
  bo.px(0, 1, '0').px(0, 2, '0').px(0, 3, '0').px(0, 4, '0').px(39, 1, '0').px(39, 2, '0').px(39, 3, '0').px(39, 4, '0');
  for (let j = 6; j < 14; j++) { bo.px(1, j, '0').px(2, j, 'Y').px(3, j, 'O').px(4, j, '0'); bo.px(35, j, '0').px(36, j, 'Y').px(37, j, 'O').px(38, j, '0'); }
  czBox(bo, 0, 13, 40, 4, 'N', 'a', 'e');
  czBox(bo, 1, 16, 38, 10, 'n', 'N', 'u');
  for (let i = 6; i < 34; i += 7) for (let j = 18; j < 24; j++) bo.px(i, j, j === 18 ? 'u' : 'u');
  const st = parseArt('cstack', `
    .000.
    0RwR0
    0rrr0
    0Ghg0
    0ggg0`);
  st.forEach((r, j) => r.split('').forEach((c, i) => { if (c !== '.') bo.px(8 + i, 8 + j, c); if (c !== '.') bo.px(27 + i, 8 + j, c === 'R' ? 'L' : c === 'r' ? 'm' : c); }));
  def('cz_booth', bo.rows());

  // the Prize Counter (40x22): a glass case full of little prizes
  const pc = grid(40, 22);
  czBox(pc, 0, 0, 40, 4, 'y', 'Y', 'O');
  czBox(pc, 1, 3, 38, 12, 'c', 'C', 'B');
  for (let i = 3; i < 37; i++) pc.px(i, 9, 'b');
  // prizes on two shelves: a chip, a heart, a star, a gem, a bow
  const P = [[5, 'r'], [11, 'y'], [17, 'P'], [23, 'T'], [29, 'O'], [34, 'h']];
  P.forEach(([x, c], k) => { const y = k % 2 ? 11 : 5; pc.px(x, y, c).px(x + 1, y, c).px(x, y + 1, c).px(x + 1, y + 1, '0'); pc.px(x + 2, y + 5 - (k % 2) * 6, 'w'); });
  czBox(pc, 0, 14, 40, 8, 'n', 'N', 'u');
  for (let i = 4; i < 36; i += 8) pc.px(i, 17, 'y').px(i + 1, 17, 'O').px(i, 18, 'O');
  def('cz_counter', pc.rows());

  // the perch Cosmo stands on (14x10)
  def('cz_perch', `
    00000000000000
    0YyyyyyyyyyyO0
    00000yO000000.
    ....0yO0......
    ....0yO0......
    ....0yO0......
    ...0yyOO0.....
    ..0YyyyyO0....
    ..0OOOOOn0....
    ...000000.....`.split('\n').map(s => s.trim()).filter(Boolean).map(s => s.padEnd(14, '.')));

  // the blackjack table (56x26): a felt half-moon with a wooden rail and three spots
  const bj = grid(56, 26), cx = 27.5, rx = 27.5, ry = 19.5;
  bj.fill((x, y) => {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5) / ry, d = Math.hypot(nx, ny);
    if (y < 20 && d <= 1) {
      if (d > 0.97 || y === 0) return '0';
      if (d > 0.84) return ny < 0.55 && nx < 0 ? 'N' : d > 0.93 ? 'n' : 'N';
      if (d > 0.815) return '0';
      if (Math.abs(d - 0.55) < 0.03) return 'Y';
      return 'z';
    }
    // the table's front edge, then the apron
    const top = ry * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / rx) ** 2)) - 0.5;
    if (y > top && y <= top + 5 && Math.abs(x + 0.5 - cx) < rx - 0.5) return y > top + 4 ? '0' : y < top + 2 ? 'n' : 'u';
    return null;
  });
  // the dealer's chip rack and three betting spots
  for (let i = 18; i < 38; i++) bj.px(i, 1, '0').px(i, 2, ['r', 'G', 'L', '3'][Math.floor((i - 18) / 5)]).px(i, 3, '0');
  bj.px(17, 2, '0').px(38, 2, '0');
  for (const [x, y] of [[12, 12], [26, 15], [40, 12]]) { for (let i = 0; i < 4; i++) bj.px(x + i, y, 'h').px(x + i, y + 3, 'h'); for (let j = 1; j < 3; j++) bj.px(x, y + j, 'h').px(x + 3, y + j, 'h'); }
  def('cz_bj', bj.rows());

  // the roulette table (64x26): the wheel's wooden bowl on the left, the betting grid right
  const ro = grid(64, 26);
  czBox(ro, 0, 0, 64, 21, 'z', 'G', 'g', true);
  for (let x = 0; x < 64; x++) for (let j = 21; j < 26; j++) ro.px(x, j, x === 0 || x === 63 || j === 25 ? '0' : j < 23 ? 'n' : 'u');
  for (let x = 2; x < 62; x++) ro.px(x, 21, 'N');
  ro.px(0, 21, '0').px(63, 21, '0');
  ro.fill((x, y) => { const d = Math.hypot(x + 0.5 - 12.5, y + 0.5 - 10.5); return d < 11 ? (d > 10 ? '0' : d > 9 ? 'N' : d > 8 ? 'n' : null) : null; });
  // the grid: green zero, then red and black cells, outlined in white
  for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) {
    const n = c * 3 + 3 - r, x = 29 + c * 2.5 | 0, y = 4 + r * 4;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) ro.px(x + i, y + j, ROU_RED.includes(n) ? 'r' : 'x');
  }
  for (let j = 4; j < 15; j++) ro.px(27, j, 'G').px(26, j, 'G');
  for (let x = 26; x < 60; x++) ro.px(x, 3, 'L').px(x, 15, 'L');
  for (let x = 29; x < 59; x += 10) for (let i = 0; i < 9; i++) ro.px(x + i, 17, 'L');
  def('cz_rou', ro.rows());

  // the scratch-card kiosk (26x30): an orange box with a fan of cards on top
  const ks = grid(26, 30);
  for (const [dx, c1, c2] of [[3, 'q', 'P'], [9, 'Y', 'y'], [15, 'C', 'c']]) czBox(ks, dx, 0, 8, 10, c1, 'w', c2);
  ks.px(6, 4, 'y').px(7, 4, 'y').px(12, 4, 'O').px(13, 4, 'O').px(18, 4, 'B').px(19, 4, 'B');
  czBox(ks, 0, 8, 26, 22, 'o', 'O', 'n');
  czBox(ks, 3, 11, 20, 8, 'Y', 'w', 'y');
  ks.px(12, 13, 'o').px(13, 13, 'o').px(11, 14, 'o').px(12, 14, 'r').px(13, 14, 'r').px(14, 14, 'o').px(12, 15, 'o').px(13, 15, 'o').px(11, 16, 'o').px(14, 16, 'o');
  for (let i = 7; i < 19; i++) ks.px(i, 23, '0');
  for (let i = 8; i < 18; i++) ks.px(i, 24, 'n');
  def('cz_kiosk', ks.rows());

  // the VIP rope (44x26): two brass posts with a sagging velvet rope, a gold star sign
  const rp = grid(44, 26);
  for (const x of [0, 38]) {
    czBox(rp, x + 1, 6, 4, 18, 'y', 'Y', 'O');
    czBox(rp, x, 3, 6, 5, 'y', 'Y', 'O', true);
    czBox(rp, x, 22, 6, 4, 'O', 'y', 'n');
  }
  for (let i = 5; i < 39; i++) { const s = Math.round(4 * Math.sin((i - 5) / 33 * Math.PI)); rp.px(i, 7 + s, '0').px(i, 8 + s, 'r').px(i, 9 + s, 'p').px(i, 10 + s, '0'); }
  def('cz_rope', rp.rows());

  // the VIP lounge's Sic Bo table (44x30): a round felt top on a wooden rim, and the glass
  // dome with its three dice in the middle
  const sb = grid(44, 30), scx = 21.5, scy = 18.5;
  sb.fill((x, y) => {
    const nx = (x + 0.5 - scx) / 21.5, ny = (y + 0.5 - scy) / 9.5, d = Math.hypot(nx, ny);
    if (d <= 1) {
      if (d > 0.93) return '0';
      if (d > 0.78) return ny < 0 && nx < 0.3 ? 'N' : 'n';
      if (d > 0.74) return '0';
      return Math.abs(d - 0.5) < 0.04 ? 'Y' : 'z';
    }
    // the rim's front edge, then the apron down to the floor
    const top = scy + 9.5 * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - scx) / 21.5) ** 2)) - 0.5;
    if (y > top && y <= top + 4 && Math.abs(x + 0.5 - scx) < 21) return y > top + 3 ? '0' : y < top + 2 ? 'n' : 'u';
    return null;
  });
  // the dome: a glass bubble (pale outline, a white glint) over three dice
  for (let y = 0; y < 30; y++) for (let x = 0; x < 44; x++) {
    const d = Math.hypot(x + 0.5 - scx, (y + 0.5 - 12) * 1.15);
    if (d < 9.5 && d >= 8.5 && y < 18) sb.px(x, y, y < 8 ? 'C' : 'c');
  }
  sb.px(16, 6, 'w').px(17, 5, 'w').px(15, 8, 'w');
  for (const [dx, dy, pips] of [[12, 15, [[1, 1]]], [19, 12, [[0, 0], [2, 2]]], [26, 15, [[0, 0], [1, 1], [2, 2]]]]) {
    czBox(sb, dx, dy, 5, 5, 'w', 'w', 'l');
    for (const [a, b] of pips) sb.px(dx + 1 + a, dy + 1 + b, a === 1 && b === 1 && pips.length === 1 ? 'r' : '0');
  }
  def('cz_sic', sb.rows());

  // the lounge's Hold'em table (52x26): a long oval of felt on a wooden rail, the five shared
  // cards face down in the middle and a little stack of chips at each seat
  const pk = grid(52, 26), pcx = 25.5, pcy = 10.5;
  const pkD = (x, y) => { const dx = Math.max(0, Math.abs(x + 0.5 - pcx) - 12) / 13.5, dy = (y + 0.5 - pcy) / 10.5; return Math.hypot(dx, dy); };
  pk.fill((x, y) => {
    const d = pkD(x, y);
    if (d <= 1) {
      if (d > 0.93) return '0';
      if (d > 0.72) return y < pcy && x < pcx + 6 ? 'N' : 'n';
      if (d > 0.66) return '0';
      return Math.abs(d - 0.42) < 0.05 ? 'Y' : 'z';
    }
    // the rail's front edge, then the apron
    const bot = (() => { let b = -1; for (let j = 0; j < 26; j++) if (pkD(x, j) <= 1) b = j; return b; })();
    if (bot >= 0 && y > bot && y <= bot + 4) return y > bot + 3 || x === 0 || x === 51 ? '0' : y < bot + 2 ? 'n' : 'u';
    return null;
  });
  for (let i = 0; i < 5; i++) czBox(pk, 14 + i * 5, 8, 4, 5, '2', '3', '1');
  for (const [x, y, c] of [[8, 9, 'r'], [42, 9, 'B'], [25, 3, 'G']]) { pk.px(x, y, '0').px(x + 1, y, '0').px(x, y + 1, c).px(x + 1, y + 1, c).px(x, y + 2, 'w').px(x + 1, y + 2, 'w').px(x, y + 3, '0').px(x + 1, y + 3, '0'); }
  def('cz_poker', pk.rows());

  def('cz_lock', `
    ..000..
    .0lll0.
    .0l.m0.
    0000000
    0yYYyO0
    0yY0yO0
    0yy0yO0
    0OOOOn0
    .00000.`);

  // the Big Wheel's stand (24x18) and its pointer (7x6)
  const wb = grid(24, 18);
  czBox(wb, 9, 0, 6, 14, 'y', 'Y', 'O');
  czBox(wb, 2, 12, 20, 6, 'O', 'y', 'n', true);
  wb.px(11, 4, 'w').px(11, 5, 'Y');
  def('cz_wheelbase', wb.rows());
  def('cz_pointer', `
    0000000
    0rRRRr0
    .0rRr0.
    .0rrr0.
    ..0r0..
    ...0...`);
  // a wall sconce (7x9) and the door mat (24x6)
  def('cz_lamp', `
    ..0Y0..
    .0YwY0.
    .0yYy0.
    0yyYyO0
    0OyyyO0
    .00000.
    ..0O0..
    .0yyO0.
    .00000.`);
  def('cz_mat', grid(24, 6).fill((x, y) => (y === 0 || y === 5 || x === 0 || x === 23) ? '0' : (y === 1 || x === 1) ? 'R' : (y === 4 || x === 22) ? 'p' : ((x + y) % 4 === 0 ? 'y' : 'r')).rows());
})();

// ---------- Playing cards ----------
// Four suits: Star and Moon (dark), Heart and Gem (red).
const SUIT_ART = [`
  ...0...
  ..0y0..
  00yYy00
  0yYYYy0
  .0yyy0.
  .0y0y0.
  .00.00.`, `
  ..000..
  .0bB00.
  0bB0...
  0bB0...
  0bbB0..
  .0bbB00
  ..0000.`, `
  .00.00.
  0rR0Rr0
  0rRRRr0
  0rrrrr0
  .0rrr0.
  ..0r0..
  ...0...`, `
  .00000.
  0PqqqP0
  0pPqPp0
  .0pPp0.
  ..0p0..
  ...0...
  .......`];
const SUIT_SMALL = [`
  ..y..
  yyYyy
  .yyy.
  .y.y.
  .....`, `
  .bb..
  bB...
  bB...
  .bbb.
  .....`, `
  rr.rr
  rRrrr
  .rrr.
  ..r..
  .....`, `
  pPqPp
  .pPp.
  ..p..
  .....
  .....`];
(function cards() {
  SUIT_ART.forEach((a, i) => def('su_' + i, a));
  SUIT_SMALL.forEach((a, i) => def('sus_' + i, a));
  const W = 24, H = 32;
  const face = grid(W, H).fill((x, y) => {
    const e = x === 0 || y === 0 || x === W - 1 || y === H - 1, c = (x < 1 || x > W - 2) && (y < 2 || y > H - 3) || (x < 2 || x > W - 3) && (y < 1 || y > H - 2);
    if (c) return (x === 0 || x === W - 1) && (y === 0 || y === H - 1) ? null : (x <= 1 && y <= 1) || (x >= W - 2 && y <= 1) || (x <= 1 && y >= H - 2) || (x >= W - 2 && y >= H - 2) ? ((x === 1 || x === W - 2) && (y === 1 || y === H - 2) ? '0' : null) : '0';
    if (e) return '0';
    if (y === 1 || x === 1) return 'w';
    if (y === H - 2 || x === W - 2) return 'l';
    return 'L';
  }).rows();
  def('cd_front', face);
  // card backs: a patterned field inside a white border
  const back = (fn) => face.map((r, y) => r.split('').map((c, x) => (c === 'L' || c === 'l' || c === 'w') && x > 2 && y > 2 && x < W - 3 && y < H - 3 ? fn(x - 3, y - 3) : c).join(''));
  const BACKS = {
    star: (x, y) => { const s = _starAt(x, y, 6); return s || ((x + y) % 2 ? '2' : '1'); },
    moon: (x, y) => { const u = x % 6, v = y % 8; return (u === 2 && v >= 2 && v <= 4) || (u === 3 && (v === 1 || v === 5)) ? 'Y' : ((x + y) % 2 ? 'B' : 'b'); },
    frog: (x, y) => { const u = x % 6, v = (y + (Math.floor(x / 6) % 2) * 3) % 6; return (u === 1 || u === 4) && v === 1 ? 'w' : (u >= 1 && u <= 4 && v >= 2 && v <= 3) ? 'h' : ((x + y) % 2 ? 'G' : 'g'); },
    gold: (x, y) => { const s = _starAt(x + 3, y + 3, 9); return s === 'y' ? 'w' : s ? 'Y' : ((x ^ y) & 1 ? 'y' : 'O'); },
    // the Hold'em winner's back: plum velvet in a gold diamond lattice, a jewel in each diamond
    royal: (x, y) => { const u = (x + y) % 6, v = (x - y + 60) % 6; return u === 0 || v === 0 ? 'y' : u === 3 && v === 3 ? 'P' : (x + y) % 2 ? 'V' : 'v'; },
  };
  for (const k in BACKS) def('cd_back_' + k, back(BACKS[k]));
  // the flip: half-width back, a thin edge, half-width face
  const half = (rows) => rows.map(r => { let s = ''; for (let x = 0; x < W; x += 2) s += r[x === 0 ? 0 : x === W - 2 ? W - 1 : x]; return s; });
  for (const k in BACKS) def('cd_half_' + k, half(back(BACKS[k])));
  def('cd_halff', half(face));
  def('cd_edge', face.map((r, y) => y === 0 || y === H - 1 ? '.00.' : '0wl0'));
})();
function _starAt(x, y, s) { const u = ((x % s) + s) % s, v = ((y % s) + s) % s, c = s >> 1; return (u === c && v === c) ? 'y' : (Math.abs(u - c) + Math.abs(v - c) === 1) ? 'O' : null; }

// ---------- Dice ----------
(function dice() {
  const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  for (let n = 1; n <= 6; n++) {
    const g = grid(13, 13);
    czBox(g, 0, 0, 13, 13, 'L', 'w', 'l', true);
    for (const [i, j] of PIPS[n]) { const x = 3 + i * 3, y = 3 + j * 3, c = n === 1 ? 'r' : '0'; g.px(x, y, c).px(x + 1, y, c).px(x, y + 1, c).px(x + 1, y + 1, n === 1 ? 'p' : '1'); }
    def('cz_die_' + n, g.rows());
  }
})();

// ---------- Prize Counter goods ----------
(function prizes() {
  // the Lucky Cat pet waves its paw
  const cat = (up) => autoOutline(parseArt('cat', `
    ............
    ..L....L....
    ..LL..LL.${up ? 'L' : '.'}..
    ..LqLLqL.${up ? 'L' : '.'}..
    .LLLLLLLLL..
    .LL0LL0LLl..
    .LLLLqLLLl..
    ..LLLLLLl${up ? '.' : 'L'}..
    ..rryrrrl${up ? '.' : 'l'}..
    ..LLLLLLl...
    ..ll.ll.l...`));
  def('pet_cat_0', cat(false), { flip: true });
  def('pet_cat_1', cat(true), { flip: true });
  // decor for the Garden: a little slot machine and a coin fountain
  const ms = grid(12, 20);
  czBox(ms, 0, 3, 12, 17, 'p', 'P', '1');
  czBox(ms, 1, 0, 10, 5, 'y', 'Y', 'O', true);
  czBox(ms, 2, 6, 8, 6, 'O', 'Y', 'n');
  ms.px(4, 8, 'r').px(5, 8, 'y').px(6, 8, 'B').px(4, 9, 'r').px(5, 9, 'y').px(6, 9, 'B');
  czBox(ms, 2, 14, 8, 4, 'n', 'N', 'u');
  ms.px(4, 15, 'y').px(7, 15, 'y');
  def('cz_minislot', ms.rows());
  const fo = grid(26, 22);
  fo.fill((x, y) => {
    const d = Math.hypot((x + 0.5 - 13) / 12.5, (y + 0.5 - 15) / 6.5);
    if (d <= 1) return d > 0.9 ? '0' : d > 0.72 ? (y < 14 ? 'l' : 'm') : (y < 13 ? 'c' : 'B');
    return null;
  });
  czBox(fo, 10, 3, 6, 12, 'y', 'Y', 'O');
  czBox(fo, 8, 0, 10, 5, 'y', 'Y', 'O', true);
  fo.px(12, 1, 'w').px(13, 2, 'o').px(3, 14, 'y').px(20, 16, 'y').px(7, 17, 'O').px(17, 13, 'Y').px(6, 13, 'C').px(19, 14, 'C');
  def('cz_fount', fo.rows());
})();

// ---------- Slot symbols (16x16, drawn from shapes, lit from the top left) ----------
(function symbols() {
  // a 4-tone ramp by how much a pixel faces the top-left light (nx, ny: -1..1 from centre)
  const lit = (nx, ny, ramp) => { const v = -0.6 * nx - 0.7 * ny; return v > 0.55 ? ramp[3] : v > 0.1 ? ramp[2] : v > -0.4 ? ramp[1] : ramp[0]; };
  const inStar = (x, y, cx, cy, R, r) => {
    // a point is inside a five-pointed star if it is inside the polygon of its ten corners
    const P = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r : R; P.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]); }
    let c = false;
    for (let i = 0, j = 9; i < 10; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
    return c;
  };
  const make = (name, fn) => def(name, autoOutline(grid(16, 16).fill((x, y) => fn(x + 0.5, y + 0.5)).rows()));
  make('sy_star', (x, y) => inStar(x, y, 8, 8.6, 7.4, 3.1) ? lit((x - 8) / 7, (y - 8.6) / 7, 'OyyY') : null);
  make('sy_moon', (x, y) => {
    const a = Math.hypot(x - 7.6, y - 8) <= 6.6, b = Math.hypot(x - 10.6, y - 6.2) <= 5.4;
    return a && !b ? lit((x - 7.6) / 6.6, (y - 8) / 6.6, 'eaAY') : null;
  });
  make('sy_heart', (x, y) => {
    const u = (x - 8) / 6.4, v = -(y - 8.4) / 6.4, q = u * u + v * v - 0.55;
    return q * q * q - u * u * v * v * v <= 0 ? lit(u, -v, 'prRq') : null;
  });
  make('sy_gem', (x, y) => {
    // a cut gem: a flat top table, a pointed bottom, facets in three tones
    if (y < 3 || y > 14) return null;
    if (y < 7) { const hw = 3.2 + (y - 3); if (Math.abs(x - 8) > hw) return null; return y < 4 ? 'C' : x < 6 ? 'C' : x > 10 ? 'B' : 'c'; }
    const hw = 7.2 - (y - 7) * 0.95;
    if (Math.abs(x - 8) > hw) return null;
    return x < 6 ? 'c' : x > 10 ? 'b' : 'B';
  });
  make('sy_coin', (x, y) => {
    const d = Math.hypot(x - 8, y - 8);
    if (d > 6.6) return null;
    if (d > 5.4) return lit((x - 8) / 6.6, (y - 8) / 6.6, 'nOyY');
    return inStar(x, y, 8, 8.3, 4.2, 1.8) ? 'Y' : 'y';
  });
  // the sun of the Sunny scratch card: a lit disc and eight short rays, a gap between
  make('sy_sun', (x, y) => {
    const dx = x - 8, dy = y - 8, d = Math.hypot(dx, dy);
    if (d <= 4.4) return lit(dx / 4.4, dy / 4.4, 'oOyY');
    const a = Math.atan2(dy, dx), k = Math.round(a / (Math.PI / 4)) * (Math.PI / 4);
    return d > 5.5 && d <= 7.5 && d * Math.abs(Math.sin(a - k)) < 0.8 ? (dx + dy < 0 ? 'y' : 'O') : null;
  });
  make('sy_bell', (x, y) => {
    if (y > 13.5) return Math.abs(x - 8) < 1.5 ? 'O' : null;
    if (y < 2.5) return Math.abs(x - 8) < 1 ? 'O' : null;
    const hw = y > 11.5 ? 6.4 : 2.2 + (y - 2.5) * 0.44;
    return Math.abs(x - 8) <= hw ? (y > 11.5 ? 'O' : lit((x - 8) / hw, (y - 8) / 6, 'nOyY')) : null;
  });
})();
