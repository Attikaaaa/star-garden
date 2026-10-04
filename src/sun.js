'use strict';
// ---------- The Sun Temple (Mirrors and Plates) ----------
// Mirrors (layout '7 9 3 1', level.js) turn shots and bullets by 90 degrees, and a shot that meets
// a mirror's back turns it a quarter step. Sun-glyph plates (layout 'o', T_PLATE) light up when a
// hero steps on them and stay lit; when every plate in a room is lit, its gates (layout 'g') open
// on an alcove with a little treasure. Quicksand (layout 'z', T_QSAND) slows walkers to 40% and
// drags them toward the middle of the patch. All three are tiles, so setTile keeps every screen
// in step.
const QS_SLOW = 0.4, QS_PULL = 26;
const SN_ = (name, art, o) => { // colour pixels only: rows padded to one width, then outlined
  const rows = art.split('\n').map(r => r.trim()).filter(r => r), w = Math.max(...rows.map(r => r.length)), pad = '.'.repeat(w + 2);
  def(name, autoOutline([pad, ...rows.map(r => '.' + r.padEnd(w, '.') + '.'), pad]), o);
};
const tileXY = (i) => [(i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 + 8];

// ---------- Tile art ----------
(function sunTiles() {
  // a plate: a sandstone slab with a sun glyph, dark or lit
  for (const on of [0, 1]) def('plate_' + on, grid(16, 16).fill((x, y) => {
    if (x === 0 || y === 0) return 'A';
    if (x === 15 || y === 15) return 'n';
    if (x === 1 || y === 1 || x === 14 || y === 14) return 'e';
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 2.6) return on ? 'Y' : 'N';
    if (d < 3.6) return on ? 'y' : 'n';
    if ((x === 7 || x === 8 || y === 7 || y === 8) && d < 6) return on ? 'y' : 'n';
    if (Math.abs(x - y) < 1 && d < 5.5 || Math.abs(x + y - 15) < 1 && d < 5.5) return on ? 'O' : 'e';
    return on ? 'T' : 'a';
  }).rows());
  // quicksand: rings of darker sand spiralling in
  def('qsand', grid(16, 16).fill((x, y) => {
    const d = Math.hypot(x - 7.5, y - 7.5), a = Math.atan2(y - 7.5, x - 7.5);
    const k = (d + a * 1.2 + 20) % 4;
    return d < 1.5 ? 'n' : k < 1 ? 'e' : k < 1.6 ? 'N' : 'a';
  }).rows(), { flip: true });
  // the Sun Temple's gate: a sandstone door with a sun disc
  SN_('sgate', `
    nNNNNNNNNNNNNn
    NaaaaaaaaaaaaN
    NaeeeeeeeeeeaN
    NaeTTTTTTTTeaN
    NaeTyyyyyyTeaN
    NaeTyYYYYyTeaN
    NaeTyYwwYyTeaN
    NaeTyYYYYyTeaN
    NaeTyyyyyyTeaN
    NaeTTTTTTTTeaN
    NaeeeeeeeeeeaN
    NaeaaaeaaaeaaN
    NaeaaaeaaaeaaN
    NaeeeeeeeeeeaN
    NnnnnnnnnnnnnN
    nnnnnnnnnnnnnn`);
  // the riddle's glyphs: sun, eye, ankh, bird
  const G = [
    ['.yyy.', 'yYYYy', 'yYwYy', 'yYYYy', '.yyy.'],
    ['.TTT.', 'TwwwT', 'Tw0wT', 'TwwwT', '.TTT.'],
    ['.yy..', 'y..y.', '.yy..', 'yyyy.', '.yy..', '.yy..'],
    ['..TT.', '.TTwT', 'TTTT.', '.TT..', '.T.T.'],
  ];
  G.forEach((rows, i) => SN_('glyph_' + i, rows.join('\n')));
  def('rock_sun', stamp(stamp(sculpt(16, 16, [{ r: [2, 3, 12, 12, 1], ramp: 'neaA' }]), 5, 6, 'TTTTTT\nT....T\nT.yy.T\nT....T\nTTTTTT'), 3, 4, 'A'));
  def('brk_sun', stamp(sculpt(16, 16, [{ r: [5, 1, 6, 3, 1], ramp: 'nNaA' }, { e: [8, 9.5, 6, 5.5], ramp: 'noON' }]), 3, 9, 'TTTTTTTTTT'));
})();
// the gate art in this land (lands.js tileArt draws every special tile)
const _sunTileArt = tileArt;
tileArt = function (room, c, r, t) { return t === T_GATE && G.floor && G.floor.land.id === 'sun' ? 'sgate' : _sunTileArt(room, c, r, t); };

// plates, quicksand and the Sun Beam room's window and altar, baked into the room's static layer
THEMES.sun.paint = function (g, room) {
  for (let i = 0; i < room.tiles.length; i++) {
    const t = room.tiles[i];
    if (t !== T_PLATE && t !== T_PLATEON && t !== T_QSAND) continue;
    const x = (i % COLS) * 16, y = OY + ((i / COLS) | 0) * 16;
    blit(g, S(t === T_QSAND ? 'qsand' : t === T_PLATE ? 'plate_0' : 'plate_1'), x, y, t === T_QSAND ? hash(i, 5, room.seed) & 1 : 0);
    const k = room.glyph && room.glyph.indexOf(i);
    if (k >= 0) { const s = S('glyph_' + k); blit(g, s, x + 8 - (s.w >> 1), y + 8 - (s.h >> 1)); }
  }
};

// ---------- Rooms ----------
LAND_LAYOUTS.sun = {
  // Mirror Hall: a mirror every few steps
  mirror: `......................
    ..e.......ee.......e..
    ...7...9......7...9...
    ......................
    ..e.......ee.......e..
    ......................
    ...1...3......1...3...
    ......................
    ..e.......ee.......e..
    ......................`,
  // Sandfall: quicksand round a pillar
  sandfall: `......................
    ..e................e..
    ......zzzzzzzzzz......
    .....zzzzzzzzzzzz.....
    ..e..zzzz####zzzz..e..
    .....zzzz####zzzz.....
    .....zzzzzzzzzzzz.....
    ......zzzzzzzzzz......
    ..e.......ee.......e..
    ......................`,
  // Plate Gauntlet: light both plates and the alcoves open
  plates: `......................
    ..e.......ee.......e..
    ......................
    .o........##........o.
    ..e................e..
    ......................
    ####..............####
    ...#......ee......#...
    ...g..............g...
    ...#..............#...`,
  // Obelisk Court: tall stones in a square
  obelisk: `......................
    ..e.......ee.......e..
    ....#............#....
    ....#............#....
    ..e......#..#......e..
    .........#..#.........
    ....#............#....
    ....#............#....
    ..e.......ee.......e..
    ......................`,
  // Oasis: a pool between palms
  oasis: `......................
    ..e................e..
    .......#......#.......
    ........~~~~~~........
    ..e....~~~~~~~~....e..
    .......~~~~~~~~.......
    ........~~~~~~........
    .......#......#.......
    ..e................e..
    ......................`,
  // Scarab Run: rows of clay pots for the rollers to smash
  scarab: `......................
    ..e.......ee.......e..
    ..bbb....bbbb....bbb..
    ......................
    ......................
    ......................
    ......................
    ..bbb....bbbb....bbb..
    ..e.......ee.......e..
    ......................`,
};
for (const k in LAND_LAYOUTS.sun) LAND_LAYOUTS.sun[k] = LAND_LAYOUTS.sun[k].split('\n').map(r => r.trim());
Object.assign(LAY_RULE, {
  mirror: { pool: [['priest', 3], ['mummy', 2], ['sandcat', 1]] },
  scarab: { pool: [['scarab', 4], ['sandcat', 1]] },
  sandfall: { pool: [['sandcat', 2], ['mummy', 2], ['canopic', 1]] },
  plates: { pool: [['scarab', 2], ['priest', 1], ['canopic', 2]] },
});
// the Sphinx's plates (boss room), the Guardian's mirrors (warden room), the Sun Beam puzzle
const SPHINX_PLATES = [[7, 6], [16, 6], [7, 10], [16, 10]].map(([c, r]) => r * COLS + c);
const GUARD_MIRRORS = [[6, 4, 2], [17, 4, 3], [6, 10, 1], [17, 10, 0]];
const BEAM_START = [1, 9], BEAM_ALTAR = 10 * COLS + 17;
const BEAM_MIRRORS = [[6, 9, 1], [6, 3, 3], [17, 3, 0]]; // solved: 0, 2, 3

