'use strict';
// Wardens: one mid-boss per land, waiting in a spare dead end (room type 'warden').
// They follow the boss rules (tells of at least 0.45 s, stagger after the signature attack,
// a second phase) but are ordinary enemies marked EDEF.warden: the HUD bar finds them by
// that, knockback and sleep do not move them, and the room pays an item when they fall.

const WARDENS = { meadow: 'thistle', shore: 'castle', crystal: 'chand', cloud: 'vane' };
const wardenOf = () => G.enemies.find(e => !e.dead && EDEF[e.type].warden);

function spawnWarden() {
  const t = WARDENS[G.floor.land.id], e = spawnEnemy(t, 192, 96);
  e.spawnT = 1;
  G.banner = { title: foeName(t), sub: EDEF[t].intro, t: 2.4, icon: null };
  Audio_.sfx('roar'); hapticAll('roar');
}
function wardenCleared(room) {
  if (room.fort) crumbleFort(room, null);
  const ids = itemPool(G.players.length);
  ids.forEach((id, i) => { addPedestal(room, 192 + (i - (ids.length - 1) / 2) * 48, 128, id); room.props[room.props.length - 1].group = 'ward'; });
  for (let i = 0; i < 5; i++) spawnPickup('coin', 192, 150);
  earnVault(8);
  noteTeam('warden', G.floor.land.id);
  toast('THE WARDEN FALLS!');
}

// ---------- Art ----------
(function wardenArt() {
  const o = { flash: true };
  // Thistle Knight (30x32): a thistle bulb for a helmet with a purple crest, leaf armour,
  // a leaf shield and a thorn lance. Green family, purple accent.
  const CREST = {
    up: ['4..4.4..4', '34.343.43', '.3434343.', '234343432', '.2333332.', '..12221..'],
    tall: ['4..4.4..4', '34.4.4.43', '.3434343.', '.3434343.', '234343432', '.2333332.', '..12221..'],
    droop: ['.........', '.........', '.3.....3.', '343.4.343', '234343432', '.2333332.', '..12221..'],
  };
  const MOUTH = { calm: '0..0\n.00.', squint: '.00.\n0ww0\n.00.', mad: '0000\n0ww0\n.00.', daze: '.0.\n0q0\n.0.', dead: '0000' };
  const thistle = (f) => {
    const dy = f.st || f.d ? 2 : f.tl ? 1 : 0, hy = 14 + dy + (f.b ? 1 : 0), sp = f.a;
    const fl = f.m ? -1 : 0, fr = f.m ? 1 : 0;
    let r = sculpt(30, 32, [
      { r: [9, 27 + fl, 5, 4, 1.5], ramp: 'nnNa', hi: false },
      { r: [16, 27 + fr, 5, 4, 1.5], ramp: 'nnNa', hi: false },
      { e: [15, 23.5 + dy / 2, 7, 5.5 - dy / 2], ramp: 'gGGh' },
      { e: [15, hy, 7.5, 6.5], ramp: 'gGhH' },
      // the leaf shield, held in front of its side (held out while it spins)
      { e: [sp ? 4.5 : 7.5, sp ? 20 : 23.5 + dy / 2, 2.5, 4.5], ramp: 'gGhH' },
    ]);
    // bulb scales and the shield's midrib
    for (const [x, y] of [[10, hy + 2], [18, hy + 2], [13, hy + 4]]) r = stamp(r, x, y, 'g.g\n.g.');
    r = stamp(r, sp ? 4 : 7, (sp ? 18 : 22 + dy / 2) | 0, 'g\ng\ng\ng');
    // armour: a darker belt with a lime buckle
    r = stamp(r, 10, 25 + dy, 'gggggggggg');
    r = stamp(r, 14, 25 + dy, 'HH');
    // the thorn lance: upright at rest, raised for the tell, level while spinning, dropped when dazed
    if (sp) r = stamp(stamp(r, 20, 19, 'NNNNNNNlL\nnnnnnnnn.'), 20, 18, 'hG\nGg');
    else if (!f.d && !f.st) {
      const ly = f.tl ? 2 : 5;
      r = stamp(r, 24, ly, '.L\nlL\nlL\nNn');
      for (let y = ly + 4; y < 29; y++) r = stamp(r, 24, y, 'Nn');
      r = stamp(r, 22, 20 + dy, 'hGG\nGgg');
    } else r = stamp(r, 20, 29, 'nNNNNNNlL');
    // the crest: bristling for the tell, drooping when dazed or beaten
    const crest = f.st || f.d ? CREST.droop : f.tl ? CREST.tall : CREST.up;
    r = stamp(r, 11, hy - 6 - crest.length + 1, crest);
    r = autoOutline(r);
    r = bossEyes(r, 9, hy - 2, 8, f.face);
    r = stamp(r, f.face === 'daze' ? 14 : 13, hy + 3, MOUTH[f.face]);
    r = stamp(r, 10, hy + 3, f.p ? 'rr' : 'qq');
    r = stamp(r, 18, hy + 3, f.p ? 'rr' : 'qq');
    return rim(r, { g: 't', G: 'g', n: 'u' });
  };
  bossFrames('thistle', thistle, o);
  // the door emblem and minimap mark: a purple shield
  def('mm_warden', '00000\n03440\n02330\n.020.\n..0..');
  // its bullet: a purple thorn
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  def('eb_thorn', pad(['.4w.', '4432', '3321', '.21.']));
  def('ebb_thorn', pad(['..4w..', '.443w.', '443332', '433221', '.3221.', '..21..']));
  alias('ebcb_thorn', 'eb_thorn'); alias('ebbcb_thorn', 'ebb_thorn');

  // Sand Castle King (32x32): a keep between two towers, a gate for a mouth, a gold crown and
  // pink pennants. Sand family, pink accent.
  const GATE = { calm: '.0000.\n0uuuu0\n0uuuu0', squint: '.0000.\n0wuuw0\n.0000.', mad: '.0000.\n0wwww0\n0uuuu0', daze: '.00.\n0uu0\n.00.', dead: '000000' };
  const castle = (f) => {
    const low = f.d ? 9 : f.st ? 3 : f.tl || f.b ? 1 : f.a ? -1 : 0, bot = f.m ? 29 : 31;
    const kt = bot - 20 + low, tt = kt - 5;
    // the towers lean out a little when it bursts
    const lx = f.a ? -1 : 0, rx = f.a ? 23 : 22;
    let r = sculpt(32, 32, [
      { r: [lx, tt, 10, bot - tt, 1], ramp: 'NeaA', hi: false },
      { r: [rx, tt, 10, bot - tt, 1], ramp: 'NeaA', hi: false },
      { r: [6, kt, 20, bot - kt, 1.5], ramp: 'NeaA', hi: false },
    ]);
    // top-left edge light, a crenel notch in each tower, shell windows, brick seams
    r = stamp(r, 7, kt + 1, ['AAAAAAAA', 'A.......', 'A.......', 'A.......']);
    for (const x of [lx, rx]) {
      r = stamp(r, Math.max(1, x + 1), tt + 1, 'AA\nA.\nA.');
      r = stamp(r, x + 3, tt, '0__0\n0__0\n0000');
      r = stamp(r, x + (x === lx ? 2 : 6), tt + 6, '0\n0');
    }
    if (!f.d) for (const [x, y] of [[8, bot - 4], [21, bot - 7], [lx + 2, bot - 5], [rx + 6, bot - 9]]) r = stamp(r, x, y, 'ee');
    // cracks when dazed or beaten
    if (f.st || f.d) r = stamp(r, 22, kt + 2, '.0\n0.\n.0');
    // pennants planted in the notches: flying, snapping high for the tell, drooping when dazed
    const flag = f.st || f.d ? 'nP\nnq\nn.' : f.tl ? 'nPPPq\nnPPq.\nnP...' : 'nPPq\nnPq.\nn...';
    const rows = flag.split('\n'), pole = f.tl ? 3 : 2;
    for (let i = 0; i < pole; i++) rows.push('n'.padEnd(rows[0].length, '.'));
    for (const x of [lx, rx]) r = stamp(r, x + 4, tt + 2 - rows.length, rows);
    // the crown on the keep: on its head, knocked askew when furious, slipping when dazed, fallen when beaten
    const CR = 'Y...Y...Y\nyY.yPy.Yy\nyyyyyyyyO\nyOyyOyyOO';
    const cx = f.d ? 21 : f.st ? 15 : f.p ? 13 : 12, cy = f.d ? 27 : f.st ? kt - 3 : kt - 4;
    r = autoOutline(stamp(r, cx, cy, CR));
    r = bossEyes(r, 10, kt + 5, 8, f.face);
    r = stamp(r, 13, Math.min(kt + 11, bot - 2), GATE[f.face]);
    if (!f.d) { r = stamp(r, 8, kt + 10, f.p ? 'rr' : 'qq'); r = stamp(r, 22, kt + 10, f.p ? 'rr' : 'qq'); }
    return rim(r, { a: 'O', e: 'O' });
  };
  bossFrames('castle', castle, o);
  // its sand pellets and the bucket it lobs
  def('eb_sand', pad(['.Aa.', 'Aaae', 'aaeN', '.eN.']));
  def('ebb_sand', pad(['.AAaa.', 'AAaaae', 'Aaaaee', 'aaaeeN', 'aaeeNN', '.eeNN.']));
  alias('ebcb_sand', 'eb_sand'); alias('ebbcb_sand', 'ebb_sand');
  def('sand_bucket', pad(['...AAa...', '.AAaaaae.', 'RRRRRRRrr', '.RwRRRrr.', '.RwRyRrr.', '.RRyyyrr.', '.RRRyRrr.', '..Rrrrr..']));
})();

