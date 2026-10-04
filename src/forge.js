'use strict';
// ---------- The Ember Forge (Heat Beat) ----------
// The furnace keeps time at 140 bpm (LANDS bpm, G.beat on the host's clock). Every fight room's
// floor is engraved with runes in one of four line patterns (columns, rows or either diagonal,
// from the room's seed), every other line, three groups taking turns. Every 8 beats one group
// erupts: its runes glow for three beats first (blinking for the last two), then burst into flame
// for most of a beat. Three lamps on the wall pipe show which group is next. Cooling water (layout
// 'w') and belts never erupt, nor the floor by the doors. Everything is worked out from G.beat and
// the room's seed, so every screen agrees and judges its own hero (LAND_MECH.hurts, net.js).
// Oil barrels (the land's breakables) blow up a moment after they break: a 3x3 blast that hurts
// heroes and foes, sets off the barrels next to it, and leaves a burning tile. Belts carry
// walkers toward the lava, and in Anvil Row a crane drops anvils on a shadow ring.
const HEAT_CYC = 8, HEAT_HOT = 0.85, FG_TRAIL = [];
const FG_GLYPH = [
  ['..###..', '.#...#.', '#.....#', '#..#..#', '#.....#', '.#...#.', '..###..'],
  ['...#...', '..#.#..', '.#...#.', '#..#..#', '.#...#.', '..#.#..', '...#...'],
  ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'],
];
const FG_LAMP = [
  ['.###.', '#...#', '#...#', '#...#', '.###.'],
  ['..#..', '.#.#.', '#...#', '.#.#.', '..#..'],
  ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
];

// ---------- Tile art ----------
(function forgeTiles() {
  // an anvil of cool teal steel on a stump
  SN_('rock_forge', `
    ..CCCCCCCCCCC.
    TTTTTTTTTTTTTT
    .tTTTTTTTTTTtt
    ...ttTTTTTtt..
    .....tTTTt....
    .....tTTTt....
    ....ttTTTtt...
    ...tttttttttt.
    ..NNNNNNNNNNn.
    ..unnnnnnnnnn.
    ..unnNnnnnNnn.
    ..unnnnnnnnnn.
    ..uuuuuuuuuuu.`);
  // an oil barrel: red staves, yellow hoops and a flame on the front
  SN_('brk_forge', `
    ...nNNNNNNn...
    ..rRRRRRRRRr..
    ..yYYYYYYYYo..
    ..rRRRyRRRrp..
    ..rRRyYyRRrp..
    ..rRRyYyRRrp..
    ..rRRRyRRRrp..
    ..yYYYYYYYYo..
    ..rRRRRRRRrp..
    ...pppppppp...`);
  // cooled slag: a dark lump with a last glowing crack
  def('slagrock', stamp(sculpt(16, 16, [{ e: [8, 10, 6.5, 5], ramp: 'xX1V' }, { e: [6, 7.5, 3.5, 2.5], ramp: 'xX1V' }]), 5, 9, 'o...\n.oo.\n...o'));
  // what falls: an anvil from the crane, a coal from a Tong Bat
  SN_('anvil_f', `
    ..CCCCCCCCCCC.
    TTTTTTTTTTTTTT
    .tTTTTTTTTTTtt
    ...ttTTTTTtt..
    .....tTTTt....
    ....ttTTTtt...
    ...tttttttttt.`);
  SN_('coal', `
    .xXX..
    xXXxX.
    XxoxxX
    xxoxx.
    .xxx..`);
})();
// cooled slag stands where no rock was at the start (room.rk0)
const _fgRock = rockArt;
rockArt = function (room, c, r, theme) { return theme === 'forge' && room.rk0 && !room.rk0.has(r * COLS + c) ? 'slagrock' : _fgRock(room, c, r, theme); };

// runes engraved in the floor, cooling water, belts
THEMES.forge.paint = function (g, room) {
  const f = (x, y, w, h, k) => { g.fillStyle = PAL[k]; g.fillRect(x, y, w, h); };
  for (let i = 0; i < room.tiles.length; i++) {
    const x = (i % COLS) * 16, y = OY + ((i / COLS) | 0) * 16;
    if (room.cool && room.cool.has(i)) {
      f(x, y, 16, 16, 'b'); f(x, y, 16, 1, '0'); f(x, y + 1, 16, 1, 't');
      const h = hash(i, 9, room.seed);
      f(x + 2 + h % 6, y + 5 + (h >> 3) % 3, 4, 1, 'B'); f(x + 7 + (h >> 5) % 5, y + 11, 3, 1, 'B');
      continue;
    }
    const d = room.belt && room.belt[i];
    if (d) {
      f(x, y, 16, 16, 'x');
      if (d % 2) { f(x, y, 16, 1, '0'); f(x, y + 1, 16, 1, 'X'); f(x, y + 14, 16, 1, 'X'); f(x, y + 15, 16, 1, '0'); }
      else { f(x, y, 1, 16, '0'); f(x + 1, y, 1, 16, 'X'); f(x + 14, y, 1, 16, 'X'); f(x + 15, y, 1, 16, '0'); }
      continue;
    }
    const k = room.rune ? room.rune[i] : -1;
    if (k < 0) continue;
    // carved: a dark groove with a lit lower edge
    const G7 = FG_GLYPH[k];
    for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) if (G7[yy][xx] === '#') {
      f(x + 4 + xx, y + 4 + yy, 1, 1, '1');
      if (!(G7[yy + 1] && G7[yy + 1][xx] === '#')) f(x + 4 + xx, y + 5 + yy, 1, 1, 'p');
    }
  }
};

// ---------- Rooms ----------
LAND_LAYOUTS.forge = {
  // Anvil Row: two rows of anvils make a lane, and the crane drops more
  anvil: `......................
    ..e.......ee.......e..
    ......................
    ..#..#..#....#..#..#..
    ......................
    ......................
    ..#..#..#....#..#..#..
    ......................
    ..e.......ee.......e..
    ......................`,
  // Conveyor Foundry: belts toward the lava
  foundry: `......................
    ..e................e..
    ..>>>>>>~~..~~<<<<<<..
    ......................
    ..e.......ee.......e..
    ......................
    ......................
    ..>>>>>>~~..~~<<<<<<..
    ..e................e..
    ......................`,
  // Barrel Room: barrels close enough to go up together
  barrels: `......................
    ..e.......ee.......e..
    ....bb..........bb....
    ....b....b..b....b....
    ......................
    ......................
    ....b....b..b....b....
    ....bb..........bb....
    ..e.......ee.......e..
    ......................`,
  // Chimney Climb: a narrow shaft between the lava, crossed by one hall
  chimney: `~~~~~~..........~~~~~~
    ~~~~~~..e....e..~~~~~~
    ~~~~~~..#....#..~~~~~~
    ......................
    ..e...b........b...e..
    ......................
    ~~~~~~..#....#..~~~~~~
    ~~~~~~..........~~~~~~
    ~~~~~~..e....e..~~~~~~
    ~~~~~~..........~~~~~~`,
  // Cooling Pool: a ring of water where the floor never erupts
  cooling: `......................
    ..e................e..
    ......wwwwwwwwww......
    ......wwwwwwwwww......
    ..e...ww......ww...e..
    ......ww......ww......
    ......wwwwwwwwww......
    ......wwwwwwwwww......
    ..e.......ee.......e..
    ......................`,
  // Kiln Cross: a plus, lava in the corners
  kiln: `~~~~~~..........~~~~~~
    ~~~~~~..e....e..~~~~~~
    ~~~~~~..........~~~~~~
    ......................
    ..e.......##.......e..
    ..........##..........
    ......................
    ~~~~~~..........~~~~~~
    ~~~~~~..e....e..~~~~~~
    ~~~~~~..........~~~~~~`,
};
for (const k in LAND_LAYOUTS.forge) LAND_LAYOUTS.forge[k] = LAND_LAYOUTS.forge[k].split('\n').map(r => r.trim());
Object.assign(LAY_RULE, {
  anvil: { pool: [['agolem', 2], ['fimp', 2]] },
  foundry: { pool: [['hound', 2], ['fimp', 2], ['tongbat', 1]] },
  barrels: { pool: [['fimp', 3], ['slag', 2]] },
  chimney: { pool: [['tongbat', 3], ['fimp', 2]] },
  cooling: { pool: [['slag', 3], ['hound', 1]] },
  kiln: { pool: [['agolem', 1], ['hound', 2], ['slag', 1]] },
});

