'use strict';
// HUD, minimap, banners, menus and full screens.

function panel(x, y, w, h) {
  x = Math.round(x); y = Math.round(y);
  rect(x + 1, y, w - 2, h, '0');
  rect(x, y + 1, w, h - 2, '0');
  rect(x + 1, y + 1, w - 2, h - 2, '1');
  rect(x + 2, y + 1, w - 4, 1, '2');
  rect(x + 1, y + 2, 1, h - 4, '2');
}
function dim(a) { ctx.fillStyle = 'rgba(43,26,71,' + a + ')'; ctx.fillRect(0, 0, VW, VH); }

// ---------- HUD ----------
function drawHUD() {
  const p = G.player;
  const hearts = Math.ceil(p.maxHp / 2);
  const low = p.hp <= 2 && p.maxHp > 2 && !p.dead, beat = low && (G.beatT || 0) > 0.95;
  const flash = G.hud.heartT > 0 && Math.floor(G.hud.heartT * 20) % 2 ? 2 : 0;
  for (let i = 0; i < hearts; i++) {
    const v = p.hp - i * 2;
    const x = 5 + (i % 10) * 10, y = 3 + Math.floor(i / 10) * 9 - (beat && v > 0 ? 1 : 0);
    drawS(S('heart_empty'), x, y);
    if (v >= 2) drawS(S('heart'), x, y, flash);
    else if (v === 1) drawS(S('heart_half'), x, y, flash);
  }
  const cy = hearts > 10 ? 22 : 14, bump = G.hud.coinT > 0.1 ? 1 : 0;
  drawS(S('coin_0'), 5, cy - bump);
  text(String(p.coins), 16, cy + 1 - bump, G.hud.coinT > 0 ? 'w' : 'Y', 2);
  if (p.shieldUp) drawS(S('icon_shield'), 20 + textW(String(p.coins)), cy - 4);
  // Starfall meter
  const my = cy + 11, full = p.charge >= 1, blink = full && Math.floor(G.time * 4) % 2;
  drawS(S(full ? 'shot_' + (Math.floor(G.time * 8) % 2) : 'shot_0'), 5, my - 1);
  rect(14, my, 26, 5, '0');
  rect(15, my + 1, Math.round(24 * p.charge), 3, full ? (blink ? 'w' : 'Y') : 'c');
  if (full) text(Input.lastAim === 'pad' ? 'RB' : Input.lastAim === 'touch' ? '' : 'Q', 44, my - 1, 'Y', 2);
  drawCombo();
  drawMinimap();
  if (G.boss && !G.boss.dead && G.boss.state !== 'intro') {
    const b = G.boss, w = 120, x = (VW - w) / 2, y = 15;
    rect(x - 1, y - 1, w + 2, 6, '0');
    rect(x, y, w, 4, '1');
    const f = Math.max(0, Math.round(w * b.hp / b.maxHp));
    rect(x, y, f, 4, 'P');
    rect(x, y, f, 1, 'q');
    text(G.floor.land.bossName, VW / 2, 3, 'w', 2, 1);
  }
  G.tipRect = null;
  if (G.state !== 'play') return;
  const o = nearestProp();
  if (o && !G.trans && !G.warp) drawPropTip(o);
  if (G.banner) drawBanner();
  if (G.floorBanner) {
    const b = G.floorBanner, a = Math.min(1, b.t * 2, (2.8 - b.t) * 3);
    if (a > 0.05) {
      const y = 70 - Math.round((1 - a) * 8);
      text(b.small, VW / 2, y - 12, 'c', 2, 1);
      text(b.text, VW / 2, y, 'Y', 2, 1);
      const w = textW(b.text) + 24;
      rect(VW / 2 - w / 2, y + 12, w, 1, 'Y');
      rect(VW / 2 - w / 2 + 4, y + 14, w - 8, 1, 'o');
    }
  }
}

