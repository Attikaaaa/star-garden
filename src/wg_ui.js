'use strict';
// Wildgrove: the play view with its HUD, the pause menu, inventory + crafting, chests and the death screen.
function wgDrawPlay() {
  const sh = WGS.shake && Save.settings.shake ? (Math.random() - 0.5) * 2 : 0;
  ctx.save(); if (sh) ctx.translate(Math.round(sh), Math.round(sh));
  const { cx0, cy0 } = wgDrawWorld();
  // particles
  for (const q of WGS.parts) { const a = 1 - q.age / q.life; rect(Math.round(q.x - cx0), Math.round(q.y - cy0 - (q.z || 0)), q.sz || 1, q.sz || 1, q.c[Math.floor(a * q.c.length * 0.99)] || q.c[0]); }
  for (const a of WGS.arrows || []) { const ax = Math.round(a.x - cx0), ay = Math.round(a.y - cy0); if (a.star) { rect(ax - 1, ay - 2, 3, 5, 'o'); rect(ax - 2, ay - 1, 5, 3, 'o'); rect(ax - 1, ay - 1, 3, 3, 'Y'); } else rect(ax - 1, ay - 1, 3, 3, 'L'); }
  for (const a of WGS.parr || []) { const sx = Math.round(a.x - cx0), sy = Math.round(a.y - cy0); if (a.magic) { rect(sx - 1, sy - 1, 3, 3, a.magic === 'wand_frost' ? 'C' : 'q'); rect(sx, sy, 1, 1, 'w'); } else { rect(sx - 2, sy, 4, 1, 'n'); rect(sx + 1, sy, 2, 1, 'l'); } }
  // mining crack and the tile cursor
  const m = WGS.mine, T = WGS.target;
  if (T && WGS.scr === 'play') {
    const sx = T.tx * 16 - cx0, sy = T.ty * 16 - cy0, o = wgObjAt(WGS.world, WGS.dim, T.tx, T.ty);
    ctx.strokeStyle = o ? 'rgba(255,224,120,0.9)' : 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
    const c = Math.floor(WGS.t * 3) % 2; ctx.strokeRect(sx + 0.5, sy + 0.5, 15, 15); if (c && o) { rect(sx - 1, sy - 1, 2, 2, 'Y'); rect(sx + 15, sy - 1, 2, 2, 'Y'); rect(sx - 1, sy + 15, 2, 2, 'Y'); rect(sx + 15, sy + 15, 2, 2, 'Y'); }
    if (m && m.tx === T.tx && m.ty === T.ty) { const f = 1 - m.hp / OBJ[o].hp; rect(sx, sy + 17, 16, 3, '0'); rect(sx + 1, sy + 18, Math.round(14 * f), 1, 'Y'); }
    if (o) wtext(OBJ[o].name, sx + 8, sy - 7, 'w', 2, 1);
  }
  const F = WGS.fish; if (F) { const sx = F.tx * 16 + 8 - cx0, sy = F.ty * 16 + 8 - cy0 + Math.round(Math.sin(WGS.t * 5)); ctx.strokeStyle = 'rgba(240,239,255,0.8)'; ctx.beginPath(); ctx.moveTo(Math.round(WGS.p.x - cx0) + 5, Math.round(WGS.p.y - cy0) - 16); ctx.lineTo(sx, sy); ctx.stroke(); rect(sx - 1, sy - 1, 3, 3, 'r'); rect(sx, sy - 1, 1, 1, 'w'); if (F.t < 0.8) { rect(sx - 4, sy + 2, 9, 1, 'C'); } }
  wgDrawAmbient(cx0, cy0); wgDrawLight(cx0, cy0); wgDrawSky();
  ctx.restore();
  wgDrawWeatherFX();
  if (!WGS.photo) wgDrawHud();
  if (WGN.role) wgDrawChat();
  if (Input.lastAim === 'touch' && WGS.scr === 'play') wgDrawTouch();
}
function wgHeart(x, y, full) { // 7x6 heart: 2 full, 1 half, 0 empty
  const c = full === 2 ? ['r', 'R', 'w'] : full === 1 ? ['r', 'R', 'w'] : ['X', 'x', 'X'];
  const shape = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) if (shape[j][i] === '#') { const half = full === 1 && i > 3; rect(x + i, y + j, 1, 1, half ? 'x' : (j === 1 && i < 3 ? c[2] : c[0])); }
  rect(x + 1, y - 1, 2, 1, '0'); rect(x + 4, y - 1, 2, 1, '0');
  if (full === 2) rect(x + 1, y + 1, 1, 1, 'w');
}
function wgFood(x, y, full) {
  const shape = ['..###..', '.#####.', '#######', '#######', '.#####.', '..#.#..'];
  for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) if (shape[j][i] === '#') rect(x + i, y + j, 1, 1, full === 2 ? (j < 2 ? 'O' : 'n') : full === 1 && i > 3 ? 'x' : full === 1 ? 'O' : 'x');
}
function wgSlot(x, y, s, sel, big) {
  rect(x, y, 18, 18, '0'); rect(x + 1, y + 1, 16, 16, sel ? 'Y' : '3'); rect(x + 2, y + 2, 14, 14, sel ? 'y' : '1');
  if (s) { ctx.drawImage(wgIcon(s.id), x + 1, y + 1); if (s.n > 1) wtext(String(s.n), x + 17, y + 11, 'w', 2, 2); const it = WGI[s.id]; if (it.dur) { /* reserved */ } }
}
function wgDrawHud() {
  const p = WGS.p, L = -SCR.ox, B = -SCR.oy + SCR.h, R = -SCR.ox + SCR.w, T0 = -SCR.oy;
  // hotbar, centred at the bottom
  const bx = Math.round((L + R) / 2 - 9 * 19 / 2), by = B - 22;
  for (let i = 0; i < 9; i++) wgSlot(bx + i * 19, by, WGS.inv[i], i === WGS.sel);
  ctx.globalAlpha = 0.7; for (let i = 0; i < 9; i++) if (!WGS.inv[i]) wtext(String(i + 1), bx + i * 19 + 9, by + 5, i === WGS.sel ? 'n' : 'm', 0, 1); ctx.globalAlpha = 1; // the key that picks each empty slot
  if (Input.mouseHit && Input.my >= by && Input.my < by + 18) { const i = Math.floor((Input.mx - bx) / 19); if (i >= 0 && i < 9 && WGS.scr === 'play') { WGS.sel = i; Input.mouseHit = false; } }
  { const g = p.grave; // an arrow toward the pack you dropped when you fell, gone once you are back at it
    if (g && g.dim === WGS.dim) {
      const dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy);
      if (d < 24) p.grave = null;
      else if (d > 60 && WGS.scr === 'play') { const a = Math.atan2(dy, dx), ax = Math.round((L + R) / 2 + Math.cos(a) * 52), ay = Math.round((T0 + B) / 2 - 8 + Math.sin(a) * 40);
        rect(ax - 3, ay - 3, 7, 7, '0'); rect(ax - 2, ay - 2, 5, 5, 'r'); rect(ax + Math.round(Math.cos(a) * 2) - 1, ay + Math.round(Math.sin(a) * 2) - 1, 2, 2, 'w');
        wtext(Math.round(d / 16) + 'M', ax, ay + 5, 'L', 2, 1); }
    } }
  // hearts above the left half, food above the right
  for (let i = 0; i < 10; i++) wgHeart(bx + i * 8, by - 11, wgClamp(p.hp - i * 2, 0, 2));
  for (let i = 0; i < 10; i++) wgFood(bx + 9 * 19 - 7 - i * 8 + 0, by - 11, wgClamp(Math.round(p.food) - i * 2, 0, 2));
  const h = WGS.inv[WGS.sel]; if (h) wtext(WGI[h.id].name, (L + R) / 2, by - 21, 'w', 2, 1);
  // clock: a sun/moon dial top-right
  const cx = R - 20, cy = T0 + 20, a = (WGS.clock - 0.25) * 6.283, night = wgNight(WGS.clock) > 0.5;
  rect(cx - 10, cy - 10, 20, 20, '0'); rect(cx - 9, cy - 9, 18, 18, night ? '1' : 'c'); rect(cx - 9, cy - 9, 18, 1, night ? '2' : 'C');
  const ox = Math.round(Math.cos(a) * 6), oy = Math.round(-Math.sin(a) * 6);
  if (WGS.dim !== 'u') { rect(cx + ox - 2, cy + oy - 2, 4, 4, night ? 'L' : 'Y'); rect(cx + ox - 1, cy + oy - 1, 2, 2, night ? 'w' : 'w'); }
  else wtext('CAVE', cx, cy - 3, 'L', 0, 1);
  wtext('DAY ' + (WGS.day + 1), cx, cy + 13, 'w', 2, 1); wtext(WG_SEASONS[wgSeason()], cx, cy + 21, 'l', 2, 1);
  if (WGN.role) wtext((WGN.role === 'host' ? 'CODE ' + WGN.code + (WGN.pub ? ' PUBLIC' : '') : 'ONLINE') + '  ' + (1 + (WGN.role === 'host' ? WGN.peers.filter(q => q.pid > 0).length : WGS.remote.length + 0)) + ' IN WORLD', L + 4, T0 + 4, 'Y', 2, 0);
  { const k = WGS.mobs.find(m => WG_MOBS[m.type].boss && Math.hypot(m.x - WGS.p.x, m.y - WGS.p.y) < 320); if (k) { const D = WG_MOBS[k.type], bw = 140, bx2 = (L + R) / 2 - bw / 2, f = Math.max(0, k.hp / D.hp); rect(bx2 - 1, T0 + 44, bw + 2, 8, '0'); rect(bx2, T0 + 45, bw, 6, 'x'); rect(bx2, T0 + 45, Math.round(bw * f), 6, D.star ? 'o' : 'r'); rect(bx2, T0 + 45, Math.round(bw * f), 1, D.star ? 'Y' : 'R'); wtext(D.name, (L + R) / 2, T0 + 54, 'w', 2, 1); } }
  if (WGS.toast) wtext(WGS.toast.msg, (L + R) / 2, T0 + 14, 'Y', 3, 1);
  { const m = WGS.world.meta, H = !m.hintDone && WG_HINTS[m.hint || 0]; if (H && WGS.scr === 'play') { const tw = textW(tr(H[0]), 1) + 12; rect((L + R) / 2 - tw / 2, T0 + 26, tw, 12, '0'); rect((L + R) / 2 - tw / 2 + 1, T0 + 27, tw - 2, 10, '1'); wtext(H[0], (L + R) / 2, T0 + 29, 'Y', 0, 1); } }
  for (const k in p.buff) { /* potion buffs are listed under the dial */ }
  let y = cy + 32; for (const k in p.buff) { wtext(k.toUpperCase() + ' ' + Math.ceil(p.buff[k]), R - 4, y, 'g', 2, 2); y += 9; }
  if (wgOpt().info && WGS.scr === 'play') { // like F3: where you are, which biome, how fast the game runs
    const tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16), b = WGS.dim === 'o' ? wgSurface(WGS.world.seed, tx, ty).b : 'cave';
    const nf = performance.now(), df = (nf - (WGS.lf || nf)) / 1000; WGS.lf = nf; WGS.fps = (WGS.fps || 60) * 0.95 + Math.min(240, 1 / Math.max(0.001, df)) * 0.05;
    wtext('X ' + tx + '  Y ' + ty, L + 4, T0 + 22, 'w', 0, 0); wtext(b.toUpperCase() + '  ' + Math.round(WGS.fps) + ' FPS', L + 4, T0 + 31, 'l', 0, 0);
    wtext('DAY ' + (WGS.day + 1) + '  ' + String(Math.floor(((WGS.clock * 24 + 6) % 24))).padStart(2, '0') + ':' + String(Math.floor((WGS.clock * 1440) % 60)).padStart(2, '0'), L + 4, T0 + 40, 'l', 0, 0);
  }
}
// ---------- pause ----------
function wgDrawPause() {
  dim(0.55); const ui = WGS.ui; wgUiBegin(ui);
  const client = WGN.role === 'client';
  if (ui.set) { wgDrawSettings(ui, client); wgUiEnd(ui); return; }
  if (ui.ach) { // the star chart
    const ach = WGS.world.meta.ach || {}, n = WG_ACH.filter(a => ach[a[0]]).length, pg = ui.pg || 0, per = 8;
    panel(40, 14, 304, 164); wtext('STAR CHART  ' + n + ' / ' + WG_ACH.length, VW / 2, 20, 'Y', 3, 1);
    WG_ACH.slice(pg * per, pg * per + per).forEach((a, i) => { const got = ach[a[0]], x = 50 + (i % 2) * 148, y = 38 + Math.floor(i / 2) * 28; rect(x, y, 142, 25, '0'); rect(x + 1, y + 1, 140, 23, got ? '3' : '1'); rect(x + 2, y + 2, 138, 21, got ? '2' : '1'); wtext('*', x + 7, y + 8, got ? 'Y' : 'd', 2, 1); wtext(a[1], x + 16, y + 4, got ? 'w' : 'l', 0); wtext(a[2], x + 16, y + 13, got ? 'Y' : 'd', 0); });
    if (wgButton(ui, '<', 50, 158, 36, { h: 14, off: pg === 0 })) ui.pg = pg - 1;
    if (wgButton(ui, 'BACK', 140, 158, 104, { h: 14 })) ui.ach = false;
    if (wgButton(ui, '>', 298, 158, 36, { h: 14, off: (pg + 1) * per >= WG_ACH.length })) ui.pg = pg + 1;
    wgUiEnd(ui); return;
  }
  if (ui.mp) { wgDrawFriends(ui); wgUiEnd(ui); return; }
  if (ui.help) { panel(60, 20, 264, 150); const K = (n) => wgKeyName(wgKey(n)), rows = [K('up') + K('left') + K('down') + K('right') + '  MOVE (' + K('run') + ' RUNS)', 'LEFT CLICK  MINE / HIT (HOLD)', 'RIGHT CLICK  USE / PLACE / EAT', '1-9 OR WHEEL  HOTBAR', K('bag') + '  BACKPACK AND CRAFTING', K('drop') + '  DROP ONE', K('use') + '  USE OR EAT', 'ENTER  CHAT (ONLINE)', 'F2  PHOTO', 'ESC  PAUSE']; rows.forEach((r, i) => wtext(r, 70, 30 + i * 12, 'w', 1)); if (wgButton(ui, 'BACK', 140, 150, 104) || pressed('Escape')) ui.help = false; wgUiEnd(ui); return; }
  panel(112, 22, 160, client ? 118 : 174); wtext('PAUSED', VW / 2, 30, 'Y', 3, 1);
  let y = 44;
  if (wgButton(ui, 'RESUME', 128, y, 128) || pressed('Escape') && ui.armed) { WGS.scr = 'play'; return; } y += 18;
  ui.armed = true;
  if (!client) {
    if (wgButton(ui, 'SAVE NOW', 128, y, 128)) wgSaveNow().then(() => wgToast('WORLD SAVED')); y += 18;
    if (wgButton(ui, WGN.role ? 'FRIENDS: CODE ' + WGN.code : 'PLAY WITH FRIENDS', 128, y, 128)) ui.mp = !ui.mp; y += 18;
    if (wgButton(ui, 'EXPORT WORLD', 128, y, 128)) wgExport(WGS.world.meta.id).then(() => wgToast('WORLD FILE SAVED')); y += 18;
  }
  if (wgButton(ui, 'SETTINGS', 128, y, 62)) ui.set = !ui.set;
  if (wgButton(ui, 'STARS', 194, y, 62)) { ui.ach = true; ui.pg = 0; } y += 18;
  if (wgButton(ui, ui.help ? 'HIDE CONTROLS' : 'CONTROLS', 128, y, 128)) ui.help = !ui.help; y += 18;
  if (wgButton(ui, client ? 'LEAVE WORLD' : 'SAVE AND QUIT', 128, y, 128)) {
    if (client) { wgnStop(); wgnLeaveGame(); wgRefreshList(); }
    else wgSaveNow().then(() => { wgUnlockWorld(); wgnStop(); WGS.world = null; WGS.scr = 'worlds'; wgRefreshList(); wipe(() => { WGS.scr = 'worlds'; WGS.ui = {}; }); });
    return;
  }
  wgUiEnd(ui);
}
function wgDrawDead() {
  dim(0.5 + Math.min(0.3, WGS.deadT * 0.3));
  wtext('YOU FELL', VW / 2, 70, 'r', 3, 1); wtext('YOUR PACK WAITS WHERE YOU FELL', VW / 2, 88, 'L', 1, 1);
  const ui = WGS.ui; wgUiBegin(ui);
  if (WGS.deadT > 0.8 && wgButton(ui, 'GET UP', VW / 2 - 52, 110, 104)) wgRespawn();
  wgUiEnd(ui);
}
// ---------- inventory with crafting ----------
function wgSlotClick(arr, i, held) { // click-to-move stacks (held lives in WGS.cur)
  const s = arr[i], c = WGS.cur;
  if (!c) { if (s) { WGS.cur = s; arr[i] = null; Audio_.sfx('select'); } return; }
  if (!s) { arr[i] = c; WGS.cur = null; return; }
  if (s.id === c.id && s.n < WGI[s.id].stack) { const t = Math.min(c.n, WGI[s.id].stack - s.n); s.n += t; c.n -= t; if (!c.n) WGS.cur = null; return; }
  arr[i] = c; WGS.cur = s;
}
function wgSlotGrid(arr, x, y, cols, n, from) {
  for (let k = 0; k < n; k++) {
    const i = from + k, sx = x + (k % cols) * 19, sy = y + Math.floor(k / cols) * 19, inside = Input.mx >= sx && Input.mx < sx + 18 && Input.my >= sy && Input.my < sy + 18;
    wgSlot(sx, sy, arr[i], inside || (arr === WGS.inv && i === WGS.sel && false));
    if (inside) { if (Input.mouseHit) wgSlotClick(arr, i); if (arr[i]) WGS.tip = WGI[arr[i].id].name; if (Input.rHit && !WGS.cur && arr[i] && arr[i].n > 1) { const h = Math.ceil(arr[i].n / 2); WGS.cur = { id: arr[i].id, n: h }; arr[i].n -= h; } }
  }
}
function wgDrawInv() {
  dim(0.6); WGS.tip = '';
  const x0 = 24, y0 = 18; panel(x0 - 8, y0 - 8, 348, 192);
  wtext('BACKPACK', x0, y0 - 2, 'Y', 1);
  wgSlotGrid(WGS.inv, x0, y0 + 10, 9, 9, 0);
  wgSlotGrid(WGS.inv, x0, y0 + 36, 9, 27, 9);
  // armour
  wtext('WORN', x0, y0 + 126, 'l', 1);
  ['head', 'body', 'feet'].forEach((sl, i) => { const sx = x0 + i * 19, sy = y0 + 136, inside = Input.mx >= sx && Input.mx < sx + 18 && Input.my >= sy && Input.my < sy + 18, id = WGS.p.armor[sl]; wgSlot(sx, sy, id ? { id, n: 1 } : null, inside); if (inside && Input.mouseHit) { const c = WGS.cur; if (c && WGI[c.id].slot === sl) { WGS.p.armor[sl] = c.id; WGS.cur = id ? { id, n: 1 } : null; } else if (!c && id) { WGS.cur = { id, n: 1 }; WGS.p.armor[sl] = null; } } });
  let def = 0; for (const sl in WGS.p.armor) if (WGS.p.armor[sl]) def += WGI[WGS.p.armor[sl]].def || 0; wtext('DEFENSE ' + def, x0 + 62, y0 + 142, 'L', 1);
  // crafting list
  const st = wgStations(), rx = x0 + 186, ui = WGS.ui;
  wtext('RECIPE BOOK', rx, y0 - 2, 'Y', 1);
  const names = { bench: 'WORKBENCH', furnace: 'FURNACE', anvil: 'ANVIL', alch: 'ALCHEMY', loom: 'LOOM', fire: 'FIRE' };
  wtext('NEAR: ' + (Object.keys(st).filter(k => k !== 'hand').map(k => names[k]).join(', ') || 'NOTHING'), rx, y0 + 8, 'L', 0);
  const seen = WGS.p.seen || {}, q = (WGU.rq || (WGU.rq = { v: '', max: 12 })).v, all = RECIPES.filter(r => st[r.at]);
  const known = r => seen[r.out] || Object.keys(r.in).every(k2 => seen[k2]);
  const list = all.filter(r => known(r) && (!q || tr(WGI[r.out].name).includes(q))); list.sort((a, b) => (wgCanCraft(WGS.inv, b) ? 1 : 0) - (wgCanCraft(WGS.inv, a) ? 1 : 0));
  ui.scroll = wgClamp((ui.scroll || 0) - Math.sign(Input.wheel) * 1, 0, Math.max(0, list.length - 5)); Input.wheel = 0;
  const rows = 5, RH = 27;
  for (let k = 0; k < rows && ui.scroll + k < list.length; k++) {
    const r = list[ui.scroll + k], y = y0 + 20 + k * RH, can = wgCanCraft(WGS.inv, r), inside = Input.mx >= rx && Input.mx < rx + 150 && Input.my >= y && Input.my < y + 26;
    rect(rx, y, 150, 26, '0'); rect(rx + 1, y + 1, 148, 24, inside && can ? 'Y' : can ? '3' : '1'); rect(rx + 2, y + 2, 146, 22, inside && can ? 'y' : can ? '2' : '1');
    ctx.drawImage(wgIcon(r.out), rx + 2, y + 5);
    wtext(tr(WGI[r.out].name) + (r.n > 1 ? ' X' + r.n : ''), rx + 20, y + 3, can ? (inside ? '0' : 'w') : 'm', 0);
    let cx = rx + 20; for (const k2 in r.in) { const have = wgInvCount(WGS.inv, k2) >= r.in[k2]; ctx.globalAlpha = have ? 1 : 0.55; ctx.drawImage(wgIcon(k2), cx, y + 10); ctx.globalAlpha = 1; wtext(String(r.in[k2]), cx + 15, y + 17, have ? (inside ? '0' : 'h') : 'R', 2, 2); cx += 22; }
    if (inside) WGS.tip = Object.keys(r.in).map(k2 => r.in[k2] + ' ' + tr(WGI[k2].name)).join(', ');
    if (inside && can && Input.mouseHit) {
      for (const k2 in r.in) wgInvTake(WGS.inv, k2, r.in[k2]);
      const left = wgInvAdd(WGS.inv, r.out, r.n); if (left) wgDrop(WGS.p.x, WGS.p.y, r.out, left);
      Audio_.sfx(r.at === 'anvil' ? 'anvil' : 'confirm'); wgToast('MADE ' + WGI[r.out].name);
    }
  }
  wgField('', WGU.rq, rx + 90, y0 - 6, 60);
  wtext((ui.scroll + 1) + '-' + Math.min(list.length, ui.scroll + rows) + ' OF ' + list.length + '   WHEEL SCROLLS', rx, y0 + 158, 'L', 0);
  if (WGS.cur) { ctx.drawImage(wgIcon(WGS.cur.id), Input.mx - 8, Input.my - 8); if (WGS.cur.n > 1) wtext(String(WGS.cur.n), Input.mx + 8, Input.my + 2, 'w', 2, 2); }
  else if (WGS.tip) wtext(WGS.tip, Input.mx + 8, Input.my - 12, 'w', 2, 0);
  if (pressed(wgKey('bag'), 'Escape') && WGS.cur) { wgInvAdd(WGS.inv, WGS.cur.id, WGS.cur.n); WGS.cur = null; }
}
function wgDrawChest() {
  dim(0.6); WGS.tip = '';
  const ch = WGS.chest, arr = wgCont(WGS.world, ch.dim, ch.tx, ch.ty, true);
  for (let i = 0; i < 27; i++) if (arr[i] === undefined) arr[i] = null;
  const x0 = 96, y0 = 22; panel(x0 - 8, y0 - 8, 204, 188);
  wtext('CHEST', x0, y0 - 2, 'Y', 1); wgSlotGrid(arr, x0, y0 + 10, 9, 27, 0);
  wtext('BACKPACK', x0, y0 + 74, 'Y', 1);
  wgSlotGrid(WGS.inv, x0, y0 + 86, 9, 27, 9); wgSlotGrid(WGS.inv, x0, y0 + 144, 9, 9, 0);
  WGS.world && (wgChunkAt(WGS.world, ch.dim, ch.tx, ch.ty).mod = true);
  if (Input.mouseHit && WGN.role) wgNetChest(ch.dim, ch.tx, ch.ty, arr);
  if (WGS.cur) { ctx.drawImage(wgIcon(WGS.cur.id), Input.mx - 8, Input.my - 8); if (WGS.cur.n > 1) wtext(String(WGS.cur.n), Input.mx + 8, Input.my + 2, 'w', 2, 2); }
  else if (WGS.tip) wtext(WGS.tip, Input.mx + 8, Input.my - 12, 'w', 2, 0);
}

