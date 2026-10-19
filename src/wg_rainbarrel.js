'use strict';
// Wildgrove: a rain barrel. Out under the sky it fills a little at a time while it rains, up to WG_BARREL_FULL (its
// meta, filled by the host, so friends see the same water); an empty bucket USEd on it comes away full, a step that
// spares the walk to the pond. Its water shows in the open top, rippled by the rain. RAINY DAY for the first bucket.
const WG_BARREL_FULL = 4;
const WGRB = { t: 1 };
(function () {
  wgObj('rain_barrel', { name: 'RAIN BARREL', kind: 'deco', tool: 'axe', hp: 4, rainb: 1, drops: [DR('rain_barrel', 1, 1)] });
  wgItem('rain_barrel', 'RAIN BARREL', 'place', { place: 'rain_barrel' }); PLACE.rain_barrel = 'rain_barrel'; wgRec('rain_barrel', 1, { wood: 6, copper: 1 }, 'bench');
  WG_ACH.push(['barrel', 'RAINY DAY', 'FILL A BUCKET FROM A RAIN BARREL', (c) => c.st.barrel]);
})();
// the host fills every barrel under the open sky a little at a time while it rains
const _wgUpdBarrel = updateWG;
updateWG = function (dt) {
  _wgUpdBarrel(dt);
  const w = WGS.world; if (!w || WGN.role === 'client' || !WGS.weather || WGS.dim !== 'o' || (WGRB.t -= dt) > 0) return;
  WGRB.t = 1; const CS = WG.CS, id = O_ID.rain_barrel;
  for (const [key, ch] of w.chunks) {
    if (ch.dim !== 'o' && key[0] !== 'o') continue;
    for (let k = 0; k < CS * CS; k++) if (ch.o[k] === id && ch.m[k] < WG_BARREL_FULL && Math.random() < 1 / 12) wgSetObj(w, 'o', ch.cx * CS + k % CS, ch.cy * CS + Math.floor(k / CS), id, ch.m[k] + 1);
  }
};
const _wgUseBarrel = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty);
  if (!id || !OBJ[id].rainb) return _wgUseBarrel(tx, ty);
  const m = wgMetaAt(w, dim, tx, ty), s = WGS.inv[WGS.sel], it = s && WGI[s.id];
  if (!m) { wgToast('IT IS WAITING FOR RAIN'); return true; }
  if (!it || it.tool !== 'bucket' || it.full) { wgToast(m >= WG_BARREL_FULL ? 'IT IS FULL OF RAIN' : 'A BUCKET CAN FILL HERE'); return true; }
  wgInvTake(WGS.inv, 'bucket', 1); wgInvAdd(WGS.inv, 'bucket_water', 1); wgSetObj(w, dim, tx, ty, id, m - 1); wgSfx('bubble');
  wgPart(tx * 16 + 8, ty * 16 - 2, 5, { c: ['b', 'B', 'c', 'C'], s: 18, up: 16 });
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.barrel = 1;
  return true;
};
// ---------- drawing: the water in the open top, its level from the meta, rings while it rains ----------
const _wgDrawObjBarrel = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjBarrel(id, tx, ty, sx, sy);
  if (!OBJ[id].rainb) return;
  const m = Math.min(WG_BARREL_FULL, wgMetaAt(WGS.world, WGS.dim, tx, ty)); if (!m) return;
  const Y = sy - 2, rows = [[4, 8], [3, 10], [4, 8]], top = 2 - Math.min(2, m - 1); // the opening's rows (x0, width) from sprite row 3; the water fills them from the bottom
  for (let r = top; r < 3; r++) { const [x0, n] = rows[r]; rect(sx + x0, Y + 3 + r, n, 1, r === top ? (m >= WG_BARREL_FULL ? 'c' : 'B') : 'b'); }
  if (m >= WG_BARREL_FULL) rect(sx + 5, Y + 3, 2, 1, 'C'); // a glint on a full one
  if (WGS.weather && WGS.dim === 'o') { const h = hash(tx, ty, Math.floor(WGS.t * 3)); if (h % 3) rect(sx + 4 + h % 7, Y + 3 + top + (h >>> 3) % (3 - top), 1, 1, 'C'); }
};
const _wgTipBarrel = wgTipLines;
wgTipLines = function (s) { const L = _wgTipBarrel(s); if (s.id === 'rain_barrel') L.push('IT GATHERS RAIN FOR A BUCKET'); return L; };
const _wgBuildBarrel = wgBuildAll;
wgBuildAll = function () {
  _wgBuildBarrel();
  // a wooden barrel of staves and two iron hoops, open at the top (dark inside until it fills)
  wgReg('rain_barrel', [wgMake('rain_barrel', 16, 18, (g) => {
    for (let y = 6; y <= 16; y++) for (let x = 2; x <= 13; x++) wgPx(g, x, y, x <= 3 ? 'N' : x >= 12 ? 'u' : x % 3 === 1 ? 'u' : 'n');
    for (const y of [8, 14]) { wgRc(g, 2, y, 12, 1, 'x'); wgPx(g, 2, y, 'X'); wgPx(g, 3, y, 'X'); }
    wgRc(g, 4, 2, 8, 1, 'N'); wgRc(g, 3, 3, 1, 3, 'N'); wgRc(g, 2, 4, 1, 1, 'N'); wgRc(g, 12, 3, 1, 3, 'n'); wgRc(g, 13, 4, 1, 1, 'n'); // the rim
    wgRc(g, 4, 3, 8, 1, 'u'); wgRc(g, 3, 4, 10, 1, 'u'); wgRc(g, 4, 5, 8, 1, 'u'); // the dark inside
    wgRc(g, 4, 6, 8, 1, 'N'); wgPx(g, 3, 6, 'N'); wgPx(g, 12, 6, 'n'); // the near lip
  })]);
};