// ---------- The Heat Beat ----------
// cycle k erupts group k % 3 on its beats [8k, 8k + 1); assist rests every other cycle
const heatCyc = () => Math.floor(G.beat / HEAT_CYC);
const heatOn = (k) => !(assistOn() && k % 2);
// the room's runes are live while foes fight (from the first cycle whose tell was shown in full)
function heatLive(room) {
  if (!room.rune || room.cleared || !G.beat || !G.enemies.some(e => !e.dead && !e.passive)) { if (room) room.heat0 = undefined; return false; }
  if (room.heat0 === undefined) room.heat0 = G.beat;
  return true;
}
const heatOk = (room, k) => k * HEAT_CYC - 3 >= room.heat0 && heatOn(k);
const heroCell = (p) => Math.floor((p.y - 1 - OY) / 16) * COLS + Math.floor(p.x / 16);
// is this hero standing in fire right now (the runes, or the Dragonling's hot floor)?
function forgeHurts(room, p) {
  if (!alive(p) || p.dashT > 0) return false;
  const i = heroCell(p), b = G.boss;
  if (b && !b.dead && b.hot && b.hot[0] <= 0 && dragonHot(b, i)) return true;
  if (!room.rune || room.rune[i] < 0 || !heatLive(room)) return false;
  const k = heatCyc(), ph = G.beat - k * HEAT_CYC;
  return ph < HEAT_HOT && heatOk(room, k) && room.rune[i] === k % 3;
}

// ---------- Barrels ----------
// Host / solo: a broken barrel fizzes (a ring), then blows up its 3x3 block.
let fgChain = false;
const _fgBrk = breakTile;
breakTile = function (room, c, r) {
  _fgBrk(room, c, r);
  if (!G.floor || G.floor.land.id !== 'forge' || NET.role === 'client') return;
  const t = fgChain ? 0.45 : 0.6;
  (room.fuse || (room.fuse = [])).push({ c, r, t });
  G.markers.push({ kind: 'zone', x: c * 16 + 8, y: OY + r * 16 + 10, t, max: t, r: 24 });
  Audio_.sfx('heat');
};
function barrelBlast(room, c, r) {
  const x0 = c * 16 + 8, y0 = OY + r * 16 + 8;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const cc = c + dc, rr = r + dr, t = tileAt(room, cc, rr);
    if (t === T_BRK) { fgChain = true; breakTile(room, cc, rr); fgChain = false; continue; }
    if (t === T_WALL || t === T_DOOR || t === T_ROCK || t === T_PIT) continue;
    G.markers.push({ kind: 'zap', c: 'blast', x: cc * 16 + 8, y: OY + rr * 16 + 8, t: 0.3, max: 0.3, src: 'barrel' });
  }
  for (const e of G.enemies) if (!e.dead && Math.abs(e.x - x0) < 26 && Math.abs(e.y - 2 - y0) < 26) hurtEnemy(e, 8, x0, y0, true, null);
  G.markers.push({ kind: 'zap', c: 'fire', x: x0, y: y0, t: 3, max: 3, src: 'barrel' });
  burst(x0, y0 - 4, 18, ['y', 'O', 'o', 'r'], 140, 0.5, { g: 60 });
  G.shake = Math.max(G.shake, 3);
  Audio_.sfx('boom');
}
// the blast: a white-hot puff in each tile, shrinking fast
const _fgZap = drawZap;
drawZap = function (k, ox, oy) {
  if (k.c !== 'blast') { _fgZap(k, ox, oy); return; }
  const x = Math.round(ox + k.x), y = Math.round(oy + k.y), s = Math.max(2, Math.round(8 * k.t / k.max));
  rect(x - s, y - s + 2, s * 2, s * 2 - 4, 'o'); rect(x - s + 2, y - s, s * 2 - 4, s * 2, 'o');
  if (s > 3) { rect(x - s + 2, y - s + 3, s * 2 - 4, s * 2 - 6, 'y'); rect(x - 2, y - 2, 4, 4, k.t > k.max * 0.6 ? 'w' : 'Y'); }
};

LAND_MECH.forge = {
  noMetro: true, // the wall pipe's lamps keep the time here
  // runes from the room's seed, cooling water and belts from the layout, the rocks it starts with
  build(room) {
    room.rk0 = new Set();
    for (let i = 0; i < room.tiles.length; i++) if (room.tiles[i] === T_ROCK) room.rk0.add(i);
    if (room.type === 'warden' || room.type === 'boss') return;
    const L = room.lay && LAND_LAYOUTS.forge[room.lay];
    if (L) {
      beltsBuild(room, LAND_LAYOUTS.forge);
      const [fx, fy] = room.flip || [false, false];
      for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) if (L[fy ? 9 - y : y][fx ? 21 - x : x] === 'w') (room.cool || (room.cool = new Set())).add((y + 2) * COLS + x + 1);
    }
    if (room.type !== 'normal') return;
    const fam = hash(room.seed, 7, 61) % 4, rune = room.rune = new Int8Array(COLS * ROWS).fill(-1);
    for (let r = 2; r <= 11; r++) for (let c = 1; c <= 22; c++) {
      const i = r * COLS + c;
      if (room.tiles[i] !== T_FLOOR || (room.cool && room.cool.has(i)) || (room.belt && room.belt[i])) continue;
      if ((r <= 3 || r >= 10) && c >= 10 && c <= 13 || (c <= 2 || c >= 21) && r >= 5 && r <= 8) continue; // by the doors
      const key = [c, r, c + r, c - r + 30][fam];
      if (key % 2) continue;
      rune[i] = (key >> 1) % 3;
    }
  },
  ground: true, // belts carry walkers, not shots
  drift: beltDrift,
  hurts: forgeHurts,
  // host / solo: the runes burn local heroes, barrels go off, the crane drops anvils, a Bellows Bug now and then
  update(dt, room) {
    for (const p of G.players) if (!p.remote && forgeHurts(room, p)) hurtPlayer(p, 1, G.boss && !G.boss.dead ? 'dragon' : 'heat');
    if (room.fuse && room.fuse.length) {
      for (const f of room.fuse) f.t -= dt;
      const go = room.fuse.filter(f => f.t <= 0);
      room.fuse = room.fuse.filter(f => f.t > 0);
      for (const f of go) barrelBlast(room, f.c, f.r);
    }
    slagCool(room, dt);
    if (room.flood && (!G.boss || G.boss.dead)) dragonRecede(room); // the lava sinks when the Dragonling falls
    if (room.type !== 'normal' || room.cleared || !G.enemies.some(e => !e.dead && !e.passive)) return;
    if (room.lay === 'anvil' || room.lay === 'chimney') {
      if ((room.anv = (room.anv === undefined ? 2.5 : room.anv) - dt) <= 0) {
        room.anv = assistOn() ? 4.2 : 3;
        const hs = G.players.filter(alive);
        if (hs.length) { const q = gpick(hs); G.markers.push({ x: q.x, y: q.y, t: 1.1, max: 1.1, src: 'anvil', fall: 'anvil_f', n: 0, r: 12 }); Audio_.sfx('charge'); }
      }
    }
    if (room.bb === undefined) room.bb = !G.first && grand() < 0.2 ? grnd(5, 9) : 0;
    if (room.bb > 0 && (room.bb -= dt) <= 0) {
      room.bb = 0;
      spawnEnemy('bellows', grand() < 0.5 ? 56 : VW - 56, OY + 60 + grand() * 100, { elite: true });
      toast('A BELLOWS BUG FANS THE FLAMES!');
    }
  },
  drawLayer(ox, oy, room, layer) {
    if (layer !== 0) return;
    beltsDraw(ox, oy, room, 'O');
    const b = G.boss;
    if (b && !b.dead && b.hot) dragonHotDraw(ox, oy, b);
    if (!room.rune || !heatLive(room)) return;
    const k = heatCyc(), ph = G.beat - k * HEAT_CYC, nk = k + 1;
    const erupt = ph < 1.2 && heatOk(room, k), tell = ph >= 5 && heatOk(room, nk);
    const blink = Math.floor(G.time * 10) % 2;
    for (let i = 0; i < room.rune.length; i++) {
      const g = room.rune[i];
      if (g < 0) continue;
      const x = ox + (i % COLS) * 16, y = oy + OY + ((i / COLS) | 0) * 16;
      if (erupt && g === k % 3) {
        rect(x + 1, y + 1, 14, 14, 'o'); rect(x + 2, y + 2, 12, 12, ph < HEAT_HOT ? 'O' : 'n');
        runeGlyph(x, y, g, 'y');
        if (ph < HEAT_HOT) { const s = S('flame_' + (Math.floor(G.time * 8 + i) % 2)); drawS(s, x + 8 - (s.w >> 1), y + 14 - s.h); }
      } else if (tell && g === nk % 3) {
        if (ph >= 7) { rect(x + 1, y + 1, 14, 1, 'o'); rect(x + 1, y + 14, 14, 1, 'o'); rect(x + 1, y + 2, 1, 12, 'o'); rect(x + 14, y + 2, 1, 12, 'o'); }
        runeGlyph(x, y, g, ph < 6 ? 'o' : blink ? 'y' : 'O');
      }
    }
    // the wall pipe: a lamp per group, the next one lit (blinking through its tell)
    const next = ph >= 1.2 || !heatOk(room, k) ? nk : k, lit = heatOk(room, next);
    for (const px of [40, 270]) {
      rect(ox + px, oy + OY + 22, 74, 5, '0'); rect(ox + px + 1, oy + OY + 23, 72, 1, 'T'); rect(ox + px + 1, oy + OY + 24, 72, 2, 't');
      for (let g = 0; g < 3; g++) {
        const lx = ox + px + 10 + g * 24, ly = oy + OY + 18, on = lit && g === next % 3;
        rect(lx - 1, ly - 1, 9, 9, '0'); rect(lx, ly, 7, 7, on ? (ph >= 6 && blink ? 'y' : 'o') : 'x');
        const L = FG_LAMP[g];
        for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) if (L[yy][xx] === '#') rect(lx + 1 + xx, ly + 1 + yy, 1, 1, on ? 'Y' : 'X');
      }
    }
  },
};
function runeGlyph(x, y, g, key) {
  const G7 = FG_GLYPH[g];
  for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) if (G7[yy][xx] === '#') rect(x + 4 + xx, y + 4 + yy, 1, 1, key);
}

