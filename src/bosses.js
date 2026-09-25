'use strict';
// The alternate boss of every land (Queen Bee, Pearl Octopus, Crystal Moth), the Night
// Moth in the Star Well, and the story around them: every boss wears one of the Big Stars
// the Night Moth stole. Seven of them open the Star Well after the third land.

Object.assign(EDEF, {
  queen: { hp: 440, r: 13, h: 22, hw: 12, hh: 7, sw: 30, boss: true, intro: 'GUARDS THE HIVE', fly: true, colors: ['y', 'Y', 'o'], sprite: (e) => bossFrame(e, { aim: 'tell', dash: 'move', hive: 'atk', summon: 'atk' }[e.state] || bob(e, 14, 1, 0)),
    glint: (e) => (e.state === 'aim' || (e.state === 'float' && e.n > (e.p2 ? 0.8 : 1.1) - 0.45) ? [e.flip ? -12 : 12, -12] : null) },
  octo: { hp: 720, r: 14, h: 22, hw: 13, hh: 7, sw: 32, boss: true, intro: 'INKS THE TIDE', colors: ['P', 'q', 'p'], sprite: (e) => bossFrame(e, { ink: e.w ? 'atk' : 'tell', arms: e.w ? 'atk' : 'tell', sink: e.ghost ? 'move' : 'tell', beam: 'atk' }[e.state] || bob(e, 3, 1, 0)),
    glint: (e) => (e.state === 'beam' && e.t > 2 ? [0, -6] : null) },
  cmoth: { hp: 380, r: 13, h: 20, hw: 12, hh: 7, sw: 34, boss: true, intro: 'SHATTERS THE LIGHT', fly: true, colors: ['3', '4', 'C'], sprite: (e) => bossFrame(e, { shatter: 'tell', dust: 'atk' }[e.state] || bob(e, 8, 1, 0)),
    glint: (e) => (e.state === 'flutter' && e.n > 0.75 ? [0, -10] : null) },
  nmoth: { hp: 240, r: 16, h: 26, hw: 14, hh: 8, sw: 42, boss: true, intro: 'STOLE THE STARS', phases: [0.6, 0.25], fly: true, colors: ['2', '3', 'Y'], sprite: (e) => bossFrame(e, { stars: 'tell', call: 'tell', spiral: 'atk' }[e.state] || bob(e, 6, 1, 0)),
    glint: (e) => (e.state === 'drift' && e.n > (e.p2 ? 0.7 : 1) - 0.45 ? [0, -12] : null) },
  mayor: { hp: 460, r: 13, h: 24, hw: 12, hh: 7, sw: 34, boss: true, intro: 'DIGS IN', phases: [0.66, 0.33], colors: ['N', 'n', 'p'],
    sprite: (e) => e.ghost ? S(mayorSet(e) + '_mound') : bossFrame(e, { dig: 'tell', grab: 'tell', sink: 'tell', hills: 'atk', walk: bob(e, 4, 'move', 0) }[e.state] || bob(e, 2, 1, 0), mayorSet(e)),
    glint: (e) => (e.state === 'walk' && e.n > mayorGap(e) - 0.45 ? [0, -26] : null) },
  turtle: { hp: 520, r: 14, h: 22, hw: 14, hh: 7, sw: 38, boss: true, intro: 'RIDES THE TIDE', phases: [0.66, 0.33], colors: ['R', 'T', 'o'],
    sprite: (e) => (e.state === 'spin' || e.state === 'bank' ? S('turtle_shell_' + (Math.floor(e.anim * 10) % 2)) : bossFrame(e, { tuck: 'tell', horn: 'tell', swirl: 'atk', walk: bob(e, 3, 'move', 0) }[e.state] || bob(e, 2, 1, 0))),
    glint: (e) => (e.state === 'walk' && e.n > turtleGap(e) - 0.45 ? [0, -22] : null) },
  hill: { hp: 10, r: 7, h: 11, hw: 7, hh: 4, sw: 18, still: true, colors: ['N', 'n', 'h'], sprite: (e) => S(e.state === 'aim' ? 'mhill_1' : 'mhill_0'),
    glint: (e) => (e.state === 'aim' ? [0, -10] : null) },
});
Object.assign(FOE_NAMES, { queen: 'QUEEN BEE', octo: 'PEARL OCTOPUS', cmoth: 'CRYSTAL MOTH', nmoth: 'NIGHT MOTH', mayor: 'MOLE MAYOR', hill: 'MOLEHILL', turtle: 'TIDE TURTLE' });
LANDS[0].alt = ['queen', 'mayor']; LANDS[1].alt = ['octo', 'turtle']; LANDS[2].alt = 'cmoth';
const bossName = (t) => foeName(t);
// The boss of the current room (for the health bar and the entrance).
const curBossName = () => bossName(G.boss ? G.boss.type : G.floor.boss || G.floor.land.boss);

