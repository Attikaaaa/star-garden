// Wildgrove's bicycle: it has an icon and a recipe; held on dry ground it carries the hero half again as fast, quicker on
// a path but never past the cap, and nothing changes in water (the ground's own speed is always put back); the tiles
// ridden count; USE rings the bell (not twice at once); FREEWHEELING; every hero who rides is drawn on one (not a
// wader), in every direction and in a hat; the net messages carry it; tips, Hungarian; a look at friends riding by.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BIKE' }, seed: { v: '33' }, look: { skin: 1, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const d = wgIcon('bicycle').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  const rc = RECIPES.find(x => x.out === 'bicycle'); return [!!WGI.bicycle, n, rc && rc.at, rc && Object.keys(rc.in).join()]; })()`);
ok(r[0] && r[1] >= 60 && r[2] === 'anvil' && r[3] === 'iron,leather,string', 'icon and recipe: ' + JSON.stringify(r));
// ride a second to the right on grass, on cobbles and in shallow water, with and without the bicycle
const ride = (gid, bike) => g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -3; j < 4; j++) for (let i = -3; i < 16; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.${gid}); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; p.food = 20; p.vx = 0; p.vy = 0; p.sit = null; p.buff = {};
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = ${bike} ? { id: 'bicycle', n: 1 } : null; WGS.sel = 0;
  const x0 = p.x, k = wgKey('right'); Input.down[k] = true; try { for (let i = 0; i < 60; i++) updateWG(1 / 60); } finally { Input.down[k] = false; }
  const dist = p.x - x0; p.x = x0; for (let i = 0; i < 10; i++) updateWG(1 / 60); return [Math.round(dist), GROUND[G_ID.${gid}].speed]; })()`);
const walk = await ride('grass', false), bike = await ride('grass', true), cob0 = await ride('p_cobble', false), cob = await ride('p_cobble', true), wet0 = await ride('shallow', false), wet = await ride('shallow', true);
const q = (a, b) => +(a[0] / b[0]).toFixed(2);
ok(q(bike, walk) > 1.4 && q(bike, walk) < 1.6 && q(cob, walk) > 1.7 && q(cob, walk) < 1.9 && q(cob, cob0) < q(bike, walk) && Math.abs(q(wet, wet0) - 1) < 0.05, 'half again as fast, quicker on a path to the cap, nothing in water: ' + JSON.stringify({ walk, bike, cob0, cob, wet0, wet }));
ok(walk[1] === 1 && bike[1] === 1 && cob[1] === 1.25 && wet[1] === 0.7, 'the ground keeps its own speed');
r = await g.ev(`Math.round(WGS.world.meta.stats.bike || 0)`);
ok(r >= 10, 'the tiles ridden count: ' + r);
r = await g.ev(`(() => { const p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16); wgSetObj(WGS.world, WGS.dim, x, y, 0); WGS.inv[0] = { id: 'bicycle', n: 1 }; WGS.sel = 0;
  WGS.toast = null; const a = wgUse(x, y), t1 = WGS.toast && WGS.toast.msg; WGS.toast = null; const b = wgUse(x, y), t2 = WGS.toast && WGS.toast.msg; WGS.t += 1; const c = wgUse(x, y), t3 = WGS.toast && WGS.toast.msg; return [a, t1, b, t2, c, t3]; })()`);
ok(r[0] && r[1] === 'RING RING!' && r[2] && r[3] === null && r[4] && r[5] === 'RING RING!', 'USE rings the bell, not twice at once: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.bike = 299; wgAchTick(); const a = !!m.ach.bike; m.stats.bike = 300; wgAchTick(); return [a, !!m.ach.bike]; })()`);
ok(!r[0] && r[1], 'FREEWHEELING at 300 tiles: ' + JSON.stringify(r));
// drawn on a bicycle: count the side pieces and the end-on mudguards drawn for a friend who rides, walks or wades, every way
r = await g.ev(`(() => { const p = WGS.p, w = WGS.world, d = WGS.dim, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = {};
  for (let j = -2; j < 3; j++) for (let i = -2; i < 3; i++) wgSetGround(w, d, x + i, y + j, G_ID.grass); wgSetGround(w, d, x + 2, y, G_ID.shallow);
  const B = wgBikeArt, R = rect; let n = 0, m = 0; wgBikeArt = (k) => { n++; return B(k); }; rect = function (x, y, w, h, k) { if (k === 'L') m++; return R(x, y, w, h, k); };
  try { for (const [face, bike, dx, hat] of [['l', 1, 0, 0], ['r', 1, 0, 2], ['u', 1, 0, 0], ['d', 1, 0, 5], ['d', 0, 0, 0], ['l', 1, 32, 0]]) {
    n = 0; m = 0; const f = { pid: 9, x: p.x + dx, y: p.y, face, moving: true, walkT: 1.3, dim: d, hp: 20, name: 'PAL', look: { skin: 0, hair: 1, shirt: 2, hat }, swing: 0, kite: 0, boat: 0, bike, inv: 0 };
    wgDrawPlayer({ p: f, y: f.y }, WGS.cam.x - 192, WGS.cam.y - 108); res[face + bike + (dx ? 'wet' : '') + (hat ? 'hat' : '')] = [n, m]; } } finally { wgBikeArt = B; rect = R; }
  const a = wgRiderSpr({ skin: 0, hair: 1, shirt: 2 }), b = wgRiderSpr({ skin: 0, hair: 1, shirt: 2, hat: 4 }), da = a.getContext('2d').getImageData(0, 0, 18, 8).data, db = b.getContext('2d').getImageData(0, 0, 18, 8).data;
  let diff = 0; for (let i = 0; i < da.length; i++) if (da[i] !== db[i]) diff++; res.hat = diff > 40; return res; })()`);
