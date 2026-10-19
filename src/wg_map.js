'use strict';
// Wildgrove: the world map (M, the pad's Back button or MAP on touch) and play with a controller.
// The map draws every chunk the hero has seen, a pixel per tile, with you and your friends, home, the
// pack you dropped, cave stairs and a pin of your own. The pin gets an arrow on the HUD, so nobody gets lost.
const WGM = { z: 1, cx: 0, cy: 0, drag: null, see: null };
const WGM_Z = [0.5, 1, 2, 3];

// ---------- what has been seen ----------
function wgSeenOf(w) { return w.seen || (w.seen = new Set(w.meta.seen || [])); }
const _wgUpkeep0 = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0, cy0, cx1, cy1) {
  const s = WGM.see;
  if (!s || s[0] !== w || s[1] !== dim || s[2] !== cx0 || s[3] !== cy0 || s[4] !== cx1 || s[5] !== cy1) { // only when the view moves into other chunks
    WGM.see = [w, dim, cx0, cy0, cx1, cy1];
    const seen = wgSeenOf(w);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) seen.add(wgCKey(dim, cx, cy));
  }
  _wgUpkeep0(w, dim, cx0, cy0, cx1, cy1);
};
const _wgSnap0 = wgSnapshot;
wgSnapshot = function () {
  const w = WGS.world; if (w && w.seen) w.meta.seen = [...w.seen];
  const rec = _wgSnap0(); rec.st.p.pin = WGS.p.pin || null; // wgLoadRecord hands it back with the rest of the hero
  return rec;
};
// a chunk's map picture is redrawn after anything in it changes
const _wgDirty0 = wgDirty;
wgDirty = function (w, dim, x, y, ch, ground) { ch.mini = null; return _wgDirty0(w, dim, x, y, ch, ground); };
const _wgRead0 = wgReadChunk;
wgReadChunk = function (ch, d) { ch.mini = null; return _wgRead0(ch, d); };

// ---------- a chunk, a pixel per tile ----------
const WGM_RGB = {};
const wgRGB = (k) => WGM_RGB[k] || (WGM_RGB[k] = ((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)])(wgCol(k)));
function wgMapCol(gid, oid, dim) {
  const o = oid && OBJ[oid];
  if (o) {
    if (o.kind === 'tree') return 'g';
    if (o.kind === 'rock') return o.solid ? 'l' : GROUND[gid].ramp[1]; // boulders, not pebbles: the map stays calm
    if (o.kind === 'wall') return o.natural ? (dim === 'u' ? '0' : o.ramp ? o.ramp[0] : 'x') : 'w';
    if (!o.natural && o.kind !== 'plant' && o.kind !== 'crop' && o.kind !== 'sapling' && o.kind !== 'stairs') return 'w'; // what people built stands out
  }
  return GROUND[gid].ramp[1];
}
function wgMiniOf(ch) {
  if (ch.mini) return ch.mini;
  const CS = WG.CS, [c, g] = wgCv(CS, CS), d = g.createImageData(CS, CS), px = d.data, marks = [];
  for (let k = 0; k < CS * CS; k++) {
    const gr = GROUND[ch.g[k]], oid = ch.o[k], o = oid && OBJ[oid];
    if (o && (o.kind === 'stairs' || o.kind === 'altar')) marks.push([k % CS, (k - k % CS) / CS, o]);
    if (gr.void) continue;
    const rgb = wgRGB(wgMapCol(ch.g[k], oid, ch.dim)), i = k * 4;
    px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = 255;
  }
  g.putImageData(d, 0, 0); ch.mini = c; ch.marks = marks;
  return c;
}

// ---------- the pin ----------
function wgPinAt(tx, ty) {
  const p = WGS.p, pin = p.pin;
  if (pin && pin.dim === WGS.dim && Math.hypot(pin.x - tx, pin.y - ty) < 5 / WGM.z + 1) { p.pin = null; Audio_.sfx('select'); return; }
  p.pin = { x: Math.floor(tx) + 0.5, y: Math.floor(ty) + 0.5, dim: WGS.dim }; Audio_.sfx('confirm');
}
function wgPinFlag(x, y) { // a little pink flag on a pole, its foot at (x, y)
  rect(x - 1, y - 11, 3, 12, '0'); rect(x, y - 10, 1, 10, 'w');
  rect(x + 1, y - 11, 7, 6, '0'); rect(x + 1, y - 10, 6, 4, 'P'); rect(x + 1, y - 10, 6, 1, 'q'); rect(x + 1, y - 7, 6, 1, 'p');
}

