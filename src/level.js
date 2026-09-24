'use strict';
// Floors, rooms, tile collision and the cached static room layer.
const COLS = 24, ROWS = 13, OY = 8;
const T_FLOOR = 0, T_WALL = 1, T_ROCK = 2, T_BRK = 3, T_PIT = 4, T_DOOR = 5;
const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const OPP = { u: 'd', d: 'u', l: 'r', r: 'l' };
// Passable part of an open door, in room pixels: [x, y, w, h]
const DOOR_OPEN = { u: [185, 8, 14, 32], d: [184, 200, 16, 16], l: [0, 112, 16, 16], r: [368, 112, 16, 16] };
const DOOR_CELLS = { u: [[11, 0], [12, 0], [11, 1], [12, 1]], d: [[11, 12], [12, 12]], l: [[0, 6], [0, 7]], r: [[23, 6], [23, 7]] };
// Where the player appears when entering through a door
const ENTRY = { u: [192, 50], d: [192, 194], l: [26, 124], r: [358, 124] };

const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function pickWeighted(pool) {
  let sum = 0;
  for (const p of pool) sum += p[1];
  let r = Math.random() * sum;
  for (const p of pool) if ((r -= p[1]) < 0) return p[0];
  return pool[0][0];
}

function newRoom(gx, gy) {
  return {
    gx, gy, type: 'normal', doors: {}, tiles: null, slots: [], dist: 0,
    cleared: false, visited: false, seen: false,
    pickups: [], props: [], canvas: null, dirty: true, seed: (Math.random() * 1e9) | 0,
  };
}

function genFloor(depth) {
  const land = LANDS[depth % LANDS.length];
  const target = land.rooms + Math.floor(depth / LANDS.length) * 2;
  for (let attempt = 0; attempt < 500; attempt++) {
    const map = new Map(), list = [];
    const at = (x, y) => map.get(x + ',' + y);
    const add = (x, y) => { const r = newRoom(x, y); map.set(x + ',' + y, r); list.push(r); return r; };
    const start = add(4, 4);
    start.type = 'start';
    for (let guard = 0; list.length < target && guard < 800; guard++) {
      const base = pick(list);
      const d = DIRS['udlr'[rndi(0, 3)]];
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
    ends[0].type = 'boss';
    ends[1].type = 'item';
    ends[2].type = 'shop';
    if (ends[3]) ends[3].type = 'challenge';
    for (const r of list) buildRoom(r);
    return { depth, land, theme: land.theme, rooms: list, start };
  }
  throw new Error('floor generation failed');
}

function buildRoom(room) {
  const t = new Uint8Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    t[r * COLS + c] = (c === 0 || c === COLS - 1 || r <= 1 || r === ROWS - 1) ? T_WALL : T_FLOOR;
  }
  for (const d in room.doors) for (const [c, r] of DOOR_CELLS[d]) t[r * COLS + c] = T_DOOR;
  let layout = null;
  if (room.type === 'normal' || room.type === 'challenge') layout = pick(LAYOUTS);
  else if (room.type === 'boss') layout = BOSS_LAYOUT;
  if (layout) {
    const flipX = Math.random() < 0.5, flipY = Math.random() < 0.5;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) {
      const ch = layout[flipY ? 9 - y : y][flipX ? 21 - x : x];
      const i = (y + 2) * COLS + x + 1;
      if (ch === '#') t[i] = T_ROCK;
      else if (ch === 'b') t[i] = T_BRK;
      else if (ch === '~') t[i] = T_PIT;
      else if (ch === 'e') room.slots.push([x * 16 + 24, y * 16 + OY + 32 + 12]);
    }
  }
  room.tiles = t;
  room.pits = [];
  for (let i = 0; i < t.length; i++) if (t[i] === T_PIT) room.pits.push([(i % COLS) * 16, OY + ((i / COLS) | 0) * 16, hash(i, 3, room.seed)]);
  room.cleared = room.type !== 'normal' && room.type !== 'boss' && room.type !== 'challenge';
}

const tileAt = (room, c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS) ? T_WALL : room.tiles[r * COLS + c];

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
    case T_FLOOR: return false;
    case T_ROCK: case T_BRK: return mode !== 'fly';
    case T_PIT: return mode === 'player' || mode === 'enemy';
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

