'use strict';
// Land mechanics (LAND_MECH, see level.js): the rule each land plays by, and its art.

const LA = (name, art, opts) => def(name, autoOutline(parseArt(name, art)), opts);

// ---------- Meadow: the Bloom Loop ----------
// Flower patches grow on the floor of fight rooms. A hero walking through flattens them; they
// stand up again in a few seconds. A foe that dies on a flower in full bloom leaves a seed that
// sprouts into a half heart, coins or a star bit (Starfall charge) unless someone stands on it.
// Every few seconds a gust (drifting petals first) nudges the heroes' shots sideways.

// flowers: authored pink, recoloured by legend (light / mid / dark petals, centre, centre shade)
const BLOOM_LEG = [null, { q: 'Y', P: 'y', p: 'O', y: 'o', o: 'n' }, { q: 'w', P: 'L', p: 'l' }, { q: '4', P: '3', p: '2' }];
const bloomArt = {
  bloom: `
  ......
  ..qP..
  .qwqP.
  .PyoP.
  ..Pp..
  ...G..
  ..gG..
  ......`,
  bud: `
  .....
  ..q..
  .qPp.
  ..p..
  ..G..
  .gG..
  .....`,
  flat: `
  .......
  .......
  ..qP...
  .gGPpG.
  .......`,
};
for (const k in bloomArt) BLOOM_LEG.forEach((leg, i) => LA(k + '_' + i, bloomArt[k], leg ? { legend: leg } : undefined));

// a seed in a little mound, a sprout, then a bud tinted by what it grows into
LA('seed_0', `
  ........
  ...On...
  ..aNNn..
  .aNNnnn.
  ........`);
LA('seed_1', `
  ........
  ..hG....
  ...G....
  ..aGNn..
  .aNNnnn.
  ........`);
// bud colours: heart red, coin yellow, star bit pale yellow
const SEED_LEG = { heart: { q: 'R', P: 'r', p: 'p' }, coin: { q: 'Y', P: 'y', p: 'O' }, star: { q: 'w', P: 'Y', p: 'y' } };
for (const k in SEED_LEG) LA('seed_2' + k, `
  ........
  ...q....
  ..qPp...
  ..Pp....
  .hG.....
  ..aGNn..
  .aNNnnn.
  ........`, { legend: SEED_LEG[k] });
// wind-borne petals (particles: no outline, like sparkles)
const PETAL_LEG = [{}, { q: 'w', P: 'L' }, { q: 'Y', P: 'y' }, { q: '4', P: '3' }];
PETAL_LEG.forEach((leg, i) => def('petal_' + i, 'qP\n.P', { legend: leg, flip: true }));
// a star bit: a small piece of a star that fills the Starfall meter a little
LA('starbit', `
  .......
  ...w...
  ..wYy..
  .YYYyO.
  ..Yyy..
  ..y.O..
  .......`);

const SEED_T = 8, SEEDS_LIVE = 3, SEEDS_ROOM = 6, REGROW = 0.4; // regrow: growth per second
const GUST_CYCLE = 12, GUST_TELL = 7.5, GUST_ON = 9, GUST_MAX = 36;
// three flowers on a tile, one colour (stray: about one in this many takes another colour, 0 none)
function patchTile(room, c, r, col, stray) {
  const f = [];
  for (let j = 0; j < 3; j++) {
    const q = hash(c * 3 + j, r, room.seed ^ 0x5eed);
    f.push({ x: c * 16 + 3 + j * 5 + q % 3, y: OY + r * 16 + 6 + (q >>> 4) % 9 - (j === 1 ? 3 : 0), v: !stray || q % stray ? col : (col + 1 + (q >>> 9) % 3) % 4 });
  }
  return { g: 1, f: f.sort((u, w) => u.y - w.y) };
}
const PATCHES = new WeakMap(); // room -> { tiles: Map(tile index -> patch tile), seeds }
function meadowPatches(room) {
  let P = PATCHES.get(room);
  if (P) return P;
  P = { tiles: new Map(), seeds: 0 };
  PATCHES.set(room, P);
  if (!FIGHT_ROOMS.has(room.type) && room.type !== 'start') return P;
  // the same seed gives the same patches on every screen
  const lane = (c, r) => (c >= 9 && c <= 12 && (r <= 3 || r >= 10)) || ((c <= 3 || c >= 20) && r >= 5 && r <= 8);
  const free = (c, r) => c >= 1 && c <= 22 && r >= 2 && r <= 11 && room.tiles[r * COLS + c] === T_FLOOR && !lane(c, r) &&
    !P.tiles.has(r * COLS + c) && !room.props.some(o => Math.abs(o.x - c * 16 - 8) < 20 && Math.abs(o.y - OY - r * 16 - 8) < 20);
  if (room.lay === 'bees') {
    // the ring round the rock, one colour per quarter
    BEE_RING.forEach(([x, y], i) => {
      const [c, r] = layCell(room, x, y);
      P.tiles.set(r * COLS + c, patchTile(room, c, r, (i >> 2) % 4, 0));
    });
    return P;
  }
  const want = 3 + hash(1, 2, room.seed) % 2;
  for (let n = 0, a = 0; n < want && a < 60; a++) {
    const h = hash(a, 7, room.seed), c = 1 + h % 22, r = 2 + (h >>> 8) % 10;
    if (!free(c, r)) continue;
    // a patch: its first tile and up to three neighbours, one flower colour (a stray or two)
    const col = (h >>> 16) % 4, cells = [[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]];
    let k = 0;
    for (const [cc, rr] of cells) {
      if ((k && hash(cc, rr, room.seed + a) % 3 === 0) || !free(cc, rr)) continue;
      P.tiles.set(rr * COLS + cc, patchTile(room, cc, rr, col, 7));
      k++;
    }
    if (k) n++;
  }
  return P;
}
const patchAt = (room, x, y) => meadowPatches(room).tiles.get(Math.floor((y - OY) / 16) * COLS + Math.floor(x / 16));
// the gust: the same clock on every screen (a client reads the host's through NET.off)
function meadowGust(room) {
  if (!room || room.type === 'boss' || room.type === 'arena' || G.tut || !G.floor || G.first) return 0; // not on the first run: one new thing at a time
  const t = skyNow(), u = t % GUST_CYCLE;
  const dir = (Math.floor(t / GUST_CYCLE) + room.seed) & 1 ? 1 : -1;
  if (u < GUST_TELL) return 0;
  if (u < GUST_ON) return dir * 0.001; // the tell: petals only
  return dir * Math.max(0.001, Math.sin(Math.PI * (u - GUST_ON) / (GUST_CYCLE - GUST_ON)) * GUST_MAX);
}
function seedReward(k) {
  const x = k.x, y = k.y;
  if (k.pot === 'heart') spawnPickup('half', x, y);
  else if (k.pot === 'star') spawnPickup('starbit', x, y);
  else for (let i = 2 + (grand() < 0.4 ? 1 : 0); i > 0; i--) spawnPickup('coin', x, y);
  burst(x, y - 6, 12, PETAL, 80, 0.5, { g: -20 });
  Audio_.sfx('graze');
}

LAND_MECH.meadow = {
  // both screens: flattened flowers, regrowth and the gust (G.wind is reset each frame)
  every(dt, room) {
    const P = meadowPatches(room);
    for (const t of P.tiles.values()) t.g = Math.min(1, t.g + dt * REGROW);
    for (const p of G.players) {
      if (!alive(p)) continue;
      const t = patchAt(room, p.x, p.y);
      if (!t) continue;
      if (t.g > 0.8) for (let j = 0; j < 3; j++) part(p.x + rnd(-4, 4), p.y - rnd(1, 4), rnd(-20, 20), -rnd(10, 30), rnd(0.3, 0.5), pick(PETAL), { g: 60 });
      t.g = 0;
    }
    // the bloom went into the seed: its tile stays flat until the seed pops
    for (const k of room.pickups) if (k.type === 'seed') { const t = patchAt(room, k.x, k.y); if (t) t.g = 0; }
    const w = meadowGust(room);
    if (!w) return;
    if (!Save.flags.gustTip && NET.role !== 'client' && G.enemies.some(e => !e.dead)) { Save.flags.gustTip = true; Save.write(); toast('PETALS: THE WIND BENDS YOUR SHOTS'); }
    if (Math.abs(w) > 1) G.wind += w;
    if (Math.random() < (Math.abs(w) > 1 ? 0.6 : 0.2)) {
      const x = w > 0 ? -4 : VW + 4;
      part(x, rnd(OY + 20, OY + 200), Math.sign(w) * rnd(60, 100), rnd(-10, 10), rnd(3, 4.5), null, { drag: 1, spr: 'petal_' + ((Math.random() * 4) | 0) });
    }
  },
  // host / solo: seeds grow (paused while anyone stands on them) and pop into their reward
  update(dt, room) {
    const list = room.pickups;
    for (let i = list.length - 1; i >= 0; i--) {
      const k = list[i];
      if (k.type !== 'seed') continue;
      if (G.players.some(p => alive(p) && Math.hypot(p.x - k.x, p.y - k.y) < 10)) k.t -= dt;
      if (k.t < SEED_T) continue;
      list.splice(i, 1);
      seedReward(k);
    }
  },
  kill(e, room) {
    const t = patchAt(room, e.x, e.y), P = meadowPatches(room);
    if (!t || t.g < 0.8 || P.seeds >= SEEDS_ROOM || room.pickups.filter(k => k.type === 'seed').length >= SEEDS_LIVE) return;
    t.g = 0; P.seeds++;
    const hurt = G.players.some(p => alive(p) && p.hp < p.maxHp), r = grand();
    room.pickups.push({ type: 'seed', x: e.x, y: e.y, z: 0, vz: 0, vx: 0, vy: 0, t: 0, pot: hurt && r < 0.4 ? 'heart' : r > 0.86 ? 'star' : 'coin' });
    burst(e.x, e.y - 3, 8, PETAL, 60, 0.4, { g: 60 });
    Audio_.sfx('pop');
    if (!Save.flags.seedTip) { Save.flags.seedTip = true; Save.write(); toast('A SEED! STEP OFF AND IT BLOOMS'); }
  },
  drawLayer(ox, oy, room, layer) {
    if (layer) return;
    if (room.lay === 'stage') for (const [x, y] of STAGE_SHROOMS) {
      const [c, r] = layCell(room, x, y);
      drawFeet(S('toadstool'), ox + c * 16 + 8, oy + OY + r * 16 + 14);
    }
    for (const [i, t] of meadowPatches(room).tiles) {
      if (room.tiles[i] !== T_FLOOR) continue;
      const stage = t.g < 0.35 ? 'flat_' : t.g < 0.8 ? 'bud_' : 'bloom_';
      for (const f of t.f) drawFeet(S(stage + f.v), ox + f.x, oy + f.y + 1);
    }
  },
};
function drawSeed(k, ox, oy) {
  const u = k.t / SEED_T, s = S(u < 0.3 ? 'seed_0' : u < 0.65 ? 'seed_1' : 'seed_2' + (k.pot || 'coin'));
  const wob = u > 0.85 && Math.floor(k.t * 10) % 2 ? 1 : 0; // about to pop
  drawFeet(s, ox + k.x + wob, oy + k.y + 2);
}