// ---------- Thistle Knight (Bloom Meadow) ----------
// Walks at you, then bristles its crest (tell) and spins, shedding rings of thorns whose gap
// turns a little each time; dizzy after the spin. Between spins a lance lunge on a shown lane.
// Phase 2 (below half): denser rings, the spin drifts after you and a lunge comes twice.
Object.assign(EDEF, {
  thistle: { hp: 260, r: 10, h: 24, hw: 8, hh: 5, sw: 24, warden: true, intro: 'SPINS AND SHEDS ITS THORNS',
    colors: ['G', 'h', '3'],
    init: (e) => { e.state = 'walk'; e.t = 1.4; e.n = 0; },
    sprite: (e) => {
      if (e.stag > 0) return S('thistle_stag');
      if (e.state === 'spin') return bossFrame(e, 'atk');
      if (e.state === 'tell' || e.state === 'aim') return bossFrame(e, 'tell');
      if (e.state === 'walk' || e.state === 'lunge') return bossFrame(e, bob(e, 6, 'move', '0'));
      return bossFrame(e, bob(e, 2, '0', '1'));
    },
    glint: (e) => (e.state === 'tell' && e.t < 0.3 ? [0, -24] : null) },
});
FOE_NAMES.thistle = 'THISTLE KNIGHT';
AI.thistle = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  if (e.state === 'walk') {
    e.again = e.p2;
    const d = towardPlayer(e);
    moveBox(room, e, d.x * 26 * dt, d.y * 26 * dt, 'enemy');
    e.flip = p.x < e.x;
    if (e.t <= 0) {
      // every other move is a lunge; the spin always comes back
      if (e.n++ % 2) { e.state = 'aim'; e.t = 0.6; lane(e, p, 150); }
      else { e.state = 'tell'; e.t = 0.6; Audio_.sfx('tele'); }
    }
  } else if (e.state === 'tell') {
    if (e.t <= 0) { e.state = 'spin'; e.t = e.p2 ? 1.8 : 1.4; e.k = 0; e.off = grand() * 6; }
  } else if (e.state === 'spin') {
    e.flip = Math.floor(e.anim * 12) % 2 === 1;
    if (e.p2) { const d = towardPlayer(e); moveBox(room, e, d.x * 22 * dt, d.y * 22 * dt, 'enemy'); }
    if ((e.k -= dt) <= 0) {
      e.k = 0.42;
      // a ring with one wide gap that turns 0.35 rad each time
      const n = e.p2 ? 12 : 10;
      muzzle(e.x, e.y - 12);
      for (let i = 1; i < n; i++) ebullet(e.x, e.y - 12, e.off + i * Math.PI * 2 / n, 58, 'thorn');
      e.off += 0.35;
      Audio_.sfx('eshoot');
      if (Math.random() < 0.6) burst(e.x, e.y - 20, 3, ['3', '4', 'h'], 60, 0.3);
    }
    if (e.t <= 0) { e.state = 'walk'; e.t = grnd(1.3, 1.8); stagger(e, 1.3); }
  } else if (e.state === 'aim') {
    if (e.t <= 0) { e.state = 'lunge'; e.t = 150 / 190; e.flip = Math.cos(e.la) < 0; Audio_.sfx('dash'); }
  } else if (e.state === 'lunge') {
    const hit = moveBox(room, e, Math.cos(e.la) * 190 * dt, Math.sin(e.la) * 190 * dt, 'enemy');
    if (Math.random() < 0.5) dust(e.x, e.y, 1, 6);
    if (e.t <= 0 || hit) {
      if (e.p2) { ring(e.x, e.y - 12, 6, 50, 'thorn', grand()); Audio_.sfx('eshoot'); }
      // in phase 2 it turns and lunges once more, on a new lane
      if (e.again) { e.again = false; e.state = 'aim'; e.t = 0.5; lane(e, nearestHero(e.x, e.y), 150); }
      else { e.state = 'walk'; e.t = grnd(1.0, 1.4); }
    }
  }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'thistle', spr: 'thistle_0', lore: ['THE WARDEN OF THE MEADOW PATHS.', 'WHEN ITS CREST BRISTLES, IT IS ABOUT TO SPIN.', 'RUN THROUGH THE GAP IN ITS RING OF THORNS.'] });