// ---------- the map screen ----------
function wgOpenMap() {
  const p = WGS.p; WGM.cx = p.x / 16; WGM.cy = p.y / 16; WGM.drag = null;
  WGS.scr = 'map'; WGS.ui = {}; WGS.world.meta.mapSeen = 1; Audio_.sfx('select');
}
function wgMapUpdate(dt) {
  wgUpdateWorldBg(dt);
  const kd = (n, a) => Input.down[wgKey(n)] || Input.down[a];
  const mx = (kd('right', 'ArrowRight') ? 1 : 0) - (kd('left', 'ArrowLeft') ? 1 : 0) + Input.pad.mx, my = (kd('down', 'ArrowDown') ? 1 : 0) - (kd('up', 'ArrowUp') ? 1 : 0) + Input.pad.my;
  WGM.cx += mx * 150 / WGM.z * dt; WGM.cy += my * 150 / WGM.z * dt;
  let dz = (pressed('Equal', 'NumpadAdd', 'PadRB') ? 1 : 0) - (pressed('Minus', 'NumpadSubtract', 'PadLB') ? 1 : 0);
  if (Input.wheel) { dz -= Math.sign(Input.wheel); Input.wheel = 0; }
  if (dz) WGM.z = WGM_Z[wgClamp(WGM_Z.indexOf(WGM.z) + dz, 0, WGM_Z.length - 1)];
  if (pressed('KeyC', 'PadX')) { WGM.cx = WGS.p.x / 16; WGM.cy = WGS.p.y / 16; }
  if (pressed('Enter', 'Space', 'PadA')) wgPinAt(WGM.cx, WGM.cy);
  if (pressed('KeyM', 'Escape', 'PadB', 'PadBack', wgKey('bag'))) { WGS.scr = 'play'; WGS.ui = {}; Audio_.sfx('select'); }
}
function wgMapMark(x, y, fill, hi) { rect(x - 2, y - 2, 5, 5, '0'); rect(x - 1, y - 1, 3, 3, fill); if (hi) rect(x - 1, y - 1, 1, 1, hi); }
function wgMapHouse(x, y) {
  rect(x - 1, y - 4, 3, 1, '0'); rect(x - 2, y - 3, 5, 1, '0'); rect(x - 3, y - 2, 7, 5, '0');
  rect(x - 1, y - 3, 3, 1, 'r'); rect(x - 2, y - 2, 5, 1, 'r'); rect(x - 2, y - 1, 5, 3, 'w'); rect(x, y, 1, 2, 'u');
}
function wgMapHero(x, y, col, me) { // the shirt's colour in a white ring, on any ground; yours blinks gold
  rect(x - 4, y - 4, 9, 9, '0'); rect(x - 3, y - 3, 7, 7, me && Math.floor(WGS.t * 3) % 2 ? 'Y' : 'w'); rect(x - 2, y - 2, 5, 5, '0'); rect(x - 1, y - 1, 3, 3, col);
}
function wgDrawMap() {
  const w = WGS.world, dim = WGS.dim, p = WGS.p, z = WGM.z, CS = WG.CS;
  const L = -SCR.ox, T0 = -SCR.oy, R = L + SCR.w, B = T0 + SCR.h, mx = Math.round((L + R) / 2), my = Math.round((T0 + B - 14) / 2);
  const X = (tx) => Math.round(mx + (tx - WGM.cx) * z), Y = (ty) => Math.round(my + (ty - WGM.cy) * z);
  fillScreen(PAL['1']);
  // the land
  const seen = wgSeenOf(w), host = WGN.role !== 'client', vis = [];
  const c0 = Math.floor((WGM.cx - (mx - L) / z) / CS), c1 = Math.floor((WGM.cx + (R - mx) / z) / CS), r0 = Math.floor((WGM.cy - (my - T0) / z) / CS), r1 = Math.floor((WGM.cy + (B - my) / z) / CS);
  let made = 0;
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    const key = wgCKey(dim, cx, cy);
    if (!seen.has(key)) continue;
    let ch = w.chunks.get(key);
    if (!ch || !ch.mini) { if (made >= 24) continue; made++; } // a long way walked: the map fills in over a few frames
    if (!ch) { if (!host) continue; ch = wgChunk(w, dim, cx, cy); }
    const x = X(cx * CS), y = Y(cy * CS);
    ctx.drawImage(wgMiniOf(ch), x, y, X((cx + 1) * CS) - x, Y((cy + 1) * CS) - y);
    if (ch.marks.length) vis.push(ch);
  }
  // stairs and altars, home, the pack you dropped, the pin, friends, you
  for (const ch of vis) for (const [i, j, o] of ch.marks) wgMapMark(X(ch.cx * CS + i + 0.5), Y(ch.cy * CS + j + 0.5), o.kind === 'altar' ? 'p' : o.sky ? 'w' : o.up || o.skyup ? 'C' : 'Y', o.kind === 'altar' ? 'P' : 0);
  const home = p.spawn && (p.spawn.dim || 'o') === dim ? p.spawn : dim === 'o' ? w.spawn : null;
  if (home) wgMapHouse(X(home.x / 16), Y(home.y / 16));
  const gv = p.grave; if (gv && gv.dim === dim) { const x = X(gv.x / 16), y = Y(gv.y / 16); rect(x - 3, y - 3, 7, 7, '0'); for (let k = -2; k <= 2; k++) { rect(x + k, y + k, 1, 1, 'r'); rect(x + k, y - k, 1, 1, 'r'); } }
  const pin = p.pin; if (pin && pin.dim === dim) wgPinFlag(X(pin.x), Y(pin.y));
  for (const r of WGS.remote || []) if (r.dim === dim) { const x = X(r.x / 16), y = Y(r.y / 16), look = r.look || {}; wgMapHero(x, y, WG_SHIRT[(look.shirt || 0) % 5][1], false); if (r.name) wtext(r.name, x, y - 13, 'w', 2, 1); }
  wgMapHero(X(p.x / 16), Y(p.y / 16), WG_SHIRT[((p.look || {}).shirt || 0) % 5][1], true);
  // the centre, where a pin goes with the keys or the pad
  ctx.globalAlpha = 0.7; rect(mx - 4, my, 3, 1, 'w'); rect(mx + 2, my, 3, 1, 'w'); rect(mx, my - 4, 1, 3, 'w'); rect(mx, my + 2, 1, 3, 'w'); ctx.globalAlpha = 1;
  // buttons: zoom and close, for the mouse and for fingers
  if (wgSmallBtn('-', R - 66, T0 + 4, 18, 14)) WGM.z = WGM_Z[Math.max(0, WGM_Z.indexOf(WGM.z) - 1)];
  if (wgSmallBtn('+', R - 46, T0 + 4, 18, 14)) WGM.z = WGM_Z[Math.min(WGM_Z.length - 1, WGM_Z.indexOf(WGM.z) + 1)];
  if (wgSmallBtn('X', R - 24, T0 + 4, 20, 14)) { WGS.scr = 'play'; WGS.ui = {}; Audio_.sfx('select'); return; }
  wtext(dim === 'u' ? 'MAP: THE CAVES' : dim === 'k' ? 'MAP: THE SKY' : 'MAP', L + 6, T0 + 7, 'Y', 2, 0);
  // the mouse: drag to move, click to set or lift the pin
  if (Input.mouseHit && Input.my < B - 14) WGM.drag = { x: Input.mx, y: Input.my, cx: WGM.cx, cy: WGM.cy, moved: false };
  if (WGM.drag) {
    const D = WGM.drag;
    if (Math.hypot(Input.mx - D.x, Input.my - D.y) > 3) D.moved = true;
    if (D.moved) { WGM.cx = D.cx - (Input.mx - D.x) / z; WGM.cy = D.cy - (Input.my - D.y) / z; }
    if (!Input.mouseDown) { if (!D.moved) wgPinAt(WGM.cx + (D.x - mx) / z, WGM.cy + (D.y - my) / z); WGM.drag = null; }
  }
  // the bar: where the centre is, and how to use the map
  rect(L, B - 14, SCR.w, 14, '0');
  const tx = Math.floor(WGM.cx), ty = Math.floor(WGM.cy), here = seen.has(wgCKey(dim, Math.floor(tx / CS), Math.floor(ty / CS)));
  const b = dim === 'o' ? (here ? BIOMES[wgSurface(w.seed, tx, ty).b].name : '?') : dim === 'u' ? 'CAVE' : 'THE SKY';
  const xy = 'X ' + tx + '  Y ' + ty; wtext(xy, L + 6, B - 10, 'l', 0, 0); wtext(b, L + 14 + textW(xy, 0), B - 10, 'w', 0, 0);
  const help = Input.lastAim === 'pad' ? 'A PIN  X YOU  LB RB ZOOM  B CLOSE' : Input.lastAim === 'touch' ? 'DRAG TO MOVE  TAP TO PIN' : 'CLICK PIN  C YOU  WHEEL ZOOM  M CLOSE';
  wtext(help, R - 6, B - 10, 'w', 0, 2);
}

