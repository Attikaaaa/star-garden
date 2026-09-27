'use strict';
// The second wave of foes: four more per land. Each describes its own look in EDEF
// (sprite, colors, glint) and its behaviour in AI. block(e, shot): the shot bounces off.

Object.assign(EDEF, {
  bunny: { hp: 5, r: 6, h: 11, hw: 5, hh: 4, sw: 14, colors: ['L', 'q', 'w'], sprite: (e) => S(e.z > 1 ? 'bunny_1' : 'bunny_0') },
  snail: { hp: 12, r: 7, h: 11, hw: 6, hh: 4, sw: 16, colors: ['O', 'h', 'N'], sprite: (e) => S('snail_' + (Math.floor(e.anim * 3) % 2)),
    // the shell (behind the head) stops shots
    block: (e, s) => Math.abs(s.vx) > Math.abs(s.vy) * 0.6 && (e.flip ? s.vx > 0 : s.vx < 0),
    glint: (e) => (e.state === 'aim' ? [e.flip ? 6 : -6, -8] : null) },
  dandelion: { hp: 7, r: 7, h: 14, hw: 6, hh: 4, sw: 14, still: true, colors: ['L', 'w', 'y'], sprite: (e) => S(e.state === 'puff' ? 'dandelion_1' : 'dandelion_0'),
    glint: (e) => (e.state === 'charge' && e.t < 0.25 ? [0, -10] : null) },
  ladybug: { hp: 5, r: 6, h: 11, hw: 4, hh: 3, sw: 12, fly: true, colors: ['R', 'r', '1'], sprite: (e) => S('ladybug_' + (Math.floor(e.anim * 14) % 2)) },
  gull: { hp: 6, r: 6, h: 10, hw: 4, hh: 3, sw: 16, fly: true, colors: ['L', 'l', 'O'], sprite: (e) => S('gull_' + (e.state === 'dive' ? 1 : Math.floor(e.anim * 6) % 2)),
    glint: (e) => (e.state === 'aim' ? [e.flip ? -6 : 6, -6] : null) },
  starfish: { hp: 8, r: 7, h: 10, hw: 5, hh: 4, sw: 16, colors: ['O', 'R', 'o'], sprite: (e) => S(e.state === 'spin' && Math.floor(e.anim * 12) % 2 ? 'starfish_1' : 'starfish_0') },
  puffer: { hp: 8, r: 7, h: 11, hw: 5, hh: 4, sw: 16, fly: true, colors: ['y', 'Y', 'o'], sprite: (e) => S(e.state === 'puff' || e.state === 'burst' ? 'puffer_1' : 'puffer_0'),
    glint: (e) => (e.state === 'puff' && e.t < 0.2 ? [0, -6] : null) },
  hermit: { hp: 10, r: 7, h: 10, hw: 6, hh: 4, sw: 16, colors: ['P', 'q', 'R'], sprite: (e) => S(e.state === 'hide' ? 'hermit_1' : 'hermit_0'),
    block: (e) => e.state === 'hide',
    glint: (e) => (e.state === 'out' && e.t < 0.2 ? [0, -8] : null) },
  mole: { hp: 8, r: 7, h: 10, hw: 5, hh: 4, sw: 14, colors: ['N', 'n', 'm'], sprite: (e) => S(e.state === 'under' ? 'mole_1' : 'mole_0'),
    glint: (e) => (e.state === 'pop' && e.t < 0.2 ? [0, -8] : null) },
  spider: { hp: 7, r: 6, h: 9, hw: 5, hh: 3, sw: 16, colors: ['3', '2', '4'], sprite: (e) => S('spider_' + (e.state === 'walk' ? Math.floor(e.anim * 10) % 2 : 0)),
    glint: (e) => (e.state === 'spit' && e.t < 0.2 ? [0, -5] : null),
    // the thread it hangs from while it drops
    under: (e, ox, oy) => { if (e.z > 0) for (let y = Math.round(oy + e.y - e.z - e.h); y > oy + 20; y -= 2) rect(Math.round(ox + e.x), y, 1, 1, 'l'); } },
  gemlet: { hp: 12, r: 7, h: 12, hw: 5, hh: 4, sw: 14, colors: ['C', 'c', 'L'], sprite: (e) => S(e.state === 'stomp' ? 'gemlet_1' : 'gemlet_' + (e.state === 'walk' ? Math.floor(e.anim * 4) % 2 : 0)) },
  gmoth: { hp: 6, r: 6, h: 10, hw: 4, hh: 3, sw: 18, fly: true, colors: ['4', '3', 'y'], sprite: (e) => S('gmoth_' + (Math.floor(e.anim * 12) % 2)) },
  // calm: no touch damage (it only stings once disturbed)
  courier: { hp: 6, r: 6, h: 12, hw: 4, hh: 3, sw: 12, fly: true, colors: ['y', 'B', 'N'],
    sprite: (e) => S('courier_' + ((e.calm ? 0 : 2) + (Math.floor(e.anim * 16) % 2))),
    init: (e) => { e.calm = true; e.state = 'loop'; } },
  puff: { hp: 3, r: 6, h: 11, hw: 4, hh: 3, sw: 12, fly: true, colors: ['L', 'w', 'l'],
    sprite: (e) => S(e.state === 'swell' ? 'puff_2' : 'puff_' + (Math.floor(e.anim * 3) % 2)),
    glint: (e) => (e.state === 'swell' && e.t < 0.25 ? [0, -9] : null) },
  // tucked or rolling, the shell stops shots
  roller: { hp: 10, r: 7, h: 11, hw: 5, hh: 4, sw: 16, colors: ['T', 't', 'R'],
    sprite: (e) => S(e.state === 'roll' ? 'roller_r' + (Math.floor(e.anim * 14) % 4) : e.state === 'tuck' || e.state === 'dizzy' ? 'roller_tuck' : 'roller_' + (e.state === 'walk' ? Math.floor(e.anim * 6) % 2 : 0)),
    block: (e) => e.state === 'tuck' || e.state === 'roll' },
  bomber: { hp: 6, r: 6, h: 12, hw: 5, hh: 3, sw: 18, fly: true, colors: ['L', 'N', 'P'],
    init: (e) => { e.clam = true; },
    sprite: (e) => S('bomber_' + ((e.clam ? 0 : 2) + (Math.floor(e.anim * (e.state === 'aim' ? 9 : 5)) % 2))) },
  // throws the tip of its head; a prism pillar breaks the shard into five
  imp: { hp: 5, r: 6, h: 12, hw: 5, hh: 3, sw: 14, fly: true, colors: ['C', 'c', '4'],
    sprite: (e) => S('imp_' + (e.state === 'aim' ? 2 : e.state === 'regrow' ? 3 : Math.floor(e.anim * 10) % 2)),
    glint: (e) => (e.state === 'aim' && e.t < 0.3 ? [0, -12] : null) },
  // shut, it is a rolling stone that shots bounce off; open, it is soft and harmless to touch
  gbeet: { hp: 12, r: 7, h: 12, hw: 6, hh: 4, sw: 16, colors: ['l', '3', '4'],
    sprite: (e) => S(e.state === 'open' ? 'gbeet_open' : e.state === 'tell' ? 'gbeet_tell' : 'gbeet_' + (e.state === 'roll' ? Math.floor(e.anim * 8) % 4 : 0)),
    block: (e) => e.state === 'roll' || e.state === 'idle',
    glint: (e) => (e.state === 'tell' && e.t < 0.3 ? [0, -7] : null),
    // open, glowing motes rise out of it
    under: (e, ox, oy) => { if (e.state === 'open') for (let i = 0; i < 3; i++) { const k = (e.anim * 1.4 + i / 3) % 1; rect(Math.round(ox + e.x - 4 + i * 4), Math.round(oy + e.y - 11 - k * 10), 1, 1, k < 0.4 ? 'w' : '4'); } } },
});
EF_EXTRA.push('clam');
EF_EXTRA.push('calm');
Object.assign(FOE_NAMES, {
  bunny: 'BUNNY', snail: 'SNAIL', dandelion: 'DANDELION', ladybug: 'LADYBUG', gull: 'SEAGULL', starfish: 'STARFISH',
  puffer: 'PUFFERFISH', hermit: 'HERMIT CRAB', mole: 'MOLE', spider: 'CRYSTAL SPIDER', gemlet: 'GEMLET', gmoth: 'GLOW MOTH',
  courier: 'BEE COURIER', puff: 'DANDELION PUFF', roller: 'HERMIT ROLLER', bomber: 'GULL BOMBER', imp: 'SHARD SPRITE', gbeet: 'GEODE BEETLE',
});
LAND.meadow.pool.push(['bunny', 2], ['snail', 1], ['dandelion', 1], ['ladybug', 1], ['courier', 2], ['puff', 2]);
LAND.shore.pool.push(['gull', 2], ['starfish', 2], ['puffer', 2], ['hermit', 1], ['roller', 2], ['bomber', 2]);
LAND.crystal.pool.push(['mole', 2], ['spider', 2], ['gemlet', 2], ['gmoth', 2], ['imp', 2], ['gbeet', 2]);

