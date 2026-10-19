// Wildgrove's card table: from a bench, with an icon and a tip; a deal is eight pairs of things from the wild, shuffled;
// a pair stays up, two that differ turn back after a moment and nothing else turns meanwhile; a game won counts, its best
// kept, SHARP MEMORY for a sharp one; USE opens the table with sixteen cards and two buttons, keeps a game going and deals
// anew after a win; the arrows walk the grid and down to the buttons; it closes when the table is gone; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PAIRS' }, seed: { v: '856' }, look: { skin: 0, hair: 2, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; WGS.pairsAt = null; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 5; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const pairOf = (i) => WGPR.deck.findIndex((c, j) => j !== i && c.id === WGPR.deck[i].id), oddOf = (i) => WGPR.deck.findIndex((c, j) => j !== i && c.id !== WGPR.deck[i].id && !c.got);`;
let r = await g.ev(`(() => { const d = wgIcon('card_table').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  return [n, (RECIPES.find(q => q.out === 'card_table') || {}).at, wgTipLines({ id: 'card_table', n: 1 }).includes('A GAME OF PAIRS')]; })()`);
ok(r[0] >= 80 && r[1] === 'bench' && r[2], 'a card table from a bench, with an icon and a tip: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; wgPairsDeal(); const ids = WGPR.deck.map(c => c.id), n = {}; for (const k of ids) n[k] = (n[k] | 0) + 1;
  res.deal = [ids.length, Object.keys(n).length, Object.values(n).every(v => v === 2), ids.every(k => WGI[k] && wgIcon(k))];
  const orders = new Set(); for (let k = 0; k < 6; k++) { wgPairsDeal(); orders.add(WGPR.deck.map(c => c.id).join()); } res.shuffled = orders.size;
  wgPairsDeal(); const a = 0, b = pairOf(0); res.pair = [wgPairsPick(a), wgPairsPick(a), wgPairsPick(b), WGPR.deck[a].got && WGPR.deck[b].got, WGPR.tries, WGPR.up.length, wgPairsPick(a)];
  const c = WGPR.deck.findIndex(q => !q.got), d = oddOf(c), e = WGPR.deck.findIndex((q, j) => !q.got && j !== c && j !== d);
  res.odd = [wgPairsPick(c), wgPairsPick(d), WGPR.tries, !!WGPR.hold, wgPairsPick(e), WGPR.up.length];
  WGS.t = WGPR.hold - 0.1; updateWG(1 / 60); const still = WGPR.up.length; WGS.t = WGPR.hold + 0.01; updateWG(1 / 60); res.back = [still, WGPR.up.length, WGPR.hold, WGPR.deck[c].got];
  return res; })()`);
ok(r.deal.join() === '16,8,true,true' && r.shuffled >= 5, 'a deal is eight pairs of things from the wild, shuffled: ' + JSON.stringify([r.deal, r.shuffled]));
ok(r.pair.join() === 'true,false,true,true,1,0,false', 'a pair stays face up: ' + JSON.stringify(r.pair));
ok(r.odd.join() === 'true,true,2,true,false,2' && r.back.join() === '2,0,0,false', 'two that differ turn back after a moment, nothing else turns meanwhile: ' + JSON.stringify([r.odd, r.back]));
r = await g.ev(`(() => { ${setup} const res = {}; st.pairs = 0; st.pairsBest = 0; wgPairsDeal(); WGS.toast = null;
  for (let i = 0; i < 16; i++) if (!WGPR.deck[i].got) { wgPairsPick(i); wgPairsPick(pairOf(i)); }
  res.win = [WGPR.tries, st.pairs, st.pairsBest, !!WGPR.won, !!WGS.toast];
  wgPairsDeal(); for (let i = 0; i < 16; i++) if (!WGPR.deck[i].got) { const o = oddOf(i); if (o >= 0) { wgPairsPick(i); wgPairsPick(o); WGS.t = WGPR.hold + 0.01; updateWG(1 / 60); } wgPairsPick(i); wgPairsPick(pairOf(i)); }
  res.slow = [WGPR.tries, st.pairs, st.pairsBest];
  const A = WG_ACH.find(a => a[0] === 'pairs')[3]; res.ach = [A({ st: { pairsBest: 14 }, seen: {} }), A({ st: { pairsBest: 15 }, seen: {} }), A({ st: {}, seen: {} })]; return res; })()`);
ok(r.win.join() === '8,1,8,true,true' && r.slow[1] === 2 && r.slow[2] === 8 && r.slow[0] > 8, 'a game won counts and its best is kept: ' + JSON.stringify([r.win, r.slow]));
ok(r.ach.join() === 'true,false,false', 'SHARP MEMORY for fourteen tries or fewer: ' + JSON.stringify(r.ach));
r = await g.ev(`(() => { ${setup} const res = {}; wgSetObj(w, 'o', x + 1, y, O_ID.card_table); WGPR.deck = null; res.use = wgUse(x + 1, y); res.scr = WGS.scr; drawWG(); res.buttons = WGS.ui.cnt;
  wgPairsPick(0); const keep = WGPR.deck.map(c => c.id).join(); WGS.scr = 'play'; wgUse(x + 1, y); res.kept = WGPR.deck.map(c => c.id).join() === keep && WGPR.up.includes(0);
  WGPR.won = WGS.t; wgUse(x + 1, y); res.fresh = !WGPR.won && WGPR.up.length === 0;
  const go = (s, k) => { Input.hit[k] = 1; try { return wgPairsMove(s); } finally { delete Input.hit[k]; } };
  res.walk = [go(5, 'ArrowRight'), go(7, 'ArrowRight'), go(4, 'ArrowLeft'), go(5, 'ArrowDown'), go(1, 'ArrowUp'), go(13, 'ArrowDown'), go(14, 'ArrowDown'), go(16, 'ArrowRight'), go(17, 'ArrowUp'), go(16, 'ArrowUp')].join();
  wgSetObj(w, 'o', x + 1, y, 0); updateWG(1 / 60); res.gone = WGS.scr; return res; })()`);
ok(r.use && r.scr === 'pairs' && r.buttons === 18 && r.kept && r.fresh, 'USE opens the table: sixteen cards and two buttons; a game keeps, a new deal after a win: ' + JSON.stringify(r));
ok(r.walk === '6,7,4,9,1,16,17,17,15,12' && r.gone === 'play', 'the arrows walk the grid and down to the buttons; it closes when the table is gone: ' + JSON.stringify([r.walk, r.gone]));
const EN = ['CARD TABLE', 'SHARP MEMORY', 'FIND ALL PAIRS IN 14 TRIES OR FEWER', 'ALL PAIRS IN 9 TRIES', 'TRIES: 3', 'NEW GAME', 'A GAME OF PAIRS'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a game under way, three pairs found and one card turned up, a card picked
await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 1, y - 1, O_ID.card_table); WGPR.deck = null; wgUse(x + 1, y - 1); let n = 0;
  for (let i = 0; i < 16 && n < 3; i++) if (!WGPR.deck[i].got) { wgPairsPick(i); wgPairsPick(pairOf(i)); n++; } const f = WGPR.deck.findIndex(c => !c.got); wgPairsPick(f); WGPR.flip[f] = -9;
  Input.lastAim = 'keys'; WGS.ui.sel = 10; window._pr = setInterval(() => { WGS.clock = 0.45; }, 50); })(); 0`);
await sleep(300); console.log('game', await g.shot('wg_pairs.png'));
await g.ev(`(() => { WGS.scr = 'play'; WGS.pairsAt = null; })(); 0`); await sleep(200); console.log('table', await g.shot('wg_pairs_table.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PAIRS OK' : 'PAIRS FAIL'); g.close(); process.exit(pass ? 0 : 1);
