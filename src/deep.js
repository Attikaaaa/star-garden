'use strict';
// ---------- The Glow Deep (Currents) ----------
// A current runs through every fight room (a direction from the room's seed, or a whirlpool in
// the Whirlpool room) and carries heroes, walking foes, shots and bullets (the drift hook; shots
// and bullets at half strength). It turns round every 20 beats of the Deep's 100 bpm (12 s), each
// room on its own count; for the last 2.5 beats before it turns, the floor arrows flash. Bubble
// vents (layout 'o') let a bubble go every few seconds: touch one and your next shot is a big slow
// bubble that pops into a ring of shots. Everything is worked out from G.beat and the room's seed,
// so every screen agrees; a hero's bubble is judged where the game runs (NET.fx 'bpop').
const CUR_V = 26, CUR_BEATS = 20, CUR_WARN = 2.5, BUB_EVERY = 3, BUB_LIFE = 2.6, BUB_RISE = 22;
const DP_ = (rows) => { const w = rows[0].length, pad = '.'.repeat(w + 2); return autoOutline([pad, ...rows.map(r => '.' + r + '.'), pad]); };

// ---------- Tile art ----------
(function deepTiles() {
  // a kelp clump on a rock: taller than its tile, it rises over the one above
  def('rock_deep', DP_([
    '....G.....h...',
    '...Gg....hG...',
    '...Gg....Gg...',
    '....Gg..Gg....',
    '....hG..Gg..h.',
    '...Gg...hG.Gg.',
    '..Gg....Gg.Gg.',
    '..hG...Gg..hG.',
    '...Gg..hG.Gg..',
    '...hG..Gg.hG..',
    '....Gg.hGGg...',
    '.....GgGgGg...',
    '..1122bbb22...',
    '.1222bBBbb221.',
    '12bbbBBBBbbb21',
    '12bbbbbbbbbb21',
    '.11222222222..',
  ]));
  // the Wreck's hull planks (rockArt in the Wreck room)
  def('hull_deep', DP_([
    'nNNNNNNNNNNNNn',
    'unnnnnnnnnnnnu',
    'NNNNNNNnNNNNNN',
    'nnnnnnnunnnnnn',
    'uuuuuuuuuuuuuu',
    'NNNnNNNNNNnNNN',
    'nnnunnnnnnunnn',
    'uuuuuuuuuuuuuu',
    'NNNNNNNnNNNNNN',
    'nnnnTnnunnTnnn',
    'uuuuuuuuuuuuuu',
    '.uuuuuuuuuuuu.',
  ]));
  // a barnacled amphora
  def('brk_deep', DP_([
    '....nNNn....',
    '.....nn.....',
    '...nNNNNn...',
    '..nNNwNNNn..',
    '.nNNNNNNNNn.',
    '.nNlNNNNlNn.',
    '.nNNNNNNNNn.',
    '..nNNlNNNn..',
    '...nNNNNn...',
    '....nnnn....',
  ]));
  // a bubble, and the big bubble a hero's shot becomes
  def('dbub', DP_(['.CC.', 'Cw.C', 'C..C', '.CC.']));
  for (let i = 0; i < 2; i++) def('shotbiggb_' + i, DP_(i ? ['..CCCC..', '.C.w..C.', 'C.ww...C', 'C......C', 'C......C', 'C......C', '.C....C.', '..CCCC..'] : ['..CCCC..', '.Cw...C.', 'Cww....C', 'C......C', 'C......C', 'C.....cC', '.C...cC.', '..CCCC..']));
  for (let i = 0; i < 2; i++) def('shotbigpl_' + i, DP_(['.LLL.', 'LwwLl', 'LwLll', 'Llllm', '.lmm.'].map((r, y) => i && y === 1 ? 'LwLLl' : r)));
})();
// the Wreck's rocks are its hull
const _dpRock = rockArt;
rockArt = function (room, c, r, theme) { return theme === 'deep' && room.lay === 'hull' ? 'hull_deep' : _dpRock(room, c, r, theme); };

// sand ripples, and the vents
THEMES.deep.paint = function (g, room) {
  const f = (x, y, w, h, k) => { g.fillStyle = PAL[k]; g.fillRect(x, y, w, h); };
  for (let r = 2; r <= 11; r++) for (let c = 1; c <= 22; c++) {
    const i = r * COLS + c, x = c * 16, y = OY + r * 16, h = hash(c, r, room.seed);
    if (room.tiles[i] !== T_FLOOR) continue;
    if (h % 3 === 0) f(x + 2 + h % 8, y + 4 + (h >> 4) % 8, 5, 1, '2');
    if (h % 11 === 0) f(x + 4 + (h >> 3) % 6, y + 10, 1, 1, 'T');
  }
  for (const i of room.vents || []) {
    const x = (i % COLS) * 16, y = OY + ((i / COLS) | 0) * 16;
    f(x + 3, y + 5, 10, 8, '0'); f(x + 2, y + 6, 12, 6, '0'); f(x + 4, y + 6, 8, 6, '1'); f(x + 5, y + 7, 6, 4, 'b');
    f(x + 4, y + 5, 8, 1, 'T'); f(x + 3, y + 6, 1, 2, 'T'); f(x + 12, y + 6, 1, 2, 't');
  }
};

// ---------- Rooms ----------
LAND_LAYOUTS.deep = {
  // Kelp Forest: kelp everywhere, tall enough to hide behind
  kelp: `......................
    ..e.......ee.......e..
    ...#....#....#....#...
    ......................
    .....#....ee....#.....
    ......................
    ...#....#....#....#...
    ......................
    ..e.......ee.......e..
    ......................`,
  // Whirlpool: the current runs round the rock in the middle
  whirl: `......................
    ..e................e..
    ......................
    .........####.........
    ..e......####......e..
    .........####.........
    .........####.........
    ......................
    ..e................e..
    ......................`,
  // Wreck: a sunken hull, open at the bottom, amphorae in the hold
  hull: `......................
    ..e................e..
    .....############.....
    ....#.....bb.....#....
    ....#..e......e..#....
    ....#............#....
    .....####....####.....
    ......................
    ..e................e..
    ......................`,
  // Vent Field: rows of bubble vents
  vents: `......................
    ..e.......ee.......e..
    ......................
    ...o....o....o....o...
    ......................
    ......................
    ...o....o....o....o...
    ......................
    ..e.......ee.......e..
    ......................`,
  // Pearl Cave: no current, and a chest of pearls when it is won
  pearl: `......................
    ..e................e..
    ...##............##...
    ...#......o.......#...
    ..........ee..........
    ......................
    ...#..............#...
    ...##............##...
    ..e................e..
    ......................`,
  // Jellyfish Meadow: drifters on a slow tide
  jelly: `......................
    ..e......e..e......e..
    ......................
    ....#............#....
    ..e.......ee.......e..
    ......................
    ....#............#....
    ......................
    ..e......e..e......e..
    ......................`,
};
for (const k in LAND_LAYOUTS.deep) LAND_LAYOUTS.deep[k] = LAND_LAYOUTS.deep[k].split('\n').map(r => r.trim());
Object.assign(LAY_RULE, {
  kelp: { pool: [['lfish', 2], ['eel', 2], ['drifter', 1]] },
  whirl: { pool: [['urchin', 3], ['drifter', 2]] },
  hull: { pool: [['clam', 2], ['eel', 2], ['lfish', 1]] },
  vents: { pool: [['drifter', 2], ['urchin', 2], ['clam', 1]] },
  pearl: { pool: [['clam', 3], ['lfish', 1]] },
  jelly: { pool: [['drifter', 5]] },
});

