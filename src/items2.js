'use strict';
// The second batch of magic items, item rarity and sets, and the rules the new items add
// (poison, fire, frost, sleep, lucky crits, bee buddies...). The game code calls the
// item* hooks below at fixed points; each hook only does something when a hero holds the
// item. rare: 0 common, 1 rare, 2 epic (rarer items are offered less often).
Object.assign(ITEMS, {
  glass: { name: 'GLASS STAR', desc: 'DOUBLE DAMAGE, BUT ONLY ONE HEART', rare: 2, unique: true, apply: p => { p.dmg *= 2; p.maxHp = 2; p.hp = Math.min(p.hp, 2); } },
  crown: { name: 'HEAVY CROWN', desc: '+40% DAMAGE, BUT YOU ARE SLOWER', rare: 1, unique: true, apply: p => { p.dmg *= 1.4; p.speed *= 0.85; } },
  nectar: { name: 'SWEET NECTAR', desc: 'SHOOT FASTER, ROLL MORE OFTEN', apply: p => { p.fireDelay *= 0.82; p.dashCd *= 0.8; } },
  crescent: { name: 'CRESCENT', desc: 'ONE MORE MOON', rare: 1, set: 'moon', apply: p => { p.orbitals += 1; } },
  moonstone: { name: 'MOONSTONE', desc: 'MOONS HIT TWICE AS HARD, +1 MOON', rare: 1, set: 'moon', unique: true, apply: p => { p.moonDmg = (p.moonDmg || 1) * 2; p.orbitals += 1; } },
  beehat: { name: 'BEE HAT', desc: 'A LITTLE BEE FIGHTS WITH YOU', rare: 1, set: 'bee', apply: p => { p.buddies = (p.buddies || 0) + 1; } },
  stinger: { name: 'STINGER', desc: 'SHOTS POISON FOES', set: 'bee', unique: true, apply: p => { p.poison = true; } },
  royal: { name: 'ROYAL JELLY', desc: '+1 HEART AND HEAL ONE', apply: p => { p.maxHp = Math.min(20, p.maxHp + 2); p.hp = Math.min(p.maxHp, p.hp + 2); } },
  meteor: { name: 'METEOR BOOTS', desc: 'ROLLING THROUGH FOES HURTS THEM', rare: 1, unique: true, apply: p => { p.meteor = true; } },
  mirror: { name: 'MIRROR', desc: 'BULLETS YOU ROLL THROUGH FLY BACK', rare: 2, unique: true, apply: p => { p.mirror = true; } },
  watch: { name: 'POCKET WATCH', desc: 'ENEMY BULLETS ARE SLOWER', rare: 1, unique: true, apply: p => { p.watch = true; } },
  feather: { name: 'FEATHER', desc: 'MUCH FASTER RUNNING', apply: p => { p.speed *= 1.2; } },
  lens: { name: 'MAGNIFIER', desc: 'SHOTS GROW STRONGER AS THEY FLY', rare: 1, unique: true, apply: p => { p.lens = true; } },
  snow: { name: 'SNOWFLAKE', desc: 'HITS SLOW FOES DOWN', rare: 1, unique: true, apply: p => { p.frost = true; } },
  ember: { name: 'EMBER', desc: 'HITS SET FOES ON FIRE', rare: 1, unique: true, apply: p => { p.burn = true; } },
  sprout2: { name: 'LUCKY SPROUT', desc: 'CLEARED ROOMS DROP COINS', apply: p => { p.sprout = (p.sprout || 0) + 1; } },
  purse: { name: 'FAT PURSE', desc: 'COINS ARE WORTH 50% MORE', rare: 1, unique: true, apply: p => { p.purse = true; } },
  dice: { name: 'LUCKY DICE', desc: 'SOME SHOTS DEAL TRIPLE DAMAGE', apply: p => { p.crit = (p.crit || 0) + 0.1; } },
  prism: { name: 'PRISM', desc: 'SHOTS SPLIT IN THREE ON WALLS', rare: 1, unique: true, apply: p => { p.prism = true; } },
  thorn: { name: 'THORN RING', desc: 'GETTING HIT FIRES A RING OF STARS', apply: p => { p.thorn = (p.thorn || 0) + 1; } },
  phoenix: { name: 'PHOENIX FEATHER', desc: 'ONCE, YOU GET BACK UP WHEN YOU FALL', rare: 2, unique: true, apply: p => { p.phoenix = true; } },
  starmap: { name: 'STAR MAP', desc: 'SHOWS EVERY ROOM, FILLS STARFALL', set: 'star', unique: true, apply: p => { p.charge = 1; if (G.floor) for (const r of G.floor.rooms) r.seen = true; p.starmap = true; } },
  wishbone: { name: 'WISHBONE', desc: 'CHEAPER SHOP AND A FREE POTION', unique: true, apply: p => { p.wish = true; addBelt(p, gpick(POTION_IDS)); } },
  rocket: { name: 'ROCKET SHOTS', desc: 'SHOTS SPEED UP, +1 DAMAGE', apply: p => { p.rocket = true; p.dmg += 1; } },
  split: { name: 'SPLIT SHOT', desc: 'SHOTS SPLIT IN TWO', rare: 2, unique: true, apply: p => { p.split = true; } },
  aura: { name: 'STAR AURA', desc: 'FOES CLOSE TO YOU GET HURT', rare: 1, unique: true, apply: p => { p.aura = true; } },
  bell: { name: 'SLEEPY BELL', desc: 'FOES START EVERY ROOM ASLEEP', rare: 1, unique: true, apply: p => { p.bell = true; } },
  horseshoe: { name: 'HORSESHOE', desc: 'LUCK, AND MORE GOLDEN SLIMES', apply: p => { p.luck += 1; p.horseshoe = true; } },
  heartstone: { name: 'HEART STONE', desc: 'EVERY CLEARED ROOM HEALS YOU A LITTLE', rare: 1, unique: true, apply: p => { p.heartstone = true; } },
});
// Rarity and sets of the first batch.
Object.assign(ITEMS.triple, { rare: 1 }); Object.assign(ITEMS.homing, { rare: 1 }); Object.assign(ITEMS.moon, { rare: 1, set: 'moon' });
Object.assign(ITEMS.firework, { rare: 1 }); Object.assign(ITEMS.honey, { rare: 1, set: 'bee' }); Object.assign(ITEMS.backshot, { rare: 1 });
Object.assign(ITEMS.stardust, { rare: 1, set: 'star' }); Object.assign(ITEMS.shield, { rare: 1 }); Object.assign(ITEMS.big, { set: 'star' });
const RARE_W = [6, 3, 1], RARE_NAME = ['COMMON', 'RARE', 'EPIC'];
const SETS = { moon: 'MOON', bee: 'BEE', star: 'STAR' };

