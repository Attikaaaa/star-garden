// Wildgrove's ice skates: an icon and a recipe; held on ice they carry the hero quicker than walking and steer true
// (no sliding on as on bare ice), let go they glide on and come to rest; off the ice nothing changes, and the ice keeps
// its own speed and slip; the tiles skated count; ICE DANCER; a swaying line on the ice behind a skater, yours and a
// friend's, fading and then gone; a skater stands tall on blades (side on and end on), never a walker or one off the
// ice; the net messages carry it; tips, Hungarian; a look at friends on a frozen pond.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SKATE' }, seed: { v: '61' }, look: { skin: 2, hair: 3, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const d = wgIcon('skates').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  const rc = RECIPES.find(x => x.out === 'skates'); return [!!WGI.skates, n, rc && rc.at, rc && Object.keys(rc.in).join()]; })()`);
ok(r[0] && r[1] >= 60 && r[2] === 'anvil' && r[3] === 'iron,leather,string', 'icon and recipe: ' + JSON.stringify(r));
// push right half a second, then down a third of a second (how far does it still go right?), let go a second, then two more
const go = (gid, skates) => g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 9; j++) for (let i = -4; i < 20; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.${gid}); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; p.food = 20; p.vx = 0; p.vy = 0; p.sit = null; p.buff = {}; WGKS.vx = WGKS.vy = 0; WGKS.marks.length = 0; WGKS.last.clear();
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = ${skates} ? { id: 'skates', n: 1 } : null; WGS.sel = 0;
  const R = wgKey('right'), D = wgKey('down'), x0 = p.x, y0 = p.y, res = [];
  const run = (keys, n) => { for (const k of keys) Input.down[k] = true; try { for (let i = 0; i < n; i++) updateWG(1 / 60); } finally { for (const k of keys) Input.down[k] = false; } };
  run([R], 30); res.push(p.x - x0); const x1 = p.x; run([D], 20); res.push(p.x - x1);
  let a = [p.x, p.y]; run([], 60); res.push(Math.hypot(p.x - a[0], p.y - a[1])); a = [p.x, p.y]; run([], 120); res.push(Math.hypot(p.x - a[0], p.y - a[1]));
  res.push(GROUND[G_ID.ice].speed, GROUND[G_ID.ice].slip, WGKS.vx === 0 && WGKS.vy === 0 ? 1 : 0, WGKS.marks.filter(m => m.d === d).length, WGKS.marks.every(m => wgGround(w, m.d, Math.floor(m.x0 / 16), Math.floor((m.y0 + 1) / 16)) === G_ID.ice) ? 1 : 0);
  p.x = x0; p.y = y0; p.vx = p.vy = 0; return res.map(v => +(+v).toFixed(1)); })()`);
const skate = await go('ice', true), slide = await go('ice', false), snow = await go('snow', true), snow0 = await go('snow', false);
ok(skate[0] / snow0[0] > 1.5 && skate[0] / snow0[0] < 1.7 && skate[1] < 1 && slide[1] > 8, 'on ice quicker than walking, and true: no sliding on when you turn (bare ice slides): ' + JSON.stringify({ skate, slide }));
ok(skate[2] > 20 && skate[2] < 50 && skate[3] < 4 && skate[6] === 1, 'let go, a skater glides on, then comes to rest: ' + JSON.stringify(skate));
ok(Math.abs(snow[0] - snow0[0]) < 0.5 && snow[2] === 0 && skate[4] === 1 && skate[5] === 1 && slide[5] === 1, 'off the ice nothing changes, the ice keeps its own speed and slip: ' + JSON.stringify({ snow, snow0 }));
r = await g.ev(`(() => { const m = WGS.world.meta, n = m.stats.skate || 0; m.ach = {}; m.stats.skate = 199; wgAchTick(); const a = !!m.ach.skate; m.stats.skate = 200; wgAchTick(); return [+n.toFixed(1), a, !!m.ach.skate]; })()`);
ok(r[0] >= 4 && r[0] < 9 && !r[1] && r[2], 'the tiles skated count (the slide and the snow do not), ICE DANCER at 200: ' + JSON.stringify(r));
// marks: yours from the skate above; a friend's as they skate by, none from one who walks; drawn, fading, then gone
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, res = [];
  const x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); for (let j = -6; j < 9; j++) for (let i = -4; i < 20; i++) wgSetGround(w, d, x + i, y + j, G_ID.ice);
  WGS.inv[0] = null; WGKS.marks.length = 0;
  const f = (pid, skate) => ({ pid, x: p.x, y: p.y + 30 + pid * 20, face: 'r', moving: true, walkT: 0, dim: d, hp: 20, name: '', look: { skin: 0, hair: 0, shirt: 0 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate, inv: 0 });
  WGS.remote = [f(2, 1), f(3, 0)];
  for (let i = 0; i < 40; i++) { for (const q of WGS.remote) q.x += 2; updateWG(1 / 60); }
  const mine = WGKS.marks.filter(m => m.y0 > p.y + 60 && m.y0 < p.y + 80).length, other = WGKS.marks.filter(m => m.y0 > p.y + 82).length;
  WGS.remote = []; WGS.cam.x = p.x + 40; WGS.cam.y = p.y + 40;
  const F = ctx.fillRect.bind(ctx); let n = 0; const C = WG.CS, cx = Math.floor(p.x / 16 / C), cy = Math.floor(p.y / 16 / C);
  const draw = () => { n = 0; ctx.fillRect = function () { if (ctx.fillStyle === PAL.w) n++; return F(...arguments); }; try { wgChunkUpkeep(w, d, cx - 1, cy - 1, cx + 1, cy + 1); } finally { ctx.fillRect = F; } return n; };
  const L = WGKS.marks.slice(), all = draw(); WGKS.marks.length = 0; const none = draw(); WGKS.marks.push(...L);
  WGS.t += WG_SKATE_MARK + 1; updateWG(1 / 60); const left = WGKS.marks.length; WGS.t -= WG_SKATE_MARK + 1;
  return [mine, other, all - none, left]; })()`);
