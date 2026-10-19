// Wildgrove's fairy rings: a ring stands only where the seed says, on grass with its middle clear and trees about;
// its mushrooms are drawn on the ground, its lights dance only at night; standing in its middle at night brings a gift
// once a night (not by day, not off the middle, again the next night); FAIRY RING; Hungarian; a look at night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'FAIRY' }, seed: { v: '79' }, look: { skin: 1, hair: 3, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, x0 = Math.floor(p.x / 16), y0 = Math.floor(p.y / 16), s = (w.seed | 0) * 53 + 7177; let c = null, wild = 0;
  for (let d = 4; d < 200 && !c; d++) for (let j = -d; j <= d && !c; j++) for (let i = -d; i <= d; i++) if ((Math.abs(i) === d || Math.abs(j) === d) && hash(x0 + i, y0 + j, s) % 900 === 0) { c = [x0 + i, y0 + j]; break; }
  for (let j = -150; j < 150; j++) for (let i = -150; i < 150; i++) if (wgFairyAt(x0 + i, y0 + j)) wild++;
  const [x, y] = c, set = () => { for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); } wgSetObj(w, 'o', x - 3, y - 3, O_ID.oak); wgSetObj(w, 'o', x + 3, y - 3, O_ID.oak); };
  WGS.dim = 'o'; set(); const res = [wgFairyAt(x, y), wgFairyAt(x + 1, y)];
  wgSetObj(w, 'o', x + 3, y - 3, 0); res.push(wgFairyAt(x, y)); set(); wgSetObj(w, 'o', x + 1, y + 1, O_ID.flower_r); res.push(wgFairyAt(x, y)); wgSetObj(w, 'o', x + 1, y + 1, O_ID.fallen_log); res.push(wgFairyAt(x, y)); set(); wgSetGround(w, 'o', x, y, G_ID.sand); res.push(wgFairyAt(x, y)); set();
  window._fr = c; res.push(wild); return res; })()`);
ok(r[0] === true && r[1] === false && r[2] === false && r[3] === true && r[4] === false && r[5] === false, 'only where the seed says, on grass, nothing solid in its middle (a flower may grow there), trees about: ' + JSON.stringify(r));
ok(r[6] >= 4 && r[6] <= 16, 'a few in a 300x300 stretch of the wild: ' + r[6]);
r = await g.ev(`(() => { const w = WGS.world, [x, y] = _fr, D = ctx.drawImage.bind(ctx), R = rect, res = {}; WGS.scr = 'play'; w.meta.hintDone = 1;
  WGS.cam.x = x * 16 + 8; WGS.cam.y = y * 16 + 8; const cx0 = WGS.cam.x - 192, cy0 = WGS.cam.y - 108;
  const sh = new Set([0, 1, 2].map(wgFairyShroom)); let n = 0, l = 0;
  ctx.drawImage = function (img) { if (sh.has(img)) n++; return D(...arguments); };
  try { const C = WG.CS, cx = Math.floor(x / C), cy = Math.floor(y / C); wgChunkUpkeep(w, 'o', cx - 1, cy - 1, cx + 1, cy + 1); } finally { ctx.drawImage = D; } res.shrooms = n; res.seen = JSON.stringify(WGFR.seen);
  rect = function (a, b, c, d, k) { if (WG_FAIRY_COLS.includes(k) || k === 'w') l++; return R(...arguments); };
  try { WGS.clock = 0.9; l = 0; WGR.lights.length = 0; wgDrawLight(cx0, cy0); res.night = l; WGS.clock = 0.45; l = 0; wgDrawLight(cx0, cy0); res.day = l; } finally { rect = R; } return res; })()`);
ok(r.shrooms === 11 && r.seen === JSON.stringify([await g.ev('_fr')]), 'eleven mushrooms in a ring on the ground: ' + JSON.stringify(r));
ok(r.night >= 18 && r.day === 0, 'its lights dance at night only: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, m = w.meta, p = WGS.p, [x, y] = _fr, res = [], seen = new Set(), items = () => WGS.inv.reduce((n, s) => n + (s ? s.n : 0), 0);
  const step = (clock, px, py) => { p.x = px; p.y = py; WGS.clock = clock; updateWG(1 / 60); if (WGS.toast) seen.add(WGS.toast.msg); };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; delete m.fairy; m.ach = {}; m.stats = { kills: 0, far: 0 }; WGS.day = 12; WGS.toast = null; WGS.mobs = [];
  step(0.45, x * 16 + 8, y * 16 + 8); res.push(items(), seen.size);
  step(0.9, x * 16 + 8 + 20, y * 16 + 8); res.push(items());
  step(0.9, x * 16 + 8, y * 16 + 9); res.push(items() > 0, seen.has('THE FAIRIES DANCE AROUND YOU'), m.fairy === 12, !!m.stats.fairy); const n1 = items();
  step(0.95, x * 16 + 9, y * 16 + 8); WGS.day = 13; step(0.1, x * 16 + 8, y * 16 + 8); res.push(items() === n1); // still the same night, the next morning before dawn
  WGS.day = 13; step(0.9, x * 16 + 8, y * 16 + 8); res.push(items() > n1, m.fairy === 13); wgAchTick(); res.push(!!m.ach.fairy); return res; })()`);
ok(r[0] === 0 && r[1] === 0 && r[2] === 0, 'nothing by day, nothing off the middle: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] && r[4] && r[5] && r[6] && r[7], 'in its middle at night: a gift, told, once that night: ' + JSON.stringify(r.slice(3, 8)));
ok(r[8] && r[9] && r[10], 'again the next night; FAIRY RING: ' + JSON.stringify(r.slice(8)));
const EN = ['FAIRY RING', 'STAND IN A FAIRY RING AT NIGHT', 'THE FAIRIES DANCE AROUND YOU'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the ring in the woods at night
await g.ev(`(() => { const w = WGS.world, p = WGS.p, [x, y] = _fr;
  for (const [i, j] of [[-4, -1], [-2, -4], [4, -2], [5, 1], [-5, 3], [2, 4], [-1, -5]]) if (!wgObjAt(w, 'o', x + i, y + j)) wgSetObj(w, 'o', x + i, y + j, O_ID.oak);
  WGS.day = 14; WGS.clock = 0.92; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; p.x = x * 16 + 8 + 44; p.y = y * 16 + 30; p.face = 'l'; Input.mx = 4; Input.my = 4;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'torch', n: 1 }; WGS.sel = 0; })(); 0`);
await sleep(300); console.log('fairy', await g.shot('wg_fairy.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FAIRY OK' : 'FAIRY FAIL'); g.close(); process.exit(pass ? 0 : 1);
