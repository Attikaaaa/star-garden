'use strict';
// Wildgrove: waystones. Build two or more and USE one: a list of the others opens, nearest first, each with its distance
// and an arrow (one in another dimension says where); pick one and stand still while it glows, and you step out beside
// it. A sign next to a stone names it, else it goes by its land. The stones are kept in the world (meta.ways, 'dxx,yy'
// keys) as they are placed or broken on any screen, and the host hands them over in the co-op welcome, so a friend
// travels on their own screen like the homing feather. The WAYFARER star. Ids are appended, so old worlds stay valid.
const WG_WAY_T = 1.2, WG_WAY_PAGE = 7, WG_WAY_RE = /^([ouk])(-?\d+),(-?\d+)$/; // the glow's seconds, stones a page, a key
(function () {
  wgObj('waystone', { name: 'WAYSTONE', kind: 'deco', tool: 'pick', hp: 10, light: 30, anim: 1, way: 1, drops: [DR('waystone', 1, 1)] });
  wgItem('waystone', 'WAYSTONE', 'place', { place: 'waystone' }); PLACE.waystone = 'waystone'; wgRec('waystone', 1, { stone: 10, crystal: 2 }, 'bench');
  WG_ACH.push(['ways', 'WAYFARER', 'TRAVEL BY WAYSTONE THREE TIMES', (c) => (c.st.ways | 0) >= 3]);
})();
const wgWayParse = (k) => { const m = WG_WAY_RE.exec(k); return m ? [m[1], +m[2], +m[3]] : null; };
// The list follows every tile change, on the host, alone and on a guest's screen (the host's changes come through here).
const _wgSetObjWays = wgSetObj;
wgSetObj = function (w, dim, x, y, id, meta) {
  if (w === WGS.world && w.meta) {
    const now = id === O_ID.waystone, was = wgObjAt(w, dim, x, y) === O_ID.waystone;
    if (now !== was) { const L = w.meta.ways || (w.meta.ways = []), k = dim + x + ',' + y, i = L.indexOf(k); if (now && i < 0) L.push(k); else if (!now && i >= 0) L.splice(i, 1); }
  }
  return _wgSetObjWays(w, dim, x, y, id, meta);
};
if (typeof wgnWelcome === 'function') {
  const _wgnWelcomeWays = wgnWelcome;
  wgnWelcome = function (L) { const o = _wgnWelcomeWays(L); o.ways = (WGS.world.meta.ways || []).slice(0, 200); return o; };
  const _wgnEnterWays = wgnEnter;
  wgnEnter = function (wl) { _wgnEnterWays(wl); WGS.world.meta.ways = Array.isArray(wl.ways) ? wl.ways.filter(k => typeof k === 'string' && WG_WAY_RE.test(k)).slice(0, 200) : []; };
}
function wgWayName(d, x, y) { // a sign beside the stone, else its land
  if (typeof wgSignLines === 'function') for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) { const s = WGS.signs && WGS.signs[d + (x + dx) + ',' + (y + dy)], v = s && (wgSignLines(s)[0] || '').slice(0, 20); if (v) return { v, raw: 1 }; }
  return { v: d === 'o' ? BIOMES[wgSurface(WGS.world.seed, x, y).b].name : d === 'u' ? 'CAVE' : 'THE SKY', raw: 0 };
}
function wgWayList(from) { // every other stone: nearest first, those in another dimension last
  const [fd, fx, fy] = wgWayParse(from) || ['o', 0, 0];
  return (WGS.world.meta.ways || []).filter(k => k !== from && wgWayParse(k)).map(k => { const [d, x, y] = wgWayParse(k); return { k, d, x, y, name: wgWayName(d, x, y), far: d === fd ? Math.round(Math.hypot(x - fx, y - fy)) : -1, a: Math.atan2(y - fy, x - fx) }; })
    .sort((a, b) => (a.far < 0) - (b.far < 0) || a.far - b.far);
}
const _wgUseWays = wgUse;
wgUse = function (tx, ty) {
  const o = OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (!o || !o.way) return _wgUseWays(tx, ty);
  const k = WGS.dim + tx + ',' + ty, m = WGS.world.meta, L = m.ways || (m.ways = []); if (!L.includes(k)) L.push(k); // a stone from before the list began
  WGS.way = { from: k, list: wgWayList(k), page: 0, t0: WGS.t }; WGS.scr = 'way'; WGS.ui = {}; wgSfx('chime');
  return true;
};
function wgWayGo(r) { const p = WGS.p; WGS.scr = 'play'; WGS.way = null; WGS.waying = { t: WG_WAY_T, x: p.x, y: p.y, hp: p.hp, to: r.k }; wgToast('STAND STILL...'); wgSfx('chime'); }
function wgWayArrive(k) {
  const p = WGS.p, w = WGS.world, P = wgWayParse(k); if (!P) return;
  const [d, x, y] = P;
  if (WGN.role !== 'client' && wgObjAt(w, d, x, y) !== O_ID.waystone) { const L = w.meta.ways || [], i = L.indexOf(k); if (i >= 0) L.splice(i, 1); wgToast('THE WAYSTONE IS GONE'); return; } // a guest trusts the host's list
  wgPart(p.x, p.y - 10, 8, { c: ['c', 'C', 'w'], s: 30, up: 20 });
  if (d !== WGS.dim) { WGS.dim = d; WGS.mobs = []; WGS.mine = null; } // what roams another dimension stays there
  let at = [x * 16 + 8, (y + 1) * 16 + 10];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [0, 2]]) { const tx = x + dx, ty = y + dy; if (!wgObjAt(w, d, tx, ty) && !GROUND[wgGround(w, d, tx, ty)].liq && !GROUND[wgGround(w, d, tx, ty)].void) { at = [tx * 16 + 8, ty * 16 + 10]; break; } }
  p.x = at[0]; p.y = at[1]; p.vx = p.vy = 0; WGS.cam.x = p.x; WGS.cam.y = p.y;
  wgPart(p.x, p.y - 10, 10, { c: ['c', 'C', 'w'], s: 30, up: 20 }); wgSfx('pickup');
  const n = wgWayName(d, x, y); if (n.raw) WGS.toast = { msg: n.v, t: 2, raw: 1 }; else wgToast(n.v, 2);
  const m = w.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.ways = (st.ways | 0) + 1;
}
const _wgUpdWays = updateWG;
updateWG = function (dt) {
  _wgUpdWays(dt);
  if (WGS.scr === 'way' && WGS.world) {
    if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
    if (!WGS.way || WGS.t > WGS.way.t0 && pressed('Escape', 'PadB')) { WGS.scr = 'play'; WGS.way = null; } // not on the press that opened it
    return;
  }
  const H = WGS.waying; if (!H || !WGS.p) return;
  const p = WGS.p;
  if (WGS.scr !== 'play' && WGS.scr !== 'pause') { WGS.waying = null; return; }
  if (WGS.scr !== 'play') return;
  if (Math.hypot(p.x - H.x, p.y - H.y) > 3 || p.hp < H.hp) { WGS.waying = null; wgToast('THE GLOW FADES'); return; }
  if (Math.random() < dt * 14) { const a = Math.random() * 6.28; wgPart(p.x + Math.cos(a) * 14, p.y - 10 + Math.sin(a) * 10, 1, { c: ['c', 'C', 'w'], s: 4, up: 10, life: 0.5 }); }
  if ((H.t -= dt) <= 0) { WGS.waying = null; wgWayArrive(H.to); }
};
const _wgTipWays = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipWays(s);
  if (s.id === 'waystone') L.push('USE ONE TO TRAVEL TO ANOTHER', 'A SIGN BESIDE IT GIVES ITS NAME');
  return L;
};
// ---------- the list ----------
function wgWayArrow(x, y, a) { // a little arrow pointing the way, outlined
  const c = Math.cos(a), s = Math.sin(a), pts = [];
  for (let i = -3; i <= 3; i++) pts.push([Math.round(x + c * i), Math.round(y + s * i)]);
  const tx = x + c * 3, ty = y + s * 3; for (const b of [2.5, -2.5]) for (let i = 1; i <= 2; i++) pts.push([Math.round(tx + Math.cos(a + b) * i), Math.round(ty + Math.sin(a + b) * i)]);
  for (const [px, py] of pts) rect(px - 1, py - 1, 3, 3, '0'); for (const [px, py] of pts) rect(px, py, 1, 1, 'C');
}
const _wgDrawWays = drawWG;
drawWG = function () {
  _wgDrawWays();
  if (WGS.scr !== 'way' || !WGS.world || !WGS.way) return;
  const W = WGS.way, ui = WGS.ui, pages = Math.max(1, Math.ceil(W.list.length / WG_WAY_PAGE)), rows = Math.max(1, Math.min(WG_WAY_PAGE, W.list.length)), h = 64 + rows * 16, x = VW / 2 - 116, y0 = Math.round((VH - h) / 2) - 8;
  dim(0.45); // the panel fits its rows
  rect(x, y0, 232, h, '0'); rect(x + 1, y0 + 1, 230, h - 2, 'd'); rect(x + 2, y0 + 2, 228, h - 4, '1'); rect(x + 2, y0 + 2, 228, 1, '2');
  wtext('WAYSTONES', VW / 2, y0 + 8, 'Y', 0, 1); wtext(W.list.length ? 'WHERE TO?' : 'BUILD ANOTHER WAYSTONE TO TRAVEL', VW / 2, y0 + 20, 'l', 0, 1);
  wgUiBegin(ui);
  W.list.slice(W.page * WG_WAY_PAGE, W.page * WG_WAY_PAGE + WG_WAY_PAGE).forEach((r, i) => {
    const by = y0 + 34 + i * 16, sel = ui.sel === ui.n;
    if (wgButton(ui, '', x + 8, by, 216)) wgWayGo(r);
    const col = sel ? '0' : 'w';
    if (r.name.raw) wgRawText(r.name.v, x + 16, by + 4, col, 0); else wtext(r.name.v, x + 16, by + 4, col, 0);
    if (r.far >= 0) { wtext(String(r.far), x + 200, by + 4, col, 0, 2); wgWayArrow(x + 213, by + 7, r.a); }
    else wtext(r.d === 'u' ? 'BELOW' : r.d === 'k' ? 'ABOVE' : 'UP HERE', x + 216, by + 4, col, 0, 2);
  });
  if (pages > 1 && wgButton(ui, 'MORE', x + 8, y0 + h - 22, 104)) { W.page = (W.page + 1) % pages; ui.sel = undefined; }
  if (wgButton(ui, 'CLOSE', pages > 1 ? x + 120 : VW / 2 - 52, y0 + h - 22, 104)) { WGS.scr = 'play'; WGS.way = null; }
  wgUiEnd(ui);
};
function wgMapWays(X, Y, dim) { // a little grey stone with its cyan rune for each waystone on the map
  for (const k of WGS.world.meta.ways || []) { const P = wgWayParse(k); if (!P || P[0] !== dim) continue; const x = X(P[1] + 0.5), y = Y(P[2] + 0.5); rect(x - 2, y - 4, 5, 8, '0'); rect(x - 1, y - 3, 3, 6, 'm'); rect(x - 1, y - 3, 1, 6, 'l'); rect(x, y - 1, 1, 2, 'c'); }
}
// the waystone's ring of sparks while it carries you, cyan like its rune
const _wgAmbWays = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbWays(cx0, cy0);
  const H = WGS.waying; if (!H || !WGS.p) return;
  const k = 1 - H.t / WG_WAY_T, x = WGS.p.x - cx0, y = WGS.p.y - cy0, r = 13 - k * 6, t = WGS.t * 3;
  for (let i = 0; i < 12; i++) { const a = t + i * 0.5236; rect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.4), 1, 1, i % 3 ? 'C' : 'w'); }
};
// ---------- art: a standing stone on a slab, moss at its foot, its rune pulsing ----------
const _wgBuildWays = wgBuildAll;
wgBuildAll = function () {
  _wgBuildWays();
  wgReg('waystone', ['c', 'C', 'w', 'C'].map((k, f) => wgMake('waystone' + f, 14, 26, (g) => {
    wgRc(g, 1, 22, 12, 3, 'd'); wgRc(g, 1, 22, 12, 1, 'm'); wgRc(g, 1, 22, 1, 3, 'm'); wgRc(g, 2, 24, 11, 1, 'X');
    wgRc(g, 5, 2, 4, 1, 'l'); wgRc(g, 4, 3, 6, 1, 'm'); wgPx(g, 4, 3, 'l'); wgRc(g, 3, 4, 8, 18, 'm'); wgRc(g, 3, 4, 1, 18, 'l'); wgRc(g, 4, 4, 1, 2, 'l'); wgRc(g, 10, 5, 1, 17, 'd'); wgPx(g, 9, 3, 'd');
    wgPaint(g, 4, 9, ['..xx..', '.x..x.', 'x.yy.x', 'x.yy.x', '.x..x.', '..xx..'], { x: k === 'w' ? 'C' : 'c', y: k });
    wgPx(g, 3, 21, 'G'); wgPx(g, 4, 21, 'g'); wgPx(g, 4, 20, 'G'); wgPx(g, 9, 21, 'g'); wgPx(g, 10, 21, 'G'); wgPx(g, 6, 21, 'h');
  })));
};