// ---------- The current ----------
// room.cur: [dx, dy] (a unit step) or 'whirl'; it flips every CUR_BEATS beats (room.cb: the room's offset)
function curSign(room) { return Math.floor((G.beat + room.cb) / CUR_BEATS) % 2 ? -1 : 1; }
const curWarn = (room) => CUR_BEATS - (G.beat + room.cb) % CUR_BEATS < CUR_WARN;
const curOn = (room) => !!room.cur && !room.cleared && !!G.beat;
const curV = () => (assistOn() ? CUR_V * 0.6 : CUR_V);
// the current's push at (x, y) in px/s
function curAt(room, x, y, out) {
  const v = curV() * curSign(room);
  if (room.cur === 'whirl') {
    const dx = x - 192, dy = (y - (OY + 120)) * 1.4, d = Math.hypot(dx, dy) || 1;
    out[0] = -dy / d * v - dx / d * 6; out[1] = dx / d * v * 0.7 - dy / d * 6; // round, and a little inward
  } else { out[0] = room.cur[0] * v; out[1] = room.cur[1] * v; }
  return out;
}
const CUR_TMP = [0, 0];

// ---------- Bubbles ----------
// bubble k of vent j rises from the vent at (k * BUB_EVERY + its offset) on the shared clock
function bubbles(room, fn) {
  if (!room.vents || !room.vents.length || !G.beat) return;
  const now = skyNow();
  room.vents.forEach((i, j) => {
    const off = (hash(i, 31, room.seed) % 100) / 100 * BUB_EVERY, k = Math.floor((now - off) / BUB_EVERY), age = now - off - k * BUB_EVERY;
    if (age > BUB_LIFE) return;
    const key = j * 100000 + (k % 100000);
    if (room.bpop && room.bpop.has(key)) return;
    const [cx, cy] = curOn(room) ? curAt(room, (i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 + 8, CUR_TMP) : [0, 0];
    fn(key, (i % COLS) * 16 + 8 + cx * 0.5 * age + Math.sin(age * 4 + j) * 2, OY + ((i / COLS) | 0) * 16 + 6 - BUB_RISE * age + cy * 0.5 * age, age);
  });
}
function bubblePop(room, key, x, y) {
  (room.bpop || (room.bpop = new Set())).add(key);
  if (room.bpop.size > 200) room.bpop.delete(room.bpop.values().next().value);
  burst(x, y, 6, ['C', 'w', 'c'], 50, 0.3);
  Audio_.sfx('bubble');
  if (NET.role === 'host') NET.fx.push(['bpop', key]);
}

LAND_MECH.deep = {
  // the current and its offset, the vents
  build(room) {
    const L = room.lay && LAND_LAYOUTS.deep[room.lay];
    if (L) {
      const [fx, fy] = room.flip || [false, false];
      for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) if (L[fy ? 9 - y : y][fx ? 21 - x : x] === 'o') (room.vents || (room.vents = [])).push((y + 2) * COLS + x + 1);
    }
    room.cb = hash(room.seed, 3, 77) % CUR_BEATS;
    if (room.type !== 'normal' || room.lay === 'pearl') return;
    room.cur = room.lay === 'whirl' ? 'whirl' : [[1, 0], [-1, 0], [0, 1], [0, -1]][hash(room.seed, 9, 41) % 4];
  },
  drift(room, x, y, out) {
    if (!curOn(room)) return;
    curAt(room, x, y, CUR_TMP);
    out.cx += CUR_TMP[0]; out.cy += CUR_TMP[1];
  },
  // every screen: Sea Angels pull bullets round themselves (room.wells from their places)
  every(dt, room) {
    const angels = G.enemies.filter(e => !e.dead && e.type === 'angel');
    room.wells = angels.length ? angels.map(e => [e.x, e.y - 8, 1.2]) : null;
    // the Grand Anglerfish's phase 3: the room spins, and vents send up bubbles
    if (room.type === 'boss' && !room.cur && G.enemies.some(e => !e.dead && e.type === 'angler' && e.p3)) { room.cur = 'whirl'; room.vents = ANG_VENTS.slice(); }
  },
  // host / solo: heroes catch bubbles; the Pearl Cave's chest
  update(dt, room) {
    bubbles(room, (key, x, y) => {
      for (const p of G.players) if (alive(p) && !p.bub && Math.abs(p.x - x) < 9 && Math.abs(p.y - 8 - y) < 10) { p.bub = true; bubblePop(room, key, x, y); say(p, 'BUBBLE!'); break; }
    });
    if (room.type === 'pearlroom') { pearlUpdate(dt, room); return; }
    if (room.lay === 'pearl' && room.cleared && !room.chest) {
      room.chest = true;
      for (let k = 0; k < 6; k++) spawnPickup('coin', 192, OY + 104);
      spawnPickup('gem', 192, OY + 104);
      burst(192, OY + 100, 20, ['w', 'C', 'q'], 100, 0.7, { g: -30 });
      Audio_.sfx('win'); toast('THE PEARL CAVE OPENS ITS CHEST!');
    }
    if (room.type === 'normal' && !room.cleared && room.sa === undefined) room.sa = !G.first && grand() < 0.18 ? grnd(5, 9) : 0;
    if (room.sa > 0 && G.enemies.length && (room.sa -= dt) <= 0) {
      room.sa = 0;
      spawnEnemy('angel', 192, OY + 70, { elite: true });
      toast('A SEA ANGEL! BULLETS CURL ROUND IT');
    }
  },
  drawLayer(ox, oy, room, layer) {
    if (layer === 0) {
      if (room.type === 'pearlroom') pearlDraw(ox, oy, room);
      if (!curOn(room)) return;
      // arrows on the floor roll with the current, and flash before it turns
      const warn = curWarn(room), key = warn ? (Math.floor(G.time * 10) % 2 ? 'w' : 'H') : 'b';
      const s = curSign(room), off = (G.time * curV()) % 48;
      for (let gy = OY + 40; gy < OY + 192; gy += 32) for (let gx = 24; gx < VW - 16; gx += 48) {
        let x = gx, y = gy + ((gx / 48) % 2) * 16, d;
        if (room.cur === 'whirl') {
          curAt(room, x, y, CUR_TMP);
          d = Math.abs(CUR_TMP[0]) > Math.abs(CUR_TMP[1]) ? (CUR_TMP[0] > 0 ? 1 : 3) : (CUR_TMP[1] > 0 ? 2 : 4);
        } else {
          const [cx, cy] = room.cur;
          d = cx ? (cx * s > 0 ? 1 : 3) : (cy * s > 0 ? 2 : 4);
          x += cx * s * off; y += cy * s * off * 0.67;
          if (x > VW - 20) x -= VW - 40; else if (x < 20) x += VW - 40;
          if (y > OY + 188) y -= 152; else if (y < OY + 36) y += 152;
        }
        const t = room.tiles[Math.floor((y - OY) / 16) * COLS + Math.floor(x / 16)];
        if (t === T_FLOOR) { chev(Math.round(ox + x), Math.round(oy + y), d, key); if (warn) chev(Math.round(ox + x) + (d === 1 ? -4 : d === 3 ? 4 : 0), Math.round(oy + y) + (d === 2 ? -4 : d === 4 ? 4 : 0), d, key); }
      }
      return;
    }
    if (layer !== 1) return;
    bubbles(room, (key, x, y, age) => { if (age < BUB_LIFE - 0.3 || Math.floor(G.time * 12) % 2) drawS(S('dbub'), Math.round(ox + x) - 3, Math.round(oy + y) - 3); });
    // a hero carrying a bubble
    for (const p of G.players) if (p.bub && alive(p)) drawS(S('dbub'), Math.round(ox + p.x) - 3, Math.round(oy + p.y) - 26 + Math.round(Math.sin(G.time * 4) * 1.5));
    angelDraw(ox, oy);
    anglerDark(ox, oy);
    anglerDraw(ox, oy);
  },
};

