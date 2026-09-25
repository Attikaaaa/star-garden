'use strict';
// The Garden's menu: one card per place (upgrades, wands, quests, the sky, the book, the
// mailbox, the wardrobe), plus the cosmetics the wardrobe hands out (trails, pets, titles).

// ---------- Cosmetics ----------
// Trails: little particles behind a moving hero. Pets: a friend that follows them.
const TRAILS = {
  leaf: { name: 'LEAF', cols: ['G', 'h', 'H'], how: 'THE DAILY GIFT, DAY 7' },
  spark: { name: 'SPARK', cols: ['Y', 'w', 'y'], how: 'THE WAND MAKER' },
  comet: { name: 'COMET', cols: ['O', 'o', 'y', 'Y'], how: 'THE STORM' },
  rainbow: { name: 'RAINBOW', cols: ['r', 'O', 'y', 'h', 'c', '3'], how: 'THE STAR OF THE DAY' },
};
const PETS = {
  bun: { name: 'BUNNY', how: 'THE COLLECTOR' },
  bee: { name: 'BEE', how: 'THE FRIENDS' },
  slime: { name: 'SLIME', how: 'THE ODDITIES' },
};
// Titles come from constellations and letters; how: where they come from.
const TITLES = {
  GARDENER: 'THE GARDENER', STARKEEPER: 'THE NIGHT SKY', 'OLD FRIEND': "THE FROG'S LAST LETTER",
};
// Co-op: every screen draws every hero's pet and trail (net.js adds these to snapshots).
const PF_EXTRA = ['pet', 'trail', 'buddies', 'charmCd', 'hero', 'leapZ'];
// (the hero and the wand aspect ride along, so the host can set up every remote hero)
const myCosmetics = () => ({ pet: Save.pet, trail: Save.trail, title: Save.title, hero: heroUnlocked(Save.hero) ? Save.hero : 'pip', aspect: aspectOf(Save.wand) });
function applyCosmetics(p, c) {
  if (!c) return;
  p.pet = PETS[c.pet] ? c.pet : '';
  p.trail = TRAILS[c.trail] ? c.trail : '';
  p.title = typeof c.title === 'string' ? c.title.slice(0, 12) : '';
}
// The robes this player may wear (the rest come from constellations).
const robeList = () => ROBES.map((r, i) => i).filter(i => i >= 8 || Save.unl.robes.includes(i));
function nextRobe(cur, dir) {
  const list = robeList();
  if (!list.includes(cur)) return list[0];
  return list[(list.indexOf(cur) + dir + list.length) % list.length];
}

// Pets and trails are cosmetic: they run on every screen from the drawn positions.
let _cosT = 0;
function tickCosmetics() {
  const dt = Math.max(0, Math.min(0.1, G.time - _cosT));
  _cosT = G.time;
  if (!dt) return;
  for (const p of G.players) {
    if (p.dead) continue;
    if (p.pet) {
      if (p.petX === undefined || Math.hypot(p.petX - p.x, p.petY - p.y) > 120) { p.petX = p.x - 14; p.petY = p.y + 2; }
      // trot to a spot behind the hero, keep a little distance
      const tx = p.x - (p.flip ? -1 : 1) * 14, ty = p.y + 3, dx = tx - p.petX, dy = ty - p.petY, d = Math.hypot(dx, dy);
      p.petMove = d > 4;
      if (p.petMove) { const k = Math.min(1, dt * (d > 30 ? 7 : 4)); p.petX += dx * k; p.petY += dy * k; p.petFlip = dx < 0; }
    }
    if (p.trail && (p.moving || p.dashT > 0) && !p.down) {
      p.trailT = (p.trailT || 0) - dt;
      if (p.trailT <= 0) {
        p.trailT = p.dashT > 0 ? 0.02 : 0.06;
        const T = TRAILS[p.trail], c = p.trail === 'rainbow' ? T.cols[Math.floor(G.time * 12) % T.cols.length] : pick(T.cols);
        part(p.x + rnd(-3, 3), p.y - rnd(0, 3), rnd(-8, 8), p.trail === 'leaf' ? rnd(-6, 2) : -rnd(4, 14), rnd(0.3, 0.55), c, { drag: 0.92, size: Math.random() < 0.25 ? 2 : 1, g: p.trail === 'leaf' ? 20 : 0 });
      }
    }
  }
}
function drawPet(p, ox, oy) {
  if (!p.pet || p.dead || p.petX === undefined) return;
  const hop = p.petMove ? Math.floor(G.time * 8) % 2 : Math.floor(G.time * 2) % 2;
  const fly = p.pet === 'bee', lift = fly ? 8 + Math.round(Math.sin(G.time * 4) * 2) : hop && p.petMove ? 2 : 0;
  shadow(ox + p.petX, oy + p.petY, 8);
  drawFeet(S('pet_' + p.pet + '_' + (fly ? Math.floor(G.time * 14) % 2 : hop)), ox + p.petX, oy + p.petY + 1 - lift, p.petFlip ? 1 : 0);
}

