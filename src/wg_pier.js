'use strict';
// Wildgrove: piers. A boardwalk may go out over deep water too, a plank at a time from the shore: beside dry ground or
// another plank of boardwalk (`wgPierOk`, a `wgCanPlaceAt` wrapper), so a pier or a bridge grows from the land and never
// floats alone. A line cast from the boardwalk gets a bite a third sooner (`WG_PIER_BITE`, a `wgUse` wrapper on the cast).
// Ten fish caught off a pier light OFF THE PIER (`stats.pier`, counted by a `wgCatch` wrapper).
const WG_PIER_BITE = 0.66;
(function () {
  WG_ACH.push(['pier', 'OFF THE PIER', 'CATCH TEN FISH FROM A BOARDWALK', (c) => (c.st.pier | 0) >= 10]);
})();
const wgOnPier = () => { const p = WGS.p; return !!(p && WGS.world && GROUND[wgGround(WGS.world, WGS.dim, Math.floor(p.x / 16), Math.floor(p.y / 16))].id === 'p_board'); };
function wgPierOk(tx, ty) { // open deep water with dry ground or a boardwalk beside it
  if (wgGroundAtT(tx, ty).id !== 'deep' || wgObjAt(WGS.world, WGS.dim, tx, ty)) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => { const g = wgGroundAtT(tx + i, ty + j); return g.id === 'p_board' || !g.liq; });
}
const _wgCanPlacePier = wgCanPlaceAt;
wgCanPlaceAt = function (tx, ty, item) {
  if (item.placeG === 'p_board' && wgPierOk(tx, ty)) return true;
  return _wgCanPlacePier(tx, ty, item);
};
const _wgUsePier = wgUse;
wgUse = function (tx, ty) {
  const had = WGS.fish, r = _wgUsePier(tx, ty);
  if (WGS.fish && WGS.fish !== had && wgOnPier()) { WGS.fish.t *= WG_PIER_BITE; WGS.fish.pier = 1; } // a line cast from the planks
  return r;
};
const _wgCatchPier = wgCatch;
wgCatch = function (F) {
  const got = _wgCatchPier(F);
  if (F && F.pier && WGS.world) { const st = WGS.world.meta.stats || (WGS.world.meta.stats = { kills: 0, far: 0 }); st.pier = (st.pier | 0) + 1; }
  return got;
};
const _wgTipPier = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPier(s); if (s.id === 'boardwalk') L.push('OUT OVER DEEP WATER FROM THE SHORE'); else if (s.id === 'rod') L.push('BITES COME SOONER ON A PIER'); return L; };