// ---------- Sand Castle King (Shore) ----------
// Hops at you, marks a square of tiles round itself (pink rings) and raises a sand fort there,
// with two gaps. From inside it lobs buckets and shoots through the gaps, and patches a broken
// wall now and then (a ring first). Then it shakes (glint) and the whole fort bursts outward
// into sand, wall by wall, and it is dazed: every wall you broke is a burst that never comes,
// and the spot beside the King, inside the fort, is safe. Phase 2: denser bursts, faster
// patching, sand rings when it lands a hop.
Object.assign(EDEF, {
  castle: { hp: 280, r: 12, h: 26, hw: 9, hh: 5, sw: 28, warden: true, intro: 'BUILDS A FORT, THEN BLOWS IT UP',
    colors: ['a', 'e', 'P'],
    init: (e) => { e.state = 'walk'; e.t = 1.6; e.walls = []; },
    sprite: (e) => {
      if (e.stag > 0) return S('castle_stag');
      if (e.state === 'build' || e.state === 'shake') return bossFrame(e, 'tell');
      if (e.state === 'walk') return bossFrame(e, castleAir(e) ? 'move' : '0');
      return bossFrame(e, bob(e, 2, '0', '1'));
    },
    glint: (e) => (e.state === 'shake' && e.t < 0.35 ? [0, -28] : null) },
});
FOE_NAMES.castle = 'SAND CASTLE KING';
const castleAir = (e) => e.t % 0.55 > 0.2;
const tileHit = (o, c, r) => Math.abs(o.x - c * 16 - 8) < 8 + (o.hw || 4) && Math.abs(o.y - OY - r * 16 - 8) < 8 + (o.hh || 4);
// the square ring of tiles two steps out from the King, less two opposite gaps
function fortPlan(room, e) {
  const c0 = Math.floor(e.x / 16), r0 = Math.floor((e.y - 1 - OY) / 16), side = grand() < 0.5, out = [];
  for (let r = r0 - 2; r <= r0 + 2; r++) for (let c = c0 - 2; c <= c0 + 2; c++) {
    if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== 2 || (side ? r === r0 : c === c0)) continue;
    if (c > 1 && c < 22 && r > 2 && r < 11 && tileAt(room, c, r) === T_FLOOR) out.push(r * COLS + c);
  }
  return out;
}
// raise one wall tile (if the floor stays joined); whoever stands there is hurt and pushed out
function raiseWall(room, i) {
  const c = i % COLS, r = (i / COLS) | 0;
  if (tileAt(room, c, r) !== T_FLOOR || !keepsJoined(room, i, T_BRK)) return false;
  setTile(room, c, r, T_BRK);
  dust(c * 16 + 8, OY + r * 16 + 12, 6, 12);
  for (const p of G.players) if (alive(p) && tileHit(p, c, r)) { hurtPlayer(p, 1, 'castle'); if (nudgeOut(room, p, heroMoveMode(p))) p.tpN++; }
  for (const k of room.pickups) nudgeOut(room, k, 'enemy');
  return true;
}
// the fort bursts: each wall still standing throws n sand pellets away from the King (e);
// with no King (it fell) the walls just crumble
function crumbleFort(room, e, n) {
  for (const i of room.fort) {
    const c = i % COLS, r = (i / COLS) | 0, x = c * 16 + 8, y = OY + r * 16 + 8;
    if (tileAt(room, c, r) !== T_BRK) continue;
    setTile(room, c, r, T_FLOOR);
    poof(x, y); burst(x, y - 2, 6, ['a', 'A', 'e'], 70, 0.4, { g: 150 });
    if (!e) continue;
    const a = Math.atan2(y - e.y, x - e.x);
    for (let k = 0; k < n; k++) ebullet(x, y - 4, a + (k - (n - 1) / 2) * 0.45, 60, 'sand');
  }
  room.fort = null;
  if (e) { Audio_.sfx('brk'); G.shake = Math.max(G.shake, 5); }
}
const fortMark = (i, t) => G.markers.push({ kind: 'zone', x: (i % COLS) * 16 + 8, y: OY + ((i / COLS) | 0) * 16 + 10, t, max: t });
AI.castle = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  E_SRC = 'castle';
  if (e.state === 'walk') {
    const air = castleAir(e);
    if (air) { const d = towardPlayer(e); moveBox(room, e, d.x * 40 * dt, d.y * 40 * dt, 'enemy'); e.flip = p.x < e.x; }
    else if (e.air) {
      // a landing: a puff of sand, and in phase 2 a ring of pellets with a gap
      dust(e.x, e.y, 5, 10); Audio_.sfx('clack');
      if (e.p2 && (e.n = (e.n || 0) + 1) % 2) { const off = grand() * 6; for (let i = 1; i < 9; i++) ebullet(e.x, e.y - 10, off + i * Math.PI / 4.5, 52, 'sand'); }
    }
    e.air = air;
    if (e.t <= 0) {
      e.walls = fortPlan(room, e);
      if (e.walls.length < 6) { e.t = 0.55; return; } // too close to the edge: one more hop
      e.state = 'build'; e.t = 0.8;
      for (const i of e.walls) fortMark(i, 0.8);
      Audio_.sfx('tele');
    }
  } else if (e.state === 'build') {
    if (e.t <= 0) {
      room.fort = e.walls.filter(i => raiseWall(room, i));
      nudgeOut(room, e, 'enemy');
      Audio_.sfx('brk'); G.shake = Math.max(G.shake, 3);
      e.state = 'fort'; e.t = e.p2 ? 5 : 4; e.k = 0.6; e.fix = e.p2 ? 1 : 1.5; e.reb = -1;
    }
  } else if (e.state === 'fort') {
    // lob a bucket at a hero, then shoot a fan at them through the gaps
    if ((e.k -= dt) <= 0) {
      if ((e.n = (e.n || 0) + 1) % 2) G.markers.push({ x: p.x, y: p.y, t: 1.1, max: 1.1, src: 'castle', fall: 'sand_bucket', n: e.p2 ? 5 : 4, h: 70 });
      else { fan(e.x, e.y - 14, aimAt(e.x, e.y - 14), e.p2 ? 5 : 3, 0.28, 70, 'sand'); Audio_.sfx('eshoot'); }
      e.k = e.p2 ? 0.8 : 1.1;
    }
    // patch a broken wall: a ring first, then it rises
    if (e.reb >= 0 && (e.rt -= dt) <= 0) { if (raiseWall(room, e.reb)) room.fort.push(e.reb); e.reb = -1; }
    if ((e.fix -= dt) <= 0) {
      e.fix = e.p2 ? 1 : 1.5;
      const gone = e.walls.filter(i => room.tiles[i] === T_FLOOR && !room.fort.includes(i));
      if (gone.length && e.reb < 0) { e.reb = gone[Math.floor(grand() * gone.length)]; e.rt = 0.6; fortMark(e.reb, 0.6); }
    }
    if (e.t <= 0) {
      e.state = 'shake'; e.t = 0.7; e.reb = -1;
      for (const i of room.fort) burst((i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 + 4, 3, ['Y', 'y'], 30, 0.5);
      Audio_.sfx('tele');
    }
  } else if (e.state === 'shake') {
    if (Math.random() < 0.5) dust(e.x + rnd(-8, 8), e.y, 1, 6);
    if (e.t <= 0) { crumbleFort(room, e, e.p2 ? 3 : 2); stagger(e, 1.5); e.state = 'walk'; e.t = grnd(1.6, 2.2); }
  }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'castle', spr: 'castle_0', lore: ['THE WARDEN OF THE SHORE.', 'IT HIDES IN A FORT OF SAND, AND THE FORT BURSTS.', 'BREAK ITS WALLS FIRST, OR STAND RIGHT BESIDE IT.'] });

