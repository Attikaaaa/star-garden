'use strict';
// Floors, rooms, tile collision and the cached static room layer.
const COLS = 24, ROWS = 13, OY = 8;
const T_FLOOR = 0, T_WALL = 1, T_ROCK = 2, T_BRK = 3, T_PIT = 4, T_DOOR = 5, T_PRISM = 6, T_BELL = 7, T_GATE = 8, T_PUFF = 9; // T_PUFF: a Cloud Steps cloud about to puff away (still walkable)
// T_MIRROR .. T_MIRROR + 3: a mirror whose glass faces up-left, up-right, down-right, down-left
// (layout '7' '9' '3' '1', like a keypad); T_ICE: slippery floor (Snowglobe ice, frozen pools)
const T_MIRROR = 10, T_ICE = 14;
// T_LAMP / T_LAMPON: a Lantern Woods lamp post, dark or lit (layout 'l'; shots light it)
const T_LAMP = 15, T_LAMPON = 16;
// T_QSAND: Sun Temple quicksand (slows and drags walkers); T_PLATE / T_PLATEON: a sun-glyph floor plate, dark or lit
const T_QSAND = 17, T_PLATE = 18, T_PLATEON = 19;
const MIR_CH = '7931';
const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const OPP = { u: 'd', d: 'u', l: 'r', r: 'l' };
// Passable part of an open door, in room pixels: [x, y, w, h]
const DOOR_OPEN = { u: [185, 8, 14, 32], d: [184, 200, 16, 16], l: [0, 112, 16, 16], r: [368, 112, 16, 16] };
const DOOR_CELLS = { u: [[11, 0], [12, 0], [11, 1], [12, 1]], d: [[11, 12], [12, 12]], l: [[0, 6], [0, 7]], r: [[23, 6], [23, 7]] };
// Where the player appears when entering through a door
const ENTRY = { u: [192, 50], d: [192, 194], l: [26, 124], r: [358, 124] };

// rnd / rndi / pick: cosmetic randomness only (particles, wobble). Anything that decides the
// game uses the seeded grnd / grndi / gpick / pickWeighted from rng.js.
const rnd = (a, b) => a + Math.random() * (b - a);
const alive = (p) => !p.dead && !p.down;
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function pickWeighted(pool) {
  let sum = 0;
  for (const p of pool) sum += p[1];
  let r = grand() * sum;
  for (const p of pool) if ((r -= p[1]) < 0) return p[0];
  return pool[0][0];
}

function newRoom(gx, gy) {
  return {
    gx, gy, type: 'normal', doors: {}, tiles: null, slots: [], dist: 0,
    cleared: false, visited: false, seen: false,
    pickups: [], props: [], canvas: null, dirty: true, seed: (grand() * 1e9) | 0,
  };
}

// Floors come from the run's seed: the same seed always builds the same floor.
function genFloor(depth, land) {
  return withSeed(hashSeed(G.run.seed, 'floor', depth), () => makeFloor(depth, land));
}
function makeFloor(depth, landOverride) {
  const land = landOverride || roadLand(depth);
  // a quick run's land is a little smaller (about five minutes)
  const target = (G.run.quick ? Math.min(land.rooms, 8) : land.rooms) + Math.floor(depth / runPath().length) * 2;
  for (let attempt = 0; attempt < 500; attempt++) {
    const map = new Map(), list = [];
    const at = (x, y) => map.get(x + ',' + y);
    const add = (x, y) => { const r = newRoom(x, y); map.set(x + ',' + y, r); list.push(r); return r; };
    const start = add(4, 4);
    start.type = 'start';
    for (let guard = 0; list.length < target && guard < 800; guard++) {
      const base = gpick(list);
      const d = DIRS['udlr'[grndi(0, 3)]];
      const nx = base.gx + d[0], ny = base.gy + d[1];
      if (nx < 0 || ny < 0 || nx > 8 || ny > 8 || at(nx, ny)) continue;
      let n = 0;
      for (const k in DIRS) if (at(nx + DIRS[k][0], ny + DIRS[k][1])) n++;
      if (n > 1) continue;
      add(nx, ny);
    }
    if (list.length < target) continue;
    for (const r of list) for (const k in DIRS) {
      const o = at(r.gx + DIRS[k][0], r.gy + DIRS[k][1]);
      if (o) r.doors[k] = o;
    }
    const q = [start];
    const seen = new Set([start]);
    while (q.length) {
      const r = q.shift();
      for (const k in r.doors) { const o = r.doors[k]; if (!seen.has(o)) { seen.add(o); o.dist = r.dist + 1; q.push(o); } }
    }
    const ends = list.filter(r => r !== start && Object.keys(r.doors).length === 1).sort((a, b) => b.dist - a.dist);
    if (ends.length < 3 || ends[0].dist < 3) continue;
    // a fork's treasure boon needs a spare dead end for its second treasure room
    const chest = boonAt('chest', depth);
    if (chest && ends.length < 4 && attempt < 400) continue;
    ends[0].type = 'boss';
    ends[1].type = 'item';
    ends[2].type = 'shop';
    if (ends[3]) ends[3].type = 'challenge';
    if (chest && ends[3]) (ends[4] || ends[3]).type = 'item';
    addSpecialRooms(list, at, add, depth, land);
    assignRewards(list);
    for (const r of list) buildRoom(r, land);
    return { depth, land, theme: land.theme, rooms: list, start };
  }
  throw new Error('floor generation failed');
}

