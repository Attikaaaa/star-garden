'use strict';
// Wildgrove: entry point, screens (worlds, create, pause, inventory, chest), HUD and the play loop.
const WG_NAMES = ['SUNNY HOLLOW', 'MOSSY REACH', 'LANTERN FIELDS', 'WILD ACRES', 'COPPER VALE', 'FERN HAVEN', 'STAR MEADOW', 'OAKWARD'];
const WGT = { L: 'w', g: 'h', G: 'h', r: 'R', y: 'Y', o: 'O', m: 'l', x: '1', k: '0' };
function wtext(s, x, y, c, st, al) { text(s, x, y, WGT[c] || c, st, al); }
const WGU = { list: [], busy: false, msg: '', edit: null, create: null, mouse: false };

function enterWG() {
  if (!WGA.built) { wgBuildAll(); WGA.built = 1; }
  setState('wg'); WGS.scr = 'worlds'; WGS.ui = {}; WGU.msg = ''; wgRefreshList();
}
function wgRefreshList() { WGU.busy = true; wgStoreAll().then(l => { WGU.list = (l || []).map(r => r.meta).filter(m => !m.hidden).sort((a, b) => b.last - a.last); WGU.busy = false; }, () => { WGU.busy = false; WGU.msg = 'STORAGE IS BLOCKED IN THIS BROWSER'; }); }
function wgLeave() { WGS.world = null; WGS.scr = 'worlds'; wipe(() => setState('title')); }

// ---------- immediate mode buttons ----------
function wgUiBegin(ui) { ui.n = 0; ui.hit = -1; if (Input.mx !== ui.lmx || Input.my !== ui.lmy) { ui.moved = true; ui.lmx = Input.mx; ui.lmy = Input.my; } else ui.moved = false; if (pressed(...K_DOWN)) { ui.sel = ((ui.sel || 0) + 1) % Math.max(1, ui.cnt); Audio_.sfx('select'); } if (pressed(...K_UP)) { ui.sel = ((ui.sel || 0) + (ui.cnt || 1) - 1) % Math.max(1, ui.cnt); Audio_.sfx('select'); } ui.ok = pressed(...K_OK); }
function wgUiEnd(ui) { ui.cnt = ui.n; }
function wgButton(ui, label, x, y, w, o) {
  o = o || {};
  const i = ui.n++, h = o.h || 14, mx = Input.mx, my = Input.my;
  const inside = mx >= x && mx < x + w && my >= y && my < y + h;
  if (inside && ui.moved) ui.sel = i;
  const sel = ui.sel === i;
  const dis = o.off;
  const base = dis ? 'x' : sel ? 'Y' : '1';
  rect(x + 1, y, w - 2, h, '0'); rect(x, y + 1, w, h - 2, '0');
  rect(x + 1, y + 1, w - 2, h - 2, dis ? 'X' : sel ? 'o' : '2'); rect(x + 2, y + 2, w - 4, h - 4, dis ? 'x' : sel ? 'y' : base === '1' ? '1' : base);
  rect(x + 2, y + 2, w - 4, 1, dis ? 'X' : sel ? 'Y' : '3');
  wtext(label, x + w / 2, y + (h - 7) / 2 + 1, dis ? 'm' : sel ? '0' : 'w', sel && !dis ? 0 : 1, 1);
  const act = !dis && ((Input.mouseHit && inside) || (sel && ui.ok));
  if (act) { ui.sel = i; Audio_.sfx('confirm'); }
  return act;
}

// ---------- text field ----------
window.addEventListener('keydown', (e) => {
  const f = WGU.edit; if (!f || G.state !== 'wg') return;
  if (e.key === 'Backspace') f.v = f.v.slice(0, -1);
  else if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') { WGU.edit = null; }
  else if (e.key.length === 1 && f.v.length < f.max && /[A-Za-z0-9 _\-\/]/.test(e.key)) f.v += e.key.toUpperCase();
  else return;
  e.preventDefault(); e.stopPropagation();
}, true);
window.addEventListener('keydown', (e) => { if (WGU.bind && G.state === 'wg') { WGU.bind(e.code); e.preventDefault(); e.stopPropagation(); } }, true); // rebinding a key
function wgField(label, f, x, y, w) {
  const act = WGU.edit === f, inside = Input.mx >= x && Input.mx < x + w && Input.my >= y && Input.my < y + 14;
  if (Input.mouseHit) WGU.edit = inside ? f : (act ? null : WGU.edit);
  wtext(label, x, y - 8, 'l', 1);
  rect(x, y, w, 14, '0'); rect(x + 1, y + 1, w - 2, 12, act ? 'Y' : '3'); rect(x + 2, y + 2, w - 4, 10, '1');
  wtext(f.v + (act && Math.floor(WGS.t * 2) % 2 ? '_' : ''), x + 5, y + 4, act ? 'w' : 'L', 0);
}

