'use strict';
// The Star Road's forks: after a boss, where the next land is a fork land, the team picks
// the way from cards. Each card carries a small boon for the land it leads to.

// What each depth of the default road is: its act and whether it is a fork slot
// (built the same way as roadPath, so the two always line up).
function roadSlots() {
  const out = [];
  ROAD.forEach((a, i) => {
    if (landLive(a.fixed)) out.push({ act: i, fork: false });
    for (const id of a.fork.filter(landLive).slice(0, a.pick)) out.push({ act: i, fork: true });
    if (a.finale && landLive(a.finale)) out.push({ act: i, fork: false });
  });
  return out;
}
// Forks open after the first win (the first road stays curated); daily, weekly, quick runs and the Boss Fight keep their road.
const forksOpen = () => G.mode === 'adv' && Save.stats.wins > 0 && !G.daily && !G.run.quick && !G.run.bow && !G.run.duel;
// The lands to choose from for the next depth, or null when the road does not fork there.
function forkChoices() {
  if (!forksOpen()) return null;
  const path = runPath(), d = G.floor.depth + 1, slots = roadSlots();
  if (d >= path.length || slots.length !== path.length || !slots[d].fork) return null;
  const a = ROAD[slots[d].act];
  const left = a.fork.filter(id => landLive(id) && !path.slice(0, d).includes(id));
  if (left.length < 2) return null;
  // fork slots of this act still ahead: when they cover every land left, the rest comes next
  const ahead = slots.filter((s, j) => j >= d && s.fork && s.act === slots[d].act).length;
  return { d, act: slots[d].act, left, more: ahead >= left.length };
}

// One boon per card, dealt from the run's seed so a replayed seed deals the same ones.
const FORK_BOONS = {
  chest: { icon: 'chest_0', label: 'TREASURE ROOM', arrive: 'A TREASURE ROOM WAITS HERE' },
  gold: { icon: 'coin_0', label: 'DOUBLE COINS', arrive: 'DOUBLE COINS IN THIS LAND' },
  heal: { icon: 'heart', label: 'FULL HEARTS', arrive: 'HEARTS FILLED UP!' },
  vault: { icon: 'stardrop', label: 'VAULT +20', arrive: 'VAULT +20' },
};
// The run's boon, when it belongs to this depth.
const boonAt = (k, depth) => { const b = G.run && G.run.boon; return !!b && b.k === k && b.d === depth; };
const boonOn = (k) => !!G.floor && boonAt(k, G.floor.depth);
// On arrival in the chosen land (host / solo only; loadFloor runs there).
function arriveBoon(depth) {
  const b = G.run.boon;
  if (!b || b.d !== depth || b.done) return;
  b.done = true;
  if (b.k === 'heal') for (const p of G.players) if (alive(p)) p.hp = p.maxHp;
  if (b.k === 'vault') earnVault(20);
  toast(FORK_BOONS[b.k].arrive);
}

function openFork(f) {
  const boons = withSeed(hashSeed(G.run.seed, 'fork', f.d), () => gshuffle(Object.keys(FORK_BOONS)));
  G.warp = null;
  G.fork = { opts: f.left.map((id, i) => ({ id, boon: boons[i % boons.length] })), sel: 0, act: f.act, more: f.more, t: 0 };
  setState('fork');
  Audio_.sfx('quest');
  if (NET.role === 'host') netState('fork');
}
function chooseFork() {
  const F = G.fork, o = F.opts[F.sel], d = G.floor.depth + 1, path = G.run.path, slots = roadSlots();
  const order = [o.id].concat(F.opts.map(q => q.id).filter(id => id !== o.id));
  slots.forEach((s, j) => { if (j >= d && s.fork && s.act === F.act && order.length) path[j] = order.shift(); });
  G.run.boon = { d, k: o.boon };
  Audio_.sfx('confirm');
  G.nextLock = true;
  wipe(() => { G.nextLock = false; setState('play'); loadFloor(d); });
  if (NET.role === 'host') netState('play');
}

