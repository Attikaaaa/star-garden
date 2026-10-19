'use strict';
// Wildgrove: the cozy pack. Uses for what used to pile up in chests (white and purple petals, bones, shells,
// pearls, obsidian, mushrooms, cactus fruit): carpets and banners in the other petal colours, a pumpkin
// lantern, a pearl lamp, a shell chime, obsidian walls, bone meal that hurries a crop along, and two more
// dishes. New ids are appended, so old worlds stay valid.
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'pick', hp: 5, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id;
    wgRec(id, rec[0], rec[1], at);
  };
  for (const [c, name, ramp, petal] of [['yellow', 'YELLOW', ['o', 'O', 'y', 'Y'], 'petal_y'], ['white', 'WHITE', ['m', 'l', 'L', 'w'], 'petal_w'], ['purple', 'PURPLE', ['1', '2', '3', '4'], 'petal_p']]) {
    wgDefGround('f_' + c, { name: name + ' CARPET', pri: 8, ramp, floor: 1, step: 'rug' });
    PLACE_G['carpet_' + c] = 'f_' + c; wgItem('carpet_' + c, name + ' CARPET', 'place', { place: null, placeG: 'f_' + c });
    wgRec('carpet_' + c, 4, { wool: 2, [petal]: 2 }, 'loom');
  }
  for (const [id, name, petal] of [['banner_y', 'YELLOW BANNER', 'petal_y'], ['banner_w', 'WHITE BANNER', 'petal_w'], ['banner_p', 'PURPLE BANNER', 'petal_p']])
    dec(id, name, { tool: 'axe', solid: 0, hp: 3 }, [1, { wool: 3, stick: 2, [petal]: 1 }], 'loom');
  dec('jacklantern', 'PUMPKIN LANTERN', { kind: 'light', light: 90, tool: 'axe', hp: 3 }, [1, { pumpkin: 1, torch: 1 }], 'hand');
  dec('pearl_lamp', 'PEARL LAMP', { kind: 'light', light: 100, hp: 4 }, [1, { pearl: 2, glass: 1, copper: 1 }], 'anvil');
  dec('chime', 'SHELL CHIME', { tool: 'axe', solid: 0, hp: 2 }, [1, { shell: 3, string: 1, stick: 2 }], 'bench');
  wgObj('w_obsidian', { name: 'OBSIDIAN WALL', kind: 'wall', tool: 'pick', hp: 30, tier: 3, ramp: ['0', 'x', '1', '2'], drops: [DR('wall_obsidian', 1, 1)] });
  PLACE.wall_obsidian = 'w_obsidian'; wgItem('wall_obsidian', 'OBSIDIAN WALL', 'place', { place: 'w_obsidian' });
  wgRec('wall_obsidian', 4, { obsidian: 2, stone: 2 }, 'anvil');
  wgItem('bonemeal', 'BONE MEAL', 'res', { grow: 1 }); wgRec('bonemeal', 3, { bone: 1 });
  wgItem('mush_soup', 'MUSHROOM SOUP', 'food', { food: 9 }); wgRec('mush_soup', 1, { mush_b: 2, mush_r: 1 }, 'fire');
  wgItem('fruit_salad', 'FRUIT SALAD', 'food', { food: 10, buff: 'regen' }); wgRec('fruit_salad', 1, { apple: 1, berry: 2, cactus_fruit: 1 });
})();

// Bone meal on a crop moves it one stage on; on a berry bush it ripens, on a sapling it grows the tree.
function wgBoneMeal(tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty), o = id && OBJ[id]; if (!o) return false;
  let to = 0, m = 0;
  if (o.kind === 'crop') { const st = wgMetaAt(w, dim, tx, ty); if (st >= 3) { wgToast('ALREADY RIPE'); return true; } to = id; m = st + 1; }
  else if (o.ripe) to = O_ID[o.ripe];
  else if (o.kind === 'sapling') to = O_ID[o.grow];
  if (!to) return false;
  wgSetObj(w, dim, tx, ty, to, m); wgInvTake(WGS.inv, 'bonemeal', 1);
  wgSfx('pickup'); wgPart(tx * 16 + 8, ty * 16 + 8, 6, { c: ['h', 'H', 'w'], s: 20, up: 18, life: 0.6 });
  return true;
}
const _wgUseCozy = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel];
  if (s && s.id === 'bonemeal' && wgBoneMeal(tx, ty)) return true;
  return _wgUseCozy(tx, ty);
};

