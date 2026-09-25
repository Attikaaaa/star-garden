'use strict';
// The alternate boss of every land (Queen Bee, Pearl Octopus, Crystal Moth), the Night
// Moth in the Star Well, and the story around them: every boss wears one of the Big Stars
// the Night Moth stole. Seven of them open the Star Well after the third land.

Object.assign(EDEF, {
  queen: { hp: 160, r: 13, h: 22, hw: 12, hh: 7, sw: 30, boss: true, fly: true, colors: ['y', 'Y', 'o'], sprite: (e) => S('queen_' + (Math.floor(e.anim * 14) % 2)),
    glint: (e) => (e.state === 'aim' ? [e.flip ? -12 : 12, -12] : null) },
  octo: { hp: 180, r: 14, h: 22, hw: 13, hh: 7, sw: 32, boss: true, colors: ['P', 'q', 'p'], sprite: (e) => S('octo_' + (Math.floor(e.anim * 3) % 2)),
    glint: (e) => (e.state === 'beam' && e.n < 0.3 ? [0, -6] : null) },
  cmoth: { hp: 170, r: 13, h: 20, hw: 12, hh: 7, sw: 34, boss: true, fly: true, colors: ['3', '4', 'C'], sprite: (e) => S('cmoth_' + (Math.floor(e.anim * 8) % 2)) },
  nmoth: { hp: 330, r: 16, h: 26, hw: 14, hh: 8, sw: 42, boss: true, fly: true, colors: ['2', '3', 'Y'], sprite: (e) => S('nmoth_' + (Math.floor(e.anim * 6) % 2)) },
});
Object.assign(FOE_NAMES, { queen: 'QUEEN BEE', octo: 'PEARL OCTOPUS', cmoth: 'CRYSTAL MOTH', nmoth: 'NIGHT MOTH' });
LANDS[0].alt = 'queen'; LANDS[1].alt = 'octo'; LANDS[2].alt = 'cmoth';
const bossName = (t) => foeName(t);
// The boss of the current room (for the health bar and the entrance).
const curBossName = () => bossName(G.boss ? G.boss.type : G.floor.boss || G.floor.land.boss);

// ---------- Which boss waits at the end of a land ----------
// The alternate boss only turns up once the land's first boss has been beaten.
function chooseBoss(floor) {
  const L = floor.land;
  if (G.run.bow && L === LANDS[G.run.bow.land]) return G.run.bow.boss;
  if (!L.alt) return L.boss;
  return withSeed(hashSeed(G.run.seed, 'boss', floor.depth), () => {
    const known = G.daily || cnt('b:' + L.boss) > 0 || Save.stats.bestDepth > (floor.depth % LANDS.length) + 1;
    return known && grand() < 0.5 ? L.alt : L.boss;
  });
}

// ---------- The Star Well: a fourth land behind the third, for players with seven Big Stars ----------
const WELL = { theme: 'well', song: 'well', rooms: 6, slime: 'pink', boss: 'nmoth', bossName: 'NIGHT MOTH',
  pool: [['gmoth', 3], ['wisp', 3], ['spider', 2], ['bat', 2], ['gemlet', 1], ['slime', 1]] };
const BIG_STARS = ['king', 'bcrab', 'golem', 'queen', 'octo', 'cmoth', 'secret'];
const wellOpen = () => !G.daily && G.mode === 'adv' && !NET.role && BIG_STARS.every(s => Save.story.stars.includes(s));
// A boss beaten for the first time gives its Big Star back to the sky.
onNote((ev, a) => {
  if (ev !== 'boss' && ev !== 'bigstar') return;
  if (!BIG_STARS.includes(a) || Save.story.stars.includes(a)) return;
  Save.story.stars.push(a);
  const n = Save.story.stars.length;
  G.bannerNext = { title: 'A BIG STAR RETURNS TO THE SKY!', sub: n + ' OF 7' + (n === 7 ? ': THE STAR WELL IS OPEN!' : ''), t: 3, icon: null };
  logNews('star', 'BIG STAR ' + n + '/7', 'icon_big');
  Save.write();
  checkStars(true);
});

