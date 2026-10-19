// Wildgrove's candles: beeswax and string make two candles at a bench, red and blue with a petal; a candelabra of three
// at an anvil; small lights set out; their flames flicker from each tile's own hash, one on a candle and three on a
// candelabra, right over the wicks; moths come to a candelabra; making one lights CANDLELIGHT; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'CANDLES' }, seed: { v: '89' }, look: { skin: 1, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.weather = null; WGS.wxT = 9999;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0;
  const R = rect; const flames = (id, tx, ty) => { const F = []; rect = function (a, b, c, e, k) { if (k === 'o' && c === 1 && e === 1) F.push([a, b]); return R(...arguments); }; try { wgDrawObj(O_ID[id], tx, ty, 100, 100); } finally { rect = R; } return F; };`;
let r = await g.ev(`(() => { const res = WG_CANDLES.map(([id, , dye]) => { const R = RECIPES.find(q => q.out === id); return [R.at, R.n, R.in.honey, R.in.string, dye ? R.in[dye] : 0, OBJ[O_ID[id]].kind, OBJ[O_ID[id]].light, WGI[id].kind, !!wgIcon(id)]; });
  const C = RECIPES.find(q => q.out === 'candelabra'); res.push([C.at, C.in.candle, OBJ[O_ID.candelabra].light, !!wgIcon('candelabra'), WG_MOTH_LAMPS.includes('candelabra')]); return res; })()`);
ok(r.slice(0, 3).every((a, i) => a[0] === 'bench' && a[1] === 2 && a[2] === 1 && a[3] === 1 && (i ? a[4] === 1 : true) && a[5] === 'light' && a[6] > 30 && a[7] === 'place' && a[8]), 'beeswax and string make two candles at a bench, red and blue with a petal; small lights: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3][0] === 'anvil' && r[3][1] === 3 && r[3][2] > r[0][6] && r[3][3] && r[3][4], 'a candelabra of three at an anvil, a brighter light that moths come to: ' + JSON.stringify(r[3]));
r = await g.ev(`(() => { ${setup} const one = flames('candle', x + 1, y), three = flames('candelabra', x + 2, y); const sp = WGA.obj.candle[0], sq = WGA.obj.candelabra[0];
  const wick = [100 + sp.ox + 3, 100 + sp.oy + 2], wicks = [[3, 5], [8, 2], [13, 5]].map(([a, b]) => [100 + sq.ox + a, 100 + sq.oy + b]);
  const t0 = WGS.t, tips = new Set(); for (let i = 0; i < 120; i++) { WGS.t = t0 + i / 30; const D = ctx.drawImage, F2 = []; rect = function (a, b, c, e, k) { if (k === 'Y') F2.push(a + ',' + b); return R(...arguments); }; try { wgDrawObj(O_ID.candle, x + 1, y, 100, 100); } finally { rect = R; } tips.add(F2.join('|')); } WGS.t = t0;
  return [one, wick, three, wicks, tips.size]; })()`);
ok(r[0].length === 1 && r[0][0][0] === r[1][0] && r[0][0][1] === r[1][1], 'one flame on a candle, right over its wick: ' + JSON.stringify(r.slice(0, 2)));
ok(r[2].length === 3 && r[2].every((f, i) => f[0] === r[3][i][0] && f[1] === r[3][i][1]), 'three on a candelabra, over theirs: ' + JSON.stringify(r.slice(2, 4)));
ok(r[4] >= 3, 'the flames flicker: ' + r[4]);
r = await g.ev(`(() => { ${setup} const D = WGS.t, res = []; const t0 = WGS.t; const a = []; for (const tx of [3, 4]) { const F = []; rect = function (q, b, c, e, k) { if (k === 'Y') F.push(q + ',' + b); return R(...arguments); }; try { wgDrawObj(O_ID.candle, tx, 7, 100, 100); } finally { rect = R; } a.push(F.join()); }
  w.meta.ach = {}; const p0 = p.seen; p.seen = Object.assign({}, p0); wgAchTick(); res.push(!!w.meta.ach.candle); p.seen.candelabra = 1; wgAchTick(); res.push(!!w.meta.ach.candle); p.seen = Object.assign(p0 || {}, p.seen); return [a, res]; })()`);
ok(r[1][0] === false && r[1][1] === true, 'making a candelabra lights CANDLELIGHT: ' + JSON.stringify(r[1]));
const EN = ['WHITE CANDLE', 'RED CANDLE', 'BLUE CANDLE', 'CANDELABRA', 'CANDLELIGHT', 'MAKE A CANDELABRA'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: candles on a wooden floor at night
await g.ev(`(() => { ${setup} for (let i = -4; i <= 4; i++) for (let j = -3; j <= 1; j++) wgSetGround(w, d, x + i, y + j, G_ID.f_wood);
  for (const [i, j, o] of [[-3, -2, 'candelabra'], [-1, -2, 'candle'], [0, -2, 'candle_r'], [1, -2, 'candle_b'], [3, -2, 'candelabra'], [-2, 0, 'candle_r'], [2, 0, 'candle']]) wgSetObj(w, d, x + i, y + j, O_ID[o]);
  WGS.inv[0] = { id: 'candle', n: 6 }; WGS.inv[1] = { id: 'candle_r', n: 4 }; WGS.inv[2] = { id: 'candle_b', n: 4 }; WGS.inv[3] = { id: 'candelabra', n: 1 };
  p.y = y * 16 + 12; p.face = 'u'; WGS.day = 6; WGS.clock = 0.97; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 16; })(); 0`);
await sleep(120); console.log('candles', await g.shot('wg_candles.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'CANDLES OK' : 'CANDLES FAIL'); g.close(); process.exit(pass ? 0 : 1);