// ---------- Which boss waits at the end of a land ----------
// The alternate bosses only turn up once the land's first boss has been beaten.
function chooseBoss(floor) {
  const L = floor.land;
  if (G.run.bow && L === LANDS[G.run.bow.land]) return G.run.bow.boss;
  if (!L.alt) return L.boss;
  return withSeed(hashSeed(G.run.seed, 'boss', floor.depth), () => {
    const known = G.daily || cnt('b:' + L.boss) > 0 || Save.stats.bestDepth > (floor.depth % LANDS.length) + 1;
    return known ? gpick([L.boss].concat(L.alt)) : L.boss;
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
    if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
    e.z = 10 + Math.sin(e.anim * 3) * 2;
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'float'; e.t = 2.4; e.n = 0; } break;
      case 'float':
        e.a = (e.a || 0) + dt * 0.8;
        hover(e, 192 + Math.cos(e.a) * 110, 96 + Math.sin(e.a * 2) * 22, 60, dt, room);
        e.flip = p.x < e.x;
        if ((e.n += dt) > (e.p2 ? 0.8 : 1.1)) { e.n = 0; fan(e.x, e.y - 12, aimAt(e.x, e.y - 12), 5, 0.2, 70, 'honey', true); Audio_.sfx('eshoot'); }
        if (e.t <= 0) {
          const r = grand();
          e.state = e.p2 && r < 0.3 ? 'hive' : r < 0.55 ? 'summon' : 'aim';
          e.t = e.state === 'hive' ? 2 : e.state === 'summon' ? 0.6 : 0.6; e.n = 0;
          Audio_.sfx('charge');
          if (e.state === 'aim') { e.vx = e.vy = 0; lane(e, p); }
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
        e.flip = Math.cos(e.la) < 0;
        if (e.t <= 0) { e.vx = Math.cos(e.la) * 210; e.vy = Math.sin(e.la) * 210; e.state = 'dash'; e.t = 0.9; e.n = 0; Audio_.sfx('swish'); }
        break;
      case 'dash':
        if ((e.n += dt) > 0.07) { e.n = 0; const b = ebullet(e.x, e.y - 4, 0, 0, 'honey'); b.life = 2.5; }
        if (moveBox(room, e, e.vx * dt, e.vy * dt, 'fly') || e.t <= 0) { e.state = 'float'; e.t = 2.2; G.shake = Math.max(G.shake, 2); stagger(e); }
        break;
      case 'hive':
        e.vx *= 0.9; e.vy *= 0.9;
        if ((e.n += dt) > 0.11) { e.n = 0; const b = e.t * 2.4; for (let i = 0; i < 4; i++) ebullet(e.x, e.y - 12, b + i * Math.PI / 2, 66, 'honey'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) { e.state = 'float'; e.t = 2; }
        break;
    }
  },
  // Pearl Octopus: ink blobs, tentacle rings around itself, sinks and resurfaces; later a pearl beam.
  octo(e, dt, room, p) {
    e.t -= dt;
    if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'idle'; e.t = 1; } break;
      case 'idle':
        e.flip = p.x < e.x;
        if (e.t <= 0) {
          const r = grand();
          e.state = e.p2 && r < 0.3 ? 'beam' : r < 0.45 ? 'ink' : r < 0.75 ? 'arms' : 'sink';
          e.t = e.state === 'beam' ? 2.5 : e.state === 'sink' ? 0.5 : 0.5; e.n = 0; e.w = 0;
          Audio_.sfx('charge');
        }
        break;
      case 'ink':
        if (e.t <= 0) {
          fan(e.x, e.y - 12, aimAt(e.x, e.y - 12), 5, 0.3, 52, 'ink', true);
          Audio_.sfx('eshoot');
          if (++e.w >= 3) { e.state = 'idle'; e.t = 1.2; } else e.t = 0.5;
        }
        break;
      case 'arms':
        if (e.t <= 0) {
          const k = e.w;
          for (const [dx, dy] of [[-40, -8], [40, -8], [-26, 18], [26, 18]]) ring(e.x + dx, e.y + dy - 6, 6, 58, 'pearl', k * 0.4);
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
            ring(e.x, e.y - 8, 14, 62, 'pearl', grand());
            G.shake = 5; Audio_.sfx('boom'); dust(e.x, e.y, 14, 30);
            e.state = 'idle'; e.t = 1.1; stagger(e);
          }
        }
        break;
      case 'beam':
        // a stream of pearls that sweeps across the room
        if (e.t < 2 && (e.n += dt) > 0.05) { e.n = 0; const a = aimAt(e.x, e.y - 8) + Math.sin(e.t * 2.2) * 1.1; ebullet(e.x, e.y - 8, a, 95, 'pearl'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) { e.state = 'idle'; e.t = 1.3; }
        break;
    }
  },
  // Crystal Moth: flutters in loops, flaps fans out of both wings, sheds glowing dust.
  cmoth(e, dt, room, p) {
    e.t -= dt;
    if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
    e.z = 12 + Math.sin(e.anim * 4) * 3;
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'flutter'; e.t = 2.5; e.n = 0; } break;
      case 'flutter':
        e.a = (e.a || 0) + dt * 1.1;
        hover(e, 192 + Math.sin(e.a) * 120, 100 + Math.sin(e.a * 2) * 30, 70, dt, room);
        if ((e.n += dt) > 1.2) {
          e.n = 0;
          for (const s of [-1, 1]) fan(e.x + s * 12, e.y - 10, Math.PI / 2 + s * 0.9, 4, 0.22, 70, 'dust');
          Audio_.sfx('swish');
        }
        if (e.t <= 0) { e.state = e.p2 && grand() < 0.45 ? 'shatter' : 'dust'; e.t = e.state === 'dust' ? 1.6 : 0.6; e.n = 0; Audio_.sfx('charge'); }
        break;
      case 'dust':
        e.vx *= 0.92; e.vy *= 0.92;
        if ((e.n += dt) > 0.12) { e.n = 0; const b = ebullet(e.x + grnd(-16, 16), e.y - 8, Math.PI / 2 + grnd(-0.5, 0.5), grnd(18, 34), 'dust'); b.life = 4; }
        if (e.t <= 0) { e.state = 'flutter'; e.t = 2.4; }
        break;
      case 'shatter':
        if (e.t <= 0) {
          ring(e.x, e.y - 10, 16, 66, 'dust', grand());
          for (let i = 0; i < 5; i++) G.markers.push({ x: i ? grnd(40, VW - 40) : p.x, y: i ? grnd(60, 190) : p.y, t: 0.9 + i * 0.1, max: 0.9 + i * 0.1, src: e.type });
          Audio_.sfx('boom'); G.shake = 4;
          e.state = 'flutter'; e.t = 2.4; stagger(e);
        }
        break;
    }
  },
  // The Night Moth: three moods. Below 60% it swallows the light; below 25% it calls its moths.
  nmoth(e, dt, room, p) {
    e.t -= dt;
    const k = e.hp / e.maxHp;
    if (k < 0.6 && !e.dark) { e.dark = true; G.banner = { title: 'THE NIGHT MOTH EATS THE LIGHT!', sub: 'STAY CLOSE TO YOUR OWN GLOW', t: 2.4, icon: null }; Audio_.sfx('roar'); G.flashT = 0.1; }
    if (k < 0.25) bossPhase(e, 2);
    e.z = 14 + Math.sin(e.anim * 3) * 3;
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'drift'; e.t = 2; e.n = 0; } break;
      case 'drift':
        e.a = (e.a || 0) + dt * 0.7;
        hover(e, 192 + Math.sin(e.a) * 100, 96 + Math.cos(e.a * 1.5) * 24, 55, dt, room);
        if ((e.n += dt) > (e.p2 ? 0.7 : 1)) { e.n = 0; fan(e.x, e.y - 12, aimAt(e.x, e.y - 12), e.p2 ? 7 : 5, 0.18, 74, 'nstar'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) {
          const r = grand();
          e.state = r < 0.35 ? 'spiral' : r < 0.65 ? 'stars' : e.p2 ? 'call' : 'spiral';
          e.t = e.state === 'spiral' ? 2.2 : e.state === 'stars' ? 0.6 : 0.8; e.n = 0; e.w = 0;
          Audio_.sfx('charge');
        }
        break;
      case 'spiral':
        e.vx *= 0.9; e.vy *= 0.9;
        if ((e.n += dt) > 0.1) { e.n = 0; const arms = e.p2 ? 5 : 4, b = e.t * (e.w % 2 ? -2 : 2.2); for (let i = 0; i < arms; i++) ebullet(e.x, e.y - 14, b + i * Math.PI * 2 / arms, 62, 'nstar'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) { e.state = 'drift'; e.t = 2; stagger(e); }
        break;
      case 'stars':
        // stolen stars fall back down on the heroes
        if (e.t <= 0) {
          for (let i = 0; i < (e.p2 ? 8 : 6); i++) G.markers.push({ x: i ? grnd(40, VW - 40) : p.x, y: i ? grnd(60, 190) : p.y, t: 0.9 + i * 0.09, max: 0.9 + i * 0.09, src: e.type });
          Audio_.sfx('boom');
          e.state = 'drift'; e.t = 2.2; stagger(e);
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
  // Mole Mayor: waddles and flicks clods, burrows after you and bursts out, throws the arena's
  // rocks; molehills from phase 2; sinkholes and a chain of bursts in phase 3.
  mayor(e, dt, room, p) {
    e.t -= dt;
    if (e.hp < e.maxHp * 0.66) bossPhase(e, 2);
    if (e.hp < e.maxHp * 0.33) bossPhase(e, 3);
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'walk'; e.t = 1.4; e.n = 0; } break;
      case 'walk':
        if (Math.hypot(p.x - e.x, p.y - e.y) > 70) { const v = towardPlayer(e); moveBox(room, e, v.x * 30 * dt, v.y * 30 * dt, 'enemy'); }
        e.flip = p.x < e.x;
        if ((e.n += dt) > mayorGap(e)) { e.n = 0; fan(e.x, e.y - 14, aimAt(e.x, e.y - 14), 3, 0.3, 70, 'clod'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) {
          const r = grand();
          e.state = e.phase > 1 && !e.hills ? 'hills' : e.phase > 2 && (!e.sank || r < 0.35) ? 'sink' : r < 0.6 ? 'dig' : 'grab';
          e.t = { hills: 0.7, sink: 1, dig: 0.45, grab: 0.6 }[e.state]; e.n = 0;
          Audio_.sfx('charge');
          if (e.state === 'sink') { e.sank = sinkTiles(room, p); for (const [c, r] of e.sank) G.markers.push({ kind: 'zone', x: c * 16 + 8, y: OY + r * 16 + 10, t: 1, max: 1 }); }
          if (e.state === 'grab') {
            // lifts one of the arena's rocks (cover!) and throws it at every hero
            const rocks = []; for (let i = 0; i < room.tiles.length; i++) if (room.tiles[i] === T_ROCK) rocks.push(i);
            const i = rocks.length ? gpick(rocks) : -1;
            if (i >= 0) { const c = i % COLS, rr = (i / COLS) | 0; setTile(room, c, rr, T_FLOOR); poof(c * 16 + 8, OY + rr * 16 + 8); dust(c * 16 + 8, OY + rr * 16 + 12, 10, 16); }
            for (const q of G.players) if (alive(q)) G.markers.push({ x: q.x, y: q.y, t: 1.1, max: 1.1, src: 'mayor', fall: 'rock_meadow' });
          }
        }
        break;
      case 'grab': if (e.t <= 0) { e.state = 'walk'; e.t = 1.6; e.n = 0; } break;
      case 'hills':
        if (e.t <= 0) {
          // three molehills, as far from the heroes as the arena allows
          const far = (s) => Math.min(...G.players.map(q => Math.hypot(q.x - s[0], q.y - s[1])));
          const spots = [[72, 72], [312, 72], [72, 168], [312, 168], [192, 60], [192, 176]].sort((a, b) => far(b) - far(a));
          spots.slice(0, 3).forEach((s, i) => { spawnEnemy('hill', s[0], s[1]).k = i; });
          e.hills = 1; Audio_.sfx('brk'); G.shake = Math.max(G.shake, 2);
          e.state = 'walk'; e.t = 1.6;
        }
        break;
      case 'sink':
        if (e.t <= 0) {
          for (const [c, r] of e.sank) if (pitOk(room, c, r)) { setTile(room, c, r, T_PIT); (room.sunk = room.sunk || []).push([c, r]); dust(c * 16 + 8, OY + r * 16 + 12, 8, 14); }
          Audio_.sfx('brk'); G.shake = Math.max(G.shake, 3);
          e.state = 'dig'; e.t = 0.45; // then the chain of bursts
        }
        break;
      case 'dig':
        if (Math.random() < 0.5) dust(e.x, e.y, 1, 16);
        if (e.t <= 0) { e.ghost = true; e.state = 'under'; e.t = 1.2; e.tr = []; e.n = 0; dust(e.x, e.y, 10, 20); Audio_.sfx('brk'); }
        break;
      case 'under': {
        const v = towardPlayer(e);
        moveBox(room, e, v.x * 62 * dt, v.y * 62 * dt, 'enemy');
        if (Math.random() < 0.4) dust(e.x, e.y, 1, 14);
        if ((e.n += dt) > 0.25) { e.n = 0; e.tr.push([e.x, e.y]); }
        if (e.t <= 0) {
          const k = e.phase > 2 ? 1 : 0.55, tr = e.tr;
          e.state = 'rise'; e.t = k;
          G.markers.push({ x: e.x, y: e.y, t: k, max: k, src: 'mayor', fall: '', n: 8 });
          if (k > 0.6) for (const [j, t] of [[4, 0.5], [2, 0.75]]) if (tr.length >= j) G.markers.push({ x: tr[tr.length - j][0], y: tr[tr.length - j][1], t, max: t, src: 'mayor', fall: '', n: 6 });
          Audio_.sfx('charge');
        }
        break;
      }
      case 'rise':
        if (e.t <= 0) {
          e.ghost = false; unstick(room, e, 'enemy');
          dust(e.x, e.y, 14, 24); G.shake = Math.max(G.shake, 3);
          stagger(e); e.state = 'walk'; e.t = 1.6; e.n = 0;
        }
        break;
    }
  },
  // Tide Turtle: paddles and puffs foam; tucks in and spins wall to wall, three legs, each
  // one aimed anew, then lies dazed on her back; from phase 2 a tide sweeps the arena (a gap
  // and the rocks' shade are safe), in phase 3 from both sides at once, then a foam spiral.
  turtle(e, dt, room, p) {
    e.t -= dt; e.tide -= dt;
    if (e.hp < e.maxHp * 0.66) bossPhase(e, 2);
    if (e.hp < e.maxHp * 0.33) bossPhase(e, 3);
    switch (e.state) {
      case 'intro': if (e.t <= 0) { e.state = 'walk'; e.t = 2; e.n = 0; e.tide = 0; } break;
      case 'walk': {
        const d = Math.hypot(p.x - e.x, p.y - e.y), v = towardPlayer(e), sp = d > 110 ? 22 : d < 70 ? -22 : 0;
        moveBox(room, e, v.x * sp * dt, v.y * sp * dt, 'enemy');
        e.flip = p.x < e.x;
        if ((e.n += dt) > turtleGap(e)) { e.n = 0; fan(e.x, e.y - 12, aimAt(e.x, e.y - 12), e.phase > 1 ? 5 : 3, 0.3, 62, 'foam'); Audio_.sfx('bubble'); }
        if (e.t <= 0) {
          e.n = 0;
          if (e.phase > 1 && e.tide <= 0) {
            e.state = 'horn'; e.t = 1.2; e.tide = 10 + grand() * 2; Audio_.sfx('horn');
            e.gy = Math.max(52, Math.min(184, p.y - 7 + (grand() - 0.5) * 60)); e.side = grand() < 0.5 ? 0 : 1;
            for (const s of turtleSides(e)) G.markers.push({ kind: 'tide', x: s ? VW - 18 : 18, y: e.gy, t: 1.2, max: 1.2 });
          } else { e.state = 'tuck'; e.t = 0.7; e.w = 0; lane(e, p); Audio_.sfx('charge'); }
        }
        break;
      }
      case 'tuck': if (e.t <= 0) { e.state = 'spin'; e.t = 2.5; } break;
      case 'spin': {
        if (Math.random() < 0.6) part(e.x + rnd(-14, 14), e.y - 1, 0, -8, 0.5, Math.random() < 0.5 ? 'w' : 'C', { size: 2 });
        const sp = e.phase > 2 ? 170 : 150;
        if (moveBox(room, e, Math.cos(e.la) * sp * dt, Math.sin(e.la) * sp * dt, 'enemy') || e.t <= 0) {
          G.shake = Math.max(G.shake, 4); Audio_.sfx('boom'); dust(e.x, e.y, 10, 26);
          if (++e.w >= 3) { ring(e.x, e.y - 10, 10, 60, 'foam', grand()); hapticAll('slam'); e.state = 'stun'; e.t = 0.2; stagger(e); }
          else { e.state = 'bank'; e.t = 0.5; lane(e, nearestHero(e.x, e.y)); }
        }
        break;
      }
      case 'bank': if (e.t <= 0) { e.state = 'spin'; e.t = 2.5; } break;
      case 'stun': if (e.t <= 0) { e.state = 'walk'; e.t = 2.2; e.n = 0; } break;
      case 'horn':
        if (e.t <= 0) {
          for (const s of turtleSides(e)) for (let y = 36; y <= 190; y += 10) if (Math.abs(y - e.gy) > 14) ebullet(s ? VW - 18 : 18, y, s ? Math.PI : 0, 70, 'foam');
          Audio_.sfx('bubble'); G.shake = Math.max(G.shake, 2);
          e.state = e.phase > 2 ? 'swirl' : 'walk'; e.t = e.phase > 2 ? 5 : 2.2; e.n = 0;
        }
        break;
      case 'swirl':
        // the riptide passes the middle first, then a slow two-armed spiral
        if (e.t < 2.4 && (e.n += dt) > 0.12) { e.n = 0; for (let i = 0; i < 2; i++) ebullet(e.x, e.y - 10, e.t * 2.4 + i * Math.PI, 58, 'foam'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) { e.state = 'walk'; e.t = 2; e.n = 0; }
        break;
    }
  },
  // A molehill: in turn, lobs a clod at a hero; the ring shows where it lands.
  hill(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'wait'; e.t = 1 + (e.k || 0); }
    else if (e.state === 'wait' && e.t <= 0) { e.state = 'aim'; e.t = 0.5; }
    else if (e.state === 'aim' && e.t <= 0) {
      G.markers.push({ x: p.x, y: p.y, t: 1, max: 1, src: 'mayor', fall: 'ebb_clod', n: 3 });
      Audio_.sfx('eshoot'); dust(e.x, e.y - 6, 4, 8);
      e.state = 'wait'; e.t = 2.5;
    }
  },
});
const mayorSet = (e) => (e.phase > 2 ? 'mayor3' : 'mayor');
const turtleGap = (e) => (e.phase > 1 ? 1.7 : 1.3);
const turtleSides = (e) => (e.phase > 2 ? [0, 1] : [e.side]);
const mayorGap = (e) => (e.phase > 1 ? 1.8 : 1.4);
// A floor tile can sink if nobody stands on it, it keeps clear of the doors and the rest of
// the floor stays in one piece.
function pitOk(room, c, r) {
  if (tileAt(room, c, r) !== T_FLOOR || c < 3 || c > 20 || r < 3 || r > 10 || (room.sunk || []).length >= 12) return false;
  const x = c * 16 + 8, y = OY + r * 16 + 8;
  for (const o of G.players.concat(G.enemies)) if (!o.dead && Math.abs(o.x - x) < 10 + o.hw && Math.abs(o.y - y) < 10 + o.hh) return false;
  const t = room.tiles, seen = new Uint8Array(t.length), q = [];
  t[r * COLS + c] = T_PIT;
  let floor = 0;
  for (let i = 0; i < t.length; i++) if (t[i] === T_FLOOR) { floor++; if (!q.length) { q.push(i); seen[i] = 1; } }
  for (let h = 0; h < q.length; h++) for (const d of [1, -1, COLS, -COLS]) { const j = q[h] + d; if (t[j] === T_FLOOR && !seen[j]) { seen[j] = 1; q.push(j); } }
  t[r * COLS + c] = T_FLOOR;
  return q.length === floor;
}
// Four floor tiles near the hero, marked a second before they sink.
function sinkTiles(room, p) {
  const all = [];
  for (let r = 3; r <= 10; r++) for (let c = 3; c <= 20; c++) if (pitOk(room, c, r)) all.push([c, r]);
  const near = all.filter(([c, r]) => Math.hypot(c * 16 + 8 - p.x, OY + r * 16 + 8 - p.y) < 96);
  const pool = near.length >= 4 ? near : all, out = [];
  while (out.length < 4 && pool.length) out.push(pool.splice(Math.floor(grand() * pool.length), 1)[0]);
  return out;
}
// The Mayor's sinkholes fill back in once he is beaten.
onNote((ev, a) => {
  if (ev !== 'boss' || a !== 'mayor' || NET.role === 'client' || !G.room || !G.room.sunk) return;
  for (const [c, r] of G.room.sunk) { setTile(G.room, c, r, T_FLOOR); dust(c * 16 + 8, OY + r * 16 + 12, 6, 14); }
  G.room.sunk = null;
});
// Its darkness: the night overlay while the Night Moth is in its later moods.
const bossDark = () => !!(G.boss && G.boss.dark && !G.boss.dead);

