// Wildgrove's bees: three from each beehive in view on a dry day go out to the flowers near it, hover at one and come
// home, a hen house sends none; with no flower near they loop about the hive; the same clock gives the same places;
// none at night, in the rain, in winter, below ground or with the ambient life off; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BEES' }, seed: { v: '73' }, look: { skin: 1, hair: 0, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -8; j < 9; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; wgOpt().amb = 1; WGS.weather = null; WGS.wxT = 9999; WGS.clock = 0.45; WGS.day = 9;
  wgSetObj(w, 'o', x - 4, y - 2, O_ID.beehive); for (const [i, j, f] of [[-1, -3, 'flower_r'], [-2, 0, 'flower_y'], [-7, 1, 'flower_b']]) wgSetObj(w, 'o', x + i, y + j, O_ID[f]);
  if (O_ID.henhouse) wgSetObj(w, 'o', x + 6, y - 2, O_ID.henhouse);
  WGBE.scanT = 0; const run = (s) => { for (let i = 0; i < s * 60; i++) { WGS.cam.x = p.x; WGS.cam.y = p.y; updateWG(1 / 60); } };
  const R = rect; const count = () => { let n = 0; rect = function (a, b, c, d, k) { if (k === 'u' && c === 1 && d === 1) n++; return R(...arguments); };
    try { wgDrawAmbient(Math.round(WGS.cam.x) - VW / 2, Math.round(WGS.cam.y) - VH / 2); } finally { rect = R; } return n; };`;
let r = await g.ev(`(() => { ${setup} run(1.2); const H = WGBE.hives, res = [H.length, H[0] && H[0].fl.length]; const P = { x: 0, y: 0, z: 0 }, at = new Set(); let out = 0, home = 0, max = 0;
  for (let i = 0; i < 600; i++) { const T = i / 20; for (let b = 0; b < 3; b++) if (wgBeeAt(H[0], b, T, P)) { out++; max = Math.max(max, Math.hypot(P.x - H[0].x, P.y - H[0].y)); const f = H[0].fl.findIndex(([fx, fy]) => Math.hypot(P.x - fx, P.y - fy) < 4); if (f >= 0) at.add(f); } else home++; }
  res.push(at.size, out > home * 5, home > 0, Math.round(max)); return res; })()`);
ok(r[0] === 1 && r[1] === 3, 'beehives in view are found with the flowers near them, a hen house is not: ' + JSON.stringify(r.slice(0, 2)));
ok(r[2] >= 2 && r[3] && r[4] && r[5] < 5 * 16 * 1.5, 'its bees go out to the flowers, hover there and come home: ' + JSON.stringify(r.slice(2)));
r = await g.ev(`(() => { ${setup} run(1.2); const n = count(); const a = []; const P = { x: 0, y: 0, z: 0 }; wgBeeAt(WGBE.hives[0], 1, 123.4, P); a.push(P.x, P.y, P.z); wgBeeAt(WGBE.hives[0], 1, 123.4, P); return [n, a[0] === P.x && a[1] === P.y && a[2] === P.z]; })()`);
ok(r[0] >= 1 && r[0] <= 3 && r[1], 'drawn as they fly, the same clock giving the same places: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} for (const [i, j] of [[-1, -3], [-2, 0], [-7, 1]]) wgSetObj(w, 'o', x + i, y + j, 0); run(1.2); const H = WGBE.hives[0], P = { x: 0, y: 0, z: 0 }; let max = 0;
  for (let i = 0; i < 300; i++) for (let b = 0; b < 3; b++) if (wgBeeAt(H, b, i / 10, P)) max = Math.max(max, Math.hypot(P.x - H.x, P.y - H.y)); return [H.fl.length, Math.round(max)]; })()`);
ok(r[0] === 0 && r[1] < 24, 'with no flower near they loop about the hive: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = []; WGS.clock = 0.97; run(1.2); res.push(WGBE.hives.length, count()); WGS.clock = 0.45;
  WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; run(1.2); res.push(WGBE.hives.length); WGS.weather = null; WGS.day = 25; run(1.2); res.push(wgSeason(), WGBE.hives.length); WGS.day = 9;
  wgOpt().amb = 0; run(1.2); res.push(WGBE.hives.length); wgOpt().amb = 1; WGS.dim = 'u'; run(1.2); res.push(WGBE.hives.length); WGS.dim = 'o'; run(1.2); res.push(WGBE.hives.length); return res; })()`);
ok(r[0] === 0 && r[1] === 0 && r[2] === 0 && r[3] === 3 && r[4] === 0 && r[5] === 0 && r[6] === 0 && r[7] === 1, 'none at night, in the rain, in winter, below ground or with the ambient life off: ' + JSON.stringify(r));
// a look: a beehive by a flower bed
await g.ev(`(() => { ${setup} for (const [i, j, f] of [[-3, -3, 'flower_p'], [0, -2, 'flower_w'], [-5, 0, 'flower_r'], [-6, -3, 'oak'], [2, 2, 'tallgrass']]) wgSetObj(w, 'o', x + i, y + j, O_ID[f]);
  WGS.toast = null; for (let k = 0; k < 36; k++) WGS.inv[k] = null; p.x -= 24; p.face = 'l'; Input.mx = 4; Input.my = 4; run(1.2); })(); 0`);
await sleep(80); console.log('bees', await g.shot('wg_bees.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BEES OK' : 'BEES FAIL'); g.close(); process.exit(pass ? 0 : 1);
