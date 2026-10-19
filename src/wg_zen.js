'use strict';
// Wildgrove: a rock garden. A rake USEd on bare sand or gravel rakes it (`raked`, flat and walkable, its meta one of
// `WG_RAKES`: rows, columns, ripples round the nearest stone or the tile, waves), and on raked ground it rakes the next pattern; the grooves
// take the ground's own ramp and meet their neighbours', drawn by a `wgDrawObj` wrapper (`wgRakeArt`). A shovel or a
// knock smooths it again. A stone lantern, a light, stands beside it. Raking every pattern lights ROCK GARDEN.
const WG_RAKES = ['ROWS', 'COLUMNS', 'RIPPLES', 'WAVES'], WG_RAKE_ON = ['sand', 'p_gravel'];
(function () {
  wgItem('rake', 'RAKE', 'tool', { tool: 'rake', tier: 0, stack: 1 }); wgRec('rake', 1, { wood: 2, stick: 4 }, 'bench');
  wgObj('raked', { name: 'RAKED SAND', kind: 'deco', tool: 'shovel', hp: 1, solid: 0, raked: 1, drops: [] });
  wgObj('stone_lantern', { name: 'STONE LANTERN', kind: 'light', light: 70, tool: 'pick', hp: 6, drops: [DR('stone_lantern', 1, 1)] });
  wgItem('stone_lantern', 'STONE LANTERN', 'place', { place: 'stone_lantern' }); PLACE.stone_lantern = 'stone_lantern'; wgRec('stone_lantern', 1, { stone: 6, glass: 1, torch: 1 }, 'bench');
  WG_ACH.push(['zen', 'ROCK GARDEN', 'RAKE THE SAND IN EVERY PATTERN', (c) => ((c.st.zen | 0) & 15) === 15]);
})();
const _wgUseZen = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, s = WGS.inv[WGS.sel]; if (!w || !s || s.id !== 'rake') return _wgUseZen(tx, ty);
  const id = wgObjAt(w, dim, tx, ty), o = id && OBJ[id], g = GROUND[wgGround(w, dim, tx, ty)];
  if ((id && !o.raked) || !WG_RAKE_ON.includes(g.id)) return _wgUseZen(tx, ty);
  const k = o ? (wgMetaAt(w, dim, tx, ty) + 1) % WG_RAKES.length : 0, st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  wgSetObj(w, dim, tx, ty, O_ID.raked, k); st.zen = (st.zen | 0) | (1 << k);
  WGS.p.swing = 0.25; wgSfx('scratch'); wgPart(tx * 16 + 8, ty * 16 + 10, 4, { c: g.ramp.slice(0, 3), s: 14, up: 6, life: 0.4 });
  return true;
};
const WGZN = { near: new Map(), t: -9 };
function wgZenStone(tx, ty) { // the nearest stone within three tiles as [dx, dy], or null: ripples ring it (looked up again each second)
  if (WGS.t - WGZN.t > 1 || WGZN.t > WGS.t) { WGZN.near.clear(); WGZN.t = WGS.t; }
  const key = WGS.dim + tx + ',' + ty; if (WGZN.near.has(key)) return WGZN.near.get(key);
  const w = WGS.world; let best = null, bd = 11;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const d = dx * dx + dy * dy; if (!d || d >= bd) continue; const o = OBJ[wgObjAt(w, WGS.dim, tx + dx, ty + dy)];
    if (o && (o.kind === 'rock' || o.id === 'cairn' || o.id === 'stone_lantern')) { best = [dx, dy]; bd = d; }
  }
  WGZN.near.set(key, best); return best;
}
function wgRakeArt(k, gid, c) { // the grooves in a ground's own ramp: a shaded line, its lit lip below; ripples round a stone at tile offset c
  const key = 'rake_' + k + '_' + gid + (c ? '_' + c[0] + '_' + c[1] : ''); if (WGA.cache[key]) return WGA.cache[key];
  const R = GROUND[G_ID[gid]].ramp, ox = c ? c[0] * 16 + 7.5 : 7.5, oy = c ? c[1] * 16 + 7.5 : 7.5;
  return wgMake(key, 16, 16, (g) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = k === 0 ? y % 4 : k === 1 ? x % 4 : k === 2 ? Math.floor(Math.hypot(x - ox, y - oy)) % 4 : (y + Math.round(Math.sin(x * Math.PI / 8) * 1.5) + 16) % 4;
      if (v === 1) wgPx(g, x, y, R[0]); else if (v === 2) wgPx(g, x, y, R[2]);
    }
  }, false);
}
const _wgDrawObjZen = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || (!o.raked && id !== O_ID.stone_lantern)) return _wgDrawObjZen(id, tx, ty, sx, sy);
  if (o.raked) { const g = GROUND[wgGround(WGS.world, WGS.dim, tx, ty)], k = wgMetaAt(WGS.world, WGS.dim, tx, ty) % WG_RAKES.length; if (WG_RAKE_ON.includes(g.id)) ctx.drawImage(wgRakeArt(k, g.id, k === 2 ? wgZenStone(tx, ty) : null), sx, sy); return; }
  shadow(sx + 8, sy + 14, 12); const A = wgLanternArt(); ctx.drawImage(A, sx + 8 - (A.width >> 1), sy + 16 - A.height);
  WGR.lights.push({ x: sx + 8, y: sy + 2, r: o.light, f: 1 }); // its window, as a drawn light would
};
function wgLanternArt() { // a stone lantern: a footing, a post, the light box with its paper window, a wide roof and its knob
  return WGA.cache.stone_lantern || wgMake('stone_lantern', 16, 24, (g) => {
    wgRc(g, 3, 20, 10, 2, 'm'); wgRc(g, 3, 20, 10, 1, 'l'); wgRc(g, 12, 20, 1, 2, 'd'); // the footing
    wgRc(g, 6, 15, 4, 5, 'm'); wgRc(g, 6, 15, 1, 5, 'l'); wgRc(g, 9, 15, 1, 5, 'd'); // the post
    wgRc(g, 4, 13, 8, 2, 'm'); wgRc(g, 4, 13, 8, 1, 'l'); // the shelf
    wgRc(g, 5, 8, 6, 5, 'm'); wgRc(g, 5, 8, 1, 5, 'l'); wgRc(g, 10, 8, 1, 5, 'd'); wgRc(g, 6, 9, 4, 3, 'Y'); wgRc(g, 6, 9, 4, 1, 'y'); wgPx(g, 7, 10, 'O'); wgPx(g, 8, 10, 'y'); // the light box, its window
    wgRc(g, 2, 6, 12, 2, 'm'); wgRc(g, 3, 5, 10, 1, 'l'); wgRc(g, 5, 4, 6, 1, 'l'); wgRc(g, 2, 7, 12, 1, 'd'); wgPx(g, 1, 7, 'm'); wgPx(g, 14, 7, 'd'); // the roof
    wgRc(g, 7, 2, 2, 2, 'm'); wgPx(g, 7, 2, 'L'); wgPx(g, 8, 1, 'l'); // its knob
    wgPx(g, 4, 21, 'h'); wgPx(g, 11, 20, 'G'); wgPx(g, 3, 6, 'G'); // a little moss
  });
}
const _wgTipZen = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipZen(s);
  if (s.id === 'rake') L.push('RAKES SAND AND GRAVEL', 'AGAIN FOR ANOTHER PATTERN');
  return L;
};
const _wgBuildZen = wgBuildAll;
wgBuildAll = function () { _wgBuildZen(); wgReg('raked', [wgRakeArt(0, 'sand')]); wgReg('stone_lantern', [wgLanternArt()]); };
const _wgIconZen = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || (id !== 'rake' && id !== 'stone_lantern')) return _wgIconZen(id);
  const c = wgMake(key, 16, 16, id === 'rake' ? (g) => { // a wooden rake: a long handle, the head with its tines
    for (let i = 0; i < 10; i++) wgPx(g, 13 - i, 2 + i, i % 3 ? 'N' : 'n');
    wgRc(g, 1, 11, 6, 1, 'N'); for (let x = 1; x < 7; x += 2) wgRc(g, x, 12, 1, 2, 'n'); wgPx(g, 4, 10, 'n');
  } : (g) => { // the lantern, small
    wgRc(g, 4, 13, 8, 1, 'm'); wgRc(g, 6, 10, 4, 3, 'm'); wgRc(g, 6, 10, 1, 3, 'l'); wgRc(g, 5, 9, 6, 1, 'l');
    wgRc(g, 5, 5, 6, 4, 'm'); wgRc(g, 6, 6, 4, 2, 'Y'); wgRc(g, 6, 6, 4, 1, 'y'); wgRc(g, 2, 3, 12, 2, 'm'); wgRc(g, 4, 2, 8, 1, 'l'); wgRc(g, 2, 4, 12, 1, 'd'); wgPx(g, 7, 1, 'l'); wgPx(g, 8, 1, 'm');
  });
  WGA.cache[key] = c; return c;
};
