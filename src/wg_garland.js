'use strict';
// Wildgrove: string lights. A light post strings itself to the nearest post to its right (up to WG_GARLAND_SPAN tiles
// away, a row up or down at most) with a sagging wire of little coloured bulbs, which glow softly at night. Each post
// draws only the string to its right, so a row of posts makes one chain; it all comes from the tiles, the same on every
// screen. The GLOWING GARDEN star for the first string.
const WG_GARLAND_SPAN = 6, WG_GARLAND_COLS = ['y', 'r', 'B', 'G', 'P'];
(function () {
  wgObj('light_post', { name: 'LIGHT POST', kind: 'deco', tool: 'axe', hp: 2, garland: 1, drops: [DR('light_post', 1, 1)] });
  wgItem('light_post', 'LIGHT POST', 'place', { place: 'light_post' }); PLACE.light_post = 'light_post'; wgRec('light_post', 2, { stick: 3, glass: 1, copper: 1 }, 'bench');
  WG_ACH.push(['garland', 'GLOWING GARDEN', 'STRING LIGHTS BETWEEN TWO POSTS', (c) => c.st.garland]);
})();
function wgGarlandTo(w, dim, tx, ty) { // the post this one strings to, or null
  for (let dx = 1; dx <= WG_GARLAND_SPAN; dx++) for (const dy of [0, -1, 1]) {
    const id = wgObjAt(w, dim, tx + dx, ty + dy); if (id && OBJ[id].garland) return [tx + dx, ty + dy];
  }
  return null;
}
const _wgDrawObjGarland = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjGarland(id, tx, ty, sx, sy);
  if (!OBJ[id].garland) return;
  const w = WGS.world, to = wgGarlandTo(w, WGS.dim, tx, ty); if (!to) return;
  const x1 = sx + 8, y1 = sy - 4, x2 = x1 + (to[0] - tx) * 16, y2 = y1 + (to[1] - ty) * 16, span = x2 - x1, sag = 3 + span / 16; // from hook to hook
  const lit = WGS.dim !== 'o' || wgNight(WGS.clock) > 0.3;
  for (let x = x1 + 1, i = 0; x < x2; x++, i++) {
    const f = (x - x1) / span, y = Math.round(y1 + (y2 - y1) * f + sag * 4 * f * (1 - f));
    ctx.fillStyle = PAL.x; ctx.fillRect(x, y, 1, 1);
    if (i % 4 === 2) { const k = WG_GARLAND_COLS[(i >> 2) % WG_GARLAND_COLS.length]; ctx.fillStyle = PAL[k]; ctx.fillRect(x, y + 1, 1, 2); if (lit) { ctx.fillStyle = PAL.w; ctx.fillRect(x, y + 1, 1, 1); } } // a bulb hangs from the wire
  }
  if (lit) for (const f of [0.3, 0.7]) WGR.lights.push({ x: Math.round(x1 + span * f), y: Math.round(y1 + (y2 - y1) * f + sag * 0.9) + 2, r: 14, f: 0.3 });
};
// the first string strung
const _wgSetObjGarland = wgSetObj;
wgSetObj = function (w, dim, x, y, id, meta) {
  const r = _wgSetObjGarland(w, dim, x, y, id, meta);
  if (id && OBJ[id].garland && w === WGS.world && !WGN.applying && w.meta && !(w.meta.stats && w.meta.stats.garland)) {
    let on = !!wgGarlandTo(w, dim, x, y); for (let dx = 1; !on && dx <= WG_GARLAND_SPAN; dx++) for (const dy of [0, -1, 1]) { const q = wgObjAt(w, dim, x - dx, y + dy); if (q && OBJ[q].garland) { on = true; break; } }
    if (on) (w.meta.stats || (w.meta.stats = { kills: 0, far: 0 })).garland = 1;
  }
  return r;
};
const _wgTipGarland = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipGarland(s);
  if (s.id === 'light_post') L.push('PLACE TWO IN A ROW TO STRING LIGHTS', 'UP TO 6 TILES APART');
  return L;
};
const _wgBuildGarland = wgBuildAll;
wgBuildAll = function () { // a slim wooden post with a little brass hook on top and a foot
  _wgBuildGarland();
  wgReg('light_post', [wgMake('light_post', 16, 24, (g) => {
    wgRc(g, 7, 4, 2, 17, 'n'); wgRc(g, 7, 4, 1, 17, 'N'); // the post
    wgRc(g, 6, 3, 4, 1, 'u'); wgPx(g, 6, 3, 'n'); wgPx(g, 8, 2, 'O'); wgPx(g, 9, 2, 'o'); // its cap and hook
    wgRc(g, 5, 21, 6, 2, 'n'); wgRc(g, 5, 21, 6, 1, 'N'); wgPx(g, 10, 22, 'u'); // the foot
  })]);
};
