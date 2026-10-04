'use strict';
// ---------- The Snowglobe (Ice and Shake) ----------
// The land is a snowglobe on a child's shelf. Its ponds (pits) freeze where a hero's shot
// crosses them: an ice bridge for FREEZE_T seconds that blinks before it melts. Every SHAKE_T
// seconds a mitten grabs the globe (a one second tell: mittens at the edges, arrows across the
// room) and shakes it: for SK_PUSH seconds everything drifts toward one wall, and snowdrifts pile
// up along that wall for DRIFT_T seconds, slowing whoever wades through (Snow Boots do not
// mind). The shake is worked out from the shared clock and the room's seed, so every screen sees
// the same one without a message.
const FREEZE_T = 10, SHAKE_T = 30, SK_TELL = 1, SK_PUSH = 1.2, DRIFT_T = 13, SK_V = 110, DRIFT_SLOW = 0.55;
// a sprite from colour pixels only: rows are padded to one width, then outlined
const SN = (name, art, o) => {
  const rows = art.split('\n').map(r => r.trim()).filter(r => r), w = Math.max(...rows.map(r => r.length)), pad = '.'.repeat(w + 2);
  def(name, autoOutline([pad, ...rows.map(r => '.' + r.padEnd(w, '.') + '.'), pad]), o);
};

// ---------- The globe's shake ----------
const GLOBE = { at: -1, room: null, g: null, o: { u: 0, k: 0, dir: 0 } };
// { u: seconds into this shake's cycle, k: which shake, dir: 0 right 1 down 2 left 3 up }, or null
function globe(room) {
  if (GLOBE.at === G.time && GLOBE.room === room) return GLOBE.g;
  GLOBE.at = G.time; GLOBE.room = room; GLOBE.g = null;
  if (!room || room.cleared || room.type === 'boss' || room.type === 'arena' || G.tut || G.first || G.cine || !G.floor || G.floor.land.id !== 'snow') return null;
  const off = room.seed % SHAKE_T, t = skyNow() + off, k = Math.floor(t / SHAKE_T);
  if (room.in === undefined || k * SHAKE_T - off < room.in + 2) return null; // never right at the door
  const o = GLOBE.o;
  o.u = t - k * SHAKE_T; o.k = k; o.dir = hash(k, 5, room.seed) % 4;
  return GLOBE.g = o;
}
// the Yeti shakes the globe himself (e.sk: 1-4 the tell, 5-8 the push, toward sk - 1 or sk - 5)
const yetiSk = () => (G.boss && G.boss.type === 'yeti' && !G.boss.dead ? G.boss.sk || 0 : 0);
function shakeTell(room) {
  const s = yetiSk();
  if (s) return s <= 4 ? s - 1 : -1;
  const g = globe(room);
  return g && g.u < SK_TELL ? g.dir : -1;
}
function shakePush(room) {
  const s = yetiSk();
  if (s) return s > 4 ? s - 5 : -1;
  const g = globe(room);
  return g && g.u >= SK_TELL && g.u < SK_TELL + SK_PUSH ? g.dir : -1;
}
// how deep the snowdrift on tile c, r is (0 none .. 1 full), piled against the wall it was shaken to
function driftAtTile(room, c, r) {
  const g = globe(room);
  if (!g) return 0;
  const a = g.u - SK_TELL - SK_PUSH;
  if (a < 0 || a >= DRIFT_T) return 0;
  const d = g.dir, depth = d === 0 ? 22 - c : d === 2 ? c - 1 : d === 1 ? 11 - r : r - 2;
  if (depth < 0 || depth > 2) return 0;
  const t = room.tiles[r * COLS + c];
  if (t !== T_FLOOR && t !== T_ICE) return 0;
  if (depth && hash(c * 31 + r, g.k, room.seed) % (depth === 1 ? 2 : 5)) return 0;
  return Math.min(1, a / 0.3, (DRIFT_T - a) / 1);
}

