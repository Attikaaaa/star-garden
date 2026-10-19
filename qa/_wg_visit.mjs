// Wildgrove: the frog drops by. Some days and not others, the same all day and only in its hours, never underground;
// it sits on a free tile beside a mailbox in view (another side when one is taken), none without a mailbox; USE on it
// talks and gives a gift once a visit, a heart over it while the gift waits; it says when it is visiting, once; GOOD
// NEIGHBOURS for three; the mailbox's tip; Hungarian; a look at the frog by a mailbox, talking.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'VISIT' }, seed: { v: '311' }, look: { skin: 2, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -12; j < 13; j++) for (let i = -18; i < 19; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.clock = 0.5; wgOpt().amb = 1; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const count = (id) => WGS.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  let vday = 1; while (hash(vday, w.seed | 0, 97) % WG_VISIT_ONE) vday++; let nday = 1; while (!(hash(nday, w.seed | 0, 97) % WG_VISIT_ONE)) nday++; WGS.day = vday;
  const look = () => { WGFV.t = 0; updateWG(1 / 60); return WGFV.spot; }, ents = () => wgEntities(p.x - 300, p.y - 200, p.x + 300, p.y + 200).filter(e => e.draw === wgFrogDraw);`;
let r = await g.ev(`(() => { ${setup} const res = {}; let n = 0; for (let d = 0; d < 80; d++) { WGS.day = d; if (wgFrogDay()) n++; } res.days = n; WGS.day = vday;
  res.none = [look(), ents().length]; wgSetObj(w, 'o', x + 3, y - 1, O_ID.mailbox); res.spot = look(); res.ents = ents().map(e => [e.x, e.y]);
  WGS.clock = 0.2; res.early = [look(), ents().length]; WGS.clock = 0.75; res.late = look(); WGS.clock = 0.5; WGS.day = nday; res.other = look(); WGS.day = vday;
  WGS.dim = 'u'; res.under = wgFrogVisits(); WGS.dim = 'o'; return res; })()`);
ok(r.days >= 10 && r.days <= 32, 'the frog visits some days and not others: ' + r.days);
ok(r.none[0] === null && r.none[1] === 0 && r.spot && r.ents.length === 1, 'none without a mailbox; beside one in view, slotted in among the things that stand: ' + JSON.stringify([r.none, r.spot, r.ents]));
ok(r.early[0] === null && r.early[1] === 0 && r.late === null && r.other === null && !r.under, 'only in its hours, on its days, never underground: ' + JSON.stringify([r.early, r.late, r.other, r.under]));
r = await g.ev(`(() => { ${setup} const res = {}; wgSetObj(w, 'o', x + 3, y - 1, O_ID.mailbox); const S = look(); res.side = [S.tx - x, S.ty - y];
  wgSetObj(w, 'o', x + 4, y - 1, O_ID.oak); const T = look(); res.left = [T.tx - x, T.ty - y]; wgSetObj(w, 'o', x + 2, y - 1, O_ID.oak); const U = look(); res.below = [U.tx - x, U.ty - y]; return res; })()`);
ok(r.side.join() === '4,-1' && r.left.join() === '2,-1' && r.below.join() === '3,0', 'on a free tile beside the mailbox, another side when one is taken: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; wgSetObj(w, 'o', x + 1, y - 1, O_ID.mailbox); delete w.meta.frogv; st.frogv = 0; WGFV.told = -1; WGS.toast = null;
  const S = look(); res.told = !!WGS.toast; WGS.toast = null; look(); res.once = !WGS.toast;
  const g0 = WG_GIFTS[hash(vday, w.seed | 0, 131) % WG_GIFTS.length]; res.heart0 = wgFrogGift();
  const c0 = count(g0[0]); res.use = wgUse(S.tx, S.ty); res.gift = count(g0[0]) - c0 === g0[1]; res.say = !!WGFV.say && WG_FROG_TALK.includes(WGFV.say.s); res.heart1 = wgFrogGift();
  const s1 = WGFV.say.s; WGS.t += 0.1; res.again = [wgUse(S.tx, S.ty), count(g0[0]) - c0 === g0[1], WGFV.say.s !== s1, st.frogv];
  WGS.day = vday + 1; let d2 = vday + 1; while (hash(d2, w.seed | 0, 97) % WG_VISIT_ONE) d2++; WGS.day = d2; look(); res.next = [wgFrogGift(), wgUse(S.tx, S.ty), st.frogv];
  const A = WG_ACH.find(a => a[0] === 'frogv')[3]; res.ach = [A({ st: { frogv: 3 }, seen: {} }), A({ st: { frogv: 2 }, seen: {} })];
  res.tip = wgTipLines({ id: 'mailbox', n: 1 }).includes('THE FROG DROPS BY NOW AND THEN'); return res; })()`);
