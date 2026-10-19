'use strict';
// Wildgrove: owls. On dry nights one tree in `WG_OWL_ONE` (from the tile and the seed, so the same tree on every
// screen; never a palm or a cactus) has an owl on its crown, drawn by a `wgDrawObj` wrapper after the tree: it looks
// ahead, left and right in turn and blinks, and its eyes shine over the dark (a `wgDrawLight` wrapper redraws them
// from `WGOW.list`, the owls drawn this frame). Now and then the nearest within `WG_OWL_HEAR` px hoots (the `hoot`
// sound, its throat puffing), which lights NIGHT OWL. Ambient life, each screen its own, off with the ambient life.
const WG_OWL_ONE = 18, WG_OWL_HEAR = 150, WG_OWL_NO = ['palm', 'cactus', 'bigmush'];
const WGOW = { list: [], near: null, nearD: 1e9, next: 0, hootT: -9, hootK: '' };
const wgOwlNight = () => WGS.dim === 'o' && wgOpt().amb && wgNight(WGS.clock) > 0.5 && !(WGS.weather && WGS.weather.kind === 'rain');
const wgOwlTree = (tx, ty) => hash(tx, ty, ((WGS.world && WGS.world.seed) | 0) * 13 + 919) % WG_OWL_ONE === 0;
const _wgDrawObjOwl = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjOwl(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!o || o.kind !== 'tree' || WG_OWL_NO.includes(o.id) || !wgOwlTree(tx, ty) || !wgOwlNight()) return;
  const L = WGA.obj[o.id], sp = L && L[hash(tx, ty, 3) % L.length]; if (!sp) return;
  const T = WGS.t, h = hash(tx, ty, 77), k = tx + ',' + ty, x = sx + 8, y = sy + sp.oy + 6; // standing in the crown's top
  const blink = (T + (h % 40) / 10) % 4.1 < 0.15, look = hash(tx, ty, Math.floor((T + (h % 25) / 10) / 2.6)) % 5;
  const f = blink ? 'blink' : look === 1 ? 'left' : look === 2 ? 'right' : 'ahead';
  ctx.drawImage(wgOwlArt(f), x - 6, y - 13);
  if (WGOW.hootK === k && T - WGOW.hootT < 0.9) { rect(x - 1, y - 5, 3, 1, 'O'); const u = (T - WGOW.hootT) / 0.9; rect(x + 3 + Math.round(u * 4), y - 9 - Math.round(u * 8), 1, 1, 'L'); } // a puffed throat, a breath of a hoot
  const p = WGS.p, d = p ? Math.hypot(p.x - (tx * 16 + 8), p.y - (ty * 16 + 8)) : 1e9;
  if (d < WGOW.nearD) { WGOW.nearD = d; WGOW.near = k; }
  if (!blink) WGOW.list.push(x, y, f === 'left' ? -1 : f === 'right' ? 1 : 0);
};
const _wgLightOwl = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  _wgLightOwl(cx0, cy0);
  const L = WGOW.list;
  for (let i = 0; i < L.length; i += 3) { // the eyes, shining over the dark
    const x = L[i], y = L[i + 1], s = L[i + 2]; // the eyes' row and their pupils, as the frame drew them
    rect(x - 4, y - 8, 3, 1, 'Y'); rect(x + 2, y - 8, 3, 1, 'Y'); rect(x - 3 + s, y - 8, 1, 1, '0'); rect(x + 3 + s, y - 8, 1, 1, '0');
  }
  L.length = 0;
};
const _wgUpdOwl = updateWG;
updateWG = function (dt) {
  _wgUpdOwl(dt);
  const w = WGS.world, T = WGS.t;
  if (!w || WGS.scr !== 'play' || !wgOwlNight()) { WGOW.nearD = 1e9; WGOW.near = null; return; }
  if (WGOW.near && WGOW.nearD < WG_OWL_HEAR && T > WGOW.next) {
    if (WGOW.next) { WGOW.hootT = T; WGOW.hootK = WGOW.near; wgSfx('hoot'); const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.owl = 1; }
    WGOW.next = T + 9 + Math.random() * 12; // the first hears none: a while after coming near
  }
  WGOW.nearD = 1e9; WGOW.near = null; // found again as the owls are drawn
};
(function () { WG_ACH.push(['owl', 'NIGHT OWL', 'HEAR AN OWL HOOT IN THE NIGHT', (c) => c.st.owl]); })();
const WG_OWL_ART = { // seen from the front: tufts, a pale face with two big eyes, a little beak, a speckled breast, toes
  ahead: ['.n.......n.', '.nN.....Nn.', 'nNNNNNNNNNn', 'NOOONNNOOON', 'OY0YONOY0YO', 'NOOOOoOOOON', 'nNNNNoNNNNn', 'nNANANANANn', 'nNNANANANNn', '.nNNANANNn.', '..nNNNNNn..', '...o...o...'],
  left: ['.n.......n.', '.nN.....Nn.', 'nNNNNNNNNNn', 'NOOONNNOOON', 'O0YYONO0YYO', 'NOOOOoOOOON', 'nNNNNoNNNNn', 'nNANANANANn', 'nNNANANANNn', '.nNNANANNn.', '..nNNNNNn..', '...o...o...'],
  right: ['.n.......n.', '.nN.....Nn.', 'nNNNNNNNNNn', 'NOOONNNOOON', 'OYY0ONOYY0O', 'NOOOOoOOOON', 'nNNNNoNNNNn', 'nNANANANANn', 'nNNANANANNn', '.nNNANANNn.', '..nNNNNNn..', '...o...o...'],
  blink: ['.n.......n.', '.nN.....Nn.', 'nNNNNNNNNNn', 'NOOONNNOOON', 'OnnnONOnnnO', 'NOOOOoOOOON', 'nNNNNoNNNNn', 'nNANANANANn', 'nNNANANANNn', '.nNNANANNn.', '..nNNNNNn..', '...o...o...'],
};
function wgOwlArt(k) {
  const key = 'owl_' + k; if (WGA.cache[key]) return WGA.cache[key];
  const map = { n: 'n', N: 'N', O: 'O', A: 'A', Y: 'Y', 0: '0', o: 'o' };
  return wgMake(key, 13, 14, (g) => wgPaint(g, 1, 1, WG_OWL_ART[k], map));
}
