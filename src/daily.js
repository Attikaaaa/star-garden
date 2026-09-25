'use strict';
// The Daily Star Run and the Weekly Challenge: one seed for everyone (from the UTC date or
// ISO week), the same wand, starting items and modifiers, Garden upgrades switched off.
// The first attempt of the day (or week) is the ranked one; later ones are practice.
// A daily run is one land and its boss; the weekly is all three lands with two modifiers.

// ---------- What today's and this week's runs are ----------
function dailySpec(kind, key) {
  key = key || (kind === 'weekly' ? utcWeek() : utcDay());
  const seed = hashSeed('star-garden', kind, key);
  return withSeed(seed, () => {
    const land = kind === 'daily' ? grndi(0, LANDS.length - 1) : 0;
    const wand = gpick(WAND_IDS);
    let mods = gshuffle(Object.keys(MODS).filter(k => !MODS[k].trial && !MODS[k].event)).slice(0, kind === 'daily' ? 1 : 2);
    // the season's featured twist leads the weekly challenge; a full moon joins the daily run
    if (kind === 'weekly') { const f = seasonOfWeek(key).mod; mods = [f].concat(mods.filter(m => m !== f)).slice(0, 2); }
    else if (moonDay(key)) mods.push('moonlit');
    // later lands start a little stronger, since upgrades stay at home
    const items = kind === 'daily' ? gshuffle(START_ITEMS.slice()).slice(0, 1 + land) : [gpick(START_ITEMS)];
    // the day's hero (any hero: a chance to try one before unlocking it)
    const hero = gpick(HERO_IDS);
    return { kind, key, seed, land, wand, mods, items, hero };
  });
}
const dailyRec = (kind) => (kind === 'weekly' ? Save.weekly : Save.daily);
const dailyKeyOf = (kind) => (kind === 'weekly' ? utcWeek() : utcDay());
function dailyFresh(kind) {
  const R = dailyRec(kind), k = dailyKeyOf(kind), f = kind === 'weekly' ? 'week' : 'day';
  if (R[f] !== k) { R[f] = k; R.tries = 0; R.best = 0; R.ranked = -1; }
  return R;
}
// Is today's ranked run still waiting? (the title and quests ask)
function dailyReady() { return Save.stats.runs > 0 && dailyFresh('daily').tries === 0; }
function untilUtcMidnight() {
  const t = 86400000 - (Date.now() % 86400000), h = Math.floor(t / 3600000), m = Math.floor(t / 60000) % 60;
  return h + 'H ' + pad2(m) + 'M';
}

// ---------- Playing ----------
// key: another day's key for a shared link (always practice).
function startDaily(kind, key) {
  const D = dailySpec(kind, key), R = dailyFresh(kind), today = !key || key === dailyKeyOf(kind);
  const ranked = today && R.tries === 0 && !Save.settings.assist;
  if (today) R.tries++;
  if (ranked && kind === 'daily') dailyStreak(D.key);
  Save.write();
  G.diff = 1;
  startRun('adv', [{ pid: 0, wand: D.wand, up: {}, name: Save.name, skin: Save.skin, hero: D.hero, aspect: 0 }], {
    seed: D.seed, depth: D.land, mods: D.mods, daily: { kind, key: D.key, ranked, spec: D },
  });
  const p = G.player;
  for (const id of D.items) giveItemQuiet(id, p);
  if (kind === 'daily' && D.land) { p.maxHp += 2 * D.land; p.hp = p.maxHp; }
  if (G.floorBanner) G.floorBanner.small = kind === 'weekly' ? 'WEEKLY CHALLENGE' : 'DAILY STAR RUN';
  G.banner = { title: (kind === 'weekly' ? 'WEEKLY CHALLENGE' : 'DAILY STAR RUN') + (ranked ? '' : ': PRACTICE'), sub: D.mods.map(m => MODS[m].name).join(' + ') + ': ' + MODS[D.mods[0]].desc, t: 3.2, icon: null };
  track('daily_start', { kind, key: D.key, ranked });
}
// Starting items: applied without the pickup fanfare.
function giveItemQuiet(id, p) {
  ITEMS[id].apply(p);
  p.items.push(id);
  if (p === G.player && !Save.found.includes(id)) Save.found.push(id);
  checkSynergies(p);
}
// A streak counts days with a ranked daily run in a row; one missed day a week is forgiven.
function dailyStreak(day) {
  const R = Save.daily;
  if (R.last === day) return;
  const gap = R.last ? daysBetween(R.last, day) : 99;
  if (gap === 1) R.streak++;
  else if (gap === 2 && R.freeze !== utcWeek()) { R.streak++; R.freeze = utcWeek(); }
  else R.streak = 1;
  R.last = day;
  maxCnt('streak', R.streak);
}
// The score of a finished daily or weekly run, part by part.
function dailyScore(won) {
  const L = RUNLOG, p = G.player, kind = G.daily.kind;
  const parts = [
    ['FOES', G.stats.kills * 10],
    ['ROOMS', L.rooms * 25],
    ['NO-HIT ROOMS', L.nohitRooms * 40],
    ['BEST COMBO', L.combo * 15],
    ['GOLDEN SLIMES', L.gold * 150],
    ['BOSSES', L.boss * 500 + L.bossNoHit * 300],
    ['HEARTS LEFT', won ? Math.ceil(p.hp / 2) * 50 : 0],
    ['TIME BONUS', won ? Math.max(0, Math.round((kind === 'weekly' ? 1500 : 480) - G.stats.time)) * 3 : 0],
  ];
  return { parts, total: parts.reduce((a, b) => a + b[1], 0) };
}
// Called when a daily or weekly run ends, won or not.
function finishDaily(won) {
  const D = G.daily;
  if (!D || D.done) return;
  D.done = true;
  const sc = dailyScore(won), R = dailyRec(D.kind), today = D.key === dailyKeyOf(D.kind);
  D.score = sc; D.won = won; D.reward = null;
  D.best = today && sc.total > R.best;
  if (today) R.best = Math.max(R.best, sc.total);
  if (D.ranked) {
    R.ranked = sc.total;
    if (D.kind === 'daily') {
      const g = { seeds: D.spec.mods.includes('moonlit') ? 2 : 1, vault: Math.min(40, 5 + Math.round(sc.total / 150)) };
      giveGift(g); D.reward = g;
      R.log.unshift({ d: D.key, s: sc.total, w: !!won, l: D.spec.land });
      if (R.log.length > 30) R.log.length = 30;
      note('daily', sc.total);
      postScore('daily', D.key, sc.total);
    } else if (won) {
      const g = { seeds: 2, vault: 60 };
      giveGift(g); D.reward = g;
    }
  }
  if (D.kind === 'weekly' && won) note('weekly', sc.total);
  if (D.kind === 'weekly' && D.ranked) postScore('weekly', D.key, sc.total);
  Save.write();
  track('daily_end', { kind: D.kind, key: D.key, ranked: D.ranked, score: sc.total, won: !!won, time: Math.round(G.stats.time) });
}

