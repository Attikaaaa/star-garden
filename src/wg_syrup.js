'use strict';
// Wildgrove: birch syrup. While the sap runs (`wgSapRuns`: all spring, and the last days of winter) a bucket USEd on a
// birch taps it for birch sap, once a day for each tree (each hero's own, the day's trees in `w.meta.sap`); a tapped
// birch shows a spout and a little pail on its trunk for the rest of the day (a `wgDrawObj` wrapper). Sap boiled down
// with a glass at a fire makes birch syrup; syrup on pancakes; and syrup poured on bare snow sets into snow taffy on the
// spot, which lights SUGAR ON SNOW.
const WG_SAP_KEEP = 64; // trees remembered in a day
const WGSY = { last: -1 };
(function () {
  wgItem('birch_sap', 'BIRCH SAP', 'res', {});
  wgItem('birch_syrup', 'BIRCH SYRUP', 'food', { food: 3 }); wgRec('birch_syrup', 1, { birch_sap: 3, glass: 1 }, 'fire');
  wgItem('syrup_pancakes', 'PANCAKES WITH SYRUP', 'food', { food: 16, buff: 'speed' }); wgRec('syrup_pancakes', 1, { pancakes: 1, birch_syrup: 1 }, 'fire');
  wgItem('snow_taffy', 'SNOW TAFFY', 'food', { food: 6 });
  WG_ACH.push(['taffy', 'SUGAR ON SNOW', 'POUR BIRCH SYRUP ON THE SNOW', (c) => !!c.seen.snow_taffy]);
})();
const wgSapRuns = () => wgSeason() === 0 || (wgSeason() === 3 && (WGS.day | 0) % 8 >= 5);
function wgSapList(w) { const m = w.meta, d = WGS.day | 0; if (!m.sap || m.sap.d !== d) m.sap = { d, k: [] }; return m.sap.k; }
const wgSapTapped = (w, tx, ty) => WGS.dim === 'o' && w.meta.sap && w.meta.sap.d === (WGS.day | 0) && w.meta.sap.k.includes(tx + ',' + ty);
const _wgUseSyrup = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel], w = WGS.world; if (!s || !w) return _wgUseSyrup(tx, ty);
  const o = OBJ[wgObjAt(w, WGS.dim, tx, ty)];
  if (s.id === 'bucket' && o && o.id === 'birch' && WGS.dim === 'o') { // tap the tree
    if (!wgSapRuns()) { wgToast('THE SAP RUNS IN SPRING'); return true; }
    const L = wgSapList(w), k = tx + ',' + ty; if (L.includes(k)) { wgToast('IT HAS GIVEN ITS SAP TODAY'); return true; }
    L.push(k); if (L.length > WG_SAP_KEEP) L.shift();
    if (wgInvAdd(WGS.inv, 'birch_sap', 1)) wgDrop(tx * 16 + 8, ty * 16 + 12, 'birch_sap', 1);
    const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.sap = (st.sap | 0) + 1;
    wgSfx('pickup'); wgPart(tx * 16 + 10, ty * 16 + 4, 4, { c: ['C', 'w', 'c'], s: 10, up: 6, life: 0.5 }); return true;
  }
  if (s.id === 'birch_syrup' && !o && wgGroundAtT(tx, ty).id === 'snow') { // sugar on snow
    wgInvTake(WGS.inv, 'birch_syrup', 1); if (wgInvAdd(WGS.inv, 'snow_taffy', 1)) wgDrop(tx * 16 + 8, ty * 16 + 12, 'snow_taffy', 1);
    wgToast('SUGAR ON SNOW!'); wgSfx('pickup'); wgPart(tx * 16 + 8, ty * 16 + 10, 6, { c: ['o', 'O', 'y'], s: 12, up: 8, life: 0.6 });
    return true;
  }
  return _wgUseSyrup(tx, ty);
};
const _wgDrawObjSyrup = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjSyrup(id, tx, ty, sx, sy);
  const o = OBJ[id], w = WGS.world; if (!o || o.id !== 'birch' || !w || !wgSapTapped(w, tx, ty)) return;
  ctx.drawImage(WGA.cache.sap_pail, sx + 8, sy + 3); // a spout from the bark, a pail on it
};
const _wgTipSyrup = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipSyrup(s);
  if (s.id === 'bucket') L.push('ALSO TAPS A BIRCH IN SPRING');
  else if (s.id === 'birch_sap') L.push('A BUCKET ON A BIRCH IN SPRING');
  else if (s.id === 'birch_syrup') L.push('POUR IT ON SNOW FOR TAFFY');
  return L;
};
const _wgBuildSyrup = wgBuildAll;
wgBuildAll = function () {
  _wgBuildSyrup();
  wgMake('sap_pail', 8, 9, (g) => { // the spout, the handle, the pail with sap showing at its top
    wgRc(g, 1, 1, 3, 1, 'd'); wgPx(g, 1, 2, 'm');
    wgRc(g, 2, 3, 4, 1, 'd'); wgPx(g, 1, 4, 'd'); wgPx(g, 6, 4, 'd');
    wgRc(g, 1, 4, 6, 4, 'm'); wgRc(g, 2, 4, 4, 1, 'C'); wgRc(g, 1, 5, 1, 3, 'l'); wgRc(g, 6, 5, 1, 3, 'd'); wgRc(g, 2, 7, 4, 1, 'd');
  });
};
const _wgIconSyrup = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || !['birch_sap', 'birch_syrup', 'syrup_pancakes', 'snow_taffy'].includes(id)) return _wgIconSyrup(id);
  return wgMake(key, 16, 16, (g) => {
    if (id === 'birch_sap') { // a tin pail brimming with clear sap
      wgRc(g, 4, 3, 8, 1, 'd'); wgPx(g, 3, 4, 'd'); wgPx(g, 12, 4, 'd');
      wgRc(g, 3, 6, 10, 7, 'm'); wgRc(g, 4, 13, 8, 1, 'd'); wgRc(g, 3, 6, 1, 7, 'l'); wgRc(g, 12, 7, 1, 6, 'd');
      wgRc(g, 4, 6, 8, 2, 'C'); wgRc(g, 5, 6, 3, 1, 'w'); wgRc(g, 4, 10, 8, 1, 'd');
    } else if (id === 'birch_syrup') { // a bottle of amber syrup, a cork
      wgRc(g, 7, 1, 2, 2, 'N'); wgRc(g, 7, 3, 2, 2, 'C');
      wgRc(g, 5, 5, 6, 9, 'C'); wgRc(g, 6, 7, 4, 6, 'o'); wgRc(g, 6, 7, 4, 1, 'O'); wgRc(g, 9, 8, 1, 5, 'n'); wgRc(g, 6, 13, 4, 1, 'n');
      wgRc(g, 6, 6, 1, 3, 'w'); wgPx(g, 7, 9, 'y');
    } else if (id === 'syrup_pancakes') { // three pancakes, butter on top, syrup running down
      for (const y of [7, 9, 11]) { wgRc(g, 2, y, 12, 2, 'a'); wgRc(g, 2, y + 1, 12, 1, 'e'); wgPx(g, 2, y, 'A'); }
      wgRc(g, 3, 6, 10, 1, 'o'); wgRc(g, 4, 5, 8, 1, 'O'); wgRc(g, 7, 4, 2, 1, 'Y'); wgPx(g, 9, 4, 'y');
      wgRc(g, 4, 7, 1, 3, 'o'); wgRc(g, 11, 7, 1, 5, 'o'); wgPx(g, 8, 7, 'o'); wgRc(g, 2, 13, 12, 1, 'm');
    } else { // snow taffy wound round a stick
      wgRc(g, 7, 8, 2, 7, 'N'); wgRc(g, 8, 8, 1, 7, 'n');
      wgRc(g, 5, 2, 6, 7, 'o'); wgRc(g, 6, 1, 4, 1, 'o'); wgRc(g, 5, 2, 2, 1, 'O'); wgRc(g, 5, 3, 1, 3, 'O');
      for (const y of [3, 5, 7]) wgRc(g, 6, y, 4, 1, 'O'); wgRc(g, 10, 3, 1, 6, 'n'); wgPx(g, 6, 2, 'Y');
    }
  });
};
