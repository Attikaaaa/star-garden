'use strict';
// ---------- Toy Attic (The Beat) ----------
// Everything runs on the land's beat (LANDS bpm 90, G.beat in level.js): a metronome on the top
// wall swings it, toys step on the tick and shoot on the tock, and the fourth beat of the bar is
// the big one. Conveyor belts (layout '< > ^ v') carry whatever stands on them. Every wind-up toy
// (EDEF.wind) runs down after about WIND_T seconds and stands dazed: a kill window.
const WIND_T = 8, BELT_V = 40;
const TA = (name, art, opts) => def(name, autoOutline(parseArt(name, art)), opts);
const beatLen = () => 60 / ((G.floor && G.floor.land.bpm) || 90); // game time: assist slows the game and the beat alike
// close enough to a beat for the Wind-up Key
function onBeatNow() { const f = G.beat - Math.floor(G.beat), w = assistOn() ? 0.28 : 0.18; return G.beat > 0 && (f < w || f > 1 - w); } // assist: a wider window
// TIN SHIELD: the fourth beat of each bar turns one hit away
function tinShield(p) {
  const b = Math.floor(G.beat);
  if (!G.beat || b % 4 !== 3 || p.tsB === b) return false;
  p.tsB = b;
  burst(p.x, p.y - 8, 6, ['l', 'L', 'w'], 60, 0.3);
  Audio_.sfx('clack');
  return true;
}

// ---------- The metronome ----------
// It stands on the top wall's face; its arm is a pixel line (no rotation) that reaches a side on
// every beat, and its weight flashes white on beat four.
TA('metro', `
  ..............
  ......Nn......
  ......Nn......
  .....NAan.....
  .....NAan.....
  .....NAan.....
  ....NNAaan....
  ....NNAaan....
  ....NAAaann...
  ...NNAaaann...
  ...NNNNNnnn...
  ..NNnnnnnnnn..
  ..............`);
const METRO = {};
function drawMetro(ox, oy) {
  const s = S('metro'), x = ox + 7 * 16 + 1, y = oy + OY + 18;
  drawS(s, x, y);
  const pos = Math.cos(G.beat * Math.PI), dx = pos > 0.5 ? 3 : pos < -0.5 ? -3 : 0;
  const b = Math.floor(G.beat), big = b % 4 === 3 && G.beat - b < 0.2;
  for (let j = 0; j <= 8; j++) rect(x + 7 + Math.round(dx * j / 8), y + 10 - j, 1, 1, 'u');
  const wx = x + 7 + Math.round(dx * 5 / 8), wy = y + 4;
  rect(wx - 1, wy - 1, 3, 3, '0'); rect(wx, wy, 1, 1, big ? 'w' : 'y');
}

// ---------- Belts ----------
const BELT_CH = '>v<^', BDX = [0, 1, 0, -1, 0], BDY = [0, 0, 1, 0, -1];
// reads the belts of a land room into room.belt (tile index -> 1 right, 2 down, 3 left, 4 up),
// mirrored like the room. Deterministic, so every screen builds the same belts.
function beltsBuild(room, set) { // set: the land's layouts (the Ember Forge has belts too)
  const L = room.lay && (set || LAND_LAYOUTS.toy)[room.lay];
  if (room.type === 'warden') {
    // the Wind-up Mouse's room: two belts across the middle, one each way
    const b = room.belt = new Uint8Array(COLS * ROWS);
    for (let c = 2; c <= 21; c++) { b[5 * COLS + c] = 1; b[8 * COLS + c] = 3; }
    return;
  }
  if (!L) return;
  if (room.lay === 'turn') room.tt = { c0: 9, r0: 4, n: 6 }; // the turntable: a 6x6 block in the middle (flip-proof)
  const [fx, fy] = room.flip || [false, false];
  let any = false;
  const b = new Uint8Array(COLS * ROWS);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) {
    let d = BELT_CH.indexOf(L[fy ? 9 - y : y][fx ? 21 - x : x]) + 1;
    if (!d) continue;
    if (fx && d % 2) d = d === 1 ? 3 : 1;
    if (fy && !(d % 2)) d = d === 2 ? 4 : 2;
    const i = (y + 2) * COLS + x + 1;
    if (room.tiles[i] === T_FLOOR) { b[i] = d; any = true; }
  }
  if (any) room.belt = b;
  // piano keys ('k'), only painted
  if (room.lay === 'piano') {
    room.keys = [];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) if (L[fy ? 9 - y : y][fx ? 21 - x : x] === 'k') room.keys.push((y + 2) * COLS + x + 1);
  }
}
// a belt carries whoever stands on it (LAND_MECH drift hook)
function beltDrift(room, x, y, out) {
  const d = room.belt && room.belt[Math.floor((y - 1 - OY) / 16) * COLS + Math.floor(x / 16)];
  const v = assistOn() ? BELT_V * 0.6 : BELT_V; // assist: slower belts (solo only, so every screen agrees)
  if (d) { out.cx += BDX[d] * v; out.cy += BDY[d] * v; }
}
// chevrons roll along each belt at its speed
function beltsDraw(ox, oy, room, key) {
  if (!room.belt) return;
  const off = Math.floor(G.time * BELT_V) % 8;
  for (let i = 0; i < room.belt.length; i++) {
    const d = room.belt[i];
    if (!d) continue;
    const x = ox + (i % COLS) * 16, y = oy + OY + ((i / COLS) | 0) * 16;
    for (let k = 0; k < 2; k++) {
      const p = (off + k * 8) % 16;
      if (p > 12) continue;
      const q = d === 1 || d === 2 ? p + 1 : 14 - p;
      if (d % 2) chev(x + q - 1, y + 8, d, key); else chev(x + 8, y + q - 1, d, key);
    }
  }
}
// a chevron 3 wide, 5 long, pointing along d (drawn pixel by pixel, mirrored, never rotated)
const CHEV = [[0, -2], [1, -1], [2, 0], [1, 1], [0, 2]];
function chev(x, y, d, key) {
  for (const [a, b] of CHEV) {
    const px = d === 1 ? a : d === 3 ? -a : b, py = d === 2 ? a : d === 4 ? -a : b;
    rect(x + px, y + py, 1, 1, key);
  }
}

// ---------- The floor ----------
// Floorboards two to a tile with staggered joints, a rug in quiet rooms, belts and piano keys.
THEMES.toy.paint = function (g, room) {
  const f = (x, y, w, h, k) => { g.fillStyle = PAL[k]; g.fillRect(x, y, w, h); };
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    const i = r * COLS + c, x = c * 16, y = OY + r * 16;
    if (room.tiles[i] === T_PIT) continue;
    for (let h = 0; h < 2; h++) {
      const by = y + h * 8, j = r * 2 + h;
      f(x, by, 16, 8, 'N'); f(x, by, 16, 1, 'e'); f(x, by + 7, 16, 1, 'n');
      if ((c + j * 2) % 3 === 0) f(x, by, 1, 8, 'n');
      if (hash(c, j, room.seed) % 13 === 0) f(x + 4 + hash(j, c, 3) % 8, by + 3, 2, 1, 'n');
    }
    const d = room.belt && room.belt[i];
    if (d) {
      f(x, y, 16, 16, 'x');
      if (d % 2) { f(x, y, 16, 1, '0'); f(x, y + 1, 16, 1, 'X'); f(x, y + 14, 16, 1, 'X'); f(x, y + 15, 16, 1, '0'); }
      else { f(x, y, 1, 16, '0'); f(x + 1, y, 1, 16, 'X'); f(x + 14, y, 1, 16, 'X'); f(x + 15, y, 1, 16, '0'); }
    }
  }
  if (room.keys && room.keys.length) {
    // white keys a tile wide, black ones over the joins (none between E-F and B-C)
    for (const i of room.keys) {
      const x = (i % COLS) * 16, y = OY + ((i / COLS) | 0) * 16;
      f(x, y, 16, 16, 'L'); f(x + 15, y, 1, 16, 'm'); f(x, y, 1, 16, 'w');
      if (!room.keys.includes(i + COLS)) { f(x, y + 14, 16, 1, 'l'); f(x, y + 15, 16, 1, '0'); }
      if (!room.keys.includes(i - COLS)) f(x, y, 16, 1, '0');
    }
    const top = Math.min(...room.keys), row = (top / COLS) | 0, c0 = top % COLS;
    for (let c = c0 + 1; room.keys.includes(row * COLS + c); c++) {
      if ((c - c0) % 7 === 3 || (c - c0) % 7 === 0) continue;
      const x = c * 16 - 4, y = OY + row * 16;
      f(x - 1, y, 10, 27, '0'); f(x, y, 8, 26, 'x'); f(x, y, 2, 25, 'X');
    }
  } else if (room.tt) {
    // the turntable: a record with grooves and a red label, a dark rim round it
    const { c0, r0, n } = room.tt, x0 = c0 * 16, y0 = OY + r0 * 16, W = n * 16, cx = x0 + W / 2, cy = y0 + W / 2;
    f(x0 - 2, y0 - 2, W + 4, W + 4, '0'); f(x0 - 1, y0 - 1, W + 2, W + 2, 'X');
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x + 0.5 - W / 2, y + 0.5 - W / 2);
      f(x0 + x, y0 + y, 1, 1, d < 3 ? 'y' : d < 12 ? (d < 5 || (x + y) % 5 ? 'r' : 'R') : d > W / 2 - 1 ? 'x' : (d | 0) % 5 === 0 ? 'X' : 'x');
    }
  } else if (!room.belt && room.type !== 'boss' && room.type !== 'warden' && room.type !== 'arena') {
    // a rug: a yellow border round a blue diamond weave
    for (let r = 5; r <= 8; r++) for (let c = 7; c <= 16; c++) {
      if (room.tiles[r * COLS + c] !== T_FLOOR) continue;
      const x = c * 16, y = OY + r * 16;
      f(x, y, 16, 16, 'b');
      for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) if ((xx + yy) % 8 === 0 || (xx - yy + 16) % 8 === 0) f(x + xx, y + yy, 1, 1, 'B');
      if (r === 5) { f(x, y, 16, 3, 'y'); f(x, y + 3, 16, 1, 'o'); }
      if (r === 8) { f(x, y + 12, 16, 1, 'o'); f(x, y + 13, 16, 3, 'y'); }
      if (c === 7) { f(x, y, 3, 16, 'y'); f(x + 3, y, 1, 16, 'o'); }
      if (c === 16) { f(x + 12, y, 1, 16, 'o'); f(x + 13, y, 3, 16, 'y'); }
    }
  }
};