function wgDrawSettings(ui, client) {
  panel(40, 14, 304, 164); wtext('SETTINGS', VW / 2, 20, 'Y', 3, 1);
  const S = Save.settings, m = WGS.world.meta, O = wgOpt(); m.rules = m.rules || {};
  const tabs = ['GAME', 'VIDEO', 'AUDIO', 'CONTROLS', 'ACCESS']; ui.tab = ui.tab || 'GAME';
  tabs.forEach((t, i) => { if (wgButton(ui, t, 46 + i * 59, 34, 56, { h: 12, off: ui.tab === t })) { ui.tab = t; ui.bind = null; } });
  const row = (label, val, y, fn) => { wtext(label, 54, y + 3, 'w', 1); if (wgButton(ui, val, 222, y, 112, { h: 12 })) fn(); };
  const onoff = (b) => b ? 'ON' : 'OFF';
  let y = 54;
  if (ui.tab === 'GAME') {
    if (client) wtext('THE HOST DECIDES THE WORLD RULES', VW / 2, y + 20, 'l', 1, 1);
    else {
      const D = [[420, 'SHORT DAYS'], [840, 'NORMAL DAYS'], [1680, 'LONG DAYS']], cur = m.rules.dayLen || 840;
      row('LENGTH OF A DAY', D.find(d => d[0] === cur) ? D.find(d => d[0] === cur)[1] : 'NORMAL DAYS', y, () => { const i = D.findIndex(d => d[0] === cur); m.rules.dayLen = D[(i + 1) % D.length][0]; }); y += 15;
      row('DIFFICULTY', WG_DIFF_NAME[m.diff] || 'NORMAL', y, () => { m.diff = WG_DIFF[(WG_DIFF.indexOf(m.diff) + 1) % 4]; }); y += 15;
      row('KEEP BACKPACK', onoff(m.rules.keepInv), y, () => { m.rules.keepInv = !m.rules.keepInv; }); y += 15;
      row('HOSTILE CREATURES', onoff(!m.rules.noMobs), y, () => { m.rules.noMobs = !m.rules.noMobs; }); y += 15;
      row('DAY AND NIGHT', onoff(!m.rules.noCycle), y, () => { m.rules.noCycle = !m.rules.noCycle; }); y += 15;
      const g = m.rules.grow === undefined ? 1 : m.rules.grow; row('CROP GROWTH', ['SLOW', 'NORMAL', 'FAST'][g], y, () => { m.rules.grow = (g + 1) % 3; }); y += 15;
    }
    row('HINTS', onoff(!m.hintDone), 144, () => { m.hintDone = !m.hintDone; });
  } else if (ui.tab === 'VIDEO') {
    row('PARTICLES', ['OFF', 'FEW', 'FULL'][O.part], y, () => { O.part = (O.part + 1) % 3; Save.write(); }); y += 15;
    row('AMBIENT LIFE', onoff(O.amb), y, () => { O.amb = O.amb ? 0 : 1; Save.write(); }); y += 15;
    row('RAIN AND SNOW', onoff(O.wx), y, () => { O.wx = O.wx ? 0 : 1; Save.write(); }); y += 15;
    row('SCREEN SHAKE', onoff(S.shake), y, () => { S.shake = !S.shake; Save.write(); }); y += 15;
    row('INFO (F3 STYLE)', onoff(O.info), y, () => { O.info = O.info ? 0 : 1; Save.write(); });
  } else if (ui.tab === 'AUDIO') {
    row('MUSIC', S.music + ' / 10', y, () => { S.music = (S.music + 1) % 11; Save.write(); }); y += 15;
    row('SOUND EFFECTS', S.sfx + ' / 10', y, () => { S.sfx = (S.sfx + 1) % 11; Save.write(); });
  } else if (ui.tab === 'CONTROLS') {
    ui.bind = ui.bind || null; WGU.bind = ui.bind ? (c) => { if (c !== 'Escape') O.keys[ui.bind] = c; ui.bind = null; Save.write(); } : null;
    WG_KEYS.forEach(([id, label], i) => { const yy = 52 + (i % 4) * 15, xx = i < 4 ? 0 : 148; wtext(label, 52 + xx, yy + 3, 'w', 0); if (wgButton(ui, ui.bind === id ? '...' : wgKeyName(wgKey(id)), 100 + xx, yy, 42, { h: 12 })) ui.bind = id; });
    wtext(ui.bind ? 'PRESS A KEY  (ESC CANCELS)' : 'CLICK A BUTTON, THEN PRESS A KEY', VW / 2, 118, ui.bind ? 'Y' : 'l', 1, 1);
    if (wgButton(ui, 'RESET KEYS', 130, 128, 124, { h: 12 })) { O.keys = {}; Save.write(); }
  } else if (ui.tab === 'ACCESS') {
    row('MARK HOSTILES', onoff(O.hc), y, () => { O.hc = O.hc ? 0 : 1; Save.write(); }); y += 15;
    row('SLOW GAME', ['100%', '75%', '50%'][O.slow], y, () => { O.slow = (O.slow + 1) % 3; Save.write(); }); y += 15;
    row('SCREEN SHAKE', onoff(S.shake), y, () => { S.shake = !S.shake; Save.write(); }); y += 15;
    row('BRIGHT COLOURS', onoff(S.bright), y, () => { S.bright = !S.bright; Save.write(); }); y += 15;
    wtext('SLOW GAME GIVES MORE TIME TO REACT.', VW / 2, y + 4, 'l', 0, 1);
  }
  if (wgButton(ui, 'DONE', 140, 158, 104, { h: 14 })) { ui.set = false; WGU.bind = null; }
}

