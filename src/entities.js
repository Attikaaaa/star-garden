'use strict';
// Player, shots, pickups, particles and room props (pedestals, merchant, portal).

// ---------- Particles (pooled) ----------
const PARTS = [];
function part(x, y, vx, vy, life, key, opts) {
  let p = null;
  for (let i = 0; i < PARTS.length; i++) if (PARTS[i].life <= 0) { p = PARTS[i]; break; }
  if (!p) { if (PARTS.length > 400) return; p = {}; PARTS.push(p); }
  p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.key = key;
  p.g = opts && opts.g || 0; p.spr = opts && opts.spr || null; p.size = opts && opts.size || 1;
  p.drag = opts && opts.drag !== undefined ? opts.drag : 0.9;
}
function burst(x, y, n, keys, speed, life, opts) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
    part(x, y, Math.cos(a) * s, Math.sin(a) * s * 0.7, life * (0.6 + Math.random() * 0.5), keys[i % keys.length], opts);
  }
}
// Ground dust kicked up by landings, rolls and slams (tinted like the floor).
function dust(x, y, n, w) {
  const c = THEMES[G.floor ? G.floor.theme : 'meadow'];
  for (let i = 0; i < n; i++) {
    const s = i % 2 ? 1 : -1;
    part(x + rnd(-w, w) / 2, y - rnd(0, 2), s * rnd(20, 50), -rnd(5, 18), rnd(0.25, 0.45), i % 3 ? c['3'] : 'w', { size: i % 4 ? 1 : 2, drag: 0.88 });
  }
}
function poof(x, y) { part(x, y, 0, 0, 0.3, null, { spr: 'poof', drag: 1 }); }
function updateParts(dt) {
  for (const p of PARTS) {
    if (p.life <= 0) continue;
    p.life -= dt;
    p.vy += p.g * dt;
    p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60);
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
}
const POOF = ['poof_0', 'poof_1', 'poof_2'];
function drawParts(ox, oy) {
  for (const p of PARTS) {
    if (p.life <= 0) continue;
    if (p.spr === 'poof') {
      const f = Math.min(2, Math.floor((1 - p.life / p.max) * 3));
      drawS(S(POOF[f]), ox + p.x - 5, oy + p.y - 5);
    } else if (p.spr === 'sparkle') {
      drawS(S(p.life / p.max > 0.5 ? 'sparkle_0' : 'sparkle_1'), ox + p.x - 1, oy + p.y - 1);
    } else {
      rect(ox + p.x, oy + p.y, p.size, p.size, p.key);
    }
  }
}

// ---------- Players ----------
// Up to four heroes. G.player is the one this device controls; the others are driven by
// the network (p.remote on the host). Each hero reads its controls from p.in.
// Robes the player picks: sprite suffix, name and the colour of their name tag.
const ROBES = ['SKY', 'ROSE', 'MINT', 'PLUM', 'SUN', 'CORAL', 'SEA', 'SNOW'];
const SKIN = ROBES.map((r, k) => (k ? '#' + k : '')), TAG_COL = ['c', 'P', 'h', '3', 'Y', 'R', 'T', 'w'];
const newInput = () => ({ mx: 0, my: 0, ax: 0, ay: 0, aim: false, pad: false, dash: false, star: false, belt: -1, use: false });
function newPlayer(pid) {
  return {
    pid: pid || 0, x: 192, y: 130, hw: 5, hh: 5, face: 'd', flip: false, walkT: 0, moving: false,
    hp: 6, maxHp: 6, speed: 88, dmg: 2, fireDelay: 0.27, shotSpeed: 210, range: 150, shots: 1,
    bounce: 0, pierce: 0, homing: 0, orbitals: 0, fireworks: 0, luck: 0,
    magnet: false, honey: false, backshot: false, stardust: false, shield: false, shieldUp: false, bigShot: false,
    dashCd: 0.7, dashT: 0, dashCool: 0, dx: 0, dy: 1, inv: 0, cool: 0, items: [], honeyN: 0,
    dead: false, deadT: 0, orbitHit: new Map(), dustT: 0, charge: 0, chargeMul: 1, hurtT: 0,
    wand: 'wand', belt: [], beltMax: 2, buff: { regen: 0, haste: 0, power: 0, guard: 0 }, regenT: 0,
    in: newInput(), down: false, revive: 0, kills: 0, dashN: 0, tpN: 0, remote: false,
    name: 'P' + ((pid || 0) + 1), skin: (pid || 0) % ROBES.length,
  };
}
// The chosen wand scales the base stats before any item is applied.
function applyWand(p, id) {
  const w = WANDS[id] ? id : 'wand';
  p.wand = w;
  p.dmg *= WANDS[w].dmg; p.fireDelay *= WANDS[w].rate; p.shotSpeed *= WANDS[w].speed; p.range *= WANDS[w].range;
}
const dmgOf = (p) => p.dmg * (p.buff.power > 0 ? 1.6 : 1);
// Nearest standing hero (enemies aim at and chase them).
function nearestHero(x, y) {
  let best = G.player, bd = 1e9;
  for (const p of G.players) {
    if (!alive(p)) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

// Controls of this device: keyboard + mouse, controller or touch sticks.
function readLocalInput(p) {
  const I = p.in, pad = Input.pad, tch = Input.touch;
  if (G.state !== 'play') { Object.assign(I, newInput()); Input.touchSlot = -1; return; }
  let mx = (key('KeyD') ? 1 : 0) - (key('KeyA') ? 1 : 0) + pad.mx + tch.mx;
  let my = (key('KeyS') ? 1 : 0) - (key('KeyW') ? 1 : 0) + pad.my + tch.my;
  const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  I.mx = mx; I.my = my;
  I.dash = pressed('Space', 'ShiftLeft', 'ShiftRight', 'PadA', 'PadLB', 'PadLT', 'TouchDash');
  I.star = pressed('KeyQ', 'Mouse2', 'PadRB', 'PadRT', 'TouchStar');
  I.use = pressed('KeyE', 'Enter', 'PadX', 'TouchUse');
  I.belt = pressed('KeyR', 'PadY', 'TouchBelt') ? 0 : -1;
  for (let i = 0; i < p.beltMax; i++) if (pressed('Digit' + (i + 1))) I.belt = i;
  if (Input.touchSlot >= 0) { I.belt = Input.touchSlot; Input.touchSlot = -1; }
  // Aim: arrow keys, right stick, right touch stick or the held mouse button.
  let ax = 0, ay = 0, aiming = false, padAim = false;
  const kx = (key('ArrowRight') ? 1 : 0) - (key('ArrowLeft') ? 1 : 0), ky = (key('ArrowDown') ? 1 : 0) - (key('ArrowUp') ? 1 : 0);
  if (kx || ky) { ax = kx; ay = ky; aiming = true; }
  else if (pad.ax || pad.ay) { ax = pad.ax; ay = pad.ay; aiming = true; padAim = true; }
  else if (tch.ax || tch.ay) { ax = tch.ax; ay = tch.ay; aiming = true; padAim = true; }
  else if (Input.mouseDown && Input.lastAim === 'mouse') { ax = Input.mx - p.x; ay = Input.my - (p.y - 8); aiming = true; }
  if (aiming && padAim) {
    // gentle aim assist for sticks: snap to the enemy closest to the aimed direction
    const a0 = Math.atan2(ay, ax);
    let best = null, bd = 0.38;
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.ghost || e.passive && e.type !== 'gold') continue;
      const ex = e.x - p.x, ey = e.y - e.h / 2 - (p.y - 8), dist = Math.hypot(ex, ey);
      if (dist > p.range + 20) continue;
      let da = Math.abs(Math.atan2(ey, ex) - a0);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da < bd) { bd = da; best = [ex, ey]; }
    }
    if (best) { ax = best[0]; ay = best[1]; }
  }
  I.aim = aiming && !!(ax || ay); I.pad = padAim;
  if (I.aim) { I.ax = ax; I.ay = ay; }
}

