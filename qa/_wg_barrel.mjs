// Wildgrove's rain barrel: an object and a recipe; it fills a step at a time in the rain up to WG_BARREL_FULL (not in
// dry weather, not on a guest's screen); USE: waiting for rain when empty, a word for other hands, an empty bucket comes
// away full and lowers it (RAINY DAY), a full bucket does not; the water drawn by its level, rippled in the rain; tips,
// Hungarian; a look in the rain.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'RAIN' }, seed: { v: '63' }, look: { skin: 0, hair: 3, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'rain_barrel'); return [!!(WGA.obj.rain_barrel || [])[0], rc && rc.at]; })()`);
ok(r[0] && r[1] === 'bench', 'an object and a recipe: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -5; j < 6; j++) for (let i = -8; i < 9; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { barrel: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 10; window._rb = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; wgSetObj(w, d, x + 2, y, O_ID.rain_barrel);
  const R = Math.random, m = () => wgMetaAt(w, d, x + 2, y), step = () => { WGRB.t = 0; updateWG(1 / 60); }, res = [];
  try {
    Math.random = () => 0.01; WGS.weather = null; WGS.wk = null; WGS.wxT = 9999; step(); step(); res.push(m());
    WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6, storm: false }; WGS.wk = 'rain'; step(); res.push(m()); step(); step(); step(); step(); res.push(m());
    wgSetObj(w, d, x + 2, y, O_ID.rain_barrel, 0); WGN.role = 'client'; step(); res.push(m());
  } finally { Math.random = R; WGN.role = null; WGS.weather = null; WGS.wk = null; } return res; })()`);
ok(r.join() === '0,1,4,0', 'it fills a step at a time in the rain up to full, not when dry, not on a guest: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _rb, w = WGS.world, d = WGS.dim, m = () => wgMetaAt(w, d, x + 2, y), say = () => { WGS.toast = null; wgUse(x + 2, y); return WGS.toast && WGS.toast.msg; }, res = [];
  res.push(say()); wgSetObj(w, d, x + 2, y, O_ID.rain_barrel, 4); res.push(say()); WGS.inv[0] = { id: 'wood', n: 3 }; wgSetObj(w, d, x + 2, y, O_ID.rain_barrel, 2); res.push(say());
  WGS.inv[0] = { id: 'bucket_water', n: 1 }; res.push(say(), m(), WGS.inv[0].id);
  WGS.inv[0] = { id: 'bucket', n: 2 }; wgUse(x + 2, y); res.push(m(), WGS.inv[0] && WGS.inv[0].id, WGS.inv[0] && WGS.inv[0].n, WGS.inv.some(s => s && s.id === 'bucket_water'), !!w.meta.stats.barrel);
  wgUse(x + 2, y); res.push(m(), say()); return res; })()`);
ok(r[0] === 'IT IS WAITING FOR RAIN' && r[1] === 'IT IS FULL OF RAIN' && r[2] === 'A BUCKET CAN FILL HERE', 'USE: waiting for rain, full, a word for other hands: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] === 'A BUCKET CAN FILL HERE' && r[4] === 2 && r[5] === 'bucket_water', 'a full bucket takes nothing: ' + JSON.stringify(r.slice(3, 6)));
ok(r[6] === 1 && r[7] === 'bucket' && r[8] === 1 && r[9] && r[10] && r[11] === 0 && r[12] === 'IT IS WAITING FOR RAIN', 'an empty bucket comes away full and lowers it, RAINY DAY: ' + JSON.stringify(r.slice(6)));
r = await g.ev(`(() => { const { x, y } = _rb, w = WGS.world, d = WGS.dim, F = ctx.fillRect.bind(ctx), water = new Set(['b', 'B', 'c', 'C'].map(k => PAL[k])); let n = 0;
  ctx.fillRect = function () { if (water.has(ctx.fillStyle)) n++; return F(...arguments); };
  const draw = (m) => { wgSetObj(w, d, x + 2, y, O_ID.rain_barrel, m); n = 0; wgDrawObj(O_ID.rain_barrel, x + 2, y, 100, 100); return n; };
  try { const dry = [0, 1, 2, 3, 4].map(draw); WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6, storm: false }; let wet = 0; for (let k = 0; k < 9; k++) { WGS.t += 0.34; wet = Math.max(wet, draw(3)); } return [dry, wet]; }
  finally { ctx.fillRect = F; WGS.weather = null; } })()`);
ok(r[0][0] === 0 && r[0][1] === 1 && r[0][2] === 2 && r[0][3] === 3 && r[0][4] === 4 && r[1] === 4, 'the water drawn by its level, a glint when full, rings in the rain: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; wgAchTick(); return [!!m.ach.barrel, wgTipLines({ id: 'rain_barrel', n: 1 })]; })()`);
ok(r[0] && r[1].includes('IT GATHERS RAIN FOR A BUCKET'), 'RAINY DAY, tips: ' + JSON.stringify(r));
const EN = ['RAIN BARREL', 'RAINY DAY', 'FILL A BUCKET FROM A RAIN BARREL', 'IT IS WAITING FOR RAIN', 'IT IS FULL OF RAIN', 'A BUCKET CAN FILL HERE', 'IT GATHERS RAIN FOR A BUCKET'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: barrels from empty to full in the rain
await g.ev(`(() => { const { x, y } = _rb, w = WGS.world, d = WGS.dim, p = WGS.p; for (let i = 0; i < 5; i++) wgSetObj(w, d, x - 3 + i * 2, y - 2, O_ID.rain_barrel, i);
  p.x = x * 16 + 8; p.y = y * 16 + 10; p.face = 'r'; WGS.clock = 0.4; WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6, storm: false }; WGS.wk = 'rain'; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('barrel', await g.shot('wg_barrel.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BARREL OK' : 'BARREL FAIL'); g.close(); process.exit(pass ? 0 : 1);