// ---------- The bubble shot, and the Pearl Necklace ----------
const _dpShoot = playerShoot;
playerShoot = function (p, ax, ay) {
  const n0 = SHOTS.length;
  if (p.bub && G.floor && G.floor.land.id === 'deep') {
    // the big bubble: slow, hits hard, and pops into a ring of shots
    p.bub = false;
    const a = Math.atan2(ay, ax), s = newShot(p.x + Math.cos(a) * 4, p.y - 8, a, p.shotSpeed * 0.45, 2, dmgOf(p) * 3, 'wand', p);
    s.big = true; s.r = 6; s.tint = 'gb'; s.bubT = 0.9;
    SHOTS.push(s);
    p.cool = p.fireDelay;
    Audio_.sfx('bubble');
    return;
  }
  _dpShoot(p, ax, ay);
  // PEARL NECKLACE: every sixth volley is a pearl, twice as strong
  if (p.pearls && ++p.pearlN >= 6) { p.pearlN = 0; for (let i = n0; i < SHOTS.length; i++) { const s = SHOTS[i]; if (s.own === p && !s.mini && s.kind === 'wand') { s.big = true; s.r = 4; s.tint = 'pl'; s.dmg *= 2; } } }
};
const _dpShotMove = itemShotMove;
itemShotMove = function (s, dt) {
  _dpShotMove(s, dt);
  if (s.bubT === undefined || s.life <= 0 || (s.bubT -= dt) > 0) return;
  s.bubT = undefined;
  bubbleRing(s);
};
function bubbleRing(s) {
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, m = newShot(s.x, s.y, a, 170, 0.45, s.dmg / 3, 'wand', s.own);
    m.tint = 'c'; SHOTS.push(m);
  }
  s.life = 0.001; s.silent = true;
  burst(s.x, s.y, 10, ['C', 'w', 'c'], 80, 0.4);
  Audio_.sfx('bubble');
}

// ---------- The Deep's items ----------
Object.assign(ITEMS, {
  fins: { name: 'FINS', desc: 'DASHING WITH THE CURRENT CARRIES YOU FURTHER', land: 'deep', unique: true, apply: p => { p.fins = true; } },
  pearls: { name: 'PEARL NECKLACE', desc: 'EVERY SIXTH SHOT IS A PEARL: TWICE AS STRONG', land: 'deep', unique: true, apply: p => { p.pearls = true; p.pearlN = 0; } },
  glure: { name: 'GLOW LURE', desc: 'PICKUPS SWIM TO YOU, HEARTS AND POTIONS TOO', land: 'deep', unique: true, apply: p => { p.glure = true; } },
});

// ---------- Foe art ----------
(function deepArt() {
  const o = { flip: true, flash: true, glow: true };
  SN_('drifter_0', `
    ...qqqqq...
    ..qPPPPPq..
    .qPwPPPPPq.
    .qPPPPPPPq.
    .pPPPPPPPp.
    ..p.p.p.p..
    ..q.q.q.q..
    ...q.q.q...`, o);
  SN_('drifter_1', `
    ...........
    ...qqqqq...
    .qqPwPPPPq.
    qPPPPPPPPPq
    .pPPPPPPPp.
    .p..p.p..p.
    ..q.q..q.q.
    .q...q..q..`, o);
  SN_('lfish_0', `
    .HH.
    HwHh
    hHHh
    .hh.`, o);
  SN_('lfish_1', `
    .HH.
    HwwH
    HwHh
    .hh.`, o);
  SN_('lfbody', `
    ......XXXX........
    ....XXxxxxXX......
    ..XXxxxxxxxxX..xx.
    .XxCxxxxxxxxxXxXx.
    XxxxxxxxxxxxxxxXx.
    Xwxwxxxxxxxxxxxx..
    .XwxwxxxxxxxxxX...
    ..XXxxxxxxxXX.....
    ....XXXXXXX.......`, { flip: true });
  SN_('urchin_0', `
    ..1.1.1...
    .1.212.1..
    1.22322.1.
    .2232232..
    122222221.
    .2222222..
    1.21212.1.
    .1.111.1..
    ..1.1.1...`, o);
  SN_('urchin_1', `
    ...1.1.1..
    ..1.212.1.
    .1.22322.1
    ..2232232.
    .122222221
    ..2222222.
    .1.21212.1
    ..1.111.1.
    ...1.1.1..`, o);
  SN_('eel_0', `
    ..............TT..
    .tttTTTTTTTTTTT0T.
    ttTHTTHTTHTTHTTTTT
    .ttttttttttttttt..`, o);
  SN_('eel_1', `
    ......tTTTTT..TT..
    .ttTTTTHTTHTTTT0T.
    tTTTHTt.....tTTTTT
    .tt.............t.`, o);
  def('clam_0', autoOutline(stamp(sculpt(18, 12, [{ e: [9, 7, 8, 4.5], ramp: '1V3q' }]), 3, 6, '.3...3...3.\n3.3.3.3.3.3')), o);
  def('clam_1', stamp(sculpt(18, 14, [{ e: [9, 10, 8, 3.5], ramp: '1V3q' }, { e: [9, 3.5, 8, 3.5], ramp: '1V3q' }]), 7, 6, '.LL.\nLwLl\n.ll.'), o);
  SN_('angel_0', `
    .....CC.....
    ....CwwC....
    ....CwwC....
    ...qCOOCq...
    ..qqCOOCqq..
    .qq.CwwC.qq.
    q...CwwC...q
    ....CwwC....
    .....CC.....
    .....q.q....`, o);
  SN_('angel_1', `
    .....CC.....
    ....CwwC....
    q...CwwC...q
    .qq.COOC.qq.
    ..qqCOOCqq..
    ...qCwwCq...
    ....CwwC....
    ....CwwC....
    .....CC.....
    ....q...q...`, o);
  // item icons
  SN_('icon_fins', `
    ..T......T..
    .TT......TT.
    TTC......CTT
    TCT......TCT
    TTT......TTT
    tTTT....TTTt
    .ttT....Ttt.
    ..tt....tt..`, { sil: '1' });
  SN_('icon_pearls', `
    ..L.L.L.L..
    .L.......L.
    L.........L
    L.........L
    .L.......L.
    ..L.L.L.L..
    ....LwL....
    ...LwLLl...
    ....lll....`, { sil: '1' });
  SN_('icon_glure', `
    .....HH..
    ....HwHh.
    ....hHHh.
    .....hh..
    ....x....
    ...x.....
    ..x......
    .x.......
    x........`, { sil: '1' });
  const B = {
    spine: [['.1.', '121', '.1.'], ['..1..', '.121.', '12321', '.121.', '..1..']],
    glow: [['.H.', 'HwH', '.h.'], ['..H..', '.HwH.', 'HwwwH', '.hHh.', '..h..']],
    dink: [['.x.', 'xXx', '.x.'], ['..x..', '.xXx.', 'xXwXx', '.xXx.', '..x..']],
    pearl: [['.L.', 'LwL', '.l.'], ['.LLL.', 'LwwLL', 'LwLLL', 'LLLLl', '.lll.']],
  };
  for (const k in B) {
    def('eb_' + k, DP_(B[k][0])); def('ebb_' + k, DP_(B[k][1]));
    alias('ebcb_' + k, 'eb_' + k); alias('ebbcb_' + k, 'ebb_' + k);
  }
})();