const FORK_W = 112, FORK_H = 146, FORK_Y = 36;
const forkX = (i, n) => Math.round(VW / 2 + (i - n / 2) * (FORK_W + 12) + 6);
function updateFork(dt) {
  const F = G.fork;
  F.t += dt;
  // a client watches the host choose; the first moment ignores the key that entered the portal
  if (NET.role === 'client' || F.t < 0.35 || Wipe.t >= 0) return;
  const n = F.opts.length, was = F.sel;
  if (pressed(...K_LEFT)) { F.sel = (F.sel + n - 1) % n; Audio_.sfx('select'); }
  if (pressed(...K_RIGHT)) { F.sel = (F.sel + 1) % n; Audio_.sfx('select'); }
  let go = pressed(...K_OK);
  G.menuSel = F.sel;
  F.opts.forEach((o, i) => { if (hoverRow(i, forkX(i, n), FORK_Y - 3, FORK_W, FORK_H + 3)) go = true; });
  F.sel = G.menuSel;
  if (was !== F.sel && NET.role === 'host') netState('fork');
  if (go) chooseFork();
}

// A little window into the land: its wall, floor, a rock and one of its slimes.
function drawForkView(land, x, y, w, h, t) {
  const th = land.theme;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let ty = 0; ty < 3; ty++) for (let tx = 0; tx < 7; tx++) {
    const k = hash(tx, ty, th.length) % 100;
    drawS(S((k < 60 ? 'floor_0' : k < 80 ? 'floor_1' : k < 90 ? 'floor_3' : 'floor_2') + '@' + th), x + tx * 16, y + 16 + ty * 16);
  }
  for (let tx = 0; tx < 7; tx++) {
    drawS(S('cap@' + th), x + tx * 16, y - 12);
    drawS(S('face_' + (tx === 2 ? 1 : 0) + '@' + th), x + tx * 16, y + 4);
  }
  rect(x, y + 20, w, 2, SHADOW);
  drawS(S('rock_' + th), x + w - 26, y + h - 22);
  const sx = x + 38, sy = y + h - 6, hop = Math.floor(t * 2.5) % 3;
  shadow(sx, sy, 12);
  drawFeet(S('slime_' + land.slime + '_' + (hop === 2 ? 'squash' : 'idle')), sx, sy);
  ctx.restore();
  rect(x - 1, y - 1, w + 2, 1, '0'); rect(x - 1, y + h, w + 2, 1, '0');
  rect(x - 1, y, 1, h, '0'); rect(x + w, y, 1, h, '0');
}
function drawFork() {
  const F = G.fork;
  if (!F) return;
  dim(0.6);
  const n = F.opts.length, rise = Math.max(0, 1 - F.t * 4);
  text('THE ROAD FORKS', VW / 2, 12, 'Y', 2, 1);
  text('CHOOSE THE NEXT LAND', VW / 2, 24, 'w', 0, 1);
  F.opts.forEach((o, i) => {
    const land = LAND[o.id], sel = i === F.sel, B = FORK_BOONS[o.boon];
    const x = forkX(i, n), y = FORK_Y + Math.round(rise * rise * 40) - (sel ? 2 : 0);
    if (sel) { rect(x, y - 1, FORK_W, FORK_H + 2, 'Y'); rect(x - 1, y, FORK_W + 2, FORK_H, 'Y'); }
    panel(x, y, FORK_W, FORK_H);
    drawForkView(land, x + 6, y + 6, FORK_W - 12, 46, G.time + i * 0.4);
    const cx = x + FORK_W / 2;
    text(THEMES[land.theme].name, cx, y + 62, 'Y', 1, 1);
    text(land.rule, cx, y + 75, 'c', 0, 1);
    wrapText(land.hint, FORK_W - 12).slice(0, 2).forEach((l, k) => text(l, cx, y + 86 + k * 9, 'w', 0, 1));
    const dw = textW('DANGER') + 4 + 3 * 7 - 2, dx = Math.round(cx - dw / 2);
    text('DANGER', dx, y + 108, 'w', 0);
    for (let k = 0; k < 3; k++) {
      const px = dx + textW('DANGER') + 4 + k * 7;
      rect(px, y + 107, 5, 5, '0');
      rect(px + 1, y + 108, 3, 3, k < land.danger ? 'R' : '2');
    }
    rect(x + 6, y + 118, FORK_W - 12, 1, '2');
    const ic = S(B.icon), bw = ic.w + 3 + textW(B.label), bx = Math.round(cx - bw / 2);
    drawS(ic, bx, y + 134 - Math.round(ic.h / 2));
    text(B.label, bx + ic.w + 3, y + 132, 'l', 1);
    if (!sel) rect(x, y, FORK_W, FORK_H, 'rgba(43,26,71,0.35)');
    else if (NET.role !== 'client') pointer(x - 9, y + FORK_H / 2);
  });
  const foot = NET.role === 'client' ? 'THE HOST PICKS THE ROAD' : F.more ? 'THE OTHER WAY COMES NEXT' : 'THE OTHER WAYS WAIT FOR ANOTHER RUN';
  text(foot, VW / 2, FORK_Y + FORK_H + 12, NET.role === 'client' ? 'c' : 'w', 0, 1);
}

