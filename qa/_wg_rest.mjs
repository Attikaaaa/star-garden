// Wildgrove's rest and tea pack: every new thing has art and a recipe, tea bushes grow among the ferns, USE on a seat
// sits the hero down, sitting heals and a step stands them up, a tea drunk seated heals more and lights TEA TIME, a
// cup in hand on the seat is drunk (not a stand-up), co-op sends a seated hero as 'S'; a look at every seat.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'REST' }, seed: { v: '63' }, look: { skin: 0, hair: 1, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const ITEMS = ['park_bench', 'stool', 'picnic', 'tea_set', 'tea_leaf', 'tea_cutting', 'green_tea', 'honey_tea', 'lemon_tea', 'chamomile', 'cookies'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(ITEMS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } const n = px(wgIcon(id)); if (n < 30) bad.push('thin icon ' + id + ' ' + n); if (id !== 'tea_leaf' && !RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); }
  for (const id of ['park_bench', 'stool', 'picnic', 'tea_set', 'teabush', 'teabush_r']) if (!WGA.obj[id]) bad.push('no sprite ' + id);
  for (const id of ['chair', 'couch', 'park_bench', 'stool', 'picnic']) if (!OBJ[O_ID[id]].seat) bad.push('not a seat ' + id);
  return bad; })()`);
ok(!r.length, 'art, recipes, seats: ' + JSON.stringify(r));
r = await g.ev(`(() => { let n = 0, same = true; const seed = WGS.world.seed;
  for (let cy = -5; cy < 5; cy++) for (let cx = -5; cx < 5; cx++) { const a = wgNewChunk(cx, cy, 'o'), b = wgNewChunk(cx, cy, 'o'); wgGenOver(seed, a); wgGenOver(seed, b);
    for (let k = 0; k < a.o.length; k++) { if (a.o[k] !== b.o[k]) same = false; if (a.o[k] === O_ID.teabush || a.o[k] === O_ID.teabush_r) n++; } }
  return [n, same]; })()`);
ok(r[0] > 0 && r[1], 'tea bushes in the wild, the same every time: ' + JSON.stringify(r));
// sit, heal, stand up
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16) + 1, inv = WGS.inv, res = {};
  for (let j = -1; j < 3; j++) for (let i = -2; i < 3; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  for (let i = 0; i < 36; i++) inv[i] = null; WGS.sel = 0; WGS.scr = 'play'; WGS.world.meta.hintDone = 1; p.food = 20;
  wgSetObj(w, d, x, y, O_ID.chair); wgUse(x, y); res.sat = !!p.sit && p.x === x * 16 + 8 && p.y === y * 16 + 12;
  p.hp = 10; for (let i = 0; i < 70; i++) updateWG(1 / 60 * 6); res.healed = p.hp > 10 && !!p.sit;
  // a cup of tea seated: drunk, not a stand-up, more health, the star
  inv[0] = { id: 'green_tea', n: 2 }; p.hp = 8; const h0 = p.hp; const used = wgUse(x, y); if (!used) wgEat(0); res.tea = [used, !!p.sit, p.hp - h0, inv[0] && inv[0].n, !!(WGS.world.meta.stats || {}).tea];
  wgAchTick(); res.star = !!WGS.world.meta.ach.tea;
  // co-op: a seated hero goes out as 'S'
  const m = { t: 'p', face: 'd' }, l = { t: 'ps', l: [[0, 1, 2, 'd']] }; try { wgnSend(null, m); } catch (e) {} try { wgnSend(null, l); } catch (e) {} res.net = [m.face, l.l[0][3]];
  // a step stands the hero up; standing up again works by USE too
  p.x += 6; updateWG(1 / 60); res.up = !p.sit;
  for (let i = 0; i < 36; i++) inv[i] = null; wgUse(x, y); const again = !!p.sit; wgUse(x, y); res.toggle = [again, !p.sit];
  // every seat sits
  res.seats = {}; for (const id of ['couch', 'park_bench', 'stool', 'picnic']) { wgSetObj(w, d, x, y, O_ID[id]); p.sit = null; wgUse(x, y); res.seats[id] = !!p.sit; }
  p.sit = null; return res; })()`);
