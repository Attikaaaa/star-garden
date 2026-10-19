// Wildgrove's sparklers: an item, a recipe, an icon; held it is lit (not in water); it burns down after WG_SPARK_T s of
// holding, the next in the stack or the pack takes over, SPARKLE; put away it starts over; sparks and a light at the
// tip, a friend's too (not one in another place, not one without); the net: a guest sends sk, the host lists it at
// index 14 of ps and takes a guest's, a guest reads it; tips, Hungarian; a look at night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SPARK' }, seed: { v: '23' }, look: { skin: 3, hair: 4, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'sparkler'); return [WGI.sparkler && WGI.sparkler.kind, rc && rc.at, rc && rc.n, !!wgIcon('sparkler')]; })()`);
ok(r[0] === 'tool' && r[1] === 'bench' && r[3], 'an item, a recipe, an icon: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -4; j < 5; j++) for (let i = -6; i < 7; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, i === 4 ? G_ID.shallow : G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { sparkler: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 10; window._sp = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'sparkler', n: 1 }; WGS.inv[20] = { id: 'sparkler', n: 2 }; WGS.inv[1] = { id: 'wood', n: 2 }; WGS.sel = 0; WGSP.burn = 0;
  const a = wgSparkHeld(); p.x += 64; const b = wgSparkHeld(); p.x -= 64; WGS.sel = 1; const c = wgSparkHeld(); WGS.sel = 0; return [a, b, c]; })()`);
ok(r[0] && !r[1] && !r[2], 'held it is lit, not in water, not another thing: ' + JSON.stringify(r));
r = await g.ev(`(() => { const res = []; WGS.toast = null; for (let i = 0; i < 60; i++) updateWG(1 / 60); res.push(Math.round(WGSP.burn));
  WGS.sel = 1; updateWG(1 / 60); res.push(WGSP.burn); WGS.sel = 0; WGSP.burn = WG_SPARK_T - 0.01; updateWG(1 / 60); updateWG(1 / 60);
  res.push(WGS.toast && WGS.toast.msg, WGS.inv[0] && WGS.inv[0].id, WGS.inv[0] && WGS.inv[0].n, WGS.inv[20], !!WGS.world.meta.stats.sparkler); return res; })()`);
ok(r[0] === 1 && r[1] === 0, 'it burns while held, and starts over when put away: ' + JSON.stringify(r.slice(0, 2)));
ok(r[2] === 'THE SPARKLER BURNED OUT' && r[3] === 'sparkler' && r[4] === 2 && r[5] === null && r[6], 'burnt down, the next from the pack takes over, SPARKLE: ' + JSON.stringify(r.slice(2)));
r = await g.ev(`(() => { const F = ctx.fillRect.bind(ctx), D = ctx.drawImage.bind(ctx), L = WGR.lights, cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, sparks = new Set(WG_SPARK_COLS.map(k => PAL[k]));
  const draw = (p) => { let n = 0, icons = 0; const l0 = L.length; ctx.fillRect = function () { if (sparks.has(ctx.fillStyle)) n++; return F(...arguments); }; ctx.drawImage = function (img) { if (img === wgIcon('sparkler') || img === WGA.cache.ic_sparkler_l) icons++; return D(...arguments); };
    try { wgDrawPlayer({ p }, cx0, cy0); } finally { ctx.fillRect = F; ctx.drawImage = D; } return [n, icons, L.length - l0]; };
  const q = { pid: 3, x: WGS.p.x + 30, y: WGS.p.y, face: 'l', moving: 0, walkT: 0, dim: WGS.dim, hp: 20, name: 'PIP', look: { skin: 1, hair: 1, shirt: 1 }, spark: 1 };
  WGS.p.face = 'r'; const res = [draw(WGS.p), draw(q)]; q.dim = 'u'; res.push(draw(q)); q.dim = WGS.dim; q.spark = 0; res.push(draw(q)); return res; })()`);
ok(r[0][0] >= 4 && r[0][1] === 1 && r[0][2] === 1, 'sparks and a light at the tip of your sparkler: ' + JSON.stringify(r[0]));
ok(r[1][0] >= 4 && r[1][1] === 1 && r[1][2] === 1 && r[2].join() === '0,0,0' && r[3].join() === '0,0,0', "a friend's lit sparkler shows, not one in another place, not one without: " + JSON.stringify(r.slice(1)));
r = await g.ev(`(() => { const role = WGN.role, S = wgnSend, A = wgnAll, pid = WGN.pid, link = WGN.link, peers = WGN.peers, sent = [], res = {};
  wgnSend = (to, m) => sent.push(m); wgnAll = (m) => sent.push(m);
  try {
    WGN.role = 'client'; WGN.link = { open: true }; WGN.sendT = 0; WGN.pid = 5; wgnUpdate(1 / 60); const pm = sent.find(m => m.t === 'p'); res.guest = pm && pm.sk;
    wgnClientMsg({ open: true }, { t: 'ps', l: [[2, 10, 10, 'r', 0, 0, WGS.dim, 20, 'BOB', { skin: 0, hair: 0, shirt: 0 }, 0, 0, 0, 0, 1], [7, 10, 10, 'r', 0, 0, WGS.dim, 20, 'OLD', { skin: 0, hair: 0, shirt: 0 }, 0, 0, 0, 0]] });
    res.read = WGS.remote.map(q => q.spark);
    WGN.role = 'host'; const L = { pid: 2, heard: performance.now(), name: 'BOB', look: { skin: 0, hair: 0, shirt: 0 } }; WGN.peers = [L]; wgnHostMsg(L, { t: 'p', x: 10, y: 10, face: 'r', mv: 0, wt: 0, dim: WGS.dim, hp: 20, sw: 0, sk: 1 });
    sent.length = 0; WGN.sendT = 0; wgnUpdate(1 / 60); const ps = sent.find(m => m.t === 'ps'); res.host = ps && ps.l.map(a => a[14]); res.remote = WGS.remote.map(q => q.spark);
  } finally { WGN.role = role; wgnSend = S; wgnAll = A; WGN.pid = pid; WGN.link = link; WGN.peers = peers; WGS.remote = []; } return res; })()`);
ok(r.guest === 1 && r.read.join() === '1,0' && r.host && r.host.join() === '1,1' && r.remote.join() === '1', "the net: a guest sends it, the host lists it at index 14 and takes a guest's, a guest reads it: " + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.sparkler = 1; wgAchTick(); return !!m.ach.sparkler; })()`);
ok(r, 'the SPARKLE star');
r = await g.ev(`wgTipLines({ id: 'sparkler', n: 1 })`);
ok(r.includes('SPARKLES WHILE YOU HOLD IT') && r.includes('BURNS FOR 25 SECONDS'), 'tips: ' + JSON.stringify(r));
const EN = ['SPARKLER', 'SPARKLE', 'BURN A SPARKLER DOWN TO THE END', 'THE SPARKLER BURNED OUT', 'SPARKLES WHILE YOU HOLD IT', 'BURNS FOR 25 SECONDS'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a sparkler at night
await g.ev(`(() => { const p = WGS.p, { x, y } = _sp; p.x = x * 16 + 8; p.y = y * 16 + 10; p.face = 'r'; WGS.sel = 0; WGS.inv[0] = { id: 'sparkler', n: 3 }; WGSP.burn = 0; WGS.clock = 0.95; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('sparkler', await g.shot('wg_sparkler.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SPARKLER OK' : 'SPARKLER FAIL'); g.close(); process.exit(pass ? 0 : 1);
