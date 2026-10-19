'use strict';
// Wildgrove: pond life. Fish glide as dark shapes under deep water, now and then rising to leave a ring; by day in
// spring and summer dragonflies hover over the shallows, darting from spot to spot. Both are ambient life worked out
// from the place and the clock, the same on every screen; a dragonfly can be caught with the bug net (the catch is your
// own, like the butterflies'), framed, or let go. The POND DIPPER star. Ids are appended, so old worlds stay valid.
const WG_DFLY_COL = [['b', 'B', 'c'], ['g', 'T', 'H'], ['p', 'r', 'R']]; // blue, green and red: body dark, body, eye
const WGPL = { spots: new Map(), seen: [], gone: new Map(), free: [] }; // a cell's spots, dragonflies drawn this frame, caught ones, let-go ones
(function () {
  wgItem('dragonfly', 'DRAGONFLY', 'res', { album: 1 });
  wgObj('dfly_case', { name: 'FRAMED DRAGONFLY', kind: 'deco', tool: 'axe', hp: 3, drops: [DR('dfly_case', 1, 1)] });
  wgItem('dfly_case', 'FRAMED DRAGONFLY', 'place', { place: 'dfly_case' }); PLACE.dfly_case = 'dfly_case'; wgRec('dfly_case', 1, { wood: 2, glass: 1, dragonfly: 1 }, 'bench');
  WG_ACH.push(['dfly', 'POND DIPPER', 'CATCH A DRAGONFLY', (c) => c.st.dfly]);
})();
function wgPondSpot(gx, gy, C) { // a cell's pond life: [kind, x, y, phase, next look] with kind 0 fish in deep water, 1 dragonflies over the shallows, -1 none
  const key = gx * 65536 + gy, w = WGS.world; let s = WGPL.spots.get(key);
  if (!s) { const h = hash(gx, gy, 7171 + (w.seed | 0)); s = [-1, gx * C + 16 + (h & 63) + ((h >>> 6) & 15), gy * C + 16 + ((h >>> 10) & 63), (h >>> 16) % 628 / 100, 0, h]; if (WGPL.spots.size > 500) WGPL.spots.clear(); WGPL.spots.set(key, s); }
  if (WGS.t >= s[4]) { // the ground is looked at again now and then, so a filled pond empties and a dug one fills
    const [, ax, ay, , , h] = s, g = (x, y) => GROUND[wgGround(w, 'o', Math.floor(x / 16), Math.floor(y / 16))], c = g(ax, ay);
    s[0] = c.liq !== 'water' ? -1 : h % 2 === 0 && c.swim && [[22, 0], [-22, 0], [0, 14], [0, -14]].every(([dx, dy]) => g(ax + dx, ay + dy).swim) ? 0 : h % 3 === 0 && c.wade ? 1 : -1;
    s[4] = WGS.t + 2;
  }
  return s;
}
const WG_PL_C = 128; // the size of a pond-life cell, in pixels
function wgDflySpr(k, left, flap) { // a dragonfly seen from above, head to the right: wings spread, then a blur; outlined, cached
  const key = 'dfly_' + k + (left ? 'l' : 'r') + flap; if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(11, 9), [d, b, e] = WG_DFLY_COL[k]; // four wings, fore and hind apart, their tips swept back; long then short
  wgPaint(g, 1, 1, flap ? ['.........', '...wC.wC.', '....CC.CC', 'ddbbbbbbe', '....wC.wC', '...CC.CC.', '.........'] : ['...wC.wC.', '....CC.CC', '....CC.CC', 'ddbbbbbbe', '....wC.wC', '....CC.CC', '...CC.CC.'], { C: 'C', w: 'w', d, b, e });
  wgOutline(c); if (left) { const [m, mg] = wgCv(11, 9); mg.translate(11, 0); mg.scale(-1, 1); mg.drawImage(c, 0, 0); WGA.cache[key] = m; return m; }
  WGA.cache[key] = c; return c;
}
function wgPondCells(cx0, cy0, fn) { // every cell near the view, its spot and kind
  if (WGPL.w !== WGS.world) { WGPL.w = WGS.world; WGPL.spots.clear(); WGPL.gone.clear(); } // another world: its own ponds
  const C = WG_PL_C, gx0 = Math.floor((cx0 - 40) / C), gy0 = Math.floor((cy0 - 40) / C), gx1 = Math.floor((cx0 + SCR.w + 40) / C), gy1 = Math.floor((cy0 + SCR.h + 40) / C);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { const s = wgPondSpot(gx, gy, C); if (s[0] >= 0) fn(s, gx, gy); }
}
// Fish are drawn with the water, under the shore and everything standing, so a swimmer is never painted over.
const _wgLiqPondLife = wgDrawLiquids;
wgDrawLiquids = function (x0, y0, x1, y1, cx0, cy0) {
  _wgLiqPondLife(x0, y0, x1, y1, cx0, cy0);
  if (WGS.dim !== 'o' || !wgOpt().amb) return;
  const t = WGS.t;
  wgPondCells(cx0, cy0, ([kind, ax, ay, ph]) => {
    if (kind === 0) for (let n = 0; n < 2; n++) { // two fish loop slowly, out of step; one rises now and then
      const a = ph + n * 2.6 + t * (0.18 + n * 0.05) * (n ? -1 : 1), x = Math.round(ax + Math.cos(a) * (14 + n * 4) - cx0), y = Math.round(ay + Math.sin(a) * (7 + n * 2) - cy0);
      const left = Math.sin(a) * (n ? -1 : 1) > 0, wig = Math.floor(t * 4 + n) % 2;
      ctx.globalAlpha = 0.38; rect(x - 3, y, 6, 2, 'b'); rect(x - 2, y - 1, 4, 1, 'b'); rect(left ? x + 3 : x - 5, y - wig, 2, 2, 'b'); ctx.globalAlpha = 1;
      const r = (t * 0.13 + ph + n * 0.5) % 1; if (r < 0.12) { const k = r / 0.12, rr = 1 + Math.round(k * 5); ctx.globalAlpha = (1 - k) * 0.8; rect(x - rr, y - 1, rr * 2, 1, 'C'); rect(x - rr, y + 1, rr * 2, 1, 'C'); rect(x - rr - 1, y, 1, 1, 'C'); rect(x + rr, y, 1, 1, 'C'); ctx.globalAlpha = 1; }
    }
  });
};
const _wgAmbPondLife = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbPondLife(cx0, cy0);
  WGPL.seen.length = 0;
  if (WGS.dim !== 'o' || !wgOpt().amb) return;
  const t = WGS.t, se = wgSeason(), day = wgNight(WGS.clock) < 0.3 && se < 2 && !(WGS.weather && WGS.weather.kind === 'rain');
  if (day) wgPondCells(cx0, cy0, ([kind, ax, ay, ph], gx, gy) => {
    if (kind === 1) for (let n = 0; n < 2; n++) { // dragonflies: hover, then dart to a new spot
      const cell = gx * 65536 + gy; if (WGPL.gone.get(cell * 4 + n) > t) continue;
      const T = t / 1.6 + ph + n * 0.37, step = Math.floor(T), f = Math.min(1, (T - step) * 7), j0 = hash(step - 1, cell, 13 + n * 104729), j1 = hash(step, cell, 13 + n * 104729); // seeds far apart: the hash mixes once, so near seeds fly together
      const px = (j) => ax + (j % 41) - 20, py = (j) => ay + ((j >>> 6) % 25) - 12, e = 1 - (1 - f) * (1 - f);
      const wx = px(j0) + (px(j1) - px(j0)) * e, wy = py(j0) + (py(j1) - py(j0)) * e - 10 + Math.round(Math.sin(t * 3 + n) * 1.2);
      const x = Math.round(wx - cx0), y = Math.round(wy - cy0), left = px(j1) < px(j0), fl = Math.floor(t * 14 + n) % 2;
      WGPL.seen.push(cell, n, wx, wy);
      shadow(x, y + 11, 3); ctx.drawImage(wgDflySpr(hash(cell, n, 14) % 3, left, fl), x - 5, y - 4);
    }
  });
  for (let i = WGPL.free.length - 3; i >= 0; i -= 3) { // dragonflies let go dart up and away
    const a = (WGPL.free[i + 2] += 1 / 60); if (a > 1.5) { WGPL.free.splice(i, 3); continue; }
    const x = Math.round(WGPL.free[i] + a * 40 - cx0), y = Math.round(WGPL.free[i + 1] - a * 34 - cy0); ctx.globalAlpha = Math.min(1, (1.5 - a) * 2);
    ctx.drawImage(wgDflySpr(0, false, Math.floor(a * 14) % 2), x - 5, y - 4); ctx.globalAlpha = 1;
  }
};
// The bug net catches a dragonfly drawn near the aim or the hero; one in hand is let go with USE.
const _wgUsePondLife = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel], p = WGS.p;
  if (s && s.id === 'bugnet') {
    const S = WGPL.seen, ax = tx * 16 + 8, ay = ty * 16 + 8; let best = -1, bd = 22;
    const near = (x, y) => Math.min(Math.hypot(x - ax, y - ay), Math.hypot(x - p.x, y - p.y + 10));
    for (let i = 0; i < S.length; i += 4) { const d = near(S[i + 2], S[i + 3]); if (d < bd) { bd = d; best = i; } }
    for (let i = 0, B = WGBUG.seen; best >= 0 && i < B.length; i += 6) if (near(B[i + 3], B[i + 4]) < bd) best = -1; // a butterfly nearer: that one is caught
    if (best >= 0) {
      WGPL.gone.set(S[best] * 4 + S[best + 1], WGS.t + WG_BUG_GONE); p.swing = 0.25;
      wgDrop(p.x, p.y, 'dragonfly', 1); wgToast('CAUGHT: ' + WGI.dragonfly.name); wgSfx('pickup'); wgPart(S[best + 2], S[best + 3], 5, { c: ['w', 'C', 'B'], s: 16, up: 8, life: 0.5 });
      const m = WGS.world.meta; (m.stats || (m.stats = { kills: 0, far: 0 })).dfly = 1; return true;
    }
  }
  if (_wgUsePondLife(tx, ty)) return true;
  if (s && s.id === 'dragonfly') { wgInvTake(WGS.inv, 'dragonfly', 1); WGPL.free.push(p.x, p.y - 14, 0); wgToast('FLY FREE!'); return true; } // let it go
  return false;
};
const _wgTipPondLife = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipPondLife(s);
  if (s.id === 'bugnet') L.push('DRAGONFLIES OVER THE SHALLOWS');
  return L;
};
const _wgBuildPondLife = wgBuildAll;
wgBuildAll = function () {
  _wgBuildPondLife();
  // a blue dragonfly pinned on a card behind glass, in a wooden frame on a little stand
  wgReg('dfly_case', [wgMake('dfly_case', 14, 16, (g) => {
    wgRc(g, 1, 1, 12, 11, 'n'); wgRc(g, 1, 1, 12, 1, 'N'); wgRc(g, 1, 1, 1, 11, 'N'); wgRc(g, 12, 2, 1, 10, 'u'); wgRc(g, 1, 11, 12, 1, 'u');
    wgRc(g, 2, 2, 10, 9, 'A'); wgRc(g, 2, 2, 10, 1, 'w');
    wgPaint(g, 2, 3, ['....BB....', '.cccbBccc.', 'cCCwBBwCCc', '.cccBBccc.', '.cCCbBCCc.', '..ccbBcc..', '....bB....', '.....b....'], { C: 'C', w: 'w', c: 'c', b: 'b', B: 'B' });
    wgRc(g, 6, 12, 2, 3, 'n'); wgRc(g, 4, 14, 6, 1, 'u');
  })]);
};
const _wgIconPondLife = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'dragonfly') return _wgIconPondLife(id);
  const [c, g] = wgCv(16, 16);
  wgPaint(g, 1, 3, ['.CCC.....CCC..', 'CwwwC...CwwwC.', '.CCCCbBBCCCC..', '.....BBc......', '.CCCCbBCCCC...', 'CwwwC.bB.CwwwC', '.CCC..bB..CCC.', '.......b......', '.......b......', '........b.....'], { C: 'C', w: 'w', b: 'b', B: 'B', c: 'c' });
  wgOutline(c); WGA.cache[key] = c; return c;
};
