'use strict';
// Game state, room flow, the fixed-step loop and rendering.

const G = {
  state: 'title', back: 'title', time: 0, floor: null, room: null, player: null,
  enemies: [], hazards: [], markers: [],
  shake: 0, hitstop: 0, slowmo: 0, trans: null, banner: null, floorBanner: null, boss: null, reward: null,
  cine: null, hurtT: 0, hud: { coinT: 0, heartT: 0, readyT: 0 },
  combo: { n: 0, t: 0 }, comboPop: null, fall: null, warp: null, corpse: null, flashT: 0, run: { stars: 0 },
  stats: null, menuSel: 0, menuHover: -1, won: false, bestBefore: 0, record: false,
};
function saveBest() {
  const st = Save.stats;
  st.bestDepth = Math.max(st.bestDepth, G.floor.depth + 1);
  Save.write();
}

function setState(s) {
  if (s === 'title' && G.state !== 'collection' && G.state !== 'settings' && G.state !== 'kert') resetAmbient('meadow');
  G.state = s; G.menuSel = 0; G.menuHover = -1;
}
function toast(msg) { G.toast = { msg, t: 1.6 }; }

// Forget every in-flight effect of a previous run or floor.
function resetRunFx() {
  G.combo = { n: 0, t: 0 }; G.comboPop = null; G.fall = null; G.warp = null; G.corpse = null;
  G.flashT = 0; G.boss = null; G.reward = null; G.cine = null; G.banner = null;
}
function startGame() {
  clearRun();
  G.player = newPlayer();
  applyUpgrades(G.player);
  G.stats = { kills: 0, coins: 0, items: 0, time: 0 };
  G.run = { stars: 0 };
  G.won = false; G.record = false;
  resetRunFx();
  G.bestBefore = Save.stats.bestDepth;
  Save.stats.runs++; Save.write();
  loadFloor(0);
  setState('play');
}

function loadFloor(depth) {
  G.floor = genFloor(depth);
  resetRunFx();
  enterRoom(G.floor.start, null);
  G.player.x = 192; G.player.y = 128;
  saveRun();
  const loop = Math.floor(depth / LANDS.length);
  G.floorBanner = { t: 2.8, text: THEMES[G.floor.theme].name + (loop ? ' ' + '+'.repeat(Math.min(loop, 5)) : ''), small: 'LAND ' + (depth + 1) };
  Audio_.play(G.floor.land.song);
}

function nextFloor() {
  Audio_.sfx('portal');
  saveBest();
  if (G.floor.depth === LANDS.length - 1 && !G.won) {
    const st = Save.stats;
    G.won = true; st.wins++;
    st.bestTime = st.bestTime ? Math.min(st.bestTime, G.stats.time) : G.stats.time;
    G.record = G.floor.depth + 1 > G.bestBefore;
    Save.write();
    G.warp = null;
    Audio_.stop(); Audio_.sfx('win');
    setState('win');
    return;
  }
  wipe(() => loadFloor(G.floor.depth + 1));
}

function enterRoom(room, from) {
  const p = G.player;
  G.room = room;
  room.visited = true; room.seen = true;
  for (const d in room.doors) room.doors[d].seen = true;
  SHOTS.length = 0; clearEBullets();
  G.enemies.length = 0; G.hazards.length = 0; G.markers.length = 0;
  for (const q of PARTS) q.life = 0;
  resetAmbient(G.floor.theme);
  flowKey = -1;
  if (from) { p.x = ENTRY[from][0]; p.y = ENTRY[from][1]; }
  if (p.shield) p.shieldUp = true;
  if (room.dirty) renderRoomStatic(room, G.floor.theme);
  if (!room.stocked) stockRoom(room);
  room.doorT = room.cleared ? 1 : 1.25; // uncleared rooms slam their doors shut just after you step in
  if (room.cleared) saveRun();
  else {
    if (room.type === 'challenge') {
      room.waves = 1;
      spawnRoomEnemies(room, 1);
      G.banner = { title: 'CHALLENGE!', sub: 'TWO WAVES, TREASURE AT THE END', t: 2.4, icon: null };
    } else if (room.type === 'boss') {
      const b = G.floor.land.boss;
      G.boss = spawnEnemy(b, 192, b === 'king' ? 110 : 100);
      G.cine = { t: 0 };
      Audio_.play('boss'); Audio_.sfx('roar');
    } else {
      room.waves = room.dist >= 2 && Math.random() < 0.22 ? 1 : 0;
      spawnRoomEnemies(room, 0);
    }
  }
}

