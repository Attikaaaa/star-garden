'use strict';
// Wildgrove: bunting. A bunting post strings a rope to the nearest bunting post on its right (up to `WG_BUNTING_SPAN`
// tiles away, a row up or down at most, `wgBuntingTo`) hung with little pennants in turn of colour (`WG_BUNTING_COLS`)
// whose tips flutter in the breeze, leaning with the wind (`wgWindA`), so a row of posts makes one long string for a
// village fair. Each post draws only the rope to its right; it all comes from the tiles, the same on every screen. The
// VILLAGE FAIR star for the first string.
const WG_BUNTING_SPAN = 6, WG_BUNTING_COLS = ['r', 'y', 'B', 'w', 'G', 'P'];
(function () {
  wgObj('bunting_post', { name: 'BUNTING POST', kind: 'deco', tool: 'axe', hp: 2, bunting: 1, drops: [DR('bunting_post', 1, 1)] });
  wgItem('bunting_post', 'BUNTING POST', 'place', { place: 'bunting_post' }); PLACE.bunting_post = 'bunting_post';
  wgRec('bunting_post', 2, { stick: 3, fiber: 2, petal_r: 1, petal_y: 1 }, 'loom');
  WG_ACH.push(['bunting', 'VILLAGE FAIR', 'STRING BUNTING BETWEEN TWO POSTS', (c) => c.st.bunting]);
})();
function wgBuntingTo(w, dim, tx, ty) { // the post this one strings to, or null
  for (let dx = 1; dx <= WG_BUNTING_SPAN; dx++) for (const dy of [0, -1, 1]) {
    const id = wgObjAt(w, dim, tx + dx, ty + dy); if (id && OBJ[id].bunting) return [tx + dx, ty + dy];
  }
  return null;
}
const _wgDrawObjBunting = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjBunting(id, tx, ty, sx, sy);
  if (!OBJ[id].bunting) return;
  const to = wgBuntingTo(WGS.world, WGS.dim, tx, ty); if (!to) return;
  const x1 = sx + 8, y1 = sy - 5, x2 = x1 + (to[0] - tx) * 16, y2 = y1 + (to[1] - ty) * 16, span = x2 - x1, sag = 3 + span / 20;
  const T = WGS.t, lean = Math.sin(wgWindA()) >= 0 ? 1 : -1, yAt = (x) => { const f = (x - x1) / span; return Math.round(y1 + (y2 - y1) * f + sag * 4 * f * (1 - f)); };
  for (let x = x1 + 1; x < x2; x++) rect(x, yAt(x), 1, 1, 'N');
  for (let x = x1 + 3, i = 0; x + 2 < x2 - 1; x += 5, i++) { // a pennant every five pixels, its tip fluttering
    const y = yAt(x + 1) + 1, k = WG_BUNTING_COLS[(i + tx) % WG_BUNTING_COLS.length], f = Math.sin(T * 4 + i * 1.3 + tx) > 0.2 ? lean : 0;
    rect(x, y, 3, 1, k); rect(x + (f > 0 ? 1 : 0), y + 1, 2, 1, k); rect(x + 1 + f, y + 2, 1, 1, k);
    if (k !== 'w') rect(x, y, 1, 1, 'w'); // lit on its top left
  }
};
// the first string strung
const _wgSetObjBunting = wgSetObj;
wgSetObj = function (w, dim, x, y, id, meta) {
  const r = _wgSetObjBunting(w, dim, x, y, id, meta);
  if (id && OBJ[id].bunting && w === WGS.world && !WGN.applying && w.meta && !(w.meta.stats && w.meta.stats.bunting)) {
    let on = !!wgBuntingTo(w, dim, x, y); for (let dx = 1; !on && dx <= WG_BUNTING_SPAN; dx++) for (const dy of [0, -1, 1]) { const q = wgObjAt(w, dim, x - dx, y + dy); if (q && OBJ[q].bunting) { on = true; break; } }
    if (on) (w.meta.stats || (w.meta.stats = { kills: 0, far: 0 })).bunting = 1;
  }
  return r;
};
const _wgTipBunting = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipBunting(s);
  if (s.id === 'bunting_post') L.push('PLACE TWO IN A ROW TO STRING BUNTING', 'UP TO 6 TILES APART');
  return L;
};
const _wgBuildBunting = wgBuildAll;
wgBuildAll = function () { // a slim post painted white, a little red pennant flying from its top, a foot
  _wgBuildBunting();
  wgReg('bunting_post', [wgMake('bunting_post', 16, 24, (g) => {
    wgRc(g, 7, 3, 2, 18, 'l'); wgRc(g, 7, 3, 1, 18, 'w'); wgRc(g, 6, 2, 4, 1, 'm'); wgPx(g, 6, 2, 'l'); // the post and its cap
    wgRc(g, 9, 3, 4, 1, 'r'); wgRc(g, 9, 4, 3, 1, 'r'); wgPx(g, 9, 5, 'r'); wgPx(g, 9, 3, 'R'); // a pennant on top
    wgRc(g, 5, 21, 6, 2, 'n'); wgRc(g, 5, 21, 6, 1, 'N'); wgPx(g, 10, 22, 'u'); // the foot
  })]);
};
