// Wildgrove: a bird on your shoulder. Keeping still outdoors on a dry day brings one in, it settles and counts; a step
// or a swing sends it off and it is gone after its flight; not again too soon; none at night, in the rain, underground,
// with the ambient life off, swimming or riding; friends' heroes too, by pid; drawn by the hero; A FRIEND ON YOUR
// SHOULDER; Hungarian; a look at a hero seated on a bench and a friend standing, each with a bird.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PERCH' }, seed: { v: '289' }, look: { skin: 2, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; p.sit = null; p.swing = 0; p.face = 'd'; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; wgOpt().amb = 1; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0; WGPCH.h.clear();
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const wait = (s) => { for (let k = 0; k < s * 10; k++) { updateWG(0.1); } }, B = (k) => { const H = WGPCH.h.get(k === undefined ? -1 : k); return H && H.b ? H.b.s : '-'; };`;
let r = await g.ev(`(() => { ${setup} const res = {}; st.perch = 0; WGS.clock = 0.45;
  const seq = []; wait(WG_PERCH_WAIT - 1); seq.push(B()); wait(1.2); seq.push(B()); wait(WG_PERCH_FLY + 0.2); seq.push(B(), st.perch);
  p.x += 4; updateWG(0.1); seq.push(B()); wait(WG_PERCH_FLY + 0.2); seq.push(B());
  wait(WG_PERCH_WAIT + 2); seq.push(B()); wait(WG_PERCH_AGAIN); seq.push(B()); res.seq = seq.join();
  wait(WG_PERCH_FLY + 1); p.swing = 0.2; updateWG(0.1); p.swing = 0; res.swing = B(); return res; })()`);
ok(r.seq === '-,in,on,1,out,-,-,on', 'keeping still brings a bird in to settle, counted; a step sends it off and it is gone; not again too soon: ' + r.seq);
ok(r.swing === 'out', 'a swing of a tool sends it off too: ' + r.swing);
r = await g.ev(`(() => { ${setup} const res = {}; const try1 = (prep, undo) => { WGPCH.h.clear(); prep(); wait(WG_PERCH_WAIT + 2); const s = B(); undo(); return s; };
  res.night = try1(() => { WGS.clock = 0.95; }, () => { WGS.clock = 0.45; });
  res.rain = try1(() => { WGS.weather = { kind: 'rain' }; }, () => { WGS.weather = null; });
  res.off = try1(() => { wgOpt().amb = 0; }, () => { wgOpt().amb = 1; });
  res.swim = try1(() => { wgSetGround(w, 'o', x, y, G_ID.deep); }, () => { wgSetGround(w, 'o', x, y, G_ID.grass); });
  res.bike = try1(() => { WGS.inv[0] = { id: 'bicycle', n: 1 }; }, () => { WGS.inv[0] = null; });
  WGPCH.h.clear(); wgSetObj(w, 'o', x, y, O_ID.park_bench); wgSit(x, y); wait(WG_PERCH_WAIT + 2); res.seated = B(); res.sat = !!p.sit; p.sit = null; wgSetObj(w, 'o', x, y, 0);
  const f = { pid: 4, x: p.x + 40, y: p.y, face: 'l', moving: false, walkT: 0, dim: 'o', hp: 20, name: 'PAL', look: { skin: 0, hair: 2, shirt: 1 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, umb: 0, sled: 0, inv: 0 };
  WGPCH.h.clear(); WGS.remote = [f]; wait(WG_PERCH_WAIT + WG_PERCH_FLY + 1); res.friend = B(4); f.x += 10; updateWG(0.1); res.friendGo = B(4);
  WGPCH.h.clear(); f.bike = 1; wait(WG_PERCH_WAIT + 2); res.friendBike = B(4); WGS.remote = []; return res; })()`);
ok([r.night, r.rain, r.off, r.swim].every(s => s === '-') && (r.bike === '-') && r.seated !== '-' && r.sat, 'none at night, in the rain, underground, with the ambient life off, swimming or riding; seated is fine: ' + JSON.stringify(r));
ok(r.friend === 'on' && r.friendGo === 'out' && r.friendBike === '-', "friends' heroes too: " + JSON.stringify([r.friend, r.friendGo, r.friendBike]));
r = await g.ev(`(() => { ${setup} wait(WG_PERCH_WAIT + WG_PERCH_FLY + 1); const D = ctx.drawImage.bind(ctx); let n = 0; ctx.drawImage = function (img) { if (Object.keys(WGA.cache).some(k => /^bird[0-2][lr]$/.test(k) && WGA.cache[k] === img)) n++; return D(...arguments); };
  try { wgDrawPlayer({ p, y: p.y }, WGS.cam.x - 192, WGS.cam.y - 108); } finally { ctx.drawImage = D; } const A = WG_ACH.find(a => a[0] === 'perch')[3]; return [n, A({ st: { perch: 1 }, seen: {} }), A({ st: {}, seen: {} })]; })()`);
ok(r.join() === '1,true,false', 'drawn by the hero; A FRIEND ON YOUR SHOULDER: ' + JSON.stringify(r));
const EN = ['A FRIEND ON YOUR SHOULDER', 'KEEP STILL TILL A BIRD SETTLES ON YOU'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: seated on a bench with a bird settled, a friend standing with one flying in
await g.ev(`(() => { ${setup} if (O_ID.park_bench) { wgSetObj(w, 'o', x, y, O_ID.park_bench); wgSit(x, y); } for (const [i, j, k] of [[-4, -3, 'oak'], [5, -3, 'birch'], [-6, 2, 'flower_y'], [3, 2, 'flower_r']]) if (O_ID[k]) wgSetObj(w, 'o', x + i, y + j, O_ID[k]);
  const f = { pid: 4, x: p.x + 36, y: p.y + 6, face: 'l', moving: false, walkT: 0, dim: 'o', hp: 20, name: 'PAL', look: { skin: 0, hair: 2, shirt: 1 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, umb: 0, sled: 0, inv: 0 };
  WGS.remote = [f]; wait(WG_PERCH_WAIT + WG_PERCH_FLY + 0.5); WGPCH.h.get(4).b = { s: 'in', t0: WGS.t - 0.9, kind: 1, side: 1 }; WGPCH.h.get(-1).b.kind = 0; WGS.cam.x = p.x + 16; WGS.cam.y = p.y - 8;
  window._pb = setInterval(() => { WGS.clock = 0.45; const H = WGPCH.h.get(4); if (H && H.b) H.b.t0 = WGS.t - 0.9; }, 30); })(); 0`);
await sleep(400); console.log('perch', await g.shot('wg_perch.png'));
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PERCH OK' : 'PERCH FAIL'); g.close(); process.exit(pass ? 0 : 1);