// ---------- Screen ----------
const dailyBtns = () => (G.dailyTab === 2 ? ['bow', 'back'] : online() ? ['play', 'board', 'share', 'back'] : ['play', 'share', 'back']);
// three tabs: today, this week, and the sky (events, the season, the Boss of the Week)
const DAILY_TABS = ['TODAY', 'THIS WEEK', 'SKY'], tabX = (i) => VW / 2 + (i - 1) * 95;
const dailyBtnY = (n) => (n > 3 ? [153, 11] : n === 2 ? [172, 13] : [160, 13]);
function dailyTab() { return G.dailyTab === 1 ? 'weekly' : 'daily'; }
function updateDaily() {
  const was = G.dailyTab || 0, dir = pressed(...K_LEFT, 'PadLB') ? -1 : pressed(...K_RIGHT, 'Tab', 'PadRB') ? 1 : 0;
  if (dir) G.dailyTab = (was + dir + 3) % 3;
  DAILY_TABS.forEach((t, i) => { if (mouseOn() && Input.mouseHit && Math.abs(Input.mx - tabX(i)) < 46 && Input.my >= 28 && Input.my < 42) G.dailyTab = i; });
  if ((G.dailyTab || 0) !== was) { Audio_.sfx('select'); G.menuSel = 0; return null; }
  const btns = dailyBtns(), [by, gap] = dailyBtnY(btns.length);
  menuNav(btns.length);
  let click = -1;
  btns.forEach((b, i) => { if (hoverRow(i, VW / 2 - 60, by + i * gap - 3, 120, gap)) click = i; });
  const b = btns[G.menuSel], ok = pressed(...K_OK) || (click >= 0 && Input.mouseHit);
  if (pressed(...K_BACK) || (ok && b === 'back')) return 'back';
  if (ok && b === 'play') return 'play';
  if (ok && b === 'bow') { Audio_.sfx('confirm'); wipe(startBossWeek); return null; }
  if (ok && b === 'board') { Audio_.sfx('confirm'); openBoard(dailyTab(), dailySpec(dailyTab()).key, false); }
  if (ok && b === 'share') { const R = dailyRec(dailyTab()); if (R.tries) shareDaily(dailyTab()); else { Audio_.sfx('deny'); toast('PLAY IT FIRST!'); } }
  return null;
}
function drawDaily() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 150, 24, 300, 180);
  DAILY_TABS.forEach((t, i) => {
    const x = tabX(i), on = (G.dailyTab || 0) === i;
    text(t, x, 31, on ? 'Y' : '3', 1, 1);
    if (on) rect(x - textW(t) / 2 - 2, 40, textW(t) + 4, 1, 'Y');
  });
  if (G.dailyTab === 2) {
    drawSkyTab();
    drawMenu(['BOSS OF THE WEEK', 'BACK'], ...dailyBtnY(2));
    return;
  }
  const kind = dailyTab(), D = dailySpec(kind), R = dailyFresh(kind);
  text(kind === 'weekly' ? 'WEEKLY CHALLENGE ' + D.key : 'DAILY STAR RUN ' + D.key, VW / 2, 47, 'c', 1, 1);
  // the run: land, wand, modifiers, starting items
  const x0 = VW / 2 - 138;
  text(kind === 'weekly' ? 'ALL THREE LANDS' : THEMES[LANDS[D.land].theme].name, x0, 60, 'Y', 1);
  drawS(S('wand_' + D.wand), x0, 70);
  text(WANDS[D.wand].name + '  ' + HEROES[D.hero].name, x0 + 22, 74, 'w', 1);
  let my = 90;
  for (const m of D.mods) {
    text(MODS[m].name, x0, my, 'P', 1); my += 9;
    for (const l of wrapText(MODS[m].desc, 132)) { text(l, x0, my, 'w', 1); my += 9; }
    my += 3;
  }
  D.items.forEach((id, i) => drawS(S('icon_' + id), x0 + i * 18, my));
  text('NO GARDEN UPGRADES: A FAIR RACE', VW / 2, dailyBtns().length > 3 ? 142 : 147, 'l', 1, 1);
  // records
  const rx = VW / 2 + 60;
  text(R.ranked >= 0 ? 'YOUR SCORE' : R.tries ? 'IN PROGRESS' : 'NOT PLAYED YET', rx, 60, 'c', 1, 1);
  if (R.ranked >= 0) text(String(R.ranked), rx, 71, 'Y', 1, 1);
  if (R.best > R.ranked && R.ranked >= 0) text('BEST PRACTICE ' + R.best, rx, 82, 'l', 1, 1);
  if (kind === 'daily') {
    const S_ = Save.daily;
    text('STREAK: ' + (S_.last && daysBetween(S_.last, utcDay()) <= 2 ? S_.streak : 0) + ' DAYS', rx, 94, 'h', 1, 1);
    // the last seven days
    for (let i = 0; i < 7; i++) {
      const day = utcDay(Date.now() - (6 - i) * 86400000), e = S_.log.find(l => l.d === day), bx = rx - 42 + i * 12;
      const hgt = e ? Math.max(2, Math.min(24, Math.round(e.s / 250))) : 0;
      rect(bx, 104, 9, 26, '0'); rect(bx + 1, 105, 7, 24, '1');
      if (hgt) rect(bx + 1, 129 - hgt, 7, hgt, e.w ? 'h' : 'c');
    }
    text(dailyReady() ? 'READY!' : 'NEW RUN IN ' + untilUtcMidnight(), rx, 134, dailyReady() ? 'Y' : 'l', 1, 1);
  } else { text('FIRST WIN PAYS', rx, 94, 'h', 1, 1); text('+2 SEEDS +60 VAULT', rx, 104, 'h', 1, 1); }
  const labels = { play: R.tries ? 'PRACTICE' : 'PLAY (RANKED)', board: 'LEADERBOARD', share: 'SHARE', back: 'BACK' }, btns = dailyBtns();
  drawMenu(btns.map(b => labels[b]), ...dailyBtnY(btns.length));
  text(R.tries ? 'THE FIRST TRY COUNTS, THE REST ARE PRACTICE' : 'ONLY THE FIRST TRY COUNTS: GOOD LUCK!', VW / 2, 198, 'c', 1, 1);
}

