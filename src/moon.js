'use strict';
// ---------- The Moon Garden (Low Moon) ----------
// Soft gravity: everything walks with a gentle slide (the drift hook lowers the grip), and a dash
// glides on after it ends. Moon rocks with a gold core (layout 'W', or a couple of the rocks in a
// shared layout) are gravity wells: shots and bullets curve toward them (room.wells, level.js), so
// a shot can be banked round a rock, and a bent volley shows its arc as faint dots (fx.js).
// The last land: its boss, the Night Bloom, ends the Star Road.
const MOON_GRIP = 0.45, MOON_GLIDE = 0.55, MOON_PULL = 1.1;
const MN_ = (rows) => { const w = rows[0].length, pad = '.'.repeat(w + 2); return autoOutline([pad, ...rows.map(r => '.' + r + '.'), pad]); };

// ---------- Tile art ----------
(function moonTiles() {
  // a moon rock, pitted with craters
  def('rock_moon', MN_([
    '....lllll.....',
    '..llLLLLlll...',
    '.lLLlmmLLLll..',
    '.lLlm..mLLlll.',
    'llLlm..mLlllmm',
    'lLLLlmmLLllmmm',
    'lLLLLLLLlllmdm',
    'lLmmLLLllllmdm',
    'llm..mlllmmmdd',
    '.lm..mllmmmdd.',
    '.lmmmlmmmmddd.',
    '..ddmmmmdddd..',
    '....ddddd.....',
  ]));
  // a well: the same rock with a warm gold heart
  def('rock_moonw', MN_([
    '....lllll.....',
    '..llLLLLlll...',
    '.lLLlyyLLLll..',
    '.lLlyYYyLLlll.',
    'llLyYwwYylllmm',
    'lLLyYwwYyllmmm',
    'lLLLyYYyllmmdm',
    'lLmmLyylllmmdm',
    'llm..mlllmmmdd',
    '.lm..mllmmmdd.',
    '.lmmmlmmmmddd.',
    '..ddmmmmdddd..',
    '....ddddd.....',
  ]));
  // a dream jar, with a star inside
  def('brk_moon', MN_([
    '...dmmd...',
    '....ll....',
    '..lLLLLl..',
    '.lL4y4LLl.',
    '.L4yYy4Ll.',
    '.L44y44Ll.',
    '.lL444Lll.',
    '..llllll..',
    '...mmmm...',
  ]));
})();
const _mnRock = rockArt;
rockArt = function (room, c, r, theme) { return theme === 'moon' && room.wellIdx && room.wellIdx.has(r * COLS + c) ? 'rock_moonw' : _mnRock(room, c, r, theme); };

// moss tufts, fallen petals and the odd star in the grass
THEMES.moon.paint = function (g, room) {
  const f = (x, y, w, h, k) => { g.fillStyle = PAL[k]; g.fillRect(x, y, w, h); };
  for (let r = 2; r <= 11; r++) for (let c = 1; c <= 22; c++) {
    const i = r * COLS + c, x = c * 16, y = OY + r * 16, h = hash(c, r, room.seed);
    if (room.tiles[i] !== T_FLOOR) continue;
    if (h % 4 === 0) { f(x + 3 + h % 9, y + 6 + (h >> 4) % 6, 1, 2, '1'); f(x + 4 + h % 9, y + 5 + (h >> 4) % 6, 1, 3, '1'); }
    if (h % 9 === 0) f(x + 5 + (h >> 3) % 6, y + 3 + (h >> 6) % 8, 2, 1, 'q');
    if (h % 23 === 0) { const sx = x + 6 + (h >> 2) % 4, sy = y + 6 + (h >> 5) % 4; f(sx, sy - 1, 1, 3, 'Y'); f(sx - 1, sy, 3, 1, 'Y'); }
  }
};

// ---------- Rooms ----------
LAND_LAYOUTS.moon = {
  // Stepping Moons: rock islands in a sea of night sky
  steps: `......................
    ..e................e..
    ...~~~~~......~~~~~...
    ...~~~~~..W...~~~~~...
    ..........ee..........
    ......................
    ...~~~~~......~~~~~...
    ...~~~~~...W..~~~~~...
    ..e................e..
    ......................`,
  // Well Ring: wells in a circle; bank your shots round them
  mring: `......................
    ..e.......ee.......e..
    ......................
    ......W.......W.......
    ..........##..........
    ..........##..........
    .......W.......W......
    ......................
    ..e.......ee.......e..
    ......................`,
  // Petal Field: dream jars among the flowers
  petal: `......................
    ..e..b....ee....b..e..
    ....b..b......b..b....
    ......................
    ..b....b..W...b....b..
    ......................
    ....b..b......b..b....
    ..e..b..........b..e..
    ..........ee..........
    ......................`,
  // Wishing Pond: a calm room round a pond of sky
  mpond: `......................
    ..e................e..
    ......................
    ........~~~~~~........
    .......~~~~~~~~.......
    .......~~~~~~~~.......
    ........~~~~~~........
    ......................
    ..e................e..
    ......................`,
  // Comet Track: one long lane between two wells
  comet: `......................
    ..e.......ee.......e..
    ....################..
    ......................
    ..W................W..
    ......................
    ..################....
    ......................
    ..e.......ee.......e..
    ......................`,
  // Crescent Bridge: a curved bridge over the sky
  cbridge: `......................
    ..e.......ee.......e..
    ....~~~~~....~~~~~....
    ...~~~~~......~~~~~...
    ..~~~~~...W....~~~~~..
    ..~~~~~........~~~~~..
    ...~~~~~......~~~~~...
    ....~~~~~....~~~~~....
    ..e.......ee.......e..
    ......................`,
};
for (const k in LAND_LAYOUTS.moon) LAND_LAYOUTS.moon[k] = LAND_LAYOUTS.moon[k].split('\n').map(r => r.trim());
Object.assign(LAY_RULE, {
  steps: { pool: [['mrabbit', 3], ['mcour', 2]] },
  mring: { pool: [['cpup', 3], ['mcour', 2], ['spetal', 1]] },
  petal: { pool: [['spetal', 2], ['sleepw', 2], ['mrabbit', 1]] },
  mpond: { pool: [['sleepw', 3], ['mcour', 1]] },
  comet: { pool: [['cpup', 3], ['mrabbit', 1]] },
  cbridge: { pool: [['mcour', 2], ['spetal', 1], ['sleepw', 1]] },
});