// ---------- The forge's items ----------
Object.assign(ITEMS, {
  mitts: { name: 'OVEN MITTS', desc: 'BARREL BLASTS DO NOT HURT YOU', land: 'forge', unique: true, apply: p => { p.mitts = true; } },
  hotcoal: { name: 'HOT COAL', desc: 'YOUR SHOTS LEAVE A SHORT BURN TRAIL', land: 'forge', unique: true, apply: p => { p.hotcoal = true; } },
  tongs: { name: 'TONGS', desc: 'PICKUPS FLY TO YOU FROM FAR AWAY', land: 'forge', unique: true, apply: p => { p.tongs = true; } },
});
// HOT COAL: a shot drops embers as it flies; a foe that walks into one starts to burn
const _fgShotMove = itemShotMove;
itemShotMove = function (s, dt) {
  _fgShotMove(s, dt);
  const p = s.own;
  if (!p || !p.hotcoal || s.mini || s.life <= 0) return;
  if ((s.hc = (s.hc || 0) + dt) < 0.05) return;
  s.hc = 0;
  if (FG_TRAIL.length > 80) FG_TRAIL.shift();
  FG_TRAIL.push([s.x, s.y + 4, G.time + 0.6]);
  part(s.x + rnd(-1, 1), s.y + 3, rnd(-6, 6), rnd(-14, -6), 0.5, Math.random() < 0.5 ? 'o' : 'y', { drag: 0.95 });
};
const _fgStatus = enemyStatus;
enemyStatus = function (e, dt) {
  if (FG_TRAIL.length && !(e.burnT > 0.5) && (e.z || 0) < 8) {
    while (FG_TRAIL.length && FG_TRAIL[0][2] < G.time) FG_TRAIL.shift();
    if (FG_TRAIL.some(([x, y]) => Math.abs(x - e.x) < e.hw + 3 && Math.abs(y - e.y) < e.hh + 4)) e.burnT = 1.5;
  }
  return _fgStatus(e, dt);
};