// ---------- The end of a daily or weekly run (drawn inside the end screen) ----------
function drawDailyEnd(x, y, w) {
  const D = G.daily, sc = D.score;
  sc.parts.forEach(([k, v], i) => {
    const cx = i % 2 ? x + w / 2 + 6 : x + 12, cy = y + Math.floor(i / 2) * 10, cw = w / 2 - 18;
    text(k, cx, cy, 'l', 1); text(String(v), cx + cw, cy, v ? 'w' : 'l', 1, 2);
  });
  y += 42;
  text('SCORE ' + sc.total + (D.best ? '  NEW BEST!' : ''), VW / 2, y, 'Y', 1, 1);
  text(D.ranked ? (D.reward ? 'RANKED: ' + giftText(D.reward) : 'RANKED') : 'PRACTICE: THE FIRST TRY COUNTS', VW / 2, y + 11, D.ranked ? 'h' : 'l', 1, 1);
}

// ---------- Share card ----------
// A picture of the result (pixel art, scaled 3x) plus a line of text and a link.
function shareCard(kind) {
  const D = dailySpec(kind), R = dailyRec(kind), c = document.createElement('canvas');
  const W = 192, H = 108, K = 3;
  const s = document.createElement('canvas'); s.width = W; s.height = H;
  const g = s.getContext('2d');
  const r = (x, y, w, h, k) => { g.fillStyle = PAL[k]; g.fillRect(x, y, w, h); };
  r(0, 0, W, H, '1'); r(2, 2, W - 4, H - 4, '0'); r(3, 3, W - 6, H - 6, '1');
  for (let i = 0; i < 40; i++) r(hash(i, 1, 3) % W, hash(i, 2, 5) % H, 1, 1, i % 4 ? '3' : 'w');
  const t = (str, x, y, col, al) => { const cv = _renderText(String(str).toUpperCase(), col, 1); g.drawImage(cv, Math.round(al === 1 ? x - cv.width / 2 : x), y); };
  t('STAR GARDEN', W / 2, 8, 'Y', 1);
  t((kind === 'weekly' ? 'WEEKLY ' : 'DAILY ') + D.key, W / 2, 19, 'c', 1);
  t(String(R.ranked >= 0 ? R.ranked : R.best), W / 2, 36, 'w', 1);
  t(kind === 'weekly' ? 'ALL LANDS' : THEMES[LANDS[D.land].theme].name, W / 2, 50, 'l', 1);
  t(D.mods.map(m => MODS[m].name).join(' + '), W / 2, 60, 'P', 1);
  if (kind === 'daily' && Save.daily.streak > 1) t('STREAK ' + Save.daily.streak, W / 2, 72, 'h', 1);
  t('CAN YOU BEAT IT?', W / 2, 90, 'Y', 1);
  c.width = W * K; c.height = H * K;
  const cg = c.getContext('2d'); cg.imageSmoothingEnabled = false; cg.drawImage(s, 0, 0, W * K, H * K);
  return c;
}
function shareDaily(kind) {
  const D = dailySpec(kind), R = dailyRec(kind), score = R.ranked >= 0 ? R.ranked : R.best;
  const url = location.origin + location.pathname + '?' + kind + '=' + D.key;
  const msg = 'Star Garden ' + (kind === 'weekly' ? 'weekly challenge ' : 'daily star run ') + D.key + ': ' + score + ' points. Can you beat it?';
  track('share', { kind, key: D.key });
  const card = shareCard(kind);
  card.toBlob((blob) => {
    const file = blob && typeof File === 'function' ? new File([blob], 'star-garden-' + D.key + '.png', { type: 'image/png' }) : null;
    const data = { title: 'Star Garden', text: msg, url };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share(Object.assign({ files: [file] }, data)).catch(() => {});
    else if (navigator.share) navigator.share(data).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(msg + ' ' + url).then(() => toast('COPIED! PASTE IT TO A FRIEND'), () => toast('COULD NOT SHARE'));
    else toast('COULD NOT SHARE');
  });
}