// ---------- Freezing ----------
// room.frz: tile index -> { t: seconds left, v: the tile it melts back to }. Host / solo.
function freeze(room, i, v) {
  const F = room.frz || (room.frz = new Map());
  if (F.has(i)) return;
  F.set(i, { t: FREEZE_T, v });
  setTile(room, i % COLS, (i / COLS) | 0, T_ICE);
  const x = (i % COLS) * 16 + 8, y = OY + ((i / COLS) | 0) * 16 + 8;
  burst(x, y, 5, ['w', 'C', 'c'], 50, 0.3);
}
function meltAll(room, dt) {
  const F = room.frz;
  if (!F || !F.size) return;
  for (const [i, q] of F) {
    if ((q.t -= dt) > 0) continue;
    F.delete(i);
    if (room.tiles[i] !== T_ICE) continue;
    setTile(room, i % COLS, (i / COLS) | 0, q.v);
    if (q.v !== T_PIT) continue;
    // back to water: whoever stood on the bridge steps off onto the nearest bank
    burst((i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 + 8, 6, ['c', 'C', 'B'], 60, 0.35);
    Audio_.sfx('pop');
    for (const p of G.players) if (!p.dead && nudgeOut(room, p, heroMoveMode(p))) p.tpN++;
    for (const e of G.enemies) if (!e.dead && !e.fly) nudgeOut(room, e, 'enemy');
  }
}
// a frozen tile's own clock on every screen (setTile keeps when it changed)
const frozeAge = (room, i) => G.time - ((room.tAt && room.tAt.get(i)) ?? -99);

// ---------- Drawing the land ----------
function drawDrift(x, y, h) {
  const top = y + 16 - Math.max(2, Math.round(13 * h));
  rect(x, top + 2, 16, y + 16 - top - 2, 'w');
  rect(x + 2, top, 5, 2, 'w'); rect(x + 9, top + 1, 5, 1, 'w');
  rect(x + 1, top + 2, 1, 1, 'C'); rect(x + 14, top + 2, 1, 1, 'C');
  rect(x, y + 14, 16, 2, 'C'); rect(x, y + 15, 16, 1, 'c');
  rect(x + 2, top - 1, 5, 1, 'C'); rect(x + 9, top, 5, 1, 'C'); rect(x, top + 1, 2, 1, 'C'); rect(x + 7, top + 1, 2, 1, 'C'); rect(x + 14, top + 1, 2, 1, 'C');
  if (h > 0.6) { rect(x + 4, top + 3, 2, 1, 'C'); rect(x + 11, top + 5, 2, 1, 'C'); }
}
// the mittens that hold the globe: a red mitten at each side edge, shaking
function drawMittens(dir, t) {
  const E = screenEdges(), s = S('mitten'), j = Math.round(Math.sin(t * 40) * 2), y = OY + 100 - (s.h >> 1);
  drawS(s, E.l - 8 + j + (dir === 0 ? 3 : 0), y);
  drawS(s, E.r - s.w + 8 + j - (dir === 2 ? 3 : 0), y, 1);
}
// the glass of the globe shows in the margins: a pale gleam top left, a cyan shade bottom right
function drawGlass() {
  const E = screenEdges(), h = E.b - E.t;
  if (SCR.ox >= 8) {
    rect(E.l + 3, E.t + 16, 1, Math.round(h * 0.35), 'w'); rect(E.l + 5, E.t + 24, 1, Math.round(h * 0.18), 'C');
    rect(E.r - 4, E.b - 16 - Math.round(h * 0.3), 1, Math.round(h * 0.3), 'c');
  }
  if (SCR.oy >= 8) rect(E.l + 20, E.t + 3, Math.round((E.r - E.l) * 0.25), 1, 'w');
}

LAND_MECH.snow = {
  build(room) {
    if (room.type === 'rink') { stampLayout(room.tiles, RINK_LAYOUT, false, false, null); return; }
    room.pit0 = new Set();
    for (let i = 0; i < room.tiles.length; i++) if (room.tiles[i] === T_PIT) room.pit0.add(i);
  },
  // the shake carries heroes, foes, shots and bullets alike
  drift(room, x, y, out) {
    const d = shakePush(room);
    if (d < 0) return;
    const v = assistOn() ? SK_V * 0.6 : SK_V;
    out.cx += DIR4[d][0] * v; out.cy += DIR4[d][1] * v;
  },
  // snowdrifts slow walkers (level.js moveBox)
  slow(room, e) {
    if (e.sboots) return 1;
    const i = Math.floor((e.y - 1 - OY) / 16) * COLS + Math.floor(e.x / 16);
    return driftAtTile(room, i % COLS, (i / COLS) | 0) > 0.3 ? DRIFT_SLOW : 1;
  },
  // host / solo: shots freeze the ponds, bridges melt, a Frost Fairy now and then
  update(dt, room) {
    if (room.type === 'rink') { rinkUpdate(room); return; }
    if (room.pit0 && room.pit0.size) for (const s of SHOTS) {
      if (s.life <= 0 || s.ret) continue;
      const i = cellAt(s.x, s.y + 5);
      if (room.tiles[i] === T_PIT && room.pit0.has(i)) freeze(room, i, T_PIT);
    }
    meltAll(room, dt);
    if (room.fairy === undefined) room.fairy = room.type === 'normal' && !room.cleared && !G.first && grand() < 0.2 ? grnd(4, 8) : 0;
    if (room.fairy > 0 && G.enemies.length && (room.fairy -= dt) <= 0) {
      room.fairy = 0;
      spawnEnemy('fairy', grand() < 0.5 ? 40 : VW - 40, OY + 50, { elite: true });
      toast('A FROST FAIRY! THE FLOOR TURNS TO ICE!');
    }
  },
  every(dt, room) {
    if (room.in === undefined) room.in = skyNow();
    const td = shakeTell(room), pd = shakePush(room);
    if (td >= 0 && !room.skOn) {
      room.skOn = true; Audio_.local('charge');
      if (NET.role !== 'client' && !Save.flags.globeTip) { Save.flags.globeTip = true; Save.write(); toast('THE GLOBE IS SHAKING! HOLD ON!'); }
    }
    if (pd >= 0 && !room.skPush) { room.skPush = true; Audio_.local('swish'); G.shake = Math.max(G.shake, 3); }
    if (td < 0 && pd < 0) room.skOn = room.skPush = false;
    // the snow swirls with the shake
    const d = pd >= 0 ? pd : td;
    if (d >= 0) for (let n = pd >= 0 ? 3 : 1; n--;) part(rnd(16, VW - 16), rnd(OY + 32, OY + 190), DIR4[d][0] * rnd(60, 160) + rnd(-20, 20), DIR4[d][1] * rnd(60, 160) + rnd(-20, 20), rnd(0.3, 0.6), pick(['w', 'w', 'C']), { drag: 1 });
  },
  drawLayer(ox, oy, room, layer) {
    if (layer === 0) {
      // ice bridges: a white flash when they form, cracks blinking before they melt
      if (room.pit0 && room.tAt) for (const i of room.pit0) {
        if (room.tiles[i] !== T_ICE) continue;
        const a = frozeAge(room, i), x = ox + (i % COLS) * 16, y = oy + OY + ((i / COLS) | 0) * 16;
        if (a < 0.15) { rect(x + 1, y + 1, 14, 14, 'w'); continue; }
        if (a > FREEZE_T - 2 && Math.floor(a * (a > FREEZE_T - 0.7 ? 12 : 5)) % 2) {
          rect(x + 3, y + 4, 4, 1, 'c'); rect(x + 7, y + 5, 3, 1, 'c'); rect(x + 9, y + 6, 1, 3, 'c'); rect(x + 5, y + 10, 5, 1, 'B');
        }
      }
      if (room.type === 'rink') rinkDraw(ox, oy, room);
      const g = globe(room);
      if (g && g.u >= SK_TELL + SK_PUSH) for (let r = 2; r <= 11; r++) for (let c = 1; c <= 22; c++) {
        const h = driftAtTile(room, c, r);
        if (h > 0 && (h > 0.2 || Math.floor(G.time * 10) % 2)) drawDrift(ox + c * 16, oy + OY + r * 16, h);
      }
      return;
    }
    if (layer !== 2) return;
    drawGlass();
    const td = shakeTell(room);
    if (td >= 0) {
      drawMittens(td, G.time);
      if (Math.floor(G.time * 8) % 2) for (let k = 0; k < 5; k++) {
        const t = (k + 0.5) / 5, x = td % 2 ? 48 + t * (VW - 96) : 192 + (td === 0 ? 1 : -1) * (t * 120 - 60);
        const y = td % 2 ? OY + 112 + (td === 1 ? 1 : -1) * (t * 60 - 30) : OY + 60 + t * 110;
        chev(ox + Math.round(x), oy + Math.round(y), td + 1, 'c');
      }
    } else if (shakePush(room) >= 0) drawMittens(shakePush(room), G.time * 2);
  },
};

// the globe's own items
Object.assign(ITEMS, {
  skates: { name: 'SKATES', desc: 'SPEED AND GRIP ON ICE', land: 'snow', unique: true, apply: p => { p.skates = true; } },
  sboots: { name: 'SNOW BOOTS', desc: 'SNOWDRIFTS DO NOT SLOW YOU', land: 'snow', unique: true, apply: p => { p.sboots = true; } },
  scarf: { name: 'WOOLLY SCARF', desc: '+1 HEART, NICE AND WARM', land: 'snow', apply: p => { p.maxHp = Math.min(20, p.maxHp + 2); p.hp = Math.min(p.maxHp, p.hp + 2); } },
});

// ---------- Rooms ----------
LAND_LAYOUTS.snow = {
  // Frozen Pond: a round pond with an ice rim (shoot it to walk across)
  fpond: `......................
    ..e................e..
    ......iiiiiiiiii......
    .....ii~~~~~~~~ii.....
    ..e..i~~~~~~~~~~i..e..
    .....i~~~~~~~~~~i.....
    .....ii~~~~~~~~ii.....
    ......iiiiiiiiii......
    ..e................e..
    ......................`,
  // Snowman Village: huts and presents
  village: `......................
    ..e.......ee.......e..
    ...##..b......b..##...
    ...##............##...
    .......e..##..e.......
    ......b...##...b......
    ...##............##...
    ...##..b......b..##...
    ..e.......ee.......e..
    ......................`,
  // Ice Maze: slippery corridors between walls of packed snow
  smaze: `......................
    .e.iiiiiiiiiiiiiiii.e.
    ...i#####iiii#####i...
    ..iiiiii#iiii#iiiiii..
    .e.i##iii.ee.iii##i.e.
    ...i##iii....iii##i...
    ..iiiiii#iiii#iiiiii..
    ...i#####iiii#####i...
    .e.iiiiiiiiiiiiiiii.e.
    ......................`,
  // Igloo Ring: a ring of snow blocks with four ways in
  igloo: `......................
    ..e.......ee.......e..
    .......###..###.......
    ......#........#......
    ..e...#..e..e..#...e..
    ..........ii..........
    ......#........#......
    .......###..###.......
    ..e.......ee.......e..
    ......................`,
  // Bridge Builder: two streams to cross (the long way round, or over the ice you shoot)
  ibridge: `......~~......~~......
    ..e...~~..ee..~~...e..
    ......~~......~~......
    ......~~......~~......
    ..e................e..
    ......................
    ......~~......~~......
    ......~~......~~......
    ..e...~~..ee..~~...e..
    ......~~......~~......`,
  // Slalom: an ice slope with flag posts
  slalom: `......................
    ..e.......ee.......e..
    ..iiiiiiiiiiiiiiiiii..
    ..ii#iiiiii#iiiiii#i..
    ..iiiiii#iiiiii#iiii..
    ..ii#iiiiii#iiiiii#i..
    ..iiiiii#iiiiii#iiii..
    ..iiiiiiiiiiiiiiiiii..
    ..e.......ee.......e..
    ......................`,
};
for (const k in LAND_LAYOUTS.snow) LAND_LAYOUTS.snow[k] = LAND_LAYOUTS.snow[k].split('\n').map(r => r.trim());
Object.assign(LAY_RULE, {
  fpond: { pool: [['penguin', 3], ['icebat', 2], ['snowman', 1]] },
  village: { pool: [['snowman', 3], ['bauble', 2], ['hare', 1]] },
  slalom: { pool: [['penguin', 3], ['hare', 2]] },
  smaze: { pool: [['penguin', 2], ['bauble', 2], ['icebat', 1]] },
});
// the Skating Rink: ice wall to wall round a few posts
const RINK_LAYOUT = `......................
  .iiiiiiiiiiiiiiiiiiii.
  .ii#iiiiiiiiiiiiii#ii.
  .iiiiiiiiiiiiiiiiiiii.
  .iiiii#iiiiiiii#iiiii.
  .iiiii#iiiiiiii#iiiii.
  .iiiiiiiiiiiiiiiiiiii.
  .ii#iiiiiiiiiiiiii#ii.
  .iiiiiiiiiiiiiiiiiiii.
  ......................`.split('\n').map(r => r.trim());

// ---------- Art ----------
(function snowArt() {
  const o = { flip: true, flash: true, glow: true };
  const man = (head) => `
    ${head ? '.....bbbb.....' : '..............'}
    ${head ? '.....bBBb.....' : '..............'}
    ${head ? '....bbbbbb....' : '..............'}
    ${head ? '....wwwwwC....' : '..............'}
    ${head ? '...wwwwwwwC...' : '..............'}
    ${head ? '...w0ww0wwC...' : '..............'}
    ${head ? '...wwwoooCc...' : '..............'}
    ....wwwwCc....
    ...rrrrrrRR...
    n.wRrwwwwCCc.n
    .nwwwwwwwwCCn.
    .ww0wwwwwwCCc.
    .wwwwwwwwwCCc.
    .www0wwwwCCcc.
    ..wwwwwwCCcc..
    ...ccCCCcccc..`;
  SN('snowman_0', man(true), o);
  SN('snowman_1', man(false), o);
  SN('penguin_0', `
    ...bbbb...
    ..bBBBbb..
    ..bwwwwb..
    ..w0ww0w..
    ..wwooww..
    .bbwwwwbb.
    b.bwwwwb.b
    ..bwwwwb..
    ..bbwwbb..
    ...oo.oo..`, o);
  SN('penguin_1', `
    ...bbbb...
    ..bBBBbb..
    ..bwwwwb..
    ..w0ww0w..
    ..wwooww..
    .bbwwwwbb.
    .bbwwwwbb.
    ..bwwwwb..
    ..bbwwbb..
    ..oo..oo..`, o);
  SN('penguin_s', `
    .....bbbbb......
    ..bbbbbbBBb.....
    .bbbbbbbbbbbw0..
    bbwwwwwwwwwbbwoo
    .wwwwwwwwwwwwbb.
    ..oo............`, o);
  SN('icebat_0', `
    .c......c.
    .cc....cc.
    .cBBBBBBc.
    cBBwBBwBBc
    cBB0BB0BBc
    cBBBwwBBBc
    .cBBBBBBc.
    ..cBBBBc..
    ...c..c...`, o);
  SN('icebat_1', `
    Cc...c....c...cC
    cCc..cc..cc..cCc
    .cCcBBBBBBBBcCc.
    ..ccBwBBBBwBcc..
    ...cB0BBBB0Bc...
    ....BBBwwBBB....
    .....BBBBBB.....
    ......c..c......`, o);
  SN('hare_0', `
    ..w...w....
    ..wq..wq...
    ..wq..wq...
    ..wwwwww...
    .wwww0w0w..
    .wwwwwwqw..
    ..wwwwww...
    .wwwwwwwwC.
    wwwwwwwwwCC
    wwwwwwwwwCC
    .wwwwwwwCC.
    ..w.w..w.w.`, o);
  SN('hare_1', `
    ...w...w...
    ...wq..wq..
    ...wq..wq..
    ..wwwwww...
    .wwww0w0w..
    .wwwwwwqw..
    ..wwwwww...
    .wwwwwwwwC.
    wwwwwwwwwCC
    .wwwwwwwCC.
    w.w....w.w.`, o);
  SN('hmound_0', `
    ....www.....
    ..wwwwwCC...
    .wwwwwwCCc..`);
  SN('hmound_1', `
    ...wwww.....
    ..wwwwwwC...
    .wwwwwwCCc..`);
  for (let i = 0; i < 3; i++) def('bauble_' + i, stamp(stamp(sculpt(12, 14, [{ r: [4, 1, 4, 3, 0.5], ramp: 'noyY' }, { e: [6, 8.5, 4.5, 4.5], ramp: 'prRq' }]), [3, 5, 6][i], [8, 6, 9][i], ['Y.\n.Y', 'YY\n..', '.Y\nY.'][i]), 4, 6, 'w'), o);
  SN('fairy_0', `
    .ww..yy..ww.
    wCCw.ss.wCCw
    wCCCw00wCCCw
    .wCCssssCCw.
    ..wwBBBBww..
    ....BBBB....
    ....BccB....
    .....BB.....`, o);
  SN('fairy_1', `
    ......yy....
    .www..ss.www
    wCCCww00wCCC
    .wCCssssCCw.
    ..wwBBBBww..
    ....BBBB....
    ....BccB....
    .....BB.....`, o);
  // what falls from the sky: a snowball and an icicle
  def('snowball', sculpt(12, 12, [{ e: [6, 6.5, 4.5, 4.5], ramp: 'cCww' }]));
  SN('icicle', `
    wwCCc
    wCCc.
    wCCc.
    .wCc.
    .wCc.
    .wc..
    ..c..`);
  // the mitten that shakes the globe (drawn at the left edge; flipped for the right)
  def('mitten', stamp(stamp(sculpt(28, 30, [
    { e: [21, 8, 4, 5.5], ramp: 'prRq' },
    { e: [15, 16, 10.5, 10], ramp: 'prRq' },
    { r: [1, 6, 8, 20, 2], ramp: 'lLww' },
  ]), 13, 13, '.w.\nwyw\n.w.'), 2, 9, 'C\n.\nC\n.\nC\n.\nC'), { flip: true });
  // the rink's sign and its flags
  SN('rsign', `
    eeeeeeeeeeeeee
    eNNNNNNNNNNNNn
    eNNNNwNNwNNNNn
    eNNNNNwwNNNNNn
    eNNNwwCCwwNNNn
    eNNNNNwwNNNNNn
    eNNNNwNNwNNNNn
    eNNNNNNNNNNNNn
    nnnnnnnnnnnnnn
    .....eN.......
    .....eN.......
    .....eN.......
    ....eeNN......`);
  SN('rflag', `
    eBB..
    eBBBw
    eBB..
    e....
    e....
    e....
    e....
    en...`);
  // item icons
  SN('icon_skates', `
    ..wwww........
    ..wLLl........
    ..wLLl........
    ..wLLlll......
    ..wLLLLLll....
    ..wLLLLLLLl...
    ..rrrrrrrrr...
    ...m.....m....
    .LLLLLLLLLLl..`, { sil: '1' });
  SN('icon_sboots', `
    ...wwwww......
    ...wLwLw......
    ...eNNNN......
    ...eNNNN......
    ...eNNNN......
    ...eNNNNNNN...
    ...eNNNNNNNNn.
    ...eNNNNNNNNn.
    ...nnnnnnnnnn.`, { sil: '1' });
  SN('icon_scarf', `
    ..rrrrrrrrrr..
    .rRwRRwRRwRRr.
    .rR........Rr.
    ..rr......rRr.
    ..........rRr.
    ..........wwr.
    ..........rRr.
    ..........rRr.
    ..........wwr.
    .........r.r.r`, { sil: '1' });
  // bullets: snowballs, the Yeti's big ones, ice shards and bauble glitter
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  const B = {
    snow: [['.ww.', 'wwwC', 'wwCc', '.Cc.'], ['..ww..', '.wwwC.', 'wwwwCc', 'wwwCCc', '.wCCc.', '..cc..']],
    yball: [['.wC.', 'wCCB', 'CCBB', '.BB.'], ['..wC..', '.wwCC.', 'wwCCCB', 'wCCCBB', '.CCBB.', '..BB..']],
    ice: [['..w.', '.wCc', 'wCc.', '.c..'], ['...w..', '..wCc.', '.wCCc.', '.CCc..', '.cc...']],
    glit: [['.Y.', 'YqP', '.P.'], ['..Y..', '.YyP.', 'YyqPp', '.PPp.', '..p..']],
  };
  for (const k in B) {
    def('eb_' + k, pad(B[k][0])); def('ebb_' + k, pad(B[k][1]));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
})();

// ---------- Foes ----------
Object.assign(EDEF, {
  // stands still and lobs snowballs (a ring shows where); at half health its head falls off and it throws faster
  snowman: { hp: 12, r: 7, h: 18, hw: 6, hh: 4, sw: 14, still: true, colors: ['w', 'C', 'r'],
    sprite: (e) => S(e.bald ? 'snowman_1' : 'snowman_0'),
    glint: (e) => (e.state === 'wind' ? [0, e.bald ? -12 : -20] : null) },
  // waddles, then aims (a cyan lane) and belly-slides down it; a hit mid-slide sends it back
  penguin: { hp: 8, r: 6, h: 11, hw: 5, hh: 3, sw: 12, colors: ['b', 'w', 'o'],
    sprite: (e) => S(e.state === 'slide' ? 'penguin_s' : e.state === 'waddle' ? 'penguin_' + (Math.floor(e.anim * 6) % 2) : 'penguin_0') },
  // hangs under the top wall and drops on a hero passing below (a glint first)
  icebat: { hp: 5, r: 6, h: 10, hw: 5, hh: 3, sw: 12, fly: true, colors: ['B', 'c', 'C'],
    sprite: (e) => S(e.state === 'hang' || e.state === 'tell' ? 'icebat_0' : 'icebat_' + (Math.floor(e.anim * 8) % 2)),
    glint: (e) => (e.state === 'tell' ? [0, -6] : null) },
  // hops about, burrows (a moving mound, safe from shots) and pops up inside a pink ring
  hare: { hp: 7, r: 6, h: 12, hw: 5, hh: 3, sw: 12, colors: ['w', 'q', 'C'],
    sprite: (e) => S('hare_' + (e.state === 'hop' ? Math.floor(e.anim * 5) % 2 : 0)),
    draw: (e, ox, oy) => {
      if (e.state !== 'dig' && e.state !== 'pop') return false;
      drawFeet(S('hmound_' + (Math.floor(e.anim * 6) % 2)), ox + e.x, oy + e.y + 1);
      return true;
    },
    hits: (e, p) => e.state === 'out' && e.t > 1 && Math.hypot(p.x - e.x, (p.y - e.y) * 1.4) < 14 },
  // a glass bauble that rolls and bounces; broken, it bursts into glitter (a gap toward you)
  bauble: { hp: 6, r: 5, h: 12, hw: 4, hh: 3, sw: 10, colors: ['r', 'y', 'q'],
    sprite: (e) => S('bauble_' + (Math.floor(e.anim * 8) % 3)),
    die: (e) => {
      const q = nearestHero(e.x, e.y), a = q ? Math.atan2(q.y - e.y, q.x - e.x) : 0;
      E_SRC = 'bauble';
      for (let i = 0; i < 10; i++) { const b = a + (i + 0.5) * Math.PI / 5; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.6) ebullet(e.x, e.y - 6, b, 58, 'glit'); }
      Audio_.sfx('pop');
    } },
  // an elite that flutters in: the tile under a hero rings pink, then turns to ice
  fairy: { hp: 12, r: 6, h: 10, hw: 4, hh: 3, sw: 10, fly: true, colors: ['C', 'w', 'y'],
    sprite: (e) => S('fairy_' + (Math.floor(e.anim * 10) % 2)),
    glint: (e) => (e.fz && e.fz.shot ? [0, -12] : null) },
});
Object.assign(FOE_NAMES, { snowman: 'SNOWMAN', penguin: 'SLIDING PENGUIN', icebat: 'ICICLE BAT', hare: 'SNOW HARE', bauble: 'BAUBLE', fairy: 'FROST FAIRY' });
EF_EXTRA.push('bald', 'sk');

Object.assign(AI, {
  snowman(e, dt, room, p) {
    e.t -= dt;
    if (!e.bald && e.hp < e.maxHp * 0.5) { e.bald = true; burst(e.x, e.y - 18, 10, ['w', 'C', 'o', 'b'], 80, 0.5, { g: 150 }); Audio_.sfx('brk'); }
    if (e.state === 'idle') { e.state = 'wait'; e.t = grnd(0.8, 1.8); }
    if (e.state === 'wait' && e.t <= 0 && p) { e.state = 'wind'; e.t = 0.5; }
    else if (e.state === 'wind' && e.t <= 0) {
      const tg = nearestHero(e.x, e.y) || p;
      G.markers.push({ x: tg.x, y: tg.y, t: 1.1, max: 1.1, src: 'snowman', fall: 'snowball', n: 4 });
      Audio_.sfx('swish');
      e.state = 'wait'; e.t = e.bald ? 1.6 : 2.4;
    }
  },
  penguin(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'waddle'; e.t = grnd(0.8, 1.4); }
    if (e.state === 'waddle') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 30 * dt, d.y * 30 * dt, 'enemy'); e.flip = d.x < 0;
      if (e.t <= 0 && p) { e.state = 'aim'; e.t = 0.6; lane(e, p, 220); }
    } else if (e.state === 'aim') {
      if (e.t <= 0) { e.state = 'slide'; e.t = 1.5; e.vx = Math.cos(e.la) * 150; e.vy = Math.sin(e.la) * 150; e.hA = e.hurtAt; e.flip = e.vx < 0; Audio_.sfx('swish'); }
    } else if (e.state === 'slide') {
      if (e.hurtAt !== e.hA) { e.hA = e.hurtAt; if (G.time - (e.rd || -9) > 0.3) { e.rd = G.time; e.vx = -e.vx; e.vy = -e.vy; e.flip = e.vx < 0; } }
      if (Math.random() < 0.4) part(e.x, e.y, 0, 0, 0.3, 'w');
      if (moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy') || e.t <= 0) { e.state = 'rest'; e.t = 0.8; dust(e.x, e.y, 3, 10); }
    } else if (e.state === 'rest' && e.t <= 0) { e.state = 'waddle'; e.t = grnd(0.8, 1.4); }
  },
  icebat(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') e.state = 'rise';
    if (e.state === 'rise') {
      if (moveBox(room, e, 0, -70 * dt, 'fly') || e.y <= OY + 42) { e.state = 'hang'; e.t = 0.8; e.vx = e.vy = 0; }
    } else if (e.state === 'hang') {
      if (p) moveBox(room, e, Math.sign(p.x - e.x) * 14 * dt, 0, 'fly');
      if (e.t <= 0) for (const q of G.players) if (alive(q) && Math.abs(q.x - e.x) < 18 && q.y > e.y + 20) { e.state = 'tell'; e.t = 0.5; e.ty = q.y; break; }
    } else if (e.state === 'tell') {
      if (e.t <= 0) { e.state = 'dive'; Audio_.sfx('swish'); }
    } else if (e.state === 'dive') {
      if (moveBox(room, e, 0, 170 * dt, 'fly') || e.y >= e.ty) { e.state = 'flap'; e.t = 2.5; }
    } else if (e.state === 'flap') {
      if (p) hoverNear(e, dt, room, p, 45);
      moveBox(room, e, e.vx * dt, e.vy * dt, 'fly'); e.flip = e.vx < 0;
      if (e.t <= 0) e.state = 'rise';
    }
  },
  hare(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'hop'; e.t = grnd(0.8, 1.2); e.a = grand() * 6.3; }
    if (e.state === 'hop') {
      if (moveBox(room, e, Math.cos(e.a) * 60 * dt, Math.sin(e.a) * 60 * dt, 'enemy')) e.a += Math.PI / 2;
      e.flip = Math.cos(e.a) < 0;
      if (e.t <= 0) { e.state = 'dig'; e.t = grnd(1.2, 1.8); e.ghost = true; dust(e.x, e.y, 5, 12); }
    } else if (e.state === 'dig') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 70 * dt, d.y * 70 * dt, 'enemy');
      if (Math.random() < 0.3) part(e.x + rnd(-4, 4), e.y - 2, rnd(-20, 20), -30, 0.3, 'w', { g: 120 });
      if (e.t <= 0 || (p && Math.hypot(p.x - e.x, p.y - e.y) < 22)) { e.state = 'pop'; e.t = 0.7; G.markers.push({ kind: 'zone', x: e.x, y: e.y, r: 14, t: 0.7, max: 0.7 }); }
    } else if (e.state === 'pop') {
      if (e.t <= 0) {
        e.state = 'out'; e.t = 1.2; e.ghost = false;
        dust(e.x, e.y, 8, 16); Audio_.sfx('brk');
        for (const q of G.players) if (alive(q) && EDEF.hare.hits(e, q)) hurtPlayer(q, 1, 'hare');
        ring(e.x, e.y - 6, 6, 55, 'snow', grand());
      }
    } else if (e.state === 'out' && e.t <= 0) { e.state = 'hop'; e.t = grnd(0.8, 1.2); e.a = grand() * 6.3; }
  },
  bauble(e, dt, room) {
    if (e.state === 'idle') { e.state = 'roll'; const a = (grand() * 4 | 0) * Math.PI / 2 + Math.PI / 4; e.vx = Math.cos(a) * 52; e.vy = Math.sin(a) * 52; }
    if (moveBox(room, e, e.vx * dt, 0, 'enemy')) e.vx = -e.vx;
    if (moveBox(room, e, 0, e.vy * dt, 'enemy')) e.vy = -e.vy;
    e.flip = e.vx < 0;
  },
  fairy(e, dt, room, p) {
    if (!p) return;
    hoverNear(e, dt, room, p, 50);
    moveBox(room, e, e.vx * dt, e.vy * dt, 'fly'); e.flip = e.vx < 0;
    if (e.fz) {
      if ((e.fz.t -= dt) > 0) return;
      if (room.tiles[e.fz.i] === T_FLOOR) freeze(room, e.fz.i, T_FLOOR);
      if (e.fz.shot) { const tg = nearestHero(e.x, e.y) || p; fan(e.x, e.y - 8, Math.atan2(tg.y - 7 - (e.y - 8), tg.x - e.x), 3, 0.3, 60, 'ice'); Audio_.sfx('eshoot'); }
      e.fz = null; e.fc = 1.2;
    } else if ((e.fc = (e.fc ?? 1.5) - dt) <= 0) {
      const tg = nearestHero(e.x, e.y) || p, i = cellAt(tg.x, tg.y);
      e.fc = 1.2;
      if (room.tiles[i] !== T_FLOOR) return;
      G.markers.push({ kind: 'zone', x: (i % COLS) * 16 + 8, y: OY + ((i / COLS) | 0) * 16 + 10, r: 9, t: 0.8, max: 0.8 });
      e.fz = { i, t: 0.8, shot: (e.fn = (e.fn || 0) + 1) % 2 === 0 };
      Audio_.sfx('tele');
    }
  },
});
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'snowman', spr: 'snowman_0', lore: ['IT NEVER MOVES. IT THROWS.', 'A RING SHOWS WHERE THE SNOWBALL LANDS.', 'KNOCK ITS HEAD OFF AND IT GETS CROSS.'] },
  { t: 'penguin', spr: 'penguin_0', lore: ['IT AIMS, THEN SLIDES ON ITS BELLY.', 'STEP OFF THE CYAN LANE.', 'HIT IT MID-SLIDE AND IT TURNS BACK.'] },
  { t: 'icebat', spr: 'icebat_0', lore: ['IT HANGS UNDER THE WALL LIKE AN ICICLE.', 'WALK BELOW IT AND IT DROPS.', 'IT GLINTS FIRST.'] },
  { t: 'hare', spr: 'hare_0', lore: ['A SNOW HARE THAT DIGS.', 'WHILE IT IS UNDER, SHOTS MISS.', 'IT POPS UP INSIDE A PINK RING.'] },
  { t: 'bauble', spr: 'bauble_0', lore: ['A GLASS BAUBLE THAT ROLLS.', 'BREAK IT AND IT BURSTS INTO GLITTER.', 'THE GLITTER LEAVES A GAP TOWARD YOU.'] },
  { t: 'fairy', spr: 'fairy_0', lore: ['A FROST FAIRY FLUTTERS IN.', 'WHERE SHE LOOKS, THE FLOOR FREEZES.', 'THE PINK RING COMES FIRST.'] },
);