ok(skate[7] >= 6 && skate[8] === 1 && slide[7] === 0, 'a skater leaves a line on the ice, one who slides does not: ' + JSON.stringify([skate[7], skate[8], slide[7]]));
ok(r[0] >= 8 && r[1] === 0 && r[2] >= 40 && r[3] === 0, "a friend's line too, none from a walker; drawn, then gone: " + JSON.stringify(r));
// drawn: blades under a skater side on and end on (and the standing pose), never under a walker or off the ice
r = await g.ev(`(() => { const p = WGS.p, w = WGS.world, d = WGS.dim, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = {};
  for (let j = -2; j < 3; j++) for (let i = -2; i < 3; i++) wgSetGround(w, d, x + i, y + j, G_ID.ice); wgSetGround(w, d, x + 2, y, G_ID.snow);
  const R = rect, S = wgPlayerSpr; let n = 0, fr = -1; rect = function (x, y, w, h, k) { if (k === 'm' || k === 'l' || k === 'L') n++; return R(x, y, w, h, k); }; wgPlayerSpr = function (dir, f) { fr = f; return S(...arguments); };
  try { for (const [face, skate, dx] of [['l', 1, 0], ['r', 1, 0], ['u', 1, 0], ['d', 1, 0], ['l', 0, 0], ['l', 1, 32]]) {
    n = 0; const f = { pid: 9, x: p.x + dx, y: p.y, face, moving: true, walkT: 1.3, dim: d, hp: 20, name: 'PAL', look: { skin: 0, hair: 1, shirt: 2 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate, inv: 0 };
    wgDrawPlayer({ p: f, y: f.y }, WGS.cam.x - 192, WGS.cam.y - 108); res[face + skate + (dx ? 'snow' : '')] = [n, fr, f.moving]; }
    WGS.inv[0] = { id: 'skates', n: 1 }; WGS.sel = 0; p.face = 'l'; p.moving = true; n = 0; wgDrawPlayer({ p, y: p.y }, WGS.cam.x - 192, WGS.cam.y - 108); res.me = [n, fr]; p.moving = false; WGS.inv[0] = null;
  } finally { rect = R; wgPlayerSpr = S; } return res; })()`);