// ---------- Shared links: ?daily=DAY, ?weekly=WEEK (practice), ?seed=N (a seeded adventure) ----------
function linkRuns() {
  let q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  const day = q.get('daily'), week = q.get('weekly'), seed = parseInt(q.get('seed'), 10);
  if (Save.stats.runs < 1) return; // a first visit plays the tutorial first
  if (day && /^\d{4}-\d\d-\d\d$/.test(day)) G.link = { kind: 'daily', key: day };
  else if (week && /^\d{4}-W\d\d$/.test(week)) G.link = { kind: 'weekly', key: week };
  else if (seed > 0) G.link = { seed: seed >>> 0 };
}
function linkNotice() {
  const L = G.link;
  if (!L) return;
  G.link = null;
  if (L.seed) {
    openModal({ title: 'A FRIEND SENT YOU A SEED', lines: ['SEED ' + L.seed + ': THE SAME LANDS, ROOMS AND LOOT', 'AS YOUR FRIEND HAD. CAN YOU DO BETTER?'],
      buttons: [{ label: 'PLAY IT', col: 'h', fn: () => wipe(() => startRun('adv', null, { seed: L.seed })) }, { label: 'NOT NOW' }] });
    return;
  }
  const today = L.key === dailyKeyOf(L.kind);
  openModal({ title: L.kind === 'weekly' ? 'A WEEKLY CHALLENGE' : 'A DAILY STAR RUN', lines: [L.key + (today ? ': TODAY\'S RUN' : ': PRACTICE ONLY'), 'A FRIEND WANTS YOU TO BEAT THEIR SCORE!'],
    buttons: [{ label: 'PLAY', col: 'h', fn: () => { if (today) { G.dailyTab = L.kind === 'weekly' ? 1 : 0; setState('daily'); } else wipe(() => startDaily(L.kind, L.key)); } }, { label: 'NOT NOW' }] });
}
