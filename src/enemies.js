'use strict';
// Enemies, bosses and enemy bullets.

const EBULLETS = [];
function ebullet(x, y, ang, speed, color, big) {
  let b = null;
  for (let i = 0; i < EBULLETS.length; i++) if (EBULLETS[i].life <= 0) { b = EBULLETS[i]; break; }
  if (!b) { b = {}; EBULLETS.push(b); }
  speed *= DIFF().bullet * bulletSlow();
  b.x = x; b.y = y; b.vx = Math.cos(ang) * speed; b.vy = Math.sin(ang) * speed;
  b.life = 6; b.r = big ? 3.5 : 2.5; b.key = (big ? 'ebb_' : 'eb_') + color; b.spr = S(b.key); b.t = 0; b.src = E_SRC;
  b.grazed = false; b.soft = false; b.echo = false;
  return b;
}
function muzzle(x, y) { part(x, y, 0, 0, 0.14, null, { spr: 'sparkle', drag: 1 }); }
function ring(x, y, n, speed, color, off, big) {
  muzzle(x, y);
  for (let i = 0; i < n; i++) ebullet(x, y, (off || 0) + i * Math.PI * 2 / n, speed, color, big);
}
function fan(x, y, ang, n, step, speed, color, big) {
  muzzle(x + Math.cos(ang) * 5, y + Math.sin(ang) * 4);
  for (let i = 0; i < n; i++) ebullet(x, y, ang + (i - (n - 1) / 2) * step, speed, color, big);
}
function updateEBullets(dt) {
  const room = G.room;
  for (const b of EBULLETS) {
    if (b.life <= 0) continue;
    b.life -= dt; b.t += dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (solidPx(room, b.x, b.y + 5, 'shot') || b.x < 8 || b.x > VW - 8) {
      // ECHO: every enemy bullet bounces off the first wall it meets
      if (!b.echo && modOn('echo')) {
        b.echo = true;
        const px = b.x - b.vx * dt, py = b.y - b.vy * dt;
        if (solidPx(room, b.x, py + 5, 'shot') || b.x < 8 || b.x > VW - 8) b.vx = -b.vx;
        if (solidPx(room, px, b.y + 5, 'shot')) b.vy = -b.vy;
        b.x = px; b.y = py;
        continue;
      }
      b.life = 0; burst(b.x, b.y, 3, ['w', 'l'], 30, 0.2); continue;
    }
    for (const p of G.players) {
      if (!alive(p)) continue;
      const d = Math.hypot(p.x - b.x, p.y - 7 - b.y);
      // rolling right through a bullet is a graze: a sparkle and a little Starfall charge
      if (p.dashT > 0 && !b.grazed && d < b.r + 7) { b.grazed = true; grazeBullet(p, b); }
      if (d >= b.r + 3) continue;
      // practice bullets (the tutorial) just pop
      if (b.soft) { if (p.dashT <= 0) { b.life = 0; burst(b.x, b.y, 4, ['C', 'w'], 40, 0.25); Audio_.sfx('pop'); } break; }
      if (p.inv <= 0 || p.buff.guard > 0) { b.life = 0; hurtPlayer(p, 1, b.src); break; }
    }
  }
}
function drawEBullets(ox, oy) {
  for (const b of EBULLETS) if (b.life > 0) shadow(ox + b.x, oy + b.y + 6, b.r > 3 ? 6 : 4);
  for (const b of EBULLETS) {
    if (b.life <= 0) continue;
    const s = cbSprite(b);
    drawS(s, ox + b.x - (s.w >> 1), oy + b.y - (s.h >> 1));
  }
}
function clearEBullets() { for (const b of EBULLETS) b.life = 0; }

// ---------- Enemy definitions ----------
const EDEF = {
  slime: { hp: 6, r: 6, h: 10, hw: 5, hh: 4, sw: 14 },
  mini: { hp: 3, r: 4, h: 6, hw: 4, hh: 3, sw: 10 },
  gold: { hp: 14, r: 6, h: 10, hw: 5, hh: 4, sw: 14, passive: true },
  bee: { hp: 4, r: 6, h: 12, hw: 4, hh: 3, sw: 10, fly: true },
  shroom: { hp: 9, r: 7, h: 13, hw: 6, hh: 4, sw: 14, still: true },
  flower: { hp: 8, r: 7, h: 13, hw: 6, hh: 4, sw: 14, still: true },
  crab: { hp: 9, r: 7, h: 10, hw: 6, hh: 4, sw: 16 },
  wisp: { hp: 7, r: 6, h: 12, hw: 4, hh: 3, sw: 10, fly: true },
  jelly: { hp: 7, r: 6, h: 12, hw: 4, hh: 3, sw: 12, fly: true },
  bat: { hp: 5, r: 6, h: 9, hw: 4, hh: 3, sw: 10, fly: true },
  king: { hp: 360, r: 14, h: 22, hw: 12, hh: 7, sw: 30, boss: true, intro: 'DROPS IN FROM ABOVE' },
  bcrab: { hp: 640, r: 15, h: 18, hw: 14, hh: 7, sw: 34, boss: true, intro: 'CHARGES SIDEWAYS' },
  golem: { hp: 620, r: 13, h: 24, hw: 11, hh: 6, sw: 28, boss: true, intro: 'SHAKES THE CAVE' },
};

