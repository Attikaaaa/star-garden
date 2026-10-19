// Wildgrove's farmyard pack: every new thing has art and a recipe, the hen house fills with eggs and gives them up on
// USE (and lights HAPPY HENS), the compost bin takes plant scraps and gives bone meal, refuses other things, birds
// visit a birdhouse by day and keep to the roof when you are near; a look at the yard.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'FARM' }, seed: { v: '71' }, look: { skin: 1, hair: 0, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const ITEMS = ['henhouse', 'compost', 'birdhouse', 'fried_egg', 'omelette', 'pancakes'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(ITEMS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } const n = px(wgIcon(id)); if (n < 30) bad.push('thin icon ' + id + ' ' + n); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); }
  for (const id of ['henhouse', 'compost', 'birdhouse']) if (!WGA.obj[id]) bad.push('no sprite ' + id);
  return bad; })()`);
ok(!r.length, 'art and recipes: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), inv = WGS.inv, res = {};
  for (let j = -1; j < 2; j++) for (let i = -1; i < 3; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  for (let i = 0; i < 36; i++) inv[i] = null; WGS.sel = 0; WGS.drops = []; WGS.toast = null; WGS.world.meta.ach = {};
  // the hen house: empty, then filled by its tick, then emptied by USE
  wgSetObj(w, d, x, y, O_ID.henhouse); wgUse(x, y); res.empty = WGS.toast && WGS.toast.msg;
  const R = Math.random; Math.random = () => 0; for (let i = 0; i < 6; i++) { WGS.growT = 0; wgGrowTick(0.1); } Math.random = R; res.filled = wgMetaAt(w, d, x, y);
  wgUse(x, y); res.eggs = WGS.drops.filter(q => q.id === 'egg').reduce((a, q) => a + q.n, 0); res.after = wgMetaAt(w, d, x, y); wgAchTick(); res.star = !!WGS.world.meta.ach.hens;
  // the compost bin: a stone is no scrap; five scraps make two bone meal
  WGS.drops = []; wgSetObj(w, d, x, y, O_ID.compost); inv[0] = { id: 'stone', n: 3 }; wgUse(x, y); res.stone = [inv[0].n, WGS.toast && WGS.toast.msg];
  inv[0] = { id: 'fiber', n: 3 }; inv[1] = { id: 'seed_wheat', n: 1 }; inv[2] = { id: 'petal_y', n: 4 };
  for (const k of [0, 0, 0, 1]) { WGS.sel = k; wgUse(x, y); } res.mid = wgMetaAt(w, d, x, y); WGS.sel = 2; wgUse(x, y);
  res.meal = [wgMetaAt(w, d, x, y), WGS.drops.filter(q => q.id === 'bonemeal').reduce((a, q) => a + q.n, 0), inv[0], inv[1], inv[2] && inv[2].n];
  return res; })()`);
ok(r.empty === 'NO EGGS YET' && r.filled === 4 && r.eggs === 4 && r.after === 0 && r.star, 'the hen house: ' + JSON.stringify([r.empty, r.filled, r.eggs, r.after, r.star]));
ok(r.stone[0] === 3 && /^FEED IT PLANT SCRAPS/.test(r.stone[1]) && r.mid === 4 && r.meal[0] === 0 && r.meal[1] === 2 && !r.meal[1 + 1] && !r.meal[3] && r.meal[4] === 3, 'the compost bin: ' + JSON.stringify([r.stone, r.mid, r.meal]));
r = await g.ev(`wgTipLines({ id: 'compost', n: 1 }).concat(wgTipLines({ id: 'fiber', n: 1 }), wgTipLines({ id: 'henhouse', n: 1 }), wgTipLines({ id: 'stone', n: 1 }))`);
ok(r.includes('PLANT SCRAPS IN, BONE MEAL OUT') && r.includes('GOOD FOR COMPOST') && r.includes('LAYS EGGS OVER TIME') && r.filter(s => s === 'GOOD FOR COMPOST').length === 1, 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.omelette.name), tr(OBJ[O_ID.henhouse].name), tr('FEED IT PLANT SCRAPS (2/5)'), tr('HAPPY HENS'), tr('BIRDS COME TO VISIT'), tr('NO EGGS YET')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['OMELETTE', 'HEN HOUSE', 'FEED IT PLANT SCRAPS (2/5)', 'HAPPY HENS', 'BIRDS COME TO VISIT', 'NO EGGS YET'][i]), 'Hungarian: ' + JSON.stringify(r));
// birds: drawn by day around a birdhouse in view, on its roof when the hero is close, none at night
const setYard = (near, clock) => g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 4, y0 = Math.floor(p.y / 16) - 3;
  for (let j = -2; j < 5; j++) for (let i = -2; i < 10; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  wgSetObj(w, d, x0 + 1, y0, O_ID.henhouse, 2); wgSetObj(w, d, x0 + 4, y0, O_ID.compost, 3); wgSetObj(w, d, x0 + 7, y0, O_ID.birdhouse);
  p.x = (x0 + 7) * 16 + 8 + (${near} ? 4 : -60); p.y = ((${near}) ? y0 + 1 : y0 + 3) * 16 + 8; WGS.cam.x = (x0 + 4) * 16 + 8; WGS.cam.y = y0 * 16 + 20;
  WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.clock = ${clock}; WGS.toast = null; WGS.weather = null; })(); 0`);
await setYard(false, 0.3); await sleep(400);
console.log('yard', await g.shot('wg_farm_yard.png'));
await setYard(true, 0.3); await sleep(400);
console.log('near', await g.shot('wg_farm_near.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FARM OK' : 'FARM FAIL'); g.close(); process.exit(pass ? 0 : 1);
