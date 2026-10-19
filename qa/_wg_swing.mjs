// Wildgrove's garden rest pack: the swing, the bathtub and the bird bath have art and recipes; the swing and the tub are
// seats; a swing sways only while someone sits on it (you, or a friend sent as seated); a bath heals twice as fast as a
// chair and lights SQUEAKY CLEAN; tips, Hungarian; a look at a swing, a bather and a bird at the bath.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SWING' }, seed: { v: '77' }, look: { skin: 1, hair: 4, shirt: 6 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const IDS = ['swing', 'bathtub', 'birdbath'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(IDS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); if (!WGA.obj[id]) bad.push('no sprite ' + id); }
  if (!OBJ[O_ID.swing].seat || !OBJ[O_ID.bathtub].seat || OBJ[O_ID.birdbath].seat) bad.push('seats');
  return bad; })()`);
ok(!r.length, 'art, recipes, seats: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = {};
  for (let j = -2; j < 3; j++) for (let i = -2; i < 6; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = [];
  wgSetObj(w, d, x, y, O_ID.swing); res.idle = wgSeatedAt(x, y); wgUse(x, y); res.sit = [!!p.sit, wgSeatedAt(x, y)];
  const a = []; for (let i = 0; i < 40; i++) { WGS.t += 0.05; a.push(wgSwayAt(x, y)); } res.sway = [Math.min(...a), Math.max(...a)];
  wgStand(); res.stood = wgSeatedAt(x, y);
  WGS.remote = [{ pid: 2, x: x * 16 + 8, y: y * 16 + 12, face: 'S', moving: false, walkT: 0, dim: d, hp: 20, name: 'FRIEND', look: { skin: 0, hair: 1, shirt: 3 }, swing: 0, kite: 0, inv: 0 }];
  res.friend = wgSeatedAt(x, y); WGS.remote = [];
  // a chair, then the bath: the same time, twice the healing (not so full that a full belly heals too)
  const heal = (id) => { wgSetObj(w, d, x + 2, y, O_ID[id]); p.sit = null; p.hp = 4; p.food = 10; wgUse(x + 2, y); for (let i = 0; i < 60 * 6.1; i++) updateWG(1 / 60); const n = p.hp - 4; wgStand(); return n; };
  res.chair = heal('chair'); res.bath = heal('bathtub'); wgAchTick(); res.star = !!w.meta.ach.bath;
  return res; })()`);
ok(!r.idle && r.sit[0] && r.sit[1] && r.stood === false && r.friend, 'a seat for you and a friend: ' + JSON.stringify([r.idle, r.sit, r.stood, r.friend]));
ok(r.sway[0] === -2 && r.sway[1] === 2, 'the swing sways: ' + JSON.stringify(r.sway));
ok(r.chair === 2 && r.bath === 4 && r.star, 'a bath heals twice as fast, SQUEAKY CLEAN: ' + JSON.stringify([r.chair, r.bath, r.star]));
r = await g.ev(`wgTipLines({ id: 'bathtub', n: 1 }).concat(wgTipLines({ id: 'birdbath', n: 1 }), wgTipLines({ id: 'swing', n: 1 }))`);
ok(r.includes('HEALS TWICE AS FAST') && r.includes('LITTLE BIRDS COME TO SPLASH') && r.includes('USE IT TO SIT AND REST'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(OBJ[O_ID.swing].name), tr(OBJ[O_ID.bathtub].name), tr(OBJ[O_ID.birdbath].name), tr('SQUEAKY CLEAN'), tr('HEALS TWICE AS FAST'), tr('LITTLE BIRDS COME TO SPLASH')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['GARDEN SWING', 'BATHTUB', 'BIRD BATH', 'SQUEAKY CLEAN', 'HEALS TWICE AS FAST', 'LITTLE BIRDS COME TO SPLASH'][i]), 'Hungarian: ' + JSON.stringify(r));
// a look: you on the swing, a friend in the bath, a bird at the bath
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 4, y0 = Math.floor(p.y / 16) - 2;
  for (let j = -3; j < 6; j++) for (let i = -2; i < 12; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  for (let i = 4; i < 8; i++) for (let j = 1; j < 4; j++) wgSetGround(w, d, x0 + i, y0 + j, G_ID.f_stone);
  wgSetObj(w, d, x0 + 1, y0 + 2, O_ID.swing); wgSetObj(w, d, x0 + 5, y0 + 2, O_ID.bathtub); wgSetObj(w, d, x0 + 9, y0 + 2, O_ID.birdbath); wgSetObj(w, d, x0 + 7, y0 + 1, O_ID.pot_fern);
  p.sit = null; p.x = (x0 + 1) * 16 + 8; p.y = (y0 + 2) * 16 + 12; wgUse(x0 + 1, y0 + 2);
  WGS.remote = [{ pid: 2, x: (x0 + 5) * 16 + 8, y: (y0 + 2) * 16 + 12, face: 'S', moving: false, walkT: 0, dim: d, hp: 20, name: 'FRIEND', look: { skin: 2, hair: 1, shirt: 3 }, swing: 0, kite: 0, inv: 0 }];
  WGS.cam.x = (x0 + 5) * 16 + 8; WGS.cam.y = (y0 + 2) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.35; })(); 0`);
let shot = '';
for (let k = 0; k < 12 && !shot; k++) { await sleep(250); const bird = await g.ev(`(WGS.t * 0.12 + (hash(${'Math.floor(WGS.cam.x / 16) + 4'}, Math.floor(WGS.cam.y / 16), 9) & 255) / 256) % 1 < 0.5`); if (bird || k === 11) shot = await g.shot('wg_swing_yard.png'); }
console.log('yard', shot);
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SWING OK' : 'SWING FAIL'); g.close(); process.exit(pass ? 0 : 1);
