'use strict';
// Wildgrove: petals and leaves on the breeze. In spring a blossoming tree (an apple tree in white, a cherry in pink) now
// and then lets a petal go; in autumn a turning tree lets go a leaf in its own autumn colours. Each one drifts down from
// the crown, swaying and fluttering, settles at the tree's foot and fades. Ambient life, each screen its own: outdoors
// only, a dozen at most, a new one every second or so, none with the ambient life switched off.
const WG_DRIFT_MAX = 12, WG_DRIFT_BLOOM = { tree_apple: ['w', 'L', 'q'], tree_cherry: ['q', 'P', 'w'] };
const WGDR = { list: [], src: [], scanT: 0, spawnT: 0, w: null };
function wgDriftCols(id, tx, ty, se) { // what a tree lets go this season: its blossom's or its autumn crown's colours, or null
  if (se === 0) return WG_DRIFT_BLOOM[id] || null;
  const T = WG_SEASON_TREES[id], aut = se === 2 && T && T[1], base = WGSE.base[id]; if (!aut || !base) return null;
  const r = aut[Math.floor((hash(tx, ty, 3) % (aut.length * base.length)) / base.length)]; // the palette wgDrawObj picks for this tree
  return [r[1], r[2], r[3]];
}
const _wgUpdDrift = updateWG;
updateWG = function (dt) {
  _wgUpdDrift(dt);
  const w = WGS.world, L = WGDR.list;
  if (!w || WGDR.w !== w || WGS.dim !== 'o' || !wgOpt().amb) { L.length = 0; WGDR.src.length = 0; WGDR.w = w; WGDR.scanT = 0; return; }
  for (let i = L.length - 1; i >= 0; i--) { // falling, then lying a while
    const q = L[i];
    if (q.y < q.gy) { q.y = Math.min(q.gy, q.y + q.vy * dt); q.x0 += q.wx * dt; } else if ((q.rest += dt) > 1.8) L.splice(i, 1);
  }
  if ((WGDR.scanT -= dt) <= 0) { // which trees in view let something go
    WGDR.scanT = 0.8; WGDR.src.length = 0;
    const se = wgSeason(), cam = WGS.cam; if (se !== 0 && se !== 2) return;
    const x0 = Math.floor((cam.x - VW / 2 - 24) / 16), x1 = Math.floor((cam.x + VW / 2 + 24) / 16), y0 = Math.floor((cam.y - VH / 2) / 16), y1 = Math.floor((cam.y + VH / 2 + 40) / 16);
    for (let y = y0; y <= y1 && WGDR.src.length < 40; y++) for (let x = x0; x <= x1; x++) {
      const id = wgObjAt(w, 'o', x, y), o = id && OBJ[id]; if (!o || o.kind !== 'tree') continue;
      const cols = wgDriftCols(o.id, x, y, se); if (cols) WGDR.src.push({ x, y, id: o.id, cols, leaf: se === 2 });
    }
  }
  if (!WGDR.src.length || L.length >= WG_DRIFT_MAX || (WGDR.spawnT -= dt) > 0) return;
  WGDR.spawnT = 0.6 + Math.random() * 0.9;
  const s = WGDR.src[Math.floor(Math.random() * WGDR.src.length)], A = WGA.obj[s.id], sp = A && A[hash(s.x, s.y, 3) % A.length]; if (!sp) return;
  const wind = (WGS.weather && WGS.weather.wind) || 0, cw = Math.min(20, sp.c.width - 6);
  L.push({ x0: s.x * 16 + 8 + (Math.random() - 0.5) * cw, y: s.y * 16 + sp.oy + 4 + Math.random() * sp.c.height * 0.4, gy: s.y * 16 + 13 + Math.random() * 7,
    vy: 6 + Math.random() * 4, wx: (Math.random() - 0.5) * 3 + wind * 6, ph: Math.random() * 6.28, c: s.cols[Math.floor(Math.random() * s.cols.length)], leaf: s.leaf, rest: 0 });
};
const _wgAmbDrift = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbDrift(cx0, cy0);
  const L = WGDR.list; if (!L.length || WGS.dim !== 'o') return;
  const t = WGS.t;
  for (const q of L) {
    const down = q.rest > 0, x = Math.round(q.x0 + (down ? 0 : Math.sin(t * 1.6 + q.ph) * 2.5) - cx0), y = Math.round(q.y - cy0), f = Math.floor(t * 4 + q.ph) % 2;
    ctx.globalAlpha = down ? (q.rest < 0.6 ? 1 : q.rest < 1.2 ? 0.6 : 0.3) : 1; // fading in three steps once down
    ctx.fillStyle = PAL[q.c];
    if (down) ctx.fillRect(x, y, 2, 1); else if (q.leaf) ctx.fillRect(x, y, f ? 2 : 1, f ? 1 : 2); else ctx.fillRect(x, y, f + 1, 1); // a leaf tumbles, a petal flutters
  }
  ctx.globalAlpha = 1;
};