// ---------- the world list ----------
function wgDrawBackdrop() { // a dusk sky over two mountain ridges, a moon, drifting clouds, hills with oaks and fireflies
  const t = performance.now() / 1000, X0 = -SCR.ox, X1 = VW + SCR.ox, Y0 = -SCR.oy, Y1 = VH + SCR.oy;
  const bands = ['1', 'v', 'V', 'p', 'P', 'R'];
  for (let k = 0; k < bands.length; k++) rect(X0, Y0 + Math.round((Y1 - Y0) * 0.62 * k / bands.length), X1 - X0, Math.ceil((Y1 - Y0) * 0.62 / bands.length) + 1, bands[k]);
  fillScreen('rgba(30,16,60,0.35)');
  for (let i = 0; i < 40; i++) { const x = (i * 97) % (VW + 40) - 20, y = (i * 53) % 110, tw = Math.sin(t * 2 + i) > 0.6; rect(x, y, 1, 1, tw ? 'w' : i % 3 ? '3' : '4'); }
  const mx = 340, my = 8; rect(mx, my, 16, 16, 'L'); rect(mx - 1, my + 2, 18, 12, 'L'); rect(mx + 2, my - 1, 12, 18, 'L'); rect(mx + 5, my + 4, 3, 3, 'l'); rect(mx + 9, my + 10, 4, 4, 'l'); rect(mx + 3, my + 11, 2, 2, 'l');
  for (let c = 0; c < 4; c++) { const x = Math.round((c * 131 + t * (3 + c)) % (VW + 90)) - 60, y = 40 + c * 18; rect(x, y, 34, 3, 'q'); rect(x + 6, y - 3, 20, 3, 'q'); rect(x + 2, y + 3, 28, 1, 'R'); }
  for (let x = X0; x < X1; x++) { const h = 128 + Math.round(Math.sin(x / 47) * 14 + Math.sin(x / 19) * 5); rect(x, h, 1, Y1 - h, 'd'); if (Math.sin(x / 47) > 0.55) rect(x, h, 1, 2, 'L'); }
  for (let x = X0; x < X1; x++) { const h = 142 + Math.round(Math.sin(x / 33 + 2) * 9 + Math.sin(x / 11) * 3); rect(x, h, 1, Y1 - h, 'X'); }
  for (let x = X0; x < X1; x++) { const h = 156 + Math.round(Math.sin(x / 31) * 6 + Math.sin(x / 13) * 3); rect(x, h, 1, Y1 - h, 'g'); rect(x, h, 1, 1, 'G'); }
  for (let i = 0; i < 9; i++) { if (i > 1 && i < 7) continue; const x = 20 + i * 45 + (i * 13) % 17; const l = wgObjSpr('oak', 0); if (l) ctx.drawImage(l, x, 156 - l.height + 14); }
  for (let i = 0; i < 14; i++) { const a = 0.5 + Math.sin(t * 2 + i * 1.7) * 0.5, x = Math.round((i * 61) % VW + Math.sin(t * 0.6 + i) * 6), y = 150 + (i * 29) % 50 + Math.round(Math.cos(t * 0.5 + i) * 4); ctx.globalAlpha = a; rect(x, y, 1, 1, 'Y'); ctx.globalAlpha = 1; }
}
function wgObjSpr(id, i) { const l = WGA.obj[id]; return l && l[i] ? l[i].c : null; }
// the music follows where you are: one tune per kind of place, a calmer one at night, a driving one for a boss
const WG_SONG = { meadow: 'meadow', forest: 'bloom', beach: 'beach', jungle: 'lantern', swamp: 'waltz', snow: 'snow', highland: 'snow', desert: 'sun', mountain: 'camp', volcano: 'forge', ocean: 'beach' };
function wgSong() {
  if (!WGS.world || ['worlds', 'create', 'join', 'browse'].includes(WGS.scr)) return 'meadow';
  if (WGS.mobs.some(m => WG_MOBS[m.type].boss && Math.hypot(m.x - WGS.p.x, m.y - WGS.p.y) < 220)) return 'boss';
  if (WGS.dim === 'k') return 'cloud';
  if (WGS.dim === 'u') return WGS.p.y > 4000 || Math.abs(WGS.p.x) > 4000 ? 'deep' : 'crystal';
  if (wgNight(WGS.clock) > 0.5) return 'moon';
  if (WGS.songT === undefined || WGS.t - WGS.songT > 2) { WGS.songT = WGS.t; WGS.songB = wgSurface(WGS.world.seed, Math.floor(WGS.p.x / 16), Math.floor(WGS.p.y / 16)).b; }
  return WG_SONG[WGS.songB] || 'meadow';
}
function updateWG(dt) {
  try { Audio_.play(wgSong()); } catch (e) { /* music is optional */ }
  if (!WGS.world && WGS.scr !== 'worlds' && WGS.scr !== 'create' && WGS.scr !== 'loading' && WGS.scr !== 'join' && WGS.scr !== 'browse') WGS.scr = 'worlds';
  WGS.t += dt; WGS.tf += dt;
  if (WGS.toast && (WGS.toast.t -= dt) <= 0) WGS.toast = null;
  wgnUpdate(dt);
  const s = WGS.scr;
  if (s === 'play') return wgPlayUpdate(dt);
  if (s === 'loading') return;
  if (s === 'dead') { WGS.deadT += dt; wgUpdateWorldBg(dt); return; }
  if (s === 'pause' || s === 'inv' || s === 'chest' || s === 'trade') { wgUpdateWorldBg(dt); if (s !== 'pause' && (pressed(wgKey('bag'), 'Escape', 'PadB', 'PadY'))) { WGS.scr = 'play'; Audio_.sfx('select'); } }
}
function wgUpdateWorldBg(dt) { for (const q of WGS.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.age += dt; } WGS.parts = WGS.parts.filter(q => q.age < q.life); }

function drawWG() {
  if (!WGS.world && WGS.scr !== 'worlds' && WGS.scr !== 'create' && WGS.scr !== 'loading' && WGS.scr !== 'join' && WGS.scr !== 'browse') WGS.scr = 'worlds';
  const s = WGS.scr;
  if (s === 'worlds') return wgDrawWorlds();
  if (s === 'create') return wgDrawCreate();
  if (s === 'join') return wgDrawJoin();
  if (s === 'browse') return wgDrawBrowse();
  if (s === 'loading') { wgDrawBackdrop(); wtext('LOADING THE WORLD...', VW / 2, VH / 2, 'w', 1, 1); return; }
  wgDrawPlay();
  if (s === 'pause') wgDrawPause();
  else if (s === 'inv') wgDrawInv();
  else if (s === 'chest') wgDrawChest();
  else if (s === 'trade') wgDrawTrade();
  else if (s === 'dead') wgDrawDead();
}

