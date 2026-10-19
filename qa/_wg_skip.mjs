// Wildgrove's skipping stones: USE a stone on water throws it (one stone spent), not on grass and not anything else;
// the path is the same from the same throw, its first touch at the aim, hops growing shorter; it sinks after its skips
// or rests on the far shore; a ring spreads at each touch and the stone flies over its shadow; the count is told when
// it stops, five skips light STONE SKIPPER; the net: the host checks a guest's stone (beside that guest, not twice in a
// breath), passes it on, a far one is not flown; another world starts clean; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SKIP' }, seed: { v: '19' }, look: { skin: 1, hair: 0, shirt: 4 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 60); 0`);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -5; j < 6; j++) for (let i = -4; i < 14; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, i >= 1 && i <= 9 && Math.abs(j) <= 3 ? G_ID.deep : G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { skip: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 10; window._sk = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'stone', n: 9 }; WGS.inv[1] = { id: 'wood', n: 3 }; WGS.sel = 0; WGSK.list.length = 0; WGS.weather = null; WGS.wxT = 9999; })(); 0`);
let r = await g.ev(`(() => { const { x, y } = _sk, res = []; WGS.sel = 1; res.push(wgUse(x + 2, y), WGSK.list.length); WGS.sel = 0; res.push(wgUse(x - 2, y), WGSK.list.length);
  res.push(wgUse(x + 2, y), WGSK.list.length, WGS.inv[0].n); return res; })()`);
ok(!r[0] && r[1] === 0 && !r[2] && r[3] === 0 && r[4] && r[5] === 1 && r[6] === 8, 'USE a stone on water throws it, one stone spent; not on grass, not wood: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _sk, w = WGS.world, d = WGS.dim, x0 = x * 16 + 8, y0 = y * 16 + 10, A = wgSkipPath(w, d, x0, y0, 0, 4, 40), B = wgSkipPath(w, d, x0, y0, 0, 4, 40), C = wgSkipPath(w, d, x0, y0, 0, 7, 70);
  const gaps = A.pts.map((q, i) => i ? q[0] - A.pts[i - 1][0] : q[0] - x0);
  return [JSON.stringify(A) === JSON.stringify(B), A.pts[0][0] - x0, gaps.every((v, i) => !i || v < gaps[i - 1] || i === 1), A.skips, A.sink, A.pts.length, C.sink, C.skips, C.pts[C.pts.length - 1][3]]; })()`);
ok(r[0] && r[1] === 40 && r[2] && r[3] === 4 && r[4] && r[5] === 5, 'the same path from the same throw, first touch at the aim, shorter hops, it sinks after its skips: ' + JSON.stringify(r.slice(0, 6)));
ok(!r[6] && r[7] >= 3 && r[8] === false, 'a long run comes to rest on the far shore: ' + JSON.stringify(r.slice(6)));
r = await g.ev(`(() => { const L = WGSK.list, s = L[0], F = ctx.fillRect.bind(ctx), D = ctx.drawImage.bind(ctx), cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, frame = (T) => {
    let rings = 0, stone = 0, shadows = 0; s.t0 = WGS.t - T; ctx.fillRect = function () { if (ctx.fillStyle === PAL.C) rings++; if (ctx.fillStyle === PAL.m) stone++; return F(...arguments); };
    ctx.drawImage = function () { shadows++; return D(...arguments); }; try { wgDrawAmbient(cx0, cy0); } finally { ctx.fillRect = F; ctx.drawImage = D; } return [rings > 0, stone > 0, shadows > 0]; };
  return [frame(s.tm[1] / 2), frame(s.tm[1] + 0.05), s.skips]; })()`);
ok(!r[0][0] && r[0][1] && r[0][2] && r[1][0], 'the stone flies over its shadow, a ring spreads where it touches: ' + JSON.stringify(r));
r = await g.ev(`(() => { const S = WGSK.list[0], res = []; WGS.toast = null; S.t0 = WGS.t - S.tm[S.tm.length - 1] - 0.01; updateWG(1 / 60); res.push(WGS.toast && WGS.toast.msg, S.skips);
  WGSK.list.length = 0; const st = WGS.world.meta.stats; st.skip5 = 0; wgSkipAdd(100, 100, 0, 5, 40, WGS.dim, true); const T = WGSK.list[0]; T.skips = 5; T.t0 = WGS.t - 99; updateWG(1 / 60);
  res.push(!!st.skip5, WGSK.list.length); WGSK.list.length = 0; return res; })()`);
const want = r[1] > 1 ? r[1] + ' SKIPS!' : r[1] ? 'ONE SKIP!' : 'PLOP!';
ok(r[0] === want && r[2] && r[3] === 0, 'the count is told when it stops, five skips light the star, then it goes: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.skip5 = 1; wgAchTick(); return !!m.ach.skip; })()`);
ok(r, 'STONE SKIPPER');
r = await g.ev(`(() => { const role = WGN.role, A = wgnAll, sent = [], { x, y } = _sk, L = { pid: 2, dim: WGS.dim, x: x * 16 + 8, y: y * 16 + 10 }, m = { t: 'skip', x: L.x, y: L.y, a: 0, n: 3, l: 30, d: WGS.dim }, res = {};
  wgnAll = (q, ex) => sent.push([q.t, q.n, ex === L]); WGSK.list.length = 0;
  try { WGN.role = 'host'; wgnHostMsg(L, m); wgnHostMsg(L, m); res.host = [JSON.stringify(sent), WGSK.list.length];
    sent.length = 0; L.skipT = 0; wgnHostMsg(L, Object.assign({}, m, { x: L.x + 300 })); L.skipT = 0; wgnHostMsg(L, Object.assign({}, m, { d: 'u' })); L.skipT = 0; wgnHostMsg(L, Object.assign({}, m, { n: 99, a: 'x' }));
    res.bad = [sent.length, WGSK.list.length];
    WGN.role = 'client'; WGSK.list.length = 0; wgnClientMsg({}, Object.assign({}, m, { x: L.x + 4000 })); res.far = WGSK.list.length; wgnClientMsg({}, m); res.near = WGSK.list.length;
  } finally { WGN.role = role; wgnAll = A; }
  WGS.world = Object.assign({}, WGS.world); updateWG(1 / 60); res.clean = WGSK.list.length; return res; })()`);
