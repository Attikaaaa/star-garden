'use strict';
// Wildgrove: the farmyard pack. A hen house that fills with eggs, a compost bin that turns plant scraps into bone meal,
// a birdhouse whose birds hop about on the grass by day, and three egg dishes. Ids are appended, so old worlds stay valid.
const WG_COMPOST_N = 5; // scraps per filling, which gives two bone meal
const WG_SCRAPS = ['fiber', 'stick', 'berry', 'apple', 'carrot', 'potato', 'wheat', 'pumpkin', 'tomato', 'corn', 'strawberry', 'cherry', 'orange', 'lemon',
  'cactus_fruit', 'glow_berry', 'tea_leaf', 'mush_r', 'mush_b'];
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 4, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  // the hen house ticks like a beehive (up to four eggs, one about every seventy seconds); its USE is its own
  dec('henhouse', 'HEN HOUSE', { kind: 'hive', tick: 1, prod: 'egg' }, { wood: 6, wheat: 4, feather: 2 }, 'bench');
  dec('compost', 'COMPOST BIN', { kind: 'compost' }, { wood: 4, stick: 2 }, 'hand');
  dec('birdhouse', 'BIRDHOUSE', { birds: 1 }, { wood: 3, stick: 2 }, 'bench');
  for (const [id, name, food, buff, n, rec] of [['fried_egg', 'FRIED EGG', 5, null, 1, { egg: 1 }], ['omelette', 'OMELETTE', 13, 'dig', 1, { egg: 2, mush_b: 1, tomato: 1 }],
    ['pancakes', 'BERRY PANCAKES', 12, 'speed', 2, { flour: 1, egg: 1, berry: 2 }]]) {
    wgItem(id, name, 'food', buff ? { food, buff } : { food }); wgRec(id, n, rec, 'fire');
  }
  WG_ACH.push(['hens', 'HAPPY HENS', 'COLLECT EGGS FROM A HEN HOUSE', (c) => c.st.hens]);
})();
function wgIsScrap(id) { const it = WGI[id]; return !!it && (WG_SCRAPS.includes(id) || it.kind === 'seed' || id.startsWith('petal_')); }
const _wgUseFarm = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty), o = id && OBJ[id], s = WGS.inv[WGS.sel], cx = tx * 16 + 8, cy = ty * 16 + 20;
  if (o && o.prod) {
    const n = wgMetaAt(w, dim, tx, ty); if (!n) { wgToast('NO EGGS YET'); return true; }
    wgDrop(cx, cy, o.prod, n); if (Math.random() < 0.3) wgDrop(cx, cy, 'feather', 1);
    wgSetObj(w, dim, tx, ty, id, 0); wgPart(cx, ty * 16 + 6, 5, { c: ['w', 'L', 'Y'], s: 24, up: 14 }); wgSfx('pickup');
    const m = w.meta; (m.stats || (m.stats = { kills: 0, far: 0 })).hens = 1;
    return true;
  }
  if (o && o.kind === 'compost') {
    const n = wgMetaAt(w, dim, tx, ty);
    if (!s || !wgIsScrap(s.id)) { wgToast('FEED IT PLANT SCRAPS (' + n + '/' + WG_COMPOST_N + ')'); return true; }
    wgInvTake(WGS.inv, s.id, 1); wgSfx('select'); wgPart(cx, ty * 16 + 4, 4, { c: ['g', 'n', 'u'], s: 16, up: 10, life: 0.5 });
    if (n + 1 >= WG_COMPOST_N) { wgSetObj(w, dim, tx, ty, id, 0); wgDrop(cx, cy, 'bonemeal', 2); wgToast('BONE MEAL!'); wgPart(cx, ty * 16 + 4, 6, { c: ['l', 'L', 'w'], s: 24, up: 16 }); }
    else wgSetObj(w, dim, tx, ty, id, n + 1);
    return true;
  }
  return _wgUseFarm(tx, ty);
};
const _wgTipFarm = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipFarm(s), it = WGI[s.id], o = it && it.place && OBJ[O_ID[it.place]];
  if (o && o.prod) L.push('LAYS EGGS OVER TIME');
  else if (o && o.kind === 'compost') L.push('PLANT SCRAPS IN, BONE MEAL OUT');
  else if (o && o.birds) L.push('BIRDS COME TO VISIT');
  if (wgIsScrap(s.id)) L.push('GOOD FOR COMPOST');
  return L;
};