// ---------- Meadow rooms ----------
// Fight rooms of this land only (level.js mixes them in; room.lay names the one in use).
// Checked with node tools/dev.mjs layouts.
const LAND_LAYOUTS = {
  meadow: {
    // a ring of flower patches round a rock: bee couriers work it
    bees: `......................
      ..e................e..
      ......................
      ..........##..........
      .....e...####...e.....
      .........####.........
      ..........##..........
      ......................
      ..e.......e........e..
      ......................`,
    // breakable hedges and one long lane
    maze: `......................
      ..bbbbbbb....bbbbbbb..
      ..b..e..........e..b..
      ..b..bbbbbbbbbbbb..b..
      ......................
      ......................
      ..b..bbbbbbbbbbbb..b..
      ..b..e..........e..b..
      ..bbbbbbb....bbbbbbb..
      ......................`,
    // stepping stones over a pond to a little stage
    stage: `......................
      ..e................e..
      ...~~~~~~~~~~~~~~~~...
      ...~~~~~~~~~~~~~~~~...
      .....~....ee....~.....
      ...~...~~....~~...~...
      ...~~~~~~~..~~~~~~~...
      ...~~~~~~~..~~~~~~~...
      ..e................e..
      ......................`,
    // a calm room: a few bees and a chest on a blanket
    picnic: `......................
      ..e...#........#...e..
      ......................
      .#..................#.
      ......................
      ......................
      .#..................#.
      ......................
      ..e.......e........e..
      ......................`,
  },
  shore: {
    // one big rock pool, deep at low tide: go round it, or wade across when the tide is in
    pool: `......................
      ..e................e..
      ......#~~~~~~~~#......
      .....~~~~~~~~~~~~.....
      ..e..~~~~~~~~~~~~..e..
      .....~~~~~~~~~~~~.....
      ......#~~~~~~~~#......
      ......................
      ..e.......e........e..
      ......................`,
    // two boardwalks cross over the water; the pools on all four sides flood
    pier: `......................
      .e~~~~~~~....~~~~~~~e.
      .~~~~~~~~....~~~~~~~~.
      .~~~~~~~~.ee.~~~~~~~~.
      ......................
      ......................
      .~~~~~~~~....~~~~~~~~.
      .~~~~~~~~....~~~~~~~~.
      .e~~~~~~~....~~~~~~~e.
      ......................`,
    // a wrecked hull of rocks and breakable planks, bilge pools inside, a gap in each side
    wreck: `......................
      ..e................e..
      ....##bbbb..bbbb##....
      ...#~~~........~~~#...
      ...b~~....ee....~~b...
      ...b~~..........~~b...
      ...#~~~........~~~#...
      ....##bbbb..bbbb##....
      ..e................e..
      ......................`,
    // a sandbar between two channels; at high tide the current pulls waders down the room
    sandbar: `......................
      ..e.......e........e..
      ~~~~~~~~~....~~~~~~~~~
      ~~~~~~~~~....~~~~~~~~~
      ......e........e......
      ......................
      ~~~~~~~~....~~~~~~~~~~
      ~~~~~~~~....~~~~~~~~~~
      ..e.......e........e..
      ......................`,
  },
  crystal: {
    // three pillars across the room: shoot through them for a fan, and mind the foes behind them
    prisms: `......................
      ..e.......e........e..
      ......................
      ......................
      ....p.....p.....p.....
      ......................
      ......................
      .##................##.
      ..e.......e........e..
      ......................`,
    // a pit ringed by pillars: fans cross the water from every corner
    echo: `......................
      ..e................e..
      ......p........p......
      ........~~~~~~........
      ..e.....~~~~~~.....e..
      ........~~~~~~........
      ........~~~~~~........
      ......p........p......
      ..e.......e........e..
      ......................`,
    // four bell crystals round a clock face; the tune opens the chest's gate
    clock: `....#.................
      gggg#.................
      ..........s...........
      ......................
      ..e..s.........s...e..
      ......................
      ..........s...........
      ......................
      ..e.......e.........e.
      ......................`,
    // crystal veins across a long hall: break through, or go round
    vein: `......................
      .bbbbbbb......bbbbbbb.
      ......................
      ..e...b..e..e..b...e..
      ....b....#..#....b....
      ....b....#..#....b....
      ..e...b........b...e..
      ......................
      .bbbbbbb......bbbbbbb.
      ......................`,
  },
  cloud: {
    // a ring of sunstone islands in a sea of puffing cloud: hop from stone to stone
    stones: `......................
      ..e................e..
      ......oo......oo......
      ...oo.oo......oo.oo...
      ...oo............oo...
      .........e..e.........
      ...oo............oo...
      ...oo.oo......oo.oo...
      ..e...oo......oo...e..
      ......................`,
    // four rock sails turn round an updraft in the middle
    pinwheel: `......................
      ..e.......e......#.e..
      .....#####.......#....
      .................#....
      .........oooo.........
      .........ouuo.........
      ....#....oooo.........
      ....#.......#####.....
      .e..#..............e..
      ......................`,
    // open sky splits the room: ride the updrafts over, or walk the long way round
    hop: `......................
      ..e.......e........e..
      ......o~~~~~~~~~~o....
      .....oo~~~~~~~~~~oo...
      ..e..ou~~~oooo~~~uo.e.
      .....ou~~~ouuo~~~uo...
      .....oo~~~~~~~~~~oo...
      ......o~~~~~~~~~~o....
      ..e.......e........e..
      ......................`,
    // sunstone terraces in rows; the gusts sweep the cloud lanes between them
    terrace: `......................
      ..e.......e........e..
      ..oooooo......oooooo..
      ......................
      .....oooooo..oooooo...
      ......................
      ..oooooo......oooooo..
      ......................
      ..e.......e........e..
      ......................`,
    // walls of packed cloud to break through; a sunstone heart in the middle
    puffmaze: `......................
      ..bbbbbbb....bbbbbbb..
      ..b..e..........e..b..
      ..b....bbb..bbb....b..
      .......b.oooo.b.......
      .......b.oooo.b.......
      ..b....bbb..bbb....b..
      ..b..e..........e..b..
      ..bbbbbbb....bbbbbbb..
      ......................`,
    // one long sunstone runway under the kites; the cloud either side is the risky ground
    runway: `......................
      ..e.......e........e..
      ......................
      ......................
      .oooooooooooooooooooo.
      .oooooooooooooooooooo.
      ......................
      ......................
      ..e.......e........e..
      ......................`,
  },
};
for (const l in LAND_LAYOUTS) for (const k in LAND_LAYOUTS[l]) LAND_LAYOUTS[l][k] = LAND_LAYOUTS[l][k].split('\n').map(r => r.trim());
// what each room brings: its own foe mix (max: how many, plus one per extra hero; calm: no elites)
const LAY_RULE = {
  bees: { pool: [['courier', 4], ['bee', 2], ['puff', 1]] },
  stage: { pool: [['shroom', 3], ['flower', 2], ['slime', 2], ['puff', 1]] },
  picnic: { pool: [['courier', 1]], max: 3, calm: true },
  pool: { pool: [['puffer', 2], ['jelly', 2], ['crab', 2], ['bomber', 2]] },
  pier: { pool: [['roller', 3], ['gull', 2], ['bomber', 2]] },
  wreck: { pool: [['hermit', 2], ['crab', 3], ['starfish', 2]] },
  sandbar: { pool: [['roller', 2], ['crab', 2], ['jelly', 2], ['gull', 1]] },
  prisms: { pool: [['imp', 3], ['shroom', 2], ['wisp', 2], ['gemlet', 2]] },
  echo: { pool: [['bat', 3], ['imp', 2], ['wisp', 2], ['gmoth', 2]] },
  clock: { pool: [['gbeet', 2], ['slime', 2], ['gemlet', 2], ['bat', 2]] },
  vein: { pool: [['gbeet', 3], ['spider', 2], ['mole', 2], ['slime', 1]] },  stones: { pool: [['sheep', 3], ['nimbus', 2], ['stormwisp', 2]] },
  pinwheel: { pool: [['pigeon', 3], ['sheep', 2], ['stormwisp', 2]] },
  hop: { pool: [['kiteray', 3], ['stormwisp', 2], ['pigeon', 2]] },
  terrace: { pool: [['nimbus', 2], ['pigeon', 2], ['kiteray', 2], ['slime', 1]] },
  puffmaze: { pool: [['sheep', 3], ['slime', 2], ['nimbus', 1]] },
  runway: { pool: [['kiteray', 4], ['stormwisp', 1]], max: 5 },
};
// Bee Meadow: the patches form a ring round the rock (layout cells, mirrored with the room)
const BEE_RING = [[7, 2], [8, 2], [13, 2], [14, 2], [6, 4], [6, 5], [15, 4], [15, 5], [7, 7], [8, 7], [13, 7], [14, 7]];
const layCell = (room, x, y) => [(room.flip[0] ? 21 - x : x) + 1, (room.flip[1] ? 9 - y : y) + 2];
// Mushroom Stage: two toadstools on the island's front corners
const STAGE_SHROOMS = [[9, 5], [12, 5]];
LA('toadstool', `
  ............
  ....RRRr....
  ..RRwwRrrr..
  .RwwwRrrwrp.
  .RRRrrrrrrp.
  .rrwwrrrrpp.
  ..pppppppp..
  ....AAA.....
  ....AAe.....
  ....AAe.....
  ............`);