// ---------- Crayon lines ----------
// A 'zap' marker with c: 'crayon' (h: seconds it is only a drawing); zapHit skips the harmless part.
const CRAYON = [];
[
  '.rr.....rr..',
  'r..r...r..r.',
  '....r.r....r',
  '.....r......',
].forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') CRAYON.push([x - 6, y - 2]); }));
function drawCrayon(k, ox, oy) {
  const age = k.max - k.t, hot = age >= k.h;
  if (!hot && age < k.h - 0.4 ? Math.floor(G.time * 4) % 4 === 0 : !hot && Math.floor(G.time * 12) % 2) return;
  if (hot && k.t < 0.1 && Math.floor(G.time * 20) % 2) return;
  const x = Math.round(ox + k.x), y = Math.round(oy + k.y);
  for (const [a, b] of CRAYON) rect(x + a, y + b, 1, 1, hot ? 'r' : 'q');
  if (hot) for (const [a, b] of CRAYON) if ((a + b) % 3 === 0) rect(x + a, y + b - 1, 1, 1, 'R');
}

LAND_MECH.toy = {
  build: beltsBuild,
  ground: true, // belts carry who stands on them, not shots and bullets
  drift: beltDrift,
  // host / solo: keys run down, the turntable turns; now and then a Crayon Scribbler wanders in
  update(dt, room) {
    if (room.tt && !room.cleared && onBeat(room.tt) && Math.floor(G.beat) % 8 === 0) turnTable(room);
    for (const e of G.enemies) {
      if (e.dead || !EDEF[e.type].wind || e.spawnT > 0) continue;
      if (e.wind === undefined) e.wind = WIND_T + grnd(0, 3);
      if (e.stag > 0) continue;
      if ((e.wind -= dt) <= 0) { e.wind = WIND_T; e.state = 'idle'; e.ext = 0; stagger(e, 2); }
    }
    if (room.cray === undefined) room.cray = room.type === 'normal' && !room.cleared && !G.first && grand() < 0.2 ? grnd(4, 8) : 0;
    if (room.cray > 0 && G.enemies.length && (room.cray -= dt) <= 0) {
      room.cray = 0;
      const d = ['l', 'r', 'u', 'd'].find(k => room.doors[k]) || 'l', [x, y] = ENTRY[d];
      spawnEnemy('crayon', x, y, { elite: true });
      toast('A CRAYON SCRIBBLER! MIND ITS LINES!');
    }
  },
  every(dt, room) {
    if (Save.settings.metro && onBeat(METRO)) Audio_.local('tick'); // BEAT CLICK: this screen only
    if (!Save.flags.toy) { Save.flags.toy = true; Save.write(); } // unlocks the BEAT CLICK setting
  },
  drawLayer(ox, oy, room, layer) {
    if (layer === 0) {
      if (room.tt) ttDraw(ox, oy, room);
      beltsDraw(ox, oy, room, 'y');
      return;
    }
    if (layer !== 1) return;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const z = Math.round(e.z || 0);
      if (e.type === 'jack') jackDraw(e, ox, oy);
      if (e.type === 'jester' && e.ef > 0 && e.las) for (const [a, len] of e.las) springDraw(e.x, e.y - JESTER_ARM_Y, a, len * e.ef, ox, oy, e.flash > 0);
      if (e.type === 'mouse' && e.spawnT <= 0) {
        const f = e.stag > 0 ? 0 : Math.floor(e.anim * (e.state === 'dash' ? 14 : 5)) % 3, [kx, ky] = mouseKey(e), s = S(f === 1 ? 'mkey_1' : 'mkey_0');
        drawS(s, ox + kx - (s.w >> 1), oy + ky - (s.h >> 1), f === 2 ? 1 : 0);
      }
      if (!EDEF[e.type].wind || e.wind === undefined || e.spawnT > 0) continue;
      // the key on its back turns slower as it runs down, and stops while dazed
      const rate = e.stag > 0 ? 0 : 2 + e.wind * 1.2, f = Math.floor(e.anim * rate) % 3;
      const s = S(f === 1 ? 'wkey_1' : 'wkey_0'), sp = enemySprite(e);
      drawS(s, ox + e.x + (e.flip ? 5 : -5) - (s.w >> 1), oy + e.y - z - (sp.h >> 1) - (s.h >> 1) - 1, f === 2 ? 1 : 0);
    }
  },
};

// the attic's own items
Object.assign(ITEMS, {
  wkey: { name: 'WIND-UP KEY', desc: 'SHOTS ON THE BEAT HIT HARDER', land: 'toy', unique: true, apply: p => { p.wkey = true; } },
  tshield: { name: 'TIN SHIELD', desc: 'BLOCKS A HIT ON EVERY BEAT FOUR', land: 'toy', unique: true, apply: p => { p.tshield = true; } },
  rball: { name: 'RUBBER BALL', desc: 'YOUR SHOTS BOUNCE ONCE MORE', land: 'toy', apply: p => { p.bounce++; } },
});

// ---------- Rooms ----------
LAND_LAYOUTS.toy = {
  // Domino Run: rows of standing dominoes
  domino: `......................
    ..e.......ee.......e..
    ...#..#..#....#..#..#.
    ...#..#..#....#..#..#.
    ......................
    ......................
    .#..#..#....#..#..#...
    .#..#..#....#..#..#...
    ..e.......ee.......e..
    ......................`,
  // Block Tower: letter blocks stacked in the middle
  block: `......................
    ..e................e..
    .....##........##.....
    .....#..........#.....
    .........####.........
    ....e....####....e....
    .....#..........#.....
    .....##........##.....
    ..e.......ee.......e..
    ......................`,
  // Train Set: a belt loop round a little station
  train: `......................
    ..e.......ee.......e..
    ...>>>>>>>>>>>>>>>v...
    ...^..............v...
    ...^....#..#......v...
    ...^.....e..e.....v...
    ...^..............v...
    ...^<<<<<<<<<<<<<<<...
    ..e.......ee.......e..
    ......................`,
  // Piano Floor: a keyboard across the room
  piano: `......................
    ..e.......ee.......e..
    ......................
    ...kkkkkkkkkkkkkkkk...
    ...kkkkkkkkkkkkkkkk...
    ...kkkkkkkkkkkkkkkk...
    ......................
    .#......e....e......#.
    ..e.......ee.......e..
    ......................`,
  // Dollhouse Hall: two house fronts full of tiny doors
  dollhouse: `......................
    ..e................e..
    .###.####.##.####.###.
    ......................
    ......e........e......
    ......................
    .###.####.##.####.###.
    ..e................e..
    ......................
    ......................`,
  // Turntable: a record in the middle turns its blocks a quarter step every other bar
  turn: `......................
    ..e.......ee.......e..
    ........##..#.........
    ........#.............
    ...e....#..b.......e..
    ..........b..#........
    .............#........
    ............##........
    ..e.......ee.......e..
    ......................`,
  // Marble Run: two chutes of belts that meet in the middle, blocks for bumpers
  marble: `......................
    ..e.......ee.......e..
    ..>>>>>v......v<<<<<..
    .......v..##..v.......
    ...#...v......v...#...
    ...#...v......v...#...
    .......>>>..<<<.......
    .........e..e.........
    ..e................e..
    ......................`,
};
for (const k in LAND_LAYOUTS.toy) LAND_LAYOUTS.toy[k] = LAND_LAYOUTS.toy[k].split('\n').map(r => r.trim());
Object.assign(LAY_RULE, {
  train: { pool: [['marble', 3], ['tin', 2], ['drum', 1]] },
  marble: { pool: [['marble', 4], ['plane', 1], ['jack', 1]] },
  domino: { pool: [['tin', 4], ['jack', 1]] },
  piano: { pool: [['drum', 2], ['tin', 2], ['plane', 1]] },
  turn: { pool: [['tin', 2], ['marble', 2], ['drum', 1]] },
});