function wgDrawWorlds() {
  wgDrawBackdrop();
  const ui = WGS.ui; wgUiBegin(ui);
  wtext('WILDGROVE', VW / 2, 14, 'Y', 3, 1); wtext('A WORLD OF YOUR OWN', VW / 2, 30, 'L', 1, 1);
  const L = WGU.list, top = 46, rows = 4, off = Math.max(0, Math.min((ui.sel || 0) - rows + 1, L.length - rows));
  panel(60, top - 6, 264, rows * 22 + 8);
  if (!L.length) wtext(WGU.busy ? 'LOOKING FOR WORLDS...' : 'NO WORLDS YET. MAKE ONE!', VW / 2, top + 30, 'L', 1, 1);
  for (let k = 0; k < rows && off + k < L.length; k++) {
    const m = L[off + k], y = top + k * 22;
    if (wgButton(ui, '', 66, y, 252, { h: 20 })) { wgPlayWorld(m.id); return; }
    wtext(m.name, 74, y + 4, ui.sel === k + 0 && false ? '0' : 'w', 1);
    wtext('DAY ' + ((m.day || 0) + 1) + '  ' + Math.round((m.played || 0) / 60) + ' MIN', 74, y + 12, 'L', 0);
    const ic = WG_DIFF_NAME[m.diff] || 'NORMAL'; wtext(ic, 310, y + 4, 'l', 0, 2);
  }
  const by = top + rows * 22 + 6;
  if (wgButton(ui, 'NEW WORLD', 60, by, 84)) { WGU.create = { name: { v: WG_NAMES[Math.floor(Math.random() * WG_NAMES.length)], max: 16 }, seed: { v: '', max: 12 }, look: { skin: 0, hair: 0, shirt: 0 }, who: { v: wgMyName(), max: 10 }, peace: false }; WGS.scr = 'create'; WGS.ui = {}; return; }
  if (wgButton(ui, 'IMPORT', 150, by, 56)) wgPickImport((m) => { WGU.msg = m ? 'IMPORTED ' + m.name : 'THAT IS NOT A WORLD FILE'; wgRefreshList(); });
  const sel = L[ui.sel || 0];
  if (wgButton(ui, 'EXPORT', 212, by, 56, { off: !sel })) wgExport(sel.id).then(() => { WGU.msg = 'SAVED ' + sel.name + ' AS A FILE'; });
  if (wgButton(ui, 'DELETE', 274, by, 50, { off: !sel })) { if (WGU.del === sel.id) { wgStoreDel(sel.id).then(() => wgStoreDel('bak:' + sel.id)).then(wgRefreshList); WGU.del = null; WGU.msg = 'WORLD DELETED'; } else { WGU.del = sel.id; WGU.msg = 'PRESS DELETE AGAIN TO ERASE ' + sel.name; } }
  if (wgButton(ui, 'BACK', 60, by + 18, 84)) { wgLeave(); return; }
  if (wgButton(ui, 'JOIN WITH CODE', 150, by + 18, 84)) { WGU.code = { v: '', max: 5 }; WGU.edit = WGU.code; WGS.scr = 'join'; WGS.ui = {}; return; }
  if (wgButton(ui, 'PUBLIC WORLDS', 240, by + 18, 84)) { wgnBrowse(); WGS.scr = 'browse'; WGS.ui = {}; return; }
  if (pressed(...K_BACK)) { wgLeave(); return; }
  if (wgButton(ui, 'RESTORE OLDER SAVE', 60, by + 36, 264, { off: !sel })) { if (WGU.rest === sel.id) { wgRestoreBackup(sel.id, 0).then(ok => { WGU.msg = ok ? 'RESTORED THE OLDER SAVE' : 'NO OLDER SAVE YET'; wgRefreshList(); }); WGU.rest = null; } else { WGU.rest = sel.id; WGU.msg = 'PRESS AGAIN: ' + sel.name + ' GOES BACK TO AN OLDER SAVE'; } }
  wtext(WGU.msg, VW / 2, by + 56, 'l', 1, 1);
  wgUiEnd(ui);
}
function wgDrawCreate() {
  wgDrawBackdrop();
  const ui = WGS.ui, c = WGU.create; c.who = c.who || { v: wgMyName(), max: 10 }; wgUiBegin(ui);
  wtext('NEW WORLD', VW / 2, 8, 'Y', 3, 1);
  panel(72, 22, 240, 176);
  wgField('WORLD NAME', c.name, 84, 40, 216);
  wgField('SEED (EMPTY FOR RANDOM)', c.seed, 84, 66, 216);
  wgField('YOUR NAME', c.who, 84, 92, 216);
  wtext('YOUR HERO', 84, 110, 'l', 1);
  ctx.drawImage(wgPlayerSpr('d', 0, c.look), 276, 112);
  const cyc = (k, n, x, lab) => { if (wgButton(ui, lab + ' <>', x, 120, 52, { h: 12 })) c.look[k] = (c.look[k] + 1) % n; };
  cyc('skin', 3, 84, 'SKIN'); cyc('hair', 5, 142, 'HAIR'); cyc('shirt', 5, 200, 'SHIRT');
  c.diff = c.diff || 'survival';
  if (wgButton(ui, 'DIFFICULTY: ' + WG_DIFF_NAME[c.diff], 84, 138, 216, { h: 12 })) c.diff = WG_DIFF[(WG_DIFF.indexOf(c.diff) + 1) % 4];
  if (wgButton(ui, 'CREATE', 84, 160, 104)) { wgCreateWorld(c); return; }
  if (wgButton(ui, 'CANCEL', 196, 160, 104) || pressed('Escape') && !WGU.edit) { WGS.scr = 'worlds'; WGS.ui = {}; return; }
  wgUiEnd(ui);
}
function wgMyName() { try { return localStorage.wgName || 'WANDERER'; } catch (e) { return 'WANDERER'; } }
function wgHash(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h | 0; }
function wgCreateWorld(c) {
  const seed = c.seed.v.trim() ? (/^-?\d+$/.test(c.seed.v.trim()) ? parseInt(c.seed.v, 10) | 0 : wgHash(c.seed.v.trim())) : Math.floor(Math.random() * 2147483647);
  const meta = { id: 'w' + Date.now().toString(36), name: c.name.v.trim() || 'WORLD', seed, diff: c.diff || (c.peace ? 'peaceful' : 'survival'), created: Date.now(), last: Date.now(), played: 0, day: 0, ver: WG.VER };
  const w = wgNewWorld(meta); WGS.world = w; WGS.dim = 'o'; WGL.mine = meta.id;
  const sp = wgFindSpawn(w); w.spawn = { x: sp[0] * 16 + 8, y: sp[1] * 16 + 8, dim: 'o' };
  const p = wgNewPlayer(w.spawn.x, w.spawn.y); p.look = Object.assign({}, c.look); p.name = wgnClean(c.who && c.who.v) || 'WANDERER'; try { localStorage.wgName = p.name; } catch (e) { /* private mode */ } WGU.look = p.look; WGS.p = p;
  WGS.inv = wgInvNew(); WGS.sel = 0; WGS.clock = 0.3; WGS.day = 0; WGS.signs = {}; WGS.mobs = []; WGS.drops = []; WGS.parts = []; WGS.tf = 0; WGS.t = 0; WGS.cam.x = p.x; WGS.cam.y = p.y;
  WGS.scr = 'play'; WGS.readonly = false; wgToast('WELCOME TO ' + meta.name, 3); wgSaveNow();
}
function wgFindSpawn(w) {
  for (let r = 0; r < 60; r++) for (let a = 0; a < Math.max(1, r * 6); a++) {
    const t = a / Math.max(1, r * 6) * 6.283, x = Math.round(Math.cos(t) * r * 2), y = Math.round(Math.sin(t) * r * 2);
    const s = wgSurface(w.seed, x, y), g = GROUND[s.g];
    if (g.id !== 'grass' || wgObjAt(w, 'o', x, y)) continue;
    let ok = true; for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) { const gg = GROUND[wgSurface(w.seed, x + dx, y + dy).g]; if (gg.liq) { ok = false; break; } }
    if (ok) return [x, y];
  }
  return [0, 0];
}
function wgPlayWorld(id) {
  WGS.scr = 'loading';
  wgLockWorld(id).then(free => { if (!free) { WGS.scr = 'worlds'; WGU.msg = 'THIS WORLD IS OPEN IN ANOTHER TAB'; return null; } return wgStoreGet(id); }).then(rec => { if (rec === null) return; if (!rec) { WGS.scr = 'worlds'; return; } wgLoadRecord(rec); WGU.look = WGS.p.look; WGS.scr = 'play'; WGS.readonly = false; wgToast('WELCOME BACK', 2); }, () => { WGS.scr = 'worlds'; WGU.msg = 'COULD NOT OPEN THAT WORLD'; });
}

