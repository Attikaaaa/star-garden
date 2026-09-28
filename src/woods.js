'use strict';
// ---------- Lantern Woods (Lantern Light) ----------
// The woods are dusk-dim, never black. Each hero's own lantern lights about three tiles round
// them; a shot lights a lamp post (T_LAMP, layout 'l') for LAMP_T seconds, and a cleared room
// keeps its lamps lit. Foes out in the dark show only their eyes; bullets, tells and rings
// always stay above the dark. The light is worked out on every screen from the same things
// (heroes, lit lamps, doors, foes in a tell), so lightAt() agrees for game logic in co-op.
const LAMP_T = 20, LAMP_R = 64, HERO_R = 48, DUSK = 0.72;

// A park lamp: a little roof, warm glass, a wooden post rising a few pixels over the tile above.
LA('lamp_1', `
  ................
  .......32.......
  ......3221......
  ....33222211....
  ....11111111....
  .....1wYYy1.....
  .....1YYyy1.....
  .....1YyyO1.....
  .....1yyOO1.....
  ....32222211....
  ......N2n1......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  ......NNnu......
  .....NNnnnu.....
  ...hGNnnnnuGg...
  ................`);
// unlit: the cold glass keeps one glint of the dusk
LA('lamp_0', `
  ................
  .......32.......
  ......3221......
  ....33222211....
  ....11111111....
  .....1VvvV1.....
  .....1vvV11.....
  .....1vV111.....
  .....1V1111.....
  ....32222211....
  ......N2n1......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  .......Nn.......
  ......NNnu......
  .....NNnnnu.....
  ...hGNnnnnuGg...
  ................`);

// ---------- Lamps ----------
const lampTile = (t) => t === T_LAMP || t === T_LAMPON;
// Where the lamps stand. Rock tiles of a plain fight room may become lamps, and every room gets
// at least two; boss and warden rooms get one near each corner. Seeded by the room, so every
// screen builds the same woods.
const LAMP_CORNERS = { big: [[5, 4], [18, 4], [5, 9], [18, 9]], calm: [[3, 3], [20, 3], [3, 10], [20, 10]] };
function lampOk(room, c, r) {
  const i = r * COLS + c;
  if (room.tiles[i] !== T_FLOOR || c < 2 || c > 21 || r < 3 || r > 10) return false;
  if ((c >= 10 && c <= 13) || (r >= 5 && r <= 8 && (c <= 3 || c >= 20))) return false; // the ways in and out
  for (const [x, y] of room.slots || []) if (Math.abs(x - (c * 16 + 8)) < 24 && Math.abs(y - (OY + r * 16 + 8)) < 24) return false;
  for (let k = 0; k < room.tiles.length; k++) if (lampTile(room.tiles[k]) && Math.abs(k % COLS - c) < 4 && Math.abs(((k / COLS) | 0) - r) < 3) return false;
  return keepsJoined(room, i, T_LAMP);
}
function lampsBuild(room) {
  const t = room.tiles;
  if (room.type === 'slide') return;
  let n = 0;
  for (let i = 0; i < t.length; i++) if (t[i] === T_LAMP) n++;
  if (room.type === 'boss' || room.type === 'warden' || room.type === 'arena' || !room.flip) {
    for (const [c, r] of LAMP_CORNERS[room.flip ? 'big' : 'calm']) if (lampOk(room, c, r)) t[r * COLS + c] = T_LAMP;
    return;
  }
  // a few rocks turn into lamp posts
  for (let i = 0; i < t.length && n < 3; i++) if (t[i] === T_ROCK && hash(i, 21, room.seed) % 5 === 0) { t[i] = T_LAMP; n++; }
  for (let k = 0; n < 2 && k < 40; k++) {
    const h = hash(k, 22, room.seed), c = 3 + h % 18, r = 3 + (h >>> 8) % 8;
    if (lampOk(room, c, r)) { t[r * COLS + c] = T_LAMP; n++; }
  }
}
// A shot hit a lamp: it lights (again) for LAMP_T seconds. Only where the game runs.
function lampHit(room, c, r) {
  if (NET.role === 'client') return;
  if (room.dark) { poof(c * 16 + 8, OY + r * 16 - 2); return; } // the Eclipse: no lamp will take
  const was = tileAt(room, c, r);
  setTile(room, c, r, T_LAMPON); // setTile stamps the time, which is also the lamp's clock
  if (was === T_LAMPON) return;
  const x = c * 16 + 8, y = OY + r * 16 - 1;
  burst(x, y, 10, ['Y', 'y', 'O'], 50, 0.5, { g: -30 });
  Audio_.sfx('lamp');
  if (!Save.flags.lampTip) { Save.flags.lampTip = true; Save.write(); toast('A LIT LAMP KEEPS THE DARK AWAY'); }
}
const lampLeft = (room, i) => LAMP_T - (G.time - ((room.tAt && room.tAt.get(i)) || -99));

