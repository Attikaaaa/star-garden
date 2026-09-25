'use strict';
// Game state, room flow, the Arena, the fixed-step loop and rendering.

const G = {
  state: 'title', back: 'title', time: 0, floor: null, room: null, player: null, players: [],
  enemies: [], hazards: [], markers: [], turrets: [],
  shake: 0, hitstop: 0, slowmo: 0, trans: null, banner: null, floorBanner: null, boss: null, reward: null,
  cine: null, hurtT: 0, hud: { coinT: 0, heartT: 0, readyT: 0, beltT: 0, vaultT: 0 },
  combo: { n: 0, t: 0 }, comboPop: null, fall: null, warp: null, corpse: null, flashT: 0, run: { vault: 0, keep: 0 },
  stats: null, menuSel: 0, menuHover: -1, won: false, bestBefore: 0, record: false,
  mode: 'adv', diff: 1, coins: 0, arena: null, eid: 0, propsN: 0, overT: 0,
};
function saveBest() {
  if (G.daily || isDuel()) return; // daily runs start in any land: no land records from them
  const st = Save.stats;
  if (G.mode === 'arena') {
    if (G.arena.wave - 1 > st.bestWave) { st.bestWave = G.arena.wave - 1; st.bestWaveKills = G.stats.kills; }
  } else st.bestDepth = Math.max(st.bestDepth, G.floor.depth + 1);
  Save.write();
}

function setState(s) {
  if (s === 'title' && !MENU_STATES.has(G.state)) resetAmbient('meadow');
  // back in the menus: the last run's modifiers and daily state are over
  if (MENU_STATES.has(s) && s !== 'settings') { G.daily = null; G.mods = null; G.diffX = null; G.wind = 0; }
  G.state = s; G.menuSel = 0; G.menuHover = -1;
}
const MENU_STATES = new Set(['title', 'settings', 'keys', 'daily', 'yard', 'garden', 'library', 'kert', 'quests', 'stars', 'book', 'mail', 'wardrobe', 'prep', 'coop', 'entry', 'lobby']);
function toast(msg) { G.toast = { msg, t: 1.6 }; }

// Forget every in-flight effect of a previous run or floor.
function resetRunFx() {
  G.combo = { n: 0, t: 0 }; G.comboPop = null; G.fall = null; G.warp = null; G.corpse = null; G.tide = null;
  G.flashT = 0; G.boss = null; G.reward = null; G.cine = null; G.banner = null; G.bannerNext = null; G.overT = 0;
  G.turrets.length = 0; BOLTS.length = 0;
}

// The heroes of a run. roster: [{ pid, wand, up, remote }] (one entry when playing alone).
function makePlayers(roster) {
  G.players = roster.map(r => {
    const p = newPlayer(r.pid);
    const cos = r.remote ? r.cos || {} : myCosmetics();
    applyHero(p, r.hero || cos.hero);
    applyWand(p, r.wand);
    applyAspect(p, r.aspect !== undefined ? r.aspect : cos.aspect || 0);
    applyUpgrades(p, r.up);
    p.remote = !!r.remote;
    if (r.name) p.name = r.name;
    if (r.skin !== undefined) p.skin = r.skin;
    if (r.pad !== undefined) p.pad = r.pad;
    applyCosmetics(p, r.remote ? r.cos : myCosmetics());
    applyMods(p);
    return p;
  });
  G.player = G.players.find(p => !p.remote);
}
const soloRoster = () => [{ pid: 0, wand: Save.wand, up: Save.up, name: Save.name, skin: Save.skin, hero: heroUnlocked(Save.hero) ? Save.hero : 'pip', aspect: aspectOf(Save.wand) }];

// Start a run. mode: 'adv' (the lands) or 'arena' (endless waves).
// opts: { seed, depth (first land), mods, daily } for daily and weekly runs and shared seeds.
function startRun(mode, roster, opts) {
  opts = opts || {};
  G.daily = opts.daily || null;
  if (mode === 'adv' && !NET.role && !G.daily) clearRun();
  if (mode === 'arena' && !NET.role) clearArena();
  G.mode = mode;
  G.run = { vault: 0, keep: 0, seed: opts.seed || newSeed(), quick: !!opts.quick, bow: opts.bow || null, duel: !!opts.duel };
  // Star Trials stack their twists (solo runs)
  G.trial = !NET.role && opts.trial ? opts.trial : 0;
  setMods((opts.mods || []).concat(trialMods(G.trial)));
  if (G.trial && G.diffX) G.diffX.vault *= 1 + 0.05 * G.trial;
  reseed(G.run.seed, 'heroes');
  makePlayers(roster || soloRoster());
  G.stats = { kills: 0, coins: 0, items: 0, time: 0 };
  G.gift = 0; G.tut = null; G.noticesShown = false;
  G.coins = mode === 'arena' ? 5 : 0;
  G.won = false; G.record = false; G.arena = null;
  resetRunFx();
  G.bestBefore = mode === 'arena' ? Save.stats.bestWave : Save.stats.bestDepth;
  Save.stats.runs++; Save.write();
  // the very first run is hand-picked a little (see firstrun.js)
  G.first = Save.stats.runs <= 1 && !NET.role && mode === 'adv' && !G.daily && !opts.seed;
  if (NET.role === 'host') netStartRun();
  noteTeam('start', mode, G.players.length);
  // assist mode: two extra hearts
  if (assistOn()) for (const p of G.players) if (!p.remote) { p.maxHp += 4; p.hp = p.maxHp; }
  if (mode === 'arena') startArena(); else loadFloor(opts.quick && opts.depth === undefined ? quickLand() : opts.depth || 0);
  if (G.run.quick && G.floorBanner) G.floorBanner.small = 'QUICK RUN';
  setState('play');
}

function loadFloor(depth) {
  G.floor = genFloor(depth, G.run.well && depth === LANDS.length ? WELL : null);
  G.floor.boss = chooseBoss(G.floor);
  resetRunFx();
  netFloor();
  enterRoom(G.floor.start, null);
  placeHeroes(192, 128, 'u');
  if (teamHas('starmap')) for (const r of G.floor.rooms) r.seen = true;
  if (depth === 0 && tutNeeded()) startTutorial(G.room);
  saveRun();
  const loop = Math.floor(depth / LANDS.length);
  G.floorBanner = { t: 2.8, text: THEMES[G.floor.theme].name + (loop ? ' ' + '+'.repeat(Math.min(loop, 5)) : ''), small: 'LAND ' + (depth + 1) };
  Audio_.play(G.floor.land.song);
  if (!G.daily) noteTeam('land', depth);
}