function drawCombo() {
  const c = G.combo, y = G.boss ? 26 : 28;
  if (c.n >= 2 && c.t > 0) {
    const big = c.n >= 8;
    text('COMBO X' + c.n, VW / 2, y, big ? 'P' : 'Y', 2, 1);
    const w = Math.round(44 * c.t / COMBO_T);
    rect(VW / 2 - 23, y + 10, 46, 3, '0');
    rect(VW / 2 - 22, y + 11, w, 1, big ? 'P' : 'Y');
  } else if (G.comboPop && G.comboPop.bonus) {
    const k = G.comboPop.t;
    text('COMBO X' + G.comboPop.n + '  +' + G.comboPop.bonus + ' COINS', VW / 2, y - Math.round((1.6 - k) * 6), 'Y', 2, 1);
  }
}
function drawMinimap() {
  const rooms = G.floor.rooms;
  let minx = 9, maxx = -1, miny = 9, maxy = -1;
  for (const r of rooms) if (r.seen) { minx = Math.min(minx, r.gx); maxx = Math.max(maxx, r.gx); miny = Math.min(miny, r.gy); maxy = Math.max(maxy, r.gy); }
  const cw = 8, ch = 6;
  const W = (maxx - minx + 1) * cw + 3, H = (maxy - miny + 1) * ch + 3;
  const x0 = VW - W - 4, y0 = 3;
  ctx.fillStyle = 'rgba(43,26,71,0.55)';
  ctx.fillRect(x0 - 1, y0 - 1, W + 2, H + 2);
  for (const r of rooms) {
    if (!r.seen) continue;
    const x = x0 + 2 + (r.gx - minx) * cw, y = y0 + 2 + (r.gy - miny) * ch;
    const cur = r === G.room;
    rect(x, y, cw - 1, ch - 1, cur ? 'w' : r.visited ? '4' : '2');
    if (r.visited) rect(x, y + ch - 2, cw - 1, 1, cur ? 'l' : '3');
    const ic = MM_ICON[r.type];
    if (ic && !(r.type === 'item' && r.visited && !r.props.length)) drawS(S(ic), x + 1, y);
  }
}

// On-screen sticks and buttons for touch play.
const T_BASE = 'rgba(255,255,255,0.16)', T_KNOB = 'rgba(255,255,255,0.45)', T_BTN = 'rgba(43,26,71,0.55)';
function tCircle(x, y, r, col) { const d = r * 2; ctx.drawImage(ellipseSprite(d, d, col), Math.round(x - r), Math.round(y - r)); }
function drawTouch() {
  const T = Input.touch;
  const stick = (s, hx, hy) => {
    if (!s) { tCircle(hx, hy, STICK_R, T_BASE); return; }
    tCircle(s.ox, s.oy, STICK_R, T_BASE);
    const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), k = d > STICK_R ? STICK_R / d : 1;
    tCircle(s.ox + dx * k, s.oy + dy * k, 8, T_KNOB);
  };
  stick(T.move, 40, VH - 44);
  stick(T.aim, VW - 104, VH - 48);
  const b = TOUCH_BTN, p = G.player;
  tCircle(b.dash[0], b.dash[1], b.dash[2], T_BTN);
  drawS(S('icon_speed'), b.dash[0] - 8, b.dash[1] - 8, p.dashCool > 0 ? 4 : 0);
  tCircle(b.star[0], b.star[1], b.star[2], T_BTN);
  drawS(S(p.charge >= 1 && Math.floor(G.time * 4) % 2 ? 'shotbig_1' : 'shotbig_0'), b.star[0] - 4, b.star[1] - 4, p.charge >= 1 ? 0 : 4);
  tCircle(b.pause[0], b.pause[1], b.pause[2], T_BTN);
  rect(b.pause[0] - 3, b.pause[1] - 3, 2, 7, 'w'); rect(b.pause[0] + 1, b.pause[1] - 3, 2, 7, 'w');
}

