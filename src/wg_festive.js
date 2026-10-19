'use strict';
// Wildgrove: a festive tree. A little pine in a red pot with baubles and a star, its lights twinkling in turn and
// glowing softly at night. Every winter day a small gift waits under it; USE opens it. The day it was opened is the
// tile's meta (the day % 255, plus one), so on every co-op screen the gift is gone once someone has it. The FESTIVE
// SPIRIT star for the first gift.
const WG_FEST_GIFTS = [['cookies', 3], ['hot_cider', 1], ['honey', 1], ['pearl', 1], ['wool', 2], ['apple', 3], ['tea_leaf', 3], ['berry', 4]];
const WG_FEST_LIGHTS = [[6, 7], [10, 8], [4, 12], [9, 13], [12, 14], [6, 17], [11, 18], [3, 20], [13, 20]], WG_FEST_COLS = ['r', 'y', 'B', 'P', 'w'];
(function () {
  wgObj('festive_tree', { name: 'FESTIVE TREE', kind: 'deco', tool: 'axe', hp: 4, fest: 1, drops: [DR('festive_tree', 1, 1)] });
  wgItem('festive_tree', 'FESTIVE TREE', 'place', { place: 'festive_tree' }); PLACE.festive_tree = 'festive_tree'; wgRec('festive_tree', 1, { sap_pine: 1, glass: 2, copper: 1 }, 'bench');
  WG_ACH.push(['festive', 'FESTIVE SPIRIT', 'OPEN A GIFT UNDER A FESTIVE TREE', (c) => c.st.festive]);
})();
const wgFestMark = () => (WGS.day | 0) % 255 + 1;
const wgFestWaits = (tx, ty) => wgSeason() === 3 && wgMetaAt(WGS.world, WGS.dim, tx, ty) !== wgFestMark();
const _wgUseFest = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if (!o || !o.fest) return _wgUseFest(tx, ty);
  if (wgSeason() !== 3) { wgToast('GIFTS COME IN WINTER'); return true; }
  if (!wgFestWaits(tx, ty)) { wgToast('ANOTHER GIFT COMES TOMORROW'); return true; }
  wgSetObj(w, dim, tx, ty, id, wgFestMark());
  const [it, n] = WG_FEST_GIFTS[hash(WGS.day | 0, tx, ty) % WG_FEST_GIFTS.length];
  if (WGI[it]) wgDrop(tx * 16 + 8, ty * 16 + 20, it, n);
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.festive = (st.festive | 0) + 1;
  wgToast('A GIFT UNDER THE TREE!', 2.5); wgSfx('confirm'); wgPart(tx * 16 + 14, ty * 16 + 10, 8, { c: ['y', 'Y', 'r', 'w'], s: 26, up: 22, life: 0.6 });
  return true;
};
const _wgDrawObjFest = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  if (!OBJ[id].fest) return _wgDrawObjFest(id, tx, ty, sx, sy);
  shadow(sx + 8, sy + 14, 14); _wgDrawObjFest(id, tx, ty, sx, sy); // a shadow like the other trees'
  const X = sx, Y = sy - 14, k = Math.floor(WGS.t * 1.5) + hash(tx, ty, 13) % 5; // the sprite's top left; the lights step on together, calmly
  WG_FEST_LIGHTS.forEach(([x, y], i) => { ctx.fillStyle = PAL[WG_FEST_COLS[(k + i * 2) % WG_FEST_COLS.length]]; ctx.fillRect(X + x, Y + y, 1, 1); });
  if (wgFestWaits(tx, ty)) { const g = wgSpr('fest_gift'); if (g) { shadow(sx + 15, sy + 15, 8); ctx.drawImage(g, sx + 11, sy + 7); } }
  if (WGS.dim !== 'o' || wgNight(WGS.clock) > 0.3) WGR.lights.push({ x: sx + 8, y: sy - 2, r: 28, f: 0.3 });
};
const _wgTipFest = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipFest(s);
  if (s.id === 'festive_tree') L.push('A GIFT WAITS UNDER IT EACH WINTER DAY', 'ITS LIGHTS TWINKLE');
  return L;
};
const _wgBuildFest = wgBuildAll;
wgBuildAll = function () {
  _wgBuildFest();
  wgReg('festive_tree', [wgMake('festive_tree', 17, 30, (g) => { // three tiers of pine, lit from the top left, baubles, a star, a red pot
    const tiers = [[4, 9, 1, 4], [8, 15, 2, 6], [13, 21, 3, 7]];
    for (let y = 4; y <= 21; y++) {
      let hw = 0, bottom = false;
      for (const [y0, y1, h0, h1] of tiers) if (y >= y0 && y <= y1) { const v = h0 + (h1 - h0) * (y - y0) / (y1 - y0); if (v > hw) { hw = v; bottom = y === y1; } }
      for (let x = 1; x < 16; x++) {
        const d = x + 0.5 - 8.5; if (Math.abs(d) > hw) continue;
        wgPx(g, x, y, bottom ? 'g' : d < -hw + 1.6 ? 'h' : d > hw - 1.2 ? 'g' : 'G');
      }
    }
    for (const [x, y, k] of [[8, 10, 'r'], [5, 15, 'B'], [11, 11, 'P'], [10, 16, 'y'], [7, 19, 'P'], [12, 21, 'r'], [4, 21, 'y']]) wgPx(g, x, y, k);
    wgPx(g, 8, 1, 'Y'); wgRc(g, 7, 2, 3, 1, 'y'); wgPx(g, 8, 3, 'y'); wgPx(g, 8, 2, 'Y'); // the star
    wgRc(g, 7, 22, 3, 3, 'n'); wgPx(g, 9, 22, 'u'); wgPx(g, 9, 23, 'u'); // the trunk
    wgRc(g, 4, 25, 9, 4, 'r'); wgRc(g, 4, 25, 9, 1, 'R'); wgRc(g, 12, 26, 1, 3, 'p'); wgRc(g, 4, 27, 9, 1, 'y'); // the pot, its gold band
  })]);
  wgMake('fest_gift', 9, 9, (g) => { // a small blue box with a yellow ribbon and a bow
    wgRc(g, 1, 3, 7, 5, 'B'); wgRc(g, 1, 3, 7, 1, 'c'); wgRc(g, 6, 4, 1, 4, 'b'); wgRc(g, 4, 3, 1, 5, 'y'); wgRc(g, 1, 5, 7, 1, 'y');
    wgPx(g, 3, 2, 'y'); wgPx(g, 5, 2, 'y'); wgPx(g, 4, 2, 'Y');
  });
};
