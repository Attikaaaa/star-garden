'use strict';
// Wildgrove: a hammock between two posts, a seat of wg_rest's kind. Its striped cloth sags between the ropes, sways a
// little while someone lies back in it, and its near side is drawn again over its rider, so they sit down in it. Resting
// there heals half as fast again as a chair, little z's rise after a while, and the LAZY DAY star comes after a minute.
// Three stripe colours, from the tile. Ids are appended, so old worlds stay valid.
const WG_HAM_COLS = [['r', 'R'], ['B', 'c'], ['G', 'h']]; // each hammock's stripe: shade and light
(function () {
  wgObj('hammock', { name: 'HAMMOCK', kind: 'deco', tool: 'axe', hp: 4, solid: 0, seat: 1, hammock: 1, drops: [DR('hammock', 1, 1)] });
  wgItem('hammock', 'HAMMOCK', 'place', { place: 'hammock' }); PLACE.hammock = 'hammock'; wgRec('hammock', 1, { wood: 4, wool: 3, string: 2 }, 'bench');
  WG_ACH.push(['hammock', 'LAZY DAY', 'REST IN A HAMMOCK FOR A MINUTE', (c) => (c.st.hammock | 0) >= 60]);
})();
const wgHamSway = (tx, ty) => Math.round(Math.sin(WGS.t * 1.3 + (hash(tx, ty, 79) & 63) / 10)); // -1, 0 or 1, for the cloth and its rider
const _wgUpdHam = updateWG;
updateWG = function (dt) {
  _wgUpdHam(dt);
  const p = WGS.p, S = p && p.sit; if (!S || WGS.scr !== 'play') return;
  const o = OBJ[wgObjAt(WGS.world, WGS.dim, S.tx, S.ty)]; if (!o || !o.hammock) return;
  S.t += dt * 0.5; // half as fast again as a chair
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.hammock = Math.min(99999, (st.hammock || 0) + dt);
};
// the cloth, from tile-relative coordinates: its far edge, its near edge and its bottom sag towards the middle
function wgHamCloth(tx, ty, sx, sy, front) {
  const k = WG_HAM_COLS[hash(tx, ty, 5) % WG_HAM_COLS.length], dx = wgSeatedAt(tx, ty) ? wgHamSway(tx, ty) : 0;
  for (let u = -12; u <= 12; u++) {
    const s = 1 - (u / 12) * (u / 12), x = sx + 8 + u + dx, far = sy + Math.round(2 * s), near = sy + 2 + Math.round(3 * s), bot = sy + 4 + Math.round(9 * s);
    const col = ((u + 12) >> 2) & 1 ? k : ['A', 'w']; // stripes across the cloth, four pixels wide
    if (!front) { rect(x, far - 1, 1, 1, '0'); rect(x, far, 1, near - far, 'a'); } // the far edge and the inside, in shade
    rect(x, near - 1, 1, 1, '0'); rect(x, near, 1, bot - near, col[0]); rect(x, near, 1, 1, col[1]); rect(x, bot, 1, 1, '0'); // the near side, lit along its top
  }
  for (const u of [-13, 13]) rect(sx + 8 + u + dx, sy + 1, 1, 3, '0'); // its ends, gathered
}
const _wgDrawObjHam = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjHam(id, tx, ty, sx, sy);
  if (OBJ[id].hammock) wgHamCloth(tx, ty, sx, sy, false);
};
// its rider sways with it and sits down in it: the near side again, over them
const _wgDrawPlayerHam = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p, seat = !p.hidden && wgSeatOf(p);
  if (!seat || !seat[0].hammock) return _wgDrawPlayerHam(e, cx0, cy0);
  const [, tx, ty] = seat, sx = tx * 16 - cx0, sy = ty * 16 - cy0;
  ctx.save(); ctx.translate(wgHamSway(tx, ty), 2); _wgDrawPlayerHam(e, cx0, cy0); ctx.restore();
  if (p.inv > 0 && Math.floor(WGS.t * 20) % 2) return;
  wgHamCloth(tx, ty, sx, sy, true);
  if (wgHamNap(p, tx, ty)) for (let i = 0; i < 2; i++) { // a while in it, little z's rise
    const k = (WGS.t * 0.4 + i * 0.5) % 1, x = Math.round(p.x - cx0 + 5 + k * 6 + Math.sin(k * 6) * 1.5), y = Math.round(p.y - cy0 - 22 - k * 14);
    ctx.globalAlpha = k < 0.8 ? 1 : (1 - k) * 5; wgHamZ(x, y); ctx.globalAlpha = 1;
  }
};
function wgHamZ(x, y) { rect(x, y, 4, 1, 'w'); rect(x + 2, y + 1, 1, 1, 'w'); rect(x + 1, y + 2, 1, 1, 'w'); rect(x, y + 3, 4, 1, 'w'); } // a little z, as wg_petbed's
const WGHM = new Map(); // who has lain in which hammock since when, as seen on this screen: hero -> [tile, since, last seen]
function wgHamNap(p, tx, ty) {
  const k = p === WGS.p ? 'me' : p.pid, at = tx + ',' + ty, v = WGHM.get(k), t = WGS.t;
  if (!v || v[0] !== at || t - v[2] > 0.5 || v[1] > t) { WGHM.set(k, [at, t, t]); return false; }
  v[2] = t; return t - v[1] > 8;
}
const _wgTipHam = wgTipLines;
wgTipLines = function (s) { const L = _wgTipHam(s); if (s.id === 'hammock') L.push('HEALS HALF AS FAST AGAIN'); return L; };
const _wgBuildHam = wgBuildAll;
wgBuildAll = function () {
  _wgBuildHam();
  wgReg('hammock', [wgMake('hammock', 34, 26, (g) => { // two posts with ropes down to where the cloth hangs (the cloth is drawn on its own)
    for (const x of [1, 31]) { wgRc(g, x, 3, 2, 21, 'n'); wgRc(g, x, 3, 1, 21, 'N'); wgRc(g, x, 2, 2, 1, 'O'); wgRc(g, x - 1, 23, 4, 1, 'u'); }
    wgLine(g, 3, 5, 4, 10, 'a'); wgLine(g, 30, 5, 29, 10, 'a'); wgPx(g, 3, 5, 'e'); wgPx(g, 30, 5, 'e');
  })]);
};