function nextFloor() {
  if (G.nextLock) return;
  Audio_.sfx('portal');
  // the Night Moth is beaten: the true ending
  if (G.floor.land === WELL) { startEnding(); return; }
  // a quick run is one land too
  if (G.run.quick && !G.daily && !G.won) {
    G.won = true; G.warp = null;
    Audio_.stop(); Audio_.sfx('win');
    saveBest(); noteCoins();
    note('end', runSummary(true));
    clearRun();
    setState('win');
    preselectGarden();
    return;
  }
  // a daily run is one land; the weekly challenge ends after the third
  if (G.daily && !G.won && (G.daily.kind === 'daily' || G.floor.depth === LANDS.length - 1)) {
    G.won = true; G.warp = null;
    Audio_.stop(); Audio_.sfx('win');
    noteCoins();
    finishDaily(true);
    note('end', runSummary(true));
    setState('win');
    return;
  }
  saveBest();
  if (G.floor.depth === LANDS.length - 1 && !G.won) {
    const st = Save.stats;
    G.won = true; st.wins++;
    st.bestTime = st.bestTime ? Math.min(st.bestTime, G.stats.time) : G.stats.time;
    G.record = G.bestBefore > 0 && G.floor.depth + 1 > G.bestBefore;
    Save.write();
    G.warp = null;
    Audio_.stop(); Audio_.sfx('win');
    noteCoins();
    noteTeam('win', { diff: G.diff, team: G.players.length > 1, time: G.stats.time, mode: G.mode });
    // seven Big Stars: the way down into the Star Well opens
    if (wellOpen()) { enterWell(); return; }
    noteTeam('end', runSummary(true));
    setState('win');
    preselectGarden();
    if (NET.role === 'host') netState('win');
    return;
  }
  G.nextLock = true;
  wipe(() => { G.nextLock = false; loadFloor(G.floor.depth + 1); });
  if (NET.role === 'host') netState('wipe');
}

// Put every hero near (x, y), side by side across the way they came in.
function placeHeroes(x, y, from) {
  const side = from === 'l' || from === 'r';
  let k = 0;
  for (const p of G.players) {
    const off = [0, -16, 16, -32][k++];
    p.x = x + (side ? 0 : off); p.y = y + (side ? off : 0);
    unstick(G.room, p, 'player');
    p.dashT = 0; p.tpN++;
  }
}

function enterRoom(room, from) {
  G.room = room;
  // every visit to a room gets its own gameplay stream, derived from the room's seed
  room.visits = (room.visits || 0) + 1;
  reseed(room.seed, room.visits);
  room.visited = true; room.seen = true;
  for (const d in room.doors) if (!hiddenDoor(room, d)) room.doors[d].seen = true;
  SHOTS.length = 0; clearEBullets();
  G.enemies.length = 0; G.hazards.length = 0; G.markers.length = 0; G.turrets.length = 0; BOLTS.length = 0;
  for (const q of PARTS) q.life = 0;
  resetAmbient(G.floor.theme);
  flowKey = -1;
  if (from) placeHeroes(ENTRY[from][0], ENTRY[from][1], from);
  for (const p of G.players) if (p.shield) p.shieldUp = true;
  if (room.dirty) renderRoomStatic(room, G.floor.theme);
  if (!room.stocked) stockRoom(room);
  roomWind();
  room.doorT = room.cleared ? 1 : 1.25; // uncleared rooms slam their doors shut just after you step in
  if (NET.role === 'host') netRoom(from);
  if (room.type === 'arena') return;
  if (room.cleared) saveRun();
  else {
    if (room.type === 'champion') spawnChampion(room);
    else if (room.type === 'rescue') { spawnRoomEnemies(room, 0); G.banner = { title: 'A CRITTER IN A CAGE!', sub: 'DEFEAT THE GUARDS TO SET IT FREE', t: 2.2, icon: null }; }
    else if (room.type === 'challenge') {
      room.waves = 1;
      spawnRoomEnemies(room, 1);
      G.banner = { title: 'CHALLENGE!', sub: 'TWO WAVES, TREASURE AT THE END', t: 2.4, icon: null };
    } else if (room.type === 'boss') {
      startBoss(G.floor.boss || G.floor.land.boss);
    } else {
      room.waves = room.dist >= 2 && grand() < 0.22 ? 1 : 0;
      spawnRoomEnemies(room, room.skull ? 1 : 0);
      if (room.skull) G.banner = { title: 'A SKULL ROOM!', sub: 'TOUGHER FOES, DOUBLE REWARD', t: 2, icon: null };
      spawnNemesis(room);
    }
    itemRoomStart();
  }
}
function startBoss(b) {
  G.boss = spawnEnemy(b, 192, b === 'king' ? 110 : 100);
  gentleBoss(G.boss);
  if (modOn('t_boss')) { G.boss.hp *= 1.25; G.boss.maxHp *= 1.25; }
  if (modOn('t_rage')) { G.boss.p2 = true; G.boss.phase = 2; }
  G.bossT = G.stats.time;
  noteTeam('bossstart');
  G.cine = { t: 0, skip: cnt('bt:' + b) > 1 };
  Audio_.play('boss'); Audio_.sfx('roar'); hapticAll('roar');
}

function stockRoom(room) {
  room.stocked = true;
  stockSpecial(room);
  const n = G.players.length;
  if (room.type === 'item') {
    // co-op: one extra choice per extra hero, everyone takes one
    const k = Math.min(5, 2 + n), ids = G.first && !G.run.picked ? firstRunItems(k) : itemPool(k), w = 48;
    G.run.picked = true;
    ids.forEach((id, i) => { addPedestal(room, 192 + (i - (ids.length - 1) / 2) * w, 128, id); room.props[room.props.length - 1].group = 'item'; });
  }
  if (room.type === 'shop') {
    room.props.push({ kind: 'rug', x: 192, y: 132, t: 0 });
    room.props.push({ kind: 'frog', x: 192, y: 78, t: 0 });
    const ids = itemPool(2);
    addPedestal(room, 117, 138, 'hp', 4);
    addPedestal(room, 167, 138, grand() < 0.3 ? gpick(CHARM_IDS) : gpick(POTION_IDS), 0);
    const pot = room.props[room.props.length - 1];
    pot.price = POTIONS[pot.item].price;
    ids.forEach((id, i) => addPedestal(room, 217 + i * 50, 138, id, 15));
  }
}

// bonus: extra enemies (challenge rooms, later waves). Elites and a rare golden slime spice rooms up.
function spawnRoomEnemies(room, bonus) {
  const land = G.floor.land, depth = G.floor.depth, crew = G.players.length, D = DIFF();
  const slots = room.slots.filter(s => G.players.every(p => Math.hypot(s[0] - p.x, s[1] - p.y) > 72));
  gshuffle(slots);
  const want = 3 + Math.min(depth, 5) + grndi(0, 1) + (room.dist >= 3 ? 1 : 0) + bonus * 2 + D.count + (crew - 1);
  const n = Math.max(2, Math.min(slots.length, want, 12));
  const eliteP = Math.min(0.3, 0.06 + depth * 0.03) + (room.type === 'challenge' || room.skull ? 0.15 : 0) + D.elite + 0.04 * (crew - 1);
  let still = 0, elites = 0;
  for (let i = 0; i < n; i++) {
    let type = pickWeighted(land.pool);
    for (let k = 0; k < 6 && EDEF[type].still && still >= 2; k++) type = pickWeighted(land.pool);
    if (EDEF[type].still) still++;
    const elite = elites < 1 + crew && grand() < eliteP;
    if (elite) elites++;
    spawnEnemy(type, slots[i][0], slots[i][1], { elite });
  }
  if (!bonus && room.type === 'normal' && room.dist >= 1 && ((G.first && !G.run.gold) || grand() < 0.07 + (teamHas('horseshoe') ? 0.06 : 0)) && slots.length > n) {
    G.run.gold = true;
    spawnEnemy('gold', slots[n][0], slots[n][1]);
    toast('A GOLDEN SLIME! CATCH IT!');
    Audio_.sfx('ready');
  }
}

