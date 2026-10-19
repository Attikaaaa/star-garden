// Wildgrove's bouquet for the frog: tied by hand from four petals and a fiber; USEd on the visiting frog it is given
// away for two little gifts, once a visit, and the frog holds it while the visit lasts; not to anyone else, and without
// a bouquet the frog just talks; SAY IT WITH FLOWERS; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BOUQUET' }, seed: { v: '623' }, look: { skin: 2, hair: 0, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -12; j < 13; j++) for (let i = -18; i < 19; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.clock = 0.5; wgOpt().amb = 1; WGS.cam.x = p.x; WGS.cam.y = p.y; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0; delete w.meta.frogb; delete w.meta.frogv;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const N = (id) => wgInvCount(WGS.inv, id), total = () => WGS.inv.reduce((a, s) => a + (s ? s.n : 0), 0);
  let vday = 1; while (hash(vday, w.seed | 0, 97) % WG_VISIT_ONE) vday++; WGS.day = vday;
  wgSetObj(w, 'o', x + 3, y - 1, O_ID.mailbox); WGFV.t = 0; updateWG(1 / 60); const S = WGFV.spot;`;
let r = await g.ev(`(() => { ${setup} const res = {}; const R = RECIPES.find(q => q.out === 'bouquet'); res.rec = R && [R.at, Object.keys(R.in).sort().join()];
  res.spot = !!S; st.bouquet = 0; WGS.inv[0] = { id: 'bouquet', n: 2 }; WGFV.say = null;
  res.give = [wgUse(S.tx, S.ty), N('bouquet'), total() - 1, WGFV.say && WGFV.say.s, st.bouquet, wgFrogHasFlowers()];
  WGFV.say = null; const t0 = total(); res.again = [wgUse(S.tx, S.ty), N('bouquet'), WGFV.say && WGFV.say.s !== 'FOR ME? THEY ARE LOVELY!'];
  WGS.day = vday + 1; res.nextDay = wgFrogHasFlowers(); WGS.day = vday;
  WGS.inv[0] = { id: 'bouquet', n: 1 }; WGS.inv[1] = null; delete w.meta.frogb; const n1 = N('bouquet'); wgUse(x - 2, y); res.elsewhere = N('bouquet') === n1;
  const A = WG_ACH.find(a => a[0] === 'bouquet')[3]; res.ach = [A({ st: { bouquet: 1 }, seen: {} }), A({ st: {}, seen: {} })];
  res.tip = wgTipLines({ id: 'bouquet', n: 1 }).includes('THE FROG WOULD LOVE IT'); res.icon = wgIcon('bouquet').width; return res; })()`);
ok(r.rec && r.rec[0] === 'hand' && r.rec[1] === 'fiber,petal_p,petal_r,petal_w,petal_y', 'tied by hand from four petals and a fiber: ' + JSON.stringify(r.rec));
ok(r.spot && r.give[0] && r.give[1] === 1 && r.give[2] >= 2 && r.give[3] === 'FOR ME? THEY ARE LOVELY!' && r.give[4] === 1 && r.give[5], 'given to the visiting frog for two little gifts: ' + JSON.stringify(r.give));
ok(r.again[0] && r.again[1] === 1 && r.again[2] && !r.nextDay && r.elsewhere, 'once a visit, then it just talks; kept when USEd elsewhere: ' + JSON.stringify([r.again, r.nextDay, r.elsewhere]));
ok(r.ach.join() === 'true,false' && r.tip && r.icon === 16, 'SAY IT WITH FLOWERS; tip; icon: ' + JSON.stringify([r.ach, r.tip, r.icon]));
r = await g.ev(`(() => { ${setup} w.meta.frogb = WGS.day; const D = ctx.drawImage.bind(ctx); let n = 0; const A = wgBouquetArt(); ctx.drawImage = function (img) { if (img === A) n++; return D(...arguments); };
  try { wgFrogDraw({ x: S.tx * 16 + 8, y: S.ty * 16 + 13 }, WGS.cam.x - 192, WGS.cam.y - 108); delete w.meta.frogb; wgFrogDraw({ x: S.tx * 16 + 8, y: S.ty * 16 + 13 }, WGS.cam.x - 192, WGS.cam.y - 108); } finally { ctx.drawImage = D; } return n; })()`);
ok(r === 1, 'the frog holds the flowers while the visit lasts: ' + r);
const EN = ['BOUQUET', 'SAY IT WITH FLOWERS', 'GIVE THE FROG A BOUQUET', 'FOR ME? THEY ARE LOVELY!', 'TWO LITTLE GIFTS FOR YOU', 'THE FROG WOULD LOVE IT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { ${setup} WGS.inv[0] = { id: 'bouquet', n: 1 }; p.x = S.tx * 16 - 16 + 8; wgUse(S.tx, S.ty); WGS.cam.x = p.x + 16; WGS.cam.y = p.y; for (const [i, j, k] of [[-4, -3, 'oak'], [6, -3, 'birch'], [1, 2, 'flower_y']]) if (O_ID[k]) wgSetObj(w, 'o', x + i, y + j, O_ID[k]);
  window._bq = setInterval(() => { WGS.clock = 0.5; if (WGFV.say) WGFV.say.t0 = WGS.t - 0.5; }, 30); })(); 0`);
await sleep(400); console.log('bouquet', await g.shot('wg_bouquet.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BOUQUET OK' : 'BOUQUET FAIL'); g.close(); process.exit(pass ? 0 : 1);
