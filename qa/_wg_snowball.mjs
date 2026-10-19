// Wildgrove's snowball fights: USE throws a snowball toward the aim (one from the stack, not twice at once), even out of
// reach; it flies its reach and bursts where it lands, leaving a splat that melts; a tree in the way stops it; it hits a
// friend on the way (A DIRECT HIT!, SNOWBALL FIGHT), and a friend's ball hits you (SPLAT!); drawn in an arc over its
// shadow; the net: the host checks and passes a guest's throw on, a guest's own goes to the host; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SNOW' }, seed: { v: '91' }, look: { skin: 0, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.snow); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { snowfight: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGSB.list.length = 0; WGSB.marks.length = 0; WGSB.t = -1; WGS.remote = [];
  p.x = x * 16 + 8; p.y = y * 16 + 10; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'snowball', n: 3 }; WGS.sel = 0; Input.lastAim = 'pad'; WGS.aim = 0;
  const run = (n) => { const seen = new Set(); for (let i = 0; i < n; i++) { updateWG(1 / 60); if (WGS.toast) seen.add(WGS.toast.msg); } return seen; };
  const fr = (pid, dx, dy) => ({ pid, x: p.x + dx, y: p.y + dy, face: 'l', moving: false, walkT: 0, dim: d, hp: 20, name: 'PIP', look: { skin: 1, hair: 2, shirt: 0 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, inv: 0 });`;
let r = await g.ev(`(() => { ${setup} const res = [];
  res.push(wgUse(x + 1, y), WGS.inv[0].n, WGSB.list.length, wgUse(x + 1, y), WGS.inv[0].n);
  run(6); const b = WGSB.list[0], at = wgSnowAt(b, WGS.t - b.t0); res.push(Math.round(at[0] - p.x) > 10, b.r);
  run(60); res.push(WGSB.marks.length, WGSB.marks[0] && Math.round(WGSB.marks[0].x - p.x), WGSB.list.length);
  WGS.t += WG_SNOW_MARK + 1; run(1); res.push(WGSB.marks.length); return res; })()`);
ok(r[0] === true && r[1] === 2 && r[2] === 1 && r[3] === true && r[4] === 2, 'USE throws one from the stack, not twice at once: ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] && r[6] === 112 && r[7] === 1 && r[8] === 112 && r[9] === 0 && r[10] === 0, 'it flies its reach and bursts there, a splat that melts: ' + JSON.stringify(r.slice(5)));
r = await g.ev(`(() => { ${setup} const res = [];
  wgSetObj(w, d, x + 3, y, O_ID.oak); WGS.inv[0].n = 3; wgSnowThrow(); res.push(WGSB.list[0].r); wgSetObj(w, d, x + 3, y, 0); run(60);
  WGS.remote = [fr(2, 50, 0)]; WGS.t += 0.4; let seen = new Set(); WGS.aim = 0; wgSnowThrow(); seen = run(30); res.push(seen.has('A DIRECT HIT!'), !!w.meta.stats.snowhit, WGSB.marks.length && Math.round(WGSB.marks[WGSB.marks.length - 1].x - p.x));
  wgAchTick(); w.meta.ach = {}; wgAchTick(); res.push(!!w.meta.ach.snowfight);
  w.meta.stats.snowhit = 0; WGS.remote = [fr(2, -60, 0)]; wgSnowAdd(p.x - 60, p.y, 0, 112, d, 2); seen = run(40); res.push(seen.has('SPLAT!'), !!w.meta.stats.snowhit);
  WGS.remote = []; return res; })()`);
ok(r[0] > 30 && r[0] < 48, 'a tree in the way stops it: ' + r[0]);
ok(r[1] && r[2] && r[3] > 40 && r[3] < 56 && r[4], 'it hits a friend on the way: A DIRECT HIT!, SNOWBALL FIGHT: ' + JSON.stringify(r.slice(1, 5)));
ok(r[5] && !r[6], "a friend's ball hits you: SPLAT!, no star for being hit: " + JSON.stringify(r.slice(5)));
r = await g.ev(`(() => { ${setup} const n0 = WGSB.list.length; Input.lastAim = 'mouse'; Input.mx = 380; Input.my = 20; WGS.cam.x = p.x; WGS.cam.y = p.y; Input.rHit = true; updateWG(1 / 60); Input.rHit = false;
  const res = [WGS.target, WGSB.list.length - n0, WGS.inv[0] && WGS.inv[0].n]; Input.mx = 4; Input.my = 4; Input.lastAim = 'pad'; return res; })()`);
ok(r[0] === null && r[1] === 1 && r[2] === 2, 'with the aim out of reach it is thrown all the same: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const role = WGN.role, pid = WGN.pid, A = wgnAll, S = wgnSend, sent = [], L = { pid: 2, x: p.x + 30, y: p.y, dim: d }, res = {};
  wgnAll = (m, ex) => sent.push(['all', m.t, m.pid, m.r, ex === L ? 'L' : ex === null ? 'none' : '?']); wgnSend = (to, m) => sent.push(['send', m.t, m.r]);
  try {
    WGN.role = 'host'; wgnHostMsg(L, { t: 'snow', x: p.x + 30, y: p.y, a: 3.14, r: 500, d }); wgnHostMsg(L, { t: 'snow', x: p.x + 30, y: p.y, a: 3.14, r: 60, d }); res.host = [WGSB.list.length, JSON.stringify(sent)];
    sent.length = 0; L.snowT = 0; wgnHostMsg(L, { t: 'snow', x: p.x + 300, y: p.y, a: 0, r: 60, d }); L.snowT = 0; wgnHostMsg(L, { t: 'snow', x: p.x + 30, y: p.y, a: 'x', r: 60, d }); L.snowT = 0; wgnHostMsg(L, { t: 'snow', x: p.x + 30, y: p.y, a: 0, r: 60, d: 'u' }); res.bad = sent.length;
    sent.length = 0; WGN.role = 'client'; WGN.pid = 3; WGS.t += 1; wgSnowThrow(); res.guest = JSON.stringify(sent);
    WGSB.list.length = 0; wgnClientMsg({}, { t: 'snow', pid: 0, x: p.x - 40, y: p.y, a: 0, r: 80, d }); wgnClientMsg({}, { t: 'snow', pid: 3, x: p.x, y: p.y, a: 0, r: 80, d }); res.seen = WGSB.list.map(b => b.pid).join();
  } finally { WGN.role = role; WGN.pid = pid; wgnAll = A; wgnSend = S; WGSB.list.length = 0; } return res; })()`);