// Movement, rolling and facing. Runs where the hero is controlled (its own device).
function movePlayer(p, dt) {
  const room = G.room, I = p.in;
  const mx = I.mx, my = I.my;
  p.moving = !!(mx || my);
  if (p.moving) { const l = Math.hypot(mx, my); p.dx = mx / l; p.dy = my / l; }
  if (I.dash && p.dashCool <= 0 && p.dashT <= 0) {
    p.dashT = 0.2; p.dashCool = p.dashCd; p.inv = Math.max(p.inv, 0.28); p.dashN++;
    dust(p.x, p.y, 6, 8);
    Audio_.sfx('dash'); haptic('dash');
  }
  let vx, vy;
  if (p.dashT > 0) {
    p.dashT -= dt;
    const k = p.speed * 2.6 * (p.buff.haste > 0 ? 1.15 : 1);
    vx = p.dx * k; vy = p.dy * k;
    if (Math.random() < 0.6) part(p.x + rnd(-4, 4), p.y - rnd(0, 3), -vx * 0.1, -vy * 0.1, 0.3, 'w', { size: 2 });
  } else { const sp = p.speed * (p.buff.haste > 0 ? 1.2 : 1); vx = mx * sp; vy = my * sp; }

  // Door assist: pushing into a doorway slides you into its opening.
  if (room.cleared) {
    if (vy < 0 && p.y < 60 && room.doors.u && Math.abs(p.x - 192) < 16) p.x += Math.sign(192 - p.x) * Math.min(Math.abs(192 - p.x), 60 * dt);
    if (vy > 0 && p.y > 180 && room.doors.d && Math.abs(p.x - 192) < 16) p.x += Math.sign(192 - p.x) * Math.min(Math.abs(192 - p.x), 60 * dt);
    if (vx < 0 && p.x < 40 && room.doors.l && Math.abs(p.y - 123) < 16) p.y += Math.sign(123 - p.y) * Math.min(Math.abs(123 - p.y), 60 * dt);
    if (vx > 0 && p.x > 344 && room.doors.r && Math.abs(p.y - 123) < 16) p.y += Math.sign(123 - p.y) * Math.min(Math.abs(123 - p.y), 60 * dt);
  }
  moveBox(room, p, vx * dt, vy * dt, 'player');
  if (p.moving) {
    const f0 = Math.floor(p.walkT / 0.11);
    p.walkT += dt * (p.dashT > 0 ? 2 : 1);
    const f1 = Math.floor(p.walkT / 0.11);
    if (f1 !== f0 && f1 % 2 === 0) part(p.x + rnd(-3, 3), p.y - 1, -p.dx * 10, -4, 0.35, THEMES[G.floor.theme]['3'], { size: 1 });
    p.idleT = 0;
  } else p.idleT = (p.idleT || 0) + dt;
  if (I.aim) {
    if (Math.abs(I.ax) > Math.abs(I.ay) * 1.1) { p.face = 's'; p.flip = I.ax < 0; } else p.face = I.ay < 0 ? 'u' : 'd';
  } else if (p.moving) {
    if (Math.abs(mx) > Math.abs(my) * 1.1 || (mx && !my)) { p.face = 's'; p.flip = mx < 0; } else p.face = my < 0 ? 'u' : 'd';
  }
}

// Everything that decides the game: shooting, Starfall, belt, moons. Host / solo only.
function updatePlayer(p, dt) {
  if (p.sayT > 0) p.sayT -= dt;
  p.inv = Math.max(0, p.inv - dt);
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.cool -= dt;
  p.dashCool -= dt;
  if (p.dead) { p.deadT += dt; return; }
  if (p.down) { updateDowned(p, dt); return; }
  updateBuffs(p, dt);
  if (!p.remote) movePlayer(p, dt);
  else if (p.dashT > 0) p.dashT -= dt;
  if (p.dashT > 0 && p.stardust) {
    p.dustT -= dt;
    if (p.dustT <= 0) { p.dustT = 0.035; G.hazards.push({ x: p.x, y: p.y - 3, life: 1.3, tick: 0, own: p.pid }); }
  }
  const I = p.in;
  if (I.aim && p.cool <= 0 && p.dashT <= 0) playerShoot(p, I.ax, I.ay);
  if (I.star) useStarfall(p);
  if (I.belt >= 0) useBelt(p, I.belt);

  // Orbiting moons: hurt enemies, eat bullets.
  if (p.orbitals) {
    for (const [e, t] of p.orbitHit) { if (t - dt <= 0) p.orbitHit.delete(e); else p.orbitHit.set(e, t - dt); }
    for (let i = 0; i < p.orbitals; i++) {
      const o = orbitPos(p, i);
      for (const e of G.enemies) {
        if (e.spawnT > 0 || e.dead || p.orbitHit.has(e)) continue;
        if (Math.hypot(e.x - o.x, e.y - e.h / 2 - o.y) < e.r + 4) { hurtEnemy(e, p.dmg * 0.8, o.x, o.y, false, p); p.orbitHit.set(e, 0.3); }
      }
      for (const b of EBULLETS) if (b.life > 0 && Math.hypot(b.x - o.x, b.y - o.y) < b.r + 3) { b.life = 0; burst(b.x, b.y, 3, ['Y', 'w'], 40, 0.2); }
    }
  }
}
const _op = { x: 0, y: 0 };
function orbitPos(p, i) {
  const a = G.time * 3.2 + i * Math.PI * 2 / p.orbitals;
  _op.x = p.x + Math.cos(a) * 19; _op.y = p.y - 8 + Math.sin(a) * 12;
  return _op;
}

// ---------- Down, not out (co-op) ----------
// A hero out of hearts waits for a teammate: stand next to them to help them up.
const REVIVE_T = 1.6;
function updateDowned(p, dt) {
  let help = false;
  for (const q of G.players) if (q !== p && alive(q) && Math.hypot(q.x - p.x, q.y - p.y) < 22) help = true;
  p.revive = help ? p.revive + dt : Math.max(0, p.revive - dt * 0.6);
  if (help && Math.random() < 0.3) part(p.x + rnd(-8, 8), p.y - rnd(0, 12), 0, -30, 0.5, null, { spr: 'sparkle', drag: 1 });
  if (p.revive >= REVIVE_T) revivePlayer(p, 2);
}
function revivePlayer(p, hp) {
  p.down = false; p.revive = 0; p.hp = Math.min(p.maxHp, hp); p.inv = 1.5;
  burst(p.x, p.y - 10, 16, ['Y', 'w', 'q', 'P'], 100, 0.6, { g: -40 });
  Audio_.sfx('heart');
  toast(p.name + ' IS BACK!');
}
const teamDown = () => G.players.every(p => !alive(p));