function buildRoom(room, land) {
  const t = new Uint8Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    t[r * COLS + c] = (c === 0 || c === COLS - 1 || r <= 1 || r === ROWS - 1) ? T_WALL : T_FLOOR;
  }
  for (const d in room.doors) if (!hiddenDoor(room, d)) for (const [c, r] of DOOR_CELLS[d]) t[r * COLS + c] = T_DOOR;
  let layout = null;
  const own = land && LAND_LAYOUTS[land.id];
  if (own && room.type === 'normal' && grand() < 0.35) layout = own[room.lay = gpick(Object.keys(own))];
  else if (FIGHT_ROOMS.has(room.type)) layout = gpick(LAYOUTS);
  else if (room.type === 'boss' || room.type === 'arena' || room.type === 'warden') layout = BOSS_LAYOUT;
  else if (room.type === 'slide') layout = SLIDE_LAYOUT;
  if (layout) {
    room.flip = [grand() < 0.5, grand() < 0.5];
    stampLayout(t, layout, room.flip[0], room.flip[1], room.slots);
  }
  room.tiles = t;
  const m = land && LAND_MECH[land.id];
  if (m && m.build) m.build(room); // deterministic (room.seed), so every screen builds the same room
  room.pits = [];
  for (let i = 0; i < t.length; i++) if (t[i] === T_PIT) room.pits.push([(i % COLS) * 16, OY + ((i / COLS) | 0) * 16, hash(i, 3, room.seed)]);
  room.cleared = !FIGHT_ROOMS.has(room.type) && room.type !== 'boss' && room.type !== 'warden' && room.type !== 'arena';
}

// A room that arrives without its mechanic state (a co-op client's, a resumed run's): the land's
// build hook works it out again from the seed (belts, runes, the current, gold wells), on a copy
// of the tiles, since the tiles it came with win.
// ponytail: worked out from the tiles as they are now; a room whose rocks changed since (a cooled
// Forge tile) could differ, send or save the derived state with the room if that ever matters.
function rebuildMech(room) {
  const m = landMech();
  if (room.built || !m || !m.build) return;
  room.built = true;
  const t = room.tiles;
  room.tiles = t.slice();
  m.build(room);
  room.tiles = t;
}

// Writes a 22x10 layout into the interior of tiles t (and its enemy slots into slots).
function stampLayout(t, layout, flipX, flipY, slots) {
  for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) {
    const ch = layout[flipY ? 9 - y : y][flipX ? 21 - x : x];
    const i = (y + 2) * COLS + x + 1;
    t[i] = ch === '#' ? T_ROCK : ch === 'b' ? T_BRK : ch === '~' ? T_PIT : ch === 'p' ? T_PRISM : ch === 's' ? T_BELL : ch === 'g' ? T_GATE : ch === 'i' ? T_ICE : ch === 'l' ? T_LAMP : T_FLOOR;
    const m = MIR_CH.indexOf(ch); // a flip turns the glass the same way
    if (m >= 0) t[i] = T_MIRROR + ((flipX ? m ^ 1 : m) ^ (flipY ? 3 : 0));
    if (ch === 'e' && slots) slots.push([x * 16 + 24, y * 16 + OY + 32 + 12]);
  }
}

