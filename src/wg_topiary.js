'use strict';
// Wildgrove: topiary. USE shears on a hedge to clip it into a ball on a stem, and again for the next shape: a bird, a
// bunny, a tiered cone, then round to the ball (`WG_TOPIARY`). Each shape is its own object and gives the hedge back
// when cut down, so friends see the same garden and nothing is lost. Clipping every shape lights TOPIARY ARTIST.
const WG_TOPIARY = [['topiary_ball', 'TOPIARY BALL'], ['topiary_bird', 'TOPIARY BIRD'], ['topiary_bunny', 'TOPIARY BUNNY'], ['topiary_cone', 'TOPIARY CONE']];
(function () {
  for (const [id, name] of WG_TOPIARY) wgObj(id, { name, kind: 'deco', tool: 'axe', hp: 3, topiary: 1, drops: [DR('hedge', 1, 1)] });
  WG_ACH.push(['topiary', 'TOPIARY ARTIST', 'CLIP A HEDGE INTO EVERY SHAPE', (c) => (c.st.topiary | 0) === (1 << WG_TOPIARY.length) - 1]);
})();
const _wgUseTopi = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty), o = id && OBJ[id], s = WGS.inv[WGS.sel];
  if (!o || !(o.id === 'hedge' || o.topiary) || !s || s.id !== 'shears') return _wgUseTopi(tx, ty);
  const k = (WG_TOPIARY.findIndex(t => t[0] === o.id) + 1) % WG_TOPIARY.length; // a hedge (-1) becomes the ball
  wgSetObj(w, dim, tx, ty, O_ID[WG_TOPIARY[k][0]], 0);
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.topiary = (st.topiary | 0) | (1 << k);
  wgSfx('cut'); wgPart(tx * 16 + 8, ty * 16 + 2, 9, { c: ['g', 'G', 'h'], s: 30, up: 18, life: 0.7 });
  return true;
};
const _wgTipTopi = wgTipLines;
wgTipLines = function (s) { const L = _wgTipTopi(s); if (s.id === 'hedge') L.push('SHEARS CLIP IT INTO SHAPES'); return L; };
const _wgBuildTopi = wgBuildAll;
wgBuildAll = function () {
  _wgBuildTopi();
  const H = ['g', 'G', 'h', 'H'], base = (g) => { wgRc(g, 4, 24, 8, 2, 'u'); wgRc(g, 5, 24, 6, 1, 'n'); }, stem = (g, y0) => { wgRc(g, 7, y0, 2, 24 - y0, 'n'); wgRc(g, 8, y0, 1, 24 - y0, 'u'); };
  const leaves = (g, pts) => { for (const [x, y] of pts) { wgPx(g, x, y, 'g'); wgPx(g, x + 1, y, 'H'); } };
  wgReg('topiary_ball', [wgMake('topiary_ball', 16, 26, (g) => { // a ball on a stem
    stem(g, 12); wgBlob(g, 8, 8, 6.6, 6.6, H); wgBlob(g, 8, 21, 3.4, 2.2, H); leaves(g, [[4, 6], [9, 4], [10, 10], [5, 11]]); base(g);
  })]);
  wgReg('topiary_bird', [wgMake('topiary_bird', 16, 26, (g) => { // a plump bird on a block: its tail up behind, its head and beak forward
    wgRc(g, 4, 19, 8, 5, 'G'); wgRc(g, 4, 19, 8, 1, 'h'); wgRc(g, 4, 19, 1, 5, 'h'); wgRc(g, 11, 20, 1, 4, 'g'); wgRc(g, 5, 23, 7, 1, 'g');
    wgBlob(g, 3, 10.5, 1.8, 3.6, H); wgBlob(g, 7.5, 14.5, 5.4, 3.8, H); wgBlob(g, 11.5, 8.5, 2.8, 2.8, H);
    wgRc(g, 14, 8, 1, 1, 'G'); wgPx(g, 12, 8, 'g'); leaves(g, [[6, 13], [8, 16]]); base(g);
  })]);
  wgReg('topiary_bunny', [wgMake('topiary_bunny', 16, 26, (g) => { // a sitting bunny, two tall ears
    wgBlob(g, 5.5, 3.8, 1.5, 3.6, H); wgBlob(g, 10.5, 4.4, 1.5, 3.4, H); wgBlob(g, 8, 9.5, 4.2, 3.8, H); wgBlob(g, 8, 18, 6.2, 5.6, H); wgBlob(g, 13.2, 20, 1.8, 1.8, H);
    wgPx(g, 6, 9, 'g'); wgPx(g, 10, 9, 'g'); leaves(g, [[5, 16], [9, 20], [7, 13]]); base(g);
  })]);
  wgReg('topiary_cone', [wgMake('topiary_cone', 16, 26, (g) => { // three tiers and a little ball on top
    wgBlob(g, 8, 20, 6.8, 3.6, H); wgBlob(g, 8, 14, 5.2, 3, H); wgBlob(g, 8, 8.6, 3.6, 2.6, H); wgBlob(g, 8, 3.6, 2, 2, H);
    leaves(g, [[4, 19], [10, 13], [6, 8]]); base(g);
  })]);
};
