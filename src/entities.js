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

// ---------- Player ----------
function newPlayer() {
  return {
    x: 192, y: 130, hw: 5, hh: 5, face: 'd', flip: false, walkT: 0, moving: false,
    hp: 6, maxHp: 6, speed: 88, dmg: 2, fireDelay: 0.27, shotSpeed: 210, range: 150, shots: 1,
    bounce: 0, pierce: 0, homing: 0, orbitals: 0, fireworks: 0, luck: 0,
    magnet: false, honey: false, backshot: false, stardust: false, shield: false, shieldUp: false, bigShot: false,
    dashCd: 0.7, dashT: 0, dashCool: 0, dx: 0, dy: 1, inv: 0, cool: 0, coins: 0, items: [], honeyN: 0,
    dead: false, deadT: 0, orbitHit: new Map(), dustT: 0, charge: 0, chargeMul: 1, hurtT: 0,
  };
}

const SHOTS = [];
const TRAIL = { h: 'H', c: 'C', p: 'q', '': 'Y' }, TRAIL_FW = ['P', 'c', 'Y', 'h'];
function fireShot(p, ang, dmg, opts) {
  const sp = p.shotSpeed;
  SHOTS.push({
    x: p.x + Math.cos(ang) * 4, y: p.y - 8 + Math.sin(ang) * 3, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
    life: p.range / sp, dmg, big: p.bigShot, r: p.bigShot ? 4 : 3,
    bounce: p.bounce, pierce: p.pierce, homing: p.homing, fw: opts && opts.mini ? 0 : p.fireworks,
    mini: !!(opts && opts.mini), hitList: null, t: Math.random(),
    tint: p.homing ? 'h' : p.pierce ? 'c' : p.bounce ? 'p' : '', trail: !!(p.homing || p.pierce || p.bounce || p.fireworks),
  });
}

function playerShoot(p, ax, ay) {
  const base = Math.atan2(ay, ax);
  const n = p.shots, spread = 0.2;
  for (let i = 0; i < n; i++) fireShot(p, base + (i - (n - 1) / 2) * spread, p.dmg);
  if (p.backshot) fireShot(p, base + Math.PI, p.dmg);
  part(p.x + Math.cos(base) * 7, p.y - 9 + Math.sin(base) * 5, 0, 0, 0.12, null, { spr: 'sparkle', drag: 1 });
  p.cool = p.fireDelay;
  Audio_.sfx('shoot');
}

function hurtPlayer(n) {
  const p = G.player;
  if (p.inv > 0 || p.dead || G.state !== 'play') return;
  if (p.shieldUp) {
    p.shieldUp = false; p.inv = 0.8;
    burst(p.x, p.y - 8, 14, ['C', 'c', 'w'], 90, 0.5);
    Audio_.sfx('shield');
    return;
  }
  p.hp -= n; p.inv = 1.1; p.hurtT = 0.35; G.hurtT = 0.25;
  buzz(p.hp <= 0 ? 400 : 60);
  G.shake = Math.max(G.shake, 4); G.hitstop = 0.07;
  burst(p.x, p.y - 8, 10, ['R', 'r', 'w'], 80, 0.5);
  Audio_.sfx('hurt');
  if (p.hp <= 0) { p.hp = 0; p.dead = true; p.deadT = 0; G.slowmo = 1; Audio_.stop(); Audio_.sfx('over'); }
}

function healPlayer(n) {
  const p = G.player;
  p.hp = Math.min(p.maxHp, p.hp + n);
  G.hud.heartT = 0.4;
  burst(p.x, p.y - 10, 8, ['R', 'q', 'w'], 50, 0.5, { g: -60 });
}