// Personal feedback for one hero: runs here for our own hero, is sent to a remote one.
const YOU_FX = {
  hurt() { G.hurtT = 0.25; G.shake = Math.max(G.shake, 4); haptic('hurt'); },
  death() { G.hurtT = 0.3; haptic('death'); },
  heart() { G.hud.heartT = 0.4; },
  item() { haptic('item'); },
  potion() { haptic('potion'); },
  kill() { haptic('kill'); },
  elite() { haptic('elite'); },
  ready() { G.hud.readyT = 1; haptic('tick'); },
  starfall() { haptic('starfall'); },
  belt() { G.hud.beltT = 0.4; },
  got(id) {
    haptic('item');
    G.banner = { title: ITEMS[id].name, sub: ITEMS[id].desc, t: 2.6, icon: id };
    if (!Save.found.includes(id)) { Save.found.push(id); Save.write(); }
  },
};
function youFx(p, kind, arg) {
  if (p === G.player) YOU_FX[kind](arg);
  else if (p.remote) netTell(p.pid, kind, arg);
}
// A short word over a hero's head (potion names, "NOT ENOUGH COINS").
function say(p, msg) { p.sayMsg = msg; p.sayT = 1.1; }

const WAND_SFX = { wand: 'shoot', scatter: 'scatter', bubble: 'bubble', boomer: 'swish', chain: 'zap', comet: 'comet' };
function playerShoot(p, ax, ay) {
  const base = Math.atan2(ay, ax), dmg = dmgOf(p), w = p.wand;
  if (w === 'scatter') {
    const n = p.shots + WANDS.scatter.fan;
    for (let i = 0; i < n; i++) fireShot(p, base + (i / (n - 1) - 0.5) * 0.62 + rnd(-0.04, 0.04), dmg, rnd(0.85, 1.1));
  } else {
    const n = p.shots, spread = w === 'bubble' ? 0.14 : 0.2, jit = w === 'bubble' ? rnd(-0.09, 0.09) : 0;
    for (let i = 0; i < n; i++) fireShot(p, base + jit + (i - (n - 1) / 2) * spread, dmg);
  }
  if (p.backshot) fireShot(p, base + Math.PI, dmg);
  part(p.x + Math.cos(base) * 7, p.y - 9 + Math.sin(base) * 5, 0, 0, 0.12, null, { spr: 'sparkle', drag: 1 });
  p.cool = p.fireDelay * (p.buff.haste > 0 ? 0.6 : 1);
  Audio_.sfx(WAND_SFX[w]);
}

function hurtPlayer(p, n) {
  if (!alive(p) || G.state === 'over' || G.state === 'win') return;
  if (p.buff.guard > 0) { part(p.x + rnd(-6, 6), p.y - rnd(4, 14), 0, -20, 0.3, null, { spr: 'sparkle', drag: 1 }); return; }
  if (p.inv > 0) return;
  if (p.shieldUp) {
    p.shieldUp = false; p.inv = 0.8;
    burst(p.x, p.y - 8, 14, ['C', 'c', 'w'], 90, 0.5);
    Audio_.sfx('shield');
    return;
  }
  p.hp -= n; p.inv = 1.1; p.hurtT = 0.35;
  youFx(p, p.hp <= 0 ? 'death' : 'hurt');
  G.hitstop = Math.max(G.hitstop, G.players.length > 1 ? 0.03 : 0.07);
  burst(p.x, p.y - 8, 10, ['R', 'r', 'w'], 80, 0.5);
  Audio_.sfx('hurt');
  if (p.hp > 0) return;
  p.hp = 0;
  if (G.players.length > 1) {
    // co-op: the hero goes down and waits for help; the run ends when everyone is down
    p.down = true; p.revive = 0; p.dashT = 0;
    for (const k in p.buff) p.buff[k] = 0;
    toast(p.name + ' IS DOWN! HELP THEM UP!');
    Audio_.sfx('over');
    if (teamDown()) { G.slowmo = 1; Audio_.stop(); }
  } else { p.dead = true; p.deadT = 0; G.slowmo = 1; Audio_.stop(); Audio_.sfx('over'); }
}

function healPlayer(p, n) {
  p.hp = Math.min(p.maxHp, p.hp + n);
  youFx(p, 'heart');
  burst(p.x, p.y - 10, 8, ['R', 'q', 'w'], 50, 0.5, { g: -60 });
}

const HERO_WALK = [1, 0, 2, 0];
function drawPlayer(p, ox, oy) {
  const sk = SKIN[p.skin];
  if (p.dead) {
    if (p.deadT < 0.9) {
      const f = ['d', 's', 'u', 's'][Math.floor(p.deadT * 12) % 4];
      drawFeet(S('hero_' + f + '0' + sk), ox + p.x, oy + p.y - Math.sin(Math.min(1, p.deadT / 0.9) * Math.PI) * 10, (Math.floor(p.deadT * 12) % 4 === 3 ? 1 : 0) + 2 * (Math.floor(p.deadT * 20) % 2));
    }
    return;
  }
  if (p.down) {
    shadow(ox + p.x, oy + p.y, 12);
    drawFeet(S('hero_d0h' + sk), ox + p.x, oy + p.y + 1 + (Math.floor(G.time * 3) % 2), Math.floor(G.time * 6) % 5 ? 0 : 2);
    const w = 16, k = Math.min(1, p.revive / REVIVE_T), x = Math.round(ox + p.x - w / 2), y = Math.round(oy + p.y - 27);
    if (k > 0) { rect(x - 1, y - 1, w + 2, 4, '0'); rect(x, y, Math.round(w * k), 2, 'Y'); }
    return;
  }
  if (G.warp && p === G.player) { drawWarp(p, ox, oy); return; }
  if (p.hurtT <= 0 && p.inv > 0 && p.dashT <= 0 && p.buff.guard <= 0 && Math.floor(p.inv * 16) % 2 === 0) return;
  shadow(ox + p.x, oy + p.y, 12);
  const v = p.face === 's' && p.flip ? 1 : 0;
  if (p.hurtT > 0) drawFeet(S(p.face === 'u' ? 'hero_u0' + sk : 'hero_' + p.face + '0h' + sk), ox + p.x, oy + p.y + 1, v + (p.hurtT > 0.27 ? 2 : 0));
  else {
    const frame = p.moving ? HERO_WALK[Math.floor(p.walkT / 0.11) % 4] : 0;
    const blink = !p.moving && p.face !== 'u' && (p.idleT || 0) % 3.2 > 3.05;
    drawFeet(S('hero_' + p.face + frame + (blink ? 'b' : '') + sk), ox + p.x, oy + p.y + 1, v);
  }
  if (p.buff.guard > 0 && (p.buff.guard > 1.2 || Math.floor(G.time * 10) % 2)) {
    const r = ringSprite(12, Math.floor(G.time * 8) % 2 ? 'y' : 'Y');
    ctx.drawImage(r, Math.round(ox + p.x - 12), Math.round(oy + p.y - 21));
  } else if (p.shieldUp) {
    const r = ringSprite(11, Math.floor(G.time * 6) % 2 ? 'c' : 'C');
    ctx.drawImage(r, Math.round(ox + p.x - 11), Math.round(oy + p.y - 20));
  }
}
// Co-op: every hero's name over their head, in their robe colour.
// Words over the heroes' heads: co-op names (or HELP! when down) and short potion / item
// words. Labels of heroes standing close together stack instead of overlapping.
const _tags = [];
function drawTags(ox, oy) {
  if (G.state !== 'play') return;
  _tags.length = 0;
  const put = (str, x, y, col) => {
    const w = textW(str) + 4;
    for (let k = 0; k < 8; k++) {
      const hit = _tags.find(t => Math.abs(t.x - x) < (t.w + w) / 2 && Math.abs(t.y - y) < 10);
      if (!hit) break;
      y = hit.y - 10;
    }
    _tags.push({ x, y, w });
    text(str, ox + x, oy + y, col, 2, 1);
  };
  const order = G.players.slice().sort((a, b) => b.y - a.y);
  for (const p of order) {
    if (p.dead) continue;
    const top = p.y - (p.down ? 33 : 28);
    if (G.players.length > 1) {
      if (!p.down) put(p.name, p.x, top, TAG_COL[p.skin]);
      else if (p.revive <= 0 && Math.floor(G.time * 2) % 2) put('HELP!', p.x, top, TAG_COL[p.skin]);
      else _tags.push({ x: p.x, y: top, w: textW('HELP!') + 4 });
    }
    if (p.sayT > 0) put(p.sayMsg, p.x, top - (G.players.length > 1 ? 10 : 0) - Math.round((1.1 - p.sayT) * 6), 'Y');
  }
}
function drawAimReticle(ox, oy) {
  const p = G.player;
  if (!p.in.pad || !alive(p)) return;
  const l = Math.hypot(p.in.ax, p.in.ay) || 1;
  drawS(S('cursor'), Math.round(ox + p.x + p.in.ax / l * 26) - 4, Math.round(oy + p.y - 8 + p.in.ay / l * 20) - 4);
}
function drawOrbitals(p, ox, oy) {
  const m = S('moon');
  for (let i = 0; i < p.orbitals; i++) { const o = orbitPos(p, i); drawS(m, ox + o.x - 3, oy + o.y - 3); }
}

