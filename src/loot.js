'use strict';
// What runs hand out: door rewards (every normal room shows on its doors what clearing it
// pays), skull rooms (harder, richer), star scrolls (new magic items, learned in the
// Garden's library), the item pool with rarity and unlocks, and the wand milestones.

// ---------- Door rewards and skull rooms ----------
const DOOR_REWARDS = [['coin', 4], ['gem', 2], ['heart', 2], ['potion', 2], ['scroll', 2]];
// Called while a floor is generated (seeded): every normal room gets its reward, one far
// room becomes a skull room.
function assignRewards(list) {
  const normals = list.filter(r => r.type === 'normal');
  for (const r of normals) r.reward = r.keyRoom ? 'key' : pickWeighted(DOOR_REWARDS);
  const far = gshuffle(normals.filter(r => r.dist >= 2 && !r.keyRoom));
  for (let i = 0; i < (modOn('t_skull') ? 3 : 1) && i < far.length; i++) far[i].skull = true;
}
function payReward(room, x, y) {
  const n = room.skull ? 2 : 1;
  for (let k = 0; k < n; k++) {
    switch (room.reward) {
      case 'coin': for (let i = 0; i < 5; i++) spawnPickup('coin', x + grnd(-6, 6), y); break;
      case 'gem': spawnPickup('gem', x, y); spawnPickup('gem', x, y); break;
      case 'heart': spawnPickup('heart', x, y); break;
      case 'potion': spawnPotion(x, y); break;
      case 'scroll': if (scrollsLeft() > 0 && k === 0) spawnPickup('scroll', x, y); else { spawnPickup('gem', x, y); spawnPickup('gem', x, y); } break;
      case 'key': if (k === 0) spawnPickup('key', x, y); else spawnPickup('gem', x, y); break;
    }
  }
  if (room.skull) { earnVault(4); const [cx, cy] = reachSpot(room, x + 20 > 340 ? x - 20 : x + 20, y); room.props.push({ kind: 'chest', x: cx, y: cy, t: 0, open: false }); }
}
const MM_REWARD = { coin: 'mm_coin', gem: 'mm_gem', heart: 'mm_heart', potion: 'mm_pot', scroll: 'mm_scroll', key: 'mm_key' };
// The marks on a door to an uncleared normal room (skull rooms alternate skull and reward).
function doorMark(o) {
  if (!o || o.type !== 'normal' || o.cleared || !o.reward) return null;
  return o.skull && Math.floor(G.time * 1.5) % 2 ? 'mm_skull' : MM_REWARD[o.reward];
}

// ---------- Star scrolls ----------
// Items the player has not unlocked and has no scroll for yet.
function lockedItems() { return Object.keys(ITEMS).filter(id => !Save.unl.items.includes(id) && !Save.scrolls.includes(id)); }
const scrollsLeft = () => lockedItems().length;
const LEARN_COST = [20, 40, 70];
const learnCost = (id) => LEARN_COST[ITEMS[id].rare || 0];
// A hero picked up a scroll (on their own device): which item it teaches is theirs.
onNote((ev) => {
  if (ev !== 'scroll') return;
  const ids = lockedItems();
  if (!ids.length) { Save.vault += 8; toast('A STAR SCROLL: +8 VAULT'); Save.write(); return; }
  // rarer items turn up on scrolls less often
  const w = ids.map(id => RARE_W[ITEMS[id].rare || 0]), tot = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot, i = 0;
  while (r >= w[i]) r -= w[i++];
  const id = ids[Math.min(i, ids.length - 1)];
  Save.scrolls.push(id);
  addBadge('menu:library');
  logNews('scroll', 'STAR SCROLL: ' + ITEMS[id].name, 'icon_' + id);
  G.bannerNext = { title: 'A STAR SCROLL!', sub: 'LEARN ' + ITEMS[id].name + ' IN THE GARDEN', t: 2.4, icon: null };
  checkMenus();
  Save.write();
});
// Where scrolls come from besides scroll doors.
function maybeScroll(x, y, chance) { if (scrollsLeft() > 0 && grand() < chance) spawnPickup('scroll', x, y); }
function learnScroll(id) {
  const cost = learnCost(id), i = Save.scrolls.indexOf(id);
  if (i < 0 || Save.vault < cost) return false;
  Save.vault -= cost;
  Save.scrolls.splice(i, 1);
  Save.unl.items.push(id);
  note('learn', id, cost);
  Save.write();
  return true;
}