// ---------- Foes ----------
// a Jelly Drifter's tendrils: a 'zap' marker (c: 'tendril') that stings for a while
const _dpZap = drawZap;
drawZap = function (k, ox, oy) {
  if (k.c !== 'tendril') { _dpZap(k, ox, oy); return; }
  if (k.t < 0.5 && Math.floor(k.t * 12) % 2) return;
  const x = Math.round(ox + k.x), y = Math.round(oy + k.y), young = k.h && k.max - k.t < k.h;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 8; j++) rect(x - 5 + i * 5 + Math.round(Math.sin(G.time * 5 + j * 0.8 + i) * 1.5), y - 6 + j, 1, 1, young ? 'q' : j % 3 ? 'P' : 'q');
};
// the Lantern Fish's body hangs behind its lure, away from where it faces
const lfBody = (e) => [e.x + (e.flip ? -14 : 14), e.y - 6];
function angelDraw(ox, oy) {
  for (const e of G.enemies) {
    if (e.dead || e.type !== 'angel') continue;
    for (let i = 0; i < 6; i++) { const a = G.time * 2 + i * Math.PI / 3, r = 20 + Math.sin(G.time * 3 + i) * 3; rect(Math.round(ox + e.x + Math.cos(a) * r), Math.round(oy + e.y - 10 + Math.sin(a) * r * 0.6), 1, 1, i % 2 ? 'C' : 'q'); }
  }
}
Object.assign(EDEF, {
  // pulses toward the hero with the current, and leaves stinging tendrils behind
  drifter: { hp: 8, r: 6, h: 12, hw: 5, hh: 3, sw: 14, colors: ['P', 'q', 'w'],
    sprite: (e) => S('drifter_' + (e.state === 'pulse' ? 1 : 0)) },
  // the lure is the fish: hit it there; its dark body only hangs behind
  lfish: { hp: 7, r: 5, h: 8, hw: 4, hh: 3, sw: 10, colors: ['H', 'h', 'x'],
    sprite: (e) => S('lfish_' + (e.state === 'aim' ? 1 : Math.floor(e.anim * 3) % 2)),
    under: (e, ox, oy) => {
      const [bx, by] = lfBody(e), s = S('lfbody');
      drawS(s, Math.round(ox + bx - (s.w >> 1)), Math.round(oy + by - s.h + 4 - (e.z || 0)), e.flip ? 1 : 0);
      for (let k = 1; k < 5; k++) rect(Math.round(ox + e.x + (bx - e.x) * k / 5), Math.round(oy + e.y - 6 - (e.z || 0) - Math.sin(k / 5 * Math.PI) * 4 - (by - e.y + 6) * 0), 1, 1, 'x');
    } },
  // rolls along with the current; shot open, it bursts into spines
  urchin: { hp: 6, r: 5, h: 9, hw: 4, hh: 3, sw: 12, colors: ['1', '2', '3'],
    sprite: (e) => S('urchin_' + (Math.floor(e.anim * 4) % 2)),
    die: (e) => { E_SRC = 'urchin'; ring(e.x, e.y - 5, 6, 50, 'spine', grand()); Audio_.sfx('pop'); } },
  // shows its lane along the current, then shoots down it
  eel: { hp: 10, r: 6, h: 6, hw: 7, hh: 3, sw: 18, colors: ['T', 't', 'H'],
    sprite: (e) => S('eel_' + (e.state === 'dash' ? 1 : Math.floor(e.anim * 4) % 2)) },
  // shut, its shell takes a quarter of the damage; it opens (glint) to fire pearls
  clam: { hp: 14, r: 7, h: 11, hw: 7, hh: 4, sw: 18, still: true, colors: ['V', '3', 'L'],
    init: (e) => { e.sh = 1; },
    sprite: (e) => S(e.sh ? 'clam_0' : 'clam_1'),
    glint: (e) => (e.state === 'open' ? [0, -12] : null) },
  // the elite: bullets curl round it (room.wells), and it sends spirals of light
  angel: { hp: 18, r: 6, h: 14, hw: 5, hh: 3, sw: 14, fly: true, colors: ['C', 'q', 'O'],
    sprite: (e) => S('angel_' + (Math.floor(e.anim * 3) % 2)),
    glint: (e) => (e.state === 'glow' ? [0, -18] : null) },
});
Object.assign(FOE_NAMES, { drifter: 'JELLY DRIFTER', lfish: 'LANTERN FISH', urchin: 'URCHIN BALL', eel: 'EEL', clam: 'GIANT CLAM', angel: 'SEA ANGEL' });
Object.assign(AI, {
  drifter(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'float'; e.t = grnd(1, 1.6); }
    if (e.state === 'float') {
      moveBox(room, e, Math.sin(e.anim * 2) * 6 * dt, 0, 'enemy');
      if (e.t <= 0 && p) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.vx = Math.cos(a) * 50; e.vy = Math.sin(a) * 50; e.state = 'pulse'; e.t = 0.45; e.flip = e.vx < 0; }
    } else if (e.state === 'pulse') {
      moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
      if (e.t <= 0) {
        e.state = 'float'; e.t = grnd(1.2, 1.7);
        const [x, y] = cellMid(e.x, e.y);
        if (G.markers.filter(k => k.c === 'tendril').length < 16 && !G.markers.some(k => k.c === 'tendril' && k.x === x && k.y === y)) G.markers.push({ kind: 'zap', c: 'tendril', x, y, t: 2.4, max: 2.4, src: 'drifter', h: 0.5 });
      }
    }
  },
  lfish(e, dt, room, p) {
    e.t -= dt;
    e.z = 6 + Math.sin(e.anim * 2) * 2;
    if (e.state === 'idle') { e.state = 'hover'; e.t = grnd(1.5, 2.5); }
    if (!p) return;
    if (e.state === 'hover') {
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, want = d > 80 ? 30 : d < 56 ? -30 : 0;
      moveBox(room, e, dx / d * want * dt, dy / d * want * dt, 'fly');
      e.flip = dx < 0;
      if (e.t <= 0) {
        e.state = 'aim'; e.t = 0.7;
        let len = 20;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        while (len < 150 && !boxSolid(room, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.hw, e.hh, 'fly')) len += 6;
        lane(e, p, len); e.len = len - 6;
      }
    } else if (e.state === 'aim' && e.t <= 0) { e.state = 'lunge'; e.t = e.len / 150; Audio_.sfx('chomp'); }
    else if (e.state === 'lunge') {
      const bl = moveBox(room, e, Math.cos(e.la) * 150 * dt, Math.sin(e.la) * 150 * dt, 'fly');
      if (bl || e.t <= 0) { e.state = 'hover'; e.t = grnd(1.8, 2.6); }
    }
  },
  urchin(e, dt, room) {
    const d = towardPlayer(e);
    moveBox(room, e, d.x * 12 * dt, d.y * 12 * dt, 'enemy');
  },
  eel(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'swim'; e.t = grnd(1.4, 2.2); }
    if (!p) return;
    if (e.state === 'swim') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 26 * dt, d.y * 26 * dt, 'enemy'); e.flip = d.x < 0;
      if (e.t > 0) return;
      // along the current when the hero is in its lane; otherwise straight at the hero
      const c = room.cur && room.cur !== 'whirl' ? room.cur : null;
      let a = Math.atan2(p.y - e.y, p.x - e.x);
      if (c && c[0] && Math.abs(p.y - e.y) < 24) a = p.x < e.x ? Math.PI : 0;
      else if (c && c[1] && Math.abs(p.x - e.x) < 24) a = p.y < e.y ? -Math.PI / 2 : Math.PI / 2;
      e.state = 'aim'; e.t = 0.7;
      let len = 20;
      while (len < 220 && !boxSolid(room, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.hw, e.hh, 'enemy')) len += 6;
      e.la = a; G.markers.push({ kind: 'lane', x: e.x, y: e.y - 3, a, t: 0.7, max: 0.7, len }); e.len = len - 6; e.flip = Math.cos(a) < 0;
    } else if (e.state === 'aim' && e.t <= 0) { e.state = 'dash'; e.t = e.len / 180; Audio_.sfx('dash'); }
    else if (e.state === 'dash') {
      const bl = moveBox(room, e, Math.cos(e.la) * 180 * dt, Math.sin(e.la) * 180 * dt, 'enemy');
      if (bl || e.t <= 0) { e.state = 'swim'; e.t = grnd(1.6, 2.4); }
    }
  },
  clam(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'shut'; e.t = grnd(1.5, 2.5); e.sh = 1; }
    if (e.state === 'shut' && e.t <= 0) { e.state = 'open'; e.t = 0.5; e.sh = 0; Audio_.sfx('clack'); }
    else if (e.state === 'open' && e.t <= 0) {
      if (p) { fan(e.x, e.y - 6, Math.atan2(p.y - 7 - (e.y - 6), p.x - e.x), 3, 0.3, 58, 'pearl'); Audio_.sfx('eshoot'); }
      e.state = 'gape'; e.t = 1.6;
    } else if (e.state === 'gape' && e.t <= 0) { e.state = 'shut'; e.t = grnd(2, 2.8); e.sh = 1; Audio_.sfx('clack'); }
  },
  angel(e, dt, room, p) {
    e.t -= dt;
    e.z = 8 + Math.sin(e.anim * 2) * 2;
    if (e.state === 'idle') { e.state = 'drift'; e.t = grnd(2, 3); }
    moveBox(room, e, Math.cos(e.anim * 0.7) * 18 * dt, Math.sin(e.anim * 0.9) * 12 * dt, 'fly');
    if (e.state === 'drift' && e.t <= 0) { e.state = 'glow'; e.t = 0.6; Audio_.sfx('charge'); }
    else if (e.state === 'glow' && e.t <= 0) { ring(e.x, e.y - 12, 6, 44, 'glow', e.anim); Audio_.sfx('eshoot'); e.state = 'drift'; e.t = grnd(2.6, 3.4); }
  },
});
EF_EXTRA.push('bub');
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'drifter', spr: 'drifter_0', lore: ['A JELLY ON THE CURRENT.', 'IT PULSES TOWARD YOU.', 'ITS TENDRILS STING FOR A WHILE.'] },
  { t: 'lfish', spr: 'lfish_0', lore: ['THE LIGHT IS THE FISH.', 'ITS DARK BODY ONLY HANGS BEHIND.', 'IT LUNGES DOWN A CYAN LANE.'] },
  { t: 'urchin', spr: 'urchin_0', lore: ['A BALL OF SPINES.', 'THE CURRENT ROLLS IT ALONG.', 'SHOT OPEN, IT SHOOTS ITS SPINES.'] },
  { t: 'eel', spr: 'eel_0', lore: ['A LONG FISH WITH A GLOWING STRIPE.', 'IT DARTS ALONG THE CURRENT.', 'STEP OFF THE CYAN LANE.'] },
  { t: 'clam', spr: 'clam_0', lore: ['SHUT, ITS SHELL IS HARD.', 'IT OPENS TO FIRE PEARLS.', 'HIT IT WHILE IT GAPES.'] },
  { t: 'angel', spr: 'angel_0', lore: ['A SEA ANGEL, SOFT AS GLASS.', 'BULLETS CURL ROUND IT.', 'SO DO YOUR SHOTS.'] },
);

