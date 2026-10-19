'use strict';
// Wildgrove: cloud watching. Sit down out under the open sky (not on a floor) on a fair day, and after `WG_CG_WAIT` s
// a cloud in a shape drifts slowly across the top of the view (`WG_CG_SHAPES`: a bunny, a fish, a heart, a ship, a
// teapot, a duck), over `WG_CG_T` s; halfway over it is named (THAT CLOUD LOOKS LIKE A ...) and noted in
// `stats.clouds`, a bit for each shape. The next comes after another wait, a shape not yet seen first. Drawn by a
// `wgDrawWeatherFX` wrapper from art baked once (`wgCloudShape`); your own hero's only, this screen's only. Standing
// up lets it drift off. Every shape seen lights CLOUD WATCHER.
const WG_CG_WAIT = 8, WG_CG_T = 26;
const WG_CG_SHAPES = [
  ['BUNNY', ['................#...#.......', '................##..##......', '...............###.###......', '...............###.###......', '...............###.###......', '................#######.....', '.......########.########....', '.....###################....', '.#######################....', '.#######################....', '.######################.....', '...################.........', '...################.........', '.....###############........', '......#########.###.........']],
  ['FISH', ['.........######.............', '......############......##..', '....################...###..', '...##################.####..', '..#######################...', '.#######################....', '..#######################...', '...##################.####..', '....################...###..', '......############......##..', '.........######.............']],
  ['HEART', ['...#####....#####...', '..#######..#######..', '.##################.', '####################', '####################', '####################', '.##################.', '..################..', '...##############...', '....############....', '.....##########.....', '......########......', '.......######.......', '........####........', '.........##.........']],
  ['SHIP', ['............#.............', '............##............', '............###...........', '............####..........', '............#####.........', '............######........', '............#######.......', '............########......', '............#########.....', '............#.............', '##########################', '.########################.', '..######################..', '...####################...']],
  ['TEAPOT', ['............##................', '............##................', '.........########.............', '.........########.............', '........##########.......##...', '...###.############....####...', '..##################..####....', '..##..##################......', '..##..#################.......', '..##.##################.......', '...#################..........', '.......############...........', '........##########............', '........##########............', '.........########.............']],
  ['DUCK', ['.......####...............', '......######..............', '......####.###............', '......######..............', '.......####...............', '.......####..........##...', '.....##########....####...', '...######################.', '..#######################.', '..######################..', '...####################...', '.....################.....']]];
const WGCG = { still: 0, cur: null, n: 0 };
(function () {
  WG_ACH.push(['clouds', 'CLOUD WATCHER', 'SEE EVERY SHAPE IN THE CLOUDS', (c) => ((c.st.clouds | 0) & 63) === 63]);
})();
function wgCloudShape(k) { // white puffs, a pale belly underneath and a soft rim, no dark outline: it is sky
  const key = 'cgaze' + k; if (WGA.cache[key]) return WGA.cache[key];
  const R = WG_CG_SHAPES[k][1], H = R.length, W = R[0].length, on = (x, y) => y >= 0 && y < H && x >= 0 && x < W && R[y][x] === '#';
  const [c, g] = wgCv(W + 2, H + 2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (on(x, y)) wgPx(g, x + 1, y + 1, !on(x, y + 1) ? 'l' : !on(x, y + 2) || !on(x + 1, y) ? 'L' : 'w');
  for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) wgPx(g, x + 1, y + 1, on(x, y - 1) || on(x - 1, y) ? 'l' : 'L');
  WGA.cache[key] = c; return c;
}
function wgCloudGazeOk() { // seated under the open sky on a fair day
  const p = WGS.p, w = WGS.world; if (!p || !w || !p.sit || WGS.dim !== 'o' || WGS.weather || wgNight(WGS.clock) >= 0.3 || WGS.scr !== 'play') return false;
  const g = GROUND[wgGround(w, 'o', p.sit.tx, p.sit.ty)]; return !!g && !g.floor;
}
const _wgUpdCloudGaze = updateWG;
updateWG = function (dt) {
  _wgUpdCloudGaze(dt);
  const w = WGS.world; if (!w || !WGS.p) return;
  const ok = wgCloudGazeOk(), C = WGCG.cur;
  if (C) { // drifting: named halfway over; standing up lets it drift off quicker
    if (!ok) C.t0 -= dt * 2;
    const u = (WGS.t - C.t0) / WG_CG_T;
    if (u >= 0.45 && !C.told && ok) {
      C.told = 1; wgToast('THAT CLOUD LOOKS LIKE A ' + WG_CG_SHAPES[C.k][0] + '!', 3);
      const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.clouds = (st.clouds | 0) | (1 << C.k);
    }
    if (u >= 1) { WGCG.cur = null; WGCG.still = 0; }
    return;
  }
  if (!ok) { WGCG.still = 0; return; }
  if ((WGCG.still += dt) < WG_CG_WAIT) return;
  const seen = (w.meta.stats && w.meta.stats.clouds) | 0, fresh = WG_CG_SHAPES.map((s, i) => i).filter(i => !(seen & (1 << i)));
  const pool = fresh.length ? fresh : WG_CG_SHAPES.map((s, i) => i), k = pool[hash(WGCG.n++, w.seed | 0, 77) % pool.length];
  WGCG.cur = { k, t0: WGS.t, told: 0, y: 10 + hash(WGCG.n, 3, 9) % 18 };
};
const _wgWxCloudGaze = wgDrawWeatherFX;
wgDrawWeatherFX = function () {
  _wgWxCloudGaze();
  const C = WGCG.cur; if (!C || WGS.dim !== 'o') return;
  const A = wgCloudShape(C.k), u = (WGS.t - C.t0) / WG_CG_T, l = -SCR.ox, t = -SCR.oy;
  const x = Math.round(l - A.width + u * (SCR.w + A.width)), y = Math.round(t + C.y + Math.sin(WGS.t * 0.4) * 1.2);
  ctx.globalAlpha = 0.88 * Math.min(1, u * 8, (1 - u) * 8); ctx.drawImage(A, x, y); ctx.globalAlpha = 1;
};