// ---------- drawing: the compost's heap, the birds ----------
// Birdhouses in view are noted as they are drawn; the birds are drawn with the ambient life after the world.
const WG_BIRDS = [];
const _wgDrawObjFarm = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjFarm(id, tx, ty, sx, sy);
  const o = OBJ[id];
  if (o.birds) { if (WG_BIRDS.length < 8) WG_BIRDS.push(tx, ty); }
  else if (o.kind === 'compost') { // the heap inside rises with each scrap
    const n = wgMetaAt(WGS.world, WGS.dim, tx, ty); if (n) { const h = Math.ceil(n * 4 / WG_COMPOST_N); rect(sx + 3, sy + 8 - h, 10, h, 'u'); rect(sx + 3, sy + 8 - h, 10, 1, 'n'); rect(sx + 5, sy + 8 - h, 2, 1, 'G'); rect(sx + 9, sy + 9 - h, 1, 1, 'O'); rect(sx + 11, sy + 8 - h, 1, 1, 'h'); }
  }
};
const _wgAmbFarm = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbFarm(cx0, cy0);
  const t = WGS.t, p = WGS.p, day = WGS.dim === 'o' && wgNight(WGS.clock) < 0.35 && !(WGS.weather && WGS.weather.kind === 'rain');
  for (let i = 0; i < WG_BIRDS.length; i += 2) {
    const tx = WG_BIRDS[i], ty = WG_BIRDS[i + 1], hx = tx * 16 + 8, hy = ty * 16 + 14, near = p && Math.hypot(p.x - hx, p.y - hy) < 40;
    if (!day) continue;
    for (let b = 0; b < 2; b++) {
      const k = hash(tx, ty, 77 + b);
      let x, y;
      if (near) { x = hx - 4 + b * 7; y = ty * 16 - 5; } // shy: up on the roof while you are close
      else { // hop from spot to spot around the house, pecking in between
        const step = Math.floor(t / 1.7 + (k % 100) / 50), j = hash(step, k, 5), j0 = hash(step - 1, k, 5), f = Math.min(1, (t / 1.7 + (k % 100) / 50 - step) * 4);
        const ax = hx + (j0 % 41) - 20, ay = hy + ((j0 >> 6) % 17) - 4, bx = hx + (j % 41) - 20, by = hy + ((j >> 6) % 17) - 4;
        x = Math.round(ax + (bx - ax) * f); y = Math.round(ay + (by - ay) * f - Math.sin(f * Math.PI) * 3);
        if (f >= 1 && Math.floor(t * 4 + k) % 5 === 0) y += 1; // a peck
        shadow(x - cx0 + 1, by - cy0 + 1, 3);
      }
      const left = near ? b === 0 : (hash(Math.floor(t / 1.7), k, 6) & 1) === 1;
      ctx.drawImage(wgBirdSpr(k % 3, left), Math.round(x - cx0) - 4, Math.round(y - cy0) - 6);
    }
  }
  WG_BIRDS.length = 0;
};

