'use strict';
// Wildgrove: chalk. Stone and bone meal make white chalk, pink and blue with a petal (`WG_CHALKS`). USE a stick of it on
// a path, a stone floor, rock, dirt or sand with nothing on it to draw a doodle there (`WG_DOODLES`: a sun, a heart, a
// flower, a star, a smiling face, a hopscotch), the next one each time; a doodle drawn over gets the next. The doodle is
// the tile's meta (its shape times three and its colour), so friends see the same; it lies flat and can be walked
// over, a knock rubs it out, and rain washes the doodles away one by one (the host, a `wgGrowTick` wrapper). Drawing
// every doodle lights CHALK ARTIST.
const WG_CHALKS = [['chalk', 'WHITE CHALK', null, 'w'], ['chalk_p', 'PINK CHALK', 'petal_r', 'q'], ['chalk_b', 'BLUE CHALK', 'petal_b', 'C']];
const WG_CHALK_ON = ['path', 'f_stone', 'f_brick', 'rock', 'dirt', 'sand'];
const WG_DOODLES = [
  ['.....x.....', '.x...x...x.', '..x.....x..', '....xxx....', '...x...x...', 'xx.x...x.xx', '...x...x...', '....xxx....', '..x.....x..', '.x...x...x.', '.....x.....'],
  ['...........', '..xx...xx..', '.x..x.x..x.', '.x...x...x.', '.x.......x.', '..x.....x..', '...x...x...', '....x.x....', '.....x.....', '...........', '...........'],
  ['...........', '....xxx....', '..xx.x.xx..', '..x.xxx.x..', '..xx.x.xx..', '....xxx....', '.....x.....', '...x.x.....', '....xx.....', '.....x.x...', '.....xx....'],
  ['.....x.....', '.....x.....', '....x.x....', 'xxxxx.xxxxx', '.x.......x.', '..x.....x..', '...x...x...', '..x..x..x..', '.x.x...x.x.', '.xx.....xx.', '...........'],
  ['...xxxxx...', '..x.....x..', '.x.......x.', 'x..x...x..x', 'x.........x', 'x.........x', 'x..x...x..x', 'x...xxx...x', '.x.......x.', '..x.....x..', '...xxxxx...'],
  ['...xxxxx...', '...x...x...', '...x.x.x...', '...xxxxx...', '.xxxxxxxxx.', '.x...x...x.', '.x...x...x.', '.xxxxxxxxx.', '...x...x...', '...x...x...', '...xxxxx...'],
];
(function () {
  wgObj('chalk_art', { name: 'CHALK DOODLE', kind: 'deco', tool: 'hand', hp: 1, solid: 0, chalk: 1, drops: [] });
  for (const [id, name, dye] of WG_CHALKS) { wgItem(id, name, 'res', { chalk: 1 }); wgRec(id, 4, dye ? { stone: 1, bonemeal: 1, [dye]: 1 } : { stone: 1, bonemeal: 1 }, 'bench'); }
  WG_ACH.push(['chalk', 'CHALK ARTIST', 'DRAW EVERY CHALK DOODLE', (c) => ((c.st.chalk | 0) & 63) === 63]);
})();
const wgChalkOk = (tx, ty) => { const g = GROUND[wgGround(WGS.world, WGS.dim, tx, ty)]; return !!(g.path || WG_CHALK_ON.includes(g.id)); };
const _wgUseChalk = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, s = WGS.inv[WGS.sel], it = s && WGI[s.id];
  if (!w || !it || !it.chalk) return _wgUseChalk(tx, ty);
  const id = wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if ((id && !o.chalk) || !wgChalkOk(tx, ty)) { wgToast('CHALK DRAWS ON PATHS, STONE AND SAND'); return true; }
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }), col = WG_CHALKS.findIndex(c => c[0] === s.id);
  const shape = o ? (Math.floor(wgMetaAt(w, dim, tx, ty) / 3) + 1) % WG_DOODLES.length : (st.chalkN | 0) % WG_DOODLES.length;
  if (!o) st.chalkN = (st.chalkN | 0) + 1;
  wgSetObj(w, dim, tx, ty, O_ID.chalk_art, shape * 3 + col); wgInvTake(WGS.inv, s.id, 1);
  st.chalk = (st.chalk | 0) | (1 << shape); wgSfx('scratch'); wgPart(tx * 16 + 8, ty * 16 + 10, 4, { c: [WG_CHALKS[col][3], 'w'], s: 12, up: 4, life: 0.4 });
  return true;
};
function wgChalkArt(m) { // a doodle in chalk, a little dusty
  const key = 'chalk_' + m; if (WGA.cache[key]) return WGA.cache[key];
  const rows = WG_DOODLES[Math.floor(m / 3) % WG_DOODLES.length], k = (WG_CHALKS[m % 3] || WG_CHALKS[0])[3];
  return wgMake(key, 11, 11, (g) => { rows.forEach((r, y) => { for (let x = 0; x < 11; x++) if (r[x] === 'x' && hash(x, y, m) % 9) wgPx(g, x, y, k); }); }, false);
}
const _wgDrawObjChalk = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.chalk) return _wgDrawObjChalk(id, tx, ty, sx, sy);
  ctx.globalAlpha = 0.8; ctx.drawImage(wgChalkArt(wgMetaAt(WGS.world, WGS.dim, tx, ty)), sx + 2, sy + 3); ctx.globalAlpha = 1;
};
const _wgGrowChalk = wgGrowTick;
wgGrowTick = function (dt) { // the rain washes doodles away, one here and one there
  _wgGrowChalk(dt);
  const w = WGS.world; if (WGS.growT !== 1 || !w || WGS.dim !== 'o' || !(WGS.weather && WGS.weather.kind === 'rain')) return;
  const C = O_ID.chalk_art, CS = WG.CS;
  for (const [key, ch] of w.chunks) {
    if (key[0] !== 'o' && ch.dim !== 'o') continue;
    for (let k = 0; k < CS * CS; k++) if (ch.o[k] === C && Math.random() < 1 / 15) wgSetObj(w, 'o', ch.cx * CS + k % CS, ch.cy * CS + Math.floor(k / CS), 0);
  }
};
const _wgIconChalk = wgIcon;
wgIcon = function (id) { // a stick of chalk
  const key = 'ic_' + id, k = WG_CHALKS.findIndex(c => c[0] === id); if (k < 0 || WGA.cache[key]) return _wgIconChalk(id);
  const [c, g] = wgCv(16, 16), col = WG_CHALKS[k][3];
  for (let i = 0; i < 8; i++) { wgPx(g, 4 + i, 11 - i, col); wgPx(g, 5 + i, 11 - i, col); wgPx(g, 5 + i, 12 - i, i > 5 ? col : 'L'); }
  wgPx(g, 4, 11, 'w'); wgPx(g, 3, 13, col); wgPx(g, 6, 14, col); // a little dust
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildChalk = wgBuildAll;
wgBuildAll = function () { _wgBuildChalk(); wgReg('chalk_art', [wgChalkArt(0)]); };
const _wgTipChalk = wgTipLines;
wgTipLines = function (s) { const L = _wgTipChalk(s), it = WGI[s.id]; if (it && it.chalk) L.push('DRAWS ON PATHS, STONE AND SAND'); return L; };