// ---------- The item pool ----------
// Offered items: unlocked ones (all of them in daily runs, for fairness), rarer ones less
// often, unique ones only once.
function itemPool(n) {
  const owned = new Set([].concat(...G.players.map(p => p.items)));
  const unl = G.daily ? null : new Set(Save.unl.items);
  const pool = Object.keys(ITEMS).filter(k => !(ITEMS[k].unique && owned.has(k)) && (!unl || unl.has(k)));
  const out = [];
  while (out.length < n && pool.length) {
    const w = pool.map(k => RARE_W[ITEMS[k].rare || 0]), tot = w.reduce((a, b) => a + b, 0);
    let r = grand() * tot, i = 0;
    while (i < pool.length - 1 && r >= w[i]) r -= w[i++];
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

// ---------- Wand milestones ----------
// A wand can be bought once its milestone is reached (players who had wands keep them).
const WAND_REQ = {
  scatter: { need: () => cnt('land') >= 2 || Save.stats.bestDepth >= 2, text: 'REACH SUNNY SHORE' },
  bubble: { need: () => cnt('k') >= 150, text: 'DEFEAT 150 FOES' },
  boomer: { need: () => cnt('b:king') > 0, text: 'DEFEAT THE SLIME KING' },
  chain: { need: () => cnt('land') >= 3 || Save.stats.bestDepth >= 3, text: 'REACH CRYSTAL CAVE' },
  comet: { need: () => Save.stats.wins > 0, text: 'WIN A RUN' },
};
function wandReady(id) { return !WAND_REQ[id] || Save.wands.includes(id) || !!Save.flags.legacy || WAND_REQ[id].need(); }

// ---------- The library (a Garden card): learn star scrolls ----------
function updateLibrary() {
  const n = Save.scrolls.length;
  menuNav(n + 1);
  // seven rows show at a time; the list scrolls with the selection
  const top = G.libTop = Math.max(0, Math.min(G.libTop || 0, G.menuSel, n - 7), G.menuSel < n ? G.menuSel - 6 : 0);
  let click = -1;
  for (let i = top; i < Math.min(n, top + 7); i++) if (hoverRow(i, VW / 2 - 130, 52 + (i - top) * 16 - 2, 260, 15)) click = i;
  const bw = textW('BACK') + 20;
  if (hoverRow(n, VW / 2 - bw / 2, 199, bw, 13) && Input.mouseHit) return true;
  if (pressed(...K_BACK) || (pressed(...K_OK) && G.menuSel === n)) return true;
  const i = pressed(...K_OK) && G.menuSel < n ? G.menuSel : click >= 0 && Input.mouseHit ? click : -1;
  if (i >= 0) {
    const id = Save.scrolls[i];
    if (Save.vault < learnCost(id)) { Audio_.sfx('deny'); toast('NOT ENOUGH VAULT COINS'); return false; }
    learnScroll(id);
    Audio_.sfx('item'); haptic('item');
    G.banner = { title: 'LEARNED: ' + ITEMS[id].name, sub: 'IT CAN TURN UP IN YOUR RUNS NOW', t: 2.4, icon: id };
    G.menuSel = Math.min(G.menuSel, Save.scrolls.length);
  }
  if (G.banner && (G.banner.t -= 1 / 60) <= 0) G.banner = null;
  return false;
}
function drawLibrary() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 144, 24, 288, 172);
  text('LIBRARY', VW / 2, 31, 'Y', 1, 1);
  vaultBadge(VW / 2 + 136, 31);
  const S_ = Save.scrolls;
  if (!S_.length) {
    text('NO STAR SCROLLS TO LEARN', VW / 2, 80, 'w', 1, 1);
    text('SCROLLS DROP FROM SCROLL DOORS, BOSSES,', VW / 2, 100, 'l', 1, 1);
    text('ELITES, CHESTS AND CHALLENGE ROOMS', VW / 2, 110, 'l', 1, 1);
  }
  const top = G.libTop || 0;
  S_.slice(top, top + 7).forEach((id, k) => {
    const i = top + k, y = 52 + k * 16, sel = i === G.menuSel, it = ITEMS[id], c = learnCost(id);
    if (sel) rect(VW / 2 - 132, y - 3, 264, 16, '2');
    drawS(S('scroll_' + (sel ? Math.floor(G.time * 3) % 2 : 0)), VW / 2 - 126, y - 2);
    drawS(S('icon_' + id), VW / 2 - 110, y - 3);
    text(it.name, VW / 2 - 88, y + 1, sel ? 'Y' : 'w', 1);
    text(RARE_NAME[it.rare || 0], VW / 2 + 40, y + 1, it.rare === 2 ? 'P' : it.rare ? 'c' : 'l', 1, 1);
    drawS(S('coin_0'), VW / 2 + 104 - textW(String(c)), y);
    text(String(c), VW / 2 + 126, y + 1, Save.vault >= c ? 'Y' : 'R', 1, 2);
  });
  const it = ITEMS[S_[G.menuSel]];
  text(it ? it.desc : 'LEARNED ITEMS CAN TURN UP IN YOUR RUNS', VW / 2, 180, it ? 'w' : 'l', 1, 1);
  text(Save.unl.items.length + ' / ' + Object.keys(ITEMS).length + ' ITEMS KNOWN', VW / 2, 168, 'c', 1, 1);
  const back = G.menuSel === S_.length;
  text('BACK', VW / 2, 202, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 202);
  if (G.banner) drawBanner();
}
