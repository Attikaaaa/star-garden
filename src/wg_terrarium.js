'use strict';
// Wildgrove: a terrarium. A glass jar made at the furnace with a little moss garden inside: a brown mushroom, a fern
// frond and a glow berry that lights it faintly by night (its `light`), a dewdrop now and then running down the glass
// (`wgTerraDrop`, drawn by a `wgDrawObj` wrapper). A deco to set out on a table or a shelf.
(function () {
  wgObj('terrarium', { name: 'TERRARIUM', kind: 'deco', tool: 'hand', hp: 1, light: 26, terra: 1, drops: [DR('terrarium', 1, 1)] });
  wgItem('terrarium', 'TERRARIUM', 'place', { place: 'terrarium' }); PLACE.terrarium = 'terrarium';
  wgRec('terrarium', 1, { glass: 2, mush_b: 1, glow_berry: 1 }, 'furnace');
})();
const wgTerraDrop = (tx, ty, T) => { const u = (T / 7 + hash(tx, ty, 59) % 100 / 100) % 1; return u < 0.25 ? u / 0.25 : -1; }; // a dewdrop's way down the glass, or -1
const _wgDrawObjTerra = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjTerra(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!o || !o.terra) return;
  const u = wgTerraDrop(tx, ty, WGS.t); if (u < 0) return;
  ctx.globalAlpha = 0.85; rect(sx + 11, sy + 4 + Math.round(u * 7), 1, 1, 'w'); ctx.globalAlpha = 1; // down the glass on the shaded side
};
const _wgTipTerra = wgTipLines;
wgTipLines = function (s) { const L = _wgTipTerra(s); if (s.id === 'terrarium') L.push('A LITTLE GARDEN IN A JAR'); return L; };
const _wgBuildTerra = wgBuildAll;
wgBuildAll = function () {
  _wgBuildTerra();
  wgReg('terrarium', [wgMake('terrarium', 14, 15, (g) => { // a round jar on a wooden base, a cork on top, the garden inside
    wgRc(g, 5, 1, 4, 2, 'N'); wgRc(g, 5, 1, 4, 1, 'A');
    g.globalAlpha = 0.35; wgBlob(g, 7, 8, 5.6, 5, ['c', 'C', 'C', 'w']); g.globalAlpha = 1; // the glass
    wgBlob(g, 7, 11.5, 5, 1.8, ['g', 'G', 'G', 'h']); // moss
    wgRc(g, 4, 8, 1, 3, 'L'); wgBlob(g, 4.5, 7.5, 2, 1.2, ['n', 'N', 'N', 'A']); // the mushroom
    wgLine(g, 8, 11, 10, 6, 'G'); wgPx(g, 9, 7, 'h'); wgPx(g, 10, 8, 'h'); wgPx(g, 8, 8, 'G'); // a fern frond
    wgPx(g, 6, 10, 'c'); wgPx(g, 6, 9, 'C'); // the glow berry
    for (const [x, y] of [[3, 4], [2, 5], [2, 6]]) wgPx(g, x, y, 'w'); // the glint on the glass
    wgRc(g, 2, 13, 10, 2, 'n'); wgRc(g, 2, 13, 10, 1, 'N');
  })]);
};
const _wgIconTerra = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'terrarium' || WGA.cache[key]) return _wgIconTerra(id);
  const [c, g] = wgCv(16, 16), a = WGA.cache.terrarium; if (a) g.drawImage(a, 1, 0); WGA.cache[key] = c; return c;
};
