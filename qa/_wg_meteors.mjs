// Wildgrove's meteor showers: one summer night in three, the odd autumn one, never in spring or winter; the streaks fade
// in with the dark, never by day, under weather, underground or with the weather effects off; SHOOTING STARS; once a
// shower night a big one comes down near the hero and leaves a glowing star shard (kept), not twice; a star lamp;
// Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'METEORS' }, seed: { v: '277' }, look: { skin: 3, hair: 0, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); WGMT.k = 0; WGMT.list.length = 0; WGMT.fall = null; w.meta.mfall = -1;
  let shower = 0; for (let d = 8; d < 400; d++) { WGS.day = d; WGS.clock = 0.9; if (wgMeteorTonight()) { shower = d; break; } } WGS.day = 9; WGS.clock = 0.45;
  const run = (n, dt) => { for (let i = 0; i < n; i++) updateWG(dt || 1 / 30); return WGMT.k; };`;
let r = await g.ev(`(() => { ${setup} const rec = (RECIPES.find(q => q.out === 'star_lamp') || {}).at, sea = [0, 0, 0, 0], all = [0, 0, 0, 0];
  for (let d = 0; d < 1600; d++) { WGS.day = d; WGS.clock = 0.9; const s = Math.floor(d / 8) % 4; all[s]++; if (wgMeteorTonight()) sea[s]++; }
  WGS.day = 21; WGS.clock = 0.1; const late = wgMeteorTonight(); WGS.day = 20; WGS.clock = 0.9; const eve = wgMeteorTonight();
  return { rec, icons: ['star_shard', 'star_lamp'].every(id => WGI[id] && wgIcon(id) && wgIcon(id).width === 16), frames: (WGA.obj.star_lamp || []).length, light: OBJ[O_ID.star_lamp].light,
    tips: wgTipLines({ id: 'star_shard', n: 1 }).includes('IT FELL FROM THE SKY') && wgTipLines({ id: 'star_lamp', n: 1 }).includes('A STAR IN A JAR'), share: sea.map((n, i) => +(n / all[i]).toFixed(2)), same: late === eve, shower }; })()`);
ok(r.rec === 'bench' && r.icons && r.frames === 4 && r.light > 0 && r.tips, 'a star shard and a star lamp from a bench that twinkles: ' + JSON.stringify(r));
ok(r.share[0] === 0 && r.share[3] === 0 && r.share[1] > 0.22 && r.share[1] < 0.45 && r.share[2] > 0.05 && r.share[2] < 0.22 && r.same && r.shower, 'one summer night in three, the odd autumn one, a night from its evening: ' + JSON.stringify([r.share, r.same, r.shower]));
r = await g.ev(`(() => { ${setup} const res = {}; WGS.day = shower; WGS.clock = 0.97; st.meteors = 0; let most = 0;
  for (let i = 0; i < 200; i++) { updateWG(1 / 30); most = Math.max(most, WGMT.list.length); } res.on = [+WGMT.k.toFixed(2), most, st.meteors]; res.told = WGS.toast && WGS.toast.msg;
  const one = (fn) => { fn(); const k = run(300); WGS.weather = null; WGS.dim = 'o'; wgOpt().wx = 1; WGS.clock = 0.97; WGS.day = shower; run(300); return +k.toFixed(2); };
  res.rain = one(() => { WGS.weather = { kind: 'rain', dark: 0.2, wind: 0.3, storm: false }; }); res.day = one(() => { WGS.clock = 0.45; }); res.cave = one(() => { WGS.dim = 'u'; }); res.off = one(() => { wgOpt().wx = 0; });
  res.other = one(() => { WGS.day = shower + 1; }); WGS.day = shower + 1; WGS.clock = 0.97; res.otherNight = wgMeteorTonight(); return res; })()`);
ok(r.on[0] > 0.9 && r.on[1] >= 1 && r.on[1] <= 4 && r.on[2] === 1, 'streaks on a shower night, a few at a time, and SHOOTING STARS: ' + JSON.stringify(r.on));
ok(r.rain === 0 && r.day === 0 && r.cave === 0 && r.off === 0 && (r.otherNight || r.other === 0), 'not under weather, by day, underground, with the effects off or on another night: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; WGS.day = shower; WGS.clock = 0.97; w.meta.mfall = shower; run(300); res.fell = wgMeteorFall(); const F = WGMT.fall, d = Math.hypot(F.x - p.x, F.y - p.y) / 16;
  res.where = [+d.toFixed(1), wgObjAt(w, 'o', Math.floor(F.x / 16), Math.floor(F.y / 16)), w.meta.mfall === wgGazeNight()];
  let n = 0; const R0 = rect; rect = function () { n++; return R0.apply(this, arguments); }; try { wgDrawWeatherFX(); } finally { rect = R0; } res.drawn = n;
  for (let i = 0; i < 40 && WGMT.fall; i++) updateWG(1 / 30); const s = WGS.drops.filter(q => q.id === 'star_shard'); res.shard = [s.length, s.length && !!s[0].keep, WGS.toast && WGS.toast.msg];
  const M0 = Math.random; Math.random = () => 0.0001; try { for (let i = 0; i < 5; i++) updateWG(1 / 30); } finally { Math.random = M0; } res.again = !!WGMT.fall;
  WGMT.list.length = 0; WGS.day = shower + 3; WGS.clock = 0.97; res.next = w.meta.mfall !== wgGazeNight(); return res; })()`);