// ---------- The rule ----------
// the wells of the room (from its seed): 'W' in the Moon's own layouts, else up to two inner rocks
function moonWells(room) {
  const idx = [];
  const L = room.lay && LAND_LAYOUTS.moon[room.lay];
  if (L) {
    const [fx, fy] = room.flip || [false, false];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) if (L[fy ? 9 - y : y][fx ? 21 - x : x] === 'W') { const i = (y + 2) * COLS + x + 1; room.tiles[i] = T_ROCK; idx.push(i); }
  } else if (room.type === 'normal') {
    const rocks = [];
    for (let r = 3; r <= 10; r++) for (let c = 3; c <= 20; c++) if (room.tiles[r * COLS + c] === T_ROCK) rocks.push(r * COLS + c);
    rocks.sort((a, b) => hash(a, 5, room.seed) - hash(b, 5, room.seed));
    for (const i of rocks) if (idx.length < 2 && idx.every(j => Math.abs(j % COLS - i % COLS) + Math.abs(((j / COLS) | 0) - ((i / COLS) | 0)) > 5)) idx.push(i);
  }
  room.wellIdx = new Set(idx);
  room.wells0 = idx.map(i => [(i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 + 8, MOON_PULL]);
  room.wells = room.wells0.length ? room.wells0.slice() : null;
}
LAND_MECH.moon = {
  build(room) { moonWells(room); },
  // soft gravity: a gentle slide for everyone who walks
  drift(room, x, y, out) { out.grip = Math.min(out.grip, assistOn() ? 0.8 : MOON_GRIP); },
  glide: (p) => (assistOn() ? 0.3 : MOON_GLIDE) * (p.mboots ? 1.3 : 1),
  // every screen: wells the fight adds (the Lamp Bunny's lamp, the Night Bloom's pillars)
  every(dt, room) {
    const extra = moonExtraWells(room);
    room.wells = extra.length || room.wells0 && room.wells0.length ? (room.wells0 || []).concat(extra).slice(0, WELL_MAX) : null;
  },
  update(dt, room) {
    if (room.type === 'normal' && !room.cleared && room.nb === undefined) room.nb = !G.first && grand() < 0.18 ? grnd(5, 9) : 0;
    if (room.nb > 0 && G.enemies.length && (room.nb -= dt) <= 0) {
      room.nb = 0;
      const [x, y] = freeSpot(room);
      spawnEnemy('nbud', x, y, { elite: true });
      toast('A NIGHT BLOOM BUD! IT OPENS INTO A RING');
    }
  },
  drawLayer(ox, oy, room, layer) {
    if (layer === 0) {
      // the wells' pull: motes circling each gold core
      // a rock that wakes as a well mid-fight gets the gold heart too
      for (const w of room.wells || []) {
        const i = Math.floor((w[1] - OY) / 16) * COLS + Math.floor(w[0] / 16);
        if (room.tiles[i] !== T_ROCK || (room.wellIdx && room.wellIdx.has(i))) continue;
        const x = Math.round(ox + w[0]), y = Math.round(oy + w[1]) - 6, k = Math.floor(G.time * 4) % 2;
        rect(x - 2, y - 1, 4, 3, 'y'); rect(x - 1, y - 2, 2, 5, 'y'); rect(x - 1, y - 1, 2, 3, k ? 'w' : 'Y');
      }
      for (const w of room.wells || []) for (let i = 0; i < 6; i++) {
        const a = G.time * (1.4 + w[2] * 0.4) + i * Math.PI / 3, r = 15 + (i % 2) * 4;
        rect(Math.round(ox + w[0] + Math.cos(a) * r), Math.round(oy + w[1] - 4 + Math.sin(a) * r * 0.6), 1, 1, i % 2 ? 'Y' : '4');
      }
      return;
    }
    if (layer === 1) moonDraw1(ox, oy, room);
    if (layer === 2) bigMoon();
  },
};
// the huge moon, in the right margin when there is one
function bigMoon() {
  if (SCR.ox < 28) return;
  const E = screenEdges(), r = Math.min(26, (SCR.ox >> 1) - 4), cx = E.r - (SCR.ox >> 1), cy = E.t + Math.round((E.b - E.t) * 0.3);
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.round(Math.sqrt(r * r - dy * dy));
    rect(cx - w, cy + dy, w * 2, 1, 'L');
    rect(cx + w - Math.max(1, w >> 2), cy + dy, Math.max(1, w >> 2), 1, 'l'); // the shaded side
  }
  for (const [dx, dy, k] of [[-0.4, -0.3, 0.22], [0.15, 0.25, 0.3], [-0.1, 0.5, 0.14], [0.35, -0.4, 0.12]]) {
    const kr = Math.max(1, Math.round(r * k));
    rect(cx + Math.round(dx * r) - kr, cy + Math.round(dy * r) - (kr >> 1), kr * 2, kr, 'l');
  }
}
// filled in below, once the foes and the boss exist
function moonExtraWells(room) { return []; }
function moonDraw1(ox, oy, room) {}

// ---------- The Moon's items ----------
Object.assign(ITEMS, {
  mboots: { name: 'MOON BOOTS', desc: 'DASHES GO FARTHER', land: 'moon', unique: true, apply: p => { p.mboots = true; } },
  ctail: { name: 'COMET TAIL', desc: 'DASHES LEAVE STARS THAT BURN FOES', land: 'moon', unique: true, apply: p => { p.ctail = true; } },
  wstar: { name: 'WISH STAR', desc: 'A RANDOM BLESSING EACH FLOOR', land: 'moon', unique: true, apply: p => { p.wstar = true; wishBless(p); } },
});
function wishBless(p) {
  const k = gpick(Object.keys(BLESSINGS)), B = BLESSINGS[k];
  B.apply(p); say(p, B.name + '!');
  burst(p.x, p.y - 12, 16, ['Y', 'w', '4'], 90, 0.6, { g: -30 });
}
// COMET TAIL: called from movePlayer while a dash runs
function cometTail(p) {
  if (FG_TRAIL.length > 80) FG_TRAIL.shift();
  FG_TRAIL.push([p.x, p.y - 2, G.time + 0.8]);
  if (Math.random() < 0.7) part(p.x + rnd(-3, 3), p.y - rnd(0, 6), 0, -6, 0.5, Math.random() < 0.5 ? 'Y' : 'y');
}

