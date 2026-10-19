'use strict';
// Wildgrove: treasure maps. Now and then a gift is a treasure map (it is one of `WG_GIFTS`, so it can come in a bottle,
// with the frog's mail, from the fairies...), and one chest in five holds one (a `wgLoot` wrapper). USE one in hand to read it: the first reading picks the spot, 40 to 90
// tiles off on bare, dry ground (`wgTmapPick`, from the seed, the maps dug so far and where you stand, kept in
// `w.meta.tmap`), and the `tmap` screen shows an old sketch of the land round it (`wgTmapSketch`) with a red X, how far
// and which way; reading also sets the map pin (`p.pin`), so the HUD arrow leads there. Near it the X shows on the
// ground; USE a shovel on it to dig up a chest's worth from `WG_TREASURE` (one in three holds another map), spending a
// map. Each hero's own. The TREASURE HUNTER star for three.
const WG_TREASURE = [['star_bar', 1], ['pearl', 2], ['crystal', 3], ['iron', 4], ['copper', 6], ['honey', 2], ['cookies', 3], ['obsidian', 2]];
const WG_TMAP_GROUNDS = ['grass', 'sand', 'snow', 'dirt', 'jungle', 'moss'];
const WG_TMAP_DIRS = ['TO THE EAST', 'TO THE SOUTH-EAST', 'TO THE SOUTH', 'TO THE SOUTH-WEST', 'TO THE WEST', 'TO THE NORTH-WEST', 'TO THE NORTH', 'TO THE NORTH-EAST'];
const WGTM = { art: null, key: '', dug: null }; // the sketch, drawn once per spot; the chest just dug up
(function () {
  wgItem('treasure_map', 'TREASURE MAP', 'tool', { tool: 'tmap', stack: 9 });
  WG_GIFTS.push(['treasure_map', 1]);
  WG_ACH.push(['treasure', 'TREASURE HUNTER', 'DIG UP THREE TREASURES', (c) => (c.st.treasure | 0) >= 3]);
})();
const _wgLootTmap = wgLoot;
wgLoot = function (h) { const out = _wgLootTmap(h); if (hash(4, h, 11) % 5 === 0) out.push({ id: 'treasure_map', n: 1 }); return out; }; // from the chest's own hash, as the rest
const wgTmapHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!(s && s.id === 'treasure_map'); };
function wgTmapOk(tx, ty) { // bare, dry, natural ground
  const w = WGS.world; return WG_TMAP_GROUNDS.includes(GROUND[wgGround(w, 'o', tx, ty)].id) && !wgObjAt(w, 'o', tx, ty);
}
function wgTmapPick() { // where this map's X is
  const w = WGS.world, p = WGS.p, n = w.meta.tmapN | 0, px = Math.floor(p.x / 16), py = Math.floor(p.y / 16);
  for (let i = 0; i < 80; i++) {
    const h = hash(n * 97 + i, px * 7 + py, (w.seed | 0) * 13 + 4441), a = (h % 6283) / 1000, r = 40 + (h >>> 13) % 51;
    const tx = Math.floor(px + Math.cos(a) * r), ty = Math.floor(py + Math.sin(a) * r);
    if (wgTmapOk(tx, ty)) return { x: tx, y: ty };
  }
  return null;
}
function wgTmapRead() { // USE with the map in hand
  const w = WGS.world, p = WGS.p; if (!w || !p || !wgTmapHeld()) return false;
  if (WGS.dim !== 'o') { wgToast('THE MAP SHOWS THE LAND ABOVE', 2); return true; }
  const m = w.meta; if (!m.tmap) { const s = wgTmapPick(); if (!s) { wgToast('THE MAP IS TOO FADED TO READ', 2); return true; } m.tmap = s; }
  p.pin = { x: m.tmap.x + 0.5, y: m.tmap.y + 0.5, dim: 'o' };
  WGS.tmapT = WGS.t; WGS.scr = 'tmap'; WGS.ui = {}; wgSfx('select');
  return true;
}
function wgTmapDig() { // the shovel at the X: the chest comes up
  const w = WGS.world, m = w.meta, T = m.tmap, p = WGS.p, x = T.x * 16 + 8, y = T.y * 16 + 10, n = m.tmapN | 0;
  m.tmap = null; m.tmapN = n + 1; wgInvTake(WGS.inv, 'treasure_map', 1);
  if (p.pin && p.pin.dim === 'o' && Math.floor(p.pin.x) === T.x && Math.floor(p.pin.y) === T.y) p.pin = null;
  const h = hash(T.x, T.y, (w.seed | 0) + n * 31), got = [];
  for (let i = 0; got.length < 3 && i < 16; i++) { const g = WG_TREASURE[hash(h, i, 77) % WG_TREASURE.length]; if (!got.includes(g)) got.push(g); }
  if (h % 3 === 0) got.push(['treasure_map', 1]);
  for (const [id, k] of got) { const left = wgInvAdd(WGS.inv, id, k); if (left) wgDrop(x, y, id, left); }
  const st = m.stats || (m.stats = { kills: 0, far: 0 }); st.treasure = (st.treasure | 0) + 1;
  WGTM.dug = { x, y, t: WGS.t };
  wgToast('TREASURE!', 2.5); wgSfx('chime'); wgPart(x, y - 6, 14, { c: ['y', 'Y', 'O', 'w'], s: 26, up: 30, life: 0.8 }); wgPart(x, y, 8, { c: ['n', 'N', 'e'], s: 18, up: 12, life: 0.5 });
}
const _wgUseTmap = wgUse;
wgUse = function (tx, ty) {
  const m = WGS.world && WGS.world.meta, s = WGS.inv && WGS.inv[WGS.sel], it = s && WGI[s.id];
  if (m && m.tmap && WGS.dim === 'o' && tx === m.tmap.x && ty === m.tmap.y && it && it.kind === 'tool' && it.tool === 'shovel') { wgTmapDig(); _wgUseTmap(tx, ty); return true; } // and the shovel digs as it would
  if (!wgTmapHeld()) return _wgUseTmap(tx, ty);
  return _wgUseTmap(tx, ty) || wgTmapRead();
};
const _wgUpdTmap = updateWG;
updateWG = function (dt) {
  const fresh = WGS.scr === 'play' && wgTmapHeld() && (Input.rHit || pressed(wgKey('use'), 'KeyK', 'PadX', 'PadLT') || (WGS.touch && WGS.touch.use));
  _wgUpdTmap(dt);
  if (fresh && WGS.scr === 'play' && !WGS.target) wgTmapRead(); // the aim out of reach: read all the same
  if (WGS.scr !== 'tmap' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  if (!WGS.world.meta.tmap || WGS.t > WGS.tmapT && pressed('Escape', 'PadB', wgKey('use'))) { WGS.scr = 'play'; WGS.ui = {}; } // not on the press that opened it
};
const _wgDrawTmapScr = drawWG;
drawWG = function () {
  _wgDrawTmapScr();
  if (WGS.scr === 'tmap' && WGS.world && WGS.world.meta.tmap) wgDrawTmap();
};
function wgTmapSketch(T) { // the land round the spot as an old map draws it, 21 by 13 tiles at 5 px, the X in the middle
  const key = T.x + ',' + T.y; if (WGTM.key === key && WGTM.art) return WGTM.art;
  const W = 21, H = 13, S = 5, [c, g] = wgCv(W * S, H * S), w = WGS.world;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const tx = T.x + i - 10, ty = T.y + j - 6, G = GROUND[wgGround(w, 'o', tx, ty)], o = OBJ[wgObjAt(w, 'o', tx, ty)], id = G.id;
    const col = G.liq ? (id === 'deep' ? 'c' : 'C') : id === 'sand' ? 'A' : id === 'snow' || id === 'ice' ? 'w' : id === 'rock' || id === 'cave' ? 'l' : id === 'lava' || id === 'ash' ? 'N' : id === 'mud' ? 'e' : 'a';
    wgRc(g, i * S, j * S, S, S, col);
  }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { // trees as little round crowns, rocks as dots, over the land
    const o = OBJ[wgObjAt(w, 'o', T.x + i - 10, T.y + j - 6)]; if (!o) continue;
    if (o.kind === 'tree') { wgRc(g, i * S + 1, j * S, 3, 3, 'G'); wgPx(g, i * S + 1, j * S, 'h'); wgPx(g, i * S + 2, j * S + 3, 'n'); }
    else if (o.kind === 'rock') wgRc(g, i * S + 1, j * S + 2, 2, 2, 'm');
  }
  const mx = 10 * S + 2, my = 6 * S + 2; // the X
  for (let k = -4; k <= 4; k++) { wgRc(g, mx + k, my + k, 2, 1, 'r'); wgRc(g, mx + k, my - k, 2, 1, 'r'); }
  WGTM.key = key; return (WGTM.art = c);
}
function wgDrawTmap() { // the map, unrolled
  const T = WGS.world.meta.tmap, p = WGS.p, x = VW / 2 - 116, y = 22, ui = WGS.ui;
  dim(0.45);
  rect(x, y + 4, 232, 158, '0'); rect(x + 1, y + 5, 230, 156, 'A'); rect(x + 1, y + 5, 230, 1, 'w'); rect(x + 1, y + 160, 230, 1, 'e'); rect(x + 230, y + 5, 1, 156, 'e');
  for (const [cx, cy] of [[x + 1, y + 5], [x + 226, y + 5], [x + 1, y + 156], [x + 226, y + 156]]) rect(cx, cy, 4, 4, 'a'); // worn corners
  wtext('TREASURE MAP', VW / 2, y + 13, '1', 0, 1);
  const sx = VW / 2 - 53, sy = y + 26; rect(sx - 2, sy - 2, 109, 69, 'n'); rect(sx - 1, sy - 1, 107, 67, 'e'); ctx.drawImage(wgTmapSketch(T), sx, sy);
  const rx = sx + 122, ry = sy + 30; // a little compass rose
  rect(rx, ry - 9, 1, 19, 'n'); rect(rx - 9, ry, 19, 1, 'n'); rect(rx - 1, ry - 7, 3, 1, 'n'); rect(rx, ry - 9, 1, 3, 'r'); wtext('N', rx, ry - 18, 'R', 0, 1);
  const dx = (T.x + 0.5) * 16 - p.x, dy = (T.y + 0.5) * 16 - p.y, steps = Math.round(Math.hypot(dx, dy) / 16), sec = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
  if (steps < 2) wtext('X MARKS THE SPOT: RIGHT HERE', VW / 2, sy + 76, '0', 0, 1);
  else { wtext('ABOUT ' + steps + ' STEPS', VW / 2, sy + 72, '0', 0, 1); wtext(WG_TMAP_DIRS[sec], VW / 2, sy + 83, '0', 0, 1); }
  wtext('THE PIN SHOWS THE WAY', VW / 2, sy + 97, '1', 0, 1);
  wgUiBegin(ui);
  if (wgButton(ui, 'OFF WE GO', VW / 2 - 52, y + 136, 104)) { WGS.scr = 'play'; WGS.ui = {}; }
  wgUiEnd(ui);
}
// in the world: the X on the ground, and the chest just dug up
const _wgUpkeepTmap = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepTmap(w, dim, cx0c, cy0c, cx1c, cy1c);
  const T = w === WGS.world && dim === 'o' && w.meta.tmap; if (!T) return;
  const cam = WGS.cam, x = T.x * 16 + 8 - (Math.round(cam.x) - VW / 2), y = T.y * 16 + 8 - (Math.round(cam.y) - VH / 2);
  if (x < -SCR.ox - 16 || x > SCR.w - SCR.ox + 16 || y < -SCR.oy - 16 || y > SCR.h - SCR.oy + 16) return;
  for (let k = -3; k <= 3; k++) { rect(x + k - 1, y + k, 3, 1, 'n'); rect(x + k - 1, y - k, 3, 1, 'n'); } // scuffed earth in a cross
  for (const [a, b] of [[-3, -3], [3, -3]]) rect(x + a - 1, y + b, 2, 1, 'N');
};
const _wgAmbTmap = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbTmap(cx0, cy0);
  const D = WGTM.dug; if (!D) return;
  const age = WGS.t - D.t; if (age > 3 || age < 0) { WGTM.dug = null; return; }
  const sx = Math.round(D.x - cx0), sy = Math.round(D.y - cy0), up = Math.round(Math.min(1, age / 0.3) * 4);
  ctx.globalAlpha = age > 2.5 ? (3 - age) * 2 : 1; shadow(sx, sy + 1, 7); ctx.drawImage(wgTmapChest(), sx - 7, sy - 10 - up);
  if (Math.floor(age * 6) % 2 === 0) { rect(sx - 4, sy - 14 - up, 1, 1, 'w'); rect(sx + 3, sy - 16 - up, 1, 1, 'Y'); }
  ctx.globalAlpha = 1;
};
function wgTmapChest() { // a little open chest, gold inside
  if (WGA.cache.tmap_chest) return WGA.cache.tmap_chest;
  return wgMake('tmap_chest', 14, 12, (g) => {
    wgRc(g, 2, 1, 10, 3, 'n'); wgRc(g, 2, 1, 10, 1, 'N'); // the lid, thrown back
    wgRc(g, 2, 4, 10, 2, 'y'); wgPx(g, 4, 4, 'Y'); wgPx(g, 8, 4, 'w'); wgPx(g, 10, 5, 'O'); // gold
    wgRc(g, 1, 6, 12, 5, 'n'); wgRc(g, 1, 6, 12, 1, 'N'); wgRc(g, 1, 10, 12, 1, 'u'); wgRc(g, 6, 7, 2, 2, 'y'); wgPx(g, 6, 7, 'Y'); // the box and its lock
  });
}
const _wgTipTmap = wgTipLines;
wgTipLines = function (s) { const L = _wgTipTmap(s); if (s.id === 'treasure_map') L.push('USE IT TO READ IT', 'DIG AT THE X WITH A SHOVEL'); return L; };
const _wgIconTmap = wgIcon;
wgIcon = function (id) { // an old map, curled at one end, a path of dashes to a red X
  const key = 'ic_' + id; if (id !== 'treasure_map' || WGA.cache[key]) return _wgIconTmap(id);
  const [c, g] = wgCv(16, 16);
  wgRc(g, 2, 3, 12, 10, 'A'); wgRc(g, 2, 3, 12, 1, 'w'); wgRc(g, 13, 3, 1, 10, 'e'); wgRc(g, 2, 12, 12, 1, 'e'); wgRc(g, 1, 3, 1, 10, 'a'); wgRc(g, 0, 4, 1, 8, 'e'); // the curl
  for (const [x, y] of [[4, 10], [5, 9], [7, 9], [8, 8]]) wgPx(g, x, y, 'n');
  for (let k = -1; k <= 1; k++) { wgPx(g, 10 + k, 6 + k, 'r'); wgPx(g, 10 + k, 6 - k, 'r'); }
  wgPx(g, 4, 5, 'G'); wgPx(g, 5, 5, 'h'); wgPx(g, 5, 6, 'G');
  wgOutline(c); WGA.cache[key] = c; return c;
};
