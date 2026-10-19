'use strict';
// Wildgrove: things that give a little every day. A crab pot set out on water and a mushroom log set out on land each
// hold something new once a day: whether today's is still there is the tile's meta (`wgDailyMark`, the day % 255 plus
// one, of the last emptying), so it goes over co-op with the tile and the first is ready the day after it is set out
// (a `wgSetObj` wrapper marks a new one). USE empties it: the pot gives a catch from `WG_POT_CATCH`, the log brown
// mushrooms, now and then a red one, in autumn a chanterelle. The pot's buoy raises a flag and the log grows caps while
// something waits (a `wgDrawObj` wrapper). The POT LUCK star for ten pots emptied, MUSHROOM FARMER for five logs.
const WG_POT_CATCH = [['shell', 1, 2, 35], ['fish', 1, 1, 30], ['meat', 1, 1, 20], ['shell', 3, 3, 10], ['pearl', 1, 1, 5]]; // item, from, to, weight
const wgDailyMark = () => (WGS.day | 0) % 255 + 1;
const wgDailyReady = (tx, ty) => wgMetaAt(WGS.world, WGS.dim, tx, ty) !== wgDailyMark();
(function () {
  wgObj('crab_pot', { name: 'CRAB POT', kind: 'deco', tool: 'hand', hp: 1, solid: 0, water: 1, daily: 'pot', drops: [DR('crab_pot', 1, 1)] });
  wgItem('crab_pot', 'CRAB POT', 'place', { place: 'crab_pot' }); PLACE.crab_pot = 'crab_pot'; wgRec('crab_pot', 1, { stick: 4, string: 2, fish: 1 }, 'bench');
  wgObj('mush_log', { name: 'MUSHROOM LOG', kind: 'deco', tool: 'axe', hp: 3, daily: 'log', drops: [DR('mush_log', 1, 1)] });
  wgItem('mush_log', 'MUSHROOM LOG', 'place', { place: 'mush_log' }); PLACE.mush_log = 'mush_log'; wgRec('mush_log', 1, { wood: 4, mush_b: 2 }, 'hand');
  WG_ACH.push(['potluck', 'POT LUCK', 'EMPTY A CRAB POT TEN TIMES', (c) => (c.st.pots | 0) >= 10], ['mushlog', 'MUSHROOM FARMER', 'PICK A MUSHROOM LOG FIVE TIMES', (c) => (c.st.mlogs | 0) >= 5]);
})();
const _wgCanPlaceDaily = wgCanPlaceAt;
wgCanPlaceAt = function (tx, ty, item) { return item.place === 'crab_pot' && wgGroundAtT(tx, ty).liq !== 'water' ? false : _wgCanPlaceDaily(tx, ty, item); };
const _wgSetObjDaily = wgSetObj;
wgSetObj = function (w, dim, x, y, id, meta) { // a new one is marked as emptied today
  const o = id && OBJ[id];
  if (o && o.daily && !meta && w === WGS.world && !(typeof WGN !== 'undefined' && WGN.applying) && wgObjAt(w, dim, x, y) !== id) meta = wgDailyMark();
  return _wgSetObjDaily(w, dim, x, y, id, meta);
};
const _wgUseDaily = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if (!o || !o.daily) return _wgUseDaily(tx, ty);
  if (!wgDailyReady(tx, ty)) { wgToast(o.daily === 'pot' ? 'NOTHING YET. TRY TOMORROW' : 'NO MUSHROOMS YET. TRY TOMORROW'); return true; }
  wgSetObj(w, dim, tx, ty, id, wgDailyMark());
  const got = [], st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }), x = tx * 16 + 8, y = ty * 16 + 10;
  if (o.daily === 'pot') {
    let r = Math.random() * 100; const c = WG_POT_CATCH.find(q => (r -= q[3]) < 0) || WG_POT_CATCH[0];
    got.push([c[0], c[1] + Math.floor(Math.random() * (c[2] - c[1] + 1))]); st.pots = (st.pots | 0) + 1; wgPart(x, y, 5, { c: ['C', 'w'], s: 16, up: 14, life: 0.5 });
  } else {
    got.push(['mush_b', 2 + (Math.random() < 0.5 ? 1 : 0)]); if (Math.random() < 0.3) got.push(['mush_r', 1]);
    if (wgSeason() === 2 && WGI.chanterelle && Math.random() < 0.25) got.push(['chanterelle', 1]); st.mlogs = (st.mlogs | 0) + 1;
  }
  for (const [it, n] of got) { const left = wgInvAdd(WGS.inv, it, n); if (left) wgDrop(x, y, it, left); }
  wgToast(tr(WGI[got[0][0]] ? WGI[got[0][0]].name : got[0][0]) + ' X' + got[0][1], 2); wgSfx('pickup');
  return true;
};
const _wgDrawObjDaily = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.daily) return _wgDrawObjDaily(id, tx, ty, sx, sy);
  const ready = wgDailyReady(tx, ty), h = hash(tx, ty, 31);
  if (o.daily === 'pot') { // the cage under the water, its rope up to a bobbing buoy that raises a flag while a catch waits
    const bob = Math.round(Math.sin(WGS.t * 1.8 + (h & 63) / 10));
    ctx.globalAlpha = 0.55; ctx.drawImage(wgDailyArt('cage'), sx + 1, sy + 6); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.5; rect(sx + 5, sy + 12, 7, 1, 'C'); ctx.globalAlpha = 1;
    ctx.drawImage(wgDailyArt(ready ? 'buoy1' : 'buoy0'), sx + 4, sy + 1 + bob); return;
  }
  shadow(sx + 8, sy + 14, 14); ctx.drawImage(wgDailyArt(ready ? 'log1' : 'log0'), sx - 1, sy + 4);
};
function wgDailyArt(k) { // the pot's cage and buoy, the mushroom log bare or with caps on it, lit from the top left
  const key = 'daily_' + k; if (WGA.cache[key]) return WGA.cache[key];
  if (k === 'cage') return wgMake(key, 14, 9, (g) => { wgRc(g, 1, 1, 12, 7, 'n'); for (let x = 2; x < 13; x += 2) wgRc(g, x, 2, 1, 5, 'B'); for (let y = 3; y < 7; y += 2) wgRc(g, 2, y, 10, 1, 'B'); }, false);
  if (k === 'buoy0' || k === 'buoy1') return wgMake(key, 9, 12, (g) => {
    wgBlob(g, 4, 8, 3, 2.6, ['p', 'r', 'R', 'q']); wgRc(g, 1, 8, 7, 1, 'w'); wgPx(g, 3, 6, 'w'); // a red float with a white band
    if (k === 'buoy1') { wgRc(g, 4, 1, 1, 5, 'n'); wgRc(g, 5, 1, 3, 2, 'y'); wgPx(g, 5, 1, 'Y'); } // the flag up
  });
  return wgMake(key, 18, 12, (g) => { // a mossy log lying on its side, its cut end at the left
    wgRc(g, 2, 5, 14, 6, 'n'); wgRc(g, 2, 5, 14, 1, 'N'); wgRc(g, 2, 10, 14, 1, 'u'); for (const x of [6, 10, 13]) wgPx(g, x, 8, 'u');
    wgBlob(g, 2.5, 8, 1.8, 3, ['N', 'A', 'A', 'a']); wgPx(g, 2, 8, 'n'); // the cut end with its rings
    for (const [x, w2] of [[5, 3], [11, 2]]) wgRc(g, x, 5, w2, 1, 'G'); // moss on top
    if (k === 'log1') for (const [x, y] of [[6, 3], [10, 2], [13, 4]]) { wgBlob(g, x, y + 0.5, 2, 1.4, ['n', 'N', 'N', 'A']); wgRc(g, x, y + 1, 1, 2, 'L'); }
  });
}
const _wgTipDaily = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipDaily(s);
  if (s.id === 'crab_pot') L.push('SET IT ON WATER', 'SOMETHING NEW IN IT EVERY DAY');
  else if (s.id === 'mush_log') L.push('MUSHROOMS GROW ON IT EVERY DAY');
  return L;
};
const _wgBuildDaily = wgBuildAll;
wgBuildAll = function () { _wgBuildDaily(); wgReg('crab_pot', [wgDailyArt('buoy0')]); wgReg('mush_log', [wgDailyArt('log0')]); };
const _wgIconDaily = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if ((id !== 'crab_pot' && id !== 'mush_log') || WGA.cache[key]) return _wgIconDaily(id);
  const [c, g] = wgCv(16, 16);
  if (id === 'crab_pot') { g.drawImage(wgDailyArt('cage'), 1, 7); g.drawImage(wgDailyArt('buoy1'), 6, 0); } else g.drawImage(wgDailyArt('log1'), -1, 2);
  WGA.cache[key] = c; return c;
};