function updatePlayer(p, dt) {
  const room = G.room;
  p.inv = Math.max(0, p.inv - dt);
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.cool -= dt;
  p.dashCool -= dt;
  if (p.dead) { p.deadT += dt; return; }

  const pad = Input.pad, tch = Input.touch;
  let mx = (key('KeyD') ? 1 : 0) - (key('KeyA') ? 1 : 0) + pad.mx + tch.mx;
  let my = (key('KeyS') ? 1 : 0) - (key('KeyW') ? 1 : 0) + pad.my + tch.my;
  const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  p.moving = !!(mx || my);
  if (p.moving) { const l = Math.hypot(mx, my); p.dx = mx / l; p.dy = my / l; }

  if (pressed('Space', 'ShiftLeft', 'ShiftRight', 'PadA', 'PadLB', 'PadLT', 'TouchDash') && p.dashCool <= 0 && p.dashT <= 0) {
    p.dashT = 0.2; p.dashCool = p.dashCd; p.inv = Math.max(p.inv, 0.28);
    dust(p.x, p.y, 6, 8);
    Audio_.sfx('dash');
  }
  let vx, vy;
  if (p.dashT > 0) {
    p.dashT -= dt;
    const k = p.speed * 2.6;
    vx = p.dx * k; vy = p.dy * k;
    if (Math.random() < 0.6) part(p.x + rnd(-4, 4), p.y - rnd(0, 3), -vx * 0.1, -vy * 0.1, 0.3, 'w', { size: 2 });
    if (p.stardust) {
      p.dustT -= dt;
      if (p.dustT <= 0) { p.dustT = 0.035; G.hazards.push({ x: p.x, y: p.y - 3, life: 1.3, tick: 0 }); }
    }
  } else { vx = mx * p.speed; vy = my * p.speed; }

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

  // Aim: mouse (held) or arrow keys.
  let ax = 0, ay = 0, aiming = false;
  const kx = (key('ArrowRight') ? 1 : 0) - (key('ArrowLeft') ? 1 : 0), ky = (key('ArrowDown') ? 1 : 0) - (key('ArrowUp') ? 1 : 0);
  p.padAim = false;
  if (kx || ky) { ax = kx; ay = ky; aiming = true; }
  else if (pad.ax || pad.ay) { ax = pad.ax; ay = pad.ay; aiming = true; p.padAim = true; }
  else if (tch.ax || tch.ay) { ax = tch.ax; ay = tch.ay; aiming = true; p.padAim = true; }
  else if (Input.mouseDown && Input.lastAim === 'mouse') { ax = Input.mx - p.x; ay = Input.my - (p.y - 8); aiming = true; }
  if (aiming && p.padAim) {
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
  if (aiming) { p.ax = ax; p.ay = ay; }
  if (aiming) {
    if (Math.abs(ax) > Math.abs(ay) * 1.1) { p.face = 's'; p.flip = ax < 0; } else p.face = ay < 0 ? 'u' : 'd';
    if (p.cool <= 0 && p.dashT <= 0 && (ax || ay)) playerShoot(p, ax, ay);
  } else if (p.moving) {
    if (Math.abs(mx) > Math.abs(my) * 1.1 || (mx && !my)) { p.face = 's'; p.flip = mx < 0; } else p.face = my < 0 ? 'u' : 'd';
  }

  if (pressed('KeyQ', 'Mouse2', 'PadRB', 'PadRT', 'TouchStar')) useStarfall();

  // Orbiting moons: hurt enemies, eat bullets.
  if (p.orbitals) {
    for (const [e, t] of p.orbitHit) { if (t - dt <= 0) p.orbitHit.delete(e); else p.orbitHit.set(e, t - dt); }
    for (let i = 0; i < p.orbitals; i++) {
      const o = orbitPos(p, i);
      for (const e of G.enemies) {
        if (e.spawnT > 0 || e.dead || p.orbitHit.has(e)) continue;
        if (Math.hypot(e.x - o.x, e.y - e.h / 2 - o.y) < e.r + 4) { hurtEnemy(e, p.dmg * 0.8, o.x, o.y); p.orbitHit.set(e, 0.3); }
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

const HERO_WALK = [1, 0, 2, 0];
function drawPlayer(p, ox, oy) {
  if (p.dead) {
    if (p.deadT < 0.9) {
      const f = ['d', 's', 'u', 's'][Math.floor(p.deadT * 12) % 4];
      drawFeet(S('hero_' + f + '0'), ox + p.x, oy + p.y - Math.sin(Math.min(1, p.deadT / 0.9) * Math.PI) * 10, (Math.floor(p.deadT * 12) % 4 === 3 ? 1 : 0) + 2 * (Math.floor(p.deadT * 20) % 2));
    }
    return;
  }
  if (G.warp) { drawWarp(p, ox, oy); return; }
  if (p.hurtT <= 0 && p.inv > 0 && p.dashT <= 0 && Math.floor(p.inv * 16) % 2 === 0) return;
  shadow(ox + p.x, oy + p.y, 12);
  const v = p.face === 's' && p.flip ? 1 : 0;
  if (p.hurtT > 0) { drawFeet(S(p.face === 'u' ? 'hero_u0' : 'hero_' + p.face + '0h'), ox + p.x, oy + p.y + 1, v + (p.hurtT > 0.27 ? 2 : 0)); return; }
  const frame = p.moving ? HERO_WALK[Math.floor(p.walkT / 0.11) % 4] : 0;
  const blink = !p.moving && p.face !== 'u' && (p.idleT || 0) % 3.2 > 3.05;
  drawFeet(S('hero_' + p.face + frame + (blink ? 'b' : '')), ox + p.x, oy + p.y + 1, v);
  if (p.shieldUp) {
    const r = ringSprite(11, Math.floor(G.time * 6) % 2 ? 'c' : 'C');
    ctx.drawImage(r, Math.round(ox + p.x - 11), Math.round(oy + p.y - 20));
  }
}
function drawAimReticle(ox, oy) {
  const p = G.player;
  if (!p.padAim || p.dead) return;
  const l = Math.hypot(p.ax, p.ay) || 1;
  drawS(S('cursor'), Math.round(ox + p.x + p.ax / l * 26) - 4, Math.round(oy + p.y - 8 + p.ay / l * 20) - 4);
}
function drawOrbitals(p, ox, oy) {
  const m = S('moon');
  for (let i = 0; i < p.orbitals; i++) { const o = orbitPos(p, i); drawS(m, ox + o.x - 3, oy + o.y - 3); }
}

// ---------- Player shots ----------
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
    const px = s.x, py = s.y;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.trail && Math.random() < 0.55) part(px, py, 0, 0, 0.22, s.fw ? pick(TRAIL_FW) : TRAIL[s.tint], { size: 1, drag: 1 });
    // enemies first, so nothing hugging a wall is immune
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.ghost || (e.z || 0) > 12) continue;
      if (s.hitList && s.hitList.includes(e)) continue;
      if (Math.hypot(e.x - s.x, e.y - e.h / 2 - s.y) < e.r + s.r) {
        hurtEnemy(e, s.dmg, px, py);
        if (s.fw) {
          for (let k = 0; k < 3 * s.fw; k++) {
            const a = Math.random() * Math.PI * 2;
            SHOTS.push({ x: s.x, y: s.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.25, dmg: s.dmg * 0.4, big: false, r: 2, bounce: 0, pierce: 0, homing: 0, fw: 0, mini: true, hitList: [e], t: 0 });
          }
          burst(s.x, s.y, 8, ['y', 'O', 'P', 'w'], 90, 0.35);
        }
        if (s.pierce > 0) { s.pierce--; (s.hitList || (s.hitList = [])).push(e); } else { s.life = 0; break; }
      }
    }
    // shots fly at hand height; their ground point is a few px lower
    if (s.life > 0 && solidPx(room, s.x, s.y + 4, 'shot')) {
      const c = Math.floor(s.x / 16), r = Math.floor((s.y + 4 - OY) / 16);
      if (tileAt(room, c, r) === T_BRK) breakTile(room, c, r);
      if (s.bounce > 0) {
        s.bounce--;
        const bx = solidPx(room, s.x, py + 4, 'shot'), by = solidPx(room, px, s.y + 4, 'shot');
        if (bx || !by) s.vx = -s.vx;
        if (by || !bx) s.vy = -s.vy;
        s.x = px; s.y = py;
        Audio_.sfx('pop');
      } else s.life = 0;
    }
    if (s.life <= 0) {
      burst(s.x, s.y, s.mini ? 2 : 4, ['Y', 'w', 'y'], 50, 0.25);
      SHOTS[i] = SHOTS[SHOTS.length - 1]; SHOTS.pop();
    }
  }
}
function drawShots(ox, oy) {
  for (const s of SHOTS) if (!s.mini) shadow(ox + s.x, oy + s.y + 7, s.big ? 6 : 4);
  for (const s of SHOTS) {
    const f = Math.floor(s.t * 14) % 2;
    if (s.mini) { rect(ox + s.x - 1, oy + s.y - 1, 2, 2, f ? 'Y' : 'w'); continue; }
    const sp = S((s.big ? 'shotbig' : 'shot') + s.tint + '_' + f);
    drawS(sp, ox + s.x - (sp.w >> 1), oy + s.y - (sp.h >> 1));
  }
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
  if (Math.random() < 0.28 + G.player.luck * 0.08) dropLoot(x, y, 0.6);
}

