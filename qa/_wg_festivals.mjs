// Wildgrove's festival days: the last day of each season is its festival, the others none; it is told once a day outdoors
// and noted, A YEAR OF FESTIVALS for all four; the air or the sky is drawn on its day (petals, lanterns after dark, leaves,
// snow after dark), not on other days, under real weather, indoors or with the ambient life off; the harvest fair grows
// things twice as fast; the calendar marks the festivals; Hungarian; a look at each.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'FESTIVAL' }, seed: { v: '178' }, look: { skin: 1, hair: 3, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 7; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; wgOpt().amb = 1; wgOpt().wx = 1; for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const R = rect; let n = 0; const count = () => { n = 0; rect = function () { n++; return R(...arguments); }; try { wgDrawWeatherFX(); } finally { rect = R; } return n; };`;
let r = await g.ev(`(() => { ${setup} const res = {}; const f = []; for (let d = 0; d < 40; d++) { WGS.day = d; f.push(wgFestival()); } res.days = f.join();
  st.fest = 0; WGFS.told = -1; const told = []; for (const d of [7, 15, 23, 31]) { WGS.day = d; WGS.toast = null; updateWG(1 / 60); told.push(!!WGS.toast); WGS.toast = null; updateWG(1 / 60); told.push(!!WGS.toast); }
  res.told = told.join(); res.bits = st.fest; WGS.day = 3; WGS.toast = null; WGFS.told = -1; updateWG(1 / 60); res.none = !!WGS.toast;
  WGS.day = 39; WGFS.told = -1; WGS.dim = 'u'; WGS.toast = null; updateWG(1 / 60); res.under = !!WGS.toast; WGS.dim = 'o';
  const A = WG_ACH.find(a => a[0] === 'fest')[3]; res.ach = [A({ st: { fest: 15 }, seen: {} }), A({ st: { fest: 7 }, seen: {} })]; return res; })()`);
ok(r.days === '-1,-1,-1,-1,-1,-1,-1,0,-1,-1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,-1,-1,2,-1,-1,-1,-1,-1,-1,-1,3,-1,-1,-1,-1,-1,-1,-1,0', 'the last day of each season is its festival: ' + r.days);
ok(r.told === 'true,false,true,false,true,false,true,false' && r.bits === 15 && !r.none && !r.under && r.ach.join() === 'true,false', 'told once a day outdoors and noted; A YEAR OF FESTIVALS for all four: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; for (const [d, c] of [[7, 0.45], [15, 0.45], [15, 0.95], [23, 0.45], [31, 0.45], [31, 0.95], [6, 0.45]]) { WGS.day = d; WGS.clock = c; res[d + '@' + c] = count(); }
  WGS.day = 7; WGS.clock = 0.45; WGS.weather = { kind: 'rain' }; res.rain = count(); WGS.day = 6; res.rain -= count(); WGS.day = 7; WGS.weather = null; WGS.dim = 'u'; res.under = count(); WGS.dim = 'o'; wgOpt().amb = 0; res.off = count(); wgOpt().amb = 1; return res; })()`);
ok(r['7@0.45'] >= 30 && r['15@0.45'] === 0 && r['15@0.95'] >= 30 && r['23@0.45'] >= 30 && r['31@0.45'] === 0 && r['31@0.95'] >= 30 && r['6@0.45'] === 0, 'petals, lanterns after dark, leaves, snow after dark, on their days only: ' + JSON.stringify(r));
ok(r.rain === 0 && r.under === 0 && r.off === 0, 'not under real weather, underground or with the ambient life off: ' + JSON.stringify([r.rain, r.under, r.off]));
r = await g.ev(`(() => { ${setup} const res = {}; const C = O_ID.crop_wheat; const grow = (d) => { WGS.day = d; for (let j = -6; j <= 6; j++) for (let i = -10; i <= 10; i++) { wgSetGround(w, 'o', x + i, y + j, G_ID.tilled); wgSetObj(w, 'o', x + i, y + j, C, 0); }
    let s = 0; for (let k = 0; k < 30; k++) { WGS.growT = 0; wgGrowTick(1); } for (let j = -6; j <= 6; j++) for (let i = -10; i <= 10; i++) s += wgMetaAt(w, 'o', x + i, y + j); return s; };
  const a = [grow(22), grow(22), grow(22)], b = [grow(23), grow(23), grow(23)]; res.grow = [a.reduce((q, v) => q + v), b.reduce((q, v) => q + v)];
  res.cal = typeof wgCalEvents === 'function' ? [wgCalEvents(23).includes('fest2'), wgCalEvents(22).some(k => k.startsWith('fest')), WG_CAL_EV.fest2 === 'HARVEST FAIR', !!wgFestArt()] : 'none'; return res; })()`);
ok(r.grow[1] > r.grow[0] * 1.5, 'the harvest fair grows things twice as fast: ' + JSON.stringify(r.grow));
ok(JSON.stringify(r.cal) === '[true,false,true,true]', 'the calendar marks the festivals by name: ' + JSON.stringify(r.cal));
const EN = ['A YEAR OF FESTIVALS', 'ENJOY ALL FOUR FESTIVALS', 'BLOSSOM DAY', 'MIDSUMMER NIGHT', 'HARVEST FAIR', 'STARLIGHT EVE', 'IT IS BLOSSOM DAY!', 'IT IS MIDSUMMER NIGHT!', 'IT IS THE HARVEST FAIR!', 'IT IS STARLIGHT EVE!'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
for (const [d, c, name] of [[7, 0.45, 'blossom'], [15, 0.9, 'midsummer'], [23, 0.45, 'harvest'], [31, 0.9, 'starlight']]) {
  await g.ev(`(() => { ${setup} clearInterval(window._fs); for (const [i, j, k] of [[-5, -3, 'oak'], [4, -4, 'birch'], [6, 2, 'pine'], [-7, 3, 'oak']]) wgSetObj(w, 'o', x + i, y + j, O_ID[k]); WGS.day = ${d}; WGS.toast = null; WGFS.told = ${d}; window._fs = setInterval(() => { WGS.clock = ${c}; }, 50); })(); 0`);
  await sleep(400); console.log(name, await g.shot('wg_fest_' + name + '.png'));
}
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FESTIVALS OK' : 'FESTIVALS FAIL'); g.close(); process.exit(pass ? 0 : 1);
