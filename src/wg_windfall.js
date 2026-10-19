'use strict';
// Wildgrove: windfalls. In summer and autumn a ripe fruit tree lets a fruit fall now and then, and in autumn the oaks
// drop acorns: they lie on the grass beside the tree or a row below it, a new few each day. Where they lie comes from the
// tile, the world's seed and the day alone (`wgFallAt`), so every screen has the same, but the gathering is each hero's
// own, like the egg hunt: walk onto one (or USE it) to pick it up, the day's finds kept in `w.meta.fall`. Drawn on the
// ground through a `wgChunkUpkeep` wrapper. Two acorns grow an oak sapling, and an oak felled may drop one. The WINDFALL
// star after twenty.
const WG_FALL_ON = ['grass', 'jungle', 'dirt', 'moss'];
const WG_FALL_TREE = [[1, 0], [-1, 0], [1, -1], [0, -1], [-1, -1]]; // where the tree stands from the fallen thing: beside it or a row up
const WG_FALL_FRUIT = 14, WG_FALL_ACORN = 4; // in a hundred, for each tile round a tree
(function () {
  wgItem('acorn', 'ACORN', 'res', {});
  wgRec('sap_oak', 1, { acorn: 2 }, 'hand');
  OBJ[O_ID.oak].drops.push(DR('acorn', 1, 1, 0.15));
  WG_ACH.push(['windfall', 'WINDFALL', 'GATHER TWENTY FALLEN FRUITS OR ACORNS', (c) => (c.st.fall | 0) >= 20]);
})();
function wgFallAt(tx, ty) { // what lies fallen on a tile today, or null: its item and its spot in the tile
  const w = WGS.world, s = wgSeason(); if (!w || (s !== 1 && s !== 2)) return null;
  const h = hash(tx, ty, (w.seed | 0) * 37 + (WGS.day | 0) * 151 + 7717) >>> 0, r = h % 100;
  if (r >= WG_FALL_FRUIT || wgObjAt(w, 'o', tx, ty) || !WG_FALL_ON.includes(GROUND[wgGround(w, 'o', tx, ty)].id)) return null;
  for (const [i, j] of WG_FALL_TREE) {
    const o = OBJ[wgObjAt(w, 'o', tx + i, ty + j)]; if (!o || o.kind !== 'tree') continue;
    const id = o.bare && o.fruit ? o.fruit : s === 2 && o.id === 'oak' && r < WG_FALL_ACORN ? 'acorn' : null;
    if (id) return { id, dx: ((h >>> 8) % 7) - 3, dy: ((h >>> 11) % 3) - 1 };
  }
  return null;
}
function wgFallFound(tx, ty) { const F = WGS.world.meta.fall; return !!(F && F.d === (WGS.day | 0) && F.k.includes(tx + ',' + ty)); }
function wgFallTake(tx, ty) { // picks up what lies fallen on a tile: true when it did
  const w = WGS.world, F0 = wgFallAt(tx, ty); if (!F0 || wgFallFound(tx, ty)) return false;
  const m = w.meta; if (!m.fall || m.fall.d !== (WGS.day | 0)) m.fall = { d: WGS.day | 0, k: [] };
  if (m.fall.k.length < 300) m.fall.k.push(tx + ',' + ty);
  const x = tx * 16 + 8 + F0.dx, y = ty * 16 + 11 + F0.dy, left = wgInvAdd(WGS.inv, F0.id, 1); if (left) wgDrop(x, y, F0.id, left);
  wgSfx('pickup'); wgPart(x, y - 2, 4, { c: ['h', 'G', 'w'], s: 12, up: 12, life: 0.5 });
  const st = m.stats || (m.stats = { kills: 0, far: 0 }); st.fall = Math.min(9999, (st.fall | 0) + 1);
  return true;
}
const _wgUpdFall = updateWG;
updateWG = function (dt) {
  _wgUpdFall(dt);
  const w = WGS.world, p = WGS.p, s = wgSeason();
  if (!w || !p || p.hidden || WGS.scr !== 'play' || WGS.dim !== 'o' || (s !== 1 && s !== 2)) return;
  wgFallTake(Math.floor(p.x / 16), Math.floor((p.y - 2) / 16)); // walked onto one
};
const _wgUseFall = wgUse;
wgUse = function (tx, ty) { return (WGS.world && WGS.dim === 'o' && wgFallTake(tx, ty)) || _wgUseFall(tx, ty); };
// drawn on the ground, under everything that stands
const _wgUpkeepFall = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepFall(w, dim, cx0c, cy0c, cx1c, cy1c);
  const s = wgSeason(); if (dim !== 'o' || w !== WGS.world || (s !== 1 && s !== 2)) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const F = wgFallAt(tx, ty); if (!F || wgFallFound(tx, ty)) continue;
    const c = WGA.cache['fall_' + F.id]; if (c) ctx.drawImage(c, tx * 16 + 8 + F.dx - cx0 - 3, ty * 16 + 12 + F.dy - cy0 - 6);
  }
};
const _wgTipFall = wgTipLines;
wgTipLines = function (s) { const L = _wgTipFall(s); if (s.id === 'acorn') L.push('FALLS FROM THE OAKS IN AUTUMN'); return L; };
// ---------- art: each fallen thing small, lit from the top left; the acorn's icon ----------
const WG_FALL_ART = {
  apple: ['..uG.', '.Rrr.', 'RRrrp', 'rrrrp', '.rpp.'],
  cherry: ['..g..', '.g.g.', 'Rr.Rr', 'rp.rp', '.....'],
  orange: ['..g..', '.OOo.', 'OOoon', 'ooonn', '.onn.'],
  lemon: ['.....', '.YYy.', 'yYyye', '.yee.', '.....'],
  acorn: ['..u..', '.NnN.', 'nnnnu', '.aNn.', '..N..'],
};
const _wgBuildFall = wgBuildAll;
wgBuildAll = function () {
  _wgBuildFall();
  for (const id in WG_FALL_ART) wgMake('fall_' + id, 7, 7, (g) => WG_FALL_ART[id].forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] !== '.') wgPx(g, x + 1, y + 1, r[x]); }));
};
const _wgIconFall = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'acorn') return _wgIconFall(id);
  const [c, g] = wgCv(16, 16); // a big acorn: a scaly cap and its stalk over a glossy nut
  wgRc(g, 7, 2, 2, 2, 'u'); wgRc(g, 4, 4, 8, 3, 'n'); wgRc(g, 4, 4, 8, 1, 'N'); wgRc(g, 3, 6, 10, 1, 'u');
  for (const [x, y] of [[5, 5], [8, 5], [10, 5]]) wgPx(g, x, y, 'N');
  wgBlob(g, 8, 10.5, 3.6, 3.8, ['n', 'N', 'N', 'a']); wgRc(g, 6, 8, 2, 2, 'a'); wgPx(g, 6, 8, 'A'); wgPx(g, 8, 14, 'n');
  wgOutline(c); WGA.cache[key] = c; return c;
};