// ---------- The light ----------
const TELL_STATES = new Set(['tele', 'aim', 'charge', 'rise']);
function woodsLight(room) {
  lightReset(0); // a sparse dither reads as a mesh, so the dusk stays whole and the pools do the work
  for (const p of G.players) if (!p.dead) lightAdd(p.x, p.y - 6, alive(p) ? HERO_R + 16 * (p.wick || 0) : 24);
  const t = room.tiles;
  for (let i = 0; i < t.length; i++) if (t[i] === T_LAMPON) lightAdd((i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 - 1, LAMP_R);
  for (const d in room.doors) if (!hiddenDoor(room, d)) { const [x, y] = ENTRY[d]; lightAdd(x, y, room.cleared ? 28 : 16); }
  for (const e of G.enemies) {
    if (e.dead) continue;
    if (EDEF[e.type].light) EDEF[e.type].light(e);
    else if (e.boss || EDEF[e.type].warden) lightAdd(e.x, e.y - 12, 28);
    else if (TELL_STATES.has(e.state) || glintAt(e)) lightAdd(e.x, e.y - 6, 20);
  }
  for (const k of room.pickups) if (k.type === 'ffly') lightAdd(k.x, k.y - 8 - (k.z || 0), 16); else lightAdd(k.x, k.y - 3, 10);
  for (const k of G.markers) if (k.kind === 'zap' && k.c === 'fire') lightAdd(k.x, k.y, 16);
}
// Two dots where a foe's face is, for foes the light does not reach.
function foeEyes(e, ox, oy) {
  const s = enemySprite(e), z = Math.round(e.z || 0);
  const x = Math.round(ox + e.x), y = Math.round(oy + e.y - z - s.h * 0.55), gap = Math.max(2, Math.round(s.w / 7));
  const blink = Math.floor(G.time * 0.7 + e.x * 0.13) % 9 === 0 && (G.time * 5 + e.y) % 1 < 0.5;
  if (blink || e.state === 'lamp') return; // a Mushroom Mime keeps its secret
  if (e.state === 'sleep') { rect(x - gap - 1, y, 2, 1, 'o'); rect(x + gap - 1, y, 2, 1, 'o'); return; } // shut eyes
  rect(x - gap - 1, y, 2, 1, 'Y'); rect(x + gap - 1, y, 2, 1, 'Y');
}

LAND_MECH.lantern = {
  build: lampsBuild,
  // host / solo: lamps gutter out; a cleared room lights them all for good
  update(dt, room) {
    const t = room.tiles;
    fireflies(dt, room);
    // now and then a Pumpkin Hopper wanders into a fight
    if (room.phop === undefined) room.phop = room.type === 'normal' && !room.cleared && !G.first && grand() < 0.2 ? grnd(4, 8) : 0;
    if (room.phop > 0 && G.enemies.length && (room.phop -= dt) <= 0) {
      room.phop = 0;
      const d = ['l', 'r', 'u', 'd'].find(k => room.doors[k]) || 'l', [x, y] = ENTRY[d];
      spawnEnemy('phop', x, y, { elite: true });
      toast('A PUMPKIN HOPPER! MIND THE FLAMES!');
    }
    for (let i = 0; i < t.length; i++) {
      if (t[i] === T_LAMP && room.cleared) {
        setTile(room, i % COLS, (i / COLS) | 0, T_LAMPON);
        burst((i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 - 1, 6, ['Y', 'y'], 40, 0.4, { g: -30 });
        Audio_.sfx('lamp');
      } else if (t[i] === T_LAMPON && !room.cleared && lampLeft(room, i) <= 0) {
        setTile(room, i % COLS, (i / COLS) | 0, T_LAMP);
        poof((i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 - 2);
        Audio_.sfx('snuff');
      }
    }
  },
  every(dt, room) {
    woodsLight(room);
    if (!Save.flags.woods) { Save.flags.woods = true; Save.write(); } // unlocks the BRIGHT WOODS setting
  },
  drawLayer(ox, oy, room, layer) {
    if (layer === 0) {
      // a lamp near its end flickers (the tile time is known on every screen)
      const t = room.tiles;
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== T_LAMPON || room.cleared) continue;
        const left = lampLeft(room, i);
        if (left > 3 || Math.floor(G.time * (left < 1.5 ? 14 : 7)) % 3) continue;
        const sp = S('lamp_0'), c = i % COLS, r = (i / COLS) | 0;
        drawS(sp, ox + c * 16, oy + OY + r * 16 + 16 - sp.h);
      }
      return;
    }
    if (layer !== 1) return;
    const amb = LIGHT.amb, n = LIGHT.n;
    for (const a of AMB) if (a.life > 0 && a.kind === 'ffly') lightAdd(a.x, a.y, 7); // fireflies glow, for the eye only
    drawLight(ox, oy, Save.settings.bright ? DUSK * 0.4 : DUSK); // BRIGHT WOODS: seen, not played
    LIGHT.amb = amb; LIGHT.n = n;
    // what must never hide in the dark: tells, rings, dazed sparkles, and foes' eyes
    drawMarkers(ox, oy);
    for (const e of G.enemies) {
      if (e.dead) continue;
      const g = glintAt(e), z = Math.round(e.z || 0);
      if (g && Math.floor(e.anim * 16) % 2) drawS(S('sparkle_0'), ox + e.x + g[0] - 1, oy + e.y + g[1] - z - 1);
      if (e.stag > 0) { const s = enemySprite(e); for (let k = 0; k < 3; k++) { const a = e.anim * 5 + k * 2.1; drawS(S('sparkle_c'), ox + e.x + Math.round(Math.cos(a) * 12) - 1, oy + e.y - z + 1 - s.h + Math.round(Math.sin(a) * 3) - 2); } }
      if (e.fk && e.state === 'shadow') hootEyes(e, ox, oy);
      else if (lightAt(e.x, e.y - 6) === 0) foeEyes(e, ox, oy);
    }
    // light finds the cracks of a secret door
    if (room.hidden) for (const d in room.hidden) {
      const [x, y] = d === 'u' ? [188, OY + 18] : d === 'd' ? [188, OY + 196] : d === 'l' ? [4, OY + 104] : [372, OY + 104];
      if (lightAt(x + 4, y + 4) < 2) continue;
      drawS(S('crack'), ox + x, oy + y);
      if (Math.floor(G.time * 3) % 2) drawS(S('sparkle_0'), ox + x + 3, oy + y - 2);
    }
  },
};

// ---------- Rooms ----------
LAND_LAYOUTS.lantern = {
  // Lantern Alley: two rows of posts along the lane
  alley: `......................
    ..e.......ee.......e..
    ...l....l....l....l...
    #....................#
    ......................
    ......................
    #....................#
    ...l....l....l....l...
    ..e.......ee.......e..
    ......................`,
  // Hollow Log: a fallen trunk to run through, a lamp at each end
  hollow: `......................
    ..e.......e........e..
    ......................
    ...#######..#######...
    ...l..............l...
    ........e....e........
    ...#######..#######...
    ......................
    ..e.......e........e..
    ......................`,
  // Mushroom Ring: a fairy ring of breakable caps round a lamp
  ring: `......................
    ..e................e..
    ........bb..bb........
    ......b........b......
    .....b....l.....b.....
    .....b.....e....b.....
    ......b........b......
    ........bb..bb........
    ..e................e..
    ......................`,
  // Firefly Glade: a still pond with lamps round its bank
  glade: `......................
    ..e..l.........l..e...
    ......................
    ........~~~~~~........
    .......~~~~~~~~.......
    ...e...~~~~~~~~...e...
    ........~~~~~~........
    ......................
    ..e..l.........l..e...
    ......................`,
  // Creek Crossing: a brook with one bridge, lit at both ends
  creek: `.......~~.............
    ..e....~~....e........
    .......~~.............
    ......l~~l............
    ......................
    ......................
    .......~~l.......e....
    .......~~.............
    ..e....~~.........e...
    .......~~.............`,
  // Scarecrow Field: rows of pumpkin patches, a post in the middle
  field: `......................
    ..e..l....ee....l..e..
    ......................
    ..bbbb.bbb..bbb.bbbb..
    ..........#...........
    ......................
    ..bbbb.bbb..bbb.bbbb..
    ......................
    ..e..l....ee....l..e..
    ......................`,
};
for (const k in LAND_LAYOUTS.lantern) LAND_LAYOUTS.lantern[k] = LAND_LAYOUTS.lantern[k].split('\n').map(r => r.trim());

// ---------- Foes ----------
// the nearest lamp tile of a kind (T_LAMPON, T_LAMP) to x, y: its index, or -1
function nearestLamp(room, x, y, tile, skip) {
  let best = -1, bd = 1e9;
  for (let i = 0; i < room.tiles.length; i++) {
    if (room.tiles[i] !== tile || (skip && skip(i))) continue;
    const d = Math.hypot((i % COLS) * 16 + 8 - x, OY + ((i / COLS) | 0) * 16 + 8 - y);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
const lampXY = (i) => [(i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16];
// a Stump Sentry sees a hero standing in a lamp's light (or anyone, for a while after a shot hurt it)
function stumpSees(e, room) {
  const angry = G.time - (e.hurtAt || -99) < 3;
  let best = null, bd = 1e9;
  for (const p of G.players) {
    if (!alive(p)) continue;
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    if (d >= bd || d > 220) continue;
    const l = angry ? 0 : nearestLamp(room, p.x, p.y, T_LAMPON);
    if (!angry && (l < 0 || Math.hypot(p.x - lampXY(l)[0], p.y - lampXY(l)[1] - 8) > LAMP_R * 0.8)) continue;
    bd = d; best = p;
  }
  return best;
}
// A foe of the woods sets a firefly free: it flies to the nearest dark lamp and lights it.
// It rides with the pickups (so clients draw it from snapshots) but is never picked up.
function releaseFfly(x, y) {
  if (NET.role === 'client' || !G.room) return;
  G.room.pickups.push({ type: 'ffly', x, y, z: 6, vz: 0, vx: 0, vy: 0, t: 0, ok: true });
}
function drawFfly(k, ox, oy) {
  const x = Math.round(ox + k.x + Math.sin(k.t * 5) * 2), y = Math.round(oy + k.y - 8 - (k.z || 0) + Math.sin(k.t * 7) * 1.5);
  shadow(ox + k.x, oy + k.y, 4);
  const on = Math.floor(k.t * 6) % 3;
  rect(x - 1, y, 3, 1, on ? 'y' : 'O'); rect(x, y - 1, 1, 3, on ? 'y' : 'O'); rect(x, y, 1, 1, on ? 'w' : 'Y');
}
// a patch of burning ground (a 'zap' marker with c: 'fire'): it blinks out over the last half second
function drawFlame(k, ox, oy) {
  if (k.t < 0.5 && Math.floor(k.t * 12) % 2) return;
  const s = S('flame_' + (Math.floor(G.time * 8 + k.x) % 2));
  drawS(s, Math.round(ox + k.x - (s.w >> 1)), Math.round(oy + k.y + 6 - s.h));
}
const burnAt = (x, y, t) => { const [cx, cy] = cellMid(x, y); G.markers.push({ kind: 'zap', c: 'fire', x: cx, y: cy, t, max: t, src: 'phop' }); };

Object.assign(EDEF, {
  // calm: it only wants your coins; caught, it drops them (and the wisp of its tail flies free)
  wfox: { hp: 6, r: 6, h: 11, hw: 5, hh: 3, sw: 14, colors: ['O', 'o', 'C'],
    sprite: (e) => S((e.loot ? 'wfox_c' : 'wfox_') + (Math.floor(e.anim * (e.state === 'flee' ? 10 : 6)) % 2)),
    init: (e) => { e.calm = true; e.loot = 0; },
    light: (e) => lightAdd(e.x - (e.flip ? -7 : 7), e.y - 8, e.loot ? 26 : 12),
    die: (e) => { for (let i = 0; i < e.loot; i++) spawnPickup('coin', e.x, e.y - 6); if (e.loot) toast('YOUR COINS ARE BACK!'); releaseFfly(e.x, e.y - 6); } },
  // asleep (and harmless) in the dark; a hero in a lamp's light wakes it
  stump: { hp: 12, r: 7, h: 13, hw: 6, hh: 4, sw: 16, still: true, colors: ['N', 'n', 'h'],
    init: (e) => { e.state = 'sleep'; e.calm = true; },
    sprite: (e) => S('stump_' + (e.state === 'sleep' ? 0 : e.state === 'aim' ? 2 : 1)),
    glint: (e) => (e.state === 'aim' && e.t < 0.3 ? [0, -7] : null) },
  lmoth: { hp: 5, r: 6, h: 12, hw: 5, hh: 3, sw: 12, fly: true, colors: ['4', '3', 'y'],
    sprite: (e) => S('lmoth_' + (Math.floor(e.anim * (e.state === 'tele' ? 16 : 8)) % 2)),
    glint: (e) => (e.state === 'aim' && e.t < 0.3 ? [0, -6] : null),
    die: (e) => releaseFfly(e.x, e.y - 6) },
  owlet: { hp: 7, r: 6, h: 12, hw: 5, hh: 3, sw: 10, fly: true, colors: ['N', 'n', 'Y'],
    sprite: (e) => S('owlet_' + (e.state === 'sleep' ? 1 : e.state === 'dive' || e.state === 'back' ? 2 : 0)),
    glint: (e) => (e.state === 'tele' && e.t < 0.3 ? [0, -9] : null) },
  // stands as an unlit lamp post until a shot or a close hero finds it out
  mime: { hp: 8, r: 6, h: 14, hw: 5, hh: 4, sw: 14, still: true, colors: ['P', 'q', 'w'],
    init: (e) => { e.x = Math.floor(e.x / 16) * 16 + 8; e.y = OY + Math.floor((e.y - OY) / 16) * 16 + 12; e.state = 'lamp'; e.calm = true; },
    sprite: (e) => S(e.state === 'pop' || e.state === 'aim' ? 'mime_1' : 'mime_0'),
    glint: (e) => ((e.state === 'pop' || e.state === 'aim') && e.t < 0.3 ? [0, -12] : null),
    draw: (e, ox, oy) => {
      if (e.state !== 'lamp') return false;
      // the last one left gives itself away with a little wobble
      const sp = S('lamp_0'), last = G.enemies.every(q => q === e || q.dead), w = last && Math.floor(G.time * 6) % 4 === 0 ? 1 : 0;
      drawS(sp, ox + e.x - 8 + w, oy + e.y - 12 + 16 - sp.h, e.flash > 0 ? 2 : 0);
      return true;
    } },
  // an elite that wanders in: each landing sets the ground (and any dark lamp near it) alight
  phop: { hp: 16, r: 7, h: 14, hw: 6, hh: 4, sw: 16, colors: ['O', 'o', 'y'],
    sprite: (e) => S(e.z > 1 ? 'phop_1' : 'phop_0'),
    light: (e) => lightAdd(e.x, e.y - 8 - (e.z || 0), 36) },
});
Object.assign(FOE_NAMES, { wfox: 'WISP FOX', stump: 'STUMP SENTRY', lmoth: 'LAMP MOTH', owlet: 'OWLET', mime: 'MUSHROOM MIME', phop: 'PUMPKIN HOPPER' });

// wander about a hero at a distance (the moth with no lamp to put out)
function hoverNear(e, dt, room, p, sp) {
  if ((e.wT = (e.wT || 0) - dt) <= 0) {
    e.wT = grnd(0.8, 1.4);
    const a = Math.atan2(e.y - p.y, e.x - p.x) + grnd(-0.9, 0.9), d = grnd(55, 85);
    e.wx = Math.max(24, Math.min(VW - 24, p.x + Math.cos(a) * d));
    e.wy = Math.max(OY + 40, Math.min(OY + 184, p.y + Math.sin(a) * d * 0.7));
  }
  const dx = e.wx - e.x, dy = e.wy - e.y, d = Math.hypot(dx, dy) || 1, s = d < 6 ? 0 : sp;
  e.vx += (dx / d * s - e.vx) * 3 * dt; e.vy += (dy / d * s - e.vy) * 3 * dt;
}
Object.assign(AI, {
  // Sneaks up (harmless) and snatches up to five coins, then runs; catch it before it slips away.
  wfox(e, dt, room, p) {
    e.t -= dt;
    if (e.state === 'idle') { e.state = 'sneak'; e.t = 0; }
    if (e.state === 'sneak') {
      const d = towardPlayer(e);
      moveBox(room, e, d.x * 52 * dt, d.y * 52 * dt, 'enemy');
      e.flip = d.x < 0;
      for (const q of G.players) if (alive(q) && Math.hypot(q.x - e.x, q.y - e.y) < 11) {
        e.loot = Math.min(5, G.coins); G.coins -= e.loot;
        if (e.loot) { toast('THE WISP FOX TOOK ' + e.loot + ' COINS! CATCH IT!'); Audio_.sfx('coin'); burst(q.x, q.y - 10, 8, ['y', 'Y', 'w'], 60, 0.4); }
        e.state = 'flee'; e.t = e.loot ? grnd(5, 6) : 1.5; Audio_.sfx('swish');
        break;
      }
    } else if (e.state === 'flee') {
      // away from the hero, weaving
      const a = Math.atan2(e.y - p.y, e.x - p.x) + Math.sin(e.anim * 5) * 0.6;
      if (moveBox(room, e, Math.cos(a) * 64 * dt, Math.sin(a) * 64 * dt, 'enemy')) moveBox(room, e, -Math.sin(a) * 64 * dt, Math.cos(a) * 64 * dt, 'enemy');
      e.flip = Math.cos(a) < 0;
      if (e.t <= 0) {
        if (!e.loot) { e.state = 'sneak'; return; }
        e.dead = true; poof(e.x, e.y - 6); Audio_.sfx('tele'); toast('THE WISP FOX GOT AWAY!');
      }
    }
  },
  // Sleeps until a hero stands in lamplight near it, then lobs three acorns at a time.
  stump(e, dt, room) {
    e.t -= dt;
    e.calm = e.state === 'sleep';
    const q = e.state === 'sleep' || e.state === 'rest' ? (e.k = (e.k || 0) - dt) <= 0 && (e.k = 0.2, stumpSees(e, room)) : null;
    if (e.state === 'sleep') { if (q) { e.state = 'wake'; e.t = 0.3; e.tg = q; Audio_.sfx('clack'); dust(e.x, e.y, 3, 10); } }
    else if (e.state === 'wake') { if (e.t <= 0) { e.state = 'aim'; e.t = 0.5; } }
    else if (e.state === 'aim') {
      const tg = alive(e.tg) ? e.tg : EP;
      e.flip = tg.x < e.x;
      if (e.t <= 0) {
        E_SRC = 'stump';
        fan(e.x, e.y - 7, Math.atan2(tg.y - 7 - (e.y - 7), tg.x - e.x), 3, 0.3, 78, 'acorn');
        Audio_.sfx('eshoot');
        e.state = 'rest'; e.t = 1.2;
      }
    } else if (e.state === 'rest' && e.t <= 0) {
      const s = stumpSees(e, room);
      if (s) { e.state = 'aim'; e.t = 0.5; e.tg = s; } else { e.state = 'sleep'; poof(e.x, e.y - 10); }
    } else if (e.state === 'idle') e.state = 'sleep';
  },
  // Flies to the nearest lit lamp and beats its wings over it until it goes out; with every
  // lamp dark it flutters round a hero, flinging wing dust.
  lmoth(e, dt, room, p) {
    e.t -= dt;
    e.z = 10 + Math.sin(e.anim * 3) * 2;
    const L = e.state === 'aim' || e.state === 'tele' ? -1 : nearestLamp(room, e.x, e.y, T_LAMPON);
    if (e.state === 'tele') {
      e.vx *= 0.8; e.vy *= 0.8;
      if (e.li >= 0 && room.tiles[e.li] !== T_LAMPON) { e.state = 'fly'; e.t = 1; } // someone else put it out
      else if (e.t <= 0) {
        const [x, y] = lampXY(e.li);
        setTile(room, e.li % COLS, (e.li / COLS) | 0, T_LAMP);
        poof(x, y - 1); Audio_.sfx('snuff'); burst(x, y - 2, 6, ['4', '3', 'w'], 40, 0.4);
        e.state = 'fly'; e.t = 2.5; e.cool = 2.5;
      }
    } else if (e.state === 'aim') {
      e.vx *= 0.85; e.vy *= 0.85; e.flip = p.x < e.x;
      if (e.t <= 0) { E_SRC = 'lmoth'; fan(e.x, e.y - 6 - e.z, aimAt(e.x, e.y - 6 - e.z), 2, 0.25, 72, 'dust'); Audio_.sfx('eshoot'); e.state = 'fly'; e.t = grnd(2, 2.6); }
    } else {
      if (e.state === 'idle') { e.state = 'fly'; e.t = grnd(1.2, 2); }
      e.cool = (e.cool || 0) - dt;
      if (L >= 0 && e.cool <= 0) {
        const [x, y] = lampXY(L), dx = x - e.x, dy = y + 14 - e.y, d = Math.hypot(dx, dy) || 1;
        e.vx += (dx / d * 50 - e.vx) * 3 * dt; e.vy += (dy / d * 50 - e.vy) * 3 * dt;
        if (d < 4) { e.state = 'tele'; e.t = 0.8; e.li = L; Audio_.sfx('charge'); }
      } else {
        hoverNear(e, dt, room, p, 40);
        if (e.t <= 0) { e.state = 'aim'; e.t = 0.5; }
      }
      if (Math.abs(e.vx) > 3) e.flip = e.vx < 0;
    }
    moveBox(room, e, e.vx * dt, e.vy * dt, 'fly');
  },
  // Takes a lamp post for its perch. While its lamp is dark it sleeps (a shot wakes it for
  // good); lit, it watches, then swoops down a cyan lane and flaps back up.
  owlet(e, dt, room, p) {
    e.t -= dt;
    if (e.hurtAt) e.awake = true;
    if (e.pl === undefined) {
      const mine = new Set(G.enemies.filter(q => q !== e && q.type === 'owlet' && q.pl >= 0).map(q => q.pl));
      e.pl = nearestLamp(room, e.x, e.y, T_LAMP, i => mine.has(i));
      if (e.pl < 0) e.pl = nearestLamp(room, e.x, e.y, T_LAMPON, i => mine.has(i));
      if (e.pl >= 0) { const [x, y] = lampXY(e.pl); e.px = x; e.py = y + 12; e.pz = 18; } else { e.px = e.x; e.py = e.y; e.pz = 8; e.awake = true; }
      e.state = 'go';
    }
    const lit = e.awake || room.tiles[e.pl] === T_LAMPON;
    e.calm = e.state === 'sleep';
    if (e.state === 'go' || e.state === 'back') {
      const dx = e.px - e.x, dy = e.py - e.y, d = Math.hypot(dx, dy), sp = e.state === 'go' ? 60 : 90;
      if (d > 1) { const m = Math.min(d, sp * dt); e.x += dx / d * m; e.y += dy / d * m; e.flip = dx < 0; }
      e.z += (e.pz - e.z) * Math.min(1, 4 * dt);
      if (d <= 1 && Math.abs(e.z - e.pz) < 1) { e.state = 'perch'; e.t = grnd(1.2, 1.8); }
    } else if (e.state === 'sleep') { if (lit) { e.state = 'perch'; e.t = 0.8; Audio_.sfx('crow'); } }
    else if (e.state === 'perch') {
      e.flip = p.x < e.x;
      if (!lit) { e.state = 'sleep'; return; }
      if (e.t <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 170) { e.state = 'tele'; e.t = 0.55; lane(e, p, 120); Audio_.sfx('tele'); }
    } else if (e.state === 'tele') { if (e.t <= 0) { e.state = 'dive'; e.n = 0; Audio_.sfx('swish'); } }
    else if (e.state === 'dive') {
      const st = 160 * dt;
      e.z += (4 - e.z) * Math.min(1, 6 * dt);
      e.n += st;
      if (moveBox(room, e, Math.cos(e.la) * st, Math.sin(e.la) * st, 'fly') || e.n > 130) { e.state = 'back'; e.t = 0.8; }
    } else if (e.state === 'idle') e.state = 'go';
  },
  // Stands among the lamps as one. Found out (a shot, or a hero walking up), it pops up and
  // puffs a ring of spores, then keeps puffing three at a time.
  mime(e, dt, room, p) {
    e.t -= dt;
    e.calm = e.state === 'lamp';
    E_SRC = 'mime';
    if (e.state === 'lamp') {
      if (e.hurtAt || G.players.some(q => alive(q) && Math.hypot(q.x - e.x, q.y - e.y) < 18)) { e.state = 'pop'; e.t = 0.5; Audio_.sfx('pop'); dust(e.x, e.y, 4, 10); }
    } else if (e.state === 'pop') { if (e.t <= 0) { ring(e.x, e.y - 10, 6, 60, 'spore', grand()); Audio_.sfx('eshoot'); e.state = 'wait'; e.t = 1.4; } }
    else if (e.state === 'wait') { e.flip = p.x < e.x; if (e.t <= 0) { e.state = 'aim'; e.t = 0.5; } }
    else if (e.state === 'aim') { if (e.t <= 0) { fan(e.x, e.y - 10, aimAt(e.x, e.y - 10), 3, 0.3, 70, 'spore'); Audio_.sfx('eshoot'); e.state = 'wait'; e.t = 1.4; } }
    else if (e.state === 'idle') e.state = 'lamp';
  },
  // Three hops toward a hero (a pink ring shows each landing); the ground it lands on burns
  // for a moment, and a dark lamp beside it catches light.
  phop(e, dt, room) {
    e.t -= dt;
    const hop = () => {
      const d = towardPlayer(e); e.vx = d.x * 60; e.vy = d.y * 60; e.flip = e.vx < 0; e.t = 0.55;
      const [x, y] = cellMid(e.x + e.vx * 0.55, e.y + e.vy * 0.55);
      G.markers.push({ kind: 'zone', x, y: y + 2, t: 0.55, max: 0.55 });
    };
    if (e.state === 'idle') { if (e.t <= 0) { e.state = 'hop'; e.n = 3; hop(); } }
    else if (e.state === 'hop') {
      e.z = Math.sin((1 - Math.max(0, e.t) / 0.55) * Math.PI) * 14;
      moveBox(room, e, e.vx * dt, e.vy * dt, 'enemy');
      if (e.t <= 0) {
        e.z = 0; dust(e.x, e.y, 3, 10); Audio_.sfx('land');
        if (!solidPx(room, e.x, e.y - 1, 'enemy')) burnAt(e.x, e.y, 2);
        const c = Math.floor(e.x / 16), r = Math.floor((e.y - 1 - OY) / 16);
        for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) if (tileAt(room, x, y) === T_LAMP && Math.hypot(x * 16 + 8 - e.x, OY + y * 16 + 8 - e.y) < 24) lampHit(room, x, y);
        if (--e.n > 0) hop(); else { e.state = 'idle'; e.t = grnd(1, 1.4); }
      }
    }
  },
});
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'wfox', spr: 'wfox_0', lore: ['A FOX WITH A WISP FOR A TAIL.', 'IT STEALS COINS, NOT HEARTS.', 'CATCH IT AND THE WISP FLIES FREE.'] },
  { t: 'stump', spr: 'stump_1', lore: ['AN OLD STUMP THAT HATES THE LIGHT.', 'STAND IN A LAMP GLOW AND IT WAKES.', 'IN THE DARK IT ONLY SNORES.'] },
  { t: 'lmoth', spr: 'lmoth_0', lore: ['IT CANNOT LEAVE A LAMP ALONE.', 'IT BEATS ITS WINGS TILL THE FLAME DIES.', 'CATCH IT OVER THE GLASS.'] },
  { t: 'owlet', spr: 'owlet_0', lore: ['IT SLEEPS ON A LAMP POST.', 'LIGHT ITS LAMP AND IT WAKES UP GRUMPY.', 'IT SWOOPS DOWN THE CYAN LANE.'] },
  { t: 'mime', spr: 'mime_0', lore: ['A MUSHROOM THAT PLAYS AT BEING A LAMP.', 'A LAMP THAT NEVER LIGHTS IS NO LAMP.', 'FOUND OUT, IT PUFFS A RING OF SPORES.'] },
  { t: 'phop', spr: 'phop_0', lore: ['A PUMPKIN WITH A CANDLE INSIDE.', 'WHERE IT LANDS, THE GROUND BURNS.', 'IT LIGHTS EVERY LAMP IT PASSES.'] },
);

// the host moves the freed fireflies: to the nearest dark lamp, which they light; with none
// left they drift up into the canopy
function fireflies(dt, room) {
  const list = room.pickups;
  for (let i = list.length - 1; i >= 0; i--) {
    const k = list[i];
    if (k.type !== 'ffly') continue;
    const L = nearestLamp(room, k.x, k.y, T_LAMP);
    if (L < 0) { k.z += 12 * dt; if (k.z > 24) { list[i] = list[list.length - 1]; list.pop(); } continue; }
    const [x, y] = lampXY(L), dx = x - k.x, dy = y + 12 - k.y, d = Math.hypot(dx, dy);
    k.z += (10 - k.z) * Math.min(1, 2 * dt);
    if (d < 4) { lampHit(room, L % COLS, (L / COLS) | 0); list[i] = list[list.length - 1]; list.pop(); continue; }
    const m = Math.min(d, 40 * dt); k.x += dx / d * m; k.y += dy / d * m;
  }
}

// ---------- The Scarecrow (warden of the Lantern Woods) ----------
// A straw scarecrow on a pole with a lantern in its hand. It hops a little closer, then sweeps
// its lantern's beam over the field (the dotted rays on the ground show it): a hero caught in
// the beam is spotted (pink blink, 0.45 s) and gets three embers. Every third sweep it lifts
// the lantern high (glint, 0.7 s) and glares: the beam turns steadily and burns whoever stands
// in it, but a lamp post or rock between you and it is shade, and so is the ring right at its
// foot. Its lantern is its weak spot: three shots into it and it reels. Phase 2: two beams,
// back to back, five embers.
(function scareArt() {
  const o = { flash: true };
  const MOUTH = { calm: 'u.u.u\n.u.u.', squint: '.000.\n0yYy0\n.000.', mad: '0u0u0\n.u.u.', daze: '.u.u.\nu.u..', dead: '00000' };
  const scare = (f) => {
    const dy = f.d ? 3 : f.st ? 2 : f.b ? 1 : f.m ? -1 : 0, up = f.tl || f.a;
    let r = sculpt(32, 32, [
      { r: [15, 24, 3, 8, 0.5], ramp: 'unNa', hi: false },
      { r: [3, 17 + dy, 26, 4, 1.5], ramp: '1223' },
      { r: [9, 16 + dy, 14, 9, 3], ramp: '1223' },
      ...(up ? [{ r: [24, 11 + dy, 4, 8, 1], ramp: '1223' }] : []),
      { e: [16, 12 + dy, 7, 5.5], ramp: 'neaA' },
      { r: [6, 5 + dy + (f.d ? 1 : 0), 20, 3, 1], ramp: 'unNa' },
      { r: [11 + (f.d ? 2 : 0), 1 + dy, 10, 5, 1.5], ramp: 'unNa' },
    ]);
    // the hat's band, straw at the hands, the hem and the collar, patches on the coat
    r = stamp(r, 11 + (f.d ? 2 : 0), 4 + dy, f.p ? 'rrrrrrrrrr' : 'oooooooooo');
    r = stamp(r, 2, 17 + dy, 'Y\ny\nO');
    if (!up) r = stamp(r, 29, 17 + dy, 'Y\ny\nO');
    r = stamp(r, 10, 25 + dy, 'y.Y.y.O.y.Y.y');
    r = stamp(r, 11, 18 + dy, 'yYO.yOYy.Oy');
    r = stamp(r, 11, 19 + dy, f.p ? 'rR\nrr' : 'qP\nPP');
    r = stamp(r, 19, 21 + dy, f.p ? 'Rr\nrr' : 'Pq\nPP');
    // the lantern: hanging at its side, or held high on the raised arm
    const glass = f.st || f.d ? 'VvvV\nvvVV' : 'YwyO\nyYOO';
    const lan = 'nnnn\n' + glass + '\nnnnn';
    r = stamp(r, 26, up ? 7 + dy : 21 + dy, lan);
    if (!up) r = stamp(r, 27, 20 + dy, 'nn');
    r = autoOutline(r);
    r = bossEyes(r, 11, 9 + dy, 6, f.face);
    r = stamp(r, 14, 14 + dy, MOUTH[f.face]);
    return rim(r, { 2: '3', 3: '4', a: 'A', N: 'a' });
  };
  bossFrames('scare', scare, o);
})();
const SCARE_SAFE = 22, SCARE_ARC = 0.35, SCARE_LEN = 150;
const scareLamp = (e) => [e.x + (e.flip ? -12 : 12), e.y - (e.state === 'raise' || e.state === 'glare' ? 21 : 8)];
const scareBeams = (e) => (e.p2 ? [e.w, e.w + Math.PI] : [e.w]);
// is this hero in a beam: inside the arc, past the shade at its foot, in reach, and seen
function scareCone(e, p) {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
  if (Math.hypot(dx, dy / 0.6) < SCARE_SAFE || d > SCARE_LEN) return false;
  for (const w of scareBeams(e)) {
    const a = Math.atan2(Math.sin(Math.atan2(dy, dx) - w), Math.cos(Math.atan2(dy, dx) - w));
    if (Math.abs(a) < SCARE_ARC && clearLine(G.room, e.x, e.y - 6, p.x, p.y - 6)) return true;
  }
  return false;
}
Object.assign(EDEF, {
  scare: { hp: 300, r: 8, h: 26, hw: 8, hh: 5, sw: 20, warden: true, intro: 'IT WATCHES THE FIELD ALL NIGHT',
    colors: ['2', '3', 'y'],
    init: (e) => { e.state = 'walk'; e.t = 1.5; e.n = 0; e.w = 0; e.k = 0; e.lh = 0; },
    hits: (e, p) => e.state === 'glare' && !(e.stag > 0) && scareCone(e, p),
    sprite: (e) => {
      if (e.stag > 0) return S('scare_stag');
      const f = { spot: 'tell', raise: 'tell', glare: 'atk' }[e.state];
      return bossFrame(e, f || (e.state === 'walk' && e.z > 1 ? 'move' : bob(e, 2, '0', '1')));
    },
    glint: (e) => (e.state === 'spot' || e.state === 'raise' ? [(e.flip ? -12 : 12), e.state === 'raise' ? -24 : -11] : null),
    light: (e) => {
      if (e.stag > 0) { lightAdd(e.x, e.y - 12, 20); return; }
      lightAdd(e.x, e.y - 12, 28);
      if (e.state !== 'sweep' && e.state !== 'spot' && e.state !== 'glare') return;
      for (const w of scareBeams(e)) for (const d of [40, 70, 100, 130]) lightAdd(e.x + Math.cos(w) * d, e.y - 6 + Math.sin(w) * d * 0.9, 10 + d * 0.25);
    },
    under: (e, ox, oy) => {
      if (e.stag > 0) return;
      // the shade at its foot while it glares
      if (e.state === 'raise' || e.state === 'glare') {
        const R = SCARE_SAFE - 2, r = ringSprite(R, Math.floor(e.anim * 8) % 2 ? 'd' : 'm'), x = Math.round(ox + e.x - R), y = Math.round(oy + e.y - Math.round(R * 0.6));
        ctx.drawImage(ellipseSprite(r.width, r.height, SHADOW), x, y);
        ctx.drawImage(r, x, y);
      }
      if (e.state !== 'sweep' && e.state !== 'spot' && e.state !== 'glare') return;
      // the beam's edges and middle as dotted rays on the ground, stopped by what blocks them
      const glare = e.state === 'glare', col = glare ? 'Y' : e.state === 'spot' ? (Math.floor(e.anim * 12) % 2 ? 'P' : 'q') : 'y';
      const step = glare ? 5 : 9, sh = Math.floor(e.anim * 20) % step;
      for (const w of scareBeams(e)) for (const a of [w - SCARE_ARC, w, w + SCARE_ARC]) {
        const c = Math.cos(a), s = Math.sin(a);
        for (let d = SCARE_SAFE + sh; d < SCARE_LEN; d += step) {
          const x = e.x + c * d, y = e.y + s * d * 0.9;
          if (solidPx(G.room, x, y, 'shot')) break;
          rect(Math.round(ox + x) - 1, Math.round(oy + y) - 1, 3, 3, '0');
          rect(Math.round(ox + x), Math.round(oy + y), 1, 1, glare && a === w ? 'w' : col);
        }
      }
    } },
});
FOE_NAMES.scare = 'SCARECROW';
WARDENS.lantern = 'scare';
AI.scare = function (e, dt, room, p) {
  e.t -= dt;
  if (e.hp < e.maxHp * 0.5) bossPhase(e, 2);
  E_SRC = 'scare';
  e.calm = e.state === 'glare';
  // its lantern catches shots; the third (fourth in phase 2) knocks it reeling
  const [lx, ly] = scareLamp(e);
  for (const s of SHOTS) if (s.life > 0 && Math.hypot(s.x - lx, s.y - ly) < 7) {
    s.life = 0; burst(lx, ly, 6, ['Y', 'y', 'O'], 60, 0.4); Audio_.sfx('clack');
    if (++e.lh >= (e.p2 ? 4 : 3)) { e.lh = 0; stagger(e, 2.5); e.state = 'walk'; e.t = 1.5; e.z = 0; toast('ITS LANTERN RATTLES!'); return; }
  }
  if (e.state === 'walk') {
    // hops on its pole toward a spot a little way from a hero
    const u = (e.anim * 3) % 1;
    e.z = Math.abs(Math.sin(u * Math.PI)) * 4;
    const a = Math.atan2(e.y - p.y, e.x - p.x), tx = p.x + Math.cos(a) * 100, ty = p.y + Math.sin(a) * 60;
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d > 4) moveBox(room, e, dx / d * 30 * dt, dy / d * 30 * dt, 'enemy');
    e.flip = p.x < e.x;
    if (u < (e.pu || 0)) dust(e.x, e.y, 2, 6);
    e.pu = u;
    if (e.t <= 0) {
      e.z = 0;
      if (++e.n % 3 === 0) { e.state = 'raise'; e.t = 0.7; Audio_.sfx('charge'); }
      else { e.state = 'sweep'; e.t = 3.5; e.base = Math.atan2(p.y - e.y, p.x - e.x); e.ph = 0; e.cool = 0.5; Audio_.sfx('lamp'); }
    }
  } else if (e.state === 'sweep') {
    e.ph += dt * (e.p2 ? 2.2 : 1.6);
    e.w = e.base + Math.sin(e.ph) * 1.05;
    e.flip = Math.cos(e.w) < 0;
    // after a volley the beam sweeps on for a moment before it can catch anyone again
    const h = (e.cool -= dt) <= 0 && G.players.find(q => alive(q) && scareCone(e, q));
    if (h) { e.state = 'spot'; e.k = 0.45; e.tg = h; Audio_.sfx('tele'); }
    else if (e.t <= 0) { e.state = 'walk'; e.t = 1.5; }
  } else if (e.state === 'spot') {
    // it holds the beam on the hero it found for a moment, then throws embers
    if ((e.k -= dt) <= 0) {
      const tg = alive(e.tg) ? e.tg : p, [x, y] = scareLamp(e);
      fan(x, y, Math.atan2(tg.y - 7 - y, tg.x - x), e.p2 ? 5 : 3, 0.22, 85, 'ember');
      Audio_.sfx('eshoot'); e.cool = e.p2 ? 0.9 : 1.2;
      e.state = e.t > 0.6 ? 'sweep' : 'walk'; if (e.state === 'walk') e.t = 1.5;
    }
  } else if (e.state === 'raise') {
    e.w = Math.atan2(p.y - e.y, p.x - e.x) - 0.9; e.flip = Math.cos(e.w) < 0;
    if (e.t <= 0) { e.state = 'glare'; e.t = 2.5; hapticAll('roar'); Audio_.sfx('roar'); }
  } else if (e.state === 'glare') {
    e.w += 2.5 * dt; e.flip = Math.cos(e.w) < 0;
    for (const h of G.players) if (alive(h) && scareCone(e, h)) hurtPlayer(h, 1, 'scare');
    if (e.t <= 0) { stagger(e, 1.5); e.state = 'walk'; e.t = 1.5; e.calm = false; }
  }
};
BEASTS.splice(BEASTS.findIndex(b => b.boss), 0,
  { t: 'scare', spr: 'scare_0', lore: ['THE WARDEN OF THE LANTERN WOODS.', 'WHEN IT GLARES, HIDE BEHIND A POST.', 'SHOOT ITS LANTERN TO DAZE IT.'] });