// Changes a tile of the room in play (sinkholes open and close) and tells co-op clients.
function setTile(room, c, r, v, quiet) { // quiet: the caller tells co-op clients itself (a page turn)
  const i = r * COLS + c;
  (room.tAt || (room.tAt = new Map())).set(i, G.time); // when it changed, for animations on every screen
  room.tiles[i] = v; room.dirty = true; flowKey = -1;
  room.pits = room.pits.filter(q => q[0] !== c * 16 || q[1] !== OY + r * 16);
  if (v === T_PIT) room.pits.push([c * 16, OY + r * 16, hash(i, 3, room.seed)]);
  if (!quiet && typeof netFx === 'function') netFx('tile', c, r, v);
}

// ---------- Land mechanics ----------
// A land's own rule (the tide, puffing clouds, lantern light...): LAND_MECH[land id] =
// { enter(room), update(dt, room), kill(e, room), every(dt, room), drawLayer(ox, oy, room, layer),
// leave(room) }, every hook optional. enter, update, kill (a foe that is not a boss died) and
// leave run only where the game runs (solo or the host); what a client must see travels in
// snapshots and tile events. every runs on every screen, each frame of play, after G.wind was
// reset to the room's own wind (G.wind0): for what both sides can work out alone. drawLayer runs on every screen three
// times: layer 0 on the floor (under props and foes), 1 over props, foes and heroes but under
// ambient life, shots and bullets (Lantern Woods' darkness), 2 over everything. Tiles change
// through setTile, which rebuilds the room's cached layer.
const LAND_MECH = {};
let mechOn = null; // { m, room }: the mechanic running in the room in play
const landMech = () => (G.floor && LAND_MECH[G.floor.land.id]) || null;
function mechLeave() { if (mechOn && mechOn.m.leave) mechOn.m.leave(mechOn.room); mechOn = null; }
function mechEnter(room) {
  mechLeave();
  const m = landMech();
  if (m) { mechOn = { m, room }; if (m.enter) m.enter(room); }
}
function mechUpdate(dt) { if (mechOn && mechOn.m.update) mechOn.m.update(dt, mechOn.room); }
function mechKill(e) { if (mechOn && mechOn.m.kill) mechOn.m.kill(e, mechOn.room); }
function mechEvery(dt) {
  G.wind = G.wind0 || 0;
  beatStep();
  const m = landMech();
  if (m && m.every && G.room) m.every(dt, G.room);
}
// ---------- The beat ----------
// A land with a bpm (LANDS[].bpm: the Toy Attic, later the Ember Forge and the Glow Deep) keeps
// time to one shared beat: G.beat counts beats on the host's clock (skyNow), so every screen
// agrees, and its songs (sync in SONGS) are locked to the same clock. Beat n is a tick when n is
// even, a tock when odd; n % 4 === 3 is the fourth beat of the bar. 0 where no land keeps time.
// A hero with a beat item (Wind-up Key, Tin Shield), or a toy that moves on the beat (EDEF.beat, in
// the Arena's mixed waves), keeps the Attic's 90 bpm in every land.
function beatStep() {
  const l = G.floor && G.floor.land, bpm = l && l.bpm || (G.players.some(p => p.wkey || p.tshield) || G.enemies.some(e => EDEF[e.type] && EDEF[e.type].beat) ? 90 : 0);
  G.beat = bpm ? skyNow() * bpm * beatK() / 60 : 0;
}
// true once each time the beat passes a whole number, for whoever keeps o.lb (a foe, a prop)
function onBeat(o) { const b = Math.floor(G.beat); if (b === o.lb) return false; const was = o.lb; o.lb = b; return was !== undefined; }
function mechDraw(ox, oy, layer) { const m = landMech(); if (m && m.drawLayer) m.drawLayer(ox, oy, G.room, layer); if (layer === 0 && G.beat && !(m && m.noMetro)) drawMetro(ox, oy); }