LAND_MECH.sun = {
  // plates and quicksand from the layout (mirrored with the room), and each special room's own tiles
  build(room) {
    const t = room.tiles;
    if (room.type === 'boss') { // the plates, and a dais behind the Sphinx so nobody slips round her back
      for (const i of SPHINX_PLATES) t[i] = T_PLATE;
      for (let c = 10; c <= 13; c++) t[2 * COLS + c] = T_ROCK;
      room.glyph = SPHINX_PLATES; return;
    }
    if (room.type === 'warden') { for (const [c, r, m] of GUARD_MIRRORS) t[r * COLS + c] = T_MIRROR + m; return; }
    if (room.type === 'sunbeam') {
      for (const [c, r, m] of BEAM_MIRRORS) t[r * COLS + c] = T_MIRROR + m;
      for (const [c, r] of [[3, 4], [20, 4], [11, 7], [12, 7]]) t[r * COLS + c] = T_ROCK;
      return;
    }
    const L = room.lay && LAND_LAYOUTS.sun[room.lay];
    if (!L) return;
    const [fx, fy] = room.flip || [false, false];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) {
      const ch = L[fy ? 9 - y : y][fx ? 21 - x : x], i = (y + 2) * COLS + x + 1;
      if (ch === 'o') t[i] = T_PLATE; else if (ch === 'z') t[i] = T_QSAND;
    }
  },
  ground: true, // quicksand drags who stands in it, not shots
  drift(room, x, y, out) {
    const i = Math.floor((y - 1 - OY) / 16) * COLS + Math.floor(x / 16);
    if (room.tiles[i] !== T_QSAND) return;
    // toward the middle of the patch: the average of the quicksand round this tile
    let sx = 0, sy = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const j = i + dy * COLS + dx;
      if (room.tiles[j] === T_QSAND) { sx += dx; sy += dy; n++; }
    }
    const [cx, cy] = tileXY(i), tx = cx + sx / n * 16, ty = cy + 4 + sy / n * 16, d = Math.hypot(tx - x, ty - y);
    if (d > 2) { out.cx += (tx - x) / d * QS_PULL; out.cy += (ty - y) / d * QS_PULL; }
  },
  slow(room, e) {
    if (e.sglass) return 1;
    return room.tiles[Math.floor((e.y - 1 - OY) / 16) * COLS + Math.floor(e.x / 16)] === T_QSAND ? QS_SLOW : 1;
  },
  // host / solo: plates light under heroes (and under Scarab Charm shots), gates open, a Golden Scarab now and then
  update(dt, room) {
    if (room.type === 'boss') return; // the Sphinx runs her own plates
    if (room.type === 'sunbeam') { beamUpdate(room); return; }
    let left = 0, lit = false;
    for (let i = 0; i < room.tiles.length; i++) {
      if (room.tiles[i] !== T_PLATE) continue;
      const [x, y] = tileXY(i);
      const on = G.players.some(p => alive(p) && Math.abs(p.x - x) < 8 && Math.abs(p.y - 4 - y) < 8) ||
        SHOTS.some(s => s.life > 0 && s.own && s.own.scharm && Math.abs(s.x - x) < 8 && Math.abs(s.y + 4 - y) < 8);
      if (on) { setTile(room, i % COLS, (i / COLS) | 0, T_PLATEON); burst(x, y, 8, ['y', 'Y', 'T'], 50, 0.4, { g: -40 }); Audio_.sfx('bell' + (i % 4)); lit = true; }
      else left++;
    }
    if (lit && !left) openGates(room);
    if (room.gs === undefined) room.gs = room.type === 'normal' && !room.cleared && !G.first && grand() < 0.2 ? grnd(4, 8) : 0;
    if (room.gs > 0 && G.enemies.length && (room.gs -= dt) <= 0) {
      room.gs = 0;
      spawnEnemy('gscarab', grand() < 0.5 ? 40 : VW - 40, OY + 120, { elite: true });
      toast('A GOLDEN SCARAB! CATCH IT!');
    }
  },
  drawLayer(ox, oy, room, layer) {
    if (layer === 0) { if (room.type === 'sunbeam') beamDraw(ox, oy, room); return; }
    if (layer !== 1) return;
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (e.type === 'scarab' && e.spawnT <= 0) { const [bx, by] = scarabBall(e), s = S('sball_' + (Math.floor(e.anim * 8) % 2)); shadow(ox + bx, oy + by, 8); drawS(s, ox + bx - (s.w >> 1), oy + by - s.h + 1); }
      if (e.type === 'mummy' && e.ext > 2) wrapDraw(e, ox, oy);
      if (e.type === 'pharaoh' && e.dk) { const s = S('sdisc_' + (Math.floor(G.time * 10) % 2)); shadow(ox + e.dk[0], oy + e.dk[1] + 10, 10); drawS(s, Math.round(ox + e.dk[0]) - (s.w >> 1), Math.round(oy + e.dk[1]) - (s.h >> 1)); }
      if (e.type === 'sunguard' && e.state === 'turn' && Math.floor(G.time * 12) % 2) for (let i = 0; i < room.tiles.length; i++) {
        const t = room.tiles[i];
        if (t >= T_MIRROR && t <= T_MIRROR + 3) { const [x, y] = tileXY(i); drawS(S('sparkle_c'), ox + x - 1, oy + y - 14); }
      }
    }
  },
};
// every plate lit: the gates swing open on their alcoves
function openGates(room) {
  let any = false;
  for (let i = 0; i < room.tiles.length; i++) {
    if (room.tiles[i] !== T_GATE) continue;
    const c = i % COLS, r = (i / COLS) | 0, [x, y] = tileXY(i);
    setTile(room, c, r, T_FLOOR); dust(x, y + 4, 8, 16); any = true;
    const ax = x + (x < 192 ? -26 : 26);
    for (let k = 0; k < 4; k++) spawnPickup('coin', ax, y + 4);
    if (grand() < 0.35) spawnPickup('gem', ax, y + 4);
  }
  if (!any) return;
  Audio_.sfx('cgate');
  toast('THE GATES OPEN!');
}