// Picnic: a gingham blanket with a plate and apples on it (a floor prop; the chest sits on top)
def('blanket', stamp(stamp(stamp(grid(88, 44).fill((x, y) => {
  const edge = x === 0 || x === 87 || y === 0 || y === 43;
  if ((x === 0 || x === 87) && (y === 0 || y === 43)) return null;
  if (edge) return '0';
  const v = Math.floor((x - 1) / 6) % 2 === 0, h = Math.floor((y - 1) / 5) % 2 === 0;
  if (y >= 40) return v ? 'p' : 'l'; // the folded front edge, in shade
  if (y === 1 || x === 1) return v && h ? 'R' : 'w'; // light from the top left
  return v && h ? 'r' : v || h ? 'R' : 'w';
}).rows(), 10, 23, [
  '...00000000...',
  '..0LLLLLLLL0..',
  '.0LLaAAAaLLl0.',
  '0LLaAhGhAaLll0',
  '0lLLnNNNnLlll0',
  '.0llllllllll0.',
  '..0000000000..',
]), 66, 8, [
  '...0...',
  '.00G00.',
  '0wRrrr0',
  '0RRrrr0',
  '0rrrrp0',
  '.00000.',
]), 72, 14, [
  '...0...',
  '.00h00.',
  '0HyyyO0',
  '0yyyyO0',
  '0yyyOo0',
  '.00000.',
]));

// ---------- Shore: the Tide ----------
// A 24 s cycle on the same clock on every screen. Low tide: the pools are deep (pits) and each
// ebb leaves shells on the sand beside them. A foam line creeps up the room for 2 s, then the
// tide comes in: the pools turn to shallow water that heroes and foes wade through, slowly
// (shots always pass; water never hurts). The foam slides back down for 2 s and the pools blink
// before the tide goes out; anyone still wading is set on the nearest dry sand.
const TIDE_CYCLE = 24, TIDE_TELL = 10, TIDE_HIGH = 12, TIDE_EBB = 22, WADE = 0.6, SHELLS_ROOM = 6, SANDBAR_PULL = 36;
// u in [0, TIDE_CYCLE), or -1 where there is no tide (no pools, bosses, the Arena, the tutorial)
function tideU(room) {
  if (!room || !room.pits || !room.pits.length || room.type === 'boss' || room.type === 'arena' || G.tut || !G.floor || G.floor.land.id !== 'shore') return -1;
  const t = skyNow();
  return (t + room.seed % TIDE_CYCLE) % TIDE_CYCLE;
}
// wading: feet in a flooded pool (level.js slows moveBox by WADE there)
const wading = (room, x, y) => room.flood && room.tiles[Math.floor((y - 1 - OY) / 16) * COLS + Math.floor(x / 16)] === T_PIT;
// Pier: boardwalk planks, boards across the way they run (v: a walk going up the room)
for (const v of [0, 1]) def('plank_' + 'hv'[v], grid(16, 16).fill((x, y) => {
  const a = v ? y : x, b = v ? x : y, m = a % 4;
  if (m === 3) return 'n'; // the gap between boards
  if (m === 0) return 'O'; // each board's lit edge (top / left)
  if ((b === 2 || b === 13) && m === 2) return 'u'; // nails
  return hash(x, y, 31) % 9 ? 'N' : 'e'; // grain
}).rows());
const PIER_V = (c, r) => c >= 10 && c <= 13, PIER_H = (c, r) => r >= 6 && r <= 7; // tile cells (symmetric, so flips keep them)
function drawPier(ox, oy) {
  for (let r = 2; r <= 11; r++) for (let c = 1; c <= 22; c++) {
    const v = PIER_V(c, r), h = PIER_H(c, r);
    if (!v && !h) continue;
    const x = ox + c * 16, y = oy + OY + r * 16;
    drawS(S(v ? 'plank_v' : 'plank_h'), x, y);
    // the outline where the boardwalk meets the sand
    if (v && !h) { if (c === 10) rect(x, y, 1, 16, '0'); if (c === 13) rect(x + 15, y, 1, 16, '0'); }
    if (h && !v) { if (r === 6) rect(x, y, 16, 1, '0'); if (r === 7) rect(x, y + 15, 16, 1, '0'); }
  }
}
// shallow water over sand (two frames, the ripples drift), no outline: it lies inside the pool's edge
for (let f = 0; f < 2; f++) def('shallow_' + f, grid(16, 16).fill((x, y) => {
  const w = (y + Math.round(Math.sin((x + f * 4) / 16 * Math.PI * 2) * 1.2) + 16) % 8;
  if (w === 0) return 'A'; // sand ridge under the water
  if (w === 1) return 'c';
  const q = hash(x, y, 77 + f) % 23;
  return q === 0 ? 'w' : 'C';
}).rows());
// low-tide finds: a scallop shell (2 coins) and, now and then, a pearl (6)
LA('shell', `
  .......
  ..qPq..
  .qwqPp.
  .PqPpP.
  ..pPp..
  ...p...
  .......`);
LA('pearl', `
  .......
  ..wL...
  .wwLl..
  .LLll4.
  ..l44..
  .......`);
