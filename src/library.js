'use strict';
// ---------- The Story Library (Page Turn) ----------
// Every fight room is one page of a pair (PAGE_LAYOUTS: 'reading' and 'reading2' ...). Every
// PAGE_EVERY seconds, or once when half the room's foes are gone, a corner of the page curls up
// (the tell, longer with a Bookmark) and the page turns to its pair (turnPage, level.js): heroes
// and foes keep their places, and anyone left inside a new shelf is nudged out, never hurt. The
// host picks the page and tells co-op clients (NET.fx 'curl' / 'fold'), who turn it themselves.
// Ink puddles slow whoever walks through them.
const PAGE_EVERY = 25, INK_SLOW = 0.6;
const libOut = (rows) => { const w = rows[0].length, pad = '.'.repeat(w + 2); return autoOutline([pad, ...rows.map(r => '.' + r + '.'), pad]); };

// ---------- Tile art ----------
(function libTiles() {
  // a stack of three books, and a bundle of loose pages tied with a ribbon
  let r = sculpt(16, 16, [{ r: [1, 10, 14, 5, 1], ramp: '1234' }, { r: [2, 6, 12, 4, 1], ramp: 'tTCw' }, { r: [3, 2, 10, 4, 1], ramp: 'nrRq' }]);
  r = stamp(r, 12, 11, 'L\nL\nL'); r = stamp(r, 12, 7, 'L\nL'); r = stamp(r, 11, 3, 'L\nL');
  r = stamp(r, 3, 12, 'yy'); r = stamp(r, 4, 3, 'y');
  def('rock_library', r);
  let b = sculpt(16, 16, [{ r: [2, 5, 12, 10, 1], ramp: 'mlLw' }]);
  for (let y = 7; y < 14; y += 2) b = stamp(b, 3, y, 'llllllllll');
  b = stamp(b, 7, 5, 'rr\nrr\nrr\nrr\nrr\nrr\nrr\nrr\nrr\nrr');
  def('brk_library', stamp(b, 5, 3, 'r..r\n.rr.'));
})();

// the floor is a page: faint ruled lines and a pink margin
THEMES.library.paint = function (g) {
  g.fillStyle = PAL.e;
  for (let y = OY + 43; y < OY + 192; y += 12) for (let x = 16; x < VW - 16; x += 2) g.fillRect(x, y, 1, 1);
  g.fillStyle = PAL.q;
  g.fillRect(56, OY + 32, 1, 160); g.fillRect(58, OY + 32, 1, 160);
};

// ---------- Pages ----------
const PAGE_LAYOUTS = {
  // Reading Room: tables and armchairs
  reading: `......................
    ..e................e..
    ...##....#..#....##...
    ...##............##...
    ......................
    .......e......e.......
    ...##............##...
    ...##....#..#....##...
    ..e.......ee.......e..
    ......................`,
  reading2: `......................
    ..e................e..
    ......##......##......
    ......##......##......
    ......................
    ..#....e......e....#..
    ......##......##......
    ......##......##......
    ..e.......ee.......e..
    ......................`,
  // Stacks: rows of shelves, then columns
  stacks: `......................
    .####.####..####.####.
    ......................
    .e..#....e..e....#..e.
    ....#............#....
    ....#............#....
    .e..#....e..e....#..e.
    ......................
    .####.####..####.####.
    ......................`,
  stacks2: `......................
    ..e..#..........#..e..
    .....#...####...#.....
    .....#..........#.....
    ......................
    ......................
    .....#..........#.....
    .....#...####...#.....
    ..e..#....ee....#..e..
    ......................`,
  // Ink Well: pools of ink that move when the page turns
  inkwell: `......................
    ..e................e..
    ......~~~~~~~~~~......
    ......~~~~~~~~~~......
    ......................
    ......................
    ......~~~~~~~~~~......
    ......~~~~~~~~~~......
    ..e.......ee.......e..
    ......................`,
  inkwell2: `......................
    ..e..~~~......~~~..e..
    .....~~~......~~~.....
    .....~~~......~~~.....
    ......................
    ......................
    .....~~~......~~~.....
    .....~~~......~~~.....
    ..e..~~~..ee..~~~..e..
    ......................`,
  // Pop-up Page: an open page, and one where the rocks pop up
  popup: `......................
    ..e................e..
    ......................
    .......#......#.......
    ......................
    ..........ee..........
    .......#......#.......
    ......................
    ..e................e..
    ......................`,
  popup2: `......................
    ..e..#....##....#..e..
    ...#....#....#....#...
    ......#...##...#......
    ..#................#..
    ..........ee..........
    ......#...##...#......
    ...#....#....#....#...
    ..e..#..........#..e..
    ......................`,
  // Card Catalogue: walls of drawers (they come back whole when the page turns)
  catalogue: `......................
    ..e.......ee.......e..
    ...bbbb........bbbb...
    ......................
    ......................
    ...bbbb........bbbb...
    ......................
    ..e.......ee.......e..
    ......................
    ......................`,
  catalogue2: `......................
    ..e.......ee.......e..
    ......................
    .......bbbbbbbb.......
    ......................
    ......................
    .......bbbbbbbb.......
    ......................
    ..e.......ee.......e..
    ......................`,
  // Margin Notes: a thin frame round a big middle
  margin: `......................
    .##.......ee.......##.
    .#..e............e..#.
    ......................
    ......................
    ......................
    ......................
    .#..e............e..#.
    .##.......ee.......##.
    ......................`,
  margin2: `......................
    ....##..........##....
    ..e.#............#.e..
    ......................
    ..........##..........
    ..........##..........
    ......................
    ..e.#............#.e..
    ....##....ee....##....
    ......................`,
  // the Great Bookworm's last chapter: the book closes on the arena, one page at a time
  worm1: `......................
    ##..................##
    ###................###
    ##..................##
    ......................
    ......................
    ##..................##
    ###................###
    ##..................##
    ......................`,
  worm2: `......................
    ####..............####
    #####............#####
    ####..............####
    ......................
    ......................
    ####..............####
    #####............#####
    ####..............####
    ......................`,
};
for (const k in PAGE_LAYOUTS) PAGE_LAYOUTS[k] = PAGE_LAYOUTS[k].split('\n').map(r => r.trim());
LAND_LAYOUTS.library = {};
for (const k of ['reading', 'stacks', 'inkwell', 'popup', 'catalogue', 'margin']) LAND_LAYOUTS.library[k] = PAGE_LAYOUTS[k];
Object.assign(LAY_RULE, {
  stacks: { pool: [['bworm', 3], ['bghost', 2], ['blot', 1]] },
  inkwell: { pool: [['blot', 3], ['crane', 2]] },
  catalogue: { pool: [['quill', 2], ['bworm', 2], ['crane', 1]] },
  margin: { pool: [['bghost', 3], ['crane', 2], ['blot', 1]] },
});
const pagePair = (k) => (k.endsWith('2') ? k.slice(0, -1) : k + '2');
// Host / solo: curl a corner now and turn the room to page `key` when the tell is over.
function libPage(room, key) {
  const corner = hash(room.seed, (room.pgN = (room.pgN || 0) + 1), 17) & 3;
  const dur = G.players.some(p => p.bookmark && !p.dead) || assistOn() ? 2 : 1; // BOOKMARK, or assist (solo only)
  pageCurl(room, corner, dur);
  room.pgq = { key, corner, at: G.time + dur };
  Audio_.sfx('page');
  if (NET.role === 'host') NET.fx.push(['curl', corner, dur]);
}
function libFold(room) {
  const q = room.pgq;
  room.pgq = null;
  turnPage(room, PAGE_LAYOUTS[q.key], q.corner);
  room.pg = q.key; room.sunk = [];
  Audio_.sfx('page');
  if (NET.role === 'host') NET.fx.push(['fold', q.corner, q.key]);
}

