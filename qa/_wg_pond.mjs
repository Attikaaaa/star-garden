// Wildgrove's pond pack: the rowboat, the well, lily pads and the water lily have art and recipes; a boat in hand rows
// quicker than swimming or wading and does nothing on land, the water's own pace is put back; rowing counts towards
// ROW YOUR BOAT; a well fills a bucket (and still gives a sip without one); lily pads come up whole and go on water only;
// ducks paddle on a pond by day and not at night; a friend in a boat is drawn in theirs and the net messages carry the
// boat; tips, Hungarian; a look at a lake with two boats, ducks, lilies and the well on the shore.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'POND' }, seed: { v: '81' }, look: { skin: 2, hair: 3, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ['rowboat', 'well', 'lilypad', 'waterlily']) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id); }
  for (const id of ['rowboat', 'well', 'waterlily']) if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id);
  for (const id of ['well', 'waterlily']) if (!WGA.obj[id]) bad.push('no sprite ' + id);
  if (!OBJ[O_ID.lilypad].drops.some(d => d.id === 'lilypad' || d[0] === 'lilypad' || JSON.stringify(d).includes('lilypad'))) bad.push('lily pad drop');
  if (!OBJ[O_ID.well].drops.some(d => JSON.stringify(d).includes('well'))) bad.push('well drop');
  for (const k of ['l', 'r', 'v']) if (px(wgBoatSpr(k)) < 100) bad.push('thin boat ' + k);
  for (const k of [0, 1]) for (const l of [true, false]) if (px(wgDuckSpr(k, l)) < 15) bad.push('thin duck ' + k);
  return bad; })()`);
ok(!r.length, 'art, recipes, drops: ' + JSON.stringify(r));
const walk = async (gid, boat) => g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let i = -2; i < 14; i++) for (let j = -1; j < 2; j++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID['${gid}']); }
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = ${boat ? "{ id: 'rowboat', n: 1 }" : 'null'}; WGS.sel = 0;
  WGS.mobs = []; WGS.scr = 'play'; p.food = 20; p.x = x * 16 + 8; p.y = y * 16 + 8; p.vx = p.vy = 0; const x0 = p.x; Input.down.ArrowRight = true; for (let i = 0; i < 60; i++) updateWG(1 / 60); Input.down.ArrowRight = false;
  const dx = p.x - x0; p.x = x0; return Math.round(dx); })()`);
await g.ev(`(() => { const m = WGS.world.meta; m.hintDone = 1; m.ach = {}; m.stats = { kills: 0, far: 0 }; WGS.weather = null; WGS.clock = 0.35; })(); 0`);
const swim = await walk('deep', false), row = await walk('deep', true), wade = await walk('shallow', false), rowS = await walk('shallow', true), land = await walk('grass', false), landB = await walk('grass', true);
r = await g.ev(`[GROUND[G_ID.deep].speed, GROUND[G_ID.shallow].speed, Math.round(WGS.world.meta.stats.row || 0)]`);
ok(row > swim * 2 && rowS > wade * 1.4 && Math.abs(landB - land) <= 2 && r[0] === 0.45 && r[1] === 0.7 && r[2] >= 8, 'a boat rows quicker, not on land, the water keeps its pace: ' + JSON.stringify({ swim, row, wade, rowS, land, landB, speeds: r }));
r = await g.ev(`(() => { const st = WGS.world.meta.stats; st.row = 99; wgAchTick(); const not = !!WGS.world.meta.ach.row; st.row = 100; wgAchTick(); return [not, !!WGS.world.meta.ach.row]; })()`);
ok(!r[0] && r[1], 'ROW YOUR BOAT after a hundred tiles: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = {};
  for (let i = -1; i < 4; i++) for (let j = -1; j < 2; j++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  wgSetObj(w, d, x, y, O_ID.well); for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'bucket', n: 2 }; WGS.sel = 0;
  wgUse(x, y); res.fill = [wgInvCount(WGS.inv, 'bucket'), wgInvCount(WGS.inv, 'bucket_water')];
  WGS.inv[0] = null; WGS.inv[1] = null; p.hp = 5; wgUse(x, y); res.sip = p.hp;
  // lily pads: on water yes, on grass no
  const it = WGI.lilypad, wl = WGI.waterlily; wgSetGround(w, d, x + 2, y, G_ID.shallow); wgSetGround(w, d, x + 3, y, G_ID.grass);
  res.place = [wgCanPlaceAt(x + 2, y, it), wgCanPlaceAt(x + 3, y, it), wgCanPlaceAt(x + 2, y, wl), wgCanPlaceAt(x + 3, y, wl)];
  return res; })()`);
ok(r.fill[0] === 1 && r.fill[1] === 1 && r.sip === 7 && r.place.join() === 'true,false,true,false', 'a well fills a bucket, lilies go on water: ' + JSON.stringify(r));
// ducks: a big lake round the view, by day and by night
const ducks = async (clock) => g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 22, y0 = Math.floor(p.y / 16) - 14;
  for (let j = 0; j < 28; j++) for (let i = 0; i < 44; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.deep); }
  WGDK.clear(); WGS.clock = ${clock}; WGS.cam.x = p.x; WGS.cam.y = p.y; let n = 0; const f = wgDuckSpr; wgDuckSpr = (...a) => (n++, f(...a));
  try { drawWG(); } finally { wgDuckSpr = f; } return [n, [...WGDK.values()].filter(Boolean).length]; })()`);
