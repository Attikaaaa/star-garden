// Wildgrove's topiary: shears on a hedge clip it into a ball, then a bird, a bunny, a cone and round to the ball; each
// shape gives the hedge back when cut down; anything but shears leaves a hedge be; clipping every shape lights TOPIARY
// ARTIST; the hedge's tip says so; Hungarian; a look at a clipped garden.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TOPIARY' }, seed: { v: '61' }, look: { skin: 0, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { topiary: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; const id = () => OBJ[wgObjAt(w, d, x + 1, y)].id;`;
let r = await g.ev(`(() => WG_TOPIARY.map(([id]) => [OBJ[O_ID[id]].drops[0][0], OBJ[O_ID[id]].tool, !!(WGA.obj[id] && WGA.obj[id][0])]))()`);
ok(r.length === 4 && r.every(a => a[0] === 'hedge' && a[1] === 'axe' && a[2]), 'four shapes, each giving the hedge back to an axe: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 1, y, O_ID.hedge); WGS.inv[0] = { id: 'shears', n: 1 }; const seq = [];
  for (let i = 0; i < 5; i++) { wgUse(x + 1, y); seq.push(id()); } return [seq, w.meta.stats.topiary]; })()`);
ok(r[0].join() === 'topiary_ball,topiary_bird,topiary_bunny,topiary_cone,topiary_ball' && r[1] === 15, 'shears clip a hedge into a ball, a bird, a bunny, a cone and round to the ball: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 1, y, O_ID.hedge); WGS.inv[0] = { id: 'stick', n: 3 }; wgUse(x + 1, y); const a = id(); WGS.inv[0] = null; wgUse(x + 1, y); return [a, id(), w.meta.stats.topiary | 0]; })()`);
ok(r[0] === 'hedge' && r[1] === 'hedge' && r[2] === 0, 'anything but shears leaves a hedge be: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 1, y, O_ID.hedge); WGS.inv[0] = { id: 'shears', n: 1 }; const res = [];
  for (let i = 0; i < 3; i++) wgUse(x + 1, y); w.meta.ach = {}; wgAchTick(); res.push(!!w.meta.ach.topiary); wgUse(x + 1, y); wgAchTick(); res.push(!!w.meta.ach.topiary);
  res.push(wgTipLines({ id: 'hedge', n: 1 }).includes('SHEARS CLIP IT INTO SHAPES')); return res; })()`);
ok(r[0] === false && r[1] === true && r[2], 'clipping every shape lights TOPIARY ARTIST; the hedge says so: ' + JSON.stringify(r));
const EN = ['TOPIARY BALL', 'TOPIARY BIRD', 'TOPIARY BUNNY', 'TOPIARY CONE', 'TOPIARY ARTIST', 'CLIP A HEDGE INTO EVERY SHAPE', 'SHEARS CLIP IT INTO SHAPES'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a clipped garden, a hedge row with every shape
await g.ev(`(() => { ${setup} for (let i = -5; i <= 5; i++) wgSetGround(w, d, x + i, y - 1, G_ID.gravel || G_ID.dirt);
  for (const [i, j, o] of [[-4, -2, 'topiary_ball'], [-2, -2, 'topiary_bird'], [0, -2, 'topiary_cone'], [2, -2, 'topiary_bunny'], [4, -2, 'topiary_ball'], [-5, 0, 'hedge'], [5, 0, 'hedge'], [-3, 0, 'flower_r'], [3, 0, 'flower_y'], [-7, -3, 'oak']]) wgSetObj(w, d, x + i, y + j, O_ID[o]);
  WGS.inv[0] = { id: 'shears', n: 1 }; p.y = y * 16 + 14; p.face = 'u'; WGS.day = 3; WGS.clock = 0.45; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 16; })(); 0`);
await sleep(100); console.log('topiary', await g.shot('wg_topiary.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'TOPIARY OK' : 'TOPIARY FAIL'); g.close(); process.exit(pass ? 0 : 1);