// Sets and the combos of the new items (the book lists them with the others).
SYNERGIES.push(
  { id: 'fullmoon', name: 'FULL MOON', set: 'moon', need: ['moon', 'crescent', 'moonstone'], desc: 'SET: TWO MORE MOONS, TWICE THE BITE', add: p => { p.orbitals += 2; p.moonDmg = (p.moonDmg || 1) * 2; } },
  { id: 'queen', name: "QUEEN'S FAVOR", set: 'bee', need: ['honey', 'beehat', 'stinger'], desc: 'SET: ANOTHER BEE, HONEY EVERY 6 FOES', add: p => { p.buddies = (p.buddies || 0) + 1; p.honeyEvery = 6; } },
  { id: 'supernova', name: 'SUPERNOVA', set: 'star', need: ['big', 'stardust', 'starmap'], desc: 'SET: STARFALL CHARGES TWICE AS FAST', add: p => { p.chargeMul *= 2; p.nova = true; } },
  { id: 'steam', name: 'STEAM', need: ['ember', 'snow'], desc: 'FIRE AND FROST: +1 DAMAGE', add: p => { p.dmg += 1; } },
  { id: 'sharp', name: 'SHARP EYE', need: ['dice', 'lens'], desc: 'EVEN MORE LUCKY HITS', add: p => { p.crit = (p.crit || 0) + 0.1; } },
  { id: 'thornwall', name: 'BRAMBLE WALL', need: ['thorn', 'shield'], desc: 'A POPPED BUBBLE FIRES THORNS', add: p => { p.thornShield = true; } },
  { id: 'jackpot', name: 'JACKPOT', need: ['purse', 'horseshoe'], desc: '+1 LUCK, RICHER GOLDEN SLIMES', add: p => { p.luck += 1; p.jackpot = true; } },
);

