// Wildgrove's pottery: a potter's wheel made at a bench is a station; vases in four glazes, an amphora and a vase of
// flowers are made at it and set out; the wheel's head turns while a hero stands at it; a vase of every glaze set
// out lights POTTER; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'POTTERY' }, seed: { v: '71' }, look: { skin: 0, hair: 4, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; w.meta.ach = { potter: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10;`;
let r = await g.ev(`(() => { const ids = ['vase_clay', 'vase_blue', 'vase_yellow', 'vase_white', 'amphora', 'vase_flowers'];
  const W = RECIPES.find(q => q.out === 'potwheel'); return [W && W.at, OBJ[O_ID.potwheel].kind, OBJ[O_ID.potwheel].st, WG_AT.potwheel,
    ids.map(id => { const R = RECIPES.find(q => q.out === id); return [R && R.at, WGI[id].kind, !!(WGA.obj[id] && WGA.obj[id][0]), !!wgIcon(id)]; })]; })()`);
ok(r[0] === 'bench' && r[1] === 'station' && r[2] === 'potwheel' && r[3] === "AT A POTTER'S WHEEL", "a potter's wheel made at a bench is a station: " + JSON.stringify(r.slice(0, 4)));
ok(r[4].every(a => a[0] === 'potwheel' && a[1] === 'place' && a[2] && a[3]), 'four vases, an amphora and a vase of flowers made at it, to set out: ' + JSON.stringify(r[4]));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 2, y, O_ID.potwheel); const R = rect, res = {}; let glint = 0; WGS.cam.x = p.x; WGS.cam.y = p.y; const cx0 = WGS.cam.x - 192, cy0 = WGS.cam.y - 108;
  rect = function (a, b, c, e, k) { if (k === 'w' && c === 1) glint++; return R(...arguments); };
  try { p.x = (x + 2) * 16 + 8; p.y = (y + 1) * 16 + 4; glint = 0; wgDrawObj(O_ID.potwheel, x + 2, y, (x + 2) * 16 - cx0, y * 16 - cy0); res.near = glint;
    p.x = (x - 6) * 16; glint = 0; wgDrawObj(O_ID.potwheel, x + 2, y, (x + 2) * 16 - cx0, y * 16 - cy0); res.far = glint; } finally { rect = R; }
  return res; })()`);
ok(r.near >= 1 && r.far === 0, 'its head turns while a hero stands at it: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 2, y, O_ID.potwheel); WGS.ui = {}; const a = wgUse(x + 2, y); const res = [a, WGS.scr, WGS.ui.tab]; WGS.scr = 'play'; WGS.ui = {}; return res; })()`);
ok(r[0] === true && r[1] === 'inv' && r[2] === 'craft', 'USE on the wheel opens the recipe book: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = []; w.meta.ach = {};
  wgSetObj(w, d, x + 1, y - 2, O_ID.vase_clay); wgSetObj(w, d, x + 2, y - 2, O_ID.vase_blue); wgSetObj(w, d, x + 3, y - 2, O_ID.amphora); res.push(w.meta.stats.vases); wgAchTick(); res.push(!!w.meta.ach.potter);
  wgSetObj(w, d, x + 4, y - 2, O_ID.vase_yellow); wgSetObj(w, d, x + 5, y - 2, O_ID.vase_white); res.push(w.meta.stats.vases); wgAchTick(); res.push(!!w.meta.ach.potter);
  res.push(wgTipLines({ id: 'potwheel', n: 1 })); return res; })()`);
ok(r[0] === 3 && r[1] === false && r[2] === 15 && r[3] === true, 'a vase of every glaze set out lights POTTER: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4].includes('CLAY BECOMES VASES HERE'), 'tips: ' + JSON.stringify(r[4]));
const EN = ["POTTER'S WHEEL", "AT A POTTER'S WHEEL", 'CLAY VASE', 'BLUE VASE', 'YELLOW VASE', 'WHITE VASE', 'AMPHORA', 'VASE OF FLOWERS', 'POTTER', 'SET OUT A VASE OF EVERY GLAZE', 'CLAY BECOMES VASES HERE'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a potter's corner by a cottage wall
await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 1, y - 1, O_ID.potwheel);
  for (const [i, id] of [[-3, 'vase_clay'], [-2, 'vase_blue'], [-1, 'amphora'], [3, 'vase_yellow'], [4, 'vase_white'], [5, 'vase_flowers']]) wgSetObj(w, d, x + i, y - 2, O_ID[id]);
  wgSetObj(w, d, x - 4, y + 2, O_ID.oak); wgSetObj(w, d, x + 6, y + 2, O_ID.pot_r || 0); wgSetObj(w, d, x + 2, y + 2, O_ID.flower_y);
  p.x = (x + 2) * 16 + 6; p.y = (y - 1) * 16 + 12; p.face = 'l'; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'clay', n: 9 }; WGS.sel = 0;
  WGS.day = 9; WGS.clock = 0.4; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 10; })(); 0`);
await sleep(120); console.log('pottery', await g.shot('wg_pottery.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'POTTERY OK' : 'POTTERY FAIL'); g.close(); process.exit(pass ? 0 : 1);
