'use strict';
// Wildgrove: the orchard pack. Apple, cherry, orange and lemon trees that bear fruit again and again: pick it with
// USE, chop the tree with an axe. A few wild oaks, birches, jungle trees and palms grow as fruit trees; two fruit and a
// stick make a sapling to plant at home. Six dishes and a fruit basket. Ids are appended, so old worlds stay valid.
const WG_ORCH = [['apple', 'APPLE', 'apple', 2, 3], ['cherry', 'CHERRY', 'cherry', 3, 5], ['orange', 'ORANGE', 'orange', 2, 3], ['lemon', 'LEMON', 'lemon', 2, 3]];
// a wild tree of this kind becomes a fruit tree on one tile in so many
const WG_ORCH_WILD = { oak: ['apple', 28], birch: ['cherry', 12], jungle: ['orange', 16], palm: ['lemon', 10] };
(function () {
  for (const [id, name, food] of [['cherry', 'CHERRIES', 2], ['orange', 'ORANGE', 4], ['lemon', 'LEMON', 1]]) wgItem(id, name, 'food', { food });
  for (const [k, name, fruit, a, b] of WG_ORCH) {
    const sap = 'sap_' + k, wood = [DR('wood', 2, 3), DR('stick', 1, 2), DR(sap, 0, 1, 0.3)];
    wgObj('tree_' + k, { name: name + ' TREE', kind: 'tree', tool: 'axe', hp: 8, drops: wood, sap, tall: 2, fruit, ripe: 'tree_' + k + '_r' });
    wgObj('tree_' + k + '_r', { name: 'RIPE ' + name + ' TREE', kind: 'tree', tool: 'axe', hp: 8, drops: [...wood, DR(fruit, a, b)], sap, tall: 2, fruit, bare: 'tree_' + k, pickN: [a, b] });
    wgObj(sap, { name: name + ' SAPLING', kind: 'sapling', hp: 1, solid: 0, grow: 'tree_' + k, drops: [DR('stick', 1, 1)] });
    wgItem(sap, name + ' SAPLING', 'place', { place: sap }); PLACE[sap] = sap;
    wgRec(sap, 1, { [fruit]: 2, stick: 1 });
  }
  for (const [id, name, food, buff, n, rec, at] of [
    ['baked_apple', 'BAKED APPLE', 6, null, 1, { apple: 1 }, 'fire'], ['apple_pie', 'APPLE PIE', 14, 'regen', 1, { apple: 3, flour: 1, sugar: 1 }, 'fire'],
    ['cherry_tart', 'CHERRY TART', 12, 'dig', 1, { cherry: 4, flour: 1, sugar: 1 }, 'fire'], ['jam_toast', 'JAM TOAST', 9, null, 1, { bread: 1, cherry: 2 }, 'fire'],
    ['orange_juice', 'ORANGE JUICE', 6, 'speed', 1, { orange: 2 }, 'hand'], ['lemonade', 'LEMONADE', 7, null, 2, { lemon: 2, sugar: 1 }, 'hand']]) {
    wgItem(id, name, 'food', buff ? { food, buff } : { food }); wgRec(id, n, rec, at);
  }
  wgObj('fruit_basket', { name: 'FRUIT BASKET', kind: 'deco', tool: 'hand', solid: 0, hp: 2, drops: [DR('fruit_basket', 1, 1)] });
  wgItem('fruit_basket', 'FRUIT BASKET', 'place', { place: 'fruit_basket' }); PLACE.fruit_basket = 'fruit_basket';
  wgRec('fruit_basket', 1, { fiber: 4, apple: 1, orange: 1, cherry: 1 });
  WG_ACH.push(['orchard', 'ORCHARD', 'PICK FOUR KINDS OF FRUIT', (c) => c.seen.apple && c.seen.cherry && c.seen.orange && c.seen.lemon]);
})();