function freeSpot(room) {
  let x = 192, y = 128;
  for (let k = 0; k < 30 && boxSolid(room, x, y, 8, 6, 'enemy'); k++) { x = grnd(60, 324); y = grnd(70, 180); }
  return reachSpot(room, x, y);
}
// Everyone who went down gets back up when the fight is over.
function reviveAll() { for (const p of G.players) if (p.down) revivePlayer(p, 2); }
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
  reviveAll();
  earnVault(2);
  noteCoins();
  noteTeam('room', room.type);
  const [x, y] = freeSpot(room);
  itemRoomClear(x, y);
  if (room.type === 'challenge') {
    const ids = itemPool(G.players.length);
    ids.forEach((id, i) => { addPedestal(room, 192 + (i - (ids.length - 1) / 2) * 48, 128, id); room.props[room.props.length - 1].group = 'chal'; });
    for (let i = 0; i < 4; i++) spawnPickup('coin', 192, 118);
    maybeScroll(192, 118, 0.5);
    earnVault(6);
    noteTeam('chal');
    toast('CHALLENGE COMPLETE!');
  } else if (room.type === 'champion') {
    const ids = itemPool(Math.min(4, 1 + G.players.length));
    ids.forEach((id, i) => { addPedestal(room, 192 + (i - (ids.length - 1) / 2) * 48, 128, id); room.props[room.props.length - 1].group = 'champ'; });
    earnVault(8);
    toast('THE CHAMPION FALLS!');
  } else if (room.type === 'normal') {
    payReward(room, x, y);
    const r = grand(), luck = teamLuck();
    if (r < 0.14 + luck * 0.05) room.props.push({ kind: 'chest', x, y, t: 0, open: false });
    else if (r < 0.55 + luck * 0.1) dropLoot(x, y);
  }
  saveRun();
}

function bossDefeated(e) {
  const room = G.room;
  Audio_.stop(); Audio_.sfx('bossdie'); hapticAll('bossdie');
  G.shake = 4; G.boss = null;
  for (const o of G.enemies) if (!o.dead && o !== e) { o.dead = true; poof(o.x, o.y - o.h / 2); }
  clearEBullets(); G.markers.length = 0;
  if (room.type !== 'arena') { room.cleared = true; room.doorT = 0; }
  G.corpse = { s: SPR[e.type + '_die'] ? S(e.type + '_die') : enemySprite(e), x: e.x, y: e.y, w: e.sw, h: e.h, flip: e.flip, colors: enemyColors(e), t: 0, n: 0 };
  earnVault(16);
  noteTeam('boss', e.type, Math.round(G.stats.time - (G.bossT || 0)));
  reviveAll();
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
  // its Big Star breaks free and flies back up to the sky
  if (c.t < 0.3) return;
  const k = c.t - 0.3, y = oy + c.y - c.h - 6 - Math.round(k * k * 200);
  for (let i = 1; i <= 3; i++) drawS(S('sparkle_' + ((Math.floor(c.t * 12) + i) % 2)), ox + c.x - 1, y + 4 + i * 7);
  drawS(S('icon_big'), ox + c.x - 8, y - 8);
}
function bossItems(room, y) {
  const ids = itemPool(Math.min(5, 2 + G.players.length));
  ids.forEach((id, i) => { addPedestal(room, 192 + (i - (ids.length - 1) / 2) * 48, y, id); room.props[room.props.length - 1].group = 'boss'; });
}
function giveBossReward() {
  const room = G.room;
  if (room.type === 'arena') { arenaBossReward(); return; }
  bossItems(room, 150);
  room.props.push({ kind: 'portal', x: 192, y: 92, t: 0 });
  if (!modOn('t_heal')) spawnPickup('heart', 192, 120);
  spawnPotion(192, 120);
  for (let i = 0; i < 4; i++) spawnPickup('coin', 192 + grnd(-10, 10), 120);
  // the first win over each boss always teaches something new
  for (const p of G.players) maybeScroll(192 + grnd(-16, 16), 124, cnt('b:' + (G.floor.boss || G.floor.land.boss)) <= 1 ? 1 : 0.4);
  Audio_.sfx('portal');
  Audio_.play(G.floor.land.song);
  saveRun();
}