function spawnEnemy(type, x, y, opts) {
  const d = EDEF[type], depth = G.floor.depth;
  const hpMul = (d.boss ? 1 + depth * 0.3 : 1 + depth * 0.2) * DIFF().hp * crewHp(d.boss) * (d.boss && G.run && G.run.bow ? BOW_HP : 1);
  const e = {
    type, x, y, hp: d.hp * hpMul, maxHp: d.hp * hpMul, r: d.r, h: d.h, hw: d.hw, hh: d.hh, sw: d.sw,
    fly: !!d.fly, still: !!d.still, boss: !!d.boss, flash: 0, flashCd: 0, kx: 0, ky: 0, z: 0, vz: 0,
    state: 'idle', t: grnd(0.3, 1.2), anim: grand() * 3, spawnT: opts && opts.instant ? 0 : 0.7,
    dead: false, flip: false, vx: 0, vy: 0, n: 0, color: type === 'gold' ? 'gold' : slimeColor(G.floor.land.slime), ghost: false,
    passive: !!d.passive, elite: !!(opts && opts.elite), life: type === 'gold' ? 8 : 0, drops: 0,
    id: ++G.eid, tgt: null, tgtT: 0,
  };
  if (e.elite) { e.hp *= 2; e.maxHp *= 2; rollAffix(e); }
  if (d.init) d.init(e);
  if (e.boss) { e.state = 'intro'; e.t = CINE_T; e.spawnT = 0; e.z = type === 'king' ? 160 : 0; }
  else unstick(G.room, e, e.fly ? 'fly' : 'enemy');
  G.enemies.push(e);
  return e;
}

function hurtEnemy(e, dmg, fx, fy, quiet, own) {
  if (e.dead || e.spawnT > 0) return;
  if (affixBlock(e, fx, fy)) return;
  if (e.stag > 0) dmg *= 1.5;
  e.hp -= dmg; e.hurtAt = G.time;
  if (e.boss) addCharge(own, dmg * 0.004 / crewHp(true));
  if (e.type === 'gold' && e.drops < 6 && e.hp > 0) { e.drops++; spawnPickup('coin', e.x, e.y - 4); }
  if (e.flashCd <= 0) { e.flash = 0.07; e.flashCd = 0.14; }
  if (!e.boss && !e.still) {
    const d = Math.hypot(e.x - fx, e.y - fy) || 1;
    e.kx = (e.x - fx) / d * 90; e.ky = (e.y - fy) / d * 90;
  }
  if (!quiet) Audio_.sfx('hit');
  burst(fx, fy, 4, ['w', 'Y'], 60, 0.2);
  if (e.hp <= 0) killEnemy(e, own);
}

function killEnemy(e, own) {
  e.dead = true;
  // practice targets (the tutorial) only burst: no stats, no loot, no combo
  if (EDEF[e.type].practice) { poof(e.x, e.y - e.h / 2); burst(e.x, e.y - e.h / 2, 12, enemyColors(e), 90, 0.5, { g: 120 }); Audio_.sfx('kill'); return; }
  const p = own && G.players.includes(own) ? own : G.player;
  G.stats.kills++; p.kills++;
  if (p === G.player) Save.stats.kills++;
  if (!e.boss) { onKill(e, p); youFx(p, e.elite ? 'elite' : 'kill', e.type); }
  if (G.arena) G.arena.killed++;
  const cx = e.x, cy = e.y - e.h / 2;
  poof(cx, cy);
  burst(cx, cy, e.boss ? 40 : 10, enemyColors(e), e.boss ? 160 : 90, e.boss ? 1.1 : 0.5, { g: 120 });
  if (e.boss) { bossDefeated(e); return; }
  Audio_.sfx('kill');
  G.shake = Math.max(G.shake, 1.5);
  G.hitstop = Math.max(G.hitstop, 0.035);
  if (e.type === 'jelly') { E_SRC = 'jelly'; ring(e.x, e.y - 8, 6, 48, 'cyan', grand()); Audio_.sfx('pop'); }
  if (e.type === 'slime' && e.color === 'blue') {
    for (let i = 0; i < 2; i++) { const m = spawnEnemy('mini', e.x + (i ? 5 : -5), e.y, { instant: true }); m.state = 'idle'; m.t = 0.4; }
  }
  if (e.affix) affixDeath(e);
  if (e.grudge) nemesisDeath(e);
  if (e.elite) maybeScroll(e.x, e.y - 2, 0.04);
  if (e.type === 'gold') {
    for (let i = 0; i < (teamHas('jackpot') ? 12 : 6); i++) spawnPickup('coin', e.x, e.y - 4);
    spawnPickup('gem', e.x, e.y - 4);
    earnVault(10);
    noteTeam('gold');
    toast('GOLDEN SLIME: +10 VAULT COINS!');
    return;
  }
  const luck = teamLuck();
  if (e.elite) { for (let i = 0; i < 3; i++) spawnPickup('coin', e.x, e.y - 2); if (grand() < 0.3 + luck * 0.05) spawnPickup('gem', e.x, e.y - 2); }
  else if (grand() < 0.3 + luck * 0.08) dropLoot(e.x, e.y - 2, 0.5);
  if (grand() < (e.elite ? 0.08 : 0.018) + luck * 0.005) spawnPotion(e.x, e.y - 2);
  if (p.honey && ++p.honeyN >= (p.honeyEvery || 12)) {
    p.honeyN = 0;
    if (p.hp < p.maxHp) { healPlayer(p, 1); Audio_.sfx('heart'); }
    if (p.honeyShield && p.shield) p.shieldUp = true; // HONEY BUBBLE
  }
}
function enemyColors(e) {
  switch (e.type) {
    case 'gold': return ['y', 'Y', 'w'];
    case 'slime': case 'mini': case 'king': return e.color === 'blue' ? ['B', 'c', 'C'] : e.color === 'pink' ? ['P', 'q', 'w'] : ['G', 'h', 'H'];
    case 'bee': return ['y', 'Y', '1'];
    case 'shroom': return ['P', 'q', 'w'];
    case 'flower': return ['P', 'y', 'G'];
    case 'crab': case 'bcrab': return ['r', 'R', 'O'];
    case 'wisp': return ['C', 'c', 'w'];
    case 'jelly': return ['q', 'P', 'w'];
    case 'bat': return ['2', '3', 'P'];
    default: return (EDEF[e.type] && EDEF[e.type].colors) || ['l', 'm', 'c'];
  }
}