// ---------- Helpers ----------
const teamHas = (flag) => G.players.some(p => p[flag] && !p.dead);

// ---------- Shots ----------
// Damage of one hit (LUCKY DICE: a critical hit now and then).
function shotHitDmg(s) {
  const p = s.own;
  if (p && p.crit && grand() < p.crit) { burst(s.x, s.y, 6, ['Y', 'w', 'y'], 80, 0.3); return s.dmg * 3; }
  return s.dmg;
}
// What a hit does besides damage.
function itemOnHit(s, e) {
  const p = s.own;
  if (!p || e.dead) return;
  if (p.poison) e.poisonT = 3;
  if (p.burn) e.burnT = 2;
  if (p.frost) e.slowT = 1.2;
}
// Per-frame shot rules: ROCKET SHOTS speed up, MAGNIFIER grows stronger, SPLIT SHOT splits once.
function itemShotMove(s, dt) {
  const p = s.own;
  if (!p || s.mini) return;
  if (p.rocket && s.kind !== 'boomer') { const k = 1 + dt * 1.4, sp = Math.hypot(s.vx, s.vy); if (sp < 420) { s.vx *= k; s.vy *= k; } }
  if (p.lens) { s.dmg *= 1 + dt * 0.9; if (s.t > 0.35 && s.kind === 'wand') { s.big = true; s.r = 4; } }
  if (p.split && !s.splitDone && s.t > 0.18 && s.kind !== 'boomer' && SHOTS.length < 240) {
    s.splitDone = true;
    const a = Math.atan2(s.vy, s.vx), sp = Math.hypot(s.vx, s.vy);
    for (const d of [-0.22, 0.22]) {
      const m = newShot(s.x, s.y, a + d, sp, s.life, s.dmg * 0.6, s.kind, p);
      Object.assign(m, { big: s.big, r: s.r, bounce: s.bounce, pierce: s.pierce, homing: s.homing, fw: s.fw, tint: s.tint, trail: s.trail, splitDone: true, prismDone: s.prismDone });
      SHOTS.push(m);
    }
    s.life = 0.001; s.silent = true;
  }
}
// PRISM: a shot that hits a wall splits into three.
function itemWall(s) {
  const p = s.own;
  if (!p || !p.prism || s.mini || s.prismDone || s.kind === 'boomer' || SHOTS.length > 240) return;
  s.prismDone = true;
  const a = Math.atan2(-s.vy, -s.vx), sp = Math.hypot(s.vx, s.vy);
  for (const d of [-0.5, 0, 0.5]) {
    const m = newShot(s.x - s.vx * 0.02, s.y - s.vy * 0.02, a + d, sp * 0.9, 0.5, s.dmg * 0.5, 'wand', p);
    m.prismDone = true; m.splitDone = true; m.tint = 'c'; m.trail = true;
    SHOTS.push(m);
  }
}
// POCKET WATCH: enemy bullets fly slower while any hero has it.
const bulletSlow = () => (teamHas('watch') ? 0.82 : 1);
// FAT PURSE: every coin counts 1.5 (the half coins add up).
function purseCoins(n) {
  if (!teamHas('purse')) return n;
  G.run.purse = (G.run.purse || 0) + n * 0.5;
  const k = Math.floor(G.run.purse);
  G.run.purse -= k;
  return n + k;
}
// WISHBONE: the frog's prices drop a quarter.
const wishDiscount = () => (teamHas('wish') ? 0.75 : 1);