// ---------- Run length (the pre-run screen) ----------
// A run can walk part of the road: G.run.span is its first and last depth. Quick: one land;
// an act: that act's lands; the full road: no span. A later start brings a starter kit.
const ACT_NUM = ['I', 'II', 'III'];
const actName = (i) => 'ACT ' + ACT_NUM[i] + ': ' + ROAD[i].act;
const reachedDepth = () => Math.max(1, cnt('land'));
// Where a land sits on the default road (a fork land takes its act's first fork slot).
function landDepth(id) {
  const i = roadPath().indexOf(id);
  if (i >= 0) return i;
  const a = ROAD.findIndex(r => r.fork.includes(id));
  return roadSlots().findIndex(s => s.act === a && s.fork);
}
// Lands a quick run can pick: every built land of the road whose place was reached.
const quickIds = () => [].concat(...ROAD.map(a => [a.fixed].concat(a.fork, a.finale || []))).filter(id => landLive(id) && landDepth(id) >= 0 && landDepth(id) < reachedDepth());
const actSpan = (i) => { const s = roadSlots(), d = s.map((q, j) => (q.act === i ? j : -1)).filter(j => j >= 0); return [d[0], d[d.length - 1]]; };
// The choices, in order: the full road, each reached act (once there are two), a surprise land, each land.
function runLens() {
  const out = ['full'], acts = [...new Set(roadSlots().map(s => s.act))];
  if (acts.length > 1) for (const i of acts) if (actSpan(i)[0] < reachedDepth()) out.push('act' + i);
  out.push('quick');
  for (const id of quickIds()) out.push('quick:' + id);
  return out;
}
const runLen = () => { const l = runLens(), v = Save.settings.runLen; return l.includes(v) ? v : 'full'; };
function lenValue(len) {
  const n = roadPath().length;
  if (len === 'full') return ['FULL ROAD', n + ' LANDS AND ' + n + ' BOSSES, ABOUT ' + n * 5 + ' MINUTES' + (roadActs() > 1 ? '. VAULT X' + roadActs() : '')];
  if (len.startsWith('act')) { const i = +len.slice(3), [a, b] = actSpan(i); return [actName(i), (b - a + 1) + ' LANDS, ABOUT ' + (b - a + 1) * 5 + ' MINUTES' + (a ? '. A STARTER KIT' : '')]; }
  const desc = 'ONE LAND, ONE BOSS, ABOUT 5 MINUTES. VAULT X0.4';
  return [len === 'quick' ? 'QUICK: ANY LAND' : 'QUICK: ' + THEMES[LAND[len.slice(6)].theme].name, desc];
}
const roadActs = () => new Set(roadSlots().map(s => s.act)).size;
// startRun options for a length.
function lenOpts(len) {
  if (len.startsWith('quick')) {
    const ids = quickIds(), id = len === 'quick' ? ids[Math.floor(Math.random() * ids.length)] : len.slice(6);
    const path = roadPath(), d = landDepth(id);
    path[d] = id;
    return { quick: true, path, depth: d, span: [d, d] };
  }
  if (len.startsWith('act')) { const span = actSpan(+len.slice(3)); return { depth: span[0], span }; }
  return {};
}
// Vault pay for the length and the Star Trial: a quick run x0.4, the road x1 for each act it walks.
function applyRunX() {
  const r = G.run, s = r.span, slots = roadSlots();
  let x = r.quick && !r.bow ? 0.4 : slots.length === r.path.length ? new Set(slots.filter((q, j) => !s || (j >= s[0] && j <= s[1])).map(q => q.act)).size : 1;
  x *= 1 + 0.05 * (G.trial || 0);
  if (x === 1) return;
  G.diffX = G.diffX || Object.assign({}, DIFFS[G.diff]);
  G.diffX.vault *= x;
}
// A run that starts further down the road: an item and a heart for each land skipped (three at most).
function starterKit(depth) {
  const n = Math.min(3, depth);
  if (!n) return;
  withSeed(hashSeed(G.run.seed, 'kit'), () => {
    for (const p of G.players) {
      for (const id of gshuffle(START_ITEMS.slice()).slice(0, n)) giveItemQuiet(id, p);
      p.maxHp += 2 * n; p.hp = p.maxHp;
    }
  });
}
// The end of a span: a quick run's land, or the act's last land.
const spanDone = () => !!G.run.span && G.floor.depth >= G.run.span[1];

