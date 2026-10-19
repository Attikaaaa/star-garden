// Wildgrove's tent: made at a bench, set out; it is a bed, so USE sets the spawn point there and at night sleeps till
// morning; sleeping in one outdoors at night lights CAMPER, by day it does not; its colour comes from the tile, three
// of them; an icon, a tip; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TENT' }, seed: { v: '79' }, look: { skin: 0, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { camp: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0;`;
let r = await g.ev(`(() => { const R = RECIPES.find(q => q.out === 'tent'); return [R && R.at, OBJ[O_ID.tent].kind, WGI.tent.kind, WGA.obj.tent.length, !!wgIcon('tent'), wgTipLines({ id: 'tent', n: 1 }).includes('A BED FOR THE ROAD')]; })()`);
ok(r[0] === 'bench' && r[1] === 'bed' && r[2] === 'place' && r[3] === 3 && r[4] && r[5], 'a tent made at a bench is a bed to set out, in three colours, with an icon and a tip: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 2, y, O_ID.tent); WGS.clock = 0.5; const D = WGS.day; wgUse(x + 2, y); const day = [p.spawn && p.spawn.x === (x + 2) * 16 + 8, w.meta.stats.camp | 0, WGS.day - D];
  WGS.clock = 0.97; wgUse(x + 2, y); const night = [w.meta.stats.camp, WGS.day - D, +WGS.clock.toFixed(2)]; w.meta.ach = {}; wgAchTick(); return [day, night, !!w.meta.ach.camp]; })()`);
ok(r[0][0] && r[0][1] === 0 && r[0][2] === 0, 'by day USE sets the spawn point and does not light CAMPER: ' + JSON.stringify(r[0]));
ok(r[1][0] === 1 && r[1][1] === 1 && r[1][2] < 0.5 && r[2], 'at night it sleeps till morning and lights CAMPER: ' + JSON.stringify(r.slice(1)));
r = await g.ev(`(() => { const A = WGA.obj.tent, D = ctx.drawImage.bind(ctx), seen = new Set(); ctx.drawImage = function (img) { const k = A.findIndex(s => s.c === img); if (k >= 0) seen.add(k); return D(...arguments); };
  try { for (let i = 0; i < 40; i++) wgDrawObj(O_ID.tent, i, 3, 100, 100); } finally { ctx.drawImage = D; } return [...seen].sort().join(); })()`);
ok(r === '0,1,2', 'its colour comes from the tile: ' + r);
const EN = ['TENT', 'CAMPER', 'SLEEP IN A TENT UNDER THE STARS', 'A BED FOR THE ROAD'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a little camp by a fire at dusk
await g.ev(`(() => { ${setup} for (const [i, j, o] of [[-3, -2, 'tent'], [1, -2, 'tent'], [5, -1, 'tent'], [-1, 0, 'campfire'], [-6, -3, 'pine'], [7, 2, 'pine'], [3, 2, 'log_stool']]) if (O_ID[o]) wgSetObj(w, d, x + i, y + j, O_ID[o]);
  WGS.inv[0] = { id: 'tent', n: 1 }; p.y = y * 16 + 14; p.face = 'u'; WGS.day = 12; WGS.clock = 0.8; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 16; })(); 0`);
await sleep(100); console.log('tent', await g.shot('wg_tent.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'TENT OK' : 'TENT FAIL'); g.close(); process.exit(pass ? 0 : 1);