// ---------- Foe art ----------
(function toyArt() {
  const o = { flip: true, flash: true, glow: true };
  TA('tin_0', `
    ............
    .....Yy.....
    ....BBBb....
    ....BBbb....
    ....Bbbb....
    ....yyyo....
    ....sssk....
    ....ss0k....
    ....skkk....
    ...RRRrrr...
    ..sRyRrrrs..
    ..kRRyrrrk..
    ...wwwwwl...
    ...BBBbbb...
    ...BB..bb...
    ...BB..bb...
    ...xx..xxx..
    ............`, o);
  TA('tin_1', `
    ............
    .....Yy.....
    ....BBBb....
    ....BBbb....
    ....Bbbb....
    ....yyyo....
    ....sssk....
    ....ss0k....
    ....skkk....
    ...RRRrrr...
    ..sRyRrrrs..
    ..kRRyrrrk..
    ...wwwwwl...
    ...BBBbbb...
    ....BBbb....
    ....BBbb....
    ....xxxxx...
    ............`, o);
  TA('wkey_0', `
    .........
    .Yy...Yy.
    .yoy.yoo.
    ..yyyyo..
    .yoy.yoo.
    .yo...oo.
    .........`);
  TA('wkey_1', `
    .....
    ..Y..
    ..y..
    ..y..
    ..o..
    ..o..
    .....`);
  const box = (lid) => `
    ................
    ................
    ................
    ................
    ................
    ................
    ${lid ? '................' : '...CCCCCCCCCc...'}
    ${lid ? '...0000000000...' : '...BBBBBBBBBb...'}
    ...qqqqqqqqqP...
    ...qPPPPPPPPpll.
    ...qPPPyPPPPp.l.
    ...qPPyYyPPPp.L.
    ...qPPPyPPPPp...
    ...qPPPPPPPPp...
    ...pppppppppp...
    ................`;
  TA('jack_0', box(false), o);
  TA('jack_1', box(true), o);
  TA('jackh', `
    ..........
    .R..y...B.
    .Rr.yy.Bb.
    .rRryyBBb.
    ..LLLLLLl.
    ..L0LL0Ll.
    ..LLLrLLl.
    ..LpPPpLl.
    ...Llll...
    ..........`);
  for (let i = 0; i < 3; i++) def('marble_' + i, stamp(sculpt(12, 12, [{ e: [6, 6.5, 4.5, 4.5], ramp: 'bBcC' }]), [3, 5, 6][i], [5, 3, 6][i], ['P.\n.P', 'PP\n..', '.P\nP.'][i]), o);
  TA('plane_0', `
    ................
    .Lw.............
    .lLww...........
    ..lLLwww........
    ..mlLLLLwwww....
    ...mmlllLLLLww..
    ....mmmmmllll...
    ................`, o);
  TA('plane_1', `
    ................
    ................
    .lLwww..........
    ..mlLLLwwww.....
    ...mmllLLLLLww..
    ....mmmmmllll...
    ................
    ................`, o);
  const drum = (up) => `
    ..............
    ${up ? '...A......A...' : '..............'}
    ${up ? '...N......N...' : '..............'}
    ${up ? '...N......N...' : '..............'}
    ${up ? '...N......N...' : '.A..........A.'}
    ${up ? '...n......n...' : '..N........N..'}
    ${up ? '..............' : '...N......N...'}
    ${up ? '...LLLLLLLL...' : '...LNLLLLNL...'}
    ..LwLLLLLLll..
    ..llllllllld..
    ..BBBBBBBBBb..
    ..Ryrrrrryrn..
    ..Rryrrryrrn..
    ..Rrryryrrrn..
    ..Rrrryrrrrn..
    ..bBBBBBBBBb..
    ..............`;
  TA('drum_0', drum(false), o);
  TA('drum_1', drum(true), o);
  const cray = (a) => `
    ..........
    ....R.....
    ....Rr....
    ...RRrr...
    ..RRrrrp..
    ..Rrrrrp..
    ..yyyyyo..
    ..y0yy0o..
    ..yyyyyo..
    ..rrrrrp..
    ..yyyyyo..
    ..Rrrrrp..
    ..Rrrrrp..
    ..pppppp..
    ${a ? '..p....p..' : '...p..p...'}
    ..........`;
  TA('crayon_0', cray(0), o);
  TA('crayon_1', cray(1), o);
  // item icons
  TA('icon_wkey', `
    ................
    ...YYy....YYy...
    ..Yy.yo..Yy.yo..
    ..yo..yoyy..oo..
    ...yo..yyo.oo...
    ....yoooyooo....
    .......yo.......
    .......yo.......
    .......yo.......
    .......yo.......
    .......yoyo.....
    .......yo.......
    .......yoyo.....
    .......oo.......
    ................
    ................`, { sil: '1' });
  def('icon_tshield', stamp(sculpt(16, 16, [{ e: [8, 8.5, 6, 6.5], ramp: 'dmlL' }]), 6, 6, '.y.\nyYy\n.y.'), { sil: '1' });
  def('icon_rball', stamp(sculpt(16, 16, [{ e: [8, 8.5, 6, 6], ramp: 'prRq' }]), 3, 8, 'yyyyyyyyyy'), { sil: '1' });
  // bullets: a tin button and a drum's shock pip
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  const B = {
    tin: [['.Ll.', 'LlLm', 'lLlm', '.mm.'], ['..Ll..', '.LwLl.', 'LwlLlm', 'lLlLlm', '.lLlm.', '..mm..']],
    drum: [['.RR.', 'RwRr', 'RRrr', '.rr.'], ['..RR..', '.RwRr.', 'RwRRrr', 'RRRrrp', '.Rrrp.', '..pp..']],
  };
  for (const k in B) {
    def('eb_' + k, pad(B[k][0])); def('ebb_' + k, pad(B[k][1]));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
})();

// ---------- Foes ----------
const DIR4 = [[1, 0], [0, 1], [-1, 0], [0, -1]];
// the spring of a Jack-in-the-Box punches out along e.la for e.ext px
function jackHit(e, q) {
  if (!(e.ext > 4)) return false;
  const ax = e.x, ay = e.y - 8, dx = Math.cos(e.la), dy = Math.sin(e.la);
  const t = Math.max(0, Math.min(e.ext, (q.x - ax) * dx + (q.y - 5 - ay) * dy));
  return Math.hypot(ax + dx * t - q.x, ay + dy * t - (q.y - 5)) < 8;
}
function jackDraw(e, ox, oy) {
  if (e.state !== 'coil' && e.state !== 'punch') return;
  const h = S('jackh'), ax = ox + e.x, ay = oy + e.y - 10;
  if (e.state === 'coil') { drawS(h, ax - 5 + (Math.floor(G.time * 20) % 2), ay - 7, e.flash > 0 ? 2 : 0); return; }
  const n = Math.max(1, Math.round(e.ext / 3)), dx = Math.cos(e.la), dy = Math.sin(e.la);
  for (let i = 1; i <= n; i++) {
    const t = e.ext * i / n, s = (i % 2 ? 2 : -2);
    const x = Math.round(ax + dx * t - dy * s), y = Math.round(ay + dy * t + dx * s);
    rect(x - 1, y - 1, 3, 3, '0'); rect(x, y, 1, 1, i % 2 ? 'l' : 'm');
  }
  drawS(h, Math.round(ax + dx * e.ext) - 5, Math.round(ay + dy * e.ext) - 7, e.flash > 0 ? 2 : 0);
}
let PLANE_WING = false;
Object.assign(EDEF, {
  // marches straight until it hits something, turns a corner and fires down the new way on a tock
  tin: { hp: 7, beat: true, r: 6, h: 14, hw: 5, hh: 3, sw: 12, wind: true, colors: ['r', 'R', 'y'],
    sprite: (e) => S('tin_' + (e.state === 'march' ? Math.floor(G.beat) % 2 : 1)),
    glint: (e) => (e.state === 'aim' ? [0, -10] : null) },
  // a lid that opens on beat three (the coil and a cyan lane) and a spring that punches on four
  jack: { hp: 9, beat: true, r: 6, h: 10, hw: 6, hh: 4, sw: 14, still: true, wind: true, colors: ['P', 'q', 'y'],
    sprite: (e) => S(e.state === 'coil' || e.state === 'punch' ? 'jack_1' : 'jack_0'),
    hits: (e, p) => e.state === 'punch' && !(e.stag > 0) && jackHit(e, p) },
  // rolls, bounces off walls and rides the belts
  marble: { hp: 5, r: 5, h: 10, hw: 4, hh: 3, sw: 10, colors: ['B', 'c', 'P'],
    sprite: (e) => S('marble_' + (Math.floor(e.anim * 8) % 3)) },
  // comes in threes; they fold (a cyan lane) on the bar's first beat and dart down it on the next
  plane: { hp: 3, beat: true, r: 6, h: 8, hw: 5, hh: 3, sw: 12, fly: true, colors: ['L', 'l', 'q'],
    sprite: (e) => S(e.state === 'dart' || e.state === 'tele' ? 'plane_1' : 'plane_0'),
    init: (e) => {
      if (PLANE_WING) return;
      PLANE_WING = true;
      for (const s of [-1, 1]) spawnEnemy('plane', e.x + s * 16, e.y + 10, { elite: e.elite });
      PLANE_WING = false;
    } },
  // raises its sticks on beat three and drums a ring with a gap on four, every other bar
  drum: { hp: 11, beat: true, r: 7, h: 13, hw: 6, hh: 4, sw: 14, still: true, wind: true, colors: ['r', 'B', 'y'],
    sprite: (e) => S(e.state === 'raise' ? 'drum_1' : 'drum_0'),
    glint: (e) => (e.state === 'raise' ? [0, -16] : null) },
  // an elite that wanders in: its crayon line turns hot a second after it is drawn
  crayon: { hp: 14, r: 6, h: 14, hw: 4, hh: 3, sw: 10, colors: ['r', 'y', 'R'],
    sprite: (e) => S('crayon_' + (Math.floor(e.anim * 6) % 2)) },
});
EF_EXTRA.push('wind', 'ext', 'la');
Object.assign(FOE_NAMES, { tin: 'TIN SOLDIER', jack: 'JACK-IN-THE-BOX', marble: 'MARBLE RUNNER', plane: 'PAPER PLANE', drum: 'TEDDY DRUMMER', crayon: 'CRAYON SCRIBBLER' });

Object.assign(AI, {
  tin(e, dt, room, p) {
    const nb = onBeat(e), b = Math.floor(G.beat);
    if (e.state === 'idle') { e.state = 'march'; if (e.dir === undefined) e.dir = grand() * 4 | 0; }
    const [dx, dy] = DIR4[e.dir];
    if (dx) e.flip = dx < 0;
    if (e.state === 'march') {
      // a step on each beat
      if (G.beat - b < 0.4 && moveBox(room, e, dx * 55 * dt, dy * 55 * dt, 'enemy')) {
        const l = (e.dir + 3) % 4, r = (e.dir + 1) % 4, px = p ? p.x - e.x : 0, py = p ? p.y - e.y : 0;
        e.dir = DIR4[l][0] * px + DIR4[l][1] * py > DIR4[r][0] * px + DIR4[r][1] * py ? l : r;
        e.state = 'aim'; e.fireAt = G.beat + 0.7; // at least 0.45 s of glint before the tock
      }
    } else if (e.state === 'aim' && nb && b % 2 === 1 && G.beat >= e.fireAt) {
      fan(e.x + dx * 6, e.y - 8, Math.atan2(dy, dx), 3, 0.22, 70, 'tin');
      Audio_.sfx('eshoot');
      e.state = 'march';
    }
  },
  jack(e, dt, room, p) {
    const nb = onBeat(e), b = Math.floor(G.beat);
    if (e.state === 'idle') e.state = 'wait';
    if (e.state === 'wait') {
      if (!nb || b % 4 !== 2 || !p || Math.hypot(p.x - e.x, p.y - e.y) > 170) return;
      // the lane stops at the first rock
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      let len = 8;
      while (len < 96 && !solidPx(room, e.x + Math.cos(a) * len, e.y - 4 + Math.sin(a) * len, 'shot')) len += 4;
      e.state = 'coil'; e.t = beatLen(); e.ext = 0;
      lane(e, p, len); e.reach = len;
      Audio_.sfx('clack');
    } else if (e.state === 'coil') {
      if (nb && b % 4 === 3) { e.state = 'punch'; e.t = 0.4; Audio_.sfx('dash'); }
    } else if (e.state === 'punch') {
      e.t -= dt;
      e.ext = e.reach * (e.t > 0.15 ? Math.min(1, (0.4 - e.t) / 0.08) : Math.max(0, e.t / 0.15));
      for (const q of G.players) if (alive(q) && jackHit(e, q)) hurtPlayer(q, 1, 'jack');
      if (e.t <= 0) { e.state = 'wait'; e.ext = 0; }
    }
  },
  marble(e, dt, room) {
    if (e.state === 'idle') { e.state = 'roll'; const a = (grand() * 4 | 0) * Math.PI / 2 + Math.PI / 4; e.vx = Math.cos(a) * 58; e.vy = Math.sin(a) * 58; }
    if (moveBox(room, e, e.vx * dt, 0, 'enemy')) e.vx = -e.vx;
    if (moveBox(room, e, 0, e.vy * dt, 'enemy')) e.vy = -e.vy;
    e.flip = e.vx < 0;
  },
  plane(e, dt, room, p) {
    const nb = onBeat(e), b = Math.floor(G.beat);
    if (e.state === 'idle') e.state = 'hover';
    if (e.state === 'hover') {
      if (p) { hoverNear(e, dt, room, p, 40); e.flip = p.x < e.x; }
      moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
      if (nb && b % 4 === 0 && p && (e.cd = (e.cd || 0) - 1) < 0) { e.state = 'tele'; e.t = beatLen(); e.vx = e.vy = 0; lane(e, p, 200); }
    } else if (e.state === 'tele') {
      if (nb) { e.state = 'dart'; e.t = 1.1; e.vx = Math.cos(e.la) * 170; e.vy = Math.sin(e.la) * 170; e.flip = e.vx < 0; Audio_.sfx('dash'); }
    } else if (e.state === 'dart') {
      e.t -= dt;
      if (moveBox(room, e, e.vx * dt, e.vy * dt, 'fly') || e.t <= 0) { e.state = 'hover'; e.cd = 1; e.vx *= 0.2; e.vy *= 0.2; }
    }
  },
  drum(e, dt, room) {
    const nb = onBeat(e), b = Math.floor(G.beat);
    if (e.state === 'idle') { e.state = 'rest'; e.bar = grand() < 0.5 ? 0 : 1; }
    if (!nb) return;
    if (e.state === 'rest' && b % 4 === 2 && Math.floor(b / 4) % 2 === e.bar) e.state = 'raise';
    else if (e.state === 'raise' && b % 4 === 3) {
      e.state = 'rest';
      const gap = grand() * 12 | 0, off = grand() * Math.PI;
      muzzle(e.x, e.y - 10);
      for (let i = 0; i < 12; i++) if ((i - gap + 12) % 12 >= 3) ebullet(e.x, e.y - 10, off + i * Math.PI / 6, 55, 'drum');
      dust(e.x, e.y, 3, 12); Audio_.sfx('eshoot');
    }
  },
  crayon(e, dt, room, p) {
    e.t -= dt;
    if (e.t <= 0 && p) {
      e.t = grnd(0.8, 1.3);
      const a = Math.atan2(p.y - e.y, p.x - e.x) + grnd(-1, 1);
      e.vx = Math.cos(a) * 42; e.vy = Math.sin(a) * 42; e.flip = e.vx < 0;
    }
    if (moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy')) e.t = 0;
    const [cx, cy] = cellMid(e.x, e.y), k = cx * 1000 + cy;
    if (k !== e.cell) {
      e.cell = k;
      G.markers.push({ kind: 'zap', c: 'crayon', x: cx, y: cy, t: 1.5, max: 1.5, h: 1, src: 'crayon' });
    }
  },
});
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'tin', spr: 'tin_0', lore: ['IT MARCHES STRAIGHT ON THE TICK.', 'AT EVERY CORNER IT TURNS AND FIRES.', 'WHEN ITS KEY RUNS DOWN, IT STANDS.'] },
  { t: 'jack', spr: 'jack_0', lore: ['ITS LID POPS ON THE THIRD BEAT.', 'ON THE FOURTH THE SPRING PUNCHES OUT.', 'STEP OFF THE CYAN LANE.'] },
  { t: 'marble', spr: 'marble_0', lore: ['A GLASS MARBLE WITH A PINK SWIRL.', 'IT BOUNCES OFF EVERY WALL.', 'THE BELTS CARRY IT, TOO.'] },
  { t: 'plane', spr: 'plane_0', lore: ['PAPER PLANES FLY IN THREES.', 'THEY FOLD, THEN DART DOWN A LANE.', 'ONE SHOT EACH IS ALMOST ENOUGH.'] },
  { t: 'drum', spr: 'drum_1', lore: ['A TEDDY\'S TOY DRUM.', 'STICKS UP, THEN A RING OF SHOCKS.', 'EVERY RING HAS A GAP.'] },
  { t: 'crayon', spr: 'crayon_0', lore: ['IT SCRIBBLES WHEREVER IT WALKS.', 'A SECOND LATER THE LINE IS HOT.', 'NEVER STAND ON A FRESH LINE.'] },
);