// ---------- Ink puddles ----------
// [x, y, r] ellipses on the floor (room.ink from the room's seed, a boss's own in e.ink).
const INK_BLOB = new Map();
function inkBlob(r) {
  if (INK_BLOB.has(r)) return INK_BLOB.get(r);
  const h = Math.ceil(r * 0.6), cv = document.createElement('canvas');
  cv.width = r * 2 + 1; cv.height = h * 2 + 1;
  const g = cv.getContext('2d');
  for (let y = -h; y <= h; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x / r, y / h);
    if (d > 1) continue;
    // a dithered rim, a lighter top left edge, a glint
    if (d > 0.86 && (x + y) & 1) continue;
    g.fillStyle = PAL[d > 0.7 && x + y < 0 ? '2' : x === Math.round(-r * 0.4) && y === Math.round(-h * 0.3) ? '3' : '1'];
    g.fillRect(x + r, y + h, 1, 1);
  }
  INK_BLOB.set(r, cv);
  return cv;
}
function inkList(room) {
  const b = G.boss && !G.boss.dead && G.boss.ink;
  return b && b.length ? (room.ink || []).concat(b) : room.ink || [];
}
const inIn = (L, x, y) => L.some(([ix, iy, r]) => Math.hypot((x - ix) / r, (y - iy) / (r * 0.6)) < 1);

LAND_MECH.library = {
  // every fight room is a page (its own layout if the generic one was picked), plus a few puddles
  build(room) {
    room.ink = [];
    if (room.type !== 'normal') return;
    if (!room.lay || !PAGE_LAYOUTS[room.lay]) {
      const keys = Object.keys(LAND_LAYOUTS.library);
      room.lay = keys[hash(room.seed, 5, 29) % keys.length];
      room.slots.length = 0;
      stampLayout(room.tiles, PAGE_LAYOUTS[room.lay], room.flip[0], room.flip[1], room.slots);
    }
    room.pg = room.lay;
    // puddles only where both pages have floor
    const A = PAGE_LAYOUTS[room.lay], B = PAGE_LAYOUTS[pagePair(room.lay)];
    for (let k = 0; k < 12 && room.ink.length < 2; k++) {
      const h = hash(room.seed, k, 41), x = 2 + h % 18, y = 1 + (h >>> 8) % 8;
      if (A[y][x] !== '.' || B[y][x] !== '.' || A[y][x + 1] !== '.' || B[y][x + 1] !== '.') continue;
      const fx = room.flip[0] ? 21 - x : x, fy = room.flip[1] ? 9 - y : y;
      room.ink.push([fx * 16 + 24 + (room.flip[0] ? -8 : 8), OY + 32 + fy * 16 + 8, 18]);
    }
  },
  slow(room, e) { return inIn(inkList(room), e.x, e.y) ? INK_SLOW : 1; },
  // host / solo: the page turns, and the Choose Your Path books pay out
  update(dt, room) {
    if (room.pgq && G.time >= room.pgq.at) libFold(room);
    if (room.type === 'books') { booksUpdate(room); return; }
    if (room.type !== 'normal' || !room.pg || room.cleared) return;
    const live = G.enemies.filter(e => !e.dead && !e.passive).length;
    if (!live) return;
    if (!room.foes0) { room.foes0 = live; room.pgT = PAGE_EVERY; }
    room.pgT -= dt;
    if (!room.pgHalf && live <= room.foes0 / 2) { room.pgHalf = true; room.pgT = Math.min(room.pgT, 0); }
    if (room.pgT <= 0 && !room.pgq) { libPage(room, pagePair(room.pg)); room.pgT = PAGE_EVERY; }
  },
  drawLayer(ox, oy, room, layer) {
    if (layer === 0) {
      for (const [x, y, r] of inkList(room)) { const cv = inkBlob(r); ctx.drawImage(cv, Math.round(ox + x - r), Math.round(oy + y - (cv.height >> 1))); }
      return;
    }
    if (layer !== 1) return;
    for (const e of G.enemies) {
      if (e.dead) continue;
      // the Quill Knight's line, a second before it dries into a wall
      if (e.type === 'quill' && e.wl && Math.floor(G.time * 8) % 2) for (const i of e.wl) {
        const x = ox + (i % COLS) * 16, y = oy + OY + ((i / COLS) | 0) * 16;
        for (let k = 0; k < 16; k += 3) { rect(x + k, y, 2, 1, '1'); rect(x + k, y + 15, 2, 1, '1'); rect(x, y + k, 1, 2, '1'); rect(x + 15, y + k, 1, 2, '1'); }
      }
      // the Bookmark Ghost's ribbon where it will appear
      if (e.type === 'bghost' && e.state === 'mark' && e.mx) { shadow(ox + e.mx, oy + e.my, 5); drawFeet(S('ribbon'), ox + e.mx, oy + e.my - 2 + Math.round(Math.sin(G.time * 6))); }
    }
  },
};

// ---------- The library's items ----------
Object.assign(ITEMS, {
  bookmark: { name: 'BOOKMARK', desc: 'PAGES CURL TWICE AS LONG BEFORE THEY TURN', land: 'library', unique: true, apply: p => { p.bookmark = true; } },
  eraser: { name: 'ERASER', desc: 'ONCE A ROOM, RUBS OUT THE BULLETS AROUND YOU', land: 'library', unique: true, apply: p => { p.eraser = true; p.erOpen = true; } },
  gquill: { name: 'GOLDEN QUILL', desc: 'YOUR SHOTS LEAVE INK THAT SLOWS FOES', land: 'library', unique: true, apply: p => { p.gquill = true; } },
});
// ERASER: the first bullet that would hit its hero in a room is rubbed out, with its neighbours.
// ponytail: host / solo only; on a co-op client it only stops that one bullet (see net.js).
const _libUmb = umbrellaBlock;
umbrellaBlock = function (p) {
  if (_libUmb(p)) return true;
  if (!p.erOpen || NET.role === 'host' && p.remote && !NET.netHit) return false;
  p.erOpen = false; p.inv = Math.max(p.inv, 0.5);
  for (const b of EBULLETS) if (b.life > 0 && Math.hypot(b.x - p.x, b.y - p.y + 7) < 44) { b.life = 0; burst(b.x, b.y, 2, ['L', 'q'], 30, 0.2); }
  burst(p.x, p.y - 10, 14, ['L', 'q', 'P'], 80, 0.4);
  Audio_.sfx('page'); say(p, 'RUBBED OUT!');
  return true;
};

