'use strict';
// Wildgrove: animals asleep at night, and a pat for them by day. In the deep of the night (`wgNight` over
// `WG_ZZ_NIGHT`) cows, sheep, chickens, deer and rabbits (`WG_SLEEPERS`) settle down where they stand and sleep, a z
// drifting up now and then over the dark; a hero coming within `WG_ZZ_WAKE` px wakes one, and a fright or a hurt too. It happens
// where the creatures are simulated (a `wgUpdateMobs` wrapper takes back a sleeper's step) and the sleep rides at
// index 10 of the `mobs` message, so a guest sees them sleep. USE with an empty hand on a bare tile beside one of
// them pats it: a heart floats up and it wiggles (this screen's own). The GENTLE HANDS star for a cow, a sheep and a
// chicken.
const WG_SLEEPERS = ['cow', 'sheep', 'chicken', 'deer', 'rabbit'], WG_ZZ_NIGHT = 0.55, WG_ZZ_WAKE = 30;
const WGZZ = { list: [] }; // this frame's z's, screen x, y and alpha: drawn over the dark
(function () {
  WG_ACH.push(['pat', 'GENTLE HANDS', 'PAT A COW, A SHEEP AND A CHICKEN', (c) => ((c.st.pat | 0) & 7) === 7]);
})();
function wgZzAwake(m) { // whether a creature stays awake now: by day, near a hero, frightened, hurt or a companion
  if (WGS.dim !== 'o' || m.dim !== 'o' || m.pet || m.fear > 0 || m.hurt > 0 || wgNight(WGS.clock) < WG_ZZ_NIGHT) return true;
  return [WGS.p].concat(WGS.remote || []).some(q => q && !q.hidden && (q === WGS.p || q.dim === 'o') && Math.hypot(q.x - m.x, q.y - m.y) < WG_ZZ_WAKE);
}
const _wgUpdMobsZz = wgUpdateMobs;
wgUpdateMobs = function (dt) {
  if (!wgSimHere()) return _wgUpdMobsZz(dt);
  const held = []; for (const m of WGS.mobs) if (m.zz) held.push([m, m.x, m.y]);
  _wgUpdMobsZz(dt);
  for (const [m, x, y] of held) if (!wgZzAwake(m)) { m.x = x; m.y = y; m.vx = m.vy = 0; m.fr = 0; } // asleep: it stays put
  for (const m of WGS.mobs) m.zz = WG_SLEEPERS.includes(m.type) && !wgZzAwake(m) ? 1 : 0;
};
// the sleep goes out with the creatures, and a guest reads it
const _wgnSendZz = wgnSend;
wgnSend = function (L, msg, u) {
  if (msg && msg.t === 'mobs' && Array.isArray(msg.l)) for (const m of WGS.mobs) if (m.zz) { const a = msg.l.find(q => q[0] === m.id); if (a) a[10] = 1; }
  return _wgnSendZz(L, msg, u);
};
const _wgnMobsZz = wgnMobs;
wgnMobs = function (list) {
  _wgnMobsZz(list);
  const zz = new Map(); for (const a of list) if (Array.isArray(a)) zz.set(a[0], a[10] === 1 ? 1 : 0);
  for (const m of WGS.mobs) m.zz = zz.get(m.id) || 0;
};
// a pat: with an empty hand on a bare tile beside one of them (a companion is wg_pets' own)
const _wgUsePat = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel], t = WGS.t;
  const m = !s && WGS.world && !wgObjAt(WGS.world, WGS.dim, tx, ty) && wgMobAt(tx, ty, (q) => !q.pet && WG_SLEEPERS.includes(q.type));
  if (!m) return _wgUsePat(tx, ty);
  if ((m.patT || 0) > t) return true;
  m.patT = t + 0.6; m.patAt = t; wgSfx('select');
  const k = ['cow', 'sheep', 'chicken'].indexOf(m.type);
  if (k >= 0) { const st = WGS.world.meta.stats || (WGS.world.meta.stats = { kills: 0, far: 0 }); st.pat = (st.pat | 0) | (1 << k); }
  return true;
};
// drawn: a sleeper lies still with a slow breath and a z drifting up; a patted one wiggles under a floating heart
const _wgDrawMobZz = wgDrawMob;
wgDrawMob = function (e, cx0, cy0) {
  const m = e.m, t = WGS.t, pat = !m.pet && m.patAt !== undefined && t - m.patAt < 1.2 && t >= m.patAt;
  if (!m.zz && !pat) return _wgDrawMobZz(e, cx0, cy0);
  const y = m.y, fr = m.fr, f = m.flip;
  if (m.zz) { m.y += Math.floor(t / 1.6 + (m.id | 0) * 0.37) % 2; m.fr = 0; } // a slow breath, each on its own beat
  if (pat && m.patT > t) m.flip = Math.floor(t * 10) % 2 === 1;
  try { _wgDrawMobZz(e, cx0, cy0); } finally { m.y = y; m.fr = fr; m.flip = f; }
  const sx = Math.round(m.x - cx0), sy = Math.round(m.y - cy0), d = WG_MOBS[m.type];
  if (pat) { const k = (t - m.patAt) / 1.2; ctx.globalAlpha = 1 - k * k; ctx.drawImage(wgPetHeart(), Math.round(sx - 3 + Math.sin(k * 7) * 1.5), Math.round(sy - 12 - d.h * 2 - k * 12)); ctx.globalAlpha = 1; }
  if (m.zz && WGZZ.list.length < 64) { // one z at a time, drifting up from the head's side
    const u = (t / 3 + (m.id | 0) * 0.29) % 1, s = m.flip ? 1 : -1;
    WGZZ.list.push([sx + s * (d.w + Math.round(u * 4)) - 2, sy - 9 - d.h * 2 - Math.round(u * 9), u < 0.7 ? 1 : (1 - u) / 0.3]);
  }
};
const _wgLightZz = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  _wgLightZz(cx0, cy0);
  for (const [x, y, a] of WGZZ.list) { ctx.globalAlpha = a * 0.85; rect(x, y, 4, 1, 'w'); rect(x + 2, y + 1, 1, 1, 'w'); rect(x + 1, y + 2, 1, 1, 'w'); rect(x, y + 3, 4, 1, 'w'); }
  ctx.globalAlpha = 1; WGZZ.list.length = 0;
};