Object.assign(AI, {
  // Hops three times toward the hero, then sits.
  bunny(e, dt, room) {
    e.t -= dt;
    if (e.state === 'idle') {
      if (e.t <= 0) { e.state = 'hop'; e.n = 3; e.t = 0.24; const d = towardPlayer(e); e.vx = d.x * 115; e.vy = d.y * 115; e.flip = e.vx < 0; }
    } else if (e.state === 'hop') {
      e.z = Math.sin((1 - e.t / 0.24) * Math.PI) * 7;
      moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
      if (e.t <= 0) {
        e.z = 0; dust(e.x, e.y, 2, 8);
        if (--e.n > 0) { e.t = 0.24; const d = towardPlayer(e); e.vx = d.x * 115; e.vy = d.y * 115; e.flip = e.vx < 0; }
        else { e.state = 'idle'; e.t = grnd(0.9, 1.5); }
      }
    }
  },
  // Crawls slowly, turns only now and then, spits one slow glob.
  snail(e, dt, room, p) {
    e.t -= dt;
    if ((e.turnT = (e.turnT || 0) - dt) <= 0) { e.turnT = grnd(2.5, 3.5); e.flip = p.x > e.x; }
    if (e.state === 'idle' || e.state === 'walk') {
      e.state = 'walk';
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 13 * dt, d.y * 13 * dt, 'enemy');
      if (e.t <= 0) { e.state = 'aim'; e.t = 0.45; }
    } else if (e.state === 'aim' && e.t <= 0) {
      ebullet(e.x + (e.flip ? 6 : -6), e.y - 8, aimAt(e.x, e.y - 8), 58, 'orange', true);
      Audio_.sfx('eshoot');
      e.state = 'walk'; e.t = grnd(2.4, 3.2);
    }
  },
  // Rooted; puffs a spray of slow seeds.
  dandelion(e, dt) {
    e.t -= dt;
    if (e.state === 'idle' && e.t <= 0) { e.state = 'charge'; e.t = 0.55; }
    else if (e.state === 'charge' && e.t <= 0) {
      fan(e.x, e.y - 10, aimAt(e.x, e.y - 10), G.floor.depth ? 5 : 4, 0.3, 36, 'cyan');
      Audio_.sfx('eshoot');
      e.state = 'puff'; e.t = 0.4;
    } else if (e.state === 'puff' && e.t <= 0) { e.state = 'idle'; e.t = grnd(2.4, 3); }
  },
  // Buzzes over the hero and drops spots that stay for a while.
  ladybug(e, dt, room, p) {
    e.t -= dt;
    const d = towardPlayer(e), s = Math.sin(e.anim * 3) * 0.9;
    e.vx += ((d.x - d.y * s) * 40 - e.vx) * 2.5 * dt;
    e.vy += ((d.y + d.x * s) * 40 - e.vy) * 2.5 * dt;
    moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
    if (Math.abs(e.vx) > 3) e.flip = e.vx < 0;
    e.z = 7 + Math.sin(e.anim * 6) * 1.5;
    if (e.t <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 70) {
      e.t = grnd(0.9, 1.3);
      const b = ebullet(e.x, e.y - 2, 0, 0, 'pink', true);
      b.life = 3.2;
      Audio_.sfx('pop');
    }
  },
  // Circles high, then dives in a straight line.
  gull(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle' || e.state === 'circle') {
      e.state = 'circle';
      e.a = (e.a === undefined ? grand() * 6.28 : e.a) + dt * 1.3;
      const tx = p.x + Math.cos(e.a) * 70, ty = p.y + Math.sin(e.a) * 40;
      e.vx += (Math.sign(tx - e.x) * Math.min(90, Math.abs(tx - e.x) * 3) - e.vx) * 2 * dt;
      e.vy += (Math.sign(ty - e.y) * Math.min(90, Math.abs(ty - e.y) * 3) - e.vy) * 2 * dt;
      moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
      e.z = Math.min(16, (e.z || 0) + dt * 20);
      if (e.t <= 0) { e.state = 'aim'; e.t = 0.5; e.vx *= 0.3; e.vy *= 0.3; }
    } else if (e.state === 'aim') {
      e.flip = p.x < e.x;
      if (e.t <= 0) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.vx = Math.cos(a) * 200; e.vy = Math.sin(a) * 200; e.state = 'dive'; e.t = 0.55; Audio_.sfx('swish'); }
    } else if (e.state === 'dive') {
      e.z = Math.max(2, e.z - dt * 60);
      if (moveBox(room, e, e.vx * dt, e.vy * dt, 'fly') || e.t <= 0) { e.state = 'circle'; e.t = grnd(2.2, 3); }
    }
    if (Math.abs(e.vx) > 5 && e.state !== 'aim') e.flip = e.vx < 0;
  },
  // Skids diagonally and bounces off walls; now and then spins out a ring.
  starfish(e, dt, room) {
    e.t -= dt;
    if (!e.vx && !e.vy) { const a = (grndi(0, 3) + 0.5) * Math.PI / 2; e.vx = Math.cos(a) * 62; e.vy = Math.sin(a) * 62; }
    if (e.state === 'spin') {
      if (e.t <= 0) { ring(e.x, e.y - 6, 5, 58, 'orange', grand()); Audio_.sfx('eshoot'); e.state = 'idle'; e.t = grnd(2.6, 3.4); }
      return;
    }
    if (moveBox(room, e, e.vx * dt, 0, 'enemy')) e.vx = -e.vx;
    if (moveBox(room, e, 0, e.vy * dt, 'enemy')) e.vy = -e.vy;
    e.flip = e.vx < 0;
    if (e.t <= 0) { e.state = 'spin'; e.t = 0.5; }
  },
  // Drifts toward the hero; up close it puffs up and bursts into spikes.
  puffer(e, dt, room, p) {
    e.t -= dt;
    e.z = 4 + Math.sin(e.anim * 2.5) * 2;
    const near = Math.hypot(p.x - e.x, p.y - e.y) < 64;
    if (e.state === 'idle') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 22 * dt, d.y * 22 * dt, 'fly');
      e.flip = p.x > e.x;
      if (near && e.t <= 0) { e.state = 'puff'; e.t = 0.55; Audio_.sfx('bubble'); }
    } else if (e.state === 'puff' && e.t <= 0) {
      ring(e.x, e.y - 6, 8, 64, 'cyan', grand() * 0.8);
      Audio_.sfx('pop');
      e.state = 'burst'; e.t = 0.3;
    } else if (e.state === 'burst' && e.t <= 0) { e.state = 'idle'; e.t = grnd(1.6, 2.2); }
  },
  // Hides in its shell (shots bounce off), pops out, fires a fan, scuttles.
  hermit(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'hide'; e.t = grnd(1.4, 2); }
    if (e.state === 'hide' && e.t <= 0) { e.state = 'out'; e.t = 0.45; e.flip = p.x > e.x; }
    else if (e.state === 'out' && e.t <= 0) {
      fan(e.x, e.y - 7, aimAt(e.x, e.y - 7), 5, 0.22, 66, 'pink');
      Audio_.sfx('eshoot');
      e.state = 'walk'; e.t = 1.3;
    } else if (e.state === 'walk') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 30 * dt, d.y * 30 * dt, 'enemy');
      if (e.t <= 0) { e.state = 'hide'; e.t = grnd(1.4, 2); }
    }
  },
  // Scuttles, tucks into its shell (the lane shows), then rolls like a marble and bounces off
  // walls and deep pools. The wave carries it: in the shallows it keeps its speed and at high
  // tide it bounces once more. Dizzy for a moment after (the shell is open again).
  roller(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'walk'; e.t = grnd(1.2, 1.8); }
    if (e.state === 'walk') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 28 * dt, d.y * 28 * dt, 'enemy');
      e.flip = d.x < 0;
      if (e.t <= 0) { e.state = 'tuck'; e.t = 0.55; lane(e, p, 150); Audio_.sfx('bubble'); }
    } else if (e.state === 'tuck') {
      if (e.t <= 0) { e.state = 'roll'; e.t = 2.4; e.n = room.flood ? 3 : 2; e.vx = Math.cos(e.la) * 150; e.vy = Math.sin(e.la) * 150; Audio_.sfx('dash'); }
    } else if (e.state === 'roll') {
      const k = room.flood && wading(room, e.x, e.y) ? 1 / WADE : 1;
      let bump = false;
      if (moveBox(room, e, e.vx * k * dt, 0, 'enemy')) { e.vx = -e.vx; bump = true; }
      if (moveBox(room, e, 0, e.vy * k * dt, 'enemy')) { e.vy = -e.vy; bump = true; }
      e.flip = e.vx < 0;
      if (Math.random() < 0.4) dust(e.x, e.y, 1, 6);
      if (bump) { Audio_.sfx('clack'); burst(e.x, e.y - 5, 4, ['T', 'C', 'w'], 60, 0.25); G.shake = Math.max(G.shake, 1); }
      if ((bump && --e.n < 0) || e.t <= 0) { e.state = 'dizzy'; e.t = 0.9; e.vx = e.vy = 0; }
    } else if (e.state === 'dizzy' && e.t <= 0) { e.state = 'walk'; e.t = grnd(1.2, 1.8); }
  },
  // Circles high with a clam, flies over a hero (a pink ring marks the spot) and drops it;
  // the clam cracks into three shots. It fetches a new one before the next run.
  bomber(e, dt, room, p) {
    e.t -= dt;
    e.z = Math.min(18, (e.z || 0) + dt * 20);
    if (e.state === 'idle' || e.state === 'circle') {
      e.state = 'circle';
      e.a = (e.a === undefined ? grand() * 6.28 : e.a) + dt * 1.1;
      const tx = p.x + Math.cos(e.a) * 64, ty = p.y + Math.sin(e.a) * 34;
      e.vx += (Math.sign(tx - e.x) * Math.min(80, Math.abs(tx - e.x) * 3) - e.vx) * 2 * dt;
      e.vy += (Math.sign(ty - e.y) * Math.min(80, Math.abs(ty - e.y) * 3) - e.vy) * 2 * dt;
      moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
      if (e.t <= 0 && e.clam) {
        // the spot is where the hero stands now; the clam lands 1.3 s later
        e.state = 'aim'; e.t = 0.7; e.tx = p.x; e.ty = p.y;
        G.markers.push({ x: p.x, y: p.y, t: 1.3, max: 1.3, src: 'bomber', fall: 'clam', n: 3, h: 34 });
        Audio_.sfx('swish');
      } else if (e.t <= 0) { e.clam = true; e.t = grnd(1.4, 2.2); }
    } else if (e.state === 'aim') {
      // fly over the spot, then let go (the clam falls for the last 0.6 s)
      const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy) || 1, v = Math.min(190, d / Math.max(0.05, e.t));
      e.vx = dx / d * v; e.vy = dy / d * v;
      moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
      if (e.t <= 0) { e.clam = false; e.state = 'circle'; e.t = grnd(1.6, 2.4); Audio_.sfx('pop'); }
    }
    if (Math.abs(e.vx) > 5) e.flip = e.vx < 0;
  },
  // Burrows (a moving mound nothing can hit), pops up beside the hero with a ring.
  mole(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'under'; e.t = grnd(1.4, 2); e.ghost = true; }
    if (e.state === 'under') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 55 * dt, d.y * 55 * dt, 'enemy');
      if (Math.random() < 0.3) dust(e.x, e.y, 1, 10);
      if (e.t <= 0 || Math.hypot(p.x - e.x, p.y - e.y) < 26) { e.state = 'pop'; e.t = 0.4; e.ghost = false; dust(e.x, e.y, 8, 16); Audio_.sfx('brk'); }
    } else if (e.state === 'pop' && e.t <= 0) {
      ring(e.x, e.y - 6, 6, 60, 'orange', grand());
      Audio_.sfx('eshoot');
      e.state = 'stay'; e.t = 1.1;
    } else if (e.state === 'stay' && e.t <= 0) { e.state = 'under'; e.t = grnd(1.4, 2); e.ghost = true; dust(e.x, e.y, 6, 14); }
  },
  // Drops from the ceiling on a thread, then skitters and spits webs.
  spider(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle' && e.n === 0 && e.z === 0) { e.z = 44; e.n = 1; e.state = 'drop'; }
    if (e.state === 'drop') { e.z = Math.max(0, e.z - dt * 55); if (e.z === 0) { e.state = 'walk'; e.t = 0.6; } return; }
    if (e.state === 'walk') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 72 * dt, d.y * 72 * dt, 'enemy');
      e.flip = d.x < 0;
      if (e.t <= 0) { e.state = (e.k = (e.k || 0) + 1) % 3 ? 'wait' : 'spit'; e.t = e.state === 'spit' ? 0.4 : 0.45; }
    } else if (e.state === 'wait' && e.t <= 0) { e.state = 'walk'; e.t = 0.55; }
    else if (e.state === 'spit' && e.t <= 0) {
      fan(e.x, e.y - 5, aimAt(e.x, e.y - 5), 3, 0.28, 72, 'purple');
      Audio_.sfx('eshoot');
      e.state = 'walk'; e.t = 0.6;
    }
  },
  // Plods toward the hero, then stomps a ring of shards.
  gemlet(e, dt, room) {
    e.t -= dt;
    if (e.state === 'idle' || e.state === 'walk') {
      e.state = 'walk';
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 26 * dt, d.y * 26 * dt, 'enemy');
      e.flip = d.x < 0;
      if (e.t <= 0) { e.state = 'stomp'; e.t = 0.42; }
    } else if (e.state === 'stomp') {
      e.z = Math.sin((1 - e.t / 0.42) * Math.PI) * 6;
      if (e.t <= 0) {
        e.z = 0;
        ring(e.x, e.y - 4, 6, 64, 'cyan', grand());
        dust(e.x, e.y, 6, 14); G.shake = Math.max(G.shake, 2);
        Audio_.sfx('boom');
        e.state = 'walk'; e.t = grnd(1.6, 2.2);
      }
    }
  },
  // Hovers at mid range, aims (the tip of its head glows), then throws the tip as a shard.
  imp(e, dt, room, p) {
    e.t -= dt;
    e.z = 8 + Math.sin(e.anim * 4) * 2;
    if (e.state === 'idle') { e.state = 'fly'; e.t = grnd(1.4, 2.2); }
    if (e.state === 'aim') {
      e.vx *= 0.85; e.vy *= 0.85; e.flip = p.x < e.x;
      if (e.t <= 0) {
        const y = e.y - 6, b = ebullet(e.x, y, aimAt(e.x, y), 80, 'shard', true);
        b.shard = true;
        Audio_.sfx('eshoot');
        e.state = 'regrow'; e.t = 0.9;
      }
    } else {
      if ((e.wT = (e.wT || 0) - dt) <= 0) {
        e.wT = grnd(0.8, 1.4);
        const a = Math.atan2(e.y - p.y, e.x - p.x) + grnd(-0.8, 0.8), d = grnd(60, 90);
        e.wx = Math.max(24, Math.min(VW - 24, p.x + Math.cos(a) * d));
        e.wy = Math.max(OY + 40, Math.min(OY + 184, p.y + Math.sin(a) * d * 0.7));
      }
      const dx = e.wx - e.x, dy = e.wy - e.y, d = Math.hypot(dx, dy) || 1, sp = d < 6 ? 0 : 48;
      e.vx += (dx / d * sp - e.vx) * 3 * dt;
      e.vy += (dy / d * sp - e.vy) * 3 * dt;
      if (Math.abs(e.vx) > 3) e.flip = e.vx < 0;
      if (e.t <= 0) {
        if (e.state === 'regrow') { e.state = 'fly'; e.t = grnd(1.3, 2); }
        else { e.state = 'aim'; e.t = 0.55; Audio_.sfx('charge'); }
      }
    }
    moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
  },
  // Rolls shut toward the hero, cracks open to shoot a ring, then sits open for a moment.
  gbeet(e, dt, room) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'roll'; e.t = grnd(1.6, 2.4); }
    if (e.state === 'roll') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 30 * dt, d.y * 30 * dt, 'enemy');
      e.flip = d.x < 0;
      if (e.t <= 0) { e.state = 'tell'; e.t = 0.55; Audio_.sfx('clack'); }
    } else if (e.state === 'tell' && e.t <= 0) {
      ring(e.x, e.y - 6, 6, 60, 'purple', grand());
      burst(e.x, e.y - 6, 6, ['4', '3', 'w'], 50, 0.4);
      Audio_.sfx('eshoot');
      e.state = 'open'; e.t = 1.4; e.calm = true;
    } else if (e.state === 'open' && e.t <= 0) {
      e.state = 'roll'; e.t = grnd(1.6, 2.4); e.calm = false;
      Audio_.sfx('clack');
    }
  },
  // Flutters about; leaves clouds of glowing dust behind.
  gmoth(e, dt, room, p) {
    e.t -= dt;
    if ((e.wT = (e.wT || 0) - dt) <= 0) { e.wT = grnd(0.5, 1); e.wx = p.x + grnd(-60, 60); e.wy = p.y + grnd(-40, 40); }
    const dx = e.wx - e.x, dy = e.wy - e.y, d = Math.hypot(dx, dy) || 1;
    e.vx += (dx / d * 60 - e.vx) * 3 * dt;
    e.vy += (dy / d * 60 - e.vy) * 3 * dt;
    moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
    if (Math.abs(e.vx) > 3) e.flip = e.vx < 0;
    e.z = 8 + Math.sin(e.anim * 5) * 2;
    if (e.t <= 0) {
      e.t = grnd(0.7, 1);
      const b = ebullet(e.x, e.y - 4, 0, 0, 'purple');
      b.life = 2.2;
    }
  },
  // Flies a loop from bloom to bloom. Shot at or crowded, it frowns, shows its lane and
  // stings along it; it calms down again a few seconds after the last bother.
  courier(e, dt, room, p) {
    e.t -= dt;
    const hit = e.hurtAt && e.hurtAt !== e.seen;
    if (hit) {
      e.seen = e.hurtAt;
      if (!e.pol) { e.pol = 1; spawnPickup('pollen', e.x, e.y - 2); } // one puff of pollen per bee
    }
    // crowding only wakes it; after that only shots keep it cross
    if (hit || (e.calm && Math.hypot(p.x - e.x, p.y - e.y) < 26)) {
      e.mad = 4;
      if (e.calm) { e.calm = false; e.state = 'tell'; e.t = 0.55; e.vx = e.vy = 0; lane(e, p, 90); Audio_.sfx('charge'); }
    }
    e.z = 6 + Math.sin(e.anim * 5) * 1.5;
    if (e.state === 'loop') {
      if (e.t <= 0 || e.wx === undefined) {
        // the next bloom (any patch tile of the Meadow), or a spot near where it started
        const P = typeof meadowPatches === 'function' && G.floor.land.id === 'meadow' ? [...meadowPatches(room).tiles.keys()] : [];
        if (e.x0 === undefined) { e.x0 = e.x; e.y0 = e.y; }
        if (P.length) { const i = P[grndi(0, P.length - 1)]; e.wx = (i % COLS) * 16 + 8; e.wy = OY + Math.floor(i / COLS) * 16 + 8; }
        else { const a = grand() * 6.28; e.wx = e.x0 + Math.cos(a) * 44; e.wy = e.y0 + Math.sin(a) * 30; }
        e.t = grnd(3, 4.5);
      }
      const dx = e.wx - e.x, dy = e.wy - e.y, d = Math.hypot(dx, dy);
      const sp = d < 6 ? 0 : Math.min(42, d * 2); // hovers over the flower for the rest of its turn
      e.vx += ((d ? dx / d : 0) * sp - e.vx) * 2.5 * dt;
      e.vy += ((d ? dy / d : 0) * sp + Math.sin(e.anim * 4) * 12 - e.vy) * 2.5 * dt;
      if (d < 8 && Math.random() < dt * 4) part(e.x + rnd(-3, 3), e.y - e.z - 2, rnd(-8, 8), rnd(6, 16), 0.5, 'Y');
    } else if (e.state === 'tell') {
      e.kx = e.ky = 0;
      e.flip = Math.cos(e.la) < 0;
      if (e.t <= 0) { e.state = 'dash'; e.t = 0.45; e.vx = Math.cos(e.la) * 175; e.vy = Math.sin(e.la) * 175; Audio_.sfx('swish'); }
    } else if (e.state === 'dash') {
      if (e.t <= 0) { e.state = 'cool'; e.t = 0.9; }
    } else if (e.state === 'cool') {
      e.vx *= Math.pow(0.05, dt); e.vy *= Math.pow(0.05, dt);
      if (e.t <= 0) {
        if ((e.mad -= 0.9 + 0.45) > 0) { e.state = 'tell'; e.t = 0.55; lane(e, p, 90); Audio_.sfx('charge'); }
        else { e.calm = true; e.state = 'loop'; e.t = 0; }
      }
    }
    if (moveBox(room, e, e.vx * dt, e.vy * dt, 'fly') && e.state === 'dash') { e.vx *= -0.3; e.vy *= -0.3; }
    if (e.state !== 'tell' && Math.abs(e.vx) > 4) e.flip = e.vx < 0;
  },
  // Floats toward the hero (and drifts with the gust), swells up close and bursts into a
  // ring of seeds that ride the wind. Popped by a shot first, it just goes: no seeds.
  puff(e, dt, room, p) {
    e.t -= dt;
    e.z = 6 + Math.sin(e.anim * 2.2) * 2;
    if (e.state === 'idle') {
      const d = towardPlayer(e);
      moveBox(room, e, (d.x * 24 + G.wind * 0.5) * dt, d.y * 24 * dt, 'fly');
      e.flip = p.x < e.x;
      if (e.n === 0) { e.n = 1; e.t = grnd(5, 7); } // at the latest it bursts after a few seconds
      if (Math.hypot(p.x - e.x, p.y - e.y) < 44 || e.t <= 0) { e.state = 'swell'; e.t = 0.6; Audio_.sfx('bubble'); }
    } else if (e.state === 'swell' && e.t <= 0) {
      const n = G.floor.depth ? 6 : 5, a = grand() * 6.28;
      for (let i = 0; i < n; i++) { const b = ebullet(e.x, e.y - 7, a + i * Math.PI * 2 / n, 40, 'fluff'); b.gust = true; b.life = 4.5; }
      muzzle(e.x, e.y - 7);
      burst(e.x, e.y - 7, 10, ['w', 'L', 'l'], 70, 0.5, { g: -10 });
      Audio_.sfx('pop');
      e.dead = true; poof(e.x, e.y - 6);
    }
  },
});
// Spiders start high on their thread.
EDEF.spider.init = (e) => { e.z = 44; e.state = 'drop'; e.n = 1; };

