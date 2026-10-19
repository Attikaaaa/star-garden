// Wildgrove's windmill: a station made at a bench that grinds a wheat into a flour and corn into cornmeal, and cornbread
// bakes at a fire; USE opens the recipe book; its sails turn from the world's clock alone (the same frame for the same
// clock), never standing still, quicker in the rain; its window glows by night; baking cornbread lights MILLER;
// Hungarian; a look by day and by night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'WINDMILL' }, seed: { v: '67' }, look: { skin: 2, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; w.meta.ach = { mill: 1 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.weather = null; WGS.wxT = 9999;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0;`;
let r = await g.ev(`(() => { const R = (out, at) => RECIPES.find(q => q.out === out && q.at === at);
  const W = R('windmill', 'bench'), F = R('flour', 'windmill'), C = R('cornmeal', 'windmill'), B = R('cornbread', 'fire');
  return [!!W, OBJ[O_ID.windmill].kind, OBJ[O_ID.windmill].st, WG_AT.windmill, F && F.in.wheat, C && C.in.corn, B && B.in.cornmeal, WGI.cornbread.food, !!wgIcon('cornmeal'), !!wgIcon('cornbread'), !!wgIcon('windmill'), !!(WGA.obj.windmill && WGA.obj.windmill[0])]; })()`);
ok(r[0] && r[1] === 'station' && r[2] === 'windmill' && r[3] === 'AT A WINDMILL' && r[4] === 1 && r[5] === 2 && r[6] === 2 && r[7] === 9 && r.slice(8).every(Boolean), 'a station from a bench that grinds wheat and corn, cornbread at a fire: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 1, y, O_ID.windmill); const a = wgUse(x + 1, y); return [a, WGS.scr, WGS.ui.tab]; })()`);
ok(r[0] === true && r[1] === 'inv' && r[2] === 'craft', 'USE opens the recipe book: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const c0 = WGS.clock, D = WGS.day, res = {}; WGS.day = 4;
  const frames = (n, step) => { const f = []; for (let i = 0; i < n; i++) { WGS.clock = 0.3 + i * step; f.push(wgMillFrame()); } return f; };
  const step = 1 / 60 / wgDayLen(); // a frame of the world's clock
  const dry = frames(600, step); WGS.clock = 0.31; const a = wgMillFrame(); WGS.clock = 0.31; const b = wgMillFrame(); res.same = a === b;
  const ch = (f) => f.filter((v, i) => i && v !== f[i - 1]).length, gap = (f) => { let m = 0, run = 0; for (let i = 1; i < f.length; i++) { if (f[i] === f[i - 1]) run++; else run = 0; m = Math.max(m, run); } return m; };
  res.dry = [ch(dry), gap(dry)]; res.back = dry.some((v, i) => i && v !== f0(dry[i - 1]) && v !== dry[i - 1]);
  function f0(v) { return (v + 1) & 3; }
  WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.rain = ch(frames(600, step)); WGS.weather = null;
  WGS.clock = c0; WGS.day = D; return res; })()`);
ok(r.same && r.dry[0] > 14 && r.dry[1] < 40 && !r.back && r.rain > r.dry[0] * 1.3, 'its sails turn from the clock alone, never standing still or backwards, quicker in the rain: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 1, y, O_ID.windmill); const res = [];
  for (const c of [0.5, 0.97]) { WGS.clock = c; WGR.lights.length = 0; wgDrawObj(O_ID.windmill, x + 1, y, 100, 100); res.push(WGR.lights.length); } return res; })()`);
ok(r[0] === 0 && r[1] === 1, 'its window glows by night: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const s0 = p.seen; w.meta.ach = {}; p.seen = Object.assign({}, s0, { cornmeal: 1 }); wgAchTick(); const a = !!w.meta.ach.mill; p.seen.cornbread = 1; wgAchTick(); const b = !!w.meta.ach.mill; p.seen = Object.assign(s0 || {}, p.seen);
  return [a, b, wgTipLines({ id: 'windmill', n: 1 }).includes('GRINDS WHEAT AND CORN')]; })()`);
ok(r[0] === false && r[1] === true && r[2], 'baking cornbread lights MILLER; the tip says what it grinds: ' + JSON.stringify(r));
const EN = ['WINDMILL', 'AT A WINDMILL', 'CORNMEAL', 'CORNBREAD', 'MILLER', 'BAKE CORNBREAD FROM YOUR OWN CORNMEAL', 'GRINDS WHEAT AND CORN'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a windmill among wheat by day, then by night
const look = (clock) => `(() => { ${setup} for (let j = 1; j <= 3; j++) for (let i = -6; i <= 6; i++) if (i < -1 || i > 1) { wgSetGround(w, d, x + i, y + j, G_ID.tilled); wgSetObj(w, d, x + i, y + j, O_ID.crop_wheat, 3); }
  for (const [i, j, o] of [[0, -2, 'windmill'], [-5, -3, 'oak'], [6, -2, 'birch'], [3, -1, 'hay']]) wgSetObj(w, d, x + i, y + j, O_ID[o]);
  p.y = y * 16 + 12; p.face = 'u'; WGS.day = 3; WGS.clock = ${clock}; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 24; })(); 0`;
await g.ev(look(0.45)); await sleep(100); console.log('day', await g.shot('wg_windmill.png'));
await g.ev(look(0.96)); await sleep(100); console.log('night', await g.shot('wg_windmill_night.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'WINDMILL OK' : 'WINDMILL FAIL'); g.close(); process.exit(pass ? 0 : 1);