ok(r.told && r.once, 'it says when it is visiting, once: ' + JSON.stringify([r.told, r.once]));
ok(r.use && r.gift && r.say && r.heart0 && !r.heart1, 'USE on it talks and gives a gift, the heart goes: ' + JSON.stringify(r));
ok(r.again.join() === 'true,true,true,1' && r.next.join() === 'true,true,2', 'one gift a visit, a new word each time, a gift again on the next visit: ' + JSON.stringify([r.again, r.next]));
ok(r.ach.join() === 'true,false' && r.tip, 'GOOD NEIGHBOURS for three; the mailbox says so: ' + JSON.stringify([r.ach, r.tip]));
// drawn: the frog and the heart while the gift waits, the bubble over the dark
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 1, y - 1, O_ID.mailbox); delete w.meta.frogv; const S = look(); const D = ctx.drawImage.bind(ctx); let heart = 0; ctx.drawImage = function (img) { if (img === WGA.cache.frogv_heart) heart++; return D(...arguments); };
  try { drawWG(); } finally { ctx.drawImage = D; } const res = [heart]; WGFV.say = { s: WG_FROG_TALK[0], t0: WGS.t }; const T = wtext; let said = 0; wtext = function (s) { if (s === WG_FROG_TALK[0]) said++; return T(...arguments); }; try { drawWG(); } finally { wtext = T; } res.push(said);
  WGS.t += WG_VISIT_SAY + 1; drawWG(); res.push(WGFV.say === null); return res; })()`);
ok(r.join() === '1,1,true', 'the heart while the gift waits, the word in a bubble, gone after a while: ' + JSON.stringify(r));
const EN = ['GOOD NEIGHBOURS', 'GREET THE FROG ON THREE VISITS', 'THE FROG IS VISITING!', 'A LITTLE GIFT FOR YOU', 'THE FROG DROPS BY NOW AND THEN', 'JUST PASSING BY!', 'WHAT A LOVELY HOME!', 'I CAME TO SAY HELLO.', 'DID YOU GET MY LETTER?', 'THE POND SAYS HI.', 'TEA LATER? MY TREAT.', 'I LOVE A GOOD WALK.', 'YOUR FLOWERS LOOK HAPPY.'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a cottage garden, the frog beside the mailbox saying hello, the heart over it
await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 1, y - 2, O_ID.mailbox); for (const [i, j, k] of [[-3, -3, 'oak'], [5, -4, 'birch'], [-4, 2, 'pot_r'], [4, 1, 'pot_y'], [-1, -2, 'pot_p']]) if (O_ID[k]) wgSetObj(w, 'o', x + i, y + j, O_ID[k]);
  delete w.meta.frogv; const S = look(); WGFV.say = { s: WG_FROG_TALK[0], t0: WGS.t + 30 }; WGFV.say.t0 = WGS.t; window._fv = setInterval(() => { WGS.clock = 0.5; if (WGFV.say) WGFV.say.t0 = WGS.t; }, 50); WGS.cam.x = p.x + 8; WGS.cam.y = p.y - 16; WGS.toast = null; })(); 0`);
await sleep(400); console.log('visit', await g.shot('wg_visit.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'VISIT OK' : 'VISIT FAIL'); g.close(); process.exit(pass ? 0 : 1);
