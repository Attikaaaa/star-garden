// Wildgrove's dairy pack: the cow (walking frames, a hurt flash), milk, butter, cheese, five dishes and the churn have
// art and recipes; cows join the meadow and highland spawns; a bucket milks a cow (the bucket stays) and not again
// until she is ready, wheat brings a calf; the churn opens the recipe book and makes butter and cheese; DAIRY FARMER;
// tips, Hungarian; a look at cows in a field by a churn.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'DAIRY' }, seed: { v: '93' }, look: { skin: 1, hair: 2, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const IDS = ['milk', 'butter', 'cheese', 'buttered_toast', 'cheese_toast', 'cream_soup', 'ice_cream', 'milkshake', 'churn'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(IDS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 40) bad.push('thin icon ' + id); if (id !== 'milk' && !RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); }
  if (!WGA.obj.churn) bad.push('no churn sprite'); if (!WG_AT.churn) bad.push('no churn label');
  for (let f = 0; f < 4; f++) if (px(wgMobSpr('cow', f, false)) < 120) bad.push('thin cow ' + f);
  if (px(wgMobSpr('cow', 0, true)) < 120) bad.push('no hurt cow');
  const d = WG_MOBS.cow; if (!d || !d.pas || !d.biomes.includes('meadow') || !d.biomes.includes('highland')) bad.push('cow data');
  return bad; })()`);
ok(!r.length, 'art, recipes, the cow: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = {};
  for (let j = -4; j < 5; j++) for (let i = -6; i < 7; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = [];
  const cow = wgSpawnMob('cow', (x + 2) * 16 + 8, y * 16 + 14), tx = Math.floor(cow.x / 16), ty = Math.floor((cow.y - 6) / 16);
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'bucket', n: 1 }; WGS.inv[1] = { id: 'wheat', n: 2 }; WGS.sel = 0;
  wgUse(tx, ty); res.first = [wgInvCount(WGS.inv, 'milk'), wgInvCount(WGS.inv, 'bucket')];
  wgUse(tx, ty); res.again = wgInvCount(WGS.inv, 'milk');
  WGS.t += WG_MILK_WAIT + 1; wgUse(tx, ty); res.later = wgInvCount(WGS.inv, 'milk');
  WGS.sel = 1; wgUse(tx, ty); res.love = cow.love > 0 && wgInvCount(WGS.inv, 'wheat') === 1;
  wgSetObj(w, d, x - 2, y, O_ID.churn); res.near = !!wgStations().churn; WGS.sel = 2; wgUse(x - 2, y); res.book = WGS.scr === 'inv'; WGS.scr = 'play';
  p.seen = p.seen || {}; p.seen.butter = 1; wgAchTick(); res.half = !!w.meta.ach.dairy; p.seen.cheese = 1; wgAchTick(); res.star = !!w.meta.ach.dairy;
  return res; })()`);
ok(r.first[0] === 1 && r.first[1] === 1 && r.again === 1 && r.later === 2, 'a bucket milks a cow, then she needs a while: ' + JSON.stringify([r.first, r.again, r.later]));
ok(r.love && r.near && r.book, 'wheat for a calf; the churn is a station with a recipe book: ' + JSON.stringify([r.love, r.near, r.book]));
ok(!r.half && r.star, 'DAIRY FARMER for butter and cheese: ' + JSON.stringify([r.half, r.star]));
r = await g.ev(`(() => { const n = {}; for (let i = 0; i < 4000; i++) { const list = Object.keys(WG_MOBS).filter(k => { const d = WG_MOBS[k]; return d.pas && !d.special && d.dim === 'o' && d.biomes && d.biomes.includes('meadow'); }); const t = list[i % list.length]; n[t] = (n[t] || 0) + 1; } return Object.keys(n); })()`);
ok(r.includes('cow') && r.includes('sheep'), 'cows share the meadow spawns: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'bucket', n: 1 })`);
ok(r.includes('ALSO MILKS A COW'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr('COW'), tr(WGI.milk.name), tr(WGI.butter.name), tr(WGI.cheese.name), tr(WGI.churn.name), tr(WGI.ice_cream.name), tr('DAIRY FARMER'), tr('AT A BUTTER CHURN'), tr('SHE HAS NO MILK YET')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['COW', 'MILK', 'BUTTER', 'CHEESE', 'BUTTER CHURN', 'ICE CREAM', 'DAIRY FARMER', 'AT A BUTTER CHURN', 'SHE HAS NO MILK YET'][i]), 'Hungarian: ' + JSON.stringify(r));
// a look: three cows in a fenced field, a churn by the gate, the hero with a bucket
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 8, y0 = Math.floor(p.y / 16) - 4;
  for (let j = -2; j < 11; j++) for (let i = -2; i < 20; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  for (let i = 2; i < 15; i++) { wgSetObj(w, d, x0 + i, y0, O_ID.fence); wgSetObj(w, d, x0 + i, y0 + 8, O_ID.fence); } for (let j = 1; j < 8; j++) { wgSetObj(w, d, x0 + 2, y0 + j, O_ID.fence); wgSetObj(w, d, x0 + 14, y0 + j, O_ID.fence); }
  wgSetObj(w, d, x0 + 14, y0 + 4, 0); wgSetObj(w, d, x0 + 16, y0 + 3, O_ID.churn);
  WGS.mobs = []; const a = wgSpawnMob('cow', (x0 + 6) * 16, (y0 + 3) * 16 + 8), b = wgSpawnMob('cow', (x0 + 10) * 16, (y0 + 5) * 16 + 4), c = wgSpawnMob('sheep', (x0 + 7) * 16, (y0 + 6) * 16 + 8); b.flip = true;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'bucket', n: 1 }; WGS.sel = 0; p.x = (x0 + 16) * 16 + 2; p.y = (y0 + 5) * 16 + 8;
  WGS.cam.x = (x0 + 9) * 16; WGS.cam.y = (y0 + 4) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.35; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(400); console.log('field', await g.shot('wg_dairy_field.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'DAIRY OK' : 'DAIRY FAIL'); g.close(); process.exit(pass ? 0 : 1);