// ---------- Chandelier Bat (Crystal Cave) ----------
// Hangs from a chain fixed to the top wall and swings across the room in a U. Before a swing
// it winds back (glint, and its path sparkles cyan); on the way it sheds shards straight out
// from the hook, so the space inside the U (by the top wall) and the gaps between shards are
// safe. Every third move the chain snaps instead: it glides over a pink ring and drops,
// shattering into a ring of shards with one gap, and is dazed on the floor. Then it reels
// itself back up. Phase 2: faster swings that come back at once, more drips.
(function chandArt() {
  const o = { flash: true };
  // 32x32: a purple bat with a crystal chandelier in its feet. Purple family, cyan accent.
  const MOUTH = { calm: '0000\nw..w', squint: '.00.\n0ww0\n.00.', mad: '0000\n0ww0\nw..w', daze: '.0.\n0q0\n.0.', dead: '0000' };
  // a bat wing as a polygon (left side; the right is its mirror): the arm runs from the
  // shoulder up to the wrist, three fingers fan down from it to a scalloped trailing edge
  const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const wing = (dy, lift, spread) => {
    // the wrist and outer tip stay 1px inside the canvas, so the outline fits
    const W = [Math.max(1, 2 - spread), Math.max(1, 3 - lift + dy)], T = [[Math.max(1, -0.5 - spread), 13 - lift / 2 + dy], [4, 16.5 - lift / 3 + dy], [9, 17.5 + dy]];
    const pts = [[11, 8 + dy], W, T[0], [3, 11 - lift / 2 + dy], T[1], [6.5, 13.5 - lift / 4 + dy], T[2], [11.5, 15 + dy]];
    const g = grid(32, 32).fill((x, y) => inPoly(pts, x + 0.5, y + 0.5) ? (inPoly(pts, x + 0.5, y + 1.5) && inPoly(pts, x + 1.5, y + 0.5) ? '2' : '1') : null);
    for (const t of T) g.line(Math.round(W[0]), Math.round(W[1]), Math.round(t[0] * 0.8 + W[0] * 0.2), Math.round(t[1] * 0.8 + W[1] * 0.2), '1');
    g.line(11, 8 + dy, Math.round(W[0]), Math.round(W[1]), '3').px(Math.round(W[0]), Math.round(W[1]), '4');
    const L = g.rows();
    return L.map((row, y) => row.split('').map((c, x) => c !== '.' ? c : L[y][31 - x]).join(''));
  };
  const chand = (f) => {
    const dy = f.d ? 12 : f.st ? 8 : f.b ? 1 : 0;
    // wings: level, raised (move), spread high (tell), swept back (swing), drooping (dazed)
    const lift = f.tl ? 4 : f.m ? 2 : f.a ? -1 : f.st || f.d ? -3 : 0, spread = f.a ? -2 : f.tl ? 1 : 0;
    const cy = f.d ? 5 : f.st ? 4 : 0;
    let r = autoOutline(wing(dy, lift, spread));
    r = stamp(r, 0, 0, sculpt(32, 32, [
      { e: [16, 23 + cy, 9.5, 3], ramp: 'bBcC' },
      { e: [16, 12 + dy, 6.5, 7], ramp: '1234' },
    ]));
    // ears with pink insides
    r = stamp(r, 10, 3 + dy, '3.\n3q\n33');
    r = stamp(r, 20, 3 + dy, '.3\nq3\n33');
    // the hook ring on its head, where the chain holds
    r = stamp(r, 14, 2 + dy, '.mm.\nm..l');
    // crystal drops under the bowl, candles on its rim (unlit when it has fallen)
    const drops = [[9, 'c'], [12, 'C\nc'], [16, 'C\nc\nc'], [19, 'C\nc'], [22, 'c']];
    // fallen, only the tips show (and none once it is beaten), so the outline fits under them
    if (!f.d) for (const [x, d] of drops) r = stamp(r, x, 26 + cy, f.tl ? d.replace(/C/g, 'w') : f.st ? d[0] : d);
    for (const x of [9, 22]) r = stamp(r, x, 18 + cy, f.st || f.d ? '.\nL' : f.tl ? 'w\nL' : 'Y\nL');
    // claws on the rim
    if (!f.d) for (const x of [13, 18]) r = stamp(r, x, 19 + dy, 'mm');
    r = autoOutline(r);
    r = bossEyes(r, 11, 9 + dy, 6, f.face);
    r = stamp(r, 14, 14 + dy, MOUTH[f.face]);
    r = stamp(r, 10, 14 + dy, f.p ? 'r' : 'q');
    r = stamp(r, 21, 14 + dy, f.p ? 'r' : 'q');
    return rim(r, { '1': '2', 'B': 'c' });
  };
  bossFrames('chand', chand, o);
})();
// the chain hangs from the middle of the top wall; th is the swing angle (0 = straight down)
const CH_AX = 192, CH_AY = OY + 20;
const chandAt = (e, th) => { e.th = th; e.x = CH_AX + Math.sin(th) * 150; e.y = OY + 56 + Math.cos(th) * 100; };
Object.assign(EDEF, {
  chand: { hp: 260, r: 10, h: 22, hw: 8, hh: 5, sw: 26, fly: true, warden: true, intro: 'SWINGS ON ITS CHAIN', phases: [0.6],
    colors: ['2', '3', 'c'],
    init: (e) => { e.side = grand() < 0.5 ? -1 : 1; chandAt(e, e.side * 1.3); e.z = 10; e.state = 'hang'; e.t = 1.8; e.k = 0.6; e.n = 0; },
    sprite: (e) => {
      if (e.stag > 0) return S('chand_stag');
      const f = { swing: 'atk', drop: 'atk', wind: 'tell', snap: 'tell', reel: 'move' }[e.state];
      return bossFrame(e, f || bob(e, 2, '0', '1'));
    },
    glint: (e) => ((e.state === 'wind' || e.state === 'snap') && e.t < 0.3 ? [0, -28] : null),
    under: (e, ox, oy) => {
      // the swing to come sparkles along its path (the side comes from where it hangs, so a client knows it too)
      if (e.state === 'wind' && Math.floor(e.t * 8) % 2) {
        const s = e.x < CH_AX ? -1 : 1;
        for (let th = s * 1.3; Math.abs(th) <= 1.31; th -= s * 0.16) drawS(S('sparkle_c'), Math.round(ox + CH_AX + Math.sin(th) * 150) - 1, Math.round(oy + OY + 44 + Math.cos(th) * 100) - 1);
      }
      // the chain, from the bracket on the wall to the ring on its head (gone once it snapped)
      rect(ox + CH_AX - 2, oy + CH_AY - 1, 5, 3, 'd'); rect(ox + CH_AX - 1, oy + CH_AY - 1, 3, 1, 'l');
      if (e.state === 'drop' || e.stag > 0 || (e.state === 'snap' && e.t < 0.4)) return;
      const hx = ox + e.x, hy = oy + e.y - Math.round(e.z || 0) - 29, d = Math.hypot(hx - ox - CH_AX, hy - oy - CH_AY), n = Math.floor(d / 3);
      for (let i = 1; i < n; i++) { const u = i / n, x = Math.round(ox + CH_AX + (hx - ox - CH_AX) * u), y = Math.round(oy + CH_AY + (hy - oy - CH_AY) * u); rect(x, y, 2, 2, '0'); rect(x, y, 1, 1, i % 2 ? 'L' : 'l'); }
    } },
});
FOE_NAMES.chand = 'CHANDELIER BAT';
AI.chand = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.6) bossPhase(e, 2);
  e.calm = e.state === 'reel';
  if (e.state === 'hang') {
    chandAt(e, e.side * (1.3 + Math.sin(e.anim * 2) * 0.03)); e.z = 10; e.flip = e.side > 0;
    // crystal drips over the nearest hero
    if ((e.k -= dt) <= 0) { e.k = e.p2 ? 0.8 : 1.1; G.markers.push({ x: p.x, y: p.y, t: 1.1, max: 1.1, src: 'chand', n: e.p2 ? 5 : 4, h: 60 }); }
    if (e.t <= 0) {
      if (++e.n % 3 === 0) {
        e.state = 'snap'; e.t = 0.8; e.fx = e.x; e.fy = e.y;
        e.tx = Math.max(40, Math.min(VW - 40, p.x)); e.ty = Math.max(OY + 56, Math.min(OY + 180, p.y));
        G.markers.push({ kind: 'zone', x: e.tx, y: e.ty, t: 1.05, max: 1.05 });
      } else { e.state = 'wind'; e.t = 0.6; }
      Audio_.sfx('tele');
    }
  } else if (e.state === 'wind') {
    chandAt(e, e.side * (1.3 + 0.15 * (1 - e.t / 0.6)));
    if (e.t <= 0) { e.state = 'swing'; e.dur = e.t = e.p2 ? 0.9 : 1.1; e.k = 0; Audio_.sfx('dash'); }
  } else if (e.state === 'swing') {
    // over and down to the other side; on the low part of the arc it sheds shards straight out from the hook
    const u = 1 - Math.max(0, e.t) / e.dur;
    chandAt(e, e.side * (1.45 - 2.75 * (1 - Math.cos(Math.PI * u)) / 2)); e.z = 4; e.flip = e.side < 0;
    if (Math.abs(e.th) < 1 && (e.k -= dt) <= 0) {
      e.k = e.p2 ? 0.08 : 0.13;
      ebullet(e.x, e.y - 10, Math.atan2(e.y - 10 - CH_AY, e.x - CH_AX), 70, 'shard');
    }
    if (e.t <= 0) {
      e.side = -e.side;
      if (e.p2 && !e.again) { e.again = true; e.state = 'wind'; e.t = 0.45; }
      else { e.again = false; e.state = 'hang'; e.t = grnd(1.6, 2.2); e.k = 0.5; }
    }
  } else if (e.state === 'snap') {
    // the chain lets go: it glides over the ring, rising, then drops
    const u = 1 - e.t / 0.8, s = u * u * (3 - 2 * u);
    e.x = e.fx + (e.tx - e.fx) * s; e.y = e.fy + (e.ty - e.fy) * s; e.z = 10 + u * 8;
    if (e.t <= 0) { e.state = 'drop'; e.t = 0.25; e.vz = e.z; }
  } else if (e.state === 'drop') {
    e.z = Math.max(0, e.vz * e.t / 0.25);
    if (e.t <= 0) {
      e.z = 0; G.shake = Math.max(G.shake, 6); Audio_.sfx('brk'); hapticAll('slam');
      burst(e.x, e.y - 6, 18, ['c', 'C', 'w', 'b'], 110, 0.5, { g: 150 }); dust(e.x, e.y, 6, 14);
      // a ring of shards, one missing: the gap is the way out
      const n = e.p2 ? 14 : 10, off = grand() * Math.PI * 2;
      for (let i = 1; i < n; i++) ebullet(e.x, e.y - 6, off + i * Math.PI * 2 / n, 62, 'shard');
      for (const h of G.players) if (alive(h) && Math.hypot(h.x - e.x, (h.y - e.y) * 1.6) < 14) hurtPlayer(h, 1, 'chand');
      stagger(e, 1.5); e.state = 'reel'; e.t = 0.9; e.fx = e.x; e.fy = e.y; e.side = e.x < CH_AX ? -1 : 1;
    }
  } else if (e.state === 'reel') {
    // it climbs back up its chain to the side it is nearer
    const u = 1 - Math.max(0, e.t) / 0.9;
    const tx = CH_AX + Math.sin(e.side * 1.3) * 150, ty = OY + 56 + Math.cos(1.3) * 100;
    e.x = e.fx + (tx - e.fx) * u; e.y = e.fy + (ty - e.fy) * u; e.z = u * 10;
    if (e.t <= 0) { e.state = 'hang'; e.t = grnd(1.6, 2.2); e.k = 0.6; }
  }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'chand', spr: 'chand_0', lore: ['THE WARDEN OF THE CRYSTAL HALLS.', 'IT SWINGS ON ITS CHAIN AND SHEDS SHARDS.', 'STAND INSIDE ITS SWING, CLOSE TO THE WALL.'] });