// ---------- The Garden's menu ----------
// Cards open as the player gets to them; a locked card says how to open it.
const HUB = [
  { id: 'up', name: 'UPGRADES', icon: () => 'icon_sprout', open: () => true,
    info: () => { const n = UPGRADES.filter(u => { const lv = upLevel(u.id); return lv < u.cost.length && Save.vault >= u.cost[lv]; }).length; return n ? [n + ' TO BUY', 'Y'] : [UPGRADES.reduce((a, u) => a + upLevel(u.id), 0) + ' LEVELS', 'l']; },
    tip: 'SPEND VAULT COINS ON LASTING UPGRADES' },
  { id: 'wands', name: 'WANDS', icon: () => 'wand_' + Save.wand, open: () => true,
    info: () => [Save.wands.length + '/' + WAND_IDS.length, 'l'], tip: 'NEW WANDS CHANGE HOW YOU FIGHT' },
  { id: 'quests', name: 'QUESTS', icon: () => 'icon_quest', open: () => menuOpen('quests'), lock: 'PLAY A RUN TO GET QUESTS',
    info: () => { const Q = Save.quests; if (!Q) return ['', 'l']; const n = Q.list.filter(q => q.done).length; return n === Q.list.length ? ['ALL DONE', 'h'] : [n + '/' + Q.list.length + ' DONE', 'c']; },
    tip: 'THREE SMALL GOALS A DAY, ONE A WEEK' },
  { id: 'stars', name: 'STARS', icon: () => 'icon_scope2', open: () => menuOpen('stars'), lock: 'EARN YOUR FIRST STAR IN A RUN',
    info: () => [Object.keys(Save.ach).length + '/' + STAR_TOTAL, 'c'], tip: 'CONSTELLATIONS: GOALS THAT LIGHT UP THE SKY' },
  { id: 'book', name: 'BOOK', icon: () => 'icon_book', open: () => menuOpen('book'), lock: 'PLAY A RUN TO START THE BOOK',
    info: () => [Save.found.length + '/' + Object.keys(ITEMS).length, 'l'], tip: 'ITEMS, FOES, COMBOS AND YOUR RUNS' },
  { id: 'mail', name: 'MAILBOX', icon: () => 'icon_mail', open: () => menuOpen('mail'), lock: 'THE FROG WRITES AFTER YOUR FIRST RUN',
    info: () => { const n = unreadMail(); return n ? [n + ' NEW', 'Y'] : [Save.mail.got.length + ' LETTERS', 'l']; }, tip: 'LETTERS AND GIFTS FROM MISTER RIBBIT' },
  { id: 'library', name: 'LIBRARY', icon: () => 'scroll_0', open: () => menuOpen('library'), lock: 'FIND A STAR SCROLL IN A RUN',
    info: () => (Save.scrolls.length ? [Save.scrolls.length + ' TO LEARN', 'Y'] : [Save.unl.items.length + '/' + Object.keys(ITEMS).length, 'l']), tip: 'LEARN STAR SCROLLS: NEW MAGIC ITEMS' },
  { id: 'wardrobe', name: 'WARDROBE', icon: null, open: () => true,
    info: () => [robeList().length + ' ROBES', 'l'], tip: 'ROBES, TRAILS, PETS AND TITLES' },
];
const HUB_BADGE = { quests: 'menu:quests', stars: 'menu:stars', book: 'menu:book', mail: 'menu:mail', library: 'menu:library', wardrobe: 'wardrobe' };
// Anything new behind the Garden's door (the title shows NEW on THE GARDEN).
const hubBadge = () => hasBadge('menu:garden') || Object.values(HUB_BADGE).some(hasBadge) || (menuOpen('mail') && unreadMail() > 0);
const HUB_CW = 76, HUB_CH = 50, HUB_GAP = 6;
function hubCells() {
  const out = [];
  HUB.forEach((c, i) => {
    const row = i < 4 ? 0 : 1, n = row ? HUB.length - 4 : 4, k = row ? i - 4 : i;
    const x0 = VW / 2 - (n * HUB_CW + (n - 1) * HUB_GAP) / 2;
    out.push([Math.round(x0 + k * (HUB_CW + HUB_GAP)), 50 + row * (HUB_CH + HUB_GAP), HUB_CW, HUB_CH]);
  });
  return out;
}
function openHub(sel) { setState('garden'); G.menuSel = sel || 0; clearBadge('menu:garden'); }
function openHubCard(id) {
  const i = HUB.findIndex(c => c.id === id);
  if (HUB_BADGE[id]) clearBadge(HUB_BADGE[id]);
  if (id === 'up' || id === 'wands') { setState('kert'); G.gTab = id === 'up' ? 0 : 1; }
  else if (id === 'quests') { refreshQuests(); setState('quests'); }
  else if (id === 'stars') { setState('stars'); G.starOpen = null; }
  else if (id === 'book') { setState('book'); G.bookTab = 0; }
  else if (id === 'mail') setState('mail');
  else if (id === 'wardrobe') setState('wardrobe');
  else if (id === 'library') setState('library');
  G.hubFrom = i;
}
// Back from a Garden screen to its card.
function hubReturn() { if (G.yardBack) enterYard(); else openHub(Math.max(0, G.hubFrom || 0)); }
function updateHub() {
  const cells = hubCells(), n = HUB.length;
  let s = G.menuSel;
  if (s < n) {
    const row = s < 4 ? 0 : 1;
    if (pressed(...K_RIGHT) && s + 1 < n && (s + 1 < 4) === (row === 0)) s++;
    if (pressed(...K_LEFT) && s > 0 && (s - 1 < 4) === (row === 0)) s--;
    if (pressed(...K_DOWN)) s = row === 0 ? Math.min(n - 1, 4 + Math.max(0, s - 1)) : n;
    if (pressed(...K_UP) && row === 1) s = Math.min(3, s - 4 + 1);
  } else if (pressed(...K_UP)) s = 5;
  if (s !== G.menuSel) { G.menuSel = s; Audio_.sfx('select'); }
  let click = -1;
  cells.forEach((c, i) => { if (hoverRow(i, c[0], c[1], c[2], c[3])) click = i; });
  const bw = textW('BACK') + 20;
  if (hoverRow(n, VW / 2 - bw / 2, 199, bw, 13) && Input.mouseHit) return true;
  if (pressed(...K_BACK) || (pressed(...K_OK) && G.menuSel === n)) return true;
  const i = (pressed(...K_OK) && G.menuSel < n) ? G.menuSel : click >= 0 && Input.mouseHit ? click : -1;
  if (i >= 0) {
    const c = HUB[i];
    if (!c.open()) { Audio_.sfx('deny'); toast(c.lock); return false; }
    Audio_.sfx('confirm');
    openHubCard(c.id);
  }
  return false;
}
function drawHub() {
  drawTitleBg();
  dim(0.5);
  panel(22, 24, 340, 172);
  text('THE GARDEN', VW / 2, 31, 'Y', 1, 1);
  text(Save.name + (Save.title ? ' ' + Save.title : ''), VW / 2, 41, 'c', 1, 1);
  vaultBadge(354, 31);
  if (Save.seeds) { const s = String(Save.seeds); drawS(S('sparkle_0'), 34, 32); text(s, 40, 31, 'Y', 1); }
  const cells = hubCells();
  HUB.forEach((c, i) => {
    const [x, y, w, h] = cells[i], on = i === G.menuSel, open = c.open();
    rect(x, y, w, h, '0');
    rect(x + 1, y + 1, w - 2, h - 2, on ? '2' : '1');
    if (on) { rect(x - 1, y - 1, w + 2, 1, 'Y'); rect(x - 1, y + h, w + 2, 1, 'Y'); rect(x - 1, y, 1, h, 'Y'); rect(x + w, y, 1, h, 'Y'); }
    if (c.id === 'wardrobe') drawFeet(S(heroPre(Save.hero) + 'd' + HERO_WALK[Math.floor(G.time / 0.14) % 4] + SKIN[Save.skin]), x + w / 2, y + 24, open ? 0 : 4);
    else { const ic = S(c.icon()); drawS(ic, x + ((w - ic.w) >> 1), y + 5 + ((16 - ic.h) >> 1), open ? 0 : 4); }
    text(open ? c.name : '???', x + w / 2, y + 27, open ? (on ? 'Y' : 'w') : 'l', 1, 1);
    if (open) { const [t, col] = c.info(); if (t) text(t, x + w / 2, y + 38, col, 1, 1); }
    const b = HUB_BADGE[c.id];
    if (open && ((b && hasBadge(b)) || (c.id === 'mail' && unreadMail() > 0)) && Math.floor(G.time * 3) % 3) text('NEW', x + w - 3, y + 3, 'P', 1, 2);
  });
  const c = HUB[G.menuSel];
  if (c) text(c.open() ? c.tip : c.lock, VW / 2, 170, c.open() ? 'w' : 'l', 1, 1);
  else text(comeBackLine() || 'EVERY RUN FILLS THE VAULT', VW / 2, 170, 'c', 1, 1);
  const back = G.menuSel === HUB.length;
  text('BACK', VW / 2, 202, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 202);
}

