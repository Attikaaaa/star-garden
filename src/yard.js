'use strict';
// The Living Garden: a room you walk around between runs. The Star Gate starts runs; each
// place opens its screen (walk up and press E, or click it); the Garden upgrades grow as
// plants; star seeds planted in the plots grow in real time and every room cleared in a
// run waters them; the frog sells seeds, scrolls and decorations; rescued critters roam.
// TAB (or the menu button) opens the quick menu with every screen one press away.

// ---------- The places ----------
// w, h: the solid footprint. go: what using it does.
const YARD_SPOTS = [
  { id: 'gate', x: 192, y: 66, w: 18, h: 6, label: 'STAR GATE', go: () => yardPlayMenu() },
  { id: 'rack', x: 116, y: 64, w: 14, h: 5, label: 'WANDS', spr: 'g_rack', go: () => yardOpen('wands') },
  { id: 'board', x: 268, y: 66, w: 16, h: 5, label: 'QUESTS', spr: 'g_board', go: () => yardOpen('quests') },
  { id: 'mail', x: 40, y: 104, w: 6, h: 4, label: 'MAILBOX', spr: 'g_mailbox', go: () => yardOpen('mail') },
  { id: 'scope', x: 344, y: 104, w: 8, h: 4, label: 'CONSTELLATIONS', spr: 'g_scope', go: () => yardOpen('stars') },
  { id: 'shelf', x: 44, y: 154, w: 16, h: 5, label: 'BOOK', spr: 'g_shelf', go: () => yardOpen('book') },
  { id: 'lectern', x: 96, y: 186, w: 8, h: 5, label: 'LIBRARY', spr: 'shrine', go: () => yardOpen('library') },
  { id: 'wardrobe', x: 340, y: 156, w: 12, h: 5, label: 'WARDROBE', spr: 'g_wardrobe', go: () => yardOpen('wardrobe') },
  { id: 'stall', x: 292, y: 196, w: 28, h: 5, label: "THE FROG'S STALL", spr: 'g_stall', go: () => yardStall() },
];
// The upgrade bed: one plant per Garden upgrade, a stage for every level bought.
const PLANT_COL = { hp: 'R', dmg: 'y', rate: 'O', multi: 'c', speed: 'h', bank: 'y', luck: 'h', charge: '3', belt: 'P' };
const plantSpot = (i) => ({ x: 152 + (i % 3) * 40, y: 104 + Math.floor(i / 3) * 18 });
const PLOT_X = [150, 192, 234], PLOT_Y = 178;
// Decorations the frog sells, and where each one stands.
const DECOR = [
  { id: 'fountain', name: 'A FOUNTAIN', price: 150, spr: 'fountain_0', x: 60, y: 60, w: 28, h: 4 },
  { id: 'pillar', name: 'A STAR PILLAR', price: 80, spr: 'shrine', x: 150, y: 150, w: 6, h: 4 },
  { id: 'lantern', name: 'A STAR LANTERN', price: 60, spr: 'brk_well', x: 234, y: 150, w: 6, h: 4 },
  { id: 'bush', name: 'A ROUND BUSH', price: 40, spr: 'brk_meadow', x: 320, y: 60, w: 7, h: 4 },
  { id: 'crystal', name: 'A CRYSTAL', price: 120, spr: 'rock_crystal', x: 24, y: 196, w: 6, h: 4 },
  { id: 'flowers', name: 'A FLOWER BED', price: 100, spr: 'g_plant3_R', x: 360, y: 196, w: 6, h: 3 },
];