PICK_VAL.shell = 2; PICK_VAL.pearl = 6;
function tideTurn(room, flood) {
  room.flood = flood; flowKey = -1;
  const host = NET.role !== 'client';
  if (flood) {
    Audio_.sfx('wave');
    for (const [x, y] of room.pits) if (Math.random() < 0.5) part(x + rnd(2, 14), y + rnd(6, 14), rnd(-10, 10), -rnd(10, 30), rnd(0.3, 0.5), pick(['w', 'C']), { g: 80 });
    if (host && !Save.flags.tideTip) { Save.flags.tideTip = true; Save.write(); toast('HIGH TIDE: WADE THROUGH THE POOLS'); }
    return;
  }
  // the ebb: nobody is left standing in a pool (a client moves only its own hero)
  for (const p of G.players) if (!p.dead && (host ? !p.remote : p === G.player) && nudgeOut(room, p, heroMoveMode(p))) { p.tpN++; dust(p.x, p.y, 4, 8); }
  if (!host) return;
  for (const e of G.enemies) if (!e.dead && !e.fly) nudgeOut(room, e, 'enemy');
  for (const k of room.pickups) nudgeOut(room, k, 'enemy');
  // shells on the sand beside the pools (rnd, not the seeded streams: this runs on wall-clock time)
  room.shellN = room.shellN || 0;
  const spots = [];
  for (const [x, y] of room.pits) for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const c = x / 16 + dc, r = (y - OY) / 16 + dr;
    if (tileAt(room, c, r) === T_FLOOR && r >= 2 && r <= 11 && c >= 1 && c <= 22) spots.push([c, r]);
  }
  for (let n = rnd() < 0.5 ? 1 : 2; n > 0 && spots.length && room.shellN < SHELLS_ROOM; n--) {
    const [c, r] = spots[(rnd() * spots.length) | 0];
    room.pickups.push({ type: rnd() < 0.12 ? 'pearl' : 'shell', x: c * 16 + rnd(4, 12), y: OY + r * 16 + rnd(8, 14), z: 0, vz: 50, vx: 0, vy: 0, t: rnd(0, 3) });
    room.shellN++;
  }
}
function tideFoamY(u) {
  if (u >= TIDE_TELL && u < TIDE_HIGH) return OY + 190 - (u - TIDE_TELL) / (TIDE_HIGH - TIDE_TELL) * 158;
  if (u >= TIDE_EBB) return OY + 32 + (u - TIDE_EBB) / (TIDE_CYCLE - TIDE_EBB) * 158;
  return -1;
}
LAND_MECH.shore = {
  every(dt, room) {
    const u = tideU(room), f = u >= TIDE_HIGH;
    if (u < 0) { room.flood = false; return; }
    // a room just walked into (or a long pause) takes the tide as it is, quietly
    if (room.tideAt === undefined || G.time - room.tideAt > 0.5) { room.flood = f; flowKey = -1; }
    else if (f !== !!room.flood) tideTurn(room, f);
    room.tideAt = G.time;
    if (u >= TIDE_TELL && u - dt < TIDE_TELL) Audio_.sfx('wave');
    if (!room.flood) return;
    // Sandbar: the current pulls waders down the room (slowed by the water like any wading step)
    if (room.lay === 'sandbar') {
      const host = NET.role !== 'client';
      for (const p of G.players) if (alive(p) && (host ? !p.remote : p === G.player) && wading(room, p.x, p.y)) moveBox(room, p, 0, SANDBAR_PULL * dt, heroMoveMode(p));
      if (host) for (const e of G.enemies) if (!e.dead && !e.fly && !EDEF[e.type].still && wading(room, e.x, e.y)) moveBox(room, e, 0, SANDBAR_PULL * dt, 'enemy');
    }
    // wading splashes
    for (const p of G.players) if (alive(p) && p.moving && wading(room, p.x, p.y) && Math.random() < 0.25) part(p.x + rnd(-4, 4), p.y - 1, rnd(-15, 15), -rnd(15, 35), 0.3, pick(['w', 'C', 'c']), { g: 120 });
  },
  drawLayer(ox, oy, room, layer) {
    if (layer === 2) return;
    if (!layer && room.lay === 'pier') drawPier(ox, oy);
    const u = tideU(room);
    if (u < 0) return;
    if (layer === 1) {
      // waders stand in the water up to the ankles
      if (!room.flood) return;
      for (const q of G.players) if (alive(q) && wading(room, q.x, q.y)) drawWake(ox + q.x, oy + q.y);
      for (const e of G.enemies) if (!e.dead && !e.fly && wading(room, e.x, e.y)) drawWake(ox + e.x, oy + e.y);
      return;
    }
    // the shallows: blinking in the last second before the ebb
    if (room.flood && !(u >= TIDE_CYCLE - 1 && Math.floor(u * 8) % 2)) {
      const s = S('shallow_' + (Math.floor(G.time * 2) & 1));
      for (const [x, y] of room.pits) {
        const c = x / 16, r = (y - OY) / 16;
        const up = tileAt(room, c, r - 1) === T_PIT, dn = tileAt(room, c, r + 1) === T_PIT;
        const lf = tileAt(room, c - 1, r) === T_PIT, rt = tileAt(room, c + 1, r) === T_PIT;
        const x0 = lf ? 0 : 1, y0 = up ? 0 : 4, w = 16 - x0 - (rt ? 0 : 1), h = (dn ? 16 : 14) - y0;
        ctx.drawImage(ATLAS, s.x[0] + x0, s.y[0] + y0, w, h, ox + x + x0, oy + y + y0, w, h);
        if (!up) rect(ox + x + x0, oy + y + 4, w, 1, 'w'); // the waterline under the lip
        // Sandbar: current streaks drift down the channel
        if (room.lay === 'sandbar') for (let i = 0; i < 2; i++) {
          const sx = x + 3 + (hash(x, y, i) % 10), sy = (hash(y, x, i + 3) % 16 + G.time * 22) % 16;
          if (sy >= y0 + 1 && sy < y0 + h - 3) rect(ox + sx, oy + y + Math.floor(sy), 1, 3, 'w');
        }
      }
    }
    // the foam line: up the room before the flood, back down before the ebb
    const fy = tideFoamY(u);
    if (fy < 0) return;
    for (let x = 16; x < VW - 16; x += 2) {
      const y = Math.round(fy + Math.sin(x / 11 + G.time * 3) * 2);
      rect(ox + x, oy + y, 2, 1, 'w');
      if ((x >> 1) % 3) rect(ox + x, oy + y + 1, 2, 1, 'C');
      if (hash(x, Math.floor(G.time * 6), 5) % 5 === 0) rect(ox + x, oy + y - 2, 1, 1, 'w');
    }
  },
};
// the water over a wader's feet, and ripples that widen round them
function drawWake(x, y) {
  const k = Math.floor(G.time * 5) % 3;
  rect(x - 6, y, 13, 2, 'C');
  rect(x - 5, y - 1, 11, 1, 'w');
  rect(x - 8 - k, y + 1, 2, 1, 'w'); rect(x + 7 + k, y + 1, 2, 1, 'w');
}

// ---------- Crystal Cave: Prism Pillars ----------
// A prism pillar (tile T_PRISM, layout 'p') splits every shot that flies into it: three
// narrower ones for heroes (splitShot), a fan of three for foes (splitBullet).
def('prism', `
  ................
  .....000000.....
  ....0wwwwLL0....
  ....0LLL4430....
  ....0PL44320....
  ....0yP44320....
  ....0cyP4320....
  ....0LcyP320....
  ....0LLcyP20....
  ....0LL4cyP0....
  ....0LL44cy0....
  ..00LL443c200...
  ..0lllmmmmmd0...
  ..0mmmmmmmdd0...
  ...0000000000...
  ................`);
// Crystal Clock: four bell crystals (T_BELL, 's') ring a tune; the gate (T_GATE, 'g') opens
// when they are shot in the same order.
const BELL_LEG = [{ q: 'q', P: 'P', p: 'p' }, { q: 'Y', P: 'y', p: 'o' }, { q: 'C', P: 'T', p: 't' }, { q: '4', P: '3', p: '2' }];
BELL_LEG.forEach((leg, i) => def('bell_' + i, `
  ................
  .......00.......
  ......0wq0......
  .....0wqPp0.....
  .....0qPPp0.....
  ....0wqPPpp0....
  ....0qPPPpp0....
  ....0qPPPpp0....
  ....0qPPPpp0....
  ....0qPPppp0....
  .....0PPpp0.....
  ...0llPPppmd0...
  ...0lmmmmmmd0...
  ...0mmmmmmdd0...
  ....00000000....
  ................`, { legend: leg, flash: true }));
def('cgate', `
  ................
  .00..00..00..00.
  0wC00wC00wC00wC0
  0Cc00Cc00Cc00Cc0
  0Cc00Cc00Cc00Cc0
  0Cc00Cc00Cc00Cc0
  0000000000000000
  0433333333333320
  0000000000000000
  0cB00cB00cB00cB0
  0cB00cB00cB00cB0
  0cB00cB00cB00cB0
  0BB00BB00BB00BB0
  0bb00bb00bb00bb0
  .00..00..00..00.
  ................`);
