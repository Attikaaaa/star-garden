'use strict';
// Wildgrove: the frog drops by. On one day in `WG_VISIT_ONE` (`wgFrogVisits`, from the day and the seed, so every screen
// agrees) the frog who writes the letters sits beside a mailbox from mid-morning to late afternoon. The mailboxes in view
// are looked over twice a second (`wgFrogLook`: the one whose tile hashes lowest that day, the frog on a free tile beside
// it, `WGFV.spot`), and the frog is slotted into the depth order by a `wgEntities` wrapper, breathing and turning to the
// nearest hero. USE on it gets a word in a bubble (`WG_FROG_TALK`, drawn after the dark by a `wgDrawSigns` wrapper) and,
// once a visit, a gift from `WG_GIFTS` (each hero's own, the day kept in `w.meta.frogv`); a heart bobs over it while the
// gift waits. GOOD NEIGHBOURS after three visits (`stats.frogv`). Each screen draws its own frog.
const WG_VISIT_FROM = 0.3, WG_VISIT_TO = 0.7, WG_VISIT_ONE = 4, WG_VISIT_SAY = 4; // the hours of a visit; one day in this many; seconds a word shows
const WG_FROG_TALK = ['JUST PASSING BY!', 'WHAT A LOVELY HOME!', 'I CAME TO SAY HELLO.', 'DID YOU GET MY LETTER?', 'THE POND SAYS HI.', 'TEA LATER? MY TREAT.', 'I LOVE A GOOD WALK.', 'YOUR FLOWERS LOOK HAPPY.'];
const WGFV = { spot: null, t: 0, say: null, n: 0, told: -1, w: null };
(function () {
  WG_ACH.push(['frogv', 'GOOD NEIGHBOURS', 'GREET THE FROG ON THREE VISITS', (c) => (c.st.frogv | 0) >= 3]);
})();
const wgFrogDay = () => hash(WGS.day | 0, WGS.world.seed | 0, 97) % WG_VISIT_ONE === 0;
const wgFrogVisits = () => !!WGS.world && WGS.dim === 'o' && wgFrogDay() && WGS.clock >= WG_VISIT_FROM && WGS.clock < WG_VISIT_TO;
const wgFrogGift = () => WGS.world.meta.frogv !== (WGS.day | 0);
function wgFrogLook() { // the mailboxes in view: the frog sits beside the one that hashes lowest today
  const w = WGS.world, cx = Math.floor(WGS.cam.x / 16), cy = Math.floor(WGS.cam.y / 16); let best = null, bh = 0;
  for (let ty = cy - 9; ty <= cy + 9; ty++) for (let tx = cx - 14; tx <= cx + 14; tx++) {
    const id = wgObjAt(w, 'o', tx, ty); if (!id || !OBJ[id].mail) continue;
    const h = hash(tx, ty, WGS.day | 0); if (best && h >= bh) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) {
      const g = GROUND[wgGround(w, 'o', tx + dx, ty + dy)];
      if (!wgObjAt(w, 'o', tx + dx, ty + dy) && g && !g.liq) { best = { tx: tx + dx, ty: ty + dy }; bh = h; break; }
    }
  }
  return best;
}
const _wgUpdVisit = updateWG;
updateWG = function (dt) {
  _wgUpdVisit(dt);
  const w = WGS.world, p = WGS.p; if (WGFV.w !== w) { WGFV.w = w; WGFV.spot = null; WGFV.say = null; WGFV.told = -1; }
  if (!w || !p || WGS.scr !== 'play') return;
  if ((WGFV.t -= dt) > 0) return; WGFV.t = 0.5;
  const was = WGFV.spot; WGFV.spot = wgFrogVisits() ? wgFrogLook() : null;
  if (was && !WGFV.spot && WGS.dim === 'o' && !wgFrogVisits()) wgPart(was.tx * 16 + 8, was.ty * 16 + 10, 8, { c: ['G', 'h', 'H'], s: 30, up: 16 }); // off home with a hop
  const S = WGFV.spot;
  if (S && WGFV.told !== (WGS.day | 0) && Math.hypot(S.tx * 16 + 8 - p.x, S.ty * 16 + 8 - p.y) < 140) { WGFV.told = WGS.day | 0; wgToast('THE FROG IS VISITING!', 3); }
};
const _wgUseVisit = wgUse;
wgUse = function (tx, ty) {
  const S = WGFV.spot; if (!S || S.tx !== tx || S.ty !== ty || !wgFrogVisits() || wgObjAt(WGS.world, WGS.dim, tx, ty)) return _wgUseVisit(tx, ty);
  const w = WGS.world, day = WGS.day | 0, p = WGS.p;
  WGFV.say = { s: WG_FROG_TALK[(hash(day, w.seed | 0, 41) + WGFV.n++) % WG_FROG_TALK.length], t0: WGS.t }; wgSfx('croak');
  if (wgFrogGift()) {
    const g = WG_GIFTS[hash(day, w.seed | 0, 131) % WG_GIFTS.length], left = wgInvAdd(WGS.inv, g[0], g[1]); if (left) wgDrop(p.x, p.y, g[0], left);
    w.meta.frogv = day; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.frogv = (st.frogv | 0) + 1;
    wgToast('A LITTLE GIFT FOR YOU', 3); wgSfx('pickup'); wgPart(tx * 16 + 8, ty * 16 - 4, 6, { c: ['r', 'R', 'q'], s: 24, up: 18 });
  }
  return true;
};
const _wgEntsVisit = wgEntities;
wgEntities = function (x0, y0, x1, y1) {
  const out = _wgEntsVisit(x0, y0, x1, y1), S = WGFV.spot;
  if (S && wgFrogVisits() && !wgObjAt(WGS.world, WGS.dim, S.tx, S.ty)) out.push({ x: S.tx * 16 + 8, y: S.ty * 16 + 13, draw: wgFrogDraw });
  return out;
};
function wgFrogDraw(e, cx0, cy0) { // breathing now and then, turned to the nearest hero, a heart over it while the gift waits
  const sx = Math.round(e.x - cx0), sy = Math.round(e.y - cy0), T = WGS.t, q = [WGS.p].concat(WGS.remote || []).filter(h => h && h.dim === WGS.dim).sort((a, b) => Math.abs(a.x - e.x) + Math.abs(a.y - e.y) - Math.abs(b.x - e.x) - Math.abs(b.y - e.y))[0];
  shadow(sx, sy, 12); drawFeet(S(T % 1.6 < 0.3 ? 'frog_1' : 'frog_0'), sx, sy + 2, q && q.x > e.x + 2 ? 1 : 0);
  if (wgFrogGift()) ctx.drawImage(wgFrogHeart(), sx - 3, sy - 22 + Math.round(Math.sin(T * 3) * 1.5));
}
function wgFrogHeart() { // a small red heart
  return WGA.cache.frogv_heart || wgMake('frogv_heart', 7, 6, (g) => { wgRc(g, 1, 1, 2, 2, 'r'); wgRc(g, 4, 1, 2, 2, 'r'); wgRc(g, 1, 2, 5, 1, 'r'); wgRc(g, 2, 3, 3, 1, 'r'); wgPx(g, 3, 4, 'r'); wgPx(g, 1, 1, 'R'); });
}
const _wgSignsVisit = wgDrawSigns;
wgDrawSigns = function (cx0, cy0) { // the frog's word, over the dark like a sign's
  _wgSignsVisit(cx0, cy0);
  const W = WGFV.say, S = WGFV.spot; if (!W || !S || WGS.scr !== 'play' || WGS.photo) return;
  const u = WGS.t - W.t0; if (u > WG_VISIT_SAY || u < 0 || !wgFrogVisits()) { WGFV.say = null; return; }
  const w = textW(W.s, 0) + 8, h = 13, x = Math.round(S.tx * 16 + 8 - cx0 - w / 2), y = Math.round(S.ty * 16 - cy0 - 14 - h);
  ctx.globalAlpha = u > WG_VISIT_SAY - 0.5 ? 0.5 : 1;
  rect(x + 1, y, w - 2, h, '0'); rect(x, y + 1, w, h - 2, '0'); rect(x + 1, y + 1, w - 2, h - 2, 'w'); rect(x + 2, y + h - 2, w - 4, 1, 'l');
  rect(x + (w >> 1) - 2, y + h, 5, 1, '0'); rect(x + (w >> 1) - 1, y + h + 1, 3, 1, '0'); rect(x + (w >> 1) - 1, y + h - 1, 3, 1, 'w'); rect(x + (w >> 1), y + h, 1, 1, 'w');
  wtext(W.s, x + w / 2, y + 3, '1', 0, 1);
  ctx.globalAlpha = 1;
};
const _wgTipVisit = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipVisit(s), it = WGI[s.id], o = it && it.place && OBJ[O_ID[it.place]];
  if (o && o.mail) L.push('THE FROG DROPS BY NOW AND THEN');
  return L;
};
