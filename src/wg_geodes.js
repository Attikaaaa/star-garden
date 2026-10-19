'use strict';
// Wildgrove: geodes and a mineral case. A boulder, an ore or rock broken by hand now and then gives a geode
// (`wgGeodeChance`, a `wgBreak` wrapper); USE one in hand, even with the aim out of reach, cracks it open
// (`wgGeodeCrack`) for one of `WG_MINERALS`, picked by weight. A mineral case from a bench shows what is put in it: USE a
// mineral on it sets that mineral's bit in the tile's meta (one of each), so it goes over co-op with the tile; broken, it
// gives them back. A case holding all five lights the ROCK HOUND star.
const WG_MINERALS = [['amethyst', 'AMETHYST', ['1', '2', '3', '4'], 30], ['rose_quartz', 'ROSE QUARTZ', ['p', 'P', 'q', 'L'], 25],
  ['citrine', 'CITRINE', ['o', 'O', 'y', 'Y'], 20], ['jade', 'JADE', ['g', 'G', 'h', 'H'], 17], ['opal', 'OPAL', ['t', 'T', 'C', 'w'], 8]]; // id, name, ramp, weight
const WG_CASE_FULL = (1 << WG_MINERALS.length) - 1;
const WG_CASE_SLOTS = [[4, 4], [10, 4], [3, 9], [7, 9], [11, 9]]; // each mineral's place behind the glass, two up and three down
(function () {
  wgItem('geode', 'GEODE', 'res', {});
  for (const [id, name] of WG_MINERALS) wgItem(id, name, 'res', {});
  wgObj('rock_case', { name: 'MINERAL CASE', kind: 'deco', tool: 'axe', hp: 3, rcase: 1, drops: [DR('rock_case', 1, 1)] });
  wgItem('rock_case', 'MINERAL CASE', 'place', { place: 'rock_case' }); PLACE.rock_case = 'rock_case'; wgRec('rock_case', 1, { wood: 3, glass: 2 }, 'bench');
  WG_ACH.push(['rockhound', 'ROCK HOUND', 'FILL A MINERAL CASE WITH ALL FIVE', (c) => (c.st.rockcase | 0) > 0]);
})();
const wgGeodeChance = (id) => /^(boulder|ore_|u_)/.test(id) ? 0.05 : /^cliff(_hi|_ash)?$/.test(id) ? 0.025 : 0;
const wgGeodeHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!s && s.id === 'geode'; };
function wgGeodeCrack() {
  if (!wgGeodeHeld()) return false;
  wgInvTake(WGS.inv, 'geode', 1);
  let r = Math.random() * 100; const q = WG_MINERALS.find(m => (r -= m[3]) < 0) || WG_MINERALS[0], p = WGS.p;
  const left = wgInvAdd(WGS.inv, q[0], 1); if (left) wgDrop(p.x, p.y, q[0], left);
  wgPart(p.x, p.y - 12, 4, { c: ['d', 'm', 'l'], s: 26, up: 16, life: 0.45 }); wgPart(p.x, p.y - 12, 7, { c: q[2].slice(1), s: 22, up: 24, life: 0.7 });
  wgSfx('clack'); wgSfx('chime'); wgToast(q[1], 2);
  return true;
}
const _wgBreakGeode = wgBreak;
wgBreak = function (tx, ty, byPlayer) {
  const w = WGS.world, dim = WGS.dim, o = w && OBJ[wgObjAt(w, dim, tx, ty)], m = o && o.rcase ? wgMetaAt(w, dim, tx, ty) : 0;
  const r = _wgBreakGeode(tx, ty, byPlayer), x = tx * 16 + 8, y = ty * 16 + 10;
  if (o && o.rcase) WG_MINERALS.forEach((q, i) => { if (m & (1 << i)) wgDrop(x + (i - 2) * 2, y, q[0], 1); }); // the case gives its minerals back
  else if (o && byPlayer && Math.random() < wgGeodeChance(o.id)) wgDrop(x + (Math.random() - 0.5) * 8, y, 'geode', 1);
  return r;
};
const _wgUseGeode = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty), o = id && OBJ[id], s = WGS.inv && WGS.inv[WGS.sel];
  if (o && o.rcase) {
    const m = wgMetaAt(w, dim, tx, ty), i = s ? WG_MINERALS.findIndex(q => q[0] === s.id) : -1;
    if (i < 0) { let n = 0; for (let b = m; b; b >>= 1) n += b & 1; wgToast(n ? n + ' OF 5 MINERALS' : 'PUT A MINERAL IN IT'); return true; }
    if (m & (1 << i)) { wgToast('THERE IS ONE IN IT ALREADY'); return true; }
    wgInvTake(WGS.inv, s.id, 1); wgSetObj(w, dim, tx, ty, id, m | (1 << i)); wgSfx('clack');
    const [sx, sy] = WG_CASE_SLOTS[i]; wgPart(tx * 16 + sx, ty * 16 - 5 + sy, 4, { c: WG_MINERALS[i][2].slice(2), s: 10, up: 6, life: 0.5 });
    if ((m | (1 << i)) === WG_CASE_FULL) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.rockcase = 1; wgToast('A FULL COLLECTION!', 2); wgSfx('chime'); }
    return true;
  }
  if (!wgGeodeHeld()) return _wgUseGeode(tx, ty);
  return _wgUseGeode(tx, ty) || wgGeodeCrack();
};
const _wgUpdGeode = updateWG;
updateWG = function (dt) {
  const fresh = WGS.scr === 'play' && wgGeodeHeld() && (Input.rHit || pressed(wgKey('use'), 'KeyK', 'PadX', 'PadLT') || (WGS.touch && WGS.touch.use));
  _wgUpdGeode(dt);
  if (fresh && WGS.scr === 'play' && !WGS.target) wgGeodeCrack(); // the aim out of reach: crack it all the same
};
const _wgDrawObjGeode = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.rcase) return _wgDrawObjGeode(id, tx, ty, sx, sy);
  const m = wgMetaAt(WGS.world, WGS.dim, tx, ty), x = sx, y = sy - 5;
  shadow(sx + 8, sy + 14, 14); ctx.drawImage(wgGeodeArt('case'), x, y);
  WG_MINERALS.forEach((q, i) => { if (m & (1 << i)) ctx.drawImage(wgGeodeArt('min' + i), x + WG_CASE_SLOTS[i][0], y + WG_CASE_SLOTS[i][1]); });
  ctx.drawImage(wgGeodeArt('glint'), x, y); // the glass over them
  if (m && wgNight(WGS.clock) > 0.5 && (m & 16)) { const [ox, oy] = WG_CASE_SLOTS[4]; if (Math.sin(WGS.t * 2 + tx) > 0.6) rect(x + ox + 1, y + oy, 1, 1, 'w'); } // the opal's play of colour
};
function wgGeodeArt(k) { // the case, each mineral's crystal (3 by 4, lit from the top left), the glass's glint, the geode
  const key = 'geo_' + k; if (WGA.cache[key]) return WGA.cache[key];
  if (k === 'case') return wgMake(key, 17, 21, (g) => {
    wgRc(g, 1, 1, 15, 1, 'N'); wgRc(g, 1, 2, 15, 1, 'n'); // the cap
    wgRc(g, 1, 3, 1, 12, 'N'); wgRc(g, 15, 3, 1, 12, 'n'); // the posts
    wgRc(g, 2, 3, 13, 11, 'v'); wgRc(g, 2, 3, 13, 1, 'x'); wgRc(g, 2, 3, 1, 11, 'V'); // the velvet behind the glass
    wgRc(g, 2, 8, 13, 1, 'N'); wgRc(g, 2, 13, 13, 1, 'N'); wgRc(g, 1, 14, 15, 1, 'n'); // the shelves
    wgRc(g, 1, 15, 15, 3, 'n'); wgRc(g, 1, 15, 15, 1, 'N'); wgRc(g, 15, 15, 1, 3, 'u'); wgRc(g, 3, 16, 11, 1, 'u'); wgPx(g, 8, 16, 'y'); // the cupboard
    wgRc(g, 2, 18, 1, 2, 'u'); wgRc(g, 14, 18, 1, 2, 'u'); // the feet
  });
  if (k === 'glint') return wgMake(key, 17, 21, (g) => { for (const [a, b] of [[8, 6], [9, 5], [13, 4], [14, 11], [14, 12]]) wgPx(g, a, b, 'C'); }, false);
  if (k === 'geode') return wgMake(key, 12, 11, (g) => { wgBlob(g, 6, 5.5, 4.6, 4.2, ['d', 'm', 'm', 'l']); wgPx(g, 4, 3, 'L'); for (const [a, b] of [[4, 7], [9, 8]]) wgPx(g, a, b, 'd'); wgLine(g, 6, 3, 8, 7, 'd'); wgPx(g, 7, 4, '3'); wgPx(g, 7, 5, '2'); }); // a crack with a glimpse of purple
  return wgMake(key, 3, 4, (g) => wgGeoCrys(g, 0, 0, 3, 4, +k.slice(3)), false);
}
function wgGeoCrys(g, x0, y0, w, h, i) { // a crystal standing up with a pointed top: the lit face left, the shaded one right
  const [D, M, L, W] = WG_MINERALS[i][2], mid = w >> 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (y < mid && Math.abs(x - mid) > y) continue;
    wgPx(g, x0 + x, y0 + y, y === h - 1 && x < mid ? M : x < mid || y === 0 ? L : x === w - 1 ? D : M);
  }
  wgPx(g, x0, y0 + mid, W);
  if (WG_MINERALS[i][0] === 'opal') { wgPx(g, x0 + mid, y0 + h - 2, 'P'); wgPx(g, x0 + w - 1, y0 + mid, 'y'); } // its flecks of fire
}
const _wgTipGeode = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipGeode(s);
  if (s.id === 'geode') L.push('USE IT TO CRACK IT OPEN');
  else if (s.id === 'rock_case') L.push('A CASE FOR YOUR MINERALS');
  else if (WG_MINERALS.some(q => q[0] === s.id)) L.push('FOUND IN A GEODE', 'SHOW IT IN A MINERAL CASE');
  return L;
};
const _wgBuildGeode = wgBuildAll;
wgBuildAll = function () { _wgBuildGeode(); wgReg('rock_case', [wgGeodeArt('case')]); };
const _wgIconGeode = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, i = WG_MINERALS.findIndex(q => q[0] === id);
  if (WGA.cache[key] || (id !== 'geode' && id !== 'rock_case' && i < 0)) return _wgIconGeode(id);
  const [c, g] = wgCv(16, 16);
  if (id === 'geode') g.drawImage(wgGeodeArt('geode'), 2, 3);
  else if (id === 'rock_case') { // the case, small: two minerals up, three down
    wgRc(g, 2, 1, 12, 1, 'N'); wgRc(g, 2, 2, 12, 1, 'n'); wgRc(g, 2, 3, 1, 7, 'N'); wgRc(g, 13, 3, 1, 7, 'n'); wgRc(g, 3, 3, 10, 7, 'v'); wgRc(g, 3, 3, 10, 1, 'x');
    wgRc(g, 3, 6, 10, 1, 'N'); wgRc(g, 2, 10, 12, 1, 'n'); wgRc(g, 2, 11, 12, 2, 'n'); wgRc(g, 2, 11, 12, 1, 'N'); wgRc(g, 13, 11, 1, 2, 'u'); wgPx(g, 7, 12, 'y'); wgRc(g, 3, 13, 1, 2, 'u'); wgRc(g, 12, 13, 1, 2, 'u');
    for (const [a, b, j] of [[5, 4, 0], [9, 4, 1], [4, 8, 2], [7, 8, 3], [10, 8, 4]]) { wgPx(g, a, b, WG_MINERALS[j][2][2]); wgPx(g, a + 1, b, WG_MINERALS[j][2][0]); wgPx(g, a, b - 1, WG_MINERALS[j][2][3]); }
    wgOutline(c);
  } else { wgGeoCrys(g, 5, 3, 5, 10, i); wgGeoCrys(g, 2, 7, 3, 6, i); wgGeoCrys(g, 10, 8, 3, 5, i); wgOutline(c); } // a little cluster
  WGA.cache[key] = c; return c;
};
