// Wildgrove's sled: an icon and a recipe; held on snow it carries the hero quicker than walking, let go it runs on and
// comes to rest; off the snow nothing changes, and the snow keeps its own speed; the tiles sledded count; SNOW DAY;
// runner tracks on the snow behind a sledder instead of footprints, yours and a friend's, fading and then gone; a
// sledder sits on the sled (side on and end on), never a walker or one off the snow; the net messages carry it; tips,
// Hungarian; a look at friends sledding down a snowy slope.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SLED' }, seed: { v: '67' }, look: { skin: 1, hair: 2, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const d = wgIcon('sled').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  const rc = RECIPES.find(x => x.out === 'sled'); return [!!WGI.sled, n, rc && rc.at, rc && Object.keys(rc.in).join()]; })()`);
ok(r[0] && r[1] >= 40 && r[2] === 'bench' && r[3] === 'wood,iron,string', 'icon and recipe: ' + JSON.stringify(r));
// push right half a second, let go a second, then two more; then the same without the sled, and on grass
const go = (gid, sled) => g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 9; j++) for (let i = -4; i < 20; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.${gid}); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; p.food = 20; p.vx = 0; p.vy = 0; p.sit = null; p.buff = {}; WGSD.vx = WGSD.vy = 0; WGSD.marks.length = 0; WGSD.last.clear(); WGFP.list.length = 0;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = ${sled} ? { id: 'sled', n: 1 } : null; WGS.sel = 0;
  const R = wgKey('right'), x0 = p.x, y0 = p.y, res = [];
  const run = (keys, n) => { for (const k of keys) Input.down[k] = true; try { for (let i = 0; i < n; i++) updateWG(1 / 60); } finally { for (const k of keys) Input.down[k] = false; } };
  run([R], 30); res.push(p.x - x0);
  let a = [p.x, p.y]; run([], 60); res.push(Math.hypot(p.x - a[0], p.y - a[1])); a = [p.x, p.y]; run([], 120); res.push(Math.hypot(p.x - a[0], p.y - a[1]));
  res.push(GROUND[G_ID.snow].speed, WGSD.vx === 0 && WGSD.vy === 0 ? 1 : 0, WGSD.marks.filter(m => m.d === d).length, WGSD.marks.every(m => wgGround(w, m.d, Math.floor(m.x0 / 16), Math.floor(m.y0 / 16)) === G_ID.snow) ? 1 : 0, WGFP.list.length);
  p.x = x0; p.y = y0; p.vx = p.vy = 0; return res.map(v => +(+v).toFixed(1)); })()`);
const sled = await go('snow', true), walk = await go('snow', false), grass = await go('grass', true), grass0 = await go('grass', false);
ok(sled[0] / walk[0] > 1.6 && sled[0] / walk[0] < 2, 'on snow quicker than walking: ' + JSON.stringify({ sled, walk }));
ok(sled[1] > 15 && sled[1] < 60 && sled[2] < 4 && sled[4] === 1 && walk[1] < 1, 'let go, a sled runs on, then comes to rest: ' + JSON.stringify(sled));
ok(Math.abs(grass[0] - grass0[0]) < 0.5 && grass[1] < 1 && sled[3] === 1 && grass[5] === 0, 'off the snow nothing changes, the snow keeps its own speed: ' + JSON.stringify({ grass, grass0 }));
ok(sled[5] >= 6 && sled[6] === 1 && sled[7] === 0 && walk[5] === 0 && walk[7] > 0, 'a sled leaves runner tracks and no footprints, a walker footprints: ' + JSON.stringify([sled[5], sled[6], sled[7], walk[5], walk[7]]));
r = await g.ev(`(() => { const m = WGS.world.meta, n = m.stats.sled || 0; m.ach = {}; m.stats.sled = 99; wgAchTick(); const a = !!m.ach.sled; m.stats.sled = 100; wgAchTick(); return [+n.toFixed(1), a, !!m.ach.sled]; })()`);
ok(r[0] >= 3 && r[0] < 8 && !r[1] && r[2], 'the tiles sledded count (walking and the grass do not), SNOW DAY at 100: ' + JSON.stringify(r));
// tracks: a friend's as they sled by, none from one who walks; drawn, fading, then gone
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p;
  const x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); for (let j = -6; j < 9; j++) for (let i = -4; i < 20; i++) wgSetGround(w, d, x + i, y + j, G_ID.snow);
  WGS.inv[0] = null; WGSD.marks.length = 0; WGFP.list.length = 0;
  const f = (pid, sled) => ({ pid, x: p.x, y: p.y + 30 + pid * 20, face: 'r', moving: true, walkT: 0, dim: d, hp: 20, name: '', look: { skin: 0, hair: 0, shirt: 0 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, umb: 0, sled, inv: 0 });
  WGS.remote = [f(2, 1), f(3, 0)];
  for (let i = 0; i < 40; i++) { for (const q of WGS.remote) { q.x += 2; q.walkT += 0.12; } updateWG(1 / 60); }
  const mine = WGSD.marks.filter(m => m.y0 > p.y + 60 && m.y0 < p.y + 80).length, other = WGSD.marks.filter(m => m.y0 > p.y + 82).length;
  const prints = [WGFP.list.filter(m => m.y > p.y + 60 && m.y < p.y + 80).length, WGFP.list.filter(m => m.y > p.y + 82).length];
  WGS.remote = []; WGS.cam.x = p.x + 40; WGS.cam.y = p.y + 40;
  const F = ctx.fillRect.bind(ctx); let n = 0; const C = WG.CS, cx = Math.floor(p.x / 16 / C), cy = Math.floor(p.y / 16 / C);
  const draw = () => { n = 0; ctx.fillRect = function () { if (ctx.fillStyle === PAL.l) n++; return F(...arguments); }; try { wgChunkUpkeep(w, d, cx - 1, cy - 1, cx + 1, cy + 1); } finally { ctx.fillRect = F; } return n; };
  const L = WGSD.marks.slice(), all = draw(); WGSD.marks.length = 0; const none = draw(); WGSD.marks.push(...L);
  WGS.t += WG_SLED_MARK + 1; updateWG(1 / 60); const left = WGSD.marks.length; WGS.t -= WG_SLED_MARK + 1;
  return [mine, other, all - none, left, prints.join()]; })()`);