// ---------- Pickups ----------
function spawnPickup(type, x, y) {
  const a = Math.random() * Math.PI * 2;
  G.room.pickups.push({ type, x, y, z: 0, vz: rnd(70, 110), vx: Math.cos(a) * rnd(10, 40), vy: Math.sin(a) * rnd(8, 30), t: Math.random() * 3 });
}
// Random drop; bias < 1 makes hearts rarer.
function dropLoot(x, y, bias) {
  const p = G.player, r = Math.random();
  const heartChance = (p.hp < p.maxHp ? 0.22 : 0.08) * (bias || 1);
  if (r < heartChance) spawnPickup(Math.random() < 0.3 ? 'heart' : 'half', x, y);
  else if (r < heartChance + 0.07 + p.luck * 0.03) spawnPickup('gem', x, y);
  else spawnPickup('coin', x, y);
}
const PICK_VAL = { coin: 1, gem: 5 };
function updatePickups(dt) {
  const p = G.player, room = G.room;
  const list = room.pickups;
  for (let i = list.length - 1; i >= 0; i--) {
    const k = list[i];
    k.t += dt;
    if (k.z > 0 || k.vz) {
      k.vz -= 320 * dt; k.z += k.vz * dt;
      if (k.z <= 0) { k.z = 0; k.vz = Math.abs(k.vz) > 40 ? -k.vz * 0.4 : 0; }
      const hx = k.x + k.vx * dt, hy = k.y + k.vy * dt;
      if (!solidPx(room, hx, hy, 'enemy')) { k.x = hx; k.y = hy; } else { k.vx = -k.vx; k.vy = -k.vy; }
      k.vx *= Math.pow(0.1, dt); k.vy *= Math.pow(0.1, dt);
    }
    if (p.dead) continue;
    const isHeart = k.type === 'heart' || k.type === 'half';
    const d = Math.hypot(p.x - k.x, p.y - 3 - k.y);
    if (p.magnet && !isHeart && d < 80 && d > 1) {
      const pull = (80 - d) * 4 * dt + 40 * dt;
      k.x += (p.x - k.x) / d * pull; k.y += (p.y - 3 - k.y) / d * pull;
    }
    if (d < 9 && k.z < 6) {
      if (isHeart) {
        if (p.hp >= p.maxHp) continue;
        healPlayer(k.type === 'heart' ? 2 : 1);
        Audio_.sfx('heart');
      } else {
        p.coins = Math.min(999, p.coins + PICK_VAL[k.type]);
        G.hud.coinT = 0.2;
        G.stats.coins += PICK_VAL[k.type];
        Audio_.sfx('coin');
        for (let j = 0; j < 4; j++) part(k.x + rnd(-4, 4), k.y - rnd(2, 8), 0, -20, 0.4, null, { spr: 'sparkle', drag: 1 });
      }
      list[i] = list[list.length - 1]; list.pop();
    }
  }
}
const COIN_FR = ['coin_0', 'coin_1', 'coin_2', 'coin_1'];
function drawPickup(k, ox, oy) {
  const bob = k.z > 0 ? k.z : Math.max(0, Math.sin(k.t * 4)) * 1.5;
  shadow(ox + k.x, oy + k.y, 7);
  let s, v = 0;
  if (k.type === 'coin') { const f = Math.floor(k.t * 8) % 4; s = S(COIN_FR[f]); v = f === 3 ? 1 : 0; }
  else s = S(k.type === 'gem' ? 'gem' : k.type === 'heart' ? 'heart' : 'heart_half');
  drawS(s, ox + k.x - (s.w >> 1), oy + k.y - s.h - bob + 1, v);
}

