// Wildgrove's moonflowers: seeds from tall grass cut by hand at night, planted on soft ground; shut by day, opening
// through the evening, lit at night; USE picks a moon petal once a night; moonflower tea at the fire is a tea;
// MOONLIT GARDEN for five open in view; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'MOONFLOWER' }, seed: { v: '279' }, look: { skin: 1, hair: 5, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const count = (id) => WGS.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  const R0 = Math.random; const rig = (v, fn) => { Math.random = () => v; try { return fn(); } finally { Math.random = R0; } };
  const DI = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, arguments[1], arguments[2]]); return DI(...arguments); }; try { fn(); } finally { ctx.drawImage = DI; } return L; };
  const names = (L) => L.map(q => Object.keys(WGA.cache).find(k => WGA.cache[k] === q[0])).filter(Boolean);`;
let r = await g.ev(`(() => { ${setup} return { at: (RECIPES.find(q => q.out === 'moon_tea') || {}).at, tea: WG_TEA.includes('moon_tea'), icons: ['moon_seed', 'moon_petal', 'moon_tea'].every(id => WGI[id] && wgIcon(id) && wgIcon(id).width === 16),
  tips: wgTipLines({ id: 'moon_seed', n: 1 }).includes('FROM TALL GRASS AT NIGHT') && wgTipLines({ id: 'moon_petal', n: 1 }).includes('FROM A MOONFLOWER, ONCE A NIGHT'),
  place: [wgCanPlaceAt(x + 2, y, WGI.moon_seed), (wgSetGround(w, 'o', x + 3, y, G_ID.sand), wgCanPlaceAt(x + 3, y, WGI.moon_seed))] }; })()`);
ok(r.at === 'fire' && r.tea && r.icons && r.tips && r.place.join() === 'true,false', 'seeds for soft ground, petals, and a moonflower tea at the fire: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const cut = (clock, by) => { WGS.clock = clock; wgSetObj(w, 'o', x + 2, y, O_ID.tallgrass); WGS.drops.length = 0; rig(0.01, () => wgBreak(x + 2, y, by)); return WGS.drops.filter(d => d.id === 'moon_seed').length; };
  return [cut(0.97, true), cut(0.45, true), cut(0.97, false)]; })()`);
ok(r.join() === '1,0,0', 'seeds from tall grass cut by hand at night only: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; wgSetObj(w, 'o', x + 2, y, O_ID.moonflower); const art = () => names(imgs(() => wgDrawObj(O_ID.moonflower, x + 2, y, 100, 100)));
  res.open = [0.45, 0.8, 0.85, 0.95, 0.05].map(c => { WGS.clock = c; return wgMoonOpen(); }); WGS.clock = 0.45; res.dayArt = art(); const l0 = WGR.lights.length; res.dayLight = WGR.lights.length - l0;
  WGS.clock = 0.97; const l1 = WGR.lights.length; res.nightArt = art(); res.nightLight = WGR.lights.length - l1; WGR.lights.length = l1;
  WGS.clock = 0.45; WGS.toast = null; wgUse(x + 2, y); res.day = [WGS.toast && WGS.toast.msg, count('moon_petal')]; WGS.clock = 0.97; wgUse(x + 2, y); res.pick = [count('moon_petal'), wgMetaAt(w, 'o', x + 2, y) === wgMoonMark()];
  wgUse(x + 2, y); res.again = [WGS.toast.msg, count('moon_petal')]; WGS.day = 10; wgUse(x + 2, y); res.next = count('moon_petal'); return res; })()`);
ok(r.open.join() === '0,0,1,2,2' && r.dayArt.join() === 'moonfl_0' && r.nightArt.join() === 'moonfl_2' && r.nightLight === 1, 'shut by day, opening through the evening, lit at night: ' + JSON.stringify([r.open, r.dayArt, r.nightArt, r.nightLight]));
ok(r.day[0] === 'IT OPENS AT NIGHT' && r.day[1] === 0 && r.pick.join() === '1,true' && r.again.join() === 'COME BACK TOMORROW NIGHT,1' && r.next === 2, 'USE picks a moon petal once a night: ' + JSON.stringify([r.day, r.pick, r.again, r.next]));
r = await g.ev(`(() => { ${setup} st.moonfl = 0; const res = {}; WGS.clock = 0.97; for (let i = 0; i < 4; i++) wgSetObj(w, 'o', x - 4 + i * 2, y - 2, O_ID.moonflower); updateWG(1.1); updateWG(1.1); res.four = st.moonfl | 0;
  wgSetObj(w, 'o', x + 5, y - 2, O_ID.moonflower); WGS.clock = 0.45; updateWG(1.1); updateWG(1.1); res.day = st.moonfl | 0; WGS.clock = 0.97; updateWG(1.1); updateWG(1.1); res.five = st.moonfl | 0;
  const A = WG_ACH.find(a => a[0] === 'moonfl')[3]; res.ach = [A({ st: { moonfl: 1 }, seen: {} }), A({ st: {}, seen: {} })]; return res; })()`);
ok(r.four === 0 && r.day === 0 && r.five === 1 && r.ach.join() === 'true,false', 'MOONLIT GARDEN for five open in view: ' + JSON.stringify(r));
const EN = ['MOONFLOWER', 'MOONFLOWER SEEDS', 'MOON PETAL', 'MOONFLOWER TEA', 'MOONLIT GARDEN', 'SEE FIVE MOONFLOWERS OPEN AT NIGHT', 'IT OPENS AT NIGHT', 'COME BACK TOMORROW NIGHT', 'FROM TALL GRASS AT NIGHT', 'PLANT ON SOFT GROUND', 'FROM A MOONFLOWER, ONCE A NIGHT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a moonflower bed open under a full moon
await g.ev(`(() => { ${setup} WGS.day = 20; WGS.clock = 0.99; for (const [i, j] of [[-3, -2], [-1, -3], [1, -2], [3, -3], [-2, 1], [2, 1], [4, 0]]) wgSetObj(w, 'o', x + i, y + j, O_ID.moonflower);
  for (const [i, j, o] of [[-7, -4, 'oak'], [7, -3, 'birch']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]); WGS.inv[0] = { id: 'moon_tea', n: 2 }; WGS.inv[1] = { id: 'moon_petal', n: 3 }; WGS.inv[2] = { id: 'moon_seed', n: 4 }; })(); 0`);
await sleep(300); console.log('moonflower', await g.shot('wg_moonflower.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'MOONFLOWER OK' : 'MOONFLOWER FAIL'); g.close(); process.exit(pass ? 0 : 1);
