// Wildgrove's little wishes: three different ones a day, the same for the same day and seed, not the same every day;
// chopping, breaking, picking, cutting, eating, an emote and a walk are counted (a jump is no walk); all three granted
// bring one gift, not two; a new day starts over; the card beside the pause menu; LITTLE HELPER; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'WISH' }, seed: { v: '58' }, look: { skin: 1, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const d0 = WGS.day, a = wgWishesToday().map(W => W[0]), b = wgWishesToday().map(W => W[0]), seen = new Set();
  for (let d = 0; d < 12; d++) { WGS.day = d; seen.add(wgWishesToday().map(W => W[0]).join()); } WGS.day = d0; return [a.join(), new Set(a).size, a.join() === b.join(), seen.size]; })()`);
ok(r[1] === 3 && r[2] && r[3] >= 6, 'three different wishes, the same for the day, not the same every day: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -3; j < 4; j++) for (let i = -5; i < 6; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; w.meta.wish = null; window._wi = { x, y };
  const brk = (id) => { wgSetObj(w, d, x + 2, y, O_ID[id]); wgBreak(x + 2, y, true); }; brk('oak'); brk('boulder'); brk('flower_r'); brk('tallgrass'); brk('tallgrass');
  wgSetObj(w, d, x + 2, y, O_ID.oak); wgBreak(x + 2, y, false); wgSetObj(w, d, x + 2, y, 0); WGS.drops.length = 0;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'bread', n: 3 }; p.food = 1; wgEat(0); wgEmote(1);
  const c = wgWishState().c; return [c.tree, c.rock, c.flower, c.grass, c.eat, c.emote]; })()`);
ok(r.join() === '1,1,1,2,1,1', 'chopping, breaking, picking, cutting, eating and an emote are counted (not a tree that falls by itself): ' + JSON.stringify(r));
r = await g.ev(`(() => { const p = WGS.p, S = wgWishState(); S.c.walk = 0; WGWI.acc = 0; for (let i = 0; i < 32; i++) { p.x += 2; updateWG(1 / 60); } const a = S.c.walk; p.x += 200; updateWG(1 / 60); return [a, S.c.walk]; })()`);
ok(r[0] === 4 && r[1] === 4, 'a walk is counted in tiles, a jump is no walk: ' + JSON.stringify(r));
r = await g.ev(`(() => { const S = wgWishState(), L = wgWishesToday(), inv = () => WGS.inv.reduce((a, s) => a + (s ? s.n : 0), 0), res = [];
  WGS.toast = null; S.c[L[0][0]] = L[0][2]; updateWG(1 / 60); res.push(S.done.join(), WGS.toast && WGS.toast.msg);
  const n0 = inv(); for (const W of L) S.c[W[0]] = W[2]; updateWG(1 / 60); res.push(S.done.join(), S.gift, inv() > n0, WGS.world.meta.stats.wishes, WGS.toast && WGS.toast.msg);
  const n1 = inv(); updateWG(1 / 60); res.push(inv() === n1, WGS.world.meta.stats.wishes);
  WGS.day += 1; const T = wgWishState(); res.push(T.done.join(), Object.keys(T.c).length, T.gift); WGS.day -= 1; WGS.world.meta.wish = S; return res; })()`);
ok(r[0] === '1,0,0' && r[1] === 'WISH GRANTED!', 'a wish granted: ' + JSON.stringify(r.slice(0, 2)));
ok(r[2] === '1,1,1' && r[3] === 1 && r[4] && r[5] === 1 && r[6] === 'ALL WISHES GRANTED! A GIFT FROM THE FROG' && r[7] && r[8] === 1, 'all three bring one gift, not two: ' + JSON.stringify(r.slice(2, 9)));
ok(r[9] === '0,0,0' && r[10] === 0 && r[11] === 0, 'a new day starts over: ' + JSON.stringify(r.slice(9)));
r = await g.ev(`(() => { const W = wtext; let seen = []; wtext = function (s) { seen.push(String(s)); return W.apply(this, arguments); };
  try { WGS.scr = 'pause'; WGS.ui = {}; wgDrawPause(); const a = seen.includes('WISHES'); seen = []; WGS.ui = { set: true }; wgDrawPause(); return [a, seen.includes('WISHES')]; } finally { wtext = W; WGS.scr = 'play'; WGS.ui = {}; } })()`);
ok(r[0] && !r[1], 'the card beside the pause menu, not over its settings: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.wishes = 4; wgAchTick(); const a = !!m.ach.wishes; m.stats.wishes = 5; wgAchTick(); return [a, !!m.ach.wishes]; })()`);
ok(!r[0] && r[1], 'LITTLE HELPER after five: ' + JSON.stringify(r));
const EN = await g.ev(`WG_WISHES.map(wgWishText).concat('WISHES', 'WISH GRANTED!', 'ALL WISHES GRANTED! A GIFT FROM THE FROG', 'LITTLE HELPER', 'GRANT THE FROG ALL THREE WISHES FIVE TIMES')`);
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the pause menu with today's wishes, one granted, one along the way
await g.ev(`(() => { const S = wgWishState(), L = wgWishesToday(); S.done = [1, 0, 0]; S.gift = 0; S.c = { [L[0][0]]: L[0][2] }; S.c[L[1][0]] = Math.max(0, L[1][2] - 1); WGS.toast = null; WGS.scr = 'pause'; WGS.ui = {}; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(250); console.log('wishes', await g.shot('wg_wishes.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'WISHES OK' : 'WISHES FAIL'); g.close(); process.exit(pass ? 0 : 1);