// the temple's own items
Object.assign(ITEMS, {
  bracelet: { name: 'POLISHED BRACELET', desc: 'MIRRORED SHOTS HIT HARDER', land: 'sun', unique: true, apply: p => { p.bracelet = true; } },
  scharm: { name: 'SCARAB CHARM', desc: 'YOUR SHOTS PRESS PLATES TOO', land: 'sun', unique: true, apply: p => { p.scharm = true; } },
  sglass: { name: 'SAND GLASS', desc: 'QUICKSAND DOES NOT SLOW YOU', land: 'sun', unique: true, apply: p => { p.sglass = true; } },
});

// ---------- Foe art ----------
(function sunArt() {
  const o = { flip: true, flash: true, glow: true };
  SN_('scarab_0', `
    ...TTTT....
    ..TCTTtt...
    .TCTTTTtt..
    .TTTyTTtt..
    .tTTyTTtt0.
    ..ttyttt00.
    .0.0..0.0..`, o);
  SN_('scarab_1', `
    ...TTTT....
    ..TCTTtt...
    .TCTTTTtt..
    .TTTyTTtt..
    .tTTyTTtt0.
    ..ttyttt00.
    ..0.00.0...`, o);
  for (let i = 0; i < 2; i++) def('sball_' + i, stamp(sculpt(12, 12, [{ e: [6, 6.5, 5, 5], ramp: 'uneN' }]), i ? 6 : 3, i ? 4 : 6, 'N.\n.N'), { flip: true });
  SN_('sandcat_0', `
    .a....a....
    .aa..aa....
    .AaaaaA....
    .a0aa0a....
    .aaPaa.....
    ..aaa.aaaaa
    ..aaaaaaaae
    ..aeaaaaaee
    ..a.a..a.a.`, o);
  SN_('sandcat_1', `
    ...........
    .a....a....
    .aa..aa....
    .AaaaaAaaaa
    .a0aa0aaaae
    .aaPaaaaaee
    ..aaaaaaa..
    .a.a....a.a`, o);
  SN_('priest_0', `
    ...yyyy...
    ..yYYYYy..
    ..TsssTT..
    ..s0ss0s..
    ..ssssss..
    .wwwyywww.
    wwLwyywLww
    wLLwTTwLLw
    .wLwTTwLw.
    .wLLTTLLw.
    .wLLTTLLw.
    .wwwwwwww.`, o);
  SN_('priest_1', `
    ...yyyy...
    ..yYYYYy..
    ..TsssTT..
    ..s0ss0s..
    ..ssssss..
    ywwwyywwwy
    swLwyywLws
    .LLwTTwLL.
    .wLwTTwLw.
    .wLLTTLLw.
    .wLLTTLLw.
    .wwwwwwww.`, o);
  SN_('mummy_0', `
    ..LLLL...
    .LlLLLl..
    .L0LL0L..
    .LLLLLL..
    .lLLlLL..
    LLlLLlLL.
    L.LLLLlL.
    ..LlLLL..
    ..LLlLL..
    ..LL.LL..
    ..ll.ll..`, o);
  SN_('mummy_1', `
    ..LLLL...
    .LlLLLl..
    .L0LL0L..
    .LLLLLL..
    .lLLlLL..
    .LlLLlLLL
    .LLLLLlL.
    ..LlLLL..
    ..LLlLL..
    ..LL..LL.
    ..ll..ll.`, o);
  SN_('canopic_0', `
    ..NNNN..
    .NaaaaN.
    ..NNNN..
    .aaaaae.
    aAaaaaae
    aTTTTTTe
    aayaayae
    aTTTTTTe
    .aaaaae.
    ..eeee..`, o);
  SN_('snake_0', `
    ......aa.
    .....a0aP
    .aa..aaa.
    aeea.ae..
    ae.aae...
    .....`, o);
  SN_('snake_1', `
    ......aa.
    .....a0a.
    ..aa.aaaP
    .aeeaae..
    ae..ae...
    .........`, o);
  SN_('gscarab_0', `
    ...YYYY....
    ..YwYYyy...
    .YwYYYYyy..
    .YYYoYYyy..
    .yYYoYYyy0.
    ..yyoyyy00.
    .0.0..0.0..`, o);
  SN_('gscarab_1', `
    ...YYYY....
    ..YwYYyy...
    .YwYYYYyy..
    .YYYoYYyy..
    .yYYoYYyy0.
    ..yyoyyy00.
    ..0.00.0...`, o);
  // item icons
  def('icon_bracelet', stamp(sculpt(16, 16, [{ e: [8, 8.5, 6.5, 4.5], ramp: 'noyY' }, { e: [8, 8.5, 3.5, 2], ramp: 'aaaa' }]), 6, 5, 'T.T.T'), { sil: '1' });
  SN_('icon_scharm', `
    .....TT.....
    ....TCTt....
    ..TTCTTTtt..
    .TCTTyyTTtt.
    .TTTTyyTTtt.
    .tTTTyyTTtt.
    ..ttTyyTtt..
    ...tttttt...
    ..0..00..0..`, { sil: '1' });
  SN_('icon_sglass', `
    nnnnnnnnnn
    .wCCCCCCw.
    ..wyyyyw..
    ...wyyw...
    ....wy....
    ....wy....
    ...wCyw...
    ..wCCyyw..
    .wCyyyyyw.
    nnnnnnnnnn`, { sil: '1' });
  // bullets: sun sparks, sand and scarabs
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  const B = {
    sun: [['.Y.', 'YwY', '.y.'], ['..Y..', '.YwY.', 'YwwwY', '.yYy.', '..y..']],
    scarab: [['.TT.', 'TCTt', 'tTtt', '.tt.'], ['..TT..', '.TCTt.', 'TCTyTt', 'tTTytt', '.tttt.', '..tt..']],
  };
  for (const k in B) {
    def('eb_' + k, pad(B[k][0])); def('ebb_' + k, pad(B[k][1]));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
})();

// ---------- Foes ----------
const scarabBall = (e) => [e.x + Math.cos(e.la || 0) * 11, e.y + Math.sin(e.la || 0) * 6 + 1];
// the Mummy Wrap's bandage: a line of cloth scraps out along e.la
function wrapDraw(e, ox, oy) {
  const n = Math.max(1, Math.round(e.ext / 3)), dx = Math.cos(e.la), dy = Math.sin(e.la), ax = ox + e.x, ay = oy + e.y - 8;
  for (let i = 1; i <= n; i++) {
    const t = e.ext * i / n, x = Math.round(ax + dx * t), y = Math.round(ay + dy * t + (i % 2 ? 1 : -1));
    rect(x - 1, y - 1, 3, 3, '0'); rect(x, y, 1, 1, i % 3 ? 'L' : 'l');
  }
}
Object.assign(EDEF, {
  // pushes a dung ball down a cyan lane; the ball smashes pots and hurts
  scarab: { hp: 8, r: 6, h: 9, hw: 5, hh: 3, sw: 12, colors: ['T', 't', 'y'],
    sprite: (e) => S('scarab_' + (e.state === 'roll' ? Math.floor(e.anim * 10) % 2 : 0)),
    hits: (e, p) => e.state === 'roll' && (() => { const [bx, by] = scarabBall(e); return Math.hypot(p.x - bx, p.y - by) < 10; })() },
  // crouches (a cyan lane) and pounces
  sandcat: { hp: 7, r: 6, h: 10, hw: 5, hh: 3, sw: 12, colors: ['a', 'e', 'P'],
    sprite: (e) => S(e.state === 'leap' || e.state === 'crouch' ? 'sandcat_1' : 'sandcat_0'),
    hits: (e, p) => e.state === 'land' && e.t > 0.2 && Math.hypot(p.x - e.x, (p.y - e.y) * 1.4) < 13 },
  // stands and sends a line of sun sparks down a cyan lane; mirrors turn them
  priest: { hp: 10, r: 6, h: 16, hw: 5, hh: 3, sw: 12, still: true, colors: ['w', 'y', 'T'],
    sprite: (e) => S(e.state === 'cast' || e.state === 'beam' ? 'priest_1' : 'priest_0') },
  // shuffles close and lashes its bandage down a cyan lane
  mummy: { hp: 12, r: 6, h: 14, hw: 5, hh: 3, sw: 12, colors: ['L', 'l', 'm'],
    sprite: (e) => S('mummy_' + (e.state === 'walk' ? Math.floor(e.anim * 4) % 2 : 1)),
    hits: (e, p) => e.state === 'whip' && e.ext > 6 && lineHit(e.x, e.y - 8, e.la, e.ext, p) },
  // looks like a pot; step near and it wobbles, then breaks into four sand snakes
  canopic: { hp: 6, r: 6, h: 12, hw: 5, hh: 3, sw: 12, still: true, colors: ['a', 'T', 'e'],
    sprite: () => S('canopic_0'),
    glint: (e) => (e.state === 'wobble' ? [0, -14] : null),
    die: (e) => { for (let k = 0; k < 4; k++) { const m = spawnEnemy('snake', e.x + (k % 2 ? 6 : -6), e.y + (k < 2 ? -4 : 4), { instant: true }); m.t = 0.3 + k * 0.1; } } },
  snake: { hp: 2, r: 4, h: 6, hw: 3, hh: 2, sw: 8, colors: ['a', 'e', 'P'],
    sprite: (e) => S('snake_' + (Math.floor(e.anim * 8) % 2)) },
  // an elite that runs from heroes over the plates; caught, it spills treasure
  gscarab: { hp: 14, r: 6, h: 9, hw: 5, hh: 3, sw: 12, passive: true, colors: ['Y', 'y', 'o'],
    sprite: (e) => S('gscarab_' + (Math.floor(e.anim * 12) % 2)),
    die: (e) => { for (let k = 0; k < 6; k++) spawnPickup('coin', e.x, e.y - 2); spawnPickup('gem', e.x, e.y - 2); toast('THE GOLDEN SCARAB SPILLS ITS TREASURE!'); } },
});
Object.assign(FOE_NAMES, { scarab: 'SCARAB ROLLER', sandcat: 'SAND CAT', priest: 'SUN PRIEST', mummy: 'MUMMY WRAP', canopic: 'CANOPIC JAR', snake: 'SAND SNAKE', gscarab: 'GOLDEN SCARAB' });
Object.assign(AI, {
  scarab(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'turn'; e.t = 0.3; e.la = 0; }
    if (e.state === 'turn' && e.t <= 0 && p) {
      // along the room's axes only, toward the hero
      const dx = p.x - e.x, dy = p.y - e.y;
      const a = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? Math.PI : 0) : (dy < 0 ? -Math.PI / 2 : Math.PI / 2);
      e.state = 'aim'; e.t = 0.6;
      e.la = a; G.markers.push({ kind: 'lane', x: e.x, y: e.y - 6, a, t: 0.6, max: 0.6, len: 200 });
      e.flip = Math.cos(a) < -0.1;
    } else if (e.state === 'aim' && e.t <= 0) { e.state = 'roll'; e.t = 3; Audio_.sfx('swish'); }
    else if (e.state === 'roll') {
      const [bx, by] = scarabBall(e), dx = Math.cos(e.la), dy = Math.sin(e.la);
      const fx = bx + dx * 6, fy = by + dy * 6, c = Math.floor(fx / 16), r = Math.floor((fy - 1 - OY) / 16);
      if (tileAt(room, c, r) === T_BRK) { breakTile(room, c, r); }
      for (const q of G.players) if (alive(q) && EDEF.scarab.hits(e, q)) hurtPlayer(q, 1, 'scarab');
      if (solidPx(room, fx, fy, 'enemy') || moveBox(room, e, dx * 80 * dt, dy * 80 * dt, 'enemy') || e.t <= 0) { e.state = 'turn'; e.t = 0.8; dust(bx, by, 4, 10); }
    }
  },
  sandcat(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'prowl'; e.t = grnd(1, 1.6); }
    if (e.state === 'prowl') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 40 * dt, d.y * 40 * dt, 'enemy'); e.flip = d.x < 0;
      if (e.t <= 0 && p) {
        const dist = Math.min(110, Math.hypot(p.x - e.x, p.y - e.y));
        e.state = 'crouch'; e.t = 0.6; lane(e, p, dist);
        e.hx0 = e.x; e.hy0 = e.y; e.hx = e.x + Math.cos(e.la) * dist; e.hy = e.y + Math.sin(e.la) * dist;
        if (boxSolid(room, e.hx, e.hy, e.hw, e.hh, 'enemy')) { e.hx = e.x; e.hy = e.y; }
      }
    } else if (e.state === 'crouch' && e.t <= 0) { e.state = 'leap'; e.t = 0.5; Audio_.sfx('swish'); }
    else if (e.state === 'leap') {
      const k = 1 - Math.max(0, e.t) / 0.5;
      e.x = e.hx0 + (e.hx - e.hx0) * k; e.y = e.hy0 + (e.hy - e.hy0) * k; e.z = Math.sin(k * Math.PI) * 18;
      if (e.t <= 0) {
        e.z = 0; e.state = 'land'; e.t = 0.35; dust(e.x, e.y, 6, 12);
        for (const q of G.players) if (alive(q) && EDEF.sandcat.hits(e, q)) hurtPlayer(q, 1, 'sandcat');
      }
    } else if (e.state === 'land' && e.t <= 0) { e.state = 'rest'; e.t = 1.1; }
    else if (e.state === 'rest' && e.t <= 0) { e.state = 'prowl'; e.t = grnd(1, 1.6); }
  },
  priest(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'wait'; e.t = grnd(1, 2); }
    if (e.state === 'wait' && e.t <= 0 && p) { e.state = 'cast'; e.t = 0.7; lane(e, p, 240); e.flip = p.x < e.x; }
    else if (e.state === 'cast' && e.t <= 0) { e.state = 'beam'; e.n = 0; e.t = 0; }
    else if (e.state === 'beam' && e.t <= 0) {
      ebullet(e.x + Math.cos(e.la) * 6, e.y - 10 + Math.sin(e.la) * 4, e.la, 90, 'sun');
      e.t = 0.09;
      if (++e.n >= 6) { e.state = 'wait'; e.t = 2.2; }
      if (e.n === 1) Audio_.sfx('eshoot');
    }
  },
  mummy(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'walk'; e.t = grnd(1, 1.5); e.ext = 0; }
    if (e.state === 'walk') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 24 * dt, d.y * 24 * dt, 'enemy'); e.flip = d.x < 0;
      if (e.t <= 0 && p && Math.hypot(p.x - e.x, p.y - e.y) < 110) { e.state = 'wind'; e.t = 0.6; lane(e, p, 84); }
      else if (e.t <= 0) e.t = 0.5;
    } else if (e.state === 'wind' && e.t <= 0) { e.state = 'whip'; e.t = 0.6; Audio_.sfx('dash'); }
    else if (e.state === 'whip') {
      e.ext = 84 * (e.t > 0.25 ? Math.min(1, (0.6 - e.t) / 0.15) : Math.max(0, e.t / 0.25));
      for (const q of G.players) if (alive(q) && EDEF.mummy.hits(e, q)) hurtPlayer(q, 1, 'mummy');
      if (e.t <= 0) { e.ext = 0; e.state = 'walk'; e.t = grnd(1.2, 1.8); }
    }
  },
  canopic(e, dt, room) {
    e.t -= dt;
    if (e.state === 'idle') e.state = 'sleep';
    if (e.state === 'sleep') { if (G.players.some(q => alive(q) && Math.hypot(q.x - e.x, q.y - e.y) < 40)) { e.state = 'wobble'; e.t = 0.6; Audio_.sfx('clack'); } }
    else if (e.state === 'wobble') { e.x += Math.sin(G.time * 60) * 0.4; if (e.t <= 0) killEnemy(e); }
  },
  snake(e, dt, room) {
    e.t -= dt;
    if (e.t > 0) return;
    const d = towardPlayer(e);
    moveBox(room, e, d.x * 50 * dt, d.y * 50 * dt, 'enemy'); e.flip = d.x < 0;
  },
  gscarab(e, dt, room) {
    e.t -= dt;
    if (!e.life) e.life = 10;
    if ((e.life -= dt) <= 0) { e.dead = true; poof(e.x, e.y - 4); toast('THE GOLDEN SCARAB GOT AWAY'); return; }
    const q = nearestHero(e.x, e.y);
    if (!q) return;
    if (e.t <= 0) { e.t = grnd(0.3, 0.6); const a = Math.atan2(e.y - q.y, e.x - q.x) + grnd(-0.8, 0.8); e.vx = Math.cos(a) * 75; e.vy = Math.sin(a) * 75; }
    if (moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy')) e.t = 0;
    e.flip = e.vx < 0;
  },
});
EF_EXTRA.push('ext', 'la', 'dk', 'rid', 'rk', 'sh');
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'scarab', spr: 'scarab_0', lore: ['IT PUSHES A BALL OF DUNG.', 'THE BALL SMASHES POTS AND HURTS.', 'STEP OFF THE CYAN LANE.'] },
  { t: 'sandcat', spr: 'sandcat_0', lore: ['A CAT OF THE DUNES.', 'IT CROUCHES, THEN POUNCES.', 'THE CYAN LANE SHOWS WHERE.'] },
  { t: 'priest', spr: 'priest_0', lore: ['IT SENDS SUN SPARKS DOWN A LANE.', 'MIRRORS TURN THE SPARKS.', 'SO DO THEY TURN YOURS.'] },
  { t: 'mummy', spr: 'mummy_0', lore: ['SLOW, BUT ITS BANDAGE IS LONG.', 'IT LASHES DOWN A CYAN LANE.', 'KEEP YOUR DISTANCE.'] },
  { t: 'canopic', spr: 'canopic_0', lore: ['IT LOOKS LIKE A POT.', 'STEP CLOSE AND IT WOBBLES.', 'FOUR SAND SNAKES LIVE INSIDE.'] },
  { t: 'gscarab', spr: 'gscarab_0', lore: ['A GOLDEN SCARAB ON THE RUN.', 'IT NEVER FIGHTS BACK.', 'CATCH IT BEFORE IT DIGS AWAY.'] },
);