// ---------- The Sled Cub (warden of the Snowglobe) ----------
// A polar bear cub on a red sled. It pushes off to the end of a lane, aims (a cyan lane across
// the room) and sleds down it, leaving a trail of ice; at the far wall it crashes, snow drops
// from the sky round the heroes (rings first) and it flings snowballs (glint first). Every third
// run it tumbles off its sled, dazed. Phase 2: it sleds straight back after each crash.
(function cubArt() {
  const o = { flash: true, flip: true };
  const MOUTH = { calm: '0.0\n.0.', squint: '000', mad: '000\n0w0', daze: '0.0', dead: '000' };
  const cub = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, sx = f.a ? 2 : f.m ? 1 : 0;
    let r = sculpt(40, 32, [
      { e: [17 + sx, 15 + dy, 9, 7], ramp: 'cCww' },
      { e: [27 + sx, 10 + dy, 6.5, 5.5], ramp: 'cCww' },
      { e: [23 + sx, 4.5 + dy, 2.2, 2.2], ramp: 'cCww' }, { e: [31 + sx, 4.5 + dy, 2.2, 2.2], ramp: 'cCww' },
      { r: [4, 18, 31, 9, 2], ramp: f.p ? 'prRq' : 'prRq' },
      { r: [2, 27, 36, 3, 1], ramp: 'noyY' },
    ]);
    r = stamp(r, 7, 21, 'w.w.w.w.w.w.w.w.w.w.w.w');
    r = stamp(r, 36, 23, 'y\ny\ny');
    r = autoOutline(r);
    r = bossEyes(r, 23 + sx, 7 + dy, 5, f.face);
    r = stamp(r, 31 + sx, 12 + dy, '00');
    r = stamp(r, 27 + sx, 13 + dy, MOUTH[f.face]);
    return rim(r, { w: 'C', R: 'r' });
  };
  bossFrames('cub', cub, o);
})();
Object.assign(EDEF, {
  cub: { hp: 280, r: 10, h: 24, hw: 11, hh: 5, sw: 34, warden: true, intro: 'IT ONLY WANTS TO PLAY', colors: ['w', 'r', 'C'],
    init: (e) => { e.state = 'wait'; e.t = 1; e.n = 0; },
    sprite: (e) => bossFrame(e, e.state === 'dash' ? 'atk' : e.state === 'rev' || e.state === 'crash' ? 'tell' : e.state === 'scurry' ? bob(e, 8, 'move', '0') : bob(e, 2, '0', '1')),
    glint: (e) => (e.state === 'crash' ? [e.flip ? -14 : 14, -22] : null) },
});
FOE_NAMES.cub = 'SLED CUB';
WARDENS.snow = 'cub';
AI.cub = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  if (e.state === 'wait') { if (e.t <= 0) mouseLane(e, p); }
  else if (e.state === 'scurry') {
    const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
    if (d > 3 && e.t > 0) { moveBox(room, e, dx / d * 80 * dt, dy / d * 80 * dt, 'enemy'); if (Math.abs(dx) > 2) e.flip = dx < 0; }
    else mouseRev(e);
  } else if (e.state === 'rev') {
    if (Math.random() < 0.3) dust(e.x + (e.flip ? 12 : -12), e.y, 1, 4);
    if (e.t <= 0) { e.state = 'dash'; e.vx = (e.flip ? -1 : 1) * (e.p2 ? 185 : 160); Audio_.sfx('swish'); }
  } else if (e.state === 'dash') {
    const bl = moveBox(room, e, e.vx * dt, 0, 'enemy');
    // a trail of ice behind the sled
    const i = cellAt(e.x - Math.sign(e.vx) * 14, e.y);
    if (room.tiles[i] === T_FLOOR) freeze(room, i, T_FLOOR);
    if (bl || (e.vx < 0 ? e.x < 36 : e.x > VW - 36)) {
      e.state = 'crash'; e.t = 0.6; G.shake = Math.max(G.shake, 3); Audio_.sfx('land'); dust(e.x, e.y, 8, 20);
      // the crash shakes snow off the sky
      const hs = G.players.filter(alive);
      for (let k = 0; k < (e.p2 ? 4 : 3); k++) {
        const q = hs[k % Math.max(1, hs.length)] || p, x = k ? q.x + grnd(-48, 48) : q.x, y = k ? q.y + grnd(-36, 36) : q.y;
        G.markers.push({ x: Math.max(28, Math.min(VW - 28, x)), y: Math.max(OY + 44, Math.min(OY + 186, y)), t: 1.1 + k * 0.12, max: 1.1 + k * 0.12, src: 'cub', fall: 'snowball', n: 0 });
      }
    }
  } else if (e.state === 'crash' && e.t <= 0) {
    const tg = nearestHero(e.x, e.y) || p, x = e.x + (e.flip ? -14 : 14), y = e.y - 18;
    if (tg) fan(x, y, Math.atan2(tg.y - 7 - y, tg.x - x), e.p2 ? 5 : 3, 0.26, 78, 'snow');
    Audio_.sfx('eshoot');
    if (e.p2 && !e.back) { e.back = true; mouseRev(e); return; }
    e.back = false;
    if (++e.n % 3 === 0) { stagger(e, 2); toast('IT TUMBLES OFF ITS SLED!'); e.state = 'wait'; e.t = 0.2; }
    else mouseLane(e, p);
  }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'cub', spr: 'cub_0', lore: ['THE WARDEN OF THE SNOWGLOBE.', 'IT SLEDS DOWN THE CYAN LANES.', 'EVERY THIRD RUN IT FALLS OFF.'] });

