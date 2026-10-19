// Wildgrove's hedgehogs: one lives in about one grassy cell in five, only on grass-like ground with nothing solid; none
// by day, in the rain or in winter; as night falls they come out one by one and are slotted into the world's depth
// order; one trots about its home and sniffs; a hero close by curls it into a ball until they go, lighting HEDGEHOG
// HELLO; by morning they are gone; none with the ambient life off, none below ground; Hungarian; a look at dusk.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'HEDGEHOG' }, seed: { v: '52' }, look: { skin: 1, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -12; j < 13; j++) for (let i = -20; i < 21; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { hog: 1 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; wgOpt().amb = 1; WGS.cam.x = p.x; WGS.cam.y = p.y;
  WGHH.spots.clear(); WGHH.live.clear(); WGS.weather = null; WGS.wxT = 9999; WGS.day = 9; WGS.clock = 0.5;
  const run = (s) => { for (let i = 0; i < s * 60; i++) { WGS.cam.x = p.x; WGS.cam.y = p.y; updateWG(1 / 60); } };`;
let r = await g.ev(`(() => { ${setup} let n = 0, cells = 0, bad = 0;
  for (let cy = -15; cy < 15; cy++) for (let cx = -15; cx < 15; cx++) { if (!WG_HOG_GROUNDS.includes(GROUND[wgGround(w, 'o', Math.floor((cx + 0.5) * WG_HOG_CELL / 16), Math.floor((cy + 0.5) * WG_HOG_CELL / 16))].id)) continue; cells++; const s = wgHogSpot(cx, cy); if (!s) continue; n++; if (!wgHogFree(s.hx, s.hy) || s.thr < 0.15 || s.thr > 0.75) bad++; }
  return [n, cells, bad]; })()`);
ok(r[2] === 0 && r[0] / r[1] > 0.12 && r[0] / r[1] < 0.24, 'one in about one grassy cell in five, only on grass with nothing solid: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = []; WGS.clock = 0.5; run(2); res.push(WGHH.live.size);
  WGS.clock = 0.97; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; run(2); res.push(WGHH.live.size); WGS.weather = null;
  WGS.day = 25; run(2); res.push(wgSeason(), WGHH.live.size); WGS.day = 9;
  for (let k = 0; k < 6 && ![...Array(9)].some((_, i) => wgHogSpot(Math.floor(p.x / WG_HOG_CELL) - 1 + i % 3, Math.floor(p.y / WG_HOG_CELL) - 1 + Math.floor(i / 3))); k++) p.x += WG_HOG_CELL * 3; // a place with a hedgehog about
  const seen = []; for (const c of [0.78, 0.8, 0.82, 0.84, 0.86, 0.9]) { WGS.clock = c; run(0.5); seen.push(WGHH.live.size); }
  const ents = wgEntities(p.x - 300, p.y - 200, p.x + 300, p.y + 200).filter(e => e.draw === wgHogDraw).length; res.push(seen, ents);
  return res; })()`);
ok(r[0] === 0 && r[1] === 0 && r[2] === 3 && r[3] === 0, 'none by day, in the rain or in winter: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4][0] < r[4][5] && r[4].every((n, i) => !i || n >= r[4][i - 1]) && r[4][5] >= 1 && r[5] === r[4][5], 'as night falls they come out one by one, slotted into the depth order: ' + JSON.stringify(r.slice(4)));
r = await g.ev(`(() => { ${setup} WGS.clock = 0.97; run(0.5); const c = [...WGHH.live.values()][0]; if (!c) return null; p.x = c.hx + 90; p.y = c.hy; c.born = WGS.t - 1;
  const st = new Set(); let far = 0; for (let i = 0; i < 20 * 60; i++) { run(1 / 60); st.add(c.st); far = Math.max(far, Math.hypot(c.x - c.hx, c.y - c.hy)); }
  const res = [[...st].sort().join(), Math.round(far)];
  p.x = c.x + 14; p.y = c.y; run(0.3); res.push(c.st, !!w.meta.stats.hog); const x0 = c.x; run(3); res.push(c.st, c.x === x0);
  p.x += 120; run(1); res.push(c.st); run(2.5); res.push(c.st); w.meta.ach = {}; wgAchTick(); res.push(!!w.meta.ach.hog); return res; })()`);
ok(r && r[0] === 'sniff,trot' && r[1] > 4 && r[1] < 32, 'one trots about its home and sniffs: ' + JSON.stringify(r && r.slice(0, 2)));
ok(r && r[2] === 'ball' && r[3] && r[4] === 'ball' && r[5] && r[6] === 'ball' && r[7] !== 'ball' && r[8], 'a hero close by curls it into a ball until they go, lighting HEDGEHOG HELLO: ' + JSON.stringify(r && r.slice(2)));
r = await g.ev(`(() => { ${setup} WGS.clock = 0.97; run(0.5); const res = [WGHH.live.size]; WGS.clock = 0.2; run(1); res.push(WGHH.live.size);
  WGS.clock = 0.97; run(0.5); res.push(WGHH.live.size > 0); wgOpt().amb = 0; run(0.1); res.push(WGHH.live.size); wgOpt().amb = 1; run(0.2); WGS.dim = 'u'; run(0.1); res.push(WGHH.live.size, wgEntities(-1e5, -1e5, 1e5, 1e5).filter(e => e.draw === wgHogDraw).length); WGS.dim = 'o'; return res; })()`);
ok(r[0] > 0 && r[1] === 0, 'by morning they are gone: ' + JSON.stringify(r.slice(0, 2)));
ok(r[2] && r[3] === 0 && r[4] === 0 && r[5] === 0, 'none with the ambient life off, none below ground: ' + JSON.stringify(r.slice(2)));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ['HEDGEHOG HELLO', 'MEET A HEDGEHOG ON A NIGHT WALK'].map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r[0] !== 'HEDGEHOG HELLO' && r[1] !== 'MEET A HEDGEHOG ON A NIGHT WALK', 'Hungarian: ' + JSON.stringify(r));
// a look at dusk: a garden by a lamp post, a hedgehog trotting, one sniffing, one curled up by the hero
await g.ev(`(() => { ${setup} for (const [i, j, o] of [[-7, -4, 'oak'], [7, -4, 'birch'], [-3, -3, 'lamppost'], [4, 3, 'hedge'], [-6, 2, 'fern'], [2, -3, 'flower_w'], [6, 1, 'tallgrass']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGS.clock = 0.84; WGS.toast = null; for (let i = 0; i < 36; i++) WGS.inv[i] = null; p.face = 'l'; Input.mx = 4; Input.my = 4; WGS.clock = 0.97; run(0.3); WGS.clock = 0.84;
  const L = [...WGHH.live.values()], put = (c, dx, dy, st, flip) => { c.hx = c.x = c.gx = p.x + dx; c.hy = c.y = c.gy = p.y + dy; c.st = st; c.t0 = WGS.t; c.wait = 99; c.flip = flip; c.born = WGS.t - 1; c.shy = WGS.t; c.thr = 0; };
  if (L[0]) put(L[0], -18, 4, 'ball', false); if (L[1]) { put(L[1], 40, -14, 'trot', true); L[1].gx = L[1].x - 30; } if (L[2]) put(L[2], -54, -22, 'sniff', false); for (const c of L.slice(3)) c.gone = WGS.t - 1; })(); 0`);
await sleep(60); console.log('hedgehog', await g.shot('wg_hedgehog.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'HEDGEHOG OK' : 'HEDGEHOG FAIL'); g.close(); process.exit(pass ? 0 : 1);