// Their pages in the book.
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'bunny', spr: 'bunny_0', lore: ['BUNNIES NEVER HOP JUST ONCE.', 'COUNT TO THREE, THEN IT RESTS.', 'THEY USED TO NIBBLE STARLIGHT CLOVER.'] },
  { t: 'snail', spr: 'snail_0', lore: ['ITS SHELL STOPS ANY SHOT.', 'IT TURNS AROUND ONLY NOW AND THEN.', 'HIT IT FROM THE FRONT, WHILE IT IS NOT LOOKING.'] },
  { t: 'dandelion', spr: 'dandelion_0', lore: ['A PUFF OF SEEDS ON THE WIND.', 'THE SEEDS ARE SLOW. WALK BETWEEN THEM.', 'MAKE A WISH BEFORE YOU POP IT.'] },
  { t: 'ladybug', spr: 'ladybug_0', lore: ['A LADYBUG THAT LEAVES ITS SPOTS BEHIND.', 'THE SPOTS FADE AFTER A FEW SECONDS.', 'COUNT ITS DOTS: SEVEN FOR GOOD LUCK.'] },
  { t: 'gull', spr: 'gull_0', lore: ['SEAGULLS CIRCLE HIGH OVER THE SHORE.', 'WHEN ONE STOPS IN THE AIR, IT IS ABOUT TO DIVE.', 'IT ONLY WANTS YOUR SANDWICH.'] },
  { t: 'starfish', spr: 'starfish_0', lore: ['A STARFISH THAT FELL FROM THE SKY, IT SAYS.', 'IT BOUNCES OFF WALLS LIKE A BALL.', 'IT SPINS WHEN IT GETS DIZZY.'] },
  { t: 'puffer', spr: 'puffer_0', lore: ['A PUFFERFISH FLOATING IN THE BREEZE.', 'GET CLOSE AND IT PUFFS UP WITH SPIKES.', 'IT IS MORE SCARED THAN YOU ARE.'] },
  { t: 'hermit', spr: 'hermit_0', lore: ['A CRAB WEARING A BORROWED SHELL.', 'WHILE IT HIDES, SHOTS JUST BOUNCE OFF.', 'IT HAS MOVED HOUSE ELEVEN TIMES.'] },
  { t: 'roller', spr: 'roller_0', lore: ['ITS SHELL IS ROUND AS A MARBLE.', 'WHEN IT TUCKS IN, IT ROLLS DOWN THE LANE.', 'AFTER A ROLL IT IS DIZZY AND OPEN.'] },
  { t: 'bomber', spr: 'bomber_0', lore: ['A SEAGULL IN A PILOT CAP.', 'IT DROPS CLAMS WHERE THE PINK RING SHOWS.', 'THE CLAM CRACKS INTO THREE SHOTS.'] },
  { t: 'mole', spr: 'mole_0', lore: ['MOLES DIG UNDER THE CRYSTALS.', 'A MOVING MOUND MEANS ONE IS COMING UP.', 'IT FINDS SHINY THINGS IN THE DARK.'] },
  { t: 'spider', spr: 'spider_0', lore: ['A SPIDER MADE OF CRYSTAL.', 'IT DROPS DOWN ON A SILVER THREAD.', 'ITS WEBS CATCH FALLING STARDUST.'] },
  { t: 'gemlet', spr: 'gemlet_0', lore: ['A LITTLE CRYSTAL GOLEM.', 'IT STOMPS A RING OF SHARDS.', 'IT WANTS TO BE BIG LIKE THE GOLEM ONE DAY.'] },
  { t: 'courier', spr: 'courier_0', lore: ['A BEE THAT CARRIES THE MEADOW MAIL.', 'IT STINGS ONLY IF YOU BOTHER IT.', 'SHOOT IT AND IT DROPS POLLEN THAT HEALS.'] },
  { t: 'puff', spr: 'puff_0', lore: ['A DANDELION CLOCK THAT FLOATS BY ITSELF.', 'POP IT FROM AFAR BEFORE IT BURSTS.', 'ITS SEEDS RIDE THE GUST.'] },
  { t: 'gmoth', spr: 'gmoth_0', lore: ['A MOTH THAT GLOWS IN THE CAVE.', 'IT LEAVES CLOUDS OF GLOWING DUST.', 'IT SERVES THE NIGHT MOTH, BUT IT MISSES THE SUN.'] },
  { t: 'imp', spr: 'imp_0', lore: ['IT THROWS THE TIP OF ITS OWN HEAD.', 'A PRISM BREAKS THE SHARD INTO FIVE.', 'THE TIP GROWS BACK. IT TICKLES.'] },
  { t: 'gbeet', spr: 'gbeet_0', lore: ['SHUT, IT IS JUST A ROLLING STONE.', 'WHEN THE CRACK GLOWS, IT OPENS AND SHOOTS.', 'OPEN, IT IS SOFT. THAT IS YOUR MOMENT.'] },
);