// ---------- playing ----------
function wgStations() {
  const p = WGS.p, tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16), set = { hand: 1 };
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const id = wgObjAt(WGS.world, WGS.dim, tx + dx, ty + dy); if (id && OBJ[id].st) set[OBJ[id].st] = 1; }
  if (set.furnace) set.fire = 1;
  return set;
}
function wgPlayUpdate(dt) {
  WGS.achT = (WGS.achT || 0) - dt; if (WGS.achT <= 0) { WGS.achT = 1; wgAchTick(); }
  dt *= [1, 0.75, 0.5][wgOpt().slow] || 1;
  const p = WGS.p, w = WGS.world;
  if (WGU.chatOpen && WGU.edit !== WGU.chatF) { if (WGU.chatF.v.trim()) { if (WGN.role === 'host' && WGU.chatF.v.trim()[0] === '/') { const r = wgnCmd(WGU.chatF.v); if (r) WGN.chat.push({ who: '', msg: r, t: 8 }); } else if (WGN.role === 'host') { const msg = WGU.chatF.v.trim(); WGN.chat.push({ who: p.name, msg, t: 8 }); wgnAll({ t: 'chat', who: p.name, msg }, null); } else wgnSend(WGN.link, { t: 'chat', msg: WGU.chatF.v.trim() }); } WGU.chatOpen = false; Input.hit = Object.create(null); }
  if (WGN.role && !WGU.chatOpen && pressed('Enter')) { WGU.chatF = { v: '', max: 50 }; WGU.edit = WGU.chatF; WGU.chatOpen = true; return wgPlayFrozen(dt); }
  if (WGU.chatOpen) return wgPlayFrozen(dt);
  if (pressed('Escape', 'PadStart')) { WGS.scr = 'pause'; WGS.ui = {}; Audio_.sfx('select'); return; }
  if (pressed(wgKey('bag'), 'PadY', 'Tab')) { WGS.scr = 'inv'; WGS.ui = { tab: 'craft' }; Audio_.sfx('select'); return; }
  if (WGS.photo === 2) { WGS.photo = 0; cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'wildgrove-' + Date.now() + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); wgToast('PHOTO SAVED', 2); }); }
  else if (WGS.photo === 1) WGS.photo = 2;
  if (pressed('F2')) WGS.photo = 1;
  for (let i = 0; i < 9; i++) if (pressed('Digit' + (i + 1))) WGS.sel = i;
  if (Input.wheel) { WGS.sel = (WGS.sel + (Input.wheel > 0 ? 1 : 8)) % 9; Input.wheel = 0; }
  if (pressed(wgKey('drop'))) { const s = WGS.inv[WGS.sel]; if (s) { wgDrop(p.x + (p.face === 'l' ? -14 : p.face === 'r' ? 14 : 0), p.y + (p.face === 'd' ? 12 : p.face === 'u' ? -12 : 0), s.id, 1, { delay: 1.2 }); wgInvTake(WGS.inv, s.id, 1); } }
  // time
  if (!(WGS.world.meta.rules || {}).noCycle) WGS.clock += dt / wgDayLen(); if (WGS.clock >= 1) { WGS.clock -= 1; WGS.day++; wgToast(WGS.day % 8 === 0 ? WG_SEASONS[wgSeason()] + ' BEGINS' : 'DAY ' + (WGS.day + 1), 2.5); }
  const Tt = Input.touch;
  if (Input.lastAim === 'touch') { WGS.touch = { mx: Tt.mx, my: Tt.my, act: !!Tt.aim, use: WGS.tapUse }; if (Tt.aim) { Input.mx = Tt.aim.x; Input.my = Tt.aim.y; } else if (WGS.tapAt) { Input.mx = WGS.tapAt[0]; Input.my = WGS.tapAt[1]; } WGS.tapUse = false; WGS.tapAt = null; } else WGS.touch = null;
  // movement
  if (WGS.dim === 'k' && GROUND[wgGround(w, 'k', Math.floor(p.x / 16), Math.floor(p.y / 16))].void) wgFallFromSky();
  const kd = (n, arrow) => Input.down[wgKey(n)] || Input.down[arrow];
  let mx = (kd('right', 'ArrowRight') ? 1 : 0) - (kd('left', 'ArrowLeft') ? 1 : 0), my = (kd('down', 'ArrowDown') ? 1 : 0) - (kd('up', 'ArrowUp') ? 1 : 0);
  if (WGS.touch) { mx += WGS.touch.mx; my += WGS.touch.my; }
  const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  const g = GROUND[wgGround(w, WGS.dim, Math.floor(p.x / 16), Math.floor(p.y / 16))];
  const run = (Input.down[wgKey('run')] || (wgKey('run') === 'ShiftLeft' && Input.down.ShiftRight)) && p.food > 3;
  let sp = 58 * (run ? 1.55 : 1) * g.speed * (p.buff.speed ? 1.3 : 1);
  if (g.slip) { p.vx += mx * sp * dt * 3; p.vy += my * sp * dt * 3; p.vx *= 0.985; p.vy *= 0.985; } else { p.vx *= 0.8; p.vy *= 0.8; }
  const kx = g.slip ? p.vx : mx * sp + p.vx, ky = g.slip ? p.vy : my * sp + p.vy;
  p.moving = !!(mx || my);
  wgMoveBox(p, kx * dt, 0, 4, 2); wgMoveBox(p, 0, ky * dt, 4, 2);
  if (p.moving) { p.walkT += dt * (run ? 11 : 8); if (Math.abs(mx) > Math.abs(my)) { p.face = mx > 0 ? 'r' : 'l'; } else if (my) p.face = my > 0 ? 'd' : 'u'; if (Math.floor(p.walkT) % 4 === 0 && WGS.stepT !== Math.floor(p.walkT)) { WGS.stepT = Math.floor(p.walkT); if (g.liq) wgPart(p.x, p.y, 1, { c: ['c', 'C', 'w'], s: 12, up: 8, life: 0.4 }); else { const dc = { grass: ['G', 'h', 'H'], jungle: ['g', 'G', 'h'], sand: ['a', 'A', 'e'], snow: ['w', 'l', 'L'], ice: ['C', 'w'], dirt: ['n', 'N', 'O'], path: ['n', 'N', 'O'], mud: ['u', 'n', 'N'], tilled: ['u', 'n', 'N'], rock: ['m', 'l', 'd'], ash: ['X', 'm', 'd'], cave: ['X', 'm', 'd'], moss: ['g', 'G', 'm'] }[g.id]; if (dc) wgPart(p.x, p.y, run ? 3 : 2, { c: dc, s: 16, up: 7, life: 0.35 }); } } }
  // aim: mouse (or the facing tile with keys)
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  let ax, ay;
  if (Input.lastAim === 'mouse' || (Input.lastAim === 'touch' && WGS.touch && (WGS.touch.act || WGS.touch.use))) { ax = Input.mx + cx0; ay = Input.my + cy0; if (Input.lastAim === 'mouse') { const a = Math.atan2(ay - (p.y - 8), ax - p.x); if (!p.moving) p.face = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'r' : 'l') : (Math.sin(a) > 0 ? 'd' : 'u'); } }
  else { const f = { d: [0, 1], u: [0, -1], l: [-1, 0], r: [1, 0] }[p.face]; ax = p.x + f[0] * 20; ay = p.y - 4 + f[1] * 20; }
  WGS.aim = Math.atan2(ay - (p.y - 8), ax - p.x);
  let ttx = Math.floor(ax / 16), tty = Math.floor(ay / 16);
  const d = Math.hypot(ttx * 16 + 8 - p.x, tty * 16 + 8 - (p.y - 4));
  WGS.target = d <= WG_REACH ? { tx: ttx, ty: tty } : null;
  // act
  const lmb = Input.mouseDown && Input.lastAim === 'mouse' || Input.down.Space || Input.down.KeyJ || WGS.touch && WGS.touch.act;
  const rmb = Input.rHit || pressed(wgKey('use'), 'KeyK') || (WGS.touch && WGS.touch.use);
  p.swingCd = Math.max(0, (p.swingCd || 0) - dt); p.swing = Math.max(0, p.swing - dt); p.hurt = Math.max(0, p.hurt - dt); p.inv = Math.max(0, p.inv - dt);
  const held = wgHeld();
  if (lmb) {
    const tgt = WGS.target, o = tgt && wgObjAt(w, WGS.dim, tgt.tx, tgt.ty);
    if (o && !(held && held.kind === 'weapon')) wgMineStep(dt, tgt.tx, tgt.ty);
    else { WGS.mine = null; wgPlayerAttack(); }
  } else WGS.mine = null;
  if (rmb && WGS.target) {
    if (held && held.kind === 'food' && !wgObjAt(w, WGS.dim, WGS.target.tx, WGS.target.ty)) wgEat(WGS.sel);
    else if (!wgUse(WGS.target.tx, WGS.target.ty) && held && held.kind === 'food') wgEat(WGS.sel);
  } else if (rmb && held && held.kind === 'food') wgEat(WGS.sel);
  const F = WGS.fish;
  if (F) { const h2 = WGS.inv[WGS.sel]; if (!h2 || h2.id !== 'rod' || Math.hypot(F.tx * 16 + 8 - p.x, F.ty * 16 + 8 - p.y) > 90) { WGS.fish = null; wgToast('THE LINE SNAPPED BACK'); } else if ((F.t -= dt) <= 0) { WGS.fish = null; if (wgInvAdd(WGS.inv, 'fish', 1)) wgDrop(p.x, p.y, 'fish', 1); wgToast('CAUGHT A FISH!', 2); wgSfx('item'); wgPart(F.tx * 16 + 8, F.ty * 16 + 8, 8, { c: ['c', 'C', 'w'], s: 30, up: 30, life: 0.5 }); } }
  // hunger and health
  const burn = (p.moving ? (run ? 0.06 : 0.02) : 0.004) * dt;
  if (p.sat > 0) p.sat = Math.max(0, p.sat - burn * 4); else p.food = Math.max(0, p.food - burn * 4);
  WGS.hungerT = (WGS.hungerT || 0) + dt;
  if (WGS.hungerT > 1) { WGS.hungerT = 0; if (p.food <= 0) { if (p.hp > 1) { p.hp -= 1; wgSfx('hurt'); } } else if (p.food >= 15 && p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + 1); p.food -= 0.3; } }
  if (g.hurt) { WGS.lavaT = (WGS.lavaT || 0) - dt; if (WGS.lavaT <= 0) { WGS.lavaT = 0.5; wgHurtPlayer(3, p.x, p.y + 4); } }
  for (const k in p.buff) if ((p.buff[k] -= dt) <= 0) delete p.buff[k];
  wgWeatherTick(dt); wgHintTick(dt);
  // world
  wgUpdateDrops(dt);
  if (WGS.world.meta.diff !== 'peaceful') { wgMobSpawnTick(dt); wgUpdateMobs(dt); wgUpdateShots(dt); } else WGS.mobs = WGS.mobs.filter(m => WG_MOBS[m.type].pas), wgUpdateMobs(dt);
  if (!(WGN.role === 'client')) wgGrowTick(dt);
  wgUpdateWorldBg(dt);
  if (p.hp <= 0 && WGS.scr === 'play') wgDie();
  // camera
  cam.x += (p.x - cam.x) * Math.min(1, dt * 8); cam.y += (p.y - 8 - cam.y) * Math.min(1, dt * 8);
  if (WGS.shake) WGS.shake = Math.max(0, WGS.shake - dt);
  // streaming: forget far chunks
  WGS.sweep = (WGS.sweep || 0) - dt; if (WGS.sweep < 0) { WGS.sweep = 4; wgSweepChunks(); }
  WGS.autosave -= dt; if (WGS.autosave <= 0) { WGS.autosave = 30; wgSaveNow(); }
}
function wgPlayFrozen(dt) { wgUpdateDrops(dt); wgUpdateWorldBg(dt); WGS.p.moving = false; }
function wgGrowTick(dt) {
  WGS.growT = (WGS.growT || 0) - dt; if (WGS.growT > 0) return; WGS.growT = 1;
  const w = WGS.world, CS = WG.CS;
  for (const [key, ch] of w.chunks) {
    if (ch.dim !== WGS.dim && key[0] !== WGS.dim) continue;
    for (let n = 0; n < 6; n++) {
      const k = Math.floor(Math.random() * CS * CS), id = ch.o[k]; if (!id) continue;
      const o = OBJ[id]; if (!o) continue;
      const tx = ch.cx * CS + k % CS, ty = ch.cy * CS + Math.floor(k / CS);
      if (o.kind === 'crop' && ch.m[k] < 3) { const wet = WGS.weather || (WGS.wet && WGS.wet.has(WGS.dim + tx + ',' + ty)); if (Math.random() < (wet ? 2 : 1) * ([0.5, 1, 2][(WGS.world.meta.rules || {}).grow === undefined ? 1 : WGS.world.meta.rules.grow]) / CROP[o.crop] * CS * CS / 6) { ch.o[k] = id; ch.m[k]++; ch.mod = ch.artDirty = true; } }
      else if (o.ripe && Math.random() < 0.02) { wgSetObj(w, WGS.dim, tx, ty, O_ID[o.ripe]); }
      else if (o.kind === 'sapling' && Math.random() < 0.01) { const t = O_ID[o.grow === 'oak' ? 'oak' : o.grow]; if (t) wgSetObj(w, WGS.dim, tx, ty, t); }
    }
    for (let k = 0; k < CS * CS; k++) { // machines tick every second
      const id = ch.o[k]; if (!id || !OBJ[id].tick) continue; const o = OBJ[id], tx = ch.cx * CS + k % CS, ty = ch.cy * CS + Math.floor(k / CS);
      if (o.kind === 'hive' && ch.m[k] < 4 && Math.random() < 1 / 70) { ch.m[k]++; ch.mod = true; }
      else if (o.kind === 'sprinkler') { WGS.wet = WGS.wet || new Map(); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) WGS.wet.set(WGS.dim + (tx + dx) + ',' + (ty + dy), WGS.t + 45); }
    }
  }
}
function wgSweepChunks() {
  const w = WGS.world, p = WGS.p, CS = WG.CS; if (w.chunks.size < 60) return;
  for (const [k, ch] of w.chunks) {
    const dx = ch.cx * CS * 16 + CS * 8 - p.x, dy = ch.cy * CS * 16 + CS * 8 - p.y;
    if (Math.hypot(dx, dy) > CS * 16 * 3.2 || ch.dim !== WGS.dim) { if (ch.mod) { w.saved = w.saved || new Map(); w.saved.set(k, wgPackChunk(ch)); } w.chunks.delete(k); }
  }
}
// ---------- player drawing ----------
function wgDrawPlayer(e, cx0, cy0) {
  if (e.p.hidden) return;
  const p = e.p, sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0), face = p.face === 'r' ? 'l' : p.face;
  const fr = p.moving ? Math.floor(p.walkT) % 4 : 0, wade = GROUND[wgGround(WGS.world, WGS.dim, Math.floor(p.x / 16), Math.floor(p.y / 16))].liq;
  shadow(sx, sy, 10);
  if (p.inv > 0 && Math.floor(WGS.t * 20) % 2) return;
  const spr = wgPlayerSpr(face, fr, p.look || { skin: 0, hair: 0, shirt: 0 });
  ctx.save(); ctx.translate(sx, sy - 24); if (p.face === 'r') ctx.scale(-1, 1);
  ctx.drawImage(spr, 0, 0, 18, 26, -9, 0, 18, wade ? 18 : 26);
  ctx.restore();
  if (wade) { const t = Math.floor(WGS.t * 4) % 2; rect(sx - 8, sy - 7, 16, 1, 'C'); rect(sx - 9 + t, sy - 6, 18 - t * 2, 2, 'c'); }
  // the held tool, swinging
  const h = e.p === WGS.p ? wgHeld() : null;
  if (h && !wade) {
    const ic = wgIcon(h.id), sw = p.swing > 0 ? Math.round(Math.sin(p.swing / 0.25 * 3.1) * 5) : 0, side = p.face === 'l' ? -1 : 1;
    const hx = p.face === 'u' ? sx + 6 : p.face === 'd' ? sx - 8 : sx + side * 7 - 8, hy = sy - 18 + (p.face === 'u' ? -2 : 0) - sw;
    if (h.kind === 'tool' || h.kind === 'weapon' || h.kind === 'place' || h.kind === 'food' || h.kind === 'seed') { ctx.save(); ctx.globalAlpha = 1; ctx.drawImage(ic, hx - 2, hy - 2); ctx.restore(); }
  }
  if (p.name && e.p !== WGS.p) wtext(p.name, sx, sy - 32, 'w', 2, 1);
}

