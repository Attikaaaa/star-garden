// Wildgrove's picnic basket: made at a bench and set out; every day it holds one treat, which USE takes out, once a
// day for everyone (the tile's meta), and the next day brings another; opening one beside a picnic blanket lights
// PICNIC DAY, away from one it does not; a sandwich to pack; icons and a tip; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PICNIC' }, seed: { v: '103' }, look: { skin: 1, hair: 3, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { picnic: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.toast = null;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0;`;
let r = await g.ev(`(() => { const B = RECIPES.find(q => q.out === 'picnic_basket'), S = RECIPES.find(q => q.out === 'sandwich');
  return [B.at, WGI.picnic_basket.kind, S.in.bread, S.in.cheese, S.in.tomato, WGI.sandwich.food, !!wgIcon('sandwich'), !!wgIcon('picnic_basket'), wgTipLines({ id: 'picnic_basket', n: 1 }).includes('A TREAT INSIDE EVERY DAY'), WG_PICNIC.every(([i]) => !!WGI[i])]; })()`);
ok(r[0] === 'bench' && r[1] === 'place' && r[2] === 1 && r[3] === 1 && r[4] === 1 && r[5] === 10 && r.slice(6).every(Boolean), 'a basket from a bench, a sandwich of bread, cheese and tomato, treats that exist: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 2, y, O_ID.picnic_basket); WGS.day = 7; const res = [];
  wgUse(x + 2, y); res.push(WGS.drops.length, WGS.toast && WGS.toast.msg, w.meta.stats.picnic | 0); wgUse(x + 2, y); res.push(WGS.drops.length, WGS.toast && WGS.toast.msg);
  WGS.day = 8; wgUse(x + 2, y); res.push(WGS.drops.length); return res; })()`);
ok(r[0] === 1 && r[1] === 'A TREAT FROM THE BASKET!' && r[2] === 0 && r[3] === 1 && r[4] === 'MORE TREATS TOMORROW' && r[5] === 2, 'a treat once a day, the next day another; away from a blanket no star: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 2, y, O_ID.picnic_basket); wgSetObj(w, d, x + 3, y, O_ID.picnic); WGS.day = 9; wgUse(x + 2, y); w.meta.ach = {}; wgAchTick(); return [w.meta.stats.picnic, !!w.meta.ach.picnic, wgMetaAt(w, d, x + 2, y) === (9 % 255) + 1]; })()`);
ok(r[0] === 1 && r[1] && r[2], 'opening one beside a picnic blanket lights PICNIC DAY; the day is the tile meta: ' + JSON.stringify(r));
const EN = ['PICNIC BASKET', 'SANDWICH', 'PICNIC DAY', 'OPEN A PICNIC BASKET BESIDE A PICNIC BLANKET', 'A TREAT FROM THE BASKET!', 'MORE TREATS TOMORROW', 'A TREAT INSIDE EVERY DAY'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a picnic on a blanket under a tree
await g.ev(`(() => { ${setup} for (const [i, j, o] of [[-1, -1, 'picnic'], [0, -1, 'picnic_basket'], [-5, -3, 'oak'], [4, -3, 'birch'], [2, 1, 'flower_y'], [-3, 1, 'flower_w']]) wgSetObj(w, d, x + i, y + j, O_ID[o]);
  WGS.inv[0] = { id: 'sandwich', n: 3 }; WGS.inv[1] = { id: 'picnic_basket', n: 1 }; p.y = y * 16 + 14; p.x += 18; p.face = 'u'; WGS.day = 11; WGS.clock = 0.45; WGS.weather = null; WGS.wxT = 9999; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 16; })(); 0`);
await sleep(100); console.log('picnic', await g.shot('wg_picnic.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PICNIC OK' : 'PICNIC FAIL'); g.close(); process.exit(pass ? 0 : 1);
