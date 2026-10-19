// Wildgrove's breezy days: a bubble wand from a bench blows a puff of bubbles that drift with the wind and pop, never
// used up, a guest's puff passed on only from beside that guest; dandelions on some spring grass, in flower first and
// clocks after, blown by walking through or USE, seeds flying, a bare stem until they grow back, none in summer;
// hot-air balloons drift east on fair days, the same for everyone, none at night, under weather or with the ambient
// life off, and one passing over you is told; Hungarian; two looks.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BREEZY' }, seed: { v: '266' }, look: { skin: 1, hair: 4, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const DI = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, arguments[1], arguments[2]]); return DI(...arguments); }; try { fn(); } finally { ctx.drawImage = DI; } return L; };`;
let r = await g.ev(`(() => { ${setup} const Rc = RECIPES.find(q => q.out === 'bubble_wand'); WGS.inv[WGS.sel] = { id: 'bubble_wand', n: 1 }; WGBB.list.length = 0; WGBB.t = -1; st.bubbles = 0;
  const res = { at: Rc && Rc.at, icon: !!wgIcon('bubble_wand'), tip: wgTipLines({ id: 'bubble_wand', n: 1 }).includes('USE BLOWS BUBBLES') };
  WGS.aim = 0; res.blow = wgBubBlow(); res.again = wgBubBlow(); const P = WGBB.list[0]; res.n = [st.bubbles, wgBubN(P.s)]; res.kept = WGS.inv[WGS.sel] && WGS.inv[WGS.sel].id === 'bubble_wand';
  const wa = wgWindA(), wx = Math.cos(wa), wy = Math.sin(wa) * 0.5; let drift = 0, ahead = 0, high = true;
  for (let i = 0; i < wgBubN(P.s); i++) { const a = wgBubAt(P, i, 1), b = wgBubAt(P, i, 2.5); drift += (b.x - a.x) * wx + (b.y - a.y) * wy; ahead += a.x - P.x; high = high && a.z >= 3; }
  res.wind = drift > 0; res.ahead = ahead > 0; res.high = high;
  const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2; WGS.t += 1; res.drawn = imgs(() => wgDrawAmbient(cx0, cy0)).filter(q => Object.keys(WGA.cache).some(k => k.startsWith('bub_') && WGA.cache[k] === q[0])).length;
  WGS.t += 6; updateWG(1 / 60); res.gone = WGBB.list.length; return res; })()`);
ok(r.at === 'bench' && r.icon && r.tip, 'a bubble wand from a bench, an icon and a tip: ' + JSON.stringify([r.at, r.icon, r.tip]));
ok(r.blow && !r.again && r.n[0] === r.n[1] && r.n[1] >= 3 && r.n[1] <= 5 && r.kept, 'USE blows a puff of three to five, not twice at once, and the wand is kept: ' + JSON.stringify([r.blow, r.again, r.n, r.kept]));
ok(r.wind && r.ahead && r.high && r.drawn === r.n[1] && r.gone === 0, 'they fly off toward the aim, drift with the wind in the air, and pop: ' + JSON.stringify([r.wind, r.ahead, r.high, r.drawn, r.gone]));
r = await g.ev(`(() => { ${setup} WGBB.list.length = 0; const L = { pid: 1 }; WGS.remote = [{ pid: 1, x: p.x + 20, y: p.y, dim: 'o' }];
  wgnHostMsg(L, { t: 'bub', x: p.x + 20, y: p.y, a: 1, s: 5, d: 'o' }); const a = WGBB.list.length; wgnHostMsg(L, { t: 'bub', x: p.x + 20, y: p.y, a: 1, s: 6, d: 'o' }); const b = WGBB.list.length;
  L.bubT = 0; wgnHostMsg(L, { t: 'bub', x: p.x + 400, y: p.y, a: 1, s: 7, d: 'o' }); const c = WGBB.list.length; L.bubT = 0; wgnHostMsg(L, { t: 'bub', x: 'x', y: p.y, a: 1, s: 7, d: 'o' }); WGS.remote = []; return [a, b, c, WGBB.list.length]; })()`);