// ---------- The Wind-up Mouse (warden of the Toy Attic) ----------
// A tin mouse on wheels with a brass key on its back. It scurries to the end of a lane, revs on
// beat three (a cyan lane across the room) and races down it on four; at the far wall it skids
// and flicks cheese at the nearest hero (glint first). Every third run its key winds down and it
// stands dazed. The key is its weak spot, and it sticks out behind: shoot it from the back, three
// times, and it spins loose. Phase 2: it races back down the same lane at once (a fresh lane tell),
// and flicks five crumbs. Its room has two belts across the middle.
(function mouseArt() {
  const o = { flash: true, flip: true };
  const MOUTH = { calm: '.00.\n.ww.', squint: '0000\n.ww.', mad: '0000\n0ww0', daze: '.0..\n0.0.', dead: '0000' };
  const mouse = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, sx = f.a ? 2 : f.m ? 1 : 0;
    let r = sculpt(40, 32, [
      { e: [22 + sx, 11 + dy, 3, 3.5], ramp: 'ppPq' },
      { e: [18, 21 + dy * 0.5, 13 + sx, 8.5 - dy * 0.5], ramp: 'dmlL' },
      { e: [30 + sx, 17 + dy, 7, 6], ramp: 'dmlL' },
      { e: [27 + sx, 10 + dy, 4, 4.5], ramp: f.p ? 'prRq' : 'pPqw' },
      { e: [10, 29, 2.5, 2.5], ramp: 'xXXl' }, { e: [24, 29, 2.5, 2.5], ramp: 'xXXl' },
    ]);
    // a curly tail, a pink nose, a tin seam along the body
    r = stamp(r, 0, 13 + dy, '.qq..\nq..q.\nq....\n.q...\n..qq.');
    r = stamp(r, 37 + sx, 17 + dy, 'P');
    r = stamp(r, 8, 23 + dy, 'd.d.d.d.d.d.d');
    r = autoOutline(r);
    r = bossEyes(r, 28 + sx, 13 + dy, 5, f.face);
    r = stamp(r, 33 + sx, 20 + dy, MOUTH[f.face]);
    return rim(r, { d: '2', m: '3' });
  };
  bossFrames('mouse', mouse, o);
  TA('mkey_0', `
    .............
    ..Yy.....Yy..
    .Y..o.y.Y..o.
    .y..oyyoy..o.
    ..oo.yo..oo..
    .....yo......
    .............`);
  TA('mkey_1', `
    .....
    ..Y..
    ..y..
    ..y..
    ..o..
    ..o..
    .....`);
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  def('eb_cheese', pad(['Yy..', 'yYy.', 'yoyy', 'oooo']));
  def('ebb_cheese', pad(['Yy....', 'yYyy..', 'yyoYy.', 'yYyyoy', 'oyyyyo', 'oooooo']));
  alias('ebcb_cheese', 'eb_cheese'); alias('ebbcb_cheese', 'ebb_cheese');
})();
const MOUSE_LANES = [3, 5, 8, 10]; // tile rows it races along (clear of the room's four rocks)
const mouseKey = (e) => [e.x + (e.flip ? 20 : -20), e.y - 16];
function mouseLane(e, p) {
  const ty = p ? p.y : e.y;
  let best = MOUSE_LANES[0];
  for (const r of MOUSE_LANES) if (Math.abs(OY + r * 16 + 9 - ty) < Math.abs(OY + best * 16 + 9 - ty)) best = r;
  e.ty = OY + best * 16 + 9; e.tx = e.x < 192 ? 40 : VW - 40;
  e.state = 'scurry'; e.t = 3;
}
function mouseRev(e) {
  e.state = 'rev'; e.t = beatLen(); e.flip = e.x > 192; e.la = e.flip ? Math.PI : 0;
  G.markers.push({ kind: 'lane', x: e.x, y: e.y - 6, a: e.la, t: e.t, max: e.t, len: 300 });
  Audio_.sfx('charge');
}
Object.assign(EDEF, {
  mouse: { hp: 260, r: 9, h: 22, hw: 10, hh: 5, sw: 30, warden: true, intro: 'IT NEVER STOPS RUNNING', colors: ['m', 'l', 'q'],
    init: (e) => { e.state = 'wait'; e.t = 1; e.n = 0; e.kh = 0; },
    sprite: (e) => bossFrame(e, e.state === 'dash' ? 'atk' : e.state === 'rev' || e.state === 'skid' ? 'tell' : e.state === 'scurry' ? bob(e, 8, 'move', '0') : bob(e, 2, '0', '1')),
    glint: (e) => (e.state === 'skid' ? [e.flip ? -16 : 16, -14] : null) },
});
FOE_NAMES.mouse = 'WIND-UP MOUSE';
WARDENS.toy = 'mouse';
AI.mouse = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  E_SRC = 'mouse';
  const nb = onBeat(e), b = Math.floor(G.beat);
  // its key catches shots from behind; the third (fourth in phase 2) spins it loose
  const [kx, ky] = mouseKey(e);
  for (const s of SHOTS) if (s.life > 0 && Math.hypot(s.x - kx, s.y - ky) < 7) {
    s.life = 0; burst(kx, ky, 6, ['Y', 'y', 'o'], 60, 0.4); Audio_.sfx('clack');
    if (++e.kh >= (e.p2 ? 4 : 3)) { e.kh = 0; e.back = false; stagger(e, 2.5); mouseLane(e, p); toast('ITS KEY SPINS LOOSE!'); return; }
  }
  if (e.state === 'wait') { if (e.t <= 0) mouseLane(e, p); }
  else if (e.state === 'scurry') {
    const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
    if (d > 3 && e.t > 0) { moveBox(room, e, dx / d * 85 * dt, dy / d * 85 * dt, 'enemy'); if (Math.abs(dx) > 2) e.flip = dx < 0; }
    else if (nb && b % 4 === 2) mouseRev(e);
  } else if (e.state === 'rev') {
    if (Math.random() < 0.3) dust(e.x + (e.flip ? 10 : -10), e.y, 1, 4);
    if (nb) { e.state = 'dash'; e.vx = (e.flip ? -1 : 1) * (e.p2 ? 175 : 150); Audio_.sfx('dash'); }
  } else if (e.state === 'dash') {
    const bl = moveBox(room, e, e.vx * dt, 0, 'enemy');
    if (Math.random() < 0.5) dust(e.x - Math.sign(e.vx) * 10, e.y, 1, 4);
    if (bl || (e.vx < 0 ? e.x < 36 : e.x > VW - 36)) { e.state = 'skid'; e.t = 0.5; G.shake = Math.max(G.shake, 2); Audio_.sfx('land'); }
  } else if (e.state === 'skid' && e.t <= 0) {
    const tg = nearestHero(e.x, e.y) || p, x = e.x + (e.flip ? -16 : 16), y = e.y - 12;
    if (tg) fan(x, y, Math.atan2(tg.y - 7 - y, tg.x - x), e.p2 ? 5 : 3, 0.24, 80, 'cheese');
    Audio_.sfx('eshoot');
    if (e.p2 && !e.back) { e.back = true; mouseRev(e); return; } // phase 2: straight back down the lane
    e.back = false;
    if (++e.n % 3 === 0) { stagger(e, 2); toast('ITS KEY RAN DOWN!'); e.state = 'wait'; e.t = 0.2; }
    else mouseLane(e, p);
  }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'mouse', spr: 'mouse_0', lore: ['THE WARDEN OF THE TOY ATTIC.', 'IT RACES DOWN THE CYAN LANES.', 'SHOOT THE KEY ON ITS BACK.'] });

