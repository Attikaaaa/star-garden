'use strict';
// Wildgrove: winter by the fire and on the ice. A rod USEd on bare ice cuts a round hole (`ice_hole`, solid, closed
// again with a pick); USE the rod on the hole and fish through it, where icefin bite more often than anywhere else.
// ICE FISHER for the first catch through the ice. And a snow globe: a little pine under glass where snow drifts down;
// USE it to shake it and the flakes whirl up (on your own screen). Ids are appended, so old worlds stay valid.
const WG_ICE_BITE = 0.6; // the share of catches through the ice that are icefin
const WGSG = { shake: new Map() }; // snow globes shaken on this screen: tile key -> when
(function () {
  wgObj('ice_hole', { name: 'ICE HOLE', kind: 'deco', tool: 'pick', hp: 1, icehole: 1, drops: [] });
  wgObj('snowglobe', { name: 'SNOW GLOBE', kind: 'deco', tool: 'pick', hp: 2, globe: 1, drops: [DR('snowglobe', 1, 1)] });
  wgItem('snowglobe', 'SNOW GLOBE', 'place', { place: 'snowglobe' }); PLACE.snowglobe = 'snowglobe'; wgRec('snowglobe', 1, { glass: 2, wood: 1, snowball: 1 }, 'bench');
  WG_ACH.push(['icefish', 'ICE FISHER', 'CATCH A FISH THROUGH THE ICE', (c) => c.st.icefish]);
})();
const _wgUseIce = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty), o = id && OBJ[id], s = WGS.inv[WGS.sel];
  if (o && o.globe) { WGSG.shake.set(tx + ',' + ty, WGS.t); wgSfx('chime'); return true; }
  if (!s || s.id !== 'rod' || !w) return _wgUseIce(tx, ty);
  if (o && o.icehole) { WGS.fish = { tx, ty, t: 3 + Math.random() * 4, ice: 1 }; wgToast('FISHING...', 1.5); wgSfx('select'); return true; }
  if (!id && wgGroundAtT(tx, ty).id === 'ice') {
    const p = WGS.p; if (Math.floor(p.x / 16) === tx && Math.floor(p.y / 16) === ty) return _wgUseIce(tx, ty); // never under your own feet
    wgSetObj(w, dim, tx, ty, O_ID.ice_hole); wgSfx('brk'); wgToast('YOU CUT A HOLE IN THE ICE', 2);
    wgPart(tx * 16 + 8, ty * 16 + 10, 8, { c: ['C', 'w', 'c'], s: 26, up: 18 }); return true;
  }
  return _wgUseIce(tx, ty);
};
// through the ice the icefin bite more often; the first such catch lights the star
const _wgCatchIce = wgCatch;
wgCatch = function (F) {
  if (!F || !F.ice) return _wgCatchIce(F);
  const w = WGS.world, st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.icefish = 1;
  return Math.random() < WG_ICE_BITE ? 'fish_ice' : _wgCatchIce(F);
};
// ---------- drawing: the dark water in the hole with a ripple; the globe's snow ----------
const _wgDrawObjIce = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjIce(id, tx, ty, sx, sy);
  const o = OBJ[id];
  if (o.icehole) { const k = Math.floor(WGS.t * 1.5 + hash(tx, ty, 21) % 9) % 6; if (k < 3) rect(sx + 5 + k * 2, sy + 9, 2, 1, 'c'); return; }
  if (!o.globe) return;
  const t0 = WGSG.shake.get(tx + ',' + ty), sh = t0 !== undefined && WGS.t - t0 < 2.5 && WGS.t >= t0 ? 1 - (WGS.t - t0) / 2.5 : 0; // the glass's middle is at (8, 7) of the sprite, 2 px above its tile
  if (!sh && t0 !== undefined) WGSG.shake.delete(tx + ',' + ty);
  for (let i = 0; i < 6; i++) { // flakes drift down inside the glass, or whirl about when shaken
    const h = hash(tx, ty, i * 7 + 1), sp = 0.12 + (h % 5) * 0.03, u = (WGS.t * (sp + sh * 1.4) + (h >>> 4) % 100 / 100) % 1;
    const a = i * 1.7 + WGS.t * (0.6 + sh * 6), r = sh ? 1 + (h >>> 8) % 4 : 0, x = sh ? Math.round(Math.cos(a) * r) : (h >>> 8) % 7 - 3, y = sh ? Math.round(Math.sin(a) * r * 0.8) : Math.round(-4 + u * 6.5);
    if (x * x + y * y <= 22 && y < 3) rect(sx + 8 + x, sy + 5 + y, 1, 1, 'w'); // inside the glass, above the snowbank
  }
};
const _wgTipIce = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipIce(s);
  if (s.id === 'rod') L.push('ON ICE IT CUTS A HOLE TO FISH THROUGH'); else if (s.id === 'snowglobe') L.push('USE IT TO SHAKE IT');
  return L;
};
const _wgBuildIce = wgBuildAll;
wgBuildAll = function () {
  _wgBuildIce();
  wgReg('ice_hole', [wgMake('ice_hole', 16, 16, (g) => { // a round hole: the cut rim, deep water, a glint of light
    wgBlob(g, 8, 9, 6, 3.6, ['c', 'C', 'w', 'w']); wgBlob(g, 8, 9.4, 4.4, 2.4, ['b', 'b', 'b', 'B']); wgRc(g, 5, 8, 3, 1, 'B');
  })]);
  wgReg('snowglobe', [wgMake('snowglobe', 16, 18, (g) => { // a glass ball on a wooden base, a little pine and a snowbank inside
    wgBlob(g, 8, 7, 6.2, 6.2, ['c', 'C', 'C', 'w']); wgBlob(g, 8, 7, 5.2, 5.2, ['B', 'c', 'c', 'C']);
    for (let i = 0; i < 4; i++) wgRc(g, 7 - i, 3 + i * 2, 2 + i * 2, 2, i & 1 ? 'G' : 'g'); wgPx(g, 7, 2, 'y'); wgPx(g, 8, 3, 'G');
    wgRc(g, 3, 10, 10, 2, 'w'); wgRc(g, 4, 11, 8, 1, 'L'); wgPx(g, 12, 10, 'C');
    wgPx(g, 5, 4, 'w'); wgPx(g, 4, 5, 'w');
    wgRc(g, 3, 13, 10, 3, 'n'); wgRc(g, 3, 13, 10, 1, 'N'); wgRc(g, 12, 14, 1, 2, 'u'); wgRc(g, 4, 16, 8, 1, 'u');
  })]);
};
