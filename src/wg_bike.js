'use strict';
// Wildgrove: the bicycle. Held in hand on dry ground the hero rides it, half again as fast and quicker still on a path
// (capped, so the world keeps up), the wheels turning and the feet on the pedals; USE rings the bell. Seated, wading or
// on the water the hero walks it as before. Friends see you ride: a guest sends 'bk' in the 'p' message, the host lists
// it in 'ps'. The FREEWHEELING star after 300 tiles ridden.
const WG_BIKE = 1.5, WG_BIKE_MAX = 1.8; // what a bicycle multiplies the ground's speed by, and the most it ever comes to
(function () {
  wgItem('bicycle', 'BICYCLE', 'res', { stack: 1 }); wgRec('bicycle', 1, { iron: 3, leather: 2, string: 2 }, 'anvil');
  WG_ACH.push(['bike', 'FREEWHEELING', 'RIDE A BICYCLE 300 TILES', (c) => (c.st.bike | 0) >= 300]);
})();
const wgBikeHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!(s && s.id === 'bicycle'); };
const wgCanRide = (p) => !p.sit && p.face !== 'S' && !GROUND[wgGround(WGS.world, WGS.dim, Math.floor(p.x / 16), Math.floor(p.y / 16))].liq;
// Riding: the ground under the hero is quicker while the hero's move runs, then put back (only the hero reads it).
const _wgUpdBike = updateWG;
updateWG = function (dt) {
  const p = WGS.p, ride = WGS.scr === 'play' && p && WGS.world && wgBikeHeld() && wgCanRide(p);
  if (!ride) return _wgUpdBike(dt);
  const g = GROUND[wgGround(WGS.world, WGS.dim, Math.floor(p.x / 16), Math.floor(p.y / 16))], s0 = g.speed, x0 = p.x, y0 = p.y;
  g.speed = Math.min(WG_BIKE_MAX, s0 * WG_BIKE);
  try { _wgUpdBike(dt); } finally { g.speed = s0; }
  const d = Math.hypot(p.x - x0, p.y - y0); if (d > 0 && d < 8) { const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.bike = Math.min(99999, (st.bike || 0) + d / 16); }
};
const _wgUseBike = wgUse;
wgUse = function (tx, ty) {
  if (_wgUseBike(tx, ty)) return true;
  if (!wgBikeHeld()) return false;
  const t = WGS.t, b = WGS.bellT; if (b === undefined || t - b > 0.6 || t < b) { WGS.bellT = t; wgSfx('bell3'); setTimeout(() => wgSfx('bell2'), 130); wgToast('RING RING!', 1); } // ring ring
  return true;
};
const _wgTipBike = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipBike(s);
  if (s.id === 'bicycle') L.push('HOLD IT TO RIDE ON DRY GROUND', 'QUICKER STILL ON A PATH', 'USE RINGS THE BELL');
  return L;
};