ok(r.l1.join() === '3,0,true' && r.r1.join() === '3,0,true' && r.u1.join() === '2,0,true' && r.d1.join() === '2,0,true' && r.me.join() === '3,0', 'skaters stand tall on blades, side on and end on: ' + JSON.stringify(r));
ok(r.l0[0] === 0 && r.l0[1] === 1 && r.l1snow[0] === 0 && r.l1snow[1] === 1, 'never a walker, never off the ice: ' + JSON.stringify([r.l0, r.l1snow]));
const net = await (await import('fs')).promises.readFile(new URL('../src/wg_net.js', import.meta.url), 'utf8');
ok(/skate: m\.sa \? 1 : 0/.test(net) && /skate: a\[15\] \? 1 : 0/.test(net) && /sa: typeof wgSkating/.test(net) && /L\.skate \? 1 : 0[,\]]/.test(net) && /wgSkating\(\) \? 1 : 0[,\]]/.test(net) && /skate: L\.skate \? 1 : 0/.test(net), 'the net messages carry the skates');
r = await g.ev(`wgTipLines({ id: 'skates', n: 1 })`);
ok(r.includes('HOLD THEM TO SKATE ON ICE') && r.includes('YOU STEER TRUE AND GLIDE ON'), 'tips: ' + JSON.stringify(r));
const EN = ['ICE SKATES', 'ICE DANCER', 'SKATE 200 TILES ON ICE', 'HOLD THEM TO SKATE ON ICE', 'YOU STEER TRUE AND GLIDE ON'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a frozen pond in winter, you and two friends skating, lines behind you all
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 10, y0 = Math.floor(p.y / 16) - 5;
  for (let j = -2; j < 13; j++) for (let i = -2; i < 24; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); const e = Math.hypot((i - 10) / 9, (j - 5) / 4.6); wgSetGround(w, d, x0 + i, y0 + j, e < 1 ? G_ID.ice : G_ID.snow); }
  wgSetObj(w, d, x0 + 1, y0 + 1, O_ID.pine); wgSetObj(w, d, x0 + 20, y0 + 2, O_ID.pine); wgSetObj(w, d, x0 + 19, y0 + 9, O_ID.pine);
  WGS.day = 25; WGS.clock = 0.42; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; WGKS.marks.length = 0; WGKS.last.clear();
  WGS.inv[0] = { id: 'skates', n: 1 }; WGS.sel = 0; p.face = 'r'; p.moving = false;
  const path = (t, cx, cy, rx, ry) => [(x0 + cx) * 16 + Math.cos(t) * rx * 16, (y0 + cy) * 16 + Math.sin(t) * ry * 16];
  const fr = (pid, look, face) => ({ pid, x: 0, y: 0, face, moving: true, walkT: 0, dim: d, hp: 20, name: '', look, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 1, inv: 0 });
  WGS.remote = [fr(2, { skin: 0, hair: 2, shirt: 4, hat: 3 }, 'l'), fr(3, { skin: 1, hair: 0, shirt: 2 }, 'd')];
  for (let k = 0; k <= 60; k++) { const t = k / 60;
    [p.x, p.y] = path(Math.PI * (0.9 + t * 1.2), 10, 5, 6, 2.6); [WGS.remote[0].x, WGS.remote[0].y] = path(Math.PI * (2 - t * 1.1), 11, 6, 5, 2.2); [WGS.remote[1].x, WGS.remote[1].y] = path(Math.PI * (0.2 + t * 0.9), 9, 4, 4, 2.4);
    WGS.t += 0.12; wgSkateMark(-1, p, d); for (const q of WGS.remote) wgSkateMark(q.pid, q, d); }
  WGS.cam.x = (x0 + 10) * 16; WGS.cam.y = (y0 + 5) * 16 + 8; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('rink', await g.shot('wg_skates.png'));
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SKATES OK' : 'SKATES FAIL'); g.close(); process.exit(pass ? 0 : 1);