// ---------- Page turn (Story Library) ----------
// The room's interior becomes another layout (walls and doors stay). Anyone left inside a tile
// that turned solid is pushed to the nearest free spot, never hurt. corner (0 top left, 1 top
// right, 2 bottom left, 3 bottom right) is where the fold starts; drawPageTurn shows it.
const PAGE_T = 0.6, CURL_T = 1;
// The tell before a turn: the corner's dog-ear lifts for CURL_T seconds.
function pageCurl(room, corner, dur) { room.curl = { at: G.time, corner, dur: dur || CURL_T }; }
function turnPage(room, layout, corner) {
  if (room.dirty) renderRoomStatic(room, G.floor.theme);
  const old = room.turn ? room.turn.cv : document.createElement('canvas');
  old.width = VW; old.height = VH;
  old.getContext('2d').drawImage(room.canvas, 0, 0);
  const t = room.tiles.slice();
  stampLayout(t, layout, room.flip ? room.flip[0] : false, room.flip ? room.flip[1] : false, null);
  for (let i = 0; i < t.length; i++) if (t[i] !== room.tiles[i]) setTile(room, i % COLS, (i / COLS) | 0, t[i], true);
  room.turn = { cv: old, at: G.time, corner };
  // a co-op client turns the page itself (the host sends which one) and only moves its own hero
  if (NET.role === 'client') { if (G.player && !G.player.dead) nudgeOut(room, G.player, heroMoveMode(G.player)); return; }
  for (const p of G.players) if (!p.dead && nudgeOut(room, p, heroMoveMode(p))) p.tpN++;
  for (const e of G.enemies) if (!e.dead) nudgeOut(room, e, e.fly ? 'fly' : 'enemy');
  for (const k of room.pickups) nudgeOut(room, k, 'enemy');
}
// Moves e to the closest spot where its feet box is free; true if it had to move.
function nudgeOut(room, e, mode) {
  const hw = e.hw || 4, hh = e.hh || 4;
  if (!boxSolid(room, e.x, e.y, hw, hh, mode)) return false;
  for (let d = 2; d <= 96; d += 2) for (let a = 0; a < 16; a++) {
    const x = e.x + Math.cos(a * Math.PI / 8) * d, y = e.y + Math.sin(a * Math.PI / 8) * d;
    if (!boxSolid(room, x, y, hw, hh, mode)) { e.x = x; e.y = y; return true; }
  }
  return false;
}

const tileAt = (room, c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS) ? T_WALL : room.tiles[r * COLS + c];
// ---------- Mirrors ----------
// A mirror stands diagonally across its tile, glass on one side, a stone back on the other.
// A shot or bullet that crosses the glass turns 90 degrees; one that meets the back stops
// there, and a hero's shot turns the mirror a quarter step (host / solo). Every screen runs
// the same test on its own shots, so a client's predicted shots bounce the same way.
const MIR_N = [[-1, -1], [1, -1], [1, 1], [-1, 1]], MIR_TURN = 0.3;
const mirrorAt = (room, x, gy) => { const c = Math.floor(x / 16), r = Math.floor((gy - OY) / 16), t = tileAt(room, c, r); return t >= T_MIRROR && t <= T_MIRROR + 3 ? r * COLS + c : -1; };
// o (vx, vy, x, y) has its ground point at gy (lift px below o.y), and came from px, pgy.
// 0: over the glass side, flying on; 1: it crossed the glass and was reflected; 2: it hit the back
function mirrorPass(room, o, idx, lift, px, pgy) {
  const n = MIR_N[room.tiles[idx] - T_MIRROR], cx = (idx % COLS) * 16 + 8, cy = OY + ((idx / COLS) | 0) * 16 + 8;
  const f = n[0] * (o.x - cx) + n[1] * (o.y + lift - cy);
  if (f > 0) return 0;
  if (n[0] * (px - cx) + n[1] * (pgy - cy) <= 0) return 2;
  const d = o.vx * n[0] + o.vy * n[1];
  o.vx -= d * n[0]; o.vy -= d * n[1]; o.x -= f * n[0]; o.y -= f * n[1]; // |n|^2 = 2
  return 1;
}
// host / solo: a hero's shot met the back
function mirrorTurn(room, idx) {
  if (G.time - ((room.tAt && room.tAt.get(idx)) ?? -9) < MIR_TURN) return;
  setTile(room, idx % COLS, (idx / COLS) | 0, T_MIRROR + (room.tiles[idx] - T_MIRROR + 1) % 4);
  Audio_.sfx('clack');
}

