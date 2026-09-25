'use strict';
// The Boss Fight: one arena, one boss, picked from the co-op lobby. Big Grin grabs
// heroes and throws them, and throws slippers at everyone else.

// ---------- Art ----------
(function grinArt() {
  const o = { flip: true, flash: true };
  // pose: 'idle' | 'bob' | 'walkA' | 'walkB' | 'grab' | 'throw' | 'hold'
  const grin = (pose) => {
    const bob = pose === 'bob' || pose === 'walkB' ? 1 : 0;
    const legs = pose === 'walkA' ? [[15, 38, 5, 8], [21, 37, 5, 8]] : pose === 'walkB' ? [[15, 37, 5, 8], [21, 38, 5, 8]] : [[15, 38, 5, 8], [21, 38, 5, 8]];
    const arms = {
      down: [{ e: [10, 30 + bob, 3, 6], ramp: 'xxXX', hi: false }, { e: [30, 30 + bob, 3, 6], ramp: 'xxXX', hi: false },
        { e: [10, 36 + bob, 2.6, 2.6], ramp: 'kssA' }, { e: [30, 36 + bob, 2.6, 2.6], ramp: 'kssA' }],
      grab: [{ e: [7, 27, 6, 3], ramp: 'xxXX', hi: false }, { e: [33, 27, 6, 3], ramp: 'xxXX', hi: false },
        { e: [3, 28, 3, 3], ramp: 'kssA' }, { e: [37, 28, 3, 3], ramp: 'kssA' }],
      throw: [{ e: [10, 30, 3, 6], ramp: 'xxXX', hi: false }, { e: [32, 21, 3, 6], ramp: 'xxXX', hi: false },
        { e: [10, 36, 2.6, 2.6], ramp: 'kssA' }, { e: [33, 15, 2.8, 2.8], ramp: 'kssA' }],
      hold: [{ e: [11, 31, 4, 4], ramp: 'xxXX', hi: false }, { e: [29, 31, 4, 4], ramp: 'xxXX', hi: false },
        { e: [15, 33, 3, 2.6], ramp: 'kssA' }, { e: [25, 33, 3, 2.6], ramp: 'kssA' }],
    }[pose === 'grab' || pose === 'throw' || pose === 'hold' ? pose : 'down'];
    const shapes = [];
    // khaki trousers and white sneakers
    for (const [x, y, w, h] of legs) shapes.push({ r: [x, y, w, h - 2, 1], ramp: 'eeaA', hi: false }, { r: [x - 1, y + h - 3, w + 1, 3, 1], ramp: 'mlLL' });
    shapes.push({ r: [13, 33 + bob, 14, 7, 2], ramp: 'eeaA', hi: false });
    // black tee
    shapes.push({ r: [11, 22 + bob, 18, 13, 4], ramp: 'xxXX', hi: false });
    // the arms go behind the head but in front of the body, except when holding someone
    if (pose !== 'hold') shapes.push(...arms);
    // head, then the big messy hair on top of it
    shapes.push({ e: [20, 16 + bob, 9, 8.5], ramp: 'kssA' });
    shapes.push({ e: [11.5, 17 + bob, 1.8, 2.4], ramp: 'kssA', hi: false }, { e: [28.5, 17 + bob, 1.8, 2.4], ramp: 'kssA', hi: false });
    shapes.push({ e: [20, 7 + bob, 11, 5.5], ramp: 'uuun' });
    shapes.push({ e: [11.5, 11 + bob, 2.4, 3], ramp: 'uuun', hi: false }, { e: [28.5, 11 + bob, 2.4, 3], ramp: 'uuun', hi: false });
    if (pose === 'hold') shapes.push(...arms);
    let r = sculpt(40, 46, shapes);
    const y = bob;
    // messy tufts sticking out of the hair
    r = stamp(r, 9, 1 + y, `
      .0....0.0..0....0...
      0u0..0n0u00n0..0u0..
      .0u00unuunuu00uu0...`);
    r = stamp(r, 6, 8 + y, `
      0u.......................
      .0.......................`);
    r = stamp(r, 32, 7 + y, `
      .0
      0u`);
    // fringe falling over the forehead
    r = stamp(r, 13, 11 + y, `
      uunuuunuuuuu
      u.uu.uuu.uu.
      ..u...u.....`);
    // thick dark brows, squeezed shut laughing eyes, a light moustache, a wide grin
    r = stamp(r, 14, 14 + y, `
      .0uu....uu0.
      ............
      .000....000.
      0..........0
      q....kk....q
      ...nnnnnn...
      ..0wwwwwww0.
      ...0rrrrr0..
      ....00000...`);
    // the thin gold chain over the tee
    r = stamp(r, 16, 24 + y, `
      y......y
      .y....y.
      ..yYyy..`);
    return r;
  };
  def('grin_0', grin('idle'), o);
  def('grin_1', grin('bob'), o);
  def('grin_w0', grin('walkA'), o);
  def('grin_w1', grin('walkB'), o);
  def('grin_grab', grin('grab'), o);
  def('grin_throw', grin('throw'), o);
  def('grin_hold', grin('hold'), o);
  // a flip-flop, flying sole down and sole up
  def('slipper_0', autoOutline([
    '..........',
    '..bBBBc...',
    '.bBBBBBBc.',
    '..bbbbbb..',
    '..........',
  ]));
  def('slipper_1', autoOutline([
    '..........',
    '..rR......',
    '.bBBrBBc..',
    '..bbBBBBc.',
    '..........',
  ]));
})();

