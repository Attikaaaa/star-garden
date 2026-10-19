// Wildgrove's footprints: walking on snow leaves prints, left and right, lying across the way of a walk sideways; none
// on grass; a friend leaves them too, not on a bike; they fade and go after WG_PRINT_T, never more than WG_PRINT_MAX;
// drawn on the ground; another world starts clean; a look at a trail in the snow.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PRINT' }, seed: { v: '81' }, look: { skin: 0, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -4; j < 6; j++) for (let i = -6; i < 9; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, j < 2 ? G_ID.snow : G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.remote = []; p.x = (x - 4) * 16 + 8; p.y = y * 16 + 10; WGFP.list.length = 0; window._fp = { x, y }; WGS.wxT = 9999; WGS.weather = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(100); await g.press('KeyD', 700); await sleep(100);
let r = await g.ev(`[WGFP.list.length, WGFP.list.every(f => f.c === 'd' && !f.up && f.d === WGS.dim), new Set(WGFP.list.map(f => f.y)).size]`);
ok(r[0] >= 3 && r[1] && r[2] === 2, 'a walk on snow leaves prints, left and right, across the way: ' + JSON.stringify(r));
await g.ev(`(() => { const p = WGS.p; p.y = (_fp.y + 3) * 16 + 10; WGFP.list.length = 0; })(); 0`);
await g.press('KeyA', 500); await sleep(100);
r = await g.ev(`WGFP.list.length`);
ok(r === 0, 'none on grass: ' + r);
r = await g.ev(`(() => { const { x, y } = _fp, q = { pid: 2, x: x * 16 + 8, y: y * 16 + 10, dim: WGS.dim, face: 'd', moving: 1, walkT: 0.5, bike: 1 }, res = []; WGS.remote = [q]; WGFP.list.length = 0;
  updateWG(1 / 60); q.walkT = 1.5; updateWG(1 / 60); res.push(WGFP.list.length); q.bike = 0; q.walkT = 2.5; updateWG(1 / 60); res.push(WGFP.list.length, WGFP.list[0] && WGFP.list[0].up); WGS.remote = []; return res; })()`);
ok(r.join() === '0,1,true', 'a friend leaves them too, not on a bike: ' + JSON.stringify(r));
r = await g.ev(`(() => { const L = WGFP.list; L[0].t = WGS.t - WG_PRINT_T - 1; updateWG(1 / 60); const a = L.length; for (let i = 0; i < 400; i++) wgPrintStep('t', { x: _fp.x * 16 + 8, y: _fp.y * 16 + 10, face: 'r' }, WGS.dim, i, false); return [a, L.length]; })()`);
ok(r[0] === 0 && r[1] === 180, 'they go after their time, never more than the cap: ' + JSON.stringify(r));
r = await g.ev(`(() => { const R = rect; let n = 0; rect = function (x, y, w, h) { if (w === 2 && h === 2) n++; return R.apply(this, arguments); };
  try { const p = WGS.p; WGS.cam.x = _fp.x * 16 + 8; WGS.cam.y = _fp.y * 16; wgDrawWorld(); const a = n; WGFP.list.length = 0; n = 0; wgDrawWorld(); return [a, n]; } finally { rect = R; } })()`);
ok(r[0] >= 100 && r[0] - r[1] >= 100, 'drawn on the ground: ' + JSON.stringify(r));
// a look: a trail through the snow, down and then across
await g.ev(`(() => { const { x, y } = _fp, p = WGS.p; WGFP.list.length = 0; p.x = (x - 4) * 16 + 8; p.y = (y - 3) * 16 + 10; WGS.cam.x = x * 16; WGS.cam.y = y * 16 - 8; WGS.clock = 0.35; WGS.toast = null; })(); 0`);
await g.press('KeyS', 450); await g.press('KeyD', 900); await sleep(150);
console.log('prints', await g.shot('wg_prints.png'));
r = await g.ev(`(() => { const L = WGFP.list; WGS.world = Object.assign({}, WGS.world); updateWG(1 / 60); return L.length; })()`);
ok(r === 0, 'another world starts clean: ' + r);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PRINTS OK' : 'PRINTS FAIL'); g.close(); process.exit(pass ? 0 : 1);