// Once the room is clear the four bells play a tune of four notes, each bell once. Shooting
// them in the same order lights the gate's lamps one by one and opens the alcove with the chest;
// a wrong bell puts the lamps out and the tune plays again. After CLOCK_WAIT s without a bell the
// tune plays again from the start. The state lives in a room prop (kind 'clock', off screen), so
// co-op clients draw the tune and the lamps from the snapshots; the host rings the notes.
const CLOCK_BELLS = [[10, 2], [15, 4], [10, 6], [5, 4]], CLOCK_GATE = [[0, 1], [1, 1], [2, 1], [3, 1]]; // layout cells
const CLOCK_NOTE = 0.6, CLOCK_LIT = 0.45, CLOCK_WAIT = 4, CLOCK_LOOP = 8;
const BELL_COL = BELL_LEG.map(l => [l.q, l.P, l.p, 'w']);
// the host's clock in seconds, on every screen
const skyNow = () => (performance.now() - (NET.role === 'client' ? NET.off || 0 : 0)) / 1000;
const clockOf = room => room.lay === 'clock' ? room.props.find(o => o.kind === 'clock') : null;
function clockStock(room) {
  const seq = [0, 1, 2, 3], h = hash(3, 9, room.seed);
  for (let i = 3; i > 0; i--) { const j = (h >>> (i * 4)) % (i + 1); [seq[i], seq[j]] = [seq[j], seq[i]]; }
  room.props.push({ kind: 'clock', x: -99, y: -99, seq, at: 0, got: 0, hb: -1, ht: 0, done: false, sig: '', t: 0 });
  const [c0, r0] = layCell(room, 0, 0), [c1] = layCell(room, 3, 0);
  room.props.push({ kind: 'chest', x: (c0 + c1) * 8 + 8, y: OY + r0 * 16 + 13, t: 0, open: false });
}
const clockSig = k => { k.sig = k.got + ':' + k.at + ':' + k.ht + (k.done ? '!' : ''); };
// which bell (0-3) is on tile c, r, else -1
function bellAt(room, c, r) {
  for (let b = 0; b < 4; b++) { const [bc, br] = layCell(room, CLOCK_BELLS[b][0], CLOCK_BELLS[b][1]); if (bc === c && br === r) return b; }
  return -1;
}
// the bell the tune lights at time now (-1 between notes)
function clockLit(k, now) {
  const u = now - k.at;
  if (!k.at || k.done || u < 0) return -1;
  const ph = u % CLOCK_LOOP, n = Math.floor(ph / CLOCK_NOTE);
  return n < 4 && ph - n * CLOCK_NOTE < CLOCK_LIT ? k.seq[n] : -1;
}
// a hero's shot hit bell tile c, r (host / solo: updateShots)
function bellHit(room, c, r) {
  const k = clockOf(room), b = bellAt(room, c, r);
  if (!k || b < 0 || !k.at || NET.role === 'client') return;
  const now = skyNow();
  if (b === k.hb && now - k.ht < 0.5) return; // a stream of shots on the bell just rung is one note
  k.hb = b; k.ht = now;
  Audio_.sfx('bell' + b);
  burst(c * 16 + 8, OY + r * 16 + 5, 6, BELL_COL[b], 45, 0.35);
  if (!k.done) {
    if (b === k.seq[k.got]) { k.got++; k.at = now + CLOCK_WAIT; }
    else { k.got = 0; k.at = now + 1.2; Audio_.sfx('deny'); }
    if (k.got === 4) clockOpen(room, k);
  }
  clockSig(k);
}
function clockOpen(room, k) {
  k.done = true;
  for (const [x, y] of CLOCK_GATE) {
    const [c, r] = layCell(room, x, y);
    setTile(room, c, r, T_FLOOR);
    burst(c * 16 + 8, OY + r * 16 + 8, 8, ['C', 'w', 'c', '4'], 60, 0.45);
  }
  Audio_.sfx('cgate');
  toast('THE GATE OPENS');
}
LAND_MECH.crystal = {
  // the clock is timed by this page's clock: coming back (or reloading) starts the tune afresh
  enter(room) { const k = clockOf(room); if (k && !k.done) { k.at = 0; k.got = 0; clockSig(k); } },
  // host / solo: the tune starts once the room is clear, then waits for the bells
  update(dt, room) {
    const k = clockOf(room);
    if (!k || k.done || !room.cleared) return;
    const now = skyNow();
    if (!k.at) {
      k.at = now + 1; clockSig(k);
      if (!Save.flags.clockTip) { Save.flags.clockTip = true; Save.write(); toast('LISTEN, THEN SHOOT THE BELLS IN ORDER'); }
      return;
    }
    const u = now - k.at, v = u - dt;
    if (u < 0) return;
    const ph = u % CLOCK_LOOP, pv = v < 0 || v % CLOCK_LOOP > ph ? -1 : v % CLOCK_LOOP;
    if (pv < 0 && k.got) { k.got = 0; clockSig(k); } // the tune starts over
    for (let n = 0; n < 4; n++) if (pv < n * CLOCK_NOTE && ph >= n * CLOCK_NOTE) Audio_.sfx('bell' + k.seq[n]);
  },
  // every screen: sparkles off a bell as the tune lights it
  every(dt, room) {
    const k = clockOf(room);
    if (!k) return;
    const b = clockLit(k, skyNow());
    if (b < 0 || Math.random() > 0.3) return;
    const [c, r] = layCell(room, CLOCK_BELLS[b][0], CLOCK_BELLS[b][1]);
    part(c * 16 + 8 + rnd(-5, 5), OY + r * 16 + rnd(2, 10), rnd(-12, 12), -rnd(15, 35), rnd(0.3, 0.5), pick(BELL_COL[b]), { g: -10 });
  },
  drawLayer(ox, oy, room, layer) {
    if (layer) return;
    const now = skyNow();
    // prism glints: a spark runs down each pillar's rainbow now and then
    for (let i = 0; i < room.tiles.length; i++) {
      if (room.tiles[i] !== T_PRISM) continue;
      const g = (now + hash(i, 5, room.seed) % 40 / 10) % 4;
      if (g < 0.36) { const s = Math.floor(g / 0.06); rect(ox + (i % COLS) * 16 + 5 + s, oy + OY + ((i / COLS) | 0) * 16 + 5 + s, 1, 1, 'w'); }
    }
    const k = clockOf(room);
    if (!k) return;
    // the bell the tune (or a hit) lights shines white
    const lit = clockLit(k, now), hit = now - k.ht < 0.25 ? k.hb : -1;
    for (let b = 0; b < 4; b++) {
      if (b !== lit && b !== hit) continue;
      const [c, r] = layCell(room, CLOCK_BELLS[b][0], CLOCK_BELLS[b][1]);
      drawS(S('bell_' + b), ox + c * 16, oy + OY + r * 16, 2);
    }
    // the gate's lamps: one per note found, in its bell's colour
    CLOCK_GATE.map(([x, y]) => layCell(room, x, y)).sort((p, q) => p[0] - q[0]).forEach(([c, r], n) => {
      if (tileAt(room, c, r) !== T_GATE) return;
      const x = ox + c * 16 + 5, y = oy + OY + r * 16 + 5, on = n < k.got ? BELL_COL[k.seq[n]] : null;
      rect(x, y, 6, 5, '0');
      rect(x + 1, y + 1, 4, 3, on ? on[1] : '1');
      rect(x + 1, y + 1, 1, 1, on ? on[0] : '2');
      if (on) rect(x + 4, y + 3, 1, 1, on[2]);
    });
  },
};
// the sprite of a crystal tile (level.js renderRoomStatic)
function tileArt(room, c, r, t) {
  if (t === T_LAMP || t === T_LAMPON) return 'lamp_' + (t === T_LAMPON ? 1 : 0);
  return t >= T_MIRROR ? 'mirror_' + (t - T_MIRROR) : t === T_PRISM ? 'prism' : t === T_BELL ? 'bell_' + Math.max(0, bellAt(room, c, r)) : 'cgate';
}

// Ice (T_ICE, layout 'i'): a pale sheet with glints; the renderer adds the edges
def('ice', `
  CCCCCCCCCCCCCCCC
  CCCCCCCCCCCCCCCC
  CCCCCCCCCCCCCCCC
  CCCCCCCwCCCCCCCC
  CCCCCCwCCCCCCCCC
  CCCCCwCCCCCCCCCC
  CCCCCCCCCCCCCCCC
  CCCCCCCCCCCCCCCC
  CCCCCCCCCCCCCCCC
  CCCCCCCCCCCCCCCC
  CCCCCCCCCCCCwCCC
  CCCCCCCCCCCwCCCC
  CCCCCCCCCCCCCCCC
  CCcCCCCCCCCCCCCC
  CCCCCCCCCCCCCCCC
  CCCCCCCCCCCCCCCC`, { flip: true });

// ---------- Mirrors (T_MIRROR, layout 7 9 3 1) ----------
// A slab standing diagonally across its tile (the same line mirrorPass tests), MIR_H px tall:
// glass (white and cyan) on the side its normal points to, sandstone with a gold rim behind.
// The sprite is MIR_OFF px taller than a tile and drawn bottom-aligned, so it rises over the tile above.
const MIR_H = 6, MIR_OFF = 4;
for (let k = 0; k < 4; k++) {
  const n = MIR_N[k], a = [];
  for (let y = 0; y < 16 + MIR_OFF; y++) a.push(new Array(16).fill('.'));
  for (let gy = 3; gy <= 12; gy++) for (let x = 3; x <= 12; x++) { // back to front, so nearer rows cover
    const f = n[0] * (x + 0.5 - 8) + n[1] * (gy + 0.5 - 8);
    if (f <= -2 || f > 2) continue;
    const glass = f > 0, yt = gy + MIR_OFF - MIR_H;
    for (let h = 0; h <= MIR_H; h++) a[yt + h][x] = h === 0 ? (glass ? (f === 2 ? 'C' : 'w') : (f === 0 ? 'y' : 'O'))
      : glass ? (h === 1 ? 'C' : h === MIR_H ? 'b' : h === 3 && (x + gy) % 4 === 0 ? 'w' : h === 2 ? 'c' : 'B')
      : (h === 1 ? 'y' : h === MIR_H ? 'n' : h === 2 ? 'a' : 'e');
  }
  def('mirror_' + k, autoOutline(a.map(r => r.join(''))));
}

