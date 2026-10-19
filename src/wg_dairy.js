'use strict';
// Wildgrove: the dairy pack. Cows graze the meadows and highlands among the sheep (they take a share of the same
// spawns, so the fields grow no busier); USE a bucket on one for milk (the bucket stays, the cow needs a while before
// the next), and wheat for a calf, as with sheep. A butter churn makes butter and cheese, and milk goes into five dishes:
// buttered toast, cheese toast, cream of mushroom, ice cream made with a snowball, and a strawberry shake. Like
// shearing, milking runs where the creatures are simulated. Ids are appended, so old worlds stay valid.
const WG_MILK_WAIT = 120; // seconds before a cow gives milk again
(function () {
  WG_MOBS.cow = { name: 'COW', hp: 10, spd: 12, pas: 1, w: 8, h: 6, drops: [['leather', 1, 2, 1], ['meat', 1, 2, 0.8]], dim: 'o', biomes: ['meadow', 'highland'] };
  wgItem('milk', 'MILK', 'food', { food: 3 });
  wgItem('butter', 'BUTTER', 'res', {}); wgItem('cheese', 'CHEESE', 'food', { food: 5 });
  wgObj('churn', { name: 'BUTTER CHURN', kind: 'station', st: 'churn', tool: 'axe', hp: 5, solid: 1, drops: [DR('churn', 1, 1)] });
  wgItem('churn', 'BUTTER CHURN', 'place', { place: 'churn' }); PLACE.churn = 'churn'; wgRec('churn', 1, { wood: 4, iron: 1 }, 'bench');
  wgRec('butter', 1, { milk: 2 }, 'churn'); wgRec('cheese', 1, { milk: 3 }, 'churn');
  for (const [id, name, food, rec, at] of [
    ['buttered_toast', 'BUTTERED TOAST', 12, { bread: 1, butter: 1 }, 'fire'], ['cheese_toast', 'CHEESE TOAST', 13, { bread: 1, cheese: 1 }, 'fire'],
    ['cream_soup', 'CREAM OF MUSHROOM', 10, { milk: 1, mush_b: 2 }, 'fire'], ['ice_cream', 'ICE CREAM', 8, { milk: 1, snowball: 1, sugar: 1 }, 'hand'],
    ['milkshake', 'STRAWBERRY SHAKE', 8, { milk: 1, strawberry: 2 }, 'hand']]) { wgItem(id, name, 'food', { food }); wgRec(id, 1, rec, at); }
  WG_AT.churn = 'AT A BUTTER CHURN';
  WG_ACH.push(['dairy', 'DAIRY FARMER', 'MAKE BUTTER AND CHEESE', (c) => c.seen.butter && c.seen.cheese]);
})();
// A bucket milks a cow, wheat brings a calf; the churn opens the recipe book like any station.
const _wgUseDairy = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel], o = OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (o && o.st === 'churn') { WGS.scr = 'inv'; WGS.ui = { tab: 'craft' }; return true; }
  const cow = s && (s.id === 'bucket' || s.id === 'wheat') && WGN.role !== 'client' && WGS.mobs.find(m => m.type === 'cow' && m.dim === WGS.dim && Math.hypot(m.x - (tx * 16 + 8), m.y - 6 - (ty * 16 + 8)) < 22);
  if (!cow) return _wgUseDairy(tx, ty);
  if (s.id === 'bucket') {
    if ((cow.milked || 0) > WGS.t) { wgToast('SHE HAS NO MILK YET'); return true; }
    cow.milked = WGS.t + WG_MILK_WAIT; wgInvAdd(WGS.inv, 'milk', 1); wgSfx('pickup'); wgPart(cow.x, cow.y - 6, 5, { c: ['w', 'L'], s: 16, up: 10, life: 0.5 }); return true;
  }
  if ((cow.cool || 0) > WGS.t || cow.love > 0) { wgToast('NOT NOW'); return true; }
  if (WGS.mobs.filter(m => WG_MOBS[m.type].pas).length >= 14) { wgToast('TOO CROWDED'); return true; }
  wgInvTake(WGS.inv, 'wheat', 1); cow.love = 2.2; wgSfx('select'); return true;
};
const _wgTipDairy = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipDairy(s);
  if (s.id === 'bucket') L.push('ALSO MILKS A COW');
  return L;
};