let YARD_ROOM = null;
function yardRoom() {
  if (!YARD_ROOM) { YARD_ROOM = withSeed(hashSeed('yard'), () => { const r = newRoom(0, 0); r.type = 'yard'; buildRoom(r); r.cleared = true; return r; }); }
  return YARD_ROOM;
}
function enterYard(msg) {
  const Y = G.yard || (G.yard = { p: { x: 192, y: 150, hw: 5, hh: 5, face: 'd', flip: false, moving: false, walkT: 0, idleT: 0, dx: 0, dy: 1 }, crit: [], target: null });
  setState('yard');
  G.yardBack = false;
  if (!Y.crit.length || Y.crit.length !== Save.critters.length + (Save.pet ? 1 : 0)) {
    Y.crit = Save.critters.map(c => ({ c, x: grnd(60, 320), y: grnd(90, 190), tx: 0, ty: 0, t: 0 }));
    if (Save.pet) Y.crit.push({ c: 'pet', x: Y.p.x - 16, y: Y.p.y, tx: 0, ty: 0, t: 0 });
  }
  if (!Save.flags.yardHelp) { Save.flags.yardHelp = true; Save.write(); toast(IS_TOUCH ? 'TAP A PLACE TO GO THERE' : 'WALK UP TO THINGS AND PRESS E. TAB: MENU'); }
  if (msg) toast(msg);
}
// A place's screen; its BACK returns to the Garden.
function yardOpen(id) { openHubCard(id); G.yardBack = true; }
function yardSolids() {
  const out = YARD_SPOTS.slice();
  for (const d of DECOR) if (Save.decor.includes(d.id)) out.push(d);
  return out;
}
function yardBlocked(x, y) {
  const room = yardRoom();
  if (boxSolid(room, x, y, 5, 5, 'player')) return true;
  for (const s of yardSolids()) if (Math.abs(x - s.x) < s.w + 5 && Math.abs(y - s.y) < s.h + 5) return true;
  for (let i = 0; i < UPGRADES.length; i++) { const q = plantSpot(i); if (Math.abs(x - q.x) < 9 && Math.abs(y - q.y) < 6) return true; }
  for (const px of PLOT_X) if (Math.abs(x - px) < 14 && Math.abs(y - PLOT_Y) < 6) return true;
  return false;
}
// What the hero stands next to: a place, a plant or a plot.
function yardNear() {
  const p = G.yard.p;
  let best = null, bd = 26;
  const test = (o, ox, oy) => { const d = Math.hypot(p.x - ox, (p.y - oy) * 1.3); if (d < bd) { bd = d; best = o; } };
  for (const s of YARD_SPOTS) test(s, s.x, s.y + s.h);
  for (let i = 0; i < UPGRADES.length; i++) { const q = plantSpot(i); test({ id: 'plant', i, label: UPGRADES[i].name }, q.x, q.y + 4); }
  PLOT_X.forEach((x, i) => test({ id: 'plot', i, label: plotLabel(i) }, x, PLOT_Y + 5));
  return best;
}
function yardUse(o) {
  Audio_.sfx('confirm');
  if (o.id === 'plant') { yardOpen('up'); G.menuSel = o.i; return; }
  if (o.id === 'plot') { usePlot(o.i); return; }
  o.go();
}