// ---------- Drift ----------
// Ice keeps momentum (grip below 1) and a current carries (cx, cy px/s): heroes (movePlayer),
// walking foes (updateEnemies), bullets and shots. A land adds its own through
// LAND_MECH[id].drift(room, x, y, out), which runs on every screen.
const DRIFT = { grip: 1, cx: 0, cy: 0 }, ICE_GRIP = 0.18;
function driftAt(room, x, y) {
  DRIFT.grip = 1; DRIFT.cx = DRIFT.cy = 0;
  if (room.tiles[Math.floor((y - 1 - OY) / 16) * COLS + Math.floor(x / 16)] === T_ICE) DRIFT.grip = ICE_GRIP;
  const m = landMech();
  if (m && m.drift) m.drift(room, x, y, DRIFT);
  return DRIFT;
}
// Gravity wells (room.wells: [x, y, pull], at most WELL_MAX, placed by a land's build hook so every
// screen has the same ones): shots and bullets curve toward them. Only the direction turns, the
// speed stays, so no bullet ever gets faster than it was fired; the turn is capped, so nothing orbits.
const WELL_MAX = 4, WELL_K = 5200, WELL_TURN = 2.6; // pull scale; max turn in rad/s
function wellTurn(wells, x, y, vx, vy) {
  let ax = 0, ay = 0;
  for (let i = 0; i < wells.length && i < WELL_MAX; i++) {
    const w = wells[i], dx = w[0] - x, dy = w[1] - y, d2 = Math.max(dx * dx + dy * dy, 256), k = WELL_K * w[2] / (d2 * Math.sqrt(d2));
    ax += dx * k; ay += dy * k;
  }
  const sp = Math.hypot(vx, vy) || 1;
  return Math.max(-WELL_TURN, Math.min(WELL_TURN, (vx * ay - vy * ax) / (sp * sp))); // rad/s, + turns clockwise on screen
}
function wellPull(wells, o, dt) {
  const w = wellTurn(wells, o.x, o.y, o.vx, o.vy) * dt, c = Math.cos(w), s = Math.sin(w);
  const vx = o.vx * c - o.vy * s; o.vy = o.vx * s + o.vy * c; o.vx = vx;
}
// a shot or bullet rides the current, at half its strength (only lands with a drift hook)
function driftShot(room, o, dt) {
  if (room.wells) wellPull(room.wells, o, dt);
  const m = landMech();
  if (!m || !m.drift || m.ground) return; // ground: only what stands on it rides (the Toy Attic's belts)
  const d = driftAt(room, o.x, o.y + 4);
  o.x += d.cx * 0.5 * dt; o.y += d.cy * 0.5 * dt;
}
// A hero's walk this frame (vx, vy px/s) through the ice and the current; keeps p.mvx / p.mvy
const DRIFT_V = [0, 0];
function driftMove(room, p, vx, vy, dt) {
  const d = driftAt(room, p.x, p.y);
  if (d.grip < 1 && p.skates) { d.grip = 0.6; vx *= 1.25; vy *= 1.25; } // SKATES
  if (d.grip < 1) { const k = Math.min(1, d.grip * 10 * dt); vx = p.mvx = (p.mvx || 0) + (vx - (p.mvx || 0)) * k; vy = p.mvy = (p.mvy || 0) + (vy - (p.mvy || 0)) * k; }
  else { p.mvx = vx; p.mvy = vy; }
  DRIFT_V[0] = vx + d.cx; DRIFT_V[1] = vy + d.cy;
  return DRIFT_V;
}
// A walking foe, after its AI moved it from (x0, y0): on ice its steps blend into a slide, and
// the current carries it. Host / solo only.
function driftFoe(room, e, x0, y0, dt) {
  const d = driftAt(room, x0, y0);
  if (d.grip >= 1 && !d.cx && !d.cy) { e.mvx = e.mvy = 0; return; }
  let vx = (e.x - x0) / dt, vy = (e.y - y0) / dt;
  if (vx * vx + vy * vy > 40000) { e.mvx = e.mvy = 0; return; } // a blink or a dig, not a step
  if (d.grip < 1) {
    const k = Math.min(1, d.grip * 10 * dt);
    vx = e.mvx = (e.mvx || 0) + (vx - (e.mvx || 0)) * k; vy = e.mvy = (e.mvy || 0) + (vy - (e.mvy || 0)) * k;
    e.x = x0; e.y = y0;
  } else { vx = 0; vy = 0; }
  moveBox(room, e, (vx + d.cx) * dt, (vy + d.cy) * dt, 'enemy');
}
// after a hero's move: a wall stops the slide along its axis
function driftStop(p, x0, y0, vx, vy, dt) {
  if (Math.abs(p.x - x0) < Math.abs(vx * dt) * 0.5) p.mvx = 0;
  if (Math.abs(p.y - y0) < Math.abs(vy * dt) * 0.5) p.mvy = 0;
}

// Crystal Cave prism pillars: the tile index of the pillar a ground point is in, else -1
function prismAt(room, x, gy) {
  const c = Math.floor(x / 16), r = Math.floor((gy - OY) / 16);
  return tileAt(room, c, r) === T_PRISM ? r * COLS + c : -1;
}