// ---------- touch ----------
// Left thumb walks, right thumb aims: hold to mine or fight, a short tap uses. The round buttons sit at the edges.
function wgTouchBtns() {
  const l = -SCR.ox, r = -SCR.ox + SCR.w, t = -SCR.oy, b = -SCR.oy + SCR.h;
  return { use: [r - 30, b - 52, 15], bag: [r - 20, t + 56, 11], pause: [l + 16, t + 16, 10] };
}
function wgTouchDown(x, y, e) {
  const B = wgTouchBtns(), hit = (q) => Math.hypot(x - q[0], y - q[1]) <= q[2] + 4, T = Input.touch;
  if (hit(B.pause)) { WGS.scr = 'pause'; WGS.ui = {}; return; }
  if (hit(B.bag)) { WGS.scr = 'inv'; WGS.ui = { tab: 'craft' }; return; }
  if (hit(B.use)) { WGS.tapUse = true; WGS.tapAt = null; return; }
  const by = -SCR.oy + SCR.h - 22, bx = Math.round((-SCR.ox + SCR.w / 2) - 9 * 19 / 2);
  if (y >= by - 2 && y < by + 20) { Input.mx = x; Input.my = y; Input.mouseHit = true; return; }
  const s = { id: e.pointerId, ox: x, oy: y, x, y, t: performance.now() };
  if (x + SCR.ox < SCR.w / 2) { if (!T.move) T.move = s; } else if (!T.aim) T.aim = s;
}
function wgTouchTap(s) { if (performance.now() - s.t < 220 && Math.hypot(s.x - s.ox, s.y - s.oy) < 6) { WGS.tapUse = true; WGS.tapAt = [s.x, s.y]; } }
function wgDrawTouch() {
  const T = Input.touch, B = wgTouchBtns();
  for (const s of [T.move, T.aim]) if (s) { ctx.globalAlpha = 0.35; rect(Math.round(s.ox) - 16, Math.round(s.oy) - 16, 32, 32, '1'); rect(Math.round(s.x) - 6, Math.round(s.y) - 6, 12, 12, 'w'); ctx.globalAlpha = 1; }
  const dot = (q, lab, col) => { ctx.globalAlpha = 0.75; rect(q[0] - q[2], q[1] - q[2] + 2, q[2] * 2, q[2] * 2 - 4, '0'); rect(q[0] - q[2] + 2, q[1] - q[2], q[2] * 2 - 4, q[2] * 2, '0'); rect(q[0] - q[2] + 1, q[1] - q[2] + 3, q[2] * 2 - 2, q[2] * 2 - 6, col); rect(q[0] - q[2] + 3, q[1] - q[2] + 1, q[2] * 2 - 6, q[2] * 2 - 2, col); ctx.globalAlpha = 1; wtext(lab, q[0], q[1] - 3, 'w', 1, 1); };
  dot(B.use, 'USE', '2'); dot(B.bag, 'BAG', '2'); dot(B.pause, 'II', '1');
}

