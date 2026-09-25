'use strict';
// Run modifiers: the twist of a daily or weekly run (and later land modifiers and Star
// Trials). A modifier can scale the difficulty numbers (hp, count, elite, pace, bullet),
// change every hero (player), or switch on a special rule that the game code checks with
// modOn(id): windy shots, a dark night, bouncing enemy bullets, double coins.
const MODS = {
  windy: { name: 'WINDY', desc: 'THE WIND PUSHES YOUR SHOTS' },
  night: { name: 'NIGHT', desc: 'ONLY A LITTLE LIGHT AROUND YOU' },
  echo: { name: 'ECHO', desc: 'ENEMY BULLETS BOUNCE OFF WALLS ONCE' },
  swift: { name: 'SWIFT FOES', desc: 'FOES AND BULLETS ARE FASTER', pace: 1.2, bullet: 1.1 },
  crowd: { name: 'CROWD', desc: 'MORE FOES IN EVERY ROOM', count: 2 },
  glowing: { name: 'GLOWING', desc: 'MANY MORE ELITES', elite: 0.15 },
  rich: { name: 'GOLD RUSH', desc: 'EVERY COIN COUNTS TWICE' },
  giants: { name: 'GIANTS', desc: 'FOES HAVE 50% MORE HEALTH', hp: 1.5 },
  glass: { name: 'GLASS HEARTS', desc: 'TWO HEARTS, BUT 50% MORE DAMAGE', player: (p) => { p.maxHp = 4; p.hp = 4; p.dmg *= 1.5; } },
  bouncy: { name: 'BOUNCY', desc: 'ALL SHOTS BOUNCE TWICE', player: (p) => { p.bounce += 2; } },
  quick: { name: 'QUICK HANDS', desc: 'EVERYONE SHOOTS 30% FASTER', player: (p) => { p.fireDelay *= 0.7; } },
  starry: { name: 'STARRY', desc: 'STARFALL CHARGES TWICE AS FAST', player: (p) => { p.chargeMul *= 2; } },
};
const modOn = (id) => !!(G.mods && G.mods.includes(id));
// The difficulty numbers with the run's modifiers folded in (DIFF() returns this).
function modDiff(base, mods) {
  const d = Object.assign({}, base);
  for (const id of mods) {
    const m = MODS[id];
    if (!m) continue;
    if (m.hp) d.hp *= m.hp;
    if (m.pace) d.pace *= m.pace;
    if (m.bullet) d.bullet *= m.bullet;
    if (m.count) d.count += m.count;
    if (m.elite) d.elite += m.elite;
  }
  return d;
}
function setMods(mods) {
  G.mods = (mods || []).filter(id => MODS[id]);
  G.diffX = G.mods.length ? modDiff(DIFFS[G.diff], G.mods) : null;
}
function applyMods(p) { for (const id of G.mods || []) if (MODS[id].player) MODS[id].player(p); }
const coinMul = () => (modOn('rich') ? 2 : 1);

// WINDY: each room has its own wind; shots drift and leaves blow across the floor.
function roomWind() { G.wind = modOn('windy') ? (grand() < 0.5 ? -1 : 1) * grnd(45, 70) : 0; }
function windFx() {
  if (!G.wind || Math.random() > 0.35) return;
  const x = G.wind > 0 ? 4 : VW - 4;
  part(x, grnd(60, 200), G.wind * rnd(1.4, 2.2), rnd(-6, 6), rnd(1.6, 2.6), pick(['h', 'H', 'w']), { drag: 1, size: Math.random() < 0.3 ? 2 : 1 });
}

// NIGHT: everything is dark except a pool of light around each hero and each shot.
let _night = null;
function drawNight(ox, oy) {
  if (!modOn('night') && !bossDark() && !(modOn('t_dusk') && G.floor.depth % 3 === 2)) return;
  if (!_night || _night.width !== SCR.w || _night.height !== SCR.h) { _night = document.createElement('canvas'); _night.width = SCR.w; _night.height = SCR.h; }
  const g = _night.getContext('2d');
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, SCR.w, SCR.h);
  g.fillStyle = 'rgba(43,26,71,0.86)';
  g.fillRect(0, 0, SCR.w, SCR.h);
  g.globalCompositeOperation = 'destination-out';
  // light pools in two hard steps (no smooth gradients: this is pixel art)
  const hole = (x, y, r) => {
    const R = r + (r > 12 ? 10 : 3);
    g.globalAlpha = 0.5; g.drawImage(ellipseSprite(R * 2, Math.round(R * 1.6), '0'), Math.round(x - R), Math.round(y - R * 0.8));
    g.globalAlpha = 1; g.drawImage(ellipseSprite(r * 2, Math.round(r * 1.6), '0'), Math.round(x - r), Math.round(y - r * 0.8));
  };
  for (const p of G.players) if (!p.dead) hole(SCR.ox + ox + p.x, SCR.oy + oy + p.y - 8, 44);
  for (const s of SHOTS) if (!s.mini) hole(SCR.ox + ox + s.x, SCR.oy + oy + s.y, 7);
  // enemy bullets glow a little, so the dark is never unfair
  for (const b of EBULLETS) if (b.life > 0) hole(SCR.ox + ox + b.x, SCR.oy + oy + b.y, 5);
  // foes show as dim shapes
  g.globalAlpha = 0.35;
  for (const e of G.enemies) if (!e.dead) { const r = e.r + 6; g.drawImage(ellipseSprite(r * 2, Math.round(r * 1.6), '0'), Math.round(SCR.ox + ox + e.x - r), Math.round(SCR.oy + oy + e.y - e.h / 2 - r * 0.8)); }
  g.globalAlpha = 1;
  for (const o of G.room.props) if (o.kind === 'portal' || o.kind === 'frog') hole(SCR.ox + ox + o.x, SCR.oy + oy + o.y - 10, 26);
  // a boss glows faintly in its own dark
  if (G.boss && !G.boss.dead) hole(SCR.ox + ox + G.boss.x, SCR.oy + oy + G.boss.y - G.boss.h / 2 - (G.boss.z || 0), 16);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(_night, 0, 0);
  ctx.restore();
}
