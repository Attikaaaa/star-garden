// Wildgrove's bonsai: an oak, a pine and a cherry, each from its sapling and clay at the potter's wheel, set out; one of
// each lights BONSAI GARDENER; the counting wrapper keeps a tile's meta; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BONSAI' }, seed: { v: '97' }, look: { skin: 3, hair: 0, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { bonsai: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0;`;
let r = await g.ev(`(() => WG_BONSAI.map(([id, , sap]) => { const R = RECIPES.find(q => q.out === id); return [R.at, R.in[sap], !!WGI[sap], R.in.clay, WGI[id].kind, !!(WGA.obj[id] && WGA.obj[id][0]), !!wgIcon(id)]; }))()`);
ok(r.length === 3 && r.every(a => a[0] === 'potwheel' && a[1] === 1 && a[2] && a[3] === 2 && a[4] === 'place' && a[5] && a[6]), 'an oak, a pine and a cherry, each from its sapling and clay at the wheel: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = []; wgSetObj(w, d, x + 1, y - 2, O_ID.bonsai_oak); wgSetObj(w, d, x + 2, y - 2, O_ID.bonsai_pine); res.push(w.meta.stats.bonsai); w.meta.ach = {}; wgAchTick(); res.push(!!w.meta.ach.bonsai);
  wgSetObj(w, d, x + 3, y - 2, O_ID.bonsai_cherry); res.push(w.meta.stats.bonsai); wgAchTick(); res.push(!!w.meta.ach.bonsai);
  wgSetGround(w, d, x + 4, y, G_ID.tilled); wgSetObj(w, d, x + 4, y, O_ID.crop_wheat, 2); res.push(wgMetaAt(w, d, x + 4, y)); return res; })()`);
ok(r[0] === 3 && r[1] === false && r[2] === 7 && r[3] === true, 'one of each set out lights BONSAI GARDENER: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4] === 2, 'a tile keeps its meta through the wrapper: ' + r[4]);
const EN = ['OAK BONSAI', 'PINE BONSAI', 'CHERRY BONSAI', 'BONSAI GARDENER', 'SET OUT ALL THREE BONSAI'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: three bonsai on a wooden floor by a potter's wheel
await g.ev(`(() => { ${setup} for (let i = -4; i <= 4; i++) for (let j = -3; j <= 1; j++) wgSetGround(w, d, x + i, y + j, G_ID.f_wood);
  for (const [i, j, o] of [[-2, -2, 'bonsai_oak'], [0, -2, 'bonsai_pine'], [2, -2, 'bonsai_cherry'], [-4, -1, 'potwheel'], [4, -2, 'vase_blue']]) if (O_ID[o]) wgSetObj(w, d, x + i, y + j, O_ID[o]);
  WG_BONSAI.forEach(([id], k) => WGS.inv[k] = { id, n: 1 }); p.y = y * 16 + 12; p.face = 'u'; WGS.day = 3; WGS.clock = 0.45; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 16; })(); 0`);
await sleep(100); console.log('bonsai', await g.shot('wg_bonsai.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BONSAI OK' : 'BONSAI FAIL'); g.close(); process.exit(pass ? 0 : 1);