// ---------- The Music Box Ballerina (boss of the Toy Attic) ----------
// A porcelain dancer in a pink lace tutu with a brass bun and a cracked smile, on a turntable
// stage in the middle of the room. She keeps the waltz (three beats to the bar): a glint, two
// slow fans of lace, a beat's rest, then one fast ring with a gap, and every third bar she picks a cyan lane
// and glides down it on beat three, then back to her stage (dazed after every second glide).
// Phase 2: the stage turns faster and the floor plays piano keys: tiles light one by one in a
// line toward a hero (0.6 s each) and then sting. Phase 3: the lid slams (a pink ring round the
// stage), she springs up and spins a spiral of lace, then lands dizzy.
const STAGE_X = 192, STAGE_Y = 120, STAGE_R = 30;
(function ballerinaArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0...0\n.000.', squint: '.000.\n0PPP0\n.000.', mad: '.000.\n0www0\n.000.', daze: '.0.0.\n0.0.0', dead: '00000' };
  const dancer = (f) => {
    const dy = f.d ? 5 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0;
    const arms = f.a ? [[6, 2 + dy, 3, 11], [23, 2 + dy, 3, 11]] : f.tl ? [[2, 12 + dy, 10, 3], [20, 12 + dy, 10, 3]] : [[6, 13 + dy - b, 6, 3], [20, 13 + dy - b, 6, 3]];
    let r = sculpt(32, 32, [
      ...arms.map(([x, y, w, h]) => ({ r: [x, y, w, h, 1], ramp: 'mlLw' })),
      { r: [14, 24 + dy, 4, 8 - dy, 1], ramp: 'mlLw' },
      { e: [16, 20 + dy, 13, 4.5], ramp: f.p ? 'prRq' : 'pPqw' },
      { r: [12, 12 + dy, 8, 9, 2], ramp: f.p ? 'prRq' : 'pPqw' },
      { e: [16, 8 + dy, 6.5, 6], ramp: 'mlLw' },
      { e: [16, 2 + dy, 3.5, 2.5], ramp: 'noyY' },
    ]);
    // lace dots on the tutu, a brass band at the waist, the shoe, the crack in the porcelain
    r = stamp(r, 5, 21 + dy, 'w.w.w.w.w.w.w.w.w.w.w.w');
    r = stamp(r, 12, 16 + dy, 'yyyyyyyy');
    r = stamp(r, 15, 30, 'PP');
    r = autoOutline(r);
    r = bossEyes(r, 11, 6 + dy, 6, f.face);
    r = stamp(r, 14, 11 + dy, MOUTH[f.face]);
    r = stamp(r, 20, 3 + dy, '0.\n.0\n0.');
    return rim(r, { m: 'l', p: 'P', n: 'o' });
  };
  bossFrames('ballerina', dancer, o);
  // the stage: a brass rim round a warm wooden top
  def('stage', stamp(sculpt(64, 26, [{ e: [32, 14, 31, 11], ramp: 'noyY' }, { e: [32, 12, 27, 8.5], ramp: 'NeaA' }]), 22, 9, 'q.q.q.q.q.q.q.q.q.q.q'));
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  def('eb_lace', pad(['.qw.', 'qPqw', 'PPPq', '.pP.']));
  def('ebb_lace', pad(['..qw..', '.qPqw.', 'qPwPqw', 'PPPPPq', '.pPPp.', '..pp..']));
  alias('ebcb_lace', 'eb_lace'); alias('ebbcb_lace', 'ebb_lace');
})();
// a piano key tile: dark while it waits, it lights (a pink frame, its note) and then stings
function drawKeyTile(k, ox, oy) {
  const age = k.max - k.t, x = Math.round(ox + k.x) - 8, y = Math.round(oy + k.y) - 8;
  if (age < k.h) {
    const c = Math.floor(G.time * (k.h - age < 0.25 ? 16 : 6)) % 2 ? 'P' : 'q';
    rect(x, y, 16, 2, c); rect(x, y + 14, 16, 2, c); rect(x, y + 2, 2, 12, c); rect(x + 14, y + 2, 2, 12, c);
    return;
  }
  if (k.t < 0.1 && Math.floor(G.time * 20) % 2) return;
  rect(x, y, 16, 16, '0'); rect(x + 1, y + 1, 14, 14, 'P'); rect(x + 1, y + 1, 14, 2, 'q'); rect(x + 1, y + 1, 2, 14, 'q'); rect(x + 5, y + 5, 3, 3, 'w');
}
Object.assign(EDEF, {
  ballerina: { hp: 450, r: 10, h: 30, hw: 9, hh: 6, sw: 28, boss: true, intro: 'THE LAST DANCE BEFORE BEDTIME', phases: [0.66, 0.33], colors: ['P', 'q', 'y'],
    init: (e) => { e.x = STAGE_X; e.y = STAGE_Y - 2; e.k = 0; e.n = 0; e.w = 0; e.spin = 0; },
    sprite: (e) => bossFrame(e, { aim: 'tell', lid: 'tell', dash: 'atk', spring: 'atk', spin: 'atk', glide: 'move' }[e.state] || bob(e, 1.5, 1, 0)),
    glint: (e) => (e.gl ? [0, -30] : null),
    hits: (e, p) => e.state === 'spring' && e.t > 0.2 && Math.hypot(p.x - STAGE_X, (p.y - STAGE_Y) / 0.4) < STAGE_R + 4,
    under: (e, ox, oy) => {
      // the stage stays in the middle; its lace marks step round a quarter at a time on the beat
      const s = S('stage');
      drawS(s, ox + STAGE_X - (s.w >> 1), oy + STAGE_Y - (s.h >> 1));
      const q = Math.floor(G.beat * (e.p2 ? 2 : 1)) % 4;
      for (let i = 0; i < 4; i++) {
        const a = (i + q / 4) * Math.PI / 2 + e.spin, x = Math.round(ox + STAGE_X + Math.cos(a) * 22), y = Math.round(oy + STAGE_Y - 1 + Math.sin(a) * 6);
        rect(x - 1, y - 1, 3, 3, '0'); rect(x, y, 1, 1, 'y');
      }
      if (e.state === 'lid' && Math.floor(e.anim * 10) % 2) {
        const r = ringSprite(STAGE_R + 2, 'P');
        ctx.drawImage(r, Math.round(ox + STAGE_X - STAGE_R - 2), Math.round(oy + STAGE_Y - Math.round((STAGE_R + 2) * 0.6)));
      }
    } },
});
FOE_NAMES.ballerina = 'MUSIC BOX BALLERINA';
EF_EXTRA.push('gl');
// phase 2: a line of key tiles from her feet toward a hero, lit one by one
function balMelody(e, room, p) {
  const a = Math.atan2(p.y - e.y, p.x - e.x), cells = [];
  for (let d = 28; d < 260 && cells.length < 7; d += 16) {
    const [x, y] = cellMid(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d);
    if (solidPx(room, x, y, 'enemy')) break;
    if (!cells.some(c => c[0] === x && c[1] === y)) cells.push([x, y]);
  }
  e.mel = cells; e.mt = 0;
}
AI.ballerina = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'ballerina';
  if (e.hp < e.maxHp * 0.66) bossPhase(e, 2);
  if (e.hp < e.maxHp * 0.33) bossPhase(e, 3);
  e.spin += dt * (e.p2 ? 1.2 : 0.4);
  const nb = onBeat(e);
  // the melody plays on whatever she does
  if (e.mel && e.mel.length && (e.mt -= dt) <= 0) {
    const [x, y] = e.mel.shift();
    G.markers.push({ kind: 'zap', c: 'key', x, y, t: 1.05, max: 1.05, h: 0.6, src: 'ballerina' });
    Audio_.sfx('bell' + (e.mel.length % 4)); e.mt = 0.6;
  }
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'waltz'; e.k = 0; } return; }
  if (e.state === 'waltz') {
    if (!nb || !p) return;
    const k = ++e.k, a = Math.atan2(p.y - 7 - (e.y - 18), p.x - e.x);
    if (k === 1) e.gl = true;
    else if (k === 2 || k === 3) { fan(e.x, e.y - 18, a, k === 2 ? 3 : 2, 0.36, 48, 'lace'); Audio_.sfx('eshoot'); } // the second pair leaves the hero's spot open
    else if (k === 5) {
      // the fast one (a beat's rest first, so the fans have passed): a ring of lace with a three-bullet gap where the hero stands
      const n = 12, off = a + Math.PI / n * 3 + e.spin;
      for (let i = 0; i < n; i++) { const b = off + i * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.5) ebullet(e.x, e.y - 18, b, 90, 'lace', true); }
      e.gl = false; Audio_.sfx('eshoot');
    } else if (k === 6 && e.p2) balMelody(e, room, p);
    else if (k === 8) {
      if (e.phase >= 3 && e.n % 2 === 1) { e.state = 'lid'; e.t = 1; Audio_.sfx('charge'); return; }
      // a cyan lane, picked now; she glides down it on the next beat
      e.state = 'aim'; e.t = beatLen();
      let len = 20;
      const la = Math.atan2(p.y - e.y, p.x - e.x);
      while (len < 170 && !boxSolid(room, e.x + Math.cos(la) * len, e.y + Math.sin(la) * len, e.hw, e.hh, 'enemy')) len += 6;
      lane(e, p, len); e.len = len - 6;
    }
  } else if (e.state === 'aim') {
    if (nb) { e.state = 'dash'; e.t = e.len / 200; Audio_.sfx('dash'); }
  } else if (e.state === 'dash') {
    const bl = moveBox(room, e, Math.cos(e.la) * 200 * dt, Math.sin(e.la) * 200 * dt, 'enemy');
    if (bl || e.t <= 0) { e.state = 'glide'; e.n++; }
  } else if (e.state === 'glide') {
    const dx = STAGE_X - e.x, dy = STAGE_Y - 2 - e.y, d = Math.hypot(dx, dy);
    if (d > 3) moveBox(room, e, dx / d * 80 * dt, dy / d * 80 * dt, 'fly');
    else { e.x = STAGE_X; e.y = STAGE_Y - 2; e.state = 'waltz'; e.k = 0; if (e.n % 2 === 0) stagger(e, 1.5); }
  } else if (e.state === 'lid') {
    // phase 3: the lid slams; the pink ring round the stage is the warning
    if (e.t <= 0) {
      e.state = 'spring'; e.t = 0.35; G.shake = Math.max(G.shake, 4); Audio_.sfx('boom');
      burst(STAGE_X, STAGE_Y, 14, ['P', 'q', 'y'], 110, 0.5, { g: 150 });
      for (const q of G.players) if (alive(q) && EDEF.ballerina.hits(e, q)) hurtPlayer(q, 1, 'ballerina');
    }
  } else if (e.state === 'spring') {
    e.z = Math.min(28, (0.35 - e.t) * 90);
    if (e.t <= 0) { e.state = 'spin'; e.t = 1.8; e.w = grand() * Math.PI * 2; e.ft = 0; }
  } else if (e.state === 'spin') {
    e.z = 28 + Math.sin(e.anim * 6) * 2;
    if ((e.ft -= dt) <= 0) { e.ft = 0.14; for (const s of [0, Math.PI]) ebullet(e.x, e.y - 18 - e.z, e.w + s, 60, 'lace'); e.w += 0.42; }
    if (e.t <= 0) { e.z = 0; e.state = 'waltz'; e.k = 0; e.n++; dust(e.x, e.y, 6, 16); Audio_.sfx('land'); stagger(e, 2.5); toast('SHE IS DIZZY!'); }
  }
};
BEASTS.push({ t: 'ballerina', spr: 'ballerina_0', boss: true, lore: ['SHE DANCES WHEN THE LID OPENS.', 'SHE WALTZES IN THREES: MIND THE GAP.', 'WHEN THE KEYS LIGHT UP, STEP OFF.'] });

