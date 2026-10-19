'use strict';
// Wildgrove: a fish tank. USE a fish on it to let it in (two at most, any of the six kinds, each in its own lane so
// the water never looks crowded); USE it with anything else to feed them: flakes drift down and the fish dart about.
// They swim to and fro, each at its own pace, a bubble rises by the weed, and a glowfish lights the tank at night. Who
// is inside is the tile's meta, an index into WG_TANK (every way to keep up to two fish, 28 of them), so it travels
// with the tile to every co-op screen. A broken tank lets its fish out. The FISH KEEPER star for a full tank.
const WG_TANK_N = 2, WG_TANK = [[]], WG_TANK_IX = new Map([['', 0]]);
(function () { // the fish inside, sorted, for every meta value
  const add = (a) => { WG_TANK_IX.set(a.join(), WG_TANK.length); WG_TANK.push(a); };
  for (let a = 0; a < 6; a++) add([a]);
  for (let a = 0; a < 6; a++) for (let b = a; b < 6; b++) add([a, b]);
  wgObj('fish_tank', { name: 'FISH TANK', kind: 'deco', tool: 'pick', hp: 3, tank: 1, drops: [DR('fish_tank', 1, 1)] });
  wgItem('fish_tank', 'FISH TANK', 'place', { place: 'fish_tank' }); PLACE.fish_tank = 'fish_tank'; wgRec('fish_tank', 1, { glass: 4, wood: 2, sand: 2 }, 'bench');
  WG_ACH.push(['tank', 'FISH KEEPER', 'FILL A FISH TANK', (c) => c.st.tank]);
})();
const WGTK = { fed: new Map(), spr: [] }; // when each tank was last fed (local), the little fish by kind and facing
const wgTankFish = (w, dim, tx, ty) => WG_TANK[wgMetaAt(w, dim, tx, ty)] || [];
const _wgUseTank = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if (!o || !o.tank) return _wgUseTank(tx, ty);
  const s = WGS.inv[WGS.sel], k = s ? WG_FISH.indexOf(s.id) : -1, now = wgTankFish(w, dim, tx, ty), cx = tx * 16 + 8, cy = ty * 16 + 4;
  if (k >= 0) { // a fish in hand goes in
    if (now.length >= WG_TANK_N) { wgToast('THE TANK IS FULL'); return true; }
    const next = now.concat(k).sort((a, b) => a - b);
    if (!wgInvTake(WGS.inv, s.id, 1)) return true;
    wgSetObj(w, dim, tx, ty, id, WG_TANK_IX.get(next.join())); wgSfx('bubble'); wgToast('A NEW FRIEND IN THE TANK');
    wgPart(cx, cy, 6, { c: ['c', 'C', 'w'], s: 18, up: 16, life: 0.5 });
    if (next.length >= WG_TANK_N) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.tank = 1; }
    return true;
  }
  if (!now.length) { wgToast('USE A FISH ON IT TO PUT IT IN'); return true; }
  WGTK.fed.set(dim + tx + ',' + ty, WGS.t); wgSfx('bubble'); // feeding time
  if (WGTK.fed.size > 32) WGTK.fed.delete(WGTK.fed.keys().next().value);
  return true;
};
// a broken tank lets its fish out
const _wgBreakTank = wgBreak;
wgBreak = function (tx, ty, byPlayer) {
  const w = WGS.world, o = w && OBJ[wgObjAt(w, WGS.dim, tx, ty)], fish = o && o.tank ? wgTankFish(w, WGS.dim, tx, ty) : [];
  const r = _wgBreakTank(tx, ty, byPlayer);
  for (const k of fish) wgDrop(tx * 16 + 8 + (Math.random() - 0.5) * 8, ty * 16 + 10, WG_FISH[k], 1);
  return r;
};
// ---------- drawing: the fish swim, a bubble rises, flakes fall ----------
const WG_TANK_COL = [['b', 'B', 'b'], ['p', 'P', 'p'], ['o', 'O', 'n'], ['C', 'w', 'B'], ['2', '3', '1'], ['o', 'y', 'O']]; // body, back, tail
function wgTankSpr(k, right) { // a 5x3 fish facing left (or right): a light back, an eye in front, a forked tail
  const i = k * 2 + (right ? 1 : 0); if (WGTK.spr[i]) return WGTK.spr[i];
  const [c, g] = wgCv(5, 3), [b, l, t] = WG_TANK_COL[k], X = (x) => right ? 4 - x : x;
  for (const [x, y, q] of [[1, 0, l], [2, 0, l], [4, 0, t], [0, 1, '0'], [1, 1, b], [2, 1, b], [3, 1, b], [1, 2, b], [2, 2, b], [4, 2, t]]) wgPx(g, X(x), y, q);
  if (k === 2) wgPx(g, X(2), 1, 'w'); else if (k === 4) wgPx(g, X(2), 1, 'Y'); else if (k === 5) wgPx(g, X(1), 0, 'Y'); // a stripe, a glowing spot, a gleam
  return (WGTK.spr[i] = c);
}
const _wgDrawObjTank = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjTank(id, tx, ty, sx, sy);
  if (!OBJ[id].tank) return;
  const w = WGS.world, dim = WGS.dim, t = WGS.t, fish = wgTankFish(w, dim, tx, ty), X = sx, Y = sy - 3; // the sprite's top left
  const fed = WGTK.fed.get(dim + tx + ',' + ty), ft = fed === undefined ? 99 : t - fed;
  const b = (t * 4 + hash(tx, ty, 41) % 9) % 9; // a bubble by the weed
  if (b < 7) { ctx.fillStyle = PAL.w; ctx.fillRect(X + 11 + (Math.floor(b / 2) % 2), Y + 10 - Math.floor(b), 1, 1); }
  if (ft < 2.5) { ctx.fillStyle = PAL.y; for (const [x, d] of [[4, 0], [7, 0.4], [10, 0.2]]) { const f = Math.floor((ft - d) * 3); if (f >= 0 && f < 5) ctx.fillRect(X + x, Y + 3 + f, 1, 1); } } // flakes sink and are eaten
  const te = t + Math.min(ft, 3.5) * 2; // fed fish dart about at three times their pace for a while
  fish.forEach((k, i) => {
    const h = hash(tx, ty, 50 + i), sp = 0.45 + (h % 100) / 400, a = te * sp + (h % 628) / 100;
    const u = Math.sin(a) * 0.8 + Math.sin(a * 2.3 + 1) * 0.2, v = Math.cos(a) * 0.8 + Math.cos(a * 2.3 + 1) * 0.46; // where, and which way
    const bob = Math.sin(t * 1.1 + i * 2) > 0.7 ? 1 : 0; // now and then a pixel down, never into the other's lane or the sand
    const fx = 2 + Math.round(7 * (0.5 + 0.5 * u)), fy = 4 + i * 3 + bob;
    ctx.drawImage(wgTankSpr(k, v > 0), X + fx, Y + fy);
  });
  if (fish.includes(4) && (dim !== 'o' || wgNight(WGS.clock) > 0.3)) WGR.lights.push({ x: sx + 8, y: sy + 4, r: 14, f: 0.3 });
};
const _wgTipTank = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipTank(s);
  if (s.id === 'fish_tank') L.push('USE A FISH ON IT TO PUT IT IN', 'USE IT TO FEED THE FISH');
  return L;
};
const _wgBuildTank = wgBuildAll;
wgBuildAll = function () { // a glass tank on a little wooden stand: water, sand, two weeds
  _wgBuildTank();
  wgReg('fish_tank', [wgMake('fish_tank', 16, 19, (g) => {
    wgRc(g, 1, 1, 14, 13, 'C'); wgRc(g, 1, 1, 14, 1, 'T'); wgRc(g, 2, 1, 4, 1, 'C'); wgRc(g, 1, 13, 14, 1, 't'); wgRc(g, 14, 2, 1, 11, 'B'); // the glass, its rims
    wgRc(g, 2, 3, 12, 8, 'c'); wgRc(g, 2, 3, 12, 1, 'C'); wgPx(g, 5, 3, 'w'); wgPx(g, 10, 3, 'w'); wgRc(g, 2, 4, 1, 3, 'C'); // the water, its surface, a shine
    wgRc(g, 2, 11, 12, 2, 'a'); wgRc(g, 2, 12, 12, 1, 'e'); for (const x of [4, 8, 11]) wgPx(g, x, 11, 'A'); wgPx(g, 6, 12, 'N'); // sand
    for (const [x, y] of [[3, 10], [4, 9], [3, 8], [4, 7], [3, 6]]) wgPx(g, x, y, y > 7 ? 'g' : 'G'); wgPx(g, 5, 8, 'G'); // the weeds
    for (const [x, y] of [[12, 10], [13, 9], [12, 8]]) wgPx(g, x, y, y > 9 ? 'g' : 'h');
    wgRc(g, 1, 14, 14, 4, 'n'); wgRc(g, 1, 14, 14, 1, 'N'); wgRc(g, 14, 15, 1, 3, 'u'); wgRc(g, 7, 15, 1, 2, 'u'); wgPx(g, 5, 16, 'O'); wgPx(g, 9, 16, 'O'); // the stand, two knobs
  })]);
};
