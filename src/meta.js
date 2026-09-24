'use strict';
// Between runs: the vault, the Garden (upgrades and wands), the pre-run screen, and saving
// / resuming a solo adventure.

// ---------- The vault: coins that stay forever ----------
const upLevel = (id) => Save.up[id] || 0;
// Share of every coin picked up that goes into the vault (PIGGY BANK raises it).
const keepPct = () => 0.1 + 0.1 * upLevel('bank');
function addVault(n) {
  if (n <= 0) return;
  G.run.vault += n; Save.vault += n;
  G.hud.vaultT = 0.6;
}
// Team bonuses (cleared rooms, bosses, waves): every hero in the game gets them.
function earnVault(n) {
  n = Math.max(1, Math.round(n * DIFF().vault));
  addVault(n);
  netFx('vault', n);
}
function keepCoins(n) {
  G.run.keep += n * keepPct() * DIFF().vault;
  const k = Math.floor(G.run.keep);
  if (k > 0) { G.run.keep -= k; addVault(k); }
}

// Garden upgrades for one hero. up: that player's levels (their own save in co-op).
function applyUpgrades(p, up) {
  const lv = (id) => (up && up[id]) || 0;
  p.maxHp += 2 * lv('hp'); p.hp = p.maxHp;
  p.dmg *= 1 + 0.12 * lv('dmg');
  p.fireDelay *= Math.pow(0.9, lv('rate'));
  p.shots += lv('multi');
  p.speed *= 1 + 0.06 * lv('speed');
  p.luck += 0.5 * lv('luck');
  p.chargeMul = 1 + 0.25 * lv('charge');
  p.beltMax = 2 + lv('belt');
  for (let i = 0; i < lv('belt'); i++) p.belt.push(i ? pick(['haste', 'power', 'guard']) : 'regen');
}