// ---------- joining ----------
function wgDrawJoin() {
  wgDrawBackdrop();
  WGU.code = WGU.code || { v: '', max: 5 };
  const ui = WGS.ui; wgUiBegin(ui);
  wtext('JOIN A WORLD', VW / 2, 14, 'Y', 3, 1);
  panel(72, 40, 240, 110);
  WGU.pw = WGU.pw || { v: '', max: 12 };
  wgField('FRIEND CODE (5 LETTERS)', WGU.code, 84, 62, 100); wgField('PASSWORD (IF ANY)', WGU.pw, 196, 62, 104);
  wtext(WGN.status || WGN.err || 'ASK YOUR FRIEND FOR THEIR CODE', VW / 2, 90, WGN.err ? 'R' : 'L', 1, 1);
  const c = WGU.code.v.trim();
  if (wgButton(ui, 'CONNECT', 84, 108, 104, { off: c.length < 5 || !!WGN.status }) || (c.length === 5 && pressed('Enter') && !WGN.status && !WGU.edit && ui.armed)) { WGU.edit = null; WGN.pw = WGU.pw.v.trim(); wgnJoin(c); }
  ui.armed = true;
  if (wgButton(ui, 'BACK', 196, 108, 104)) { wgnStop(); WGN.err = ''; WGN.status = ''; WGS.scr = 'worlds'; WGS.ui = {}; return; }
  wgUiEnd(ui);
}
function wgDrawBrowse() {
  wgDrawBackdrop();
  const ui = WGS.ui; wgUiBegin(ui);
  wtext('PUBLIC WORLDS', VW / 2, 14, 'Y', 3, 1);
  panel(52, 34, 280, 124);
  if (!WGN.listing && (!WGN.listT || performance.now() - WGN.listT > 14000)) wgnBrowse(); // keeps looking while you are on this screen
  const L = WGN.list;
  if (!L.length) wtext(WGN.listing ? 'LOOKING FOR OPEN WORLDS...' : 'NO OPEN WORLDS RIGHT NOW', VW / 2, 90, 'L', 1, 1);
  for (let k = 0; k < Math.min(5, L.length); k++) {
    const d = L[k], y = 40 + k * 22;
    if (wgButton(ui, '', 58, y, 268, { h: 20 })) { WGU.code = { v: d.c, max: 5 }; WGS.scr = 'join'; WGS.ui = {}; return; }
    wtext(d.n, 66, y + 4, 'w', 1); wtext('HOST ' + (d.h || '?') + '  ' + (d.d === 'peaceful' ? 'PEACEFUL' : 'SURVIVAL'), 66, y + 12, 'L', 0);
    wtext(d.p + '/' + d.x + (d.k ? ' LOCKED' : ''), 318, y + 7, d.k ? 'Y' : 'h', 1, 2);
  }
  if (wgButton(ui, 'REFRESH', 52, 164, 84, { off: WGN.listing })) { WGN.seen = new Map(); wgnBrowse(); }
  if (wgButton(ui, 'BACK', 248, 164, 84)) { WGS.scr = 'worlds'; WGS.ui = {}; return; }
  wgUiEnd(ui);
}
function wgDrawChat() {
  const L = -SCR.ox, B = -SCR.oy + SCR.h;
  if (WGN.role === 'client' && WGN.ping !== undefined) wtext('PING ' + WGN.ping, -SCR.ox + SCR.w - 4, -SCR.oy + SCR.h - 10, WGN.ping < 150 ? 'h' : 'Y', 0, 2);
  let y = B - 60 - (WGU.chatOpen ? 0 : 0);
  for (const c of WGN.chat) { wtext((c.who ? c.who + ': ' : '') + c.msg, L + 6, y, c.who ? 'w' : 'Y', 2, 0); y += 9; }
  if (WGU.chatOpen) { const f = WGU.chatF; rect(L + 4, B - 14, 150, 11, '0'); rect(L + 5, B - 13, 148, 9, '1'); wtext(f.v + (Math.floor(WGS.t * 2) % 2 ? '_' : ''), L + 8, B - 12, 'w', 0); }
}