// ---------- art: the frame side on (facing left, its bottom bracket at 13,13), a wheel side on, the arm on the grips ----------
function wgBikeArt(k) {
  const key = 'bike_' + k; if (WGA.cache[key]) return WGA.cache[key];
  let c;
  if (k === 'side') c = wgMake('bike_side', 28, 20, (g) => { // a red city bike: a tall stem, a brown saddle
    wgLine(g, 8, 8, 5, 15, 'r'); wgLine(g, 9, 9, 13, 15, 'r'); wgLine(g, 17, 8, 13, 15, 'r'); wgLine(g, 18, 8, 21, 15, 'r'); wgLine(g, 13, 15, 21, 15, 'r');
    wgLine(g, 9, 8, 17, 8, 'R'); wgPx(g, 8, 8, 'R'); wgLine(g, 8, 3, 8, 7, 'X'); wgRc(g, 6, 3, 4, 1, 'X'); wgRc(g, 6, 3, 2, 1, 'x');
    wgRc(g, 15, 6, 5, 1, 'u'); wgRc(g, 15, 6, 3, 1, 'n'); wgPx(g, 17, 7, 'X');
  });
  else if (k === 'w0' || k === 'w1') { // a two-pixel tyre lit at its top left, the spokes turning between two frames
    const [cc, g] = wgCv(11, 11); c = cc;
    wgPaint(g, 0, 0, ['...00000...', '.00XXXXX00.', '.0XX...xx0.', '0X.......x0', '0X.......x0', '0X.......x0', '0x.......x0', '0x.......x0', '.0xx...xx0.', '.00xxxxx00.', '...00000...'], { X: 'X', x: 'x', 0: '0' });
    wgPaint(g, 3, 3, k === 'w0' ? ['..l..', '..l..', 'llmll', '..l..', '..l..'] : ['l...l', '.l.l.', '..m..', '.l.l.', 'l...l'], { m: 'm', l: 'l' });
  }
  WGA.cache[key] = c; return c;
}
function wgRiderSpr(look) { // the hero side on, the hanging arm reaching forward to the grips instead
  const key = ['ride', look.skin, look.hair, look.shirt, look.hat | 0].join('_'); if (WGA.cache[key]) return WGA.cache[key];
  const base = wgPlayerSpr('l', 0, look), [c, g] = wgCv(18, 26), [a, ag] = wgCv(18, 26), sh = WG_SHIRT[look.shirt % 5], sk = WG_SKIN[look.skin % 3];
  g.drawImage(base, 0, 0);
  wgRc(g, 6, 10, 7, 8, sh[1]); wgRc(g, 6, 10, 7, 1, sh[2]); wgRc(g, 6, 10, 1, 8, sh[2]); wgRc(g, 12, 11, 1, 7, sh[0]); wgRc(g, 6, 17, 7, 1, sh[0]); wgRc(g, 6, 15, 7, 1, 'u'); wgPx(g, 9, 15, 'y'); // the tunic again, as wg_art2 paints it
  wgRc(ag, 3, 12, 7, 2, sh[1]); wgRc(ag, 3, 12, 7, 1, sh[2]); wgRc(ag, 1, 13, 2, 2, sk[1]); wgOutline(a); // the arm with its own outline...
  g.drawImage(a, 0, 0, 6, 26, 0, 0, 6, 26); // ...where it reaches out in front of the body
  wgRc(g, 6, 12, 4, 1, sh[2]); wgRc(g, 6, 13, 4, 1, sh[1]); wgRc(g, 6, 14, 4, 1, sh[0]); // and over it, unoutlined, shaded below
  WGA.cache[key] = c; return c;
}
// ---------- the hero on a bicycle, for every hero who rides one ----------
const _wgDrawPlayerBike = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p;
  if (p.hidden || !(p === WGS.p ? wgBikeHeld() : p.bike) || !wgCanRide(p)) return _wgDrawPlayerBike(e, cx0, cy0);
  const sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0), side = p.face === 'l' || p.face === 'r', look = p.look || { skin: 0, hair: 0, shirt: 0 };
  const a = p.moving ? p.walkT * 0.9 : 0.6, spoke = p.moving ? Math.floor(p.walkT * 2) % 2 : 0, sk = WG_SKIN[(look.skin | 0) % 3];
  shadow(sx, sy, side ? 16 : 7);
  if (p.inv > 0 && Math.floor(WGS.t * 20) % 2) return;
  ctx.save(); ctx.translate(sx, sy); if (p.face === 'r') ctx.scale(-1, 1);
  if (side) { // local: the feet line at 0, the wheels' hubs at -8,-5 and 8,-5, the bottom bracket at 0,-5, the saddle at 4,-13
    const W = wgBikeArt('w' + spoke), H = [4, -13], B = [0, -5], L1 = 5.5, L2 = 5.5;
    ctx.drawImage(wgBikeArt('side'), -13, -20); ctx.drawImage(W, -13, -10); ctx.drawImage(W, 3, -10);
    ctx.drawImage(wgRiderSpr(look), 0, 0, 18, 18, -5, -30, 18, 18);
    const P = [B[0] + Math.cos(a) * 2.5, B[1] + Math.sin(a) * 2.5], d = Math.min(Math.hypot(P[0] - H[0], P[1] - H[1]), L1 + L2 - 0.2), r = Math.atan2(P[1] - H[1], P[0] - H[0]);
    const k = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))), K = [H[0] + Math.cos(r - k) * L1, H[1] + Math.sin(r - k) * L1], K2 = [H[0] + Math.cos(r + k) * L1, H[1] + Math.sin(r + k) * L1], N = K[0] < K2[0] ? K : K2, F = [H[0] + Math.cos(r) * d, H[1] + Math.sin(r) * d];
    const seg = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) rect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 2, 2, 'u'); };
    rect(Math.round(B[0] - Math.cos(a) * 2.5), Math.round(B[1] - Math.sin(a) * 2.5), 2, 1, 'X'); // the far pedal
    seg(H[0] - 1, H[1], N[0], N[1]); seg(N[0], N[1], F[0], F[1]); rect(Math.round(F[0]) - 2, Math.round(F[1]) + 1, 4, 2, 'x'); rect(Math.round(F[0]) - 2, Math.round(F[1]) + 1, 1, 1, 'X'); // the near leg, knee forward, a boot on the pedal
  } else { // end on: the wheel between the feet, the red fork, a mudguard with a lamp (coming) or a red light (going)
    const up = p.face === 'u', dy = Math.round(Math.sin(a) * 2), bar = () => { rect(-8, -11, 16, 3, '0'); rect(-7, -10, 14, 1, 'X'); rect(-8, -10, 2, 1, 'x'); rect(6, -10, 2, 1, 'x'); };
    if (up) bar();
    ctx.drawImage(wgPlayerSpr(p.face, 0, look), 0, 0, 18, 18, -9, -26, 18, 18);
    for (const [x, h] of [[-5, dy], [3, -dy]]) { rect(x, -9, 2, 6 + h, 'u'); rect(x - 1, -3 + h, 4, 2, 'x'); }
    rect(-2, -10, 5, 11, '0'); rect(-1, -7, 3, 8, 'x'); rect(-1, -7, 1, 7, 'X'); rect(-1, -9, 3, 2, 'L'); rect(-1, -9, 1, 1, 'w'); rect(-3, -9, 1, 4, 'r'); rect(3, -9, 1, 4, 'r');
    if (up) rect(0, -9, 1, 1, 'r'); else { bar(); rect(-6, -10, 2, 2, sk[1]); rect(4, -10, 2, 2, sk[1]); rect(0, -8, 1, 1, 'Y'); } // hands on the grips, the lamp
  }
  ctx.restore();
  if (p.name && p !== WGS.p) wgRawText(p.name, sx, sy - (side ? 36 : 32), 'w', 2, 1);
};
const _wgIconBike = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'bicycle') return _wgIconBike(id);
  const [c, g] = wgCv(16, 16); // side on like the ride: two wheels, the red frame over them, outlined as one
  for (const x of [0, 10]) wgPaint(g, x, 9, ['.XXXX.', 'Xllllx', 'Xlmmlx', 'Xlmmlx', 'xllllx', '.xxxx.'], { X: 'X', x: 'x', l: 'l', m: 'm' });
  wgLine(g, 4, 6, 3, 11, 'r'); wgLine(g, 5, 8, 7, 12, 'r'); wgLine(g, 10, 6, 7, 12, 'r'); wgLine(g, 11, 7, 12, 11, 'r'); wgLine(g, 7, 12, 12, 12, 'r');
  wgLine(g, 5, 7, 10, 7, 'R'); wgPx(g, 4, 6, 'R'); wgLine(g, 4, 3, 4, 5, 'X'); wgRc(g, 2, 3, 3, 1, 'X'); wgPx(g, 2, 3, 'x'); wgRc(g, 9, 5, 4, 1, 'u'); wgRc(g, 9, 5, 2, 1, 'n');
  wgOutline(c);
  WGA.cache[key] = c; return c;
};