// ---------- The Manta Courier (warden of the Glow Deep) ----------
// A wide manta gliding down cyan lanes, dropping bubbles behind it that pop into rings of light
// (phase 2). Between passes, a fan of light (glint first). Every third round it rolls into a
// loop: a ring of light with a gap toward the hero, and then it is tired.
(function mantaArt() {
  const o = { flash: true, flip: true };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const manta = (f) => {
    const dy = f.d ? 3 : f.st ? 2 : f.tl ? 1 : 0, w = f.b ? -2 : f.a ? 2 : f.m ? -1 : 0;
    let r = sculpt(46, 26, [
      { e: [10, 12 + w + dy, 10, 3.5], ramp: 'btTC' }, { e: [36, 12 + w + dy, 10, 3.5], ramp: 'btTC' },
      { r: [22, 17 + dy, 2, 5, 0], ramp: 'bbtt' }, // the tail
      { e: [23, 12 + dy, 10, 7], ramp: f.p ? 'bpPq' : 'btTC' },
    ]);
    r = stamp(r, 4, 11 + w + dy, 'H....................................H');
    r = autoOutline(r);
    r = bossEyes(r, 18, 9 + dy, 7, f.face);
    r = stamp(r, 21, 14 + dy, MOUTH[f.face]);
    return rim(r, { T: 'C' });
  };
  bossFrames('manta', manta, o);
})();
Object.assign(EDEF, {
  manta: { hp: 260, r: 11, h: 22, hw: 10, hh: 5, sw: 46, fly: true, warden: true, intro: 'IT CARRIES THE POST THROUGH THE DEEP', colors: ['T', 'C', 'H'],
    init: (e) => { e.state = 'wait'; e.t = 1; e.n = 0; e.z = 6; },
    sprite: (e) => bossFrame(e, { glint: 'tell', wind: 'tell', aim: 'tell', glide: 'move', loop: 'atk' }[e.state] || bob(e, 3, '0', '1')),
    glint: (e) => (e.state === 'glint' || e.state === 'wind' ? [0, -20] : null) },
});
FOE_NAMES.manta = 'MANTA COURIER';
WARDENS.deep = 'manta';
AI.manta = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'manta';
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  e.z = 6 + Math.sin(e.anim * 2) * 2;
  if (!p) return;
  if (e.state === 'wait' || e.state === 'glint') {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, want = d > 80 ? 36 : d < 56 ? -36 : 0;
    moveBox(room, e, dx / d * want * dt, dy / d * want * dt, 'fly');
    e.flip = dx < 0;
  }
  if (e.state === 'wait') {
    if (e.t > 0) return;
    const k = e.n++ % 3;
    if (k === 0) { e.state = 'aim'; e.t = 0.8; e.passes = e.p2 ? 2 : 1; mantaAim(e, room, p); }
    else if (k === 1) { e.state = 'glint'; e.t = 0.55; }
    else { e.state = 'wind'; e.t = 0.9; Audio_.sfx('charge'); }
  } else if (e.state === 'aim') {
    if (e.t <= 0) { e.state = 'glide'; e.t = e.len / 130; e.drop = 0; Audio_.sfx('dash'); }
  } else if (e.state === 'glide') {
    const bl = moveBox(room, e, Math.cos(e.la) * 130 * dt, Math.sin(e.la) * 130 * dt, 'fly');
    // bubbles drop behind it on the lane it already showed
    if ((e.drop -= dt) <= 0 && !bl) { e.drop = 0.2; G.markers.push({ x: e.x, y: e.y, t: 0.9, max: 0.9, src: 'manta', fall: '', n: e.p2 ? 4 : 0, r: 10 }); }
    if (bl || e.t <= 0) {
      if (--e.passes > 0) { e.state = 'aim'; e.t = 0.7; mantaAim(e, room, p); }
      else { e.state = 'wait'; e.t = 1; }
    }
  } else if (e.state === 'glint') {
    if (e.t > 0) return;
    fan(e.x, e.y - 14, Math.atan2(p.y - 7 - (e.y - 14), p.x - e.x), e.p2 ? 5 : 4, 0.34, 60, 'glow');
    Audio_.sfx('eshoot');
    e.state = 'wait'; e.t = 1;
  } else if (e.state === 'wind') {
    if (e.t > 0) return;
    const a = Math.atan2(p.y - e.y, p.x - e.x), n = 14;
    for (let i = 0; i < n; i++) { const b = a + (i + 0.5) * Math.PI * 2 / n; if (Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) > 0.6) ebullet(e.x, e.y - 14, b, 58, 'glow'); }
    Audio_.sfx('boom');
    e.state = 'loop'; e.t = 0.4;
  } else if (e.state === 'loop' && e.t <= 0) { stagger(e, 2); toast('THE MANTA IS TIRED!'); e.state = 'wait'; e.t = 0.4; }
};
function mantaAim(e, room, p) {
  let len = 20;
  const a = Math.atan2(p.y - e.y, p.x - e.x);
  while (len < 300 && !boxSolid(room, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.hw, e.hh, 'fly')) len += 6;
  lane(e, p, len); e.len = len - 6; e.flip = Math.cos(a) < 0;
}
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'manta', spr: 'manta_0', lore: ['THE WARDEN OF THE GLOW DEEP.', 'IT GLIDES DOWN THE CYAN LANES.', 'AFTER A LOOP IT IS TIRED.'] });

