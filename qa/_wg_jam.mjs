// Wildgrove's preserves: six jams made at a fire from fruit, sugar and a glass jar, eaten from the jar; a scone with
// jam; a pantry shelf to set out; holding five kinds lights PRESERVES; Hungarian; a look at the icons and the shelf.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'JAM' }, seed: { v: '29' }, look: { skin: 0, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => WG_JAMS.map(([id, , rec]) => { const R = RECIPES.find(q => q.out === id); return [id, R && R.at, R && R.in.glass, R && R.in.sugar, R && Object.keys(rec).every(k => R.in[k] === rec[k] && WGI[k]), WGI[id].kind, WGI[id].food, !!wgIcon(id)]; }))()`);
ok(r.length === 6 && r.every(a => a[1] === 'fire' && a[2] === 1 && a[3] === 1 && a[4] && a[5] === 'food' && a[6] === 7 && a[7]), 'six jams made at a fire from fruit, sugar and a jar: ' + JSON.stringify(r));
r = await g.ev(`(() => { const S = RECIPES.find(q => q.out === 'scone_jam'), P = RECIPES.find(q => q.out === 'pantry');
  return [S && S.at, S && S.n, WGI.scone_jam.food, !!wgIcon('scone_jam'), P && P.at, WGI.pantry.kind, !!(WGA.obj.pantry && WGA.obj.pantry[0]), !!wgIcon('pantry')]; })()`);
ok(r[0] === 'fire' && r[1] === 2 && r[2] === 12 && r[3] && r[4] === 'bench' && r[5] === 'place' && r[6] && r[7], 'a scone with jam, a pantry shelf to set out: ' + JSON.stringify(r));
r = await g.ev(`(() => { const p = WGS.p; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'cherry_jam', n: 1 }; p.food = 3; const a = wgEat(0); return [a, p.food, WGS.inv[0]]; })()`);
ok(r[0] !== false && r[1] === 10 && r[2] === null, 'eaten from the jar: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta, p = WGS.p, s0 = p.seen; m.ach = {}; p.seen = { berry_jam: 1, apple_jam: 1, cherry_jam: 1, marmalade: 1 }; wgAchTick(); const a = !!m.ach.jam;
  p.seen.lemon_curd = 1; wgAchTick(); const b = !!m.ach.jam; p.seen = Object.assign(s0 || {}, p.seen); return [a, b]; })()`);
ok(r[0] === false && r[1] === true, 'holding five kinds lights PRESERVES: ' + JSON.stringify(r));
const EN = ['BERRY JAM', 'APPLE JAM', 'CHERRY JAM', 'STRAWBERRY JAM', 'ORANGE MARMALADE', 'LEMON CURD', 'SCONE WITH JAM', 'PANTRY SHELF', 'PRESERVES', 'HOLD FIVE KINDS OF JAM'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the jars in the hotbar, a pantry shelf by a fire
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 1; j++) wgSetGround(w, d, x + i, y + j, G_ID.f_wood);
  wgSetObj(w, d, x - 1, y - 2, O_ID.pantry); wgSetObj(w, d, x + 1, y - 2, O_ID.pantry); wgSetObj(w, d, x + 2, y, O_ID.campfire); p.x = x * 16 + 8; p.y = y * 16 + 10; p.face = 'r';
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WG_JAMS.forEach(([id], k) => WGS.inv[k] = { id, n: 2 }); WGS.inv[6] = { id: 'scone_jam', n: 4 }; WGS.inv[7] = { id: 'pantry', n: 1 }; WGS.sel = 0;
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.day = 4; WGS.clock = 0.5; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 10; })(); 0`);
await sleep(100); console.log('jam', await g.shot('wg_jam.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'JAM OK' : 'JAM FAIL'); g.close(); process.exit(pass ? 0 : 1);