function drawPropTip(o) {
  let title, sub, act;
  if (o.kind === 'portal') { title = 'STAR GATE'; sub = 'ON TO THE NEXT LAND'; act = 'ENTER'; }
  else if (o.item === 'hp') { title = 'LITTLE HEART'; sub = 'RESTORES TWO HEARTS'; act = 'BUY'; }
  else { title = ITEMS[o.item].name; sub = ITEMS[o.item].desc; act = o.price ? 'BUY' : 'TAKE'; }
  const w = Math.max(textW(title), textW(sub), textW(act) + 14) + 16, h = 40;
  const x = Math.round((VW - w) / 2), y = 150;
  G.tipRect = [x, y, w, h];
  panel(x, y, w, h);
  text(title, VW / 2, y + 5, 'Y', 1, 1);
  text(sub, VW / 2, y + 16, 'w', 1, 1);
  const aw = textW(act) + 12;
  keyCap(VW / 2 - aw / 2, y + 26);
  text(act, VW / 2 - aw / 2 + 12, y + 28, o.price && G.player.coins < priceOf(o) ? 'R' : 'h', 1);
}

function drawBanner() {
  const b = G.banner, a = Math.min(1, b.t * 3, (2.6 - b.t) * 5);
  const w = Math.max(textW(b.title), textW(b.sub)) + (b.icon ? 36 : 20), h = 30;
  const x = Math.round((VW - w) / 2), y = Math.round((G.boss ? 46 : 28) - (1 - a) * 40);
  panel(x, y, w, h);
  if (b.icon) {
    drawS(S('icon_' + b.icon), x + 6, y + 7);
    text(b.title, x + 26, y + 6, 'Y', 1);
    text(b.sub, x + 26, y + 17, 'w', 1);
  } else {
    text(b.title, VW / 2, y + 6, 'Y', 1, 1);
    text(b.sub, VW / 2, y + 17, 'w', 1, 1);
  }
}

function drawCursor() {
  if (Input.mouseSeen && Input.lastAim === 'mouse') drawS(S('cursor'), Math.round(Input.mx) - 4, Math.round(Input.my) - 4);
}

// ---------- Menus (keyboard, mouse and controller) ----------
const K_UP = ['KeyW', 'ArrowUp', 'PadUp'], K_DOWN = ['KeyS', 'ArrowDown', 'PadDown'];
const K_LEFT = ['KeyA', 'ArrowLeft', 'PadLeft'], K_RIGHT = ['KeyD', 'ArrowRight', 'PadRight'];
const K_OK = ['Enter', 'Space', 'KeyE', 'PadA'], K_BACK = ['Escape', 'PadB'];
const mouseOn = () => Input.mouseSeen && (Input.lastAim === 'mouse' || Input.lastAim === 'touch');

function menuNav(n) {
  if (pressed(...K_UP)) { G.menuSel = (G.menuSel + n - 1) % n; Audio_.sfx('select'); }
  if (pressed(...K_DOWN)) { G.menuSel = (G.menuSel + 1) % n; Audio_.sfx('select'); }
}
// Mouse hover selects row i; returns true when it is clicked.
function hoverRow(i, x, y, w, h) {
  if (!mouseOn() || Input.mx < x || Input.mx >= x + w || Input.my < y || Input.my >= y + h) return false;
  if (G.menuHover !== i) { G.menuHover = i; if (G.menuSel !== i) { G.menuSel = i; Audio_.sfx('select'); } }
  return Input.mouseHit;
}
function menu(items, y, gap) {
  gap = gap || 14;
  menuNav(items.length);
  let chosen = -1;
  items.forEach((it, i) => { const w = textW(it) + 20; if (hoverRow(i, VW / 2 - w / 2, y + i * gap - 3, w, gap - 1)) chosen = i; });
  if (pressed(...K_OK)) chosen = G.menuSel;
  return chosen;
}
function pointer(x, y) { text('>', x - (Math.floor(G.time * 4) % 2), y, 'Y', 2); }
function drawMenu(items, y, gap) {
  gap = gap || 14;
  items.forEach((it, i) => {
    const sel = i === G.menuSel;
    text(it, VW / 2, y + i * gap, sel ? 'Y' : 'l', 2, 1);
    if (sel) {
      const w = textW(it), bob = Math.floor(G.time * 4) % 2;
      text('>', VW / 2 - w / 2 - 9 - bob, y + i * gap, 'Y', 2);
      text('<', VW / 2 + w / 2 + 6 + bob, y + i * gap, 'Y', 2);
    }
  });
}
// Key cap with a letter (E on keyboard, X on a controller).
function keyCap(x, y) {
  if (Input.lastAim === 'touch') { drawS(S('sparkle_0'), x + 3, y + 3); return; }
  drawS(S('key_cap'), x, y);
  text(Input.lastAim === 'pad' ? 'X' : 'E', x + 2, y + 1, '1', 0);
}