// ---------- Yeti Yodel (boss of the Snowglobe) ----------
// A big, round, cheerful yeti with little blue horns. He lobs snowballs (rings show where) and
// pounds the ground (a pink ring round him, then a ring of snow with a gap), after which he
// catches his breath. Phase 2: avalanches (cyan lanes from the top wall, then snowballs roll down
// them). Phase 3: he yodels three rings with a gap that wanders, then shakes the globe himself
// (mittens and arrows first) and slips on the snow, dazed.
(function yetiArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0...0\n.000.', squint: '00000\n0qqq0\n.000.', mad: '00000\n0wqw0\n00000', daze: '.0.0.\n0.0.0', dead: '00000' };
  const yeti = (f) => {
    const dy = f.d ? 5 : f.st ? 2 : f.tl ? 1 : 0, ar = f.a ? -6 : f.tl ? -2 : f.m ? 1 : 0, b = f.b ? 1 : 0;
    let r = sculpt(40, 32, [
      { e: [6, 17 + dy + ar, 5, 7], ramp: 'cCww' }, { e: [34, 17 + dy + ar, 5, 7], ramp: 'cCww' },
      { e: [13, 29, 5, 3], ramp: 'cCww' }, { e: [27, 29, 5, 3], ramp: 'cCww' },
      { e: [20, 18 + dy + b * 0.5, 14, 11 - b * 0.5], ramp: 'cCww' },
      { e: [20, 12 + dy, 8, 5.5], ramp: f.p ? 'BcCw' : 'bBcC' },
      { e: [11, 7 + dy, 2, 3.5], ramp: 'bBcC' }, { e: [29, 7 + dy, 2, 3.5], ramp: 'bBcC' },
    ]);
    r = stamp(r, 12, 23 + dy, 'w.w...w.w\n.w.....w.');
    r = autoOutline(r);
    r = bossEyes(r, 15, 8 + dy, 6, f.face);
    r = stamp(r, 18, 13 + dy, f.a ? '.000.\n0qqq0\n0qqq0\n.000.' : MOUTH[f.face]);
    return rim(r, { w: 'C', C: 'c' });
  };
  bossFrames('yeti', yeti, o);
})();
Object.assign(EDEF, {
  yeti: { hp: 480, r: 12, h: 30, hw: 12, hh: 7, sw: 36, boss: true, intro: 'HE SINGS. THE MOUNTAIN LISTENS.', phases: [0.66, 0.33], colors: ['w', 'C', 'B'],
    init: (e) => { e.n = 0; e.sk = 0; },
    sprite: (e) => bossFrame(e, { lob: 'tell', raise: 'tell', aval: 'tell', shake: 'tell', yodel: 'tell', sing: 'atk', slam: 'atk', walk: bob(e, 4, 'move', '0') }[e.state] || bob(e, 1.5, 1, 0)),
    glint: (e) => (e.state === 'lob' || e.state === 'yodel' ? [0, -32] : null),
    hits: (e, p) => e.state === 'slam' && e.t > 0.15 && Math.hypot(p.x - e.x, (p.y - e.y) / 0.6) < 36 },
});
FOE_NAMES.yeti = 'YETI YODEL';
AI.yeti = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'yeti';
  if (e.hp < e.maxHp * 0.66) bossPhase(e, 2);
  if (e.hp < e.maxHp * 0.33) bossPhase(e, 3);
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'walk'; e.t = 1; } return; }
  if (!p) return;
  if (e.state === 'walk') {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (d > 64) moveBox(room, e, dx / d * 34 * dt, dy / d * 34 * dt, 'enemy');
    e.flip = dx < 0;
    if (e.t > 0) return;
    const C = e.phase >= 3 ? ['yodel', 'lob', 'shake'] : e.p2 ? ['lob', 'aval', 'pound'] : ['lob', 'pound'], m = C[e.n++ % C.length];
    if (m === 'lob') { e.state = 'lob'; e.t = 0.6; }
    else if (m === 'pound') { e.state = 'raise'; e.t = 0.9; G.markers.push({ kind: 'zone', x: e.x, y: e.y, r: 36, t: 0.9, max: 0.9 }); Audio_.sfx('charge'); }
    else if (m === 'aval') { e.state = 'aval'; e.t = 1; yetiLanes(e, p); Audio_.sfx('roar'); }
    else if (m === 'yodel') { e.state = 'yodel'; e.t = 0.7; }
    else { e.state = 'shake'; e.t = SK_TELL; e.sk = 1 + hash(e.n, 9, room.seed) % 4; Audio_.sfx('roar'); }
  } else if (e.state === 'lob') {
    if (e.t > 0) return;
    const hs = G.players.filter(alive);
    for (let k = 0; k < (e.p2 ? 3 : 2) + hs.length - 1; k++) {
      const q = hs[k % Math.max(1, hs.length)] || p, x = k < hs.length ? q.x : q.x + grnd(-64, 64), y = k < hs.length ? q.y : q.y + grnd(-44, 44);
      G.markers.push({ x: Math.max(28, Math.min(VW - 28, x)), y: Math.max(OY + 44, Math.min(OY + 186, y)), t: 1.1 + k * 0.15, max: 1.1 + k * 0.15, src: 'yeti', fall: 'snowball', n: 0 });
    }
    Audio_.sfx('swish');
    e.state = 'walk'; e.t = 1.6;
  } else if (e.state === 'raise') {
    if (e.t > 0) return;
    e.state = 'slam'; e.t = 0.3; G.shake = Math.max(G.shake, 5); Audio_.sfx('boom'); hapticAll('boom');
    dust(e.x, e.y, 10, 28);
    for (const q of G.players) if (alive(q) && EDEF.yeti.hits(e, q)) hurtPlayer(q, 1, 'yeti');
    const a = Math.atan2(p.y - e.y, p.x - e.x), n = 10;
    for (let i = 0; i < n; i++) { const b = a + (i + 0.5) * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.8) ebullet(e.x, e.y - 10, b, 62, 'yball', true); }
  } else if (e.state === 'slam') {
    if (e.t <= 0) { e.state = 'walk'; e.t = 1.2; stagger(e, 1.5); }
  } else if (e.state === 'aval') {
    if (e.t > 0) return;
    // snowballs roll down each lane, two to a lane
    for (const x of e.lx) for (let j = 0; j < 2; j++) ebullet(x, OY + 40, Math.PI / 2, 90 - j * 15, 'yball', true);
    G.shake = Math.max(G.shake, 3); Audio_.sfx('boom');
    e.state = 'walk'; e.t = 1.4;
  } else if (e.state === 'yodel') {
    if (e.t <= 0) { e.state = 'sing'; e.t = 0; e.w = 0; }
  } else if (e.state === 'sing') {
    if (e.t > 0) return;
    // three rings; each gap sits a little further round (the last ring shows which way)
    const a = Math.atan2(p.y - (e.y - 26), p.x - e.x) + e.w * 0.4, n = 14;
    for (let i = 0; i < n; i++) { const b = a + (i + 0.5) * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.5) ebullet(e.x, e.y - 26, b, 68, 'yball'); }
    Audio_.sfx('bell' + (e.w % 4));
    e.t = 0.55;
    if (++e.w >= 3) { e.state = 'walk'; e.t = 1.2; }
  } else if (e.state === 'shake') {
    if (e.t > 0) return;
    if (e.sk <= 4) { e.sk += 4; e.t = SK_PUSH + 0.2; }
    else { e.sk = 0; e.state = 'walk'; e.t = 0.4; dust(e.x, e.y, 8, 20); Audio_.sfx('land'); stagger(e, 2.5); toast('THE YETI SLIPPED!'); }
  }
};
// four avalanche lanes down from the top wall: one over the hero, the others spread out
function yetiLanes(e, p) {
  const xs = [Math.max(32, Math.min(VW - 32, Math.round(p.x)))];
  for (let tries = 0; xs.length < 4 && tries < 40; tries++) {
    const x = Math.round(grnd(32, VW - 32));
    if (xs.every(v => Math.abs(v - x) > 56)) xs.push(x);
  }
  e.lx = xs;
  for (const x of xs) G.markers.push({ kind: 'lane', x, y: OY + 30, a: Math.PI / 2, t: 1, max: 1, len: 170 });
}
BEASTS.push({ t: 'yeti', spr: 'yeti_0', boss: true, lore: ['THE BIG VOICE OF THE SNOWGLOBE.', 'RINGS SHOW WHERE HIS SNOWBALLS LAND.', 'WHEN HE SHAKES THE GLOBE, HE SLIPS.'] });