// ---------- art ----------
// a black and white cow with a pink nose, little horns and a bell on a red collar
const _wgMobSprDairy = wgMobSpr;
wgMobSpr = function (type, fr, hurt) {
  if (type !== 'cow') return _wgMobSprDairy(type, fr, hurt);
  const key = 'm_cow_' + fr + (hurt ? 'h' : ''); if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(20, 18), b = fr % 2, w = b, H = (k) => (hurt ? ['w', 'w', 'w', 'w'] : k), P = (x, y, k) => wgPx(g, x, y, hurt ? 'w' : k), R = (x, y, ww, h, k) => wgRc(g, x, y, ww, h, hurt ? 'w' : k);
  R(6, 12, 2, 4 - w, 'm'); R(9, 12, 2, 4 - (1 - w), 'l'); R(13, 12, 2, 4 - (1 - w), 'm'); R(16, 12, 2, 4 - w, 'l'); // the legs
  for (const x of [6, 9, 13, 16]) R(x, x === 6 || x === 16 ? 15 - w : 15 - (1 - w), 2, 1, 'x'); // hooves
  wgLine(g, 18, 7, 19, 11, hurt ? 'w' : 'x'); P(19, 12, 'x'); // the tail
  wgBlob(g, 12, 9, 6.6, 4, H(['m', 'l', 'L', 'w'])); // the body
  wgBlob(g, 10, 7.6, 2, 1.6, H(['x', 'x', 'X', 'X'])); wgBlob(g, 15, 10, 1.8, 1.8, H(['x', 'x', 'X', 'X'])); wgBlob(g, 13.4, 6.2, 1.2, 1, H(['x', 'x', 'X', 'X'])); // patches
  R(12, 12, 3, 1, 'q'); // the udder
  wgBlob(g, 4.4, 8 + b, 3, 2.8, H(['m', 'l', 'L', 'w'])); R(5, 6 + b, 2, 2, 'x'); // the head, a patch round one eye
  R(1, 9 + b, 4, 3, 'q'); R(1, 9 + b, 4, 1, 'P'); P(2, 10 + b, 'p'); P(4, 10 + b, 'p'); // the muzzle
  P(3, 7 + b, '0'); P(6, 7 + b, 'w'); P(6, 7 + b, '0'); // the eyes
  P(2, 5 + b, 'A'); P(6, 5 + b, 'A'); P(1, 6 + b, 'x'); P(7, 6 + b, 'x'); // horns and ears
  R(5, 11 + b, 3, 1, 'r'); P(6, 12 + b, 'y'); // the collar and its bell
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildDairy = wgBuildAll;
wgBuildAll = function () {
  _wgBuildDairy();
  // a wooden churn, wider at the foot, with iron bands and the dasher's handle out of its lid
  wgReg('churn', [wgMake('churn', 12, 21, (g) => {
    wgRc(g, 5, 0, 2, 1, 'N'); wgRc(g, 5, 1, 2, 5, 'n'); wgPx(g, 5, 1, 'N'); // the dasher's handle
    wgRc(g, 2, 5, 8, 2, 'N'); wgRc(g, 2, 5, 8, 1, 'O'); // the lid
    for (let y = 7; y < 20; y++) { const i = Math.floor((y - 7) / 6); wgRc(g, 2 - i, y, 8 + i * 2, 1, 'N'); wgPx(g, 2 - i, y, 'O'); wgPx(g, 9 + i, y, 'n'); } // the staves
    for (const y of [9, 16]) { const i = Math.floor((y - 7) / 6); wgRc(g, 2 - i, y, 8 + i * 2, 1, 'm'); wgPx(g, 2 - i, y, 'l'); } // the bands
    wgRc(g, 0, 19, 12, 1, 'n'); wgRc(g, 4, 8, 1, 8, 'O'); // the foot, a sheen
  })]);
};
const _wgIconDairy = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, D = ['milk', 'butter', 'cheese', 'buttered_toast', 'cheese_toast', 'cream_soup', 'ice_cream', 'milkshake'];
  if (WGA.cache[key] || !D.includes(id)) return _wgIconDairy(id);
  const [c, g] = wgCv(16, 16), toast = () => { wgRc(g, 3, 5, 10, 9, 'n'); wgRc(g, 4, 4, 8, 1, 'n'); wgRc(g, 4, 6, 8, 7, 'N'); wgRc(g, 4, 6, 8, 1, 'O'); }; // a slice with its crust
  switch (id) {
    case 'milk': wgRc(g, 6, 2, 4, 1, 'B'); wgRc(g, 6, 3, 4, 2, 'C'); wgRc(g, 5, 5, 6, 9, 'L'); wgRc(g, 5, 5, 1, 9, 'w'); wgRc(g, 10, 5, 1, 9, 'l'); wgRc(g, 5, 9, 6, 2, 'B'); wgPx(g, 5, 9, 'c'); break; // a bottle with a blue label
    case 'butter': wgBlob(g, 8, 12, 7, 2.2, ['m', 'l', 'L', 'w']); wgRc(g, 4, 7, 8, 4, 'y'); wgRc(g, 4, 7, 8, 1, 'Y'); wgRc(g, 11, 8, 1, 3, 'O'); wgPx(g, 4, 7, 'w'); break; // a block on a dish
    case 'cheese': for (let y = 0; y < 7; y++) wgRc(g, 2 + Math.max(0, 6 - y * 2), 5 + y, 12 - Math.max(0, 6 - y * 2), 1, y === 0 ? 'Y' : 'y'); wgRc(g, 2, 11, 12, 2, 'O'); for (const [x, y] of [[9, 8], [12, 10], [6, 10]]) wgPx(g, x, y, 'e'); wgPx(g, 10, 6, 'w'); break; // a wedge with holes
    case 'buttered_toast': toast(); wgRc(g, 6, 8, 4, 3, 'y'); wgRc(g, 6, 8, 4, 1, 'Y'); wgPx(g, 9, 10, 'O'); break;
    case 'cheese_toast': toast(); wgRc(g, 4, 6, 8, 4, 'y'); wgRc(g, 4, 6, 8, 1, 'Y'); for (const x of [5, 8, 11]) wgPx(g, x, 10, 'y'); wgPx(g, 7, 8, 'O'); wgPx(g, 10, 7, 'O'); break; // melted over the edge
    case 'cream_soup': wgBlob(g, 8, 10, 6.6, 4, ['d', 'm', 'l', 'L']); wgBlob(g, 8, 8.4, 5.4, 1.8, ['l', 'L', 'L', 'w']); wgRc(g, 6, 8, 2, 1, 'n'); wgPx(g, 10, 9, 'N'); wgPx(g, 9, 8, 'G'); break; // a bowl, a bit of mushroom, a leaf
    case 'ice_cream': for (let y = 8; y < 15; y++) wgRc(g, 5 + Math.floor((y - 8) / 2), y, 6 - Math.floor((y - 8) / 2) * 2, 1, (y % 2) ? 'e' : 'N'); wgBlob(g, 8, 6, 3.6, 3, ['A', 'Y', 'L', 'w']); wgPx(g, 8, 2, 'r'); wgPx(g, 9, 2, 'R'); break; // a cone, a vanilla scoop, a berry
    case 'milkshake': wgRc(g, 4, 5, 8, 10, 'C'); wgRc(g, 5, 6, 6, 8, 'q'); wgRc(g, 5, 6, 6, 1, 'w'); wgRc(g, 5, 13, 6, 1, 'P'); wgRc(g, 5, 7, 1, 6, 'L'); wgLine(g, 9, 6, 11, 1, 'r'); wgPx(g, 6, 4, 'w'); wgPx(g, 7, 4, 'w'); break; // a tall glass with a straw
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