// ---------- Player shots ----------
const SHOTS = [];
const TRAIL = { h: 'H', c: 'C', p: 'q', '': 'Y' }, TRAIL_FW = ['P', 'c', 'Y', 'h'], TRAIL_COMET = ['O', 'y', 'o', 'P'];
// A bare projectile; kind is the wand that fired it ('wand' for plain stars).
function newShot(x, y, ang, sp, life, dmg, kind, own) {
  return {
    own: own || G.player,
    x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life, dmg, big: false, r: kind === 'comet' ? 4 : 3,
    bounce: 0, pierce: 0, homing: 0, fw: 0, mini: false, hitList: null, t: Math.random(),
    tint: kind === 'chain' ? 'c' : '', trail: kind === 'comet', kind, ret: false,
  };
}
function fireShot(p, ang, dmg, spMul) {
  const sp = p.shotSpeed * (spMul || 1), k = p.wand;
  const s = newShot(p.x + Math.cos(ang) * 4, p.y - 8 + Math.sin(ang) * 3, ang, sp, p.range / sp, dmg, k, p);
  s.big = p.bigShot && k === 'wand'; if (s.big) s.r = 4;
  s.bounce = k === 'boomer' ? 0 : p.bounce; s.pierce = k === 'boomer' ? 99 : p.pierce;
  s.homing = p.homing; s.fw = p.fireworks;
  if (k === 'wand') s.tint = p.homing ? 'h' : p.pierce ? 'c' : p.bounce ? 'p' : '';
  s.trail = s.trail || !!(p.homing || p.pierce || p.bounce || p.fireworks);
  SHOTS.push(s);
}

function updateShots(dt) {
  const room = G.room;
  for (let i = SHOTS.length - 1; i >= 0; i--) {
    const s = SHOTS[i];
    s.t += dt;
    s.life -= dt;
    if (s.homing) {
      let best = null, bd = 110;
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0 || e.ghost) continue;
        const d = Math.hypot(e.x - s.x, e.y - e.h / 2 - s.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) {
        const want = Math.atan2(best.y - best.h / 2 - s.y, best.x - s.x), cur = Math.atan2(s.vy, s.vx);
        let da = want - cur;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const turn = Math.max(-1, Math.min(1, da)) * 5 * s.homing * dt, sp = Math.hypot(s.vx, s.vy);
        s.vx = Math.cos(cur + turn) * sp; s.vy = Math.sin(cur + turn) * sp;
      }
    }
    if (s.kind === 'boomer' && s.ret) {
      // on the way back: home in on the hero, over walls, and vanish in their hands
      const p = s.own, dx = p.x - s.x, dy = p.y - 8 - s.y, d = Math.hypot(dx, dy), sp = p.shotSpeed * 1.2;
      if (d < 9 || !alive(p)) { SHOTS[i] = SHOTS[SHOTS.length - 1]; SHOTS.pop(); continue; }
      s.vx += (dx / d * sp - s.vx) * Math.min(1, dt * 7); s.vy += (dy / d * sp - s.vy) * Math.min(1, dt * 7);
    }
    const px = s.x, py = s.y;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.trail && Math.random() < 0.55) part(px, py, 0, 0, 0.22, s.kind === 'comet' ? pick(TRAIL_COMET) : s.fw ? pick(TRAIL_FW) : TRAIL[s.tint], { size: s.kind === 'comet' && Math.random() < 0.4 ? 2 : 1, drag: 1 });
    // enemies first, so nothing hugging a wall is immune
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.ghost || (e.z || 0) > 12) continue;
      if (s.hitList && s.hitList.includes(e)) continue;
      if (Math.hypot(e.x - s.x, e.y - e.h / 2 - s.y) < e.r + s.r) {
        hurtEnemy(e, s.dmg, px, py, false, s.own);
        if (s.kind === 'chain') chainFrom(e, s.dmg * 0.6, s.own);
        if (s.fw) {
          for (let k = 0; k < 3 * s.fw; k++) {
            const m = newShot(s.x, s.y, Math.random() * Math.PI * 2, 140, 0.25, s.dmg * 0.4, 'wand', s.own);
            m.r = 2; m.mini = true; m.hitList = [e];
            SHOTS.push(m);
          }
          burst(s.x, s.y, 8, ['y', 'O', 'P', 'w'], 90, 0.35);
        }
        if (s.pierce > 0) { s.pierce--; (s.hitList || (s.hitList = [])).push(e); } else { s.life = 0; break; }
      }
    }
    // shots fly at hand height; their ground point is a few px lower
    if (s.life > 0 && !s.ret && solidPx(room, s.x, s.y + 4, 'shot')) {
      const c = Math.floor(s.x / 16), r = Math.floor((s.y + 4 - OY) / 16);
      if (tileAt(room, c, r) === T_BRK) breakTile(room, c, r);
      if (s.kind === 'boomer') { s.life = 0; s.x = px; s.y = py; }
      else if (s.bounce > 0) {
        s.bounce--;
        const bx = solidPx(room, s.x, py + 4, 'shot'), by = solidPx(room, px, s.y + 4, 'shot');
        if (bx || !by) s.vx = -s.vx;
        if (by || !bx) s.vy = -s.vy;
        s.x = px; s.y = py;
        Audio_.sfx('pop');
      } else s.life = 0;
    }
    if (s.life <= 0 && s.kind === 'boomer' && !s.ret) { s.ret = true; s.life = 4; s.hitList = null; }
    if (s.life <= 0) {
      if (s.kind === 'comet') cometBlast(s);
      else burst(s.x, s.y, s.mini ? 2 : 4, s.kind === 'bubble' ? ['C', 'c', 'w'] : s.kind === 'chain' ? ['C', 'w', 'c'] : ['Y', 'w', 'y'], 50, 0.25);
      if (s.kind === 'bubble') Audio_.sfx('pop');
      SHOTS[i] = SHOTS[SHOTS.length - 1]; SHOTS.pop();
    }
  }
}
function drawShots(ox, oy) {
  for (const s of SHOTS) if (!s.mini) shadow(ox + s.x, oy + s.y + 7, s.big ? 6 : 4);
  for (const s of SHOTS) {
    const f = Math.floor(s.t * 14) % 2;
    if (s.mini) { rect(ox + s.x - 1, oy + s.y - 1, 2, 2, f ? 'Y' : 'w'); continue; }
    let sp, v = 0;
    if (s.kind === 'boomer') { const k = Math.floor(s.t * 16) % 4; sp = S(BOOM_FR[k]); v = k === 3 ? 1 : 0; }
    else if (s.kind === 'scatter' || s.kind === 'bubble' || s.kind === 'comet') sp = S('shot' + s.kind + '_' + (s.kind === 'bubble' ? Math.floor(s.t * 6) % 2 : f));
    else sp = S((s.big ? 'shotbig' : 'shot') + s.tint + '_' + f);
    drawS(sp, ox + s.x - (sp.w >> 1), oy + s.y - (sp.h >> 1), v);
  }
}

