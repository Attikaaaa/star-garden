'use strict';
// Wildgrove: a toy train. Set out, an oval of track round a patch of green felt with a tiny tree, and a red engine with
// two cars running round it, puffing steam now and then. USE stops it or sets it going again with a toot: whether it
// runs is the tile's meta (0 runs, 1 rests), so it goes over co-op with the tile. Drawn by a `wgDrawObj` wrapper over
// its base (`wgTrainCars`); the puffs are particles, none with them off. The ALL ABOARD star the first time it is
// set going.
const WG_TRAIN_V = 1.3, WG_TRAIN_GAP = 0.95; // radians a second round the oval; radians between cars
const WG_TRAIN_W = 22, WG_TRAIN_H = 14, WG_TRAIN_RX = 8.5, WG_TRAIN_RY = 4.6; // the base's size and the track's radii in it
const WG_TRAIN_CARS = [['r', 'R'], ['B', 'c'], ['y', 'Y']]; // the engine, then the cars: colour and highlight
const WGTR = { puff: new Map() }; // when each train last puffed, by tile
(function () {
  wgObj('toy_train', { name: 'TOY TRAIN', kind: 'deco', tool: 'hand', hp: 1, solid: 0, train: 1, drops: [DR('toy_train', 1, 1)] });
  wgItem('toy_train', 'TOY TRAIN', 'place', { place: 'toy_train' }); PLACE.toy_train = 'toy_train';
  wgRec('toy_train', 1, { wood: 3, iron: 1, petal_r: 1 }, 'bench');
  WG_ACH.push(['train', 'ALL ABOARD', 'SET A TOY TRAIN GOING AGAIN', (c) => (c.st.train | 0) > 0]);
})();
function wgTrainCars(tx, ty, T) { // where the engine and its cars are on the oval: [x, y in the base, colour pair], back ones first
  const run = !wgMetaAt(WGS.world, WGS.dim, tx, ty), a0 = (run ? T * WG_TRAIN_V : 0) + hash(tx, ty, 41) % 628 / 100;
  return WG_TRAIN_CARS.map((c, i) => { const a = a0 - i * WG_TRAIN_GAP; return [WG_TRAIN_W / 2 + Math.cos(a) * WG_TRAIN_RX, WG_TRAIN_H / 2 + Math.sin(a) * WG_TRAIN_RY, c]; }).sort((p, q) => p[1] - q[1]);
}
const _wgDrawObjTrain = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjTrain(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!o || !o.train || !WGS.world) return;
  const x0 = sx + 8 - (WG_TRAIN_W >> 1), y0 = sy + 16 - WG_TRAIN_H, T = WGS.t; // where the base stands, as wgReg anchors it
  for (const [x, y, c] of wgTrainCars(tx, ty, T)) {
    const X = Math.round(x0 + x) - 3, Y = Math.round(y0 + y) - 3;
    rect(X, Y, 6, 5, '0'); rect(X + 1, Y + 1, 4, 3, c[0]); rect(X + 1, Y + 1, 3, 1, c[1]); rect(X + 1, Y + 3, 4, 1, 'x'); // outlined, lit from the top left, wheels below
    if (c === WG_TRAIN_CARS[0]) { rect(X + 3, Y - 2, 2, 2, '0'); rect(X + 2, Y + 1, 1, 1, 'C'); } // the engine's funnel and window
  }
  if (wgMetaAt(WGS.world, WGS.dim, tx, ty) || !wgOpt().part) return;
  const key = tx + ',' + ty, last = WGTR.puff.get(key); if (last !== undefined && T - last < 0.9 && T >= last) return;
  WGTR.puff.set(key, T); if (WGTR.puff.size > 100) WGTR.puff.clear();
  const E = wgTrainCars(tx, ty, T).find(q => q[2] === WG_TRAIN_CARS[0]); wgPart(tx * 16 + 8 - (WG_TRAIN_W >> 1) + E[0] + 1, ty * 16 + 16 - WG_TRAIN_H + E[1] - 5, 1, { c: ['w', 'L'], s: 3, up: 10, g: -4, life: 0.8 });
};
const _wgUseTrain = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if (!o || !o.train) return _wgUseTrain(tx, ty);
  const rest = wgMetaAt(w, dim, tx, ty) ? 0 : 1; wgSetObj(w, dim, tx, ty, id, rest);
  if (rest) { wgToast('THE TRAIN RESTS'); wgSfx('select'); }
  else { wgToast('ALL ABOARD!'); wgSfx('toot'); const m = w.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.train = 1; }
  return true;
};
const _wgTipTrain = wgTipLines;
wgTipLines = function (s) { const L = _wgTipTrain(s); if (s.id === 'toy_train') L.push('USE STOPS OR STARTS IT'); return L; };
// ---------- art: the oval of track, its ties and rails round green felt with a tiny tree ----------
const _wgBuildTrain = wgBuildAll;
wgBuildAll = function () {
  _wgBuildTrain();
  const W = WG_TRAIN_W, H = WG_TRAIN_H, cx = W / 2, cy = H / 2;
  wgReg('toy_train', [wgMake('toy_train', W, H, (g) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x + 0.5 - cx) / (WG_TRAIN_RX + 2), (y + 0.5 - cy) / (WG_TRAIN_RY + 2)); if (d > 1) continue;
      const tie = Math.hypot((x + 0.5 - cx) / WG_TRAIN_RX, (y + 0.5 - cy) / WG_TRAIN_RY);
      wgPx(g, x, y, tie > 0.8 ? (Math.round(Math.atan2(y + 0.5 - cy, x + 0.5 - cx) * 7) & 1 ? 'u' : 'n') : x + y < cx + cy - 3 ? 'h' : 'G'); // ties all round, felt inside
    }
    for (let k = 0; k < 96; k++) { const a = k / 96 * Math.PI * 2; for (const e of [-1.2, 1.2]) wgPx(g, Math.floor(cx + Math.cos(a) * (WG_TRAIN_RX + e)), Math.floor(cy + Math.sin(a) * (WG_TRAIN_RY + e * 0.7)), Math.sin(a) < 0 ? 'L' : 'l'); } // two rails
    wgRc(g, cx - 1, cy, 1, 2, 'n'); wgRc(g, cx - 2, cy - 2, 3, 2, 'g'); wgPx(g, cx - 1, cy - 3, 'g'); wgPx(g, cx - 2, cy - 2, 'G'); // a tiny tree in the middle
    wgRc(g, cx + 2, cy - 1, 3, 2, 'r'); wgRc(g, cx + 2, cy - 2, 3, 1, 'n'); wgPx(g, cx + 3, cy, 'y'); // and a little station
  })]);
};
const _wgIconTrain = wgIcon;
wgIcon = function (id) { // a red engine side on: its cab, boiler, funnel and wheels
  const key = 'ic_' + id; if (id !== 'toy_train' || WGA.cache[key]) return _wgIconTrain(id);
  const [c, g] = wgCv(16, 16);
  wgRc(g, 2, 5, 5, 6, 'r'); wgRc(g, 3, 6, 3, 2, 'C'); wgRc(g, 7, 7, 7, 4, 'r'); wgRc(g, 7, 7, 7, 1, 'R'); wgRc(g, 2, 5, 5, 1, 'R'); wgRc(g, 1, 4, 7, 1, 'n');
  wgRc(g, 11, 4, 2, 3, 'x'); wgRc(g, 10, 3, 4, 1, 'x'); wgRc(g, 2, 11, 12, 1, 'p');
  for (const x of [4, 8, 12]) { wgRc(g, x - 1, 12, 3, 2, 'x'); wgPx(g, x, 12, 'X'); }
  wgOutline(c); WGA.cache[key] = c; return c;
};