// ---------- Title ----------
function titleItems() {
  return hasRun() ? ['CONTINUE', 'NEW GAME', 'THE GARDEN', 'COLLECTION', 'SETTINGS'] : ['START GAME', 'THE GARDEN', 'COLLECTION', 'SETTINGS'];
}
function drawTitleBg() {
  const t = G.time;
  const fl = ['floor_0@meadow', 'floor_1@meadow', 'floor_3@meadow', 'floor_2@meadow'];
  const scroll = Math.floor(t * 8) % 16;
  for (let y = -1; y < 14; y++) for (let x = -1; x < 25; x++) {
    const h = hash(x - Math.floor(t * 8 / 16), y, 7) % 100;
    drawS(S(fl[h < 60 ? 0 : h < 80 ? 1 : h < 90 ? 2 : 3]), x * 16 + scroll, y * 16);
  }
  drawAmbient(0, 0);
  dim(0.25);
  for (let x = 0; x < 24; x++) {
    drawS(S('cap@meadow'), x * 16, -8); drawS(S('cap@meadow'), x * 16, 8);
    drawS(S('face_' + (x % 5 === 2 ? 1 : 0) + '@meadow'), x * 16, 24);
  }
  rect(0, 40, VW, 3, SHADOW);
  const logo = S('logo');
  drawS(logo, (VW - logo.w) / 2, 6 + Math.round(Math.sin(t * 2) * 1.5));
}
function drawTitle() {
  const t = G.time;
  drawTitleBg();
  text('THE ADVENTURES OF PIP, THE LITTLE STAR WIZARD', VW / 2, 52, 'Y', 2, 1);
  const hx = VW / 2, hy = 110;
  shadow(hx, hy, 12);
  drawFeet(S('hero_d' + HERO_WALK[Math.floor(t / 0.14) % 4]), hx, hy + 1);
  const sx = hx - 44, sy = 108;
  const sj = Math.max(0, Math.sin(t * 5)) * 6;
  shadow(sx, sy, 14);
  drawFeet(S(sj > 3 ? 'slime_green_stretch' : sj > 0.5 ? 'slime_green_idle' : 'slime_green_squash'), sx, sy - sj + 1);
  const bx = hx + 44, by = 104 + Math.sin(t * 4) * 2;
  shadow(bx, 108, 10);
  drawFeet(S('bee_' + Math.floor(t * 16) % 2), bx, by, 1);
  const items = titleItems();
  drawMenu(items, 120, 12);
  if (Save.stars) {
    const i = items.indexOf('THE GARDEN'), x = VW / 2 + textW('THE GARDEN') / 2 + 16 + (G.menuSel === i ? 6 : 0);
    drawS(S('shot_0'), x, 120 + i * 12);
    text(String(Save.stars), x + 9, 121 + i * 12, 'c', 2);
  }
  if (G.toast) { /* the notice sits where the control hints are */ } else if (Input.lastAim === 'pad') {
    text('LEFT STICK: MOVE   RIGHT STICK: SHOOT   A: ROLL', VW / 2, 184, 'w', 2, 1);
    text('RB: STARFALL   X: TAKE   START: PAUSE', VW / 2, 195, 'w', 2, 1);
  } else if (Input.lastAim === 'touch') {
    text('LEFT SIDE: MOVE   RIGHT SIDE: SHOOT', VW / 2, 184, 'w', 2, 1);
    text('BUTTONS: ROLL AND STARFALL', VW / 2, 195, 'w', 2, 1);
  } else {
    text('WASD: MOVE   MOUSE / ARROWS: SHOOT   SPACE: ROLL', VW / 2, 184, 'w', 2, 1);
    text('Q / RIGHT CLICK: STARFALL   E: TAKE   ESC: PAUSE', VW / 2, 195, 'w', 2, 1);
  }
  const st = Save.stats;
  if (st.bestDepth > 0 && !G.toast) text('BEST: LAND ' + st.bestDepth + (st.wins ? '   WINS: ' + st.wins : ''), VW / 2, 207, 'c', 2, 1);
}