ok(r.host[0] === 1 && r.host[1] === '[["all","snow",2,112,"L"]]' && r.bad === 0, 'the host flies a guest throw and passes it on (its reach capped), rate-limited; odd ones dropped: ' + JSON.stringify([r.host, r.bad]));
ok(r.guest === '[["send","snow",112]]' && r.seen === '0', "a guest's own goes to the host; the host's comes back to a guest: " + JSON.stringify([r.guest, r.seen]));
r = await g.ev(`(() => { ${setup} const D = ctx.drawImage.bind(ctx), S = shadow; let n = 0, s = 0; wgSnowThrow(); run(10);
  ctx.drawImage = function (img) { if (img === wgSnowArt()) n++; return D(...arguments); }; shadow = function () { s++; return S(...arguments); };
  try { wgDrawAmbient(WGS.cam.x - 192, WGS.cam.y - 108); } finally { ctx.drawImage = D; shadow = S; } return [n, s >= 1, wgTipLines({ id: 'snowball', n: 1 })]; })()`);
ok(r[0] === 1 && r[1] && r[2].includes('USE THROWS IT'), 'drawn in flight over its shadow; tips: ' + JSON.stringify(r));
const EN = ['SNOWBALL FIGHT', 'HIT A FRIEND WITH A SNOWBALL', 'SPLAT!', 'A DIRECT HIT!', 'USE THROWS IT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a snowball fight among friends, a snow wall to hide behind
await g.ev(`(() => { ${setup} for (let i = -2; i <= 1; i++) wgSetObj(w, d, x + 4, y + i, O_ID.w_snow); wgSetObj(w, d, x - 6, y - 4, O_ID.pine); wgSetObj(w, d, x + 8, y + 4, O_ID.pine); wgSetObj(w, d, x - 3, y + 4, O_ID.snowman || 0);
  WGS.remote = [fr(2, 104, -20), fr(4, 96, 40)]; WGS.remote[0].face = 'l'; WGS.remote[1].face = 'l'; WGS.remote[1].name = 'MAY'; WGS.remote[1].look = { skin: 2, hair: 4, shirt: 1, hat: 3 };
  p.face = 'r'; WGS.inv[0].n = 9; WGS.day = 26; WGS.clock = 0.45; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null;
  wgSnowAdd(p.x, p.y, 0.45, 112, d, -1); WGSB.list[0].t0 = WGS.t - 0.15; wgSnowAdd(p.x + 96, p.y + 40, 3.05, 112, d, 4); WGSB.list[1].t0 = WGS.t - 0.2;
  for (const [dx, dy] of [[-30, 20], [20, -40], [-60, -10]]) WGSB.marks.push({ x: p.x + dx, y: p.y + dy, d, t: WGS.t }); Input.mx = 4; Input.my = 4; WGS.cam.x = p.x + 40; WGS.cam.y = p.y; })(); 0`);
await sleep(30); console.log('snowball', await g.shot('wg_snowball.png'));
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SNOWBALL OK' : 'SNOWBALL FAIL'); g.close(); process.exit(pass ? 0 : 1);