// ---------- Foe art ----------
(function moonArt() {
  const o = { flip: true, flash: true, glow: true };
  SN_('mcour_0', `
    .33.......33.
    3443.....3443
    34443.1.34443
    .34442224443.
    ..334222433..
    .....222.....
    ......1......
    .....yYy.....
    ......y......`, o);
  SN_('mcour_1', `
    .............
    .............
    ......1......
    .3344222443..
    344442224444.
    .3333222333..
    ......1......
    .....yYy.....
    ......y......`, o);
  SN_('mrabbit_0', `
    ..lq..lq...
    ..lq..lq...
    ..lq..lq...
    .lLLLLLLl..
    lLL0LL0LLl.
    lLLLqqLLLl.
    .lLLLLLLLlm
    lLLLLLLLLmm
    lmLLLLLLlm.
    .mm.mm.mm..`, o);
  SN_('mrabbit_1', `
    .lq....lq..
    ..lq..lq...
    ..lLLLLLl..
    .lL0LL0Lll.
    .lLLLqqLLlm
    lLLLLLLLLmm
    lmLLLLLLlm.
    .lllllllll.
    mm.......mm`, o);
  SN_('cpup_0', `
    ........yy...
    ..C4...yYYy..
    .C44CyyYwYY0.
    C444yYYYYYYy.
    .C44CyYYYYy..
    ..C4..y..y...`, o);
  SN_('cpup_1', `
    ........yy...
    .C44...yYYy..
    C4444yyYwYY0.
    44444yYYYYYy.
    C4444yYYYYy..
    .C44.y....y..`, o);
  SN_('spetal_0', `
    ....qq....
    ...qPPq...
    .qq.qq.qq.
    qPPqyyqPPq
    .qqyYYyqq.
    ...qyyq...
    ..qPqqPq..
    ..qq.gqq..
    .....g....
    ...ggg....`, o);
  SN_('spetal_1', `
    ...qPPq...
    .qqPqqPqq.
    qPPqyyqPPq
    PPqyYwYqPP
    qPqyYYyqPq
    .qqqyyqqq.
    .qPPqqPPq.
    ..qq.gqq..
    .....g....
    ...ggg....`, o);
  SN_('sleepw_0', `
    ...bBBy.
    ..bBBB..
    .bBBBb..
    .lLLLl..
    lL0LL0l.
    lLLLLLl.
    lLLqLLlm
    .lLLLLlm
    .lLLLllm
    ..mlmlm.`, o);
  SN_('sleepw_1', `
    ...bBBy.
    ..bBBB..
    .bBBBb..
    .lLLLl..
    lLrLLrl.
    lL0LL0l.
    lLL00Llm
    .lLLLLlm
    .lLLLllm
    .m.m.m.m`, o);
  SN_('nbud_0', `
    ....pp....
    ...pPPp...
    ..pPqPPp..
    ..pPPqPp..
    ...pPPp...
    ....gg....
    ..gg.g.gg.
    .gG..g..Gg
    .....g....`, o);
  SN_('nbud_1', `
    .q..qq..q.
    qPq.PP.qPq
    .qPPqqPPq.
    .PqyYYyqP.
    qPqYwwYqPq
    .PqyYYyqP.
    .qPPggPPq.
    qPq.g..qPq
    .....g....`, o);
  SN_('icon_mboots', `
    ...llll..
    ...lLLl..
    ...lLLl..
    ...lLLl..
    ..llLLlll
    .lLLLLLLl
    lLLyLLLLl
    mmmmmmmmm`, { sil: '1' });
  SN_('icon_ctail', `
    .........yy.
    ........yYYy
    ......4yYwYy
    ...444.yYYy.
    .44.4...yy..
    4..4........
    ...4........`, { sil: '1' });
  SN_('icon_wstar', `
    ....Y....
    ....Y....
    ...yYy...
    YYYYwYYYY
    .yYYYYYy.
    ..yYYYy..
    ..Yy.yY..
    .Y.....Y.`, { sil: '1' });
  const B = {
    mstar: [['.y.', 'yYy', '.y.'], ['..y..', '.yYy.', 'yYwYy', '.yYy.', '..y..']],
    petal: [['.q.', 'qPq', '.p.'], ['..q..', '.qPq.', 'qPwPq', '.pPp.', '..p..']],
  };
  for (const k in B) {
    def('eb_' + k, MN_(B[k][0])); def('ebb_' + k, MN_(B[k][1]));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
})();

// ---------- Foes ----------
Object.assign(EDEF, {
  // flits between the wells, its lantern star glints, three stars follow
  mcour: { hp: 7, r: 5, h: 10, hw: 5, hh: 3, sw: 14, fly: true, colors: ['4', '3', 'Y'],
    sprite: (e) => S('mcour_' + (Math.floor(e.anim * 8) % 2)),
    glint: (e) => (e.state === 'glint' ? [0, -2] : null) },
  // a long hop to a pink ring, and a ring of stars where it lands
  mrabbit: { hp: 9, r: 6, h: 11, hw: 5, hh: 3, sw: 14, colors: ['L', 'l', 'q'],
    sprite: (e) => S('mrabbit_' + (e.state === 'hop' ? 1 : 0)) },
  // circles a well, then dives down a cyan lane
  cpup: { hp: 7, r: 5, h: 7, hw: 5, hh: 3, sw: 14, fly: true, colors: ['Y', 'y', '4'],
    sprite: (e) => S('cpup_' + (e.state === 'dive' ? 1 : Math.floor(e.anim * 6) % 2)) },
  // a flower turret: a glint, then a spiral of petals
  spetal: { hp: 12, r: 6, h: 10, hw: 5, hh: 3, sw: 14, still: true, colors: ['q', 'P', 'Y'],
    sprite: (e) => S('spetal_' + (e.state === 'spin' || e.state === 'glint' ? 1 : 0)),
    glint: (e) => (e.state === 'glint' ? [0, -6] : null) },
  // asleep it only wanders; hit it and it wakes, shows its lane and charges
  sleepw: { hp: 14, r: 6, h: 11, hw: 5, hh: 3, sw: 12, colors: ['l', 'B', 'y'],
    init: (e) => { e.calm = true; e.lh = e.hp; },
    sprite: (e) => S('sleepw_' + (e.calm ? 0 : 1)) },
  // the elite: a bud that opens into a ring of petals
  nbud: { hp: 20, r: 6, h: 10, hw: 5, hh: 3, sw: 14, still: true, colors: ['P', 'q', 'Y'],
    sprite: (e) => S('nbud_' + (e.state === 'shut' ? 0 : 1)),
    glint: (e) => (e.state === 'glint' ? [0, -6] : null) },
});
Object.assign(FOE_NAMES, { mcour: 'MOTH COURIER', mrabbit: 'MOON RABBIT', cpup: 'COMET PUP', spetal: 'STAR PETAL', sleepw: 'SLEEPWALKER', nbud: 'NIGHT BLOOM BUD' });
const nearWell = (room, x, y) => { let best = null, bd = 1e9; for (const w of room.wells || []) { const d = Math.hypot(w[0] - x, w[1] - y); if (d < bd) { bd = d; best = w; } } return best; };
Object.assign(AI, {
  mcour(e, dt, room, p) {
    e.t -= dt;
    e.z = 6 + Math.sin(e.anim * 3) * 2;
    if (e.state === 'idle') { e.state = 'flit'; e.t = grnd(1.2, 1.8); e.tx = e.x; e.ty = e.y; }
    if (!p) return;
    if (e.state === 'flit') {
      // toward a well, or toward a spot near the hero when the room has none
      if (Math.hypot(e.tx - e.x, e.ty - e.y) < 6) {
        const w = room.wells && room.wells.length ? gpick(room.wells) : null;
        const a = grand() * Math.PI * 2, r = grnd(30, 50);
        e.tx = (w ? w[0] : p.x) + Math.cos(a) * r; e.ty = (w ? w[1] : p.y - 30) + Math.sin(a) * r * 0.6;
      }
      const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy) || 1;
      if (moveBox(room, e, dx / d * 50 * dt, dy / d * 50 * dt, 'fly')) { e.tx = e.x; e.ty = e.y; }
      e.flip = dx < 0;
      if (e.t <= 0) { e.state = 'glint'; e.t = 0.5; }
    } else if (e.state === 'glint' && e.t <= 0) {
      fan(e.x, e.y - 4 - e.z, Math.atan2(p.y - 7 - (e.y - 4 - e.z), p.x - e.x), 3, 0.25, 54, 'mstar');
      Audio_.sfx('eshoot');
      e.state = 'flit'; e.t = grnd(1.8, 2.4);
    }
  },
  mrabbit(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'sit'; e.t = grnd(1, 1.6); }
    if (!p) return;
    if (e.state === 'sit' && e.t <= 0) {
      // a long hop toward the hero; the landing ring shows where
      const a = Math.atan2(p.y - e.y, p.x - e.x), d = Math.min(80, Math.hypot(p.x - e.x, p.y - e.y));
      let tx = e.x + Math.cos(a) * d, ty = e.y + Math.sin(a) * d;
      for (let k = 0; k < 6 && boxSolid(room, tx, ty, e.hw, e.hh, 'enemy'); k++) { tx = (tx + e.x) / 2; ty = (ty + e.y) / 2; }
      e.sx = e.x; e.sy = e.y; e.tx = tx; e.ty = ty; e.flip = tx < e.x;
      G.markers.push({ x: tx, y: ty, t: 0.9, max: 0.9, src: 'mrabbit', fall: '', n: 6, r: 12 });
      e.state = 'hop'; e.t = 0.9; Audio_.sfx('swish');
    } else if (e.state === 'hop') {
      const k = 1 - Math.max(0, e.t) / 0.9;
      e.x = e.sx + (e.tx - e.sx) * k; e.y = e.sy + (e.ty - e.sy) * k; e.z = Math.sin(k * Math.PI) * 24;
      if (e.t <= 0) { e.z = 0; e.state = 'sit'; e.t = grnd(1.4, 2); dust(e.x, e.y, 6, 14); }
    }
  },
  cpup(e, dt, room, p) {
    e.t -= dt;
    e.z = 4;
    if (e.state === 'idle') { e.state = 'orbit'; e.t = grnd(2, 3); e.oa = grand() * Math.PI * 2; }
    if (!p) return;
    if (e.state === 'orbit' || e.state === 'back') {
      const w = nearWell(room, e.x, e.y) || [e.ox || (e.ox = e.x), e.oy || (e.oy = e.y)];
      e.oa += dt * 2;
      const tx = w[0] + Math.cos(e.oa) * 30, ty = w[1] + Math.sin(e.oa) * 20, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
      moveBox(room, e, dx / d * Math.min(d / dt, 80) * dt, dy / d * Math.min(d / dt, 80) * dt, 'fly');
      e.flip = dx < 0;
      if (e.state === 'back' && d < 8) { e.state = 'orbit'; e.t = grnd(2, 3); }
      if (e.state === 'orbit' && e.t <= 0) {
        e.state = 'aim'; e.t = 0.7;
        let len = 20;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        while (len < 160 && !boxSolid(room, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.hw, e.hh, 'fly')) len += 6;
        lane(e, p, len); e.len = len - 6; e.flip = Math.cos(a) < 0;
      }
    } else if (e.state === 'aim' && e.t <= 0) { e.state = 'dive'; e.t = e.len / 160; Audio_.sfx('dash'); }
    else if (e.state === 'dive') {
      const bl = moveBox(room, e, Math.cos(e.la) * 160 * dt, Math.sin(e.la) * 160 * dt, 'fly');
      if (Math.random() < 0.6) part(e.x - Math.cos(e.la) * 6, e.y - 4, 0, 0, 0.3, Math.random() < 0.5 ? 'Y' : '4');
      if (bl || e.t <= 0) { e.state = 'back'; e.t = 3; }
    }
  },
  spetal(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'rest'; e.t = grnd(1.4, 2.2); }
    if (e.state === 'rest' && e.t <= 0) { e.state = 'glint'; e.t = 0.5; }
    else if (e.state === 'glint' && e.t <= 0) { e.state = 'spin'; e.t = 1.2; e.w = 0; e.a0 = p ? Math.atan2(p.y - e.y, p.x - e.x) : 0; }
    else if (e.state === 'spin') {
      // two arms of petals, turning
      if ((e.w -= dt) <= 0) {
        e.w = 0.15;
        const a = e.a0 + (1.2 - e.t) * 3.2;
        ebullet(e.x, e.y - 6, a, 50, 'petal'); ebullet(e.x, e.y - 6, a + Math.PI, 50, 'petal');
        Audio_.sfx('eshoot');
      }
      if (e.t <= 0) { e.state = 'rest'; e.t = grnd(2, 2.6); }
    }
  },
  sleepw(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'wander'; e.t = grnd(1.5, 3); e.wa = grand() * Math.PI * 2; }
    // a hit wakes it
    if (e.calm && e.hp < e.lh && p) {
      e.calm = false; e.state = 'wake'; e.t = 0.7;
      let len = 20;
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      while (len < 200 && !boxSolid(room, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.hw, e.hh, 'enemy')) len += 6;
      lane(e, p, len); e.len = len - 6; e.flip = Math.cos(a) < 0;
      Audio_.sfx('charge');
    }
    e.lh = e.hp;
    if (e.state === 'wander') {
      if (moveBox(room, e, Math.cos(e.wa) * 12 * dt, Math.sin(e.wa) * 12 * dt, 'enemy') || e.t <= 0) { e.wa = grand() * Math.PI * 2; e.t = grnd(1.5, 3); }
      e.flip = Math.cos(e.wa) < 0;
    } else if (e.state === 'wake' && e.t <= 0) { e.state = 'charge'; e.t = e.len / 140; Audio_.sfx('dash'); }
    else if (e.state === 'charge') {
      const bl = moveBox(room, e, Math.cos(e.la) * 140 * dt, Math.sin(e.la) * 140 * dt, 'enemy');
      if (bl || e.t <= 0) { e.state = 'daze'; e.t = 1.4; dust(e.x, e.y, 5, 12); }
    } else if (e.state === 'daze' && e.t <= 0) { e.state = 'wander'; e.t = 2; e.calm = true; }
  },
  nbud(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'shut'; e.t = 2.5; }
    if (e.state === 'shut' && e.t <= 0) { e.state = 'glint'; e.t = 0.6; Audio_.sfx('charge'); }
    else if (e.state === 'glint' && e.t <= 0) { ring(e.x, e.y - 6, 10, 52, 'petal', e.anim); Audio_.sfx('eshoot'); e.state = 'open'; e.t = 1; }
    else if (e.state === 'open' && e.t <= 0) { e.state = 'shut'; e.t = 2.6; }
  },
});
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'mcour', spr: 'mcour_0', lore: ['A MOTH WITH A STAR FOR A LANTERN.', 'IT FLITS ROUND THE GOLD ROCKS.', 'THREE STARS FOLLOW ITS GLINT.'] },
  { t: 'mrabbit', spr: 'mrabbit_0', lore: ['THE RABBIT FROM THE MOON.', 'IT HOPS TO A PINK RING.', 'STARS FLY WHERE IT LANDS.'] },
  { t: 'cpup', spr: 'cpup_0', lore: ['A LITTLE COMET ON A LEASH OF GRAVITY.', 'IT CIRCLES THE GOLD ROCKS.', 'THEN IT DIVES DOWN A CYAN LANE.'] },
  { t: 'spetal', spr: 'spetal_0', lore: ['A FLOWER THAT NEVER CLOSES.', 'AFTER A GLINT, PETALS SPIRAL OUT.', 'THE GOLD ROCKS BEND THEM.'] },
  { t: 'sleepw', spr: 'sleepw_0', lore: ['IT WALKS IN ITS SLEEP.', 'LEAVE IT, AND IT LEAVES YOU.', 'WAKE IT, AND IT CHARGES.'] },
  { t: 'nbud', spr: 'nbud_0', lore: ['A BUD OF THE NIGHT BLOOM.', 'IT OPENS INTO A RING OF PETALS.', 'SHOOT IT WHILE IT IS SHUT.'] },
);