// ---------- Foe art ----------
(function forgeArt() {
  const o = { flip: true, flash: true, glow: true };
  SN_('fimp_0', `
    ..y.....y..
    ..yR...Ry..
    ...RRRRR...
    ..RRRRRRR..
    .ORw0RRw0O.
    OoRRRRRRRoO
    o.rRyyyRr.o
    ...rrrrr...
    ....r.r....`, o);
  SN_('fimp_1', `
    ..y.....y..
    o.yR...Ry.o
    Oo.RRRRR.oO
    .ORRRRRRRO.
    ..Rw0RRw0..
    ..RRRRRRR..
    ..rRyyyRr..
    ...rrrrr...
    ....r.r....`, o);
  SN_('fimp_2', `
    ..y.....y..
    ..yR...Ry..
    ...RRRRR...
    ..RRRRRRR..
    .ORw0RRw0O.
    OoRRRRRRRoO
    o.rRYwYRr.o
    ...rrrrr...
    ....r.r....`, o);
  const golem = (lift) => `
    ${lift ? 'X............X' : '..............'}
    ${lift ? 'XX.CCCCCCCC.XX' : '...CCCCCCCC...'}
    ${lift ? '.XTTTTTTTTTTX.' : '.TTTTTTTTTTTT.'}
    ..tTTTTTTTTtt.
    ....tTTTTt....
    ..XXXXXXXXXX..
    ${lift ? '.XXxxxxxxxxXX.' : 'XXXxxxxxxxxXXX'}
    ${lift ? '.XxyxxxxyxxxX.' : 'XXxyxxxxyxxxXX'}
    ${lift ? '.XxxxxxxxxxxX.' : 'XxxxxxxxxxxxxX'}
    .xxxxooooxxxx.
    .xxxxoyyoxxxx.
    .xxxxooooxxxx.
    ..xxxxxxxxxx..
    ..xxx....xxx..
    ..XXX....XXX..`;
  SN_('agolem_0', golem(0), o);
  SN_('agolem_1', golem(1), o);
  SN_('hound_0', `
    ..........xx..
    .........xXXx.
    x.......xXyXXx
    .xxxxxxxxXXXXo
    .xXXXXXXXXXxx.
    .xXoXXXoXXXx..
    .xxxxxxxxxxx..
    .x.x.....x.x..`, o);
  SN_('hound_1', `
    ..........xx..
    .........xXXx.
    .x......xXyXXx
    x.xxxxxxxXXXXo
    .xXXXXXXXXXxx.
    .xXoXXXoXXXx..
    .xxxxxxxxxxx..
    ..x.x...x.x...`, o);
  SN_('hound_2', `
    ..........xx..
    .........xXXx.
    x.......xXyXXx
    .xxxxxxxxXXXXo
    .xXXXXXXXXXxx.
    .xXoXXXoXXXxo.
    .xxxxxxxxxxxo.
    xx.x.....x.xx.`, o);
  const bat = (up, coal) => `
    ${up ? 'V..........V' : '............'}
    ${up ? 'VV..1111..VV' : '....1111....'}
    ${up ? 'VVV.1VV1.VVV' : 'V...1VV1...V'}
    ${up ? '.VV11y1y1VV.' : 'VV.11y1y1.VV'}
    ${up ? '..V111111V..' : 'VVV111111VVV'}
    ....t..t....
    ....t..t....
    ${coal ? '...xoxx.....' : '.....tt.....'}
    ${coal ? '....xx......' : '............'}`;
  SN_('tongbat_0', bat(0, 0), o);
  SN_('tongbat_1', bat(1, 0), o);
  SN_('tongbat_2', bat(0, 1), o);
  SN_('slag_0', `
    ....nnnn....
    ..noOOOOon..
    .noOyYyOOon.
    noOO0OO0OOon
    noOOOOOOOOon
    nnoooooooonn
    .nnnnnnnnnn.`, o);
  SN_('slag_1', `
    ............
    ...nnnnnn...
    .nnoOyYOOnn.
    noOO0OO0OOon
    noOOOOOOOOon
    nnoooooooonn
    nnnnnnnnnnnn`, o);
  const bel = (puff) => `
    ....u....u....
    .....u..u.....
    ....${puff ? 'NNNNNN' : 'NNNNNN'}....
    ...NnNNNNnN...
    ..${puff ? 'NnnNNNNnnN' : 'NnnNNNNnnN'}..
    ..uuuuuuuuuu..
    ..${puff ? 'NnnNNNNnnN' : '.NnNNNNnN.'}..
    ...NnNNNNnN...
    ....NNNNNN....
    .....xooX.....
    ......${puff ? 'yY' : 'oo'}......
    ..u.u....u.u..`;
  SN_('bellows_0', bel(0), o);
  SN_('bellows_1', bel(1), o);
  // item icons
  SN_('icon_mitts', `
    ..RR....RR..
    .RqRR..RRqR.
    .RRRR..RRRR.
    RRRRR..RRRRR
    RRqRR..RRqRR
    RRRRr..rRRRR
    .rRrr..rrRr.
    .LLLL..LLLL.
    .llll..llll.`, { sil: '1' });
  SN_('icon_hotcoal', `
    ...y....
    ..yYy.y.
    .yYwYyYy
    .xXoyoXx
    xXxoyoxX
    xxXooxXx
    .xxxxxx.`, { sil: '1' });
  SN_('icon_tongs', `
    T........T
    CT......TC
    .tT....Tt.
    ..tT..Tt..
    ...tTTt...
    ...tTTt...
    ..tt..tt..
    .tt....tt.
    nn......nn
    nn......nn`, { sil: '1' });
  // bullets: cinders (Tong Bat coals, Bellows Bug) and lava (Magma Snail)
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  const B = {
    cinder: [['.xX.', 'xoyX', 'Xoox', '.Xx.'], ['..xX..', '.xooX.', 'xoyYox', 'Xoyyox', '.xoox.', '..Xx..']],
    lava: [['.oO.', 'oyYo', 'ryyo', '.rr.'], ['..oO..', '.oyYo.', 'oyYYyo', 'ryyyoo', '.rooo.', '..rr..']],
  };
  for (const k in B) {
    def('eb_' + k, pad(B[k][0])); def('ebb_' + k, pad(B[k][1]));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
})();

// ---------- Foes ----------
// Slag Slime puddles: a fire tile that cools into a rock (room.slagq), host / solo
const SLAG_ROCKS = 6;
function slagPuddle(room, e) {
  const [x, y] = cellMid(e.x, e.y), c = Math.floor(x / 16), r = Math.floor((y - OY) / 16);
  if (tileAt(room, c, r) !== T_FLOOR || G.markers.some(k => k.c === 'fire' && k.x === x && k.y === y)) return;
  G.markers.push({ kind: 'zap', c: 'fire', x, y, t: 4, max: 4, src: 'slag' });
  if ((e.rocks || 0) < 3) { e.rocks = (e.rocks || 0) + 1; (room.slagq || (room.slagq = [])).push({ c, r, t: 4 }); }
}
function slagCool(room, dt) {
  if (!room.slagq || !room.slagq.length) return;
  for (const q of room.slagq) q.t -= dt;
  for (const q of room.slagq.filter(q => q.t <= 0)) {
    const i = q.r * COLS + q.c, x = q.c * 16 + 8, y = OY + q.r * 16 + 8;
    let n = 0;
    for (let k = 0; k < room.tiles.length; k++) if (room.tiles[k] === T_ROCK && !room.rk0.has(k)) n++;
    if (n >= SLAG_ROCKS || room.tiles[i] !== T_FLOOR || q.c < 2 || q.c > 21 || q.r < 3 || q.r > 10 || (q.c >= 10 && q.c <= 13)) continue;
    if (G.players.concat(G.enemies).some(o => !o.dead && Math.abs(o.x - x) < 9 + (o.hw || 4) && Math.abs(o.y - 2 - y) < 9 + (o.hh || 3))) continue;
    if (!keepsJoined(room, i, T_ROCK)) continue;
    setTile(room, q.c, q.r, T_ROCK);
    dust(x, y + 4, 6, 14); Audio_.sfx('clack');
  }
  room.slagq = room.slagq.filter(q => q.t > 0);
}
Object.assign(EDEF, {
  // flits round the hero and throws sparks in threes (glint first)
  fimp: { hp: 6, r: 6, h: 12, hw: 5, hh: 3, sw: 14, fly: true, colors: ['R', 'r', 'y'],
    sprite: (e) => S('fimp_' + (e.state === 'glint' ? 2 : Math.floor(e.anim * 10) % 2)),
    glint: (e) => (e.state === 'glint' ? [0, -14] : null) },
  // slow; lifts its fists, and a pink ring shows where they will land (sparks fly out)
  agolem: { hp: 24, r: 7, h: 16, hw: 6, hh: 4, sw: 18, colors: ['X', 'T', 'o'],
    sprite: (e) => S(e.state === 'lift' ? 'agolem_1' : 'agolem_0') },
  // a dog of coal: it shows its lane, then charges down it
  hound: { hp: 10, r: 6, h: 9, hw: 6, hh: 3, sw: 14, colors: ['x', 'X', 'o'],
    sprite: (e) => S(e.state === 'aim' ? 'hound_2' : 'hound_' + (Math.floor(e.anim * (e.state === 'run' ? 14 : 6)) % 2)) },
  // grabs a coal from the fire and drops it on a ring; the coal bursts into cinders
  tongbat: { hp: 7, r: 6, h: 12, hw: 5, hh: 3, sw: 14, fly: true, colors: ['V', '1', 't'],
    sprite: (e) => S(e.state === 'grab' ? 'tongbat_2' : 'tongbat_' + (Math.floor(e.anim * 8) % 2)) },
  // a crawling puddle of lava; it leaves burning tiles that cool into rocks
  slag: { hp: 12, r: 6, h: 8, hw: 5, hh: 3, sw: 14, colors: ['O', 'o', 'n'],
    sprite: (e) => S('slag_' + (Math.floor(e.anim * 4) % 2)) },
  // the elite: stands and pumps; burning tiles spread, or a fan of cinders
  bellows: { hp: 16, r: 7, h: 13, hw: 6, hh: 4, sw: 16, still: true, colors: ['N', 'n', 'u'],
    sprite: (e) => S(e.state === 'pump' ? 'bellows_1' : 'bellows_0'),
    glint: (e) => (e.state === 'pump' ? [0, -16] : null) },
});
Object.assign(FOE_NAMES, { fimp: 'EMBER IMP', agolem: 'ANVIL GOLEM', hound: 'COAL HOUND', tongbat: 'TONG BAT', slag: 'SLAG SLIME', bellows: 'BELLOWS BUG', heat: 'HEAT BEAT', barrel: 'OIL BARREL', anvil: 'FALLING ANVIL' });
Object.assign(AI, {
  fimp(e, dt, room, p) {
    e.t -= dt;
    e.z = 8 + Math.sin(e.anim * 4) * 2;
    if (e.state === 'idle') { e.state = 'flit'; e.t = grnd(1.2, 2); }
    if (!p) return;
    if (e.state === 'glint') {
      e.flip = p.x < e.x;
      if (e.t <= 0) { const y = e.y - 14; fan(e.x, y, Math.atan2(p.y - 7 - y, p.x - e.x), 3, 0.3, 70, 'spark'); Audio_.sfx('eshoot'); e.state = 'flit'; e.t = grnd(1.6, 2.4); }
      return;
    }
    if ((e.wT = (e.wT || 0) - dt) <= 0) {
      e.wT = grnd(0.6, 1.1);
      const a = Math.atan2(e.y - p.y, e.x - p.x) + grnd(-1, 1), d = grnd(56, 90);
      e.wx = Math.max(24, Math.min(VW - 24, p.x + Math.cos(a) * d)); e.wy = Math.max(OY + 40, Math.min(OY + 184, p.y + Math.sin(a) * d * 0.7));
    }
    const dx = e.wx - e.x, dy = e.wy - e.y, d = Math.hypot(dx, dy) || 1;
    if (d > 4) moveBox(room, e, dx / d * 64 * dt, dy / d * 64 * dt, 'fly');
    if (Math.abs(dx) > 3) e.flip = dx < 0;
    if (e.t <= 0) { e.state = 'glint'; e.t = 0.55; }
  },
  agolem(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'walk'; e.t = grnd(1.5, 2.5); }
    if (e.state === 'walk') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 16 * dt, d.y * 16 * dt, 'enemy'); e.flip = d.x < 0;
      if (e.t <= 0 && p) {
        e.state = 'lift'; e.t = 1;
        G.markers.push({ x: p.x, y: p.y, t: 1, max: 1, src: 'agolem', fall: '', n: 6, r: 12 });
        Audio_.sfx('charge');
      }
    } else if (e.state === 'lift' && e.t <= 0) { Audio_.sfx('anvil'); G.shake = Math.max(G.shake, 2); dust(e.x, e.y, 8, 18); e.state = 'walk'; e.t = grnd(2.4, 3.2); }
  },
  hound(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'prowl'; e.t = grnd(1.2, 2); }
    if (e.state === 'prowl') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 34 * dt, d.y * 34 * dt, 'enemy'); e.flip = d.x < 0;
      if (e.t <= 0 && p) {
        e.state = 'aim'; e.t = 0.7;
        let len = 20;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        while (len < 200 && !boxSolid(room, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.hw, e.hh, 'enemy')) len += 6;
        lane(e, p, len); e.len = len - 6; e.flip = Math.cos(e.la) < 0;
      }
    } else if (e.state === 'aim' && e.t <= 0) { e.state = 'run'; e.t = e.len / 170; Audio_.sfx('dash'); }
    else if (e.state === 'run') {
      const bl = moveBox(room, e, Math.cos(e.la) * 170 * dt, Math.sin(e.la) * 170 * dt, 'enemy');
      if (Math.random() < 0.4) part(e.x - Math.cos(e.la) * 6, e.y - 4, 0, -10, 0.4, Math.random() < 0.5 ? 'o' : 'x');
      if (bl || e.t <= 0) { e.state = 'rest'; e.t = 1; dust(e.x, e.y, 4, 10); }
    } else if (e.state === 'rest' && e.t <= 0) { e.state = 'prowl'; e.t = grnd(1.4, 2.2); }
  },
  tongbat(e, dt, room, p) {
    e.t -= dt;
    e.z = 10 + Math.sin(e.anim * 5) * 2;
    if (e.state === 'idle') { e.state = 'flap'; e.t = grnd(1.6, 2.6); }
    if (!p) return;
    if (e.state === 'flap') {
      const a = e.anim * 1.3, tx = p.x + Math.cos(a) * 70, ty = p.y - 30 + Math.sin(a * 1.7) * 24;
      const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
      moveBox(room, e, dx / d * Math.min(d * 2, 56) * dt, dy / d * Math.min(d * 2, 56) * dt, 'fly');
      e.flip = dx < 0;
      if (e.t <= 0) { e.state = 'grab'; e.t = 0.5; Audio_.sfx('clack'); }
    } else if (e.state === 'grab' && e.t <= 0) {
      G.markers.push({ x: p.x, y: p.y, t: 1.1, max: 1.1, src: 'tongbat', fall: 'coal', n: 4, r: 10, h: 120 });
      Audio_.sfx('swish');
      e.state = 'flap'; e.t = grnd(2.4, 3.2);
    }
  },
  slag(e, dt, room) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'crawl'; e.t = grnd(1.6, 2.4); }
    const d = towardPlayer(e);
    moveBox(room, e, d.x * 22 * dt, d.y * 22 * dt, 'enemy'); e.flip = d.x < 0;
    if (e.t <= 0) { slagPuddle(room, e); e.t = grnd(2, 2.8); }
  },
  bellows(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'wait'; e.t = grnd(1.5, 2.5); }
    if (e.state === 'wait' && e.t <= 0) { e.state = 'pump'; e.t = 0.6; Audio_.sfx('heat'); }
    else if (e.state === 'pump' && e.t <= 0) {
      // every burning tile spreads to a free tile beside it (for 3 s); with none, a fan of cinders
      const fires = G.markers.filter(k => k.kind === 'zap' && k.c === 'fire' && k.t > 0.5);
      let n = 0;
      for (const k of fires) {
        if (n >= 6) break;
        for (const [dx, dy] of [[16, 0], [-16, 0], [0, 16], [0, -16]]) {
          const x = k.x + dx, y = k.y + dy, c = Math.floor(x / 16), r = Math.floor((y - OY) / 16);
          if (tileAt(room, c, r) !== T_FLOOR || G.markers.some(q => q.c === 'fire' && q.x === x && q.y === y)) continue;
          G.markers.push({ kind: 'zap', c: 'fire', x, y, t: 3, max: 3, src: 'bellows', h: 0.45 }); n++;
          break;
        }
      }
      if (!n && p) fan(e.x, e.y - 8, Math.atan2(p.y - 7 - (e.y - 8), p.x - e.x), 5, 0.28, 60, 'cinder');
      burst(e.x, e.y - 4, 8, ['V', '3', 'X'], 60, 0.5, { g: -30 });
      e.state = 'wait'; e.t = grnd(2.8, 3.4);
    }
  },
});
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'fimp', spr: 'fimp_0', lore: ['A LITTLE DEVIL OF THE FURNACE.', 'IT FLITS ABOUT, THEN GLINTS.', 'THREE SPARKS FOLLOW THE GLINT.'] },
  { t: 'agolem', spr: 'agolem_0', lore: ['AN IRON GIANT WITH AN ANVIL HEAD.', 'WHEN IT LIFTS ITS FISTS, A RING SHOWS.', 'STEP OUT OF THE RING.'] },
  { t: 'hound', spr: 'hound_0', lore: ['A DOG MADE OF COAL.', 'IT SHOWS ITS LANE, THEN RUNS.', 'STEP OFF THE CYAN LANE.'] },
  { t: 'tongbat', spr: 'tongbat_0', lore: ['A BAT THAT CARRIES TONGS.', 'IT DROPS A HOT COAL ON A RING.', 'THE COAL BURSTS INTO CINDERS.'] },
  { t: 'slag', spr: 'slag_0', lore: ['A PUDDLE OF LAVA THAT CRAWLS.', 'IT LEAVES BURNING TILES BEHIND.', 'THEY COOL INTO ROCKS: HIDE BEHIND THEM.'] },
  { t: 'bellows', spr: 'bellows_0', lore: ['IT PUMPS AIR INTO THE FIRE.', 'BURNING TILES GROW WHEN IT PUFFS.', 'NO FIRE? THEN IT PUFFS CINDERS.'] },
);