// ---------- Arena: endless waves in one room ----------
// Waves pour in through the four gates. Every 5th wave hands out a free item, every 10th
// is a boss, and the land changes every 5 waves. Between waves the heroes shop.
const ARENA_BREAK = 9;
function arenaFloor(tier) {
  return withSeed(hashSeed(G.run.seed, 'arena', tier), () => {
    const land = LANDS[tier % LANDS.length];
    const room = newRoom(4, 4);
    room.type = 'arena';
    for (const d in DIRS) room.doors[d] = { type: 'challenge' }; // gates: they never open
    buildRoom(room);
    room.stocked = true;
    return { depth: tier, land, theme: land.theme, rooms: [room], start: room };
  });
}
function startArena() {
  G.arena = { wave: 0, phase: 'break', t: 3.5, hold: 0, left: 0, cap: 0, gap: 1, spawnT: 0, killed: 0 };
  arenaLand(0);
  G.floorBanner = isDuel() ? { t: 2.8, text: 'BOSS FIGHT', small: 'BEAT BIG GRIN' } : { t: 2.8, text: 'THE ARENA', small: 'HOLD OUT AS LONG AS YOU CAN' };
}
function arenaLand(tier) {
  G.floor = arenaFloor(tier);
  G.floor.boss = chooseBoss(G.floor);
  netFloor();
  enterRoom(G.floor.start, null);
  placeHeroes(192, 128, 'u');
  Audio_.play(G.floor.land.song);
}
function arenaSpot() {
  // mostly at the gates, never on top of a hero
  const gates = [[192, 58], [192, 186], [30, 124], [354, 124]];
  for (let k = 0; k < 20; k++) {
    const [x, y] = k < 10 ? gpick(gates) : [grnd(40, 344), grnd(64, 184)];
    const xx = x + grnd(-10, 10), yy = y + grnd(-6, 6);
    if (G.players.every(p => Math.hypot(p.x - xx, p.y - yy) > 70) && !boxSolid(G.room, xx, yy, 7, 5, 'enemy')) return [xx, yy];
  }
  return gpick(gates);
}
function startWave() {
  const A = G.arena, crew = G.players.length, D = DIFF();
  for (let i = G.room.props.length - 1; i >= 0; i--) { const o = G.room.props[i]; if (o.kind === 'ped') { poof(o.x, o.y - 14); G.room.props.splice(i, 1); } }
  A.wave++;
  reseed(G.run.seed, 'wave', A.wave);
  hapticAll('wave');
  if (A.wave % 10 === 0 || isDuel()) {
    A.phase = 'boss';
    startBoss(isDuel() ? 'grin' : G.floor.boss || G.floor.land.boss);
    return;
  }
  A.phase = 'fight';
  A.left = Math.round((6 + A.wave * 1.6) * (1 + 0.45 * (crew - 1))) + D.count * 2;
  A.cap = Math.min(14, 4 + Math.floor(A.wave / 3) + (crew - 1) * 2 + D.count);
  A.gap = Math.max(0.3, 1.05 - A.wave * 0.03);
  A.spawnT = 0.6;
  A.gold = grand() < 0.3;
  G.banner = { title: 'WAVE ' + A.wave, sub: A.wave % 5 === 0 ? 'A TREASURE WAVE!' : A.left + ' FOES ARE COMING', t: 1.8, icon: null };
  Audio_.sfx('roar');
}
function arenaPool() {
  // later tiers mix in foes from every land
  const tier = G.floor.depth;
  return tier < 3 ? G.floor.land.pool : [].concat(...LANDS.map(l => l.pool));
}
function updateArena(dt) {
  const A = G.arena;
  if (A.phase === 'break') {
    A.hold += dt;
    // solo: the Arena can be continued from here (after the land change has settled)
    if (A.savedW !== A.wave && A.hold > 1.2 && Wipe.t < 0 && !isDuel()) { A.savedW = A.wave; saveArena(); }
    const waiting = G.room.props.some(o => o.group) && A.hold < 30;
    A.t -= dt;
    if (waiting) A.t = Math.max(A.t, 3);
    if (A.t <= 0) startWave();
  } else if (A.phase === 'fight') {
    const live = G.enemies.filter(e => !e.dead && !e.passive);
    if (A.left > 0 && live.length < A.cap && (A.spawnT -= dt) <= 0) {
      const D = DIFF(), crew = G.players.length;
      let type = pickWeighted(arenaPool());
      for (let k = 0; k < 6 && EDEF[type].still && live.filter(e => e.still).length >= 2; k++) type = pickWeighted(arenaPool());
      const [x, y] = arenaSpot();
      const elite = grand() < Math.min(0.35, 0.03 + A.wave * 0.012) + D.elite + 0.04 * (crew - 1);
      spawnEnemy(type, x, y, { elite });
      A.left--; A.spawnT = A.gap * grnd(0.7, 1.3);
      if (A.gold && A.left === 3) { const [gx, gy] = arenaSpot(); spawnEnemy('gold', gx, gy); toast('A GOLDEN SLIME! CATCH IT!'); A.gold = false; }
    }
    if (A.left <= 0 && !live.length) arenaWaveCleared();
  }
}
function arenaWaveCleared() {
  const A = G.arena;
  A.phase = 'break'; A.t = ARENA_BREAK; A.hold = 0;
  Audio_.sfx('clear');
  reviveAll();
  earnVault(2 + Math.floor(A.wave / 3));
  noteCoins();
  noteTeam('wave', A.wave);
  itemRoomClear(192, 128);
  G.banner = { title: 'WAVE ' + A.wave + ' CLEARED!', sub: 'SHOP, HEAL UP, GET READY', t: 2, icon: null };
  saveBest();
  if (A.wave % 5 === 0) {
    const ids = itemPool(Math.min(5, 2 + G.players.length));
    const gap = ids.length > 4 ? 40 : 48; // stays clear of the arena's rocks
    ids.forEach((id, i) => { addPedestal(G.room, 192 + (i - (ids.length - 1) / 2) * gap, 100, id); G.room.props[G.room.props.length - 1].group = 'free'; });
  }
  arenaShop();
  // a new land every 5 waves (after the boss or the treasure wave)
  if (A.wave % 5 === 0) {
    const tier = A.wave / 5;
    const props = G.room.props, loot = G.room.pickups;
    wipe(() => {
      arenaLand(tier);
      G.room.props.push(...props); G.room.pickups.push(...loot);
      G.floorBanner = { t: 2.8, text: THEMES[G.floor.theme].name, small: 'THE ARENA MOVES ON' };
    });
    if (NET.role === 'host') netState('wipe');
  }
}
function arenaShop() {
  const room = G.room, w = G.arena.wave, up = Math.floor(w / 4);
  // the shop stands low in the room, away from the free items and the heroes' start
  addPedestal(room, 132, 172, 'hp', 3 + Math.floor(w / 3));
  const a = gpick(POTION_IDS);
  let b = gpick(POTION_IDS);
  if (b === a) b = POTION_IDS[(POTION_IDS.indexOf(a) + 1) % POTION_IDS.length];
  addPedestal(room, 192, 172, a, POTIONS[a].price + up);
  addPedestal(room, 252, 172, b, POTIONS[b].price + up);
  G.propsN++;
}
function arenaBossReward() {
  const A = G.arena;
  if (isDuel()) { duelWon(); return; }
  spawnPickup('heart', 192, 120);
  for (let i = 0; i < 6; i++) spawnPickup('coin', 192 + grnd(-10, 10), 120);
  Audio_.play(G.floor.land.song);
  arenaWaveCleared();
  A.t = ARENA_BREAK + 3;
}

// A run ends: the end screen, records, and (solo) the saved run is gone.
function endRun() {
  saveBest();
  if (G.mode === 'adv' && !G.daily) clearRun();
  if (G.mode === 'arena' && !NET.role && !isDuel()) clearArena();
  Save.write();
  G.record = !G.daily && G.bestBefore > 0 && (G.mode === 'arena' ? G.arena.wave - 1 > G.bestBefore : G.floor.depth + 1 > G.bestBefore);
  noteCoins();
  if (G.daily) finishDaily(false);
  noteTeam('end', runSummary(false));
  setState('over');
  preselectGarden();
  if (NET.role === 'host') netState('over');
}

// ---------- Transitions between rooms ----------
const TRANS_T = 0.42;
function startTransition(dir) {
  const to = G.room.doors[dir];
  if (to.dirty) renderRoomStatic(to, G.floor.theme);
  G.trans = { dir, t: 0, from: G.room, to, ps: G.players.map(p => [p.x, p.y]) };
  if (NET.role === 'host') netTrans(dir);
}
function updateTransition(dt) {
  const tr = G.trans;
  tr.t += dt;
  for (const p of G.players) { p.walkT += dt; p.moving = true; }
  if (tr.t >= TRANS_T) {
    G.trans = null;
    enterRoom(tr.to, OPP[tr.dir]);
  }
}

