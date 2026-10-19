'use strict';
// Wildgrove: a picnic basket. Woven from fibre with a checked cloth, set out; every day it holds one treat from
// `WG_PICNIC` (picked by the day and the tile, so the same on every screen), which USE takes out. The day it was opened
// is the tile's meta (the day % 255, plus one), so once a friend has it it is gone for everyone; while a treat waits
// the cloth's corner lifts now and then. A sandwich of bread, cheese and tomato to pack. Opening one beside a picnic
// blanket lights PICNIC DAY.
const WG_PICNIC = [['sandwich', 2], ['cookies', 3], ['apple', 3], ['strawberry', 4], ['lemonade', 1], ['scone_jam', 1], ['cheese', 1], ['berry', 5]];
(function () {
  wgObj('picnic_basket', { name: 'PICNIC BASKET', kind: 'deco', tool: 'hand', hp: 2, solid: 0, basket: 1, drops: [DR('picnic_basket', 1, 1)] });
  wgItem('picnic_basket', 'PICNIC BASKET', 'place', { place: 'picnic_basket' }); PLACE.picnic_basket = 'picnic_basket'; wgRec('picnic_basket', 1, { fiber: 8, wool: 1, petal_r: 1 }, 'bench');
  wgItem('sandwich', 'SANDWICH', 'food', { food: 10 }); wgRec('sandwich', 2, { bread: 1, cheese: 1, tomato: 1 }, 'hand');
  WG_ACH.push(['picnic', 'PICNIC DAY', 'OPEN A PICNIC BASKET BESIDE A PICNIC BLANKET', (c) => c.st.picnic]);
})();
const wgPicnicMark = () => (WGS.day | 0) % 255 + 1;
const wgPicnicWaits = (tx, ty) => wgMetaAt(WGS.world, WGS.dim, tx, ty) !== wgPicnicMark();
const _wgUsePicnic = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if (!o || !o.basket) return _wgUsePicnic(tx, ty);
  if (!wgPicnicWaits(tx, ty)) { wgToast('MORE TREATS TOMORROW'); return true; }
  wgSetObj(w, dim, tx, ty, id, wgPicnicMark());
  const [it, n] = WG_PICNIC[hash(WGS.day | 0, tx, ty) % WG_PICNIC.length];
  if (WGI[it]) wgDrop(tx * 16 + 8, ty * 16 + 20, it, n);
  let blanket = false; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const q = OBJ[wgObjAt(w, dim, tx + i, ty + j)]; if (q && q.id === 'picnic') blanket = true; }
  if (blanket) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.picnic = 1; }
  wgToast('A TREAT FROM THE BASKET!', 2.2); wgSfx('pickup'); wgPart(tx * 16 + 8, ty * 16 + 8, 6, { c: ['r', 'w', 'y'], s: 20, up: 16, life: 0.5 });
  return true;
};
const _wgDrawObjPicnic = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.basket) return _wgDrawObjPicnic(id, tx, ty, sx, sy);
  shadow(sx + 8, sy + 14, 12); _wgDrawObjPicnic(id, tx, ty, sx, sy);
  if (wgPicnicWaits(tx, ty) && (WGS.t + (hash(tx, ty, 5) % 30) / 10) % 3.2 < 0.5) { const sp = WGA.obj.picnic_basket[0]; rect(sx + sp.ox + 11, sy + sp.oy + 6, 2, 1, 'w'); rect(sx + sp.ox + 12, sy + sp.oy + 5, 1, 1, 'r'); } // the cloth's corner lifts
};
const _wgTipPicnic = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPicnic(s); if (s.id === 'picnic_basket') L.push('A TREAT INSIDE EVERY DAY'); return L; };
const _wgIconPicnic = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'sandwich' || WGA.cache[key]) return _wgIconPicnic(id);
  const [c, g] = wgCv(16, 16); // two slices of bread, cheese, tomato and a leaf between
  wgRc(g, 2, 4, 12, 3, 'A'); wgRc(g, 2, 4, 12, 1, 'O'); wgRc(g, 2, 6, 12, 1, 'N'); wgRc(g, 2, 7, 12, 1, 'G'); wgRc(g, 3, 8, 10, 1, 'r'); wgRc(g, 2, 9, 12, 1, 'y'); wgRc(g, 2, 10, 12, 3, 'A'); wgRc(g, 2, 12, 12, 1, 'N');
  wgPx(g, 5, 8, 'R'); wgPx(g, 10, 8, 'R'); wgPx(g, 13, 7, 'h');
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildPicnic = wgBuildAll;
wgBuildAll = function () {
  _wgBuildPicnic();
  wgReg('picnic_basket', [wgMake('picnic_basket', 16, 16, (g) => { // a wicker basket, its handle arched over, a red and white cloth peeping out
    for (let y = 0; y < 5; y++) { wgPx(g, 3 + (y > 1 ? 0 : 1), 6 - y, 'n'); wgPx(g, 12 - (y > 1 ? 0 : 1), 6 - y, 'n'); } wgRc(g, 5, 1, 6, 1, 'n'); wgRc(g, 5, 2, 6, 1, 'N'); // the handle
    wgRc(g, 2, 8, 12, 6, 'N'); for (let y = 8; y < 14; y++) for (let x = 2; x < 14; x++) if ((x + y) % 3 === 0) wgPx(g, x, y, 'n'); wgRc(g, 2, 8, 1, 6, 'O'); wgRc(g, 13, 8, 1, 6, 'n'); // the wicker
    wgRc(g, 3, 6, 10, 2, 'w'); for (const x of [3, 5, 7, 9, 11]) wgPx(g, x, 6, 'r'); for (const x of [4, 6, 8, 10, 12]) wgPx(g, x, 7, 'r'); // the cloth
    wgRc(g, 1, 8, 14, 1, 'O'); wgRc(g, 3, 14, 10, 1, 'n');
  })]);
};