// ---------- Heroes ----------
// Runs on the host for every hero, every frame.
function itemTick(p, dt) {
  // BEE HAT: little bees buzz around and sting the nearest foe
  if (p.buddies) {
    p.buddyT = (p.buddyT || 0) - dt;
    if (p.buddyT <= 0) {
      let best = null, bd = 120;
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0 || e.ghost || e.passive) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < bd) { bd = d; best = e; }
      }
      p.buddyT = best ? 1.1 / p.buddies : 0.3;
      if (best) {
        const o = buddyPos(p, Math.floor(G.time * 3) % p.buddies);
        const s = newShot(o.x, o.y, Math.atan2(best.y - best.h / 2 - o.y, best.x - o.x), 190, 0.8, p.dmg * 0.55, 'wand', p);
        s.tint = 'h'; s.r = 2; s.mini = false; s.trail = true;
        SHOTS.push(s);
      }
    }
  }
  // STAR AURA: foes close to the hero take a little damage every second
  if (p.aura) {
    p.auraT = (p.auraT || 0) - dt;
    if (p.auraT <= 0) {
      p.auraT = 0.8;
      for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && !e.passive && Math.hypot(e.x - p.x, (e.y - p.y) * 1.2) < 38) hurtEnemy(e, 1 + p.dmg * 0.25, p.x, p.y - 6, true, p);
    }
    if (Math.random() < 0.2) { const a = Math.random() * 6.28; part(p.x + Math.cos(a) * 30, p.y - 6 + Math.sin(a) * 20, 0, -10, 0.4, 'Y', { drag: 1 }); }
  }
  // METEOR BOOTS: a roll hurts every foe it passes through (once per roll)
  if (p.meteor && p.dashT > 0) {
    if (p.meteorN !== p.dashN) { p.meteorN = p.dashN; p.meteorHit = []; }
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.passive || p.meteorHit.includes(e)) continue;
      if (Math.hypot(e.x - p.x, e.y - e.h / 2 - (p.y - 6)) < e.r + 8) { p.meteorHit.push(e); hurtEnemy(e, 3 + p.dmg, p.x, p.y, false, p); burst(e.x, e.y - 6, 8, ['O', 'y', 'R'], 90, 0.35); }
    }
  }
}
const _bp = { x: 0, y: 0 };
function buddyPos(p, i) {
  const a = -G.time * 2.4 + i * Math.PI * 2 / Math.max(1, p.buddies);
  _bp.x = p.x + Math.cos(a) * 18; _bp.y = p.y - 16 + Math.sin(a) * 6;
  return _bp;
}
function drawBuddies(p, ox, oy) {
  if (!p.buddies || p.dead || p.down) return;
  for (let i = 0; i < p.buddies; i++) {
    const o = buddyPos(p, i);
    drawFeet(S('pet_bee_' + (Math.floor(G.time * 14 + i) % 2)), ox + o.x, oy + o.y + 4, Math.cos(-G.time * 2.4 + i) > 0 ? 0 : 1);
  }
}
// THORN RING: getting hit fires a ring of stars.
function thornRing(p) {
  const n = 8 + 4 * ((p.thorn || 1) - 1);
  for (let i = 0; i < n; i++) {
    const s = newShot(p.x, p.y - 8, i * Math.PI * 2 / n, 170, 0.6, 1.5 + p.dmg * 0.5, 'wand', p);
    s.tint = 'h'; s.trail = true;
    SHOTS.push(s);
  }
  burst(p.x, p.y - 8, 10, ['G', 'h', 'H'], 90, 0.4);
}
function itemHurt(p) { if (p.thorn) thornRing(p); }
// PHOENIX FEATHER: the first fall of the run is undone.
function itemSaveLife(p) {
  if (!p.phoenix) return false;
  p.phoenix = false;
  p.hp = Math.min(p.maxHp, 4); p.inv = 2.2;
  burst(p.x, p.y - 10, 30, ['O', 'y', 'Y', 'R'], 140, 0.9, { g: -60 });
  G.flashT = 0.08; G.shake = Math.max(G.shake, 5);
  Audio_.sfx('ult');
  say(p, 'PHOENIX FEATHER!');
  const i = p.items.indexOf('phoenix');
  if (i >= 0) p.items.splice(i, 1);
  return true;
}
// MIRROR: a bullet rolled through flies back as a hero shot.
function itemGraze(p, b) {
  if (!p.mirror || b.soft) return;
  let best = null, bd = 200;
  for (const e of G.enemies) { if (e.dead || e.spawnT > 0 || e.passive) continue; const d = Math.hypot(e.x - b.x, e.y - b.y); if (d < bd) { bd = d; best = e; } }
  const a = best ? Math.atan2(best.y - best.h / 2 - b.y, best.x - b.x) : Math.atan2(-b.vy, -b.vx);
  const s = newShot(b.x, b.y, a, 220, 1, 2 + p.dmg, 'wand', p);
  s.tint = 'c'; s.trail = true;
  SHOTS.push(s);
  b.life = 0;
}