// ---------- Garden screen: UPGRADES and WANDS tabs ----------
const WAND_IDS = Object.keys(WANDS);
const GAR = { x: 32, y: 50, w: 104, h: 34, gap: 4, cols: 3 };
function gardenCells() {
  // upgrades: 3 columns; wands: 2 wider columns (their names are longer)
  const up = G.gTab === 0, n = up ? UPGRADES.length : WAND_IDS.length, cols = up ? 3 : 2;
  const w = up ? GAR.w : 158, x0 = VW / 2 - (cols * w + (cols - 1) * GAR.gap) / 2;
  const cells = [];
  for (let i = 0; i < n; i++) cells.push([x0 + (i % cols) * (w + GAR.gap), GAR.y + Math.floor(i / cols) * (GAR.h + GAR.gap), w, GAR.h]);
  return { cells, cols };
}
function updateKert() {
  const { cells, cols } = gardenCells(), n = cells.length;
  let s = G.menuSel;
  // tabs: left / right on the tab row, LB / RB or Q / E anywhere, or a click
  const tabs = [[VW / 2 - 90, 32, 86, 14], [VW / 2 + 4, 32, 86, 14]];
  let tab = pressed('PadLB') ? 0 : pressed('PadRB') ? 1 : pressed('Tab') ? 1 - G.gTab : -1;
  tabs.forEach((r, i) => { if (mouseOn() && Input.mouseHit && Input.mx >= r[0] && Input.mx < r[0] + r[2] && Input.my >= r[1] && Input.my < r[1] + r[3]) tab = i; });
  if (tab >= 0 && tab !== G.gTab) { G.gTab = tab; G.menuSel = 0; G.kertPop = null; Audio_.sfx('select'); return false; }
  if (s < n) {
    if (pressed(...K_RIGHT)) { if (s % cols < cols - 1 && s + 1 < n) s++; else if (G.gTab === 0) { G.gTab = 1; G.menuSel = 0; Audio_.sfx('select'); return false; } }
    if (pressed(...K_LEFT)) { if (s % cols > 0) s--; else if (G.gTab === 1) { G.gTab = 0; G.menuSel = 0; Audio_.sfx('select'); return false; } }
    if (pressed(...K_UP) && s >= cols) s -= cols;
  }
  if (pressed(...K_DOWN)) s = s + cols < n ? s + cols : s < n && Math.floor(s / cols) < Math.floor((n - 1) / cols) ? n - 1 : n;
  if (s === n && pressed(...K_UP)) s = n - 1;
  if (s !== G.menuSel) { G.menuSel = s; Audio_.sfx('select'); }
  let click = false;
  cells.forEach((c, i) => { if (hoverRow(i, c[0], c[1], c[2], c[3])) click = true; });
  const bw = textW('BACK') + 20;
  if (hoverRow(n, VW / 2 - bw / 2, 199, bw, 13) && Input.mouseHit) return true;
  const i = G.menuSel;
  if (pressed(...K_BACK) || (pressed(...K_OK) && i === n)) return true;
  if ((pressed(...K_OK) || click) && i < n) {
    if (G.gTab === 0) {
      const u = UPGRADES[i], lv = upLevel(u.id);
      if (lv >= u.cost.length) { Audio_.sfx('deny'); return false; }
      if (Save.vault < u.cost[lv]) { Audio_.sfx('deny'); toast('NOT ENOUGH VAULT COINS'); return false; }
      Save.vault -= u.cost[lv]; Save.up[u.id] = lv + 1;
    } else {
      const id = WAND_IDS[i];
      if (!Save.wands.includes(id)) {
        if (Save.vault < WANDS[id].cost) { Audio_.sfx('deny'); toast('NOT ENOUGH VAULT COINS'); return false; }
        Save.vault -= WANDS[id].cost; Save.wands.push(id);
      } else if (Save.wand === id) { Audio_.sfx('select'); return false; }
      Save.wand = id;
    }
    Save.write();
    Audio_.sfx('item'); haptic('item');
    G.kertPop = { i, t: 0.6 };
  }
  if (G.kertPop && (G.kertPop.t -= 1 / 60) <= 0) G.kertPop = null;
  return false;
}
function vaultBadge(x, y) {
  const s = String(Save.vault);
  drawS(S('coin_0'), x - textW(s) - 11, y - 1);
  text(s, x, y, 'Y', 2, 2);
}
function drawKert() {
  drawTitleBg();
  dim(0.5);
  panel(22, 26, 340, 170);
  ['UPGRADES', 'WANDS'].forEach((t, i) => {
    const x = VW / 2 + (i ? 47 : -47), on = G.gTab === i;
    text(t, x, 35, on ? 'Y' : '3', 1, 1);
    if (on) rect(x - textW(t) / 2 - 2, 45, textW(t) + 4, 1, 'Y');
  });
  if (Input.lastAim === 'pad') { text('LB', VW / 2 - 100, 35, 'l', 0, 1); text('RB', VW / 2 + 100, 35, 'l', 0, 1); }
  vaultBadge(354, 34);
  const { cells } = gardenCells(), sel = G.menuSel;
  cells.forEach(([x, y, w, h], i) => {
    const on = i === sel, pop = G.kertPop && G.kertPop.i === i && Math.floor(G.kertPop.t * 20) % 2;
    rect(x, y, w, h, '0');
    rect(x + 1, y + 1, w - 2, h - 2, on ? '2' : '1');
    if (on) { rect(x - 1, y - 1, w + 2, 1, 'Y'); rect(x - 1, y + h, w + 2, 1, 'Y'); rect(x - 1, y, 1, h, 'Y'); rect(x + w, y, 1, h, 'Y'); }
    if (G.gTab === 0) {
      const u = UPGRADES[i], lv = upLevel(u.id), max = lv >= u.cost.length, ic = S(u.icon);
      drawS(ic, x + 4 + ((16 - ic.w) >> 1), y + 4 + ((16 - ic.h) >> 1), pop ? 4 : 0);
      text(u.name, x + 24, y + 6, on ? 'Y' : 'w', 1);
      for (let k = 0; k < u.cost.length; k++) { rect(x + 5 + k * 8, y + 24, 7, 6, '0'); rect(x + 6 + k * 8, y + 25, 5, 4, k < lv ? 'Y' : '1'); }
      if (max) text('MAX', x + w - 5, y + 23, 'h', 1, 2);
      else { const c = String(u.cost[lv]); drawS(S('coin_0'), x + w - 16 - textW(c), y + 22); text(c, x + w - 5, y + 23, Save.vault >= u.cost[lv] ? 'Y' : 'R', 1, 2); }
    } else {
      const id = WAND_IDS[i], wd = WANDS[id], own = Save.wands.includes(id);
      drawS(S('wand_' + id), x + 6, y + 9, pop ? 4 : own ? 0 : 4);
      text(wd.name, x + 28, y + 7, on ? 'Y' : own ? 'w' : 'l', 1);
      if (Save.wand === id) text('EQUIPPED', x + 28, y + 20, 'h', 1);
      else if (own) text('OWNED', x + 28, y + 20, 'c', 1);
      else { const c = String(wd.cost); drawS(S('coin_0'), x + 28, y + 19); text(c, x + 39, y + 20, Save.vault >= wd.cost ? 'Y' : 'R', 1); }
    }
  });
  // footer: what the selected card does
  panel(22, 168, 340, 28);
  if (sel < cells.length) {
    let title, sub;
    if (G.gTab === 0) {
      const u = UPGRADES[sel], lv = upLevel(u.id);
      title = u.name + '   LEVEL ' + lv + '/' + u.cost.length;
      sub = u.id === 'bank' ? 'KEEP ' + Math.round(keepPct() * 100) + '% OF ALL COINS FOREVER' + (lv < 3 ? ' (NEXT: ' + Math.round(keepPct() * 100 + 10) + '%)' : '') : u.desc;
    } else {
      const id = WAND_IDS[sel], wd = WANDS[id], own = Save.wands.includes(id);
      title = wd.name; sub = wd.desc + (own ? Save.wand === id ? '' : '  -  PICK TO EQUIP' : '  -  UNLOCK FOREVER');
    }
    text(title, VW / 2, 173, 'Y', 1, 1);
    text(sub, VW / 2, 184, 'w', 1, 1);
  } else text('EARN VAULT COINS IN EVERY RUN, SPEND THEM HERE', VW / 2, 179, 'l', 1, 1);
  const back = sel === cells.length;
  text('BACK', VW / 2, 202, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 202);
}