// ---------- AI ----------
// The hero the enemy being updated is after (see updateEnemies).
let EP = null;
// Which enemy type fired the bullets being made (the end screen names what got you).
let E_SRC = '';
const _dir = { x: 0, y: 0 };
function towardPlayer(e) {
  const p = EP, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  if (!e.fly && d > 20) { const f = flowDir(e.x, e.y); if (f) { _dir.x = f.x; _dir.y = f.y; return _dir; } }
  _dir.x = dx / d; _dir.y = dy / d;
  return _dir;
}
const aimAt = (x, y) => Math.atan2(EP.y - 7 - y, EP.x - x);

function updateEnemies(dt) {
  const room = G.room, pace = DIFF().pace * (1 + 0.04 * (G.players.length - 1));
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.anim += dt;
    e.flash = Math.max(0, e.flash - dt);
    e.flashCd -= dt;
    if (e.spawnT > 0) { e.spawnT -= dt; continue; }
    if (e.kx || e.ky) {
      moveBox(room, e, e.kx * dt, e.ky * dt, e.fly ? 'fly' : 'enemy');
      e.kx *= Math.pow(0.02, dt); e.ky *= Math.pow(0.02, dt);
      if (Math.abs(e.kx) + Math.abs(e.ky) < 5) e.kx = e.ky = 0;
    }
    // pick a target (nearest standing hero), re-checked twice a second so nobody jitters between two
    if ((e.tgtT -= dt) <= 0 || !e.tgt || !alive(e.tgt) || !G.players.includes(e.tgt)) { e.tgt = nearestHero(e.x, e.y); e.tgtT = 0.5; }
    const p = EP = e.tgt;
    E_SRC = e.type;
    const k = enemyStatus(e, dt);
    if (e.dead) continue;
    if (k === 0) continue; // asleep (SLEEPY BELL): no moves, no contact damage
    if (e.stag > 0) { e.stag -= dt; continue; } // a staggered boss is harmless for a moment
    AI[e.type](e, dt * pace * k * (e.elite ? 1.25 : 1), room, p);
    // contact damage
    if (e.passive || e.ghost || e.z >= 8) continue;
    for (const q of G.players) if (alive(q) && Math.hypot(q.x - e.x, (q.y - 5) - (e.y - e.h / 2)) < e.r + 4) hurtPlayer(q, 1, e.type);
  }
  for (let i = G.enemies.length - 1; i >= 0; i--) if (G.enemies[i].dead) G.enemies.splice(i, 1);
}

