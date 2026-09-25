'use strict';
// Shared screen pieces: modal notices (what's new, gifts, install, stats consent), the
// end-of-run screen that points at the next goal, and small helpers for menus.

// ---------- Names of foes (end screen, bestiary, quests) ----------
const FOE_NAMES = {
  slime: 'SLIME', mini: 'MINI SLIME', gold: 'GOLDEN SLIME', bee: 'BEE', shroom: 'MUSHROOM', flower: 'FLOWER',
  crab: 'CRAB', wisp: 'WISP', jelly: 'JELLYFISH', bat: 'BAT', dummy: 'PRACTICE DUMMY',
  king: 'SLIME KING', bcrab: 'GIANT CRAB', golem: 'CRYSTAL GOLEM',
};
const foeName = (t) => FOE_NAMES[t] || (EDEF[t] && EDEF[t].name) || String(t || '').toUpperCase();
const aOrAn = (w) => (/^[AEIOU]/.test(w) ? 'AN ' : 'A ');

// ---------- Modal notices ----------
// A small panel over any screen: { title, lines: [..], icon?, buttons: [{ label, fn, col }] }.
// Opening one queues it; they show one at a time and block other input.
const MODALS = [];
function openModal(m) { MODALS.push(Object.assign({ sel: 0, t: 0 }, m)); }
const modalUp = () => MODALS.length > 0;
function modalRect(m) {
  // wide enough for every button, each with room for the pointer
  const bw = Math.max(...m.buttons.map(b => textW(b.label))) + 14;
  const w = Math.max(200, textW(m.title) + 24, ...m.lines.map(l => textW(l) + 20), m.buttons.length * bw + 16), h = 30 + m.lines.length * 11 + 16 + (m.icon ? 18 : 0);
  return [Math.round((VW - w) / 2), Math.round((VH - h) / 2), w, h];
}
function updateModal(dt) {
  const m = MODALS[0];
  m.t += dt;
  if (m.t < 0.25) return; // a moment to read before a stray press closes it
  const n = m.buttons.length, [x, y, w, h] = modalRect(m);
  if (pressed(...K_LEFT)) { m.sel = (m.sel + n - 1) % n; Audio_.sfx('select'); }
  if (pressed(...K_RIGHT)) { m.sel = (m.sel + 1) % n; Audio_.sfx('select'); }
  let hit = -1;
  const bw = Math.floor((w - 16) / n);
  for (let i = 0; i < n; i++) if (hoverRow(i, x + 8 + i * bw, y + h - 18, bw, 14)) hit = i;
  if (hit >= 0) m.sel = hit;
  const back = pressed(...K_BACK);
  if (pressed(...K_OK) || hit >= 0 || back) {
    const b = back ? m.buttons[n - 1] : m.buttons[m.sel];
    MODALS.shift();
    Audio_.sfx(back ? 'select' : 'confirm');
    if (b && b.fn) b.fn();
  }
}
function drawModal() {
  const m = MODALS[0];
  dim(0.45);
  const [x, y, w, h] = modalRect(m), a = Math.min(1, m.t * 6);
  const yy = Math.round(y + (1 - a) * 8);
  panel(x, yy, w, h);
  let ty = yy + 7;
  if (m.icon) { drawS(S(m.icon), VW / 2 - 8, ty - 2); ty += 18; }
  text(m.title, VW / 2, ty, 'Y', 1, 1);
  m.lines.forEach((l, i) => text(l, VW / 2, ty + 14 + i * 11, i === 0 && m.lead ? 'c' : 'w', 1, 1));
  const n = m.buttons.length, bw = Math.floor((w - 16) / n);
  m.buttons.forEach((b, i) => {
    const bx = x + 8 + i * bw + bw / 2, by = yy + h - 14, on = i === m.sel;
    text(b.label, bx, by, on ? 'Y' : b.col || 'l', 2, 1);
    if (on) pointer(bx - textW(b.label) / 2 - 10, by);
  });
}
// ---------- What the title screen has to say (once each) ----------
// NEWS: what changed in each version, shown once to returning players.
const NEWS = [
  { v: '1.3.1', lines: ['YOUR GARDEN IS SAVED WHEN YOU CLOSE THE GAME', 'IPHONE: THE HOME SCREEN APP TAKES YOUR SAVE ALONG'] },
  { v: '1.3.0', lines: ['THE SKY: STAR RAIN, MOON NIGHTS AND SEASONS', 'A NEW BOSS OF THE WEEK EVERY MONDAY', 'COUCH CO-OP: PLUG IN MORE CONTROLLERS', 'CO-OP: REJOIN A GAME AFTER A DROP', 'SAVE CODES: TAKE YOUR GARDEN ANYWHERE', 'A NEW LANGUAGE: MAGYAR'] },
  { v: '1.2.0', lines: ['THE GARDEN: QUESTS, CONSTELLATIONS, A BOOK AND A MAILBOX', 'MISTER RIBBIT WRITES LETTERS AND GIVES DAILY GIFTS', 'ROLL THROUGH BULLETS TO CHARGE STARFALL', '15 ITEM COMBOS WITH REAL BONUSES TO FIND', 'THE END SCREEN SHOWS YOUR NEXT GOAL', 'TRAILS, PETS AND TITLES IN THE WARDROBE'] },
];
function titleNotices() {
  if (modalUp() || G.noticesShown) return;
  G.noticesShown = true;
  // what's new, for players who played an older version
  if (Save.ver !== GAME_VERSION) {
    const old = Save.ver, lines = [];
    if (Save.stats.runs > 0) for (const n of NEWS) if (!old || n.v > old) lines.push(...n.lines);
    const live = ONLINE.live && Array.isArray(ONLINE.live.news) ? ONLINE.live.news.filter(n => n && n.v === GAME_VERSION) : [];
    for (const n of live) if (Array.isArray(n.lines)) lines.push(...n.lines.map(String));
    Save.ver = GAME_VERSION; Save.write();
    if (lines.length) openModal({ title: 'WHAT IS NEW', lines: lines.slice(0, 7), buttons: [{ label: 'GREAT!' }] });
  }
  if (saveNotices()) return;
  if (typeof progressNotices === 'function') progressNotices();
  if (typeof linkNotice === 'function') linkNotice();
  if (typeof goalNotice === 'function') goalNotice();
  if (Save.flags.installAsk) {
    Save.flags.installAsk = false; Save.flags.installN = (Save.flags.installN || 0) + 1; Save.write();
    const ios = IS_IOS && !navigator.standalone;
    if (canPromptInstall() || ios) {
      openModal({
        title: 'KEEP YOUR GARDEN SAFE', icon: 'icon_heart',
        lines: ios ? ['SAFARI FORGETS A GAME AFTER A WEEK AWAY.', 'TAP SHARE, THEN ADD TO HOME SCREEN:', 'THE APP KEEPS YOUR GARDEN FOR GOOD'] : ['INSTALL STAR GARDEN LIKE AN APP:', 'IT PLAYS FULLSCREEN, WORKS OFFLINE', 'AND KEEPS YOUR SAVE SAFE'],
        buttons: ios ? [{ label: 'OK' }, { label: 'NOT NOW', fn: () => { Save.flags.installNo = true; Save.write(); } }]
          : [{ label: 'INSTALL', col: 'h', fn: () => { promptInstall(); requestPersist(true); } }, { label: 'LATER' }],
      });
    }
  }
  // anonymous stats: only asked when a game server is set up, and only once
  if (ONLINE.url && Save.settings.share === null && Save.stats.runs > 0) {
    openModal({
      title: 'HELP MAKE STAR GARDEN BETTER', lines: ['SHARE ANONYMOUS PLAY STATS?', 'NO NAMES, NO ACCOUNTS: JUST WHAT HAPPENS IN RUNS.', 'YOU CAN CHANGE THIS IN SETTINGS.'],
      buttons: [{ label: 'YES', col: 'h', fn: () => setShare(true) }, { label: 'NO', fn: () => setShare(false) }],
    });
  }
}