// ---------- The Hammer Sprite (warden of the Ember Forge) ----------
// A little fire sprite with a hammer twice its size. It swings in an arc: pink rings land one
// after another in front of it, each one throwing sparks. Between swings, a fan of sparks (glint
// first). Every third round it winds up (a charge sound, the hammer glows) and spins: a ring of
// sparks with a gap toward the hero, and then it is dizzy. Phase 2: wider arcs and fans.
(function spriteArt() {
  const o = { flash: true, flip: true };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const sprite = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0, down = f.a;
    let r = sculpt(30, 30, [
      { e: [7, 13 + dy, 5, 7], ramp: 'tTCw' }, // wings
      { e: [13, 17 + dy + b, 7, 8], ramp: f.p ? 'rRoY' : 'roOy' },
      { e: [13, 7 + dy + b, 4, 4], ramp: 'roOy' }, // the flame tuft on its head
      down ? { r: [17, 18, 11, 7, 1], ramp: f.p ? 'rRoY' : 'tTCw' } : { r: [18, 1, 11, 7, 1], ramp: f.p ? 'rRoY' : 'tTCw' },
    ]);
    r = stamp(r, down ? 19 : 21, down ? 13 + dy : 8, down ? 'uuuu' : 'u\nu\nu\nu\nu\nu\nu\nu');
    r = stamp(r, 12, 3 + dy + b, '.y.\nyYy');
    r = autoOutline(r);
    r = bossEyes(r, 8, 13 + dy + b, 6, f.face);
    r = stamp(r, 11, 19 + dy + b, MOUTH[f.face]);
    return rim(r, { O: 'Y', T: 'C' });
  };
  bossFrames('hsprite', sprite, o);
})();
Object.assign(EDEF, {
  hsprite: { hp: 260, r: 11, h: 26, hw: 9, hh: 5, sw: 28, fly: true, warden: true, intro: 'IT SWINGS A HAMMER TWICE ITS SIZE', colors: ['O', 'o', 'T'],
    init: (e) => { e.state = 'wait'; e.t = 1; e.n = 0; e.z = 6; },
    sprite: (e) => bossFrame(e, { glint: 'tell', wind: 'tell', swing: 'atk', spin: 'atk' }[e.state] || bob(e, 3, '0', '1')),
    glint: (e) => (e.state === 'glint' || e.state === 'wind' ? [6, -30] : null) },
});
FOE_NAMES.hsprite = 'HAMMER SPRITE';
WARDENS.forge = 'hsprite';
AI.hsprite = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  e.z = 6 + Math.sin(e.anim * 3) * 2;
  if (!p) return;
  // it keeps a swing's length from the hero
  if (e.state === 'wait' || e.state === 'glint') {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, want = d > 70 ? 40 : d < 50 ? -40 : 0;
    moveBox(room, e, dx / d * want * dt, dy / d * want * dt, 'fly');
    e.flip = dx < 0;
  }
  if (e.state === 'wait') {
    if (e.t > 0) return;
    const k = e.n++ % 3;
    if (k === 0) {
      // the arc: rings one after another across the hero's side
      const a = Math.atan2(p.y - e.y, p.x - e.x), n = e.p2 ? 5 : 3, R = Math.min(70, Math.max(40, Math.hypot(p.x - e.x, p.y - e.y)));
      for (let i = 0; i < n; i++) {
        const b = a + (i - (n - 1) / 2) * 0.5, x = e.x + Math.cos(b) * R, y = e.y + Math.sin(b) * R * 0.8, t = 0.8 + i * 0.15;
        if (!solidPx(room, x, y, 'enemy')) G.markers.push({ x, y, t, max: t, src: 'hsprite', fall: '', n: e.p2 ? 3 : 0, r: 12 });
      }
      e.state = 'swing'; e.t = 0.8 + n * 0.15; Audio_.sfx('charge');
    } else if (k === 1) { e.state = 'glint'; e.t = 0.55; }
    else { e.state = 'wind'; e.t = 0.9; Audio_.sfx('charge'); }
  } else if (e.state === 'swing') {
    if (e.t <= 0) { Audio_.sfx('anvil'); e.state = 'wait'; e.t = 0.9; }
  } else if (e.state === 'glint') {
    if (e.t > 0) return;
    fan(e.x, e.y - 16, Math.atan2(p.y - 7 - (e.y - 16), p.x - e.x), e.p2 ? 5 : 4, 0.34, 62, 'spark');
    Audio_.sfx('eshoot');
    e.state = 'wait'; e.t = 1;
  } else if (e.state === 'wind') {
    if (e.t > 0) return;
    const a = Math.atan2(p.y - e.y, p.x - e.x), n = 16;
    for (let i = 0; i < n; i++) { const b = a + (i + 0.5) * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.6) ebullet(e.x, e.y - 16, b, 62, 'spark'); }
    Audio_.sfx('boom');
    e.state = 'spin'; e.t = 0.4;
  } else if (e.state === 'spin' && e.t <= 0) { stagger(e, 2); toast('THE SPRITE IS DIZZY!'); e.state = 'wait'; e.t = 0.4; }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'hsprite', spr: 'hsprite_0', lore: ['THE WARDEN OF THE EMBER FORGE.', 'ITS HAMMER LANDS ON THE PINK RINGS.', 'AFTER A SPIN IT IS DIZZY.'] });