// ---------- The Frost Queen (the Snowglobe's other boss) ----------
// A tall ice queen in a blue gown and a crystal crown. She calls icicles down (rings first),
// glides down a cyan lane (leaving ice behind in phase 2), throws fans of ice shards (glint first), and every
// fourth move spins a spiral of shards (one arm, two in phase 2) and ends out of breath. Phase 2: more of everything.
(function queenArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000\n.00.', mad: '0000\n0PP0', daze: '.0.0\n0.0.', dead: '0000' };
  const queen = (f) => {
    const dy = f.d ? 5 : f.st ? 2 : f.tl ? 1 : 0;
    const arms = f.a ? [[5, 5 + dy, 3, 10], [24, 5 + dy, 3, 10]] : f.tl ? [[2, 13 + dy, 9, 3], [21, 13 + dy, 9, 3]] : [[8, 13 + dy, 4, 8], [20, 13 + dy, 4, 8]];
    let r = sculpt(32, 32, [
      ...arms.map(([x, y, w, h]) => ({ r: [x, y, w, h, 1], ramp: 'cCww' })),
      { e: [16, 25 + dy * 0.5, 12, 7 - dy * 0.5], ramp: f.p ? 'bBcP' : 'bBcC' },
      { r: [11, 12 + dy, 10, 11, 2], ramp: f.p ? 'bBcP' : 'bBcC' },
      { e: [16, 8 + dy, 5.5, 5], ramp: 'cCww' },
    ]);
    r = stamp(r, 6, 26, 'w...w...w...w...w...w');
    r = stamp(r, 12, 16 + dy, 'PPPPPPPP');
    r = autoOutline(r);
    r = stamp(r, 11, Math.max(0, dy - 1), 'w..w.w..w\nC..C.C..C\nCCCCCCCCC');
    r = bossEyes(r, 11, 6 + dy, 6, f.face);
    r = stamp(r, 14, 11 + dy, MOUTH[f.face]);
    return rim(r, { w: 'C', C: 'c', B: 'b' });
  };
  bossFrames('fqueen', queen, o);
})();
Object.assign(EDEF, {
  fqueen: { hp: 380, r: 10, h: 30, hw: 8, hh: 5, sw: 26, boss: true, intro: 'HERE, THE WINTER NEVER ENDS', colors: ['C', 'B', 'P'],
    init: (e) => { e.n = 0; },
    sprite: (e) => bossFrame(e, { call: 'tell', aim: 'tell', fan: 'tell', storm: 'tell', dash: 'atk', spin: 'atk' }[e.state] || bob(e, 1.5, 1, 0)),
    glint: (e) => (e.state === 'call' || e.state === 'fan' || e.state === 'storm' ? [0, -32] : null) },
});
FOE_NAMES.fqueen = 'FROST QUEEN';
LAND.snow.alt = ['fqueen'];
AI.fqueen = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'fqueen';
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  e.calm = e.state !== 'dash'; // she glides round heroes: only her dash (a cyan lane first) hurts by touch
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'idle'; e.t = 1; } return; }
  if (!p) return;
  if (e.state === 'idle') {
    hoverNear(e, dt, room, p, 36);
    moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy'); e.flip = p.x < e.x;
    if (e.t > 0) return;
    e.vx = e.vy = 0;
    const k = e.n++ % 4;
    if (k === 0) { e.state = 'call'; e.t = 0.5; }
    else if (k === 1) { e.dashes = e.p2 ? 2 : 1; queenAim(e, room, p); }
    else if (k === 2) { e.state = 'fan'; e.t = 0.5; e.w = 0; }
    else { e.state = 'storm'; e.t = 0.9; Audio_.sfx('charge'); }
  } else if (e.state === 'call') {
    if (e.t > 0) return;
    const hs = G.players.filter(alive);
    for (let k = 0; k < (e.p2 ? 7 : 5); k++) {
      const q = hs[k % Math.max(1, hs.length)] || p, x = k < hs.length ? q.x : q.x + grnd(-70, 70), y = k < hs.length ? q.y : q.y + grnd(-50, 50);
      G.markers.push({ x: Math.max(28, Math.min(VW - 28, x)), y: Math.max(OY + 44, Math.min(OY + 186, y)), t: 1 + k * 0.1, max: 1 + k * 0.1, src: 'fqueen', fall: 'icicle', n: 0 });
    }
    Audio_.sfx('tele');
    e.state = 'idle'; e.t = 1.3;
  } else if (e.state === 'aim') {
    if (e.t <= 0) { e.state = 'dash'; e.t = e.len / 190; Audio_.sfx('dash'); }
  } else if (e.state === 'dash') {
    const bl = moveBox(room, e, Math.cos(e.la) * 190 * dt, Math.sin(e.la) * 190 * dt, 'enemy');
    const i = cellAt(e.x, e.y);
    if (e.p2 && room.tiles[i] === T_FLOOR) freeze(room, i, T_FLOOR); // phase 2: a trail of ice
    if (bl || e.t <= 0) { if (--e.dashes > 0) queenAim(e, room, p); else { e.state = 'idle'; e.t = 1.2; } }
  } else if (e.state === 'fan') {
    // never point-blank: she glides back from a hero who is too close before she throws
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (d < 64 && (e.bk = (e.bk || 0) + dt) < 1.2) { moveBox(room, e, dx / d * 80 * dt, dy / d * 80 * dt, 'enemy'); if (e.t < 0.2) e.t = 0.2; } // (a second at most, cornered or not)
    if (e.t > 0) return;
    e.bk = 0;
    fan(e.x, e.y - 22, Math.atan2(p.y - 7 - (e.y - 22), p.x - e.x) + (e.w % 2 ? 0.25 : 0), 4, 0.5, 64, 'ice');
    Audio_.sfx('eshoot');
    e.t = 0.45;
    if (++e.w >= (e.p2 ? 2 : 1)) { e.state = 'idle'; e.t = 1.7; } // the fan clears before the storm
  } else if (e.state === 'storm') {
    if (e.t <= 0) { e.state = 'spin'; e.t = 2; e.a = grand() * 6.3; e.ft = 0; }
  } else if (e.state === 'spin') {
    if ((e.ft -= dt) <= 0) {
      e.ft = e.p2 ? 0.26 : 0.24;
      const arms = e.p2 ? 2 : 1;
      for (let k = 0; k < arms; k++) ebullet(e.x, e.y - 22, e.a + k * Math.PI * 2 / arms, 46, 'ice');
      e.a += 0.7; // wide steps: room to slip between the arms
    }
    if (e.t <= 0) { e.state = 'idle'; e.t = 1; stagger(e, 2); toast('THE QUEEN IS OUT OF BREATH!'); } // the spiral clears before her icicles
  }
};
function queenAim(e, room, p) {
  e.state = 'aim'; e.t = 0.8;
  let len = 20;
  const la = Math.atan2(p.y - e.y, p.x - e.x);
  while (len < 200 && !boxSolid(room, e.x + Math.cos(la) * len, e.y + Math.sin(la) * len, e.hw, e.hh, 'enemy')) len += 6;
  lane(e, p, len); e.len = len - 6;
}
BEASTS.push({ t: 'fqueen', spr: 'fqueen_0', boss: true, lore: ['SHE RULES THE SNOWGLOBE FROM ITS BOTTOM.', 'WHERE SHE GLIDES, THE FLOOR TURNS TO ICE.', 'AFTER HER SPIRAL SHE MUST CATCH HER BREATH.'] });