// ---------- Big Grin ----------
Object.assign(EDEF, {
  grin: { hp: 240, r: 14, h: 44, hw: 11, hh: 6, sw: 30, boss: true, colors: ['x', 'u', 'y'],
    sprite: (e) => {
      switch (e.state) {
        case 'reach': case 'lunge': case 'tantrum': return S('grin_grab');
        case 'hold': return S('grin_hold');
        case 'throw': return S(e.n < 0.25 ? 'grin_throw' : 'grin_0');
        case 'walk': return S('grin_w' + (Math.floor(e.anim * 5) % 2));
        default: return S('grin_' + (Math.floor(e.anim * 2) % 2));
      }
    },
    glint: (e) => (e.state === 'reach' && e.t < 0.3 ? [e.flip ? -17 : 17, -18] : e.state === 'throw' && e.n > 0.2 ? [e.flip ? -13 : 13, -31] : null) },
});
FOE_NAMES.grin = 'BIG GRIN';

// A flying flip-flop: an ordinary big enemy bullet in a slipper's clothes.
function slipper(x, y, ang, speed) {
  const b = ebullet(x, y, ang, speed, 'orange', true);
  b.key = 'slipper_' + (grand() < 0.5 ? 0 : 1); b.spr = S(b.key);
  return b;
}
function slippers(e, n, step, speed) {
  const x = e.x + (e.flip ? -13 : 13), y = e.y - 30, a = aimAt(x, y);
  for (let i = 0; i < n; i++) slipper(x, y, a + (i - (n - 1) / 2) * step, speed);
  Audio_.sfx('swish');
}
// Let go of a held hero: squeezed for a heart, then tossed across the room.
function grinToss(e, p) {
  const a = e.flip ? Math.PI : 0, room = G.room;
  p.inv = 0;
  if (typeof NET !== 'undefined') { NET.netHit = true; hurtPlayer(p, 1, 'grin'); NET.netHit = false; } else hurtPlayer(p, 1, 'grin');
  let x = p.x, y = p.y;
  for (let d = 0; d < 64; d += 2) {
    const nx = x + Math.cos(a - 0.3) * 2, ny = y + Math.sin(a - 0.3) * 2;
    if (boxSolid(room, nx, ny, 5, 3, 'player')) break;
    x = nx; y = ny;
  }
  p.x = x; p.y = y; p.tpN++;
  dust(x, y, 10, 30);
  G.shake = Math.max(G.shake, 4);
  Audio_.sfx('boom');
}
AI.grin = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5 && !e.p2) { bossPhase(e, 2); toast('AAAAAAAAH!'); }
  const held = e.grab !== undefined ? G.players.find(q => q.pid === e.grab) : null;
  if (e.state !== 'hold' && held) e.grab = undefined;
  switch (e.state) {
    case 'intro': if (e.t <= 0) { e.state = 'walk'; e.t = 1.4; toast('COME HERE!'); } break;
    case 'walk': {
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, sp = e.p2 ? 46 : 34;
      e.flip = dx < 0;
      if (d > 20) moveBox(room, e, dx / d * sp * dt, dy / d * sp * dt, 'enemy');
      if (e.t <= 0) {
        const r = grand();
        e.state = e.p2 && r < 0.25 ? 'tantrum' : d < 110 && r < 0.65 ? 'reach' : 'throw';
        e.t = e.state === 'reach' ? 0.55 : e.state === 'tantrum' ? 0.7 : 0.45; e.n = 0; e.w = 0;
        Audio_.sfx('charge');
      }
      break;
    }
    case 'reach':
      e.flip = p.x < e.x;
      if (e.t <= 0) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.vx = Math.cos(a) * 190; e.vy = Math.sin(a) * 190;
        e.state = 'lunge'; e.t = 0.5;
        Audio_.sfx('swish');
      }
      break;
    case 'lunge': {
      const hit = moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
      const q = G.players.find(h => alive(h) && h.dashT <= 0 && Math.hypot(h.x - e.x, h.y - e.y) < 18);
      if (q) {
        e.state = 'hold'; e.grab = q.pid; e.t = e.p2 ? 1.1 : 1.4; e.w = e.hp;
        toast('GOTCHA!'); Audio_.sfx('roar'); youFx(q, 'grab');
      } else if (hit || e.t <= 0) { e.state = 'idle'; e.t = 0.7; dust(e.x, e.y, 6, 20); }
      break;
    }
    case 'hold':
      if (!held || !alive(held)) { e.state = 'idle'; e.t = 0.6; break; }
      // held tight in front of him: the host decides where this hero is
      held.x = e.x; held.y = e.y + 5; held.inv = Math.max(held.inv, 0.15); held.tpN++;
      if (e.w - e.hp > e.maxHp * 0.05) {
        // enough damage in the meantime: he lets go and reels
        e.state = 'dazed'; e.t = 1.3; held.inv = 0.8;
        toast('BROKE FREE!'); dust(e.x, e.y, 10, 30);
      } else if (e.t <= 0) { grinToss(e, held); e.state = 'idle'; e.t = 0.8; }
      break;
    case 'throw':
      e.flip = p.x < e.x;
      e.n += dt;
      if (e.t <= 0) {
        slippers(e, e.p2 ? 5 : 3, 0.24, 92);
        if (e.w === 0 && grand() < 0.4) toast('CATCH!');
        e.n = 0;
        if (++e.w >= (e.p2 ? 3 : 2)) { e.state = 'walk'; e.t = 1.6; } else e.t = 0.45;
      }
      break;
    case 'tantrum':
      if (e.t <= 0) {
        E_SRC = 'grin';
        for (let i = 0; i < 10; i++) slipper(e.x, e.y - 20, e.w * 0.3 + i * Math.PI / 5, 70);
        G.shake = Math.max(G.shake, 3); dust(e.x, e.y, 10, 30); Audio_.sfx('boom');
        if (++e.w >= 3) { e.state = 'walk'; e.t = 1.4; } else e.t = 0.5;
      }
      break;
    case 'dazed':
      if (Math.floor(e.anim * 8) % 2 && e.t > 0.3) part(e.x + rnd(-8, 8), e.y - 46, 0, -18, 0.3, null, { spr: 'sparkle', drag: 1 });
      if (e.t <= 0) { e.state = 'walk'; e.t = 1.2; }
      break;
    default: // idle: a short breath between moves
      e.flip = p.x < e.x;
      if (e.t <= 0) { e.state = 'walk'; e.t = 1.2 + grand() * 0.8; }
  }
};

// the grabbed hero's own screen shakes and their controller rumbles
YOU_FX.grab = () => { G.shake = Math.max(G.shake, 3); haptic('slam'); };

// ---------- The Boss Fight mode ----------
// An Arena run with one wave: Big Grin. Beating him wins the run.
const isDuel = () => !!(G.run && G.run.duel);
function duelWon() {
  G.won = true;
  Audio_.stop(); Audio_.sfx('win');
  noteCoins();
  noteTeam('end', runSummary(true));
  setState('win');
  preselectGarden();
  if (NET.role === 'host') netState('win');
}