// ---------- The Forge Dragonling (boss of the Ember Forge) ----------
// A small red dragon with a hot yellow belly and an anvil for a tail, pacing the top of the room.
// Phase 1: its tail hammers down on pink rings (sparks fly), fans of embers (glint first), and
// fire breath down a cyan lane, after which it pants (stagger). Phase 2: every other round it
// heats the floor into a checkerboard: the hot tiles glow for a second, then burn; the cool ones
// are safe. Phase 3: the lava rises from the bottom, a band at a time (the band glows first);
// after the third it pants for a long while and the lava sinks back.
const DR_HOT = 1.4, DR_ROWS = [11, 10, 9];
(function dragonArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0...\n.000', squint: '0000', mad: '0000\nwyyw', daze: '.0.0\n0.0.', dead: '0000' };
  const dragon = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0, sw = f.a ? 2 : 0;
    const scale = f.p ? 'prRq' : 'nrRq';
    let r = sculpt(40, 32, [
      { r: [0, 17 - sw, 9, 6, 1], ramp: 'tTCw' }, // the anvil on its tail
      { e: [10, 21, 6, 2.5], ramp: scale },
      { e: [15, 9 + dy + b, 7, 6], ramp: 'vVpP' }, // a wing
      { e: [21, 21 + dy * 0.5, 11, 8], ramp: scale },
      { e: [23, 23 + dy * 0.5, 6.5, 5.5], ramp: 'oyYw' }, // the hot belly
      { r: [14, 26, 5, 6, 1], ramp: scale }, { r: [25, 26, 5, 6, 1], ramp: scale },
      { e: [30, 11 + dy + b, 7.5, 6.5], ramp: scale },
      { r: [31, 13 + dy + b, 9, 5, 2], ramp: scale },
    ]);
    r = stamp(r, 25, 2 + dy + b, 'A....A\nAA..AA\n.A...A');
    r = stamp(r, 14, 30, '0..0.......0..0');
    r = bossEyes(r, 26, 8 + dy + b, 6, f.face);
    r = stamp(r, 35, 15 + dy + b, MOUTH[f.face]);
    if (f.a) r = stamp(r, 38, 14 + dy + b, 'y\nY\ny');
    return rim(r, { r: 'R', R: 'q' });
  };
  bossFrames('dragon', dragon, o);
})();
Object.assign(EDEF, {
  dragon: { hp: 430, r: 14, h: 30, hw: 16, hh: 6, sw: 40, boss: true, intro: 'SMALL, HOT AND HUNGRY', phases: [0.66, 0.33], colors: ['r', 'y', 'T'],
    init: (e) => { e.x = 192; e.y = OY + 90; e.n = 0; e.fn = 0; },
    sprite: (e) => bossFrame(e, { glint: 'tell', aim: 'tell', heat: 'tell', rise: 'tell', tail: 'atk', breath: 'atk' }[e.state] || bob(e, 2, 1, 0)),
    glint: (e) => (e.state === 'glint' ? [12, -26] : null) },
});
FOE_NAMES.dragon = 'FORGE DRAGONLING';
EF_EXTRA.push('hot', 'fl');
// the checkerboard: [time left on the tell (then below zero while it burns), which half]
const dragonHot = (b, i) => { const c = i % COLS, r = (i / COLS) | 0; return r >= 2 && r <= 11 && c >= 1 && c <= 22 && (c + r) % 2 === b.hot[1]; };
function dragonHotDraw(ox, oy, b) {
  const room = G.room, tell = b.hot[0] > 0, blink = Math.floor(G.time * 10) % 2;
  for (let r = 2; r <= 11; r++) for (let c = 1; c <= 22; c++) {
    const i = r * COLS + c;
    if (room.tiles[i] !== T_FLOOR) continue;
    const x = ox + c * 16, y = oy + OY + r * 16;
    if (!dragonHot(b, i)) { if (tell && (c * 7 + r * 3 + Math.floor(G.time * 6)) % 5 === 0) rect(x + 7, y + 7, 2, 2, 'C'); continue; } // the cool ones twinkle
    if (tell) { const k = b.hot[0] < 0.5 && blink ? 'y' : 'o'; rect(x + 1, y + 1, 14, 1, k); rect(x + 1, y + 14, 14, 1, k); rect(x + 1, y + 2, 1, 12, k); rect(x + 14, y + 2, 1, 12, k); continue; }
    rect(x + 1, y + 1, 14, 14, 'o'); rect(x + 2, y + 2, 12, 12, 'O');
    const s = S('flame_' + (Math.floor(G.time * 8 + i) % 2)); drawS(s, x + 8 - (s.w >> 1), y + 14 - s.h);
  }
  // the band the lava will rise to next
  if (b.fl && blink) for (let c = 1; c <= 22; c++) { const x = ox + c * 16, y = oy + OY + b.fl * 16; rect(x + 1, y + 1, 14, 2, 'o'); rect(x + 1, y + 13, 14, 2, 'o'); }
}
function dragonRecede(room) {
  for (const r of DR_ROWS) for (let c = 1; c <= 22; c++) if (tileAt(room, c, r) === T_PIT) setTile(room, c, r, T_FLOOR);
  room.flood = false;
}
AI.dragon = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'dragon';
  if (e.hp < e.maxHp * 0.66) bossPhase(e, 2);
  if (e.hp < e.maxHp * 0.33 && !e.p3) { bossPhase(e, 3); e.p3 = true; }
  if (e.hot && (e.hot[0] -= dt) < -DR_HOT) e.hot = null;
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'wait'; e.t = 1; } return; }
  if (!p) return;
  if (e.state === 'wait' || e.state === 'glint') {
    const dx = (e.tx || 192) - e.x;
    const blocked = G.players.some(q => alive(q) && Math.abs(q.x - (e.x + Math.sign(dx) * 22)) < 26 && Math.abs(q.y - e.y) < 22); // it never walks into a hero
    if (Math.abs(dx) > 2 && !blocked) moveBox(room, e, Math.sign(dx) * 34 * dt, 0, 'enemy');
    e.flip = p.x < e.x;
  }
  if (e.state === 'wait') {
    if (e.t > 0) return;
    const k = e.n++ % 4;
    e.tx = 96 + grand() * 192;
    if (k === 0) {
      // the tail comes down on every hero, and once beside the first
      const hs = G.players.filter(alive);
      hs.forEach((q, j) => G.markers.push({ x: q.x, y: q.y, t: 0.9 + j * 0.2, max: 0.9 + j * 0.2, src: 'dragon', fall: '', n: e.p2 ? 5 : 3, r: 12 }));
      const sx = Math.max(40, Math.min(VW - 40, p.x + (grand() < 0.5 ? -40 : 40)));
      G.markers.push({ x: sx, y: p.y, t: 1.2, max: 1.2, src: 'dragon', fall: '', n: 0, r: 12 });
      e.state = 'tail'; e.t = 1.2; Audio_.sfx('charge');
    } else if (k === 1) { e.state = 'glint'; e.t = 0.55; e.w = 0; }
    else if (k === 2) {
      if (e.p3 && (e.fn || 0) < 3 && !e.hot) { e.fl = DR_ROWS[e.fn || 0]; e.state = 'rise'; e.t = 1.3; Audio_.sfx('heat'); toast('THE LAVA RISES!'); }
      else if (e.p2 && !e.hot && (e.n >> 2) % 2) { e.hot = [1, (e.n >> 3) % 2]; e.state = 'heat'; e.t = 1; Audio_.sfx('heat'); }
      else {
        e.state = 'aim'; e.t = 0.9;
        let len = 30;
        const la = Math.atan2(p.y - e.y, p.x - e.x);
        while (len < 300 && !solidPx(room, e.x + Math.cos(la) * len, e.y - 6 + Math.sin(la) * len, 'shot')) len += 8;
        lane(e, p, len);
      }
    } else { e.state = 'wait'; e.t = 0.5; }
  } else if (e.state === 'tail') {
    if (e.t <= 0) { Audio_.sfx('anvil'); G.shake = Math.max(G.shake, 3); e.state = 'wait'; e.t = 0.8; }
  } else if (e.state === 'glint') {
    if (e.t > 0) return;
    fan(e.x + (e.flip ? -14 : 14), e.y - 18, Math.atan2(p.y - 7 - (e.y - 18), p.x - e.x) + (e.w % 2 ? 0.17 : 0), e.p2 ? 5 : 4, 0.34, 62, 'ember');
    Audio_.sfx('eshoot'); e.t = 0.5;
    if (++e.w >= 2) { e.state = 'wait'; e.t = 1; }
  } else if (e.state === 'heat') {
    if (e.t <= 0) { e.state = 'wait'; e.t = 0.2; } // it fights on while the floor burns
  } else if (e.state === 'aim') {
    if (e.t <= 0) { e.state = 'breath'; e.w = 0; e.t = 0; }
  } else if (e.state === 'breath') {
    if (e.t > 0) return;
    ebullet(e.x + Math.cos(e.la) * 14, e.y - 16 + Math.sin(e.la) * 4, e.la, 90, 'ember', true);
    e.t = 0.07;
    if (++e.w === 1) Audio_.sfx('roar');
    if (e.w >= 12) { e.state = 'wait'; e.t = 0.3; stagger(e, 1.6); toast('IT PANTS SMOKE!'); }
  } else if (e.state === 'rise') {
    if (e.t > 0) return;
    for (let c = 1; c <= 22; c++) if (tileAt(room, c, e.fl) === T_FLOOR) setTile(room, c, e.fl, T_PIT);
    room.flood = true; e.fn = (e.fn || 0) + 1; e.fl = 0;
    burst(192, OY + DR_ROWS[e.fn - 1] * 16 + 8, 20, ['o', 'O', 'y'], 120, 0.6, { g: -40 });
    Audio_.sfx('boom'); G.shake = Math.max(G.shake, 3);
    if (e.fn >= 3) { e.fn = 0; e.state = 'wait'; e.t = 0.2; e.n = 0; stagger(e, 3); e.sink = 3; toast('IT RUNS OUT OF FIRE!'); }
    else { e.state = 'wait'; e.t = 0.6; }
  }
  if (e.sink && (e.sink -= dt) <= 0) { e.sink = 0; dragonRecede(room); Audio_.sfx('tele'); }
};
BEASTS.push({ t: 'dragon', spr: 'dragon_0', boss: true, lore: ['THE HEART OF THE EMBER FORGE.', 'ITS TAIL IS AN ANVIL.', 'WHEN THE LAVA RISES, CLIMB.'] });