// Where the save could be lost or was just moved. True when a notice was shown.
// Apps inside Instagram, Facebook, TikTok and the like throw their storage away.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|TikTok|musical_ly|Bytedance|Snapchat|Line\//.test(navigator.userAgent);
function saveNotices() {
  if (IN_APP) {
    openModal({ title: 'THIS BROWSER FORGETS', icon: 'icon_heart', lines: ['THE BROWSER INSIDE THIS APP DELETES', 'YOUR GARDEN WHEN YOU CLOSE IT.', 'OPEN THE LINK IN SAFARI OR CHROME.'], buttons: [{ label: 'OK' }] });
    return true;
  }
  if (Save._carried) {
    Save._carried = false;
    openModal({ title: 'YOUR GARDEN IS HERE', icon: 'icon_sprout', lines: ['YOUR SAVE CAME ALONG FROM SAFARI.', 'THE APP KEEPS IT FOR GOOD.'], buttons: [{ label: 'GREAT!' }] });
    return true;
  }
  // an iPhone app that starts empty: the save may still be waiting in Safari
  if (Save._app && !Save.stats.runs && !Save.flags.appAsk) {
    Save.flags.appAsk = true; Save.write();
    openModal({
      title: 'PLAYED IN SAFARI BEFORE?', icon: 'icon_sprout',
      lines: ['THIS APP HAS ITS OWN SAVE. IN SAFARI, COPY', 'YOUR SAVE CODE (SETTINGS > SAVE CODE)', 'AND LOAD IT HERE.'],
      buttons: [{ label: 'LOAD', col: 'h', fn: () => { let c = null; try { c = window.prompt('PASTE A SAVE CODE'); } catch (e) { /* blocked */ } if (c) confirmLoad(readSaveCode(c)); } }, { label: 'NEW GARDEN' }],
    });
    return true;
  }
  return false;
}