// ---------- the pin on the HUD: an arrow and the distance, the flag itself when it is in view ----------
const _wgHud0 = wgDrawHud;
wgDrawHud = function () {
  _wgHud0();
  const p = WGS.p, pin = p && p.pin;
  if (!pin || pin.dim !== WGS.dim || WGS.scr !== 'play') return;
  const L = -SCR.ox, T0 = -SCR.oy, R = L + SCR.w, B = T0 + SCR.h, px = pin.x * 16, py = pin.y * 16, dx = px - p.x, dy = py - p.y, d = Math.hypot(dx, dy);
  if (d < 20) { p.pin = null; wgToast('YOU ARE THERE', 2); Audio_.sfx('confirm'); return; }
  const sx = Math.round(px - (Math.round(WGS.cam.x) - VW / 2)), sy = Math.round(py - (Math.round(WGS.cam.y) - VH / 2));
  if (sx > L - 8 && sx < R + 8 && sy > T0 && sy < B + 12) wgPinFlag(sx, sy - Math.round(Math.abs(Math.sin(WGS.t * 3)) * 2));
  else {
    const a = Math.atan2(dy, dx), ax = Math.round((L + R) / 2 + Math.cos(a) * 64), ay = Math.round((T0 + B) / 2 - 8 + Math.sin(a) * 48);
    wgPinFlag(ax - 3, ay + 3); // the same flag as on the map, on a ring round the hero
    wtext(Math.round(d / 16) + 'M', ax, ay + 6, 'P', 2, 1);
  }
};

