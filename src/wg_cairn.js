'use strict';
// Wildgrove: cairns. USE a stone on bare natural ground (not under your own feet, not on water, a floor or tilled
// soil) and it is set down as the foot of a cairn; each stone USEd on it after balances one more on top, up to
// `WG_CAIRN_TOP` + 1 stones, its meta. Mined, it gives its stones back (a `wgBreak` wrapper). Drawn at its height by a
// `wgDrawObj` wrapper. The BALANCING ACT star for one stacked to the top.
const WG_CAIRN_TOP = 4;
(function () {
  wgObj('cairn', { name: 'STONE CAIRN', kind: 'deco', tool: 'pick', hp: 2, cairn: 1, drops: [] });
  WG_ACH.push(['cairn', 'BALANCING ACT', 'STACK A CAIRN FIVE STONES HIGH', (c) => (c.st.cairn | 0) > 0]);
})();
const _wgUseCairn = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, s = WGS.inv[WGS.sel], id = w && wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if (!s || s.id !== 'stone' || !w) return _wgUseCairn(tx, ty);
  const cx = tx * 16 + 8, cy = ty * 16 + 10;
  if (o && o.cairn) {
    const m = wgMetaAt(w, dim, tx, ty);
    if (m >= WG_CAIRN_TOP) { wgToast('IT IS AS TALL AS IT CAN BE'); return true; }
    wgInvTake(WGS.inv, 'stone', 1); wgSetObj(w, dim, tx, ty, id, m + 1); wgSfx('clack'); wgPart(cx, cy - 6 - m * 3, 3, { c: ['m', 'l'], s: 12, up: 8, life: 0.4 });
    if (m + 1 === WG_CAIRN_TOP) { wgToast('A FINE CAIRN!', 2); const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.cairn = 1; }
    return true;
  }
  if (_wgUseCairn(tx, ty)) return true;
  const g = GROUND[wgGround(w, dim, tx, ty)], p = WGS.p;
  if (id || g.liq || g.floor || g.id === 'tilled' || (Math.floor(p.x / 16) === tx && Math.floor(p.y / 16) === ty)) return false;
  wgInvTake(WGS.inv, 'stone', 1); wgSetObj(w, dim, tx, ty, O_ID.cairn, 0); wgSfx('clack'); wgPart(cx, cy, 3, { c: ['m', 'd'], s: 12, up: 6, life: 0.4 });
  return true;
};
const _wgBreakCairn = wgBreak;
wgBreak = function (tx, ty, byPlayer) {
  const w = WGS.world, dim = WGS.dim, o = w && OBJ[wgObjAt(w, dim, tx, ty)], n = o && o.cairn ? wgMetaAt(w, dim, tx, ty) + 1 : 0;
  const r = _wgBreakCairn(tx, ty, byPlayer);
  if (n && !wgObjAt(w, dim, tx, ty)) wgDrop(tx * 16 + 8, ty * 16 + 10, 'stone', n);
  return r;
};
const _wgDrawObjCairn = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.cairn) return _wgDrawObjCairn(id, tx, ty, sx, sy);
  const L = WGA.obj.cairn, sp = L && L[Math.min(L.length - 1, wgMetaAt(WGS.world, WGS.dim, tx, ty))];
  shadow(sx + 8, sy + 14, 12); if (sp) ctx.drawImage(sp.c, sx + sp.ox, sy + sp.oy);
};
const _wgTipCairn = wgTipLines;
wgTipLines = function (s) { const L = _wgTipCairn(s); if (s.id === 'stone') L.push('USE IT ON THE GROUND TO START A CAIRN'); return L; };
// ---------- art: flat stones, each a little smaller than the one below, balanced a pixel off now and then ----------
const WG_CAIRN_STONES = [[14, 5, 0], [12, 4, 1], [10, 4, -1], [8, 3, 1], [5, 3, 0]]; // width, height, its shift right
const _wgBuildCairn = wgBuildAll;
wgBuildAll = function () {
  _wgBuildCairn();
  const frames = [];
  for (let n = 1; n <= WG_CAIRN_TOP + 1; n++) {
    const H = 3 + WG_CAIRN_STONES.slice(0, n).reduce((a, q) => a + q[1] - 1, 0) + 1; // a pixel all round for the outline
    frames.push(wgMake('cairn_' + n, 18, H, (g) => {
      let y = H - 2;
      for (let i = 0; i < n; i++) {
        const [sw, sh, dx] = WG_CAIRN_STONES[i], x0 = 9 - (sw >> 1) + dx, y0 = y - sh;
        wgBlob(g, x0 + sw / 2, y0 + sh / 2, sw / 2, sh / 2, ['d', 'm', 'm', 'l']);
        wgPx(g, x0 + 2, y0 + 1, 'L'); y = y0 + 1; // a glint at its top left; the next sits a pixel into it
      }
    }));
  }
  wgReg('cairn', frames);
};