ok(r.l1.join() === '2,0' && r.r1hat.join() === '2,0' && r.u1.join() === '0,1' && r.d1hat.join() === '0,1' && r.d0.join() === '0,0' && r.l1wet.join() === '0,0' && r.hat, 'riders drawn on a bicycle side on and end on, never a walker or a wader; hats ride too: ' + JSON.stringify(r));
const net = await (await import('fs')).promises.readFile(new URL('../src/wg_net.js', import.meta.url), 'utf8');
ok(/bike: m\.bk \? 1 : 0/.test(net) && /bike: a\[13\] \? 1 : 0/.test(net) && /bk: typeof wgBikeHeld/.test(net) && /L\.bike \? 1 : 0\]/.test(net) && /wgBikeHeld\(\) \? 1 : 0\]\]/.test(net), 'the net messages carry the bicycle');
r = await g.ev(`wgTipLines({ id: 'bicycle', n: 1 })`);
ok(r.includes('HOLD IT TO RIDE ON DRY GROUND') && r.includes('QUICKER STILL ON A PATH') && r.includes('USE RINGS THE BELL'), 'tips: ' + JSON.stringify(r));
const EN = ['BICYCLE', 'FREEWHEELING', 'RIDE A BICYCLE 300 TILES', 'RING RING!', 'HOLD IT TO RIDE ON DRY GROUND', 'QUICKER STILL ON A PATH', 'USE RINGS THE BELL'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: friends riding along a cobbled lane, one in a hat, you with the bell in hand
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 8, y0 = Math.floor(p.y / 16) - 4;
  for (let j = -2; j < 10; j++) for (let i = -2; i < 20; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, j === 4 || i === 12 ? G_ID.p_cobble : G_ID.grass); }
  wgSetObj(w, d, x0 + 2, y0 + 1, O_ID.oak); wgSetObj(w, d, x0 + 16, y0 + 7, O_ID.birch);
  WGS.inv[0] = { id: 'bicycle', n: 1 }; WGS.sel = 0; p.x = (x0 + 4) * 16 + 8; p.y = (y0 + 4) * 16 + 10; p.face = 'r'; p.moving = false; p.look.hat = 1;
  const L = (s, h, sh, hat) => ({ skin: s, hair: h, shirt: sh, hat });
  WGS.remote = [[7, 4, 'r', L(2, 3, 2, 0), 1.3], [10, 4, 'l', L(0, 2, 4, 2), 0.4], [12, 2, 'd', L(1, 0, 0, 0), 0.9], [12, 7, 'u', L(2, 4, 3, 4), 2.1]].map(([x, y, face, look, wt], i) => ({ pid: i + 2, x: (x + x0) * 16 + 8, y: (y + y0) * 16 + 10, face, moving: true, walkT: wt, dim: d, hp: 20, name: '', look, swing: 0, kite: 0, boat: 0, bike: 1, inv: 0 }));
  WGS.cam.x = (x0 + 9) * 16; WGS.cam.y = (y0 + 4) * 16 + 8; WGS.toast = null; WGS.weather = null; WGS.clock = 0.35; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(400); console.log('lane', await g.shot('wg_bike_lane.png'));
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BIKE OK' : 'BIKE FAIL'); g.close(); process.exit(pass ? 0 : 1);