// ---------- the loop: the map screen, the M key, a cursor for the pad in the backpack ----------
const _wgUpd0 = updateWG;
updateWG = function (dt) {
  if (WGS.scr === 'play' && WGS.world && !WGU.chatOpen && pressed('KeyM', 'PadBack')) { wgOpenMap(); return; }
  _wgUpd0(dt);
  const s = WGS.scr;
  if (s === 'map') { wgMapUpdate(dt); if (wgHostLive()) wgHostWorld(dt); }
  else if ((s === 'inv' || s === 'chest' || s === 'trade') && Input.lastAim === 'pad') { // the left stick moves a pointer: A clicks, X right-clicks, RB shift-clicks
    Input.mx = wgClamp(Input.mx + Input.pad.mx * 170 * dt, -SCR.ox, -SCR.ox + SCR.w - 1); Input.my = wgClamp(Input.my + Input.pad.my * 170 * dt, -SCR.oy, -SCR.oy + SCR.h - 1);
    if (pressed('PadA')) Input.mouseHit = true;
    if (pressed('PadX')) Input.rHit = true;
    if (pressed('PadRB')) { Input.mouseHit = true; WGS.quick = true; } // RB: the whole stack, like a shift-click
  }
};
const _wgDraw0 = drawWG;
drawWG = function () {
  if (WGS.scr === 'map' && WGS.world) return wgDrawMap();
  _wgDraw0(); WGS.quick = false;
  if (Input.lastAim === 'pad' && (WGS.scr === 'inv' || WGS.scr === 'chest' || WGS.scr === 'trade')) drawS(S('cursor'), Math.round(Input.mx) - 4, Math.round(Input.my) - 4);
};
WG_HINTS.push(['PRESS M FOR THE MAP: CLICK IT TO SET A PIN', () => WGS.world.meta.mapSeen]);