ok(r[0] >= 8 && r[1] === 0 && r[2] >= 40 && r[3] === 0 && r[4].startsWith('0,') && +r[4].split(',')[1] > 0, "a friend's tracks too (and no footprints), none from a walker; drawn, then gone: " + JSON.stringify(r));
// drawn: on the sled side on and end on (the sled art drawn), never under a walker or off the snow
r = await g.ev(`(() => { const p = WGS.p, w = WGS.world, d = WGS.dim, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = {};
  for (let j = -2; j < 3; j++) for (let i = -2; i < 3; i++) wgSetGround(w, d, x + i, y + j, G_ID.snow); wgSetGround(w, d, x + 2, y, G_ID.grass);
  const D = ctx.drawImage.bind(ctx); let n = 0; ctx.drawImage = function (img) { if (Object.keys(WGA.cache).some(k => /^sled_[lrd]$/.test(k) && WGA.cache[k] === img)) n++; return D(...arguments); };
  try { for (const [face, sled, dx] of [['l', 1, 0], ['r', 1, 0], ['u', 1, 0], ['d', 1, 0], ['l', 0, 0], ['l', 1, 32], ['S', 1, 0]]) {
    n = 0; const f = { pid: 9, x: p.x + dx, y: p.y, face, moving: true, walkT: 1.3, dim: d, hp: 20, name: 'PAL', look: { skin: 0, hair: 1, shirt: 2 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, umb: 0, sled, inv: 0 };
    wgDrawPlayer({ p: f, y: f.y }, WGS.cam.x - 192, WGS.cam.y - 108); res[face + sled + (dx ? 'grass' : '')] = n; }
    WGS.inv[0] = { id: 'sled', n: 1 }; WGS.sel = 0; p.face = 'l'; p.moving = true; n = 0; wgDrawPlayer({ p, y: p.y }, WGS.cam.x - 192, WGS.cam.y - 108); res.me = n; p.moving = false; WGS.inv[0] = null;
    n = 0; wgDrawPlayer({ p, y: p.y }, WGS.cam.x - 192, WGS.cam.y - 108); res.meWalk = n;
  } finally { ctx.drawImage = D; } return res; })()`);