const day = await ducks(0.35), night = await ducks(0.9);
ok(day[0] >= 3 && day[1] >= 1 && night[0] === 0, 'ducks on a pond by day, not at night: ' + JSON.stringify({ day, night }));
await g.ev(`WGS.clock = 0.35; 0`);
r = await g.ev(`(() => { const p = WGS.p; WGS.remote = [{ pid: 2, x: p.x + 40, y: p.y + 10, face: 'u', moving: true, walkT: 1, dim: WGS.dim, hp: 20, name: 'FRIEND', look: { skin: 1, hair: 0, shirt: 2 }, swing: 0, kite: 0, boat: 1, inv: 0 }];
  let used = 0; const f = wgBoatSpr; wgBoatSpr = (...a) => (used++, f(...a)); try { drawWG(); } finally { wgBoatSpr = f; } WGS.remote = []; return used; })()`);
const net = await (await import('fs')).promises.readFile(new URL('../src/wg_net.js', import.meta.url), 'utf8');
ok(r >= 1 && /boat: m\.bt \? 1 : 0/.test(net) && /boat: a\[12\] \? 1 : 0/.test(net) && /bt: typeof wgBoatHeld/.test(net) && /L\.kite \| 0, L\.boat \? 1 : 0\]/.test(net), 'a friend rows in a boat, the net carries it: ' + r);
r = await g.ev(`wgTipLines({ id: 'rowboat', n: 1 }).concat(wgTipLines({ id: 'well', n: 1 }), wgTipLines({ id: 'waterlily', n: 1 }))`);
ok(r.includes('HOLD IT TO ROW ON WATER') && r.includes('DRAW WATER WITH A BUCKET') && r.includes('FLOATS ON WATER'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.rowboat.name), tr(WGI.waterlily.name), tr('ROW YOUR BOAT'), tr('HOLD IT TO ROW ON WATER'), tr('DRAW WATER WITH A BUCKET'), tr('FLOATS ON WATER')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['ROWBOAT', 'WATER LILY', 'ROW YOUR BOAT', 'HOLD IT TO ROW ON WATER', 'DRAW WATER WITH A BUCKET', 'FLOATS ON WATER'][i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a lake with you rowing right, a friend rowing up, lilies, ducks, the well on the shore
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 12, y0 = Math.floor(p.y / 16) - 7;
  for (let j = -2; j < 18; j++) for (let i = -2; i < 28; i++) { const e = Math.hypot((i - 12) / 11, (j - 7) / 6.5); wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, e < 0.8 ? G_ID.deep : e < 1 ? G_ID.shallow : e < 1.12 ? G_ID.sand : G_ID.grass); }
  for (const [i, j, o] of [[5, 5, 'lilypad'], [6, 9, 'waterlily'], [18, 4, 'waterlily'], [19, 10, 'lilypad'], [3, 7, 'lilypad']]) wgSetObj(w, d, x0 + i, y0 + j, O_ID[o]);
  wgSetObj(w, d, x0 + 24, y0 + 3, O_ID.well); wgSetObj(w, d, x0 + 25, y0 + 9, O_ID.oak);
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'rowboat', n: 1 }; WGS.sel = 0; p.face = 'r'; p.moving = true; p.x = (x0 + 9) * 16 + 8; p.y = (y0 + 7) * 16 + 8;
  WGS.remote = [{ pid: 2, x: (x0 + 15) * 16 + 8, y: (y0 + 8) * 16 + 8, face: 'u', moving: true, walkT: 1, dim: d, hp: 20, name: 'FRIEND', look: { skin: 1, hair: 0, shirt: 2 }, swing: 0, kite: 0, boat: 1, inv: 0 }];
  WGS.cam.x = (x0 + 12) * 16 + 8; WGS.cam.y = (y0 + 7) * 16; WGS.toast = null; WGDK.clear(); Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(500); console.log('lake', await g.shot('wg_pond_lake.png'));
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'POND OK' : 'POND FAIL'); g.close(); process.exit(pass ? 0 : 1);