// ---------- The Grand Anglerfish (boss of the Glow Deep) ----------
// A big dark fish with a glowing lure on a stalk. Phase 1: the lure lights spots near the hero
// (rings), each one bursting into light; fans from the lure (glint first); a bite down a cyan
// lane, after which it chews (stagger). Phase 2: the room goes dark and only the lure gives light:
// the lure moves to a spot (a ring) and the mouth darts there to bite it. Phase 3: the room spins
// into a whirlpool and vents send up bubbles: shoot a bubble into its mouth to stun it.
const ANG_VENTS = [4 * COLS + 5, 4 * COLS + 18, 10 * COLS + 5, 10 * COLS + 18];
(function anglerArt() {
  const o = { flash: true, flip: true, sil: '1' };
  const angler = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0, open = f.a || f.tl;
    let r = sculpt(56, 40, [
      { e: [8, 20 + b, 7, 9], ramp: '1pPq' }, // the tail fin
      { e: [26, 9 + dy, 9, 4], ramp: '1pPq' }, // the back fin
      { e: [28, 22 + dy + b, 21, 15], ramp: f.p ? '1btP' : '1btT' },
      { e: [42, 30 + dy + b, 9, open ? 6 : 3], ramp: '0001' }, // the mouth
    ]);
    // the teeth, and the glowing spots down its side
    r = stamp(r, 35, (open ? 25 : 28) + dy + b, 'w.w.w.w.w.w.w');
    if (open) r = stamp(r, 36, 35 + dy + b, '.w.w.w.w.w.w');
    r = stamp(r, 14, 22 + dy + b, 'H...H...H\n.........\n..H...H..');
    r = autoOutline(r);
    r = bossEyes(r, 36, 14 + dy + b, 5, f.face);
    return rim(r, { t: 'T', T: 'C' });
  };
  bossFrames('angler', angler, o);
  SN_('alure', `
    ..HHH..
    .HwwwH.
    HwwwwwH
    HwwwHhH
    .HHhhH.
    ..hhh..`, { glow: true });
})();
Object.assign(EDEF, {
  angler: { hp: 470, r: 16, h: 34, hw: 18, hh: 7, sw: 56, boss: true, intro: 'ITS LIGHT IS THE LAST THING YOU SEE', phases: [0.66, 0.33], colors: ['T', 'P', 'H'],
    init: (e) => { e.y = OY + 84; e.n = 0; e.lx = e.x + 24; e.ly = e.y - 46; },
    sprite: (e) => bossFrame(e, { glint: 'tell', aim: 'tell', dart: 'tell', lure: 'tell', bite: 'atk', chomp: 'atk' }[e.state] || bob(e, 2, 1, 0)),
    glint: (e) => (e.state === 'glint' ? [e.lx - e.x, e.ly - e.y] : null) },
});
FOE_NAMES.angler = 'GRAND ANGLERFISH';
EF_EXTRA.push('lx', 'ly');
// where the lure hangs when it rests: up ahead of its head
const lureHome = (e) => [e.x + (e.flip ? -26 : 26), e.y - 46];
function anglerLure(e, dt, tx, ty, sp) {
  const dx = tx - e.lx, dy = ty - e.ly, d = Math.hypot(dx, dy);
  if (d < 1) return;
  const s = Math.min(d, (sp || 160) * dt);
  e.lx += dx / d * s; e.ly += dy / d * s;
}
AI.angler = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'angler';
  if (e.hp < e.maxHp * 0.66) bossPhase(e, 2);
  if (e.hp < e.maxHp * 0.33 && !e.p3) { bossPhase(e, 3); e.p3 = true; e.calm = false; e.state = 'swim'; e.t = 1.4; toast('THE DEEP STARTS TO SPIN!'); }
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'swim'; e.t = 1.2; } return; }
  if (!p) return;
  const dark = e.phase === 2;
  if (e.state === 'swim' || e.state === 'glint') {
    // it keeps to the upper half, under the hero's column, and never swims into a hero
    const tx = Math.max(80, Math.min(304, p.x)), ty = OY + (dark ? 96 : 76), dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
    const blocked = G.players.some(q => alive(q) && Math.hypot(q.x - (e.x + dx / d * 26), q.y - (e.y + dy / d * 20)) < 28);
    if (d > 3 && !blocked) moveBox(room, e, dx / d * 30 * dt, dy / d * 30 * dt, 'enemy');
    e.flip = p.x < e.x;
    const [hx, hy] = lureHome(e); anglerLure(e, dt, hx, hy);
  }
  if (e.state === 'swim') {
    if (e.t > 0) return;
    const k = e.n++ % 3;
    if (dark) {
      if (k === 1) { e.state = 'glint'; e.t = 0.6; e.w = 0; }
      else { e.darts = k ? 2 : 3; anglerDart(e, room, p); }
    } else if (k === 0) {
      // the lure lights spots near the hero, one after another
      const n = e.p3 ? 4 : 3;
      e.spots = [];
      for (let i = 0; i < n; i++) {
        let x = p.x + (i ? grnd(-36, 36) : 0), y = p.y + (i ? grnd(-28, 28) : 0);
        x = Math.max(24, Math.min(360, x)); y = Math.max(OY + 40, Math.min(OY + 180, y));
        if (solidPx(room, x, y, 'enemy')) continue;
        const t = 1 + i * 0.4;
        G.markers.push({ x, y, t, max: t, src: 'angler', fall: '', n: 5, r: 14 });
        e.spots.push([x, y, G.time + t]);
      }
      e.state = 'lure'; e.t = 1 + n * 0.4; Audio_.sfx('charge');
    } else if (k === 1) { e.state = 'glint'; e.t = 0.55; e.w = 0; }
    else { e.state = 'aim'; e.t = 0.8; anglerAim(e, room, p); }
  } else if (e.state === 'lure') {
    const s = e.spots && e.spots.find(q => q[2] > G.time);
    if (s) anglerLure(e, dt, s[0], s[1] - 6, 260); else { const [hx, hy] = lureHome(e); anglerLure(e, dt, hx, hy); }
    if (e.t <= 0) { e.state = 'swim'; e.t = 1.1; }
  } else if (e.state === 'glint') {
    if (e.t > 0) return;
    fan(e.lx, e.ly, Math.atan2(p.y - 7 - e.ly, p.x - e.lx) + (e.w % 2 ? 0.17 : 0), e.p2 ? 5 : 4, 0.34, 60, 'glow');
    Audio_.sfx('eshoot'); e.t = 0.6;
    if (++e.w >= (e.p3 ? 2 : 1)) { e.state = 'swim'; e.t = 1.2; }
  } else if (e.state === 'aim') {
    anglerLure(e, dt, e.x + Math.cos(e.la) * 30, e.y - 20 + Math.sin(e.la) * 30);
    if (e.t <= 0) { e.state = 'bite'; e.t = e.len / 150; Audio_.sfx('dash'); }
  } else if (e.state === 'bite') {
    const bl = moveBox(room, e, Math.cos(e.la) * 150 * dt, Math.sin(e.la) * 150 * dt, 'enemy');
    if (bl || e.t <= 0) {
      Audio_.sfx('chomp'); G.shake = Math.max(G.shake, 2);
      e.state = 'swim'; e.t = 1.2; stagger(e, 1.6); toast('IT BIT THE SAND!');
    }
  } else if (e.state === 'dart') {
    // the lure shows the spot; the mouth comes for it in the last quarter second
    anglerLure(e, dt, e.sx, e.sy - 8, 300);
    if (e.t < 0.25) {
      e.calm = true;
      const k = Math.min(1, dt / Math.max(0.02, e.t));
      moveBox(room, e, (e.sx - e.x) * k, (e.sy - e.y) * k, 'enemy');
    }
    if (e.t <= 0) { Audio_.sfx('chomp'); e.state = 'chomp'; e.t = 0.45; }
  } else if (e.state === 'chomp' && e.t <= 0) {
    if (--e.darts > 0) anglerDart(e, room, p);
    else { e.calm = false; e.state = 'swim'; e.t = 1; if (e.n % 3 === 0) { stagger(e, 1.6); toast('IT LOST ITS PREY IN THE DARK!'); } }
  }
};
function anglerAim(e, room, p) {
  let len = 20;
  const a = Math.atan2(p.y - e.y, p.x - e.x);
  while (len < 260 && !boxSolid(room, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.hw, e.hh, 'enemy')) len += 6;
  lane(e, p, len); e.len = len - 6; e.flip = Math.cos(a) < 0;
}
function anglerDart(e, room, p) {
  let x = Math.max(40, Math.min(344, p.x)), y = Math.max(OY + 48, Math.min(OY + 176, p.y));
  if (solidPx(room, x, y, 'enemy')) { x = p.x; y = p.y; }
  e.sx = x; e.sy = y; e.state = 'dart'; e.t = 1; e.calm = false; e.flip = x < e.x;
  G.markers.push({ x, y, t: 1, max: 1, src: 'angler', fall: '', n: 0, r: 18 });
  Audio_.sfx('charge');
}
// A bubble shot into the anglerfish in phase 3: it swallows it and is stunned.
const _dpOnHit = itemOnHit;
itemOnHit = function (s, e) {
  _dpOnHit(s, e);
  if (s.bubT !== undefined && e.type === 'angler' && e.p3 && !(e.stag > 0)) {
    s.bubT = undefined; s.life = 0;
    stagger(e, 3); toast('IT SWALLOWED A BUBBLE!');
    burst(e.x, e.y - 18, 16, ['C', 'w', 'c'], 90, 0.5);
  }
};
// the stalk and the lure, over the body; in the dark, the lure is the one light
function anglerDraw(ox, oy) {
  for (const e of G.enemies) {
    if (e.dead || e.type !== 'angler' || e.spawnT > 0) continue;
    const hx = e.x + (e.flip ? -14 : 14), hy = e.y - 30, n = 8;
    for (let k = 1; k < n; k++) {
      const t = k / n, x = hx + (e.lx - hx) * t, y = hy + (e.ly - hy) * t - Math.sin(t * Math.PI) * 10;
      rect(Math.round(ox + x), Math.round(oy + y), 1, 1, 'p');
    }
    const s = S('alure');
    drawS(s, Math.round(ox + e.lx) - 3, Math.round(oy + e.ly) - 3 + (Math.floor(G.time * 4) % 2));
  }
}
function anglerDark(ox, oy) {
  const e = G.enemies.find(q => !q.dead && q.type === 'angler' && q.phase === 2);
  if (!e) return;
  lightReset(assistOn() || Save.settings.bright ? 2 : 0);
  for (const p of G.players) if (!p.dead) lightAdd(p.x, p.y - 6, alive(p) ? 44 : 20);
  lightAdd(e.lx, e.ly, 40);
  for (const k of G.markers) lightAdd(k.x, k.y, 20);
  drawLight(ox, oy, 0.72);
  drawMarkers(ox, oy); // rings never hide in the dark
  if (lightAt(e.x, e.y - 14) === 0 && e.stag <= 0) foeEyes(e, ox, oy);
}
BEASTS.push({ t: 'angler', spr: 'angler_0', boss: true, lore: ['THE HEART OF THE GLOW DEEP.', 'IN THE DARK, WATCH ITS LURE.', 'IT CANNOT RESIST A BUBBLE.'] });

