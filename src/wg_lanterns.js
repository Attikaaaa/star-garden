'use strict';
// Wildgrove: sky lanterns. Made by hand from plant fiber, string and a torch; USE one in hand at dusk or at night under
// the open sky and it is let go: it rises from the hero's hands, glowing through the dark, sways on the breeze and
// grows small as it climbs, then fades out. Friends see it: the release goes out as a 'sky' message (the host passes a
// guest's on to everyone else) and each screen flies it from its own clock. The LANTERN NIGHT star after five.
const WG_SKY_T = 40, WG_SKY_MAX = 24; // seconds a lantern flies; most in the sky at once
const WGSL = { list: [], w: null }; // the lanterns aloft: world x, y, dim, seed, the start on this screen's clock
const WG_SKY_KEY = { O: 'O', o: 'o', y: 'y', Y: 'Y', n: 'n', w: 'L', L: 'L' }; // the art's pixel maps: w a highlight, L the flame's heart
(function () {
  wgItem('sky_lantern', 'SKY LANTERN', 'res', {}); wgRec('sky_lantern', 2, { fiber: 4, string: 1, torch: 1 }, 'hand');
  WG_ACH.push(['lanterns', 'LANTERN NIGHT', 'LET FIVE SKY LANTERNS GO', (c) => (c.st.lanterns | 0) >= 5]);
})();
const wgSkyOpen = () => WGS.dim === 'o' || WGS.dim === 'k'; // the open sky, or the islands above it
function wgSkyAdd(x, y, d, s) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e7 || Math.abs(y) > 1e7 || (d !== 'o' && d !== 'k')) return false;
  const L = WGSL.list; L.push({ x, y, d, s: Math.abs(s | 0) % 10000, t0: WGS.t }); if (L.length > WG_SKY_MAX) L.shift();
  return true;
}
const _wgUseSky = wgUse;
wgUse = function (tx, ty) {
  if (_wgUseSky(tx, ty)) return true;
  const s = WGS.inv[WGS.sel], p = WGS.p; if (!s || s.id !== 'sky_lantern' || !WGS.world) return false;
  if (!wgSkyOpen()) { wgToast('IT NEEDS THE OPEN SKY'); return true; }
  if (wgNight(WGS.clock) < 0.1) { wgToast('IT SHINES BEST AT NIGHT'); return true; }
  const seed = Math.floor(Math.random() * 10000), x = Math.round(p.x), y = Math.round(p.y);
  wgInvTake(WGS.inv, 'sky_lantern', 1); wgSkyAdd(x, y, WGS.dim, seed); wgSfx('lamp'); wgToast('MAKE A WISH...', 2);
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.lanterns = (st.lanterns | 0) + 1;
  if (WGN.role) { const msg = { t: 'sky', x, y, d: WGS.dim, s: seed }; if (WGN.role === 'host') wgnAll(msg, null); else wgnSend(WGN.link, msg); }
  return true;
};
// the net: a guest's lantern is checked on the host, flown there and passed on (one a third of a second per friend at most)
const _wgnHostSky = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostSky(L, m);
  if (!m || m.t !== 'sky' || !WGS.world) return;
  const now = performance.now(); if (now - (L.skyT || 0) < 330) return; L.skyT = now;
  if (wgSkyAdd(+m.x, +m.y, m.d, +m.s)) wgnAll({ t: 'sky', x: +m.x, y: +m.y, d: m.d, s: +m.s | 0 }, L);
};
const _wgnClientSky = wgnClientMsg;
wgnClientMsg = function (L, m) {
  _wgnClientSky(L, m);
  if (m && m.t === 'sky' && WGS.world) wgSkyAdd(+m.x, +m.y, m.d, +m.s);
};
const _wgUpdSky = updateWG;
updateWG = function (dt) {
  _wgUpdSky(dt);
  if (WGSL.w !== WGS.world) { WGSL.w = WGS.world; WGSL.list.length = 0; } // another world: its sky is empty
  const L = WGSL.list; while (L.length && (WGS.t - L[0].t0 > WG_SKY_T || L[0].t0 > WGS.t)) L.shift();
};
const _wgTipSky = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipSky(s);
  if (s.id === 'sky_lantern') L.push('USE IT AT NIGHT UNDER THE OPEN SKY', 'FRIENDS SEE IT RISE');
  return L;
};
// where a lantern is after k seconds: held up over the head, quick off the hands, then slower as it climbs away, drifting with its own breeze
function wgSkyAt(l, k) {
  const drift = ((l.s % 9) - 4) * 0.3, sw = Math.sin(k * 0.5 + l.s) * 4 * Math.max(0, 1 - k / 50);
  return { x: l.x + sw + drift * k, y: l.y - 26 - 80 * (1 - Math.exp(-k / 9)), size: k < 8 ? 0 : k < 18 ? 1 : k < 28 ? 2 : 3 };
}
// drawn over the dark, so they glow: a warm halo in the light's own 2px cells, and a little light on the ground while near
const _wgLightSky = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  const L = WGSL.list, T = WGS.t;
  if (L.length) for (const l of L) if (l.d === WGS.dim) { const k = T - l.t0, P = wgSkyAt(l, k); if (P.size < 2) WGR.lights.push({ x: P.x - cx0, y: P.y - 4 - cy0, r: P.size ? 12 : 22, f: 1 }); }
  _wgLightSky(cx0, cy0);
  if (!L.length) return;
  for (const l of L) {
    if (l.d !== WGS.dim) continue;
    const k = T - l.t0, P = wgSkyAt(l, k), a = Math.min(1, (WG_SKY_T - k) / 6); if (a <= 0) continue;
    const fl = Math.floor(T * 5 + l.s) % 3 === 0 ? 1 : 0, c = WGA.cache['skylt_' + P.size + (P.size ? '' : '_' + fl)];
    if (!c) continue;
    const h = P.size < 3 && wgSkyHalo(P.size), sx = Math.round(P.x - cx0), sy = Math.round(P.y - cy0);
    if (h) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * (0.85 + 0.15 * Math.sin(T * 6 + l.s)); ctx.drawImage(h, 0, 0, h.width, h.height, sx - h.width, sy - (c.height >> 1) - h.height, h.width * 2, h.height * 2); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = P.size === 3 ? a * (0.7 + 0.3 * Math.sin(T * 4 + l.s)) : a;
    ctx.drawImage(c, sx - (c.width >> 1), sy - c.height);
  }
  ctx.globalAlpha = 1;
};
// ---------- art: a paper lantern glowing from the flame at its foot, in four sizes as it climbs, and its icon ----------
const _wgBuildSky = wgBuildAll;
wgBuildAll = function () {
  _wgBuildSky();
  const K = WG_SKY_KEY; // a paper bag wider at the top, a seam down it, lit from the flame at its rim (L its white heart)
  const big = (fl) => ['.OOOOO.', 'OwOoOOo', 'OOOoOOo', 'OOyoyOo', 'OyyYyyo', '.yYYYo.', fl ? '.yYYYo.' : '.yYLYo.', fl ? '.nnLnn.' : '.nnYnn.'];
  for (const fl of [0, 1]) wgMake('skylt_0_' + fl, 9, 10, (g) => wgPaint(g, 1, 1, big(fl), K));
  wgMake('skylt_1', 7, 7, (g) => wgPaint(g, 1, 1, ['OOOOO', 'OwOOo', 'OyYyo', '.YLY.', '.nYn.'], K));
  wgMake('skylt_2', 5, 5, (g) => wgPaint(g, 1, 1, ['OOo', 'yYo', '.L.'], K));
  wgMake('skylt_3', 1, 2, (g) => wgPaint(g, 0, 0, ['Y', 'O'], K), false); // far off, just a warm spark
};
function wgSkyHalo(size) { // rings of light orange, brighter to the middle, at half size like the light mask
  const key = 'skyhalo_' + size; if (WGA.cache[key]) return WGA.cache[key];
  const R = [8, 5, 3][size], [c, g] = wgCv(R * 2 + 1, R * 2 + 1); g.fillStyle = 'rgba(255,173,71,0.11)';
  for (const k of [1, 0.75, 0.5, 0.3]) { const r = Math.round(R * k); for (let y = -r; y <= r; y++) { const hw = Math.floor(Math.sqrt(r * r - y * y)); g.fillRect(R - hw, R + y, hw * 2 + 1, 1); } }
  WGA.cache[key] = c; return c;
}
const _wgIconSky = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'sky_lantern') return _wgIconSky(id);
  const [c, g] = wgCv(16, 16);
  wgPaint(g, 3, 2, ['.OOOOOOO.', 'OwwoOOoOo', 'OwOoOOoOo', 'OOOoOOoOo', 'OOyoyyoOo', 'OyyyyyyOo', 'OyyYYYyyo', 'OyYYYYYyo', '.yYYLYYo.', '.yYLLLYo.', '..nnYnn..'], WG_SKY_KEY);
  wgOutline(c);
  WGA.cache[key] = c; return c;
};
