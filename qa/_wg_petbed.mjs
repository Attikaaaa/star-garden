// Wildgrove's pet bed: an object (walkable), a recipe, its front rim; a companion follows as before while you are up and
// about, trots to the bed and naps while you sit, gets up with you; at night it naps once you have stood still a while;
// one that cannot reach the bed gives up for a while; USE on the bed; the nap goes out in the mobs message (index 9)
// and a guest reads it; drawn low with the rim over it and z's; SWEET DREAMS; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'NAP' }, seed: { v: '74' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'pet_bed'); return [!!(WGA.obj.pet_bed || [])[0], OBJ[O_ID.pet_bed].solid, rc && rc.at, !!WGA.cache.pet_bed_front]; })()`);
ok(r[0] && r[1] === 0 && r[2] === 'loom' && r[3], 'an object you can walk on, a recipe, its front rim: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -7; j < 8; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { nap: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 12; window._pb = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; WGS.clock = 0.4; WGS.weather = null; WGS.wxT = 9999; WGS.mobs.length = 0;
  p.pet = 'fox'; wgSetObj(w, d, x + 4, y + 1, O_ID.pet_bed); wgSetObj(w, d, x, y, O_ID.chair);
  const run = (n) => { for (let i = 0; i < n; i++) updateWG(1 / 60); }, pet = () => WGS.mobs.find(m => m.pet), res = [];
  run(120); const a = pet(); res.push(!!a, a && a.nap, a && Math.round(Math.hypot(a.x - p.x, a.y - p.y)) < 40);
  wgUse(x, y); res.push(!!p.sit); run(240); const b = pet(); res.push(b.nap, b.x === (x + 4) * 16 + 8 && b.y === (y + 1) * 16 + 12, !!w.meta.stats.nap);
  p.sit = null; p.x += 3; run(120); res.push(pet().nap, Math.round(Math.hypot(pet().x - p.x, pet().y - p.y)) < 40); return res; })()`);
ok(r[0] && !r[1] && r[2], 'up and about, the companion follows as before: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] && r[4] === 1 && r[5] && r[6], 'seated, it trots to the bed and naps in it: ' + JSON.stringify(r.slice(3, 7)));
ok(r[7] === 0 && r[8], 'up again, it comes along: ' + JSON.stringify(r.slice(7)));
r = await g.ev(`(() => { const p = WGS.p, pet = () => WGS.mobs.find(m => m.pet), run = (n) => { for (let i = 0; i < n; i++) updateWG(1 / 60); }, res = [];
  WGS.clock = 0.95; WGPB.stillT = WGS.t; run(60); res.push(pet().nap); run(300); res.push(pet().nap);
  WGS.clock = 0.4; run(60); res.push(pet().nap); return res; })()`);
ok(r.join() === '0,1,0', 'at night it naps once you have stood still a while, not by day: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _pb, w = WGS.world, d = WGS.dim, p = WGS.p, pet = () => WGS.mobs.find(m => m.pet), run = (n) => { for (let i = 0; i < n; i++) updateWG(1 / 60); }, res = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (i !== 1 || j !== 1) wgSetObj(w, d, x + 3 + i, y + j, O_ID.boulder);
  const f = pet(); f.x = p.x - 14; f.y = p.y + 6; f.bedNo = 0; wgUse(x, y); run(300); res.push(pet().nap, pet().bedNo > WGS.t, Math.round(Math.hypot(pet().x - p.x, pet().y - p.y)) < 40);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (i !== 1 || j !== 1) wgSetObj(w, d, x + 3 + i, y + j, 0); p.sit = null; pet().bedNo = 0; return res; })()`);
ok(r[0] === 0 && r[1] && r[2], 'a bed it cannot reach: it gives up for a while and stays by you: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _pb, p = WGS.p, pet = () => WGS.mobs.find(m => m.pet), run = (n) => { for (let i = 0; i < n; i++) updateWG(1 / 60); }, res = [], say = () => { WGS.toast = null; wgUse(x + 4, y + 1); return WGS.toast && WGS.toast.msg; };
  res.push(say()); wgUse(x, y); run(300); res.push(pet().nap, say());
  const sent = [], L = { send: (s) => sent.push(JSON.parse(s)) }, f = pet();
  wgnSend(L, { t: 'mobs', l: [[f.id, f.type, 1, 1, 0, 0, 6, 0, 'o'], [-5, 'cow', 2, 2, 0, 0, 6, 0, 'o']] }, true); res.push(JSON.stringify(sent[0].l.map(a => a[9] || 0)));
  return res; })()`);
ok(r[0] === 'A COSY BED FOR YOUR COMPANION' && r[1] === 1 && r[2] === 'SHH... IT IS ASLEEP', 'USE on the bed: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] === '[1,0]', 'the host sends the nap at index 9 of the mobs message: ' + JSON.stringify(r[3]));
r = await g.ev(`(() => { const mobs = WGS.mobs, res = [];
  try { WGS.mobs = []; wgnMobs([[901, 'fox', 100, 100, 0, 0, 6, 0, WGS.dim, 1], [902, 'cow', 140, 100, 0, 0, 8, 0, WGS.dim], [903, 'nosuch', 1, 1, 0, 0, 1, 0, WGS.dim, 1]]); res.push(WGS.mobs.map(m => m.id + ':' + m.nap).join()); }
  finally { WGS.mobs = mobs; } return res; })()`);
ok(r[0] === '901:1,902:0', 'a guest reads the nap: ' + JSON.stringify(r));
r = await g.ev(`(() => { const D = ctx.drawImage.bind(ctx), F = ctx.fillRect.bind(ctx), cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, pet = WGS.mobs.find(m => m.pet);
  const draw = () => { let rim = 0, z = 0; ctx.drawImage = function (img) { if (img === WGA.cache.pet_bed_front) rim++; return D(...arguments); }; ctx.fillRect = function () { if (ctx.fillStyle === PAL.w) z++; return F(...arguments); };
    try { wgDrawMob({ m: pet }, cx0, cy0); } finally { ctx.drawImage = D; ctx.fillRect = F; } return [rim, z]; };
  const a = draw(), n = pet.nap; pet.nap = 0; const b = draw(); pet.nap = n; return [a, b, pet.y]; })()`);
ok(r[0][0] === 1 && r[0][1] >= 3 && r[1].join() === '0,0', 'drawn low with the rim over it and z rising, not when awake: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; wgAchTick(); return [!!m.ach.nap, wgTipLines({ id: 'pet_bed', n: 1 })]; })()`);
ok(r[0] && r[1].includes('YOUR COMPANION NAPS HERE WHILE YOU REST'), 'SWEET DREAMS, tips: ' + JSON.stringify(r));
const EN = ['PET BED', 'SWEET DREAMS', 'WATCH YOUR COMPANION NAP IN ITS BED', 'SHH... IT IS ASLEEP', 'A COSY BED FOR YOUR COMPANION', 'YOUR COMPANION NAPS HERE WHILE YOU REST'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: seated of an evening, the fox asleep in its bed, an empty bed further off
await g.ev(`(() => { const { x, y } = _pb; wgSetObj(WGS.world, WGS.dim, x - 7, y + 1, O_ID.pet_bed); WGS.clock = 0.7; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`); // and an empty one out of reach
await sleep(400); console.log('petbed', await g.shot('wg_petbed.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PETBED OK' : 'PETBED FAIL'); g.close(); process.exit(pass ? 0 : 1);