// ---------- The Kraken (the Glow Deep's other boss) ----------
// A great purple head at the top of the room. Its tentacles rise out of the sand where rings
// pulse and stand there a while; a tentacle sweeps a whole row (a cyan lane first); fans of ink
// drops (glint first). After every third round it comes up for air (stagger). Phase 2: more
// tentacles, and two sweeps.
(function krakenArt() {
  const o = { flash: true, sil: '1' };
  const MOUTH = { calm: '0..0\n.00.', squint: '0000', mad: '0000\n0ww0', daze: '.0.0\n0.0.', dead: '0000' };
  const kraken = (f) => {
    const dy = f.d ? 4 : f.st ? 2 : f.tl ? 1 : 0, b = f.b ? 1 : 0, sw = f.a ? 3 : f.m ? 1 : 0;
    const ramp = f.p ? '1prR' : '12pP';
    let r = sculpt(52, 40, [
      { r: [10, 22, 5, 12, 2], ramp }, { e: [8 - sw, 34, 5, 3], ramp }, // the arms curl out at the tips
      { r: [37, 22, 5, 12, 2], ramp }, { e: [44 + sw, 34, 5, 3], ramp },
      { r: [19, 24, 5, 13, 2], ramp }, { e: [18, 37 - b, 3.5, 2.5], ramp },
      { r: [28, 24, 5, 13, 2], ramp }, { e: [34, 37 - b, 3.5, 2.5], ramp },
      { e: [26, 16 + dy + b, 16, 14], ramp },
    ]);
    r = stamp(r, 11, 30, 'q.q');
    r = stamp(r, 38, 30, 'q.q');
    r = stamp(r, 18, 4 + dy + b, '..q.....q\n.........\nq.....q..');
    r = autoOutline(r);
    r = bossEyes(r, 17, 16 + dy + b, 12, f.face);
    r = stamp(r, 24, 24 + dy + b, MOUTH[f.face]);
    return rim(r, { p: 'P', P: 'q' });
  };
  bossFrames('kraken', kraken, o);
})();
Object.assign(EDEF, {
  kraken: { hp: 420, r: 16, h: 34, hw: 20, hh: 8, sw: 52, boss: true, intro: 'SOMETHING BIG STIRS UNDER THE SAND', phases: [0.5], colors: ['p', 'P', 'q'],
    init: (e) => { e.y = OY + 60; e.n = 0; e.calm = true; }, // half sunk in the sand: its arms are the danger, not its head
    sprite: (e) => bossFrame(e, { glint: 'tell', slam: 'atk', sweep: 'atk' }[e.state] || bob(e, 1.5, 1, 0)),
    glint: (e) => (e.state === 'glint' ? [0, -30] : null) },
});
FOE_NAMES.kraken = 'THE KRAKEN';
LAND.deep.alt = ['kraken'];
AI.kraken = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'kraken';
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  if (e.state === 'intro') { if (e.t <= 0) { e.state = 'wait'; e.t = 1.2; } return; }
  if (!p) return;
  // it sways along the top of the room
  const tx = 192 + Math.sin(e.anim * 0.4) * 60;
  if (Math.abs(tx - e.x) > 1) moveBox(room, e, Math.sign(tx - e.x) * 24 * dt, 0, 'enemy');
  if (e.state === 'wait') {
    if (e.t > 0) return;
    const k = e.n++ % 3;
    if (k === 0) {
      // tentacles rise where the rings pulse, and stand there a while
      const n = e.p2 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const [x, y] = cellMid(p.x + (i ? grnd(-48, 48) : 0), p.y + (i ? grnd(-32, 32) : 0));
        if (y < OY + 40 || y > OY + 184 || x < 24 || x > 360 || solidPx(room, x, y, 'enemy') || G.markers.some(m => m.c === 'tent' && m.x === x && m.y === y)) continue;
        G.markers.push({ kind: 'zap', c: 'tent', x, y, t: 3.2, max: 3.2, src: 'kraken', h: 1.1, w: 9 });
      }
      e.state = 'slam'; e.t = 1.6; Audio_.sfx('charge');
    } else if (k === 1) { e.state = 'aim'; e.t = 0; e.sweeps = e.p2 ? 2 : 1; }
    else { e.state = 'glint'; e.t = 0.55; }
  } else if (e.state === 'slam') {
    if (e.t <= 0) { e.state = 'wait'; e.t = 0.6; }
  } else if (e.state === 'aim') {
    if (e.t > 0) return;
    // a sweep along the hero's row, from the side farther from the hero
    const [, y] = cellMid(p.x, p.y), right = p.x < 192, t0 = 1;
    G.markers.push({ kind: 'lane', x: right ? 376 : 8, y, a: right ? Math.PI : 0, t: t0, max: t0, len: 380 });
    for (let c = 1; c <= 22; c++) {
      const i = right ? 22 - c : c - 1, h = t0 + i * 0.04;
      G.markers.push({ kind: 'zap', c: 'tsweep', x: c * 16 + 8, y, t: h + 0.22, max: h + 0.22, src: 'kraken', h, w: 9 });
    }
    Audio_.sfx('charge');
    e.state = 'sweep'; e.t = t0 + 22 * 0.04 + 0.3;
  } else if (e.state === 'sweep') {
    if (e.t > 0) return;
    if (--e.sweeps > 0) { e.state = 'aim'; e.t = 0.3; }
    else { e.state = 'wait'; e.t = 0.8; }
  } else if (e.state === 'glint') {
    if (e.t > 0) return;
    fan(e.x, e.y - 22, Math.atan2(p.y - 7 - (e.y - 22), p.x - e.x), e.p2 ? 5 : 4, 0.34, 58, 'dink');
    Audio_.sfx('eshoot');
    e.state = 'wait'; e.t = 1;
    stagger(e, 2.2); toast('THE KRAKEN COMES UP FOR AIR!');
  }
};
// the tentacles: a pulsing ring while they rise, then the tentacle itself; a sweep is one long one
const _dpZap2 = drawZap;
drawZap = function (k, ox, oy) {
  if (k.c !== 'tent' && k.c !== 'tsweep') { _dpZap2(k, ox, oy); return; }
  const x = Math.round(ox + k.x), y = Math.round(oy + k.y), up = k.max - k.t;
  if (k.c === 'tsweep') {
    if (up < k.h) return;
    for (let j = 0; j < 16; j++) { const w = Math.round(Math.sin(j * 0.8 + G.time * 20) * 2); rect(x - 8 + j, y - 3 + w, 1, 6, 'p'); rect(x - 8 + j, y - 3 + w, 1, 2, 'P'); if (j % 5 === 2) rect(x - 8 + j, y + 1 + w, 1, 1, 'q'); }
    return;
  }
  if (up < k.h) {
    // the ring pulses faster as the tentacle comes
    const r = 6 + (Math.floor(G.time * (up > k.h - 0.4 ? 16 : 8)) % 2);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.6), 1, 1, i % 2 ? 'P' : 'p'); }
    return;
  }
  if (k.t < 0.4 && Math.floor(k.t * 12) % 2) return;
  const hgt = Math.min(22, Math.round((up - k.h) * 110)), sway = Math.sin(G.time * 5 + k.x) * 2;
  rect(x - 4, y - 1, 9, 3, '0'); // the hole in the sand
  for (let j = 0; j < hgt; j++) {
    const t = j / 22, w = Math.max(1, Math.round(3 - t * 2)), cx = Math.round(x + sway * t * 2);
    rect(cx - w, y - j, w * 2 + 1, 1, j % 4 === 1 ? 'P' : 'p');
    if (j % 4 === 2) rect(cx - w, y - j, 1, 1, 'q');
  }
};
BEASTS.push({ t: 'kraken', spr: 'kraken_0', boss: true, lore: ['THE OTHER HEART OF THE DEEP.', 'ITS ARMS RISE WHERE THE RINGS PULSE.', 'AFTER THE INK, IT COMES UP FOR AIR.'] });