// ---------- weather: now and then it rains (snow in the cold), rain waters the fields ----------
function wgWeatherTick(dt) {
  if (WGN.role === 'client') { const k = WGS.weather ? WGS.weather.kind : null; WGS.weather = WGS.wk ? { kind: 'rain', dark: WGS.wk === 'storm' ? 0.26 : 0.12, wind: 0.6, storm: WGS.wk === 'storm' } : null; wgStormTick(dt); return; }
  if (WGS.dim !== 'o') return;
  WGS.wxT = (WGS.wxT === undefined ? 90 + Math.random() * 120 : WGS.wxT) - dt;
  if (WGS.wxT <= 0) {
    if (WGS.weather) { WGS.weather = null; WGS.wk = null; WGS.wxT = 150 + Math.random() * 240; wgToast('THE RAIN STOPS', 2); }
    else { const st = Math.random() < 0.3; WGS.weather = { kind: 'rain', dark: st ? 0.26 : 0.12, wind: 0.6, storm: st }; WGS.wk = st ? 'storm' : 'rain'; WGS.wxT = 50 + Math.random() * 70; wgToast(st ? 'A STORM ROLLS IN' : 'IT STARTS TO RAIN', 2); }
  }
  wgStormTick(dt);
}
function wgStormTick(dt) { // lightning, then thunder a moment later
  const W = WGS.weather; if (!W || !W.storm || WGS.dim !== 'o') { WGS.flash = 0; return; }
  WGS.ltT = (WGS.ltT === undefined ? 4 : WGS.ltT) - dt; WGS.flash = Math.max(0, (WGS.flash || 0) - dt * 3.5);
  if (WGS.ltT <= 0) { WGS.ltT = 4 + Math.random() * 9; WGS.flash = 1; WGS.thunder = 0.3 + Math.random() * 1.2; }
  if (WGS.thunder > 0 && (WGS.thunder -= dt) <= 0) { WGS.thunder = 0; wgSfx('boom'); WGS.shake = Math.max(WGS.shake || 0, 0.12); }
}
function wgDrawWeatherFX() {
  const W = WGS.weather; if (!W || WGS.dim !== 'o' || !wgOpt().wx) return;
  const p = WGS.p, g = GROUND[wgGround(WGS.world, 'o', Math.floor(p.x / 16), Math.floor(p.y / 16))], snow = g.id === 'snow' || g.id === 'ice', l = -SCR.ox, t = -SCR.oy, w = SCR.w, h = SCR.h, T = WGS.t;
  const n = (IS_TOUCH ? 40 : 70) * (W.storm ? 2 : 1);
  if (W.storm && WGS.flash > 0) fillScreen('rgba(235,240,255,' + (WGS.flash * 0.5).toFixed(2) + ')');
  for (let i = 0; i < n; i++) {
    const sp = snow ? 22 + (i % 5) * 4 : 150 + (i % 4) * 20, x = (i * 53.7 + T * (snow ? 6 : -30) + Math.sin(T + i) * (snow ? 6 : 0)) % w, y = (i * 97.1 + T * sp) % h;
    const X = Math.round(l + (x + w) % w), Y = Math.round(t + y);
    if (snow) rect(X, Y, 1 + (i % 2), 1 + (i % 2), 'w'); else { rect(X, Y, 1, 3, i % 3 ? 'c' : 'C'); }
  }
  if (!snow && Math.floor(T * 2) % 2 && Math.random() < 0.02) { /* a drip on the ground */ }
}
// ---------- first steps: a few hints that disappear once done ----------
const WG_HINTS = [
  ['WALK WITH WASD OR THE LEFT STICK', () => WGS.p.moving],
  ['HOLD LEFT CLICK ON A TREE TO CHOP IT', () => wgInvCount(WGS.inv, 'wood') > 0],
  ['PRESS E: MAKE STICKS AND A WORKBENCH', () => wgInvCount(WGS.inv, 'bench') > 0 || WGS.hintBench],
  ['SELECT THE BENCH, RIGHT CLICK TO PLACE IT', () => WGS.hintBench],
  ['STAND NEXT TO IT AND PRESS E: CRAFT A PICKAXE', () => wgInvCount(WGS.inv, 'pick_wood') > 0 || wgInvCount(WGS.inv, 'axe_wood') > 0],
  ['NIGHT IS DANGEROUS. TORCHES AND A WALL KEEP YOU SAFE', () => WGS.day >= 1],
];
function wgHintTick(dt) {
  const m = WGS.world.meta; if (m.hintDone) return;
  m.hint = m.hint || 0; const H = WG_HINTS[m.hint];
  if (!H) { m.hintDone = 1; return; }
  if (H[1]()) { m.hint++; WGS.hintT = 0; return; }
  WGS.hintT = (WGS.hintT || 0) + dt;
  if (!WGS.hintBench && wgStations().bench) WGS.hintBench = 1;
}