// ---------- Walking ----------
function updateYard(dt) {
  const Y = G.yard, p = Y.p;
  if (G.banner && (G.banner.t -= dt) <= 0) G.banner = null;
  if (pressed(...K_BACK)) { Audio_.sfx('select'); titleReturn('THE GARDEN'); return; }
  if (pressed('Tab', 'KeyQ', 'PadY')) { Audio_.sfx('confirm'); openHub(0); return; }
  const pad = Input.pad;
  let mx = (key(keyOf('right')) || key('ArrowRight') ? 1 : 0) - (key(keyOf('left')) || key('ArrowLeft') ? 1 : 0) + pad.mx;
  let my = (key(keyOf('down')) || key('ArrowDown') ? 1 : 0) - (key(keyOf('up')) || key('ArrowUp') ? 1 : 0) + pad.my;
  // click or tap: walk there (and use the place that was clicked)
  if (Input.mouseHit) {
    if (mouseOn() && Input.mx < -SCR.ox + 60 && Input.my < -SCR.oy + 22) { openHub(0); return; }
    const hit = yardAt(Input.mx, Input.my);
    Y.target = { x: hit ? hit.tx : Input.mx, y: hit ? hit.ty : Input.my, use: hit };
    Y.path = yardPath(p.x, p.y, Y.target.x, Y.target.y);
  }
  if (mx || my) Y.target = null;
  else if (Y.target) {
    // follow the path's next waypoint, then the target itself
    while (Y.path && Y.path.length && Math.hypot(Y.path[0][0] - p.x, Y.path[0][1] - p.y) < 4) Y.path.shift();
    const wp = Y.path && Y.path.length ? Y.path[0] : [Y.target.x, Y.target.y];
    const dx = wp[0] - p.x, dy = wp[1] - p.y, d0 = Math.hypot(Y.target.x - p.x, Y.target.y - p.y), d = Math.hypot(dx, dy) || 1;
    const nb = Y.target.use && yardNear();
    if (d0 < 4 || (nb && nb.id === Y.target.use.o.id && nb.i === Y.target.use.o.i)) {
      const u = Y.target.use;
      Y.target = null;
      if (u) { yardUse(u.o); return; }
    } else { mx = dx / d; my = dy / d; }
  }
  const l = Math.hypot(mx, my);
  if (l > 1) { mx /= l; my /= l; }
  p.moving = !!(mx || my);
  if (p.moving) {
    p.dx = mx; p.dy = my;
    const sp = 90;
    const nx = p.x + mx * sp * dt, ny = p.y + my * sp * dt;
    if (!yardBlocked(nx, p.y)) p.x = nx; else if (Y.target) Y.target = null;
    if (!yardBlocked(p.x, ny)) p.y = ny; else if (Y.target) Y.target = null;
    p.walkT += dt; p.idleT = 0;
    if (Math.abs(mx) > Math.abs(my) * 1.1) { p.face = 's'; p.flip = mx < 0; } else p.face = my < 0 ? 'u' : 'd';
  } else p.idleT += dt;
  if (pressed(...K_OK) || pressed('PadX')) { const o = yardNear(); if (o) yardUse(o); }
  // critters wander; the pet follows the hero
  for (const c of Y.crit) {
    if (c.c === 'pet') { const tx = p.x - (p.flip ? -1 : 1) * 16, ty = p.y + 3, d = Math.hypot(tx - c.x, ty - c.y); c.moving = d > 5; if (c.moving) { const k = Math.min(1, dt * 4); c.x += (tx - c.x) * k; c.y += (ty - c.y) * k; c.flip = tx < c.x; } continue; }
    if ((c.t -= dt) <= 0) { c.t = grnd(1.5, 4); c.tx = grnd(60, 330); c.ty = grnd(96, 196); }
    const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
    c.moving = d > 3;
    if (c.moving) { const nx = c.x + dx / d * 22 * dt, ny = c.y + dy / d * 22 * dt; if (!yardBlocked(nx, ny)) { c.x = nx; c.y = ny; } else c.t = 0; c.flip = dx < 0; }
  }
  Y.t = (Y.t || 0) + dt;
}
// A walking path around the garden's things: breadth-first search on an 8 px grid.
function yardPath(x0, y0, x1, y1) {
  const C = 8, W = Math.ceil(VW / C), H = Math.ceil(VH / C), idx = (x, y) => y * W + x;
  const sx = Math.floor(x0 / C), sy = Math.floor(y0 / C), tx = Math.floor(x1 / C), ty = Math.floor(y1 / C);
  const prev = new Int32Array(W * H).fill(-1), q = [idx(sx, sy)];
  prev[q[0]] = q[0];
  let found = -1;
  for (let k = 0; k < q.length && found < 0; k++) {
    const c = q[k], cx = c % W, cy = (c / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = idx(nx, ny);
      if (prev[n] >= 0) continue;
      const goal = nx === tx && ny === ty;
      if (!goal && yardBlocked(nx * C + C / 2, ny * C + C / 2)) continue;
      prev[n] = c;
      if (goal) { found = n; break; }
      q.push(n);
    }
  }
  if (found < 0) return null;
  const out = [];
  for (let c = found; c !== prev[c]; c = prev[c]) out.unshift([(c % W) * C + C / 2, ((c / W) | 0) * C + C / 2]);
  return out;
}
// The place, plant or plot under a click, and where to stand to use it.
function yardAt(x, y) {
  for (const s of yardSolids()) if (s.go && Math.abs(x - s.x) < s.w + 8 && y > s.y - 26 && y < s.y + 8) return { o: s, tx: s.x, ty: s.y + s.h + 9 };
  for (let i = 0; i < UPGRADES.length; i++) { const q = plantSpot(i); if (Math.abs(x - q.x) < 10 && y > q.y - 14 && y < q.y + 4) return { o: { id: 'plant', i }, tx: q.x, ty: q.y + 11 }; }
  for (let i = 0; i < 3; i++) if (Math.abs(x - PLOT_X[i]) < 12 && Math.abs(y - PLOT_Y) < 10) return { o: { id: 'plot', i }, tx: PLOT_X[i], ty: PLOT_Y + 12 };
  return null;
}