function stockRoom(room) {
  room.stocked = true;
  if (room.type === 'item') itemPool(3).forEach((id, i) => { addPedestal(room, 144 + i * 48, 128, id); room.props[room.props.length - 1].group = 'item'; });
  if (room.type === 'shop') {
    room.props.push({ kind: 'rug', x: 192, y: 132, t: 0 });
    room.props.push({ kind: 'frog', x: 192, y: 78, t: 0 });
    const ids = itemPool(2);
    addPedestal(room, 132, 138, 'hp', 4);
    ids.forEach((id, i) => addPedestal(room, 192 + i * 60, 138, id, 15));
  }
}

// bonus: extra enemies (challenge rooms, later waves). Elites and a rare golden slime spice rooms up.
function spawnRoomEnemies(room, bonus) {
  const p = G.player, land = G.floor.land, depth = G.floor.depth;
  const slots = room.slots.filter(s => Math.hypot(s[0] - p.x, s[1] - p.y) > 72);
  for (let i = slots.length - 1; i > 0; i--) { const j = rndi(0, i); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const n = Math.min(slots.length, 3 + Math.min(depth, 5) + rndi(0, 1) + (room.dist >= 3 ? 1 : 0) + bonus * 2);
  const eliteP = Math.min(0.25, 0.06 + depth * 0.03) + (room.type === 'challenge' ? 0.15 : 0);
  let still = 0, elites = 0;
  for (let i = 0; i < n; i++) {
    let type = pickWeighted(land.pool);
    for (let k = 0; k < 6 && EDEF[type].still && still >= 2; k++) type = pickWeighted(land.pool);
    if (EDEF[type].still) still++;
    const elite = elites < 2 && Math.random() < eliteP;
    if (elite) elites++;
    spawnEnemy(type, slots[i][0], slots[i][1], { elite });
  }
  if (!bonus && room.type === 'normal' && room.dist >= 1 && Math.random() < 0.07 && slots.length > n) {
    spawnEnemy('gold', slots[n][0], slots[n][1]);
    toast('A GOLDEN SLIME! CATCH IT!');
    Audio_.sfx('ready');
  }
}

function freeSpot(room) {
  let x = 192, y = 128;
  for (let k = 0; k < 30 && boxSolid(room, x, y, 8, 6, 'enemy'); k++) { x = rnd(60, 324); y = rnd(70, 180); }
  return [x, y];
}
function roomCleared(room) {
  if (room.waves > 0) {
    room.waves--;
    spawnRoomEnemies(room, room.type === 'challenge' ? 2 : 0);
    G.banner = { title: 'ANOTHER WAVE!', sub: 'IT IS NOT OVER YET...', t: 1.8, icon: null };
    Audio_.sfx('roar');
    return;
  }
  room.cleared = true;
  Audio_.sfx('door'); Audio_.sfx('clear');
  earnStars(1);
  const [x, y] = freeSpot(room);
  if (room.type === 'challenge') {
    const id = itemPool(1)[0];
    if (id) addPedestal(room, 192, 128, id);
    for (let i = 0; i < 4; i++) spawnPickup('coin', 192, 118);
    earnStars(3);
    toast('CHALLENGE COMPLETE: +3 STARS');
  } else if (room.type === 'normal') {
    const r = Math.random(), luck = G.player.luck;
    if (r < 0.14 + luck * 0.05) room.props.push({ kind: 'chest', x, y, t: 0, open: false });
    else if (r < 0.55 + luck * 0.1) dropLoot(x, y);
  }
  saveRun();
}

function bossDefeated(e) {
  const room = G.room;
  Audio_.stop(); Audio_.sfx('bossdie');
  G.shake = 4; G.boss = null;
  for (const o of G.enemies) if (!o.dead && o !== e) { o.dead = true; poof(o.x, o.y - o.h / 2); }
  clearEBullets(); G.markers.length = 0;
  room.cleared = true; room.doorT = 0;
  G.corpse = { s: enemySprite(e), x: e.x, y: e.y, w: e.sw, h: e.h, flip: e.flip, colors: enemyColors(e), t: 0, n: 0 };
  earnStars(8);
  saveBest();
}
// Chain of blasts over the defeated boss, then a white flash and the reward.
function updateCorpse(dt) {
  const c = G.corpse;
  c.t += dt;
  if (c.t < 1.2) {
    if (c.t > c.n * 0.09) {
      c.n++;
      const x = c.x + rnd(-c.w / 2, c.w / 2), y = c.y - rnd(2, c.h + 6);
      poof(x, y); burst(x, y, 6, c.colors, 80, 0.4, { g: 100 });
      G.shake = Math.max(G.shake, 2.5);
      Audio_.sfx(c.n % 2 ? 'pop' : 'brk');
    }
    return;
  }
  burst(c.x, c.y - c.h / 2, 50, c.colors.concat(['w', 'Y']), 170, 1, { g: 120 });
  poof(c.x, c.y - c.h / 2); dust(c.x, c.y, 16, 30);
  G.flashT = 0.1; G.shake = 10;
  Audio_.sfx('boom');
  G.corpse = null;
  G.reward = { t: 0.7 };
}
function drawCorpse(ox, oy) {
  const c = G.corpse;
  const jx = Math.round(rnd(-1, 1) * Math.min(2, c.t * 3));
  shadow(ox + c.x, oy + c.y, c.w);
  drawFeet(c.s, ox + c.x + jx, oy + c.y + 1, (c.flip ? 1 : 0) + (Math.floor(c.t * 16) % 2 ? 2 : 0));
}
function giveBossReward() {
  const room = G.room;
  itemPool(3).forEach((id, i) => { addPedestal(room, 144 + i * 48, 150, id); room.props[room.props.length - 1].group = 'boss'; });
  room.props.push({ kind: 'portal', x: 192, y: 92, t: 0 });
  spawnPickup('heart', 192, 120);
  for (let i = 0; i < 4; i++) spawnPickup('coin', 192 + rnd(-10, 10), 120);
  Audio_.sfx('portal');
  Audio_.play(G.floor.land.song);
  saveRun();
}

// ---------- Transitions between rooms ----------
const TRANS_T = 0.42;
function startTransition(dir) {
  const to = G.room.doors[dir];
  if (to.dirty) renderRoomStatic(to, G.floor.theme);
  G.trans = { dir, t: 0, from: G.room, to, px: G.player.x, py: G.player.y };
}
function updateTransition(dt) {
  const tr = G.trans, p = G.player;
  tr.t += dt;
  p.walkT += dt; p.moving = true;
  if (tr.t >= TRANS_T) {
    G.trans = null;
    enterRoom(tr.to, OPP[tr.dir]);
  }
}

// ---------- Update ----------
function update(dt) {
  G.time += dt;
  pollPad();
  pollTouch();
  if (pressed('KeyM')) { Audio_.toggleMute(); toast(Save.settings.muted ? 'SOUND OFF (M)' : 'SOUND ON'); }
  if (pressed('KeyF')) toggleFullscreen();
  if (G.toast && (G.toast.t -= dt) <= 0) G.toast = null;
  if (updateWipe(dt)) return;
  const onTitle = G.state === 'title' || G.state === 'collection' || G.state === 'kert' || (G.state === 'settings' && G.back === 'title');
  if (onTitle) { updateAmbient(dt, 'meadow'); Audio_.play('meadow'); }
  switch (G.state) {
    case 'title': {
      const items = titleItems(), c = menu(items, 120, 12), id = items[c];
      if (id === 'CONTINUE') { Audio_.sfx('confirm'); wipe(() => { if (!loadRun()) toast('THE SAVE COULD NOT BE LOADED'); }); }
      else if (id === 'NEW GAME' || id === 'START GAME') { Audio_.sfx('confirm'); wipe(startGame); }
      else if (id === 'THE GARDEN') { Audio_.sfx('confirm'); setState('kert'); }
      else if (id === 'COLLECTION') { Audio_.sfx('confirm'); setState('collection'); }
      else if (id === 'SETTINGS') { Audio_.sfx('confirm'); G.back = 'title'; setState('settings'); }
      return;
    }
    case 'kert':
      if (updateKert()) { Audio_.sfx('select'); setState('title'); G.menuSel = titleItems().indexOf('THE GARDEN'); }
      return;
    case 'collection':
      if (updateCollection()) { Audio_.sfx('select'); setState('title'); G.menuSel = titleItems().indexOf('COLLECTION'); }
      return;
    case 'settings':
      if (updateSettings()) { setState(G.back); G.menuSel = G.back === 'title' ? titleItems().indexOf('SETTINGS') : 1; }
      return;
    case 'pause': {
      const c = menu(PAUSE_ITEMS, 118);
      if (pressed('Escape', 'KeyP', 'PadStart', 'PadB') || c === 0) { setState('play'); Audio_.sfx('select'); }
      else if (c === 1) { Audio_.sfx('confirm'); G.back = 'pause'; setState('settings'); }
      else if (c === 2) { saveBest(); saveRun(); Save.write(); wipe(() => { setState('title'); toast(hasRun() ? 'SAVED. CONTINUE FROM THE MENU' : 'SEE YOU SOON!'); }); }
      return;
    }
    case 'over': {
      const c = menu(OVER_ITEMS, 152);
      if (c === 0) { Audio_.sfx('confirm'); wipe(startGame); } else if (c === 1) wipe(() => setState('title'));
      return;
    }
    case 'win': {
      const c = menu(WIN_ITEMS, 152);
      if (c === 0) { Audio_.sfx('confirm'); wipe(() => { setState('play'); loadFloor(G.floor.depth + 1); }); }
      else if (c === 1) { clearRun(); Save.write(); wipe(() => setState('title')); }
      return;
    }
  }
  // --- play ---
  const p = G.player, room = G.room;
  if (pressed('Escape', 'KeyP', 'PadStart', 'TouchPause') && !p.dead) { setState('pause'); Audio_.sfx('select'); return; }
  if (G.banner && (G.banner.t -= dt) <= 0) G.banner = null;
  if (G.floorBanner && (G.floorBanner.t -= dt) <= 0) G.floorBanner = null;
  G.shake = Math.max(0, G.shake - dt * 18);
  G.hurtT = Math.max(0, G.hurtT - dt);
  G.hud.coinT = Math.max(0, G.hud.coinT - dt); G.hud.heartT = Math.max(0, G.hud.heartT - dt); G.hud.readyT = Math.max(0, G.hud.readyT - dt);
  G.flashT = Math.max(0, G.flashT - dt);
  updateAmbient(dt, G.floor.theme);
  if (G.trans) { updateTransition(dt); return; }
  if (G.warp) { updateWarp(dt); updateParts(dt); return; }
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  if (G.slowmo > 0) { G.slowmo -= dt; dt *= 0.35; }
  G.stats.time += dt;
  const was = room.doorT;
  room.doorT = room.cleared ? Math.min(1, room.doorT + dt * 5) : Math.max(0, room.doorT - dt * 6);
  if (was > 0 && room.doorT === 0 && Object.keys(room.doors).length) { Audio_.sfx('door'); G.shake = Math.max(G.shake, 1.5); }
  if (G.cine && (G.cine.t += dt) > CINE_T) G.cine = null;
  if (p.hp <= 2 && p.maxHp > 2 && !p.dead && (G.beatT = (G.beatT || 0) - dt) <= 0) { G.beatT = 1.1; Audio_.sfx('beat'); }

  if (!G.cine) updatePlayer(p, dt); else { p.moving = false; p.inv = Math.max(0, p.inv - dt); }
  if (p.dead && p.deadT > 1.8) { saveBest(); clearRun(); Save.write(); G.record = G.floor.depth + 1 > G.bestBefore; setState('over'); return; }
  updateFlow(room, p.x, p.y);
  updateEnemies(dt);
  updateShots(dt);
  updateEBullets(dt);
  updateHazards(dt);
  updateMarkers(dt);
  updatePickups(dt);
  updateParts(dt);
  updateProps(room, p, dt);
  updateCombo(dt);
  updateStarfall(dt);
  if (G.corpse) updateCorpse(dt);
  if (G.reward && (G.reward.t -= dt) <= 0) { G.reward = null; giveBossReward(); }
  if (!room.cleared && room.type !== 'boss' && !G.enemies.some(e => !e.passive)) roomCleared(room);

  if (!p.dead && pressed('KeyE', 'Enter', 'PadX', 'PadY', 'TouchUse')) { const o = nearestProp(); if (o) interact(o); }
  if (G.state !== 'play') return;
  if (room.cleared && !p.dead && !G.reward && !G.corpse && Wipe.t < 0) {
    let dir = null;
    if (p.y < 30 && room.doors.u) dir = 'u';
    else if (p.y > 211 && room.doors.d) dir = 'd';
    else if (p.x < 7 && room.doors.l) dir = 'l';
    else if (p.x > 377 && room.doors.r) dir = 'r';
    if (dir) startTransition(dir);
  }
}

function updateProps(room, p, dt) {
  for (const o of room.props) {
    o.t += dt;
    if (o.kind === 'portal' && Math.random() < 0.3) part(o.x + rnd(-12, 12), o.y - rnd(0, 6), 0, -rnd(20, 40), 0.7, null, { spr: 'sparkle', drag: 1 });
    if (o.kind === 'chest' && !o.open && !p.dead && Math.hypot(p.x - o.x, (p.y - o.y) * 1.5) < 13) openChest(o);
    if (o.kind === 'ped' || o.kind === 'frog' || o.kind === 'chest') {
      // pedestals, chests and the merchant are solid: push the player out
      const dx = p.x - o.x, dy = (p.y - o.y) * 1.6, d = Math.hypot(dx, dy), min = 9;
      if (d < min && d > 0.01) { const nx = o.x + dx / d * min, ny = o.y + dy / 1.6 / d * min; if (!boxSolid(room, nx, ny, p.hw, p.hh, 'player')) { p.x = nx; p.y = ny; } }
    }
  }
}

// ---------- Render ----------
const DL = [];
let dlN = 0;
function dl(y, kind, o) {
  let e = DL[dlN];
  if (!e) e = DL[dlN] = { y: 0, kind: 0, o: null };
  e.y = y; e.kind = kind; e.o = o; dlN++;
}
function sortDL() {
  for (let i = 1; i < dlN; i++) {
    const e = DL[i];
    let j = i - 1;
    while (j >= 0 && DL[j].y > e.y) { DL[j + 1] = DL[j]; j--; }
    DL[j + 1] = e;
  }
}

function renderWorld(ox, oy) {
  const room = G.room, p = G.player, theme = G.floor.theme;
  if (room.dirty) renderRoomStatic(room, theme);
  ctx.drawImage(room.canvas, ox, oy);
  drawPitLife(room, theme, ox, oy);
  drawDoors(room, ox, oy);
  drawEmblems(room, ox, oy);
  if (room.type === 'start' && G.floor.depth === 0) drawTutorial(ox, oy);
  for (const o of room.props) if (o.kind === 'rug' || o.kind === 'portal') drawProp(o, ox, oy);
  drawHazards(ox, oy);
  drawMarkers(ox, oy);
  dlN = 0;
  for (const k of room.pickups) dl(k.y, 0, k);
  for (const o of room.props) if (o.kind === 'ped' || o.kind === 'frog' || o.kind === 'chest') dl(o.y, 1, o);
  for (const e of G.enemies) dl(e.y, 2, e);
  if (G.corpse) dl(G.corpse.y, 4, G.corpse);
  dl(p.y, 3, p);
  sortDL();
  for (let i = 0; i < dlN; i++) {
    const d = DL[i];
    if (d.kind === 0) drawPickup(d.o, ox, oy);
    else if (d.kind === 1) drawProp(d.o, ox, oy);
    else if (d.kind === 2) drawEnemy(d.o, ox, oy);
    else if (d.kind === 4) drawCorpse(ox, oy);
    else drawPlayer(d.o, ox, oy);
  }
  if (p.orbitals && !p.dead) drawOrbitals(p, ox, oy);
  drawAmbient(ox, oy);
  drawShots(ox, oy);
  drawEBullets(ox, oy);
  drawStarfall(ox, oy);
  drawParts(ox, oy);
  drawAimReticle(ox, oy);
}

const MM_ICON = { boss: 'mm_boss', item: 'mm_item', shop: 'mm_shop', challenge: 'mm_chal' };
function drawEmblems(room, ox, oy) {
  for (const d in room.doors) {
    const t = room.doors[d].type;
    const ic = MM_ICON[t];
    if (!ic) continue;
    // on the keystone of top doors, on the jambs of side and bottom doors
    const pos = d === 'u' ? [[190, OY + 1]] : d === 'd' ? [[178, OY + 197], [202, OY + 197]] : d === 'l' ? [[6, OY + 98]] : [[373, OY + 98]];
    for (const [x, y] of pos) drawS(S(ic), ox + x, oy + y);
  }
}

function drawTutorial(ox, oy) {
  const how = Input.lastAim;
  const rows = how === 'pad' ? [['LEFT STICK', 'MOVE'], ['RIGHT STICK', 'SHOOT'], ['A', 'ROLL'], ['RB', 'STARFALL']]
    : how === 'touch' ? [['LEFT SIDE', 'MOVE'], ['RIGHT SIDE', 'SHOOT'], ['BOOT BUTTON', 'ROLL'], ['STAR BUTTON', 'STARFALL']]
    : [['WASD', 'MOVE'], ['MOUSE / ARROWS', 'SHOOT'], ['SPACE', 'ROLL'], ['Q', 'STARFALL']];
  rows.forEach(([k, v], i) => {
    const y = oy + 144 + i * 11;
    text(k, ox + 190, y, 'Y', 2, 2);
    text(v, ox + 196, y, 'w', 2);
  });
}

// Letterbox bars and the boss name card while a boss makes its entrance.
const CINE_T = 1.7;
function drawCine() {
  const t = G.cine.t, k = Math.min(1, t * 4, (CINE_T - t) * 4);
  const h = Math.round(24 * k);
  if (h <= 0) return;
  rect(0, 0, VW, h, '0');
  rect(0, VH - h, VW, h, '0');
  if (k > 0.9 && t > 0.3) {
    text('BOSS', VW / 2, VH - 21, 'c', 0, 1);
    text(G.floor.land.bossName, VW / 2, VH - 11, 'Y', 0, 1);
  }
}
// Red frame when the hero gets hurt.
function drawHurt() {
  if (G.hurtT <= 0) return;
  const w = G.hurtT > 0.12 ? 3 : 1;
  rect(0, 0, VW, w, 'r'); rect(0, VH - w, VW, w, 'r'); rect(0, 0, w, VH, 'r'); rect(VW - w, 0, w, VH, 'r');
}

function renderGame() {
  let ox = 0, oy = 0;
  if (G.shake > 0.3 && Save.settings.shake) { ox = Math.round(rnd(-1, 1) * G.shake * 0.6); oy = Math.round(rnd(-1, 1) * G.shake * 0.6); }
  const tr = G.trans;
  if (tr) {
    const k = tr.t / TRANS_T, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const dx = DIRS[tr.dir][0], dy = DIRS[tr.dir][1];
    const cx = Math.round(dx * VW * e), cy = Math.round(dy * VH * e);
    ctx.drawImage(tr.from.canvas, -cx, -cy);
    drawDoors(tr.from, -cx, -cy);
    ctx.drawImage(tr.to.canvas, dx * VW - cx, dy * VH - cy);
    drawDoors(tr.to, dx * VW - cx, dy * VH - cy, true);
    const [ex, ey] = ENTRY[OPP[tr.dir]];
    const p = G.player;
    const px = tr.px + (ex + dx * VW - tr.px) * e, py = tr.py + (ey + dy * VH - tr.py) * e;
    const sx = p.x, sy = p.y;
    p.x = px; p.y = py;
    drawPlayer(p, -cx, -cy);
    p.x = sx; p.y = sy;
  } else renderWorld(ox, oy);
  drawHurt();
  if (G.flashT > 0 && Save.settings.shake) rect(0, 0, VW, VH, 'w');
  if (G.cine && G.state === 'play') drawCine();
  else drawHUD();
}

function render() {
  const s = G.state;
  if (s === 'title') drawTitle();
  else if (s === 'collection') drawCollection();
  else if (s === 'kert') drawKert();
  else if (s === 'settings' && G.back === 'title') drawSettings();
  else {
    renderGame();
    if (s === 'pause') drawPause();
    else if (s === 'settings') drawSettings();
    else if (s === 'over') drawOver();
    else if (s === 'win') drawWin();
  }
  if (Input.lastAim === 'touch' && (s === 'play') && !G.trans) drawTouch();
  drawWipe();
  if (Input.lastAim === 'touch' && window.innerHeight > window.innerWidth) {
    dim(0.85);
    text('PLEASE TURN YOUR DEVICE', VW / 2, VH / 2 - 8, 'Y', 2, 1);
    text('THE GAME PLAYS IN LANDSCAPE', VW / 2, VH / 2 + 6, 'w', 2, 1);
  }
  if (G.toast) { const w = textW(G.toast.msg) + 12; panel((VW - w) / 2, VH - 16, w, 15); text(G.toast.msg, VW / 2, VH - 12, 'w', 0, 1); }
  drawCursor();
}

// ---------- Screen fit: integer scaling for crisp pixels ----------
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth * dpr, h = window.innerHeight * dpr;
  let k = Math.floor(Math.min(w / VW, h / VH));
  if (k < 1) k = Math.min(w / VW, h / VH);
  cv.style.width = (VW * k / dpr) + 'px';
  cv.style.height = (VH * k / dpr) + 'px';
}
window.addEventListener('resize', resize);
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play' && !G.player.dead) setState('pause'); });

// ---------- Loop ----------
const STEP = 1 / 60;
let acc = 0, lastT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000 || 0);
  lastT = now;
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 5) { update(STEP); endInputFrame(); acc -= STEP; n++; }
  if (n === 5) acc = 0;
  render();
  requestAnimationFrame(frame);
}

bakeAtlas();
resize();
resetAmbient('meadow');
requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); });