// ---------- The Sun Disc Guardian (warden of the Sun Temple) ----------
// A floating stone disc with a sun face. It fires rays of sun sparks in a turning cross (glint
// first) that the four mirrors in its room send on; every few volleys the mirrors sparkle and
// all turn a quarter step. Every third round ends with a ring of sparks (a gap), after which the
// disc wobbles, dazed. Phase 2: eight rays at once.
(function guardArt() {
  const o = { flash: true, flip: true };
  const MOUTH = { calm: '0...0\n.000.', squint: '00000', mad: '00000\n0www0\n.000.', daze: '.0.0.\n0.0.0', dead: '00000' };
  const disc = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0;
    let r = sculpt(32, 32, [
      { e: [16, 15 + dy, 15, 14 - b], ramp: 'noyY' },
      { e: [16, 15 + dy, 11, 10 - b], ramp: f.p ? 'rRoY' : 'neaA' },
    ]);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; r = stamp(r, Math.round(16 + Math.cos(a) * 13), Math.round(15 + dy + Math.sin(a) * 12), 'T'); }
    r = autoOutline(r);
    r = bossEyes(r, 10, 10 + dy, 8, f.face);
    r = stamp(r, 14, 17 + dy, MOUTH[f.face]);
    return rim(r, { a: 'e', y: 'o' });
  };
  bossFrames('sunguard', disc, o);
})();
Object.assign(EDEF, {
  sunguard: { hp: 260, r: 12, h: 30, hw: 10, hh: 5, sw: 30, fly: true, warden: true, intro: 'IT TURNS THE TEMPLE\'S MIRRORS', colors: ['y', 'a', 'T'],
    init: (e) => { e.state = 'wait'; e.t = 1; e.n = 0; e.w = 0; e.z = 8; },
    sprite: (e) => bossFrame(e, { glint: 'tell', big: 'tell', turn: 'tell', rays: 'atk', ring: 'atk' }[e.state] || bob(e, 2, '0', '1')),
    glint: (e) => (e.state === 'glint' || e.state === 'big' ? [0, -32] : null) },
});
FOE_NAMES.sunguard = 'SUN DISC GUARDIAN';
WARDENS.sun = 'sunguard';
AI.sunguard = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  e.z = 8 + Math.sin(e.anim * 2) * 2;
  // it drifts slowly round the middle of the room
  const tx = 192 + Math.cos(e.anim * 0.5) * 40, ty = OY + 108 + Math.sin(e.anim * 0.7) * 16;
  moveBox(room, e, (tx - e.x) * dt, (ty - e.y) * dt, 'fly');
  if (e.state === 'wait') { if (e.t <= 0) { e.state = 'glint'; e.t = 0.5; } }
  else if (e.state === 'glint') {
    if (e.t > 0) return;
    const n = e.p2 ? 8 : 4;
    for (let k = 0; k < n; k++) ebullet(e.x, e.y - 16, e.w + k * Math.PI * 2 / n, 78, 'sun', true);
    e.w += 0.4; Audio_.sfx('eshoot');
    e.state = 'rays'; e.t = 0.3;
  } else if (e.state === 'rays') {
    if (e.t > 0) return;
    const k = ++e.n;
    if (k % 3) { e.state = 'wait'; e.t = 0.9; return; }
    if (k % 9 === 0) { e.state = 'big'; e.t = 0.8; Audio_.sfx('charge'); return; }
    e.state = 'turn'; e.t = 1; Audio_.sfx('mirror');
  } else if (e.state === 'turn') {
    if (e.t > 0) return;
    for (let i = 0; i < room.tiles.length; i++) { const t = room.tiles[i]; if (t >= T_MIRROR && t <= T_MIRROR + 3) setTile(room, i % COLS, (i / COLS) | 0, T_MIRROR + (t - T_MIRROR + 1) % 4); }
    Audio_.sfx('clack');
    e.state = 'wait'; e.t = 0.6;
  } else if (e.state === 'big') {
    if (e.t > 0) return;
    const a = p ? Math.atan2(p.y - e.y, p.x - e.x) : 0, n = 16;
    for (let i = 0; i < n; i++) { const b = a + (i + 0.5) * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.6) ebullet(e.x, e.y - 16, b, 66, 'sun'); }
    Audio_.sfx('boom');
    e.state = 'ring'; e.t = 0.4;
  } else if (e.state === 'ring' && e.t <= 0) { stagger(e, 2); toast('THE DISC WOBBLES!'); e.state = 'wait'; e.t = 0.4; }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'sunguard', spr: 'sunguard_0', lore: ['THE WARDEN OF THE SUN TEMPLE.', 'ITS RAYS BOUNCE OFF THE MIRRORS.', 'WHEN THE MIRRORS SPARKLE, THEY TURN.'] });