// ---------- The Star Gate ----------
function yardPlayMenu() {
  const b = [{ label: 'ADVENTURE', col: 'h', fn: () => { G.prep = { mode: 'adv', yard: true }; setState('prep'); } }];
  if (menuOpen('daily')) b.push({ label: 'DAILY', fn: () => { setState('daily'); G.menuSel = 0; G.dailyYard = true; } });
  if (menuOpen('arena')) b.push({ label: 'ARENA', fn: () => { G.prep = { mode: 'arena', yard: true }; setState('prep'); } });
  if (menuOpen('coop')) b.push({ label: 'CO-OP', fn: () => setState('coop') });
  b.push({ label: 'STAY' });
  openModal({ title: 'THE STAR GATE', lines: ['WHERE TO, LITTLE WIZARD?'], buttons: b });
}

// ---------- Seed plots ----------
const PLOT_KINDS = [
  { label: '30 MIN', dur: 30 * 60000, gift: { vault: 12 } },
  { label: '4 H', dur: 4 * 3600000, gift: { vault: 30 } },
  { label: '12 H', dur: 12 * 3600000, gift: { vault: 50, scroll: 1 } },
  { label: '1 DAY', dur: 24 * 3600000, gift: { vault: 80, seeds: 1, scroll: 1 } },
];
const plotAt = (i) => Save.plots[i] || null;
const plotLeft = (P) => Math.max(0, P.t0 + P.dur - Date.now());
function fmtLeft(ms) { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + 'H ' + pad2(m % 60) + 'M' : m + 'M'; }
function plotLabel(i) {
  const P = plotAt(i);
  if (!P) return Save.seeds ? 'PLANT A STAR SEED' : 'AN EMPTY PLOT';
  const left = plotLeft(P);
  return left ? 'BLOOMS IN ' + fmtLeft(left) : 'READY TO PICK!';
}
function usePlot(i) {
  const P = plotAt(i);
  if (P && plotLeft(P) > 0) { toast('IT BLOOMS IN ' + fmtLeft(plotLeft(P)) + '. CLEARED ROOMS WATER IT'); return; }
  if (P) {
    // harvest
    const g = PLOT_KINDS[P.kind].gift, out = { vault: g.vault, seeds: g.seeds || 0 };
    giveGift(out);
    if (g.scroll && scrollsLeft() > 0) note('scroll');
    Save.plots[i] = null; Save.write();
    note('harvest');
    Audio_.sfx('item');
    G.banner = { title: 'A STAR FLOWER!', sub: giftText(out) + (g.scroll ? ' AND A STAR SCROLL' : ''), t: 2.4, icon: null };
    track('harvest', { kind: P.kind });
    return;
  }
  if (!Save.seeds) { Audio_.sfx('deny'); toast('YOU NEED A STAR SEED (QUESTS, LETTERS, THE DAILY RUN)'); return; }
  openModal({ title: 'PLANT A STAR SEED', lines: ['LONGER GROWING, BIGGER FLOWERS.', 'EVERY ROOM YOU CLEAR WATERS IT A LITTLE.'],
    buttons: PLOT_KINDS.map((k, n) => ({ label: k.label, fn: () => { Save.seeds--; Save.plots[i] = { kind: n, t0: Date.now(), dur: k.dur }; Save.write(); Audio_.sfx('item'); toast('PLANTED! IT BLOOMS IN ' + fmtLeft(k.dur)); note('plant'); } })).concat([{ label: 'NO' }]) });
}
// Cleared rooms water the plots: a minute off each.
onNote((ev) => {
  if (ev !== 'room' && ev !== 'wave') return;
  let n = 0;
  for (const P of Save.plots) if (P && plotLeft(P) > 0) { P.t0 -= 60000; n++; }
  if (n) Save.write();
});
function ripePlots() { return Save.plots.filter(P => P && plotLeft(P) <= 0).length; }
function nextBloom() { let m = Infinity; for (const P of Save.plots) if (P && plotLeft(P) > 0) m = Math.min(m, plotLeft(P)); return m; }

