// Wildgrove's squirrels: about one tree in six has one (fewer in winter); by day it comes down, scampers about, digs
// or sits up, and runs back up, over and over; a hero coming close sends it home and up its tree for a while; none
// come down at night or in the rain; drawn in the world's depth order; none with the ambient life off; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SQUIRREL' }, seed: { v: '38' }, look: { skin: 2, hair: 0, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -9; j < 10; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; wgOpt().amb = 1; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 17; WGS.clock = 0.4; WGSQ.list.clear(); WGSQ.scanT = 0;
  let T0 = null; for (let j = -6; j <= 6 && !T0; j++) for (let i = 3; i <= 6 && !T0; i++) if (wgSqTree(x + i, y + j)) T0 = [x + i, y + j];
  wgSetObj(w, 'o', T0[0], T0[1], O_ID.oak);
  const run = (s, fn) => { for (let i = 0; i < s * 60; i++) { WGS.cam.x = p.x; WGS.cam.y = p.y; updateWG(1 / 60); if (fn) fn(); } };
  const sq = () => WGSQ.list.get(T0[0] + ',' + T0[1]);`;
let r = await g.ev(`(() => { const w = WGS.world; let n = 0, yes = 0, win = 0; const D = WGS.day;
  for (let j = 0; j < 120; j++) for (let i = 0; i < 120; i++) { n++; WGS.day = 17; if (wgSqTree(i, j)) yes++; WGS.day = 25; if (wgSqTree(i, j)) win++; } WGS.day = D; return [n, yes, win]; })()`);
ok(r[1] / r[0] > 0.13 && r[1] / r[0] < 0.21 && r[2] < r[1] * 0.5 && r[2] > 0, 'about one tree in six has a squirrel, fewer in winter: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const seen = new Set(); let drawn = 0; p.x -= 60;
  run(40, () => { const s = sq(); if (s) { seen.add(s.st); if (s.st !== 'tree' && wgEntities(p.x - 300, p.y - 200, p.x + 300, p.y + 200).some(e => e.draw === wgSqDraw)) drawn++; } });
  return [[...seen].sort().join(), drawn > 0, !!sq()]; })()`);
ok(r[2] && ['dig', 'down', 'home', 'look', 'run', 'tree', 'up'].every(k => r[0].split(',').includes(k) || (k === 'dig' || k === 'look') && /dig|look/.test(r[0])), 'by day it comes down, scampers, digs or sits up, and runs back up, over and over: ' + r[0]);
ok(r[1], 'drawn in the world depth order while out of its tree: ' + r[1]);
r = await g.ev(`(() => { ${setup} p.x -= 60; let s; run(30, () => { s = sq(); }); for (let i = 0; i < 1200 && !(sq() && (sq().st === 'dig' || sq().st === 'look')); i++) run(1 / 60); s = sq(); const res = [s && s.st];
  p.x = s.x + 12; p.y = s.y; run(1.2); res.push(s.st); run(2); res.push(s.st, s.wait > 7.9);
  p.x -= 200; return res; })()`);
ok((r[0] === 'dig' || r[0] === 'look') && (r[1] === 'up' || r[1] === 'tree') && r[2] === 'tree' && r[3], 'a hero coming close sends it home and up its tree for a while: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} p.x -= 60; const res = []; let down = 0;
  WGS.clock = 0.95; run(15, () => { const s = sq(); if (s && s.st !== 'tree') down++; }); res.push(down); down = 0;
  WGS.clock = 0.4; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; for (const s of WGSQ.list.values()) { s.st = 'tree'; s.t0 = WGS.t; } run(15, () => { const s = sq(); if (s && s.st !== 'tree') down++; }); res.push(down);
  WGS.weather = null; wgOpt().amb = 0; run(0.2); res.push(WGSQ.list.size); wgOpt().amb = 1; WGS.dim = 'u'; run(0.2); res.push(WGSQ.list.size); WGS.dim = 'o'; return res; })()`);
ok(r[0] === 0 && r[1] === 0, 'none come down at night or in the rain: ' + JSON.stringify(r.slice(0, 2)));
ok(r[2] === 0 && r[3] === 0, 'none with the ambient life off, none underground: ' + JSON.stringify(r.slice(2)));
// a look: an autumn grove, a squirrel out digging, another coming down its trunk
await g.ev(`(() => { ${setup} WGS.day = 18; WGS.clock = 0.45; WGS.toast = null; Input.mx = 4; Input.my = 4;
  const trees = [T0]; for (let j = -5; j <= 5; j++) for (let i = -10; i <= 2; i++) if (trees.length < 3 && wgSqTree(x + i, y + j) && Math.abs(i) + Math.abs(j) > 3) { trees.push([x + i, y + j]); wgSetObj(w, 'o', x + i, y + j, O_ID.oak); }
  for (const [i, j, o] of [[-4, -4, 'birch'], [5, -4, 'oak'], [8, 3, 'birch'], [-8, 3, 'oak'], [1, 4, 'tallgrass'], [-2, 3, 'fern']]) if (!wgObjAt(w, 'o', x + i, y + j)) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  p.x = x * 16 + 8 - 40; p.y = y * 16 + 40; p.face = 'r'; WGS.cam.x = (T0[0] * 16 + p.x) / 2; WGS.cam.y = y * 16; WGSQ.scanT = 0; run(0.05);
  const L = [...WGSQ.list.values()]; if (L[0]) { L[0].st = 'dig'; L[0].t0 = WGS.t; L[0].wait = 99; L[0].x = L[0].tx * 16 - 14; L[0].y = L[0].ty * 16 + 22; L[0].flip = true; }
  if (L[1]) { L[1].st = 'down'; L[1].t0 = WGS.t - 1; L[1].wait = 2; } if (L[2]) { L[2].st = 'look'; L[2].t0 = WGS.t; L[2].wait = 99; L[2].x = L[2].tx * 16 + 26; L[2].y = L[2].ty * 16 + 18; } })(); 0`);
await sleep(60); console.log('squirrel', await g.shot('wg_squirrel.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SQUIRREL OK' : 'SQUIRREL FAIL'); g.close(); process.exit(pass ? 0 : 1);