// ---------- Flow field toward the player for walking enemies ----------
const FLOW = new Int16Array(COLS * ROWS);
let flowKey = -1;
function updateFlow(room, px, py) {
  const pc = Math.floor(px / 16), pr = Math.floor((py - 1 - OY) / 16);
  const key = pr * COLS + pc;
  if (key === flowKey) return;
  flowKey = key;
  FLOW.fill(-1);
  if (pc < 0 || pr < 0 || pc >= COLS || pr >= ROWS) return;
  const q = [key];
  FLOW[key] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], c = i % COLS, r = (i / COLS) | 0;
    for (const k in DIRS) {
      const nc = c + DIRS[k][0], nr = r + DIRS[k][1], ni = nr * COLS + nc;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || FLOW[ni] !== -1) continue;
      if (room.tiles[ni] !== T_FLOOR) continue;
      FLOW[ni] = FLOW[i] + 1;
      q.push(ni);
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
    const h = hash(c, r, room.seed) % 100;
    const n = h < 10 ? 'floor_2' : h < 22 ? 'floor_3' : h < 61 ? 'floor_0' : 'floor_1';
    blit(g, T(n), c * 16, OY + r * 16);
  }
  // walls: caps everywhere, faces on the top wall
  for (let c = 0; c < COLS; c++) blit(g, capS, c * 16, OY - 16);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = room.tiles[r * COLS + c];
    if (t !== T_WALL && t !== T_DOOR) continue;
    if (r === 1 && c > 0 && c < COLS - 1) blit(g, T(hash(c, 99, room.seed) % 4 === 0 ? 'face_1' : 'face_0'), c * 16, OY + 16);
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
    blit(g, T('pit'), x, y);
    const up = tileAt(room, c, r - 1) === T_PIT, dn = tileAt(room, c, r + 1) === T_PIT;
    const lf = tileAt(room, c - 1, r) === T_PIT, rt = tileAt(room, c + 1, r) === T_PIT;
    if (!up) { g.fillStyle = col('e'); g.fillRect(x, y, 16, 4); g.fillStyle = col('1'); g.fillRect(x, y, 16, 2); g.fillStyle = PAL['0']; g.fillRect(x, y, 16, 1); }
    g.fillStyle = PAL['0'];
    if (!lf) g.fillRect(x, y, 1, 16);
    if (!rt) g.fillRect(x + 15, y, 1, 16);
    if (!dn) { g.fillRect(x, y + 15, 16, 1); g.fillStyle = col('3'); g.fillRect(x + (lf ? 0 : 1), y + 14, 16 - (lf ? 0 : 1) - (rt ? 0 : 1), 1); }
  }
  // obstacles with contact shadows
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    const t = room.tiles[r * COLS + c];
    if (t !== T_ROCK && t !== T_BRK) continue;
    const x = c * 16, y = OY + r * 16;
    g.drawImage(ellipseSprite(14, 5, SHADOW), x + 1, y + 12);
    blit(g, S((t === T_ROCK ? 'rock_' : 'brk_') + theme), x, y);
  }
  room.dirty = false;
}

// Door sprite frame per neighbour type: stone, boss (red) or treasure (gold).
function doorKind(room, d) {
  const o = room.doors[d];
  if (room.type === 'boss' || o.type === 'boss') return 'b';
  if (room.type === 'challenge' || o.type === 'challenge') return 'c';
  if (room.type === 'item' || o.type === 'item' || room.type === 'shop' || o.type === 'shop') return 't';
  return 'n';
}
// room.doorT animates 0 (shut) .. 1 (open); values above 1 hold the doors open briefly.
function drawDoors(room, ox, oy, forceOpen) {
  const t = forceOpen ? 1 : room.doorT;
  const st = t > 0.66 ? 'open' : t > 0.33 ? 'mid' : 'shut';
  for (const d in room.doors) {
    const k = doorKind(room, d);
    if (d === 'u') drawS(S('door_t_' + k + '_' + st), ox + 176, oy + OY + 8);
    else if (d === 'd') drawS(S('door_b_' + k + '_' + st), ox + 176, oy + OY + 192);
    else if (d === 'l') drawS(S('door_s_' + k + '_' + st), ox, oy + OY + 96);
    else drawS(S('door_s_' + k + '_' + st), ox + 368, oy + OY + 96, 1);
  }
}