// ---------- Jester Jack (the Toy Attic's other boss) ----------
// A giant jack-in-the-box with a jester's head. He coils (squashes into his box, cyan lanes
// show where) and boxing gloves on springs punch out down every lane to the walls; he hops onto
// a pink ring and his lid slams shut there, throwing a ring of juggling balls with a gap; he
// juggles a fan of balls at a hero (glint first). Every fourth move is the big one: eight
// springs at once, after which he flops out of his box, dazed. Where he lands, his box is
// harmless to touch until his next move, so nobody is pinned under it. Phase 2: four lanes each coil,
// and he slams twice.
(function jesterArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0....0\n.0rr0.', squint: '.0000.\n0rrrr0\n.0000.', mad: '.0000.\n0wwww0\n.0rr0.', daze: '.0..0.\n0.00.0', dead: '000000' };
  const jester = (f) => {
    const hy = f.d ? 8 : f.tl ? 4 : f.st ? 3 : f.a ? -1 : f.b ? 1 : 0, sx = f.st ? 3 : 0;
    let r = sculpt(40, 32, [
      { r: [4, 15, 32, 17, 2], ramp: 'bBBc' },
      { e: [20 + sx, 9 + hy, 8, 7], ramp: 'mlLw' },
      { e: [11 + sx, 3 + hy, 3, 3], ramp: f.p ? 'prRq' : 'rRqw' },
      { e: [20 + sx, 1.5 + hy, 3, 3], ramp: 'noyY' },
      { e: [29 + sx, 3 + hy, 3, 3], ramp: 'bBcC' },
    ]);
    // stars on the box, the ruff at his neck, bells on his hat
    r = stamp(r, 8, 20, '.y.....y.....y.....y.\nyYy...yYy...yYy...yYy\n.y.....y.....y.....y.');
    r = stamp(r, 8, 27, 'y.y.y.y.y.y.y.y.y.y.y.y');
    r = stamp(r, 12 + sx, Math.min(15, 15 + hy - 1), 'q.q.q.q.q.q.q.q');
    for (const [x, y] of [[9, 0], [20, -1], [31, 0]]) r = stamp(r, x + sx, Math.max(0, y + hy), 'y');
    r = autoOutline(r);
    r = bossEyes(r, 14 + sx, 6 + hy, 8, f.face);
    r = stamp(r, 17 + sx, 11 + hy, MOUTH[f.face]);
    return rim(r, { b: 't', m: 'l' });
  };
  bossFrames('jester', jester, o);
  def('jglove', stamp(sculpt(12, 11, [{ r: [4, 7, 4, 3, 0.5], ramp: 'mlLw' }, { e: [6, 4.5, 5, 4], ramp: 'prRq' }]), 3, 2, 'w.\n..'));
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  def('eb_jball', pad(['.Yy.', 'YyyB', 'yyBb', '.Bb.']));
  def('ebb_jball', pad(['..Yy..', '.YyyB.', 'YyyyBb', 'yyyBBb', '.yBBb.', '..bb..']));
  alias('ebcb_jball', 'eb_jball'); alias('ebbcb_jball', 'ebb_jball');
})();
// a hero on the line from (ax, ay) along a for len px
function lineHit(ax, ay, a, len, q) {
  const dx = Math.cos(a), dy = Math.sin(a), t = Math.max(0, Math.min(len, (q.x - ax) * dx + (q.y - 5 - ay) * dy));
  return Math.hypot(ax + dx * t - q.x, ay + dy * t - (q.y - 5)) < 8;
}
// a spring with a boxing glove on its end, drawn pixel by pixel
function springDraw(ax, ay, a, len, ox, oy, flash) {
  const n = Math.max(1, Math.round(len / 3)), dx = Math.cos(a), dy = Math.sin(a);
  for (let i = 1; i <= n; i++) {
    const t = len * i / n, s = i % 2 ? 2 : -2, x = Math.round(ox + ax + dx * t - dy * s), y = Math.round(oy + ay + dy * t + dx * s);
    rect(x - 1, y - 1, 3, 3, '0'); rect(x, y, 1, 1, i % 2 ? 'l' : 'm');
  }
  const g = S('jglove');
  drawS(g, Math.round(ox + ax + dx * len) - (g.w >> 1), Math.round(oy + ay + dy * len) - (g.h >> 1), (dx < 0 ? 1 : 0) + (flash ? 2 : 0));
}
const JESTER_ARM_Y = 14; // the springs leave the box this high over his feet
function jesterLanes(e, room, n, off) {
  e.las = [];
  for (let i = 0; i < n; i++) {
    const a = off + i * Math.PI * 2 / n;
    let len = 16;
    while (len < 320 && !solidPx(room, e.x + Math.cos(a) * len, e.y - JESTER_ARM_Y + Math.sin(a) * len + 6, 'shot')) len += 4;
    e.las.push([+a.toFixed(3), len]);
    G.markers.push({ kind: 'lane', x: e.x, y: e.y - JESTER_ARM_Y, a, t: e.t + 0.55, max: e.t + 0.55, len }); // shown until the springs are back
  }
}
const jesterHit = (e, q) => e.state === 'punch' && !(e.stag > 0) && e.ef > 0.3 && (e.las || []).some(([a, len]) => lineHit(e.x, e.y - JESTER_ARM_Y, a, len * e.ef, q));
Object.assign(EDEF, {
  jester: { hp: 480, r: 13, h: 28, hw: 14, hh: 8, sw: 36, boss: true, intro: 'THE BOX OPENS. HE WAS WAITING.', colors: ['B', 'y', 'r'],
    init: (e) => { e.n = 0; e.ef = 0; e.las = []; },
    sprite: (e) => bossFrame(e, { coil: 'tell', hop: 'move', juggle: 'tell', punch: 'atk', land: 'atk' }[e.state] || bob(e, 2, 1, 0)),
    glint: (e) => (e.state === 'juggle' ? [0, -30] : null),
    hits: (e, p) => jesterHit(e, p) || (e.state === 'land' && e.t > 0.3 && Math.hypot(p.x - e.x, (p.y - e.y) / 0.6) < 28) },
});
FOE_NAMES.jester = 'JESTER JACK';
EF_EXTRA.push('las', 'ef');
LAND.toy.alt = ['jester'];
AI.jester = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'jester';
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'idle'; e.t = 1; } return; }
  if (!p) return;
  if (e.state === 'idle') {
    if (e.t > 0) return;
    const k = e.n++ % 4;
    if (k !== 2 || e.p2) e.calm = false; // the juggle right after a landing keeps the box harmless
    if (k === 3) { e.state = 'coil'; e.t = 1; e.big = true; jesterLanes(e, room, 8, grand() * Math.PI / 4); Audio_.sfx('charge'); }
    else if (k === 0 || (k === 2 && e.p2)) { e.state = 'coil'; e.t = 0.8; e.big = false; jesterLanes(e, room, e.p2 ? 4 : 2, Math.atan2(p.y - (e.y - JESTER_ARM_Y), p.x - e.x)); Audio_.sfx('clack'); }
    else if (k === 1) { e.slams = e.p2 ? 2 : 1; jesterHop(e, room, p); }
    else { e.state = 'juggle'; e.t = 0.55; }
  } else if (e.state === 'coil') {
    if (e.t <= 0) { e.state = 'punch'; e.t = 0.55; Audio_.sfx('dash'); G.shake = Math.max(G.shake, 2); }
  } else if (e.state === 'punch') {
    e.ef = e.t > 0.2 ? Math.min(1, (0.55 - e.t) / 0.12) : Math.max(0, e.t / 0.2);
    for (const q of G.players) if (alive(q) && jesterHit(e, q)) hurtPlayer(q, 1, 'jester');
    if (e.t <= 0) {
      e.ef = 0; e.las = [];
      if (e.big) { stagger(e, 2); toast('HE FLOPS OUT OF HIS BOX!'); }
      e.state = 'idle'; e.t = e.big ? 0.2 : 0.8;
    }
  } else if (e.state === 'hop') {
    const k = 1 - Math.max(0, e.t) / 0.9;
    e.x = e.hx0 + (e.hx - e.hx0) * k; e.y = e.hy0 + (e.hy - e.hy0) * k; e.z = Math.sin(k * Math.PI) * 40;
    if (e.t <= 0) {
      // the lid slams: whoever is in the ring is hit, and juggling balls fly out with a gap
      e.z = 0; e.state = 'land'; e.t = 0.45; e.calm = true; G.shake = Math.max(G.shake, 5); Audio_.sfx('boom'); hapticAll('boom');
      dust(e.x, e.y, 8, 24);
      for (const q of G.players) if (alive(q) && Math.hypot(q.x - e.x, (q.y - e.y) / 0.6) < 28) hurtPlayer(q, 1, 'jester');
      const a = Math.atan2(p.y - e.y, p.x - e.x), n = 14;
      for (let i = 0; i < n; i++) { const b = a + (i + 0.5) * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.7) ebullet(e.x, e.y - 12, b, 64, 'jball'); }
    }
  } else if (e.state === 'land') {
    if (e.t <= 0) { if (--e.slams > 0) jesterHop(e, room, p); else { e.state = 'idle'; e.t = 0.9; } }
  } else if (e.state === 'juggle') {
    if (e.t <= 0) {
      fan(e.x, e.y - 26, Math.atan2(p.y - 7 - (e.y - 26), p.x - e.x), 5, 0.28, 65, 'jball');
      Audio_.sfx('eshoot'); e.state = 'idle'; e.t = 0.9;
    }
  }
};
// a hop onto a hero's spot (kept clear of walls and rocks), shown by a pink ring
function jesterHop(e, room, p) {
  let x = Math.max(76, Math.min(VW - 76, p.x)), y = Math.max(OY + 72, Math.min(OY + 164, p.y)); // never against a wall
  if (boxSolid(room, x, y, e.hw, e.hh, 'enemy')) { x = 192; y = OY + 112; }
  e.hx0 = e.x; e.hy0 = e.y; e.hx = x; e.hy = y;
  e.state = 'hop'; e.t = 0.9;
  G.markers.push({ kind: 'zone', x, y, r: 28, t: 0.9, max: 0.9 });
  Audio_.sfx('land');
}
BEASTS.push({ t: 'jester', spr: 'jester_0', boss: true, lore: ['THE BIGGEST TOY IN THE ATTIC.', 'HIS SPRINGS PUNCH DOWN THE CYAN LANES.', 'WHERE THE PINK RING SHOWS, HE LANDS.'] });

