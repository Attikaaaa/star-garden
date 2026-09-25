'use strict';
// Daily and weekly quests: three small goals a day (one swap), one bigger goal a week.
// They steer players toward things they have not tried yet and pay vault coins and seeds.

// Templates. ns: goal sizes (index = difficulty tier), rew: vault coins per tier.
// ev: the progress event that counts; ok(q, a, b): does this event count; add(a): how much.
const QUEST_T = {
  kill: { ns: [40, 60, 80], rew: [10, 14, 18], ev: 'kill', text: (q) => 'DEFEAT ' + q.n + ' FOES' },
  killt: { ns: [10, 15, 20], rew: [10, 14, 18], ev: 'kill', ok: (q, a) => a === q.a, arg: () => gpick(questFoes()), text: (q) => 'DEFEAT ' + q.n + ' ' + plural(foeName(q.a)) },
  elite: { ns: [3, 5, 7], rew: [12, 16, 20], ev: 'kill', ok: (q, a, b) => !!b, text: (q) => 'DEFEAT ' + q.n + ' GLOWING ELITES' },
  rooms: { ns: [8, 12, 16], rew: [10, 14, 18], ev: 'room', text: (q) => 'CLEAR ' + q.n + ' ROOMS' },
  nohit: { ns: [2, 3, 4], rew: [12, 16, 20], ev: 'room', ok: (q, a, b) => !!b, text: (q) => 'CLEAR ' + q.n + ' ROOMS WITHOUT GETTING HIT' },
  chal: { ns: [1, 2], rew: [12, 18], ev: 'chal', text: (q) => q.n > 1 ? 'WIN ' + q.n + ' CHALLENGE ROOMS' : 'WIN A CHALLENGE ROOM' },
  boss: { ns: [1, 2], rew: [14, 20], ev: 'boss', text: (q) => q.n > 1 ? 'DEFEAT ' + q.n + ' BOSSES' : 'DEFEAT A BOSS' },
  chest: { ns: [2, 3, 4], rew: [10, 14, 18], ev: 'chest', text: (q) => 'OPEN ' + q.n + ' CHESTS' },
  brk: { ns: [10, 15, 20], rew: [10, 12, 14], ev: 'brk', text: (q) => 'BREAK ' + q.n + ' BUSHES, BUCKETS OR VASES' },
  coins: { ns: [50, 80, 120], rew: [10, 14, 18], ev: 'coins', add: (a) => a, text: (q) => 'COLLECT ' + q.n + ' COINS' },
  combo: { ns: [6, 8, 10], rew: [10, 14, 18], ev: 'combo', max: true, text: (q) => 'REACH A COMBO OF ' + q.n },
  gold: { ns: [1], rew: [16], ev: 'gold', need: () => cnt('gold') + cnt('goldx') > 0, text: () => 'CATCH A GOLDEN SLIME' },
  star: { ns: [3, 5], rew: [12, 16], ev: 'starfall', text: (q) => 'CAST STARFALL ' + q.n + ' TIMES' },
  potion: { ns: [2, 3], rew: [10, 14], ev: 'potion', text: (q) => 'DRINK ' + q.n + ' POTIONS' },
  item: { ns: [4, 6], rew: [10, 14], ev: 'item', text: (q) => 'TAKE ' + q.n + ' MAGIC ITEMS' },
  buy: { ns: [2, 3], rew: [10, 14], ev: 'buy', text: (q) => 'BUY ' + q.n + ' THINGS FROM THE FROG' },
  land: { ns: [2, 3], rew: [14, 20], ev: 'land', max: true, add: (a) => a + 1, need: (n) => cnt('land') >= n, text: (q) => 'REACH ' + THEMES[THEME_ORDER[q.n - 1]].name },
  wave: { ns: [5, 8, 12], rew: [12, 16, 20], ev: 'wave', max: true, need: (n) => menuOpen('arena') && Save.stats.bestWave >= n - 3, text: (q) => 'REACH ARENA WAVE ' + q.n },
  daily: { ns: [1], rew: [12], ev: 'daily', need: () => menuOpen('daily') && typeof dailyReady === 'function', text: () => "PLAY TODAY'S STAR RUN" },
  wandk: { ns: [30, 50], rew: [12, 16], ev: 'kill', ok: (q) => G.player && G.player.wand === q.a, need: () => Save.wands.length > 1, arg: () => gpick(Save.wands.filter(w => w !== 'wand')), text: (q) => 'DEFEAT ' + q.n + ' FOES WITH THE ' + WANDS[q.a].name },
  graze: { ns: [8, 15], rew: [12, 16], ev: 'graze', need: () => cnt('graze') > 0, text: (q) => 'ROLL THROUGH ' + q.n + ' BULLETS' },
  hearts: { ns: [4, 6], rew: [10, 12], ev: 'heart', text: (q) => 'PICK UP ' + q.n + ' HEARTS' },
  win: { ns: [1], rew: [24], ev: 'win', need: () => Save.stats.wins > 0, text: () => 'WIN A RUN' },
  runs: { ns: [2, 3], rew: [10, 12], ev: 'start', text: (q) => 'PLAY ' + q.n + ' RUNS' },
  revive: { ns: [1], rew: [14], ev: 'revive', need: () => cnt('coop') > 0, text: () => 'HELP A FRIEND BACK UP' },
};
const WEEKLY_T = {
  wk_kill: { n: 400, ev: 'kill', text: 'DEFEAT 400 FOES' },
  wk_boss: { n: 5, ev: 'boss', text: 'DEFEAT 5 BOSSES' },
  wk_chal: { n: 5, ev: 'chal', text: 'WIN 5 CHALLENGE ROOMS' },
  wk_coins: { n: 600, ev: 'coins', add: (a) => a, text: 'COLLECT 600 COINS' },
  wk_rooms: { n: 60, ev: 'room', text: 'CLEAR 60 ROOMS' },
  wk_nohit: { n: 15, ev: 'room', ok: (q, a, b) => !!b, text: 'CLEAR 15 ROOMS WITHOUT A HIT' },
  wk_daily: { n: 4, ev: 'daily', need: () => menuOpen('daily') && typeof dailyReady === 'function', text: 'PLAY 4 DAILY STAR RUNS' },
  wk_win: { n: 1, ev: 'win', need: () => Save.stats.wins > 0, text: 'WIN A RUN THIS WEEK' },
};
const WEEKLY_REW = 60;
const plural = (w) => (/Y$/.test(w) && !/[AEIOU]Y$/.test(w) ? w.slice(0, -1) + 'IES' : /(SH|CH|S|X)$/.test(w) ? w + 'ES' : w + 'S');
// Foes a quest may ask for: the ones in lands the player has reached.
function questFoes() {
  const out = [];
  LANDS.forEach((l, i) => { if (i < Math.max(1, cnt('land'))) for (const [t] of l.pool) if (!out.includes(t)) out.push(t); });
  return out.length ? out : ['slime'];
}

