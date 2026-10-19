'use strict';
// Wildgrove: the garden pack. Four more crops (tomatoes, corn, strawberries, sunflowers) whose seeds turn up now
// and then in cut grass, and seven dishes to make from them. Ids are appended, so old worlds stay valid.
const WG_GARDEN = ['tomato', 'corn', 'straw', 'sun'];
(function () {
  Object.assign(CROP, { tomato: 80, corn: 90, straw: 70, sun: 100 });
  for (const [id, name, food] of [['tomato', 'TOMATO', 3], ['corn', 'CORN', 2], ['strawberry', 'STRAWBERRY', 2]]) wgItem(id, name, 'food', { food });
  for (const [id, name, crop] of [['seed_tomato', 'TOMATO SEEDS', 'tomato'], ['seed_corn', 'CORN KERNELS', 'corn'], ['seed_straw', 'STRAWBERRY RUNNER', 'straw'], ['seed_sun', 'SUNFLOWER SEEDS', 'sun']])
    wgItem(id, name, 'seed', { crop });
  for (const [c, name, drops] of [['tomato', 'TOMATO PLANT', [DR('tomato', 2, 4), DR('seed_tomato', 0, 1, 0.5)]], ['corn', 'CORN STALKS', [DR('corn', 1, 3), DR('seed_corn', 1, 2)]],
    ['straw', 'STRAWBERRY PATCH', [DR('strawberry', 2, 4), DR('seed_straw', 0, 1, 0.5)]], ['sun', 'SUNFLOWER', [DR('seed_sun', 2, 4), DR('petal_y', 1, 2)]]])
    wgObj('crop_' + c, { name, kind: 'crop', hp: 1, solid: 0, crop: c, drops, seed: 'seed_' + c });
  // cut grass sometimes holds a seed
  OBJ[O_ID.tallgrass].drops.push(DR('seed_tomato', 1, 1, 0.025), DR('seed_corn', 1, 1, 0.025), DR('seed_straw', 1, 1, 0.025), DR('seed_sun', 1, 1, 0.025));
  wgRec('seed_tomato', 2, { tomato: 1 }); wgRec('seed_corn', 2, { corn: 1 }); wgRec('seed_straw', 1, { strawberry: 2 });
  for (const [id, name, food, buff, n, rec, at] of [
    ['tomato_soup', 'TOMATO SOUP', 10, null, 1, { tomato: 3 }, 'fire'], ['popcorn', 'POPCORN', 3, null, 3, { corn: 1 }, 'fire'],
    ['roast_corn', 'ROASTED CORN', 7, null, 1, { corn: 1 }, 'fire'], ['straw_cake', 'STRAWBERRY CAKE', 13, 'speed', 1, { flour: 1, strawberry: 3, sugar: 1, egg: 1 }, 'fire'],
    ['roast_seeds', 'ROASTED SEEDS', 4, null, 1, { seed_sun: 3 }, 'fire'], ['pizza', 'PIZZA', 16, 'dig', 1, { flour: 2, tomato: 2, mush_b: 1 }, 'fire'],
    ['garden_salad', 'GARDEN SALAD', 8, 'regen', 1, { tomato: 1, carrot: 1, corn: 1 }, 'hand']]) {
    wgItem(id, name, 'food', buff ? { food, buff } : { food }); wgRec(id, n, rec, at);
  }
  const a = WG_ACH.find(x => x[0] === 'farm'); if (a) { const t0 = a[3]; a[3] = (c) => t0(c) || c.seen.tomato || c.seen.corn || c.seen.strawberry; }
  WG_ACH.push(['garden', 'MARKET GARDEN', 'GROW TOMATOES, CORN AND STRAWBERRIES', (c) => c.seen.tomato && c.seen.corn && c.seen.strawberry]);
})();