function doorPass(room, x, y) {
  if (!room.cleared) return false;
  for (const d in room.doors) {
    const o = DOOR_OPEN[d];
    if (x >= o[0] && x < o[0] + o[2] && y >= o[1] && y < o[1] + o[3]) return true;
  }
  return false;
}

// mode: 'player' | 'enemy' | 'fly' | 'shot'
function solidPx(room, x, y, mode) {
  const c = Math.floor(x / 16), r = Math.floor((y - OY) / 16);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  switch (room.tiles[r * COLS + c]) {
    case T_FLOOR: case T_PUFF: case T_ICE: case T_QSAND: case T_PLATE: case T_PLATEON: return false;
    case T_ROCK: case T_BRK: case T_PRISM: case T_BELL: case T_LAMP: case T_LAMPON: return mode !== 'fly';
    case T_MIRROR: case T_MIRROR + 1: case T_MIRROR + 2: case T_MIRROR + 3: return mode !== 'fly' && mode !== 'shot'; // shots: mirrorPass
    case T_PIT: return (mode === 'player' || mode === 'enemy') && !room.flood; // high tide on the Shore: shallows
    case T_DOOR: return mode === 'player' ? !doorPass(room, x, y) : true;
    default: return true;
  }
}

// Does an entity feet-box [x-hw, x+hw] x [y-hh, y] overlap anything solid?
function boxSolid(room, x, y, hw, hh, mode) {
  const x0 = x - hw, x1 = x + hw - 0.01, y0 = y - hh, y1 = y - 0.01;
  const nx = Math.max(1, Math.ceil((x1 - x0) / 8)), ny = Math.max(1, Math.ceil((y1 - y0) / 8));
  for (let j = 0; j <= ny; j++) {
    const py = y0 + (y1 - y0) * j / ny;
    for (let i = 0; i <= nx; i++) if (solidPx(room, x0 + (x1 - x0) * i / nx, py, mode)) return true;
  }
  return false;
}

// Move with axis-separated sliding. Returns true if something blocked the move.
function moveBox(room, e, dx, dy, mode) {
  let blocked = false;
  // wading through the Shore's shallows at high tide
  if (room.flood && (mode === 'player' || mode === 'enemy') && room.tiles[Math.floor((e.y - 1 - OY) / 16) * COLS + Math.floor(e.x / 16)] === T_PIT) { dx *= WADE; dy *= WADE; }
  // a land's own slow ground (the Snowglobe's drifts)
  const lm = landMech();
  if (lm && lm.slow && (mode === 'player' || mode === 'enemy')) { const k = lm.slow(room, e); dx *= k; dy *= k; }
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const sx = dx / steps, sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (sx) { if (boxSolid(room, e.x + sx, e.y, e.hw, e.hh, mode)) blocked = true; else e.x += sx; }
    if (sy) { if (boxSolid(room, e.x, e.y + sy, e.hw, e.hh, mode)) blocked = true; else e.y += sy; }
  }
  return blocked;
}

// Nudge an entity out of solid tiles to the nearest free spot.
function unstick(room, e, mode) {
  if (!boxSolid(room, e.x, e.y, e.hw, e.hh, mode)) return;
  for (let r = 2; r <= 48; r += 2) for (let a = 0; a < 8; a++) {
    const x = e.x + Math.cos(a * Math.PI / 4) * r, y = e.y + Math.sin(a * Math.PI / 4) * r;
    if (!boxSolid(room, x, y, e.hw, e.hh, mode)) { e.x = x; e.y = y; return; }
  }
}

// Line of sight for charges and aiming (shots-eye view: rocks block, pits do not).
function clearLine(room, x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6);
  for (let i = 1; i < n; i++) if (solidPx(room, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 'shot')) return false;
  return true;
}

