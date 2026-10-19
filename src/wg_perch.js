'use strict';
// Wildgrove: a bird on your shoulder. A hero who keeps still outdoors on a dry day for `WG_PERCH_WAIT` s, standing or
// seated (not swimming, riding, rowing or sledding), may have a songbird fly in and settle on a shoulder (wg_farm's
// `wgBirdSpr`), hopping and turning now and then; the first step, a swing of a tool, or the hero gone from where it
// was, sends it off again, and another comes no sooner than `WG_PERCH_AGAIN` s later. Friends' heroes too: every screen
// watches the heroes it shows (`WGPCH.h`, by pid) and draws its own birds, by a `wgDrawPlayer` wrapper. Ambient life,
// off with the option. A bird settling on your own hero counts in `stats.perch` and lights A FRIEND ON YOUR SHOULDER.
const WG_PERCH_WAIT = 14, WG_PERCH_AGAIN = 45, WG_PERCH_FLY = 1.6; // seconds still; between birds; a flight in or out
const WGPCH = { h: new Map(), w: null };
(function () {
  WG_ACH.push(['perch', 'A FRIEND ON YOUR SHOULDER', 'KEEP STILL TILL A BIRD SETTLES ON YOU', (c) => (c.st.perch | 0) > 0]);
})();
function wgPerchOk(q, me) { // may a bird come to this hero now
  if (WGS.dim !== 'o' || q.dim !== undefined && q.dim !== WGS.dim || !wgOpt().amb || WGS.weather || wgNight(WGS.clock) >= 0.3 || q.hidden) return false;
  if (GROUND[wgGround(WGS.world, 'o', Math.floor(q.x / 16), Math.floor(q.y / 16))].liq) return false;
  if (me) return !((typeof wgBikeHeld === 'function' && wgBikeHeld()) || (typeof wgBoatHeld === 'function' && wgBoatHeld()) || (typeof wgSledding === 'function' && wgSledding()));
  return !(q.bike || q.boat || q.sled);
}
function wgPerchTick(key, q, me, dt) {
  let H = WGPCH.h.get(key); if (!H) WGPCH.h.set(key, H = { x: q.x, y: q.y, still: 0, last: -99, b: null });
  const moved = Math.abs(q.x - H.x) + Math.abs(q.y - H.y) > 0.5 || q.moving || q.swing > 0; H.x = q.x; H.y = q.y;
  const B = H.b, T = WGS.t, ok = wgPerchOk(q, me);
  if (moved || !ok) { H.still = 0; if (B && B.s !== 'out') { B.s = 'out'; B.t0 = T; } }
  else H.still += dt;
  if (B && B.s === 'in' && T - B.t0 >= WG_PERCH_FLY) { B.s = 'on'; B.t0 = T; if (me) { const st = WGS.world.meta.stats || (WGS.world.meta.stats = { kills: 0, far: 0 }); st.perch = (st.perch | 0) + 1; wgSfx('cheep'); } }
  if (B && B.s === 'out' && T - B.t0 >= WG_PERCH_FLY) H.b = null;
  if (!H.b && ok && H.still >= WG_PERCH_WAIT && T - H.last >= WG_PERCH_AGAIN) { // one flies in from off to a side
    const h = hash(Math.floor(T), key + 7, 19); H.last = T; H.b = { s: 'in', t0: T, kind: h % 3, side: h & 8 ? 1 : -1 };
  }
}
const _wgUpdPerch = updateWG;
updateWG = function (dt) {
  _wgUpdPerch(dt);
  const w = WGS.world, p = WGS.p; if (WGPCH.w !== w) { WGPCH.w = w; WGPCH.h.clear(); }
  if (!w || !p || WGS.scr !== 'play') return;
  wgPerchTick(-1, p, true, dt);
  for (const q of WGS.remote || []) wgPerchTick(q.pid, q, false, dt);
  if (WGPCH.h.size > 12) for (const k of WGPCH.h.keys()) if (k !== -1 && !(WGS.remote || []).some(q => q.pid === k)) WGPCH.h.delete(k);
};
function wgPerchSpot(p) { // the shoulder in the world: [x, y, facing left]
  const side = p.face === 'l' ? 1 : p.face === 'r' ? -1 : 1, seated = p.sit || p.face === 'S';
  return [p.x + side * (p.face === 'l' || p.face === 'r' ? 3 : 6), p.y - (seated ? 13 : 15), p.face === 'l']; // feet at the arm's top, clear of the face
}
const _wgDrawPlayerPerch = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  _wgDrawPlayerPerch(e, cx0, cy0);
  const p = e.p, H = WGPCH.h.get(p === WGS.p ? -1 : p.pid), B = H && H.b; if (!B || p.hidden) return;
  const [x, y, left] = wgPerchSpot(p), T = WGS.t, u = Math.min(1, (T - B.t0) / WG_PERCH_FLY);
  let bx = x, by = y, fly = false, fl = left;
  if (B.s !== 'on') { // along an arc from off to one side, or back out to it
    const k = B.s === 'in' ? 1 - u : u, ox = B.side * 130 * k, oy = -70 * k - Math.sin(k * Math.PI) * 18;
    bx = x + ox; by = y + oy; fly = k > 0.02; fl = B.side > 0 ? B.s === 'in' : B.s !== 'in';
  } else { // settled: a hop and a turn now and then
    const ph = (T - B.t0 + B.kind) % 5; if (ph > 4.6) by -= 1; if (Math.floor((T - B.t0 + B.kind * 2) / 3.5) % 2) fl = !fl;
  }
  const S = wgBirdSpr(B.kind, fl), sx = Math.round(bx - cx0) - 4, sy = Math.round(by - cy0) - 6;
  if (fly) { ctx.globalAlpha = 0.5; shadow(Math.round(bx - cx0), Math.round(y - cy0 + 16), 4); ctx.globalAlpha = 1; }
  ctx.drawImage(S, sx, sy);
  if (fly && Math.floor(T * 12) % 2) { rect(sx + 3, sy - 1, 1, 1, '0'); rect(sx + 5, sy - 1, 1, 1, '0'); rect(sx + 3, sy, 3, 1, B.kind === 0 ? 'B' : 'n'); } // a wingbeat
};
