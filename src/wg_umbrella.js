'use strict';
// Wildgrove: umbrellas. Held in hand, an umbrella is up over the hero's head (drawn by a `wgDrawPlayer` wrapper in
// place of the held tool, its shaft behind the hero), in four colours (`WG_UMB`). In the rain drops bounce on it and
// drip from its rim, and none fall under it: a `wgDrawWeatherFX` wrapper leaves out the drops in each umbrella's
// shelter (`WGUB.shelter`, noted as the heroes are drawn). A friend's umbrella shows too: a guest sends `ub` in the 'p'
// message and the host lists it at index 16 of 'ps' (wg_net). The SINGING IN THE RAIN star for `WG_UMB_WALK` tiles
// walked in the rain under one.
const WG_UMB = [ // id, name, petals, the canopy's ramp: light, colour, shade
  ['umbrella_r', 'RED UMBRELLA', 'petal_r', ['R', 'r', 'n']], ['umbrella_y', 'YELLOW UMBRELLA', 'petal_y', ['Y', 'y', 'o']],
  ['umbrella_b', 'BLUE UMBRELLA', 'petal_b', ['c', 'B', 'b']], ['umbrella_p', 'PURPLE UMBRELLA', 'petal_p', ['3', '2', '1']]];
const WG_UMB_WALK = 120;
const WG_UMB_ROWS = ['........x........', '......LLMMM......', '....LLwLMMMMD....', '..LLLLLLMMMMMDD..', '.LLLLLLMMMMMMMDD.', 'LLLLLLMMMMMMMMDDD', 'L...L...M...M...D'];
const WG_UMB_TOP = [...Array(17)].map((_, c) => WG_UMB_ROWS.findIndex(r => r[c] !== '.')); // the canopy's top edge, column by column
const WGUB = { shelter: [], lx: 0, ly: 0, w: null }; // the dry spots this frame [x0, x1, y0, y1]; where you were last frame
(function () {
  for (const [id, name, petal] of WG_UMB) { wgItem(id, name, 'tool', { tool: 'umbrella', stack: 1 }); wgRec(id, 1, { stick: 2, wool: 2, [petal]: 2 }, 'bench'); }
  WG_ACH.push(['umbrella', 'SINGING IN THE RAIN', 'WALK IN THE RAIN UNDER AN UMBRELLA', (c) => (c.st.umbrella | 0) >= WG_UMB_WALK]);
})();
function wgUmbHeld() { // 1..4: the umbrella in your hand, or 0
  const s = WGS.inv && WGS.inv[WGS.sel]; if (!s) return 0;
  for (let i = 0; i < WG_UMB.length; i++) if (WG_UMB[i][0] === s.id) return i + 1;
  return 0;
}
const wgnUmb = (v) => Number.isInteger(v) && v > 0 && v <= WG_UMB.length ? v : 0;
const wgUmbRain = () => !!(WGS.weather && WGS.weather.kind === 'rain' && WGS.dim === 'o');
function wgUmbWet() { // drops (not flakes) are falling on this screen, as wgDrawWeatherFX draws them
  const p = WGS.p; if (!p || !WGS.world || !wgUmbRain() || !wgOpt().wx) return false;
  const g = GROUND[wgGround(WGS.world, 'o', Math.floor(p.x / 16), Math.floor(p.y / 16))]; return g.id !== 'snow' && g.id !== 'ice';
}
// walking in the rain under it
const _wgUpdUmb = updateWG;
updateWG = function (dt) {
  _wgUpdUmb(dt);
  const p = WGS.p, w = WGS.world; if (!p || !w) return;
  if (WGUB.w !== w) { WGUB.w = w; WGUB.lx = p.x; WGUB.ly = p.y; }
  const d = Math.hypot(p.x - WGUB.lx, p.y - WGUB.ly); WGUB.lx = p.x; WGUB.ly = p.y;
  if (WGS.scr !== 'play' || d > 6 || !d || p.sit || !wgUmbHeld() || !wgUmbRain()) return;
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.umbrella = Math.round(((st.umbrella || 0) + d / 16) * 100) / 100;
};
// drawing: the shaft behind the hero, the canopy over the head, drops bouncing on it and dripping from its rim
const _wgDrawPlayerUmb = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p, mine = p === WGS.p, k = mine ? wgUmbHeld() : p.dim === WGS.dim ? p.umb | 0 : 0;
  if (!k || p.hidden || (mine ? p.sit : p.face === 'S')) return _wgDrawPlayerUmb(e, cx0, cy0);
  const sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0), cx = sx - (p.face === 'l' ? 1 : 0), top = sy - 34, rim = top + 7;
  const blink = p.inv > 0 && Math.floor(WGS.t * 20) % 2;
  if (!blink) rect(cx, rim, 1, 12, 'x');
  const H = wgHeld, name = p.name; if (mine) wgHeld = () => null; else p.name = '';
  try { _wgDrawPlayerUmb(e, cx0, cy0); } finally { wgHeld = H; p.name = name; }
  if (!mine && name) wgRawText(name, sx, sy - 43, 'w', 2, 1); // over the canopy
  if (blink) return;
  ctx.drawImage(wgUmbArt(k), cx - 9, top - 1);
  WGUB.shelter.push([cx - 8, cx + 9, rim, sy + 1]);
  if (!wgUmbWet()) return;
  const T = WGS.t, f = Math.floor(T * 12), id = (p.pid | 0) + 7;
  for (let i = 0; i < 3; i++) { // drops bouncing on the canopy
    const h = hash(f, i, id); if ((h >>> 12) % 3 === 0) continue;
    const c = h % 17; rect(cx - 8 + c, top + WG_UMB_TOP[c] - 1 - (h >>> 5) % 2, 1, 1, (h >>> 8) % 3 ? 'C' : 'w');
  }
  for (let i = 0; i < 2; i++) { // and dripping from its rim
    const u = (T * 1.3 + i * 0.47 + id * 0.31) % 1; if (u < 0.85) rect(i ? cx + 8 : cx - 8, rim + 1 + Math.round(u * u * 16), 1, 2, 'c');
  }
};
const _wgWxUmb = wgDrawWeatherFX;
wgDrawWeatherFX = function () { // no drops fall under an umbrella
  const S = WGUB.shelter; if (!S.length) return _wgWxUmb();
  const R = rect;
  rect = function (x, y, w, h) { for (const s of S) if (x + w > s[0] && x < s[1] && y + h > s[2] && y < s[3]) return; return R(...arguments); };
  try { _wgWxUmb(); } finally { rect = R; S.length = 0; }
};
function wgUmbArt(k) { // the open canopy, lit from the top left, its points at the ribs' ends
  const key = 'umb_' + k; if (WGA.cache[key]) return WGA.cache[key];
  const [L, M, D] = WG_UMB[k - 1][3];
  return wgMake(key, 19, 9, (g) => wgPaint(g, 1, 1, WG_UMB_ROWS, { L, M, D, w: 'w', x: 'x' }));
}
const _wgTipUmb = wgTipLines;
wgTipLines = function (s) { const L = _wgTipUmb(s); if (WG_UMB.some(u => u[0] === s.id)) L.push('KEEPS THE RAIN OFF YOUR HEAD'); return L; };
const _wgIconUmb = wgIcon;
wgIcon = function (id) { // a little open umbrella on its hooked handle
  const key = 'ic_' + id, u = WG_UMB.find(u => u[0] === id); if (!u || WGA.cache[key]) return _wgIconUmb(id);
  const [c, g] = wgCv(16, 16), [L, M, D] = u[3];
  wgPaint(g, 1, 2, ['......x......', '....LLMMM....', '..LLwLMMMMD..', '.LLLLLMMMMDD.', 'LLLLLMMMMMMDD', 'L...L...M...D'], { L, M, D, w: 'w', x: 'x' });
  wgRc(g, 7, 8, 1, 5, 'x'); wgRc(g, 7, 13, 1, 1, 'n'); wgRc(g, 6, 14, 1, 1, 'n'); wgRc(g, 5, 13, 1, 1, 'n');
  wgOutline(c); WGA.cache[key] = c; return c;
};