// ---------- Update ----------
function titleReturn(id) { setState('title'); G.menuSel = Math.max(0, titleItems().indexOf(id)); }
function update(dt) {
  G.time += dt;
  Input.aimWas = Input.lastAim;
  pollPad();
  pollTouch();
  if (pressed('KeyM')) { Audio_.toggleMute(); toast(Save.settings.muted ? 'SOUND OFF (M)' : 'SOUND ON'); }
  if (pressed('KeyF')) toggleFullscreen();
  if (G.toast && (G.toast.t -= dt) <= 0) G.toast = null;
  netPoll();
  if (updateWipe(dt)) return;
  if (modalUp()) { updateModal(dt); return; }
  const onTitle = MENU_STATES.has(G.state) && (G.state !== 'settings' || G.back === 'title');
  if (onTitle) { updateAmbient(dt, 'meadow'); Audio_.play('meadow'); }
  const mp = !!NET.role;
  switch (G.state) {
    case 'title': {
      if (!G.noticesShown) titleNotices();
      const items = titleItems(), c = menu(items, TITLE_Y, TITLE_GAP), id = items[c];
      if (id) clearBadge(TITLE_BADGE[id]);
      if (id === 'PLAY') { Audio_.sfx('confirm'); G.diff = 1; wipe(() => startRun('adv')); }
      else if (id === 'CONTINUE') { Audio_.sfx('confirm'); wipe(() => { if (!loadRun()) toast('THE SAVE COULD NOT BE LOADED'); }); }
      else if (id === 'CONTINUE ARENA') { Audio_.sfx('confirm'); wipe(() => { if (!loadArena()) toast('THE SAVE COULD NOT BE LOADED'); }); }
      else if (id === 'ADVENTURE' || id === 'NEW ADVENTURE' || id === 'ARENA') { Audio_.sfx('confirm'); G.prep = { mode: id === 'ARENA' ? 'arena' : 'adv' }; setState('prep'); }
      else if (id === 'CO-OP') { Audio_.sfx('confirm'); setState('coop'); }
      else if (id === 'THE GARDEN') { Audio_.sfx('confirm'); openGarden(); }
      else if (id === 'DAILY STAR RUN') { Audio_.sfx('confirm'); setState('daily'); G.menuSel = 0; G.dailyYard = false; }
      else if (id === 'SETTINGS') { Audio_.sfx('confirm'); G.back = 'title'; setState('settings'); }
      return;
    }
    case 'prep': {
      if (updateCouchJoin()) { for (const k in Input.hit) delete Input.hit[k]; return; }
      const r = updatePrep();
      if (r === 'back' && G.prep.yard) { Audio_.sfx('select'); enterYard(); }
      else if (r === 'back') { Audio_.sfx('select'); titleReturn(G.prep.mode === 'arena' ? 'ARENA' : hasRun() ? 'NEW ADVENTURE' : 'ADVENTURE'); }
      else if (r === 'start') { Audio_.sfx('confirm'); const o = { trial: G.prepTrial || 0, quick: G.prep.mode === 'adv' && G.prepQuick }; wipe(() => startRun(G.prep.mode, G.couch && G.couch.length ? couchRoster() : null, o)); }
      return;
    }
    case 'coop': updateCoop(); return;
    case 'entry': updateEntry(); return;
    case 'lobby': updateLobby(); return;
    case 'daily': {
      const r = updateDaily();
      if (r === 'back' && G.dailyYard) { Audio_.sfx('select'); G.dailyYard = false; enterYard(); }
      else if (r === 'back') { Audio_.sfx('select'); titleReturn('DAILY STAR RUN'); }
      else if (r === 'play') { Audio_.sfx('confirm'); const k = dailyTab(); wipe(() => startDaily(k)); }
      return;
    }
    case 'yard': updateYard(dt); return;
    case 'garden':
      if (updateHub()) { Audio_.sfx('select'); enterYard(); }
      return;
    case 'kert':
      if (updateKert()) { Audio_.sfx('select'); G.kertGuide = false; hubReturn(); }
      return;
    case 'quests':
      if (updateQuests()) { Audio_.sfx('select'); hubReturn(); }
      return;
    case 'stars':
      if (updateStars()) { Audio_.sfx('select'); hubReturn(); }
      return;
    case 'book':
      if (updateBook()) { Audio_.sfx('select'); hubReturn(); }
      return;
    case 'mail':
      if (updateMail()) { Audio_.sfx('select'); hubReturn(); }
      return;
    case 'wardrobe':
      if (updateWardrobe()) { Audio_.sfx('select'); hubReturn(); }
      return;
    case 'keys':
      if (updateKeys()) { Audio_.sfx('select'); setState('settings'); G.menuSel = settingsRows().findIndex(r => r[0] === 'keys'); }
      return;
    case 'library':
      if (updateLibrary()) { Audio_.sfx('select'); G.banner = null; hubReturn(); }
      return;
    case 'settings':
      if (updateSettings()) {
        if (G.back === 'title') titleReturn('SETTINGS');
        else { setState(G.back); G.menuSel = 1; }
      }
      break;
    case 'ending': updateEnding(dt); return;
    case 'pause': {
      const items = pauseItems(), c = menu(items, 118), id = items[c];
      if (pressed('Escape', 'KeyP', 'PadStart', 'PadB') || id === 'CONTINUE') { setState('play'); Audio_.sfx('select'); }
      else if (id === 'SETTINGS') { Audio_.sfx('confirm'); G.back = 'pause'; setState('settings'); }
      else if (id === 'SKIP TUTORIAL') { setState('play'); finishTutorial(true); }
      else if (id === 'SAVE AND QUIT') { saveBest(); saveRun(); Save.write(); wipe(() => { setState('title'); toast(hasRun() ? 'SAVED. CONTINUE FROM THE MENU' : 'SEE YOU SOON!'); }); }
      else if (id === 'QUIT' && G.daily) { setState('play'); endRun(); }
      else if (id === 'QUIT' && G.mode === 'arena' && hasArena()) { saveBest(); Save.write(); wipe(() => { setState('title'); toast('CONTINUE FROM WAVE ' + (G.arena.savedW + 1) + ' LATER'); }); }
      else if (id === 'QUIT') { saveBest(); Save.write(); wipe(() => setState('title')); }
      else if (id === 'BACK TO THE LOBBY') { Audio_.sfx('confirm'); netToLobby(); }
      else if (id === 'LEAVE GAME' || id === 'END GAME') { Audio_.sfx('confirm'); netLeave(); }
      break;
    }
    case 'over': case 'win': {
      const items = endItems(), c = menu(items, G.endMenuY || 152, 13), id = items[c];
      if (id === 'AGAIN!') { Audio_.sfx('confirm'); const duel = isDuel(); wipe(() => startRun(G.mode, mp ? netRoster() : null, { duel })); }
      else if (id === 'PRACTICE') { Audio_.sfx('confirm'); const D = G.daily; wipe(() => startDaily(D.kind, D.key === dailyKeyOf(D.kind) ? undefined : D.key)); }
      else if (id === 'SHARE') { Audio_.sfx('confirm'); shareDaily(G.daily.kind); }
      else if (id === 'KEEP GOING: ENDLESS MODE') { Audio_.sfx('confirm'); wipe(() => { setState('play'); loadFloor(G.floor.depth + 1); if (mp) netState('play'); }); }
      else if (id === 'LOBBY') { Audio_.sfx('confirm'); netToLobby(); }
      else if (id === 'GARDEN') { Audio_.sfx('confirm'); if (G.mode === 'adv') clearRun(); Save.write(); wipe(() => openGarden()); }
      else if (id === 'MENU') { if (G.mode === 'adv') clearRun(); Save.write(); if (mp) netLeave(); else wipe(() => setState('title')); }
      else if (id === 'LEAVE') netLeave();
      return;
    }
  }
  // --- play (the host keeps the world running for everyone while its pause menu is up) ---
  if (G.state !== 'play' && !(mp && (G.state === 'pause' || G.state === 'settings'))) return;
  if (NET.role === 'client') { clientPlay(dt); return; }
  const room = G.room, me = G.player;
  const portrait = IS_TOUCH && window.innerHeight > window.innerWidth;
  if (G.state === 'play' && (pressed('Escape', 'KeyP', 'PadStart', 'TouchPause') || portrait) && !me.dead && !G.warp) {
    setState('pause'); Audio_.sfx('select');
    if (!mp) return;
  }
  tickHud(dt);
  updateAmbient(dt, G.floor.theme);
  windFx();
  if (G.trans) { updateTransition(dt); netHostTick(dt); return; }
  if (G.warp) { updateWarp(dt); updateParts(dt); return; }
  if (G.hitstop > 0) { G.hitstop -= dt; netHostTick(dt); return; }
  if (G.slowmo > 0) { G.slowmo -= dt; dt *= 0.35; }
  if (assistOn()) dt *= ASSIST_SPEED;
  G.stats.time += dt;
  const was = room.doorT;
  room.doorT = room.cleared ? Math.min(1, room.doorT + dt * 5) : Math.max(0, room.doorT - dt * 6);
  if (was > 0 && room.doorT === 0 && Object.keys(room.doors).length) { Audio_.sfx('door'); G.shake = Math.max(G.shake, 1.5); hapticAll('door'); }
  // a boss met before can be hurried along
  if (G.cine && G.cine.skip && G.cine.t < CINE_T - 0.25 && pressed(...K_OK) && G.boss) { G.cine.t = CINE_T - 0.25; G.boss.t = 0.25; G.boss.z = 0; }
  if (G.cine && (G.cine.t += dt) > CINE_T) G.cine = null;
  heartbeat(dt);

  readLocalInput(me);
  readCouchInputs();
  updateStarRain(dt);
  for (const p of G.players) {
    if (!G.cine) updatePlayer(p, dt);
    else { p.moving = false; p.inv = Math.max(0, p.inv - dt); }
  }
  const team = G.players.length > 1;
  if (!team && me.dead && me.deadT > 1.8) { endRun(); return; }
  if (team && teamDown() && (G.overT += dt) > 2) { endRun(); return; }
  updateFlow(room, G.players);
  updateEnemies(dt);
  updateShots(dt);
  updateEBullets(dt);
  updateHazards(dt);
  updateMarkers(dt);
  updateTurrets(dt);
  updateBolts(dt);
  updatePickups(dt);
  updateParts(dt);
  updateProps(room, dt);
  updateCombo(dt);
  updateStarfall(dt);
  updateTide(dt);
  if (G.corpse) updateCorpse(dt);
  if (G.reward && (G.reward.t -= dt) <= 0) { G.reward = null; giveBossReward(); }
  if (G.mode === 'arena') { if (!G.corpse && !G.reward && !G.boss) updateArena(dt); }
  else if (!room.cleared && room.type !== 'boss' && !G.tut && !G.enemies.some(e => !e.passive)) roomCleared(room);
  if (G.tut) updateTutorial(dt);

  for (const p of G.players) if (p.in.use) { const o = nearestProp(p); if (o) interact(o, p); }
  if (G.state === 'play' || G.state === 'pause' || G.state === 'settings') {
    if (room.cleared && !G.reward && !G.corpse && Wipe.t < 0) {
      // the team leaves together: once every standing hero waits in the same doorway
      const up = G.players.filter(alive), dir = up.length ? doorOf(up[0], room) : null;
      if (dir && up.every(p => doorOf(p, room) === dir) && doorOpenFor(room.doors[dir])) startTransition(dir);
    }
  }
  if (mp) netClearPresses();
  netHostTick(dt);
}
// HUD timers (shared by the host and the clients).
function tickHud(dt) {
  if (G.banner && (G.banner.t -= dt) <= 0) G.banner = null;
  // a banner that waits for the current one (a combo right after its item)
  if (G.bannerNext && (!G.banner || G.banner.t < 1.6)) { G.banner = G.bannerNext; G.bannerNext = null; }
  if (G.floorBanner && (G.floorBanner.t -= dt) <= 0) G.floorBanner = null;
  G.shake = Math.max(0, G.shake - dt * 18);
  G.hurtT = Math.max(0, G.hurtT - dt);
  for (const k in G.hud) G.hud[k] = Math.max(0, G.hud[k] - dt);
  G.flashT = Math.max(0, G.flashT - dt);
}
// A soft heartbeat when our own hero is on their last heart.
function heartbeat(dt) {
  const p = G.player;
  if (p.hp <= 2 && p.maxHp > 2 && alive(p) && (G.beatT = (G.beatT || 0) - dt) <= 0) { G.beatT = 1.1; Audio_.sfx('beat'); }
}