// ---------- The Lamp Bunny (warden of the Moon Garden) ----------
// A moon rabbit carrying a lamp that is a gravity well of its own: bullets and shots near it bend
// toward the lamp. It hops to pink rings (stars burst where it lands in phase 2), throws fans of
// stars (glint first), and every third round it swings the lamp round: a ring of stars with a gap
// toward the hero, and then it drops the lamp for a moment.
(function bunnyArt() {
  const o = { flash: true, flip: true };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const bunny = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0, up = f.a ? 1 : 0;
    let r = sculpt(34, 36, [
      { r: [8, 2 + dy, 4, 12, 2], ramp: 'mlLw' }, { r: [15, 1 + dy, 4, 13, 2], ramp: 'mlLw' }, // ears
      { e: [7, 33, 4, 2.5], ramp: 'mlLL' }, { e: [17, 33, 4, 2.5], ramp: 'mlLL' }, // feet
      { e: [12, 25 + b, 8, 8], ramp: 'mlLw' },
      { e: [12, 15 + dy + b, 8, 7], ramp: 'mlLw' },
      { r: [17, 21 + b, 6, 3, 1], ramp: 'mlLL' }, // the arm round the pole
      { r: [22, 8 + (up ? -4 : 2), 2, 18, 0], ramp: 'dddm' }, // the lamp pole
      { e: [27, (up ? 6 : 12) + dy, 6, 6], ramp: f.p ? 'oyYw' : 'yYYw' }, // the lamp
    ]);
    r = stamp(r, 9, 4 + dy, 'q......\nq..q...\nq..q...\n...q...');
    r = autoOutline(r);
    r = bossEyes(r, 7, 13 + dy + b, 6, f.face);
    r = stamp(r, 10, 18 + dy + b, MOUTH[f.face]);
    return rim(r, { l: 'L', y: 'Y' });
  };
  bossFrames('lbunny', bunny, o);
})();
Object.assign(EDEF, {
  lbunny: { hp: 260, r: 11, h: 30, hw: 9, hh: 5, sw: 34, warden: true, intro: 'IT CARRIES THE MOON HOME', colors: ['L', 'Y', 'q'],
    init: (e) => { e.state = 'wait'; e.t = 1; e.n = 0; },
    sprite: (e) => bossFrame(e, { glint: 'tell', wind: 'tell', hop: 'move', swing: 'atk' }[e.state] || bob(e, 2, '0', '1')),
    glint: (e) => (e.state === 'glint' || e.state === 'wind' ? [e.flip ? -14 : 14, -26] : null) },
});
FOE_NAMES.lbunny = 'LAMP BUNNY';
WARDENS.moon = 'lbunny';
const lampAt = (e) => [e.x + (e.flip ? -14 : 14), e.y - 22 - (e.z || 0)];
AI.lbunny = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'lbunny';
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  if (!p) return;
  if (e.state !== 'hop') e.flip = p.x < e.x;
  if (e.state === 'wait') {
    if (e.t > 0) return;
    const k = e.n++ % 3;
    if (k === 0) {
      const a = Math.atan2(p.y - e.y, p.x - e.x), d = Math.min(90, Math.hypot(p.x - e.x, p.y - e.y) - 20);
      let tx = e.x + Math.cos(a) * d, ty = e.y + Math.sin(a) * d;
      for (let i = 0; i < 6 && boxSolid(room, tx, ty, e.hw, e.hh, 'enemy'); i++) { tx = (tx + e.x) / 2; ty = (ty + e.y) / 2; }
      e.sx = e.x; e.sy = e.y; e.tx = tx; e.ty = ty;
      G.markers.push({ x: tx, y: ty, t: 1, max: 1, src: 'lbunny', fall: '', n: e.p2 ? 6 : 0, r: 16 });
      e.state = 'hop'; e.t = 1; Audio_.sfx('swish');
    } else if (k === 1) { e.state = 'glint'; e.t = 0.55; }
    else { e.state = 'wind'; e.t = 0.9; Audio_.sfx('charge'); }
  } else if (e.state === 'hop') {
    const k = 1 - Math.max(0, e.t);
    e.x = e.sx + (e.tx - e.sx) * k; e.y = e.sy + (e.ty - e.sy) * k; e.z = Math.sin(k * Math.PI) * 30;
    if (e.t <= 0) { e.z = 0; G.shake = Math.max(G.shake, 2); dust(e.x, e.y, 8, 18); e.state = 'wait'; e.t = 0.8; }
  } else if (e.state === 'glint') {
    if (e.t > 0) return;
    const [lx, ly] = lampAt(e);
    fan(lx, ly, Math.atan2(p.y - 7 - ly, p.x - lx), 5, e.p2 ? 0.28 : 0.34, 56, 'mstar'); // an odd fan: one star down the middle
    Audio_.sfx('eshoot');
    e.state = 'wait'; e.t = 1;
  } else if (e.state === 'wind') {
    if (e.t > 0) return;
    const [lx, ly] = lampAt(e), a = Math.atan2(p.y - ly, p.x - lx), n = 14;
    for (let i = 0; i < n; i++) { const b = a + (i + 0.5) * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.6) ebullet(lx, ly, b, 56, 'mstar'); }
    Audio_.sfx('boom');
    e.state = 'swing'; e.t = 0.4;
  } else if (e.state === 'swing' && e.t <= 0) { stagger(e, 2); toast('THE BUNNY DROPS ITS LAMP!'); e.state = 'wait'; e.t = 0.4; }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'lbunny', spr: 'lbunny_0', lore: ['THE WARDEN OF THE MOON GARDEN.', 'ITS LAMP PULLS EVERY BULLET.', 'AFTER A SWING IT DROPS THE LAMP.'] });

