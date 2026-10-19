'use strict';
// Wildgrove: puddles. While it rains outdoors the ground grows wet (WGPD.wet, full in about 40 s) and puddles open on a
// few tiles of grass, dirt, mud, moss and paths, each its own size at its own wetness, so they come one by one and dry
// away one by one over two minutes after the rain. Raindrops ring them, a step in one splashes (friends' steps too),
// and the PUDDLE JUMPER star waits after twenty. Where a puddle lies is worked out from the tile and the world's seed
// alone and the wetness from the weather, which a guest takes from the host, so every screen sees the same puddles.
// Nothing is saved; with the weather effects off there are none.
const WG_PUD_GROUNDS = ['grass', 'dirt', 'mud', 'jungle', 'path', 'moss', 'p_gravel', 'p_cobble'];
const WGPD = { wet: 0, w: null, g: null, tile: '', stepK: -1, fr: new Map() }; // fr: when each friend last splashed
const wgPudOn = () => WGS.dim === 'o' && wgOpt().wx; // puddles are part of the weather
(function () {
  WG_ACH.push(['splash', 'PUDDLE JUMPER', 'SPLASH THROUGH TWENTY PUDDLES', (c) => (c.st.splash | 0) >= 20]);
})();
// the puddle on a tile at this wetness: -1 none, else its size 0-2; its spot in the tile and its seed
function wgPuddle(tx, ty) {
  const w = WGS.world, h = hash(tx, ty, (w.seed | 0) * 7 + 4241) >>> 0;
  if (h % 1000 >= 45) return null; // about one tile in twenty-two can hold one
  const G = WGPD.g || (WGPD.g = new Set(WG_PUD_GROUNDS.filter(id => G_ID[id] !== undefined).map(id => G_ID[id])));
  if (!G.has(wgGround(w, 'o', tx, ty)) || wgObjAt(w, 'o', tx, ty)) return null;
  const t = 0.12 + ((h >>> 10) % 100) / 100 * 0.45, k = WGPD.wet - t; // each puddle starts at its own wetness
  return k < 0 ? null : { size: k > 0.3 ? 2 : k > 0.12 ? 1 : 0, dx: ((h >>> 4) % 5) - 2, dy: ((h >>> 7) % 4) - 1, h };
}
const _wgUpdPud = updateWG;
updateWG = function (dt) {
  _wgUpdPud(dt);
  const w = WGS.world, p = WGS.p; if (!w || !p) { WGPD.w = null; return; }
  const rain = !!(WGS.weather && WGS.weather.kind === 'rain');
  if (WGPD.w !== w) { WGPD.w = w; WGPD.g = null; WGPD.wet = rain ? 0.6 : 0; WGPD.fr.clear(); } // a world just entered: as wet as its sky
  if (WGS.scr !== 'play') return;
  WGPD.wet = wgClamp(WGPD.wet + (rain ? dt / 40 : -dt / 120), 0, 1);
  if (!WGPD.wet || !wgPudOn()) { WGPD.tile = ''; return; }
  const tx = Math.floor(p.x / 16), ty = Math.floor((p.y - 2) / 16), P = wgPuddle(tx, ty), k = tx + ',' + ty, wade = P && P.size && !p.hidden;
  if (wade && WGPD.tile !== k) { const m = w.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.splash = Math.min(9999, (st.splash | 0) + 1); wgSfx('bubble'); }
  WGPD.tile = wade ? k : '';
  const sk = Math.floor(p.walkT); if (wade && p.moving && sk !== WGPD.stepK) wgPudSplash(p.x, p.y, P.size);
  WGPD.stepK = sk;
  for (const q of WGS.remote || []) { // a friend's steps splash on this screen too, now and then
    if (q.dim !== 'o' || !q.moving) continue; const Q = wgPuddle(Math.floor(q.x / 16), Math.floor((q.y - 2) / 16)); if (!Q || !Q.size) continue;
    if (WGS.t - (WGPD.fr.get(q.pid) || 0) > 0.3) { WGPD.fr.set(q.pid, WGS.t); wgPudSplash(q.x, q.y, Q.size); }
  }
};
function wgPudSplash(x, y, size) { wgPart(x, y - 1, size > 1 ? 4 : 2, { c: ['c', 'C', 'w'], s: 16, up: 12, life: 0.35 }); }
// drawn on the ground, under everything that stands: the chunk upkeep runs right after the ground is painted
const _wgUpkeepPud = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepPud(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (!WGPD.wet || !wgPudOn() || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  const rain = WGS.weather && WGS.weather.kind === 'rain', T = WGS.t;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const P = wgPuddle(tx, ty); if (!P) continue;
    const c = WGA.cache['pud_' + P.size]; if (!c) continue;
    const sx = tx * 16 + 8 + P.dx - cx0, sy = ty * 16 + 10 + P.dy - cy0;
    ctx.drawImage(c, sx - (c.width >> 1), sy - (c.height >> 1));
    if (rain && P.size) { // a raindrop's ring now and then
      const ph = (T * 0.9 + (P.h % 97) * 0.37) % 1.4; if (ph > 0.5) continue;
      const r = WGA.cache['pud_ring' + (ph < 0.2 ? 0 : 1)], k = Math.floor((T * 0.9 + (P.h % 97) * 0.37) / 1.4), ox = (hash(tx, ty, k) % 5) - 2;
      if (r) ctx.drawImage(r, sx + ox - (r.width >> 1), sy - (r.height >> 1));
    }
  }
};
const _wgBuildPud = wgBuildAll;
wgBuildAll = function () { // flat water in the ground: the bank's shadow on the top left, the sky's light on the far edge, no outline
  _wgBuildPud();
  const K = { b: 'b', B: 'B', c: 'c', C: 'C' };
  wgMake('pud_2', 12, 5, (g) => wgPaint(g, 0, 0, ['..bbbbbbb...', '.bbBBBBBBBc.', 'bBBBBBcCBBBc', '.BBBBBBBBcc.', '...cccccc...'], K), false);
  wgMake('pud_1', 8, 4, (g) => wgPaint(g, 0, 0, ['.bbbbbb.', 'bBBBcCBc', '.BBBBBc.', '..cccc..'], K), false);
  wgMake('pud_0', 5, 3, (g) => wgPaint(g, 0, 0, ['.bbb.', 'bBBBc', '.ccc.'], K), false);
  wgMake('pud_ring0', 1, 1, (g) => wgPaint(g, 0, 0, ['C'], K), false);
  wgMake('pud_ring1', 5, 3, (g) => wgPaint(g, 0, 0, ['.CCC.', 'C...C', '.CCC.'], K), false);
};
