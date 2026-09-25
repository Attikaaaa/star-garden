'use strict';
// Long-term progress: one event bus (note) feeds lifetime counters, quests, the
// Constellations, the bestiary and the run log that the end screen reads. Every device
// notes its own hero: in co-op the host forwards team events to the others (noteTeam).

// Magic items a brand-new player starts with; the rest arrive as Star Scrolls.
const START_ITEMS = ['rapid', 'big', 'triple', 'bounce', 'pierce', 'homing', 'moon', 'heart', 'speed', 'clover', 'scope', 'shield'];

// ---------- Counters ----------
const cnt = (k) => Save.cnt[k] || 0;
function bump(k, n) { Save.cnt[k] = (Save.cnt[k] || 0) + (n === undefined ? 1 : n); return Save.cnt[k]; }
function maxCnt(k, v) { if (v > (Save.cnt[k] || 0)) Save.cnt[k] = v; return Save.cnt[k]; }

// What happened in the current run that the end screen shows: unlocks, stars, quests.
// (rooms, nohitRooms, combo, gold, boss, bossNoHit also feed the daily run's score)
const RUNLOG = { news: [], hits: 0, roomHits: 0, bossHits: 0, elites: 0, start: 0, rooms: 0, nohitRooms: 0, combo: 0, gold: 0, boss: 0, bossNoHit: 0 };
function resetRunLog() {
  RUNLOG.news.length = 0; RUNLOG.start = Date.now();
  for (const k of ['hits', 'roomHits', 'bossHits', 'elites', 'rooms', 'nohitRooms', 'combo', 'gold', 'boss', 'bossNoHit']) RUNLOG[k] = 0;
}
// kind: 'item' | 'star' | 'quest' | 'robe' | 'wand' | 'unlock' | 'scroll' | 'beast'; icon: sprite name
function logNews(kind, text, icon) { if (RUNLOG.news.length < 12) RUNLOG.news.push({ kind, text, icon }); }

// ---------- The bus ----------
// ev: 'kill' type elite | 'boss' type seconds | 'bossstart' | 'room' type noHit | 'chal' | 'chest'
// | 'brk' | 'coins' n | 'combo' n | 'gold' | 'goldx' | 'starfall' | 'sfkills' n | 'potion' kind
// | 'item' id | 'syn' id | 'buy' what cost | 'land' depth | 'wave' n | 'start' mode heroes
// | 'end' summary | 'win' summary | 'hurt' | 'revive' | 'roll' | 'graze' | 'heart'
// | 'garden' id cost | 'wand' id cost | 'daily' score | 'weekly' score | 'scroll' id
// | 'learn' id cost | 'harvest' | 'mail' id | 'well' | 'ending'
const NOTE_HOOKS = [];
function onNote(fn) { NOTE_HOOKS.push(fn); }
function note(ev, a, b) {
  switch (ev) {
    case 'kill':
      bump('k'); bump('k:' + a);
      if (b) { bump('ke'); maxCnt('elitesrun', ++RUNLOG.elites); }
      if (G.player) bump('w:' + G.player.wand);
      if (G.mode === 'arena') bump('ka');
      break;
    case 'bossstart': RUNLOG.bossHits = 0; break;
    case 'boss':
      bump('b'); bump('b:' + a); RUNLOG.boss++;
      if (RUNLOG.bossHits === 0) { bump('nhb:' + a); RUNLOG.bossNoHit++; }
      if (b !== undefined && b <= 45) bump('fb:' + a);
      if (G.players.length > 1) bump('coopb');
      break;
    case 'room': b = RUNLOG.roomHits === 0; RUNLOG.roomHits = 0; bump('rooms'); RUNLOG.rooms++; if (b) { bump('nohit'); RUNLOG.nohitRooms++; } break;
    case 'chal': bump('chal'); break;
    case 'chest': bump('chests'); break;
    case 'brk': bump('brk'); break;
    case 'coins': bump('coins', a); break;
    case 'combo': maxCnt('combo', a); RUNLOG.combo = Math.max(RUNLOG.combo, a); break;
    case 'gold': bump('gold'); RUNLOG.gold++; break;
    case 'goldx': bump('goldx'); break;
    case 'starfall': bump('starfall'); break;
    case 'sfkills': maxCnt('sfkills', a); break;
    case 'potion': bump('potion'); bump('p:' + a); break;
    case 'item': bump('items'); break;
    case 'buy': bump('buy'); bump('spent', b || 0); Save.frog = cnt('spent'); break;
    case 'land': maxCnt('land', a + 1); break;
    case 'wave': b = RUNLOG.roomHits === 0; RUNLOG.roomHits = 0; maxCnt('wave', a); break;
    case 'start':
      resetRunLog(); bump('runs:' + a);
      if (b > 1) bump('coop');
      if (b >= 4) bump('coop4');
      if (couchOn()) bump('couch');
      break;
    case 'win':
      bump('wins'); bump('win:' + a.diff); if (G.player) bump('winw:' + G.player.wand);
      if (a.team) bump('coopwin');
      if (a.time < 900) bump('win15');
      if (a.time < 600) bump('win10');
      break;
    case 'hurt': RUNLOG.hits++; RUNLOG.roomHits++; RUNLOG.bossHits++; break;
    case 'roll': bump('rolls'); break;
    case 'garden': bump('garden'); bump('vspent', b || 0); break;
    case 'wand': case 'learn': bump('vspent', b || 0); if (ev === 'learn') bump('learned'); break;
    case 'revive': bump('revive'); break;
    case 'graze': bump('graze'); break;
    case 'heart': bump('hearts'); break;
    case 'harvest': bump('harvest'); break;
    case 'daily': bump('daily'); break;
    case 'weekly': bump('weekly'); break;
    case 'well': bump('well'); break;
    case 'ending': bump('ending'); break;
    case 'nemesis': bump('nemesis'); break;
    case 'rescue': bump('rescue'); break;
  }
  for (const fn of NOTE_HOOKS) fn(ev, a, b);
}
// Coins picked up since the last note (the purse is shared, so this is a team event).
function noteCoins() {
  const d = G.stats.coins - (G.run.noted || 0);
  if (d > 0) { G.run.noted = G.stats.coins; noteTeam('coins', d); }
}
// A team event: noted here and on every remote hero's own device.
function noteTeam(ev, a, b) {
  note(ev, a, b);
  for (const p of G.players) if (p.remote) netTell(p.pid, 'note', [ev, a, b]);
}
// A personal event for one hero (the host tells a remote hero's device).
function noteFor(p, ev, a, b) {
  if (p === G.player) note(ev, a, b);
  else if (p && p.remote) netTell(p.pid, 'note', [ev, a, b]);
}