// ---------- Foe art ----------
(function libArt() {
  const o = { flip: true, flash: true, glow: true };
  SN_('blot_0', `
    ...2222...
    ..233222..
    .23222222.
    .2w022w022
    .222222221
    2222222211
    .22122121.
    ..1..1..1.`, o);
  SN_('blot_1', `
    ..........
    ...2222...
    .23322222.
    2322222222
    2w022w0221
    2222222211
    .221221211`, o);
  SN_('blotlet_0', `
    .22.
    2332
    2w02
    2221
    .11.`, o);
  SN_('crane_0', `
    .........L
    .......LLl
    .....LLLl.
    LLLLLLLl..
    .llLLLl...
    ...llL....`, o);
  SN_('crane_1', `
    L.......L
    LL..q..LL
    .LLLqLLL.
    ..LLLLL..
    ...lLl...
    ....l....`, o);
  SN_('bworm_0', `
    .....hhh..
    ....hGGGh.
    ....yyyyy.
    ....y0y0y.
    .....GGG..
    .hhGGGGG..
    hGGGGGGg..
    .gGgGgGg..`, o);
  SN_('bworm_1', `
    ....hhh...
    ...hGGGh..
    ...yyyyy..
    ...y0y0y..
    ....GGG...
    ..hGGGGGh.
    .hGGGGGGg.
    ..gGgGgGg.`, o);
  SN_('quill_0', `
    .....P.....
    ....PP.....
    ...lLLl....
    ..lLLLLl...
    ..l0ll0l...
    ..llllll..w
    ...lmml..wL
    .mlLLLlm.w.
    .mlLLLlmw..
    .mlLyLlm...
    ..lLLLl....
    ..ll.ll....
    ..mm.mm....`, o);
  SN_('quill_1', `
    .....P.....
    ....PP.....
    ...lLLl....
    ..lLLLLl...
    ..l0ll0l...
    ..llllll...
    ...lmml....
    .mlLLLlmwwL
    .mlLLLlm...
    .mlLyLlm...
    ..lLLLl....
    ..ll..ll...
    ..mm..mm...`, o);
  SN_('bghost_0', `
    ..LLLL....
    .LLLLLL...
    LL0LL0LL..
    LLLLLLLL..
    LLLqqLLL..
    LLLLLLLr..
    LLLLLLLr..
    lLLlLLlr..
    .l.l.l.rr.`, o);
  SN_('bghost_1', `
    ..LLLL....
    .LLLLLL...
    LL0LL0LL..
    LLLLLLLL..
    LLL00LLL..
    LLLLLLLr..
    LLLLLLLr..
    .lLLlLLr..
    ..l.l.lrr.`, o);
  SN_('proof_0', `
    ...rr....
    ..rRRr...
    ..rRRr...
    .yyyyyy..
    .y0yy0y..
    ..rRRr...
    ..rRRr...
    ..rRRr...
    ..AAAA...
    ...AA....
    ...11....`, o);
  SN_('proof_1', `
    ...rr....
    ..rRRr...
    ..rRRr...
    .yyyyyy..
    .y0yy0y..
    ..rRRr...
    ..rRRr...
    ..rRRr...
    ..AAAA...
    ....AA...
    ....11...`, o);
  SN_('ribbon', `
    rR.
    rR.
    rRr
    rRr
    r.r`);
  // item icons
  SN_('icon_bookmark', `
    rRRRr
    rRyRr
    rRRRr
    rRRRr
    rRRRr
    rRRRr
    rR.Rr
    r...r`, { sil: '1' });
  SN_('icon_eraser', `
    ...qqqq
    ..qPPPq
    .qPPPqL
    LLLLqL.
    LlllL..
    LlllL..
    .LLL...`, { sil: '1' });
  SN_('icon_gquill', `
    .......YY
    ......YYy
    .....YYy.
    ....YYy..
    ...YYy...
    ..YYy....
    ..Yy.....
    .n.......
    1........`, { sil: '1' });
  // the Choose Your Path lectern, with an open book for each story and a closed one
  const lect = (cover) => {
    let r = sculpt(18, 22, [{ r: [7, 9, 4, 11, 1], ramp: '1234' }, { r: [3, 18, 12, 4, 1], ramp: '1234' }, { r: [1, 3, 16, 7, 1], ramp: cover ? 'lLww' : '1234' }]);
    if (cover) { r = stamp(r, 8, 3, '0\n0\n0\n0\n0\n0'); r = stamp(r, 2, 9, cover.repeat(14)); for (let y = 5; y < 9; y += 2) { r = stamp(r, 3, y, 'lllll'); r = stamp(r, 10, y, 'lllll'); } }
    else r = stamp(r, 5, 5, 'yyyyyyyy');
    return autoOutline(r);
  };
  ['r', 'T', 'y', 'G'].forEach((c, i) => def('lectern_' + i, lect(c)));
  def('lectern_c', lect(''));
  // bullets: ink drops, red ink, paper darts, cards, and the letters of BANG and ZZZ
  const B = {
    ink: [['.2.', '232', '.1.'], ['.22.', '2332', '2221', '.11.']],
    rink: [['.R.', 'RwR', '.r.'], ['.RR.', 'RwRr', 'RRrr', '.rr.']],
    paper: [['LL', 'Ll'], ['LLL', 'LLl', 'Lll']],
    card: [['LLL', 'LrL', 'LLL'], ['LLLL', 'LrrL', 'LrrL', 'LLLL']],
  };
  const GLYPH = { B: ['11.', '1.1', '11.', '1.1', '11.'], A: ['.1.', '1.1', '111', '1.1', '1.1'], N: ['1.1', '111', '111', '111', '1.1'], G: ['.11', '1..', '1.1', '1.1', '.11'], Z: ['111', '..1', '.1.', '1..', '111'], E: ['111', '1..', '11.', '1..', '111'], D: ['11.', '1.1', '1.1', '1.1', '11.'] };
  for (const k in GLYPH) B['w' + k] = [null, ['LLLLL'].concat(GLYPH[k].map(r => 'L' + r.replace(/\./g, 'L') + 'L'), ['Lllll'])];
  for (const k in B) {
    const [s, b] = B[k];
    def('ebb_' + k, libOut(b)); def('eb_' + k, libOut(s || b));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
  // the Index Card Clerk's cards: four symbols and a back
  const SYM = [['..y..', '.yYy.', 'yYYYy', '.yyy.', '.y.y.'], ['.r.r.', 'rRrRr', 'rrrrr', '.rrr.', '..r..'], ['.BB..', 'BB...', 'B....', 'BB...', '.BB..'], ['...G.', '..GG.', '.GGG.', 'GGG..', 'G....']];
  const card = (face) => {
    const rows = [];
    for (let y = 0; y < 13; y++) {
      let row = '';
      for (let x = 0; x < 9; x++) row += face < 0 ? (x === 0 || y === 0 ? '3' : x === 8 || y === 12 ? '1' : (x + y) % 4 === 0 ? 'y' : '2') : (x === 0 || y === 0 ? 'w' : x === 8 || y === 12 ? 'l' : 'L');
      rows.push(row);
    }
    let r = libOut(rows);
    if (face >= 0) r = stamp(r, 3, 5, SYM[face].join('\n'));
    return r;
  };
  for (let i = 0; i < 4; i++) def('lcard_' + i, card(i), { flash: true });
  def('lcard_b', card(-1), { flash: true });
})();

// ---------- Foes ----------
Object.assign(EDEF, {
  // hops toward you and spits ink; shot to pieces, it splits into two little blots
  blot: { hp: 9, r: 6, h: 10, hw: 5, hh: 3, sw: 12, colors: ['2', '3', '1'],
    sprite: (e) => S(e.state === 'hop' ? 'blot_1' : 'blot_0'),
    glint: (e) => (e.state === 'spit' ? [0, -12] : null),
    die: (e) => { for (const d of [-7, 7]) { const m = spawnEnemy('blotlet', e.x + d, e.y, { instant: true }); m.t = 0.4; } } },
  blotlet: { hp: 3, r: 4, h: 6, hw: 3, hh: 2, sw: 8, colors: ['2', '3', '1'],
    sprite: () => S('blotlet_0') },
  // glides folded flat (shots glance off) down a cyan lane, then opens to throw paper darts
  crane: { hp: 8, r: 6, h: 8, hw: 5, hh: 3, sw: 12, fly: true, colors: ['L', 'l', 'q'],
    sprite: (e) => S(e.state === 'glide' || e.state === 'aim' ? 'crane_0' : 'crane_1'),
    glint: (e) => (e.state === 'open' ? [0, -10] : null),
    block: (e) => e.state === 'glide' || e.state === 'aim' },
  // burrows into the page and pops out on a pink ring
  bworm: { hp: 10, r: 6, h: 9, hw: 5, hh: 3, sw: 12, colors: ['G', 'h', 'y'],
    sprite: (e) => S('bworm_' + (Math.floor(e.anim * 5) % 2)),
    draw: (e) => e.state === 'under' },
  // writes a line of ink that dries into a paper wall, and pokes with its quill up close
  quill: { hp: 14, r: 6, h: 14, hw: 5, hh: 3, sw: 12, colors: ['l', 'L', 'P'],
    sprite: (e) => S(e.state === 'poke' ? 'quill_1' : 'quill_0'),
    hits: (e, p) => e.state === 'poke' && lineHit(e.x, e.y - 6, e.la, 26, p) },
  // floats about, marks a spot at the page's edge with a ribbon, and turns up there
  bghost: { hp: 8, r: 6, h: 10, hw: 5, hh: 3, sw: 12, fly: true, colors: ['L', 'l', 'r'],
    sprite: (e) => S('bghost_' + (e.state === 'shoot' ? 1 : 0)),
    glint: (e) => (e.state === 'shoot' ? [0, -12] : null),
    draw: (e) => e.state === 'gone' },
  // a pencil in glasses (the elite): crosses out where you stand with a big X
  proof: { hp: 16, r: 6, h: 12, hw: 5, hh: 3, sw: 12, colors: ['r', 'R', 'y'],
    sprite: (e) => S('proof_' + (Math.floor(e.anim * 4) % 2)) },
});
Object.assign(FOE_NAMES, { blot: 'INK BLOT', blotlet: 'LITTLE BLOT', crane: 'PAPER CRANE', bworm: 'BOOKWORM', quill: 'QUILL KNIGHT', bghost: 'BOOKMARK GHOST', proof: 'PROOFREADER' });
Object.assign(AI, {
  blot(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'sit'; e.t = grnd(0.4, 0.9); e.n = 0; }
    if (e.state === 'sit' && e.t <= 0) {
      if (++e.n % 4 === 0) { e.state = 'spit'; e.t = 0.5; }
      else { const d = towardPlayer(e); e.vx = d.x * 48; e.vy = d.y * 48; e.state = 'hop'; e.t = 0.45; e.flip = d.x < 0; }
    } else if (e.state === 'hop') {
      moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
      e.z = Math.sin(Math.max(0, e.t) / 0.45 * Math.PI) * 5;
      if (e.t <= 0) { e.z = 0; e.state = 'sit'; e.t = 0.35; }
    } else if (e.state === 'spit' && e.t <= 0) {
      fan(e.x, e.y - 6, aimAt(e.x, e.y - 6), 3, 0.4, 60, 'ink');
      Audio_.sfx('eshoot'); e.state = 'sit'; e.t = 0.9;
    }
  },
  blotlet(e, dt, room) {
    e.t -= dt;
    if (e.t > 0) return;
    const d = towardPlayer(e);
    moveBox(room, e, d.x * 44 * dt, d.y * 44 * dt, 'enemy'); e.flip = d.x < 0;
  },
  crane(e, dt, room, p) {
    e.t -= dt;
    e.z = 6 + Math.sin(e.anim * 3) * 1.5;
    if (e.state === 'idle') { e.state = 'rest'; e.t = grnd(0.6, 1.2); }
    if (e.state === 'rest' && e.t <= 0 && p) { e.state = 'aim'; e.t = 0.6; lane(e, p, 150); }
    else if (e.state === 'aim' && e.t <= 0) { e.state = 'glide'; e.t = 1.1; Audio_.sfx('swish'); }
    else if (e.state === 'glide') {
      e.flip = Math.cos(e.la) < 0;
      if (moveBox(room, e, Math.cos(e.la) * 130 * dt, Math.sin(e.la) * 130 * dt, 'fly') || e.t <= 0) { e.state = 'open'; e.t = 0.5; Audio_.sfx('clack'); }
    } else if (e.state === 'open' && e.t <= 0) {
      fan(e.x, e.y - 6, aimAt(e.x, e.y - 6), 3, 0.35, 62, 'paper');
      Audio_.sfx('eshoot'); e.state = 'rest'; e.t = 1.3;
    }
  },
  bworm(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'crawl'; e.t = grnd(1.2, 1.8); }
    if (e.state === 'crawl') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 30 * dt, d.y * 30 * dt, 'enemy'); e.flip = d.x < 0;
      if (e.t <= 0) { e.state = 'dig'; e.t = 0.4; dust(e.x, e.y, 6, 10); Audio_.sfx('brk'); }
    } else if (e.state === 'dig' && e.t <= 0 && p) {
      // somewhere near the hero that it can stand on
      let x = p.x, y = p.y;
      for (let k = 0; k < 12; k++) {
        const a = grand() * Math.PI * 2, d = grnd(18, 40), nx = p.x + Math.cos(a) * d, ny = p.y + Math.sin(a) * d;
        if (!boxSolid(room, nx, ny, e.hw, e.hh, 'enemy')) { x = nx; y = ny; break; }
      }
      e.tx = x; e.ty = y; e.ghost = true; e.state = 'under'; e.t = 0.9;
      G.markers.push({ x, y, t: 0.9, max: 0.9, src: 'bworm', fall: '', n: 0, r: 11 });
    } else if (e.state === 'under' && e.t <= 0) {
      if (!boxSolid(room, e.tx, e.ty, e.hw, e.hh, 'enemy')) { e.x = e.tx; e.y = e.ty; }
      e.ghost = false; e.state = 'crawl'; e.t = grnd(1.6, 2.2);
      dust(e.x, e.y, 8, 14); ring(e.x, e.y - 6, 5, 54, 'ink', grand());
    }
  },
  quill(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'walk'; e.t = grnd(2.5, 3.5); }
    if (e.state === 'walk') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 26 * dt, d.y * 26 * dt, 'enemy'); e.flip = d.x < 0;
      if (p && Math.hypot(p.x - e.x, p.y - e.y) < 34 && (e.pk = (e.pk || 0) - dt) <= 0) { e.state = 'wind'; e.t = 0.5; lane(e, p, 30); e.pk = 1.5; }
      else if (e.t <= 0 && p) quillWrite(e, room, p);
    } else if (e.state === 'wind' && e.t <= 0) { e.state = 'poke'; e.t = 0.25; Audio_.sfx('dash'); for (const q of G.players) if (alive(q) && EDEF.quill.hits(e, q)) hurtPlayer(q, 1, 'quill'); }
    else if (e.state === 'poke' && e.t <= 0) { e.state = 'walk'; e.t = grnd(2.5, 3.5); }
    else if (e.state === 'write' && e.t <= 0) {
      // the ink dries: floor nobody stands on becomes a paper wall
      for (const i of e.wl) {
        const c = i % COLS, r = (i / COLS) | 0, [x, y] = tileXY(i);
        if (room.tiles[i] !== T_FLOOR || !keepsJoined(room, i, T_BRK) || G.players.concat(G.enemies).some(o => !o.dead && Math.abs(o.x - x) < 8 + o.hw && Math.abs(o.y - y - 4) < 8 + o.hh)) continue;
        setTile(room, c, r, T_BRK); dust(x, y + 4, 4, 10); room.qn = (room.qn || 0) + 1;
      }
      Audio_.sfx('brk'); e.wl = null; e.state = 'walk'; e.t = grnd(3, 4);
    }
  },
  bghost(e, dt, room, p) {
    e.t -= dt;
    e.z = 7 + Math.sin(e.anim * 2.5) * 2;
    if (e.state === 'idle') { e.state = 'float'; e.t = grnd(1.6, 2.4); }
    if (e.state === 'float') {
      if (p) hoverNear(e, dt, room, p, 36);
      if (e.t <= 0) {
        // a spot at the page's margin, near a wall
        const side = grand() * 4 | 0, u = grnd(0.2, 0.8);
        e.mx = side < 2 ? 40 + u * (VW - 80) : side === 2 ? 34 : VW - 34;
        e.my = side === 0 ? OY + 44 : side === 1 ? OY + 182 : OY + 44 + u * 138;
        if (boxSolid(room, e.mx, e.my, e.hw, e.hh, 'fly')) { e.t = 0.3; return; }
        e.state = 'mark'; e.t = 0.7; Audio_.sfx('tele');
      }
    } else if (e.state === 'mark' && e.t <= 0) { e.state = 'gone'; e.ghost = true; e.t = 0.25; poof(e.x, e.y - 8); }
    else if (e.state === 'gone' && e.t <= 0) { e.x = e.mx; e.y = e.my; e.mx = 0; e.ghost = false; poof(e.x, e.y - 8); e.state = 'shoot'; e.t = 0.5; }
    else if (e.state === 'shoot' && e.t <= 0) {
      fan(e.x, e.y - 8, aimAt(e.x, e.y - 8), 2, 0.3, 70, 'ink');
      Audio_.sfx('eshoot'); e.state = 'float'; e.t = grnd(1.8, 2.6);
    }
  },
  proof(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'walk'; e.t = grnd(2, 3); }
    if (e.state === 'walk') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 30 * dt, d.y * 30 * dt, 'enemy'); e.flip = d.x < 0;
      if (e.t <= 0 && p) { crossOut(p.x, p.y, 1, 'proof', 1); Audio_.sfx('charge'); e.state = 'walk'; e.t = grnd(2.6, 3.4); }
    }
  },
});
// a big X of pink rings on (x, y), s wide: each ring hurts where it stands after t seconds
function crossOut(x, y, t, src, s) {
  for (const [dx, dy] of [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1], [-2, -2], [2, -2], [-2, 2], [2, 2]])
    G.markers.push({ x: x + dx * 11 * s, y: y + dy * 7 * s, t, max: t, src, fall: '', n: 0 });
}
// The Quill Knight's line: three tiles across the way between it and the hero.
function quillWrite(e, room, p) {
  if ((room.qn || 0) >= 9) { e.t = 2; return; }
  const mx = (e.x + p.x) / 2, my = (e.y + p.y) / 2 - 4, c0 = Math.floor(mx / 16), r0 = Math.floor((my - OY) / 16);
  const across = Math.abs(p.x - e.x) > Math.abs(p.y - e.y); // walking sideways: a line up and down
  const wl = [];
  for (let k = -1; k <= 1; k++) {
    const c = across ? c0 : c0 + k, r = across ? r0 + k : r0;
    if (c >= 2 && c <= COLS - 3 && r >= 3 && r <= ROWS - 3 && tileAt(room, c, r) === T_FLOOR) wl.push(r * COLS + c);
  }
  if (!wl.length) { e.t = 1; return; }
  e.wl = wl; e.state = 'write'; e.t = 1; Audio_.sfx('swish');
}
EF_EXTRA.push('wl', 'mx', 'my', 'sym', 'up', 'show', 'tr', 'ink');
PF_EXTRA.push('erOpen');
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'blot', spr: 'blot_0', lore: ['A BLOT OF INK WITH A TEMPER.', 'IT HOPS, THEN SPITS INK.', 'BREAK IT AND IT SPLITS IN TWO.'] },
  { t: 'crane', spr: 'crane_1', lore: ['A FOLDED PAPER CRANE.', 'FOLDED FLAT, SHOTS GLANCE OFF IT.', 'HIT IT WHEN IT OPENS UP.'] },
  { t: 'bworm', spr: 'bworm_0', lore: ['IT EATS ITS WAY THROUGH PAGES.', 'IT DIGS IN AND POPS UP', 'ON A PINK RING NEAR YOU.'] },
  { t: 'quill', spr: 'quill_0', lore: ['A KNIGHT WITH A QUILL FOR A LANCE.', 'ITS INK LINE DRIES INTO A WALL.', 'THE WALL CAN BE SHOT DOWN.'] },
  { t: 'bghost', spr: 'bghost_0', lore: ['A GHOST THAT KEEPS YOUR PLACE.', 'A RIBBON MARKS WHERE IT WILL BE.', 'IT SHOOTS WHEN IT ARRIVES.'] },
  { t: 'proof', spr: 'proof_0', lore: ['A PENCIL IN GLASSES.', 'IT CROSSES OUT WHERE YOU STAND.', 'STEP OFF THE BIG X.'] },
);