ok(r.l1 === 1 && r.r1 === 1 && r.u1 === 1 && r.d1 === 1 && r.me === 1, 'sledders sit on the sled, side on and end on: ' + JSON.stringify(r));
ok(r.l0 === 0 && r.l1grass === 0 && r.S1 === 0 && r.meWalk === 0, 'never a walker, one seated or one off the snow: ' + JSON.stringify(r));
const net = await (await import('fs')).promises.readFile(new URL('../src/wg_net.js', import.meta.url), 'utf8');
ok(/sled: m\.sl \? 1 : 0/.test(net) && /sled: a\[17\] \? 1 : 0/.test(net) && /sl: typeof wgSledding/.test(net) && /L\.sled \? 1 : 0[,\]]/.test(net) && /wgSledding\(\) \? 1 : 0[,\]]/.test(net) && /sled: L\.sled \? 1 : 0/.test(net), 'the net messages carry the sled');
r = await g.ev(`wgTipLines({ id: 'sled', n: 1 })`);
ok(r.includes('HOLD IT TO SLED ON SNOW') && r.includes('LET GO AND IT RUNS ON'), 'tips: ' + JSON.stringify(r));
const EN = ['SLED', 'SNOW DAY', 'SLED 100 TILES ON SNOW', 'HOLD IT TO SLED ON SNOW', 'LET GO AND IT RUNS ON'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a snowfield with pines, you and two friends sledding, tracks behind you all
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 10, y0 = Math.floor(p.y / 16) - 5;
  for (let j = -2; j < 13; j++) for (let i = -2; i < 24; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.snow); }
  wgSetObj(w, d, x0 + 1, y0 + 1, O_ID.snowpine); wgSetObj(w, d, x0 + 20, y0 + 2, O_ID.snowpine); wgSetObj(w, d, x0 + 19, y0 + 9, O_ID.pine); wgSetObj(w, d, x0 + 3, y0 + 9, O_ID.snowpine);
  WGS.day = 25; WGS.clock = 0.42; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; WGSD.marks.length = 0; WGSD.last.clear(); WGFP.list.length = 0;
  WGS.inv[0] = { id: 'sled', n: 1 }; WGS.sel = 0; p.face = 'r'; p.moving = false;
  const fr = (pid, look, face) => ({ pid, x: 0, y: 0, face, moving: true, walkT: 0, dim: d, hp: 20, name: '', look, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, umb: 0, sled: 1, inv: 0 });
  WGS.remote = [fr(2, { skin: 0, hair: 2, shirt: 4, hat: 3 }, 'd'), fr(3, { skin: 1, hair: 0, shirt: 2 }, 'l')];
  for (let k = 0; k <= 40; k++) { const t = k / 40;
    p.x = (x0 + 3 + t * 8) * 16; p.y = (y0 + 2 + t * 3) * 16; WGS.remote[0].x = (x0 + 14 + Math.sin(t * 6) * 0.8) * 16; WGS.remote[0].y = (y0 + 1 + t * 7) * 16; WGS.remote[1].x = (x0 + 21 - t * 9) * 16; WGS.remote[1].y = (y0 + 7 + t * 1.5) * 16;
    WGS.t += 0.12; wgSledTrack(-1, p, d); for (const q of WGS.remote) wgSledTrack(q.pid, q, d); }
  WGS.cam.x = (x0 + 10) * 16; WGS.cam.y = (y0 + 5) * 16 + 8; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('slope', await g.shot('wg_sled.png'));
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SLED OK' : 'SLED FAIL'); g.close(); process.exit(pass ? 0 : 1);