// ---------- The Skating Rink (the Snowglobe's special room) ----------
// Ice wall to wall. Touch the sign and a waltz starts: glide through the eight flags in
// RINK_T seconds. All eight win a gem and a heart; fewer pay a coin each. The clock is skyNow.
const RINK_N = 8, RINK_T = 25, RINK_WAIT = 0.8;
const RINK_FLAGS = [[3, 4], [20, 4], [3, 9], [20, 9], [8, 3], [15, 3], [8, 10], [15, 10]].map(([c, r]) => [c * 16 + 8, OY + r * 16 + 12]);
const rinkOf = room => room.type === 'rink' ? room.props.find(o => o.kind === 'rink') : null;
const rinkSig = o => { o.sig = o.at + ':' + o.got + (o.done ? '!' : ''); };
function rinkStock(room) { const o = { kind: 'rink', x: 192, y: OY + 110, t: 0, at: 0, got: '0'.repeat(RINK_N), done: false }; rinkSig(o); room.props.push(o); }
// host / solo: the sign was touched
function rinkStart(o, p) {
  if (o.at) { say(p, o.done ? 'WHAT A SKATE!' : 'GLIDE!'); return; }
  o.at = skyNow() + RINK_WAIT; rinkSig(o);
  toast('GLIDE THROUGH ALL EIGHT FLAGS!');
  Audio_.play('waltz');
}
function rinkEnd(room, o) {
  o.done = true; rinkSig(o);
  const n = [...o.got].filter(c => c === '1').length;
  if (n >= RINK_N) { spawnPickup('gem', o.x, o.y + 12); spawnPickup('heart', o.x, o.y + 12); toast('A PERFECT SKATE!'); Audio_.sfx('win'); burst(o.x, o.y - 10, 20, ['w', 'C', 'Y'], 90, 0.7, { g: -30 }); }
  else { if (n) gainCoins(n); toast('TIME IS UP!'); Audio_.sfx('deny'); }
  Audio_.play(G.floor.land.song);
}
function rinkUpdate(room) {
  const o = rinkOf(room);
  if (!o || !o.at || o.done) return;
  const u = skyNow() - o.at;
  if (u < 0) return;
  if (u > RINK_T) { rinkEnd(room, o); return; }
  RINK_FLAGS.forEach(([x, y], i) => {
    if (o.got[i] === '1' || o.done) return;
    if (!G.players.some(p => alive(p) && Math.abs(p.x - x) < 11 && Math.abs(p.y - y) < 11)) return;
    o.got = o.got.slice(0, i) + '1' + o.got.slice(i + 1); rinkSig(o);
    burst(x, y - 8, 8, ['B', 'c', 'w'], 60, 0.4, { g: -30 });
    Audio_.sfx('coin');
    if (!o.got.includes('0')) rinkEnd(room, o);
  });
}
// every screen: the flags still standing, and the count and clock over the sign
function rinkDraw(ox, oy, room) {
  const o = rinkOf(room);
  if (!o) return;
  const s = S('rflag');
  RINK_FLAGS.forEach(([x, y], i) => {
    if (o.got[i] === '1') return;
    shadow(ox + x, oy + y, 6);
    drawS(s, ox + x - 1, oy + y - s.h + 1 + (o.at && !o.done ? Math.round(Math.sin(G.time * 4 + i) * 1) : 0));
  });
  if (!o.at || o.done) return;
  const left = Math.ceil(Math.min(RINK_T, RINK_T - (skyNow() - o.at)));
  text([...o.got].filter(c => c === '1').length + ' / ' + RINK_N, ox + o.x, oy + o.y - 30, 'C', 2, 1);
  text(left + 'S', ox + o.x, oy + o.y - 40, left <= 5 ? 'R' : 'w', 2, 1);
}
function drawRink(o, x, y) {
  shadow(x, y, 10);
  drawFeet(S('rsign'), x, y + 1);
  if (!o.at && Math.floor(o.t * 3) % 3 === 0) drawS(S('sparkle_c'), x + 6, y - 18);
}