// The open door a hero stands in, if any (the room is left through it).
function doorOf(p, room) {
  if (p.y < 30 && room.doors.u) return 'u';
  if (p.y > 211 && room.doors.d) return 'd';
  if (p.x < 7 && room.doors.l) return 'l';
  if (p.x > 377 && room.doors.r) return 'r';
  return null;
}
// Co-op: how many heroes already wait in each doorway, e.g. 2/4.
const DOOR_TAG = { u: [224, 26], d: [224, 202], l: [16, 150], r: [368, 150] }; // beside each door, on the wall
function drawDoorWait(ox, oy) {
  const room = G.room;
  if (G.players.length < 2 || !room.cleared || G.state !== 'play' || G.trans) return;
  const up = G.players.filter(alive);
  for (const d in DOOR_TAG) {
    const n = up.filter(p => doorOf(p, room) === d).length;
    if (n) text(n + '/' + up.length, ox + DOOR_TAG[d][0], oy + DOOR_TAG[d][1], 'Y', 2, 1);
  }
}

function updateProps(room, dt) {
  for (const o of room.props) {
    o.t += dt;
    if (o.kind === 'portal' && Math.random() < 0.3) part(o.x + rnd(-12, 12), o.y - rnd(0, 6), 0, -rnd(20, 40), 0.7, null, { spr: 'sparkle', drag: 1 });
    for (const p of G.players) {
      if (!alive(p)) continue;
      if (o.kind === 'chest' && !o.open && Math.hypot(p.x - o.x, (p.y - o.y) * 1.5) < 13) openChest(o);
      if (o.kind === 'ped' || o.kind === 'frog' || o.kind === 'chest' || ROOM_PROPS.has(o.kind)) pushOut(room, p, o);
    }
  }
}
// Pedestals, chests and the merchant are solid: push a hero out of them.
function pushOut(room, p, o) {
  const dx = p.x - o.x, dy = (p.y - o.y) * 1.6, d = Math.hypot(dx, dy), min = 9;
  if (d < min && d > 0.01) { const nx = o.x + dx / d * min, ny = o.y + dy / 1.6 / d * min; if (!boxSolid(room, nx, ny, p.hw, p.hh, 'player')) { p.x = nx; p.y = ny; } }
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
  const room = G.room, theme = G.floor.theme;
  if (room.dirty) renderRoomStatic(room, theme);
  ctx.drawImage(room.canvas, ox, oy);
  drawPitLife(room, theme, ox, oy);
  drawDoors(room, ox, oy);
  drawEmblems(room, ox, oy);
  drawCracks(room, ox, oy);
  if (G.tut) drawTutorialMark(ox, oy);
  else if (room.type === 'start' && G.floor.depth === 0 && Save.stats.runs <= 3) drawTutorial(ox, oy);
  tickCosmetics();
  for (const o of room.props) if (o.kind === 'rug' || o.kind === 'portal') drawProp(o, ox, oy);
  drawHazards(ox, oy);
  drawMarkers(ox, oy);
  dlN = 0;
  for (const k of room.pickups) dl(k.y, 0, k);
  for (const o of room.props) if (o.kind === 'ped' || o.kind === 'frog' || o.kind === 'chest' || ROOM_PROPS.has(o.kind)) dl(o.y, 1, o);
  for (const e of G.enemies) dl(e.y, 2, e);
  if (G.corpse) dl(G.corpse.y, 4, G.corpse);
  for (const t of G.turrets) dl(t.y, 5, t);
  for (const p of G.players) { dl(p.y, 3, p); if (p.pet && !p.dead && p.petY !== undefined) dl(p.petY, 6, p); }
  pickAffixNear();
  sortDL();
  for (let i = 0; i < dlN; i++) {
    const d = DL[i];
    if (d.kind === 0) drawPickup(d.o, ox, oy);
    else if (d.kind === 1) drawProp(d.o, ox, oy);
    else if (d.kind === 2) drawEnemy(d.o, ox, oy);
    else if (d.kind === 4) drawCorpse(ox, oy);
    else if (d.kind === 5) drawTurret(d.o, ox, oy);
    else if (d.kind === 6) drawPet(d.o, ox, oy);
    else drawPlayer(d.o, ox, oy);
  }
  for (const p of G.players) if (p.orbitals && alive(p)) drawOrbitals(p, ox, oy);
  drawAmbient(ox, oy);
  drawShots(ox, oy);
  drawBolts(ox, oy);
  drawEBullets(ox, oy);
  drawStarfall(ox, oy);
  drawParts(ox, oy);
  drawTags(ox, oy);
  drawDoorWait(ox, oy);
  drawAimReticle(ox, oy);
}

