'use strict';
// Wildgrove: wildflower seeds. Tied by hand from petals and a fiber, or now and then found when tall grass is cut; USE
// them on bare grass, moss or dirt to sow a `wild_sprout`. On the host each sprout comes up a step at a time (a
// `wgGrowTick` wrapper, one chance in `WG_WILD_STEP` a second, twice that in the rain): two small leaves, then a bud,
// then one of the five wildflowers, its colour from the tile and the seed (`wgWildCol`), the bud already showing it. It
// is a tile, so friends see it grow; a sprout knocked out gives its seed back. Sowing counts in `stats.sown`; twenty
// light WILDFLOWER MEADOW.
const WG_WILD_STEP = 45, WG_WILD_ON = ['grass', 'moss', 'dirt'], WG_WILD_COLS = ['r', 'y', 'b', 'w', 'p'];
const WG_WILD_RAMP = { r: ['p', 'r', 'R'], y: ['o', 'y', 'Y'], b: ['b', 'B', 'c'], w: ['m', 'l', 'L'], p: ['1', '2', '3'] };
(function () {
  wgItem('wild_seeds', 'WILDFLOWER SEEDS', 'res', {}); wgRec('wild_seeds', 4, { petal_y: 1, petal_w: 1, fiber: 1 }, 'hand');
  OBJ[O_ID.tallgrass].drops.push(DR('wild_seeds', 1, 1, 0.04));
  wgObj('wild_sprout', { name: 'WILDFLOWER SPROUT', kind: 'plant', hp: 1, solid: 0, sprout: 1, drops: [DR('wild_seeds', 1, 1)] });
  WG_ACH.push(['meadow', 'WILDFLOWER MEADOW', 'SOW TWENTY WILDFLOWERS', (c) => (c.st.sown | 0) >= 20]);
})();
const wgWildCol = (tx, ty) => WG_WILD_COLS[hash(tx, ty, (WGS.world.seed | 0) * 7 + 4421) % WG_WILD_COLS.length];
const _wgUseWild = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel], w = WGS.world; if (!s || s.id !== 'wild_seeds' || !w) return _wgUseWild(tx, ty);
  if (wgObjAt(w, WGS.dim, tx, ty) || !WG_WILD_ON.includes(wgGroundAtT(tx, ty).id)) { wgToast('SOW THEM ON BARE GRASS OR SOIL'); return true; }
  wgSetObj(w, WGS.dim, tx, ty, O_ID.wild_sprout, 0); wgInvTake(WGS.inv, 'wild_seeds', 1);
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.sown = (st.sown | 0) + 1;
  wgSfx('cut'); wgPart(tx * 16 + 8, ty * 16 + 12, 3, { c: ['n', 'N'], s: 8, up: 4, life: 0.4 }); return true;
};
const _wgGrowWild = wgGrowTick;
wgGrowTick = function (dt) { // a step at a time: leaves, a bud, a flower
  _wgGrowWild(dt);
  const w = WGS.world; if (WGS.growT !== 1 || !w) return;
  const S = O_ID.wild_sprout, CS = WG.CS, ch0 = (WGS.weather ? 2 : 1) / WG_WILD_STEP;
  for (const ch of w.chunks.values()) {
    if (!ch.mod || ch.dim !== WGS.dim) continue;
    for (let k = 0; k < CS * CS; k++) {
      if (ch.o[k] !== S || Math.random() >= ch0) continue;
      const tx = ch.cx * CS + k % CS, ty = ch.cy * CS + Math.floor(k / CS);
      if (ch.m[k] < 1) wgSetObj(w, ch.dim, tx, ty, S, 1); else wgSetObj(w, ch.dim, tx, ty, O_ID['flower_' + wgWildCol(tx, ty)]);
    }
  }
};
function wgSproutArt(stage, col) { // two leaves; or a stem with a bud in its colour
  const key = 'wsprout' + stage + col; if (WGA.cache[key]) return WGA.cache[key];
  return wgMake(key, 9, 10, (g) => {
    wgRc(g, 2, 9, 5, 1, 'n'); wgRc(g, 3, 8, 3, 1, 'N'); wgPx(g, 1, 9, 'u'); wgPx(g, 7, 9, 'u'); // the turned soil it was sown in
    if (!stage) { wgPx(g, 4, 7, 'g'); wgPx(g, 4, 6, 'G'); wgRc(g, 2, 5, 2, 1, 'h'); wgPx(g, 1, 4, 'H'); wgRc(g, 5, 4, 2, 1, 'h'); wgPx(g, 7, 3, 'H'); return; }
    const R = WG_WILD_RAMP[col]; wgRc(g, 4, 4, 1, 4, 'g'); wgPx(g, 3, 6, 'G'); wgPx(g, 2, 5, 'h'); wgPx(g, 5, 7, 'G'); wgPx(g, 6, 6, 'h');
    wgRc(g, 3, 1, 3, 3, R[1]); wgPx(g, 3, 1, R[2]); wgPx(g, 5, 3, R[0]); wgPx(g, 4, 3, 'G');
  }, false);
}
const _wgDrawObjWild = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.sprout) return _wgDrawObjWild(id, tx, ty, sx, sy);
  ctx.drawImage(wgSproutArt(wgMetaAt(WGS.world, WGS.dim, tx, ty) ? 1 : 0, wgWildCol(tx, ty)), sx + 4, sy + 6);
};
const _wgTipWild = wgTipLines;
wgTipLines = function (s) { const L = _wgTipWild(s); if (s.id === 'wild_seeds') L.push('SOW THEM ON BARE GRASS OR SOIL'); return L; };
const _wgIconWild = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'wild_seeds') return _wgIconWild(id);
  return wgMake(key, 16, 16, (g) => { // a little paper packet with a flower on it, seeds spilling
    wgRc(g, 3, 2, 9, 11, 'A'); wgRc(g, 3, 2, 9, 2, 'a'); wgRc(g, 11, 4, 1, 9, 'e'); wgRc(g, 3, 12, 9, 1, 'e');
    wgRc(g, 6, 6, 3, 3, 'r'); wgPx(g, 7, 7, 'y'); wgPx(g, 6, 6, 'R'); wgRc(g, 7, 9, 1, 3, 'g'); wgPx(g, 8, 10, 'G');
    for (const [x, y] of [[12, 13], [13, 14], [11, 14], [14, 12]]) wgPx(g, x, y, 'n');
  });
};