function wgDrawFriends(ui) {
  panel(40, 14, 304, 164); wtext('PLAY WITH FRIENDS', VW / 2, 20, 'Y', 3, 1);
  if (!WGN.role) {
    const pm = wgnPerm(); WGU.hpw = WGU.hpw || { v: pm.pass, max: 12 };
    wtext('YOUR WORLD STAYS ON YOUR DEVICE.', VW / 2, 38, 'l', 1, 1); wtext('FRIENDS JOIN WHILE THIS GAME IS OPEN.', VW / 2, 48, 'l', 1, 1);
    wgField('PASSWORD (OPTIONAL)', WGU.hpw, 60, 70, 264);
    if (wgButton(ui, pm.white ? 'WHITELIST: ON' : 'WHITELIST: OFF', 60, 90, 264)) pm.white = pm.white ? 0 : 1;
    const open = (pub) => { pm.pass = wgnClean(WGU.hpw.v); WGU.edit = null; wgnHost(pub); };
    if (wgButton(ui, 'OPEN PRIVATE (CODE ONLY)', 60, 108, 264)) open(false);
    if (wgButton(ui, 'OPEN PUBLIC (LISTED)', 60, 126, 264)) open(true);
    if (wgButton(ui, 'CLOSE', 60, 150, 264)) ui.mp = false;
  } else {
    const pm = wgnPerm(), ps = WGN.peers.filter(q => q.pid > 0);
    wtext('CODE', VW / 2, 36, 'l', 1, 1); wtext(WGN.code, VW / 2, 45, 'Y', 3, 1);
    wtext((WGN.pub ? 'LISTED IN PUBLIC WORLDS' : 'PRIVATE: ONLY WITH THE CODE') + (pm.pass ? '  PASSWORD' : ''), VW / 2, 62, 'l', 1, 1);
    wtext('PLAYERS: YOU' + ps.map(q => ', ' + q.name).join(''), VW / 2, 74, 'w', 1, 1);
    for (let k = 0; k < 2; k++) { const q = ps[k]; if (wgButton(ui, q ? 'KICK ' + q.name : '-', 60 + k * 136, 88, 128, { off: !q })) wgnCmd('/KICK ' + q.name); }
    if (wgButton(ui, WGN.pub ? 'MAKE PRIVATE' : 'MAKE PUBLIC', 60, 106, 128)) { WGN.pub = !WGN.pub; }
    if (wgButton(ui, pm.white ? 'WHITELIST: ON' : 'WHITELIST: OFF', 196, 106, 128)) { pm.white = pm.white ? 0 : 1; if (pm.white) for (const q of ps) if (!pm.wl.includes(q.name)) pm.wl.push(q.name); }
    wtext('CHAT COMMANDS: ENTER, THEN /BAN NAME  /PASS WORD  /LIST', VW / 2, 126, 'L', 0, 1);
    if (wgButton(ui, 'CLOSE TO FRIENDS', 60, 136, 128)) { wgnStop(); ui.mp = false; }
    if (wgButton(ui, 'BACK', 196, 136, 128)) ui.mp = false;
  }
}