// ---------- art ----------
const _wgIconCozy = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || (id !== 'bonemeal' && id !== 'mush_soup' && id !== 'fruit_salad')) return _wgIconCozy(id);
  const [c, g] = wgCv(16, 16);
  if (id === 'bonemeal') { // a heap of white meal with a sprout, for growing
    wgBlob(g, 8, 11.6, 6, 2.6, ['m', 'l', 'L', 'w']); wgBlob(g, 8, 9.6, 3.4, 1.8, ['m', 'l', 'L', 'w']);
    wgRc(g, 8, 4, 1, 5, 'g'); wgRc(g, 6, 5, 2, 1, 'G'); wgPx(g, 5, 4, 'h'); wgRc(g, 9, 3, 2, 1, 'G'); wgPx(g, 11, 2, 'h'); wgPx(g, 5, 12, 'm'); wgPx(g, 11, 11, 'm');
  } else if (id === 'mush_soup') { // the stew's bowl with a brown soup and a red cap floating in it
    wgRc(g, 2, 8, 12, 5, 'x'); wgRc(g, 3, 13, 10, 1, 'x'); wgRc(g, 2, 8, 12, 1, 'X');
    wgBlob(g, 8, 8, 5.4, 1.8, ['u', 'n', 'N', 'k']); wgRc(g, 5, 7, 3, 1, 'r'); wgPx(g, 6, 6, 'R'); wgRc(g, 9, 8, 2, 1, 'k'); wgPx(g, 9, 4, 'w'); wgPx(g, 10, 2, 'l');
  } else { // a wooden bowl heaped with apple, a yellow slice and cactus fruit
    wgRc(g, 2, 9, 12, 4, 'n'); wgRc(g, 2, 9, 12, 1, 'N'); wgRc(g, 3, 13, 10, 1, 'u'); wgRc(g, 13, 10, 1, 3, 'u');
    wgBlob(g, 5, 8, 2.4, 2.2, ['p', 'r', 'R', 'q']); wgBlob(g, 11, 8, 2.4, 2.2, ['p', 'P', 'q', 'w']); wgBlob(g, 8, 7, 2.4, 2.2, ['o', 'O', 'y', 'Y']);
    wgPx(g, 8, 4, 'G'); wgPx(g, 9, 3, 'G'); wgPx(g, 9, 4, 'g');
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildCozy = wgBuildAll;
wgBuildAll = function () {
  _wgBuildCozy();
  const W4 = ['u', 'n', 'N', 'O'], one = (id, w, h, fn) => wgReg(id, [wgMake(id, w, h, fn)]);
  const two = (id, w, h, fn) => { wgReg(id, [0, 1].map(v => wgMake(id + v, w, h, (g) => fn(g, v)))); OBJ[O_ID[id]].anim = 1; };
  // banners: the red and blue ones' cut, three more colours (shade, cloth, light, emblem)
  for (const [id, c] of [['banner_y', ['O', 'y', 'Y', 'o']], ['banner_w', ['l', 'L', 'w', 'B']], ['banner_p', ['1', '2', '3', 'Y']]]) one(id, 12, 26, (g) => {
    wgRc(g, 1, 1, 10, 2, W4[1]); wgRc(g, 1, 1, 10, 1, W4[3]); wgRc(g, 5, 3, 2, 22, W4[0]);
    wgRc(g, 2, 3, 8, 14, c[1]); wgRc(g, 2, 3, 8, 1, c[2]); wgRc(g, 2, 3, 1, 14, c[2]); wgRc(g, 9, 4, 1, 13, c[0]);
    wgPx(g, 3, 17, c[1]); wgPx(g, 4, 18, c[1]); wgPx(g, 5, 19, c[1]); wgPx(g, 7, 17, c[1]); wgPx(g, 6, 18, c[1]);
    wgRc(g, 5, 7, 2, 6, c[3]); wgRc(g, 4, 9, 4, 2, c[3]); wgRc(g, 3, 24, 6, 2, W4[0]);
  });
  // a smiling pumpkin lantern: the face glows and breathes a little
  two('jacklantern', 16, 14, (g, v) => {
    wgBlob(g, 8, 8.4, 7, 5.2, ['n', 'o', 'o', 'o']); wgLine(g, 5, 4, 5, 13, 'n'); wgLine(g, 11, 4, 11, 13, 'n'); // a deep orange body, so the yellow face reads
    wgRc(g, 3, 5, 2, 1, 'O'); wgPx(g, 2, 6, 'O'); wgRc(g, 7, 4, 3, 1, 'O'); // the light, top left, kept off the face
    wgRc(g, 7, 0, 2, 3, 'g'); wgPx(g, 7, 0, 'G'); wgPx(g, 9, 1, 'G');
    const f = v ? 'Y' : 'y';
    for (const [x, y] of [[5, 6], [4, 7], [5, 7], [10, 6], [10, 7], [11, 7], [4, 9], [5, 10], [6, 10], [7, 11], [8, 11], [9, 10], [10, 10], [11, 9]]) wgPx(g, x, y, f);
  });
  // a pearl in a glass globe on a slim copper stand
  one('pearl_lamp', 10, 24, (g) => {
    wgRc(g, 4, 9, 2, 13, 'n'); wgRc(g, 4, 9, 1, 13, 'N'); wgRc(g, 2, 21, 6, 3, 'n'); wgRc(g, 2, 21, 6, 1, 'O'); wgRc(g, 7, 22, 1, 2, 'u');
    wgBlob(g, 5, 5, 4.4, 4.4, ['B', 'c', 'C', 'w']); wgBlob(g, 5, 5.6, 2, 2, ['l', 'L', 'w', 'w']); wgPx(g, 3, 3, 'w'); wgPx(g, 4, 2, 'w');
  });
  // two shells on strings from a little gallows of sticks (the strings stand apart, so outlines never join)
  one('chime', 14, 24, (g) => {
    wgRc(g, 1, 2, 2, 21, 'n'); wgRc(g, 1, 2, 1, 21, 'N'); wgRc(g, 1, 2, 12, 2, 'n'); wgRc(g, 1, 2, 12, 1, 'N'); wgRc(g, 0, 22, 5, 2, 'u');
    for (const [x, len, c] of [[7, 7, ['p', 'P', 'q', 'w']], [11, 10, ['n', 'k', 's', 'w']]]) { wgRc(g, x, 4, 1, len, 'l'); wgBlob(g, x + 0.5, 5.5 + len, 1.8, 1.6, c); }
  });
};
