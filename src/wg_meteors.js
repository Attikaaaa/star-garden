'use strict';
// Wildgrove: meteor showers. On one summer night in three and the odd autumn one (`wgMeteorTonight`, the night counted
// from its evening, with the seed, so every screen has the same nights) shooting stars streak down the sky every second
// or so, all from the same side that night (`WGMT.list`, each screen its own, at most `WG_MT_MAX`), drawn on the sky by a
// `wgDrawWeatherFX` wrapper while `WGMT.k` fades in with the dark, out under weather, underground and with the weather
// effects off. Once a shower night a big one comes down near the hero (`wgMeteorFall`, each hero's own, kept in
// `w.meta.mfall`): a flash and a star shard on the ground that glows till it is picked up (a `wgDrawLight` wrapper).
// A star shard makes a star lamp. The SHOOTING STARS star for seeing a shower.
const WG_MT_MAX = 4, WG_MT_FALL = 0.9; // streaks at once; seconds the big one takes to come down
const WGMT = { k: 0, list: [], next: 0, fall: null };
(function () {
  wgItem('star_shard', 'STAR SHARD', 'res', {});
  wgObj('star_lamp', { name: 'STAR LAMP', kind: 'light', tool: 'hand', hp: 2, anim: 1, light: 48, drops: [DR('star_lamp', 1, 1)] });
  wgItem('star_lamp', 'STAR LAMP', 'place', { place: 'star_lamp' }); PLACE.star_lamp = 'star_lamp'; wgRec('star_lamp', 1, { star_shard: 1, glass: 2, copper: 1 }, 'bench');
  WG_ACH.push(['meteors', 'SHOOTING STARS', 'WATCH A METEOR SHOWER', (c) => (c.st.meteors | 0) > 0]);
})();
function wgMeteorTonight() {
  if (!WGS.world) return false;
  const n = wgGazeNight(), s = Math.floor(n / 8) % 4, h = hash(n, WGS.world.seed | 0, 131); // the evening's season, as wgSeason counts
  return s === 1 ? h % 3 === 0 : s === 2 ? h % 8 === 0 : false;
}
const wgMeteorDir = () => hash(wgGazeNight(), WGS.world.seed | 0, 7) & 1 ? 1 : -1; // the side they all come from tonight
function wgMeteorFall() { // pick a bare tile a few steps from the hero for the big one
  const w = WGS.world, p = WGS.p, d = wgMeteorDir();
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * 6.283, r = 3 + Math.random() * 3, tx = Math.floor(p.x / 16 + Math.cos(a) * r), ty = Math.floor(p.y / 16 + Math.sin(a) * r * 0.7);
    const gr = GROUND[wgGround(w, 'o', tx, ty)];
    if (wgObjAt(w, 'o', tx, ty) || !gr || gr.liq) continue;
    WGMT.fall = { x: tx * 16 + 8, y: ty * 16 + 10, d, t: 0 }; w.meta.mfall = wgGazeNight(); wgSfx('comet'); return true;
  }
  return false;
}
const _wgUpdMeteor = updateWG;
updateWG = function (dt) {
  _wgUpdMeteor(dt);
  const w = WGS.world, on = w && WGS.dim === 'o' && wgOpt().wx && !WGS.weather && wgMeteorTonight();
  const want = on ? wgClamp(wgNight(WGS.clock) * 1.6 - 0.3, 0, 1) : 0;
  WGMT.k += (want - WGMT.k) * Math.min(1, dt * 0.5); if (Math.abs(want - WGMT.k) < 0.01) WGMT.k = want;
  const L = WGMT.list; for (let i = L.length - 1; i >= 0; i--) if ((L[i].t += dt) >= L[i].life) L.splice(i, 1);
  if (WGMT.k > 0.3 && (WGMT.next -= dt) <= 0) {
    WGMT.next = (0.3 + Math.random() * 1.0) / WGMT.k;
    if (L.length < WG_MT_MAX) { const d = wgMeteorDir(); L.push({ x: -SCR.ox + Math.random() * SCR.w, y: -SCR.oy + 4 + Math.random() * SCR.h * 0.4, d, t: 0, life: 0.35 + Math.random() * 0.3, len: 7 + (Math.random() * 6 | 0) }); }
  }
  if (!w || WGS.scr !== 'play') return;
  if (WGMT.k > 0.6) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); if (!st.meteors) { st.meteors = 1; wgToast('A METEOR SHOWER!', 3); } }
  if (WGMT.k > 0.8 && !WGMT.fall && w.meta.mfall !== wgGazeNight() && Math.random() < dt / 40) wgMeteorFall();
  const F = WGMT.fall; if (!F || (F.t += dt) < WG_MT_FALL) return;
  WGMT.fall = null; if (WGS.dim !== 'o') return; // gone below: it falls unseen
  wgPart(F.x, F.y - 4, 12, { c: ['Y', 'y', 'w', 'O'], s: 44, up: 34, life: 0.6 }); wgSfx('land'); wgSfx('star');
  wgDrop(F.x, F.y, 'star_shard', 1, { keep: true }); wgToast('A STAR FELL NEARBY!', 2.5);
};
const _wgFxMeteor = wgDrawWeatherFX;
wgDrawWeatherFX = function () {
  _wgFxMeteor();
  if (WGS.dim !== 'o' || !wgOpt().wx) return;
  for (const m of WGMT.list) { // a white head and a cooling tail on a clean two-to-one slope
    const u = m.t / m.life, hx = Math.round(m.x + m.d * 180 * m.t), hy = Math.round(m.y) + (Math.abs(hx - Math.round(m.x)) >> 1), len = Math.min(m.len, Math.round(m.t * 60));
    ctx.globalAlpha = Math.ceil((u > 0.7 ? (1 - u) / 0.3 : 1) * Math.min(1, WGMT.k * 1.5) * 4) / 4; if (!ctx.globalAlpha) continue;
    for (let j = 0; j <= len; j++) { const k = j / Math.max(1, len); if (k > 0.6 && j & 1) continue; rect(hx - m.d * j, hy - (j >> 1), 1, 1, j === 0 ? 'w' : k < 0.3 ? 'C' : k < 0.6 ? 'c' : 'B'); }
  }
  ctx.globalAlpha = 1;
  const F = WGMT.fall; if (!F) return;
  const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, r = Math.round(110 * (1 - F.t / WG_MT_FALL)); // the big one, warmer, on a steeper slope
  const hx = F.x - F.d * r - cx0, hy = F.y - 4 - r - cy0;
  for (let j = 18; j >= 1; j--) if (!(j > 11 && j & 1)) rect(hx - F.d * j, hy - j, 1, 1, j < 5 ? 'Y' : j < 11 ? 'y' : 'O');
  rect(hx - 1, hy - 1, 2, 2, 'w'); rect(hx - 1, hy - 2, 2, 1, 'Y'); rect(hx - 2, hy - 1, 1, 2, 'Y');
};
const _wgLightMeteor = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  for (const d of WGS.drops) if (d.id === 'star_shard' && d.dim === WGS.dim) WGR.lights.push({ x: d.x - cx0, y: d.y - d.z - cy0, r: 18, f: 0.3 });
  _wgLightMeteor(cx0, cy0);
  for (const d of WGS.drops) if (d.id === 'star_shard' && d.dim === WGS.dim && Math.sin(WGS.t * 3 + d.x) > 0.4) { // a twinkle over the dark
    const x = Math.round(d.x - cx0), y = Math.round(d.y - d.z - cy0) - 9; rect(x, y - 1, 1, 3, 'Y'); rect(x - 1, y, 3, 1, 'Y'); rect(x, y, 1, 1, 'w');
  }
};
function wgMeteorArt(k) { // the shard (a four-pointed star lit from the top left) and the lamp's frames
  const key = 'mt_' + k; if (WGA.cache[key]) return WGA.cache[key];
  if (k === 'shard') return wgMake(key, 13, 13, (g) => {
    for (let y = 1; y < 12; y++) for (let x = 1; x < 12; x++) {
      const dx = Math.abs(x - 6), dy = Math.abs(y - 6); if (dx + dy > 3 && (dx && dy || dx + dy > 5)) continue; // a chunky middle, four thin points
      wgPx(g, x, y, dx + dy <= 1 && x <= 6 && y <= 6 ? 'w' : x + y < 12 ? 'Y' : dx + dy >= 4 ? 'O' : 'y');
    }
  });
  const f = +k.slice(4); // lamp0..2: the star inside small, big, dim
  return wgMake(key, 11, 16, (g) => {
    wgRc(g, 3, 1, 5, 1, 'O'); wgRc(g, 2, 2, 7, 1, 'o'); wgPx(g, 2, 2, 'O'); wgRc(g, 2, 3, 7, 1, 'n'); // the brass cap and rim
    wgRc(g, 2, 4, 7, 10, 'c'); wgRc(g, 2, 4, 1, 10, 'C'); wgRc(g, 8, 4, 1, 10, 'B'); wgRc(g, 3, 5, 1, 3, 'w'); // the glass
    wgRc(g, 2, 14, 7, 1, 'o'); wgRc(g, 2, 14, 2, 1, 'O'); // the base
    const c = f === 2 ? 'y' : 'Y'; wgPx(g, 5, 9, f === 2 ? 'Y' : 'w'); for (const [a, b] of [[4, 9], [6, 9], [5, 8], [5, 10]]) wgPx(g, a, b, c);
    if (f === 1) for (const [a, b] of [[3, 9], [7, 9], [5, 7], [5, 11]]) wgPx(g, a, b, 'y');
  });
}
const _wgTipMeteor = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipMeteor(s);
  if (s.id === 'star_shard') L.push('IT FELL FROM THE SKY');
  else if (s.id === 'star_lamp') L.push('A STAR IN A JAR');
  return L;
};
const _wgBuildMeteor = wgBuildAll;
wgBuildAll = function () { _wgBuildMeteor(); wgReg('star_lamp', [0, 1, 0, 2].map(f => wgMeteorArt('lamp' + f))); };
const _wgIconMeteor = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if ((id !== 'star_shard' && id !== 'star_lamp') || WGA.cache[key]) return _wgIconMeteor(id);
  const [c, g] = wgCv(16, 16); g.drawImage(id === 'star_shard' ? wgMeteorArt('shard') : wgMeteorArt('lamp1'), id === 'star_shard' ? 1 : 2, id === 'star_shard' ? 1 : 0);
  WGA.cache[key] = c; return c;
};
