// Wildgrove's herb garden: lavender and mint as crops in four stages, their cuttings in cut grass, planted on tilled
// soil and harvested; two teas at the fire for sitting down, mint lemonade, a herb planter; the HERB GARDEN star;
// Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'HERBS' }, seed: { v: '271' }, look: { skin: 2, hair: 5, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; WGS.inv[WGS.sel] = null;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });`;
let r = await g.ev(`(() => { ${setup} const rec = (id) => { const q = RECIPES.find(z => z.out === id); return q && q.at; };
  return { grass: ['seed_lav', 'seed_mint'].map(id => OBJ[O_ID.tallgrass].drops.some(d => d[0] === id)), stages: ['crop_lav', 'crop_mint'].map(id => WGA.obj[id] && WGA.obj[id].length),
    at: ['lavender_tea', 'mint_tea', 'mint_lemonade', 'herb_planter', 'seed_lav', 'seed_mint'].map(rec), tea: WG_TEA.includes('lavender_tea') && WG_TEA.includes('mint_tea'),
    icons: ['lavender', 'mint', 'seed_lav', 'seed_mint', 'lavender_tea', 'mint_tea', 'mint_lemonade', 'herb_planter'].every(k => !!wgIcon(k)), planter: !!WGA.obj.herb_planter }; })()`);
ok(r.grass.every(Boolean) && r.stages.join() === '4,4', 'lavender and mint grow in four stages, their cuttings in cut grass: ' + JSON.stringify([r.grass, r.stages]));
ok(r.at.join() === 'fire,fire,hand,bench,hand,hand' && r.tea && r.icons && r.planter, 'two teas for sitting, mint lemonade, a planter, icons: ' + JSON.stringify([r.at, r.tea, r.icons, r.planter]));
r = await g.ev(`(() => { ${setup} const res = {}; for (const [i, id] of [[2, 'seed_lav'], [3, 'seed_mint']]) { wgSetGround(w, 'o', x + i, y, G_ID.tilled); WGS.inv[WGS.sel] = { id, n: 3 }; wgUse(x + i, y); }
  res.planted = [OBJ[wgObjAt(w, 'o', x + 2, y)], OBJ[wgObjAt(w, 'o', x + 3, y)]].map(o => o && o.id); WGS.inv[WGS.sel] = null;
  for (const i of [2, 3]) wgSetObj(w, 'o', x + i, y, wgObjAt(w, 'o', x + i, y), 3); wgBreak(x + 2, y, true); wgBreak(x + 3, y, true);
  res.got = ['lavender', 'mint'].map(id => WGS.drops.filter(d => d.id === id).reduce((a, d) => a + d.n, 0) + WGS.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0));
  const A = WG_ACH.find(a => a[0] === 'herbs'); res.ach = [A[3]({ st: {}, seen: { lavender: 1, mint: 1 } }), !!A[3]({ st: {}, seen: { lavender: 1 } })]; return res; })()`);
ok(r.planted.join() === 'crop_lav,crop_mint' && r.got[0] >= 2 && r.got[1] >= 2, 'planted on tilled soil and harvested when grown: ' + JSON.stringify([r.planted, r.got]));
ok(r.ach[0] && !r.ach[1], 'the HERB GARDEN star for both: ' + JSON.stringify(r.ach));
const EN = ['LAVENDER', 'MINT', 'LAVENDER CUTTING', 'MINT SPRIG', 'LAVENDER TEA', 'MINT TEA', 'MINT LEMONADE', 'HERB PLANTER', 'HERB GARDEN', 'GROW LAVENDER AND MINT', 'SOMETIMES IN CUT GRASS'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a herb garden, lavender in bloom and mint in rows, every stage at the front, a planter by the path
await g.ev(`(() => { ${setup} for (let j = -2; j <= 3; j++) for (let i = -6; i <= 6; i++) { wgSetGround(w, 'o', x + i, y + j, G_ID.tilled); if (j !== 0) wgSetObj(w, 'o', x + i, y + j, O_ID[j < 0 ? 'crop_lav' : 'crop_mint'], j === 3 ? (i + 6) % 4 : 3); }
  for (let i = -6; i <= 6; i++) wgSetGround(w, 'o', x + i, y, G_ID.f_stone); wgSetObj(w, 'o', x + 3, y, O_ID.herb_planter); p.face = 'r'; })(); 0`);
await sleep(250); console.log('herbs', await g.shot('wg_herbs.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'HERBS OK' : 'HERBS FAIL'); g.close(); process.exit(pass ? 0 : 1);