ok(r.fell && r.where[0] >= 2 && r.where[0] <= 7 && !r.where[1] && r.where[2] && r.drawn > 10, 'a big one comes down on a bare tile near the hero: ' + JSON.stringify([r.fell, r.where, r.drawn]));
ok(r.shard[0] === 1 && r.shard[1] && r.shard[2] === 'A STAR FELL NEARBY!' && !r.again && r.next, 'it leaves a star shard that is kept, once a shower night: ' + JSON.stringify([r.shard, r.again, r.next]));
r = await g.ev(`(() => { const A = WG_ACH.find(a => a[0] === 'meteors')[3]; return [A({ st: { meteors: 1 }, seen: {} }), A({ st: {}, seen: {} })]; })()`);
ok(r.join() === 'true,false', 'the SHOOTING STARS star: ' + JSON.stringify(r));
const EN = ['STAR SHARD', 'STAR LAMP', 'SHOOTING STARS', 'WATCH A METEOR SHOWER', 'A METEOR SHOWER!', 'A STAR FELL NEARBY!', 'IT FELL FROM THE SKY', 'A STAR IN A JAR'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a shower night, star lamps by the path, a shard glowing in the grass and the big one coming down
await g.ev(`(() => { ${setup} WGS.day = shower; WGS.clock = 0.97; run(300); for (const [i, j] of [[-3, -2], [3, -2]]) wgSetObj(w, 'o', x + i, y + j, O_ID.star_lamp); for (const [i, j, o] of [[-6, -4, 'oak'], [6, -5, 'birch'], [-8, 2, 'pine']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  wgDrop(p.x + 40, p.y + 20, 'star_shard', 1, { keep: true }); WGS.drops[WGS.drops.length - 1].z = 0; WGS.drops[WGS.drops.length - 1].vz = 0;
  WGMT.list.length = 0; const d = wgMeteorDir(); for (const [a, b] of [[60, 20], [200, 40], [300, 12]]) WGMT.list.push({ x: -SCR.ox + a, y: -SCR.oy + b, d, t: 0.2, life: 0.6, len: 11 });
  WGMT.fall = { x: p.x - 50, y: p.y + 10, d, t: 0.5 }; WGMT.next = 999; window._hold = setInterval(() => { for (const m of WGMT.list) m.t = 0.2; if (WGMT.fall) WGMT.fall.t = 0.5; WGMT.next = 999; WGS.clock = 0.97; }, 5); })(); 0`);
await sleep(300); console.log('meteors', await g.shot('wg_meteors.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'METEORS OK' : 'METEORS FAIL'); g.close(); process.exit(pass ? 0 : 1);