// ---------- Settings ----------
const SET_X = VW / 2 - 84, SET_Y = 70, BAR_X = SET_X + 98;
function settingsRows() {
  const s = Save.settings;
  return [['MUSIC', 'bar', s.music], ['EFFECTS', 'bar', s.sfx], ['SCREEN SHAKE', s.shake ? 'ON' : 'OFF'],
    ['FULLSCREEN', document.fullscreenElement ? 'ON' : 'OFF'], ['BACK', null]];
}
// Returns true when the screen should close.
function updateSettings() {
  const s = Save.settings, rows = settingsRows();
  menuNav(rows.length);
  let click = false;
  rows.forEach((r, i) => { if (hoverRow(i, SET_X - 12, SET_Y + i * 16 - 4, 184, 15)) click = true; });
  const dir = pressed(...K_RIGHT) ? 1 : pressed(...K_LEFT) ? -1 : 0;
  const i = G.menuSel, ok = pressed(...K_OK) || click;
  if (pressed(...K_BACK, 'KeyP') || (ok && i === 4)) { Save.write(); Audio_.sfx('select'); return true; }
  if (i <= 1 && (dir || ok)) {
    const k = i ? 'sfx' : 'music';
    if (click && Input.mx >= BAR_X - 2) s[k] = Math.max(0, Math.min(10, Math.round((Input.mx - BAR_X + 3) / 7)));
    else if (dir) s[k] = Math.max(0, Math.min(10, s[k] + dir));
    else s[k] = (s[k] + 1) % 11;
    Audio_.applySettings(); Audio_.sfx('select'); Save.write();
  } else if (i === 2 && (dir || ok)) { s.shake = !s.shake; Audio_.sfx('select'); Save.write(); }
  else if (i === 3 && (dir || ok)) toggleFullscreen();
  return false;
}
function drawSettings() {
  if (G.back === 'title') drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 104, 46, 208, 124);
  text('SETTINGS', VW / 2, 54, 'Y', 2, 1);
  settingsRows().forEach(([label, val, v], i) => {
    const y = SET_Y + i * 16, sel = i === G.menuSel;
    if (sel) pointer(SET_X - 10, y);
    text(label, SET_X, y, sel ? 'Y' : 'l', 1);
    if (val === 'bar') {
      rect(BAR_X - 1, y - 1, 71, 9, '0');
      for (let k = 0; k < 10; k++) rect(BAR_X + k * 7, y, 6, 7, k < v ? (sel ? 'Y' : 'w') : '2');
    } else if (val) text(val, BAR_X + 69, y, sel ? 'Y' : 'w', 1, 2);
  });
  rect(VW / 2 - 92, 149, 184, 1, '2');
  text(Input.lastAim === 'pad' ? 'LEFT / RIGHT: ADJUST    B: BACK' : 'LEFT / RIGHT: ADJUST    ESC: BACK', VW / 2, 155, 'c', 1, 1);
}