// ---------- art ----------
const WG_GARDEN_ART = ['tomato', 'corn', 'strawberry', 'tomato_soup', 'popcorn', 'roast_corn', 'straw_cake', 'roast_seeds', 'pizza', 'garden_salad'];
const _wgIconGarden = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || !WG_GARDEN_ART.includes(id)) return _wgIconGarden(id);
  const [c, g] = wgCv(16, 16), RED = ['p', 'r', 'R', 'q'], GOLD = ['O', 'y', 'Y', 'w'];
  const bowl = (soup) => { wgRc(g, 2, 8, 12, 5, 'x'); wgRc(g, 3, 13, 10, 1, 'x'); wgRc(g, 2, 8, 12, 1, 'X'); wgBlob(g, 8, 8, 5.4, 1.8, soup); wgPx(g, 9, 4, 'w'); wgPx(g, 10, 2, 'l'); };
  const cob = (x, y, ramp, husk) => { wgBlob(g, x, y, 2.6, 5, ramp); for (let k = -3; k <= 3; k += 2) wgPx(g, x - 1, y + k, ramp[0]); if (husk) { wgLine(g, x - 3, y + 6, x - 2, y, 'g'); wgLine(g, x + 3, y + 6, x + 2, y + 1, 'G'); } };
  if (id === 'tomato') { wgBlob(g, 8, 9.4, 5.4, 4.6, RED); wgRc(g, 6, 4, 5, 1, 'G'); wgPx(g, 8, 3, 'g'); wgPx(g, 5, 5, 'G'); wgPx(g, 11, 5, 'G'); wgPx(g, 5, 8, 'w'); }
  else if (id === 'corn') cob(8, 8, GOLD, true);
  else if (id === 'strawberry') { // a cone, not a ball, so it never reads as a tomato
    [[4, 11], [3, 12], [3, 12], [3, 12], [4, 11], [4, 11], [5, 10], [6, 9], [7, 8]].forEach(([a, b], k) => { const y = 5 + k; wgRc(g, a, y, b - a + 1, 1, k > 6 ? 'p' : 'r'); wgPx(g, a, y, 'R'); wgPx(g, b, y, 'p'); });
    wgPx(g, 4, 6, 'q'); for (const [x, y] of [[6, 7], [9, 6], [10, 9], [7, 10], [8, 8], [5, 9]]) wgPx(g, x, y, 'Y');
    wgRc(g, 4, 4, 8, 1, 'G'); for (const x of [4, 8, 11]) wgPx(g, x, 3, 'g'); wgPx(g, 8, 2, 'g');
  }
  else if (id === 'tomato_soup') bowl(RED);
  else if (id === 'popcorn') { // a striped paper cup heaped with white puffs
    wgRc(g, 4, 7, 8, 8, 'w'); for (const x of [5, 8, 11]) wgRc(g, x, 7, 1, 8, 'r'); wgRc(g, 4, 14, 8, 1, 'L');
    for (const [x, y] of [[5, 5], [8, 4], [11, 5], [6.5, 2.5], [9.5, 2.5]]) wgBlob(g, x, y, 1.8, 1.6, ['l', 'L', 'w', 'w']); wgPx(g, 8, 3, 'y');
  } else if (id === 'roast_corn') { cob(8, 8, ['n', 'O', 'y', 'Y'], false); for (const [x, y] of [[8, 5], [9, 8], [7, 10]]) wgPx(g, x, y, 'n'); wgRc(g, 7, 13, 2, 3, 'n'); }
  else if (id === 'straw_cake') { // the honey cake's cut with pink cream and a berry on top
    wgRc(g, 3, 7, 10, 6, 'N'); wgRc(g, 3, 5, 10, 3, 'q'); wgRc(g, 3, 5, 10, 1, 'w'); wgRc(g, 3, 9, 10, 1, 'P'); wgBlob(g, 8, 3.6, 1.8, 1.6, RED); wgPx(g, 8, 2, 'G'); wgPx(g, 4, 6, 'w');
  } else if (id === 'roast_seeds') { // a little heap of striped seeds
    for (const [x, y] of [[4, 12], [8, 12.5], [12, 12], [6, 9.5], [10, 9.5], [8, 6.5]]) { wgBlob(g, x, y, 2.2, 1.6, ['u', 'k', 'n', 'N']); wgPx(g, Math.round(x), Math.round(y) - 1, 'L'); wgPx(g, Math.round(x) - 1, Math.round(y), 'L'); }
  } else if (id === 'pizza') { // a round pie: crust, sauce, cheese, mushrooms
    wgBlob(g, 8, 8.6, 6.6, 5.4, ['n', 'N', 'O', 'Y']); wgBlob(g, 8, 8.6, 5, 3.8, RED);
    for (const [x, y] of [[6, 7], [10, 8], [8, 10], [5, 10]]) wgRc(g, x, y, 2, 1, 'y'); for (const [x, y] of [[9, 6], [11, 10], [6, 9]]) wgPx(g, x, y, 'k'); wgPx(g, 4, 6, 'Y');
  } else { // a wooden bowl of greens with tomato and corn
    wgRc(g, 2, 9, 12, 4, 'n'); wgRc(g, 2, 9, 12, 1, 'N'); wgRc(g, 3, 13, 10, 1, 'u'); wgRc(g, 13, 10, 1, 3, 'u');
    wgBlob(g, 8, 7.4, 5.6, 2.6, ['g', 'G', 'h', 'H']); wgBlob(g, 5.5, 7, 1.6, 1.4, RED); wgBlob(g, 10.5, 6.6, 1.6, 1.4, RED); wgRc(g, 7, 5, 2, 1, 'Y'); wgPx(g, 8, 8, 'y');
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildGarden = wgBuildAll;
wgBuildAll = function () {
  _wgBuildGarden();
  const crop = (id, stages) => wgReg(id, stages.map((fn, k) => wgMake(id + k, 16, 16, fn, false)));
  const G4 = ['g', 'G', 'h', 'H'], RED = ['p', 'r', 'R', 'q'];
  const sprout = (g, n) => { for (let i = 0; i < n; i++) { const x = Math.round(3 + i * (10 / Math.max(1, n - 1))); wgPx(g, x, 14, G4[0]); wgPx(g, x - 1, 13, G4[2]); wgPx(g, x + 1, 13, G4[2]); wgPx(g, x, 12, G4[3]); } };
  // tomatoes climb two stakes; green fruit, then red
  const tomato = (g, fruit) => {
    for (const x of [4, 11]) { wgLine(g, x, 15, x, 3, 'n'); wgPx(g, x, 3, 'N'); wgBlob(g, x + 0.5, 9, 3, 4.4, G4); wgBlob(g, x + 0.5, 5, 2.2, 2, G4); }
    if (fruit) for (const [x, y] of [[3, 9], [6, 7], [10, 10], [13, 7], [5, 12]]) { wgBlob(g, x, y, 1.4, 1.4, fruit); }
  };
  crop('crop_tomato', [(g) => sprout(g, 2), (g) => { for (const x of [4, 11]) { wgLine(g, x, 15, x, 8, 'n'); wgBlob(g, x + 0.5, 12, 2.4, 2.4, G4); } }, (g) => tomato(g, ['g', 'h', 'H', 'H']), (g) => tomato(g, RED)]);
  // corn grows tall, then cobs in their husks
  const stalk = (g, x, top, cobs) => { wgLine(g, x, 15, x, top, 'G'); wgLine(g, x + 1, 15, x + 1, top + 2, 'g'); wgLine(g, x, 11, x - 3, 8, 'h'); wgLine(g, x + 1, 9, x + 4, 6, 'G'); wgPx(g, x, top - 1, 'a');
    if (cobs) { wgRc(g, x + 2, top + 4, 2, 4, 'y'); wgPx(g, x + 2, top + 4, 'Y'); wgPx(g, x + 3, top + 7, 'O'); wgPx(g, x + 2, top + 8, 'g'); } };
  crop('crop_corn', [(g) => sprout(g, 3), (g) => { for (const x of [3, 8, 12]) { wgLine(g, x, 15, x, 10, 'G'); wgPx(g, x - 1, 11, 'h'); wgPx(g, x + 1, 12, 'h'); } },
    (g) => { stalk(g, 3, 4, false); stalk(g, 10, 3, false); }, (g) => { stalk(g, 3, 2, true); stalk(g, 10, 1, true); }]);
  // strawberries stay low: leaves, white flowers, red berries
  const patch = (g, top) => { for (const x of [3, 8, 13]) { wgBlob(g, x, 12.4, 2.6, 2.2, G4); wgPx(g, x, 11, top); } };
  crop('crop_straw', [(g) => sprout(g, 3), (g) => patch(g, 'H'), (g) => { patch(g, 'H'); for (const x of [5, 10]) { wgPx(g, x, 9, 'w'); wgPx(g, x - 1, 10, 'w'); wgPx(g, x + 1, 10, 'w'); wgPx(g, x, 10, 'y'); } },
    (g) => { patch(g, 'H'); for (const [x, y] of [[5, 11], [10, 12], [13, 10], [2, 13]]) { wgBlob(g, x, y, 1.4, 1.6, RED); wgPx(g, x, y, 'Y'); } }]);
  // a sunflower: a stem, a bud, the yellow face turned to the light
  const stem = (g, top) => { wgLine(g, 8, 15, 8, top, 'G'); wgLine(g, 9, 15, 9, top + 2, 'g'); wgBlob(g, 5.5, 11, 2.2, 1.2, G4); wgBlob(g, 11.5, 9, 2.2, 1.2, G4); };
  crop('crop_sun', [(g) => { wgLine(g, 8, 15, 8, 11, 'G'); wgPx(g, 7, 12, 'h'); wgPx(g, 9, 11, 'h'); wgPx(g, 6, 11, 'H'); wgPx(g, 10, 10, 'H'); },(g) => stem(g, 9), (g) => { stem(g, 5); wgBlob(g, 8.5, 4, 2, 2, G4); },
    (g) => { stem(g, 6); wgBlob(g, 8.5, 4.4, 5, 4, ['O', 'y', 'Y', 'Y']); wgBlob(g, 8.5, 4.4, 2.2, 2, ['k', 'u', 'n', 'N']); wgPx(g, 7, 3, 'n'); }]);
};