// ---------- The Index Card Clerk (warden of the Story Library) ----------
// A floating card catalogue in a green eyeshade. It shows one card over its head, deals three
// cards face up, turns them over and shuffles them. Shoot the card it showed and it is dazed and
// hurt; a wrong card (or waiting too long) and every card flies back while it throws a ring of
// cards with a gap. Between shuffles it throws fans of cards (glint first). Phase 2: four cards,
// more and quicker swaps.
(function clerkArt() {
  const o = { flash: true, flip: true };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const clerk = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0;
    let r = sculpt(32, 32, [
      { r: [4, 9 + dy, 24, 21 - b, 3], ramp: f.p ? '1pPq' : '1234' },
      { e: [16, 8 + dy, 12, 4], ramp: 'gGhH' },
    ]);
    r = stamp(r, 6, 24 + dy, '0'.repeat(20));
    r = stamp(r, 11, 26 + dy - b, 'yyy......yyy');
    r = autoOutline(r);
    r = bossEyes(r, 9, 14 + dy, 10, f.face);
    r = stamp(r, 14, 20 + dy, MOUTH[f.face]);
    return rim(r, { '3': '2', G: 'g' });
  };
  bossFrames('clerk', clerk, o);
})();
Object.assign(EDEF, {
  clerk: { hp: 260, r: 12, h: 30, hw: 10, hh: 5, sw: 30, fly: true, warden: true, intro: 'PICK A CARD. THE RIGHT ONE.', colors: ['2', '3', 'G'],
    init: (e) => { e.state = 'wait'; e.t = 1; e.z = 8; e.cards = []; },
    sprite: (e) => bossFrame(e, { fan: 'tell', big: 'tell', deal: 'atk', throw: 'atk' }[e.state] || bob(e, 2, '0', '1')),
    glint: (e) => (e.state === 'fan' || e.state === 'big' ? [0, -32] : null),
    under: (e, ox, oy) => { if (e.show >= 0 && e.show !== undefined) drawS(S('lcard_' + e.show), ox + e.x - 5, oy + e.y - 52 - (e.z || 0) + Math.round(Math.sin(G.time * 3))); },
    die: (e) => { for (const c of e.cards || []) if (!c.dead) { c.dead = true; poof(c.x, c.y - 8); } } },
  // a card of the Clerk's: shots only count while it waits to be picked
  lcard: { hp: 999, r: 7, h: 16, hw: 5, hh: 3, sw: 12, fly: true, passive: true, colors: ['L', 'l', 'w'],
    sprite: (e) => S(e.up ? 'lcard_' + e.sym : 'lcard_b'),
    block: (e, s) => { cardPicked(e, s); return true; } },
});
FOE_NAMES.clerk = 'INDEX CARD CLERK';
FOE_NAMES.lcard = 'A CARD';
WARDENS.library = 'clerk';
AI.lcard = function (e, dt) {
  e.z = 6;
  if (e.k === undefined || e.k >= 1) return;
  e.k = Math.min(1, e.k + dt / e.dur);
  const s = e.k * e.k * (3 - 2 * e.k);
  e.x = e.fx + (e.tx - e.fx) * s; e.y = e.fy + (e.ty - e.fy) * s + Math.sin(e.k * Math.PI) * e.arc;
};
const cardGo = (c, x, y, dur, arc) => { c.fx = c.x; c.fy = c.y; c.tx = x; c.ty = y; c.k = 0; c.dur = dur; c.arc = arc || 0; };
const clerkOf = () => G.enemies.find(e => e.type === 'clerk' && !e.dead);
function cardPicked(card, s) {
  const c = clerkOf();
  if (!c || c.state !== 'pick' && c.state !== 'fan') { Audio_.sfx('pop'); return; }
  if (card.sym === c.show) {
    for (const k of c.cards) { k.dead = true; poof(k.x, k.y - 8); }
    c.cards = []; c.show = -1;
    stagger(c, 2.5); hurtEnemy(c, 16, c.x, c.y - 16, false, s && s.own);
    toast('THE RIGHT CARD!'); Audio_.sfx('cgate');
    c.state = 'wait'; c.t = 1.2;
  } else clerkMiss(c);
}
// a wrong card, or too slow: the cards show their faces and fly home, a ring follows
function clerkMiss(c) {
  for (const k of c.cards) { k.up = 1; cardGo(k, c.x, c.y - 10, 0.7, -10); }
  Audio_.sfx('deny');
  c.state = 'big'; c.t = 0.8;
}
AI.clerk = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  e.z = 8 + Math.sin(e.anim * 2) * 2;
  const tx = 192 + Math.cos(e.anim * 0.4) * 50, ty = OY + 70;
  moveBox(room, e, (tx - e.x) * dt, (ty - e.y) * dt, 'fly');
  if (!p) return;
  const n = e.p2 ? 4 : 3, CX = n === 3 ? [120, 192, 264] : [96, 160, 224, 288], CY = OY + 132;
  if (e.state === 'wait') { if (e.t <= 0) { e.state = 'deal'; e.t = 0.6; } }
  else if (e.state === 'deal') {
    if (e.t > 0) return;
    // the card it shows, and the hand dealt face up (always holding that card)
    const syms = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) { const j = grand() * (i + 1) | 0; [syms[i], syms[j]] = [syms[j], syms[i]]; }
    e.show = syms[grand() * n | 0];
    e.cards = syms.slice(0, n).map((sym, i) => { const k = spawnEnemy('lcard', e.x, e.y - 10, { instant: true }); k.sym = sym; k.up = 1; cardGo(k, CX[i], CY, 0.5, -14); return k; });
    Audio_.sfx('swish');
    e.state = 'peek'; e.t = 1.6;
  } else if (e.state === 'peek') {
    if (e.t > 0) return;
    for (const k of e.cards) k.up = 0;
    Audio_.sfx('clack');
    e.state = 'shuf'; e.w = e.p2 ? 5 : 3; e.t = 0.3;
  } else if (e.state === 'shuf') {
    if (e.t > 0) return;
    if (e.w-- <= 0) { e.state = 'pick'; e.t = 6; e.f = 1.2; return; }
    const i = grand() * n | 0, j = (i + 1 + (grand() * (n - 1) | 0)) % n, a = e.cards[i], b = e.cards[j], st = e.p2 ? 0.45 : 0.55;
    cardGo(a, b.x, b.y, st, -12); cardGo(b, a.x, a.y, st, 8);
    Audio_.sfx('swish');
    e.t = st + 0.1;
  } else if (e.state === 'pick') {
    if (e.t <= 0) { clerkMiss(e); return; }
    if ((e.f -= dt) <= 0) { e.state = 'fan'; e.ft = 0.5; }
  } else if (e.state === 'fan') {
    // a fan while the cards wait: the pick clock keeps running
    e.ft -= dt;
    if (e.ft > 0) return;
    fan(e.x, e.y - 16, aimAt(e.x, e.y - 16), e.p2 ? 6 : 4, 0.32, 60, 'card');
    Audio_.sfx('eshoot');
    e.state = 'pick'; e.f = 1.6;
  } else if (e.state === 'big') {
    if (e.t > 0) return;
    for (const k of e.cards) { k.dead = true; poof(k.x, k.y - 8); }
    e.cards = []; e.show = -1;
    // a ring of cards with a gap of three, a little to one side of the hero
    const a0 = Math.atan2(p.y - e.y, p.x - e.x) + (grand() < 0.5 ? -0.6 : 0.6), N = 16;
    for (let i = 0; i < N; i++) { const a = a0 + (i + 0.5) * Math.PI * 2 / N; if (Math.abs(Math.atan2(Math.sin(a - a0), Math.cos(a - a0))) > 0.55) ebullet(e.x, e.y - 16, a, 58, 'card', true); }
    Audio_.sfx('boom');
    e.state = 'wait'; e.t = 1.6;
  }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'clerk', spr: 'clerk_0', lore: ['THE WARDEN OF THE STORY LIBRARY.', 'WATCH THE CARD IT SHOWS YOU,', 'THEN SHOOT THAT ONE AFTER THE SHUFFLE.'] });