// ---------- The day's and the week's quests ----------
function questText(q) { return QUEST_T[q.t] ? QUEST_T[q.t].text(q) : WEEKLY_T[q.t].text; }
function makeDailyQuests(day) {
  return withSeed(hashSeed('quests', day, Save.born), () => {
    const ids = Object.keys(QUEST_T).filter(id => { const T = QUEST_T[id]; return !T.need || T.need(T.ns[0]); });
    gshuffle(ids);
    const out = [];
    for (let tier = 0; out.length < 3 && ids.length; ) {
      const id = ids.shift(), T = QUEST_T[id], k = Math.min(tier, T.ns.length - 1);
      if (T.need && !T.need(T.ns[k])) continue;
      out.push({ t: id, n: T.ns[k], rew: T.rew[k], a: T.arg ? T.arg() : null, p: 0, done: false });
      tier++;
    }
    return out;
  });
}
function makeWeeklyQuest(week) {
  return withSeed(hashSeed('weekly', week, Save.born), () => {
    const ids = Object.keys(WEEKLY_T).filter(id => !WEEKLY_T[id].need || WEEKLY_T[id].need());
    const id = gpick(ids);
    return { t: id, n: WEEKLY_T[id].n, rew: WEEKLY_REW, p: 0, done: false };
  });
}
// New day, new quests; a new week, a new weekly one.
function refreshQuests() {
  if (!menuOpen('quests')) return;
  const day = dayKey(), week = utcWeek();
  let Q = Save.quests;
  if (!Q || Q.day !== day) {
    Q = Save.quests = { day, list: makeDailyQuests(day), swaps: 1, all: false, week: Q ? Q.week : '', wk: Q ? Q.wk : null };
    if (Save.stats.runs > 0) addBadge('menu:quests');
  }
  if (Q.week !== week) { Q.week = week; Q.wk = makeWeeklyQuest(week); }
  Save.write();
}
// Swap one daily quest for another (once a day).
function swapQuest(i) {
  const Q = Save.quests;
  if (!Q || Q.swaps <= 0 || Q.list[i].done) return false;
  const have = Q.list.map(q => q.t);
  const pool = Object.keys(QUEST_T).filter(id => !have.includes(id) && (!QUEST_T[id].need || QUEST_T[id].need(QUEST_T[id].ns[0])));
  if (!pool.length) return false;
  const id = pool[Math.floor(Math.random() * pool.length)], T = QUEST_T[id], k = Math.min(i, T.ns.length - 1);
  Q.list[i] = { t: id, n: T.ns[k], rew: T.rew[k], a: T.arg ? withSeed(newSeed(), T.arg) : null, p: 0, done: false };
  Q.swaps--;
  Save.write();
  return true;
}

