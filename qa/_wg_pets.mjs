// Wildgrove's pets: a rabbit trusts you for a carrot, a frog for a firefly, a crab for a raw fish (two times in five, the
// treat spent either way); a new friend sends the old one home; petting with an empty hand on a bare tile gives hearts
// and a wiggle, not twice at once, never with something in hand or over a chest; BEST FRIENDS after ten; a guest's
// screen tames nothing; tips, Hungarian; a look at a petted frog among friends.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PETS' }, seed: { v: '71' }, look: { skin: 2, hair: 0, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = {};
  for (let j = -4; j < 5; j++) for (let i = -6; i < 7; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; p.pet = null;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'carrot', n: 3 }; WGS.inv[1] = { id: 'firefly', n: 3 }; WGS.inv[2] = { id: 'fish', n: 2 };
  const at = (type, i) => wgSpawnMob(type, (x + i) * 16 + 8, (y + 2) * 16 + 14), feed = (sel, i, roll) => { const R = Math.random; Math.random = () => roll; WGS.sel = sel; WGS.toast = null; try { return wgUse(x + i, y + 2); } finally { Math.random = R; } };
  const rab = at('rabbit', -3), frog = at('frog', 0), crab = at('crab', 3);
  res.rab = [feed(0, -3, 0.1), rab.pet, p.pet, wgInvCount(WGS.inv, 'carrot'), WGS.toast && WGS.toast.msg];
  res.miss = [feed(1, 0, 0.9), !!frog.pet, wgInvCount(WGS.inv, 'firefly'), WGS.toast && WGS.toast.msg];
  res.frog = [feed(1, 0, 0.2), frog.pet, rab.pet, p.pet, WGS.mobs.filter(m => m.pet).length];
  window._pt = { x, y }; return res; })()`);
ok(r.rab[0] && r.rab[1] === 1 && r.rab[2] === 'rabbit' && r.rab[3] === 2 && r.rab[4] === 'THE RABBIT TRUSTS YOU', 'a carrot wins a rabbit: ' + JSON.stringify(r.rab));
ok(r.miss[0] && !r.miss[1] && r.miss[2] === 2 && r.miss[3] === 'THE FROG SNIFFS...', 'a treat that does not win it is spent: ' + JSON.stringify(r.miss));
ok(r.frog[1] === 1 && !r.frog[2] && r.frog[3] === 'frog' && r.frog[4] === 1, 'a new friend sends the old one home: ' + JSON.stringify(r.frog));
r = await g.ev(`(() => { const { x, y } = _pt, st = WGS.world.meta.stats, frog = WGS.mobs.find(m => m.pet), res = [];
  WGS.sel = 8; WGS.inv[8] = null; wgUse(x, y + 2); res.push(st.pats); wgUse(x, y + 2); res.push(st.pats); WGS.t += 1; wgUse(x, y + 2); res.push(st.pats);
  WGS.t += 1; WGS.sel = 0; wgUse(x, y + 2); res.push(st.pats); WGS.sel = 8;
  wgSetObj(WGS.world, WGS.dim, x, y + 2, O_ID.chest); WGS.t += 1; WGS.scr = 'play'; wgUse(x, y + 2); res.push(st.pats, WGS.scr); WGS.scr = 'play'; wgSetObj(WGS.world, WGS.dim, x, y + 2, 0);
  const f = frog.flip; frog.patT = WGS.t + 1; wgDrawMob({ m: frog, y: frog.y }, WGS.cam.x - 192, WGS.cam.y - 108); res.push(frog.flip === f);
  st.pats = 9; wgAchTick(); res.push(!!WGS.world.meta.ach.pats); st.pats = 10; wgAchTick(); res.push(!!WGS.world.meta.ach.pats); return res; })()`);
ok(r[0] === 1 && r[1] === 1 && r[2] === 2 && r[3] === 2 && r[4] === 2 && r[5] === 'chest' && r[6], 'petting: empty hand, not twice at once, never with a carrot or over a chest: ' + JSON.stringify(r));
ok(!r[7] && r[8], 'BEST FRIENDS after ten: ' + JSON.stringify(r.slice(7)));
r = await g.ev(`(() => { const { x, y } = _pt, crab = WGS.mobs.find(m => m.type === 'crab'), role = WGN.role, R = Math.random; WGN.role = 'client'; Math.random = () => 0.1; WGS.sel = 2;
  try { wgUse(x + 3, y + 2); } finally { WGN.role = role; Math.random = R; } return [!!crab.pet, WGS.p.pet, wgInvCount(WGS.inv, 'fish')]; })()`);
ok(!r[0] && r[1] === 'frog' && r[2] === 2, "a guest's screen tames nothing: " + JSON.stringify(r));
r = await g.ev(`['meat', 'carrot', 'firefly', 'fish'].map(id => wgTipLines({ id, n: 1 }).slice(-1)[0])`);
ok(r.join() === 'FOXES LOVE IT,RABBITS LOVE THEM,FROGS LOVE THEM,CRABS LOVE IT', 'tips: ' + JSON.stringify(r));
const EN = ['BEST FRIENDS', 'PET YOUR COMPANION TEN TIMES', 'THE RABBIT TRUSTS YOU', 'THE FROG TRUSTS YOU', 'THE CRAB TRUSTS YOU', 'THE RABBIT SNIFFS...', 'THE FROG SNIFFS...', 'THE CRAB SNIFFS...', 'RABBITS LOVE THEM', 'FROGS LOVE THEM', 'CRABS LOVE IT', 'FOXES LOVE IT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the frog petted at your feet, a rabbit and a crab nearby
await g.ev(`(() => { const { x, y } = _pt, p = WGS.p, frog = WGS.mobs.find(m => m.pet); p.x = x * 16 + 8; p.y = (y + 1) * 16 + 4; p.face = 'd'; frog.x = x * 16 + 14; frog.y = (y + 2) * 16 + 10;
  WGS.sel = 8; frog.patT = 0; wgUse(x, y + 2); frog.patAt = WGS.t - 0.1; frog.patT = WGS.t + 30;
  WGS.cam.x = x * 16 + 8; WGS.cam.y = (y + 1) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.35; Input.mx = 4; Input.my = 4; WGS.wxT = 9999; })(); 0`);
await sleep(250); console.log('pets', await g.shot('wg_pets.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PETS OK' : 'PETS FAIL'); g.close(); process.exit(pass ? 0 : 1);