const AI = {
  slime(e, dt, room) {
    e.t -= dt;
    const mini = e.type === 'mini';
    if (e.state === 'idle') {
      if (e.t <= 0) { e.state = 'jump'; e.t = mini ? 0.32 : 0.42; const d = towardPlayer(e); e.vx = d.x * (mini ? 75 : 62); e.vy = d.y * (mini ? 75 : 62); e.flip = e.vx < 0; }
    } else if (e.state === 'jump') {
      const dur = mini ? 0.32 : 0.42;
      e.z = Math.sin((1 - e.t / dur) * Math.PI) * (mini ? 6 : 9);
      moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
      if (e.t <= 0) {
        e.z = 0; e.state = 'land'; e.t = 0.14;
        dust(e.x, e.y, mini ? 2 : 4, mini ? 8 : 12);
        if (e.color === 'pink' && !mini && grand() < 0.6) { ring(e.x, e.y - 5, 4, 60, 'pink', Math.PI / 4); Audio_.sfx('eshoot'); }
      }
    } else if (e.state === 'land' && e.t <= 0) { e.state = 'idle'; e.t = grnd(0.45, 0.9) * (mini ? 0.7 : 1); }
  },
  mini(e, dt, room, p) { AI.slime(e, dt, room, p); },
  // Golden slime: harmless, hops away from the hero and escapes after a while.
  gold(e, dt, room, p) {
    e.t -= dt; e.life -= dt;
    if (e.life <= 0 && e.state !== 'jump') {
      e.dead = true; poof(e.x, e.y - 5); Audio_.sfx('tele'); toast('THE GOLDEN SLIME GOT AWAY!'); noteTeam('goldx');
      return;
    }
    if (e.state === 'idle') {
      if (e.t <= 0) {
        let a = Math.atan2(e.y - p.y, e.x - p.x) + grnd(-0.8, 0.8);
        for (let k = 0; k < 6 && boxSolid(room, e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20, e.hw, e.hh, 'enemy'); k++) a += grnd(1, 2.5);
        e.vx = Math.cos(a) * 95; e.vy = Math.sin(a) * 95; e.flip = e.vx < 0;
        e.state = 'jump'; e.t = 0.34;
      }
    } else if (e.state === 'jump') {
      e.z = Math.sin((1 - e.t / 0.34) * Math.PI) * 8;
      moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
      if (Math.random() < 0.4) part(e.x + rnd(-4, 4), e.y - rnd(2, 10), 0, -10, 0.4, null, { spr: 'sparkle', drag: 1 });
      if (e.t <= 0) { e.z = 0; e.state = 'land'; e.t = 0.1; dust(e.x, e.y, 3, 10); }
    } else if (e.t <= 0) { e.state = 'idle'; e.t = grnd(0.15, 0.35); }
  },
  bee(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle' || e.state === 'fly') {
      e.state = 'fly';
      const d = towardPlayer(e), s = Math.sin(e.anim * 4) * 0.8;
      e.vx += ((d.x - d.y * s) * 48 - e.vx) * 3 * dt;
      e.vy += ((d.y + d.x * s) * 48 - e.vy) * 3 * dt;
      if (e.t <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 150) { e.state = 'aim'; e.t = 0.45; }
    } else if (e.state === 'aim') {
      e.vx *= 0.85; e.vy *= 0.85;
      if (e.t <= 0) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.vx = Math.cos(a) * 150; e.vy = Math.sin(a) * 150; e.state = 'dash'; e.t = 0.38; }
    } else if (e.state === 'dash' && e.t <= 0) { e.state = 'fly'; e.t = grnd(2, 3); }
    if (moveBox(room, e, e.vx * dt, e.vy * dt, 'fly') && e.state === 'dash') { e.vx *= -0.3; e.vy *= -0.3; }
    if (Math.abs(e.vx) > 3) e.flip = e.vx < 0;
    e.z = 6 + Math.sin(e.anim * 5) * 2;
  },
  shroom(e, dt) {
    e.t -= dt;
    if (e.state === 'idle' && e.t <= 0) { e.state = 'charge'; e.t = 0.6; }
    else if (e.state === 'charge' && e.t <= 0) {
      const deep = G.floor.depth >= 2;
      ring(e.x, e.y - 6, deep ? 10 : 8, 62, 'orange', e.n++ % 2 ? Math.PI / (deep ? 10 : 8) : 0);
      Audio_.sfx('eshoot');
      e.state = 'shoot'; e.t = 0.3;
    } else if (e.state === 'shoot' && e.t <= 0) { e.state = 'idle'; e.t = grnd(1.8, 2.4); }
  },
  flower(e, dt, room, p) {
    e.t -= dt;
    e.flip = p.x < e.x;
    if (e.state === 'idle' && e.t <= 0) { e.state = 'charge'; e.t = 0.5; }
    else if (e.state === 'charge' && e.t <= 0) {
      const a = aimAt(e.x, e.y - 8);
      if (G.floor.depth === 0) ebullet(e.x, e.y - 8, a, 82, 'pink');
      else fan(e.x, e.y - 8, a, 3, 0.26, 82, 'pink');
      Audio_.sfx('eshoot');
      e.state = 'shoot'; e.t = 0.25;
    } else if (e.state === 'shoot' && e.t <= 0) { e.state = 'idle'; e.t = grnd(1.6, 2.2); }
  },
  crab(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle' || e.state === 'walk') {
      e.state = 'walk';
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 36 * dt, d.y * 36 * dt, 'enemy');
      const aligned = Math.abs(dy) < 9 || Math.abs(dx) < 9;
      if (e.t <= 0 && aligned && Math.hypot(dx, dy) < 190 && clearLine(room, e.x, e.y - 3, p.x, p.y - 3)) {
        e.state = 'tele'; e.t = 0.45;
        if (Math.abs(dy) < 9) { e.vx = Math.sign(dx) * 165; e.vy = 0; } else { e.vx = 0; e.vy = Math.sign(dy) * 165; }
      }
    } else if (e.state === 'tele') {
      if (e.t <= 0) { e.state = 'charge'; e.t = 1.5; Audio_.sfx('dash'); }
    } else if (e.state === 'charge') {
      if (Math.random() < 0.5) part(e.x + rnd(-5, 5), e.y - 1, 0, -10, 0.3, 'l', { size: 2 });
      if (moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy') || e.t <= 0) { e.state = 'stun'; e.t = 0.7; G.shake = Math.max(G.shake, 1); Audio_.sfx('land'); dust(e.x, e.y, 5, 12); }
    } else if (e.state === 'stun' && e.t <= 0) { e.state = 'walk'; e.t = grnd(0.6, 1.2); }
  },
  wisp(e, dt, room, p) {
    e.t -= dt;
    e.z = 5 + Math.sin(e.anim * 3) * 2;
    if (e.state === 'idle' || e.state === 'float') {
      e.state = 'float';
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 20 * dt, d.y * 20 * dt, 'fly');
      if (e.t <= 0) { e.state = 'fade'; e.t = 0.45; }
    } else if (e.state === 'fade') {
      if (e.t < 0.15) e.ghost = true;
      if (e.t <= 0) {
        for (let k = 0; k < 30; k++) {
          const x = grnd(32, VW - 32), y = grnd(60, 190);
          if (Math.hypot(x - p.x, y - p.y) > 80 && !boxSolid(room, x, y, e.hw, e.hh, 'fly')) { e.x = x; e.y = y; break; }
        }
        Audio_.sfx('tele');
        e.state = 'appear'; e.t = 0.4;
      }
    } else if (e.state === 'appear') {
      if (e.t < 0.2) e.ghost = false;
      if (e.t <= 0) {
        fan(e.x, e.y - 8, aimAt(e.x, e.y - 8), 5, 0.22, 70, 'cyan');
        Audio_.sfx('eshoot');
        e.state = 'float'; e.t = grnd(1.8, 2.6);
      }
    }
  },

  // Jellyfish: drifts, then pulses toward the hero in short bursts.
  jelly(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle' || e.state === 'drift') {
      e.state = 'drift';
      if (e.t <= 0) {
        e.state = 'pulse'; e.t = 0.25;
        const a = Math.atan2(p.y - e.y, p.x - e.x) + grnd(-0.3, 0.3);
        e.vx = Math.cos(a) * 78; e.vy = Math.sin(a) * 78;
      }
    } else if (e.state === 'pulse' && e.t <= 0) { e.state = 'drift'; e.t = grnd(0.9, 1.4); }
    e.vx *= Math.pow(0.25, dt); e.vy *= Math.pow(0.25, dt);
    if (moveBox(room, e, e.vx * dt, e.vy * dt, 'fly')) { e.vx *= -0.5; e.vy *= -0.5; }
    e.z = 7 + Math.sin(e.anim * 2.5) * 2;
  },
  // Bat: flutters in a loose circle around the hero, then swoops through.
  bat(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle' || e.state === 'flutter') {
      if (e.state === 'idle') { e.ang = Math.atan2(e.y - p.y, e.x - p.x); e.t = grnd(1.4, 2.2); }
      e.state = 'flutter';
      e.ang += dt * 1.6;
      const tx = p.x + Math.cos(e.ang) * 58, ty = p.y - 6 + Math.sin(e.ang) * 40;
      e.vx += ((tx - e.x) * 3 + grnd(-40, 40) - e.vx) * 4 * dt;
      e.vy += ((ty - e.y) * 3 + grnd(-40, 40) - e.vy) * 4 * dt;
      if (e.t <= 0) { e.state = 'aim'; e.t = 0.3; }
    } else if (e.state === 'aim') {
      e.vx *= 0.8; e.vy *= 0.8;
      if (e.t <= 0) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.vx = Math.cos(a) * 165; e.vy = Math.sin(a) * 165; e.state = 'swoop'; e.t = 0.5; }
    } else if (e.state === 'swoop' && e.t <= 0) { e.state = 'flutter'; e.t = grnd(1.6, 2.4); e.ang = Math.atan2(e.y - p.y, e.x - p.x); }
    if (moveBox(room, e, e.vx * dt, e.vy * dt, 'fly') && e.state === 'swoop') { e.vx *= -0.4; e.vy *= -0.4; }
    if (Math.abs(e.vx) > 4) e.flip = e.vx < 0;
    e.z = 9 + Math.sin(e.anim * 9) * 1.5;
  },

  // ---------- Bosses ----------
  king(e, dt, room, p) {
    e.t -= dt;
    const rage = e.hp < e.maxHp * 0.5;
    if (rage) bossPhase(e, 2);
    switch (e.state) {
      case 'intro':
        e.z = Math.max(0, e.z - 260 * dt);
        if (e.z === 0 && !e.landed) { e.landed = true; G.shake = 6; Audio_.sfx('boom'); hapticAll('slam'); ring(e.x, e.y - 8, 12, 60, 'goo'); }
        if (e.t <= 0) { e.state = 'pre'; e.t = 0.3; e.n = 0; }
        break;
      case 'pre':
        if (e.t <= 0) { e.state = 'hop'; e.t = 0.55; const d = towardPlayer(e); e.vx = d.x * (rage ? 95 : 75); e.vy = d.y * (rage ? 95 : 75); }
        break;
      case 'hop':
        e.z = Math.sin((1 - e.t / 0.55) * Math.PI) * 14;
        moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
        if (e.t <= 0) {
          e.z = 0; e.state = 'land'; e.t = 0.35; e.n++;
          G.shake = Math.max(G.shake, 2); Audio_.sfx('land'); dust(e.x, e.y, 10, 26);
          if (e.n % 2 === 0 || rage) { ring(e.x, e.y - 8, rage ? 12 : 10, 66, 'goo', e.n * 0.3); Audio_.sfx('eshoot'); }
        }
        break;
      case 'land':
        if (e.t <= 0) {
          if (e.n >= 3) { e.state = 'rise'; e.t = 0.4; Audio_.sfx('charge'); } else { e.state = 'pre'; e.t = 0.25; }
        }
        break;
      case 'rise':
        e.z += 420 * dt;
        if (e.t <= 0) { e.state = 'hover'; e.t = rage ? 0.9 : 1.2; }
        break;
      case 'hover': {
        e.z = 200;
        const k = Math.min(1, 3 * dt);
        e.x += (p.x - e.x) * k; e.y += (Math.max(70, Math.min(185, p.y)) - e.y) * k;
        if (e.t <= 0) { e.state = 'fall'; e.t = 0.35; }
        break;
      }
      case 'fall':
        e.z = Math.max(0, e.z - 600 * dt);
        if (e.z === 0) {
          e.state = 'rest'; e.t = rage ? 0.6 : 0.9; e.n = 0;
          G.shake = 7; Audio_.sfx('boom'); hapticAll('slam'); dust(e.x, e.y, 16, 34);
          ring(e.x, e.y - 6, rage ? 20 : 16, 70, 'goo', 0, true);
          burst(e.x, e.y, 16, ['G', 'h', 'H'], 120, 0.5, { g: 200 });
          if (rage && !e.gentle && G.enemies.length < 6) for (let i = 0; i < 2; i++) spawnEnemy('mini', e.x + (i ? 18 : -18), e.y + 4, { instant: true });
          unstick(room, e, 'enemy');
          stagger(e);
        }
        break;
      case 'rest':
        // phase 2: every other slam is followed by a spinning spray of slime
        if (e.t <= 0) { if (e.p2 && (e.k = (e.k || 0) + 1) % 2 === 0) { e.state = 'spin'; e.t = 2; e.n = 0; Audio_.sfx('charge'); } else { e.state = 'pre'; e.t = 0.2; } }
        break;
      case 'spin':
        e.n += dt;
        if (e.n > 0.12) { e.n = 0; const b = e.t * 3.1; for (let i = 0; i < 3; i++) ebullet(e.x, e.y - 10, b + i * Math.PI * 2 / 3, 64, 'goo'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) { e.state = 'pre'; e.t = 0.4; }
        break;
    }
  },
  bcrab(e, dt, room, p) {
    e.t -= dt;
    const rage = e.hp < e.maxHp * 0.5;
    if (rage) bossPhase(e, 2);
    switch (e.state) {
      case 'intro':
        if (e.t <= 0) { e.state = 'walk'; e.t = 2.4; e.n = 0; }
        break;
      case 'walk': {
        const tx = p.x, ty = Math.min(110, Math.max(70, p.y - 40));
        e.vx += (Math.sign(tx - e.x) * (Math.abs(tx - e.x) > 6 ? 55 : 0) - e.vx) * 4 * dt;
        e.vy += (Math.sign(ty - e.y) * (Math.abs(ty - e.y) > 6 ? 30 : 0) - e.vy) * 4 * dt;
        moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
        e.n += dt;
        if (e.n > crabGap(e)) { e.n = 0; fan(e.x, e.y - 10, aimAt(e.x, e.y - 10), rage ? 5 : 3, 0.24, 78, 'bubble'); Audio_.sfx('eshoot'); }
        if (e.t <= 0) {
          const r = grand();
          // phase 2 adds a wall of bubbles with one gap to slip through
          e.state = e.p2 && r < 0.3 ? 'wall' : r < 0.6 ? 'tele' : 'spiral';
          e.t = e.state === 'tele' ? 0.7 : e.state === 'wall' ? 0.6 : 2.4; e.n = 0;
          if (e.state !== 'spiral') Audio_.sfx('charge');
          if (e.state === 'tele') lane(e, p);
        }
        break;
      }
      case 'tele':
        if (e.t <= 0) {
          e.vx = Math.cos(e.la) * (rage ? 230 : 195); e.vy = Math.sin(e.la) * (rage ? 230 : 195);
          e.state = 'charge'; e.t = 2;
        }
        break;
      case 'charge':
        if (Math.random() < 0.7) part(e.x + rnd(-12, 12), e.y - 1, 0, -10, 0.4, 'A', { size: 2 });
        if (moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy') || e.t <= 0) {
          G.shake = 6; Audio_.sfx('boom'); hapticAll('slam'); dust(e.x, e.y, 12, 30);
          ring(e.x, e.y - 10, rage ? 16 : 12, 64, 'bubble', grand());
          e.state = 'stun'; e.t = 0.2; stagger(e);
        }
        break;
      case 'stun':
        if (e.t <= 0) { e.state = 'walk'; e.t = 2.2; }
        break;
      case 'wall':
        // the wall's row blinks first, with its gap already open
        if (e.gap == null) { e.gap = grndi(3, 16); e.down = p.y > e.y; G.markers.push({ kind: 'line', x: e.gap, y: e.down ? 58 : 196, t: e.t, max: e.t }); }
        if (e.t <= 0) {
          for (let i = 0; i < 20; i++) if (Math.abs(i - e.gap) > 1) ebullet(24 + i * 17, e.down ? 58 : 196, e.down ? Math.PI / 2 : -Math.PI / 2, 46, 'bubble', true);
          Audio_.sfx('bubble'); e.gap = null;
          e.w = (e.w || 0) + 1;
          if (e.w >= 2) { e.w = 0; e.state = 'walk'; e.t = 2.2; } else e.t = 1.1;
        }
        break;
      case 'spiral':
        e.n += dt;
        if (e.n > 0.1) {
          e.n = 0;
          const arms = rage ? 3 : 2, base = e.t * 2.6;
          for (let i = 0; i < arms; i++) ebullet(e.x, e.y - 10, base + i * Math.PI * 2 / arms, 70, 'bubble');
          Audio_.sfx('eshoot');
        }
        if (e.t <= 0) { e.state = 'walk'; e.t = 2.4; e.n = 0; }
        break;
    }
  },
  golem(e, dt, room, p) {
    e.t -= dt;
    const rage = e.hp < e.maxHp * 0.5;
    if (rage) bossPhase(e, 2);
    switch (e.state) {
      case 'intro':
        if (e.t <= 0) { e.state = 'walk'; e.t = 1.2; }
        break;
      case 'walk': {
        const d = towardPlayer(e);
        moveBox(room, e, d.x * (rage ? 34 : 26) * dt, d.y * (rage ? 34 : 26) * dt, 'enemy');
        e.flip = p.x < e.x;
        if (e.t <= 0) {
          e.state = gpick(e.p2 ? ['raise', 'rain', 'burst', 'waves'] : ['raise', 'rain', 'burst']);
          e.t = e.state === 'raise' ? 0.65 : e.state === 'rain' ? 0.5 : e.state === 'waves' ? 0.5 : 0; e.n = 0; e.w = 0;
          if (e.state !== 'burst') Audio_.sfx('charge');
        }
        break;
      }
      case 'raise':
        if (e.t <= 0) {
          G.shake = 7; Audio_.sfx('boom'); hapticAll('slam'); dust(e.x, e.y, 16, 30);
          ring(e.x, e.y - 4, 18, 58, 'shard', 0, true);
          e.state = 'slam2'; e.t = 0.3;
        }
        break;
      case 'slam2':
        if (e.t <= 0) { ring(e.x, e.y - 4, 18, 72, 'shard', Math.PI / 18); e.state = 'walk'; e.t = rage ? 0.9 : 1.4; stagger(e); }
        break;
      case 'rain':
        if (e.t <= 0) {
          for (let i = 0; i < (rage ? 8 : 6); i++) {
            const x = i === 0 ? p.x : grnd(40, VW - 40), y = i === 0 ? p.y : grnd(60, 190);
            G.markers.push({ x, y, t: 1 + i * 0.08, max: 1 + i * 0.08, src: e.type });
          }
          e.state = 'walk'; e.t = rage ? 1.6 : 2.1;
        }
        break;
      case 'burst':
        e.n += dt;
        if (e.n >= 0.5 + 0.35 * e.w) {
          e.w++;
          fan(e.x, e.y - 14, aimAt(e.x, e.y - 14), 7, 0.17, 80, 'shard');
          Audio_.sfx('eshoot');
          if (e.w >= 3) { e.w = 0; e.state = 'walk'; e.t = rage ? 1 : 1.5; }
        }
        break;
      case 'waves':
        // phase 2: rings of crystal shards that twist a little each time
        if (e.t <= 0) {
          ring(e.x, e.y - 12, 12, 58 + e.w * 6, 'shard', e.w * 0.13);
          Audio_.sfx('eshoot'); G.shake = Math.max(G.shake, 1.5);
          e.w++; e.t = 0.32;
          if (e.w >= 5) { e.w = 0; e.state = 'walk'; e.t = 1.2; }
        }
        break;
    }
  },
};
// A boss enters phase n (2 below half health, 3 for the newer ones): the fight freezes for a
// breath, its bullets vanish, a flash, a roar, a new attack.
function bossPhase(e, n) {
  if ((e.phase || 1) >= n) return;
  e.phase = n; e.p2 = true;
  G.hitstop = Math.max(G.hitstop, 0.5); clearEBullets();
  G.flashT = 0.08; G.shake = Math.max(G.shake, 6);
  Audio_.sfx('roar'); hapticAll('roar');
  burst(e.x, e.y - e.h / 2, 30, enemyColors(e).concat(['w', 'Y']), 150, 0.8);
  G.banner = { title: bossName(e.type) + ' IS FURIOUS!', sub: 'WATCH OUT FOR SOMETHING NEW', t: 2, icon: null };
}

