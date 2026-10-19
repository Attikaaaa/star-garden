'use strict';
// Wildgrove: the seaside pack. A shovel on bare sand heaps a mound, and every USE with the shovel after builds it up: a
// tower, two towers and a wall, a castle of three; a shell on the finished castle adds shells and a little flag. The
// stage is the tile's meta, so friends see the same castle. A lighthouse in red and white stripes: by night its lamp
// glows and a beam of light sweeps round it, on every screen from the world's clock. SANDCASTLE and KEEPER OF THE LIGHT.
const WG_CASTLE_TOP = 4;
(function () {
  wgObj('sandcastle', { name: 'SANDCASTLE', kind: 'deco', tool: 'shovel', hp: 1, castle: 1, drops: [DR('sand', 1, 1)] });
  wgObj('lighthouse', { name: 'LIGHTHOUSE', kind: 'deco', tool: 'pick', hp: 8, beacon: 1, drops: [DR('lighthouse', 1, 1)] });
  wgItem('lighthouse', 'LIGHTHOUSE', 'place', { place: 'lighthouse' }); PLACE.lighthouse = 'lighthouse'; wgRec('lighthouse', 1, { stone: 10, glass: 2, lantern: 1 }, 'bench');
  WG_ACH.push(['castle', 'SANDCASTLE', 'BUILD A SANDCASTLE WITH A FLAG', (c) => c.st.castle]);
  WG_ACH.push(['beacon', 'KEEPER OF THE LIGHT', 'BUILD A LIGHTHOUSE', (c) => c.seen.lighthouse]);
})();
const _wgUseSea = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty), o = id && OBJ[id], s = WGS.inv[WGS.sel], it = s && WGI[s.id];
  const shovel = it && it.kind === 'tool' && it.tool === 'shovel', cx = tx * 16 + 8, cy = ty * 16 + 10, sand = ['e', 'a', 'A'];
  if (o && o.castle) {
    const m = wgMetaAt(w, dim, tx, ty);
    if (m >= WG_CASTLE_TOP) { wgToast('WHAT A FINE SANDCASTLE!'); return true; }
    if (m === WG_CASTLE_TOP - 1) {
      if (s && s.id === 'shell') { wgInvTake(WGS.inv, 'shell', 1); wgSetObj(w, dim, tx, ty, id, WG_CASTLE_TOP); wgToast('WHAT A FINE SANDCASTLE!', 2.5); wgSfx('confirm'); wgPart(cx, cy - 12, 8, { c: ['q', 'P', 'w', 'y'], s: 26, up: 22, life: 0.6 }); const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.castle = 1; }
      else wgToast('A SHELL WOULD FINISH IT');
      return true;
    }
    if (!shovel) { wgToast('BUILD IT UP WITH A SHOVEL'); return true; }
    wgSetObj(w, dim, tx, ty, id, m + 1); wgSfx('place'); wgPart(cx, cy, 5, { c: sand, s: 22, up: 16 });
    return true;
  }
  if (shovel && !id && wgGroundAtT(tx, ty).id === 'sand') { // a mound to start a castle on
    const p = WGS.p; if (Math.floor(p.x / 16) === tx && Math.floor(p.y / 16) === ty) return _wgUseSea(tx, ty); // never under your own feet
    wgSetObj(w, dim, tx, ty, O_ID.sandcastle, 0); wgSfx('place'); wgPart(cx, cy, 6, { c: sand, s: 24, up: 16 });
    return true;
  }
  return _wgUseSea(tx, ty);
};
// drawing: the castle at its stage; the lighthouse's lamp and its sweeping beam by night
const wgBeamA = () => (((WGS.day | 0) + (WGS.clock % 1)) * wgDayLen() / 6) % 1 * Math.PI * 2; // one turn every 6 s of the world's clock
const _wgDrawObjSea = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id];
  if (o.castle) { const L = WGA.obj.sandcastle, sp = L && L[Math.min(L.length - 1, wgMetaAt(WGS.world, WGS.dim, tx, ty))]; if (sp) ctx.drawImage(sp.c, sx + sp.ox, sy + sp.oy); return; }
  if (!o.beacon) return _wgDrawObjSea(id, tx, ty, sx, sy);
  shadow(sx + 8, sy + 14, 14); _wgDrawObjSea(id, tx, ty, sx, sy);
  if (WGS.dim !== 'o' || wgNight(WGS.clock) <= 0.3) return;
  const a = wgBeamA(), lx = sx + 8, ly = sy - 22, front = Math.sin(a) > 0.6; // the lamp room's middle (the sprite stands 30 px above its tile)
  rect(lx - 2, ly - 1, 4, 3, front ? 'w' : 'Y');
  WGR.lights.push({ x: lx, y: ly, r: 22, f: 1 });
  for (const [k, r] of [[0.4, 12], [0.7, 18], [1, 30]]) WGR.lights.push({ x: Math.round(lx + Math.cos(a) * 72 * k), y: Math.round(ly + 22 * k + Math.sin(a) * 36 * k), r, f: 0 }); // the beam: brighter and wider where it falls
};
const _wgTipSea = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipSea(s), it = WGI[s.id];
  if (it && it.kind === 'tool' && it.tool === 'shovel') L.push('ON SAND IT BUILDS A SANDCASTLE');
  else if (s.id === 'lighthouse') L.push('ITS BEAM SWEEPS ROUND AT NIGHT');
  return L;
};
const _wgBuildSea = wgBuildAll;
wgBuildAll = function () {
  _wgBuildSea();
  const tower = (g, x0, x1, y0, y1) => { // a sand tower lit from the top left, with battlements
    wgRc(g, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 'a'); wgRc(g, x0, y0, 1, y1 - y0 + 1, 'A'); wgRc(g, x1, y0, 1, y1 - y0 + 1, 'e'); wgRc(g, x0, y0, x1 - x0 + 1, 1, 'A');
    for (let x = x0; x <= x1; x += 2) wgPx(g, x, y0 - 1, x === x1 ? 'e' : 'A');
  };
  const mound = (g) => wgBlob(g, 8.5, 17.5, 6.6, 2.8, ['e', 'a', 'a', 'A']);
  const stages = [
    (g) => { wgBlob(g, 8.5, 16.5, 5.6, 3.4, ['e', 'a', 'A', 'w']); },
    (g) => { mound(g); tower(g, 6, 10, 9, 16); },
    (g) => { mound(g); wgRc(g, 6, 13, 5, 4, 'a'); wgRc(g, 6, 13, 5, 1, 'A'); tower(g, 3, 6, 10, 17); tower(g, 10, 13, 10, 17); },
    (g) => { mound(g); wgRc(g, 4, 13, 9, 4, 'a'); wgRc(g, 4, 13, 9, 1, 'A'); tower(g, 2, 5, 11, 17); tower(g, 11, 14, 11, 17); tower(g, 6, 10, 7, 17); wgRc(g, 8, 15, 1, 2, 'u'); wgPx(g, 8, 10, 'e'); },
  ];
  stages.push((g) => { stages[3](g); for (const [x, y, k] of [[3, 15, 'q'], [12, 14, 'P'], [7, 13, 'q'], [10, 15, 'w']]) wgPx(g, x, y, k); wgRc(g, 8, 2, 1, 5, 'u'); wgRc(g, 9, 2, 3, 2, 'r'); wgPx(g, 9, 2, 'R'); });
  wgReg('sandcastle', stages.map((f, i) => wgMake('sandcastle_' + i, 16, 20, f)));
  wgReg('lighthouse', [wgMake('lighthouse', 16, 46, (g) => { // a stone foot, a striped tower narrowing up, a gallery, the lamp room, a red cap
    for (let y = 12; y <= 40; y++) {
      const hw = 3 + (y - 12) * 2.5 / 28, x0 = Math.round(8 - hw), x1 = Math.round(7 + hw), band = Math.floor((y - 12) / 5) % 2;
      for (let x = x0; x <= x1; x++) wgPx(g, x, y, x === x0 ? (band ? 'w' : 'R') : x === x1 ? (band ? 'l' : 'p') : band ? 'L' : 'r');
    }
    wgRc(g, 2, 41, 12, 4, 'm'); wgRc(g, 2, 41, 12, 1, 'l'); wgRc(g, 13, 42, 1, 3, 'd'); wgRc(g, 7, 37, 2, 4, 'u'); // the foot and a door
    wgRc(g, 3, 11, 10, 2, 'x'); wgRc(g, 3, 11, 10, 1, 'X'); // the gallery
    wgRc(g, 5, 6, 6, 5, 'C'); wgRc(g, 5, 6, 1, 5, 'x'); wgRc(g, 10, 6, 1, 5, 'x'); wgRc(g, 6, 7, 4, 3, 'y'); wgPx(g, 6, 7, 'Y'); // the lamp room
    wgRc(g, 5, 4, 6, 2, 'r'); wgRc(g, 6, 3, 4, 1, 'r'); wgRc(g, 7, 2, 2, 1, 'R'); wgPx(g, 5, 4, 'R'); wgPx(g, 7, 1, 'x'); // the cap
  })]);
};
