// Wildgrove's daily gifts: a crab pot on water only and a mushroom log on land, made at a bench and by hand; a new one
// waits a day, then USE empties it once a day (a catch, brown mushrooms), the tile's meta keeping when, a tile from a
// friend kept as it comes; the buoy's flag and the caps show while something waits; POT LUCK and MUSHROOM FARMER;
// Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'DAILY' }, seed: { v: '274' }, look: { skin: 1, hair: 2, shirt: 6 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const count = (id) => WGS.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  const DI = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, arguments[1], arguments[2]]); return DI(...arguments); }; try { fn(); } finally { ctx.drawImage = DI; } return L; };`;
let r = await g.ev(`(() => { ${setup} wgSetGround(w, 'o', x + 2, y, G_ID.shallow); const rec = (id) => (RECIPES.find(q => q.out === id) || {}).at;
  return { at: [rec('crab_pot'), rec('mush_log')], icons: !!wgIcon('crab_pot') && !!wgIcon('mush_log'), place: [wgCanPlaceAt(x + 2, y, WGI.crab_pot), wgCanPlaceAt(x + 3, y, WGI.crab_pot), wgCanPlaceAt(x + 3, y, WGI.mush_log)],
    tips: wgTipLines({ id: 'crab_pot', n: 1 }).includes('SET IT ON WATER') && wgTipLines({ id: 'mush_log', n: 1 }).includes('MUSHROOMS GROW ON IT EVERY DAY') }; })()`);
ok(r.at.join() === 'bench,hand' && r.icons && r.place.join() === 'true,false,true' && r.tips, 'a crab pot from a bench for water only, a mushroom log by hand for land: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetGround(w, 'o', x + 2, y, G_ID.shallow); wgSetObj(w, 'o', x + 2, y, O_ID.crab_pot, 0); wgSetObj(w, 'o', x + 3, y, O_ID.mush_log, 0); st.pots = 0; st.mlogs = 0; const res = {};
  res.fresh = [wgDailyReady(x + 2, y), wgDailyReady(x + 3, y)]; wgUse(x + 2, y); res.wait = WGS.toast && WGS.toast.msg; const n0 = WGS.inv.filter(Boolean).length;
  const art = (tx) => imgs(() => wgDrawObj(wgObjAt(w, 'o', tx, y), tx, y, 100, 100)).map(q => Object.keys(WGA.cache).find(k => WGA.cache[k] === q[0])).filter(Boolean);
  res.artBefore = art(x + 2).concat(art(x + 3)); WGS.day = 10; res.next = [wgDailyReady(x + 2, y), wgDailyReady(x + 3, y)]; res.artReady = art(x + 2).concat(art(x + 3));
  wgUse(x + 2, y); res.pot = [WGS.inv.filter(Boolean).length > n0, st.pots, wgDailyReady(x + 2, y)]; wgUse(x + 3, y); res.log = [count('mush_b') >= 2, st.mlogs, wgDailyReady(x + 3, y)];
  wgUse(x + 2, y); res.again = [st.pots, WGS.toast.msg];
  WGN.applying = true; wgSetObj(w, 'o', x + 4, y, O_ID.mush_log, 0); WGN.applying = false; res.friend = wgMetaAt(w, 'o', x + 4, y);
  const A = (id, n) => WG_ACH.find(a => a[0] === id)[3]({ st: { pots: n, mlogs: n }, seen: {} }); res.ach = [A('potluck', 10), A('potluck', 9), A('mushlog', 5), A('mushlog', 4)]; return res; })()`);
ok(r.fresh.join() === 'false,false' && r.wait === 'NOTHING YET. TRY TOMORROW' && r.next.join() === 'true,true', 'a new one waits a day: ' + JSON.stringify([r.fresh, r.wait, r.next]));
ok(r.pot[0] && r.pot[1] === 1 && !r.pot[2] && r.log[0] && r.log[1] === 1 && !r.log[2] && r.again[0] === 1, 'USE empties it once a day: ' + JSON.stringify([r.pot, r.log, r.again]));
ok(r.artBefore.join() === 'daily_cage,daily_buoy0,daily_log0' && r.artReady.join() === 'daily_cage,daily_buoy1,daily_log1' && r.friend === 0, 'the flag and the caps show while something waits; a tile from a friend is kept as it comes: ' + JSON.stringify([r.artBefore, r.artReady, r.friend]));
ok(r.ach.join() === 'true,false,true,false', 'POT LUCK at ten, MUSHROOM FARMER at five: ' + JSON.stringify(r.ach));
const EN = ['CRAB POT', 'MUSHROOM LOG', 'NOTHING YET. TRY TOMORROW', 'NO MUSHROOMS YET. TRY TOMORROW', 'SET IT ON WATER', 'SOMETHING NEW IN IT EVERY DAY', 'MUSHROOMS GROW ON IT EVERY DAY', 'POT LUCK', 'EMPTY A CRAB POT TEN TIMES', 'MUSHROOM FARMER', 'PICK A MUSHROOM LOG FIVE TIMES'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: crab pots on a pond (one with its flag up), mushroom logs under the trees
await g.ev(`(() => { ${setup} for (let j = -4; j <= 4; j++) for (let i = 1; i <= 10; i++) wgSetGround(w, 'o', x + i, y + j, Math.abs(j) < 3 && i > 2 && i < 9 ? G_ID.deep : G_ID.shallow);
  wgSetObj(w, 'o', x + 4, y - 1, O_ID.crab_pot, 0); wgSetObj(w, 'o', x + 7, y + 1, O_ID.crab_pot, wgDailyMark()); wgSetObj(w, 'o', x + 5, y + 2, O_ID.crab_pot, 0);
  for (const [i, j, o] of [[-6, -3, 'oak'], [-4, -4, 'oak'], [-8, 1, 'birch']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]); WGN.applying = true; wgSetObj(w, 'o', x - 5, y - 2, O_ID.mush_log, 0); WGN.applying = false; wgSetObj(w, 'o', x - 3, y + 1, O_ID.mush_log, 0);
  p.x = (x - 1) * 16 + 8; WGS.cam.x = p.x + 16; p.face = 'r'; })(); 0`);
await sleep(200); console.log('daily', await g.shot('wg_daily.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'DAILY OK' : 'DAILY FAIL'); g.close(); process.exit(pass ? 0 : 1);