// After its big attack a boss is dazed: it stops, cannot hurt by touch, and takes extra damage.
function stagger(e, t) { e.stag = t || 1.5; e.vx = e.vy = 0; Audio_.sfx('tele'); }
// A boss's frame: calm, or angry from phase 2 on, dazed while staggered.
const bossFrame = (e, f, t) => S((t || e.type) + (e.stag > 0 ? '_stag' : '_' + (e.p2 ? 'p' : '') + f));
const bob = (e, sp, a, b) => Math.floor(e.anim * sp) % 2 ? a : b;
// a charge picks its lane when the tell starts and shows it, so stepping aside is always safe
function lane(e, p) { e.la = Math.atan2(p.y - e.y, p.x - e.x); G.markers.push({ kind: 'lane', x: e.x, y: e.y - 6, a: e.la, t: e.t, max: e.t }); }
const crabGap = (e) => e.hp < e.maxHp * 0.5 ? 0.6 : 0.85;
// Falling crystals (golem), rocks and clods (mayor): telegraph ring, then shatter into bullets.
// kind 'zone' is only a warning ring; fall '' drops nothing (a burst from below).
function updateMarkers(dt) {
  const m = G.markers;
  for (let i = m.length - 1; i >= 0; i--) {
    const k = m[i];
    k.t -= dt;
    if (k.t <= 0 && k.kind) { m[i] = m[m.length - 1]; m.pop(); continue; }
    if (k.t <= 0) {
      ring(k.x, k.y - 4, k.n || 5, 62, { cmoth: 'dust', nmoth: 'nstar', mayor: 'clod' }[k.src] || 'shard', grand());
      burst(k.x, k.y - 4, 10, ['c', 'C', 'w'], 90, 0.4, { g: 150 });
      G.shake = Math.max(G.shake, 2);
      Audio_.sfx('brk');
      for (const p of G.players) if (alive(p) && Math.hypot(p.x - k.x, (p.y - k.y) * 1.6) < 10) hurtPlayer(p, 1, k.src || 'golem');
      m[i] = m[m.length - 1]; m.pop();
    }
  }
}
function drawMarkers(ox, oy) {
  for (const k of G.markers) {
    if (k.kind === 'lane') { if (Math.floor(k.t * 8) % 2) for (let d = 20; d < 400; d += 14) drawS(S('sparkle_c'), ox + k.x + Math.cos(k.a) * d - 1, oy + k.y + Math.sin(k.a) * d - 1); continue; }
    if (k.kind === 'tide') { if (Math.floor(k.t * 8) % 2) for (let y = 36; y <= 190; y += 14) if (Math.abs(y - k.y) > 14) { const l = k.x < VW / 2; drawS(S('tide_arrow'), ox + k.x + (l ? 4 : -10), oy + y - 3, l ? 0 : 1); drawS(S('sparkle_c'), ox + k.x + (l ? 22 : -24), oy + y - 1); } continue; }
    if (k.kind === 'line') { if (Math.floor(k.t * 8) % 2) for (let i = 0; i < 20; i++) if (Math.abs(i - k.x) > 1) drawS(S('sparkle_c'), ox + 23 + i * 17, oy + k.y - 1); continue; }
    const r = ringSprite(10, Math.floor(k.t * 10) % 2 ? 'P' : 'w');
    ctx.drawImage(r, Math.round(ox + k.x - 10), Math.round(oy + k.y - 6));
    if (k.kind || k.fall === '') continue;
    const fall = Math.min(1, k.t / 0.6), s = S(k.fall || 'rock_crystal');
    if (k.t < 0.6) { shadow(ox + k.x, oy + k.y, 12); drawS(s, ox + k.x - (s.w >> 1), oy + k.y - s.h - fall * 150); }
  }
}

