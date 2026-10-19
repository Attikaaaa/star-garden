// Wildgrove's northern lights: on some winter nights only (the same through one night, from its evening), never in
// another season; they fade in with the dark and out at dawn, not under weather, underground or with the weather effects
// off; drawn over the top of the view (two ribbons, tiled) and sliding with the world's clock; the first sight is told
// and lights NORTHERN LIGHTS; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'NORTH' }, seed: { v: '94' }, look: { skin: 2, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const res = { w: [], other: 0, same: true }; WGS.scr = 'play'; WGS.world.meta.hintDone = 1;
  for (let d = 24; d < 32; d++) { WGS.day = d; WGS.clock = 0.85; const a = wgAuroraTonight(); WGS.day = d + 1; WGS.clock = 0.1; const b = wgAuroraTonight(); res.w.push(a ? 1 : 0); if (a !== b) res.same = false; }
  for (const d of [0, 5, 9, 14, 17, 22, 33, 38]) { WGS.day = d; WGS.clock = 0.9; if (wgAuroraTonight()) res.other++; } return res; })()`);
const lit = r.w.filter(Boolean).length;
ok(lit >= 3 && lit <= 7 && r.same && r.other === 0, 'some winter nights, the same through a night, never in another season: ' + JSON.stringify(r));
// fade: run a lit night's frames
r = await g.ev(`(() => { const res = {}, o = wgOpt(), p = WGS.p; let d = 24; WGS.clock = 0.85; for (; d < 32; d++) { WGS.day = d; if (wgAuroraTonight()) break; } window._ad = d;
  const seen = new Set(), run = (n) => { for (let i = 0; i < n; i++) { WGS.clock = 0.9; updateWG(1 / 10); if (WGS.toast) seen.add(WGS.toast.msg); } return +WGAU.k.toFixed(2); };
  WGS.weather = null; WGS.wxT = 9999; WGAU.k = 0; WGS.world.meta.ach = {}; WGS.world.meta.stats = { kills: 0, far: 0 }; WGS.toast = null;
  res.dark = run(120); res.toast = seen.has('THE NORTHERN LIGHTS!'); res.stat = WGS.world.meta.stats.aurora; wgAchTick(); res.star = !!WGS.world.meta.ach.aurora;
  WGS.weather = { kind: 'snow', dark: 0.12, wind: 0.6, storm: false }; WGS.wxT = 9999; res.snow = run(120); WGS.weather = null; run(120); o.wx = 0; res.off = run(120); o.wx = 1; run(120);
  seen.clear(); for (let i = 0; i < 100; i++) { WGS.clock = 0.25 + i * 0.001; updateWG(1 / 10); if (WGS.toast) seen.add(WGS.toast.msg); } res.dawn = +WGAU.k.toFixed(2); res.again = seen.has('THE NORTHERN LIGHTS!');
  WGS.day = _ad; WGS.clock = 0.9; return res; })()`);
ok(r.dark > 0.9 && r.toast && r.stat === 1 && r.star, 'they fade in with the dark, told the first time, NORTHERN LIGHTS: ' + JSON.stringify(r));
ok(r.snow < 0.05 && r.off < 0.05 && r.dawn < 0.05 && !r.again, 'not under weather, nor with the weather effects off, gone by day: ' + JSON.stringify(r));
// drawn: two ribbons, each tiled across the screen; sliding with the clock
r = await g.ev(`(() => { const res = {}, D = ctx.drawImage.bind(ctx), A = [wgAuroraArt(0), wgAuroraArt(1)]; WGAU.k = 1; WGS.weather = null; WGS.day = _ad; WGS.clock = 0.9;
  const draw = () => { const xs = []; ctx.drawImage = function (img, x, y) { const i = A.indexOf(img); if (i >= 0) xs.push(i + ':' + x); return D(...arguments); }; try { wgDrawWeatherFX(); } finally { ctx.drawImage = D; } return xs; };
  res.a = draw(); WGS.clock += 20 / wgDayLen(); res.b = draw(); const d0 = WGS.dim; WGS.dim = 'u'; res.under = draw().length; WGS.dim = d0; WGAU.k = 0; res.none = draw().length; WGAU.k = 1;
  res.cells = [0, 1].map(i => { const d = A[i].getContext('2d').getImageData(0, 0, A[i].width, A[i].height).data; let n = 0; for (let j = 3; j < d.length; j += 4) if (d[j]) n++; return n; }); return res; })()`);
const rib = (L, i) => L.filter(s => s.startsWith(i + ':')).length, cover = Math.ceil(1152 / 3 / 480);
ok(rib(r.a, 0) >= cover && rib(r.a, 1) >= cover && r.a.join() !== r.b.join() && r.under === 0 && r.none === 0 && r.cells.every(n => n > 4000), 'two ribbons across the top, sliding with the clock: ' + JSON.stringify(r));
const EN = ['NORTHERN LIGHTS', 'SEE THE NORTHERN LIGHTS ON A WINTER NIGHT', 'THE NORTHERN LIGHTS!'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a snowy clearing on a night of lights, a campfire and a lamp
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -7; j <= 7; j++) for (let i = -13; i <= 13; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.snow); }
  for (const [i, j] of [[-9, -4], [-6, -5], [7, -4], [10, -2], [-11, 2], [11, 4], [-4, 5]]) wgSetObj(w, d, x + i, y + j, O_ID.pine);
  wgSetObj(w, d, x + 2, y + 1, O_ID.campfire); WGS.day = _ad; WGS.clock = 0.9; WGAU.k = 1; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null;
  p.face = 'u'; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('aurora', await g.shot('wg_aurora.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'AURORA OK' : 'AURORA FAIL'); g.close(); process.exit(pass ? 0 : 1);