// ---------- The Magma Snail (the Ember Forge's other boss) ----------
// A slow snail with a shell of cooling lava. It leaves a trail of burning tiles, spits fans of
// lava (glint first), and tucks into its shell (a quarter of the damage gets through) to roll
// down a cyan lane; at the end of the roll the shell cracks open and it is dazed. Phase 2: it
// rolls twice, each roll with its own lane, and spits wider.
(function snailArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const snail = (f) => {
    const dy = f.d ? 3 : f.st ? 1 : 0, b = f.b ? 1 : 0, tuck = f.a;
    const shapes = [{ e: [17, 13 + b, 12, 11], ramp: f.p ? 'xnrR' : 'xX1V' }];
    if (!tuck) shapes.unshift({ e: [21, 24 + dy, 17, 4], ramp: 'roOy' }, { e: [33, 17 + dy, 5, 7], ramp: 'roOy' });
    let r = sculpt(40, 28, shapes);
    // the glowing spiral on the shell
    r = stamp(r, 11, 7 + b, '..oooo..\n.o....o.\no..oo..o\no.o..o.o\no.o.oo.o\no..o...o\n.o....o.\n..oooo..');
    if (!tuck) {
      r = stamp(r, 31, 5 + dy, '.y..y\n.o..o\n.o..o\n.o..o\n.o.o.');
      r = bossEyes(r, 30, 13 + dy, 5, f.face);
      r = stamp(r, 32, 19 + dy, MOUTH[f.face]);
    }
    return rim(r, { o: 'O', O: 'y' });
  };
  bossFrames('msnail', snail, o);
})();
Object.assign(EDEF, {
  msnail: { hp: 380, r: 14, h: 26, hw: 16, hh: 6, sw: 40, boss: true, intro: 'SLOW, AND THE FLOOR BURNS BEHIND IT', phases: [0.5], colors: ['o', 'x', 'y'],
    init: (e) => { e.n = 0; },
    sprite: (e) => bossFrame(e, { glint: 'tell', tuck: 'atk', roll0: 'atk', roll: 'atk' }[e.state] || bob(e, 1.5, 1, 0)),
    glint: (e) => (e.state === 'glint' ? [12, -24] : null) },
});
FOE_NAMES.msnail = 'MAGMA SNAIL';
LAND.forge.alt = ['msnail'];
AI.msnail = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'msnail';
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'crawl'; e.t = 1.5; } return; }
  if (!p) return;
  // the trail: each new tile it crawls over burns for a while
  const [cx, cy] = cellMid(e.x, e.y);
  if (e.state !== 'roll' && (cx !== e.lx || cy !== e.ly)) {
    e.lx = cx; e.ly = cy;
    if (G.markers.filter(k => k.src === 'msnail').length < 14) G.markers.push({ kind: 'zap', c: 'fire', x: cx, y: cy, t: 5, max: 5, src: 'msnail', h: 0.6 });
  }
  if (e.state === 'crawl') {
    const d = towardPlayer(e);
    moveBox(room, e, d.x * 18 * dt, d.y * 18 * dt, 'enemy'); e.flip = d.x < 0;
    if (e.t > 0) return;
    const k = e.n++ % 3;
    if (k === 2) { e.state = 'tuck'; e.t = 0.6; e.sh = 1; e.rolls = e.p2 ? 2 : 1; Audio_.sfx('clack'); }
    else { e.state = 'glint'; e.t = 0.55; e.w = 0; }
  } else if (e.state === 'glint') {
    e.flip = p.x < e.x;
    if (e.t > 0) return;
    fan(e.x + (e.flip ? -14 : 14), e.y - 16, Math.atan2(p.y - 7 - (e.y - 16), p.x - e.x) + (e.w % 2 ? 0.17 : 0), e.p2 ? 5 : 4, 0.34, 58, 'lava');
    Audio_.sfx('eshoot'); e.t = 0.5;
    if (++e.w >= (e.p2 ? 2 : 1)) { e.state = 'crawl'; e.t = 1.8; }
  } else if (e.state === 'tuck') {
    if (e.t > 0) return;
    e.state = 'aim'; e.t = 0.8;
    let len = 20;
    const la = Math.atan2(p.y - e.y, p.x - e.x);
    while (len < 260 && !boxSolid(room, e.x + Math.cos(la) * len, e.y + Math.sin(la) * len, e.hw, e.hh, 'enemy')) len += 6;
    lane(e, p, len); e.len = len - 6; e.state = 'roll0';
  } else if (e.state === 'roll0') {
    if (e.t <= 0) { e.state = 'roll'; e.t = e.len / 150; Audio_.sfx('dash'); }
  } else if (e.state === 'roll') {
    const bl = moveBox(room, e, Math.cos(e.la) * 150 * dt, Math.sin(e.la) * 150 * dt, 'enemy');
    if (Math.random() < 0.5) part(e.x + rnd(-8, 8), e.y - 2, 0, -12, 0.4, Math.random() < 0.5 ? 'o' : 'y');
    if (bl || e.t <= 0) {
      G.shake = Math.max(G.shake, 2); dust(e.x, e.y, 8, 20);
      if (--e.rolls > 0) { e.state = 'tuck'; e.t = 0.3; return; }
      e.sh = 0; e.state = 'crawl'; e.t = 1.2;
      stagger(e, 2.2); toast('THE SHELL CRACKS OPEN!');
    }
  }
};
BEASTS.push({ t: 'msnail', spr: 'msnail_0', boss: true, lore: ['THE OTHER HEART OF THE FORGE.', 'ITS TRAIL BURNS. ITS SHELL ROLLS.', 'AFTER A ROLL, THE SHELL CRACKS OPEN.'] });

