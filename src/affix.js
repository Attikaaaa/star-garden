'use strict';
// Elite affixes (every glowing foe gets one twist) and the nemesis: whatever defeated you
// comes back in a later run wearing a crown, with a bounty on its head.

// ---------- Elite affixes ----------
const AFFIXES = {
  shield: { name: 'SHIELDED', col: 'c' },   // the first three hits only pop its bubble
  split: { name: 'SPLITTING', col: 'h' },   // falls apart into two little slimes
  hasty: { name: 'HASTY', col: 'Y' },       // moves and shoots much faster
  mend: { name: 'MENDING', col: 'h' },      // heals itself when left alone for a moment
  bomber: { name: 'BOMBER', col: 'R' },     // bursts into a ring of bullets
  blink: { name: 'BLINKING', col: 'P' },    // hops to a new spot now and then
};
const AFFIX_IDS = Object.keys(AFFIXES);
// Co-op: clients draw these too.
const EF_EXTRA = ['affix', 'shieldHp', 'grudge', 'burnT', 'slowT', 'poisonT', 'sleepT'];
const hasAffix = (e, id) => e.affix === id || e.affix2 === id;
function rollAffix(e) {
  if (!e.elite || e.boss || e.type === 'gold' || e.type === 'dummy') return;
  e.affix = gpick(AFFIX_IDS);
  // Star Trial: elites have a second affix
  if (modOn('t_affix2')) { e.affix2 = gpick(AFFIX_IDS.filter(a => a !== e.affix)); if (e.affix2 === 'shield') e.shieldHp = 3; if (e.affix2 === 'blink') e.blinkT = 3; }
  if (e.affix === 'shield') e.shieldHp = 3;
  if (e.affix === 'blink') e.blinkT = grnd(2.5, 4);
}
// Absorbs a hit (SHIELDED); true when the hit did nothing.
function affixBlock(e, fx, fy) {
  if (!(e.shieldHp > 0)) return false;
  e.shieldHp--;
  burst(fx, fy, 5, ['C', 'c', 'w'], 60, 0.25);
  if (!e.shieldHp) { burst(e.x, e.y - e.h / 2, 14, ['C', 'c', 'w'], 90, 0.4); Audio_.sfx('shield'); }
  return true;
}
// Speed factor and ongoing effects, every frame on the host.
function affixTick(e, dt) {
  // only after two seconds without a hit: steady fire always wins, however tough it is
  if (hasAffix(e, 'mend') && e.hp < e.maxHp && !(G.time - e.hurtAt < 2)) {
    e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.05 * dt);
    if (Math.random() < 0.05) part(e.x + rnd(-5, 5), e.y - e.h + rnd(0, 4), 0, -20, 0.5, 'h', { drag: 1 });
  }
  if (hasAffix(e, 'blink') && e.spawnT <= 0 && (e.blinkT -= dt) <= 0) {
    e.blinkT = grnd(3, 4.5);
    const p = nearestHero(e.x, e.y);
    if (p) {
      for (let k = 0; k < 12; k++) {
        const x = p.x + grnd(-90, 90), y = p.y + grnd(-60, 60);
        if (Math.hypot(x - p.x, y - p.y) > 50 && x > 30 && x < VW - 30 && y > 60 && y < 196 && !boxSolid(G.room, x, y, e.hw, e.hh, e.fly ? 'fly' : 'enemy')) {
          poof(e.x, e.y - e.h / 2); e.x = x; e.y = y; poof(x, y - e.h / 2); Audio_.sfx('tele');
          break;
        }
      }
    }
  }
  return hasAffix(e, 'hasty') ? 1.4 : 1;
}
// When an elite falls.
function affixDeath(e) {
  if (hasAffix(e, 'split')) {
    for (let i = 0; i < 2; i++) { const m = spawnEnemy('mini', e.x + (i ? 6 : -6), e.y, { instant: true }); m.state = 'idle'; m.t = 0.5; }
  }
  if (hasAffix(e, 'bomber')) {
    E_SRC = e.type;
    ring(e.x, e.y - e.h / 2, 8, 58, 'orange', grand());
    Audio_.sfx('boom');
  }
}
// Every affixed elite wears a coloured pip; the one closest to our hero also shows its name.
function drawAffix(e, ox, oy) {
  if (!e.affix || e.dead || e.spawnT > 0) return;
  const A = AFFIXES[e.affix], z = Math.round(e.z || 0), x = Math.round(ox + e.x), y = Math.round(oy + e.y - e.h - z);
  if (e.shieldHp > 0) { const r = ringSprite(Math.max(8, e.r + 3), Math.floor(G.time * 8) % 2 ? 'c' : 'C'); ctx.drawImage(r, Math.round(ox + e.x - r.width / 2), Math.round(oy + e.y - e.h / 2 - r.height / 2 - z)); }
  rect(x - 2, y - 5, 4, 3, '0'); rect(x - 1, y - 4, 2, 1, A.col);
  const p = G.player;
  if (e.affix2) { const B = AFFIXES[e.affix2]; rect(x + 2, y - 5, 4, 3, '0'); rect(x + 3, y - 4, 2, 1, B.col); }
  if (p && G.affixNear === e) text(A.name + (e.affix2 ? ' + ' + AFFIXES[e.affix2].name : ''), x, y - 13, A.col, 2, 1);
}
// Which elite gets its name shown this frame (the nearest one within reach).
function pickAffixNear() {
  const p = G.player;
  let best = null, bd = 80;
  if (p) for (const e of G.enemies) { if (!e.affix || e.dead) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
  G.affixNear = best;
}

// ---------- Nemesis ----------
// Save.nemesis: { t: foe type, n: how many times it won }.
const nemesisType = (t) => (t === 'mini' ? 'slime' : t);
onNote((ev, a) => {
  if (ev !== 'end' || a.won || a.daily || a.mode !== 'adv' || NET.role) return;
  const k = G.player && G.player.lastHit, t = k && nemesisType(k);
  if (!t || !EDEF[t] || EDEF[t].boss || EDEF[t].practice || t === 'gold') { G.nemesisLine = ''; return; }
  const N = Save.nemesis;
  Save.nemesis = { t, n: N && N.t === t ? Math.min(5, N.n + 1) : 1 };
  G.nemesisLine = 'THAT ' + foeName(t) + ' WILL BE BACK. THERE IS A BOUNTY ON IT!';
  Save.write();
});
// In a later adventure: once per run, in a room of a land where it lives.
function spawnNemesis(room) {
  const N = Save.nemesis;
  if (!N || G.run.nemesis || G.daily || NET.role === 'client' || room.type !== 'normal' || room.dist < 1) return;
  if (!G.floor.land.pool.some(([t]) => t === N.t)) return;
  const spots = room.slots.filter(s => G.players.every(p => Math.hypot(s[0] - p.x, s[1] - p.y) > 90));
  if (!spots.length) return;
  G.run.nemesis = true;
  const [x, y] = gpick(spots), e = spawnEnemy(N.t, x, y, { elite: true });
  e.grudge = N.n; e.affix = null; e.shieldHp = 0;
  e.hp *= 1.5 + 0.5 * N.n; e.maxHp = e.hp;
  G.banner = { title: 'YOUR NEMESIS!', sub: 'THE ' + foeName(N.t) + ' THAT GOT YOU IS HERE. BOUNTY: ' + nemesisBounty(N.n) + ' VAULT', t: 2.8, icon: null };
  Audio_.sfx('roar');
}
const nemesisBounty = (n) => 10 + 5 * n;
function nemesisDeath(e) {
  if (!e.grudge) return;
  const n = e.grudge;
  earnVault(nemesisBounty(n));
  toast('NEMESIS DEFEATED! +' + nemesisBounty(n) + ' VAULT');
  burst(e.x, e.y - 10, 24, ['Y', 'y', 'w', 'P'], 140, 0.8, { g: -40 });
  Audio_.sfx('clear');
  noteTeam('nemesis', e.type);
  Save.nemesis = null; Save.write();
}
function drawGrudge(e, ox, oy) {
  if (!e.grudge || e.dead) return;
  const s = S('crown_s'), bob = Math.floor(G.time * 3) % 2;
  drawS(s, ox + e.x - (s.w >> 1), oy + e.y - e.h - Math.round(e.z || 0) - s.h - 1 - bob);
}