// ---------- The Dollhouse (the Toy Attic's special room) ----------
// A dollhouse with its front wall open: upstairs a shelf of tiny toys, downstairs a doll who
// keeps a tiny shop (a heart, a potion and a land item, a little cheaper than the frog's). In its
// skirting there is a little drawer with something inside, opened once.
(function dollArt() {
  const W = 80, H = 64, g = [...Array(H)].map(() => Array(W).fill('.'));
  const box = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (y + j >= 0 && x + i >= 0 && y + j < H && x + i < W) g[y + j][x + i] = c; };
  // the roof: pink shingles, lit on the left, a pale row every fourth line
  for (let y = 2; y < 22; y++) {
    const half = Math.round((y - 2) * 37 / 19) + 3;
    for (let x = 40 - half; x < 40 + half; x++) g[y][x] = y % 4 === 1 ? 'q' : x < 40 ? 'P' : 'p';
  }
  box(52, 4, 6, 9, 'n'); box(52, 4, 2, 9, 'N'); box(51, 3, 8, 2, 'u');
  // the walls, with the front open on two floors
  box(8, 22, 64, 40, 'A'); box(8, 22, 2, 40, 'Y'); box(70, 22, 2, 40, 'a');
  box(12, 25, 56, 14, 'q'); box(12, 44, 56, 14, 'q');
  for (let x = 14; x < 68; x += 6) { box(x, 25, 1, 14, 'P'); box(x, 44, 1, 14, 'P'); }
  box(12, 38, 56, 2, 'N'); box(12, 57, 56, 2, 'N'); box(8, 40, 64, 4, 'e'); box(8, 60, 64, 2, 'n');
  // upstairs: a shelf of tiny toys and a little bed
  box(16, 31, 22, 1, 'n');
  [[17, 'r'], [20, 'y'], [23, 'B'], [26, 'G'], [29, 'P'], [32, 'c'], [35, 'o']].forEach(([x, c]) => box(x, 29, 2, 2, c));
  box(46, 33, 16, 5, 'B'); box(46, 32, 5, 2, 'w'); box(46, 33, 16, 1, 'c');
  // downstairs: a tiny counter
  box(28, 51, 24, 6, 'N'); box(28, 51, 24, 1, 'a'); box(51, 51, 1, 6, 'n');
  def('dollhouse', autoOutline(g.map(r => r.join(''))));
  TA('doll_0', `
    ..........
    ...yyyy...
    ..yYyyyo..
    ..ysssso..
    ..ys0s0o..
    ..yssss...
    ...sqs....
    ..PPPPp...
    .sPqPPps..
    ..PPPPp...
    .PPPPPPp..
    ..s...s...
    ..........`);
  TA('doll_1', `
    ..........
    ...yyyy...
    ..yYyyyo..
    ..ysssso..
    ..ys0s0o..
    ..yssss...
    ...sqs.s..
    ..PPPPps..
    .sPqPPp...
    ..PPPPp...
    .PPPPPPp..
    ..s...s...
    ..........`);
  TA('drawer_0', `
    ..............
    .aAAAAAAAAAAe.
    .AeeeeeeeeeeN.
    .Aee..yo..eeN.
    .AeeeeeeeeeeN.
    .eNNNNNNNNNNN.
    ..............`);
  TA('drawer_1', `
    ..............
    .aAAAAAAAAAAe.
    .A0000000000N.
    .aAAAAyoAAAAe.
    .AeeeeeeeeeeN.
    .eNNNNNNNNNNN.
    ..............`);
})();
function dollStock(room) {
  const hx = room.doors.u ? 100 : 192; // clear of a top door
  room.props.push({ kind: 'dhouse', x: hx, y: 94, t: 0 });
  room.props.push({ kind: 'drawer', x: hx + 44, y: 100, t: 0, open: false });
  addPedestal(room, 142, 140, 'hp', 3);
  addPedestal(room, 192, 140, gpick(POTION_IDS), 0);
  const pot = room.props[room.props.length - 1];
  pot.price = Math.max(3, POTIONS[pot.item].price - 2);
  const id = itemPool(1)[0];
  if (id) addPedestal(room, 242, 140, id, 12);
}
const DOLL_LINES = ['WELCOME, TINY SHOPPER!', 'EVERYTHING IS TINY. EXCEPT THE PRICES.', 'SHH, THE MOUSE IS SLEEPING.', 'DO YOU LIKE MY HOUSE?'];
function dollInteract(o, p) {
  if (o.kind === 'dhouse') { o.say = { msg: DOLL_LINES[(o.n = (o.n || 0) + 1) % DOLL_LINES.length], until: o.t + 1.8 }; Audio_.sfx('bell' + (o.n % 4)); return; }
  if (o.open) { say(p, 'EMPTY NOW'); Audio_.sfx('deny'); return; }
  o.open = true;
  if (grand() < 0.5) spawnPickup('gem', o.x, o.y + 10); else spawnPotion(o.x, o.y + 10);
  for (let i = 0; i < 6; i++) spawnPickup('coin', o.x, o.y + 10);
  burst(o.x, o.y - 4, 12, ['Y', 'y', 'w'], 80, 0.5, { g: -30 });
  Audio_.sfx('chest'); toast('A SECRET DRAWER!');
  G.propsN++;
}
function drawDoll(o, x, y) {
  if (o.kind === 'drawer') {
    drawS(S(o.open ? 'drawer_1' : 'drawer_0'), x - 7, y - 7);
    if (!o.open && Math.floor(o.t * 2) % 5 === 0) drawS(S('sparkle_0'), x + 1, y - 6);
    return;
  }
  const h = S('dollhouse');
  shadow(x, y, 40);
  drawS(h, x - 40, y - h.h);
  const saying = o.say && o.t < o.say.until, d = S(saying ? 'doll_1' : 'doll_' + (Math.floor(o.t * 0.8) % 4 === 0 ? 1 : 0));
  drawS(d, x - 5, y - h.h + 43 - 4);
  if (saying) text(o.say.msg, x, y - h.h - 6, 'w', 2, 1);
  else if (Math.hypot(G.player.x - o.x, G.player.y - o.y) < 70) text('A TINY SHOP!', x, y - h.h - 6, 'q', 2, 1);
}