// ---------- The Riddle Sphinx (boss of the Sun Temple) ----------
// A lion-bodied sphinx in a gold and turquoise headdress, lying at the top of her court. Glyphs
// shine above her: step on the matching floor plates in that order and her sun shield drops
// (only a quarter of the damage gets through it): she is dazed, and open for a while. A wrong
// plate puts all of them out again. Meanwhile her paws slam where heroes stand (pink rings) and
// she roars a fan of sand (glint first). Phase 2: two mirrors rise from the floor and her eyes
// send a line of sun sparks down a cyan lane. Phase 3: quicksand opens in the middle. The riddle
// grows by a glyph each phase (two, three, four).
(function sphinxArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000\n.00.', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const sphinx = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, pa = f.a ? -3 : 0, b = f.b ? 1 : 0;
    let r = sculpt(40, 32, [
      { e: [24, 24 + dy * 0.5, 15, 7 - dy * 0.5], ramp: 'neaA' },
      { r: [2, 25 + pa, 11, 6, 2], ramp: 'neaA' }, { r: [26, 27, 12, 5, 2], ramp: 'neaA' },
      { r: [9, 8 + dy + b, 16, 16, 3], ramp: f.p ? 'rRoy' : 'tTCw' },
      { e: [17, 10 + dy + b, 6.5, 7], ramp: 'neaA' },
    ]);
    // the headdress stripes and the gold band
    for (let y = 12; y < 24; y += 2) r = stamp(r, 10, y + dy + b, 'y..............y');
    r = stamp(r, 11, 3 + dy + b, 'yyyyyyyyyyyyy');
    r = stamp(r, 16, 0 + dy + b, '.y.\nyTy');
    r = autoOutline(r);
    r = bossEyes(r, 12, 8 + dy + b, 6, f.face);
    r = stamp(r, 15, 14 + dy + b, MOUTH[f.face]);
    return rim(r, { a: 'e', T: 't' });
  };
  bossFrames('sphinx', sphinx, o);
})();
const SPHINX_X = 192, SPHINX_Y = OY + 58;
Object.assign(EDEF, {
  sphinx: { hp: 390, r: 14, h: 30, hw: 16, hh: 6, sw: 40, boss: true, intro: 'ANSWER, OR TURN TO SAND', phases: [0.66, 0.33], colors: ['a', 'T', 'y'],
    init: (e) => { e.x = SPHINX_X; e.y = SPHINX_Y; e.n = 0; e.sh = 1; e.rk = 0; e.rid = sphinxRiddle(2); e.occ = 0; },
    sprite: (e) => bossFrame(e, { roar: 'tell', gaze: 'tell', paw: 'atk', stream: 'atk' }[e.state] || bob(e, 1.5, 1, 0)),
    glint: (e) => (e.state === 'roar' ? [-3, -26] : null),
    under: (e, ox, oy) => {
      // her riddle over her head: lit glyphs are solved
      if (!e.rid || !e.sh) return;
      const n = e.rid.length, x0 = ox + e.x - n * 6 + 1, y = oy + e.y - 48;
      e.rid.forEach((g, i) => { const s = S('glyph_' + g); drawS(s, x0 + i * 12, y, i < e.rk ? 0 : Math.floor(G.time * 2) % 2 ? 4 : 0); });
      if (Math.floor(G.time * 6) % 3 === 0) drawS(S('sparkle_c'), ox + e.x + Math.round(Math.cos(G.time * 3) * 20) - 1, oy + e.y - 16 + Math.round(Math.sin(G.time * 3) * 8));
    } },
});
FOE_NAMES.sphinx = 'RIDDLE SPHINX';
const sphinxRiddle = (n) => { const a = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const j = grand() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return n > 4 ? a.concat(a[0]).slice(0, n) : a.slice(0, n); };
function sphinxPlates(room, on) { for (const i of SPHINX_PLATES) if (room.tiles[i] !== (on ? T_PLATEON : T_PLATE) && (room.tiles[i] === T_PLATE || room.tiles[i] === T_PLATEON)) setTile(room, i % COLS, (i / COLS) | 0, on ? T_PLATEON : T_PLATE); }
AI.sphinx = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'sphinx';
  if (e.hp < e.maxHp * 0.66 && !e.mir) {
    bossPhase(e, 2); e.mir = true;
    for (const [c, r, m] of [[4, 8, 1], [19, 8, 0]]) { setTile(room, c, r, T_MIRROR + m); dust(c * 16 + 8, OY + r * 16 + 12, 8, 14); }
    for (const q of G.players) if (!q.dead && nudgeOut(room, q, heroMoveMode(q))) q.tpN++;
  }
  if (e.hp < e.maxHp * 0.33 && !e.qs) {
    bossPhase(e, 3); e.qs = true;
    for (let r = 8; r <= 9; r++) for (let c = 9; c <= 14; c++) setTile(room, c, r, T_QSAND);
    e.rid = sphinxRiddle(4); e.rk = 0; sphinxPlates(room, false);
  }
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'wait'; e.t = 1; } return; }
  // the plates: a newly stepped-on one either fits the riddle or puts them all out
  let occ = 0;
  SPHINX_PLATES.forEach((i, k) => { const [x, y] = tileXY(i); if (G.players.some(q => alive(q) && Math.abs(q.x - x) < 8 && Math.abs(q.y - 4 - y) < 8)) occ |= 1 << k; });
  const fresh = occ & ~e.occ;
  e.occ = occ;
  if (fresh && e.sh) SPHINX_PLATES.forEach((i, k) => {
    if (!(fresh & 1 << k) || !e.sh) return;
    if (e.rid[e.rk] === k) {
      setTile(room, i % COLS, (i / COLS) | 0, T_PLATEON); Audio_.sfx('bell' + e.rk % 4);
      burst(...tileXY(i), 8, ['y', 'Y', 'T'], 50, 0.4, { g: -40 });
      if (++e.rk >= e.rid.length) { e.sh = 0; e.open = 8; stagger(e, 2.5); toast('THE RIDDLE IS SOLVED!'); Audio_.sfx('cgate'); }
    } else if (room.tiles[i] !== T_PLATEON) { e.rk = 0; sphinxPlates(room, false); Audio_.sfx('deny'); }
  });
  if (!e.sh && (e.open -= dt) <= 0) { e.sh = 1; e.rk = 0; e.rid = sphinxRiddle(e.qs ? 4 : e.p2 ? 3 : 2); sphinxPlates(room, false); Audio_.sfx('tele'); }
  if (!p) return;
  if (e.state === 'wait') {
    if (e.t > 0) return;
    const k = e.n++ % 3;
    if (k === 2 && !e.p2) { e.t = 1; return; } // phase 1: a breath between rounds
    if (k === 0) {
      // a paw slam on every hero's spot
      const hs = G.players.filter(alive);
      hs.forEach((q, j) => G.markers.push({ x: q.x, y: q.y, t: 0.9 + j * 0.2, max: 0.9 + j * 0.2, src: 'sphinx', fall: '', n: 0, r: 12 }));
      e.state = 'paw'; e.t = 0.9; Audio_.sfx('charge');
    } else if (k === 1) { e.state = 'roar'; e.t = 0.6; }
    else { e.state = 'gaze'; e.t = 2.6; lane(e, p, 300); e.t = 0.8; } // the lane stays up until the stream has passed
  } else if (e.state === 'paw') {
    if (e.t <= 0) { G.shake = Math.max(G.shake, 3); Audio_.sfx('boom'); e.state = 'wait'; e.t = 1.1; }
  } else if (e.state === 'roar') {
    if (e.t > 0) return;
    fan(e.x - 3, e.y - 18, Math.atan2(p.y - 7 - (e.y - 18), p.x - e.x), e.p2 ? 5 : 3, e.p2 ? 0.36 : 0.45, 56, 'sand');
    Audio_.sfx('roar');
    e.state = 'wait'; e.t = 1.2;
  } else if (e.state === 'gaze') {
    if (e.t <= 0) { e.state = 'stream'; e.w = 0; e.t = 0; }
  } else if (e.state === 'stream') {
    if (e.t > 0) return;
    ebullet(e.x + Math.cos(e.la) * 8, e.y - 20 + Math.sin(e.la) * 4, e.la, 84, 'sun', true);
    e.t = 0.08;
    if (++e.w === 1) Audio_.sfx('eshoot');
    if (e.w >= 10) { e.state = 'wait'; e.t = 1.2; }
  }
};
BEASTS.push({ t: 'sphinx', spr: 'sphinx_0', boss: true, lore: ['SHE GUARDS THE SUN TEMPLE.', 'STEP ON THE PLATES HER GLYPHS SHOW.', 'IN ORDER, AND HER SHIELD DROPS.'] });

