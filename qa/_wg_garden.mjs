// Wildgrove's garden pack: every new crop has four stages of art, every new item an icon and a way in, grass gives the
// seeds, a seed planted on tilled soil grows (bone meal helps) and is harvested, the stars light; a look at the beds.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'GARDEN' }, seed: { v: '77' }, look: { skin: 0, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const ITEMS = ['tomato', 'corn', 'strawberry', 'seed_tomato', 'seed_corn', 'seed_straw', 'seed_sun', 'tomato_soup', 'popcorn', 'roast_corn', 'straw_cake', 'roast_seeds', 'pizza', 'garden_salad'];
let r = await g.ev(`(() => { const bad = [];
  for (const id of ${JSON.stringify(ITEMS)}) {
    if (!WGI[id]) { bad.push('no item ' + id); continue; }
    const c = wgIcon(id), d = c.getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
    if (n < 30) bad.push('thin icon ' + id + ' ' + n);
  }
  for (const c of WG_GARDEN) { const s = WGA.obj['crop_' + c]; if (!s || s.length !== 4) bad.push('stages ' + c); else s.forEach((f, k) => { const d = f.c.getContext('2d').getImageData(0, 0, f.c.width, f.c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; if (n < 6) bad.push('empty ' + c + k); }); }
  for (const id of ['tomato_soup', 'popcorn', 'roast_corn', 'straw_cake', 'roast_seeds', 'pizza', 'garden_salad']) if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id);
  return bad; })()`);
ok(!r.length, 'icons, crop stages, recipes: ' + JSON.stringify(r));
// grass gives every new seed now and then
r = await g.ev(`(() => { const d = OBJ[O_ID.tallgrass].drops, n = {}; for (const s of ['seed_tomato', 'seed_corn', 'seed_straw', 'seed_sun']) n[s] = d.some(x => x[0] === s && x[3] > 0); return n; })()`);
ok(Object.values(r).every(Boolean), 'tall grass holds the seeds: ' + JSON.stringify(r));
// plant each on tilled soil, grow it with bone meal, harvest it
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, x0 = Math.floor(WGS.p.x / 16) - 3, y = Math.floor(WGS.p.y / 16) - 1, res = {}, inv = WGS.inv;
  for (let j = -2; j < 3; j++) for (let i = -2; i < 10; i++) { wgSetObj(w, d, x0 + i, y + j, 0); wgSetGround(w, d, x0 + i, y + j, G_ID.grass); }
  ['seed_tomato', 'seed_corn', 'seed_straw', 'seed_sun'].forEach((s, k) => {
    const x = x0 + k * 2; wgSetGround(w, d, x, y, G_ID.tilled);
    for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: s, n: 1 }; inv[1] = { id: 'bonemeal', n: 5 }; WGS.sel = 0;
    wgUse(x, y); const planted = OBJ[wgObjAt(w, d, x, y)].id; WGS.sel = 1; wgUse(x, y); wgUse(x, y); wgUse(x, y);
    const st = wgMetaAt(w, d, x, y); wgBreak(x, y, true); const got = []; for (const q of WGS.drops || []) got.push(q.id);
    res[s] = [planted, st, got.join(',')]; WGS.drops = [];
  });
  return res; })()`);
const plants = { seed_tomato: ['crop_tomato', 'tomato'], seed_corn: ['crop_corn', 'corn'], seed_straw: ['crop_straw', 'strawberry'], seed_sun: ['crop_sun', 'seed_sun'] };
ok(Object.entries(plants).every(([s, [o, it]]) => r[s] && r[s][0] === o && r[s][1] === 3 && r[s][2].includes(it)), 'planted, grown, harvested: ' + JSON.stringify(r));
// stars: any new crop is a harvest; all three make a market garden
r = await g.ev(`(() => { WGS.p.seen = { tomato: 1 }; WGS.world.meta.ach = {}; wgAchTick(); const a = !!WGS.world.meta.ach.farm, b = !!WGS.world.meta.ach.garden;
  Object.assign(WGS.p.seen, { corn: 1, strawberry: 1 }); wgAchTick(); return [a, b, !!WGS.world.meta.ach.garden]; })()`);
ok(r[0] && !r[1] && r[2], 'stars: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.pizza.name), tr(WGI.seed_corn.name), tr(OBJ[O_ID.crop_sun].name), tr('MARKET GARDEN')]; Save.settings.lang = 'en'; return a; })()`);
ok(r[0] === 'PIZZA' && r[1] === 'VETŐKUKORICA' && r[2] === 'NAPRAFORGÓ' && r[3] === 'PIACKERT', 'Hungarian: ' + JSON.stringify(r));
// a look: each crop in its four stages, a row apiece
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, x0 = Math.floor(WGS.p.x / 16) - 4, y0 = Math.floor(WGS.p.y / 16) - 5;
  for (let j = -1; j < 5; j++) for (let i = -1; i < 9; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  WG_GARDEN.forEach((c, j) => { for (let k = 0; k < 4; k++) { wgSetGround(w, d, x0 + k * 2, y0 + j, G_ID.tilled); wgSetObj(w, d, x0 + k * 2, y0 + j, O_ID['crop_' + c], k); } });
  WGS.cam.x = WGS.p.x; WGS.cam.y = WGS.p.y - 40; WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.clock = 0.3; WGS.toast = null; })(); 0`);
await sleep(400);
console.log('beds', await g.shot('wg_garden_beds.png'));
await g.ev(`WGS.scr = 'inv'; WGS.ui = {}; const inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; ${JSON.stringify(ITEMS)}.forEach((id, i) => inv[9 + i] = { id, n: 2 }); Input.mx = 300; Input.my = 200; 0`); await sleep(300);
console.log('icons', await g.shot('wg_garden_icons.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'GARDEN OK' : 'GARDEN FAIL'); g.close(); process.exit(pass ? 0 : 1);