const BOOM_FR = ['shotboom_d', 'shotboom_s', 'shotboom_u', 'shotboom_s'];

// Comet Staff: the comet bursts and hurts everything around it.
function cometBlast(s) {
  const R = 26;
  for (const e of G.enemies) {
    if (e.dead || e.spawnT > 0 || e.ghost || (e.z || 0) > 12) continue;
    if (Math.hypot(e.x - s.x, (e.y - e.h / 2 - s.y) * 1.2) < R + e.r) hurtEnemy(e, s.dmg * 0.7, s.x, s.y, true, s.own);
  }
  poof(s.x, s.y);
  burst(s.x, s.y, 14, ['O', 'y', 'Y', 'o', 'w'], 120, 0.4, { g: 60 });
  G.shake = Math.max(G.shake, 1.8);
  Audio_.sfx('blast'); haptic('blast');
}
// Lightning Rod: the hit arcs on to up to two more enemies.
const BOLTS = [];
function chainFrom(e0, dmg, own) {
  let from = e0;
  const done = [e0];
  for (let j = 0; j < 2; j++) {
    let best = null, bd = 72;
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.ghost || e.passive || done.includes(e)) continue;
      const d = Math.hypot(e.x - from.x, e.y - from.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) break;
    const x0 = from.x, y0 = from.y - from.h / 2, x1 = best.x, y1 = best.y - best.h / 2;
    BOLTS.push({ x0, y0, x1, y1, mx: (x0 + x1) / 2 + rnd(-6, 6), my: (y0 + y1) / 2 + rnd(-6, 6), t: 0.12 });
    done.push(best);
    hurtEnemy(best, dmg, x0, y0, true, own);
    from = best;
  }
}
function pxLine(x0, y0, x1, y1, col) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
  for (let i = 0; i <= n; i++) rect(x0 + (x1 - x0) * i / (n || 1), y0 + (y1 - y0) * i / (n || 1), 1, 1, col);
}
function updateBolts(dt) {
  for (let i = BOLTS.length - 1; i >= 0; i--) if ((BOLTS[i].t -= dt) <= 0) BOLTS.splice(i, 1);
}
function drawBolts(ox, oy) {
  for (const b of BOLTS) {
    const c = b.t > 0.06 ? 'w' : 'C';
    pxLine(ox + b.x0, oy + b.y0, ox + b.mx, oy + b.my, c);
    pxLine(ox + b.mx, oy + b.my, ox + b.x1, oy + b.y1, c);
  }
}

// ---------- Belt: potions and turret kits ----------
function addBelt(p, kind) {
  if (p.belt.length >= p.beltMax) return false;
  p.belt.push(kind);
  youFx(p, 'belt');
  Audio_.sfx('bottle');
  return true;
}
const POT_FX = { regen: ['P', 'q', 'w'], haste: ['y', 'Y', 'w'], power: ['R', 'r', 'O'], guard: ['y', 'Y', 'c'], turret: ['3', '4', 'Y'] };
function useBelt(p, i) {
  const kind = p.belt[i];
  if (!kind || !alive(p) || G.warp) { if (!kind) Audio_.sfx('deny'); return; }
  if (kind === 'turret') { if (!placeTurret(p)) { Audio_.sfx('deny'); return; } Audio_.sfx('turret'); }
  else {
    p.buff[kind] = POTIONS[kind].t;
    if (kind === 'regen') p.regenT = 0.4;
    Audio_.sfx('potion');
  }
  p.belt.splice(i, 1);
  say(p, POTIONS[kind].name + '!');
  burst(p.x, p.y - 10, 14, POT_FX[kind], 90, 0.6, { g: -40 });
  youFx(p, 'potion');
}
function updateBuffs(p, dt) {
  const b = p.buff;
  for (const k in b) if (b[k] > 0) b[k] = Math.max(0, b[k] - dt);
  if (b.regen > 0 && (p.regenT -= dt) <= 0) {
    p.regenT = 1.5;
    if (p.hp < p.maxHp) { healPlayer(p, 1); Audio_.sfx('heart'); }
  }
  if (b.haste > 0 && p.moving && Math.random() < 0.3) part(p.x - p.dx * 6 + rnd(-3, 3), p.y - rnd(2, 10), -p.dx * 30, -p.dy * 30, 0.2, 'Y', { drag: 1 });
  if (b.power > 0 && Math.random() < 0.12) part(p.x + rnd(-6, 6), p.y - rnd(4, 14), 0, -24, 0.4, pick(['R', 'O']), { drag: 1 });
}

// ---------- Star turrets ----------
const TURRET_MAX = 2;
// The turret goes down beside the hero (the side they face first), never on top of them.
function placeTurret(p) {
  const side = p.face === 's' && p.flip ? -1 : 1;
  let spot = null;
  for (const [dx, dy] of [[16 * side, 2], [-16 * side, 2], [0, 14], [0, -12]]) {
    if (!boxSolid(G.room, p.x + dx, p.y + dy, 6, 4, 'enemy')) { spot = [p.x + dx, p.y + dy]; break; }
  }
  if (!spot) return false;
  if (G.turrets.length >= TURRET_MAX) { const o = G.turrets.shift(); poof(o.x, o.y - 10); }
  G.turrets.push({ x: spot[0], y: spot[1], life: POTIONS.turret.t, cool: 0.5, flash: 0, own: p });
  poof(spot[0], spot[1] - 8); dust(spot[0], spot[1], 6, 12);
  return true;
}
function updateTurrets(dt) {
  const T = G.turrets;
  for (let i = T.length - 1; i >= 0; i--) {
    const tr = T[i];
    tr.life -= dt; tr.cool -= dt; tr.flash -= dt;
    if (tr.life <= 0) { poof(tr.x, tr.y - 10); burst(tr.x, tr.y - 10, 8, ['3', '4', 'Y'], 60, 0.4); T.splice(i, 1); continue; }
    if (tr.cool > 0) continue;
    let best = null, bd = 150;
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.ghost || e.passive || (e.z || 0) > 12) continue;
      const d = Math.hypot(e.x - tr.x, e.y - tr.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) continue;
    const a = Math.atan2(best.y - best.h / 2 - (tr.y - 15), best.x - tr.x);
    SHOTS.push(newShot(tr.x + Math.cos(a) * 5, tr.y - 15 + Math.sin(a) * 4, a, 230, 0.75, 1 + tr.own.dmg * 0.5, 'wand', tr.own));
    tr.cool = 0.45; tr.flash = 0.08;
    Audio_.sfx('tshoot');
  }
}
function drawTurret(tr, ox, oy) {
  if (tr.life < 3 && Math.floor(tr.life * 8) % 2) return;
  shadow(ox + tr.x, oy + tr.y, 14);
  drawFeet(S(tr.flash > 0 ? 'turret_1' : 'turret_0'), ox + tr.x, oy + tr.y + 1, tr.flash > 0.05 ? 2 : 0);
}

