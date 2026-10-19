// Wildgrove's fireworks: an item, a recipe, an icon; USE asks for the night and the open sky, then sends one up beside
// the hero (one from the stack, counted); it rises with a trail, bursts into its sparks with a flash and a light, the
// bang once; the same seed draws the same burst; gone after WG_FW_T; the net: the host passes a guest's on (rate-limited,
// checked), a guest flies the host's (an open link only); FIREWORKS NIGHT; tips, Hungarian; a look at night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BOOM' }, seed: { v: '85' }, look: { skin: 3, hair: 0, shirt: 6 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'firework'); return [!!WGI.firework, rc && rc.at, rc && rc.n, !!wgIcon('firework')]; })()`);
ok(r[0] && r[1] === 'bench' && r[2] === 3 && r[3], 'an item, a recipe, an icon: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -5; j < 6; j++) for (let i = -8; i < 9; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { fireworks: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 10; p.face = 'r'; window._fw = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'firework', n: 6 }; WGS.sel = 0; WGFW.list.length = 0; WGS.weather = null; WGS.wxT = 9999;
  const say = () => { WGS.toast = null; wgUse(x + 1, y); return WGS.toast && WGS.toast.msg; }, res = [];
  WGS.clock = 0.5; res.push(say(), WGFW.list.length); WGS.dim = 'u'; WGS.clock = 0.95; res.push(say(), WGFW.list.length); WGS.dim = d;
  wgUse(x + 1, y); const f = WGFW.list[0]; res.push(WGFW.list.length, WGS.inv[0].n, w.meta.stats.fireworks, f && f.x - p.x, f && f.d); return res; })()`);
ok(r[0] === 'IT SHINES BEST AT NIGHT' && r[1] === 0 && r[2] === 'IT NEEDS THE OPEN SKY' && r[3] === 0, 'it asks for the night and the open sky: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4] === 1 && r[5] === 5 && r[6] === 1 && r[7] === 10 && r[8] === 'o', 'at night it goes up beside the hero, one from the stack, counted: ' + JSON.stringify(r.slice(4)));
r = await g.ev(`(() => { const F = ctx.fillRect.bind(ctx), f = WGFW.list[0], cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, L = WGR.lights;
  f.s = 0; const C = WG_FW_COLS[0].map(k => PAL[k]), ALL = new Set(C.concat(['Y', 'O', 'o', 'w'].map(k => PAL[k])));
  const draw = (k) => { f.t0 = WGS.t - k; let n = 0, col = 0; const l0 = L.length; ctx.fillRect = function () { if (ALL.has(ctx.fillStyle)) n++; if (C.includes(ctx.fillStyle)) col++; return F(...arguments); };
    try { wgDrawLight(cx0, cy0); } finally { ctx.fillRect = F; } const lit = L.slice(l0).some(l => l.r === 44); return [n, col, lit]; };
  const up = draw(0.5), burst = draw(WG_FW_UP + 0.03), later = draw(WG_FW_UP + 0.9), a = wgFwSpark(f, 3, 0.7, { x: 0, y: 0 }), b = wgFwSpark(f, 3, 0.7, { x: 0, y: 0 }), top = wgFwTop(f);
  return [up, burst, later, JSON.stringify(a) === JSON.stringify(b), Math.round(Math.hypot(a.x - top.x, a.y - top.y)) > 8, wgFwAt(f, 0.5).y < f.y - 16]; })()`);
ok(r[0][0] >= 1 && r[0][1] === 0 && !r[0][2] && r[5], 'it rises with a trail, no sparks yet: ' + JSON.stringify(r[0]));
ok(r[1][0] >= 33 && r[1][1] === 0 && r[1][2] && r[2][1] >= 20 && !r[2][2], 'it bursts white with a flash and a light, its colour lingers as it twinkles: ' + JSON.stringify(r.slice(1, 3)));
ok(r[3] && r[4], 'the same seed draws the same sparks, flying out: ' + JSON.stringify(r.slice(3, 5)));
r = await g.ev(`(() => { const S = Audio_.sfx, got = [], f = WGFW.list[0], res = []; Audio_.sfx = (n) => got.push(n);
  try { f.t0 = WGS.t; f.pop = 0; for (let i = 0; i < 80; i++) updateWG(1 / 60); res.push(got.filter(n => n === 'star').length, f.pop); for (let i = 0; i < 160; i++) updateWG(1 / 60); res.push(got.filter(n => n === 'star').length, WGFW.list.length); }
  finally { Audio_.sfx = S; } return res; })()`);
ok(r[0] === 1 && r[1] === 1 && r[2] === 1 && r[3] === 0, 'the bang once at the burst, gone after WG_FW_T: ' + JSON.stringify(r));
r = await g.ev(`(() => { const S = wgnSend, peers = WGN.peers, role = WGN.role, sent = [], res = {};
  try {
    wgnSend = (L, m) => sent.push([L.pid, m]); const A = { pid: 2, heard: performance.now() }, B = { pid: 3, heard: performance.now() }; WGN.peers = [A, B]; WGN.role = 'host'; WGFW.list.length = 0;
    wgnHostMsg(A, { t: 'fw', x: 10, y: 20, d: 'o', s: 77 }); res.first = [WGFW.list.length, sent.filter(q => q[1].t === 'fw').map(q => q[0]).join()];
    wgnHostMsg(A, { t: 'fw', x: 10, y: 20, d: 'o', s: 78 }); res.quick = WGFW.list.length; A.fwT = 0;
    wgnHostMsg(A, { t: 'fw', x: 10, y: 20, d: 'u', s: 79 }); A.fwT = 0; wgnHostMsg(A, { t: 'fw', x: 'NaN', y: 20, d: 'o', s: 80 }); res.bad = WGFW.list.length;
    WGN.role = 'client'; wgnClientMsg({ open: true }, { t: 'fw', x: 30, y: 40, d: 'o', s: 81 }); wgnClientMsg({ open: false }, { t: 'fw', x: 30, y: 40, d: 'o', s: 82 }); res.guest = WGFW.list.map(f => f.s).join();
  } finally { wgnSend = S; WGN.peers = peers; WGN.role = role; WGFW.list.length = 0; } return res; })()`);
ok(r.first[0] === 1 && r.first[1] === '3' && r.quick === 1 && r.bad === 1 && r.guest === '77,81', "the net: the host passes a guest's on to the others, rate-limited and checked; a guest flies the host's: " + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.fireworks = 5; wgAchTick(); return [!!m.ach.fireworks, wgTipLines({ id: 'firework', n: 1 })]; })()`);
ok(r[0] && r[1].includes('FRIENDS SEE IT BURST'), 'FIREWORKS NIGHT, tips: ' + JSON.stringify(r));
const EN = ['FIREWORK', 'FIREWORKS NIGHT', 'SEND FIVE FIREWORKS UP', 'FRIENDS SEE IT BURST'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a night of fireworks at every stage
await g.ev(`(() => { const p = WGS.p, { x, y } = _fw; p.x = x * 16 + 8; p.y = y * 16 + 40; WGS.clock = 0.95; WGS.toast = null; Input.mx = 4; Input.my = 4; WGFW.list.length = 0;
  [[-110, 30, 0.6], [-40, 20, 1.5], [40, 10, 1.9], [120, 30, 2.4], [0, 40, 0.2]].forEach(([dx, dy, k], i) => { wgFwAdd(p.x + dx, p.y + dy, WGS.dim, 11 + i * 1001); WGFW.list[i].t0 = WGS.t - k; WGFW.list[i].pop = 1; }); })(); 0`);
await sleep(30); console.log('fireworks', await g.shot('wg_fireworks.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FIREWORKS OK' : 'FIREWORKS FAIL'); g.close(); process.exit(pass ? 0 : 1);
