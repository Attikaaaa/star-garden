'use strict';
// Wildgrove: frogs on the lily pads. On spring and summer evenings (from dusk into the night, `wgLilyFrog`) one lily pad
// in three has a frog sitting on it, chosen by the tile and the seed, the same on every screen. It croaks now and then
// with its throat puffed out (the `croak` sound for one close by, never two within `WG_LFROG_GAP` s), and a hero coming
// within `WG_LFROG_SHY` px makes it plop into the water, rings spreading, to climb back after `WG_LFROG_BACK` s
// (`WGLFR.gone`, this screen's own). Drawn by a `wgDrawObj` wrapper; off with the ambient life option.
const WG_LFROG_SHY = 28, WG_LFROG_BACK = 25, WG_LFROG_GAP = 6;
const WGLFR = { gone: new Map(), croak: 0 };
function wgLilyFrog(tx, ty) { // does this pad have a frog this evening
  const w = WGS.world, s = wgSeason(), n = wgNight(WGS.clock);
  return !!w && WGS.dim === 'o' && (s === 0 || s === 1) && n > 0.1 && n < 0.75 && hash(tx, ty, (w.seed | 0) * 5 + 919) % 3 === 0;
}
const _wgDrawObjLFrog = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjLFrog(id, tx, ty, sx, sy);
  if (OBJ[id].id !== 'lilypad' || !wgOpt().amb || !wgLilyFrog(tx, ty)) return;
  const T = WGS.t, key = tx + ',' + ty, x = tx * 16 + 8, y = ty * 16 + 12, gone = WGLFR.gone.get(key);
  if (gone !== undefined) { // in the water: rings where it went in, then back on its pad after a while
    const u = T - (gone - WG_LFROG_BACK);
    if (u > -0.05 && u < 0.7) { const r = 2 + Math.round(Math.max(0, u) * 9); ctx.globalAlpha = (1 - u / 0.7) * 0.8; rect(sx + 8 - r, sy + 12, r * 2, 1, 'C'); rect(sx + 8 - r + 1, sy + 14, r * 2 - 2, 1, 'C'); ctx.globalAlpha = 1; }
    if (T < gone) return; WGLFR.gone.delete(key);
  }
  const heroes = [WGS.p].concat((WGS.remote || []).filter(q => q.dim === WGS.dim));
  if (heroes.some(q => q && !q.hidden && Math.hypot(q.x - x, q.y - y) < WG_LFROG_SHY)) { WGLFR.gone.set(key, T + WG_LFROG_BACK); if (WGLFR.gone.size > 200) WGLFR.gone.clear(); return; }
  const h = hash(tx, ty, 77), per = 5 + h % 5, puff = (T + (h >>> 4) % 50 / 10) % per < 0.45;
  ctx.drawImage(wgDrizArt('frog0'), sx + 3, sy + 7);
  if (puff) {
    rect(sx + 7, sy + 11, 3, 2, 'H'); rect(sx + 7, sy + 11, 1, 1, 'Y'); // a puffed-out throat
    const p = WGS.p; if (T > WGLFR.croak && p && Math.hypot(p.x - x, p.y - y) < 130) { WGLFR.croak = T + WG_LFROG_GAP; wgSfx('croak'); }
  }
};