// ---------- Cloud Steps ----------
// the tile centre under x, y (lightning strikes whole tiles)
const cellMid = (x, y) => [Math.floor(x / 16) * 16 + 8, OY + Math.floor((y - 1 - OY) / 16) * 16 + 8];
// hop n times toward the hero (sheep and lambs)
function woolHop(e, dt, room, n, sp, dur, hi) {
  e.t -= dt;
  const go = () => { e.t = dur; const d = towardPlayer(e); e.vx = d.x * sp; e.vy = d.y * sp; e.flip = e.vx < 0; };
  if (e.state === 'idle') { if (e.t <= 0) { e.state = 'hop'; e.n = n; go(); } }
  else if (e.state === 'hop') {
    e.z = Math.sin((1 - e.t / dur) * Math.PI) * hi;
    moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
    if (e.t <= 0) { e.z = 0; dust(e.x, e.y, 2, 8); if (--e.n > 0) go(); else { e.state = 'idle'; e.t = grnd(0.8, 1.3); } }
  }
}
Object.assign(EDEF, {
  sheep: { hp: 10, r: 7, h: 12, hw: 6, hh: 4, sw: 18, colors: ['w', 'L', 'l'], sprite: (e) => S(e.z > 1 ? 'sheep_1' : 'sheep_0'),
    // the fleece comes apart into two lambs
    die: (e) => { for (let i = 0; i < 2; i++) { const m = spawnEnemy('lamb', e.x + (i ? 6 : -6), e.y, { instant: true }); m.t = 0.5; } } },
  lamb: { hp: 3, r: 5, h: 10, hw: 4, hh: 3, sw: 12, colors: ['w', 'L', 'q'], sprite: (e) => S(e.z > 1 ? 'lamb_1' : 'lamb_0') },
  kiteray: { hp: 6, r: 7, h: 12, hw: 5, hh: 3, sw: 18, fly: true, colors: ['B', 'c', 'P'], sprite: (e) => S('kiteray_' + (Math.floor(e.anim * 3) % 2)) },
  stormwisp: { hp: 6, r: 6, h: 11, hw: 5, hh: 3, sw: 14, fly: true, colors: ['l', 'm', 'y'],
    sprite: (e) => S(e.state === 'charge' ? 'stormwisp_2' : 'stormwisp_' + (Math.floor(e.anim * 5) % 2)),
    glint: (e) => (e.state === 'charge' && e.t < 0.3 ? [0, -3] : null) },
  pigeon: { hp: 6, r: 6, h: 11, hw: 5, hh: 3, sw: 14, fly: true, colors: ['L', 'l', 'T'],
    sprite: (e) => S(e.state === 'aim' ? 'pigeon_2' : 'pigeon_' + (Math.floor(e.anim * 8) % 2)),
    glint: (e) => (e.state === 'aim' && e.t < 0.3 ? [e.flip ? -5 : 5, -8] : null) },
  // the sun shield (in front) stops shots; after a stomp it hangs at its side for a moment
  nimbus: { hp: 14, r: 7, h: 13, hw: 6, hh: 4, sw: 16, colors: ['B', 'L', 'y'],
    sprite: (e) => S(e.state === 'tell' ? 'nimbus_2' : e.state === 'rest' ? 'nimbus_3' : 'nimbus_' + (Math.floor(e.anim * 4) % 2)),
    block: (e, s) => e.state !== 'rest' && Math.abs(s.vx) > Math.abs(s.vy) * 0.6 && (e.flip ? s.vx > 0 : s.vx < 0) },
  // calm: it only wants your coins; popped, it drops what it took
  bandit: { hp: 4, r: 6, h: 16, hw: 5, hh: 3, sw: 14, fly: true, colors: ['q', 'P', 'y'],
    sprite: (e) => S('bandit_' + (Math.floor(e.anim * 3) % 2)),
    init: (e) => { e.calm = true; e.loot = 0; },
    die: (e) => { for (let i = 0; i < e.loot; i++) spawnPickup('coin', e.x, e.y - 6); if (e.loot) toast('YOUR COINS ARE BACK!'); } },
});
Object.assign(FOE_NAMES, { sheep: 'PUFF SHEEP', lamb: 'LAMB', kiteray: 'KITE RAY', stormwisp: 'STORM WISP', pigeon: 'PIGEON POSTMAN', nimbus: 'NIMBUS KNIGHT', bandit: 'BALLOON BANDIT' });