// ---------- The Night Bloom (the last boss) ----------
// A colossal moonflower with four Star Petals round its face; the Big Stars you have brought back
// circle it. New Moon: dark but for its petals, which glint and fire fans one after another.
// Crescent: the four pillars wake as wells, and its rings of petals (a gap toward the hero) bend
// into crescents. Half Moon: one half of the room glows, then burns, then the other. Full Moon:
// every well at once, rings with a gap and spirals. After its big attacks it nods off (stagger).
const NB_PILLARS = [[3 * 16 + 24, OY + 2 * 16 + 40], [18 * 16 + 24, OY + 2 * 16 + 40], [3 * 16 + 24, OY + 7 * 16 + 40], [18 * 16 + 24, OY + 7 * 16 + 40]];
const NB_HALF_T = 1.3, NB_HALF_BURN = 1.2;
(function bloomArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const bloom = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0, open = f.a ? 1 : 0;
    const pet = f.p ? 'pPqw' : '3qqw';
    let r = sculpt(52, 50, [
      { r: [24, 30, 4, 20, 0], ramp: 'gGGh' }, // the stem
      { e: [12, 42, 9, 3.5], ramp: 'gGhh' }, { e: [40, 44, 9, 3.5], ramp: 'gGhh' }, // leaves
      { e: [26, 6 + dy - open, 8, 7], ramp: pet }, { e: [26, 36 + dy + open, 8, 6], ramp: pet },
      { e: [10 - open, 20 + dy + b, 7, 8], ramp: pet }, { e: [42 + open, 20 + dy + b, 7, 8], ramp: pet },
      { e: [14, 9 + dy, 6, 6], ramp: pet }, { e: [38, 9 + dy, 6, 6], ramp: pet },
      { e: [14, 32 + dy, 6, 6], ramp: pet }, { e: [38, 32 + dy, 6, 6], ramp: pet },
      { e: [26, 21 + dy + b, 13, 12], ramp: 'oyYw' }, // the golden face
    ]);
    r = autoOutline(r);
    r = bossEyes(r, 19, 17 + dy + b, 10, f.face);
    r = stamp(r, 24, 25 + dy + b, MOUTH[f.face]);
    r = stamp(r, 15, 22 + dy + b, 'P..............P');
    return rim(r, { q: 'w', y: 'Y' });
  };
  bossFrames('nbloom', bloom, o);
  // New Moon: the flower in shadow, only its eyes and petal tips catch the light
  const dark = bloom({ face: 'calm' }).map(row => row.replace(/[gGh]/g, '1').replace(/[oyYwqPp3]/g, '2'));
  def('nbloom_dark', bossEyes(dark, 19, 17, 10, 'calm'), o);
})();
Object.assign(EDEF, {
  nbloom: { hp: 520, r: 18, h: 44, hw: 18, hh: 8, sw: 52, boss: true, still: true, intro: 'THE LAST FLOWER WAKES UP', phases: [0.75, 0.5, 0.25], colors: ['q', 'Y', 'P'],
    init: (e) => { e.x = 192; e.y = OY + 92; e.n = 0; e.pi = 0; e.eclipse = !!(G.run && G.run.plus); }, // ROAD+: the Eclipse
    sprite: (e) => (e.phase || 1) === 1 && e.stag <= 0 && e.state !== 'die' ? S('nbloom_dark') : bossFrame(e, { glint: 'tell', aim: 'tell', halfT: 'tell', ring: 'atk', spiral: 'atk', half: 'atk' }[e.state] || bob(e, 1.5, 1, 0)),
    glint: (e) => (e.state === 'petal' && e.t > 0.25 ? nbPetal(e, e.pi) .map((v, i) => v - (i ? e.y : e.x)) : e.state === 'glint' ? [0, -30] : null) },
});
FOE_NAMES.nbloom = 'THE NIGHT BLOOM';
EF_EXTRA.push('half', 'eclipse');
// the four Star Petals turn slowly round its face
const nbPetal = (e, i) => { const a = G.time * 0.5 + i * Math.PI / 2 + Math.PI / 4; return [e.x + Math.cos(a) * 34, e.y - 26 + Math.sin(a) * 26]; };
AI.nbloom = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'nbloom';
  const was = e.phase || 1;
  if (e.hp < e.maxHp * 0.75) bossPhase(e, 2);
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 3);
  if (e.hp < e.maxHp * 0.25) bossPhase(e, 4);
  if ((e.phase || 1) !== was) { e.half = null; e.state = 'rest'; e.t = 1.2; e.n = 0; toast(['', '', 'CRESCENT: THE PILLARS PULL!', 'HALF MOON: ONE SIDE AT A TIME!', 'FULL MOON!'][e.phase]); }
  if (e.half) { e.half[1] -= dt; if (e.half[1] < -NB_HALF_BURN) e.half = null; }
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'rest'; e.t = 1; } return; }
  if (!p) return;
  const ph = e.phase || 1, cy = e.y - 26;
  if (e.state === 'rest') {
    if (e.t > 0) return;
    const k = e.n++;
    // New Moon: the petals in turn | Crescent: a ring, two petals | Half Moon: two halves, a petal | Full Moon: ring and spiral, a petal
    const ring = ph === 2 ? k % 3 === 0 : ph === 4 ? k % 2 === 0 : false, half = (ph === 3 && k % 3 !== 2) || (ph === 4 && e.eclipse && k % 4 === 1); // the Eclipse burns halves at Full Moon too
    if (half) { e.side = k % 3 === 0 ? (p.x < 192 ? 0 : 1) : 1 - e.side; e.half = [e.side, NB_HALF_T]; e.state = 'halfT'; e.t = NB_HALF_T + NB_HALF_BURN; Audio_.sfx('charge'); if (k % 3 === 1) e.nod = true; }
    else if (ring) { e.state = 'glint'; e.t = 0.6; Audio_.sfx('charge'); }
    else { e.state = 'petal'; e.t = 0.55; e.pi = ph === 1 ? k % 4 : (e.pi + 1) % 4; if (ph === 1 && k % 4 === 3) e.nod = true; }
  } else if (e.state === 'petal') {
    if (e.t > 0) return;
    const [x, y] = nbPetal(e, e.pi);
    fan(x, y, Math.atan2(p.y - 7 - y, p.x - x), ph === 4 ? 4 : 5, 0.3, 54, 'petal');
    Audio_.sfx('eshoot');
    e.state = 'rest'; e.t = ph === 1 ? 0.5 : 0.9;
    if (e.nod) { e.nod = false; e.t = 0.4; stagger(e, 1.8); toast('THE BLOOM NODS OFF!'); }
  } else if (e.state === 'glint') {
    if (e.t > 0) return;
    // a ring with a gap toward the hero: the wells bend it into crescents
    const a = Math.atan2(p.y - cy, p.x - e.x), n = ph === 4 ? 18 : 16;
    for (let i = 0; i < n; i++) { const b = a + (i + 0.5) * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.55) ebullet(e.x, cy, b, 50, 'petal'); }
    Audio_.sfx('boom');
    if (ph === 4) { e.state = 'spiral'; e.t = 1.4; e.w = 0; e.a0 = a; }
    else { e.state = 'ring'; e.t = 0.6; }
  } else if (e.state === 'ring') {
    if (e.t <= 0) { e.state = 'rest'; e.t = 0.6; stagger(e, 1.6); toast('THE BLOOM NODS OFF!'); }
  } else if (e.state === 'spiral') {
    // Full Moon: two arms of petals turning after the ring
    if ((e.w -= dt) <= 0) { e.w = 0.16; const b = e.a0 + (1.4 - e.t) * 2.6; ebullet(e.x, cy, b, 46, 'petal'); ebullet(e.x, cy, b + Math.PI, 46, 'petal'); }
    if (e.t <= 0) { e.state = 'rest'; e.t = 0.5; stagger(e, 1.8); toast('THE BLOOM NODS OFF!'); }
  } else if (e.state === 'halfT') {
    if (e.t <= 0) { e.state = 'rest'; e.t = 0.5; if (e.nod) { e.nod = false; stagger(e, 2); toast('IT CLOSES ITS PETALS!'); } }
  }
};
// Half Moon: is this hero on the burning half? (net.js clientHits asks the hurts hook too)
function nbHalfHurts(room, p) {
  const b = G.enemies.find(e => !e.dead && e.type === 'nbloom' && e.half);
  return !!b && b.half[1] <= 0 && (b.half[0] === 0 ? p.x < 188 : p.x > 196) && !(p.dashT > 0); // the seam between the halves is safe
}
LAND_MECH.moon.hurts = nbHalfHurts;
const _mnUpdate = LAND_MECH.moon.update;
LAND_MECH.moon.update = function (dt, room) {
  _mnUpdate(dt, room);
  for (const p of G.players) if (alive(p) && nbHalfHurts(room, p)) hurtPlayer(p, 1, 'nbloom');
};
// the wells a fight adds: the bunny's lamp, the pillars from Crescent on, the bloom itself at Full Moon
moonExtraWells = function (room) {
  const out = [];
  for (const e of G.enemies) {
    if (e.dead) continue;
    if (e.type === 'lbunny' && !(e.stag > 0)) { const [x, y] = lampAt(e); out.push([x, y, 1.3]); }
    if (e.type === 'nbloom' && (e.phase || 1) >= 2) {
      for (const [x, y] of NB_PILLARS) out.push([x, y, e.phase >= 4 ? 1.2 : 0.8]); // Full Moon: all four at full pull
    }
  }
  return out;
};
// the Night Bloom's petals, the Big Stars round it, and the Half Moon's glow
moonDraw1 = function (ox, oy, room) {
  for (const e of G.enemies) {
    if (e.dead || e.type !== 'nbloom' || e.spawnT > 0) continue;
    for (let i = 0; i < 4; i++) {
      const [x, y] = nbPetal(e, i), s = S('spetal_' + (e.state === 'petal' && e.pi === i ? 1 : 0));
      drawS(s, Math.round(ox + x) - (s.w >> 1), Math.round(oy + y) - (s.h >> 1));
    }
    // the Eclipse: a dark ring crosses its golden face
    if (e.eclipse) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; rect(Math.round(ox + e.x + Math.cos(a) * 15) + 4, Math.round(oy + e.y - 27 + Math.sin(a) * 14), 2, 2, i % 2 ? '0' : '1'); }
    const n = Save.story.stars.length;
    for (let i = 0; i < n; i++) { const a = -G.time * 0.7 + i * Math.PI * 2 / n; drawS(S('ebb_mstar'), Math.round(ox + e.x + Math.cos(a) * 52) - 3, Math.round(oy + e.y - 26 + Math.sin(a) * 34) - 3); }
    if (!e.half) continue;
    // the half that will burn: a dotted glow, then flames of light
    const x0 = e.half[0] === 0 ? 16 : 192, burn = e.half[1] <= 0, blink = Math.floor(G.time * (e.half[1] < 0.5 ? 12 : 6)) % 2;
    for (let y = OY + 34; y < OY + 196; y += 8) for (let x = x0 + 4; x < x0 + 176; x += 8) {
      if (room.tiles[Math.floor((y - OY) / 16) * COLS + Math.floor(x / 16)] !== T_FLOOR) continue;
      if (burn) { if ((x + y + Math.floor(G.time * 20)) % 3 === 0) rect(ox + x, oy + y - 1, 1, 3, (x + y) % 2 ? 'Y' : 'q'); else rect(ox + x, oy + y, 2, 1, 'P'); }
      else if (blink || (x + y) % 16 === 0) rect(ox + x, oy + y, 1, 1, 'q');
    }
  }
};
BEASTS.push({ t: 'nbloom', spr: 'nbloom_0', boss: true, lore: ['THE LAST FLOWER OF THE STAR ROAD.', 'IN THE DARK, WATCH ITS PETALS.', 'WHEN THE MOON IS FULL, IT ENDS.'] });