// ---------- The Pearl Room (the Glow Deep's special room) ----------
// A giant clam on the beat: four lamps light one per beat, and on the fourth it opens. Hit it while
// it is open, four openings in a row, and it gives up its pearl. Shots glance off the shut shell;
// an opening that passes without a hit starts the count again.
const PEARL_N = 4;
(function gclamArt() {
  const ribs = '..3...3...3...3...3..\n.3.3.3.3.3.3.3.3.3.3.\n3...................3';
  def('gclam_0', autoOutline(stamp(sculpt(36, 20, [{ e: [18, 12, 17, 7.5], ramp: '1V3q' }]), 7, 8, ribs)));
  def('gclam_1', autoOutline(stamp(sculpt(36, 26, [{ e: [18, 19, 17, 6], ramp: '1V3q' }, { e: [18, 7, 17, 6.5], ramp: '1V3q' }, { e: [18, 17, 12, 3], ramp: '0pPq' }]), 15, 13, '.LLL.\nLwwLL\nLwLLl\n.lll.')));
})();
const pearlOpen = () => G.beat % 4 >= 3;
function pearlStock(room) { room.props.push({ kind: 'gclam', x: 192, y: 112, t: 0, hits: 0, win: -1, done: false }); }
function pearlUpdate(dt, room) {
  const o = room.props.find(q => q.kind === 'gclam');
  if (!o || o.done || !G.beat) return;
  if (o.hits && Math.floor(G.beat / 4) - o.win >= 2) { o.hits = 0; G.propsN++; Audio_.sfx('clack'); toast('IT SHUT BEFORE YOU HIT IT!'); }
  for (const s of SHOTS) {
    if (s.life <= 0 || s.mini || Math.abs(s.x - o.x) > 17 || Math.abs(s.y - (o.y - 10)) > 12) continue;
    s.life = 0;
    const win = Math.floor(G.beat / 4);
    if (!pearlOpen()) {
      burst(s.x, s.y, 4, ['w', 'l'], 60, 0.2); Audio_.sfx('clack');
      continue;
    }
    if (win === o.win) continue; // one hit per opening
    o.win = win; o.hits++; G.propsN++;
    burst(o.x, o.y - 12, 8, ['L', 'w', 'q'], 70, 0.4); Audio_.sfx('bubble');
    if (o.hits < PEARL_N) continue;
    o.done = true;
    if (!teamHas('pearls')) addPedestal(room, 192, 156, 'pearls');
    else { for (let k = 0; k < 6; k++) spawnPickup('coin', o.x, o.y + 10); spawnPickup('gem', o.x, o.y + 10); }
    burst(o.x, o.y - 12, 24, ['L', 'w', 'q', 'C'], 110, 0.8, { g: -30 });
    Audio_.sfx('win'); toast('THE CLAM GIVES UP ITS PEARL!');
    break;
  }
}
// the four lamps on the floor keep the beat
function pearlDraw(ox, oy, room) {
  const o = room.props.find(q => q.kind === 'gclam');
  if (!o || !G.beat) return;
  const b = Math.floor(G.beat % 4);
  for (let i = 0; i < 4; i++) {
    const x = Math.round(ox + o.x - 36 + i * 24), y = Math.round(oy + o.y + 22), on = !o.done && i <= b;
    rect(x - 3, y - 1, 7, 3, '0'); rect(x - 2, y, 5, 1, on ? (i === 3 ? 'w' : 'q') : '1');
  }
  // the pearls won so far
  for (let i = 0; i < PEARL_N; i++) rect(Math.round(ox + o.x - 9 + i * 6), Math.round(oy + o.y + 28), 3, 3, i < o.hits || o.done ? 'L' : '1');
}
function drawGclam(o, x, y) {
  shadow(x, y, 18);
  const open = !o.done && G.beat && pearlOpen(), s = S(o.done || open ? 'gclam_1' : 'gclam_0');
  drawS(s, x - (s.w >> 1), y - s.h + 4);
  if (open && Math.floor(o.t * 8) % 2) drawS(S('sparkle_0'), x + 4, y - s.h + 8);
}