// ---------- A reason to come back (title, Garden, end screen) ----------
function comeBackLine() {
  if (menuOpen('daily') && dailyReady()) return "TODAY'S STAR RUN IS WAITING";
  if (ripePlots()) return 'A STAR FLOWER IS READY TO PICK!';
  if (nextBloom() < Infinity) return 'YOUR STAR FLOWER BLOOMS IN ' + fmtLeft(nextBloom());
  const Q = Save.quests;
  if (Q && Q.list.some(q => !q.done)) return Q.list.filter(q => !q.done).length + ' QUESTS LEFT TODAY';
  if (Q && Q.list.every(q => q.done)) return 'NEW QUESTS IN ' + untilTomorrow();
  if (Save.cal && Save.stats.runs > 0 && Save.cal.last === dayKey()) return 'TOMORROW: DAILY GIFT ' + (Save.cal.step % 7 + 1) + '/7';
  return '';
}

// ---------- The wardrobe ----------
const WARD_ROWS = ['robe', 'trail', 'pet', 'title', 'back'];
function wardList(row) {
  if (row === 'trail') return [''].concat(Object.keys(TRAILS));
  if (row === 'pet') return [''].concat(Object.keys(PETS));
  if (row === 'title') return [''].concat(Object.keys(TITLES));
  return ROBES.map((r, i) => i);
}
const wardOwned = (row, v) => v === '' || (row === 'robe' ? v >= 8 || Save.unl.robes.includes(v) : row === 'trail' ? Save.unl.trails.includes(v) : row === 'pet' ? Save.unl.pets.includes(v) : Save.unl.titles.includes(v));
const wardCur = (row) => (row === 'robe' ? Save.skin : row === 'trail' ? Save.trail : row === 'pet' ? Save.pet : Save.title);
function wardSet(row, v) {
  if (row === 'robe') Save.skin = v; else if (row === 'trail') Save.trail = v; else if (row === 'pet') Save.pet = v; else Save.title = v;
  Save.write();
}
// The wardrobe browses everything; locked things show where they come from.
function updateWardrobe() {
  menuNav(WARD_ROWS.length);
  let click = -1;
  WARD_ROWS.forEach((r, i) => { if (hoverRow(i, VW / 2 - 120, 108 + i * 18 - 5, 240, 16)) click = i; });
  const row = WARD_ROWS[G.menuSel];
  if (pressed(...K_BACK) || (row === 'back' && (pressed(...K_OK) || (click === 4 && Input.mouseHit)))) {
    G.wardPeek = null; // a locked thing on show is only a look
    return true;
  }
  let dir = pressed(...K_RIGHT) ? 1 : pressed(...K_LEFT) ? -1 : 0;
  if (!dir && click >= 0 && click < 4 && Input.mouseHit) dir = Input.mx < VW / 2 ? -1 : 1;
  if (dir && row !== 'back') {
    const list = wardList(row), cur = G.wardPeek && G.wardPeek.row === row ? G.wardPeek.v : wardCur(row);
    const v = list[(list.indexOf(cur) + dir + list.length) % list.length];
    Audio_.sfx('select');
    if (wardOwned(row, v)) { G.wardPeek = null; wardSet(row, v); }
    else G.wardPeek = { row, v };
  }
  if (G.wardPeek && G.wardPeek.row !== row) G.wardPeek = null;
  return false;
}
function wardName(row, v) {
  if (v === '') return 'NONE';
  if (row === 'robe') return ROBES[v];
  if (row === 'trail') return TRAILS[v].name;
  if (row === 'pet') return PETS[v].name;
  return v;
}
function drawWardrobe() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 136, 24, 272, 172);
  text('WARDROBE', VW / 2, 31, 'Y', 1, 1);
  // the hero on show, walking in place with the pet and the trail
  const peek = G.wardPeek, show = (r) => (peek && peek.row === r ? peek.v : wardCur(r));
  const hx = VW / 2, hy = 88, skin = show('robe');
  const p = G.wardHero || (G.wardHero = { x: hx, y: hy, flip: false, moving: true, dashT: 0, dead: false, down: false });
  p.x = hx; p.y = hy; p.pet = show('pet'); p.trail = show('trail'); p.moving = true;
  shadow(hx, hy, 12);
  drawFeet(S(heroPre(Save.hero) + 's' + HERO_WALK[Math.floor(G.time / 0.14) % 4] + SKIN[skin]), hx, hy + 1);
  if (p.pet) { p.petX = hx - 18; p.petY = hy + 2; p.petMove = true; p.petFlip = false; drawPet(p, 0, 0); }
  if (p.trail && Math.floor(G.time * 30) % 2) {
    const T = TRAILS[p.trail];
    for (let k = 0; k < 6; k++) {
      const x = hx - 8 - k * 5 - ((G.time * 40) % 5), y = hy - 2 - ((k * 7) % 5), c = p.trail === 'rainbow' ? T.cols[k % T.cols.length] : T.cols[(k + Math.floor(G.time * 6)) % T.cols.length];
      rect(Math.round(x), Math.round(y), 1, 1, c);
    }
  }
  const title = show('title');
  text(Save.name + (title ? ' ' + title : ''), VW / 2, 96, TAG_COL[skin], 1, 1);
  WARD_ROWS.forEach((row, i) => {
    const y = 108 + i * 18, sel = i === G.menuSel;
    if (row === 'back') { text('BACK', VW / 2, y + 4, sel ? 'Y' : 'l', 1, 1); if (sel) pointer(VW / 2 - textW('BACK') / 2 - 10, y + 4); return; }
    const v = show(row), own = wardOwned(row, v), list = wardList(row), have = list.filter(x => wardOwned(row, x)).length - (row === 'robe' ? 0 : 1);
    text(row.toUpperCase(), VW / 2 - 118, y, sel ? 'Y' : 'l', 1);
    const name = own ? wardName(row, v) : wardName(row, v) + ' (LOCKED)';
    text(name, VW / 2 + 20, y, own ? (sel ? 'Y' : 'w') : 'l', 1, 1);
    const bob = sel ? Math.floor(G.time * 4) % 2 : 0;
    text('<', VW / 2 - 40 - bob, y, sel ? 'Y' : '3', 1); text('>', VW / 2 + 78 + bob, y, sel ? 'Y' : '3', 1);
    text(have + '/' + (list.length - (row === 'robe' ? 0 : 1)), VW / 2 + 118, y, 'c', 1, 2);
    if (sel && !own) text('FROM: ' + wardHow(row, v), VW / 2, y + 9, 'c', 1, 1);
  });
}
function wardHow(row, v) {
  if (row === 'trail') return TRAILS[v].how;
  if (row === 'pet') return PETS[v].how;
  if (row === 'title') return TITLES[v];
  const c = CONSTELLATIONS.find(k => k.rew.robe === v);
  return c ? c.name : 'SOMEWHERE';
}
