// Wildgrove's drifting petals and leaves: in spring blossoming trees let petals go in their colours, never more than
// WG_DRIFT_MAX, each falls, settles and fades; in summer none; in autumn a turning tree's leaves in its own colours;
// none with the ambient life off or underground, and another world starts clean; drawn over the world; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'DRIFT' }, seed: { v: '37' }, look: { skin: 2, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -12; j < 14; j++) for (let i = -18; i < 19; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.weather = null; WGS.wxT = 9999; window._dr = { x, y }; Input.mx = 4; Input.my = 4;
  window._plant = (id) => { for (const [i, j] of [[-6, -3], [-2, -4], [3, -3], [7, -4], [-5, 2], [5, 2]]) wgSetObj(w, d, x + i, y + j, O_ID[id]); };
  wgGrowTick = function () {}; // no fruit tree ripens (and stops blossoming) halfway through
  window._run = (n) => { let most = 0; for (let i = 0; i < n; i++) { updateWG(1 / 60); most = Math.max(most, WGDR.list.length); } return most; }; })(); 0`);
let r = await g.ev(`(() => { WGS.day = 2; _plant('tree_apple'); const most = _run(900), L = WGDR.list; return [most, L.length, L.every(q => ['w', 'L', 'q'].includes(q.c)), L.some(q => q.rest > 0), WGDR.src.length]; })()`);
ok(r[0] > 3 && r[0] <= 12 && r[2] && r[3] && r[4] === 6, 'in spring blossoming trees let petals go, a dozen at most, and they settle: ' + JSON.stringify(r));
r = await g.ev(`(() => { const seen = new Set(), rested = new Set(); for (let i = 0; i < 900; i++) { updateWG(1 / 60); for (const q of WGDR.list) { seen.add(q); if (q.rest > 1.7) rested.add(q); } } return [seen.size, rested.size, [...seen].filter(q => q.rest > 0 && !WGDR.list.includes(q)).length]; })()`);
ok(r[0] > 8 && r[1] > 3 && r[2] > 3, 'each falls, lies a while and goes: ' + JSON.stringify(r));
r = await g.ev(`(() => { WGS.day = 10; _run(60); const a = WGDR.src.length; _run(600); return [a, WGDR.list.length]; })()`);
ok(r[0] === 0 && r[1] === 0, 'in summer none: ' + JSON.stringify(r));
r = await g.ev(`(() => { WGS.day = 18; const { x, y } = _dr, w = WGS.world, d = WGS.dim; _plant('oak'); _run(900);
  const want = new Map(); for (const [i, j] of [[-6, -3], [-2, -4], [3, -3], [7, -4], [-5, 2], [5, 2]]) want.set((x + i) + ',' + (y + j), wgDriftCols('oak', x + i, y + j, 2));
  const fine = WGDR.src.every(s => { const c = want.get(s.x + ',' + s.y); return c && c.join() === s.cols.join() && s.leaf; }), all = new Set(WG_AUT.o.concat(WG_AUT.r, WG_AUT.g));
  return [WGDR.src.length, fine, WGDR.list.length, WGDR.list.every(q => all.has(q.c)), new Set(WGDR.src.map(s => s.cols.join())).size]; })()`);
ok(r[0] === 6 && r[1] && r[2] > 3 && r[3] && r[4] >= 2, "in autumn a turning tree's leaves in its own colours: " + JSON.stringify(r));
r = await g.ev(`(() => { const F = ctx.fillRect.bind(ctx); let n = 0; ctx.fillRect = function () { n++; return F(...arguments); }; try { wgDrawAmbient(Math.round(WGS.cam.x) - VW / 2, Math.round(WGS.cam.y) - VH / 2); } finally { ctx.fillRect = F; } return [n >= WGDR.list.length, WGDR.list.length]; })()`);
ok(r[0] && r[1] > 0, 'drawn over the world: ' + JSON.stringify(r));
r = await g.ev(`(() => { const o = wgOpt(), a0 = o.amb; o.amb = 0; _run(2); const a = WGDR.list.length; _run(300); const b = WGDR.list.length; o.amb = a0; _run(600); const c = WGDR.list.length;
  WGS.world = Object.assign({}, WGS.world); updateWG(1 / 60); return [a, b, c > 0, WGDR.list.length]; })()`);
ok(r[0] === 0 && r[1] === 0 && r[2] && r[3] === 0, 'none with the ambient life off; another world starts clean: ' + JSON.stringify(r));
// a look: a spring afternoon among cherry and apple trees
await g.ev(`(() => { const { x, y } = _dr, w = WGS.world, d = WGS.dim; WGS.day = 4; for (const [i, j, k] of [[-6, -3, 'tree_cherry'], [-2, -4, 'tree_apple'], [3, -3, 'tree_cherry'], [7, -4, 'tree_apple'], [-5, 2, 'tree_apple'], [5, 2, 'tree_cherry']]) wgSetObj(w, d, x + i, y + j, O_ID[k]);
  WGS.clock = 0.45; WGS.toast = null; _run(1200); })(); 0`);
await sleep(200); console.log('drift', await g.shot('wg_drift.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'DRIFT OK' : 'DRIFT FAIL'); g.close(); process.exit(pass ? 0 : 1);
