'use strict';
// Wildgrove: garden gnomes, made at the potter's wheel in three hats (`WG_GNOMES`). A gnome turns to look at the
// nearest hero within `WG_GNOME_SEE` px (a `wgDrawObj` wrapper hands the base drawing the sprite that faces them) and
// blinks now and then; with nobody about it looks the way its tile says. Three gnomes set out light the GNOME
// FRIENDS star (`stats.gnomes`, a bitmask of the hats, by a `wgSetObj` wrapper).
const WG_GNOMES = [ // id, name, the hat's ramp (light, colour, shade), the coat's, what dyes the hat
  ['gnome_r', 'RED GNOME', ['R', 'r', 'p'], ['c', 'B', 'b'], 'petal_r'], ['gnome_b', 'BLUE GNOME', ['c', 'B', 'b'], ['h', 'G', 'g'], 'petal_b'],
  ['gnome_y', 'YELLOW GNOME', ['Y', 'y', 'o'], ['R', 'r', 'p'], 'petal_y']];
const WG_GNOME_SEE = 140;
const WG_GNOME_ROWS = ['......M.....', '.....HM.....', '.....HMD....', '....HMMD....', '....HMMMD...', '...HMMMMD...', '..HHMMMMMDD.', '...ssss0sk..',
  '..wssssskk..', '..wwwwwwwL..', '..EwwwwwwLG.', '..EFwwwwLGG.', '..EFFwwLFGk.', '..EFFuuFFG..', '...FF..FG...', '...uu..uu...'];
const WGGN = { one: {} }; // single-sprite lists for the base drawing, by gnome and facing
(function () {
  for (const [id, name, , , petal] of WG_GNOMES) {
    wgObj(id, { name, kind: 'deco', tool: 'pick', hp: 2, drops: [DR(id, 1, 1)] });
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, { clay: 3, [petal]: 1 }, 'potwheel');
  }
  WG_ACH.push(['gnomes', 'GNOME FRIENDS', 'SET OUT A GNOME IN EVERY HAT', (c) => ((c.st.gnomes | 0) & 7) === 7]);
})();
const _wgBuildGnome = wgBuildAll;
wgBuildAll = function () {
  _wgBuildGnome();
  WG_GNOMES.forEach(([id, , [HL, HM, HD], [EL, EM, ED]]) => {
    const map = { H: HL, M: HM, D: HD, E: EL, F: EM, G: ED, s: 's', k: 'k', w: 'w', L: 'L', u: 'u', 0: '0' };
    const art = [0, 1].map(f => wgMake(id + '_' + f, 14, 18, (g) => { if (f) { g.translate(14, 0); g.scale(-1, 1); } wgPaint(g, 1, 1, WG_GNOME_ROWS, map); }));
    wgReg(id, art); WGGN.one[id] = WGA.obj[id].map(s => [s]);
  });
};
const _wgDrawObjGnome = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id], one = o && WGGN.one[o.id]; if (!one) return _wgDrawObjGnome(id, tx, ty, sx, sy);
  const x = tx * 16 + 8, y = ty * 16 + 12, p = WGS.p; let best = WG_GNOME_SEE, dx = 0;
  if (p && !p.hidden) { const d = Math.hypot(p.x - x, p.y - y); if (d < best) { best = d; dx = p.x - x; } }
  for (const q of WGS.remote || []) if (q.dim === WGS.dim) { const d = Math.hypot(q.x - x, q.y - y); if (d < best) { best = d; dx = q.x - x; } }
  const flip = best < WG_GNOME_SEE && Math.abs(dx) > 3 ? dx < 0 : !!(hash(tx, ty, 9) & 1), A = WGA.obj[o.id];
  shadow(sx + 8, sy + 15, 5); WGA.obj[o.id] = one[flip ? 1 : 0]; try { _wgDrawObjGnome(id, tx, ty, sx, sy); } finally { WGA.obj[o.id] = A; }
  if ((WGS.t + (hash(tx, ty, 4) % 50) / 10) % 4.3 < 0.14) { const sp = A[flip ? 1 : 0]; rect(sx + sp.ox + (flip ? 5 : 8), sy + sp.oy + 8, 1, 1, 's'); } // a blink
};
const _wgSetObjGnome = wgSetObj;
wgSetObj = function (w, dim, tx, ty, id, meta) { // a gnome set out counts toward GNOME FRIENDS
  const r = _wgSetObjGnome(w, dim, tx, ty, id, meta), o = id && OBJ[id], k = o ? WG_GNOMES.findIndex(g => g[0] === o.id) : -1;
  if (k >= 0 && w === WGS.world && !(typeof WGN !== 'undefined' && WGN.applying)) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.gnomes = (st.gnomes | 0) | (1 << k); }
  return r;
};