ok(r.sat && r.healed, 'sits and heals: ' + JSON.stringify([r.sat, r.healed]));
ok(r.tea[0] === false && r.tea[1] && r.tea[2] >= 4 && r.tea[3] === 1 && r.tea[4] && r.star, 'tea seated: ' + JSON.stringify([r.tea, r.star]));
ok(r.net[0] === 'S' && r.net[1] === 'S', 'co-op sends a seated hero: ' + JSON.stringify(r.net));
ok(r.up && r.toggle[0] && r.toggle[1] && Object.values(r.seats).every(Boolean), 'stands up, every seat: ' + JSON.stringify([r.up, r.toggle, r.seats]));
r = await g.ev(`wgTipLines({ id: 'park_bench', n: 1 }).concat(wgTipLines({ id: 'honey_tea', n: 1 }))`);
ok(r.includes('USE IT TO SIT AND REST') && r.includes('BEST ENJOYED SITTING DOWN'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.honey_tea.name), tr(OBJ[O_ID.park_bench].name), tr('A NICE CUP OF TEA'), tr('TEA TIME'), tr('USE IT TO SIT AND REST'), tr(OBJ[O_ID.teabush].name)]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['HONEY TEA', 'PARK BENCH', 'A NICE CUP OF TEA', 'TEA TIME', 'USE IT TO SIT AND REST', 'TEA BUSH'][i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the hero on a bench, a friend on the couch, the other seats, a tea set and bushes
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 5, y0 = Math.floor(p.y / 16) - 2;
  for (let j = -2; j < 5; j++) for (let i = -1; i < 12; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  [['park_bench', 1], ['couch', 3], ['chair', 5], ['stool', 7], ['picnic', 9]].forEach(([id, i]) => wgSetObj(w, d, x0 + i, y0, O_ID[id]));
  wgSetObj(w, d, x0 + 5, y0 + 2, O_ID.tea_set); wgSetObj(w, d, x0 + 7, y0 + 2, O_ID.teabush); wgSetObj(w, d, x0 + 9, y0 + 2, O_ID.teabush_r); wgSetObj(w, d, x0 + 1, y0 + 2, O_ID.chair);
  p.sit = null; wgSit(x0 + 1, y0);
  WGS.remote = [{ pid: 7, x: (x0 + 3) * 16 + 8, y: y0 * 16 + 12, face: 'S', moving: false, walkT: 0, dim: d, hp: 20, name: 'FRIEND', look: { skin: 2, hair: 3, shirt: 2 }, swing: 0, inv: 0 },
    { pid: 8, x: (x0 + 9) * 16 + 8, y: y0 * 16 + 12, face: 'S', moving: false, walkT: 0, dim: d, hp: 20, name: 'PAL', look: { skin: 1, hair: 4, shirt: 4 }, swing: 0, inv: 0 }];
  WGS.cam.x = (x0 + 5) * 16 + 8; WGS.cam.y = y0 * 16 + 16; WGS.scr = 'play'; WGS.clock = 0.3; WGS.toast = null; WGS.weather = null; })(); 0`);
await sleep(500);
console.log('seats', await g.shot('wg_rest_seats.png'));
await g.ev(`WGS.remote = []; WGS.p.sit = null; WGS.scr = 'inv'; WGS.ui = {}; const inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; ${JSON.stringify(ITEMS)}.forEach((id, i) => inv[9 + i] = { id, n: 2 }); Input.mx = 300; Input.my = 200; 0`); await sleep(300);
console.log('icons', await g.shot('wg_rest_icons.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'REST OK' : 'REST FAIL'); g.close(); process.exit(pass ? 0 : 1);