// ---------- Before a run: pick a wand and the difficulty ----------
const PREP_ROWS = ['wand', 'robe', 'diff', 'start', 'back'], PREP_Y = [66, 110, 144, 172, 186];
function cycle(list, cur, dir) { return list[(list.indexOf(cur) + dir + list.length) % list.length]; }
function prepAdjust(row, dir) {
  if (row === 'wand') { const owned = WAND_IDS.filter(id => Save.wands.includes(id)); if (owned.length > 1) { Save.wand = cycle(owned, Save.wand, dir); Audio_.sfx('select'); } }
  else if (row === 'robe') { Save.skin = (Save.skin + dir + ROBES.length) % ROBES.length; Audio_.sfx('select'); }
  else if (row === 'diff') { Save.settings.diff = (Save.settings.diff + dir + DIFFS.length) % DIFFS.length; Audio_.sfx('select'); }
}
function updatePrep() {
  menuNav(PREP_ROWS.length);
  let click = -1;
  PREP_ROWS.forEach((r, i) => { if (hoverRow(i, VW / 2 - 130, PREP_Y[i] - (i < 3 ? 18 : 5), 260, i < 3 ? 34 : 13)) click = i; });
  const row = PREP_ROWS[G.menuSel];
  const dir = pressed(...K_RIGHT) ? 1 : pressed(...K_LEFT) ? -1 : 0;
  if (dir) prepAdjust(row, dir);
  if (click >= 0 && click < 3 && Input.mouseHit) prepAdjust(row, Input.mx < VW / 2 ? -1 : 1);
  if (pressed(...K_BACK) || ((pressed(...K_OK) || (click === 4 && Input.mouseHit)) && row === 'back')) { Save.write(); return 'back'; }
  if ((pressed(...K_OK) && row !== 'back') || (click === 3 && Input.mouseHit)) { G.diff = Save.settings.diff; Save.write(); return 'start'; }
  return null;
}
// One "< value >" row with a label and a line of description (also used by the lobby).
function pickRow(y, label, value, desc, sel, icon, ly) {
  text(label, VW / 2, y - (ly || 14), sel ? 'Y' : 'l', 1, 1);
  const w = textW(value) + (icon ? 20 : 0);
  if (icon) drawFeet(S(icon), VW / 2 - w / 2 + 8, y + 10);
  text(value, VW / 2 + (icon ? 10 : 0), y, sel ? 'Y' : 'w', 2, 1);
  const bob = sel ? Math.floor(G.time * 4) % 2 : 0;
  text('<', VW / 2 - w / 2 - 12 - bob, y, sel ? 'Y' : '3', 2);
  text('>', VW / 2 + w / 2 + 7 + bob, y, sel ? 'Y' : '3', 2);
  if (desc) text(desc, VW / 2, y + 12, 'c', 1, 1);
}
function drawPrep() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 136, 30, 272, 168);
  text(G.prep.mode === 'arena' ? 'THE ARENA' : 'ADVENTURE', VW / 2, 37, 'Y', 2, 1);
  const sel = PREP_ROWS[G.menuSel], w = WANDS[Save.wand], d = DIFFS[Save.settings.diff];
  pickRow(PREP_Y[0], 'WAND', w.name, w.desc, sel === 'wand', 'wand_' + Save.wand);
  pickRow(PREP_Y[1], 'ROBE', ROBES[Save.skin], null, sel === 'robe', 'hero_d0' + SKIN[Save.skin], 19);
  pickRow(PREP_Y[2], 'DIFFICULTY', d.name, d.desc + (d.vault !== 1 ? '  VAULT X' + d.vault : ''), sel === 'diff');
  drawMenu(['START!', 'BACK'], PREP_Y[3], PREP_Y[4] - PREP_Y[3], G.menuSel - 3);
  if (Save.wands.length < 2 && sel === 'wand') text('UNLOCK MORE WANDS IN THE GARDEN', VW / 2, 204, 'c', 2, 1);
}