// The first quests arrive with the end of the first run; later ones with each new day.
onNote((ev) => { if (ev === 'end') refreshQuests(); });

// ---------- Counting ----------
function questProgress(q, T, a, b) {
  if (q.done || T.ev === undefined) return false;
  if (T.ok && !T.ok(q, a, b)) return false;
  const v = T.add ? T.add(a) : T.max ? a : 1;
  const before = q.p;
  q.p = T.max ? Math.max(q.p, v) : q.p + v;
  return q.p !== before;
}
function questDone(q, weekly) {
  q.done = true; q.p = q.n;
  Save.vault += q.rew;
  if (weekly) Save.seeds++;
  bump('quests');
  Audio_.sfx('quest');
  G.banner = { title: weekly ? 'WEEKLY QUEST DONE!' : 'QUEST DONE!', sub: questText(q) + '  +' + q.rew + ' VAULT' + (weekly ? ' +1 SEED' : ''), t: 2.6, icon: null };
  logNews('quest', 'QUEST DONE: +' + q.rew + ' VAULT', 'mm_item');
  track('quest', { t: q.t, n: q.n, weekly: !!weekly });
}
onNote((ev, a, b) => {
  const Q = Save.quests;
  if (!Q || ev === 'end') return;
  let changed = false;
  for (const q of Q.list) {
    const T = QUEST_T[q.t];
    if (!T || T.ev !== ev) continue;
    if (questProgress(q, T, a, b)) { changed = true; if (q.p >= q.n) questDone(q, false); }
  }
  if (Q.wk && !Q.wk.done) {
    const T = WEEKLY_T[Q.wk.t];
    if (T && T.ev === ev && questProgress(Q.wk, T, a, b)) { changed = true; if (Q.wk.p >= Q.wk.n) questDone(Q.wk, true); }
  }
  if (changed && !Q.all && Q.list.every(q => q.done)) {
    Q.all = true; Save.seeds++;
    toast('ALL QUESTS DONE: +1 STAR SEED!');
  }
});

