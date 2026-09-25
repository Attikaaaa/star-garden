'use strict';
// The four heroes. Every hero can use every wand; each has its own stats, its own move
// (what the roll button does) and its own ult (what a full Star meter does).
const HEROES = {
  pip: { name: 'PIP', title: 'THE STAR WIZARD', desc: 'BALANCED. ROLLS, CASTS STARFALL', move: 'roll', ult: 'starfall', how: '' },
  luma: { name: 'LUMA', title: 'THE MOON WITCH', desc: 'TWO MOONS. BLINKS. ULT: ECLIPSE', move: 'blink', ult: 'eclipse', how: 'BEAT THE CRYSTAL GOLEM',
    apply: (p) => { p.orbitals += 2; } },
  coral: { name: 'CORAL', title: 'THE SEA SPRITE', desc: 'FAST, FRAGILE, BUBBLE DASH. ULT: TIDAL WAVE', move: 'bubble', ult: 'wave', how: 'BEAT THE GIANT CRAB',
    apply: (p) => { p.speed *= 1.15; p.maxHp = Math.max(2, p.maxHp - 2); p.hp = p.maxHp; p.dashCd *= 0.8; } },
  bramble: { name: 'BRAMBLE', title: 'THE FROG KNIGHT', desc: 'STURDY, LEAPS OVER WATER. ULT: BIG CROAK', move: 'leap', ult: 'croak', how: "FINISH THE FROG'S FRIEND",
    apply: (p) => { p.maxHp += 2; p.hp = p.maxHp; p.speed *= 0.9; } },
};
const HERO_IDS = Object.keys(HEROES);
const heroOf = (p) => HEROES[p && p.hero] || HEROES.pip;
// Sprite names: Pip is 'hero_*', the others use their id.
const heroPre = (h) => (h && h !== 'pip' && HEROES[h] ? h : 'hero') + '_';
function applyHero(p, id) {
  p.hero = HEROES[id] ? id : 'pip';
  const H = HEROES[p.hero];
  if (H.apply) H.apply(p);
}
const heroUnlocked = (id) => id === 'pip' || Save.unl.heroes.includes(id);
function unlockHero(id) {
  if (heroUnlocked(id)) return;
  Save.unl.heroes.push(id);
  addBadge('wardrobe');
  G.bannerNext = { title: 'A NEW HERO: ' + HEROES[id].name + '!', sub: HEROES[id].title + ' JOINS YOU. PICK THEM BEFORE A RUN', t: 3, icon: null };
  logNews('unlock', 'NEW HERO: ' + HEROES[id].name, heroPre(id) + 'd0');
  Save.write();
}
onNote((ev, a) => {
  if (ev !== 'boss') return;
  if (a === 'golem') unlockHero('luma');
  if (a === 'bcrab') unlockHero('coral');
});

// ---------- Moves (run where the hero is controlled) ----------
// Luma's blink: a short hop through space in the direction she moves.
function heroBlink(p) {
  const room = G.room;
  let x = p.x, y = p.y;
  for (let d = 4; d <= 48; d += 4) {
    const nx = p.x + p.dx * d, ny = p.y + p.dy * d;
    if (boxSolid(room, nx, ny, p.hw, p.hh, 'player')) break;
    x = nx; y = ny;
  }
  poof(p.x, p.y - 8);
  for (let i = 0; i < 6; i++) part(p.x + (x - p.x) * i / 6, p.y - 8 + (y - p.y) * i / 6, 0, -10, 0.35, i % 2 ? '3' : 'w', { drag: 1 });
  p.x = x; p.y = y; p.tpN++;
  poof(x, y - 8);
  p.dashT = 0.08; // a sliver of rolling, so a bullet on the way still counts as a graze
  p.inv = Math.max(p.inv, 0.35);
}
// Collision mode while the hero moves: Bramble's leap sails over water and pits.
const heroMoveMode = (p) => (p.dashT > 0 && heroOf(p).move === 'leap' ? 'shot' : 'player');
// Bramble's leap lasts until he is back on solid ground.
function heroLeapEnd(p, dt) {
  if (heroOf(p).move !== 'leap') return;
  if (p.dashT > 0) { p.leapZ = Math.sin(Math.min(1, 1 - p.dashT / 0.3) * Math.PI) * 8; return; }
  p.leapZ = 0;
  if (boxSolid(G.room, p.x, p.y, p.hw, p.hh, 'player')) p.dashT = dt * 2; // still over water: keep flying
}
// Coral's dash leaves a bubble shield behind (once every few seconds). Host side.
function heroTick(p, dt) {
  if (heroOf(p).move === 'bubble') {
    p.bubCd = (p.bubCd || 0) - dt;
    if (p.dashN !== p.bubN) { p.bubN = p.dashN; if (p.bubCd <= 0 && !p.shieldUp) { p.shieldUp = true; p.bubCd = 5; burst(p.x, p.y - 8, 10, ['C', 'c', 'w'], 60, 0.4); Audio_.sfx('bubble'); } }
  }
}