function wgDrawTrade() {
  dim(0.6); const ui = WGS.ui; wgUiBegin(ui);
  const tm = WGS.mobs.find(m => m.id === WGS.trade);
  if (!tm || Math.hypot(tm.x - WGS.p.x, tm.y - WGS.p.y) > 90 || pressed('Escape', wgKey('bag'))) { WGS.scr = 'play'; return; }
  panel(70, 24, 244, 160); wtext('TRADER', VW / 2, 31, 'Y', 3, 1); wtext('GIVE THIS, GET THAT', VW / 2, 45, 'l', 0, 1);
  wgTradesOf(tm.id).forEach(([a, an, b, bn], i) => {
    const y = 56 + i * 24, can = wgInvCount(WGS.inv, a) >= an;
    if (wgButton(ui, '', 80, y, 224, { h: 22, off: !can })) {
      wgInvTake(WGS.inv, a, an); const left = wgInvAdd(WGS.inv, b, bn); if (left) wgDrop(WGS.p.x, WGS.p.y, b, left); wgSfx('confirm'); wgToast('TRADED'); wgPart(tm.x, tm.y - 14, 6, { c: ['y', 'Y'], s: 24, up: 18 });
    }
    ctx.globalAlpha = can ? 1 : 0.5; ctx.drawImage(wgIcon(a), 90, y + 3); wtext(String(an), 107, y + 13, can ? 'w' : 'R', 2, 2); wtext('>', 160, y + 8, 'Y', 1, 1); ctx.drawImage(wgIcon(b), 200, y + 3); wtext(String(bn), 217, y + 13, 'w', 2, 2);
    wtext(tr(WGI[b].name), 232, y + 8, can ? 'w' : 'L', 0); ctx.globalAlpha = 1;
  });
  wgUiEnd(ui);
}