// ---------- dedicated server: tools/wg-server.mjs opens the game with ?wgserver=NAME in a headless browser ----------
(function () {
  const q = new URLSearchParams(location.search); if (!q.has('wgserver')) return;
  const t = setInterval(() => { if (typeof G === 'object' && typeof Save !== 'undefined' && G.state) { clearInterval(t); wgServerBoot(q); } }, 300);
})();
function wgServerBoot(q) {
  const name = (q.get('wgserver') || 'SERVER').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 16) || 'SERVER';
  Save.settings.music = 0; Save.settings.sfx = 0; Save.settings.muted = true;
  enterWG();
  wgStoreAll().then(list => {
    const ex = (list || []).find(r => r.meta.name === name);
    if (ex) wgLoadRecord(ex);
    else {
      wgCreateWorld({ name: { v: name }, seed: { v: q.get('seed') || '' }, look: { skin: 0, hair: 0, shirt: 0 }, who: { v: 'SERVER' }, peace: q.get('peaceful') === '1' });
    }
    WGS.server = true; WGS.p.hidden = true; WGS.p.name = 'SERVER'; WGS.scr = 'play'; WGS.readonly = false; WGU.look = WGS.p.look;
    wgnHost(q.get('pub') === '1', (q.get('code') || '').toUpperCase().slice(0, 5) || undefined);
    { const pm = wgnPerm(); if (q.get('pass')) pm.pass = wgnClean(q.get('pass')); if (q.get('white')) { pm.white = 1; pm.wl = q.get('white').split(',').map(wgnClean).filter(Boolean); } }
    console.log('WILDGROVE SERVER ' + name + ' CODE ' + WGN.code);
  });
}