// ---------- Screen ----------
function untilTomorrow() {
  const d = new Date(), t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) - d;
  const h = Math.floor(t / 3600000), m = Math.floor(t / 60000) % 60;
  return h + 'H ' + String(m).padStart(2, '0') + 'M';
}
function updateQuests() {
  const Q = Save.quests, n = Q ? Q.list.length : 0;
  menuNav(n + 1);
  let click = -1;
  for (let i = 0; i < n; i++) if (hoverRow(i, VW / 2 - 150, 44 + i * 32, 300, 30)) click = i;
  if (hoverRow(n, VW / 2 - 30, 197, 60, 13) && Input.mouseHit) return true;
  if (pressed(...K_BACK) || (pressed(...K_OK) && G.menuSel === n)) return true;
  const i = (pressed(...K_OK) && G.menuSel < n) ? G.menuSel : click >= 0 && Input.mouseHit ? click : -1;
  if (i >= 0 && Q) {
    const q = Q.list[i];
    if (q.done) { Audio_.sfx('select'); return false; }
    if (Q.swaps <= 0) { Audio_.sfx('deny'); toast('ONE SWAP A DAY: NEW QUESTS TOMORROW'); return false; }
    openModal({ title: 'SWAP THIS QUEST?', lines: [questText(q), 'YOU CAN SWAP ONE QUEST EACH DAY'], buttons: [{ label: 'SWAP', col: 'h', fn: () => { if (swapQuest(i)) Audio_.sfx('item'); } }, { label: 'KEEP' }] });
  }
  return false;
}
function drawQuestRow(q, x, y, w, sel, weekly) {
  rect(x, y, w, 30, '0');
  rect(x + 1, y + 1, w - 2, 28, sel ? '2' : '1');
  if (sel) { rect(x - 1, y - 1, w + 2, 1, 'Y'); rect(x - 1, y + 30, w + 2, 1, 'Y'); rect(x - 1, y, 1, 30, 'Y'); rect(x + w, y, 1, 30, 'Y'); }
  const t = questText(q);
  text(t, x + 8, y + 5, q.done ? 'h' : sel ? 'Y' : 'w', 1);
  const bw = w - 110, k = Math.min(1, q.p / q.n);
  rect(x + 8, y + 18, bw + 2, 5, '0'); rect(x + 9, y + 19, Math.round(bw * k), 3, q.done ? 'h' : 'c');
  text(Math.min(q.p, q.n) + '/' + q.n, x + 14 + bw, y + 16, 'l', 1);
  const rw = '+' + q.rew + (weekly ? ' +SEED' : '');
  if (q.done) text('DONE!', x + w - 8, y + 11, 'h', 1, 2);
  else { drawS(S('coin_0'), x + w - 12 - textW(rw) - 11, y + 10); text(rw, x + w - 8, y + 11, 'Y', 1, 2); }
}
function drawQuests() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 162, 22, 324, 190);
  text('QUESTS', VW / 2, 29, 'Y', 2, 1);
  const Q = Save.quests;
  if (!Q) { text('PLAY A RUN TO GET YOUR FIRST QUESTS', VW / 2, 100, 'w', 1, 1); }
  else {
    Q.list.forEach((q, i) => drawQuestRow(q, VW / 2 - 150, 44 + i * 32, 300, G.menuSel === i, false));
    text('NEW QUESTS IN ' + untilTomorrow() + (Q.swaps > 0 ? '   PICK ONE TO SWAP IT' : ''), VW / 2, 143, 'c', 1, 1);
    if (Q.wk) { text('THIS WEEK', VW / 2 - 150, 153, 'l', 1); drawQuestRow(Q.wk, VW / 2 - 150, 162, 300, false, true); }
  }
  const back = G.menuSel === (Q ? Q.list.length : 0);
  text('BACK', VW / 2, 200, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 200);
}