const MM_ICON = { boss: 'mm_boss', item: 'mm_item', shop: 'mm_shop', challenge: 'mm_chal', shrine: 'mm_shrine', altar: 'mm_altar', fountain: 'mm_fount',
  gamble: 'mm_gamble', rescue: 'mm_rescue', champion: 'mm_champ', vault: 'mm_lock' };
function drawEmblems(room, ox, oy) {
  for (const d in room.doors) {
    const t = room.doors[d].type;
    const ic = MM_ICON[t] || doorMark(room.doors[d]);
    if (!ic) continue;
    // on the keystone of top doors, on the jambs of side and bottom doors
    const pos = d === 'u' ? [[190, OY + 1]] : d === 'd' ? [[178, OY + 197], [202, OY + 197]] : d === 'l' ? [[6, OY + 98]] : [[373, OY + 98]];
    for (const [x, y] of pos) drawS(S(ic), ox + x, oy + y);
  }
}

function drawTutorial(ox, oy) {
  const how = Input.lastAim;
  const rows = how === 'pad' ? [['LEFT STICK', 'MOVE'], ['RIGHT STICK', 'SHOOT'], ['A', 'ROLL'], ['RB', 'STARFALL'], ['Y', 'POTION']]
    : how === 'touch' ? [['LEFT SIDE', 'MOVE'], ['RIGHT SIDE', 'SHOOT'], ['BOOT BUTTON', 'ROLL'], ['STAR BUTTON', 'STARFALL'], ['BOTTLE BUTTON', 'POTION']]
    : [['WASD', 'MOVE'], ['MOUSE / ARROWS', 'SHOOT'], ['SPACE', 'ROLL'], ['Q', 'STARFALL'], ['R', 'POTION']];
  rows.forEach(([k, v], i) => {
    const y = oy + 140 + i * 11;
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
  rect(-SCR.ox, -SCR.oy, SCR.w, h + SCR.oy, '0');
  rect(-SCR.ox, VH - h, SCR.w, h + SCR.oy + 1, '0');
  if (k > 0.9 && t > 0.3) {
    const d = G.boss && EDEF[G.boss.type];
    text('BOSS', VW / 2, h - 16, 'c', 0, 1);
    text(curBossName(), VW / 2, VH - 21, 'Y', 0, 1);
    if (d && d.intro) text(d.intro, VW / 2, VH - 11, 'w', 0, 1);
  }
}
// Red frame when the hero gets hurt.
function drawHurt() {
  if (G.hurtT <= 0) return;
  const w = G.hurtT > 0.12 ? 3 : 1, x = -SCR.ox, y = -SCR.oy;
  rect(x, y, SCR.w, w, 'r'); rect(x, y + SCR.h - w, SCR.w, w, 'r'); rect(x, y, w, SCR.h, 'r'); rect(x + SCR.w - w, y, w, SCR.h, 'r');
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
    G.players.forEach((p, i) => {
      if (p.dead) return;
      const [x0, y0] = tr.ps[i] || [p.x, p.y];
      const sx = p.x, sy = p.y;
      p.x = x0 + (ex + dx * VW - x0) * e; p.y = y0 + (ey + dy * VH - y0) * e;
      drawPlayer(p, -cx, -cy);
      p.x = sx; p.y = sy;
    });
  } else { renderWorld(ox, oy); drawNight(ox, oy); }
  drawHurt();
  if (G.flashT > 0 && Save.settings.shake) fillScreen(PAL.w);
  if (G.cine && G.state === 'play') drawCine();
  else if (G.state === 'play') drawHUD();
}

function render() {
  const s = G.state;
  if (HUD.on) hctx.clearRect(0, 0, hudCv.width, hudCv.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.floor && (s === 'play' || s === 'pause' || s === 'over' || s === 'win' || (s === 'settings' && G.back !== 'title'))) drawBackdrop(G.floor.theme);
  else if (s === 'yard') drawBackdrop('meadow');
  ctx.setTransform(1, 0, 0, 1, SCR.ox, SCR.oy);
  if (s === 'title') drawTitle();
  else if (s === 'daily') drawDaily();
  else if (s === 'yard') drawYard();
  else if (s === 'garden') drawHub();
  else if (s === 'kert') drawKert();
  else if (s === 'quests') drawQuests();
  else if (s === 'stars') drawStars();
  else if (s === 'book') drawBook();
  else if (s === 'mail') drawMail();
  else if (s === 'wardrobe') drawWardrobe();
  else if (s === 'library') drawLibrary();
  else if (s === 'keys') drawKeys();
  else if (s === 'prep') drawPrep();
  else if (s === 'coop') drawCoop();
  else if (s === 'entry') drawEntry();
  else if (s === 'lobby') drawLobby();
  else if (s === 'settings' && G.back === 'title') drawSettings();
  else if (s === 'ending') drawEnding();
  else {
    renderGame();
    if (s === 'pause') drawPause();
    else if (s === 'settings') drawSettings();
    else if (s === 'over') drawOver();
    else if (s === 'win') drawWin();
  }
  if (Input.lastAim === 'touch' && s === 'play' && !G.trans) drawTouch();
  drawWipe();
  if ((IS_TOUCH || Input.lastAim === 'touch') && window.innerHeight > window.innerWidth) drawRotate();
  if (modalUp()) drawModal();
  if (G.toast) { const w = textW(G.toast.msg) + 12, y = SCR.h - SCR.oy - 16; panel((VW - w) / 2, y, w, 15); text(G.toast.msg, VW / 2, y + 4, 'w', 0, 1); }
  drawCursor();
  // pause, menus, wipes and pop-ups are drawn on the game canvas: the HUD layer steps aside
  const hide = s !== 'play' || Wipe.t >= 0 || modalUp() ? 'hidden' : '';
  if (hudCv.style.visibility !== hide) hudCv.style.visibility = hide;
}

// ---------- Screen fit: integer scaling for crisp pixels, inside the safe area ----------
function resize() {
  const dpr = window.devicePixelRatio || 1, cs = getComputedStyle(document.body);
  const vv = window.visualViewport;
  const vw = (vv ? vv.width : window.innerWidth) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const vh = (vv ? vv.height : window.innerHeight) - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const w = vw * dpr, h = vh * dpr;
  // whole device pixels per game pixel; the canvas grows to cover the rest of the screen
  let k = Math.floor(Math.min(w / VW, h / VH));
  if (k >= 1) { SCR.w = Math.floor(w / k); SCR.h = Math.floor(h / k); }
  else { k = Math.min(w / VW, h / VH); SCR.w = VW; SCR.h = VH; }
  SCR.ox = (SCR.w - VW) >> 1; SCR.oy = (SCR.h - VH) >> 1;
  if (cv.width !== SCR.w || cv.height !== SCR.h) { cv.width = SCR.w; cv.height = SCR.h; ctx.imageSmoothingEnabled = false; }
  cv.style.width = (SCR.w * k / dpr) + 'px';
  cv.style.height = (SCR.h * k / dpr) + 'px';
  // desktop: the corner HUD uses smaller pixels (about half, never under 1.5 CSS px so it
  // stays easy to read); phones keep it as big as the world
  const kh = IS_TOUCH || k < 3 ? k : Math.min(k, Math.max(Math.ceil(1.5 * dpr), Math.floor(k * 0.5)));
  HUD.on = kh < k;
  hudCv.style.display = HUD.on ? '' : 'none';
  if (!HUD.on) return;
  HUD.w = Math.floor(w / kh); HUD.h = Math.floor(h / kh);
  HUD.ox = (HUD.w - VW) >> 1; HUD.oy = (HUD.h - VH) >> 1;
  if (hudCv.width !== HUD.w || hudCv.height !== HUD.h) { hudCv.width = HUD.w; hudCv.height = HUD.h; }
  hctx.imageSmoothingEnabled = false;
  const r = cv.getBoundingClientRect();
  hudCv.style.left = r.left + 'px'; hudCv.style.top = r.top + 'px';
  hudCv.style.width = (HUD.w * kh / dpr) + 'px';
  hudCv.style.height = (HUD.h * kh / dpr) + 'px';
}
// The corner HUD's own transparent canvas over the game. Between hudOn() and hudOff() every
// draw call (and SCR) points at it; with HUD.on false both do nothing.
const hudCv = document.createElement('canvas'), hctx = hudCv.getContext('2d');
hudCv.style.cssText = 'position:fixed;pointer-events:none;display:none';
document.body.appendChild(hudCv);
const HUD = { on: false, w: VW, h: VH, ox: 0, oy: 0, keep: null };
function hudOn() {
  if (!HUD.on || HUD.keep) return;
  HUD.keep = [ctx, SCR.w, SCR.h, SCR.ox, SCR.oy];
  ctx = hctx; SCR.w = HUD.w; SCR.h = HUD.h; SCR.ox = HUD.ox; SCR.oy = HUD.oy;
  ctx.setTransform(1, 0, 0, 1, SCR.ox, SCR.oy);
}
function hudOff() {
  if (!HUD.keep) return;
  [ctx, SCR.w, SCR.h, SCR.ox, SCR.oy] = HUD.keep;
  HUD.keep = null;
}
// Wall caps of the current land around the play view, on the room's own tile grid.
let _bd = null, _bdKey = '';
function drawBackdrop(theme) {
  const key = theme + SCR.w + 'x' + SCR.h;
  if (key !== _bdKey) {
    _bdKey = key;
    _bd = document.createElement('canvas'); _bd.width = SCR.w; _bd.height = SCR.h;
    const g = _bd.getContext('2d'), cap = S('cap@' + theme);
    const x0 = SCR.ox % 16 - 16, y0 = (SCR.oy + OY) % 16 - 16;
    for (let y = y0; y < SCR.h; y += 16) for (let x = x0; x < SCR.w; x += 16) blit(g, cap, x, y);
  }
  ctx.drawImage(_bd, 0, 0);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else goFullscreen();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (G.state === 'play' && !NET.role && !G.player.dead) setState('pause');
    flushSave();
  } else if (Save._stale && !Save.mayWrite()) location.reload();
});
// Closing the tab or leaving the app: keep what was earned since the last save point.
// A solo run is saved only in a cleared room (saveRun checks), the rest always.
function flushSave() {
  if (G.state === 'play' || G.state === 'pause') saveRun();
  Save.write();
}
window.addEventListener('pagehide', flushSave);
// Another tab saved (see save.js): a run keeps its progress, a menu reloads to show the
// new save, and a hidden tab waits until it is seen again.
Save.mayWrite = () => !!NET.role || !MENU_STATES.has(G.state);
Save.onStale = () => { if (!document.hidden) { Save._frozen = true; location.reload(); } };