// ---------- The frog's stall: the day's stock ----------
function stallStock() {
  return withSeed(hashSeed('stall', dayKey(), Save.born), () => {
    const out = [{ kind: 'seed', price: 30 }];
    if (scrollsLeft() > 0) out.push({ kind: 'scroll', price: 45 });
    const d = gshuffle(DECOR.filter(x => !Save.decor.includes(x.id)))[0];
    if (d) out.push({ kind: 'decor', id: d.id, price: d.price });
    return out;
  });
}
function yardStall() {
  const S_ = Save.flags.stall && Save.flags.stall.day === dayKey() ? Save.flags.stall : (Save.flags.stall = { day: dayKey(), bought: [] });
  const stock = stallStock().filter(o => !S_.bought.includes(o.kind));
  const name = (o) => (o.kind === 'seed' ? 'A STAR SEED' : o.kind === 'scroll' ? 'A STAR SCROLL' : DECOR.find(d => d.id === o.id).name);
  if (!stock.length) { openModal({ title: "THE FROG'S STALL", lines: ['SOLD OUT FOR TODAY!', 'COME BACK TOMORROW. RIBBIT!'], buttons: [{ label: 'OK' }] }); return; }
  openModal({ title: "THE FROG'S STALL", lines: stock.map(o => name(o) + ': ' + o.price + ' VAULT COINS').concat(['YOU HAVE ' + Save.vault]),
    buttons: stock.map(o => ({ label: o.kind === 'decor' ? 'DECOR' : o.kind.toUpperCase(), fn: () => buyStall(o) })).concat([{ label: 'BYE' }]) });
}
function buyStall(o) {
  if (Save.vault < o.price) { Audio_.sfx('deny'); toast('NOT ENOUGH VAULT COINS'); return; }
  Save.vault -= o.price;
  Save.flags.stall.bought.push(o.kind);
  if (o.kind === 'seed') { Save.seeds++; toast('A STAR SEED! PLANT IT IN A PLOT'); }
  else if (o.kind === 'scroll') note('scroll');
  else { Save.decor.push(o.id); toast('IT LOOKS LOVELY IN YOUR GARDEN!'); }
  note('buy', 'stall:' + o.kind, o.price); bump('vspent', o.price);
  Save.write();
  Audio_.sfx('item');
}

