// Wildgrove's jigsaw puzzle table: from a bench; each USE fits a piece (the tile's meta), drawn in the picture's own
// shuffled order; whole after sixteen, counted in stats.puzzles; USE again starts the next picture; PIECE BY PIECE for
// three; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PUZZLE' }, seed: { v: '280' }, look: { skin: 2, hair: 0, shirt: 7 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const DI = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, ...[].slice.call(arguments, 1)]); return DI(...arguments); }; try { fn(); } finally { ctx.drawImage = DI; } return L; };`;
let r = await g.ev(`(() => { ${setup} return { at: (RECIPES.find(q => q.out === 'puzzle') || {}).at, icon: !!wgIcon('puzzle') && wgIcon('puzzle').width === 16, tip: wgTipLines({ id: 'puzzle', n: 1 }).includes('USE IT TO FIT A PIECE'),
  orders: [0, 1, 2, 3, 4].map(k => wgPuzOrder(k)).map(o => o.slice().sort((a, b) => a - b).join() === [...Array(16).keys()].join()), differ: wgPuzOrder(0).join() !== wgPuzOrder(1).join() }; })()`);
ok(r.at === 'bench' && r.icon && r.tip && r.orders.every(Boolean) && r.differ, 'a puzzle table from a bench; each picture its own shuffled order of all sixteen pieces: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y, O_ID.puzzle); st.puzzles = 0; const res = {}; const pieces = () => imgs(() => wgDrawObj(O_ID.puzzle, x + 2, y, 100, 100)).filter(q => q.length === 9).length;
  res.none = pieces(); for (let i = 0; i < 5; i++) wgUse(x + 2, y); res.five = [wgMetaAt(w, 'o', x + 2, y), pieces()];
  for (let i = 5; i < 16; i++) wgUse(x + 2, y); res.whole = [wgMetaAt(w, 'o', x + 2, y), pieces(), st.puzzles, WGS.toast && WGS.toast.msg];
  wgUse(x + 2, y); res.next = [wgMetaAt(w, 'o', x + 2, y), WGS.toast.msg, st.puzzles]; for (let k = 0; k < 4; k++) for (let i = 0; i < 17; i++) wgUse(x + 2, y); res.loop = [wgMetaAt(w, 'o', x + 2, y) >> 5, st.puzzles];
  const A = WG_ACH.find(a => a[0] === 'puzzle')[3]; res.ach = [A({ st: { puzzles: 3 }, seen: {} }), A({ st: { puzzles: 2 }, seen: {} })]; return res; })()`);
ok(r.none === 0 && r.five.join() === '5,5' && r.whole.join() === '16,16,1,THE PICTURE IS WHOLE!', 'each USE fits a piece; whole after sixteen: ' + JSON.stringify([r.none, r.five, r.whole]));
ok(r.next.join() === '32,A NEW PUZZLE,1' && r.loop.join() === '0,5' && r.ach.join() === 'true,false', 'USE again starts the next picture, round the five; PIECE BY PIECE for three: ' + JSON.stringify([r.next, r.loop, r.ach]));
const EN = ['PUZZLE TABLE', 'PIECE BY PIECE', 'FINISH THREE JIGSAW PUZZLES', 'A NEW PUZZLE', 'THE PICTURE IS WHOLE!', 'USE IT TO FIT A PIECE'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: five tables, each picture at a different stage, the hero beside them
await g.ev(`(() => { ${setup} [[0, 16], [1, 11], [2, 16], [3, 6], [4, 16]].forEach(([k, n], i) => wgSetObj(w, 'o', x - 4 + i * 2, y - 2, O_ID.puzzle, k * 32 + n)); WGS.inv[0] = { id: 'puzzle', n: 1 }; })(); 0`);
await sleep(200); console.log('puzzle', await g.shot('wg_puzzle.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PUZZLE OK' : 'PUZZLE FAIL'); g.close(); process.exit(pass ? 0 : 1);