// ---------- The Quench Room (the Ember Forge's special room) ----------
// Three cooling troughs, each with its own temper for the wand; a hero dips into one, and it
// lasts for this floor. STEEL: shots hit 30% harder. FROST: hits slow foes. GLITTER: one hit in
// eight sparkles for double.
const QUENCH = [
  { k: 'steel', name: 'STEEL!', title: 'A STEEL TROUGH', ban: 'TEMPERED: STEEL', desc: 'YOUR SHOTS HIT HARDER THIS FLOOR', col: ['m', 'l', 'L'] },
  { k: 'frost', name: 'FROST!', title: 'A FROST TROUGH', ban: 'TEMPERED: FROST', desc: 'YOUR HITS SLOW FOES THIS FLOOR', col: ['B', 'c', 'C'] },
  { k: 'glitter', name: 'GLITTER!', title: 'A GLITTER TROUGH', ban: 'TEMPERED: GLITTER', desc: 'SOME HITS SPARKLE FOR DOUBLE THIS FLOOR', col: ['p', 'P', 'q'] },
];
const quenchOf = (p) => (p && G.floor && p.qr === G.run && p.qd === G.floor.depth ? p.qn : null);
function quenchStock(room) { QUENCH.forEach((q, i) => room.props.push({ kind: 'quench', x: 112 + i * 80, y: 124, t: 0, q: i })); }
function quenchUse(o, p) {
  const Q = QUENCH[o.q], had = quenchOf(p);
  if (had) { say(p, had === Q.k ? 'ALREADY TEMPERED' : 'ONE TEMPER A FLOOR'); Audio_.sfx('deny'); return; }
  p.qn = Q.k; p.qd = G.floor.depth; p.qr = G.run;
  say(p, Q.name);
  burst(o.x, o.y - 10, 16, ['L', 'l', 'w'], 70, 0.8, { g: -50 });
  burst(o.x, o.y - 6, 10, Q.col, 80, 0.5);
  Audio_.sfx('heat');
  G.banner = { title: Q.ban, sub: Q.desc, t: 2.2, icon: null };
}
const _fgDmg = shotHitDmg;
shotHitDmg = function (s) {
  const q = quenchOf(s.own);
  let d = _fgDmg(s);
  if (q === 'steel') d *= 1.3;
  else if (q === 'glitter' && grand() < 0.125) { d *= 2; burst(s.x, s.y, 6, ['P', 'q', 'w'], 70, 0.3); }
  return d;
};
const _fgOnHit = itemOnHit;
itemOnHit = function (s, e) {
  _fgOnHit(s, e);
  if (!e.dead && quenchOf(s.own) === 'frost') e.slowT = Math.max(e.slowT || 0, 1.2);
};
SN_('trough', `
  xXXXXXXXXXXXXXXXXXXXXXXXx
  XTTTTTTTTTTTTTTTTTTTTTTTX
  XtccccccccccccccccccccctX
  XtccccccccccccccccccccctX
  XtTTTTTTTTTTTTTTTTTTTTTtX
  xttttttttttttttttttttttXx
  .xXX.................XXx.
  .xXX.................XXx.
  .xxx.................xxx.`);
// a sign over each trough: an arrow up (steel), a snowflake (frost), a star (glitter)
const QSIGN = [
  ['..#..', '.###.', '#####', '..#..', '..#..'],
  ['#.#.#', '.###.', '##.##', '.###.', '#.#.#'],
  ['..#..', '..#..', '#####', '.#.#.', '#...#'],
];
function drawQuench(o, x, y) {
  const Q = QUENCH[o.q], used = G.players.some(p => quenchOf(p) === Q.k), f = Math.floor(o.t * 6);
  shadow(x, y, 14);
  const s = S('trough');
  drawFeet(s, x, y + 1);
  // the water, rippling
  const wx = x - (s.w >> 1) + 3, wy = y - s.h + 3;
  rect(wx, wy, s.w - 6, 2, Q.col[0]); rect(wx, wy, s.w - 6, 1, Q.col[1]);
  for (let i = 0; i < s.w - 6; i += 4) rect(wx + (i + f) % (s.w - 6), wy, 2, 1, Q.col[2]);
  // the sign
  rect(x - 5, y - 24, 11, 9, '0'); rect(x - 4, y - 23, 9, 7, used ? 'X' : Q.col[0]);
  for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) if (QSIGN[o.q][yy][xx] === '#') rect(x - 2 + xx, y - 22 + yy, 1, 1, used ? 'l' : 'w');
  rect(x, y - 15, 1, 4, 'u');
  // steam
  if (f % 3 === 0) rect(x - 8 + (f * 5) % 16, y - 14 - (f % 4), 1, 1, 'L');
}
