'use strict';
// Wildgrove: a calendar, and the world's birthday. USE on a calendar opens the `cal` screen: a season's page of eight days,
// today ringed and the days gone by faded, each with what it brings that every screen agrees on, worked out from the day
// and the seed alone (`wgCalEvents`, the world's clock set to that day a moment: the frog's visit, a meteor shower, the
// northern lights, a full moon, the world's birthday), what the chosen day brings written under the page; PREV and NEXT
// turn the pages, a year either way at most. Every `WG_CAL_YEAR` days the world has a birthday: confetti, a toast and a
// gift from `WG_GIFTS` the first time each hero sees it (`w.meta.bday`), and the HAPPY BIRTHDAY star.
const WG_CAL_YEAR = 32;
const WG_CAL_EV = { frog: 'THE FROG VISITS', meteor: 'SHOOTING STARS', aurora: 'NORTHERN LIGHTS', moon: 'FULL MOON', bday: 'BIRTHDAY OF THE WORLD' };
const WGCAL = { pg: 0, sel: -1, memo: new Map() };
(function () {
  wgObj('calendar', { name: 'CALENDAR', kind: 'deco', tool: 'axe', hp: 2, cal: 1, drops: [DR('calendar', 1, 1)] });
  wgItem('calendar', 'CALENDAR', 'place', { place: 'calendar' }); PLACE.calendar = 'calendar'; wgRec('calendar', 1, { wood: 3, fiber: 4, petal_r: 1 }, 'bench');
  WG_ACH.push(['bday', 'HAPPY BIRTHDAY', 'CELEBRATE A YEAR IN WILDGROVE', (c) => (c.st.bday | 0) > 0]);
})();
function wgCalEvents(d) { // what day d brings: keys of WG_CAL_EV
  const key = d + ':' + (WGS.world.seed | 0); if (WGCAL.memo.has(key)) return WGCAL.memo.get(key);
  const sd = WGS.day, sc = WGS.clock, out = [];
  try {
    WGS.day = d; WGS.clock = 0.5; if (typeof wgFrogDay === 'function' && wgFrogDay()) out.push('frog');
    WGS.clock = 0.6; // that evening, for the night's sky
    if (typeof wgMeteorTonight === 'function' && wgMeteorTonight()) out.push('meteor');
    if (typeof wgAuroraTonight === 'function' && wgAuroraTonight()) out.push('aurora');
    if (typeof wgMoonPhase === 'function' && wgMoonPhase() === 4) out.push('moon');
    if (d > 0 && d % WG_CAL_YEAR === 0) out.push('bday');
  } finally { WGS.day = sd; WGS.clock = sc; }
  if (WGCAL.memo.size > 200) WGCAL.memo.clear();
  WGCAL.memo.set(key, out); return out;
}
const wgCalFirst = () => Math.max(0, (Math.floor((WGS.day | 0) / 8) + WGCAL.pg) * 8); // the first day on the page shown
const _wgUseCal = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, id = w && wgObjAt(w, WGS.dim, tx, ty); if (!id || !OBJ[id].cal) return _wgUseCal(tx, ty);
  WGS.calAt = { tx, ty, t0: WGS.t }; WGCAL.pg = 0; WGCAL.sel = (WGS.day | 0) % 8; WGS.scr = 'cal'; WGS.ui = {}; wgSfx('select');
  return true;
};
const _wgUpdCal = updateWG;
updateWG = function (dt) {
  _wgUpdCal(dt);
  const w = WGS.world, p = WGS.p, day = WGS.day | 0; if (!w || !p) return;
  if (day > 0 && day % WG_CAL_YEAR === 0 && w.meta.bday !== day && WGS.scr === 'play') { // the world's birthday
    w.meta.bday = day; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.bday = (st.bday | 0) + 1;
    const g = WG_GIFTS[hash(day, w.seed | 0, 211) % WG_GIFTS.length], left = wgInvAdd(WGS.inv, g[0], g[1]); if (left) wgDrop(p.x, p.y, g[0], left);
    wgToast('HAPPY BIRTHDAY, WILDGROVE!', 4); wgSfx('chime'); for (let i = 0; i < 4; i++) wgPart(p.x + (i - 1.5) * 14, p.y - 24, 8, { c: ['r', 'y', 'B', 'P', 'h', 'w'], s: 60, up: 40, life: 1.1 });
  }
  if (WGS.scr !== 'cal') return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  const A = WGS.calAt, id = A && wgObjAt(w, WGS.dim, A.tx, A.ty);
  if (!A || !id || !OBJ[id].cal || WGS.t > A.t0 && pressed('Escape', 'PadB')) { WGS.scr = 'play'; WGS.calAt = null; return; }
  if (pressed(...K_LEFT) || pressed('PadLB')) wgCalTurn(-1); else if (pressed(...K_RIGHT) || pressed('PadRB')) wgCalTurn(1);
};
function wgCalTurn(k) { const n = Math.max(-4, Math.min(4, WGCAL.pg + k)); if (n !== WGCAL.pg && wgCalFirst() + k * 8 >= 0) { WGCAL.pg = n; wgSfx('select'); } }
const _wgDrawCal = drawWG;
drawWG = function () {
  _wgDrawCal();
  if (WGS.scr !== 'cal' || !WGS.world || !WGS.calAt) return;
  const ui = WGS.ui, d0 = wgCalFirst(), day = WGS.day | 0, W = 288, H = 178, x = VW / 2 - W / 2, y0 = Math.round((VH - H) / 2) - 6;
  dim(0.45);
  rect(x, y0, W, H, '0'); rect(x + 1, y0 + 1, W - 2, H - 2, 'A'); rect(x + 3, y0 + 3, W - 6, H - 6, 'w'); rect(x + 3, y0 + 3, W - 6, 18, 'r'); rect(x + 3, y0 + 3, W - 6, 1, 'R'); // the paper, its red top
  for (let i = 0; i < 6; i++) { rect(x + 30 + i * 46, y0 - 2, 3, 8, '0'); rect(x + 31 + i * 46, y0 - 1, 1, 6, 'l'); } // the rings
  wtext(WG_SEASONS[Math.floor(d0 / 8) % 4], VW / 2, y0 + 9, 'w', 0, 1); wtext('YEAR ' + (Math.floor(d0 / WG_CAL_YEAR) + 1), x + W - 10, y0 + 9, 'Y', 0, 2);
  wgUiBegin(ui);
  for (let i = 0; i < 8; i++) {
    const d = d0 + i, cx = x + 10 + (i % 4) * 68, cy = y0 + 28 + Math.floor(i / 4) * 52, ev = wgCalEvents(d);
    if (wgButton(ui, '', cx, cy, 64, { h: 48 })) WGCAL.sel = i;
    if (ui.sel === ui.n - 1) WGCAL.sel = i;
    rect(cx + 2, cy + 2, 60, 44, d === day ? 'Y' : 'L');
    wtext(String(d + 1), cx + 5, cy + 5, d < day ? 'm' : '1', 0);
    ev.forEach((k, j) => wgCalIcon(k, cx + 4 + j * 19 - (ev.length > 3 ? (j * 5) : 0), cy + 26));
    if (d < day) { ctx.globalAlpha = 0.45; rect(cx + 2, cy + 2, 60, 44, 'w'); ctx.globalAlpha = 1; }
    if (d === day) { rect(cx - 1, cy - 1, 66, 1, 'o'); rect(cx - 1, cy + 48, 66, 1, 'o'); rect(cx - 1, cy, 1, 48, 'o'); rect(cx + 64, cy, 1, 48, 'o'); }
  }
  const s = WGCAL.sel >= 0 ? d0 + WGCAL.sel : -1, ev = s >= 0 ? wgCalEvents(s) : [];
  wtext(s < 0 ? '' : ev.length ? ev.map(k => tr(WG_CAL_EV[k])).join(', ') : 'A QUIET DAY', VW / 2, y0 + 136, '1', 0, 1);
  if (wgButton(ui, '<', x + 10, y0 + H - 24, 40, { off: WGCAL.pg <= -4 || d0 === 0 })) wgCalTurn(-1);
  if (wgButton(ui, 'CLOSE', VW / 2 - 40, y0 + H - 24, 80)) { WGS.scr = 'play'; WGS.calAt = null; }
  if (wgButton(ui, '>', x + W - 50, y0 + H - 24, 40, { off: WGCAL.pg >= 4 })) wgCalTurn(1);
  wgUiEnd(ui);
};
function wgCalIcon(k, x, y) { // a day's mark, 16 by 16
  if (k === 'frog') return drawS(S('frog_0'), x, y);
  if (k === 'meteor' && WGI.star_shard) return ctx.drawImage(wgIcon('star_shard'), x, y);
  ctx.drawImage(wgCalArt(k), x, y);
}
function wgCalArt(k) { // the full moon, the lights in the sky, a cake with a candle
  const key = 'cal_' + k; if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 16, 16, (g) => {
    if (k === 'moon') { wgBlob(g, 8, 8, 6, 6, ['l', 'L', 'L', 'w']); wgPx(g, 6, 7, 'l'); wgPx(g, 10, 10, 'l'); wgPx(g, 9, 5, 'l'); }
    else if (k === 'aurora') { for (let x = 1; x < 15; x++) { const t = 4 + Math.round(Math.sin(x * 0.7) * 2); wgRc(g, x, t, 1, 6, x % 2 ? 'h' : 'G'); wgPx(g, x, t, 'H'); wgPx(g, x, t + 6, 'c'); } }
    else if (k === 'meteor') { for (let i = 0; i < 7; i++) wgPx(g, 3 + i, 3 + i, i < 3 ? 'Y' : 'y'); wgRc(g, 10, 10, 3, 3, 'Y'); wgPx(g, 11, 11, 'w'); }
    else { wgRc(g, 2, 9, 12, 5, 'q'); wgRc(g, 2, 9, 12, 1, 'w'); wgRc(g, 3, 6, 10, 3, 'P'); wgRc(g, 3, 6, 10, 1, 'w'); wgPx(g, 5, 10, 'r'); wgPx(g, 9, 11, 'r'); wgPx(g, 12, 10, 'r'); wgRc(g, 7, 3, 2, 3, 'B'); wgPx(g, 7, 1, 'y'); wgPx(g, 8, 2, 'O'); } // the cake
  });
}
function wgCalSign() { // the calendar standing: a board on a post, its red top, rings and the little grid of days
  return WGA.cache.calendar_up || wgMake('calendar_up', 16, 22, (g) => {
    wgRc(g, 7, 15, 2, 6, 'n'); wgPx(g, 7, 15, 'N'); wgRc(g, 5, 20, 6, 1, 'u'); // the post and its foot
    wgRc(g, 2, 2, 12, 13, 'w'); wgRc(g, 2, 2, 12, 3, 'r'); wgRc(g, 2, 2, 12, 1, 'R'); wgRc(g, 13, 5, 1, 10, 'l'); wgRc(g, 2, 14, 12, 1, 'l'); // the paper and its red top
    for (const xx of [4, 8, 11]) wgPx(g, xx, 1, 'm'); // the rings
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) wgPx(g, 3 + i * 3, 7 + j * 2, j === 1 && i === 2 ? 'r' : 'm'); // the days
  });
}
const _wgDrawObjCal = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.cal) return _wgDrawObjCal(id, tx, ty, sx, sy);
  shadow(sx + 8, sy + 14, 8); const A = wgCalSign(); ctx.drawImage(A, sx, sy + 16 - A.height);
};
const _wgTipCal = wgTipLines;
wgTipLines = function (s) { const L = _wgTipCal(s); if (s.id === 'calendar') L.push('SEE WHAT THE DAYS WILL BRING'); return L; };
const _wgBuildCal = wgBuildAll;
wgBuildAll = function () { _wgBuildCal(); wgReg('calendar', [wgCalSign()]); };
const _wgIconCal = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'calendar' || WGA.cache[key]) return _wgIconCal(id);
  const c = wgMake(key, 16, 16, (g) => { // the page, small
    wgRc(g, 2, 2, 12, 12, 'w'); wgRc(g, 2, 2, 12, 3, 'r'); wgRc(g, 2, 2, 12, 1, 'R'); wgRc(g, 13, 5, 1, 9, 'l'); wgRc(g, 2, 13, 12, 1, 'l');
    for (const xx of [4, 8, 11]) wgPx(g, xx, 1, 'm'); for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) wgPx(g, 3 + i * 3, 7 + j * 2, j === 1 && i === 2 ? 'r' : 'm');
  });
  WGA.cache[key] = c; return c;
};