// The wild ones: decided from the seed and the tile, so every screen and every reload grows the same trees.
const _wgGenOrch = wgGenOver;
wgGenOver = function (seed, ch) {
  _wgGenOrch(seed, ch);
  const CS = WG.CS;
  for (let k = 0; k < CS * CS; k++) {
    const id = ch.o[k], o = id && OBJ[id], wild = o && WG_ORCH_WILD[o.id]; if (!wild) continue;
    const x = ch.cx * CS + k % CS, y = ch.cy * CS + Math.floor(k / CS), h = hash(x, y, seed + 91);
    if (h % wild[1] === 0) ch.o[k] = O_ID['tree_' + wild[0] + ((h >> 8) & 1 ? '_r' : '')];
  }
};
// Fruit comes back in about ten minutes and a fruit sapling grows up in about twenty (sooner with bone meal, faster or
// slower with the world's growth rule).
const _wgGrowOrch = wgGrowTick;
wgGrowTick = function (dt) {
  _wgGrowOrch(dt);
  if (WGS.growT !== 1) return;
  const w = WGS.world, CS = WG.CS, rule = (w.meta.rules || {}).grow, f = [0.5, 1, 2][rule === undefined ? 1 : rule];
  for (const [key, ch] of w.chunks) {
    if (ch.dim !== WGS.dim && key[0] !== WGS.dim) continue;
    for (let n = 0; n < 8; n++) {
      const k = Math.floor(Math.random() * CS * CS), o = ch.o[k] && OBJ[ch.o[k]];
      if (!o) continue;
      const to = o.fruit && o.ripe && Math.random() < 0.2 * f ? o.ripe : o.kind === 'sapling' && OBJ[O_ID[o.grow]].fruit && Math.random() < 0.1 * f ? o.grow : null;
      if (to) wgSetObj(w, WGS.dim, ch.cx * CS + k % CS, ch.cy * CS + Math.floor(k / CS), O_ID[to]);
    }
  }
};
// USE on a ripe tree picks its fruit (now and then a sapling falls too); a bare one says it is still growing.
function wgPickFruit(tx, ty) {
  const w = WGS.world, dim = WGS.dim, o = OBJ[wgObjAt(w, dim, tx, ty)], [a, b] = o.pickN;
  for (let i = a + Math.floor(Math.random() * (b - a + 1)); i > 0; i--) wgDrop(tx * 16 + 8 + (Math.random() - 0.5) * 12, ty * 16 + 14, o.fruit, 1);
  if (Math.random() < 0.08) wgDrop(tx * 16 + 8, ty * 16 + 14, o.sap, 1);
  wgSetObj(w, dim, tx, ty, O_ID[o.bare]);
  const col = { apple: ['p', 'r', 'R'], cherry: ['p', 'r', 'R'], orange: ['n', 'o', 'O'], lemon: ['O', 'y', 'Y'] }[o.fruit];
  wgPart(tx * 16 + 8, ty * 16 - 4, 8, { c: ['g', 'G', 'h', ...col], s: 30, up: 10, life: 0.6 }); wgSfx('pickup');
}
const _wgUseOrch = wgUse;
wgUse = function (tx, ty) {
  const o = OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)], s = WGS.inv[WGS.sel], it = s && WGI[s.id];
  if (o && o.fruit && o.bare) { wgPickFruit(tx, ty); return true; }
  if (o && o.fruit && !(it && (it.kind === 'food' || it.grow))) { wgToast('THE FRUIT IS STILL GROWING'); return true; }
  return _wgUseOrch(tx, ty);
};
const _wgTipOrch = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipOrch(s), it = WGI[s.id], o = it && it.place && OBJ[O_ID[it.place]], t = o && o.grow && OBJ[O_ID[o.grow]];
  if (t && t.fruit) L[0] = 'GROWS INTO A FRUIT TREE';
  return L;
};

