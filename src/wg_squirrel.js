'use strict';
// Wildgrove: squirrels. By day one tree in `WG_SQ_ONE` in view has a squirrel (from the tile and the seed, so it is the
// same tree on every screen; one in three of those in winter, none at night or in the rain). It comes down the trunk,
// scampers to a spot nearby, digs or nibbles, sits up with a flick of its tail, maybe scampers on, and runs back up,
// over and over; a hero coming close sends it up its tree for a while. The trees in view are looked over every second
// (`WGSQ.list` keeps each squirrel by its tree); each screen has its own, moving with the world's clock, slotted into
// the world's depth order by a `wgEntities` wrapper. Ambient life, off with the ambient life option.
const WG_SQ_ONE = 6, WG_SQ_SHY = 34, WG_SQ_RUN = 62;
const WGSQ = { list: new Map(), w: null, t: 0, scanT: 0 };
function wgSqTree(tx, ty) { // does this tree have a squirrel
  const w = WGS.world, h = hash(tx, ty, (w.seed | 0) * 17 + 303); if (h % WG_SQ_ONE) return false;
  return wgSeason() !== 3 || (h >>> 8) % 3 === 0;
}
const wgSqOut = () => wgNight(WGS.clock) < 0.3 && !(WGS.weather && WGS.weather.kind === 'rain'); // squirrels are about
function wgSqFree(x, y) { const w = WGS.world, tx = Math.floor(x / 16), ty = Math.floor(y / 16), o = OBJ[wgObjAt(w, 'o', tx, ty)]; return !GROUND[wgGround(w, 'o', tx, ty)].liq && !(o && o.solid !== 0); }
const _wgUpdSq = updateWG;
updateWG = function (dt) {
  _wgUpdSq(dt);
  const w = WGS.world, p = WGS.p, L = WGSQ.list, T = WGS.t, d = Math.min(0.1, Math.max(0, T - WGSQ.t)); WGSQ.t = T;
  if (!w || !p || WGSQ.w !== w || WGS.dim !== 'o' || !wgOpt().amb) { L.clear(); WGSQ.w = w; WGSQ.scanT = 0; return; }
  if ((WGSQ.scanT -= d) <= 0) { // the trees in view with a squirrel
    WGSQ.scanT = 1; const cam = WGS.cam, seen = new Set();
    const x0 = Math.floor((cam.x - VW / 2 - SCR.ox) / 16), x1 = x0 + Math.ceil(SCR.w / 16), y0 = Math.floor((cam.y - VH / 2 - SCR.oy) / 16), y1 = y0 + Math.ceil(SCR.h / 16) + 2;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const o = OBJ[wgObjAt(w, 'o', x, y)]; if (!o || o.kind !== 'tree' || !wgSqTree(x, y)) continue;
      const k = x + ',' + y; seen.add(k);
      if (!L.has(k)) L.set(k, { tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 14, st: 'tree', t0: T, wait: 1 + Math.random() * 6, gx: 0, gy: 0, flip: Math.random() < 0.5, runs: 0 });
    }
    for (const k of L.keys()) if (!seen.has(k)) L.delete(k);
  }
  const out = wgSqOut();
  for (const s of L.values()) wgSqStep(s, T, d, p, out);
};
function wgSqStep(s, T, d, p, out) { // the squirrel's little round: down, about, up
  const bx = s.tx * 16 + 8, by = s.ty * 16 + 14, near = !p.hidden && Math.hypot(p.x - s.x, p.y - s.y) < WG_SQ_SHY;
  const go = (st, wait) => { s.st = st; s.t0 = T; s.wait = wait; };
  if (near && s.st !== 'tree' && s.st !== 'up' && s.st !== 'home') { s.gx = bx; s.gy = by; s.runs = 9; go('home', 0); } // off home, and quick
  switch (s.st) {
    case 'tree': if (out && T - s.t0 > s.wait && Math.hypot(p.x - bx, p.y - by) > WG_SQ_SHY + 10) go('down', 0.8); break;
    case 'down': if (T - s.t0 > s.wait) { s.x = bx; s.y = by; s.runs = 0; wgSqPick(s, bx, by); go('run', 0); } break;
    case 'run': case 'home': {
      const dx = s.gx - s.x, dy = s.gy - s.y, l = Math.hypot(dx, dy), v = WG_SQ_RUN * (s.st === 'home' ? 1.6 : 1) * d;
      if (Math.abs(dx) > 0.5) s.flip = dx < 0;
      if (l <= v) { s.x = s.gx; s.y = s.gy; if (s.st === 'home') go('up', 0.8); else go(Math.random() < 0.55 ? 'dig' : 'look', 1.4 + Math.random() * 1.4); }
      else { s.x += dx / l * v; s.y += dy / l * v; }
      break;
    }
    case 'dig': case 'look': if (T - s.t0 > s.wait) { if (++s.runs < 3 && out && Math.random() < 0.5) { wgSqPick(s, bx, by); go('run', 0); } else { s.gx = bx; s.gy = by; go('home', 0); } } break;
    case 'up': if (T - s.t0 > s.wait) go('tree', near ? 8 + Math.random() * 6 : 3 + Math.random() * 7); break;
  }
}
function wgSqPick(s, bx, by) { // a spot to scamper to: near its tree, on open ground
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * 6.283, r = 14 + Math.random() * 26, x = bx + Math.cos(a) * r, y = by + Math.sin(a) * r * 0.7;
    if (wgSqFree(x, y)) { s.gx = x; s.gy = y; return; }
  }
  s.gx = bx + (s.flip ? -12 : 12); s.gy = by + 4;
}
const _wgEntsSq = wgEntities;
wgEntities = function (x0, y0, x1, y1) {
  const out = _wgEntsSq(x0, y0, x1, y1);
  if (WGSQ.list.size && WGS.dim === 'o') for (const s of WGSQ.list.values()) if (s.st !== 'tree' && s.x > x0 - 16 && s.x < x1 + 16 && s.y > y0 - 16 && s.y < y1 + 40) out.push({ x: s.x, y: s.st === 'down' || s.st === 'up' ? s.ty * 16 + 15 : s.y, s, draw: wgSqDraw });
  return out;
};
function wgSqDraw(e, cx0, cy0) {
  const s = e.s, T = WGS.t, u = Math.min(1, (T - s.t0) / Math.max(0.01, s.wait));
  if (s.st === 'down' || s.st === 'up') { // on the trunk, head first
    const k = s.st === 'down' ? u : 1 - u, x = Math.round(s.tx * 16 + 8 - cx0), y = Math.round(s.ty * 16 + 14 - cy0 - 18 + k * 16);
    ctx.drawImage(wgSqArt(s.st === 'down' ? 'climb_d' : 'climb'), x - 4, y - 10); return;
  }
  const x = Math.round(s.x - cx0), y = Math.round(s.y - cy0), moving = s.st === 'run' || s.st === 'home';
  shadow(x, y, 6);
  const f = moving ? (Math.floor(T * 14) % 2 ? 'run1' : 'run0') : s.st === 'dig' ? (Math.floor(T * 6) % 2 ? 'dig' : 'sit') : (Math.floor((T - s.t0) * 2) % 3 === 2 ? 'flick' : 'sit');
  ctx.drawImage(wgSqArt(f + (s.flip ? '_l' : '')), x - 6, y - 9);
  if (s.st === 'dig' && Math.floor(T * 6) % 2) rect(x + (s.flip ? -5 : 4), y - 2 - (Math.floor(T * 12) % 2), 1, 1, 'n'); // a fleck of earth
}
const WG_SQ_ART = { // facing right; n rust, N tan, O light, A belly, 0 an eye
  sit: ['.NN.....n...', 'NOON...nN...', 'NONn..NNN0N.', 'nNNn.nNNN...', '.nNNnNAA....', '..nNNNAA....', '...nNNAn....', '...nn.nn....'],
  flick: ['..NN....n...', '.NOON..nN...', '.NONn.NNN0N.', 'nNNn.nNNN...', 'nNNNnNAA....', '..nNNNAA....', '...nNNAn....', '...nn.nn....'],
  dig: ['.NN.........', 'NOON....n...', 'NONn...nN...', 'nNNn.nNNN0N.', '.nNNnNNAN...', '..nNNNAAn...', '...nNNA.n...', '...nn.nn....'],
  run0: ['............', '............', 'NN..........', 'ONN......n..', '.NNn..nNNN0N', '..nNNNNNNNN.', '...nNAAANNn.', '...n.n..n.n.'],
  run1: ['............', '............', '.NN.........', 'NONN.....n..', '..NNn.nNNN0N', '...nNNNNNNN.', '...nNAAANNn.', '....nn..nn..'],
  climb: ['..n.n..', '..NNN..', '.nNNNn.', '..NNN..', '.nNNNn.', '...N...', '..NON..', '.NOON..', '.NNN...', '..N....'],
};
function wgSqArt(k) {
  const key = 'sq_' + k; if (WGA.cache[key]) return WGA.cache[key];
  const flip = k.endsWith('_l'), down = k === 'climb_d', rows = WG_SQ_ART[flip ? k.slice(0, -2) : down ? 'climb' : k], map = { n: 'n', N: 'N', O: 'O', A: 'A', 0: '0' };
  return wgMake(key, rows[0].length + 2, rows.length + 2, (g, w, h) => { if (flip) { g.translate(w, 0); g.scale(-1, 1); } if (down) { g.translate(0, h); g.scale(1, -1); } wgPaint(g, 1, 1, rows, map); });
}