// ---------- The turntable ----------
// On the first beat of every other bar the blocks on the record turn a quarter step clockwise
// (tiles swap places through setTile; nothing is drawn rotated). Beats 7 and 8 before it are the
// tell: the rim blinks cyan. Whoever stands where a block lands is nudged aside, never hurt.
function turnTable(room) {
  const { c0, r0, n } = room.tt, old = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) old.push(room.tiles[(r0 + j) * COLS + c0 + i]);
  let moved = false;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const v = old[(n - 1 - i) * n + j];
    if (room.tiles[(r0 + j) * COLS + c0 + i] !== v) { setTile(room, c0 + i, r0 + j, v); moved = true; }
  }
  if (!moved) return;
  Audio_.sfx('clack');
  for (const p of G.players) if (!p.dead && nudgeOut(room, p, heroMoveMode(p))) p.tpN++;
  for (const e of G.enemies) if (!e.dead) nudgeOut(room, e, e.fly ? 'fly' : 'enemy');
  for (const k of room.pickups) nudgeOut(room, k, 'enemy');
}
function ttDraw(ox, oy, room) {
  const { c0, r0, n } = room.tt, x0 = ox + c0 * 16, y0 = oy + OY + r0 * 16, W = n * 16, b = Math.floor(G.beat);
  if (!room.cleared && b % 8 >= 6 && Math.floor(G.beat * 4) % 2) {
    rect(x0 - 1, y0 - 1, W + 2, 1, 'c'); rect(x0 - 1, y0 + W, W + 2, 1, 'c'); rect(x0 - 1, y0, 1, W, 'c'); rect(x0 + W, y0, 1, W, 'c');
  }
  // a gold notch on the rim shows how far it has turned
  const q = Math.floor(b / 8) % 4, a = -Math.PI / 2 + q * Math.PI / 2, x = Math.round(x0 + W / 2 + Math.cos(a) * (W / 2 - 2)), y = Math.round(y0 + W / 2 + Math.sin(a) * (W / 2 - 2));
  rect(x - 2, y - 2, 4, 4, '0'); rect(x - 1, y - 1, 2, 2, 'y');
}