// ---------- art ----------
// A fruit tree is smaller than a wild oak: a short trunk, a crown of its own shape, the fruit stamped on when ripe.
// The ripe and bare sprites share the crown's shape, so a tree never jumps when it is picked.
const WG_ORCH_TREE = {
  apple: { crown: ['g', 'G', 'h', 'H'], blobs: [[14, 12, 10, 7], [8, 14, 6, 5], [20, 14, 6, 5], [14, 17, 8, 4], [9, 8, 6, 5], [19, 8, 6, 5], [14, 6, 7, 5]], fr: ['p', 'r', 'R'], n: 7 },
  cherry: { crown: ['z', 'g', 'G', 'h'], bloom: ['p', 'P', 'q', 'w'], blobs: [[14, 12, 11, 6], [7, 14, 6, 5], [21, 14, 6, 5], [10, 8, 6, 5], [18, 8, 6, 5], [14, 6, 6, 4]], fr: ['p', 'r', 'R'], n: 8, small: 1 },
  orange: { crown: ['z', 'g', 'G', 'h'], blobs: [[14, 11, 10, 9], [9, 15, 5, 5], [19, 15, 5, 5], [14, 4, 6, 3]], fr: ['n', 'o', 'O'], n: 7, flower: 'w' },
  lemon: { crown: ['g', 'G', 'h', 'H'], blobs: [[14, 12, 8, 10], [9, 13, 5, 6], [19, 13, 5, 6], [14, 4, 5, 4]], fr: ['O', 'y', 'Y'], n: 6, long: 1 },
};
const WG_ORCH_ART = ['cherry', 'orange', 'lemon', 'baked_apple', 'apple_pie', 'cherry_tart', 'jam_toast', 'orange_juice', 'lemonade'];
function wgOrchSpots(g, n, seed, wide) { // fruit go where the crown is thick, never on its edge, a few pixels apart
  const d = g.getImageData(0, 0, 28, 36).data, on = (x, y) => x >= 0 && y >= 0 && x < 28 && y < 36 && d[(y * 28 + x) * 4 + 3] > 0, rng = wgRng(seed), out = [];
  for (let i = 0; i < 300 && out.length < n; i++) {
    const x = 3 + Math.floor(rng() * 22), y = 2 + Math.floor(rng() * 19);
    if (!(on(x - 2, y - 2) && on(x + wide + 1, y - 2) && on(x - 2, y + 3) && on(x + wide + 1, y + 3))) continue;
    if (out.some(([a, b]) => Math.abs(a - x) < 4 + wide && Math.abs(b - y) < 4)) continue;
    out.push([x, y]);
  }
  return out;
}
const _wgBuildOrch = wgBuildAll;
wgBuildAll = function () {
  _wgBuildOrch();
  Object.keys(WG_ORCH_TREE).forEach((k, ki) => {
    const T = WG_ORCH_TREE[k], make = (ripe) => [0, 1].map(v => wgMake('tree_' + k + v + (ripe ? 'r' : ''), 28, 36, (g) => {
      wgTrunk(g, 14, 20, 34, 4, ['u', 'n', 'N', 'O'], true); wgPx(g, 12, 28, 'u');
      const blobs = T.blobs.map(([x, y, rx, ry]) => [v ? 28 - x : x, y + (v && ry > 5 ? 1 : 0), rx, ry]);
      wgCrown(g, blobs, ripe || !T.bloom ? T.crown : T.bloom, wgRng(150 + ki * 7 + v));
      const spots = wgOrchSpots(g, T.n, 170 + ki * 7 + v, T.small ? 0 : 1), [d, m, l] = T.fr;
      if (ripe) for (const [x, y] of spots) {
        if (T.small) { wgPx(g, x, y, l); wgPx(g, x, y + 1, m); wgPx(g, x + 2, y, m); wgPx(g, x + 2, y + 1, d); wgPx(g, x + 1, y - 1, 'u'); } // a pair of cherries on one stem
        else if (T.long) { wgRc(g, x, y, 3, 2, m); wgPx(g, x, y, l); wgPx(g, x + 2, y + 1, d); wgPx(g, x - 1, y + 1, m); } // a lemon is longer than it is tall
        else { wgRc(g, x, y, 2, 2, m); wgPx(g, x, y, l); wgRc(g, x + 2, y, 1, 2, d); wgRc(g, x, y + 2, 2, 1, d); } // a round fruit, lit from the top left
      } else if (T.flower) for (const [x, y] of spots.slice(0, 4)) wgPx(g, x, y, T.flower); // orange blossom: a few white specks
    }));
    wgReg('tree_' + k, make(false)); wgReg('tree_' + k + '_r', make(true));
    wgReg('sap_' + k, [wgMake('sap_' + k, 14, 16, (g) => {
      wgRc(g, 6, 9, 2, 6, 'n'); wgBlob(g, 7, 6, 5, 5, T.bloom || T.crown); wgPx(g, 4, 7, (T.bloom || T.crown)[3]); wgPx(g, 10, 5, (T.bloom || T.crown)[0]);
      if (!T.bloom) { wgPx(g, 8, 4, T.fr[1]); wgPx(g, 5, 8, T.fr[2]); }
    })]);
  });
  // a wicker basket heaped with fruit
  wgReg('fruit_basket', [wgMake('fruit_basket', 16, 13, (g) => {
    wgRc(g, 2, 7, 12, 5, 'N'); wgRc(g, 3, 12, 10, 1, 'n'); for (const x of [3, 6, 9, 12]) wgRc(g, x, 7, 1, 5, 'n'); wgRc(g, 2, 7, 12, 1, 'e'); wgRc(g, 2, 9, 12, 1, 'e');
    wgBlob(g, 5, 5.6, 2.4, 2.2, ['p', 'r', 'R', 'q']); wgBlob(g, 11, 5.6, 2.4, 2.2, ['n', 'o', 'O', 'Y']); wgBlob(g, 8, 3.8, 2.6, 1.8, ['O', 'y', 'Y', 'w']); wgPx(g, 7, 6, 'p'); wgPx(g, 8, 6, 'r'); wgPx(g, 8, 1, 'g');
  })]);
};
const _wgIconOrch = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || !WG_ORCH_ART.includes(id)) return _wgIconOrch(id);
  const [c, g] = wgCv(16, 16), RED = ['p', 'r', 'R', 'q'], CHERRY = ['v', 'p', 'r', 'R'], ORANGE = ['n', 'o', 'O', 'Y'], LEMON = ['O', 'y', 'Y', 'w'];
  const glass = (juice) => { // a tall glass, the drink inside, a slice on the rim
    wgRc(g, 4, 4, 8, 11, 'C'); wgRc(g, 5, 6, 6, 8, juice[1]); wgRc(g, 5, 6, 6, 1, juice[2]); wgRc(g, 5, 13, 6, 1, juice[0]); wgRc(g, 4, 4, 1, 11, 'L'); wgRc(g, 10, 7, 1, 6, juice[0]);
    wgBlob(g, 12, 4, 2.4, 2.4, juice === LEMON ? LEMON : ORANGE); wgPx(g, 12, 4, 'w');
  };
  if (id === 'cherry') { // two cherries on stems joined at a leaf
    wgLine(g, 5, 9, 9, 3, 'g'); wgLine(g, 11, 10, 9, 3, 'g'); wgRc(g, 10, 2, 3, 2, 'G'); wgPx(g, 12, 2, 'h');
    wgBlob(g, 4.6, 11, 2.8, 2.8, CHERRY); wgBlob(g, 11, 12, 2.8, 2.8, CHERRY); wgPx(g, 4, 10, 'q'); wgPx(g, 10, 11, 'q');
  } else if (id === 'orange') { wgBlob(g, 8, 9, 5.4, 5.2, ORANGE); wgRc(g, 8, 3, 1, 2, 'u'); wgRc(g, 9, 3, 3, 1, 'G'); wgPx(g, 10, 2, 'h'); wgPx(g, 6, 7, 'w'); wgPx(g, 10, 11, 'n'); }
  else if (id === 'lemon') { wgBlob(g, 8, 9, 6, 4.2, LEMON); wgPx(g, 2, 9, 'y'); wgPx(g, 14, 9, 'O'); wgRc(g, 9, 4, 3, 1, 'G'); wgPx(g, 6, 7, 'w'); }
  else if (id === 'baked_apple') { // a glazed apple on a small plate
    wgBlob(g, 8, 12, 6.4, 2.2, ['m', 'l', 'L', 'w']); wgBlob(g, 8, 8.6, 4.6, 4, ['n', 'r', 'R', 'q']); wgRc(g, 8, 3, 1, 3, 'u'); wgPx(g, 6, 7, 'Y'); wgPx(g, 10, 10, 'n');
  } else if (id === 'apple_pie') { // the berry pie's tin with a golden lattice
    wgRc(g, 2, 8, 12, 5, 'N'); wgBlob(g, 8, 8, 6.4, 3, ['n', 'N', 'O', 'Y']); for (const x of [5, 8, 11]) wgRc(g, x, 6, 1, 5, 'Y'); wgRc(g, 3, 8, 10, 1, 'Y'); wgRc(g, 2, 12, 12, 1, 'n'); wgPx(g, 6, 9, 'h'); wgPx(g, 10, 7, 'h');
  } else if (id === 'cherry_tart') { // a small tart with cherries on cream
    wgRc(g, 3, 9, 10, 4, 'N'); wgRc(g, 3, 9, 10, 1, 'O'); wgRc(g, 4, 13, 8, 1, 'n'); wgBlob(g, 8, 8, 4.6, 1.8, ['q', 'L', 'w', 'w']);
    for (const [x, y] of [[5.6, 6.6], [8.4, 6], [10.8, 6.8]]) wgBlob(g, x, y, 1.6, 1.6, CHERRY); wgPx(g, 8, 3, 'g'); wgPx(g, 9, 4, 'g');
  } else if (id === 'jam_toast') { // a slice of toast spread with red jam
    wgRc(g, 3, 4, 10, 10, 'N'); wgBlob(g, 5, 4.5, 2.6, 2, ['N', 'N', 'O', 'O']); wgBlob(g, 11, 4.5, 2.6, 2, ['N', 'N', 'O', 'O']); wgRc(g, 4, 6, 8, 7, 'O');
    wgBlob(g, 8, 9, 3.6, 3, CHERRY); wgPx(g, 6, 8, 'q'); wgRc(g, 3, 13, 10, 1, 'n');
  } else glass(id === 'lemonade' ? LEMON : ORANGE);
  wgOutline(c); WGA.cache[key] = c; return c;
};