// ---------- Cloud Steps: the Puff Floor ----------
// The floor is cloud. A cloud a hero lingers on (PUFF_LOAD s, twice that in Feather Boots)
// wobbles for PUFF_WOB s (tile T_PUFF, still walkable), then puffs away into open sky (T_PIT)
// for HOLE_T s. A walking foe caught on it falls; a hero standing in the hole drops through,
// loses half a heart and is set back on the nearest cloud. Sunstone slabs (room.stone: layout
// 'o', the door approaches and a few patches) never puff, and updraft vents on them (layout
// 'u') hop a hero who walks in over the sky. Cleared rooms, the arena and the first room stay
// whole. Tiles change through setTile, so every screen sees the same holes.
const PUFF_LOAD = 0.4, PUFF_WOB = 1, HOLE_T = 4, HOP_T = 0.55, HOP_V = 102, HOP_Z = 14, HOP_HANG = 0.5;
const CLOUD_BURST = ['w', 'L', 'l', 'C'];
// cloud floor tiles: white lumps shaded bottom right, wrapping so the tiles join seamlessly
function cloudTile(lumps, specks) {
  const lump = (x, y, cx, cy, rx, ry) => {
    const dx = ((x - cx + 24) % 16) - 8, dy = ((y - cy + 24) % 16) - 8;
    return (dx / rx) ** 2 + (dy / ry) ** 2 <= 1;
  };
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let s = '';
    for (let x = 0; x < 16; x++) {
      const hi = lumps.some(([cx, cy, rx, ry]) => lump(x, y, cx, cy, rx, ry));
      const lo = lumps.some(([cx, cy, rx, ry]) => lump(x - 1, y - 1, cx, cy, rx, ry));
      s += hi ? 'w' : lo ? 'l' : specks.some(([sx, sy]) => sx === x && sy === y) ? 'l' : 'L';
    }
    rows.push(s);
  }
  return rows;
}
def('cloud_0', cloudTile([[3, 3, 3, 2], [11, 7, 2.6, 2], [4, 12, 2.4, 1.6]], [[13, 13], [8, 1]]), { flip: true });
def('cloud_1', cloudTile([[8, 4, 3.5, 2.2], [2, 11, 2, 1.6], [12, 12, 2.6, 1.8]], [[5, 8], [14, 3]]), { flip: true });
def('cloud_2', cloudTile([[5, 7, 4, 2.6], [13, 2, 2, 1.4]], [[11, 11], [2, 14], [14, 9]]), { flip: true });
def('cloud_3', cloudTile([[12, 5, 2.8, 2], [5, 10, 3, 2], [2, 2, 1.6, 1.2]], [[9, 14], [7, 3]]), { flip: true });
// sunstone: pale sand slabs lit from the top left; one in a few carries a gold sun
function sunTile(sun) {
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let s = '';
    for (let x = 0; x < 16; x++) s += y === 0 || x === 0 ? 'A' : y === 15 || x === 15 ? 'e' : 'a';
    rows.push(s);
  }
  return sun ? stamp(rows, 4, 4, `
    ...y...
    .y.e.y.
    ..eYe..
    yeYYyey
    ..eye..
    .y.e.y.
    ...y...`) : stamp(stamp(rows, 3, 3, 'e.\n.A'), 10, 11, 'e.\n.A');
}
def('sunstone_0', sunTile(false));
def('sunstone_1', sunTile(true));
// an updraft vent: a gold grate open onto the sky
def('vent', `
  ................
  ................
  ................
  ....00000000....
  ..00nnnnnnnn00..
  .0nCcyCcyCcyCn0.
  .0nccyccyccycn0.
  .0nccyccyccycn0.
  ..0nAAAAAAAAn0..
  ...0000000000...
  ................
  ................
  ................
  ................
  ................
  ................`);
// the open sky under the clouds: mostly empty blue with a speck of haze, now and then the world
// far below (a tiny patchwork of meadow, a pond, a cloud drifting under ours)
const SKY = [`
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  ccccccccccCccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccCcccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc`, `
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  ccccccCCCCcccccc
  cccccCHhhGCCcccc
  ccccCHhhGyYGCccc
  ccccChGGGyyGgCcc
  cccccCGGhhGggCcc
  ccccccCggGggCccc
  cccccccCCCCCcccc
  cccccccccccccccc
  cccccccccccccccc
  ccCccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc`, `
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccCcccc
  ccccccccccCCCccc
  cccccccccCHhGCcc
  ccccccccCHhBGgCc
  ccccccccCGGgggCc
  cccccccccCCCCccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc`, `
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccCCCcccccccc
  ccccCwwwCCcccccc
  cccCwwwwwwCccccc
  ccccCCCCCCcccccc
  cccccccccccccccc
  cccccccccccccccc
  cccccccccccCcccc
  cccccccccccccccc`];