// ---------- Drawing ----------
const SLIME_FR = { idle: 'idle', jump: 'stretch', land: 'squash' };
function enemySprite(e) {
  switch (e.type) {
    case 'slime': {
      const st = e.state === 'idle' ? (Math.floor(e.anim * 2.5) % 3 === 2 ? 'squash' : 'idle') : SLIME_FR[e.state];
      return S('slime_' + e.color + '_' + st);
    }
    case 'mini': return S('slime_' + e.color + '_mini');
    case 'gold': return S('slime_gold_' + (SLIME_FR[e.state] || 'idle'));
    case 'bee': return S('bee_' + (Math.floor(e.anim * 16) % 2));
    case 'shroom': return S('shroom_' + (e.state === 'charge' ? 1 : e.state === 'shoot' ? 2 : 0));
    case 'flower': return S('flower_' + (e.state === 'charge' ? 1 : e.state === 'shoot' ? 2 : 0));
    case 'crab': return S('crab_' + (e.state === 'walk' ? Math.floor(e.anim * 6) % 2 : e.state === 'charge' ? Math.floor(e.anim * 12) % 2 : 0));
    case 'wisp': return S('wisp_' + (Math.floor(e.anim * 6) % 3));
    case 'jelly': return S(e.state === 'pulse' ? 'jelly_1' : 'jelly_0');
    case 'bat': return S('bat_' + [0, 1, 2, 1][Math.floor(e.anim * (e.state === 'swoop' ? 8 : 14)) % 4]);
    case 'king': return bossFrame(e, { pre: 'tell', rise: 'tell', hop: 'move', hover: 'move', fall: 'move', intro: 'move', land: 'atk', spin: 'atk' }[e.state] || bob(e, 2, 1, 0));
    case 'bcrab': return bossFrame(e, { tele: 'tell', wall: 'tell', charge: 'atk', spiral: 'atk', walk: bob(e, 6, 'move', 0) }[e.state] || bob(e, 2, 1, 0));
    case 'golem': return bossFrame(e, { raise: 'tell', rain: 'tell', slam2: 'atk', burst: 'atk', waves: 'atk', walk: bob(e, 3, 'move', 0) }[e.state] || bob(e, 2, 1, 0));
    // newer foes describe their own look in EDEF (see foes.js)
    default: return EDEF[e.type].sprite(e);
  }
}
function drawEnemy(e, ox, oy) {
  if (e.spawnT > 0) {
    const k = e.spawnT / 0.7;
    const s = S(Math.floor(e.spawnT * 12) % 2 ? 'sparkle_0' : 'sparkle_1');
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + e.spawnT * 5;
      drawS(s, ox + e.x + Math.cos(a) * 10 * k - 1, oy + e.y - 6 + Math.sin(a) * 6 * k - 1);
    }
    return;
  }
  if (e.ghost && e.type !== 'mayor' && Math.floor(e.anim * 20) % 2) return;
  if (e.state === 'fade' && Math.floor(e.anim * 20) % 2) return;
  const s = enemySprite(e);
  const hover = e.fly || e.boss;
  shadow(ox + e.x, oy + e.y, e.z > 60 ? Math.max(6, e.sw - (e.z - 60) / 8) : e.sw);
  if (e.boss && e.z > 180) return;
  let v = e.flip ? 1 : 0;
  if (e.flash > 0) v += 2;
  let x = e.x;
  if ((e.state === 'tele' || e.state === 'aim' || e.state === 'rise') && Math.floor(e.anim * 30) % 2) x += 1;
  if (e.state === 'charge' && e.type === 'shroom') x += Math.floor(e.anim * 30) % 2 ? 1 : 0;
  const fy = oy + e.y - Math.round(e.z || 0) + (hover ? 0 : 1);
  if (EDEF[e.type].under) EDEF[e.type].under(e, ox, oy);
  if (e.elite || e.type === 'gold') drawGlow(s, ox + x - (s.w >> 1), fy - s.h, e.flip);
  drawFeet(s, ox + x, fy, v);
  const g = glintAt(e);
  if (g && Math.floor(e.anim * 16) % 2) drawS(S('sparkle_0'), ox + e.x + g[0] - 1, oy + e.y + g[1] - Math.round(e.z || 0) - 1);
  // dazed: cyan sparkles circle its head
  if (e.stag > 0) for (let i = 0; i < 3; i++) { const a = e.anim * 5 + i * 2.1; drawS(S('sparkle_c'), ox + e.x + Math.round(Math.cos(a) * 12) - 1, fy - s.h + Math.round(Math.sin(a) * 3) - 2); }
  drawEnemyStatus(e, ox, oy);
  drawAffix(e, ox, oy);
  drawGrudge(e, ox, oy);
}
// Where an enemy is about to shoot from, during the last moment before it fires.
function glintAt(e) {
  switch (e.type) {
    case 'flower': return e.state === 'charge' && e.t < 0.28 ? [0, -8] : null;
    case 'shroom': return e.state === 'charge' && e.t < 0.28 ? [0, -12] : null;
    case 'wisp': return e.state === 'appear' && e.t < 0.22 ? [0, -9] : null;
    case 'bcrab': return e.state === 'walk' && e.n > crabGap(e) - 0.45 ? [0, -12] : null;
    case 'golem': return e.state === 'burst' ? [0, -16] : null;
    default: return EDEF[e.type] && EDEF[e.type].glint ? EDEF[e.type].glint(e) : null;
  }
}
