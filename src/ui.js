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
function dim(a) { fillScreen('rgba(43,26,71,' + a + ')'); }

// ---------- HUD ----------
// Where the belt slots sit, in screen-corner coordinates (also used to tap them).
function beltLayout() {
  const p = G.player, cy = Math.ceil(p.maxHp / 2) > 10 ? 22 : 14;
  return { x: 4, y: cy + 20, n: p.beltMax };
}
function beltSlotAt(x, y) {
  if (!G.player) return -1;
  const L = beltLayout(), hx = x + SCR.ox, hy = y + SCR.oy;
  for (let i = 0; i < L.n; i++) if (hx >= L.x + i * 15 - 2 && hx < L.x + i * 15 + 16 && hy >= L.y - 2 && hy < L.y + 18) return i;
  return -1;
}
const BUFF_IDS = ['regen', 'haste', 'power', 'guard'];
function drawHUD() {
  const p = G.player;
  hudOn();                           // the corner HUD has its own, finer canvas on desktop
  ctx.translate(-SCR.ox, -SCR.oy);   // hearts, coins, meter and belt hug the screen corner
  const hearts = Math.ceil(p.maxHp / 2);
  const low = p.hp <= 2 && p.maxHp > 2 && alive(p), beat = low && (G.beatT || 0) > 0.95;
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
  const cs = String(G.coins);
  text(cs, 16, cy + 1 - bump, G.hud.coinT > 0 ? 'w' : 'Y', 3);
  let ix = 20 + textW(cs, 3);
  if (p.shieldUp) { drawS(S('icon_shield'), ix, cy - 4); ix += 18; }
  if (G.hud.vaultT > 0) text('VAULT +' + G.run.vault, ix + 6, cy + 1, 'c', 3);
  // Starfall meter
  const my = cy + 11, full = p.charge >= 1, blink = full && Math.floor(G.time * 4) % 2;
  drawS(S(full ? 'shot_' + (Math.floor(G.time * 8) % 2) : 'shot_0'), 5, my - 1);
  rect(14, my, 26, 5, '0');
  rect(15, my + 1, Math.round(24 * p.charge), 3, full ? (blink ? 'w' : 'Y') : 'c');
  if (full) text(Input.lastAim === 'pad' ? 'RB' : Input.lastAim === 'touch' ? '' : 'Q', 44, my - 1, 'Y', 2);
  // Belt: potions and turret kits, then the running potion effects
  const L = beltLayout();
  for (let i = 0; i < L.n; i++) {
    const x = L.x + i * 15, it = p.belt[i], pop = i === p.belt.length - 1 && G.hud.beltT > 0;
    rect(x, L.y, 14, 16, '0');
    rect(x + 1, L.y + 1, 12, 14, pop ? '3' : it ? '2' : '1');
    if (it) {
      // a charm that is recharging shows grey with the rooms it still needs
      const cd = POTIONS[it].charm && p.charmCd ? p.charmCd[it] || 0 : 0;
      drawS(S('pot_' + it), x + 2, L.y + 2 - (pop ? 1 : 0), cd ? 4 : 0);
      if (cd) text(String(cd), x + 7, L.y + 5, 'w', 2, 1);
    }
  }
  let bx = L.x + L.n * 15 + 2;
  if (p.belt.length && Input.lastAim !== 'touch') { text(Input.lastAim === 'pad' ? 'Y' : 'R', bx, L.y + 5, 'Y', 2); bx += 10; }
  for (const k of BUFF_IDS) {
    const t = p.buff[k];
    if (t <= 0) continue;
    if (t > 1.5 || Math.floor(G.time * 8) % 2) drawS(S('pot_' + k), bx, L.y + 1);
    rect(bx, L.y + 15, 11, 2, '0');
    rect(bx, L.y + 15, Math.ceil(11 * t / POTIONS[k].t), 1, 'Y');
    bx += 14;
  }
  if (G.players.length > 1) drawTeam(L.y + 22);
  ctx.translate(SCR.ox, SCR.oy);
  const right = G.mode === 'arena' ? drawWave() : drawMinimap();
  drawKills(right);
  hudOff();
  drawCombo();
  if (G.boss && !G.boss.dead && G.boss.state !== 'intro') {
    const b = G.boss, w = 120, x = (VW - w) / 2, y = 15;
    rect(x - 1, y - 1, w + 2, 6, '0');
    rect(x, y, w, 4, '1');
    const f = Math.max(0, Math.round(w * b.hp / b.maxHp));
    rect(x, y, f, 4, b.stag > 0 ? 'c' : 'P');
    rect(x, y, f, 1, b.stag > 0 ? 'C' : 'q');
    // a notch where each new phase begins
    for (const k of EDEF[b.type].phases || [0.5]) rect(x + Math.round(w * k), y, 1, 4, '0');
    text(curBossName(), VW / 2, 3, 'w', 2, 1);
  }
  G.tipRect = null;
  if (G.state !== 'play') return;
  const o = nearestProp(p);
  if (o && !G.trans && !G.warp) drawPropTip(o);
  if (G.tut) drawTutorialPrompt();
  if (G.banner) drawBanner();
  if (G.floorBanner && !G.tut) {
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
// Co-op: every teammate's name and health under our belt.
function drawTeam(y) {
  for (const q of G.players) {
    if (q === G.player) continue;
    text(q.name, 5, y, TAG_COL[q.skin], 2);
    const bx = 9 + textW(q.name);
    if (q.down || q.dead) { if (Math.floor(G.time * 3) % 2) text('DOWN!', bx, y, 'R', 2); }
    else {
      const w = q.maxHp * 3;
      rect(bx, y + 1, w + 2, 5, '0');
      rect(bx + 1, y + 2, q.hp * 3, 3, 'R');
      rect(bx + 1, y + 2, q.hp * 3, 1, 'q');
    }
    y += 10;
  }
}
// Arena: wave number in the top-right corner, and the countdown between waves.
function drawWave() {
  const A = G.arena, r = SCR.w - SCR.ox - 5, t = 4 - SCR.oy;
  if (isDuel()) { text('BOSS FIGHT', r, t + 1, 'Y', 2, 2); return t + 12; }
  text('WAVE ' + Math.max(1, A.wave), r, t + 1, 'Y', 2, 2);
  if (A.phase === 'fight') {
    const left = A.left + G.enemies.filter(e => !e.dead && !e.passive).length;
    text(left + ' LEFT', r, t + 12, 'c', 2, 2);
  } else if (A.phase === 'break') {
    // the countdown sits under the wave number; the last three seconds also count big
    const n = Math.ceil(A.t);
    text('NEXT IN ' + n, r, t + 12, 'c', 2, 2);
    if (n <= 3 && G.state === 'play' && !G.floorBanner && !G.banner) text(String(n), VW / 2, 46, Math.floor(A.t * 4) % 2 ? 'w' : 'Y', 2, 1);
  }
  return t + (A.phase === 'fight' || A.phase === 'break' ? 23 : 12);
}
function drawKills(y) {
  const r = SCR.w - SCR.ox - 5, n = String(G.stats.kills);
  text(n, r, y + 2, 'w', 2, 2);
  drawS(S('slime_green_mini'), r - textW(n) - 13, y);
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
  const x0 = SCR.w - SCR.ox - W - 4, y0 = 3 - SCR.oy;
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
  return y0 + H + 4;
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
  const e = screenEdges();
  const L = !!Save.settings.lefty;
  stick(T.move, L ? e.r - 48 : e.l + 48, e.b - 46);
  stick(T.aim, L ? e.l + 110 : e.r - 110, e.b - 50);
  const b = touchBtns(), p = G.player;
  tCircle(b.dash[0], b.dash[1], b.dash[2], T_BTN);
  drawS(S('icon_speed'), b.dash[0] - 8, b.dash[1] - 8, p.dashCool > 0 ? 4 : 0);
  tCircle(b.star[0], b.star[1], b.star[2], T_BTN);
  drawS(S(p.charge >= 1 && Math.floor(G.time * 4) % 2 ? 'shotbig_1' : 'shotbig_0'), b.star[0] - 4, b.star[1] - 4, p.charge >= 1 ? 0 : 4);
  if (p.belt.length) { tCircle(b.belt[0], b.belt[1], b.belt[2], T_BTN); drawS(S('pot_' + p.belt[0]), b.belt[0] - 5, b.belt[1] - 7); }
  tCircle(b.pause[0], b.pause[1], b.pause[2], T_BTN);
  rect(b.pause[0] - 3, b.pause[1] - 3, 2, 7, 'w'); rect(b.pause[0] + 1, b.pause[1] - 3, 2, 7, 'w');
}

function drawPropTip(o) {
  let title, sub, act;
  if (o.kind === 'portal') { title = 'STAR GATE'; sub = 'ON TO THE NEXT LAND'; act = 'ENTER'; }
  else if (ROOM_PROPS.has(o.kind)) [title, sub, act] = roomPropTip(o);
  else if (o.item === 'hp') { title = 'LITTLE HEART'; sub = G.players.length > 1 ? 'TWO HEARTS FOR EVERYONE' : 'RESTORES TWO HEARTS'; act = 'BUY'; }
  else {
    const it = POTIONS[o.item] || ITEMS[o.item];
    title = it.name; sub = it.desc; act = o.price ? 'BUY' : 'TAKE';
    if (o.group && G.players.length > 1) sub += '  (ONE EACH)';
  }
  if (o.price && G.players.length > 1) act += ' FOR EVERYONE'; // co-op: the whole team gets it
  if (Input.lastAim === 'touch') act = 'TAP HERE TO ' + act;
  const w = Math.max(textW(title), textW(sub), textW(act) + 14) + 16, h = 40;
  // under the hero, or above when they stand low in the room: never on top of them
  const py = G.player.y, x = Math.round((VW - w) / 2), y = py < 144 ? 150 : py + 6 + h <= 204 ? py + 6 : py - 66;
  G.tipRect = [x, y, w, h];
  panel(x, y, w, h);
  text(title, VW / 2, y + 5, 'Y', 1, 1);
  text(sub, VW / 2, y + 16, 'w', 1, 1);
  const aw = textW(act) + 12;
  keyCap(VW / 2 - aw / 2, y + 26);
  text(act, VW / 2 - aw / 2 + 12, y + 28, o.price && G.coins < priceOf(o) ? 'R' : 'h', 1);
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
  const wide = Input.lastAim === 'touch';
  items.forEach((it, i) => {
    const w = wide ? VW : textW(it) + 20;
    if (hoverRow(i, VW / 2 - w / 2, y + i * gap - (wide ? gap / 2 - 3 : 3), w, wide ? gap : gap - 1)) chosen = i;
  });
  if (pressed(...K_OK)) chosen = G.menuSel;
  return chosen;
}
function pointer(x, y) { text('>', x - (Math.floor(G.time * 4) % 2), y, 'Y', 2); }
function drawMenu(items, y, gap, cur) {
  gap = gap || 14;
  if (cur === undefined) cur = G.menuSel;
  items.forEach((it, i) => {
    const sel = i === cur;
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
  if (Input.lastAim === 'touch') { drawS(S(Math.floor(G.time * 4) % 2 ? 'sparkle_0' : 'sparkle_1'), x + 3, y + 3); return; }
  drawS(S('key_cap'), x, y);
  text(Input.lastAim === 'pad' ? 'X' : 'E', x + 2, y + 1, '1', 0);
}

// ---------- Title ----------
const TITLE_Y = 116, TITLE_GAP = 11;
// The title menu grows as the player gets to things: a first launch shows just PLAY.
const TITLE_BADGE = { ARENA: 'menu:arena', 'CO-OP': 'menu:coop', 'DAILY STAR RUN': 'menu:daily' };
function titleItems() {
  const first = Save.stats.runs === 0 && !hasRun();
  const out = first ? ['PLAY'] : hasRun() ? ['CONTINUE', 'NEW ADVENTURE'] : ['ADVENTURE'];
  if (typeof dailyReady === 'function' && menuOpen('daily')) out.push('DAILY STAR RUN');
  if (menuOpen('arena')) { if (hasArena()) out.push('CONTINUE ARENA'); out.push('ARENA'); }
  if (menuOpen('coop')) out.push('CO-OP');
  if (menuOpen('garden')) out.push('THE GARDEN');
  return out.concat(['SETTINGS']);
}
function drawTitleBg() {
  const t = G.time;
  const fl = ['floor_0@meadow', 'floor_1@meadow', 'floor_3@meadow', 'floor_2@meadow'];
  const scroll = Math.floor(t * 8) % 16;
  const cx0 = Math.floor(-SCR.ox / 16) - 2, cx1 = Math.ceil((SCR.w - SCR.ox) / 16) + 1;
  for (let y = Math.floor(-SCR.oy / 16) - 1; y < Math.ceil((SCR.h - SCR.oy) / 16) + 1; y++) for (let x = cx0; x < cx1; x++) {
    const h = hash(x - Math.floor(t * 8 / 16), y, 7) % 100;
    drawS(S(fl[h < 60 ? 0 : h < 80 ? 1 : h < 90 ? 2 : 3]), x * 16 + scroll, y * 16);
  }
  drawAmbient(0, 0);
  dim(0.25);
  for (let x = cx0; x < cx1; x++) {
    for (let y = 8; y > -SCR.oy - 16; y -= 16) drawS(S('cap@meadow'), x * 16, y);
    drawS(S('face_' + (((x % 5) + 5) % 5 === 2 ? 1 : 0) + '@meadow'), x * 16, 24);
  }
  rect(-SCR.ox, 40, SCR.w, 3, SHADOW);
  const logo = S('logo');
  drawS(logo, (VW - logo.w) / 2, 6 + Math.round(Math.sin(t * 2) * 1.5));
}
function drawTitle() {
  const t = G.time;
  drawTitleBg();
  text('THE ADVENTURES OF PIP, THE LITTLE STAR WIZARD', VW / 2, 52, 'Y', 2, 1);
  const hx = VW / 2, hy = 110;
  shadow(hx, hy, 12);
  drawFeet(S(heroPre(heroUnlocked(Save.hero) ? Save.hero : 'pip') + 'd' + HERO_WALK[Math.floor(t / 0.14) % 4] + SKIN[Save.skin]), hx, hy + 1);
  if (Save.pet) { shadow(hx + 17, hy, 8); drawFeet(S('pet_' + Save.pet + '_' + Math.floor(t * (Save.pet === 'bee' ? 14 : 2)) % 2), hx + 17, hy + 1 - (Save.pet === 'bee' ? 7 : 0), 1); }
  const sx = hx - 44, sy = 108;
  const sj = Math.max(0, Math.sin(t * 5)) * 6;
  shadow(sx, sy, 14);
  drawFeet(S(sj > 3 ? 'slime_green_stretch' : sj > 0.5 ? 'slime_green_idle' : 'slime_green_squash'), sx, sy - sj + 1);
  const bx = hx + 44, by = 104 + Math.sin(t * 4) * 2;
  shadow(bx, 108, 10);
  drawFeet(S('bee_' + Math.floor(t * 16) % 2), bx, by, 1);
  const items = titleItems();
  drawMenu(items, TITLE_Y, TITLE_GAP);
  drawNewTags(items, TITLE_Y, TITLE_GAP, (it) => TITLE_BADGE[it]);
  const gi = items.indexOf('THE GARDEN'), vs = String(Save.vault);
  // THE GARDEN shows its vault on the right, so its NEW sits on the left
  if (gi >= 0 && hubBadge() && Math.floor(G.time * 3) % 3) text('NEW', VW / 2 - textW('THE GARDEN') / 2 - (G.menuSel === gi ? 16 : 8) - textW('NEW'), TITLE_Y + gi * TITLE_GAP, 'P', 2);
  if (Save.vault) {
    const x = VW / 2 + textW('THE GARDEN') / 2 + 16 + (G.menuSel === gi ? 6 : 0), y = TITLE_Y + gi * TITLE_GAP;
    drawS(S('coin_0'), x, y - 1);
    text(vs, x + 11, y, 'Y', 2);
  }
  const how = Input.lastAim;
  const why = Save.stats.runs >= 3 ? comeBackLine() : '';
  if (!G.toast && why) text(why, VW / 2, 196, 'Y', 2, 1);
  else if (!G.toast) {
    text(how === 'pad' ? 'L STICK MOVE   R STICK SHOOT   A ROLL   RB STARFALL   Y POTION'
      : how === 'touch' ? 'LEFT SIDE: MOVE   RIGHT SIDE: SHOOT   BUTTONS: ROLL, STARFALL, POTION'
      : 'WASD MOVE   MOUSE SHOOT   SPACE ROLL   Q STARFALL   R POTION', VW / 2, 196, 'w', 2, 1);
    const st = Save.stats, best = [];
    if (st.bestDepth) best.push('LAND ' + st.bestDepth);
    if (st.bestWave) best.push('WAVE ' + st.bestWave);
    if (st.wins) best.push('WINS ' + st.wins);
    if (IS_IOS && !navigator.standalone) text('TIP: SHARE > ADD TO HOME SCREEN FOR FULLSCREEN', VW / 2, 207, 'c', 2, 1);
    else if (best.length) text('BEST: ' + best.join('   '), VW / 2, 207, 'c', 2, 1);
  }
}

// ---------- Settings ----------
const SET_X = VW / 2 - 84, SET_Y = 64, BAR_X = SET_X + 98, VIBE = ['OFF', 'LOW', 'FULL'];
// Rows carry ids so a row can be hidden (no fullscreen or vibration on iPhone) without breaking the logic.
function settingsRows() {
  const s = Save.settings, rows = [
    ['music', 'MUSIC', 'bar', s.music], ['sfx', 'EFFECTS', 'bar', s.sfx],
    ['shake', 'SCREEN SHAKE', s.shake ? 'ON' : 'OFF'],
  ];
  if (!IS_IOS) rows.push(['vibe', IS_TOUCH ? 'VIBRATION' : 'RUMBLE', VIBE[s.vibe]]);
  if (document.fullscreenEnabled) rows.push(['full', 'FULLSCREEN', document.fullscreenElement ? 'ON' : 'OFF']);
  rows.push(['assist', 'ASSIST MODE', s.assist ? 'ON' : 'OFF'], ['cb', 'BULLET SHAPES', s.cb ? 'ON' : 'OFF']);
  if (IS_TOUCH) rows.push(['lefty', 'LEFT-HANDED', s.lefty ? 'ON' : 'OFF']);
  else rows.push(['keys', 'KEYS', '>']);
  if (ONLINE.url) rows.push(['share', 'PLAY STATS', s.share ? 'ON' : 'OFF']);
  rows.push(['lang', 'LANGUAGE', (LANGS.find(l => l[0] === langId()) || LANGS[0])[1]], ['save', 'SAVE CODE', '>'], ['back', 'BACK', null]);
  return rows;
}
const setGap = (rows) => (rows.length > 10 ? 10 : rows.length > 9 ? 11 : rows.length > 7 ? 13 : 16);
const SET_HELP = { assist: 'A SLOWER GAME, TWO MORE HEARTS', cb: 'A SHAPE FOR EACH BULLET COLOUR', lefty: 'MOVE ON THE RIGHT, AIM LEFT', keys: 'CHOOSE YOUR OWN KEYS', share: 'ANONYMOUS, TO MAKE THE GAME BETTER', lang: 'THE GAME\'S LANGUAGE', save: 'MOVE YOUR GARDEN TO ANOTHER DEVICE' };
function updateSettings() {
  const s = Save.settings, rows = settingsRows(), gap = setGap(rows);
  menuNav(rows.length);
  let click = false;
  rows.forEach((r, i) => { if (hoverRow(i, SET_X - 12, SET_Y + i * gap - 4, 184, gap - 1)) click = true; });
  const dir = pressed(...K_RIGHT) ? 1 : pressed(...K_LEFT) ? -1 : 0;
  const id = rows[G.menuSel][0], ok = pressed(...K_OK) || click;
  if (pressed(...K_BACK, 'KeyP') || (ok && id === 'back')) { Save.write(); Audio_.sfx('select'); return true; }
  if ((id === 'music' || id === 'sfx') && (dir || ok)) {
    if (click && Input.mx >= BAR_X - 2) s[id] = Math.max(0, Math.min(10, Math.round((Input.mx - BAR_X + 3) / 7)));
    else if (dir) s[id] = Math.max(0, Math.min(10, s[id] + dir));
    else s[id] = (s[id] + 1) % 11;
    Audio_.applySettings(); Audio_.sfx('select'); Save.write();
  } else if (id === 'shake' && (dir || ok)) { s.shake = !s.shake; Audio_.sfx('select'); Save.write(); }
  else if (id === 'vibe' && (dir || ok)) { s.vibe = (s.vibe + (dir || 1) + 3) % 3; Audio_.sfx('select'); Save.write(); haptic('hurt'); }
  else if (id === 'full' && (dir || ok) && !click) toggleFullscreen();
  else if ((id === 'assist' || id === 'cb' || id === 'lefty') && (dir || ok)) { s[id] = !s[id]; Audio_.sfx('select'); Save.write(); }
  else if (id === 'keys' && ok) { Audio_.sfx('confirm'); setState('keys'); }
  else if (id === 'share' && (dir || ok)) { setShare(!s.share); Audio_.sfx('select'); }
  else if (id === 'save' && ok) { Audio_.sfx('confirm'); openSaveMenu(); }
  else if (id === 'lang' && (dir || ok)) { const i = LANGS.findIndex(l => l[0] === langId()); s.lang = LANGS[(i + (dir || 1) + LANGS.length) % LANGS.length][0]; Audio_.sfx('select'); Save.write(); }
  return false;
}
function drawSettings() {
  if (G.back === 'title') drawTitleBg();
  dim(0.5);
  const rows = settingsRows(), gap = setGap(rows), h = rows.length * gap + 36;
  panel(VW / 2 - 104, 40, 208, h + 10);
  text('SETTINGS', VW / 2, 48, 'Y', 2, 1);
  rows.forEach(([, label, val, v], i) => {
    const y = SET_Y + i * gap, sel = i === G.menuSel;
    if (sel) pointer(SET_X - 10, y);
    text(label, SET_X, y, sel ? 'Y' : 'l', 1);
    if (val === 'bar') {
      rect(BAR_X - 1, y - 1, 71, 9, '0');
      for (let k = 0; k < 10; k++) rect(BAR_X + k * 7, y, 6, 7, k < v ? (sel ? 'Y' : 'w') : '2');
    } else if (val) text(val, BAR_X + 69, y, sel ? 'Y' : 'w', 1, 2);
  });
  const fi = rows.findIndex(r => r[0] === 'full');
  G.tapFull = fi < 0 ? null : [SET_Y + fi * gap - 4, SET_Y + fi * gap + gap - 5];
  const ly = SET_Y + rows.length * gap - 2, help = SET_HELP[rows[G.menuSel] && rows[G.menuSel][0]];
  rect(VW / 2 - 92, ly, 184, 1, '2');
  if (help) text(help, VW / 2, ly + 6, 'c', 1, 1);
  else text(Input.lastAim === 'pad' ? 'LEFT / RIGHT: ADJUST    B: BACK' : 'LEFT / RIGHT: ADJUST    ESC: BACK', VW / 2, ly + 6, 'c', 1, 1);
}

// ---------- Pause / game over / win ----------
function pauseItems() {
  if (NET.role) return NET.role === 'host' ? ['CONTINUE', 'SETTINGS', 'BACK TO THE LOBBY', 'END GAME'] : ['CONTINUE', 'SETTINGS', 'LEAVE GAME'];
  return ['CONTINUE', 'SETTINGS'].concat(G.tut ? ['SKIP TUTORIAL'] : [], [G.mode === 'arena' || G.daily ? 'QUIT' : 'SAVE AND QUIT']);
}
function drawPause() {
  dim(0.6);
  const host = NET.role === 'host';
  panel(VW / 2 - 124, 20, 248, host ? 184 : 174);
  text(NET.role ? 'MENU (THE GAME GOES ON)' : 'PAUSED', VW / 2, 27, 'Y', 2, 1);
  const p = G.player, items = p.items;
  let tip = null;
  if (items.length) {
    const per = 12, w = Math.min(items.length, per) * 18 - 2, x0 = Math.round((VW - w) / 2);
    items.slice(0, 24).forEach((id, i) => {
      const x = x0 + (i % per) * 18, y = 41 + Math.floor(i / per) * 18;
      rect(x - 1, y - 1, 18, 18, '2');
      drawS(S('icon_' + id), x, y);
      if (mouseOn() && Input.mx >= x && Input.mx < x + 16 && Input.my >= y && Input.my < y + 16) tip = id;
    });
  } else text('NO MAGIC ITEMS YET', VW / 2, 52, 'l', 1, 1);
  const sy = !items.length ? 76 : items.length > 12 ? 82 : 64;
  if (tip) {
    text(ITEMS[tip].name, VW / 2, sy, 'Y', 1, 1);
    text(ITEMS[tip].desc, VW / 2, sy + 11, 'w', 1, 1);
  } else {
    const shots = p.shots + (p.backshot ? 1 : 0) + (p.wand === 'scatter' ? WANDS.scatter.fan : 0);
    const cols = [['DAMAGE', p.dmg.toFixed(1)], ['SHOTS/SEC', (1 / p.fireDelay).toFixed(1) + (shots > 1 ? ' X' + shots : '')],
      ['RANGE', String(Math.round(p.range))], ['SPEED', String(Math.round(p.speed))]];
    cols.forEach(([k, v], i) => {
      const x = i % 2 ? VW / 2 + 8 : VW / 2 - 108, y = sy + Math.floor(i / 2) * 11;
      text(k, x, y, 'l', 1); text(v, x + 100, y, 'Y', 1, 2);
    });
  }
  drawMenu(pauseItems(), 118);
  rect(VW / 2 - 110, 162, 220, 1, '2');
  const where = isDuel() ? 'BOSS FIGHT' : G.mode === 'arena' ? 'WAVE ' + Math.max(1, G.arena.wave) : 'LAND ' + (G.floor.depth + 1);
  text(where + '   ' + DIFFS[G.diff].name + '   ' + fmtTime(G.stats.time), VW / 2, 170, 'c', 1, 1);
  if (host) text('CODE: ' + NET.code, VW / 2, 182, 'l', 1, 1);
}
function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function endItems() {
  if (NET.role === 'client') return ['LEAVE'];
  if (G.daily) return ['PRACTICE'].concat(G.daily.key === dailyKeyOf(G.daily.kind) ? ['SHARE'] : [], ['MENU']);
  const mid = NET.role === 'host' ? ['LOBBY'] : !NET.role && menuOpen('garden') ? ['GARDEN'] : [];
  return (G.state === 'win' && !isDuel() ? ['KEEP GOING: ENDLESS MODE'] : ['AGAIN!']).concat(mid, ['MENU']);
}
function drawOver() { drawEndScreen(G.players.length > 1 ? 'THE TEAM FELL!' : 'OOPS!', 'P', G.players.length > 1 ? 'EVERYONE RAN OUT OF HEARTS...' : 'YOU RAN OUT OF HEARTS...'); }
function drawWin() {
  drawEndScreen('VICTORY!', 'Y', isDuel() ? 'BIG GRIN IS BEATEN!' : 'THE STAR GARDEN SHINES AGAIN!');
  for (let i = 0; i < 10; i++) {
    const a = G.time * 0.7 + i * 0.63;
    drawS(S(i % 2 ? 'sparkle_0' : 'sparkle_1'), VW / 2 + Math.cos(a) * 116 - 1, 108 + Math.sin(a) * 92 - 1);
  }
}

// Portrait on a phone: a little phone tipping over to landscape.
function drawRotate() {
  dim(0.9);
  const x = VW / 2, y = 88, flat = Math.floor(G.time * 1.2) % 2;
  const w = flat ? 30 : 18, h = flat ? 18 : 30;
  rect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, '0');
  rect(x - w / 2, y - h / 2, w, h, 'l');
  rect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4, '2');
  if (flat) { drawS(S('hero_s0'), x - 8, y - 9); rect(x + w / 2 - 2, y - 2, 1, 4, 'm'); }
  else rect(x - 2, y + h / 2 - 2, 4, 1, 'm');
  drawS(S('sparkle_' + (Math.floor(G.time * 4) % 2)), x + 20, y - 18);
  text('PLEASE TURN YOUR DEVICE', VW / 2, 118, 'Y', 2, 1);
  text('STAR GARDEN PLAYS IN LANDSCAPE', VW / 2, 132, 'w', 2, 1);
}