SKY.forEach((a, i) => def('sky_' + i, a, { flip: true }));
// which sky a hole shows: fixed per cell, so it looks the same on every screen
function skyOf(room, c, r) {
  const h = hash(c, r, room.seed ^ 0x51c7), k = h % 20;
  return ['sky_' + (k === 0 ? 1 : k === 1 ? 2 : k < 5 ? 3 : 0), (h >>> 8) & 1];
}
// sprite copies with only part of their pixels (a 4x4 ordered dither), for clouds that thin out
// and grow back: level 0..16 pixels of every 16
const _dith = new Map();
function dithered(key, v, lvl) {
  const id = key + v + ':' + lvl;
  let c = _dith.get(id);
  if (c) return c;
  const s = S(key);
  c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
  const g = c.getContext('2d');
  blit(g, s, 0, 0, v);
  const im = g.getImageData(0, 0, s.w, s.h);
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (BAYER4[(y & 3) * 4 + (x & 3)] >= lvl) im.data[(y * s.w + x) * 4 + 3] = 0;
  g.putImageData(im, 0, 0);
  _dith.set(id, c);
  return c;
}
const cloudOf = (room, c, r) => { const h = hash(c, r, room.seed + 11); return ['cloud_' + (h & 3), (h >> 2) & 1]; };
const cellAt = (x, y) => Math.floor((y - 1 - OY) / 16) * COLS + Math.floor(x / 16); // the tile under feet at x, y
// the slabs that never puff (1) and the vents (2), worked out alike on every screen from the room
// itself (clients never build rooms: they get their tiles from the host)
function skyStone(room) {
  if (room.stone !== undefined) return room.stone;
  if (room.type === 'arena' || room.type === 'slide') return (room.stone = null);
  const st = new Uint8Array(COLS * ROWS), put = (c, r, v) => { if (c > 0 && c < COLS - 1 && r > 1 && r < ROWS - 1) st[r * COLS + c] = v; };
  const APPROACH = { u: [10, 2, 4, 2], d: [10, 10, 4, 2], l: [1, 5, 2, 4], r: [21, 5, 2, 4] };
  for (const d in room.doors) if (!hiddenDoor(room, d)) { const [c0, r0, w, h] = APPROACH[d]; for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) put(c, r, 1); }
  const lay = room.lay && LAND_LAYOUTS.cloud && LAND_LAYOUTS.cloud[room.lay];
  let marked = false;
  if (lay) for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) {
    const ch = lay[y][x];
    if (ch !== 'o' && ch !== 'u') continue;
    const [c, r] = layCell(room, x, y);
    put(c, r, ch === 'u' ? 2 : 1); marked = true;
  }
  // rooms without their own slabs get a few 2x2 patches (a spot to stand and shoot)
  if (!marked) for (let n = 3 + hash(2, 5, room.seed) % 3, a = 0; n > 0 && a < 40; a++) {
    const h = hash(a, 13, room.seed), c = 2 + h % 19, r = 3 + (h >>> 8) % 7;
    if (st[r * COLS + c] || st[r * COLS + c + 1] || st[(r + 1) * COLS + c] || (c > 8 && c < 15)) continue; // keep the middle cloud
    put(c, r, 1); put(c + 1, r, 1); put(c, r + 1, 1); put(c + 1, r + 1, 1); n--;
  }
  return (room.stone = st);
}
// the floor: clouds, and sunstone with a 1px outline where it meets cloud (renderRoomStatic)
THEMES.cloud.paint = function (g, room) {
  const st = skyStone(room);
  const isSt = (c, r) => c < 1 || r < 2 || c > COLS - 2 || r > ROWS - 2 || (st && st[r * COLS + c]);
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    const x = c * 16, y = OY + r * 16, s = st && st[r * COLS + c];
    if (!s) { const [k, v] = cloudOf(room, c, r); blit(g, S(k), x, y, v); continue; }
    blit(g, S(hash(c, r, room.seed + 5) % 5 ? 'sunstone_0' : 'sunstone_1'), x, y);
    g.fillStyle = PAL['0'];
    if (!isSt(c, r - 1)) g.fillRect(x, y, 16, 1);
    if (!isSt(c - 1, r)) g.fillRect(x, y, 1, 16);
    if (!isSt(c + 1, r)) g.fillRect(x + 15, y, 1, 16);
    if (!isSt(c, r + 1)) { g.fillRect(x, y + 15, 16, 1); g.fillStyle = PAL.l; g.fillRect(x + 1, y + 16, 14, 1); } // a soft shade on the cloud below
    if (s === 2) blit(g, S('vent'), x, y);
  }
};
// makes the cloud at tile i wobble now (bosses and foes use it too); host / solo
function puffAt(room, i) {
  if (room.tiles[i] !== T_FLOOR || (room.stone && room.stone[i])) return false;
  const P = room.puff || (room.puff = new Map());
  P.set(i, { s: 1, t: 0, l: 0, k: 0 });
  setTile(room, i % COLS, (i / COLS) | 0, T_PUFF);
  return true;
}
// not while a boss's name card holds everyone still
const puffLive = room => !room.cleared && !G.tut && !G.first && !G.cine && !!skyStone(room);
LAND_MECH.cloud = {
  // host / solo: lingering heroes weigh clouds down; wobbling clouds puff, holes fill back in
  update(dt, room) {
    if (room.type === 'slide') { slideUpdate(room); return; }
    const P = room.puff || (room.puff = new Map());
    // now and then a Balloon Bandit drifts in while the fight is on (never into an empty purse)
    if (room.bandit === undefined) room.bandit = room.type === 'normal' && !room.cleared && !G.first && grand() < 0.25 ? grnd(3, 6) : 0;
    if (room.bandit > 0 && G.enemies.length && G.coins >= 5 && (room.bandit -= dt) <= 0) {
      room.bandit = 0;
      const e = spawnEnemy('bandit', grand() < 0.5 ? 40 : VW - 40, OY + 44);
      e.elite = true;
      toast('A BALLOON BANDIT! MIND YOUR COINS!');
    }
    if (!puffLive(room)) {
      if (P.size) { for (const [i, q] of P) if (q.s) setTile(room, i % COLS, (i / COLS) | 0, T_FLOOR); P.clear(); }
      return;
    }
    for (const p of G.players) {
      if (!alive(p) || p.hopT > 0 || (p.leapZ || 0) > 1) continue;
      const i = cellAt(p.x, p.y);
      if (room.tiles[i] !== T_FLOOR || room.stone[i]) continue;
      let q = P.get(i);
      if (!q) P.set(i, q = { s: 0, t: 0, l: 0, k: 0 });
      q.k = Math.max(q.k, p.fboots ? 0.5 : 1);
    }
    for (const [i, q] of P) {
      const c = i % COLS, r = (i / COLS) | 0;
      if (q.s === 0) {
        q.l += q.k ? dt * q.k : -dt;
        q.k = 0;
        if (q.l <= 0) P.delete(i);
        else if (q.l >= PUFF_LOAD) {
          q.s = 1; q.t = 0;
          setTile(room, c, r, T_PUFF);
          Audio_.sfx('bubble');
          if (!Save.flags.puffTip) { Save.flags.puffTip = true; Save.write(); toast('WOBBLY CLOUD! KEEP MOVING'); }
        }
      } else if (q.s === 1 && (q.t += dt) >= PUFF_WOB) {
        q.s = 2; q.t = 0;
        setTile(room, c, r, T_PIT);
        burst(c * 16 + 8, OY + r * 16 + 8, 10, CLOUD_BURST, 70, 0.45, { g: -20 });
        Audio_.sfx('pop');
        for (const e of G.enemies) if (!e.dead && !e.fly && !e.boss && !EDEF[e.type].warden && cellAt(e.x, e.y) === i) killEnemy(e);
        for (const k of room.pickups) if (cellAt(k.x, k.y) === i) nudgeOut(room, k, 'enemy');
      } else if (q.s === 2 && (q.t += dt) >= HOLE_T) {
        setTile(room, c, r, T_FLOOR);
        P.delete(i);
      }
    }
  },
  leave(room) {
    const P = room.puff;
    if (!P) return;
    for (const [i, q] of P) if (q.s) { room.tiles[i] = T_FLOOR; room.pits = room.pits.filter(o => o[0] !== (i % COLS) * 16 || o[1] !== OY + ((i / COLS) | 0) * 16); }
    P.clear(); room.dirty = true;
  },
  // every screen, for the heroes it controls: updraft hops and drops through the sky
  every(dt, room) {
    if (room.type === 'slide') { slideEvery(dt, room); return; }
    const st = skyStone(room);
    for (const p of G.players) {
      if (NET.role === 'client' ? p !== G.player : p.remote) continue;
      p.hopCd = Math.max(0, (p.hopCd || 0) - dt);
      if (!alive(p) || p.hopT > 0) continue;
      const i = cellAt(p.x, p.y);
      if (st && st[i] === 2 && p.moving && !p.hopCd && p.dashT <= 0) {
        p.hopT = HOP_T; p.hopHang = 0; p.hopCd = HOP_T + 0.35; p.hopVx = p.dx * HOP_V; p.hopVy = p.dy * HOP_V; // the cooldown: landing on a vent does not bounce straight on
        burst(p.x, p.y - 2, 8, CLOUD_BURST, 50, 0.4, { g: -40 });
        Audio_.sfx('swish');
        if (p === G.player && !Save.flags.hopTip) { Save.flags.hopTip = true; Save.write(); toast('UPDRAFT! IT HOPS YOU OVER THE SKY'); }
        continue;
      }
      if (heroMoveMode(p) !== 'player' || !boxSolid(room, p.x, p.y, p.hw, p.hh, 'player')) continue;
      // standing in a hole (or on its edge): back to the nearest cloud, and a hole means a fall
      const fell = room.tiles[i] === T_PIT;
      if (fell) { poof(p.x, p.y - 6); burst(p.x, p.y - 4, 10, CLOUD_BURST, 60, 0.4, { g: -30 }); Audio_.sfx('wave'); }
      nudgeOut(room, p, 'player');
      if (!fell || p.inv > 0 || assistOn()) continue;
      if (NET.role !== 'client') hurtPlayer(p, 1, 'sky');
      else if (performance.now() >= (NET.safeUntil || 0)) { sendR(NET.host, { t: 'hit', b: 0 }); p.inv = 1.1; NET.safeUntil = performance.now() + 1100; }
    }
    // updrafts: little wisps rising off each vent
    if (st && Math.random() < 0.5) for (let i = 0; i < st.length; i++) {
      if (st[i] !== 2 || Math.random() > 0.3) continue;
      part((i % COLS) * 16 + rnd(4, 12), OY + ((i / COLS) | 0) * 16 + 7, rnd(-4, 4), -rnd(25, 45), rnd(0.4, 0.7), Math.random() < 0.6 ? 'w' : 'C', { drag: 0.97 });
    }
    // the gust, on the Meadow's clock: streaks of wind instead of petals
    const w = meadowGust(room);
    if (!w) return;
    if (Math.abs(w) > 1) G.wind += w;
    if (Math.random() < (Math.abs(w) > 1 ? 0.7 : 0.25)) {
      const x = w > 0 ? -4 : VW + 4, y = rnd(OY + 20, OY + 200), v = Math.sign(w) * rnd(90, 130);
      for (let j = 0; j < 3; j++) part(x - Math.sign(w) * j * 2, y, v, 0, rnd(2.5, 3.5), j ? 'C' : 'w', { drag: 1 });
    }
  },
  // on the floor: a wobbling cloud thins until the sky shows through; a hole grows back in
  drawLayer(ox, oy, room, layer) {
    if (room.type === 'slide') slideDraw(ox, oy, room, layer);
    if (layer || !room.tAt) return;
    for (const [i, at] of room.tAt) {
      const t = room.tiles[i], u = G.time - at, c = i % COLS, r = (i / COLS) | 0;
      const x = ox + c * 16, y = oy + OY + r * 16;
      if (t === T_PUFF) {
        const lvl = Math.min(12, 2 + Math.floor(u / PUFF_WOB * 12));
        const j = u > PUFF_WOB * 0.6 && Math.floor(G.time * 20) % 2 ? 1 : 0; // a late shiver
        { const [k, v] = skyOf(room, c, r); ctx.drawImage(dithered(k, v, lvl), x + j, y); }
      } else if (t === T_PIT && u > HOLE_T - 0.6 && u < HOLE_T + 1) {
        const [k, v] = cloudOf(room, c, r);
        ctx.drawImage(dithered(k, v, Math.min(15, Math.floor((u - HOLE_T + 0.6) / 0.6 * 16))), x, y);
      }
    }
  },
};

// ---------- Cloud Steps items ----------
// Found only on the Cloud Steps (itemPool reads `land`).
Object.assign(ITEMS, {
  fboots: { name: 'FEATHER BOOTS', desc: 'CLOUDS HOLD YOU TWICE AS LONG', land: 'cloud', unique: true, apply: p => { p.fboots = true; } },
  umbrella: { name: 'UMBRELLA', desc: 'BLOCKS THE FIRST BULLET IN EVERY ROOM', land: 'cloud', unique: true, apply: p => { p.umbrella = true; p.umbOpen = true; } },
  thunder: { name: 'THUNDER CHARM', desc: 'A KILL CALLS LIGHTNING ON A FOE', land: 'cloud', rare: 1, unique: true, apply: p => { p.thunder = true; } },
});
// the small open umbrella over its holder's head
def('umb_open', autoOutline(parseArt('umb_open', `
  .....y.....
  ...qwqPP...
  .qqwqqPPPp.
  qqqqqqqPPpp
  .....n.....
  .....n.....
  ....n......`)));

function umbrellaFx(p) {
  burst(p.x, p.y - 22, 10, ['q', 'P', 'w'], 70, 0.4);
  Audio_.sfx('pop');
}
// The umbrella takes a bullet instead of its hero (once per room). A remote hero's hits are
// judged on their own screen, so the host only folds it for a reported hit.
function umbrellaBlock(p) {
  if (!p.umbOpen || NET.role === 'host' && p.remote && !NET.netHit) return false;
  p.umbOpen = false; p.inv = Math.max(p.inv, 0.5);
  umbrellaFx(p);
  return true;
}