// ---------- art ----------
// a songbird seen from the side: a blue tit, a robin, a sparrow; baked once per kind and facing
function wgBirdSpr(kind, left) {
  const key = 'bird' + kind + (left ? 'l' : 'r'); if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(9, 7), R = [['b', 'B', 'c', 'y'], ['u', 'n', 'N', 'R'], ['u', 'n', 'N', 'A']][kind];
  wgBlob(g, 4.6, 3.6, 2.6, 1.7, [R[0], R[1], R[1], R[2]]); wgBlob(g, 2.8, 2.4, 1.5, 1.5, [R[1], R[1], R[2], R[2]]);
  if (left) { wgPx(g, 1, 2, 'O'); wgPx(g, 2, 2, '0'); wgRc(g, 3, 4, 3, 1, R[3]); wgRc(g, 6, 3, 2, 1, R[0]); wgPx(g, 4, 6, 'O'); wgPx(g, 5, 6, 'O'); }
  else { const m = new OffscreenCanvas(9, 7); m.getContext('2d').drawImage(wgBirdSpr(kind, true), 0, 0); g.save(); g.scale(-1, 1); g.drawImage(m, -9, 0); g.restore(); WGA.cache[key] = c; return c; }
  wgOutline(c); WGA.cache[key] = c; return c;
}
const WG_FARM_ART = ['fried_egg', 'omelette', 'pancakes'];
const _wgBuildFarm = wgBuildAll;
wgBuildAll = function () {
  _wgBuildFarm();
  const W4 = ['u', 'n', 'N', 'O'], one = (id, w, h, fn) => wgReg(id, [wgMake(id, w, h, fn)]);
  // a red coop on stilts with a little ramp, a hen looking out of the door
  one('henhouse', 18, 20, (g) => {
    wgRc(g, 2, 6, 14, 9, 'r'); wgRc(g, 2, 6, 1, 9, 'R'); wgRc(g, 15, 6, 1, 9, 'p'); for (const x of [5, 9, 13]) wgRc(g, x, 7, 1, 8, 'p');
    for (let i = 0; i < 6; i++) wgRc(g, 1 + i, 5 - i, 16 - i * 2, 1, i < 2 ? 'n' : 'N'); wgRc(g, 0, 5, 18, 1, 'u');
    wgRc(g, 6, 9, 6, 6, 'x'); wgBlob(g, 9, 12, 2.4, 2, ['l', 'L', 'w', 'w']); wgRc(g, 8, 9, 2, 1, 'r'); wgPx(g, 9, 11, '0'); wgPx(g, 7, 12, 'O');
    wgRc(g, 3, 15, 2, 5, W4[0]); wgRc(g, 13, 15, 2, 5, W4[0]); wgLine(g, 11, 15, 16, 19, 'N');
  });
  // a slatted wooden bin; the heap inside is drawn by its fill
  one('compost', 16, 16, (g) => { // an open bin of gapped slats on four posts, dark soil inside
    wgRc(g, 2, 3, 12, 5, 'x'); wgRc(g, 3, 6, 10, 2, 'u'); wgRc(g, 2, 3, 12, 1, W4[2]);
    for (const y of [8, 11]) { wgRc(g, 2, y, 12, 2, 'e'); wgRc(g, 2, y, 12, 1, 'a'); } wgRc(g, 2, 10, 12, 1, 'u'); wgRc(g, 2, 13, 12, 1, 'u');
    for (const x of [1, 13]) { wgRc(g, x, 2, 2, 13, W4[1]); wgRc(g, x, 2, 1, 13, W4[2]); } wgRc(g, 3, 14, 10, 1, W4[0]); wgPx(g, 6, 7, 'g'); wgPx(g, 10, 6, 'G');
  });
  // a birdhouse on a post: a pointed roof, a round door, a perch
  one('birdhouse', 12, 24, (g) => {
    wgRc(g, 5, 12, 2, 12, W4[1]); wgRc(g, 5, 12, 1, 12, W4[2]);
    wgRc(g, 2, 5, 8, 8, 'a'); wgRc(g, 2, 5, 1, 8, 'A'); wgRc(g, 9, 5, 1, 8, 'e');
    for (let i = 0; i < 5; i++) wgRc(g, 1 + i, 5 - i, 10 - i * 2, 1, i < 1 ? 'n' : 'r'); wgRc(g, 0, 5, 12, 1, 'p');
    wgBlob(g, 6, 8.6, 1.6, 1.6, ['0', '0', 'x', 'x']); wgRc(g, 5, 11, 3, 1, W4[0]);
  });
};
const _wgIconFarm = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || !WG_FARM_ART.includes(id)) return _wgIconFarm(id);
  const [c, g] = wgCv(16, 16);
  if (id === 'fried_egg') { wgBlob(g, 8, 9, 6.4, 4.6, ['l', 'L', 'w', 'w']); wgBlob(g, 7, 8, 2.4, 2.2, ['o', 'y', 'Y', 'w']); wgPx(g, 3, 11, 'l'); }
  else if (id === 'omelette') { wgBlob(g, 8, 12, 6.8, 2.2, ['m', 'l', 'L', 'w']); wgBlob(g, 8, 9.4, 5.6, 3, ['O', 'y', 'Y', 'Y']); wgRc(g, 4, 10, 8, 1, 'O'); wgPx(g, 6, 8, 'n'); wgPx(g, 10, 9, 'r'); wgPx(g, 8, 7, 'G'); }
  else { // a stack of pancakes with berries and a drip of syrup
    for (const y of [12, 9.6, 7.2]) wgBlob(g, 8, y, 6, 1.8, ['n', 'N', 'O', 'Y']); wgRc(g, 4, 6, 3, 1, 'O'); wgRc(g, 11, 7, 1, 4, 'O');
    for (const [x, y] of [[6, 5], [9, 4.6], [8, 6]]) wgBlob(g, x, y, 1.4, 1.4, ['p', 'r', 'R', 'q']);
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
