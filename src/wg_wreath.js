'use strict';
// Wildgrove: pinecones and a wreath. In autumn the pines let pinecones fall beside them, a new few each day: a
// `wgFallAt` wrapper adds them to wg_windfall's windfalls (`WG_CONE_FALL` in a hundred), so they are drawn, walked onto
// and gathered as the fruit and acorns are; a felled pine may drop one too. Two make a wreath on a little easel whose
// look follows the season (`wgWreathArt`: blossoms in spring, daisies in summer, leaves and cones in autumn, holly
// and a red bow in winter), drawn by a `wgDrawObj` wrapper; a wreath seen in every season lights WREATH FOR ALL SEASONS
// (`stats.wreath`, a bit for each season).
const WG_CONE_FALL = 6, WG_CONE_ON = ['grass', 'dirt', 'moss', 'snow'], WG_CONE_TREES = ['pine', 'snowpine'];
(function () {
  wgItem('pinecone', 'PINECONE', 'res', {});
  for (const t of WG_CONE_TREES) OBJ[O_ID[t]].drops.push(DR('pinecone', 1, 1, 0.2));
  wgObj('wreath', { name: 'WREATH', kind: 'deco', tool: 'axe', hp: 2, solid: 0, wreath: 1, drops: [DR('wreath', 1, 1)] });
  wgItem('wreath', 'WREATH', 'place', { place: 'wreath' }); PLACE.wreath = 'wreath'; wgRec('wreath', 1, { pinecone: 2, fiber: 4, stick: 1 }, 'bench');
  WG_ACH.push(['wreath', 'WREATH FOR ALL SEASONS', 'SEE A WREATH IN EVERY SEASON', (c) => ((c.st.wreath | 0) & 15) === 15]);
})();
const _wgFallAtCone = wgFallAt;
wgFallAt = function (tx, ty) { // the windfalls, and in autumn pinecones beside the pines
  const F = _wgFallAtCone(tx, ty), w = WGS.world; if (F || !w || wgSeason() !== 2) return F;
  const h = hash(tx, ty, (w.seed | 0) * 41 + (WGS.day | 0) * 157 + 3391) >>> 0;
  if (h % 100 >= WG_CONE_FALL || wgObjAt(w, 'o', tx, ty) || !WG_CONE_ON.includes(GROUND[wgGround(w, 'o', tx, ty)].id)) return null;
  for (const [i, j] of WG_FALL_TREE) { const id = wgObjAt(w, 'o', tx + i, ty + j); if (id && WG_CONE_TREES.includes(OBJ[id].id)) return { id: 'pinecone', dx: ((h >>> 8) % 7) - 3, dy: ((h >>> 11) % 3) - 1 }; }
  return null;
};
const _wgDrawObjWreath = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.wreath) return _wgDrawObjWreath(id, tx, ty, sx, sy);
  const s = wgSeason(), A = wgWreathArt(s); shadow(sx + 8, sy + 14, 8); ctx.drawImage(A, sx + 8 - (A.width >> 1), sy + 16 - A.height);
  const st = WGS.world && WGS.world.meta.stats; if (st && !((st.wreath | 0) & (1 << s))) st.wreath = (st.wreath | 0) | (1 << s);
};
const WG_WREATH = [ // the ring's ramp, the trimmings and the bow, each season
  { ring: ['g', 'G', 'h'], dots: [['q', 'P'], ['w', 'q']], bow: 'q' },
  { ring: ['g', 'G', 'h'], dots: [['y', 'Y'], ['w', 'y']], bow: 'B' },
  { ring: ['n', 'o', 'O'], dots: [['r', 'R'], ['u', 'N']], bow: 'o' },
  { ring: ['z', 'g', 'G'], dots: [['r', 'R'], ['r', 'R']], bow: 'r' },
];
function wgWreathArt(s) { // a round wreath hung on a little easel, lit from the top left, a bow at the top
  const key = 'wreath_' + s; if (WGA.cache[key]) return WGA.cache[key];
  const W = WG_WREATH[s];
  return wgMake(key, 16, 22, (g) => {
    for (let y = 2; y < 21; y++) { wgPx(g, Math.round(7 - (y - 2) * 0.28), y, 'N'); wgPx(g, Math.round(8 + (y - 2) * 0.28), y, 'n'); } // the easel's legs
    wgPx(g, 2, 20, 'u'); wgPx(g, 13, 20, 'u'); wgRc(g, 7, 1, 2, 1, 'n'); // their feet, the peg at the top
    for (let y = 3; y < 17; y++) for (let x = 1; x < 15; x++) {
      const dx = x - 7.5, dy = y - 9.5, d = Math.hypot(dx, dy); if (d < 3.4 || d > 6.4) continue;
      wgPx(g, x, y, W.ring[dx + dy < -3 ? 2 : dx + dy > 3 ? 0 : 1]);
    }
    for (let k = 0; k < 7; k++) { // trimmings round the ring, two kinds in turn
      const a = -0.6 + k * 0.82, x = Math.round(7.5 + Math.cos(a) * 4.9), y = Math.round(9.5 + Math.sin(a) * 4.9), c = W.dots[k % 2];
      wgPx(g, x, y, c[0]); wgPx(g, x - 1, y, c[0]); wgPx(g, x, y - 1, c[1]);
    }
    wgRc(g, 7, 3, 2, 2, W.bow); wgPx(g, 5, 2, W.bow); wgPx(g, 6, 3, W.bow); wgPx(g, 10, 2, W.bow); wgPx(g, 9, 3, W.bow); wgPx(g, 6, 5, W.bow); wgPx(g, 9, 5, W.bow); wgPx(g, 5, 6, W.bow); wgPx(g, 10, 6, W.bow); // the bow it hangs by
  });
}
const _wgTipWreath = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipWreath(s);
  if (s.id === 'pinecone') L.push('FALLS FROM THE PINES IN AUTUMN'); else if (s.id === 'wreath') L.push('IT CHANGES WITH THE SEASONS');
  return L;
};
const _wgBuildWreath = wgBuildAll;
wgBuildAll = function () {
  _wgBuildWreath(); wgReg('wreath', [wgWreathArt(0)]);
  wgMake('fall_pinecone', 7, 7, (g) => ['.NnN.', 'NnNnu', '.nNn.', '.NnN.', '..n..'].forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] !== '.') wgPx(g, x + 1, y + 1, r[x]); }));
};
const _wgIconWreath = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || (id !== 'pinecone' && id !== 'wreath')) return _wgIconWreath(id);
  if (id === 'wreath') { const A = wgWreathArt(3), [c, g] = wgCv(16, 16); g.drawImage(A, 0, 2, 16, 16, 0, 0, 16, 16); WGA.cache[key] = c; return c; } // the winter wreath, its easel's top
  const c = wgMake(key, 16, 16, (g) => { // a pinecone: scales in rows, narrowing to the tip, a bit of stalk
    wgPx(g, 8, 1, 'u'); wgPx(g, 8, 2, 'n');
    for (let y = 3; y < 14; y++) { const hw = y < 8 ? Math.min(4, y - 2) : Math.max(1, 12 - y); for (let x = 8 - hw; x < 8 + hw; x++) wgPx(g, x, y, (x + y) % 3 === 0 ? 'N' : (x + y) % 3 === 1 ? 'n' : 'u'); }
    wgPx(g, 6, 4, 'O'); wgPx(g, 5, 6, 'O'); wgPx(g, 7, 7, 'O');
  });
  WGA.cache[key] = c; return c;
};
