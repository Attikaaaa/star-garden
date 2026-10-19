'use strict';
// Wildgrove: the woodpile. A little lean-to of stakes under a plank roof that keeps firewood: USE it with wood in hand
// to stack the whole handful (up to `WG_PILE_MAX`), with anything else to take it all back into the pack. What it holds
// is the tile's meta, so friends see the same pile, drawn log by log as it fills (a `wgDrawObj` wrapper, a log for
// every `WG_PILE_LOG` wood); a woodpile knocked down drops its wood.
const WG_PILE_MAX = 36, WG_PILE_LOG = 4;
(function () {
  wgObj('woodpile', { name: 'WOODPILE', kind: 'deco', tool: 'axe', hp: 4, woodpile: 1, drops: [DR('woodpile', 1, 1)] });
  wgItem('woodpile', 'WOODPILE', 'place', { place: 'woodpile' }); PLACE.woodpile = 'woodpile';
  wgRec('woodpile', 1, { wood: 4, stick: 4 }, 'bench');
})();
const _wgUsePile = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty);
  if (!id || !OBJ[id].woodpile) return _wgUsePile(tx, ty);
  const m = wgMetaAt(w, dim, tx, ty), s = WGS.inv[WGS.sel];
  if (s && s.id === 'wood') {
    const n = Math.min(s.n, WG_PILE_MAX - m); if (n <= 0) { wgToast('THE WOODPILE IS FULL'); return true; }
    wgInvTake(WGS.inv, 'wood', n); wgSetObj(w, dim, tx, ty, id, m + n); wgSfx('place'); wgToast('WOOD STACKED', 1.5);
  } else {
    if (!m) { wgToast('STACK WOOD HERE'); return true; }
    const left = wgInvAdd(WGS.inv, 'wood', m); if (left === m) { wgToast('YOUR PACK IS FULL'); return true; }
    wgSetObj(w, dim, tx, ty, id, left); wgSfx('pickup');
  }
  wgPart(tx * 16 + 8, ty * 16 + 6, 4, { c: ['N', 'n', 'a'], s: 12, up: 8, life: 0.4 });
  return true;
};
// a woodpile knocked down lets its wood fall
const _wgBreakPile = wgBreak;
wgBreak = function (tx, ty, byPlayer) {
  const w = WGS.world, dim = WGS.dim, o = w && OBJ[wgObjAt(w, dim, tx, ty)], m = o && o.woodpile ? wgMetaAt(w, dim, tx, ty) : 0;
  const r = _wgBreakPile(tx, ty, byPlayer);
  if (m && !wgObjAt(w, dim, tx, ty)) wgDrop(tx * 16 + 8, ty * 16 + 10, 'wood', m);
  return r;
};
// ---------- art: the stakes, the roof, the logs end on, lit from the top left ----------
const WG_LOG_END = ['.NN.', 'NAan', 'Naen', '.nn.'];
function wgPilePaint(g, n, roof, ox, oy) { // n logs of nine, bottom row first; a roof three rows tall over them
  const y0 = oy + (roof ? 3 : 0);
  if (roof) { wgRc(g, ox, oy, 16, 1, 'O'); wgRc(g, ox, oy + 1, 16, 1, 'N'); wgRc(g, ox, oy + 2, 16, 1, 'n'); for (const x of [5, 10]) { wgPx(g, ox + x, oy, 'N'); wgPx(g, ox + x, oy + 1, 'n'); } }
  wgRc(g, ox + 2, y0, 12, 13, 'u'); wgRc(g, ox + 1, y0, 1, 13, 'N'); wgRc(g, ox + 14, y0, 1, 13, 'n'); wgRc(g, ox + 1, y0 + 13, 14, 1, 'n'); // the dark back, the stakes and the sill
  for (let i = 0; i < Math.min(9, n); i++) {
    const x = ox + 2 + (i % 3) * 4, y = y0 + 9 - Math.floor(i / 3) * 4;
    WG_LOG_END.forEach((r, j) => { for (let k = 0; k < 4; k++) if (r[k] !== '.') wgPx(g, x + k, y + j, r[k]); });
  }
}
const wgPileArt = (n) => WGA.cache['pile_' + n] || wgMake('pile_' + n, 18, 19, (g) => wgPilePaint(g, n, true, 1, 1));
const _wgDrawObjPile = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.woodpile) return _wgDrawObjPile(id, tx, ty, sx, sy);
  shadow(sx + 8, sy + 15, 9); ctx.drawImage(wgSnowy(wgPileArt(Math.ceil(wgMetaAt(WGS.world, WGS.dim, tx, ty) / WG_PILE_LOG))), sx - 1, sy - 3);
};
const _wgBuildPile = wgBuildAll;
wgBuildAll = function () { _wgBuildPile(); wgReg('woodpile', [wgPileArt(9)]); };
const _wgIconPile = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'woodpile') return _wgIconPile(id);
  const [c, g] = wgCv(16, 16); wgPilePaint(g, 9, false, 0, 1); wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgTipPile = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPile(s); if (s.id === 'woodpile') L.push('KEEPS YOUR FIREWOOD STACKED'); return L; };
