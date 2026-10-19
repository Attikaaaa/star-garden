// Wildgrove's umbrellas: four of them, made at a bench with petals of their colour; held, one is up over the hero's
// head in place of the held tool (not while seated), with no rain falling under it; in the rain drops bounce on it;
// a friend's shows too, their name over it; walking in the rain under one counts toward SINGING IN THE RAIN; the net
// carries it (`ub` in 'p', index 16 of 'ps'), an odd value dropped; tips, Hungarian; a look in the rain.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'RAIN' }, seed: { v: '64' }, look: { skin: 1, hair: 2, shirt: 5 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -7; j < 8; j++) for (let i = -13; i < 25; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { umbrella: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; p.sit = null; p.inv = 0; p.hidden = false;
  p.x = x * 16 + 8; p.y = y * 16 + 10; p.face = 'd'; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'umbrella_b', n: 1 }; WGS.sel = 0; wgOpt().wx = 1;
  WGS.cam.x = p.x; WGS.cam.y = p.y; const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0);
  const rain = (on) => { WGS.weather = on ? { kind: 'rain', dark: 0.12, wind: 0.6, storm: false } : null; WGS.wxT = 9999; };
  const fr = (pid, dx, dy, umb) => ({ pid, x: p.x + dx, y: p.y + dy, face: 'd', moving: false, walkT: 0, dim: d, hp: 20, name: 'PIP', look: { skin: 1, hair: 2, shirt: 0 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, umb, inv: 0 });`;
let r = await g.ev(`(() => { const res = []; for (const [id, , petal] of WG_UMB) { const R = RECIPES.find(q => q.out === id); res.push([WGI[id].kind, !!wgIcon(id), R && R.at, R && R.in[petal]]); } return res; })()`);
ok(r.length === 4 && r.every(a => a[0] === 'tool' && a[1] && a[2] === 'bench' && a[3] === 2), 'four umbrellas, made at a bench with petals of their colour: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const D = ctx.drawImage.bind(ctx), res = {}; let art = 0, icon = 0;
  ctx.drawImage = function (img) { if (img === wgUmbArt(3)) art++; if (img === wgIcon('umbrella_b')) icon++; return D(...arguments); };
  try {
    res.held = [1, 2, 3, 4].map(k => { WGS.inv[0] = { id: WG_UMB[k - 1][0], n: 1 }; return wgUmbHeld(); }); WGS.inv[0] = { id: 'umbrella_b', n: 1 };
    WGUB.shelter.length = 0; wgDrawPlayer({ p }, cx0, cy0); res.up = [art, icon, JSON.stringify(WGUB.shelter), sx, sy];
    art = 0; WGUB.shelter.length = 0; p.sit = { tx: x, ty: y, dim: d, t: 0 }; wgDrawPlayer({ p }, cx0, cy0); res.sit = [art, WGUB.shelter.length]; p.sit = null;
    WGS.inv[0] = { id: 'torch', n: 1 }; art = 0; wgDrawPlayer({ p }, cx0, cy0); res.none = [art, WGUB.shelter.length];
  } finally { ctx.drawImage = D; WGUB.shelter.length = 0; } return res; })()`);