// ---------- Breakables ----------
function breakTile(room, c, r) {
  room.tiles[r * COLS + c] = T_FLOOR;
  room.dirty = true;
  flowKey = -1;
  const x = c * 16 + 8, y = OY + r * 16 + 10;
  poof(x, y - 2);
  burst(x, y - 4, 10, G.floor.theme === 'meadow' ? ['G', 'h', 'g'] : G.floor.theme === 'beach' ? ['r', 'R', 'y'] : ['2', '3', 'c'], 70, 0.5, { g: 150 });
  Audio_.sfx('brk');
  if (Math.random() < 0.28 + teamLuck() * 0.08) dropLoot(x, y, 0.6);
}

// ---------- Pickups ----------
function spawnPickup(type, x, y) {
  const a = Math.random() * Math.PI * 2;
  G.room.pickups.push({ type, x, y, z: 0, vz: rnd(70, 110), vx: Math.cos(a) * rnd(10, 40), vy: Math.sin(a) * rnd(8, 30), t: Math.random() * 3 });
}
function spawnPotion(x, y, kind) {
  spawnPickup('pot', x, y);
  const k = G.room.pickups[G.room.pickups.length - 1];
  k.pot = kind || pick(POTION_IDS);
}
// Random drop; bias < 1 makes hearts rarer.
function dropLoot(x, y, bias) {
  const r = Math.random(), hurt = G.players.some(p => alive(p) && p.hp < p.maxHp);
  const heartChance = (hurt ? 0.22 : 0.08) * (bias || 1);
  if (r < heartChance) spawnPickup(Math.random() < 0.3 ? 'heart' : 'half', x, y);
  else if (r < heartChance + 0.07 + teamLuck() * 0.03) spawnPickup('gem', x, y);
  else spawnPickup('coin', x, y);
}
const PICK_VAL = { coin: 1, gem: 5 };
// Floor the heroes can walk to (a BFS from where they stand, through doorways too).
const REACH = new Uint8Array(COLS * ROWS), _rq = [];
function markReach(room) {
  REACH.fill(0); _rq.length = 0;
  const open = (i) => room.tiles[i] === T_FLOOR || room.tiles[i] === T_DOOR;
  for (const p of G.players) {
    if (!alive(p)) continue;
    const i = Math.floor((p.y - 1 - OY) / 16) * COLS + Math.floor(p.x / 16);
    if (i >= 0 && i < REACH.length && !REACH[i]) { REACH[i] = 1; _rq.push(i); }
  }
  if (!_rq.length) { const i = 7 * COLS + 12; REACH[i] = 1; _rq.push(i); }
  for (let h = 0; h < _rq.length; h++) {
    const i = _rq[h], c = i % COLS, r = (i / COLS) | 0;
    for (const k in DIRS) {
      const nc = c + DIRS[k][0], nr = r + DIRS[k][1], ni = nr * COLS + nc;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || REACH[ni] || !open(ni)) continue;
      REACH[ni] = 1; _rq.push(ni);
    }
  }
}
// A pickup that lands in a rock, in the water or behind rocks hops to the nearest floor
// a hero can reach, so nothing is ever lost.
function settlePickup(room, k) {
  k.ok = true;
  markReach(room);
  const c = Math.floor(k.x / 16), r = Math.floor((k.y - 1 - OY) / 16), i = r * COLS + c;
  if (c >= 1 && c < COLS - 1 && r >= 2 && r < ROWS - 1 && REACH[i] && room.tiles[i] === T_FLOOR && !boxSolid(room, k.x, k.y, 3, 2, 'enemy')) return;
  let best = -1, bd = 1e9;
  for (let j = 0; j < REACH.length; j++) {
    if (!REACH[j] || room.tiles[j] !== T_FLOOR) continue;
    const x = (j % COLS) * 16 + 8, y = OY + ((j / COLS) | 0) * 16 + 10, d = Math.hypot(x - k.x, y - k.y);
    if (d < bd) { bd = d; best = j; }
  }
  if (best < 0) return;
  for (let j = 0; j < 3; j++) part(k.x + rnd(-4, 4), k.y - rnd(2, 8), 0, -20, 0.4, null, { spr: 'sparkle', drag: 1 });
  k.x = (best % COLS) * 16 + 8 + rnd(-3, 3); k.y = OY + ((best / COLS) | 0) * 16 + 10 + rnd(-2, 2);
  k.z = 10; k.vz = 60; k.vx = k.vy = 0;
}
const teamLuck = () => G.players.reduce((m, p) => Math.max(m, p.luck), 0);
// Coins go into the team purse; a share of every coin is also kept forever (the vault).
function gainCoins(n) {
  G.coins = Math.min(999, G.coins + n);
  G.stats.coins += n;
  G.hud.coinT = 0.25;
  keepCoins(n);
}
function updatePickups(dt) {
  const room = G.room, list = room.pickups;
  for (let i = list.length - 1; i >= 0; i--) {
    const k = list[i];
    k.t += dt;
    if (k.z > 0 || k.vz) {
      k.vz -= 320 * dt; k.z += k.vz * dt;
      if (k.z <= 0) { k.z = 0; k.vz = Math.abs(k.vz) > 40 ? -k.vz * 0.4 : 0; }
      const hx = k.x + k.vx * dt, hy = k.y + k.vy * dt;
      if (!solidPx(room, hx, hy, 'enemy')) { k.x = hx; k.y = hy; } else { k.vx = -k.vx; k.vy = -k.vy; }
      k.vx *= Math.pow(0.1, dt); k.vy *= Math.pow(0.1, dt);
      if (!k.z && !k.vz) k.ok = false; // just landed: check that it can be reached
    }
    if (!k.ok && !k.z && !k.vz) settlePickup(room, k);
    const isHeart = k.type === 'heart' || k.type === 'half', waits = isHeart || k.type === 'pot';
    for (const p of G.players) {
      if (!alive(p)) continue;
      const d = Math.hypot(p.x - k.x, p.y - 3 - k.y);
      if (p.magnet && !waits && d < 80 && d > 1) {
        const pull = (80 - d) * 4 * dt + 40 * dt;
        k.x += (p.x - k.x) / d * pull; k.y += (p.y - 3 - k.y) / d * pull;
      }
      if (d >= 9 || k.z >= 6) continue;
      if (k.type === 'pot') {
        if (!addBelt(p, k.pot)) continue;
        say(p, POTIONS[k.pot].name);
      } else if (isHeart) {
        if (p.hp >= p.maxHp) continue;
        healPlayer(p, k.type === 'heart' ? 2 : 1);
        Audio_.sfx('heart');
      } else {
        gainCoins(PICK_VAL[k.type]);
        Audio_.sfx('coin');
        for (let j = 0; j < 4; j++) part(k.x + rnd(-4, 4), k.y - rnd(2, 8), 0, -20, 0.4, null, { spr: 'sparkle', drag: 1 });
      }
      list[i] = list[list.length - 1]; list.pop();
      break;
    }
  }
}
const COIN_FR = ['coin_0', 'coin_1', 'coin_2', 'coin_1'];
function drawPickup(k, ox, oy) {
  const bob = k.z > 0 ? k.z : Math.max(0, Math.sin(k.t * 4)) * 1.5;
  shadow(ox + k.x, oy + k.y, 7);
  let s, v = 0;
  if (k.type === 'coin') { const f = Math.floor(k.t * 8) % 4; s = S(COIN_FR[f]); v = f === 3 ? 1 : 0; }
  else s = S(k.type === 'pot' ? 'pot_' + k.pot : k.type === 'gem' ? 'gem' : k.type === 'heart' ? 'heart' : 'heart_half');
  drawS(s, ox + k.x - (s.w >> 1), oy + k.y - s.h - bob + 1, v);
}

