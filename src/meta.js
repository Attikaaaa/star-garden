'use strict';
// Between runs: stars, the Garden of permanent upgrades, and saving / resuming a run.

function earnStars(n) { G.run.stars += n; Save.stars += n; }
const upLevel = (id) => Save.up[id] || 0;

function applyUpgrades(p) {
  p.maxHp += 2 * upLevel('hp'); p.hp = p.maxHp;
  p.dmg *= 1 + 0.15 * upLevel('dmg');
  p.speed *= 1 + 0.06 * upLevel('speed');
  p.coins += 6 * upLevel('coins');
  p.luck += 0.5 * upLevel('luck');
  p.chargeMul = 1 + 0.25 * upLevel('charge');
}

// ---------- Garden screen ----------
const KERT_Y = 58, KERT_ROW = 20;
function updateKert() {
  const n = UPGRADES.length;
  menuNav(n + 1);
  let click = false;
  for (let i = 0; i <= n; i++) if (hoverRow(i, 40, i < n ? KERT_Y + i * KERT_ROW - 4 : 199, 304, i < n ? 19 : 13)) click = true;
  const i = G.menuSel;
  if (pressed(...K_BACK) || ((pressed(...K_OK) || click) && i === n)) return true;
  if ((pressed(...K_OK) || click) && i < n) {
    const u = UPGRADES[i], lv = upLevel(u.id);
    if (lv >= u.cost.length) { Audio_.sfx('deny'); return false; }
    if (Save.stars < u.cost[lv]) { Audio_.sfx('deny'); toast('NOT ENOUGH STARS'); return false; }
    Save.stars -= u.cost[lv]; Save.up[u.id] = lv + 1; Save.write();
    Audio_.sfx('item');
    G.kertPop = { i, t: 0.6 };
  }
  if (G.kertPop && (G.kertPop.t -= 1 / 60) <= 0) G.kertPop = null;
  return false;
}
function drawKert() {
  drawTitleBg();
  dim(0.5);
  panel(30, 30, 324, 166);
  text('THE GARDEN', VW / 2, 36, 'Y', 2, 1);
  drawS(S('shot_0'), 300, 36);
  text(String(Save.stars), 298, 37, 'Y', 2, 2);
  UPGRADES.forEach((u, i) => {
    const y = KERT_Y + i * KERT_ROW, sel = i === G.menuSel, lv = upLevel(u.id), max = lv >= u.cost.length;
    if (sel) rect(38, y - 5, 308, 19, '2');
    const pop = G.kertPop && G.kertPop.i === i && Math.floor(G.kertPop.t * 20) % 2;
    drawS(S(u.icon), 42, y - 4, pop ? 4 : 0);
    text(u.name, 64, y - 2, sel ? 'Y' : 'w', 1);
    text(u.desc, 64, y + 7, 'l', 0);
    for (let k = 0; k < u.cost.length; k++) rect(236 + k * 9, y - 1, 7, 7, '0'), rect(237 + k * 9, y, 5, 5, k < lv ? 'Y' : '1');
    if (max) text('MAX', 336, y + 1, 'h', 1, 2);
    else { drawS(S('shot_0'), 290, y); text(String(u.cost[lv]), 336, y + 1, Save.stars >= u.cost[lv] ? 'Y' : 'R', 1, 2); }
  });
  const back = G.menuSel === UPGRADES.length;
  text('BACK', VW / 2, 202, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 202);
}

// ---------- Run save / resume ----------
// Saved only while standing in a cleared room, so a resumed run never starts mid-fight.
const RUN_KEY = 'csk_run';
function hasRun() { try { return !!localStorage.getItem(RUN_KEY); } catch (e) { return false; } }
function clearRun() { try { localStorage.removeItem(RUN_KEY); } catch (e) { /* no storage */ } }
function saveRun() {
  const p = G.player, room = G.room;
  if (!p || p.dead || !room || !room.cleared || G.state === 'over') return;
  const rooms = G.floor.rooms;
  const player = {};
  for (const k in p) if (k !== 'orbitHit') player[k] = p[k];
  const data = {
    v: 1, depth: G.floor.depth, cur: rooms.indexOf(room), start: rooms.indexOf(G.floor.start),
    rooms: rooms.map(r => ({
      gx: r.gx, gy: r.gy, type: r.type, dist: r.dist, cleared: r.cleared, visited: r.visited, seen: r.seen,
      stocked: r.stocked, seed: r.seed, tiles: Array.from(r.tiles), slots: r.slots, pits: r.pits,
      pickups: r.pickups, props: r.props,
    })),
    player, stats: G.stats, run: G.run, won: G.won, bestBefore: G.bestBefore,
  };
  try { localStorage.setItem(RUN_KEY, JSON.stringify(data)); } catch (e) { /* no storage */ }
  Save.write();
}
function loadRun() {
  let d;
  try { d = JSON.parse(localStorage.getItem(RUN_KEY)); } catch (e) { d = null; }
  if (!d || d.v !== 1) { clearRun(); return false; }
  const rooms = d.rooms.map(r => Object.assign(newRoom(r.gx, r.gy), r, { tiles: Uint8Array.from(r.tiles), doors: {}, dirty: true, canvas: null }));
  const at = (x, y) => rooms.find(r => r.gx === x && r.gy === y);
  for (const r of rooms) for (const k in DIRS) { const o = at(r.gx + DIRS[k][0], r.gy + DIRS[k][1]); if (o) r.doors[k] = o; }
  const land = LANDS[d.depth % LANDS.length];
  G.floor = { depth: d.depth, land, theme: land.theme, rooms, start: rooms[d.start] };
  G.player = Object.assign(newPlayer(), d.player, { orbitHit: new Map(), inv: 1, dashT: 0, cool: 0, hurtT: 0 });
  G.stats = d.stats; G.run = d.run; G.won = d.won; G.bestBefore = d.bestBefore;
  resetRunFx();
  const room = rooms[d.cur];
  const px = G.player.x, py = G.player.y;
  enterRoom(room, null);
  G.player.x = px; G.player.y = py;
  G.floorBanner = { t: 2.4, text: THEMES[G.floor.theme].name, small: 'CONTINUE: LAND ' + (d.depth + 1) };
  setState('play');
  Audio_.play(land.song);
  return true;
}