// ---------- The Great Bookworm (boss of the Story Library) ----------
// A fat purple bookworm in gold glasses, its body a row of book spines. Chapter 1, THE HUNGRY
// PAGE: it bites holes in the floor (pink rings), spits words (BANG, glint first) and charges
// down a cyan lane into the shelves, where it is dazed. Chapter 2, THE INK FLOOD: ink puddles
// spread from the walls and a wave of ink rolls down the page with a gap. Chapter 3, THE END:
// the book closes on the arena a page at a time, and when the last page turns it is dazed.
(function wormArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000\n.00.', mad: '000000\n0wwww0\n.0000.', daze: '.0.0\n0.0.', dead: '0000' };
  const worm = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0, ramp = f.p ? '1pPq' : '1234';
    let r = sculpt(40, 32, [
      { e: [20, 26, 17, 5], ramp },
      { e: [20, 15 + dy, 13, 11 - b], ramp },
    ]);
    for (const x of [6, 12, 27, 33]) r = stamp(r, x, 24, 'y\ny\ny\ny');
    r = stamp(r, 13, 1 + dy, '0.........0\n.0.......0.');
    r = autoOutline(r);
    r = stamp(r, 11, 8 + dy + b, '.yyyy.....yyyy.\ny....y...y....y\ny....yyyyy....y\ny....y...y....y\n.yyyy.....yyyy.');
    r = bossEyes(r, 12, 8 + dy + b, 10, f.face);
    r = stamp(r, 17, 16 + dy + b, f.a && f.face === 'calm' ? '000000\n0PPPP0\n.0000.' : MOUTH[f.face]);
    return rim(r, { '3': '2', q: 'P' });
  };
  bossFrames('gworm', worm, o);
  for (const [k, ramp] of [['wseg', '1234'], ['wseg_p', '1pPq']]) {
    let r = sculpt(18, 14, [{ e: [9, 7, 8, 6], ramp }]);
    r = stamp(r, 5, 2, 'y\ny\ny\ny\ny\ny\ny\ny\ny\ny'); r = stamp(r, 12, 2, 'y\ny\ny\ny\ny\ny\ny\ny\ny\ny');
    r = stamp(r, 7, 5, 'YYYY');
    def(k, autoOutline(r), { flash: true });
  }
})();
const WORM_WORDS = { 1: 'BANG', 2: 'ZZZ', 3: 'END' };
Object.assign(EDEF, {
  gworm: { hp: 470, r: 14, h: 30, hw: 16, hh: 6, sw: 40, boss: true, intro: 'CHAPTER 1: THE HUNGRY PAGE', phases: [0.66, 0.33], colors: ['2', '3', 'y'],
    init: (e) => { e.x = 192; e.y = OY + 74; e.n = 0; e.hist = []; e.tr = []; e.ink = []; },
    sprite: (e) => bossFrame(e, { bite: 'tell', words: 'tell', aim: 'tell', wave: 'tell', dash: 'atk', spit: 'atk' }[e.state] || bob(e, 1.5, 1, 0)),
    glint: (e) => (e.state === 'words' || e.state === 'wave' ? [0, -26] : null),
    // its body: book spines trailing behind the head
    under: (e, ox, oy) => {
      const tr = e.tr || [], s = S(e.p2 ? 'wseg_p' : 'wseg');
      for (let i = tr.length - 1; i >= 0; i--) { shadow(ox + tr[i][0], oy + tr[i][1], 9); drawS(s, Math.round(ox + tr[i][0]) - 9, Math.round(oy + tr[i][1]) - 13, e.flash > 0 ? 2 : 0); }
    } },
});
FOE_NAMES.gworm = 'THE GREAT BOOKWORM';
function wordFan(e, p, spread, off) {
  const w = WORM_WORDS[e.phase || 1], a = Math.atan2(p.y - 7 - (e.y - 18), p.x - e.x) + (off || 0);
  muzzle(e.x, e.y - 14);
  for (let i = 0; i < w.length; i++) ebullet(e.x, e.y - 18, a + (i - (w.length - 1) / 2) * spread, 58, 'w' + w[i], true);
}
AI.gworm = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'gworm';
  if (e.hp < e.maxHp * 0.66 && (e.phase || 1) < 2) { bossPhase(e, 2); G.banner = { title: 'CHAPTER 2', sub: 'THE INK FLOOD', t: 2.2, icon: null }; }
  if (e.hp < e.maxHp * 0.33 && e.phase < 3) { bossPhase(e, 3); G.banner = { title: 'CHAPTER 3', sub: 'THE END', t: 2.2, icon: null }; e.pages = 0; libPage(room, 'worm1'); }
  // the body follows the head's path
  const h = e.hist, last = h[h.length - 1];
  if (!last || Math.hypot(e.x - last[0], e.y - last[1]) > 4) { h.push([e.x, e.y]); if (h.length > 20) h.shift(); }
  e.tr = [16, 12, 8, 4].map(k => h[Math.max(0, h.length - 1 - k)]).filter(Boolean).map(([x, y]) => [x | 0, y | 0]);
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'crawl'; e.t = 1; } return; }
  if (!p) return;
  // chapter 2: the ink spreads from the walls, a puddle every few seconds
  if (e.phase >= 2 && e.ink.length < 6 && (e.it = (e.it || 3) - dt) <= 0) {
    e.it = 5;
    const side = grand() * 4 | 0, u = grnd(0.15, 0.85);
    const x = side < 2 ? 32 + u * (VW - 64) : side === 2 ? 36 : VW - 36, y = side === 0 ? OY + 46 : side === 1 ? OY + 180 : OY + 50 + u * 126;
    e.ink.push([x | 0, y | 0, 18]); Audio_.sfx('pop');
  }
  if (e.state === 'crawl') {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, sp = e.p2 ? 36 : 30;
    if (d > 76) moveBox(room, e, dx / d * sp * dt, dy / d * sp * dt, 'enemy');
    e.flip = dx < 0;
    if (e.t > 0) return;
    const k = e.n++ % 4;
    // chapter 3: every second round the page turns, open or closed
    if (e.phase >= 3 && k === 0 && !room.pgq && e.n > 1) {
      if (room.pg === 'worm1') { libPage(room, 'worm2'); e.state = 'close'; e.t = 1.4; return; }
      libPage(room, 'worm1');
    }
    if (k === 0 || k === 2 && (e.phase || 1) < 2) {
      // bites round the hero; free floor under a bite sinks into ink
      const spots = [[p.x, p.y]];
      for (let j = 0; j < ((e.phase || 1) > 1 ? 2 : 1); j++) { const a = grand() * Math.PI * 2; spots.push([p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 18]); }
      e.bites = spots.map(([x, y], j) => { G.markers.push({ x, y, t: 0.9 + j * 0.15, max: 0.9 + j * 0.15, src: 'gworm', fall: '', n: 0, r: 12 }); return [x, y]; });
      e.state = 'bite'; e.t = 1.25; Audio_.sfx('charge');
    } else if (k === 1) { e.state = 'words'; e.t = 0.7; e.w = 0; }
    else if (k === 2) { e.state = 'wave'; e.t = 0.7; Audio_.sfx('charge'); }
    else {
      e.state = 'aim'; e.t = 0.9;
      let len = 20;
      const la = Math.atan2(p.y - e.y, p.x - e.x);
      while (len < 240 && !boxSolid(room, e.x + Math.cos(la) * len, e.y + Math.sin(la) * len, e.hw, e.hh, 'enemy')) len += 6;
      lane(e, p, len); e.len = len - 6;
    }
  } else if (e.state === 'bite') {
    if (e.t > 0) return;
    room.sunk = room.sunk || [];
    for (const [x, y] of e.bites) {
      const c = Math.floor(x / 16), r = Math.floor((y - OY - 4) / 16);
      if (room.sunk.length < 8 && pitOk(room, c, r)) { setTile(room, c, r, T_PIT); room.sunk.push(r * COLS + c); }
    }
    G.shake = Math.max(G.shake, 2); Audio_.sfx('brk');
    e.state = 'crawl'; e.t = 1;
  } else if (e.state === 'words') {
    // it backs off before it spits, so the words have room to spread
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (d < 90) moveBox(room, e, dx / d * 60 * dt, dy / d * 60 * dt, 'enemy');
    if (e.t > 0) return;
    wordFan(e, p, 0.3, e.w % 2 ? 0.15 : 0);
    Audio_.sfx('eshoot');
    e.t = 0.5;
    if (++e.w >= ((e.phase || 1) > 1 ? 2 : 1)) { e.state = 'crawl'; e.t = 1.1; }
  } else if (e.state === 'wave') {
    if (e.t > 0) return;
    // a wave of ink down the page, with a gap three drops wide
    const gap = 2 + (grand() * 13 | 0);
    for (let i = 0; i < 18; i++) if (i < gap || i > gap + 2) ebullet(24 + i * 20, OY + 38, Math.PI / 2, 46, 'ink', true);
    Audio_.sfx('boom');
    e.state = 'crawl'; e.t = 2;
  } else if (e.state === 'aim') {
    if (e.t <= 0) { e.state = 'dash'; e.t = e.len / 150; Audio_.sfx('dash'); }
  } else if (e.state === 'dash') {
    const bl = moveBox(room, e, Math.cos(e.la) * 150 * dt, Math.sin(e.la) * 150 * dt, 'enemy');
    if (Math.random() < 0.5) dust(e.x, e.y, 1, 6);
    if (bl || e.t <= 0) {
      G.shake = Math.max(G.shake, 4); Audio_.sfx('boom'); dust(e.x, e.y, 8, 16);
      stagger(e, 1.5); toast('THE BOOKWORM BONKS ITS HEAD!');
      e.state = 'crawl'; e.t = 0.6;
    }
  } else if (e.state === 'close') {
    // the last page has turned: the book shuts on it
    if (e.t > 0 || room.pgq) return;
    stagger(e, 3); toast('THE LAST PAGE! THE BOOKWORM IS DAZED!');
    e.state = 'crawl'; e.t = 0.5;
  }
};
BEASTS.push({ t: 'gworm', spr: 'gworm_0', boss: true, lore: ['IT HAS EATEN A WHOLE LIBRARY.', 'EACH CHAPTER, A NEW TRICK.', 'WHEN THE BOOK CLOSES, IT IS DAZED.'] });