// ---------- Unlocks and NEW badges ----------
const hasBadge = (k) => Save.badge.includes(k);
function addBadge(k) { if (!Save.badge.includes(k)) Save.badge.push(k); }
function clearBadge(k) { const i = Save.badge.indexOf(k); if (i >= 0) { Save.badge.splice(i, 1); Save.write(); } }
// Menus open up as the player gets to them (first launch shows only PLAY).
const MENU_RULES = {
  garden: () => Save.stats.runs > 0 || Save.vault > 0,
  daily: () => Save.stats.runs > 0,
  quests: () => Save.stats.runs > 0,
  book: () => Save.stats.runs > 0 || Save.found.length > 0,
  coop: () => Save.stats.runs > 0,
  arena: () => cnt('b') > 0 || Save.stats.bestWave > 0,
  stars: () => Object.keys(Save.ach).length > 0,
  mail: () => Save.mail.got.length > 0,
  library: () => Save.scrolls.length > 0 || Save.unl.items.length > START_ITEMS.length,
};
function menuOpen(id) {
  if (Save.flags.menus) return true;
  const f = MENU_RULES[id];
  return !f || f();
}
// Newly opened menus get a NEW badge until visited.
function checkMenus() {
  if (!Save.flags.seenMenus) Save.flags.seenMenus = {};
  for (const id in MENU_RULES) {
    if (Save.flags.seenMenus[id] || !menuOpen(id)) continue;
    Save.flags.seenMenus[id] = true;
    if (Save.stats.runs > 0 && !Save.flags.menus) addBadge('menu:' + id);
  }
}

// ---------- Run summary and history ----------
// The team-level facts of a finished run (each device adds its own hero in the 'end' hook).
function runSummary(won) {
  return {
    won: !!won, mode: G.mode, diff: G.diff, depth: G.floor ? G.floor.depth : 0, wave: G.arena ? G.arena.wave : 0,
    kills: G.stats.kills, coins: G.stats.coins, time: Math.round(G.stats.time), team: G.players.length, daily: G.daily ? G.daily.kind : '',
  };
}
onNote((ev, a) => {
  if (ev !== 'end') return;
  const p = G.player;
  const run = Object.assign({ t: Date.now(), wand: p ? p.wand : 'wand', hero: p && p.hero || 'pip', items: p ? p.items.slice(0, 24) : [], killer: p && p.lastHit || '' }, a);
  Save.hist.unshift(run);
  if (Save.hist.length > 20) Save.hist.length = 20;
  if (!a.won) { bump('deaths'); if (run.killer) bump('d:' + run.killer); }
  track('run_end', { won: run.won, mode: run.mode, diff: run.diff, depth: run.depth, wave: run.wave, kills: run.kills, time: run.time, team: run.team, wand: run.wand, killer: run.killer, items: run.items.length, hits: RUNLOG.hits });
  Save.write();
});
// Menus open as soon as their rule is met (NEW badge until visited).
onNote((ev) => { if (ev === 'end' || ev === 'boss' || ev === 'item') checkMenus(); });
onNote((ev, a, b) => {
  if (ev === 'start') track('run_start', { mode: a, diff: G.diff, wand: G.player ? G.player.wand : '', team: G.players.length, runs: Save.stats.runs });
  else if (ev === 'room') track('room', { type: a, noHit: !!b, depth: G.floor ? G.floor.depth : 0 });
  else if (ev === 'boss') track('boss', { type: a, time: Math.round(G.stats.time) });
  else if (ev === 'land') track('land', { depth: a });
  else if (ev === 'item') track('item', { id: a });
  else if (ev === 'buy') track('buy', { what: a, cost: b });
});

// ---------- Difficulty ladder ----------
// EASY and NORMAL are always open; HARD opens with a win, STARBREAKER with a HARD win.
// (The co-op lobby asks this too, when it exists.)
function diffUnlocked(i) {
  if (i <= 1) return true;
  if (i === 2) return Save.stats.wins > 0 || !!Save.flags.hard;
  if (i === 3) return cnt('win:2') > 0 || cnt('win:3') > 0 || !!Save.flags.starbreaker;
  return false;
}

// ---------- Boot ----------
function initProgress() {
  Save.touch();
  if (Save.flags.legacy && !Save.unl.items.length) Save.unl.items = FIRST_ITEMS.slice();
  if (!Save.unl.items.length) Save.unl.items = START_ITEMS.slice();
  if (!diffUnlocked(Save.settings.diff)) Save.settings.diff = 1;
  checkMenus();
  Save.write();
}
