// Wildgrove's winter pack: every new thing has art and a recipe; USE on bare snow (empty-handed or with a shovel) scoops
// a snowball and leaves the snow, not on grass or under an object; snow walls join like walls; FROSTY FRIEND; tips,
// Hungarian; a look at an igloo with snowmen and ice lanterns at dusk.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SNOW' }, seed: { v: '33' }, look: { skin: 1, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const ITEMS = ['snowball', 'snowman', 'ice_lantern', 'wall_snow', 'hot_cider'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(ITEMS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id); if (id !== 'snowball' && !RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); }
  for (const id of ['snowman', 'ice_lantern']) if (!WGA.obj[id] || WGA.obj[id].length < 2) bad.push('no sprites ' + id);
  return bad; })()`);
ok(!r.length, 'art and recipes: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = {};
  for (let j = -1; j < 2; j++) for (let i = -1; i < 3; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.snow); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; WGS.drops = [];
  res.hand = [wgUse(x, y), WGS.drops.filter(q => q.id === 'snowball').length, wgGround(w, d, x, y) === G_ID.snow];
  WGS.inv[0] = { id: 'shovel_wood', n: 1 }; WGS.drops = []; res.shovel = [wgUse(x, y), WGS.drops.filter(q => q.id === 'snowball').length, wgGround(w, d, x, y) === G_ID.snow];
  WGS.inv[0] = null; wgSetGround(w, d, x + 1, y, G_ID.grass); WGS.drops = []; res.grass = [wgUse(x + 1, y), WGS.drops.length];
  wgSetObj(w, d, x, y + 1, O_ID.chest); WGS.drops = []; wgUse(x, y + 1); res.under = WGS.drops.filter(q => q.id === 'snowball').length; WGS.scr = 'play'; wgSetObj(w, d, x, y + 1, 0);
  WGS.inv[0] = { id: 'snowman', n: 1 }; (WGS.p.seen || (WGS.p.seen = {})).snowman = 1; wgAchTick(); res.star = !!w.meta.ach.snowman;
  return res; })()`);
ok(r.hand[0] && r.hand[1] === 1 && r.hand[2] && r.shovel[0] && r.shovel[1] === 1 && r.shovel[2], 'a snowball scooped, the snow stays: ' + JSON.stringify([r.hand, r.shovel]));
ok(!r.grass[0] && r.grass[1] === 0 && r.under === 0, 'not on grass or under a chest: ' + JSON.stringify([r.grass, r.under]));
ok(r.star, 'FROSTY FRIEND');
r = await g.ev(`wgTipLines({ id: 'snowball', n: 1 })`);
ok(r.includes('SCOOP IT FROM SNOW WITH USE'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.snowball.name), tr(OBJ[O_ID.snowman].name), tr(WGI.hot_cider.name), tr('FROSTY FRIEND'), tr('SCOOP IT FROM SNOW WITH USE'), tr(OBJ[O_ID.w_snow].name)]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['SNOWBALL', 'SNOWMAN', 'HOT CIDER', 'FROSTY FRIEND', 'SCOOP IT FROM SNOW WITH USE', 'SNOW WALL'][i]), 'Hungarian: ' + JSON.stringify(r));
// a look: an igloo of snow walls, three snowmen, two ice lanterns, at dusk
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 6, y0 = Math.floor(p.y / 16) - 3;
  for (let j = -2; j < 7; j++) for (let i = -1; i < 14; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.snow); }
  for (let i = 0; i < 5; i++) { wgSetObj(w, d, x0 + i, y0, O_ID.w_snow); if (i !== 2) wgSetObj(w, d, x0 + i, y0 + 3, O_ID.w_snow); }
  for (let j = 1; j < 3; j++) { wgSetObj(w, d, x0, y0 + j, O_ID.w_snow); wgSetObj(w, d, x0 + 4, y0 + j, O_ID.w_snow); }
  wgSetObj(w, d, x0 + 2, y0 + 1, O_ID.ice_lantern); wgSetObj(w, d, x0 + 6, y0 + 3, O_ID.ice_lantern);
  [7, 9, 11].forEach((i, k) => wgSetObj(w, d, x0 + i + k * 7 * 0, y0 + 1, O_ID.snowman));
  p.x = (x0 + 8) * 16 + 8; p.y = (y0 + 4) * 16 + 8; WGS.cam.x = (x0 + 6) * 16 + 8; WGS.cam.y = (y0 + 2) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.7; })(); 0`);
await sleep(500); console.log('igloo', await g.shot('wg_winter_igloo.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'WINTER OK' : 'WINTER FAIL'); g.close(); process.exit(pass ? 0 : 1);
