// Wildgrove's market stall: from a bench; today's three trades are different, the same all day and new on another;
// USE opens the market screen, which closes when the stall is gone; a trade swaps from the backpack once a day at each
// stall (the tile's meta), not without enough; MARKET DAY for ten; Hungarian; a look at the screen.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'MARKET' }, seed: { v: '281' }, look: { skin: 3, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; WGS.mkt = null; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const count = (id) => WGS.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  const give = (d) => { let i = 10; for (const k in d[0]) WGS.inv[i++] = { id: k, n: d[0][k] }; };`;
let r = await g.ev(`(() => { ${setup} const res = { at: (RECIPES.find(q => q.out === 'market') || {}).at, icon: !!wgIcon('market') && wgIcon('market').width === 16, tip: wgTipLines({ id: 'market', n: 1 }).includes('THREE NEW TRADES EVERY DAY') };
  res.items = WG_DEALS.every(d => WGI[d[1][0]] && wgIcon(d[1][0]) && Object.keys(d[0]).every(k => WGI[k] && wgIcon(k)));
  const day = (d, c) => { WGS.day = d; WGS.clock = c; return wgMarketDeals().map(q => WG_DEALS.indexOf(q)).join(); };
  const a = day(9, 0.3), b = day(9, 0.9); res.three = a.split(',').length === 3 && new Set(a.split(',')).size === 3; res.sameDay = a === b; let other = 0; for (let d = 10; d < 20; d++) if (day(d, 0.5) !== a) other++; res.other = other; return res; })()`);
ok(r.at === 'bench' && r.icon && r.tip && r.items, 'a market stall from a bench; every trade has its items: ' + JSON.stringify(r));
ok(r.three && r.sameDay && r.other >= 8, 'three different trades, the same all day, new on other days: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 1, y, O_ID.market); st.trades = 0; const res = {}; res.used = wgUse(x + 1, y); res.scr = WGS.scr; drawWG(); res.buttons = WGS.ui.cnt;
  const D = wgMarketDeals(); res.poor = wgMarketTrade(0); give(D[0]); const want = D[0][1]; const had = count(want[0]); res.trade = [wgMarketTrade(0), count(want[0]) - had, Object.keys(D[0][0]).every(k => count(k) === 0), wgMarketDone(wgMetaAt(w, 'o', x + 1, y)), st.trades];
  give(D[0]); res.again = wgMarketTrade(0); give(D[1]); res.second = [wgMarketTrade(1), wgMarketDone(wgMetaAt(w, 'o', x + 1, y))];
  WGS.day = 10; const E = wgMarketDeals(); res.newDay = wgMarketDone(wgMetaAt(w, 'o', x + 1, y)); for (let i = 10; i < 20; i++) WGS.inv[i] = null; give(E[0]); res.next = wgMarketTrade(0);
  wgSetObj(w, 'o', x + 1, y, 0); updateWG(1 / 60); res.gone = WGS.scr;
  const A = WG_ACH.find(a => a[0] === 'market')[3]; res.ach = [A({ st: { trades: 10 }, seen: {} }), A({ st: { trades: 9 }, seen: {} })]; return res; })()`);
ok(r.used && r.scr === 'market' && r.buttons === 4 && r.gone === 'play', 'USE opens the market screen with three trades and CLOSE; it closes when the stall is gone: ' + JSON.stringify([r.used, r.scr, r.buttons, r.gone]));
ok(!r.poor && r.trade[0] && r.trade[1] > 0 && r.trade[2] && r.trade[3] === 1 && r.trade[4] === 1, 'a trade swaps from the backpack, not without enough: ' + JSON.stringify([r.poor, r.trade]));
ok(!r.again && r.second.join() === 'true,3' && r.newDay === 0 && r.next && r.ach.join() === 'true,false', 'each trade once a day at each stall, all three again the next day; MARKET DAY for ten: ' + JSON.stringify([r.again, r.second, r.newDay, r.next, r.ach]));
const EN = ['MARKET STALL', 'MARKET DAY', 'MAKE TEN TRADES AT A MARKET STALL', 'NEW TRADES EVERY DAY', 'DONE TODAY', 'TRADE', 'NOT ENOUGH', 'THREE NEW TRADES EVERY DAY'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the stall beside the hero and its screen open, one trade made, one ready, one short
await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 1, y - 1, O_ID.market); const D = wgMarketDeals(); wgSetObj(w, 'o', x + 1, y - 1, O_ID.market, wgMarketMark() * 8 + 1); give(D[1]);
  wgUse(x + 1, y - 1); Input.lastAim = 'keys'; WGS.ui.sel = 1; })(); 0`);
await sleep(300); console.log('market', await g.shot('wg_market.png'));
await g.ev(`(() => { WGS.scr = 'play'; WGS.mkt = null; WGS.cam.x = WGS.p.x + 8; })(); 0`); await sleep(200); console.log('stall', await g.shot('wg_market_stall.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'MARKET OK' : 'MARKET FAIL'); g.close(); process.exit(pass ? 0 : 1);