ok(JSON.stringify(r.held) === '[1,2,3,4]' && r.up[0] === 1 && r.up[1] === 0 && r.up[2] === JSON.stringify([[r.up[3] - 8, r.up[3] + 9, r.up[4] - 27, r.up[4] + 1]]), 'held, it is up over the head in place of the held tool, its shelter noted: ' + JSON.stringify(r.up));
ok(r.sit[0] === 0 && r.sit[1] === 0 && r.none[0] === 0 && r.none[1] === 0, 'not while seated, not with something else in hand: ' + JSON.stringify([r.sit, r.none]));
r = await g.ev(`(() => { ${setup} rain(true); const R = rect, res = {}; let hits = 0, all = 0, splash = 0;
  try {
    const S = [sx - 8, sx + 9, sy - 27, sy + 1];
    rect = function (a, b, c, e) { all++; if (a + c > S[0] && a < S[1] && b + e > S[2] && b < S[3]) hits++; return R(...arguments); };
    const big = [-400, 800, -400, 800]; WGUB.shelter.push(big); wgDrawWeatherFX(); res.big = all; all = 0;
    for (let i = 0; i < 40; i++) { WGS.t += 0.05; WGUB.shelter.length = 0; WGUB.shelter.push(S.slice()); wgDrawWeatherFX(); } res.under = hits; res.all = all; res.left = WGUB.shelter.length;
    rect = function (a, b, c, e, k) { if ((k === 'C' || k === 'w' || k === 'c') && a >= sx - 9 && a <= sx + 9 && b >= sy - 40 && b <= sy - 10) splash++; return R(...arguments); };
    for (let i = 0; i < 30; i++) { WGS.t += 0.05; wgDrawPlayer({ p }, cx0, cy0); } res.splash = splash; splash = 0;
    rain(false); for (let i = 0; i < 30; i++) { WGS.t += 0.05; wgDrawPlayer({ p }, cx0, cy0); } res.dry = splash;
  } finally { rect = R; WGUB.shelter.length = 0; rain(false); } return res; })()`);
ok(r.big === 0 && r.under === 0 && r.all > 400 && r.left === 0, 'no rain falls under an umbrella (the shelter is used up each frame): ' + JSON.stringify(r));
ok(r.splash > 20 && r.dry === 0, 'in the rain drops bounce on it and drip from its rim; none when dry: ' + JSON.stringify([r.splash, r.dry]));
r = await g.ev(`(() => { ${setup} const D = ctx.drawImage.bind(ctx), T = wgRawText, res = {}; let art = 0, names = [];
  ctx.drawImage = function (img) { if (img === wgUmbArt(4)) art++; return D(...arguments); }; wgRawText = function (s, a, b) { names.push(b - sy); return T(...arguments); };
  try {
    const q = fr(2, 0, 0, 4); wgDrawPlayer({ p: q }, cx0, cy0); res.up = [art, names.join()]; art = 0; names = [];
    q.face = 'S'; wgDrawPlayer({ p: q }, cx0, cy0); res.sit = [art, names.join()]; q.face = 'd'; q.umb = 0; art = 0; names = []; wgDrawPlayer({ p: q }, cx0, cy0); res.none = [art, names.join()];
  } finally { ctx.drawImage = D; wgRawText = T; WGUB.shelter.length = 0; } return res; })()`);
