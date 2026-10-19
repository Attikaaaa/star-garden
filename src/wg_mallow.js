'use strict';
// Wildgrove: marshmallows by the fire. USE a marshmallow on a campfire or a fireplace and the hero holds it over the
// flames on a stick: it goes from white to pale, then golden, then brown, smokes, and catches fire if it is left there.
// USE again, or step away, to pull it out: golden or brown is a TOASTED MARSHMALLOW, too soon is still raw, too late a
// BURNT one. With cookies it makes a MALLOW SANDWICH. The GOLDEN BROWN star for one pulled out just right (the golden
// moment rings a little chime). The toasting is your own, like your pack.
const WG_MALLOW = { pale: 1.2, gold: 2.5, brown: 4, smoke: 5, burn: 5.6 }; // seconds over the fire
(function () {
  wgItem('marshmallow', 'MARSHMALLOW', 'food', { food: 1 }); wgRec('marshmallow', 3, { sugar: 1, egg: 1 }, 'hand');
  wgItem('toasted_mallow', 'TOASTED MARSHMALLOW', 'food', { food: 4 });
  wgItem('burnt_mallow', 'BURNT MARSHMALLOW', 'food', { food: 1 });
  wgItem('mallow_sandwich', 'MALLOW SANDWICH', 'food', { food: 10 }); wgRec('mallow_sandwich', 1, { toasted_mallow: 1, cookies: 1 }, 'hand');
  WG_ACH.push(['mallow', 'GOLDEN BROWN', 'TOAST A MARSHMALLOW JUST RIGHT', (c) => c.st.mallow]);
})();
function wgMallowPull() { // off the stick and into the pack, as it is now
  const M = WGS.mallow; if (!M) return; WGS.mallow = null;
  const k = WGS.t - M.t0, id = k < WG_MALLOW.gold ? 'marshmallow' : k < WG_MALLOW.burn ? 'toasted_mallow' : 'burnt_mallow';
  if (wgInvAdd(WGS.inv, id, 1)) wgDrop(WGS.p.x, WGS.p.y, id, 1);
  if (id === 'marshmallow') wgToast('NOT TOASTED YET');
  else if (id === 'burnt_mallow') { wgToast('OOPS! IT CAUGHT FIRE'); wgPart(M.ex, M.ey, 5, { c: ['o', 'y', 'X'], s: 14, up: 16, life: 0.6 }); wgSfx('heat'); }
  else { if (k < WG_MALLOW.brown) { const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.mallow = 1; } wgToast(k < WG_MALLOW.brown ? 'GOLDEN BROWN!' : 'NICELY TOASTED', 2); wgSfx('pickup'); }
}
const _wgUseMallow = wgUse;
wgUse = function (tx, ty) {
  if (WGS.mallow) { wgMallowPull(); return true; } // any USE while toasting pulls it out
  const s = WGS.inv[WGS.sel], o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (!s || s.id !== 'marshmallow' || !o || o.st !== 'fire') return _wgUseMallow(tx, ty);
  wgInvTake(WGS.inv, 'marshmallow', 1); WGS.mallow = { t0: WGS.t, tx, ty, dim: WGS.dim, x: WGS.p.x, y: WGS.p.y, rang: false, ex: 0, ey: 0 }; wgSfx('select');
  return true;
};
const _wgUpdMallow = updateWG;
updateWG = function (dt) {
  _wgUpdMallow(dt);
  const M = WGS.mallow; if (!M) return;
  const p = WGS.p, o = WGS.world && OBJ[wgObjAt(WGS.world, M.dim, M.tx, M.ty)], k = WGS.t - M.t0;
  if (!p || WGS.dim !== M.dim || !o || o.st !== 'fire' || Math.hypot(p.x - M.x, p.y - M.y) > 3 || p.hp <= 0) { if (p && WGS.world) wgMallowPull(); else WGS.mallow = null; return; } // a step back pulls it
  if (k >= WG_MALLOW.gold && !M.rang) { M.rang = true; wgSfx('chime'); } // the golden moment
  if (k >= WG_MALLOW.smoke && Math.random() < dt * 6) wgPart(M.ex, M.ey - 2, 1, { c: ['X', 'd', 'm'], s: 4, up: 10, g: -10, life: 0.9 });
  if (k >= WG_MALLOW.burn) wgMallowPull();
};
const _wgTipMallow = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipMallow(s);
  if (s.id === 'marshmallow') L.push('USE IT ON A CAMPFIRE TO TOAST IT', 'PULL IT OUT WHEN IT IS GOLDEN');
  return L;
};
// the stick from the hero's hand to just over the flames, and the marshmallow on its tip in the colour of its toasting
const WG_MALLOW_COLS = [[0, 'w', 'L', 'l'], [WG_MALLOW.pale, 'L', 'A', 'a'], [WG_MALLOW.gold, 'A', 'a', 'e'], [WG_MALLOW.brown, 'a', 'N', 'n'], [WG_MALLOW.smoke, 'N', 'n', 'u']]; // from, light, base, shade
const _wgAmbMallow = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbMallow(cx0, cy0);
  const M = WGS.mallow, p = WGS.p; if (!M || !p || M.dim !== WGS.dim || p.hidden) return;
  const fx = M.tx * 16 + 8, fy = M.ty * 16 - 2, dx = fx - p.x, dy = fy - (p.y - 10), d = Math.hypot(dx, dy) || 1;
  const hx = Math.round(p.x + Math.sign(dx || 1) * 4), hy = Math.round(p.y - 10), ex = Math.round(fx - dx / d * 4), ey = Math.round(fy - dy / d * 3 + Math.sin(WGS.t * 3) * 0.6);
  M.ex = ex; M.ey = ey;
  const n = Math.max(Math.abs(ex - hx), Math.abs(ey - hy), 1);
  for (let i = 0; i < n - 1; i++) rect(Math.round(hx + (ex - hx) * i / n) - cx0, Math.round(hy + (ey - hy) * i / n) - cy0, 1, 1, i < 3 ? 'u' : 'n');
  const k = WGS.t - M.t0, C = WG_MALLOW_COLS.filter(c => k >= c[0]).pop(), x = ex - 1 - cx0, y = ey - 1 - cy0;
  rect(x - 1, y, 5, 3, '0'); rect(x, y - 1, 3, 5, '0'); // a soft round pillow, outlined
  rect(x, y, 3, 3, C[2]); rect(x, y, 2, 1, C[1]); rect(x, y + 1, 1, 1, C[1]); rect(x + 2, y + 1, 1, 2, C[3]); rect(x + 1, y + 2, 1, 1, C[3]);
  if (k >= WG_MALLOW.gold && k < WG_MALLOW.brown && Math.floor(WGS.t * 4) % 4 === 0) rect(x + 3, y - 2, 1, 1, 'Y'); // a twinkle: now is the time
};
const _wgDrawPlMallow = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) { // both hands are on the stick: the pack's marshmallow is not shown in one
  if (!WGS.mallow || e.p !== WGS.p) return _wgDrawPlMallow(e, cx0, cy0);
  const H = wgHeld; wgHeld = () => null;
  try { return _wgDrawPlMallow(e, cx0, cy0); } finally { wgHeld = H; }
};
// ---------- icons ----------
const _wgIconMallow = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, look = { marshmallow: ['w', 'l', 'm'], toasted_mallow: ['A', 'a', 'e'], burnt_mallow: ['n', 'u', 'x'] }[id];
  if (WGA.cache[key] || (!look && id !== 'mallow_sandwich')) return _wgIconMallow(id);
  const [c, g] = wgCv(16, 16), K = (a, b, d) => ({ h: a, b, s: d, t: 'n', T: 'N', c: 'o', C: 'O', k: 'u' });
  if (look) { // two short soft cylinders, each outlined on its own: the light top, the side, its shade
    const P = ['.hhhh.', 'hhhhhh', 'bhhhhs', 'bbbbbs', 'bbbbbs', '.ssss.'], one = (x, y) => { const [c1, g1] = wgCv(16, 16); wgPaint(g1, x, y, P, K(...look)); wgOutline(c1); g.drawImage(c1, 0, 0); };
    one(8, 2); one(2, 8);
    if (id === 'burnt_mallow') { wgPx(g, 4, 11, 'x'); wgPx(g, 10, 5, 'x'); wgPx(g, 6, 12, 'n'); }
    if (id === 'toasted_mallow') { wgPx(g, 3, 9, 'A'); wgPx(g, 9, 3, 'A'); }
    WGA.cache[key] = c; return c; // outlined piece by piece already
  } else { // a marshmallow golden between two cookies
    const ck = ['..TTTTTT..', '.TkTTkTTt.', 'TTTTTTkTTt', '.ttttttt..']; // a cookie and its chips
    wgPaint(g, 3, 9, ck, K()); wgPaint(g, 4, 6, ['.AAAAAA.', 'AAaaaaae', '.eeeeee.'], { A: 'A', a: 'a', e: 'e' }); wgPaint(g, 3, 2, ck, K());
  }
  wgOutline(c);
  WGA.cache[key] = c; return c;
};