// THUNDER CHARM: a kill marks the nearest other foe, and lightning strikes it 0.45 s later.
// A thunder kill does not call more thunder.
let THUNDER_NOW = false;
function thunderCall(dead, own) {
  if (THUNDER_NOW) return;
  let tgt = null, bd = 1e9;
  for (const e of G.enemies) {
    if (e === dead || e.hp <= 0 || e.dead) continue;
    const d = Math.hypot(e.x - dead.x, e.y - dead.y);
    if (d < bd) { bd = d; tgt = e; }
  }
  if (tgt) G.markers.push({ kind: 'hbolt', x: tgt.x, y: tgt.y, t: 0.45, max: 0.45, tgt, own });
}
function thunderTick(k) {
  const e = k.tgt;
  if (!e) return; // a client's copy only blinks
  if (e.hp > 0 && !e.dead) { k.x = e.x; k.y = e.y; }
  if (k.t > 0) return;
  if (e.hp > 0 && !e.dead) {
    THUNDER_NOW = true;
    hurtEnemy(e, Math.max(3, k.own.dmg * 2), e.x, e.y - 6, true, k.own);
    THUNDER_NOW = false;
  }
  G.markers.push({ kind: 'hzap', x: k.x, y: k.y, t: 0.14, max: 0.14 });
  Audio_.sfx('zap');
}

// ---------- Cloud Steps: the Rainbow Slide ----------
// A special room (type 'slide'): touch the arch and a rainbow carries the team east. Heroes
// only steer up and down; coins and star bits rush past and a chest rides in at the end.
// The ride runs on the host clock (skyNow), so every screen draws the same thing.
const SLIDE_LAYOUT = [
  '~~~~~~~~~~..~~~~~~~~~~',
  '~~~~~~~~~~..~~~~~~~~~~',
  '~~~~~~~~~~..~~~~~~~~~~',
  '......................',
  '......................',
  '......................',
  '......................',
  '~~~~~~~~~~..~~~~~~~~~~',
  '~~~~~~~~~~..~~~~~~~~~~',
  '~~~~~~~~~~..~~~~~~~~~~',
];
const SLIDE_Y0 = OY + 80, SLIDE_Y1 = OY + 144, SLIDE_MID = (SLIDE_Y0 + SLIDE_Y1) >> 1;
const RIDE_X = 88, SLIDE_V = 130, SLIDE_N = 30, SLIDE_GAP = 0.36, SLIDE_WAIT = 0.8;
const CHEST_X = RIDE_X + 48, CHEST_T = SLIDE_WAIT + SLIDE_N * SLIDE_GAP + 0.6;
const SLIDE_END = CHEST_T + (VW + 16 - CHEST_X) / SLIDE_V + 0.3;
const RIB = [['r', 'R'], ['o', 'O'], ['y', 'Y'], ['G', 'h'], ['c', 'C'], ['B', 'c'], ['2', '3']]; // stripe, its lit top row
LA('slide_arch', `
  ....rrrrrrrrr....
  ..rrRRRRRRRRRrr..
  .rRRoooooooooRRr.
  .rRooyyyyyyyyooRr
  rRooyGGGGGGGGyooR
  rRoyGGhhhhhhGGyoR
  rRoyGh......hGyoR
  rRoyGh......hGyoR
  rRoyGh......hGyoR
  rRoyGh......hGyoR
  wwwwww......wwwww
  CwwwwC......Cwwww`);
def('mm_slide', '.000.\n0rrr0\n0y0y0\n0c0c0\n00.00');

// item i: when it sets off, its height and kind; runs of six share a pattern
function slideItem(room, i) {
  const h = hash(Math.floor(i / 6), 7, room.seed), pat = h % 3;
  let y = pat === 0 ? SLIDE_MID + Math.sin(i * 0.9 + (h >> 4)) * 20 : pat === 1 ? SLIDE_MID + ((h >> 4) % 3 - 1) * 18 : SLIDE_MID + (i % 2 * 2 - 1) * 16;
  const star = i % 6 === 5 && (h >> 8) % 2 === 0;
  if (star) y = 2 * SLIDE_MID - y; // on the far side: a choice
  return [SLIDE_WAIT + i * SLIDE_GAP, Math.round(y), star];
}
const slideX = t0 => VW + 8 - t0 * SLIDE_V;
const slideOf = room => room.type === 'slide' ? room.props.find(o => o.kind === 'slide') : null;
const slideSig = o => { o.sig = o.at + o.got + (o.done ? '!' : ''); };
function slideStock(room) { const o = { kind: 'slide', x: 40, y: SLIDE_Y0 + 11, t: 0, at: 0, got: '0'.repeat(SLIDE_N), done: false }; slideSig(o); room.props.push(o); }
// host / solo: the arch was touched
function slideStart(o, p) {
  if (o.at) { say(p, o.done ? 'WHAT A RIDE!' : 'WHEEE!'); return; }
  o.at = skyNow() + SLIDE_WAIT; slideSig(o);
  G.players.forEach((q, i) => { if (!q.dead) { q.x = RIDE_X; q.y = SLIDE_MID + (i - (G.players.length - 1) / 2) * 12; q.dashT = 0; q.face = 's'; q.flip = false; q.tpN++; } });
  toast('STEER UP AND DOWN!');
  Audio_.sfx('swish');
}
// host / solo: pick up what the heroes touch, and land the chest
function slideUpdate(room) {
  const o = slideOf(room);
  if (!o || !o.at || o.done) return;
  const u = skyNow() - o.at;
  for (let i = 0; i < SLIDE_N; i++) {
    if (o.got[i] === '1') continue;
    const [t0, y, star] = slideItem(room, i), x = slideX(u - t0);
    if (x > RIDE_X + 12 || x < RIDE_X - 12) continue;
    const p = G.players.find(q => alive(q) && Math.abs(q.x - x) < 10 && Math.abs(q.y - 3 - y) < 11);
    if (!p) continue;
    o.got = o.got.slice(0, i) + '1' + o.got.slice(i + 1); slideSig(o);
    if (star) { addCharge(p, 0.34); Audio_.sfx('graze'); } else { gainCoins(1); Audio_.sfx('coin'); }
    burst(x, y - 5, 6, star ? ['Y', 'y', 'w'] : ['y', 'O', 'w'], 60, 0.35, { g: -30 });
  }
  if (u < SLIDE_END) return;
  o.done = true; slideSig(o);
  room.props.push({ kind: 'chest', x: CHEST_X, y: SLIDE_MID + 8, t: 0, open: false });
  dust(CHEST_X, SLIDE_MID + 8, 6, 10);
  Audio_.sfx('land');
}
// every screen, for its own heroes: held on the ribbon while it runs; speed lines
function slideEvery(dt, room) {
  const o = slideOf(room);
  if (!o || !o.at || o.done) return;
  const u = skyNow() - o.at;
  if (u > SLIDE_END) return;
  for (const p of G.players) {
    if ((NET.role === 'client' ? p !== G.player : p.remote) || !alive(p)) continue;
    p.x = RIDE_X; p.y = Math.max(SLIDE_Y0 + 10, Math.min(SLIDE_Y1 - 3, p.y)); p.face = 's'; p.flip = false;
    if (u > 0 && Math.random() < 0.3) part(p.x - 6, p.y - rnd(0, 4), -rnd(60, 90), rnd(-8, 8), 0.4, RIB[Math.floor(Math.random() * 7)][1], { drag: 0.98 });
  }
  if (u > 0 && u < CHEST_T + 1 && Math.random() < 0.7) part(VW - 16, rnd(SLIDE_Y0 + 4, SLIDE_Y1 - 4), -rnd(260, 320), 0, 1.4, 'w', { drag: 1 });
}
// layer 0: the ribbon, its dashes running at the ride's speed; layer 1: coins, star bits, the chest
function slideDraw(ox, oy, room, layer) {
  const o = slideOf(room);
  if (!o) return;
  const u = o.at ? skyNow() - o.at : -1, run = u > 0 && u < SLIDE_END;
  if (layer === 0) {
    const s = G.time * 12 + (o.at ? Math.max(0, Math.min(u, SLIDE_END)) * SLIDE_V : 0);
    rect(ox + 16, oy + SLIDE_Y0 - 1, VW - 32, 1, '0');
    RIB.forEach(([c, l], k) => {
      const y = oy + SLIDE_Y0 + k * 9;
      rect(ox + 16, y, VW - 32, 9, c);
      rect(ox + 16, y, VW - 32, 1, l);
      for (let x = 16 + (((k * 11 - s) % 32) + 32) % 32; x < VW - 22; x += 32) rect(ox + x, y + 4, run ? 8 : 4, 1, l);
    });
    rect(ox + 16, oy + SLIDE_Y1 - 1, VW - 32, 1, '0');
    return;
  }
  if (layer !== 1 || !o.at || o.done) return;
  const f = Math.floor(G.time * 8) % 4;
  for (let i = 0; i < SLIDE_N; i++) {
    if (o.got[i] === '1') continue;
    const [t0, y, star] = slideItem(room, i), x = Math.round(slideX(u - t0));
    if (x < -8 || x > VW + 8) continue;
    const sp = S(star ? 'starbit' : COIN_FR[f]);
    drawS(sp, ox + x - (sp.w >> 1), oy + y - sp.h, !star && f === 3 ? 1 : 0);
  }
  if (u > CHEST_T) { const x = Math.max(CHEST_X, VW + 16 - (u - CHEST_T) * SLIDE_V); shadow(ox + x, oy + SLIDE_MID + 8, 12); drawFeet(S('chest_0'), ox + x, oy + SLIDE_MID + 9); }
}