ok(r.up[0] === 1 && r.up[1] === '-43' && r.sit[0] === 0 && r.sit[1] !== '-43' && r.none[0] === 0 && r.none[1] === '-32', "a friend's shows too, their name over it: " + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = []; const walk = (n) => { for (let i = 0; i < n; i++) { p.x += 2; updateWG(1 / 60); } };
  rain(false); updateWG(1 / 60); walk(30); res.push(w.meta.stats.umbrella || 0);
  rain(true); walk(64); res.push(w.meta.stats.umbrella); p.x += 80; updateWG(1 / 60); res.push(w.meta.stats.umbrella);
  WGS.inv[0] = { id: 'torch', n: 1 }; walk(20); res.push(w.meta.stats.umbrella); WGS.inv[0] = { id: 'umbrella_b', n: 1 };
  w.meta.ach = {}; wgAchTick(); res.push(!!w.meta.ach.umbrella); w.meta.stats.umbrella = WG_UMB_WALK; wgAchTick(); res.push(!!w.meta.ach.umbrella); rain(false); return res; })()`);
ok(r[0] === 0 && r[1] > 7.5 && r[1] < 9 && r[2] === r[1] && r[3] === r[1], 'walking in the rain under one counts the tiles (not dry, not a jump, not without it): ' + JSON.stringify(r.slice(0, 4)));
ok(r[4] === false && r[5] === true, 'SINGING IN THE RAIN after ' + 120 + ' tiles: ' + JSON.stringify(r.slice(4)));
r = await g.ev(`(() => { ${setup} const role = WGN.role, link = WGN.link, pid = WGN.pid, S = wgnSend, sent = [], res = {};
  wgnSend = (to, m) => sent.push(m);
  try {
    WGN.role = 'client'; WGN.link = { open: true }; WGN.pid = 3; WGN.sendT = 0; wgnUpdate(0.016); const pm = sent.find(m => m.t === 'p'); res.p = pm && pm.ub;
    WGN.role = 'host'; const L = { pid: 2, x: p.x, y: p.y, dim: d, heard: performance.now() };
    wgnHostMsg(L, { t: 'p', x: p.x, y: p.y, face: 'd', mv: 0, wt: 0, dim: d, hp: 20, sw: 0, ub: 3 }); res.host = L.umb;
    wgnHostMsg(L, { t: 'p', x: p.x, y: p.y, face: 'd', mv: 0, wt: 0, dim: d, hp: 20, sw: 0, ub: 9 }); res.odd = L.umb;
    WGN.role = 'client'; wgnClientMsg({ open: true }, { t: 'ps', l: [[0, p.x + 20, p.y, 'd', 0, 0, d, 20, 'HOST', { skin: 0, hair: 0, shirt: 0 }, 0, 0, 0, 0, 0, 0, 4]] }); res.ps = WGS.remote[0] && WGS.remote[0].umb;
    wgnClientMsg({ open: true }, { t: 'ps', l: [[0, p.x + 20, p.y, 'd', 0, 0, d, 20, 'HOST', { skin: 0, hair: 0, shirt: 0 }, 0, 0, 0, 0, 0, 0, 'x']] }); res.psOdd = WGS.remote[0] && WGS.remote[0].umb;
  } finally { WGN.role = role; WGN.link = link; WGN.pid = pid; wgnSend = S; WGS.remote = []; } return res; })()`);
ok(r.p === 3 && r.host === 3 && r.odd === 0 && r.ps === 4 && r.psOdd === 0, "the net carries it: 'ub' in 'p', index 16 of 'ps'; an odd one dropped: " + JSON.stringify(r));
const EN = ['RED UMBRELLA', 'YELLOW UMBRELLA', 'BLUE UMBRELLA', 'PURPLE UMBRELLA', 'SINGING IN THE RAIN', 'WALK IN THE RAIN UNDER AN UMBRELLA', 'KEEPS THE RAIN OFF YOUR HEAD'];
r = await g.ev(`(() => { const t = wgTipLines({ id: 'umbrella_r', n: 1 }); Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return [t, a]; })()`);
ok(r[0].includes('KEEPS THE RAIN OFF YOUR HEAD') && r[1].every((s, i) => s !== EN[i]), 'tips; Hungarian: ' + JSON.stringify(r));
// a look: a rainy afternoon, two friends under umbrellas by a pond
await g.ev(`(() => { ${setup} for (let j = 2; j < 5; j++) for (let i = -9; i < -3; i++) wgSetGround(w, d, x + i, y + j, (i === -9 || i === -4 || j === 4) ? G_ID.shallow : G_ID.deep);
  for (const [i, j, o] of [[-7, -4, 'oak'], [6, -4, 'birch'], [9, 2, 'oak'], [3, 4, 'flower_y'], [-2, -3, 'flower_b'], [4, -2, 'tallgrass'], [-11, -1, 'oak']]) wgSetObj(w, d, x + i, y + j, O_ID[o]);
  WGS.remote = [fr(2, 30, 6, 1)]; WGS.remote[0].face = 'l'; WGS.remote[0].name = 'MAY'; WGS.remote[0].look = { skin: 2, hair: 4, shirt: 1 };
  p.face = 'r'; rain(true); WGS.day = 3; WGS.clock = 0.55; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x + 4; WGS.cam.y = p.y - 6; })(); 0`);
await sleep(120); console.log('umbrella', await g.shot('wg_umbrella.png'));
await g.ev(`WGS.remote = []; WGS.weather = null; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'UMBRELLA OK' : 'UMBRELLA FAIL'); g.close(); process.exit(pass ? 0 : 1);