// ---------- Foes: poison, fire, frost and sleep ----------
// Returns the foe's speed factor for this frame (0 while asleep).
function enemyStatus(e, dt) {
  if (e.poisonT > 0) {
    e.poisonT -= dt;
    if ((e.poisonTick = (e.poisonTick || 0) - dt) <= 0) { e.poisonTick = 0.5; hurtEnemy(e, 0.6, e.x, e.y - e.h / 2, true, null); }
  }
  if (e.burnT > 0) {
    e.burnT -= dt;
    if ((e.burnTick = (e.burnTick || 0) - dt) <= 0) { e.burnTick = 0.4; hurtEnemy(e, 0.8, e.x, e.y - e.h / 2, true, null); }
  }
  if (e.slowT > 0) e.slowT -= dt;
  if (e.sleepT > 0) { e.sleepT -= dt; return 0; }
  return (e.slowT > 0 ? 0.55 : 1) * (e.affix ? affixTick(e, dt) : 1);
}
// Little signs of a foe's state (drawn on every screen).
function drawEnemyStatus(e, ox, oy) {
  const x = ox + e.x, y = oy + e.y - e.h - 4, f = Math.floor(G.time * 6);
  if (e.sleepT > 0) text(f % 4 < 2 ? 'Z' : 'Z Z', x + 6, y - 2 - (f % 4), 'c', 1, 1);
  if (e.burnT > 0 && f % 2) rect(Math.round(x + ((f * 7) % 9) - 4), Math.round(y + 6), 1, 2, f % 4 ? 'O' : 'y');
  if (e.poisonT > 0 && f % 3 === 0) rect(Math.round(x + ((f * 5) % 11) - 5), Math.round(y + 4), 2, 2, 'h');
  if (e.slowT > 0 && f % 2 === 0) rect(Math.round(x + ((f * 3) % 7) - 3), Math.round(y + 8), 1, 1, 'C');
}

// ---------- Rooms ----------
// SLEEPY BELL: a room's foes start asleep.
function itemRoomStart() {
  if (!teamHas('bell')) return;
  for (const e of G.enemies) if (!e.boss) e.sleepT = 1.6 + grand() * 0.6;
}
// A room is cleared: LUCKY SPROUT coins, HEART STONE healing, charms recharge.
function itemRoomClear(x, y) {
  for (const p of G.players) {
    if (p.dead) continue;
    if (p.sprout) for (let i = 0; i < 3 * p.sprout; i++) spawnPickup('coin', x + grnd(-8, 8), y);
    if (p.heartstone && p.hp < p.maxHp && !p.down) { healPlayer(p, 1); burst(p.x, p.y - 10, 8, ['P', 'q', 'w'], 60, 0.5, { g: -30 }); }
    if (p.charmCd) for (const k in p.charmCd) if (p.charmCd[k] > 0) p.charmCd[k]--;
  }
}
// BRAMBLE WALL: a popped bubble fires thorns too.
function itemShieldPop(p) { if (p.thornShield) thornRing(p); }

// ---------- Charms: belt items that stay and recharge as rooms are cleared ----------
function useCharm(p, kind) {
  const C = POTIONS[kind];
  if (!p.charmCd) p.charmCd = {};
  if (p.charmCd[kind] > 0) { if (p === G.player) { Audio_.sfx('deny'); toast(C.name + ': ' + p.charmCd[kind] + (p.charmCd[kind] > 1 ? ' ROOMS' : ' ROOM') + ' TO RECHARGE'); } return; }
  if (kind === 'charmheal') { if (p.hp >= p.maxHp) { if (p === G.player) Audio_.sfx('deny'); return; } healPlayer(p, 2); Audio_.sfx('heart'); }
  else if (kind === 'charmshield') { p.shieldUp = true; Audio_.sfx('shield'); }
  p.charmCd[kind] = C.rooms;
  say(p, C.name + '!');
  burst(p.x, p.y - 10, 14, kind === 'charmheal' ? ['P', 'q', 'w'] : ['C', 'c', 'w'], 90, 0.6, { g: -40 });
  youFx(p, 'potion', kind);
}