// ---------- Flow field toward the nearest hero for walking enemies ----------
// A multi-source BFS: every living hero is a goal, so walkers head for whoever is closest.
const FLOW = new Int16Array(COLS * ROWS);
let flowKey = -1;
const _fq = [];
function updateFlow(room, players) {
  let key = 0;
  for (const p of players) if (alive(p)) key = key * 331 + Math.floor((p.y - 1 - OY) / 16) * COLS + Math.floor(p.x / 16) + 1;
  if (key === flowKey) return;
  flowKey = key;
  FLOW.fill(-1);
  _fq.length = 0;
  for (const p of players) {
    if (!alive(p)) continue;
    const pc = Math.floor(p.x / 16), pr = Math.floor((p.y - 1 - OY) / 16);
    if (pc < 0 || pr < 0 || pc >= COLS || pr >= ROWS) continue;
    const k = pr * COLS + pc;
    if (FLOW[k] === 0) continue;
    FLOW[k] = 0; _fq.push(k);
  }
  for (let h = 0; h < _fq.length; h++) {
    const i = _fq[h], c = i % COLS, r = (i / COLS) | 0;
    for (const k in DIRS) {
      const nc = c + DIRS[k][0], nr = r + DIRS[k][1], ni = nr * COLS + nc;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || FLOW[ni] !== -1) continue;
      if (room.tiles[ni] !== T_FLOOR && room.tiles[ni] !== T_PUFF && !(room.flood && room.tiles[ni] === T_PIT)) continue;
      FLOW[ni] = FLOW[i] + 1;
      _fq.push(ni);
    }
  }
}
// Unit direction for a walker at (x, y) toward the player; null if no path.
const _fd = { x: 0, y: 0 };
function flowDir(x, y) {
  const c = Math.floor(x / 16), r = Math.floor((y - 1 - OY) / 16);
  const here = FLOW[r * COLS + c];
  let best = here < 0 ? 9999 : here, bx = 0, by = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const v = FLOW[(r + dy) * COLS + c + dx];
    if (v < 0 || v >= best) continue;
    if (dx && dy && (FLOW[r * COLS + c + dx] < 0 || FLOW[(r + dy) * COLS + c] < 0)) continue; // no corner cutting
    best = v; bx = dx; by = dy;
  }
  if (!bx && !by) return null;
  const tx = (c + bx) * 16 + 8, ty = (r + by) * 16 + OY + 12;
  const d = Math.hypot(tx - x, ty - y) || 1;
  _fd.x = (tx - x) / d; _fd.y = (ty - y) / d;
  return _fd;
}

