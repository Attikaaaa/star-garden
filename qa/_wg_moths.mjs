// Wildgrove's moths at the lamps: on dry nights outdoors one to three moths flutter round each lamp in view, close to
// its flame, drawn over the dark; none by day, in the rain, below ground or with the ambient life off; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'MOTHS' }, seed: { v: '71' }, look: { skin: 3, hair: 2, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -8; j < 9; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; wgOpt().amb = 1; WGS.weather = null; WGS.wxT = 9999; WGS.clock = 0.97;
  const lamps = [['lamppost', -4, -2], ['lantern', 3, -2], ['torch', 5, 2], ['oak', -6, 3]]; for (const [o, i, j] of lamps) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGMO.scanT = 0; const run = (s) => { for (let i = 0; i < s * 60; i++) { WGS.cam.x = p.x; WGS.cam.y = p.y; updateWG(1 / 60); } };
  const R = rect; const count = () => { let n = 0, near = 0; rect = function (a, b, c, d, k) { if (k === 'L') { n++; const X = a + WGS.cam.x - VW / 2, Y = b + WGS.cam.y - VH / 2; if (WGMO.lamps.some(l => Math.hypot(l.x - X, l.y - Y) < 18)) near++; } return R(...arguments); };
    try { const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2; wgDrawLight(cx0, cy0); } finally { rect = R; } return [n, near]; };`;
let r = await g.ev(`(() => { ${setup} run(1); const L = WGMO.lamps.map(l => l.n), c = count(); return [WGMO.lamps.length, L, c]; })()`);
ok(r[0] === 3 && r[1].every(n => n >= 1 && n <= 3) && r[2][0] === r[1].reduce((a, b) => a + b, 0) && r[2][1] === r[2][0], 'on a dry night one to three moths flutter round each lamp, close to its flame: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} run(1); const P = []; for (let i = 0; i < 40; i++) { run(1 / 20); const c = count(); P.push(c[0]); } return [Math.min(...P), Math.max(...P)]; })()`);
ok(r[0] > 0, 'they keep fluttering: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = []; WGS.clock = 0.5; run(1); res.push(WGMO.lamps.length, count()[0]);
  WGS.clock = 0.97; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; run(1); res.push(WGMO.lamps.length, count()[0]); WGS.weather = null;
  wgOpt().amb = 0; run(1); res.push(WGMO.lamps.length); wgOpt().amb = 1; WGS.dim = 'u'; run(1); res.push(WGMO.lamps.length); WGS.dim = 'o'; run(1); res.push(WGMO.lamps.length); return res; })()`);
ok(r.slice(0, 6).every(v => v === 0) && r[6] === 3, 'none by day, in the rain, below ground or with the ambient life off: ' + JSON.stringify(r));
// a look: a lamp-lit path at night
await g.ev(`(() => { ${setup} for (let i = -8; i <= 8; i++) wgSetGround(w, 'o', x + i, y + 1, G_ID.gravel || G_ID.dirt); for (const [o, i, j] of [['flower_w', -2, 3], ['flower_p', 2, -1], ['hedge', 7, -1]]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGS.day = 9; WGS.toast = null; for (let k = 0; k < 36; k++) WGS.inv[k] = null; p.face = 'u'; Input.mx = 4; Input.my = 4; run(0.6); })(); 0`);
await sleep(80); console.log('moths', await g.shot('wg_moths.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'MOTHS OK' : 'MOTHS FAIL'); g.close(); process.exit(pass ? 0 : 1);
