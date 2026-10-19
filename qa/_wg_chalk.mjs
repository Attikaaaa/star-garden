// Wildgrove's chalk: white, pink and blue sticks made four at a time; USE on a path, stone, rock, dirt or sand draws a
// doodle in that chalk's colour, the next of six each time (one drawn over gets the next); not on grass or a tile with
// something on it; a stick is spent each time; a doodle is flat and walkable; on the host the rain washes them away;
// drawing all six lights CHALK ARTIST; icons and a tip; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'CHALK' }, seed: { v: '101' }, look: { skin: 0, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  for (let i = -6; i <= 6; i++) wgSetGround(w, d, x + i, y - 1, G_ID.path);
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { chalk: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.weather = null; WGS.wxT = 9999;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; const meta = (i) => wgMetaAt(w, d, x + i, y - 1), id = (i, j = -1) => { const o = OBJ[wgObjAt(w, d, x + i, y + j)]; return o ? o.id : null; };`;
let r = await g.ev(`(() => WG_CHALKS.map(([id, , dye]) => { const R = RECIPES.find(q => q.out === id); return [R.at, R.n, R.in.stone, R.in.bonemeal, dye ? R.in[dye] : 1, !!wgIcon(id), wgTipLines({ id, n: 1 }).includes('DRAWS ON PATHS, STONE AND SAND')]; }))()`);
ok(r.length === 3 && r.every(a => a[0] === 'bench' && a[1] === 4 && a[2] === 1 && a[3] === 1 && a[4] === 1 && a[5] && a[6]), 'white, pink and blue chalk, four at a time, with icons and a tip: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} WGS.inv[0] = { id: 'chalk_p', n: 9 }; const res = [];
  for (let i = 0; i < 6; i++) { wgUse(x - 3 + i, y - 1); res.push([id(i - 3), meta(i - 3)]); }
  wgUse(x - 3, y - 1); res.push(meta(-3)); res.push(WGS.inv[0].n, w.meta.stats.chalk); return res; })()`);
ok(r.slice(0, 6).every((a, i) => a[0] === 'chalk_art' && a[1] === i * 3 + 1), 'each USE on a path draws the next doodle, in pink: ' + JSON.stringify(r.slice(0, 6)));
ok(r[6] === 4 && r[7] === 2 && r[8] === 63, 'a doodle drawn over gets the next; a stick spent each time: ' + JSON.stringify(r.slice(6)));
r = await g.ev(`(() => { ${setup} WGS.inv[0] = { id: 'chalk', n: 5 }; const res = []; wgUse(x + 2, y + 1); res.push(id(2, 1)); wgSetObj(w, d, x + 3, y - 1, O_ID.flower_r); wgUse(x + 3, y - 1); res.push(id(3));
  wgSetGround(w, d, x + 4, y + 2, G_ID.sand); wgUse(x + 4, y + 2); res.push(id(4, 2)); wgSetGround(w, d, x + 5, y + 2, G_ID.f_stone); wgUse(x + 5, y + 2); res.push(id(5, 2), WGS.inv[0].n);
  res.push(OBJ[O_ID.chalk_art].solid, OBJ[O_ID.chalk_art].drops.length); return res; })()`);
ok(r[0] === null && r[1] === 'flower_r' && r[2] === 'chalk_art' && r[3] === 'chalk_art' && r[4] === 3 && r[5] === 0 && r[6] === 0, 'not on grass or over something; on sand and stone; flat, walkable, nothing dropped: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} WGS.inv[0] = { id: 'chalk_b', n: 20 }; for (let i = -6; i <= 6; i++) wgUse(x + i, y - 1); const n0 = [...Array(13)].filter((_, i) => id(i - 6) === 'chalk_art').length;
  WGS.growT = 0; wgGrowTick(0.1); const dry = [...Array(13)].filter((_, i) => id(i - 6) === 'chalk_art').length;
  WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; for (let s = 0; s < 40; s++) { WGS.growT = 0; wgGrowTick(0.1); } const wet = [...Array(13)].filter((_, i) => id(i - 6) === 'chalk_art').length; WGS.weather = null;
  w.meta.ach = {}; wgAchTick(); return [n0, dry, wet, !!w.meta.ach.chalk]; })()`);
ok(r[0] === 13 && r[1] === 13 && r[2] < 5, 'the rain washes the doodles away: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3], 'drawing all six lights CHALK ARTIST: ' + r[3]);
const EN = ['WHITE CHALK', 'PINK CHALK', 'BLUE CHALK', 'CHALK DOODLE', 'CHALK ARTIST', 'DRAW EVERY CHALK DOODLE', 'DRAWS ON PATHS, STONE AND SAND', 'CHALK DRAWS ON PATHS, STONE AND SAND'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a cobbled square with doodles in three colours
await g.ev(`(() => { ${setup} for (let i = -5; i <= 5; i++) for (let j = -3; j <= 1; j++) wgSetGround(w, d, x + i, y + j, G_ID.path);
  [[-4, -2, 0], [-2, -3, 4], [0, -2, 8], [2, -3, 10], [4, -2, 14], [-3, 0, 17], [3, 0, 5]].forEach(([i, j, m]) => wgSetObj(w, d, x + i, y + j, O_ID.chalk_art, m));
  WGS.inv[0] = { id: 'chalk', n: 6 }; WGS.inv[1] = { id: 'chalk_p', n: 6 }; WGS.inv[2] = { id: 'chalk_b', n: 6 }; p.y = y * 16 + 12; p.face = 'u'; WGS.day = 5; WGS.clock = 0.45; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 16; })(); 0`);
await sleep(100); console.log('chalk', await g.shot('wg_chalk.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'CHALK OK' : 'CHALK FAIL'); g.close(); process.exit(pass ? 0 : 1);