// ---------- The end of a run ----------
// The cheapest thing the vault can buy next: an upgrade level or a wand.
function nextGoal() {
  let best = null;
  for (const u of UPGRADES) {
    const lv = upLevel(u.id);
    if (lv < u.cost.length && (!best || u.cost[lv] < best.cost)) best = { name: u.name, icon: u.icon, cost: u.cost[lv] };
  }
  for (const id of WAND_IDS) {
    if (Save.wands.includes(id) || (typeof wandReady === 'function' && !wandReady(id))) continue;
    if (!best || WANDS[id].cost < best.cost) best = { name: WANDS[id].name, icon: 'wand_' + id, cost: WANDS[id].cost };
  }
  return best;
}
// Rooms between here and the boss room (through doors).
function roomsToBoss() {
  if (!G.floor || !G.room) return -1;
  const seen = new Set([G.room]), q = [[G.room, 0]];
  while (q.length) {
    const [r, d] = q.shift();
    if (r.type === 'boss') return d;
    for (const k in r.doors) { const o = r.doors[k]; if (o && o.gx !== undefined && !seen.has(o)) { seen.add(o); q.push([o, d + 1]); } }
  }
  return -1;
}
// "So close!": the boss's health left, rooms to the boss, waves to the record.
function nearMiss() {
  if (G.won || !G.floor) return '';
  if (G.mode === 'arena') {
    const w = Math.max(0, G.arena.wave - 1), best = G.bestBefore;
    return best > 0 && w < best ? (best - w === 1 ? 'ONE WAVE FROM YOUR RECORD!' : (best - w) + ' WAVES FROM YOUR RECORD') : '';
  }
  const b = G.boss && !G.boss.dead ? G.boss : null;
  if (b) return foeName(b.type) + ' HAD ONLY ' + Math.max(1, Math.ceil(b.hp / b.maxHp * 100)) + '% LEFT!';
  const d = roomsToBoss();
  return d === 1 ? 'ONE ROOM FROM THE BOSS!' : d > 1 ? d + ' ROOMS FROM THE BOSS' : '';
}
function endLineA() {
  if (G.record) return [G.mode === 'arena' ? 'NEW RECORD: WAVE ' + (G.arena.wave - 1) + '!' : 'NEW RECORD: LAND ' + (G.floor.depth + 1) + '!', 'c'];
  const k = G.player && G.player.lastHit;
  if (G.state === 'over' && k) { const n = foeName(k), boss = EDEF[k] && EDEF[k].boss; return [(boss ? 'THE ' : aOrAn(n)) + n + ' GOT YOU', 'w']; }
  return null;
}
// Layout: title, two lines, stats in two columns, the next goal, what this run unlocked, menu.
function drawEndScreen(title, col, sub) {
  dim(0.55);
  const daily = G.daily && G.daily.score, team = G.players.length > 1, news = RUNLOG.news, goal = !team && !daily ? nextGoal() : null;
  const x = VW / 2 - 112, w = 224;
  let h = daily ? 178 : 158 + (goal ? 24 : 0) + (news.length && !team ? 26 : 0) + (team ? 10 * Math.ceil(G.players.length / 2) : 0) + (!team && G.frogLine ? 10 : 0);
  const y = Math.max(4, Math.round((VH - h) / 2));
  panel(x, y, w, h);
  const bob = Math.round(Math.sin(G.time * 3) * 1.5);
  text(title, VW / 2, y + 7 + bob, col, 2, 1);
  const a = daily ? [(G.daily.kind === 'weekly' ? 'WEEKLY CHALLENGE ' : 'DAILY STAR RUN ') + G.daily.key, 'c'] : endLineA();
  text(a ? a[0] : sub, VW / 2, y + 21, a ? a[1] : 'w', 1, 1);
  const b = G.gift ? 'THE FROG GAVE YOU ' + G.gift + ' VAULT COINS!' : nearMiss() || (G.state === 'over' && G.nemesisLine) || '';
  if (b) text(b, VW / 2, y + 32, G.gift ? 'Y' : 'c', 1, 1);
  let ly = y + 44;
  rect(x + 12, ly, w - 24, 1, '2');
  ly += 6;
  if (daily) {
    drawDailyEnd(x, ly, w);
    G.endMenuY = ly + 72;
    drawMenu(endItems(), G.endMenuY, 13);
    return;
  }
  const s = G.stats, arena = G.mode === 'arena';
  const cells = [[arena ? 'WAVE' : 'LAND', String(arena ? Math.max(1, G.arena.wave) : G.floor.depth + 1)], ['DEFEATED', String(s.kills)],
    ['COINS', String(s.coins)], ['TIME', fmtTime(s.time)], team ? ['HEROES', String(G.players.length)] : ['MAGIC ITEMS', String(s.items)], ['VAULT', '+' + G.run.vault]];
  cells.forEach(([k, v], i) => {
    const cx = i % 2 ? x + w / 2 + 6 : x + 12, cy = ly + Math.floor(i / 2) * 10, cw = w / 2 - 18;
    text(k, cx, cy, 'l', 1); text(v, cx + cw, cy, k === 'VAULT' ? 'c' : 'Y', 1, 2);
  });
  ly += 30;
  if (team) {
    G.players.forEach((p, i) => {
      const cx = i % 2 ? x + w / 2 + 6 : x + 12, cy = ly + Math.floor(i / 2) * 10;
      text(p.name, cx, cy, TAG_COL[p.skin], 1); text(String(p.kills), cx + w / 2 - 18, cy, 'w', 1, 2);
    });
    ly += 10 * Math.ceil(G.players.length / 2);
  }
  rect(x + 12, ly + 1, w - 24, 1, '2');
  ly += 6;
  if (goal) {
    const can = Save.vault >= goal.cost, blink = can && Math.floor(G.time * 3) % 2;
    const ic = S(goal.icon);
    drawS(ic, x + 12 + ((16 - ic.w) >> 1), ly + ((16 - ic.h) >> 1));
    text(can ? 'YOU CAN BUY: ' + goal.name + '!' : 'NEXT: ' + goal.name, x + 34, ly + 1, can ? (blink ? 'w' : 'Y') : 'w', 1);
    const bx = x + 34, bw = w - 46 - 34, k = Math.min(1, Save.vault / goal.cost);
    rect(bx, ly + 11, bw + 2, 5, '0'); rect(bx + 1, ly + 12, Math.round(bw * k), 3, can ? 'Y' : 'c');
    text(Math.min(Save.vault, goal.cost) + '/' + goal.cost, x + w - 12, ly + 10, 'Y', 1, 2);
    ly += 24;
  }
  if (news.length && !team) {
    const n = Math.min(8, news.length), gx = VW / 2 - (n * 18 - 2) / 2;
    news.slice(0, n).forEach((it, i) => {
      rect(gx + i * 18 - 1, ly - 1, 18, 18, '2');
      if (it.icon) { const ic = S(it.icon); drawS(ic, gx + i * 18 + ((16 - ic.w) >> 1), ly + ((16 - ic.h) >> 1)); }
    });
    const hover = news.find((it, i) => mouseOn() && Input.mx >= gx + i * 18 && Input.mx < gx + i * 18 + 16 && Input.my >= ly && Input.my < ly + 16);
    text((hover || news[Math.floor(G.time / 1.6) % news.length]).text, VW / 2, ly + 19, 'h', 1, 1);
    ly += 30;
  }
  G.endMenuY = ly + 4;
  drawMenu(endItems(), G.endMenuY, 13);
  if (NET.role === 'client') text('WAITING FOR THE HOST...', VW / 2, y + h - 10, 'c', 1, 1);
  else if (!team) {
    // Mister Ribbit's word about this run, taking turns with a reason to come back
    const why = comeBackLine(), frog = G.frogLine, show = frog && (!why || Math.floor(G.time / 4) % 2 === 0);
    if (show) wrapText(frog, w - 20).slice(0, 2).forEach((l, i, a) => text(l, VW / 2, y + h - 10 - (a.length - 1 - i) * 10, 'h', 1, 1));
    else if (why) text(why, VW / 2, y + h - 10, 'c', 1, 1);
  }
}

// ---------- NEW badges on menu rows ----------
function drawNewTags(items, y, gap, keyOf) {
  items.forEach((it, i) => {
    const k = keyOf(it);
    if (!k || (k !== true && !hasBadge(k))) return;
    const sel = i === G.menuSel, x = VW / 2 + textW(it) / 2 + (sel ? 16 : 8);
    if (Math.floor(G.time * 3) % 3) text('NEW', x, y + i * gap, 'P', 2);
  });
}