// ---------- Boss behaviour ----------
function hover(e, tx, ty, sp, dt, room) {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
  if (d > 2) { e.vx += (dx / d * sp - e.vx) * 3 * dt; e.vy += (dy / d * sp - e.vy) * 3 * dt; }
  else { e.vx *= 0.9; e.vy *= 0.9; }
  moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
}
Object.assign(AI, {
  // Queen Bee: floats, sprays honey, calls her bees, dashes across leaving honey drops.
  queen(e, dt, room, p) {
    e.t -= dt;
    if (e.hp < e.maxHp * 0.5) bossPhase2(e);
    e.z = 10 + Math.sin(e.anim * 3) * 2;
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'float'; e.t = 2.4; e.n = 0; } break;
      case 'float':
        e.a = (e.a || 0) + dt * 0.8;
        hover(e, 192 + Math.cos(e.a) * 110, 96 + Math.sin(e.a * 2) * 22, 60, dt, room);
        e.flip = p.x < e.x;
        if ((e.n += dt) > (e.p2 ? 0.8 : 1.1)) { e.n = 0; fan(e.x, e.y - 12, aimAt(e.x, e.y - 12), 5, 0.2, 70, 'orange', true); Audio_.sfx('eshoot'); }
        if (e.t <= 0) {
          const r = grand();
          e.state = e.p2 && r < 0.3 ? 'hive' : r < 0.55 ? 'summon' : 'aim';
          e.t = e.state === 'hive' ? 2 : e.state === 'summon' ? 0.6 : 0.6; e.n = 0;
          Audio_.sfx('charge');
        }
        break;
      case 'summon':
        if (e.t <= 0) {
          const bees = G.enemies.filter(o => o.type === 'bee' && !o.dead).length;
          if (!e.gentle) for (let i = 0; i < 2 && bees + i < 4; i++) spawnEnemy('bee', e.x + (i ? 20 : -20), e.y + 6);
          e.state = 'float'; e.t = 2.2;
        }
        break;
      case 'aim':
        e.vx *= 0.9; e.vy *= 0.9; e.flip = p.x < e.x;
        if (e.t <= 0) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.vx = Math.cos(a) * 210; e.vy = Math.sin(a) * 210; e.state = 'dash'; e.t = 0.9; e.n = 0; Audio_.sfx('swish'); }
        break;
      case 'dash':
        if ((e.n += dt) > 0.07) { e.n = 0; const b = ebullet(e.x, e.y - 4, 0, 0, 'orange'); b.life = 2.5; }
        if (moveBox(room, e, e.vx * dt, e.vy * dt, 'fly') || e.t <= 0) { e.state = 'float'; e.t = 2.2; G.shake = Math.max(G.shake, 2); }
        break;
      case 'hive':
        e.vx *= 0.9; e.vy *= 0.9;
        if ((e.n += dt) > 0.11) { e.n = 0; const b = e.t * 2.4; for (let i = 0; i < 4; i++) ebullet(e.x, e.y - 12, b + i * Math.PI / 2, 66, 'orange'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) { e.state = 'float'; e.t = 2; }
        break;
    }
  },
  // Pearl Octopus: ink blobs, tentacle rings around itself, sinks and resurfaces; later a pearl beam.
  octo(e, dt, room, p) {
    e.t -= dt;
    if (e.hp < e.maxHp * 0.5) bossPhase2(e);
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'idle'; e.t = 1; } break;
      case 'idle':
        e.flip = p.x < e.x;
        if (e.t <= 0) {
          const r = grand();
          e.state = e.p2 && r < 0.3 ? 'beam' : r < 0.45 ? 'ink' : r < 0.75 ? 'arms' : 'sink';
          e.t = e.state === 'beam' ? 2 : e.state === 'sink' ? 0.5 : 0.5; e.n = 0; e.w = 0;
          Audio_.sfx('charge');
        }
        break;
      case 'ink':
        if (e.t <= 0) {
          fan(e.x, e.y - 12, aimAt(e.x, e.y - 12), 5, 0.3, 52, 'purple', true);
          Audio_.sfx('eshoot');
          if (++e.w >= 3) { e.state = 'idle'; e.t = 1.2; } else e.t = 0.5;
        }
        break;
      case 'arms':
        if (e.t <= 0) {
          const k = e.w;
          for (const [dx, dy] of [[-40, -8], [40, -8], [-26, 18], [26, 18]]) ring(e.x + dx, e.y + dy - 6, 6, 58, 'cyan', k * 0.4);
          Audio_.sfx('eshoot'); G.shake = Math.max(G.shake, 1.5);
          if (++e.w >= 3) { e.state = 'idle'; e.t = 1.3; } else e.t = 0.7;
        }
        break;
      case 'sink':
        if (e.t <= 0 && !e.ghost) {
          e.ghost = true; e.t = 1.2; dust(e.x, e.y, 14, 30); Audio_.sfx('bubble');
          e.tx = grnd(80, 304); e.ty = grnd(80, 150);
        } else if (e.ghost) {
          e.x += (e.tx - e.x) * Math.min(1, dt * 3); e.y += (e.ty - e.y) * Math.min(1, dt * 3);
          if (Math.random() < 0.4) part(e.x + rnd(-12, 12), e.y - rnd(0, 4), 0, -12, 0.5, 'C', { drag: 1 });
          if (e.t <= 0) {
            e.ghost = false; unstick(room, e, 'enemy');
            ring(e.x, e.y - 8, 14, 62, 'cyan', grand());
            G.shake = 5; Audio_.sfx('boom'); dust(e.x, e.y, 14, 30);
            e.state = 'idle'; e.t = 1.1;
          }
        }
        break;
      case 'beam':
        // a stream of pearls that sweeps across the room
        if ((e.n += dt) > 0.05) { e.n = 0; const a = aimAt(e.x, e.y - 8) + Math.sin(e.t * 2.2) * 1.1; ebullet(e.x, e.y - 8, a, 95, 'cyan'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) { e.state = 'idle'; e.t = 1.3; }
        break;
    }
  },
  // Crystal Moth: flutters in loops, flaps fans out of both wings, sheds glowing dust.
  cmoth(e, dt, room, p) {
    e.t -= dt;
    if (e.hp < e.maxHp * 0.5) bossPhase2(e);
    e.z = 12 + Math.sin(e.anim * 4) * 3;
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'flutter'; e.t = 2.5; e.n = 0; } break;
      case 'flutter':
        e.a = (e.a || 0) + dt * 1.1;
        hover(e, 192 + Math.sin(e.a) * 120, 100 + Math.sin(e.a * 2) * 30, 70, dt, room);
        if ((e.n += dt) > 1.2) {
          e.n = 0;
          for (const s of [-1, 1]) fan(e.x + s * 12, e.y - 10, Math.PI / 2 + s * 0.9, 4, 0.22, 70, 'purple');
          Audio_.sfx('swish');
        }
        if (e.t <= 0) { e.state = e.p2 && grand() < 0.45 ? 'shatter' : 'dust'; e.t = e.state === 'dust' ? 1.6 : 0.6; e.n = 0; Audio_.sfx('charge'); }
        break;
      case 'dust':
        e.vx *= 0.92; e.vy *= 0.92;
        if ((e.n += dt) > 0.12) { e.n = 0; const b = ebullet(e.x + grnd(-16, 16), e.y - 8, Math.PI / 2 + grnd(-0.5, 0.5), grnd(18, 34), 'purple'); b.life = 4; }
        if (e.t <= 0) { e.state = 'flutter'; e.t = 2.4; }
        break;
      case 'shatter':
        if (e.t <= 0) {
          ring(e.x, e.y - 10, 16, 66, 'cyan', grand());
          for (let i = 0; i < 5; i++) G.markers.push({ x: i ? grnd(40, VW - 40) : p.x, y: i ? grnd(60, 190) : p.y, t: 0.9 + i * 0.1, max: 0.9 + i * 0.1, src: e.type });
          Audio_.sfx('boom'); G.shake = 4;
          e.state = 'flutter'; e.t = 2.4;
        }
        break;
    }
  },
  // The Night Moth: three moods. Below 60% it swallows the light; below 25% it calls its moths.
  nmoth(e, dt, room, p) {
    e.t -= dt;
    const k = e.hp / e.maxHp;
    if (k < 0.6 && !e.dark) { e.dark = true; G.banner = { title: 'THE NIGHT MOTH EATS THE LIGHT!', sub: 'STAY CLOSE TO YOUR OWN GLOW', t: 2.4, icon: null }; Audio_.sfx('roar'); G.flashT = 0.1; }
    if (k < 0.25) bossPhase2(e);
    e.z = 14 + Math.sin(e.anim * 3) * 3;
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'drift'; e.t = 2; e.n = 0; } break;
      case 'drift':
        e.a = (e.a || 0) + dt * 0.7;
        hover(e, 192 + Math.sin(e.a) * 100, 96 + Math.cos(e.a * 1.5) * 24, 55, dt, room);
        if ((e.n += dt) > (e.p2 ? 0.7 : 1)) { e.n = 0; fan(e.x, e.y - 12, aimAt(e.x, e.y - 12), e.p2 ? 7 : 5, 0.18, 74, 'purple'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) {
          const r = grand();
          e.state = r < 0.35 ? 'spiral' : r < 0.65 ? 'stars' : e.p2 ? 'call' : 'spiral';
          e.t = e.state === 'spiral' ? 2.2 : e.state === 'stars' ? 0.6 : 0.8; e.n = 0; e.w = 0;
          Audio_.sfx('charge');
        }
        break;
      case 'spiral':
        e.vx *= 0.9; e.vy *= 0.9;
        if ((e.n += dt) > 0.1) { e.n = 0; const arms = e.p2 ? 5 : 4, b = e.t * (e.w % 2 ? -2 : 2.2); for (let i = 0; i < arms; i++) ebullet(e.x, e.y - 14, b + i * Math.PI * 2 / arms, 62, i % 2 ? 'purple' : 'pink'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) { e.state = 'drift'; e.t = 2; }
        break;
      case 'stars':
        // stolen stars fall back down on the heroes
        if (e.t <= 0) {
          for (let i = 0; i < (e.p2 ? 8 : 6); i++) G.markers.push({ x: i ? grnd(40, VW - 40) : p.x, y: i ? grnd(60, 190) : p.y, t: 0.9 + i * 0.09, max: 0.9 + i * 0.09, src: e.type });
          Audio_.sfx('boom');
          e.state = 'drift'; e.t = 2.2;
        }
        break;
      case 'call':
        if (e.t <= 0) {
          const n = G.enemies.filter(o => o.type === 'gmoth' && !o.dead).length;
          for (let i = 0; i < 2 && n + i < 3; i++) spawnEnemy('gmoth', e.x + (i ? 30 : -30), e.y + 10);
          e.state = 'drift'; e.t = 2.2;
        }
        break;
    }
  },
});
// Its darkness: the night overlay while the Night Moth is in its later moods.
const bossDark = () => !!(G.boss && G.boss.dark && !G.boss.dead);

// Their pages in the book.
BEASTS.push(
  { t: 'queen', spr: 'queen_0', boss: true, lore: ['THE QUEEN BEE RULES THE MEADOW HIVES.', 'SHE LEAVES DROPS OF HONEY WHERE SHE DASHES.', 'HER CROWN IS A BIG STAR, BENT TO FIT.'] },
  { t: 'octo', spr: 'octo_0', boss: true, lore: ['THE PEARL OCTOPUS GUARDS THE DEEP SHORE.', 'WHEN IT SINKS, IT COMES UP SOMEWHERE ELSE.', 'ITS PEARL IS REALLY A BIG STAR.'] },
  { t: 'cmoth', spr: 'cmoth_0', boss: true, lore: ['THE CRYSTAL MOTH LIVES DEEP IN THE CAVE.', 'ITS WINGS SHED GLOWING DUST.', 'IT CARRIES A BIG STAR FOR THE NIGHT MOTH.'] },
  { t: 'nmoth', spr: 'nmoth_0', boss: true, lore: ['THE NIGHT MOTH ATE THE STARLIGHT.', 'IN ITS DARK, ONLY YOUR OWN GLOW IS SAFE.', 'IT WAS ONCE A LITTLE MOTH THAT FEARED THE DARK.'] },
);
