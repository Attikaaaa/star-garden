'use strict';
// Wildgrove: sparklers. Held in hand a sparkler is lit: sparks crackle from its tip and it lights the dark around the
// hero, and it burns down in WG_SPARK_T seconds of holding, when the next one in the stack takes over. Friends see a
// lit sparkler too: a guest sends 'sk' in the 'p' message, the host lists it at index 14 of 'ps' (wg_net), and each
// screen draws the sparks itself. The SPARKLE star for one burnt to the end.
const WG_SPARK_T = 25, WG_SPARK_COLS = ['Y', 'y', 'w', 'O'];
const WGSP = { burn: 0 };
(function () {
  wgItem('sparkler', 'SPARKLER', 'tool', { tool: 'sparkler', stack: 20 }); wgRec('sparkler', 4, { stick: 2, flint: 1 }, 'bench');
  WG_ACH.push(['sparkler', 'SPARKLE', 'BURN A SPARKLER DOWN TO THE END', (c) => c.st.sparkler]);
})();
function wgSparkHeld() { // the hero holds a lit sparkler (not while wading or swimming, where it would go out)
  const s = WGS.inv[WGS.sel], p = WGS.p; if (!s || s.id !== 'sparkler' || !p || !WGS.world) return false;
  return !GROUND[wgGround(WGS.world, WGS.dim, Math.floor(p.x / 16), Math.floor(p.y / 16))].liq;
}
const _wgUpdSpark = updateWG;
updateWG = function (dt) {
  _wgUpdSpark(dt);
  if (WGS.scr !== 'play' || !wgSparkHeld()) { if (!wgSparkHeld()) WGSP.burn = 0; return; }
  WGSP.burn += dt; if (WGSP.burn < WG_SPARK_T) return;
  WGSP.burn = 0; const s = WGS.inv[WGS.sel]; s.n--; if (s.n <= 0) WGS.inv[WGS.sel] = null; // burnt down: the next one is lit
  wgToast('THE SPARKLER BURNED OUT', 1.8); wgPart(WGS.p.x, WGS.p.y - 16, 4, { c: ['m', 'l'], s: 10, up: 8, life: 0.6 });
  const st = WGS.world.meta.stats || (WGS.world.meta.stats = { kills: 0, far: 0 }); st.sparkler = 1; // an empty slot is refilled from the pack (wgRefillHand)
};
// the sparks: from the tip of the sparkler in the hand, yours or a friend's. It is drawn here, not as the held tool, so
// that facing left it is mirrored and the sparks stay at the far end
const wgSparkIcon = (flip) => {
  if (!flip) return wgIcon('sparkler'); if (WGA.cache.ic_sparkler_l) return WGA.cache.ic_sparkler_l;
  const [c, g] = wgCv(16, 16); g.translate(16, 0); g.scale(-1, 1); g.drawImage(wgIcon('sparkler'), 0, 0); return (WGA.cache.ic_sparkler_l = c);
};
const _wgDrawPlayerSpark = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p, mine = p === WGS.p, lit = mine ? wgSparkHeld() : p.spark && p.dim === WGS.dim;
  if (mine && lit) { const H = wgHeld; wgHeld = () => null; try { _wgDrawPlayerSpark(e, cx0, cy0); } finally { wgHeld = H; } } else _wgDrawPlayerSpark(e, cx0, cy0);
  if (p.hidden || !lit || (p.inv > 0 && Math.floor(WGS.t * 20) % 2)) return;
  const sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0), flip = p.face === 'l';
  const hx = p.face === 'u' ? sx + 6 : p.face === 'd' ? sx - 8 : sx + (flip ? -7 : 7) - 8, hy = sy - 18 + (p.face === 'u' ? -2 : 0);
  ctx.drawImage(wgSparkIcon(flip), hx - 2, hy - 2);
  const tx = flip ? hx : hx + 10, ty = hy + 1, f = Math.floor(WGS.t * 24);
  for (let i = 0; i < 7; i++) {
    const h = hash(f, i, p.pid | 0), a = (h % 628) / 100, r = 1 + (h >>> 10) % 4;
    ctx.fillStyle = PAL[WG_SPARK_COLS[(h >>> 4) % WG_SPARK_COLS.length]]; ctx.fillRect(Math.round(tx + Math.cos(a) * r), Math.round(ty + Math.sin(a) * r), 1, 1);
  }
  ctx.fillStyle = PAL.w; ctx.fillRect(tx, ty, 1, 1);
  WGR.lights.push({ x: tx, y: ty, r: 30, f: 1 });
};
const _wgTipSpark = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipSpark(s);
  if (s.id === 'sparkler') L.push('SPARKLES WHILE YOU HOLD IT', 'BURNS FOR ' + WG_SPARK_T + ' SECONDS');
  return L;
};
const _wgIconSpark = wgIcon;
wgIcon = function (id) { // a thin wire, coated along most of it, a bright tip
  const key = 'ic_' + id; if (id !== 'sparkler' || WGA.cache[key]) return _wgIconSpark(id);
  const [c, g] = wgCv(16, 16);
  wgLine(g, 3, 13, 5, 11, 'l'); wgLine(g, 6, 10, 11, 5, 'n'); wgLine(g, 7, 10, 12, 5, 'u'); wgPx(g, 12, 4, 'y'); wgPx(g, 13, 3, 'Y');
  wgOutline(c); WGA.cache[key] = c; return c;
};