// ---------- Weather Vane Rooster (Cloud Steps) ----------
// A copper rooster on a pole. It ticks round, then stops and points: the arrow at its foot and
// a cyan lane show the way for 0.6 s, and a gust of feathers blows down that lane. Every third
// turn it crows (glint) and whirls, throwing a spiral of feathers from the tips of its arms:
// right under it, in its shadow, is safe, and it cannot peck while it whirls. Dizzy after the
// whirl, it hops to another spot (pink ring). Phase 2: the gust blows both ways, two spiral arms.
(function vaneArt() {
  const o = { flash: true };
  const BEAK = { calm: 'yyY\nOo.', squint: 'yyY\n...\nOo.', mad: 'yyY\nOoo', daze: 'yY.\nOo.', dead: 'yy.\n...' };
  const vane = (f) => {
    // the rooster sits lower when it bobs, rises for the crow, slumps when dazed, lies on its side when beaten
    const dy = f.d ? 8 : f.st ? 2 : f.b ? 1 : f.tl ? -1 : 0;
    const wy = f.tl || f.a ? -3 : f.m ? -2 : f.st || f.d ? 2 : 0;
    let r = sculpt(32, 32, [
      // the pole's foot, a copper ball and the pole
      { e: [16, 29.5, 5, 2], ramp: 'mlLw', hi: false },
      { r: [15, 19, 3, 11, 0.5], ramp: 'mlLw', hi: false },
      // the compass arms, with a gold ball at each tip
      { r: [5, 23, 22, 3, 1], ramp: 'mlLw', hi: false },
      { e: [5, 24, 2, 2], ramp: 'oOyY' }, { e: [27, 24, 2, 2], ramp: 'oOyY' },
      // tail feathers (fanned high when it crows), body, head
      { e: [6, 9 + dy + (f.tl ? -2 : 0), 3.5, 6.5], ramp: 'noOy' },
      { e: [13, 15 + dy, 8, 5.5], ramp: 'noOy' },
      { e: [22, 8 + dy, 5.5, 5], ramp: 'noOy' },
    ]);
    // tail feather curls
    r = stamp(r, 3, (f.tl ? 3 : 5) + dy, 'y.\nOy\nnO\n.n');
    r = stamp(r, 8, (f.tl ? 2 : 4) + dy, 'y\nO\nn');
    // the wing: folded, raised (hop, crow), spread wide (whirl), limp (dazed)
    if (f.a) { r = stamp(r, 1, 12 + dy, 'YyyOOn\n.yOOnn\n..Onn.'); r = stamp(r, 21, 13 + dy, '.nOOyY\nnnOOy.'); }
    else r = stamp(r, 8, 12 + dy + wy, '.yyO.\nyOOOn\nOOnnn\n.nn..');
    // legs on the pole
    if (!f.d) r = stamp(r, 13, 20 + dy, 'n..n\nN..N');
    // the comb: tall and red for the crow, flopped when dazed
    const comb = f.st || f.d ? '...rR\n.rRRr\nrrr..' : f.tl ? 'R.R.R\nrRrRr\nrrrrr' : '.R.R.\nrRrRr';
    r = stamp(r, 19, Math.max(1, 1 + dy - (f.tl ? 1 : 0)), comb);
    // the beak (open to crow) and the red wattle below it
    r = stamp(r, 27, 8 + dy, BEAK[f.face]);
    r = stamp(r, 26, 11 + dy, f.p ? 'r\nr' : 'R\nr');
    r = autoOutline(r);
    r = bossEyes(r, 18, 5 + dy, 5, f.face);
    r = stamp(r, 18, 10 + dy, f.p ? 'r' : 'q');
    return rim(r, { o: 'r', O: 'o', l: 'm' });
  };
  bossFrames('vane', vane, o);
  // its bullet: a gold feather
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  def('eb_feather', pad(['.Yy.', 'YyOo', 'yOon', '.on.']));
  def('ebb_feather', pad(['..Yy..', '.YyyO.', 'YyyOOo', 'yyOOon', '.yOon.', '..on..']));
  alias('ebcb_feather', 'eb_feather'); alias('ebbcb_feather', 'ebb_feather');
})();
const VANE_R = 22; // the whirl throws its feathers from this far out: nearer is its shadow, and safe
Object.assign(EDEF, {
  vane: { hp: 320, r: 8, h: 26, hw: 8, hh: 5, sw: 20, fly: true, warden: true, intro: 'POINTS WHERE THE WIND BLOWS',
    colors: ['o', 'O', 'r'],
    init: (e) => { e.state = 'turn'; e.t = 1.6; e.n = 0; e.w = 0; e.k = 0; },
    sprite: (e) => {
      if (e.stag > 0) return S('vane_stag');
      const f = { crow: 'tell', whirl: 'atk', blow: 'atk', hop: 'move' }[e.state];
      return bossFrame(e, f || (e.state === 'aim' ? 'tell' : bob(e, 2, '0', '1')));
    },
    glint: (e) => (e.state === 'crow' ? [8, -30] : null),
    under: (e, ox, oy) => {
      // the whirl's shadow, where the feathers do not reach
      if (e.state === 'crow' || e.state === 'whirl') {
        const R = VANE_R - 4, r = ringSprite(R, Math.floor(e.anim * 8) % 2 ? 'd' : 'm'), x = Math.round(ox + e.x - R), y = Math.round(oy + e.y - Math.round(R * 0.6));
        ctx.drawImage(ellipseSprite(r.width, r.height, SHADOW), x, y);
        ctx.drawImage(r, x, y);
      }
      // the arrow at its foot shows where it points (e.w, an angle)
      if (e.state === 'hop' || e.z > 2) return;
      const c = Math.cos(e.w), s = Math.sin(e.w) * 0.6, x0 = ox + e.x, y0 = oy + e.y;
      for (let d = 6; d <= 16; d++) rect(Math.round(x0 + c * d) - 1, Math.round(y0 + s * d) - 1, 3, 3, '0');
      for (let d = 6; d <= 16; d++) rect(Math.round(x0 + c * d), Math.round(y0 + s * d), 1, 1, e.state === 'aim' || e.state === 'blow' ? 'y' : 'l');
      rect(Math.round(x0 + c * 17) - 1, Math.round(y0 + s * 17) - 1, 3, 3, e.state === 'aim' ? 'P' : 'y');
    } },
});
FOE_NAMES.vane = 'WEATHER VANE';
// a lane of sparkles from the pole: a lane marker (the gust comes along it)
const vaneLane = (e, a, t) => G.markers.push({ kind: 'lane', x: e.x, y: e.y - 8, a, t, max: t, len: 420 });
AI.vane = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  E_SRC = 'vane';
  e.calm = e.state === 'whirl' || e.state === 'crow';
  if (e.state === 'turn') {
    // it ticks round an eighth at a time, creaking
    if ((e.k -= dt) <= 0) { e.k = e.p2 ? 0.2 : 0.28; e.w = (Math.round(e.w / (Math.PI / 4)) + 1) * Math.PI / 4; Audio_.sfx('tick'); }
    e.flip = Math.cos(e.w) < 0;
    if (e.t <= 0) {
      if (++e.n % 3 === 0) { e.state = 'crow'; e.t = 0.7; Audio_.sfx('crow'); }
      else {
        // it stops pointing at a hero
        e.w = Math.atan2(p.y - e.y, p.x - e.x); e.flip = Math.cos(e.w) < 0;
        e.state = 'aim'; e.t = 0.6; vaneLane(e, e.w, 0.6); if (e.p2) vaneLane(e, e.w + Math.PI, 0.6);
        Audio_.sfx('tele');
      }
    }
  } else if (e.state === 'aim') {
    if (e.t <= 0) { e.state = 'blow'; e.t = 0.9; e.k = 0; Audio_.sfx('swish'); }
  } else if (e.state === 'blow') {
    // a widening wedge of feathers down the lane, puffs at a time: step aside
    if ((e.k -= dt) <= 0) {
      e.k = 0.15; e.n2 = -(e.n2 || 0.1); // puffs sway half a gap each time, so the wedge has no still-standing gaps
      for (const a of e.p2 ? [e.w, e.w + Math.PI] : [e.w]) fan(e.x + Math.cos(a) * 12, e.y - 8 + Math.sin(a) * 8, a + e.n2, 4, 0.2, 88, 'feather');
      Audio_.sfx('eshoot');
      if (Math.random() < 0.5) burst(e.x, e.y - 20, 2, ['C', 'w'], 40, 0.3);
    }
    if (e.t <= 0) { e.state = 'turn'; e.t = grnd(1.3, 1.8); e.k = 0.3; }
  } else if (e.state === 'crow') {
    if (e.t <= 0) { e.state = 'whirl'; e.t = e.p2 ? 2.2 : 1.7; e.k = 0; hapticAll('roar'); }
  } else if (e.state === 'whirl') {
    // it spins, and the arms' tips throw feathers: a spiral (two arms in phase 2)
    e.w += dt * 7; e.flip = Math.floor(e.anim * 10) % 2 === 1;
    if ((e.k -= dt) <= 0) {
      e.k = 0.1;
      for (const a of e.p2 ? [e.w, e.w + Math.PI] : [e.w]) ebullet(e.x + Math.cos(a) * VANE_R, e.y - 6 + Math.sin(a) * VANE_R * 0.6, a, 70, 'feather');
      Audio_.sfx('eshoot');
    }
    if (e.t <= 0) { stagger(e, 1.5); e.state = 'hop'; e.t = 0; e.calm = false; }
  } else if (e.state === 'hop') {
    // pick a spot away from the heroes and ring it, then hop there
    if (!e.to) {
      let best = null, bd = -1;
      for (let i = 0; i < 12; i++) {
        const x = grnd(56, VW - 56), y = grnd(OY + 60, OY + 172), d = Math.min(...G.players.filter(alive).map(q => Math.hypot(q.x - x, q.y - y)));
        if (Math.hypot(x - e.x, y - e.y) > 60 && d > bd && !solidPx(room, x, y, 'enemy')) { best = [x, y]; bd = d; }
      }
      e.to = best || [e.x, e.y]; e.fx = e.x; e.fy = e.y; e.t = 0.9;
      G.markers.push({ kind: 'zone', x: e.to[0], y: e.to[1] + 2, t: 0.9, max: 0.9 });
    }
    const u = 1 - Math.max(0, e.t) / 0.9;
    e.x = e.fx + (e.to[0] - e.fx) * u; e.y = e.fy + (e.to[1] - e.fy) * u; e.z = Math.sin(u * Math.PI) * 30;
    if (e.t <= 0) {
      e.z = 0; e.to = null; dust(e.x, e.y, 6, 12); G.shake = Math.max(G.shake, 3); Audio_.sfx('clack');
      for (const h of G.players) if (alive(h) && Math.hypot(h.x - e.x, (h.y - e.y) * 1.6) < 14) hurtPlayer(h, 1, 'vane');
      e.state = 'turn'; e.t = grnd(1.2, 1.6); e.k = 0.3;
    }
  }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'vane', spr: 'vane_0', lore: ['THE WARDEN OF THE CLOUD STEPS.', 'ITS ARROW SHOWS WHERE THE GUST WILL BLOW.', 'WHEN IT CROWS, STAND IN ITS SHADOW.'] });