// ---------- Ults (a full Star meter) ----------
function heroUlt(p) {
  const U = heroOf(p).ult;
  p.charge = 0; p.inv = Math.max(p.inv, 1);
  youFx(p, 'starfall');
  G.flashT = 0.08; G.shake = Math.max(G.shake, 4);
  if (U === 'eclipse') {
    // Eclipse: every bullet goes out, every foe is stunned and slowed, and takes a hit
    for (const b of EBULLETS) if (b.life > 0) { b.life = 0; part(b.x, b.y, 0, 0, 0.3, null, { spr: 'sparkle', drag: 1 }); }
    for (const e of G.enemies) if (!e.dead && e.spawnT <= 0) { e.slowT = 4; if (!e.boss) e.sleepT = 1.2; hurtEnemy(e, 4 + p.dmg * 1.5, e.x, e.y - e.h / 2, true, p); }
    for (let i = 0; i < 40; i++) part(grnd(20, VW - 20), grnd(50, 200), 0, -20, 0.8, pick(['1', '2', '3', 'Y']), { drag: 1, size: 2 });
    Audio_.sfx('ult');
  } else if (U === 'wave') {
    // Tidal Wave: a wave rolls across the room, hurting and pushing every foe
    G.tide = { t: 0, own: p, dir: p.flip ? -1 : 1, hit: [] };
    for (const b of EBULLETS) if (b.life > 0) b.life = 0;
    Audio_.sfx('bubble'); Audio_.sfx('boom');
  } else if (U === 'croak') {
    // Big Croak: nearby bullets turn into coins, nearby foes are blown back
    let n = 0;
    for (const b of EBULLETS) if (b.life > 0 && Math.hypot(b.x - p.x, b.y - p.y) < 110) { b.life = 0; if (n++ < 20) spawnPickup('coin', b.x, b.y); }
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < 80) { hurtEnemy(e, 5 + p.dmg * 2, p.x, p.y, true, p); if (!e.boss) { e.kx = (e.x - p.x) / (d || 1) * 260; e.ky = (e.y - p.y) / (d || 1) * 260; } }
    }
    for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; part(p.x, p.y - 8, Math.cos(a) * (80 + r * 40), Math.sin(a) * (60 + r * 30), 0.5, r ? 'h' : 'G', { drag: 0.9, size: 2 }); }
    Audio_.sfx('roar'); hapticAll('slam');
  }
}
function updateTide(dt) {
  const T = G.tide;
  if (!T) return;
  T.t += dt;
  const x = T.dir > 0 ? -20 + T.t * 420 : VW + 20 - T.t * 420;
  for (const e of G.enemies) {
    if (e.dead || e.spawnT > 0 || T.hit.includes(e) || Math.abs(e.x - x) > 14) continue;
    T.hit.push(e);
    hurtEnemy(e, 6 + T.own.dmg * 2, x, e.y, true, T.own);
    if (!e.boss) e.kx = T.dir * 240;
  }
  if (Math.random() < 0.9) for (let i = 0; i < 4; i++) part(x + rnd(-6, 6), rnd(50, 200), T.dir * 60, -rnd(10, 40), 0.4, pick(['C', 'c', 'w', 'B']), { drag: 0.9, size: 2 });
  if (T.t > 1.1) G.tide = null;
}
