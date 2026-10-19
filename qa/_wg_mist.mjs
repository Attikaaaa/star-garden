// Wildgrove's morning mist: misty mornings come most in autumn and least in summer; thick at dawn, gone by mid-morning
// and at night; it fades in on such a morning (told the first time, MISTY MORNING) and not under weather, with the
// weather effects off, in the afternoon or on a clear morning; drawn as banks that drift with the world's clock, none
// underground; Hungarian; a look at a misty autumn morning.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'MIST' }, seed: { v: '57' }, look: { skin: 1, hair: 1, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const n = [0, 0, 0, 0]; for (let k = 0; k < 60; k++) for (let s = 0; s < 4; s++) for (let i = 0; i < 8; i++) { WGS.day = k * 32 + s * 8 + i; if (wgMistToday()) n[s]++; }
  return [n.map(v => +(v / 480).toFixed(2)), [0.05, 0.2, 0.3, 0.4, 0.7].map(c => +wgMistAt(c).toFixed(2))]; })()`);
ok(r[0][2] > 0.55 && r[0][2] < 0.8 && r[0][1] > 0.12 && r[0][1] < 0.28 && r[0][0] > 0.22 && r[0][0] < 0.45 && r[0][2] > r[0][0] && r[0][0] > r[0][1], 'misty mornings most in autumn, least in summer: ' + JSON.stringify(r[0]));
ok(r[1][0] === 0 && r[1][1] === 1 && r[1][2] > 0 && r[1][2] < 1 && r[1][3] === 0 && r[1][4] === 0, 'thick at dawn, thinning, gone by mid-morning: ' + JSON.stringify(r[1]));
r = await g.ev(`(() => { const res = {}, o = wgOpt(), w = WGS.world; WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 };
  let d = 16; for (; d < 24; d++) { WGS.day = d; if (wgMistToday()) break; } let clear = 16; for (; clear < 24; clear++) { WGS.day = clear; if (!wgMistToday()) break; } window._md = d;
  const seen = new Set(), run = (day, c, n) => { for (let i = 0; i < n; i++) { WGS.day = day; WGS.clock = c; updateWG(1 / 10); if (WGS.toast) seen.add(WGS.toast.msg); } return +WGMI.k.toFixed(2); };
  WGS.weather = null; WGS.wxT = 9999; WGMI.k = 0; WGS.toast = null;
  res.morning = run(d, 0.2, 120); res.toast = seen.has('A MISTY MORNING'); seen.clear(); wgAchTick(); res.star = !!w.meta.ach.mist;
  WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6, storm: false }; WGS.wxT = 9999; res.rain = run(d, 0.2, 120); WGS.weather = null; run(d, 0.2, 120);
  o.wx = 0; res.off = run(d, 0.2, 120); o.wx = 1; run(d, 0.2, 120);
  res.noon = run(d, 0.55, 120); run(d, 0.2, 120); res.clearDay = clear < 24 ? run(clear, 0.2, 120) : -1; res.again = seen.has('A MISTY MORNING'); return res; })()`);
ok(r.morning > 0.9 && r.toast && r.star, 'it rises on a misty morning, told the first time, MISTY MORNING: ' + JSON.stringify(r));
ok(r.rain < 0.05 && r.off < 0.05 && r.noon < 0.05 && r.clearDay < 0.05 && r.clearDay >= 0 && !r.again, 'none under weather, with the effects off, at noon or on a clear morning: ' + JSON.stringify(r));
r = await g.ev(`(() => { const res = {}, D = ctx.drawImage.bind(ctx), A = [0, 1, 2].map(wgMistArt); WGMI.k = 1; WGS.day = _md; WGS.clock = 0.2;
  const draw = () => { const xs = []; ctx.drawImage = function (img, x, y) { if (A.includes(img)) xs.push(x + ',' + y); return D(...arguments); }; try { wgDrawWeatherFX(); } finally { ctx.drawImage = D; } return xs; };
  res.a = draw(); WGS.clock += 30 / wgDayLen(); res.b = draw(); const d0 = WGS.dim; WGS.dim = 'u'; res.under = draw().length; WGS.dim = d0;
  res.px = A.map(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let j = 3; j < d.length; j += 4) if (d[j]) n++; return n; }); return res; })()`);
ok(r.a.length >= 1 && r.a.join() !== r.b.join() && r.under === 0 && r.px.every(n => n > 3000), 'drawn as banks drifting with the clock, none underground: ' + JSON.stringify(r));
const EN = ['MISTY MORNING', 'BE OUT IN THE MORNING MIST', 'A MISTY MORNING'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: mist over a pond and a meadow on an autumn morning
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -7; j <= 7; j++) for (let i = -13; i <= 13; i++) { wgSetObj(w, d, x + i, y + j, 0); const e = Math.hypot((i - 5) / 6, (j + 2) / 3.4); wgSetGround(w, d, x + i, y + j, e < 1 ? G_ID.shallow : G_ID.grass); }
  for (const [i, j] of [[-9, -4], [-6, -6], [-11, 1], [10, 4], [-4, 5], [3, 5]]) wgSetObj(w, d, x + i, y + j, O_ID.oak);
  for (const [i, j] of [[-2, -3], [-1, 2], [1, 3], [-6, 0]]) wgSetObj(w, d, x + i, y + j, O_ID.tallgrass || O_ID.grass_tall || 0);
  WGS.day = _md; WGS.clock = 0.2; WGMI.k = 1; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; p.face = 'r'; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('mist', await g.shot('wg_mist.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'MIST OK' : 'MIST FAIL'); g.close(); process.exit(pass ? 0 : 1);