Object.assign(LAY_RULE, {
  alley: { pool: [['stump', 3], ['lmoth', 2], ['wfox', 1]] },
  hollow: { pool: [['owlet', 3], ['lmoth', 2], ['wisp', 1]] },
  ring: { pool: [['mime', 4], ['stump', 1], ['wisp', 1]] },
  glade: { pool: [['wfox', 2], ['mime', 2], ['owlet', 2]] },
  creek: { pool: [['lmoth', 3], ['wisp', 2], ['stump', 1]] },
  field: { pool: [['stump', 2], ['owlet', 2], ['mime', 2], ['lmoth', 1]] },
});

// ---------- The Grand Hoot (boss of the Lantern Woods) ----------
// A great plum owl with ember eyes and a lantern hooked on his wing. He hunts whoever stands in
// lamplight with fans of feathers; a ring of feathers round him (0.8 s) is the tell for his wing
// gust, which snuffs every lamp and throws the feathers out as a ring. Phase 2: every other
// gust he melts into three shadow owls perched on dark lamp posts; lighting a post shows what
// sits on it (a fake bursts into feathers, the real one falls off dazed). Phase 3, the Eclipse:
// the lamps will not light, and only the heroes' own lanterns shine. His eyes sweep two beams
// down across the room (a post or a rock is shade, and so is the strip beside and above him),
// then he dives down a cyan lane: into a lamp post, and he crashes.
(function hootArt() {
  const o = { flash: true, sil: '1' };
  const TUFT = ['00....\n0V0...\n0VV0..\n.0VV00', '....00\n...0V0\n..0VV0\n00VV0.'];
  const hoot = (f) => {
    const dy = f.d ? 5 : f.st ? 2 : f.b ? 1 : 0, up = f.m || f.tl;
    const wing = f.d ? [[6, 26, 7, 4], [34, 26, 7, 4]] : f.a ? [[5, 20, 6, 5], [35, 20, 6, 5]]
      : up ? [[6, 11 + (f.tl ? -2 : 0), 5.5, 8], [34, 11 + (f.tl ? -2 : 0), 5.5, 8]] : [[9, 20, 5, 9], [31, 20, 5, 9]];
    let r = sculpt(40, 32, [
      ...wing.map(([x, y, a, b]) => ({ e: [x, y + dy, a, b], ramp: '1vvV' })),
      { e: [20, 18 + dy, 12, 11.5], ramp: '1vV3', cut: 31 },
      { e: [20, 22 + dy, 7.5, 6.5], ramp: 'eaAA', cut: 31 },
      { e: [15.5, 12.5 + dy, 5.5, 5], ramp: 'V344' }, { e: [24.5, 12.5 + dy, 5.5, 5], ramp: 'V344' },
    ]);
    if (!f.d) { r = stamp(r, 8, 3 + dy, TUFT[0]); r = stamp(r, 26, 3 + dy, TUFT[1]); }
    // chevrons down the belly, talons, and the lantern hooked on his right wing
    r = stamp(r, 16, 21 + dy, 'e.e.e.e.e\n.e.e.e.e.');
    r = stamp(r, 17, 25 + dy, 'e.e.e.e');
    if (!f.d) r = stamp(r, 15, 30 + Math.min(dy, 1) - (dy > 1 ? 1 : 0), 'O.O..O.O\n.o....o.');
    const glass = f.st || f.d ? 'VvvV\nvvVV' : f.p ? 'RYyr\nrOor' : 'YwyO\nyYOO';
    const [lx, ly] = f.d ? [34, 27] : f.a ? [36, 20] : up ? [34, 14 + (f.tl ? -2 : 0)] : [32, 25];
    if (!f.d) r = stamp(r, lx + 1, ly - 2 + dy, 'n.\n.n');
    r = stamp(r, lx, ly + dy, 'nnnn\n' + glass + '\nnnnn');
    r = autoOutline(r);
    r = rim(r, { v: '2', V: '3', a: 'A' });
    // big ember eyes: an amber ring round the pupil
    const ring = f.p ? '.rrrr.\nroooor\nroOOor\nroOOor\nroooor\n.rrrr.' : '.OOOO.\nOyyyyO\nOyYYyO\nOyYYyO\nOyyyyO\n.OOOO.';
    if (f.face !== 'dead') { r = stamp(r, 13, 10 + dy, ring); r = stamp(r, 22, 10 + dy, ring); }
    r = bossEyes(r, 14, 11 + dy, 9, f.face);
    return stamp(r, 18, 16 + dy, f.a ? '.00.\n0Oo0\n0oo0\n.00.' : '0Oo0\n.0o0\n..0.');
  };
  bossFrames('hoot', hoot, o);
  // his feathers, plum with a lavender tip
  const pad = (rows) => autoOutline(['.'.repeat(rows[0].length + 2)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(rows[0].length + 2)]));
  def('eb_feather', pad(['.4w.', '3V44', '2vV3', '.2v.'])); def('ebb_feather', pad(['..4w..', '.3V44.', '3vV4w3', '2vvV3.', '.2vV2.', '..2...']));
  alias('ebcb_feather', 'eb_feather'); alias('ebbcb_feather', 'ebb_feather');
})();
const HOOT_Z = 14, HOOT_PZ = 18, HOOT_SAFE = 22, HOOT_BEAM = 7, HOOT_LEN = 190;
const hootEye = (e) => [e.x, e.y - HOOT_Z - 19];
const hootBeams = (e) => [Math.PI - e.w, e.w];
// in phase 3 his eyes sweep two beams from level down to straight below; a post or rock shades
function hootCaught(e, p) {
  if (e.state !== 'beams') return false;
  const [x, y] = hootEye(e), dx = p.x - x, dy = p.y - 6 - y;
  if (Math.hypot(p.x - e.x, (p.y - e.y) / 0.6) < HOOT_SAFE) return false;
  for (const a of hootBeams(e)) {
    const c = Math.cos(a), s = Math.sin(a), along = dx * c + dy * s;
    if (along > 12 && along < HOOT_LEN && Math.abs(-dx * s + dy * c) < HOOT_BEAM && clearLine(G.room, x, y, p.x, p.y - 6)) return true;
  }
  return false;
}
// a hero standing in lamplight, the nearest first
function inLamp(room, x, y) {
  const l = nearestLamp(room, x, y, T_LAMPON);
  return l >= 0 && Math.hypot(x - lampXY(l)[0], y - lampXY(l)[1] - 8) < LAMP_R * 0.8;
}
// his perch on a lamp post, where the owlets sit
const hootPerch = (i) => [lampXY(i)[0], lampXY(i)[1] + 12];
Object.assign(EDEF, {
  hoot: { hp: 600, r: 14, h: 30, hw: 14, hh: 7, sw: 36, boss: true, fly: true, intro: 'PUTS OUT THE LAMPS', phases: [0.66, 0.33], colors: ['v', 'V', 'O'],
    sprite: (e) => bossFrame(e, { ruffle: 'tell', eclipse: 'tell', aim: 'tell', hide: 'move', rise: 'move', gust: 'atk', beams: 'atk', dive: 'atk' }[e.state] || bob(e, 3, 1, 0)),
    glint: (e) => (e.state === 'fly' && e.n > hootGap(e) - 0.45 ? [0, -HOOT_Z - 16] : null),
    hits: (e, p) => hootCaught(e, p),
    light: (e) => {
      if (e.state === 'shadow' || e.state === 'hide') return; // a shadow owl gives nothing away
      lightAdd(e.x, e.y - 18, e.phase > 2 && e.stag <= 0 ? 12 : 28);
      if (e.state !== 'beams' && e.state !== 'eclipse') return;
      const [x, y] = hootEye(e);
      for (const a of hootBeams(e)) for (const d of [30, 60, 95, 130, 165]) lightAdd(x + Math.cos(a) * d, y + Math.sin(a) * d, 8 + d * 0.12);
    },
    under: (e, ox, oy) => {
      // the tell for his gust: eight feathers wheel round him, closing in
      if (e.state === 'ruffle') {
        const k = Math.max(0, e.t) / 0.8, s = S('eb_feather');
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 + e.anim * 3;
          drawS(s, ox + e.x + Math.cos(a) * (18 + 16 * k) - (s.w >> 1), oy + e.y - HOOT_Z - 14 + Math.sin(a) * (10 + 9 * k) - (s.h >> 1));
        }
      }
      if (e.state !== 'eclipse' && e.state !== 'beams') return;
      // the beams as dotted rays, stopped by what shades
      const on = e.state === 'beams', col = on ? 'Y' : Math.floor(e.anim * 12) % 2 ? 'P' : 'q', step = on ? 4 : 8, sh = Math.floor(e.anim * 20) % step;
      const [x0, y0] = hootEye(e);
      for (const a of hootBeams(e)) {
        const c = Math.cos(a), s = Math.sin(a);
        for (let d = 12 + sh; d < HOOT_LEN; d += step) {
          const x = x0 + c * d, y = y0 + s * d;
          if (d > 20 && solidPx(G.room, x, y, 'shot')) break;
          rect(Math.round(ox + x) - 1, Math.round(oy + y) - 1, 3, 3, '0');
          rect(Math.round(ox + x), Math.round(oy + y), 1, 1, on && d % 8 < 4 ? 'w' : col);
        }
      }
    },
    // phase 2: three shadow owls on dark posts, only their ember eyes lit; the next to throw blinks white
    draw: (e, ox, oy) => {
      if (e.state !== 'shadow' || !e.fk) return false;
      const s = S('hoot_0');
      for (const [x, y] of [[e.x, e.y]].concat(e.fk)) { shadow(ox + x, oy + y, 20); drawFeet(s, ox + x, oy + y - HOOT_PZ, 4); }
      return true;
    },
    die: (e) => { if (G.room) G.room.dark = false; e.fk = null; } },
});
EF_EXTRA.push('fk');
// the shadow owls' ember eyes, drawn over the dark; the next to throw blinks white
function hootEyes(e, ox, oy) {
  const all = [[e.x, e.y]].concat(e.fk);
  for (let i = 0; i < all.length; i++) {
    const [x, y] = all[i], fy = Math.round(oy + y - HOOT_PZ);
    const tell = i === ((e.w || 0) % all.length) && e.n > hootGap(e) - 0.45 && Math.floor(e.anim * 16) % 2;
    for (const dx of [-5, 4]) { rect(Math.round(ox + x) + dx - 1, fy - 20, 4, 4, '0'); rect(Math.round(ox + x) + dx, fy - 19, 2, 2, tell ? 'w' : 'O'); }
  }
}
FOE_NAMES.hoot = 'GRAND HOOT';
const hootGap = (e) => (e.state === 'shadow' ? 1.1 : e.phase > 1 ? 1.3 : 1.6);
function hootGust(e, room) {
  const t = room.tiles;
  for (let i = 0; i < t.length; i++) if (t[i] === T_LAMPON) {
    setTile(room, i % COLS, (i / COLS) | 0, T_LAMP);
    poof((i % COLS) * 16 + 8, OY + ((i / COLS) | 0) * 16 - 2);
  }
  Audio_.sfx('snuff'); Audio_.sfx('swish'); G.shake = Math.max(G.shake, 3); hapticAll('slam');
  ring(e.x, e.y - HOOT_Z - 12, e.phase > 1 ? 14 : 12, 62, 'feather', grand());
}
// his shadow owls go: fakes into a puff of feathers, and he comes back as himself
function hootRegroup(e, fell) {
  for (const [x, y] of e.fk || []) { burst(x, y - HOOT_PZ - 12, 12, ['v', 'V', '3'], 60, 0.5); poof(x, y - HOOT_PZ - 8); }
  e.fk = null; e.fl = null; e.ghost = false;
  e.state = 'fly'; e.t = 3; e.n = 0;
  if (fell) { e.z = 0; e.y += 10; stagger(e, 2.5); toast('THE LIGHT FOUND HIM!'); dust(e.x, e.y, 10, 20); }
}
AI.hoot = function (e, dt, room, p) {
  e.t -= dt;
  E_SRC = 'hoot';
  if (e.hp < e.maxHp * 0.66) bossPhase(e, 2);
  if (e.hp < e.maxHp * 0.33 && e.phase < 3) {
    if (e.state === 'shadow') hootRegroup(e, false);
    bossPhase(e, 3);
    // the Eclipse: the lamps go out and will not light again while he lives
    room.dark = true; hootGust(e, room); clearEBullets();
    e.state = 'fly'; e.t = 2; e.n = 0;
    G.banner = { title: 'THE ECLIPSE!', sub: 'ONLY YOUR LANTERNS SHINE NOW', t: 2.5, icon: null };
  }
  if (e.stag > 0) return;
  const wantZ = e.state === 'dive' || e.state === 'aim' ? 0 : e.state === 'hide' ? 200 : HOOT_Z;
  if (e.state !== 'shadow') e.z += (wantZ - e.z) * Math.min(1, (e.state === 'hide' ? 3 : 6) * dt);
  switch (e.state) {
    case 'intro': if (e.t <= 0) { e.state = 'fly'; e.t = 3; e.n = 0; e.k = 0; e.z = HOOT_Z; } break;
    case 'fly': {
      // he hunts whoever stands in lamplight
      const prey = G.players.find(q => alive(q) && inLamp(room, q.x, q.y)) || p;
      const tx = Math.max(60, Math.min(VW - 60, prey.x + Math.sin(e.anim * 0.8) * 50)), ty = e.phase > 2 ? OY + 56 : Math.max(OY + 56, Math.min(OY + 110, prey.y - 70));
      hover(e, tx, ty, 50, dt, room);
      if ((e.n += dt) > hootGap(e)) {
        e.n = 0;
        const x = e.x, y = e.y - HOOT_Z - 14;
        fan(x, y, Math.atan2(prey.y - 7 - y, prey.x - x), inLamp(room, prey.x, prey.y) ? 5 : 3, 0.28, 80, 'feather');
        Audio_.sfx('swish');
      }
      if (e.t > 0) break;
      e.vx = e.vy = 0; e.n = 0;
      if (e.phase > 2) { e.state = 'eclipse'; e.t = 0.8; e.w = 0; Audio_.sfx('charge'); }
      else { e.state = 'ruffle'; e.t = 0.8; Audio_.sfx('crow'); }
      break;
    }
    case 'ruffle':
      if (e.t > 0) break;
      e.state = 'gust'; e.t = 0.5; hootGust(e, room);
      break;
    case 'gust': {
      if (e.t > 0) break;
      const lamps = [];
      for (let i = 0; i < room.tiles.length; i++) if (room.tiles[i] === T_LAMP) lamps.push(i);
      if (e.phase === 2 && e.k++ % 2 === 0 && lamps.length >= 2) { e.state = 'hide'; e.t = 0.7; e.ghost = true; Audio_.sfx('crow'); }
      else { stagger(e, 1.6); e.state = 'fly'; e.t = 3; }
      break;
    }
    case 'hide': {
      if (e.t > 0) break;
      // perch on a dark post, with up to two shadow owls on others
      const lamps = [];
      for (let i = 0; i < room.tiles.length; i++) if (room.tiles[i] === T_LAMP) lamps.push(i);
      if (lamps.length < 2) { hootRegroup(e, false); break; }
      for (let i = lamps.length - 1; i > 0; i--) { const j = grnd(0, i + 1) | 0; [lamps[i], lamps[j]] = [lamps[j], lamps[i]]; }
      const pick = lamps.slice(0, 3);
      e.li = pick[0]; e.fl = pick.slice(1);
      [e.x, e.y] = hootPerch(e.li); e.vx = e.vy = 0;
      e.fk = e.fl.map(hootPerch);
      e.z = HOOT_PZ; e.state = 'shadow'; e.t = 10; e.n = 0; e.w = grnd(0, 3) | 0;
      toast('WHICH ONE IS HE? LIGHT THEIR LAMPS!');
      break;
    }
    case 'shadow': {
      if (room.tiles[e.li] === T_LAMPON) { hootRegroup(e, true); break; }
      for (let k = e.fl.length - 1; k >= 0; k--) if (room.tiles[e.fl[k]] === T_LAMPON) {
        const [x, y] = e.fk[k];
        burst(x, y - HOOT_PZ - 12, 14, ['v', 'V', '3', '4'], 70, 0.6); poof(x, y - HOOT_PZ - 8); Audio_.sfx('pop');
        e.fl.splice(k, 1); e.fk.splice(k, 1); e.fk = e.fk.slice(); // a new array, so the snapshot sees the change
      }
      if (e.t <= 0) { hootRegroup(e, false); break; }
      // the owls take turns to throw a fan of feathers
      if ((e.n += dt) > hootGap(e)) {
        e.n = 0;
        const all = [[e.x, e.y]].concat(e.fk), [x, y0] = all[e.w % all.length], y = y0 - HOOT_PZ - 14;
        const tg = nearestHero(x, y0) || p;
        fan(x, y, Math.atan2(tg.y - 7 - y, tg.x - x), 3, 0.3, 72, 'feather');
        Audio_.sfx('swish'); e.w++;
      }
      break;
    }
    case 'eclipse':
      hover(e, 192, OY + 56, 60, dt, room);
      if (e.t > 0) break;
      e.state = 'beams'; e.t = 2.6; e.w = 0; Audio_.sfx('roar');
      break;
    case 'beams':
      e.vx = e.vy = 0;
      e.w = Math.min(Math.PI / 2, (1 - Math.max(0, e.t) / 2.6) * Math.PI / 2 * 1.08);
      for (const h of G.players) if (alive(h) && hootCaught(e, h)) hurtPlayer(h, 1, 'hoot');
      if (e.t > 0) break;
      e.state = 'aim'; e.t = 0.7; e.w = 0; lane(e, p); Audio_.sfx('charge');
      break;
    case 'aim': if (e.t <= 0) { e.state = 'dive'; e.t = 1.6; } break;
    case 'dive': {
      if (Math.random() < 0.5) part(e.x + rnd(-10, 10), e.y - 8, 0, -6, 0.4, Math.random() < 0.5 ? 'V' : '3', { size: 2 });
      const bump = moveBox(room, e, Math.cos(e.la) * 180 * dt, Math.sin(e.la) * 180 * dt, 'enemy');
      if (!bump && e.t > 0) break;
      // into a lamp post he crashes hard; anything else only shakes him
      let post = false;
      for (const [dx, dy] of [[0, 0], [12, 0], [-12, 0], [0, 10], [0, -10]]) {
        const c = Math.floor((e.x + dx + Math.cos(e.la) * 8) / 16), r = Math.floor((e.y + dy + Math.sin(e.la) * 8 - 1 - OY) / 16);
        if (lampTile(tileAt(room, c, r))) post = true;
      }
      G.shake = Math.max(G.shake, post ? 6 : 3); dust(e.x, e.y, 10, 24); Audio_.sfx('boom'); hapticAll('slam');
      if (post) { stagger(e, 3); toast('BONK! RIGHT INTO THE POST!'); ring(e.x, e.y - 12, 8, 50, 'feather', grand()); }
      else stagger(e, 1.2);
      e.state = 'fly'; e.t = 2.6; e.n = 0;
      break;
    }
  }
};
BEASTS.push({ t: 'hoot', spr: 'hoot_0', boss: true, lore: ['HE PUTS OUT THE LAMPS OF THE WOODS.', 'LIGHT A SHADOW OWL\'S POST: IS IT HIM?', 'IN THE ECLIPSE, HIDE BEHIND A POST.'] });