// ---------- The Red Pen (the Story Library's other boss) ----------
// A big red pen with a purple cap. It crosses out where you stand (a big X of pink rings),
// underlines a row (a cyan lane, then it races along it), throws fans of red ink (glint first),
// and circles you: a ring of pink rings with a gap, whose ink flies inward when they pop. After
// the circle the pen runs dry and is dazed. Phase 2: two crosses, and a second underline.
(function penArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const pen = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0;
    let r = sculpt(32, 32, [
      { r: [10, 7 + dy, 12, 19 - b, 5], ramp: f.p ? 'rRoY' : 'prRq' },
      { r: [10, 1 + dy, 12, 8, 4], ramp: '1234' },
    ]);
    r = stamp(r, 20, 2 + dy, 'y\ny\ny\ny\ny\ny\nY');
    r = stamp(r, 11, 9 + dy, 'yyyyyyyyyy');
    r = stamp(r, 12, 26 - b, 'llllllll\n.lLLLLl.\n..lLLl..\n...11...');
    r = autoOutline(r);
    r = bossEyes(r, 11, 12 + dy, 6, f.face);
    r = stamp(r, 14, 18 + dy, MOUTH[f.face]);
    return rim(r, { R: 'r', '3': '2' });
  };
  bossFrames('rpen', pen, o);
})();
Object.assign(EDEF, {
  rpen: { hp: 370, r: 12, h: 30, hw: 10, hh: 5, sw: 30, boss: true, fly: true, intro: 'EVERYTHING HERE IS WRONG', colors: ['r', 'R', '2'],
    init: (e) => { e.n = 0; e.z = 10; },
    sprite: (e) => bossFrame(e, { cross: 'tell', fan: 'tell', goto: 'tell', uline: 'tell', circle: 'tell', dash: 'atk' }[e.state] || bob(e, 2, 1, 0)),
    glint: (e) => (e.state === 'fan' ? [0, -30] : null) },
});
FOE_NAMES.rpen = 'THE RED PEN';
LAND.library.alt = ['rpen'];
// where a hero walking on will be in t seconds, kept inside the page
const penLead = (p, t) => [Math.max(32, Math.min(VW - 32, p.x + (p.mvx || 0) * t)), Math.max(OY + 44, Math.min(OY + 184, p.y + (p.mvy || 0) * t))];
AI.rpen = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'rpen';
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  e.calm = e.state !== 'dash';
  e.z = 10 + Math.sin(e.anim * 2) * 2;
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'drift'; e.t = 1; } return; }
  if (!p) return;
  if (e.state === 'drift') {
    const tx = Math.max(60, Math.min(VW - 60, p.x)), ty = p.y < OY + 112 ? OY + 168 : OY + 64; // the half of the page the hero is not on
    moveBox(room, e, (tx - e.x) * 1.2 * dt, (ty - e.y) * 1.2 * dt, 'fly');
    if (e.t > 0) return;
    const k = e.n++ % 4;
    if (k === 0) {
      // it reads ahead: the X lands where the hero is heading (standing still or turning dodges it)
      const [lx, ly] = penLead(p, 0.9);
      crossOut(lx, ly, 1, 'rpen', 1);
      if (e.p2) crossOut(p.x, p.y, 1.3, 'rpen', 1);
      Audio_.sfx('charge'); e.state = 'cross'; e.t = 1.2;
    } else if (k === 1) { e.state = 'fan'; e.t = 0.5; e.w = 0; }
    else if (k === 2) { e.ul = e.p2 ? 2 : 1; e.state = 'goto'; e.uy = Math.max(OY + 48, Math.min(OY + 178, p.y)); e.ux = e.x < 192 ? 30 : VW - 30; }
    else {
      // the circle: 12 rings round where the hero is heading, four left out
      const [cx, cy] = penLead(p, 0.7), N = 12, g = grand() * N | 0;
      e.circ = [];
      for (let i = 0; i < N; i++) {
        if ((i - g + N) % N < 4) continue;
        const a = i * Math.PI * 2 / N, x = cx + Math.cos(a) * 52, y = cy + Math.sin(a) * 36;
        G.markers.push({ x, y, t: 1.1, max: 1.1, src: 'rpen', fall: '', n: 0 });
        e.circ.push([x, y, Math.atan2(cy - y, cx - x), Math.hypot(cx - x, cy - y)]);
      }
      Audio_.sfx('charge'); e.state = 'circle'; e.t = 1.1;
    }
  } else if (e.state === 'cross') { if (e.t <= 0) { e.state = 'drift'; e.t = 0.9; } }
  else if (e.state === 'fan') {
    if (e.t > 0) return;
    const [lx, ly] = e.w % 2 ? [p.x, p.y] : penLead(p, Math.hypot(p.x - e.x, p.y - e.y) / 66 * 0.35); // the first volley leads a little
    fan(e.x, e.y - 20, Math.atan2(ly - 7 - (e.y - 20), lx - e.x) + (e.w % 2 ? 0.15 : 0), 5, 0.3, 66, 'rink');
    Audio_.sfx('eshoot'); e.t = 0.45;
    if (++e.w >= 2) { e.state = 'drift'; e.t = 1; }
  } else if (e.state === 'goto') {
    const dx = e.ux - e.x, dy = e.uy - e.y, d = Math.hypot(dx, dy);
    if (d > 4) { moveBox(room, e, dx / d * Math.min(d, 200 * dt), dy / d * Math.min(d, 200 * dt), 'fly'); return; }
    e.state = 'uline'; e.t = 0.8;
    e.la = e.x < 192 ? 0 : Math.PI;
    G.markers.push({ kind: 'lane', x: e.x, y: e.y - 6, a: e.la, t: 1.6, max: 1.6, len: VW - 60 });
  } else if (e.state === 'uline') { if (e.t <= 0) { e.state = 'dash'; Audio_.sfx('dash'); } }
  else if (e.state === 'dash') {
    const bl = moveBox(room, e, Math.cos(e.la) * 210 * dt, 0, 'fly');
    if (Math.random() < 0.6) part(e.x, e.y - 4, 0, 0, 0.5, 'r', { drag: 1 });
    if (bl || e.x < 30 || e.x > VW - 30) {
      if (--e.ul > 0) { e.uy = Math.max(OY + 48, Math.min(OY + 178, p.y)); e.ux = e.x; e.state = 'goto'; }
      else { e.state = 'drift'; e.t = 1; }
    }
  } else if (e.state === 'circle') {
    if (e.t > 0) return;
    for (const [x, y, a, d] of e.circ) ebullet(x, y - 4, a, 50, 'rink').life = d / 50 + 0.15; // the ink dries in the middle
    e.circ = null; Audio_.sfx('boom');
    stagger(e, 2); toast('THE PEN RUNS DRY!');
    e.state = 'drift'; e.t = 0.6;
  }
};
BEASTS.push({ t: 'rpen', spr: 'rpen_0', boss: true, lore: ['THE LIBRARY\'S STRICTEST READER.', 'IT CROSSES OUT AND UNDERLINES.', 'WHEN IT CIRCLES YOU, FIND THE GAP.'] });