// ---------- Props: pedestals, merchant, portal ----------
function addPedestal(room, x, y, item, price) { room.props.push({ kind: 'ped', x, y, item, price: price || 0, t: Math.random() * 6 }); }
function nearestProp(p) {
  let best = null, bd = 18;
  if (!alive(p)) return null;
  for (const o of G.room.props) {
    if (o.kind !== 'ped' && o.kind !== 'portal') continue;
    if (o.group && o.took && o.took.includes(p.pid)) continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
function priceOf(o) { return Math.max(1, Math.round(o.price * (1 - 0.15 * Math.min(3, teamLuck())))); }

function interact(o, p) {
  const room = G.room;
  if (o.kind === 'portal') { if (G.players.length > 1) nextFloor(); else startWarp(o); return; }
  const pot = POTIONS[o.item];
  const frog = room.props.find(q => q.kind === 'frog');
  if (pot && p.belt.length >= p.beltMax) { Audio_.sfx('deny'); if (frog) frog.say = { msg: 'YOUR BELT IS FULL!', until: frog.t + 1.3 }; else say(p, 'BELT FULL'); return; }
  if (o.item === 'hp' && p.hp >= p.maxHp) { Audio_.sfx('deny'); return; }
  if (o.price) {
    const cost = priceOf(o);
    if (G.coins < cost) { Audio_.sfx('deny'); G.shake = Math.max(G.shake, 1); if (frog) frog.say = { msg: 'NOT ENOUGH COINS!', until: frog.t + 1.3 }; else say(p, 'NOT ENOUGH COINS'); return; }
    if (frog) frog.say = { msg: 'THANKS! RIBBIT!', until: frog.t + 1.6, happy: true };
    G.coins -= cost;
  }
  if (o.item === 'hp') { healPlayer(p, 4); Audio_.sfx('heart'); }
  else if (pot) addBelt(p, o.item);
  else giveItem(o.item, p);
  room.props.splice(room.props.indexOf(o), 1);
  if (o.group) {
    // co-op: every hero picks one item from a group; the rest vanish once all have chosen
    const took = (o.took || []).concat(p.pid);
    const rest = room.props.filter(q => q.group === o.group);
    for (const q of rest) q.took = took;
    if (G.players.every(q => took.includes(q.pid)) || !rest.length) {
      for (const q of rest) { poof(q.x, q.y - 14); room.props.splice(room.props.indexOf(q), 1); }
    }
  }
  G.propsN++;
}
function giveItem(id, p) {
  ITEMS[id].apply(p);
  p.items.push(id);
  G.stats.items++;
  youFx(p, 'got', id);
  if (G.players.length > 1 && p !== G.player) say(p, ITEMS[id].name);
  Audio_.sfx('item');
  burst(p.x, p.y - 10, 16, ['Y', 'y', 'w', 'P', 'c'], 110, 0.7);
}
// Random items the player can still get.
function itemPool(n) {
  const owned = new Set([].concat(...G.players.map(p => p.items)));
  const pool = Object.keys(ITEMS).filter(k => !(ITEMS[k].unique && owned.has(k)));
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

function drawProp(o, ox, oy) {
  if (o.kind === 'ped') {
    shadow(ox + o.x, oy + o.y, 16);
    drawS(S('pedestal'), ox + o.x - 8, oy + o.y - 12);
    const bob = Math.round(Math.sin(o.t * 3) * 1.5);
    const s = S(o.item === 'hp' ? 'heart' : POTIONS[o.item] ? 'pot_' + o.item : 'icon_' + o.item);
    if (o.took && o.took.includes(G.player.pid)) { drawS(s, ox + o.x - (s.w >> 1), oy + o.y - 14 - s.h, 4); return; }
    drawS(s, ox + o.x - (s.w >> 1), oy + o.y - 14 - s.h + bob);
    if (Math.floor(o.t * 3) % 4 === 0) drawS(S('sparkle_0'), ox + o.x + 6, oy + o.y - 28 + bob);
    if (o.price) {
      const cost = priceOf(o);
      drawS(S('coin_0'), ox + o.x - 9, oy + o.y + 3);
      text(String(cost), ox + o.x + 1, oy + o.y + 4, G.coins >= cost ? 'Y' : 'R', 2);
    }
  } else if (o.kind === 'frog') {
    shadow(ox + o.x, oy + o.y, 16);
    const say = o.say && o.t < o.say.until ? o.say : null;
    const hop = say && say.happy ? Math.round(Math.abs(Math.sin(o.t * 9)) * 4) : 0;
    drawFeet(S(Math.floor(o.t * 2) % 2 ? 'frog_1' : 'frog_0'), ox + o.x, oy + o.y - hop, G.player.x < o.x ? 1 : 0);
    if (say || Math.hypot(G.player.x - o.x, G.player.y - o.y) < 90) {
      const msg = say ? say.msg : G.coins >= 15 ? 'RIBBIT! TAKE A LOOK!' : G.coins >= 4 ? 'RIBBIT! NEED A HEART?' : 'RIBBIT! GO FIND SOME COINS!';
      const w = textW(msg) + 10, bx = Math.round(ox + o.x - w / 2), by = Math.round(oy + o.y - 34);
      rect(bx + 1, by, w - 2, 15, '0'); rect(bx, by + 1, w, 13, '0');
      rect(bx + 1, by + 1, w - 2, 13, 'w');
      rect(bx + w / 2 - 2, by + 14, 5, 1, 'w'); rect(bx + w / 2 - 1, by + 15, 3, 1, 'w'); rect(bx + w / 2, by + 16, 1, 1, '0');
      rect(bx + w / 2 - 3, by + 14, 1, 1, '0'); rect(bx + w / 2 + 3, by + 14, 1, 1, '0'); rect(bx + w / 2 - 2, by + 15, 1, 1, '0'); rect(bx + w / 2 + 2, by + 15, 1, 1, '0');
      text(msg, ox + o.x, by + 4, '1', 0, 1);
    }
  } else if (o.kind === 'portal') {
    const f = Math.floor(o.t * 8) % 3;
    drawS(S('portal_' + f), ox + o.x - 16, oy + o.y - 10);
  } else if (o.kind === 'chest') {
    shadow(ox + o.x, oy + o.y, 16);
    const pop = !o.open && o.t < 0.3 ? Math.round(Math.sin(o.t / 0.3 * Math.PI) * 4) : 0;
    drawFeet(S(o.open ? 'chest_1' : 'chest_0'), ox + o.x, oy + o.y + 1 - pop);
    if (!o.open && Math.floor(o.t * 2) % 3 === 0) drawS(S('sparkle_0'), ox + o.x + 5, oy + o.y - 14);
  } else if (o.kind === 'rug') {
    drawS(S('rug'), ox + o.x - 88, oy + o.y - 14);
  }
}

function openChest(o) {
  o.open = true; o.t = 0;
  const luck = teamLuck();
  for (let i = 0, n = rndi(3, 5) + luck; i < n; i++) spawnPickup('coin', o.x, o.y - 6);
  if (Math.random() < 0.35 + luck * 0.1) spawnPickup('gem', o.x, o.y - 6);
  if (Math.random() < 0.3) spawnPickup(Math.random() < 0.4 ? 'heart' : 'half', o.x, o.y - 6);
  if (Math.random() < 0.35 + luck * 0.05) spawnPotion(o.x, o.y - 6);
  burst(o.x, o.y - 8, 14, ['Y', 'y', 'w'], 90, 0.5, { g: 120 });
  Audio_.sfx('chest');
}

// Stardust hazards left by dashing.
function updateHazards(dt) {
  const hz = G.hazards;
  for (let i = hz.length - 1; i >= 0; i--) {
    const h = hz[i];
    h.life -= dt; h.tick -= dt;
    if (h.tick <= 0) {
      h.tick = 0.25;
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0 || e.ghost || (e.z || 0) > 8) continue;
        const own = G.players[h.own] || G.player;
        if (Math.hypot(e.x - h.x, e.y - h.y) < e.r + 6) hurtEnemy(e, own.dmg * 0.5, h.x, h.y, true, own);
      }
    }
    if (h.life <= 0) { hz[i] = hz[hz.length - 1]; hz.pop(); }
  }
}
function drawHazards(ox, oy) {
  for (const h of G.hazards) {
    const f = Math.floor((h.life + h.x) * 10) % 2;
    drawS(S(f ? 'sparkle_0' : 'sparkle_1'), ox + h.x - 1, oy + h.y - 1);
  }
}

// ---------- Combo: quick successive kills pay out coins ----------
const COMBO_T = 2.4;
function onKill(e, own) {
  const c = G.combo;
  c.n++; c.t = COMBO_T;
  addCharge(own, e.elite ? 0.22 : 0.1);
}
function updateCombo(dt) {
  const c = G.combo;
  if (c.t > 0 && (c.t -= dt) <= 0) {
    const n = c.n;
    if (n >= 3) {
      const bonus = Math.floor(n / 3) + (n >= 8 ? 2 : 0) + (n >= 15 ? 3 : 0);
      gainCoins(bonus);
      if (n >= 6) earnVault(2);
      G.comboPop = { n, bonus, t: 1.6 };
      Audio_.sfx('coin');
    }
    c.n = 0;
  }
  if (G.comboPop && (G.comboPop.t -= dt) <= 0) G.comboPop = null;
}

// ---------- Starfall: special attack charged by fighting ----------
function addCharge(p, v) {
  if (!p || p.charge >= 1 || !alive(p)) return;
  p.charge = Math.min(1, p.charge + v * p.chargeMul);
  if (p.charge >= 1) { if (p === G.player) Audio_.sfx('ready'); youFx(p, 'ready'); }
}
function useStarfall(p) {
  if (p.charge < 1 || G.fall) { if (p.charge < 1 && p === G.player) Audio_.sfx('deny'); return; }
  p.charge = 0; p.inv = Math.max(p.inv, 1.1);
  for (const b of EBULLETS) if (b.life > 0) { b.life = 0; part(b.x, b.y, 0, 0, 0.25, null, { spr: 'sparkle', drag: 1 }); }
  const targets = G.enemies.filter(e => !e.dead && e.spawnT <= 0);
  const drops = [];
  for (let i = 0; i < 14; i++) {
    const e = targets.length && i < targets.length * 2 ? targets[i % targets.length] : null;
    drops.push({ x: e ? e.x + rnd(-6, 6) : rnd(40, VW - 40), y: e ? e.y + rnd(-4, 4) : rnd(60, 190), t: -i * 0.055, hit: false });
  }
  G.fall = { t: 0, drops, own: p };
  youFx(p, 'starfall');
  G.flashT = 0.08; G.shake = Math.max(G.shake, 3);
  Audio_.sfx('ult');
}
const FALL_T = 0.35;
function updateStarfall(dt) {
  const f = G.fall;
  if (!f) return;
  f.t += dt;
  let live = false;
  for (const d of f.drops) {
    d.t += dt;
    if (d.t < FALL_T) { live = true; continue; }
    if (d.hit) continue;
    d.hit = true;
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if (Math.hypot(e.x - d.x, (e.y - d.y) * 1.3) < 20 + e.r) hurtEnemy(e, 5 + f.own.dmg * 2, d.x, d.y, true, f.own);
    }
    poof(d.x, d.y - 4); dust(d.x, d.y, 6, 12);
    burst(d.x, d.y - 4, 10, ['Y', 'w', 'y', 'c'], 110, 0.45);
    G.shake = Math.max(G.shake, 2.5);
    Audio_.sfx('boom');
  }
  if (!live && f.drops.every(d => d.hit)) G.fall = null;
  if (G.fall) G.fall.own = f.own;
}
function drawStarfall(ox, oy) {
  const f = G.fall;
  if (!f) return;
  const big = S('shotbig_' + (Math.floor(f.t * 14) % 2));
  for (const d of f.drops) {
    if (d.t < 0 || d.hit) continue;
    const k = d.t / FALL_T;
    shadow(ox + d.x, oy + d.y, 4 + Math.round(k * 10));
    drawS(big, ox + d.x - 4, oy + d.y - 4 - (1 - k) * 170);
    rect(ox + d.x, oy + d.y - 12 - (1 - k) * 170, 1, 8, 'Y');
  }
}