// ---------- The Wishing Pond (the Moon Garden's special room) ----------
// Throw a coin in the pond: usually a blessing; one time in three a small curse (half a heart
// less) comes with a bigger blessing (two of them). One wish per pond.
const WISH_COST = 5;
function pondStock(room) { room.props.push({ kind: 'wpond', x: 192, y: 112, t: 0, used: false }); }
function pondUse(o, p) {
  if (o.used) { say(p, 'THE POND IS STILL'); Audio_.sfx('deny'); return; }
  if (G.coins < WISH_COST) { say(p, 'A WISH COSTS ' + WISH_COST + ' COINS'); Audio_.sfx('deny'); return; }
  G.coins -= WISH_COST; o.used = true; G.propsN++;
  pondFx(o);
  const keys = Object.keys(BLESSINGS), curse = grand() < 0.34;
  const first = gpick(keys), picks = curse ? [first, gpick(keys.filter(k => k !== first))] : [first];
  for (const q of G.players) if (!q.dead) {
    if (curse) { q.maxHp = Math.max(2, q.maxHp - 1); q.hp = Math.min(q.hp, q.maxHp); }
    for (const k of picks) BLESSINGS[k].apply(q);
  }
  const names = picks.map(k => BLESSINGS[k].name).join(' + ');
  G.banner = { title: curse ? 'A WISH FOR HALF A HEART' : 'YOUR WISH COMES TRUE', sub: names, t: 2.6, icon: null };
  Audio_.sfx(curse ? 'roar' : 'ult');
}
function pondFx(o) {
  burst(o.x, o.y - 6, 18, ['Y', 'w', '4', 'C'], 90, 0.7, { g: -30 });
  Audio_.sfx('coin');
}
(function pondArt() {
  def('wpond', MN_([
    '......mmmmmmmmmm......',
    '...mmmllllllllllmmm...',
    '.mmll0000000000000llm.',
    'mll00011111111110000lm',
    'ml001111Y11111111100lm',
    'ml0011111111111Y1100lm',
    'ml0001111111111111000m',
    'mll00011111Y1111000llm',
    '.mmll000000000000llmm.',
    '...mmmllllllllllmmm...',
    '......mmmmmmmmmm......',
  ]));
})();
function drawPond(o, x, y) {
  const s = S('wpond');
  drawS(s, x - (s.w >> 1), y - s.h + 6);
  // stars twinkle in it; ripples when a wish is made
  for (let i = 0; i < 3; i++) if (Math.floor(G.time * 2 + i * 1.7) % 3 === 0) rect(x - 6 + i * 6, y - 6 + (i % 2) * 2, 1, 1, 'w');
  if (!o.used && Math.floor(o.t * 3) % 3 === 0) drawS(S('sparkle_0'), x + 2, y - 14);
}
