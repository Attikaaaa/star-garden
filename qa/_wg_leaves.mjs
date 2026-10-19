// Wildgrove's leaf piles: the art; heaps only in autumn, only on grass beside a tree that turns, never under a thing;
// walking into one scatters it and counts once, a scattered one counts no more until it has gathered again; a friend
// scatters it too without counting; drawn as a heap, as strewn leaves once scattered, never in summer or in a cave;
// LEAF LEAPER; Hungarian; a look at an autumn wood.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'LEAF' }, seed: { v: '26' }, look: { skin: 2, hair: 1, shirt: 0 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 200); 0`);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`['pile', 'small', 'bits'].every(s => [0, 1, 2].every(v => WGA.cache['leaf_' + s + v]))`);
ok(r, 'the art: heaps, small heaps and strewn leaves in three mixes');
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, x0 = Math.floor(p.x / 16) - 12, y0 = Math.floor(p.y / 16) - 12, count = () => { let n = 0, bad = 0; const at = [];
    for (let y = y0; y < y0 + 24; y++) for (let x = x0; x < x0 + 24; x++) { const L = wgLeafPile(x, y); if (!L) continue; n++; at.push([x, y]);
      const gr = GROUND[wgGround(w, 'o', x, y)].id, tree = WG_LEAF_N8.some(([i, j]) => { const o = OBJ[wgObjAt(w, 'o', x + i, y + j)], T = o && WG_SEASON_TREES[o.id]; return o && o.kind === 'tree' && T && T[1]; });
      if ((gr !== 'grass' && gr !== 'jungle') || wgObjAt(w, 'o', x, y) || !tree) bad++; } return [n, bad, at]; };
  for (let y = y0 - 1; y < y0 + 25; y++) for (let x = x0 - 1; x < x0 + 25; x++) { wgSetGround(w, 'o', x, y, G_ID.grass); wgSetObj(w, 'o', x, y, (x - x0) % 4 === 0 && (y - y0) % 4 === 0 ? O_ID.oak : 0); } // a grove of oaks
  WGS.day = 8; const summer = count(); WGS.day = 16; const autumn = count(); window._lf = autumn[2]; return [summer[0], autumn[0], autumn[1]]; })()`);
ok(r[0] === 0 && r[1] > 10 && r[2] === 0, 'heaps only in autumn, on grass beside a turning tree: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, st = () => w.meta.stats.leaves | 0, [x, y] = _lf[0], [x2, y2] = _lf[1], res = [];
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGLF.gone.clear(); WGS.remote = [];
  const at = (tx, ty) => { p.x = tx * 16 + 8; p.y = ty * 16 + 10; updateWG(1 / 60); }, [ox, oy] = [[0, 3], [3, 0], [-3, 0], [0, -3], [3, 3], [-3, -3]].map(([i, j]) => [x + i, y + j]).find(([a, b]) => !wgLeafPile(a, b)), off = () => at(ox, oy); // a tile with no heap
  off(); res.push(st()); at(x, y); res.push(st(), WGLF.gone.has(x + ',' + y)); at(x, y); res.push(st()); off(); at(x, y); res.push(st());
  WGLF.gone.set(x + ',' + y, WGS.t - WG_LEAF_BACK - 1); off(); at(x, y); res.push(st());
  WGS.remote = [{ pid: 2, x: x2 * 16 + 8, y: y2 * 16 + 10, dim: 'o', moving: 1 }]; off(); res.push(WGLF.gone.has(x2 + ',' + y2), st()); WGS.remote = [];
  return res; })()`);
ok(r.join() === '0,1,true,1,1,2,true,2', 'a step in scatters it and counts once, until it gathers again; a friend scatters without counting: ' + JSON.stringify(r));
r = await g.ev(`(() => { const C = {}; for (const s of ['pile', 'small', 'bits']) for (const v of [0, 1, 2]) C[s + v] = WGA.cache['leaf_' + s + v]; const D = ctx.drawImage.bind(ctx), n = { pile: 0, small: 0, bits: 0 };
  ctx.drawImage = function (img) { for (const k in C) if (C[k] === img) n[k.slice(0, -1)]++; return D(...arguments); };
  const [x, y] = _lf[0], p = WGS.p; p.x = x * 16 + 8; p.y = (y + 3) * 16 + 10; WGS.cam.x = p.x; WGS.cam.y = p.y;
  try { WGLF.gone.clear(); WGLF.gone.set(x + ',' + y, WGS.t - 1); wgDrawWorld(); const a = Object.assign({}, n); WGLF.gone.set(x + ',' + y, WGS.t - WG_LEAF_BACK * 0.75); for (const k in n) n[k] = 0; wgDrawWorld(); const b = Object.assign({}, n);
    for (const k in n) n[k] = 0; WGS.day = 8; wgDrawWorld(); const c = n.pile + n.small + n.bits; WGS.day = 16; for (const k in n) n[k] = 0; WGS.dim = 'u'; wgDrawWorld(); WGS.dim = 'o'; return [a, b, c, n.pile + n.small + n.bits]; } finally { ctx.drawImage = D; } })()`);
ok(r[0].pile > 0 && r[0].bits === 1 && r[1].small === 1 && r[2] === 0 && r[3] === 0, 'heaps, strewn leaves once scattered, a small heap gathering; none in summer or in a cave: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.leaves = 9; wgAchTick(); const a = !!m.ach.leaves; m.stats.leaves = 10; wgAchTick(); return [a, !!m.ach.leaves]; })()`);
ok(!r[0] && r[1], 'LEAF LEAPER after ten: ' + JSON.stringify(r));
const EN = ['LEAF LEAPER', 'JUMP INTO TEN LEAF PILES'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: an autumn wood, one heap just scattered
await g.ev(`(() => { const [x, y] = _lf[0], p = WGS.p; WGS.day = 16; p.x = x * 16 + 12; p.y = y * 16 + 10; p.face = 'd'; WGS.cam.x = p.x; WGS.cam.y = p.y; WGLF.gone.clear(); WGS.toast = null;
  WGS.clock = 0.4; WGS.weather = null; WGS.wxT = 9999; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('leaves', await g.shot('wg_leaves.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'LEAVES OK' : 'LEAVES FAIL'); g.close(); process.exit(pass ? 0 : 1);