// ---------- Warp through the star gate ----------
function startWarp(o) {
  const p = G.player;
  G.warp = { t: 0, x: o.x, y: o.y + 2, sx: p.x, sy: p.y, done: false };
  Audio_.sfx('portal');
}
function updateWarp(dt) {
  const w = G.warp, p = G.player;
  w.t += dt;
  const k = Math.min(1, w.t / 0.3);
  p.x = w.sx + (w.x - w.sx) * k; p.y = w.sy + (w.y - w.sy) * k;
  if (w.t > 0.3 && Math.random() < 0.8) part(w.x + rnd(-7, 7), w.y - rnd(0, 26), 0, -rnd(30, 70), 0.5, null, { spr: 'sparkle', drag: 1 });
  if (w.t >= 1.2 && !w.done) { w.done = true; nextFloor(); }
}
// Spin, lift off and dissolve upward into a column of light.
function drawWarp(p, ox, oy) {
  const w = G.warp, t = w.t;
  const col = Math.max(0, Math.min(10, (t - 0.25) * 22));
  if (col >= 1) {
    const h = 90, x = Math.round(ox + w.x - col / 2), y = Math.round(oy + w.y - h);
    ctx.fillStyle = 'rgba(255,244,163,0.35)';
    ctx.fillRect(x, y, Math.round(col), h);
    rect(ox + w.x - Math.max(1, Math.round(col / 4)) / 2, y, Math.max(1, Math.round(col / 4)), h, 'w');
  }
  const f = ['d', 's', 'u', 's'][Math.floor(Math.max(0, t - 0.3) * (8 + t * 10)) % 4];
  const s = S('hero_' + f + '0');
  const lift = Math.max(0, t - 0.3) * 16, keep = t < 0.75 ? 1 : Math.max(0, 1 - (t - 0.75) / 0.4);
  if (keep <= 0) return;
  shadow(ox + p.x, oy + p.y, Math.max(4, 12 - lift));
  const sh = Math.round(s.h * keep), flip = f === 's' && Math.floor(t * 10) % 2;
  const v = flip ? 1 : 0;
  ctx.drawImage(ATLAS, s.x[v], s.y[v], s.w, sh, Math.round(ox + p.x - s.w / 2), Math.round(oy + p.y + 1 - s.h - lift), s.w, sh);
}