// ---------- The Scarab Pharaoh (the Sun Temple's other boss) ----------
// A beetle king with a gold crown. He charges down a cyan lane, throws fans of scarabs (glint
// first), and every fourth move hurls his sun disc: it bounces round the room four times and
// flies back to him; catching it knocks him dizzy. Phase 2: he calls a Scarab Roller after
// each charge (two at most), and the disc flies faster.
(function pharaohArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const beetle = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0, sx = f.a ? 2 : 0;
    let r = sculpt(40, 32, [
      { e: [20, 20 + dy, 17, 10 - b], ramp: f.p ? 'rRoY' : 'tTCw' },
      { e: [20 + sx, 9 + dy, 8, 6], ramp: 'tTCw' },
    ]);
    r = stamp(r, 20, 12 + dy, 'y\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny');
    r = stamp(r, 14 + sx, 0 + dy, 'y.y.y.y.y.y.y\nyyyyyyyyyyyyy\nyTyyyTyyyTyyy');
    r = stamp(r, 3, 29, '0..0.......0..0');
    r = stamp(r, 22, 29, '0..0.......0..0');
    r = autoOutline(r);
    r = bossEyes(r, 14 + sx, 6 + dy, 8, f.face);
    r = stamp(r, 18 + sx, 12 + dy, MOUTH[f.face]);
    return rim(r, { T: 't', C: 'T' });
  };
  bossFrames('pharaoh', beetle, o);
  for (let i = 0; i < 2; i++) def('sdisc_' + i, stamp(sculpt(18, 18, [{ e: [9, 9, 8, 8], ramp: 'noyY' }, { e: [9, 9, 4.5, 4.5], ramp: 'oOyY' }]), i ? 4 : 11, i ? 11 : 4, 'w'));
})();
Object.assign(EDEF, {
  pharaoh: { hp: 370, r: 13, h: 28, hw: 14, hh: 7, sw: 38, boss: true, intro: 'THE SUN ROLLS WHERE HE SAYS', colors: ['T', 'y', 't'],
    init: (e) => { e.n = 0; },
    sprite: (e) => bossFrame(e, { aim: 'tell', fan: 'tell', wind: 'tell', dash: 'atk', throw: 'atk' }[e.state] || bob(e, 2, 1, 0)),
    glint: (e) => (e.state === 'fan' || e.state === 'wind' ? [0, -30] : null),
    hits: (e, p) => !!e.dk && Math.hypot(p.x - e.dk[0], p.y - 6 - e.dk[1]) < 10 },
});
FOE_NAMES.pharaoh = 'SCARAB PHARAOH';
LAND.sun.alt = ['pharaoh'];
AI.pharaoh = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'pharaoh';
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'idle'; e.t = 1; } return; }
  if (!p) return;
  if (e.state === 'idle') {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (d > 70 || d < 56) moveBox(room, e, dx / d * (d > 70 ? 30 : -40) * dt, dy / d * (d > 70 ? 30 : -40) * dt, 'enemy'); // not too close for his fans
    e.flip = dx < 0;
    if (e.t > 0) return;
    const k = e.n++ % 4;
    if (k === 0 || k === 2) {
      e.state = 'aim'; e.t = 0.8;
      let len = 20;
      const la = Math.atan2(p.y - e.y, p.x - e.x);
      while (len < 220 && !boxSolid(room, e.x + Math.cos(la) * len, e.y + Math.sin(la) * len, e.hw, e.hh, 'enemy')) len += 6;
      lane(e, p, len); e.len = len - 6;
    } else if (k === 1) { e.state = 'fan'; e.t = 0.5; e.w = 0; }
    else { e.state = 'wind'; e.t = 0.8; Audio_.sfx('charge'); }
  } else if (e.state === 'aim') {
    if (e.t <= 0) { e.state = 'dash'; e.t = e.len / 170; Audio_.sfx('dash'); }
  } else if (e.state === 'dash') {
    const bl = moveBox(room, e, Math.cos(e.la) * 170 * dt, Math.sin(e.la) * 170 * dt, 'enemy');
    if (Math.random() < 0.5) dust(e.x, e.y, 1, 6);
    if (bl || e.t <= 0) {
      e.state = 'idle'; e.t = 1;
      if (e.p2 && G.enemies.filter(q => !q.dead && q.type === 'scarab').length < 2) spawnEnemy('scarab', e.x + (e.x < 192 ? 30 : -30), e.y);
    }
  } else if (e.state === 'fan') {
    if (e.t > 0) return;
    fan(e.x, e.y - 16, Math.atan2(p.y - 7 - (e.y - 16), p.x - e.x) + (e.w % 2 ? 0.16 : 0), e.p2 ? 6 : 4, 0.32, 66, 'scarab');
    Audio_.sfx('eshoot'); e.t = 0.45;
    if (++e.w >= 2) { e.state = 'idle'; e.t = 1; }
  } else if (e.state === 'wind') {
    if (e.t > 0) return;
    // the disc: out toward the hero, four bounces, then home
    const a = Math.atan2(p.y - e.y, p.x - e.x), v = e.p2 ? 94 : 86;
    e.dk = [e.x, e.y - 14]; e.dv = [Math.cos(a) * v, Math.sin(a) * v]; e.db = 0;
    e.state = 'throw'; e.t = 9; Audio_.sfx('swish');
  } else if (e.state === 'throw') {
    const [x, y] = e.dk, [vx, vy] = e.dv;
    if (e.db >= 4) {
      const dx = e.x - x, dy = e.y - 14 - y, d = Math.hypot(dx, dy);
      if (d < 8 || e.t <= 0) { e.dk = null; e.state = 'idle'; e.t = 0.3; stagger(e, 2); toast('HE DROPS HIS SUN!'); dust(e.x, e.y, 6, 14); return; }
      e.dk = [x + dx / d * 110 * dt, y + dy / d * 110 * dt];
    } else {
      let nx = x + vx * dt, ny = y + vy * dt;
      if (solidPx(room, nx, y + 10, 'shot')) { e.dv[0] = -vx; nx = x; e.db++; Audio_.sfx('clack'); }
      if (solidPx(room, x, ny + 10, 'shot')) { e.dv[1] = -vy; ny = y; e.db++; Audio_.sfx('clack'); }
      e.dk = [nx, ny];
    }
    for (const q of G.players) if (alive(q) && EDEF.pharaoh.hits(e, q)) hurtPlayer(q, 1, 'pharaoh');
  }
};
BEASTS.push({ t: 'pharaoh', spr: 'pharaoh_0', boss: true, lore: ['THE BEETLE KING OF THE TEMPLE.', 'HIS SUN DISC BOUNCES FOUR TIMES.', 'WHEN IT COMES HOME, HE IS DIZZY.'] });