// ---------- Drawing ----------
function drawYard() {
  const Y = G.yard, p = Y.p, room = yardRoom();
  if (room.dirty) renderRoomStatic(room, 'meadow');
  ctx.drawImage(room.canvas, 0, 0);
  // the pieces, back to front
  const list = [];
  for (const s of yardSolids()) list.push([s.y, () => drawYardSpot(s)]);
  UPGRADES.forEach((u, i) => { const q = plantSpot(i); list.push([q.y, () => { const lv = Math.min(3, upLevel(u.id)), sp = S('g_plant' + lv + '_' + (PLANT_COL[u.id] || 'P')); shadow(q.x, q.y, 8); drawFeet(sp, q.x, q.y + 1); }]); });
  PLOT_X.forEach((x, i) => list.push([PLOT_Y - 4, () => drawPlot(i, x)]));
  for (const c of Y.crit) list.push([c.y, () => {
    const f = c.moving ? Math.floor(Y.t * 6) % 2 : Math.floor(Y.t * 1.5) % 2, sp = S(c.c === 'pet' ? 'pet_' + Save.pet + '_' + f : 'crit_' + c.c + '_' + f);
    shadow(c.x, c.y, 7); drawFeet(sp, c.x, c.y + 1 - (c.c === 'pet' && Save.pet === 'bee' ? 7 : 0), c.flip ? 1 : 0);
  }]);
  list.push([p.y, () => {
    shadow(p.x, p.y, 12);
    const frame = p.moving ? HERO_WALK[Math.floor(p.walkT / 0.11) % 4] : 0, blink = !p.moving && p.face !== 'u' && p.idleT % 3.2 > 3.05;
    drawFeet(S(heroPre(heroUnlocked(Save.hero) ? Save.hero : 'pip') + p.face + frame + (blink ? 'b' : '') + SKIN[Save.skin]), p.x, p.y + 1, p.face === 's' && p.flip ? 1 : 0);
  }]);
  list.sort((a, b) => a[0] - b[0]);
  for (const [, fn] of list) fn();
  drawAmbient(0, 0);
  // what the hero stands next to
  const o = yardNear();
  if (o) {
    const t = (IS_TOUCH ? '' : Input.lastAim === 'pad' ? 'A: ' : 'E: ') + (o.id === 'plot' ? plotLabel(o.i) : o.label);
    const w = textW(t) + 10;
    panel(Math.round(p.x - w / 2), Math.round(p.y - 38), w, 13);
    text(t, p.x, p.y - 34, 'Y', 0, 1);
  }
  // corners: the menu button, the vault and the seeds
  const e = screenEdges();
  const mt = Input.lastAim === 'pad' ? 'Y: MENU' : IS_TOUCH ? 'MENU' : 'TAB: MENU', mw = textW(mt) + 10;
  panel(e.l + 3, e.t + 3, mw, 14);
  text(mt, e.l + 3 + mw / 2, e.t + 7, 'w', 0, 1);
  vaultBadge(e.r - 6, e.t + 6);
  if (Save.seeds) { drawS(S('sparkle_0'), e.r - 60, e.t + 7); text(String(Save.seeds), e.r - 54, e.t + 6, 'Y', 2); }
  const why = comeBackLine();
  if (why && !G.toast) text(why, VW / 2, e.b - 12, 'Y', 2, 1);
  if (G.banner) drawBanner();
}
function drawYardSpot(s) {
  const x = s.x, y = s.y, t = G.yard.t || 0;
  if (s.id === 'gate') { const f = Math.floor(t * 8) % 3; drawS(S('portal_' + f), x - 16, y - 10); if (Math.random() < 0.2) part(x + rnd(-12, 12), y - rnd(0, 6), 0, -rnd(20, 40), 0.7, null, { spr: 'sparkle', drag: 1 }); return; }
  shadow(x, y, Math.min(30, s.w * 2));
  const sp = S(s.spr);
  if (s.id === 'stall') {
    drawFeet(S(Math.floor(t * 2) % 2 ? 'frog_1' : 'frog_0'), x, y - 6);
    drawFeet(sp, x, y + 1);
    return;
  }
  drawFeet(sp, x, y + 1);
  if (s.id === 'lectern') drawS(S('scroll_' + (Math.floor(t * 2) % 2)), x - 5, y - 30);
  if (s.id === 'mail' && typeof unreadMail === 'function' && unreadMail() && Math.floor(t * 3) % 2) text('!', x + 8, y - 20, 'Y', 2);
  if (s.id === 'board' && Save.quests && Save.quests.list.some(q => q.done) && Math.floor(t * 2) % 2) drawS(S('sparkle_0'), x + 12, y - 22);
}
function drawPlot(i, x) {
  const y = PLOT_Y, P = plotAt(i);
  drawS(S('g_plot'), x - 10, y - 4);
  if (!P) return;
  const left = plotLeft(P), k = 1 - left / P.dur, st = left <= 0 ? 2 : k < 0.34 ? 0 : k < 0.67 ? 1 : 2;
  const sp = S('g_sprout_' + st);
  drawFeet(sp, x, y + 1);
  if (left <= 0) { drawGlow(sp, x - (sp.w >> 1), y + 1 - sp.h, false); if (Math.floor((G.yard.t || 0) * 3) % 2) drawS(S('sparkle_1'), x + 4, y - 14); }
}
