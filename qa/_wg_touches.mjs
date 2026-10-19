// Wildgrove's little touches: ripe sunflowers face east in the morning, up at noon, west in the afternoon and droop at
// night (unripe ones and those underground as ever); crickets chirp on spring and summer nights on grass, never by day,
// in winter, in the rain or off the grass; dew glints at dawn and dries by mid-morning, frost in winter, more of it;
// smoke curls from campfires, leaning with the wind; none of the ambient ones with the ambient life off; a look at dawn.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TOUCHES' }, seed: { v: '107' }, look: { skin: 2, hair: 3, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -8; j < 9; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; wgOpt().amb = 1; WGS.weather = null; WGS.wxT = 9999; WGS.day = 9; WGS.clock = 0.5;
  const run = (s) => { for (let i = 0; i < s * 60; i++) { WGS.cam.x = p.x; WGS.cam.y = p.y; updateWG(1 / 60); } };
  const D = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push(img); return D(...arguments); }; try { fn(); } finally { ctx.drawImage = D; } return L; };
  const R = rect; const rects = (fn) => { const L = []; rect = function (a, b, c, e, k) { L.push([a, b, c, e, k]); return R(...arguments); }; try { fn(); } finally { rect = R; } return L; };`;
let r = await g.ev(`(() => { ${setup} wgSetGround(w, 'o', x + 2, y, G_ID.tilled); wgSetObj(w, 'o', x + 2, y, O_ID.crop_sun, 3); const res = {};
  for (const c of [0.3, 0.5, 0.7, 0.97]) { WGS.clock = c; const L = imgs(() => wgDrawObj(O_ID.crop_sun, x + 2, y, 100, 100)); res[c] = [wgSunFace(), L.includes(wgSunArt(1)) ? 'E' : L.includes(wgSunArt(-1)) ? 'W' : L.includes(wgSunArt(2)) ? 'Z' : L.includes(WGA.obj.crop_sun[3].c) ? 'U' : '?'] }
  wgSetObj(w, 'o', x + 2, y, O_ID.crop_sun, 2); WGS.clock = 0.3; res.young = imgs(() => wgDrawObj(O_ID.crop_sun, x + 2, y, 100, 100)).includes(WGA.obj.crop_sun[2].c); WGS.dim = 'u'; res.under = wgSunFace(); WGS.dim = 'o'; return res; })()`);
ok(r['0.3'].join() === '1,E' && r['0.5'].join() === '0,U' && r['0.7'].join() === '-1,W' && r['0.97'].join() === '2,Z' && r.young && r.under === 0, 'ripe sunflowers face east, up, west and droop at night; young ones and those underground as ever: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const F = wgSfx; const count = (s) => { let n = 0; wgSfx = (q) => { if (q === 'cricket') n++; }; try { run(s); } finally { wgSfx = F; } return n; };
  const res = []; WGS.day = 9; WGS.clock = 0.97; res.push(wgSeason(), count(30)); WGS.clock = 0.5; res.push(count(15)); WGS.clock = 0.97;
  WGS.day = 25; res.push(count(15)); WGS.day = 9; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.push(count(15)); WGS.weather = null;
  wgSetGround(w, 'o', x, y, G_ID.sand); res.push(count(15)); wgSetGround(w, 'o', x, y, G_ID.grass); wgOpt().amb = 0; res.push(count(15)); wgOpt().amb = 1; return res; })()`);
ok(r[0] <= 1 && r[1] >= 2 && r[1] <= 8 && r.slice(2).every(n => n === 0), 'crickets chirp on spring and summer nights on grass, never by day, in winter, in the rain, off the grass or with the ambient life off: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = []; const beads = () => rects(() => wgChunkUpkeep(w, 'o', Math.floor(x / 32) - 1, Math.floor(y / 32) - 1, Math.floor(x / 32) + 1, Math.floor(y / 32) + 1)).filter(q => q[2] === 1 && q[3] === 1 && (q[4] === 'C' || q[4] === 'w')).length;
  for (const c of [0.15, 0.24, 0.3, 0.45]) { WGS.clock = c; res.push(+wgDewK().toFixed(2), beads()); }
  WGS.clock = 0.27; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.push(wgDewK()); WGS.weather = null; wgOpt().amb = 0; res.push(wgDewK()); wgOpt().amb = 1;
  let a = 0, b = 0; for (let j = 0; j < 60; j++) for (let i = 0; i < 60; i++) { WGS.day = 9; if (wgDewAt(i, j)) a++; WGS.day = 25; if (wgDewAt(i, j)) b++; } WGS.day = 25; WGS.clock = 0.4; res.push(a, b, wgDewK() > 0); WGS.day = 9; return res; })()`);
ok(r[0] === 0 && r[1] === 0 && r[2] > 0 && r[3] > 20 && r[4] > 0 && r[5] > 0 && r[6] === 0 && r[7] === 0, 'dew glints at dawn and dries by mid-morning: ' + JSON.stringify(r.slice(0, 8)));
ok(r[8] === 0 && r[9] === 0, 'none in the rain or with the ambient life off: ' + JSON.stringify(r.slice(8, 10)));
ok(r[11] > r[10] * 1.3 && r[12], 'frost in winter, more of it, lasting longer: ' + JSON.stringify(r.slice(10)));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y, O_ID.campfire); const res = []; const puffs = () => rects(() => wgDrawObj(O_ID.campfire, x + 2, y, 100, 100)).filter(q => q[4] === 'w' || q[4] === 'L');
  const P = puffs(); res.push(P.length, P.every(q => q[1] < 104 && q[1] > 70));
  let lean = 0; const t0 = WGS.t; for (let i = 0; i < 60; i++) { WGS.t = t0 + i / 10; for (const q of puffs()) if (q[1] < 90) lean += q[0] + q[2] / 2 - 108; } WGS.t = t0; res.push(Math.sign(lean) === Math.sign(Math.sin(wgWindA())) || Math.abs(Math.sin(wgWindA())) < 0.1);
  wgOpt().amb = 0; res.push(puffs().length); wgOpt().amb = 1; return res; })()`);
ok(r[0] === 3 && r[1] && r[2] && r[3] === 0, 'smoke curls up from a campfire, leaning with the wind; none with the ambient life off: ' + JSON.stringify(r));
// a look: a garden at dawn, dew on the grass, sunflowers facing east, a campfire smoking
await g.ev(`(() => { ${setup} for (let i = 2; i <= 6; i++) { wgSetGround(w, 'o', x + i, y - 2, G_ID.tilled); wgSetObj(w, 'o', x + i, y - 2, O_ID.crop_sun, 3); }
  for (const [i, j, o] of [[-4, -1, 'campfire'], [-7, -4, 'oak'], [8, 2, 'birch'], [-2, 2, 'flower_w']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGS.day = 4; WGS.clock = 0.29; WGS.toast = null; for (let k = 0; k < 36; k++) WGS.inv[k] = null; p.face = 'u'; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(100); console.log('touches', await g.shot('wg_touches.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'TOUCHES OK' : 'TOUCHES FAIL'); g.close(); process.exit(pass ? 0 : 1);
