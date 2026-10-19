// Wildgrove's moon: it waxes and wanes over eight nights, a night counted from its evening; a full moon lights the
// night a little and a new moon darkens it a touch, never by day or underground; the dial shows tonight's moon in its
// phase at night only; the MOONLIGHT star at midnight under a full moon; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'MOON' }, seed: { v: '275' }, look: { skin: 0, hair: 4, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p; WGS.dim = 'o'; WGS.scr = 'play'; w.meta.hintDone = 1; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; WGS.day = 9; WGS.clock = 0.45;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const DI = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, arguments[1], arguments[2]]); return DI(...arguments); }; try { fn(); } finally { ctx.drawImage = DI; } return L; };
  const lit = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] > 200 && d[i + 1] > 200) n++; return n; };`;
let r = await g.ev(`(() => { ${setup} const res = {}; res.cycle = []; for (let d = 16; d < 24; d++) { WGS.day = d; WGS.clock = 0.9; res.cycle.push(wgMoonPhase()); }
  WGS.day = 20; WGS.clock = 0.1; res.after = wgMoonPhase(); WGS.day = 19; WGS.clock = 0.9; res.before = wgMoonPhase();
  const amb = (day, clock, dim) => { WGS.day = day; WGS.clock = clock; WGS.dim = dim || 'o'; const a = wgAmbient(); WGS.dim = 'o'; return a; };
  res.full = amb(20, 0.97); res.newm = amb(16, 0.97); res.dayFull = amb(20, 0.45); res.dayNew = amb(16, 0.45); res.caveFull = amb(20, 0.97, 'u'); res.caveNew = amb(16, 0.97, 'u');
  res.lit = [0, 2, 4, 6].map(k => lit(wgMoonArt(k))); return res; })()`);
ok(r.cycle.join() === '0,1,2,3,4,5,6,7' && r.after === r.before, 'the moon waxes and wanes over eight nights, a night counted from its evening: ' + JSON.stringify([r.cycle, r.after, r.before]));
ok(r.full < r.newm - 0.1 && r.dayFull === r.dayNew && r.caveFull === r.caveNew, 'a full moon lights the night, a new moon darkens it, not by day or underground: ' + JSON.stringify([r.full, r.newm, r.dayFull, r.caveFull]));
ok(r.lit[0] === 0 && r.lit[2] > r.lit[1] && r.lit[1] > 4 && Math.abs(r.lit[1] - r.lit[3]) <= 2, 'drawn dark when new, half at the quarters, whole when full: ' + JSON.stringify(r.lit));
r = await g.ev(`(() => { ${setup} const moon = () => imgs(() => wgDrawHud()).filter(q => Object.keys(WGA.cache).some(k => k.startsWith('moonph_') && WGA.cache[k] === q[0])).map(q => Object.keys(WGA.cache).find(k => WGA.cache[k] === q[0]));
  const res = {}; WGS.day = 20; WGS.clock = 0.97; res.night = moon(); WGS.clock = 0.45; res.day = moon(); WGS.clock = 0.97; WGS.dim = 'u'; res.cave = moon(); WGS.dim = 'o';
  st.fullmoon = 0; WGS.clock = 0.97; updateWG(1 / 60); res.told = [st.fullmoon, WGS.toast && WGS.toast.msg]; st.fullmoon = 0; WGS.day = 18; updateWG(1 / 60); res.half = st.fullmoon; return res; })()`);
ok(r.night.join() === 'moonph_4' && !r.day.length && !r.cave.length, "the dial shows tonight's moon at night only: " + JSON.stringify([r.night, r.day, r.cave]));
ok(r.told[0] === 1 && r.told[1] === 'A FULL MOON TONIGHT' && r.half === 0, 'MOONLIGHT at midnight under a full moon, not a half one: ' + JSON.stringify([r.told, r.half]));
const EN = ['MOONLIGHT', 'STAND OUT UNDER A FULL MOON AT MIDNIGHT', 'A FULL MOON TONIGHT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a meadow under a full moon at midnight
await g.ev(`(() => { ${setup} WGS.day = 20; WGS.clock = 0.99; WGS.toast = null; })(); 0`);
await sleep(200); console.log('moon', await g.shot('wg_moon.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'MOON OK' : 'MOON FAIL'); g.close(); process.exit(pass ? 0 : 1);