// ---------- Props: pedestals, merchant, portal ----------
function addPedestal(room, x, y, item, price) { room.props.push({ kind: 'ped', x, y, item, price: price || 0, t: Math.random() * 6 }); }
function nearestProp() {
  const p = G.player;
  let best = null, bd = 18;
  for (const o of G.room.props) {
    if (o.kind !== 'ped' && o.kind !== 'portal') continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
function priceOf(o) { return Math.max(1, Math.round(o.price * (1 - 0.15 * Math.min(3, G.player.luck)))); }

function interact(o) {
  const p = G.player, room = G.room;
  if (o.kind === 'portal') { startWarp(o); return; }
  if (o.price) {
    const cost = priceOf(o);
    const frog = room.props.find(q => q.kind === 'frog');
    if (p.coins < cost) { Audio_.sfx('deny'); G.shake = Math.max(G.shake, 1); if (frog) frog.say = { msg: 'NOT ENOUGH COINS!', until: frog.t + 1.3 }; return; }
    if (frog) frog.say = { msg: 'THANKS! RIBBIT!', until: frog.t + 1.6, happy: true };
    if (o.item === 'hp' && p.hp >= p.maxHp) { Audio_.sfx('deny'); return; }
    p.coins -= cost;
  }
  if (o.item === 'hp') { healPlayer(4); Audio_.sfx('heart'); }
  else giveItem(o.item);
  room.props.splice(room.props.indexOf(o), 1);
  if (o.group) {
    for (let i = room.props.length - 1; i >= 0; i--) {
      const q = room.props[i];
      if (q.group === o.group) { poof(q.x, q.y - 14); room.props.splice(i, 1); }
    }
  }
}
function giveItem(id) {
  const p = G.player;
  ITEMS[id].apply(p);
  p.items.push(id);
  G.stats.items++;
  if (!Save.found.includes(id)) { Save.found.push(id); Save.write(); }
  G.banner = { title: ITEMS[id].name, sub: ITEMS[id].desc, t: 2.6, icon: id };
  Audio_.sfx('item');
  burst(p.x, p.y - 10, 16, ['Y', 'y', 'w', 'P', 'c'], 110, 0.7);
}
// Random items the player can still get.
function itemPool(n) {
  const owned = new Set(G.player.items);
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
    const s = o.item === 'hp' ? S('heart') : S('icon_' + o.item);
    drawS(s, ox + o.x - (s.w >> 1), oy + o.y - 14 - s.h + bob);
    if (Math.floor(o.t * 3) % 4 === 0) drawS(S('sparkle_0'), ox + o.x + 6, oy + o.y - 28 + bob);
    if (o.price) {
      const cost = priceOf(o);
      drawS(S('coin_0'), ox + o.x - 9, oy + o.y + 3);
      text(String(cost), ox + o.x + 1, oy + o.y + 4, G.player.coins >= cost ? 'Y' : 'R', 2);
    }
  } else if (o.kind === 'frog') {
    shadow(ox + o.x, oy + o.y, 16);
    const say = o.say && o.t < o.say.until ? o.say : null;
    const hop = say && say.happy ? Math.round(Math.abs(Math.sin(o.t * 9)) * 4) : 0;
    drawFeet(S(Math.floor(o.t * 2) % 2 ? 'frog_1' : 'frog_0'), ox + o.x, oy + o.y - hop, G.player.x < o.x ? 1 : 0);
    if (say || Math.hypot(G.player.x - o.x, G.player.y - o.y) < 90) {
      const msg = say ? say.msg : G.player.coins >= 15 ? 'RIBBIT! TAKE A LOOK!' : G.player.coins >= 4 ? 'RIBBIT! NEED A HEART?' : 'RIBBIT! GO FIND SOME COINS!';
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
  const luck = G.player.luck;
  for (let i = 0, n = rndi(3, 5) + luck; i < n; i++) spawnPickup('coin', o.x, o.y - 6);
  if (Math.random() < 0.35 + luck * 0.1) spawnPickup('gem', o.x, o.y - 6);
  if (Math.random() < 0.3) spawnPickup(Math.random() < 0.4 ? 'heart' : 'half', o.x, o.y - 6);
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
        if (Math.hypot(e.x - h.x, e.y - h.y) < e.r + 6) hurtEnemy(e, G.player.dmg * 0.5, h.x, h.y, true);
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
function onKill(e) {
  const c = G.combo;
  c.n++; c.t = COMBO_T;
  addCharge(e.elite ? 0.22 : 0.1);
}
function updateCombo(dt) {
  const c = G.combo;
  if (c.t > 0 && (c.t -= dt) <= 0) {
    const n = c.n, p = G.player;
    if (n >= 3) {
      const bonus = Math.floor(n / 3) + (n >= 8 ? 2 : 0) + (n >= 15 ? 3 : 0);
      p.coins = Math.min(999, p.coins + bonus); G.stats.coins += bonus; G.hud.coinT = 0.3;
      if (n >= 6) earnStars(1);
      G.comboPop = { n, bonus, t: 1.6 };
      Audio_.sfx('coin');
    }
    c.n = 0;
  }
  if (G.comboPop && (G.comboPop.t -= dt) <= 0) G.comboPop = null;
}

// ---------- Starfall: special attack charged by fighting ----------
function addCharge(v) {
  const p = G.player;
  if (p.charge >= 1) return;
  p.charge = Math.min(1, p.charge + v * p.chargeMul);
  if (p.charge >= 1) { Audio_.sfx('ready'); G.hud.readyT = 1; }
}
function useStarfall() {
  const p = G.player;
  if (p.charge < 1 || G.fall) { if (p.charge < 1) Audio_.sfx('deny'); return; }
  p.charge = 0; p.inv = Math.max(p.inv, 1.1);
  for (const b of EBULLETS) if (b.life > 0) { b.life = 0; part(b.x, b.y, 0, 0, 0.25, null, { spr: 'sparkle', drag: 1 }); }
  const targets = G.enemies.filter(e => !e.dead && e.spawnT <= 0);
  const drops = [];
  for (let i = 0; i < 14; i++) {
    const e = targets.length && i < targets.length * 2 ? targets[i % targets.length] : null;
    drops.push({ x: e ? e.x + rnd(-6, 6) : rnd(40, VW - 40), y: e ? e.y + rnd(-4, 4) : rnd(60, 190), t: -i * 0.055, hit: false });
  }
  G.fall = { t: 0, drops };
  buzz(120);
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
      if (Math.hypot(e.x - d.x, (e.y - d.y) * 1.3) < 20 + e.r) hurtEnemy(e, 5 + G.player.dmg * 2, d.x, d.y, true);
    }
    poof(d.x, d.y - 4); dust(d.x, d.y, 6, 12);
    burst(d.x, d.y - 4, 10, ['Y', 'w', 'y', 'c'], 110, 0.45);
    G.shake = Math.max(G.shake, 2.5);
    Audio_.sfx('boom');
  }
  if (!live && f.drops.every(d => d.hit)) G.fall = null;
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