ok(r[0] === 1 && r[1] === 1 && r[2] === 1 && r[3] === 1, "a guest's puff is blown from beside that guest only, rate-limited: " + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} WGS.day = 3; WGDN.gone.clear(); WGDN.fluff.length = 0; const res = {}; let n = 0, m = 0;
  for (let j = -14; j <= 14; j++) for (let i = -20; i <= 20; i++) { n++; if (wgDandAt(x + i, y + j)) m++; } res.share = [m, n];
  WGS.day = 9; let s = 0; for (let j = -14; j <= 14; j++) for (let i = -20; i <= 20; i++) if (wgDandAt(x + i, y + j)) s++; res.summer = s; WGS.day = 3;
  let T = null; for (let j = -14; j <= 14 && !T; j++) for (let i = -20; i <= 20; i++) if (Math.abs(i) > 2 && wgDandAt(x + i, y + j)) { T = [x + i, y + j]; break; }
  const D = wgDandAt(T[0], T[1]); WGS.day = 1; res.flower = wgDandAt(T[0], T[1]).flower && !wgDandBlow(T[0], T[1], true); WGS.day = 3; res.clock = !D.flower;
  st.dand = 0; p.x = T[0] * 16 + 8 + D.dx; p.y = T[1] * 16 + 12 + D.dy; WGDN.t = 1; updateWG(1 / 60); res.walk = [wgDandBare(T[0], T[1]), WGDN.fluff.length, st.dand];
  WGS.cam.x = p.x; WGS.cam.y = p.y; res.bare = imgs(() => wgChunkUpkeep(w, 'o', 0, 0, 0, 0)).some(q => q[0] === wgDandArt(2));
  const t0 = WGS.t; WGS.t = t0 + WG_DAND_BACK + 1; res.back = !wgDandBare(T[0], T[1]); res.use = wgUse(T[0], T[1]) && st.dand === 2; WGS.t = t0;
  WGDN.gone.clear(); p.x = (x - 30) * 16; WGS.remote = [{ pid: 2, x: T[0] * 16 + 8 + D.dx, y: T[1] * 16 + 12 + D.dy, dim: 'o' }]; WGDN.t = 1; updateWG(1 / 60); res.friend = [wgDandBare(T[0], T[1]), st.dand]; WGS.remote = [];
  WGDN.gone.clear(); WGDN.fluff.length = 0; wgOpt().part = 0; wgDandBlow(T[0], T[1], false); res.off = WGDN.fluff.length; wgOpt().part = 2; return res; })()`);
ok(r.share[0] >= r.share[1] / 150 && r.share[0] <= r.share[1] / 30 && r.summer === 0, 'dandelions on some spring grass, none in summer: ' + JSON.stringify([r.share, r.summer]));
ok(r.flower && r.clock, 'in flower for the first days, clocks after; a flower does not blow: ' + JSON.stringify([r.flower, r.clock]));
ok(r.walk[0] && r.walk[1] === 7 && r.walk[2] === 1 && r.bare && r.back && r.use, 'walking through blows it, its seeds fly, a bare stem until it grows back, USE blows too: ' + JSON.stringify([r.walk, r.bare, r.back, r.use]));
ok(r.friend[0] && r.friend[1] === 2 && r.off === 0, "a friend's steps blow it but count for them, no seeds with the particles off: " + JSON.stringify([r.friend, r.off]));
r = await g.ev(`(() => { ${setup} const res = {}, A = wgBalloonList(p.x - 6000, p.y - 3000, p.x + 6000, p.y + 3000); res.n = A.length;
  const t0 = WGS.clock; WGS.clock = t0 + 1 / wgDayLen(); const B = wgBalloonList(p.x - 6000, p.y - 3000, p.x + 6000, p.y + 3000); WGS.clock = t0;
  res.east = A.length > 0 && A.every(a => B.some(b => b[3] === a[3] && Math.abs(b[0] - a[0] - WG_BALLOON_V) < 0.5)); res.same = JSON.stringify(A) === JSON.stringify(wgBalloonList(p.x - 6000, p.y - 3000, p.x + 6000, p.y + 3000));
  const bl = A.reduce((a, b) => Math.hypot(a[0] - p.x, a[1] - p.y) < Math.hypot(b[0] - p.x, b[1] - p.y) ? a : b); p.x = bl[0]; p.y = bl[1] + 1; WGS.cam.x = p.x; WGS.cam.y = p.y - 30;
  const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, seen = () => imgs(() => wgDrawAmbient(cx0, cy0)).filter(q => Object.keys(WGA.cache).some(k => k.startsWith('balloon_') && WGA.cache[k] === q[0])).length;
  res.day = seen(); WGS.clock = 0; res.night = seen(); WGS.clock = 0.45; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.rain = seen(); WGS.weather = null; wgOpt().amb = 0; res.off = seen(); wgOpt().amb = 1;
  st.balloon = 0; WGBL.t = 0; updateWG(1 / 60); res.told = [st.balloon, WGS.toast && WGS.toast.msg]; return res; })()`);
ok(r.n >= 2 && r.east && r.same, 'balloons drift east in lanes, the same for everyone: ' + JSON.stringify([r.n, r.east, r.same]));
ok(r.day >= 1 && r.night === 0 && r.rain === 0 && r.off === 0, 'seen on a fair day, none at night, under weather or with the ambient life off: ' + JSON.stringify([r.day, r.night, r.rain, r.off]));
ok(r.told[0] === 1, 'one passing over you is told: ' + JSON.stringify(r.told));
const EN = ['BUBBLE WAND', 'USE BLOWS BUBBLES', 'THEY DRIFT WITH THE WIND', 'A HOT-AIR BALLOON!', 'MAKE A WISH', 'BLOW TWELVE DANDELION CLOCKS', 'BUBBLE BLOWER', 'UP AND AWAY'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a spring meadow full of dandelions, a puff of bubbles drifting off the wand
await g.ev(`(() => { ${setup} WGS.day = 3; WGDN.gone.clear(); WGDN.fluff.length = 0; WGBB.list.length = 0; WGBB.t = -1;
  for (const [i, j, o] of [[-8, -4, 'oak'], [-10, 1, 'birch'], [9, -5, 'oak'], [11, 3, 'birch'], [-4, 5, 'flower_y'], [5, 4, 'flower_r'], [3, -4, 'tallgrass']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o] || O_ID.oak);
  WGS.inv[WGS.sel] = { id: 'bubble_wand', n: 1 }; WGS.aim = -0.4; p.face = 'r'; wgBubBlow(); WGBB.list[0].t0 -= 1.2; WGBB.t = -1; WGS.aim = 0.3; wgBubBlow(); WGBB.list[1].t0 -= 0.5;
  let T = null; for (let j = -6; j <= 6 && !T; j++) for (let i = -10; i <= 10; i++) { const D = wgDandAt(x + i, y + j); if (D && !D.flower && Math.abs(i) > 2) { T = [x + i, y + j]; break; } }
  if (T) { wgDandBlow(T[0], T[1], false); for (const f of WGDN.fluff) f.t0 -= 1.5; } })(); 0`);
await sleep(120); console.log('breezy', await g.shot('wg_breezy.png'));
// a second look: a balloon drifting over the meadow on a fair day
await g.ev(`(() => { ${setup} WGBB.list.length = 0; WGDN.fluff.length = 0; const A = wgBalloonList(p.x - 6000, p.y - 3000, p.x + 6000, p.y + 3000), bl = A.reduce((a, b) => Math.hypot(a[0] - p.x, a[1] - p.y) < Math.hypot(b[0] - p.x, b[1] - p.y) ? a : b);
  p.x = bl[0] - 60; p.y = bl[1] - 40; for (const [i, j, o] of [[-6, -2, 'oak'], [7, -3, 'birch'], [-9, 3, 'oak'], [4, 4, 'flower_b']]) wgSetObj(w, 'o', Math.floor(p.x / 16) + i, Math.floor(p.y / 16) + j, O_ID[o] || O_ID.oak); })(); 0`);
await sleep(200); console.log('balloon', await g.shot('wg_balloon.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BREEZY OK' : 'BREEZY FAIL'); g.close(); process.exit(pass ? 0 : 1);
