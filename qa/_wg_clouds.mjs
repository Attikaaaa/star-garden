// Wildgrove's cloud shadows: three shapes baked faint with a dithered rim; the field is the same for the same clock and
// slides with it; they show on a clear day, fade at night, under rain, underground and with the weather effects off;
// drawn over the land; a look at a sunny meadow.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'CLOUD' }, seed: { v: '61' }, look: { skin: 2, hair: 3, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => [0, 1, 2].map(i => { const c = wgCloudArt(i), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, edge = 0, maxA = 0; for (let k = 3; k < d.length; k += 4) if (d[k]) { n++; maxA = Math.max(maxA, d[k]); } return [n > 2000, maxA < 50]; }))()`);
ok(r.every(a => a[0] && a[1]), 'three shapes, faint: ' + JSON.stringify(r));
r = await g.ev(`(() => { WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.day = 3; WGS.clock = 0.4; const a = wgCloudList(-2000, -2000, 2000, 2000), b = wgCloudList(-2000, -2000, 2000, 2000);
  WGS.clock = 0.4 + 10 / wgDayLen(); const c = wgCloudList(-2000, -2000, 2000, 2000); WGS.clock = 0.4;
  const moved = a.filter(q => c.some(k => k[2] === q[2] && Math.abs(k[0] - q[0] - 60) <= 1 && Math.abs(k[1] - q[1] - 20) <= 1)).length >= a.length - 3;
  return [a.length, JSON.stringify(a) === JSON.stringify(b), moved, new Set(a.map(q => q[2])).size]; })()`);
ok(r[0] > 30 && r[0] < 90 && r[1] && r[2] && r[3] === 3, 'the same field for the same clock, sliding with it: ' + JSON.stringify(r));
r = await g.ev(`(() => { const run = (n) => { for (let i = 0; i < n; i++) updateWG(1 / 60); return Math.round(WGCS.k * 100) / 100; }, o = wgOpt(), res = [];
  WGS.weather = null; WGS.wxT = 9999; WGS.clock = 0.4; res.push(run(600));
  WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; res.push(run(600)); WGS.weather = null; res.push(run(600));
  WGS.clock = 0.9; res.push(run(700)); WGS.clock = 0.4; run(600); o.wx = 0; res.push(run(600)); o.wx = 1; run(600); return res; })()`);
ok(r[0] === 1 && r[1] === 0 && r[2] === 1 && r[3] === 0 && r[4] === 0, 'a clear day shows them; rain, night and the weather effects off fade them: ' + JSON.stringify(r));
r = await g.ev(`(() => { const p = WGS.p, L = wgCloudList(p.x - 600, p.y - 600, p.x + 600, p.y + 600), q = L[0]; WGCS.k = 1; WGS.cam.x = q[0] + 88; WGS.cam.y = q[1] + 40;
  const D = ctx.drawImage.bind(ctx); let n = 0; ctx.drawImage = function (img) { if (WGCS.art.includes(img)) n++; return D(...arguments); };
  try { wgDrawAmbient(Math.round(WGS.cam.x) - VW / 2, Math.round(WGS.cam.y) - VH / 2); const a = n; n = 0; WGS.dim = 'u'; WGCS.k = 1; wgDrawAmbient(Math.round(WGS.cam.x) - VW / 2, Math.round(WGS.cam.y) - VH / 2); WGS.dim = 'o'; return [a, n]; } finally { ctx.drawImage = D; } })()`);
ok(r[0] >= 1 && r[1] === 0, 'drawn over the land, not underground: ' + JSON.stringify(r));
// a look: a sunny meadow under drifting clouds
await g.ev(`(() => { const p = WGS.p, L = wgCloudList(p.x - 600, p.y - 600, p.x + 600, p.y + 600), q = L[0]; p.x = q[0] + 40; p.y = q[1] + 60; WGS.clock = 0.42; WGS.weather = null; WGS.toast = null; WGCS.k = 1; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(400); console.log('clouds', await g.shot('wg_clouds.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'CLOUDS OK' : 'CLOUDS FAIL'); g.close(); process.exit(pass ? 0 : 1);