// ---------- Collection ----------
const COL_PER = 6, COL_CELL = 22, COL_X = 30, COL_Y = 56;
function updateCollection() {
  const n = Object.keys(ITEMS).length;
  let s = G.menuSel;
  if (s < n) {
    if (pressed(...K_RIGHT)) s = Math.min(n - 1, s + 1);
    if (pressed(...K_LEFT)) s = Math.max(0, s - 1);
    if (pressed(...K_UP)) s = Math.max(0, s - COL_PER);
  }
  if (pressed(...K_DOWN)) s = s + COL_PER < n ? s + COL_PER : n;
  if (s === n && pressed(...K_UP)) s = n - 1;
  if (s !== G.menuSel) { G.menuSel = s; Audio_.sfx('select'); }
  for (let i = 0; i < n; i++) hoverRow(i, COL_X + (i % COL_PER) * COL_CELL, COL_Y + Math.floor(i / COL_PER) * COL_CELL, COL_CELL, COL_CELL);
  const w = textW('BACK') + 20;
  const click = hoverRow(n, VW / 2 - w / 2, 199, w, 13);
  return pressed(...K_BACK) || click || (G.menuSel === n && pressed(...K_OK));
}
function drawCollection() {
  drawTitleBg();
  dim(0.5);
  const ids = Object.keys(ITEMS), found = new Set(Save.found);
  panel(20, 34, 152, 130);
  text('MAGIC ITEMS', 96, 41, 'Y', 1, 1);
  ids.forEach((id, i) => {
    const x = COL_X + (i % COL_PER) * COL_CELL, y = COL_Y + Math.floor(i / COL_PER) * COL_CELL;
    rect(x, y, 20, 20, '0'); rect(x + 1, y + 1, 18, 18, '2');
    drawS(S('icon_' + id), x + 2, y + 2, found.has(id) ? 0 : 4);
    if (i === G.menuSel) { rect(x - 1, y - 1, 22, 1, 'Y'); rect(x - 1, y + 20, 22, 1, 'Y'); rect(x - 1, y, 1, 20, 'Y'); rect(x + 20, y, 1, 20, 'Y'); }
  });
  text(found.size + ' / ' + ids.length, 96, 128, 'c', 1, 1);
  const st = Save.stats;
  panel(180, 34, 184, 130);
  text('STATISTICS', 272, 41, 'Y', 1, 1);
  [['RUNS', st.runs], ['WINS', st.wins], ['ENEMIES DEFEATED', st.kills], ['BEST LAND', st.bestDepth || '-'],
    ['FASTEST WIN', st.bestTime ? fmtTime(st.bestTime) : '-']].forEach(([k, v], i) => {
    text(k, 190, 58 + i * 14, 'l', 1); text(String(v), 354, 58 + i * 14, 'w', 1, 2);
  });
  const sel = ids[G.menuSel];
  panel(20, 168, 344, 28);
  if (sel) {
    const has = found.has(sel);
    text(has ? ITEMS[sel].name : '???', VW / 2, 173, has ? 'Y' : 'l', 1, 1);
    text(has ? ITEMS[sel].desc : 'NOT FOUND YET', VW / 2, 184, 'w', 1, 1);
  } else text('PICK AN ITEM TO READ ABOUT IT', VW / 2, 179, 'l', 1, 1);
  const back = G.menuSel === ids.length;
  text('BACK', VW / 2, 202, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 202);
}

