// Wildgrove's hearth pack: the fireplace (three frames of flame), the rocking chair and the kitchen dresser have art
// and recipes; a fireplace cooks like a campfire and lights; a seat near it heals half as fast again and lights HEARTH
// AND HOME, one far away does not; the cat on the hearth wakes and purrs on USE, and there is none when the hearth is
// blocked; a rocking chair rocks only while someone sits in it; the dresser keeps things; tips, Hungarian; a look at a
// sitting room by the fire.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'HEARTH' }, seed: { v: '91' }, look: { skin: 3, hair: 1, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const IDS = ['fireplace', 'rocker', 'dresser'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(IDS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 60) bad.push('thin icon ' + id); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); if (!WGA.obj[id]) bad.push('no sprite ' + id); }
  if (WGA.obj.fireplace.length !== 3 || !OBJ[O_ID.fireplace].anim || !OBJ[O_ID.fireplace].light) bad.push('flames');
  for (const k of [0, 1, 2]) if (px(wgCatSpr(k, false, false)) < 40) bad.push('thin cat ' + k);
  return bad; })()`);
ok(!r.length, 'art and recipes: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = {};
  for (let j = -6; j < 7; j++) for (let i = -8; i < 9; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.f_wood); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = [];
  let fx = x + 1; while (hash(fx, y - 1, 61) % 3 === 0) fx++; // a hearth that has a cat
  res.before = !!wgStations().fire; wgSetObj(w, d, fx, y - 1, O_ID.fireplace); res.after = !!wgStations().fire;
  // the same chair near the fire and far from it, six seconds each
  const heal = (cx, cy) => { wgSetObj(w, d, cx, cy, O_ID.chair); p.sit = null; p.hp = 4; p.food = 10; wgUse(cx, cy); for (let i = 0; i < 60 * 6.1; i++) updateWG(1 / 60); const n = p.hp - 4; wgStand(); wgSetObj(w, d, cx, cy, 0); return n; };
  res.far = heal(x - 6, y + 4); res.star0 = !!w.meta.stats.hearth; res.near = heal(fx + 2, y); wgAchTick(); res.star = !!w.meta.ach.hearth;
  // the cat in front, and USE on it
  res.cat = wgCatAt(fx, y - 1); res.purr = wgUse(fx, y) && WGS.purr && WGS.purr.tx === fx;
  wgSetObj(w, d, fx, y, O_ID.chest); res.blocked = wgCatAt(fx, y - 1); wgSetObj(w, d, fx, y, 0);
  // a rocking chair: still when empty, rocking under a sitter
  wgSetObj(w, d, x - 2, y + 2, O_ID.rocker); const a = []; for (let i = 0; i < 30; i++) { WGS.t += 0.07; a.push(wgRockAt(x - 2, y + 2)); } res.empty = [Math.min(...a), Math.max(...a)];
  p.sit = null; wgUse(x - 2, y + 2); a.length = 0; for (let i = 0; i < 30; i++) { WGS.t += 0.07; a.push(wgRockAt(x - 2, y + 2)); } res.rock = [Math.min(...a), Math.max(...a)]; wgStand();
  res.dresser = OBJ[O_ID.dresser].kind === 'storage' && OBJ[O_ID.dresser].slots >= 12;
  return res; })()`);
ok(!r.before && r.after, 'a fireplace cooks like a campfire: ' + JSON.stringify([r.before, r.after]));
ok(r.far === 2 && r.near === 3 && !r.star0 && r.star, 'a seat by the fire heals faster, HEARTH AND HOME: ' + JSON.stringify([r.far, r.near, r.star0, r.star]));
ok(r.cat !== null && r.purr && r.blocked === null, 'a cat on the hearth purrs, none when it is blocked: ' + JSON.stringify([r.cat, r.purr, r.blocked]));
ok(r.empty[0] === 0 && r.empty[1] === 0 && r.rock[0] === -1 && r.rock[1] === 1 && r.dresser, 'the rocking chair rocks only with a sitter; the dresser keeps things: ' + JSON.stringify([r.empty, r.rock, r.dresser]));
r = await g.ev(`(() => { let n = 0; for (let i = 0; i < 300; i++) { const tx = 1000 + i * 7, ty = 300; if (hash(tx, ty, 61) % 3 !== 0) n++; } return n; })()`);
ok(r > 160 && r < 240, 'about two fireplaces in three have a cat: ' + r + '/300');
r = await g.ev(`wgTipLines({ id: 'fireplace', n: 1 }).concat(wgTipLines({ id: 'rocker', n: 1 }), wgTipLines({ id: 'dresser', n: 1 }))`);
ok(r.includes('COOKS LIKE A CAMPFIRE') && r.includes('SEATS NEARBY HEAL FASTER') && r.includes('ROCKS GENTLY') && r.includes('USE IT TO SIT AND REST'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.fireplace.name), tr(WGI.rocker.name), tr(WGI.dresser.name), tr('HEARTH AND HOME'), tr('SEATS NEARBY HEAL FASTER'), tr('ROCKS GENTLY'), tr('PURR...')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['FIREPLACE', 'ROCKING CHAIR', 'KITCHEN DRESSER', 'HEARTH AND HOME', 'SEATS NEARBY HEAL FASTER', 'ROCKS GENTLY', 'PURR...'][i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a sitting room, the fire lit, a cat on the hearth, you in the rocking chair at dusk
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 5, y0 = Math.floor(p.y / 16) - 3;
  for (let j = -2; j < 9; j++) for (let i = -2; i < 13; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.f_wood); }
  for (let i = 3; i < 8; i++) for (let j = 3; j < 6; j++) wgSetGround(w, d, x0 + i, y0 + j, G_ID.f_red);
  let cx = x0 + 5; for (let k = 0; k < 40 && hash(cx, y0 + 1, 61) % 3 === 0; k++) cx++;
  wgSetObj(w, d, cx, y0 + 1, O_ID.fireplace); wgSetObj(w, d, cx - 3, y0 + 3, O_ID.rocker); wgSetObj(w, d, cx + 3, y0 + 3, O_ID.couch); wgSetObj(w, d, cx + 6, y0 + 1, O_ID.dresser); wgSetObj(w, d, cx - 5, y0 + 1, O_ID.bookshelf);
  p.sit = null; p.x = (cx - 3) * 16 + 8; p.y = (y0 + 3) * 16 + 12; wgUse(cx - 3, y0 + 3);
  WGS.cam.x = cx * 16 + 8; WGS.cam.y = (y0 + 3) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.78; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(600); console.log('room', await g.shot('wg_hearth_room.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'HEARTH OK' : 'HEARTH FAIL'); g.close(); process.exit(pass ? 0 : 1);