// ---------- The campfire between acts ----------
// When an act's last boss falls, the frog waits in the boss room by a campfire: rest (the
// team heals, a solo run is saved), a small shop, and a letter read out loud. A good spot
// to save and quit, and to split a long road in two.
function campHere() {
  if (G.mode !== 'adv' || G.daily || G.run.quick || G.run.bow || spanDone() || G.floor.land === WELL) return false;
  const path = runPath(), slots = roadSlots(), d = G.floor.depth % path.length;
  return slots.length === path.length && d < path.length - 1 && slots[d].act !== slots[d + 1].act;
}
// The frog's letter for the act that just ended, a line at a time.
const CAMP_LETTERS = [
  ['DEAR HERO, RIBBIT!', 'THE MORNING LANDS ARE SAFE.', 'THE LANTERNS ARE LIGHTING UP.', 'REST HERE. DUSK IS NEAR.', 'TIRED? SAVE AND QUIT. I WILL WAIT.', 'YOURS, MISTER RIBBIT'],
  ['DEAR HERO, RIBBIT!', 'THE DUSK IS OVER. NIGHT FALLS.', 'THE LAST STARS HIDE DEEP DOWN.', 'WARM YOUR PAWS. I MEAN HANDS.', 'TIRED? SAVE AND QUIT. I WILL WAIT.', 'YOURS, MISTER RIBBIT'],
];
const campLine = (o) => { const L = CAMP_LETTERS[o.letter] || CAMP_LETTERS[0]; return L[Math.floor(o.t / 2.6) % L.length]; };
function stockCamp(room) {
  room.props.push({ kind: 'camp', x: 100, y: 124, t: 0, used: false });
  room.props.push({ kind: 'frog', x: 296, y: 66, t: 0, letter: roadSlots()[G.floor.depth % runPath().length].act });
  addPedestal(room, 272, 104, 'hp', 4);
  addPedestal(room, 320, 104, gpick(POTION_IDS), 0);
  const pot = room.props[room.props.length - 1];
  pot.price = POTIONS[pot.item].price;
}
// Resting by the fire: everyone heals once; a solo run is saved right there.
function restAtCamp(o, p) {
  if (o.used) { say(p, 'THE FIRE CRACKLES'); return; }
  o.used = true;
  for (const q of G.players) if (alive(q)) { q.hp = q.maxHp; burst(q.x, q.y - 10, 12, ['O', 'y', 'Y'], 80, 0.6, { g: -30 }); }
  burst(o.x, o.y - 14, 20, ['O', 'y', 'Y', 'w'], 90, 0.9, { g: -50 });
  Audio_.sfx('heart');
  say(p, 'ALL HEALED!');
  G.propsN++;
  saveRun();
  if (!NET.role && hasRun()) toast('THE RUN IS SAVED');
}
