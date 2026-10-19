'use strict';
// Wildgrove: sunflowers follow the sun. A ripe sunflower's face turns east in the morning, looks up at noon and west in
// the afternoon, and droops at night (`wgSunFace`, from the world's clock, so every field turns together); outdoors
// only, a sunflower underground looks ahead. A `wgDrawObj` wrapper draws the face, baked once each way.
function wgSunFace() { // -1 west, 0 up, 1 east, 2 asleep
  if (WGS.dim !== 'o') return 0;
  if (wgNight(WGS.clock) > 0.5) return 2;
  const c = WGS.clock % 1; return c < 0.42 ? 1 : c > 0.58 ? -1 : 0;
}
function wgSunArt(f) {
  const key = 'sunface_' + f; if (WGA.cache[key]) return WGA.cache[key];
  const base = WGA.obj.crop_sun[3].c;
  return wgMake(key, 16, 16, (g) => {
    g.drawImage(base, 0, 0);
    if (f === 2) { g.clearRect(3, 0, 12, 9); wgRc(g, 8, 6, 1, 3, 'G'); wgBlob(g, 8.5, 6.8, 4.4, 3, ['O', 'y', 'y', 'Y']); wgBlob(g, 8.5, 8, 2, 1.4, ['k', 'u', 'n', 'n']); return; } // the head hung low
    wgBlob(g, 8.5, 4.4, 5, 4, ['O', 'y', 'Y', 'Y']); wgBlob(g, 8.5 + f * 1.4, 4.4, 2.2, 2, ['k', 'u', 'n', 'N']); wgPx(g, 7 + Math.round(f * 1.4), 3, 'n');
  }, false);
}
const _wgDrawObjSun = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || o.id !== 'crop_sun' || wgMetaAt(WGS.world, WGS.dim, tx, ty) < 3) return _wgDrawObjSun(id, tx, ty, sx, sy);
  const f = wgSunFace(); if (f === 0) return _wgDrawObjSun(id, tx, ty, sx, sy);
  const sp = WGA.obj.crop_sun[3]; ctx.drawImage(wgSunArt(f), sx + sp.ox, sy + sp.oy);
};
