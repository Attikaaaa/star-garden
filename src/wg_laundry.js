'use strict';
// Wildgrove: a clothesline. A laundry post strings a rope to the nearest laundry post to its right (up to WG_LAUNDRY_SPAN
// tiles away, a row up or down at most), as the string lights do, and washing hangs from it on pegs: shirts, socks and
// striped towels in many colours, which and where all from the tiles, so every screen shows the same line. They stir in
// the breeze, more so in a storm, and drip in the rain. The LAUNDRY DAY star for the first line.
const WG_LAUNDRY_SPAN = 6;
const WG_LAUNDRY_RAMPS = [['p', 'r', 'R'], ['b', 'B', 'c'], ['o', 'y', 'Y'], ['g', 'G', 'h'], ['l', 'L', 'w'], ['1', '2', '3']]; // dark, mid, light
const WG_LAUNDRY_ART = [ // a shirt, a sock, a towel: L light, M mid, D dark, w white
  ['MML.LMM', 'LMMMMMM', '.LMMMD.', '.LMMMD.', '.MMMMD.', '.DDDDD.'],
  ['LM.', 'LM.', 'LM.', 'LMM', 'MMD', 'DD.'],
  ['LMMMM', 'wwwww', 'LMMMM', 'LMMMD', 'LMMMD', 'wwwww', 'DDDDD'],
];
(function () {
  wgObj('laundry_post', { name: 'LAUNDRY POST', kind: 'deco', tool: 'axe', hp: 2, laundry: 1, drops: [DR('laundry_post', 1, 1)] });
  wgItem('laundry_post', 'LAUNDRY POST', 'place', { place: 'laundry_post' }); PLACE.laundry_post = 'laundry_post'; wgRec('laundry_post', 2, { wood: 2, string: 2, wool: 1 }, 'bench');
  WG_ACH.push(['laundry', 'LAUNDRY DAY', 'HANG A CLOTHESLINE BETWEEN TWO POSTS', (c) => c.st.laundry]);
})();
function wgLaundryTo(w, dim, tx, ty) { // the post this one strings its rope to, or null
  for (let dx = 1; dx <= WG_LAUNDRY_SPAN; dx++) for (const dy of [0, -1, 1]) {
    const id = wgObjAt(w, dim, tx + dx, ty + dy); if (id && OBJ[id].laundry) return [tx + dx, ty + dy];
  }
  return null;
}
function wgLaundryArt(k, c) { // one piece of washing in one colour
  const key = 'laund_' + k + '_' + c; if (WGA.cache[key]) return WGA.cache[key];
  const A = WG_LAUNDRY_ART[k], R = WG_LAUNDRY_RAMPS[c];
  return wgMake(key, A[0].length + 2, A.length + 2, (g) => wgPaint(g, 1, 1, A, { D: R[0], M: R[1], L: R[2], w: 'w' }));
}
const _wgDrawObjLaundry = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjLaundry(id, tx, ty, sx, sy);
  if (!OBJ[id].laundry) return;
  const w = WGS.world, to = wgLaundryTo(w, WGS.dim, tx, ty); if (!to) return;
  const x1 = sx + 11, y1 = sy - 5, x2 = sx + 4 + (to[0] - tx) * 16, y2 = y1 + (to[1] - ty) * 16, span = x2 - x1, sag = 2 + span / 20; // from this post's right hook to the next one's left
  const ropeY = (x) => { const f = (x - x1) / span; return Math.round(y1 + (y2 - y1) * f + sag * 4 * f * (1 - f)); };
  ctx.fillStyle = PAL.a; for (let x = x1 + 1; x < x2; x++) ctx.fillRect(x, ropeY(x), 1, 1);
  const wx = WGS.weather, wet = wx && wx.kind === 'rain' && WGS.dim === 'o', gust = wx && wx.storm ? 2.6 : wx ? 1.6 : 1;
  for (let x = x1 + 5, i = 0; x < x2 - 6; x += 8, i++) {
    const h = hash(tx * 31 + i, ty, 23); if (h % 5 === 0) continue; // a gap now and then
    const k = (h >>> 3) % WG_LAUNDRY_ART.length, art = wgLaundryArt(k, (h >>> 7) % WG_LAUNDRY_RAMPS.length), y = ropeY(x);
    const s = Math.sin(WGS.t * 1.7 * gust + i * 1.3 + (h & 7)), dx = s > 0.6 ? 1 : s < -0.6 ? -1 : 0; // stirring in the breeze
    ctx.drawImage(art, x - (art.width >> 1) + dx, y - 1);
    rect(x - 1, y - 1, 1, 2, 'u'); if (art.width > 6) rect(x + 1 + (art.width > 8 ? 1 : 0), y - 1, 1, 2, 'u'); // the pegs
    if (wet) { const q = (WGS.t * 1.6 + (h & 15) / 16) % 1; ctx.globalAlpha = 1 - q; rect(x + dx, y + art.height - 1 + Math.round(q * 9), 1, 1, 'c'); ctx.globalAlpha = 1; } // a drip
  }
};
// the first line strung
const _wgSetObjLaundry = wgSetObj;
wgSetObj = function (w, dim, x, y, id, meta) {
  const r = _wgSetObjLaundry(w, dim, x, y, id, meta);
  if (id && OBJ[id].laundry && w === WGS.world && !WGN.applying && w.meta && !(w.meta.stats && w.meta.stats.laundry)) {
    let on = !!wgLaundryTo(w, dim, x, y); for (let dx = 1; !on && dx <= WG_LAUNDRY_SPAN; dx++) for (const dy of [0, -1, 1]) { const q = wgObjAt(w, dim, x - dx, y + dy); if (q && OBJ[q].laundry) { on = true; break; } }
    if (on) (w.meta.stats || (w.meta.stats = { kills: 0, far: 0 })).laundry = 1;
  }
  return r;
};
const _wgTipLaundry = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipLaundry(s);
  if (s.id === 'laundry_post') L.push('PLACE TWO IN A ROW TO HANG WASHING', 'UP TO ' + WG_LAUNDRY_SPAN + ' TILES APART');
  return L;
};
const _wgBuildLaundry = wgBuildAll;
wgBuildAll = function () { // a wooden T-post, a hook under each end of its arm
  _wgBuildLaundry();
  wgReg('laundry_post', [wgMake('laundry_post', 12, 26, (g) => {
    wgRc(g, 5, 2, 2, 22, 'n'); wgRc(g, 5, 2, 1, 22, 'N'); wgRc(g, 1, 2, 10, 2, 'n'); wgRc(g, 1, 2, 10, 1, 'N'); wgPx(g, 1, 3, 'u');
    wgRc(g, 4, 23, 4, 1, 'u'); for (const x of [2, 9]) { wgPx(g, x, 4, 'm'); wgPx(g, x, 5, 'l'); } // a hook under each end of the arm
  })]);
};