// ---------- Run save / resume (solo adventure) ----------
// Saved only while standing in a cleared room, so a resumed run never starts mid-fight.
const RUN_KEY = 'csk_run';
function hasRun() { try { return !!localStorage.getItem(RUN_KEY); } catch (e) { return false; } }
function clearRun() { try { localStorage.removeItem(RUN_KEY); } catch (e) { /* no storage */ } }
function saveRun() {
  const p = G.player, room = G.room;
  if (NET.role || G.mode !== 'adv' || !p || p.dead || !room || !room.cleared || G.state === 'over') return;
  const rooms = G.floor.rooms;
  const player = {};
  for (const k in p) if (k !== 'orbitHit' && k !== 'in') player[k] = p[k];
  const data = {
    v: 2, depth: G.floor.depth, cur: rooms.indexOf(room), start: rooms.indexOf(G.floor.start),
    rooms: rooms.map(r => ({
      gx: r.gx, gy: r.gy, type: r.type, dist: r.dist, cleared: r.cleared, visited: r.visited, seen: r.seen,
      stocked: r.stocked, seed: r.seed, tiles: Array.from(r.tiles), slots: r.slots, pits: r.pits,
      pickups: r.pickups, props: r.props,
    })),
    player, stats: G.stats, run: G.run, won: G.won, bestBefore: G.bestBefore, coins: G.coins, diff: G.diff,
  };
  try { localStorage.setItem(RUN_KEY, JSON.stringify(data)); } catch (e) { /* no storage */ }
  Save.write();
}
function loadRun() {
  let d;
  try { d = JSON.parse(localStorage.getItem(RUN_KEY)); } catch (e) { d = null; }
  if (!d || (d.v !== 1 && d.v !== 2)) { clearRun(); return false; }
  const rooms = d.rooms.map(r => Object.assign(newRoom(r.gx, r.gy), r, { tiles: Uint8Array.from(r.tiles), doors: {}, dirty: true, canvas: null }));
  const at = (x, y) => rooms.find(r => r.gx === x && r.gy === y);
  for (const r of rooms) for (const k in DIRS) { const o = at(r.gx + DIRS[k][0], r.gy + DIRS[k][1]); if (o) r.doors[k] = o; }
  const land = LANDS[d.depth % LANDS.length];
  G.mode = 'adv'; G.arena = null;
  G.diff = d.diff !== undefined ? d.diff : 1;
  G.floor = { depth: d.depth, land, theme: land.theme, rooms, start: rooms[d.start] };
  const p = Object.assign(newPlayer(0), d.player, { orbitHit: new Map(), in: newInput(), inv: 1, dashT: 0, cool: 0, hurtT: 0, remote: false, down: false });
  G.players = [p]; G.player = p;
  G.coins = d.coins !== undefined ? d.coins : d.player.coins || 0;
  G.stats = d.stats; G.won = d.won; G.bestBefore = d.bestBefore;
  G.run = d.run && d.run.vault !== undefined ? d.run : { vault: 0, keep: 0 };
  resetRunFx();
  const room = rooms[d.cur];
  const px = p.x, py = p.y;
  enterRoom(room, null);
  p.x = px; p.y = py;
  G.floorBanner = { t: 2.4, text: THEMES[G.floor.theme].name, small: 'CONTINUE: LAND ' + (d.depth + 1) };
  setState('play');
  Audio_.play(land.song);
  return true;
}