ok(r.host[0] === JSON.stringify([['skip', 3, true]]) && r.host[1] === 1, "the host flies a guest's stone and passes it on, not twice in a breath: " + JSON.stringify(r.host));
ok(r.bad[0] === 0 && r.bad[1] === 1 && r.far === 0 && r.near === 1 && r.clean === 0, 'a stone not from beside its guest, in another place or broken is dropped; a far one is not flown; another world starts clean: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'stone', n: 1 })`);
ok(r.includes('USE IT ON WATER TO SKIP IT'), 'tips: ' + JSON.stringify(r));
const EN = ['STONE SKIPPER', 'SKIP A STONE FIVE TIMES', '4 SKIPS!', 'ONE SKIP!', 'PLOP!', 'USE IT ON WATER TO SKIP IT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]) && r[2] === '4 KACSA!', 'Hungarian: ' + JSON.stringify(r));
// a look: a stone mid-run over the pond
await g.ev(`(() => { const { x, y } = _sk, p = WGS.p; WGS.world = WGSK.w; p.x = x * 16 + 8; p.y = y * 16 + 10; p.face = 'r'; WGS.cam.x = x * 16 + 72; WGS.cam.y = y * 16; WGS.clock = 0.4; WGS.toast = null;
  WGSK.list.length = 0; wgSkipAdd(p.x, p.y, 0.12, 6, 36, WGS.dim, false); const s = WGSK.list[0]; s.t0 = WGS.t - s.tm[3] - 0.12; s.own = false; })(); 0`);
await sleep(30); console.log('skip', await g.shot('wg_skip.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SKIP OK' : 'SKIP FAIL'); g.close(); process.exit(pass ? 0 : 1);