// ---------- Choose Your Path (the Story Library's special room) ----------
// Two books lie open on lecterns, each a short story with its own reward and risk. Read one and
// the other closes for good.
const LIB_STORIES = {
  knight: ['THE BRAVE KNIGHT', 'FIGHT A CHAMPION FOR A RARE ITEM'],
  nap: ['THE LONG NAP', 'EVERYONE HEALS, AND 5 COINS'],
  thief: ['THE LUCKY THIEF', '15 COINS, BUT HALF A HEART EACH'],
  map: ['THE STAR MAP', 'A STAR SCROLL AND A GEM'],
};
function booksStock(room) {
  const ids = Object.keys(LIB_STORIES), a = hash(room.seed, 1, 53) % 4, b = (a + 1 + hash(room.seed, 2, 53) % 3) % 4;
  [a, b].forEach((k, i) => room.props.push({ kind: 'lbook', x: 150 + i * 84, y: 126, t: 0, story: ids[k], col: k, done: false }));
}
function bookRead(o, p) {
  const room = G.room;
  if (o.done) { say(p, 'THE END'); return; }
  if (room.props.some(q => q.kind === 'lbook' && q.done)) { say(p, 'THIS BOOK IS SHUT'); Audio_.sfx('deny'); return; }
  o.done = true;
  for (const q of room.props) if (q.kind === 'lbook' && q !== o) { q.shut = true; poof(q.x, q.y - 14); }
  G.banner = { title: LIB_STORIES[o.story][0], sub: LIB_STORIES[o.story][1], t: 2.4, icon: null };
  Audio_.sfx('page');
  if (o.story === 'knight') { room.bk = 'knight'; room.cleared = false; room.doorT = 1.25; spawnChampion(room); }
  else if (o.story === 'nap') { for (const q of G.players) if (alive(q)) { q.hp = q.maxHp; burst(q.x, q.y - 10, 10, ['Y', 'w'], 60, 0.5, { g: -30 }); } for (let k = 0; k < 5; k++) spawnPickup('coin', o.x, o.y + 10); Audio_.sfx('heart'); }
  else if (o.story === 'thief') { for (let k = 0; k < 15; k++) spawnPickup('coin', o.x, o.y + 10); for (const q of G.players) if (alive(q) && q.hp > 1) { q.hp--; burst(q.x, q.y - 10, 6, ['r', 'R'], 50, 0.3); } Audio_.sfx('coin'); }
  else { spawnPickup('scroll', o.x - 12, o.y + 12); spawnPickup('gem', o.x + 12, o.y + 12); Audio_.sfx('win'); }
  G.propsN++;
}
// the knight's story ends with a rare item once the champion is down
function booksUpdate(room) {
  if (room.bk !== 'knight' || !room.cleared || room.bkPaid) return;
  room.bkPaid = true;
  const id = rareItem();
  if (id) addPedestal(room, 192, 150, id); else for (let k = 0; k < 8; k++) spawnPickup('coin', 192, 150);
  G.propsN++;
}
function drawLectern(o, x, y) {
  shadow(x, y, 10);
  drawFeet(S(o.shut || o.done ? 'lectern_c' : 'lectern_' + o.col), x, y + 1);
  if (!o.shut && !o.done && Math.floor(o.t * 3) % 3 === 0) drawS(S('sparkle_0'), x + 5, y - 24);
}