// ---------- Static room layer (cached per room, rebuilt only when dirty) ----------
function hash(c, r, s) {
  let h = (c * 374761393 + r * 668265263 + s) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
function blit(g, s, x, y, v) {
  const i = s.x[v | 0] === undefined ? 0 : v | 0;
  g.drawImage(ATLAS, s.x[i], s.y[i], s.w, s.h, x, y, s.w, s.h);
}

function renderRoomStatic(room, theme) {
  if (!room.canvas) {
    room.canvas = document.createElement('canvas');
    room.canvas.width = VW; room.canvas.height = VH;
  }
  const g = room.canvas.getContext('2d');
  const th = THEMES[theme];
  const col = (slot) => PAL[th[slot]];
  const T = (n) => S(n + '@' + theme);
  const capS = T('cap');
  // floor
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    blit(g, T(floorTile(c, r, room.seed)), c * 16, OY + r * 16);
  }
  if (th.paint) th.paint(g, room); // a land's own floor (Cloud Steps: clouds and sunstone)
  dressFloor(g, room, theme);
  // walls: caps everywhere, faces on the top wall
  for (let c = 0; c < COLS; c++) blit(g, capS, c * 16, OY - 16);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = room.tiles[r * COLS + c];
    if (t !== T_WALL && t !== T_DOOR) continue;
    if (r === 1 && c > 0 && c < COLS - 1) blit(g, T(faceTile(c, room.seed, true)), c * 16, OY + 16);
    else blit(g, capS, c * 16, OY + r * 16);
  }
  // cap rims against the floor
  g.fillStyle = PAL['0'];
  g.fillRect(15, OY + 16, 1, 176);
  g.fillRect(COLS * 16 - 16, OY + 16, 1, 176);
  g.fillRect(16, OY + 192, VW - 32, 1);
  g.fillStyle = col('9');
  g.fillRect(16, OY + 193, VW - 32, 1);
  g.fillRect(14, OY + 16, 1, 176);
  g.fillRect(COLS * 16 - 15, OY + 16, 1, 176);
  // soft shadow the walls cast on the floor, and into the corners of the top wall's face
  g.fillStyle = SHADOW;
  g.fillRect(16, OY + 32, VW - 32, 4);
  g.fillRect(16, OY + 36, 3, 156);
  g.fillRect(16, OY + 17, 3, 14);
  g.fillRect(16, OY + 17, 1, 14);
  g.fillRect(VW - 18, OY + 17, 2, 14);
  // pits
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    if (room.tiles[r * COLS + c] !== T_PIT) continue;
    const x = c * 16, y = OY + r * 16;
    if (theme === 'cloud') { const [k, v] = skyOf(room, c, r); blit(g, S(k), x, y, v); } else blit(g, T('pit'), x, y);
    const up = tileAt(room, c, r - 1) === T_PIT, dn = tileAt(room, c, r + 1) === T_PIT;
    const lf = tileAt(room, c - 1, r) === T_PIT, rt = tileAt(room, c + 1, r) === T_PIT;
    if (!up) { g.fillStyle = col('e'); g.fillRect(x, y, 16, 4); g.fillStyle = col('1'); g.fillRect(x, y, 16, 2); g.fillStyle = PAL['0']; g.fillRect(x, y, 16, 1); }
    g.fillStyle = PAL['0'];
    if (!lf) g.fillRect(x, y, 1, 16);
    if (!rt) g.fillRect(x + 15, y, 1, 16);
    if (!dn) { g.fillRect(x, y + 15, 16, 1); g.fillStyle = col('3'); g.fillRect(x + (lf ? 0 : 1), y + 14, 16 - (lf ? 0 : 1) - (rt ? 0 : 1), 1); }
  }
  // ice sheets: an edge where the ice meets other ground
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    if (room.tiles[r * COLS + c] !== T_ICE) continue;
    const x = c * 16, y = OY + r * 16;
    blit(g, S('ice'), x, y, hash(r * COLS + c, 7, room.seed) & 1);
    g.fillStyle = PAL['w'];
    if (tileAt(room, c, r - 1) !== T_ICE) g.fillRect(x, y, 16, 1);
    if (tileAt(room, c - 1, r) !== T_ICE) g.fillRect(x, y, 1, 16);
    g.fillStyle = PAL['t'];
    if (tileAt(room, c, r + 1) !== T_ICE) g.fillRect(x, y + 15, 16, 1);
    if (tileAt(room, c + 1, r) !== T_ICE) g.fillRect(x + 15, y, 1, 16);
  }
  // obstacles with contact shadows
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    const t = room.tiles[r * COLS + c];
    if (t !== T_ROCK && t !== T_BRK && (t < T_PRISM || t > T_GATE) && (t < T_MIRROR || t > T_MIRROR + 3) && t !== T_LAMP && t !== T_LAMPON) continue;
    const x = c * 16, y = OY + r * 16;
    g.drawImage(ellipseSprite(14, 5, SHADOW), x + 1, y + 12);
    const sp = S(t >= T_PRISM ? tileArt(room, c, r, t) : t === T_ROCK ? rockArt(room, c, r, theme) : 'brk_' + theme);
    blit(g, sp, x, y + 16 - sp.h); // taller art (mirrors) rises over the tile above
  }
  room.dirty = false;
}

// a rock's sprite (a land can tell some rocks apart: the Ember Forge's cooled slag)
function rockArt(room, c, r, theme) { return 'rock_' + theme; }
// Door sprite frame per neighbour type: stone, boss (red) or treasure (gold).
function doorKind(room, d) {
  const o = room.doors[d];
  if (room.type === 'boss' || o.type === 'boss') return 'b';
  if (room.type === 'challenge' || o.type === 'challenge' || room.type === 'champion' || o.type === 'champion' || room.type === 'warden' || o.type === 'warden') return 'c';
  const T = ['item', 'shop', 'vault', 'shrine', 'altar', 'secret', 'slide', 'jar', 'doll', 'rink', 'sunbeam', 'books', 'quench', 'pearlroom', 'pond'];
  if (T.includes(room.type) || T.includes(o.type)) return 't';
  return 'n';
}
// room.doorT animates 0 (shut) .. 1 (open); values above 1 hold the doors open briefly.
function drawDoors(room, ox, oy, forceOpen) {
  const t = forceOpen ? 1 : room.doorT;
  const st = t > 0.66 ? 'open' : t > 0.33 ? 'mid' : 'shut';
  for (const d in room.doors) {
    if (hiddenDoor(room, d)) continue;
    const k = doorKind(room, d);
    if (d === 'u') drawS(S('door_t_' + k + '_' + st), ox + 176, oy + OY + 8);
    else if (d === 'd') drawS(S('door_b_' + k + '_' + st), ox + 176, oy + OY + 192);
    else if (d === 'l') drawS(S('door_s_' + k + '_' + st), ox, oy + OY + 96);
    else drawS(S('door_s_' + k + '_' + st), ox + 368, oy + OY + 96, 1);
  }
}
