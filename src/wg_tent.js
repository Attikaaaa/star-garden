'use strict';
// Wildgrove: a camping tent. It is a bed (`kind: 'bed'`), so USE sets the spawn point there and sleeps the night away,
// out wherever the road leads; its canvas is one of `WG_TENT_COLS`, picked by the tile's hash, so friends see the same
// tent. Sleeping in one outdoors at night lights CAMPER.
const WG_TENT_COLS = [['R', 'r', 'p'], ['c', 'B', 'b'], ['h', 'G', 'g']]; // the canvas: light, colour, shade
(function () {
  wgObj('tent', { name: 'TENT', kind: 'bed', tool: 'axe', hp: 4, solid: 0, tent: 1, drops: [DR('tent', 1, 1)] });
  wgItem('tent', 'TENT', 'place', { place: 'tent' }); PLACE.tent = 'tent'; wgRec('tent', 1, { wool: 4, stick: 4, string: 2 }, 'bench');
  WG_ACH.push(['camp', 'CAMPER', 'SLEEP IN A TENT UNDER THE STARS', (c) => c.st.camp]);
})();
const _wgUseTent = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, o = w && OBJ[wgObjAt(w, WGS.dim, tx, ty)];
  if (o && o.tent && WGS.dim === 'o' && wgNight(WGS.clock) > 0.5) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.camp = 1; } // before the bed wakes us to morning
  return _wgUseTent(tx, ty);
};
const _wgTipTent = wgTipLines;
wgTipLines = function (s) { const L = _wgTipTent(s); if (s.id === 'tent') L.push('A BED FOR THE ROAD'); return L; };
const _wgIconTent = wgIcon;
wgIcon = function (id) { // a little red tent
  const key = 'ic_' + id; if (id !== 'tent' || WGA.cache[key]) return _wgIconTent(id);
  const [c, g] = wgCv(16, 16), [Lt, M, D] = WG_TENT_COLS[0];
  for (let y = 3; y <= 13; y++) { const h = (y - 3) * 0.7; for (let x = 0; x < 16; x++) { const cx = x + 0.5 - 8; if (Math.abs(cx) <= h) wgPx(g, x, y, cx < -h + 1.5 ? Lt : cx > h - 1.5 ? D : M); } }
  for (let y = 8; y <= 13; y++) wgRc(g, 8 - Math.floor((y - 8) * 0.5), y, Math.floor((y - 8) * 0.5) * 2 + 1, 1, y < 10 ? '0' : 'u');
  wgPx(g, 8, 2, 'n'); wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildTent = wgBuildAll;
wgBuildAll = function () {
  _wgBuildTent();
  wgReg('tent', WG_TENT_COLS.map(([Lt, M, D], k) => wgMake('tent' + k, 26, 22, (g) => { // a ridge tent seen from the front: two roof slopes going back, the front with its door tied open
    for (let y = 0; y < 22; y++) for (let x = 0; x < 26; x++) {
      const cx = x + 0.5 - 13, fr = (y - 9) * 12 / 11; // half the front's width at this row
      if (y >= 9 && y <= 20 && Math.abs(cx) <= fr) { // the front
        const door = y >= 12 && Math.abs(cx) <= (y - 12) * 0.55;
        wgPx(g, x, y, door ? (cx > 1.5 ? Lt : y < 15 ? '0' : 'u') : cx < -fr + 1.6 ? Lt : M);
      } else if (y >= 1 && y <= 20 && cx < 0 && y >= 13 - (x + 0.5) && x >= 1) wgPx(g, x, y, Math.abs(cx) < 1 || y + x < 15 ? Lt : M); // the near slope, in the light
      else if (y >= 1 && y <= 20 && cx >= 0 && y >= x + 0.5 - 13 && x <= 24) wgPx(g, x, y, D); // the far slope, in shade
    }
    wgRc(g, 12, 1, 2, 1, 'n'); wgPx(g, 12, 0, 'n'); // the pole's tip
    wgPx(g, 1, 20, 'n'); wgPx(g, 24, 20, 'n'); // pegs
  })));
};
const _wgDrawObjTent = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) { // one colour per tile
  const o = OBJ[id]; if (!o || !o.tent) return _wgDrawObjTent(id, tx, ty, sx, sy);
  const A = WGA.obj.tent, sp = A[hash(tx, ty, 23) % A.length]; shadow(sx + 8, sy + 14, 22); ctx.drawImage(sp.c, sx + sp.ox, sy + sp.oy);
};
