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
});
Object.assign(FOE_NAMES, {
  bunny: 'BUNNY', snail: 'SNAIL', dandelion: 'DANDELION', ladybug: 'LADYBUG', gull: 'SEAGULL', starfish: 'STARFISH',
  puffer: 'PUFFERFISH', hermit: 'HERMIT CRAB', mole: 'MOLE', spider: 'CRYSTAL SPIDER', gemlet: 'GEMLET', gmoth: 'GLOW MOTH',
});
LANDS[0].pool.push(['bunny', 2], ['snail', 1], ['dandelion', 1], ['ladybug', 1]);
LANDS[1].pool.push(['gull', 2], ['starfish', 2], ['puffer', 2], ['hermit', 1]);
LANDS[2].pool.push(['mole', 2], ['spider', 2], ['gemlet', 2], ['gmoth', 2]);

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
  { t: 'mole', spr: 'mole_0', lore: ['MOLES DIG UNDER THE CRYSTALS.', 'A MOVING MOUND MEANS ONE IS COMING UP.', 'IT FINDS SHINY THINGS IN THE DARK.'] },
  { t: 'spider', spr: 'spider_0', lore: ['A SPIDER MADE OF CRYSTAL.', 'IT DROPS DOWN ON A SILVER THREAD.', 'ITS WEBS CATCH FALLING STARDUST.'] },
  { t: 'gemlet', spr: 'gemlet_0', lore: ['A LITTLE CRYSTAL GOLEM.', 'IT STOMPS A RING OF SHARDS.', 'IT WANTS TO BE BIG LIKE THE GOLEM ONE DAY.'] },
  { t: 'gmoth', spr: 'gmoth_0', lore: ['A MOTH THAT GLOWS IN THE CAVE.', 'IT LEAVES CLOUDS OF GLOWING DUST.', 'IT SERVES THE NIGHT MOTH, BUT IT MISSES THE SUN.'] },
);