// ---------- Pause / game over / win ----------
const PAUSE_ITEMS = ['CONTINUE', 'SETTINGS', 'SAVE AND QUIT'];
function drawPause() {
  dim(0.6);
  text('PAUSED', VW / 2, 30, 'Y', 2, 1);
  const p = G.player, items = p.items;
  let tip = null;
  if (items.length) {
    const per = 12, rows = Math.ceil(items.length / per);
    const w = Math.min(items.length, per) * 18 + 8, x0 = Math.round((VW - w) / 2);
    panel(x0, 44, w, rows * 18 + 8);
    items.forEach((id, i) => {
      const x = x0 + 5 + (i % per) * 18, y = 48 + Math.floor(i / per) * 18;
      drawS(S('icon_' + id), x, y);
      if (mouseOn() && Input.mx >= x && Input.mx < x + 16 && Input.my >= y && Input.my < y + 16) tip = id;
    });
  } else text('NO MAGIC ITEMS YET', VW / 2, 52, 'l', 2, 1);
  const sy = items.length > 12 ? 92 : 74;
  if (tip) {
    text(ITEMS[tip].name, VW / 2, sy, 'Y', 2, 1);
    text(ITEMS[tip].desc, VW / 2, sy + 11, 'w', 2, 1);
  } else {
    const shots = p.shots + (p.backshot ? 1 : 0);
    const cols = [['DAMAGE', p.dmg.toFixed(1)], ['SHOTS/SEC', (1 / p.fireDelay).toFixed(1) + (shots > 1 ? ' X' + shots : '')],
      ['RANGE', String(Math.round(p.range))], ['SPEED', String(Math.round(p.speed))]];
    cols.forEach(([k, v], i) => {
      const x = i % 2 ? VW / 2 + 12 : VW / 2 - 108, y = sy + Math.floor(i / 2) * 11;
      text(k, x, y, 'l', 2); text(v, x + 96, y, 'Y', 2, 2);
    });
  }
  drawMenu(PAUSE_ITEMS, 118);
  text('LAND ' + (G.floor.depth + 1) + '   ' + fmtTime(G.stats.time), VW / 2, 190, 'c', 2, 1);
}
function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function drawStats(y) {
  const s = G.stats;
  const rows = [['LAND', String(G.floor.depth + 1)], ['DEFEATED', String(s.kills)], ['COINS', String(s.coins)], ['MAGIC ITEMS', String(s.items)], ['TIME', fmtTime(s.time)], ['STARS', '+' + G.run.stars]];
  rows.forEach(([k, v], i) => { text(k, VW / 2 - 64, y + i * 11, 'l', 1); text(v, VW / 2 + 64, y + i * 11, 'Y', 1, 2); });
}
// Shared layout for the end screens: big panel, title, line, stats, menu.
function endScreen(title, col, sub, items) {
  dim(0.55);
  const x = VW / 2 - 92, y = 22, w = 184, h = 172;
  panel(x, y, w, h);
  const bob = Math.round(Math.sin(G.time * 3) * 1.5);
  text(title, VW / 2, y + 9 + bob, col, 2, 1);
  if (G.record) text('NEW RECORD: LAND ' + (G.floor.depth + 1) + '!', VW / 2, y + 25, 'c', 1, 1);
  else text(sub, VW / 2, y + 25, 'w', 1, 1);
  rect(x + 12, y + 38, w - 24, 1, '2');
  drawStats(y + 44);
  rect(x + 12, y + 115, w - 24, 1, '2');
  drawMenu(items, y + 126);
}
const OVER_ITEMS = ['AGAIN!', 'MENU'], WIN_ITEMS = ['KEEP GOING: ENDLESS MODE', 'MENU'];
function drawOver() { endScreen('OOPS!', 'P', 'YOU RAN OUT OF HEARTS...', OVER_ITEMS); }
function drawWin() {
  endScreen('VICTORY!', 'Y', 'THE STAR GARDEN SHINES AGAIN!', WIN_ITEMS);
  for (let i = 0; i < 10; i++) {
    const a = G.time * 0.7 + i * 0.63;
    drawS(S(i % 2 ? 'sparkle_0' : 'sparkle_1'), VW / 2 + Math.cos(a) * 116 - 1, 108 + Math.sin(a) * 92 - 1);
  }
}