// Their pages in the book.
BEASTS.push(
  { t: 'queen', spr: 'queen_0', boss: true, lore: ['THE QUEEN BEE RULES THE MEADOW HIVES.', 'SHE LEAVES DROPS OF HONEY WHERE SHE DASHES.', 'HER CROWN IS A BIG STAR, BENT TO FIT.'] },
  { t: 'octo', spr: 'octo_0', boss: true, lore: ['THE PEARL OCTOPUS GUARDS THE DEEP SHORE.', 'WHEN IT SINKS, IT COMES UP SOMEWHERE ELSE.', 'ITS PEARL IS REALLY A BIG STAR.'] },
  { t: 'cmoth', spr: 'cmoth_0', boss: true, lore: ['THE CRYSTAL MOTH LIVES DEEP IN THE CAVE.', 'ITS WINGS SHED GLOWING DUST.', 'IT CARRIES A BIG STAR FOR THE NIGHT MOTH.'] },
  { t: 'mayor', spr: 'mayor_0', boss: true, lore: ['THE MOLE MAYOR RUNS THE MEADOW FROM BELOW.', 'WHEN THE GROUND BULGES, HE IS RIGHT UNDER IT.', 'HE LOST HIS HAT ONCE, AND NEVER GOT OVER IT.'] },
  { t: 'turtle', spr: 'turtle_0', boss: true, lore: ['THE TIDE TURTLE HAS SWUM EVERY SEA.', 'WHEN SHE BLOWS HER HORN, THE TIDE COMES IN.', 'THE PEARL ON HER SHELL IS A BIG STAR.'] },
  { t: 'nmoth', spr: 'nmoth_0', boss: true, lore: ['THE NIGHT MOTH ATE THE STARLIGHT.', 'IN ITS DARK, ONLY YOUR OWN GLOW IS SAFE.', 'IT WAS ONCE A LITTLE MOTH THAT FEARED THE DARK.'] },
);