Object.assign(AI, {
  // Two slow, heavy hops, then a rest.
  sheep(e, dt, room) { woolHop(e, dt, room, 2, 70, 0.34, 8); },
  lamb(e, dt, room) { woolHop(e, dt, room, 3, 115, 0.22, 6); },
  // Glides in wide lazy swoops; over a hero it lets a water balloon go (a pink ring marks it).
  kiteray(e, dt, room, p) {
    e.t -= dt;
    e.z = 14 + Math.sin(e.anim * 2) * 2;
    e.a = (e.a === undefined ? grand() * 6.28 : e.a) + dt * 0.8;
    const tx = p.x + Math.cos(e.a) * 80, ty = p.y + Math.sin(e.a * 2) * 30;
    e.vx += (Math.sign(tx - e.x) * Math.min(60, Math.abs(tx - e.x) * 2) - e.vx) * 1.5 * dt;
    e.vy += (Math.sign(ty - e.y) * Math.min(50, Math.abs(ty - e.y) * 2) - e.vy) * 1.5 * dt;
    moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
    if (Math.abs(e.vx) > 5) e.flip = e.vx < 0;
    if (e.t <= 0) {
      e.t = grnd(2.4, 3.2);
      G.markers.push({ x: p.x, y: p.y, t: 1.2, max: 1.2, src: 'kiteray', fall: 'kite_bomb', n: 4, h: 30 });
      Audio_.sfx('swish');
    }
  },
  // Drifts at a distance; crackles, then calls a bolt onto the hero's tile (a pink ring
  // shows it), which leaves the tile charged for a few seconds.
  stormwisp(e, dt, room, p) {
    e.t -= dt;
    e.z = 10 + Math.sin(e.anim * 3) * 2;
    if (e.state === 'idle') { e.state = 'drift'; e.t = grnd(1.6, 2.4); }
    if (e.state === 'charge') {
      e.vx *= 0.9; e.vy *= 0.9;
      if (e.t <= 0) { e.state = 'drift'; e.t = grnd(2.4, 3.2); }
    } else {
      if ((e.wT = (e.wT || 0) - dt) <= 0) {
        e.wT = grnd(1, 1.6);
        const a = Math.atan2(e.y - p.y, e.x - p.x) + grnd(-1, 1), d = grnd(70, 100);
        e.wx = Math.max(24, Math.min(VW - 24, p.x + Math.cos(a) * d));
        e.wy = Math.max(OY + 40, Math.min(OY + 184, p.y + Math.sin(a) * d * 0.7));
      }
      const dx = e.wx - e.x, dy = e.wy - e.y, d = Math.hypot(dx, dy) || 1, sp = d < 6 ? 0 : 36;
      e.vx += (dx / d * sp - e.vx) * 2.5 * dt;
      e.vy += (dy / d * sp - e.vy) * 2.5 * dt;
      if (Math.abs(e.vx) > 3) e.flip = e.vx < 0;
      if (e.t <= 0) {
        const [x, y] = cellMid(p.x, p.y);
        e.state = 'charge'; e.t = 0.9;
        G.markers.push({ kind: 'bolt', x, y, t: 0.9, max: 0.9, src: 'stormwisp' });
        Audio_.sfx('charge');
      }
    }
    moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
  },
  // Hovers about; throws its letter, which flies out and comes back to its beak.
  pigeon(e, dt, room, p) {
    e.t -= dt;
    e.z = 8 + Math.sin(e.anim * 4) * 1.5;
    const L = e.lb && e.lb.letter === e && e.lb.life > 0 ? e.lb : null;
    if (L && L.t > 0.7) {
      // back home: the letter curves toward the pigeon and is caught
      const dx = e.x - L.x, dy = e.y - 7 - L.y, d = Math.hypot(dx, dy) || 1;
      L.vx += (dx / d * 85 - L.vx) * 3 * dt; L.vy += (dy / d * 85 - L.vy) * 3 * dt;
      if (d < 8) { L.life = 0; e.lb = null; Audio_.sfx('pop'); }
    }
    if (e.state === 'aim') {
      e.vx *= 0.85; e.vy *= 0.85; e.flip = p.x < e.x;
      if (e.t <= 0) {
        const x = e.x + (e.flip ? -5 : 5), y = e.y - 8, b = ebullet(x, y, aimAt(x, y), 85, 'letter', true);
        b.letter = e; b.life = 4; e.lb = b;
        Audio_.sfx('swish');
        e.state = 'fly'; e.t = grnd(1.8, 2.4);
      }
    } else {
      if (e.state === 'idle') { e.state = 'fly'; e.t = grnd(1, 1.8); }
      if ((e.wT = (e.wT || 0) - dt) <= 0) {
        e.wT = grnd(0.8, 1.4);
        const a = Math.atan2(e.y - p.y, e.x - p.x) + grnd(-0.9, 0.9), d = grnd(55, 85);
        e.wx = Math.max(24, Math.min(VW - 24, p.x + Math.cos(a) * d));
        e.wy = Math.max(OY + 40, Math.min(OY + 184, p.y + Math.sin(a) * d * 0.7));
      }
      const dx = e.wx - e.x, dy = e.wy - e.y, d = Math.hypot(dx, dy) || 1, sp = d < 6 ? 0 : 44;
      e.vx += (dx / d * sp - e.vx) * 3 * dt;
      e.vy += (dy / d * sp - e.vy) * 3 * dt;
      if (Math.abs(e.vx) > 3) e.flip = e.vx < 0;
      if (e.t <= 0 && !L) { e.state = 'aim'; e.t = 0.5; }
    }
    moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
  },
  // Marches behind its shield, lifts a foot and stomps: the clouds around the hero wobble
  // and puff (on stone, a ring of sunbeams instead). Then the shield hangs low for a moment.
  nimbus(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle' || e.state === 'walk') {
      e.state = 'walk';
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 20 * dt, d.y * 20 * dt, 'enemy');
      e.flip = p.x < e.x;
      if (e.t <= 0) { e.state = 'tell'; e.t = 0.55; Audio_.sfx('charge'); }
    } else if (e.state === 'tell') {
      e.z = Math.sin((1 - e.t / 0.55) * Math.PI / 2) * 4;
      if (e.t <= 0) {
        e.z = 0; dust(e.x, e.y, 6, 14); G.shake = Math.max(G.shake, 2); Audio_.sfx('boom');
        let n = 0;
        const far = Math.hypot(p.x - e.x, p.y - e.y), me = cellAt(e.x, e.y);
        if (G.floor.land.id === 'cloud' && puffLive(room) && far > 28 && far < 120) {
          const c0 = Math.floor(p.x / 16), r0 = Math.floor((p.y - 1 - OY) / 16);
          for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
            const i = r * COLS + c;
            if (c > 0 && c < COLS - 1 && r > 1 && r < ROWS - 1 && i !== me && puffAt(room, i)) n++;
          }
        }
        if (!n) ring(e.x, e.y - 6, 6, 60, 'orange', grand());
        e.state = 'rest'; e.t = 0.9;
      }
    } else if (e.state === 'rest' && e.t <= 0) { e.state = 'walk'; e.t = grnd(2, 2.8); }
  },
  // Floats to the hero with the most... well, to a hero. A touch takes up to ten coins, then
  // it sails off; pop it before it gets away and the coins rain back down.
  bandit(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'sneak'; e.t = 9; }
    if (e.state === 'sneak') {
      e.z = 10 + Math.sin(e.anim * 2) * 2;
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 46 * dt, d.y * 46 * dt, 'fly');
      e.flip = d.x < 0;
      for (const q of G.players) if (alive(q) && Math.hypot(q.x - e.x, q.y - e.y) < 12) {
        e.loot = Math.min(10, G.coins); G.coins -= e.loot;
        if (e.loot) { toast('THE BANDIT TOOK ' + e.loot + ' COINS! POP IT!'); Audio_.sfx('coin'); burst(q.x, q.y - 10, 8, ['y', 'Y', 'w'], 60, 0.4); }
        e.t = 0; break;
      }
      if (e.t <= 0) { e.state = 'flee'; e.t = 3.5; Audio_.sfx('swish'); }
    } else if (e.state === 'flee') {
      e.z = Math.min(16, e.z + dt * 6);
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      moveBox(room, e, Math.cos(a) * 34 * dt, (Math.sin(a) * 34 - 12) * dt, 'fly');
      if (e.t <= 0) { e.dead = true; poof(e.x, e.y - 8); Audio_.sfx('tele'); if (e.loot) toast('THE BANDIT GOT AWAY!'); }
    }
  },
});
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'sheep', spr: 'sheep_0', lore: ['A SHEEP WITH A CLOUD FOR A FLEECE.', 'POP IT AND TWO LAMBS HOP OUT.', 'COUNTING THEM NEVER PUTS ANYONE TO SLEEP.'] },
  { t: 'lamb', spr: 'lamb_0', lore: ['A LITTLE LAMB OF FLUFF.', 'IT HOPS THREE TIMES, FAST.', 'IT WILL GROW INTO A CLOUD ONE DAY.'] },
  { t: 'kiteray', spr: 'kiteray_0', lore: ['A KITE THAT FLEW AWAY AND NEVER CAME DOWN.', 'IT DROPS WATER BALLOONS ON THE PINK RING.', 'NOBODY KNOWS WHO HOLDS THE STRING.'] },
  { t: 'stormwisp', spr: 'stormwisp_0', lore: ['A SMALL, GRUMPY THUNDERCLOUD.', 'WHEN IT CRACKLES, STEP OFF THE PINK RING.', 'THE STRUCK TILE STAYS CHARGED FOR A WHILE.'] },
  { t: 'pigeon', spr: 'pigeon_0', lore: ['THE SKY POST. ALWAYS ON TIME.', 'ITS LETTER FLIES OUT AND COMES BACK.', 'WATCH THE WAY BACK, NOT JUST THE THROW.'] },
  { t: 'nimbus', spr: 'nimbus_0', lore: ['A KNIGHT IN CLOUD ARMOUR.', 'ITS SUN SHIELD STOPS SHOTS FROM THE FRONT.', 'AFTER A STOMP THE SHIELD HANGS LOW.'] },
  { t: 'bandit', spr: 'bandit_0', lore: ['A MASKED RACCOON ON THREE BALLOONS.', 'ONE TOUCH AND YOUR COINS ARE GONE.', 'POP IT BEFORE IT SAILS AWAY.'] },
);