// ---------- Loop ----------
const STEP = 1 / 60;
let acc = 0, lastT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000 || 0);
  lastT = now;
  acc += dt;
  let n = 0;
  // the next frame is asked for first: one faulty frame must never stop the whole game
  requestAnimationFrame(frame);
  try {
    while (acc >= STEP && n < 5) { update(STEP); endInputFrame(); acc -= STEP; n++; }
    if (n === 5) acc = 0;
  } catch (e) { acc = 0; endInputFrame(); frameError(e); }
  try { render(); } catch (e) { hudOff(); frameError(e); }
}
// still reported (online.js), without stopping the loop
function frameError(e) {
  if (window.reportError) reportError(e); else setTimeout(() => { throw e; });
}

bakeAtlas();
resize();
initProgress();
// ask the browser to keep the save for good (Firefox asks the player, so not there)
if (Save.stats.runs > 0 || isInstalled()) requestPersist(false);
refreshQuests();
linkRuns();
checkStars(true);
loadLive();
// installable + offline (only where service workers are allowed)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // a new release took over: reload right away if nobody is in the middle of something
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !NET.role && (G.state === 'title' || G.state === 'coop')) location.reload(); });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
resetAmbient('meadow');
// The loop starts once every script has run (net.js loads after this file).
function startLoop() { requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startLoop); else startLoop();