// ---------- The Sun Beam (the Sun Temple's special room) ----------
// Sunlight falls through a slot in the left wall and runs along the floor. Three mirrors stand in
// its way; shoot a mirror's back to turn it. Bring the beam to the altar and the altar gives an
// item. The beam is worked out from the tiles on every screen.
function beamPath(room) {
  let [c, r] = BEAM_START, dx = 1, dy = 0;
  const cells = [[c, r]];
  for (let k = 0; k < 80; k++) {
    c += dx; r += dy;
    const i = r * COLS + c, t = tileAt(room, c, r);
    if (t >= T_MIRROR && t <= T_MIRROR + 3) {
      const n = MIR_N[t - T_MIRROR];
      if (dx * n[0] + dy * n[1] >= 0) return { cells, hit: false }; // the back
      const d = dx * n[0] + dy * n[1];
      dx -= d * n[0]; dy -= d * n[1];
      cells.push([c, r]); continue;
    }
    if (t !== T_FLOOR && t !== T_PLATE && t !== T_PLATEON && t !== T_QSAND && t !== T_PIT) return { cells, hit: false };
    cells.push([c, r]);
    if (i === BEAM_ALTAR) return { cells, hit: true };
  }
  return { cells, hit: false };
}
const beamOf = room => room.props.find(o => o.kind === 'sunalt');
function beamStock(room) { room.props.push({ kind: 'sunalt', x: (BEAM_ALTAR % COLS) * 16 + 8, y: OY + ((BEAM_ALTAR / COLS) | 0) * 16 + 14, t: 0, open: false }); }
function beamUpdate(room) {
  const o = beamOf(room);
  if (!o || o.open || !beamPath(room).hit) return;
  o.open = true;
  const id = itemPool(1)[0];
  if (id) addPedestal(room, o.x - 40, o.y + 2, id, 0); else for (let k = 0; k < 8; k++) spawnPickup('coin', o.x, o.y);
  burst(o.x, o.y - 12, 24, ['Y', 'y', 'w'], 110, 0.8, { g: -40 });
  Audio_.sfx('win'); toast('THE SUN SHINES ON THE ALTAR!');
}
function beamDraw(ox, oy, room) {
  const { cells, hit } = beamPath(room), f = Math.floor(G.time * 10) % 2;
  for (let k = 0; k < cells.length; k++) {
    const [c, r] = cells[k], x = ox + c * 16 + 8, y = oy + OY + r * 16 + 8;
    const [pc, pr] = cells[k - 1] || [c - 1, r], [nc, nr] = cells[k + 1] || [c + (c - pc), r + (r - pr)];
    // a 3px ray to the next cell (and from the last one)
    for (const [ac, ar] of [[pc, pr], [nc, nr]]) {
      const hx = (ac - c) * 8, hy = (ar - r) * 8;
      rect(x + Math.min(0, hx) - (hy ? 1 : 0), y + Math.min(0, hy) - (hx ? 1 : 0), hy ? 3 : Math.abs(hx) + 1, hx ? 3 : Math.abs(hy) + 1, 'y');
      rect(x + Math.min(0, hx), y + Math.min(0, hy), hy ? 1 : Math.abs(hx) + 1, hx ? 1 : Math.abs(hy) + 1, f ? 'Y' : 'w');
    }
  }
  // the slot in the wall it comes through
  rect(ox + 8, oy + OY + BEAM_START[1] * 16 + 4, 8, 9, '0'); rect(ox + 10, oy + OY + BEAM_START[1] * 16 + 6, 6, 5, 'Y');
  if (hit && Math.floor(G.time * 4) % 2) drawS(S('sparkle_0'), ox + (BEAM_ALTAR % COLS) * 16 + 6, oy + OY + ((BEAM_ALTAR / COLS) | 0) * 16 - 6);
}
SN_('sunaltar', `
  ..yyyyyyyy..
  .yYYYYYYYYo.
  .ooooooooooo
  ..aaaaaaaa..
  ..aTTTTTTe..
  ..aTyyyyTe..
  ..aTTTTTTe..
  ..aaaaaaae..
  .AaaaaaaaaeN
  NNNNNNNNNNNN`);
function drawAltar(o, x, y) {
  shadow(x, y, 12);
  drawFeet(S('sunaltar'), x, y + 1);
  if (o.open && Math.floor(o.t * 3) % 3 === 0) drawS(S('sparkle_0'), x + 5, y - 16);
}
