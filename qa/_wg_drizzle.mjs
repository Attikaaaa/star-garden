// Wildgrove's rainy-day critters: frogs and snails live in about one cell in four, two frogs to a snail, only on
// grass-like ground with nothing solid; none come out when dry; in the rain they come out one by one and are slotted
// into the world's depth order; a frog hops off from a hero close by and croaks now and then (never two at once); a
// snail creeps slowly, leaves a trail and keeps to its shell while a hero is near; as it dries they slip away; none
// with the ambient life off, none below ground; a look in the rain.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'DRIZZLE' }, seed: { v: '23' }, look: { skin: 3, hair: 1, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -12; j < 13; j++) for (let i = -20; i < 21; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; wgOpt().amb = 1; WGS.cam.x = p.x; WGS.cam.y = p.y;
  WGDZ.spots.clear(); WGDZ.live.clear(); WGDZ.k = 0; WGDZ.croak = 0;
  const rain = (on) => { WGS.weather = on ? { kind: 'rain', dark: 0.12, wind: 0.6, storm: false } : null; WGS.wxT = 9999; };
  const run = (s) => { for (let i = 0; i < s * 60; i++) { WGS.cam.x = p.x; WGS.cam.y = p.y; updateWG(1 / 60); } };`;
let r = await g.ev(`(() => { ${setup} let frog = 0, snail = 0, cells = 0, bad = 0;
  for (let cy = -15; cy < 15; cy++) for (let cx = -15; cx < 15; cx++) { if (!WG_DZ_GROUNDS.includes(GROUND[wgGround(w, 'o', Math.floor((cx + 0.5) * WG_DZ_CELL / 16), Math.floor((cy + 0.5) * WG_DZ_CELL / 16))].id)) continue; cells++; const s = wgDrizSpot(cx, cy); if (!s) continue; if (s.kind === 'frog') frog++; else snail++; if (!wgDrizFree(s.hx, s.hy) || s.thr < 0.12 || s.thr > 0.84) bad++; }
  return [frog, snail, cells, bad]; })()`);
ok(r[3] === 0 && (r[0] + r[1]) / r[2] > 0.12 && (r[0] + r[1]) / r[2] < 0.3 && r[0] > r[1] * 1.3, 'critters live in about one grassy cell in five, more frogs than snails, only on grass with nothing solid: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = []; rain(false); run(5); res.push(WGDZ.k, WGDZ.live.size);
  rain(true); run(2); res.push(+WGDZ.k.toFixed(2)); const n2 = WGDZ.live.size; run(7); res.push(WGDZ.k, n2 <= WGDZ.live.size, WGDZ.live.size);
  const ents = wgEntities(p.x - 300, p.y - 200, p.x + 300, p.y + 200), mine = ents.filter(e => e.draw === wgDrizDraw); res.push(mine.length, WGDZ.live.size);
  return res; })()`);
ok(r[0] === 0 && r[1] === 0, 'none when it is dry: ' + JSON.stringify(r.slice(0, 2)));
ok(r[2] > 0.2 && r[2] < 0.3 && r[3] === 1 && r[4] && r[5] >= 2 && r[6] === r[7], 'in the rain they come out one by one, slotted into the depth order: ' + JSON.stringify(r.slice(2)));
r = await g.ev(`(() => { ${setup} rain(true); WGDZ.k = 1; run(0.5); const res = {}, L = [...WGDZ.live.values()], f = L.find(c => c.kind === 'frog'), s = L.find(c => c.kind === 'snail');
  res.kinds = [!!f, !!s];
  if (s) { p.x = s.x + 40; p.y = s.y + 20; s.shy = -9; const x0 = s.x, y0 = s.y; s.trail.length = 0; run(5); res.snail = [+Math.hypot(s.x - x0, s.y - y0).toFixed(1), s.trail.length >= 8, [...WGDZ.live.values()].includes(s)];
    p.x = s.x + 10; p.y = s.y; const x1 = s.x, y1 = s.y; run(1); res.shy = [Math.hypot(s.x - x1, s.y - y1), WGS.t - s.shy < 2.5]; }
  const f2 = [...WGDZ.live.values()].find(c => c.kind === 'frog' && !c.gone); if (f2) { const f = f2; f.next = WGS.t + 9; p.x = f.x + 8; p.y = f.y + 2; const d0 = Math.hypot(p.x - f.x, p.y - f.y); run(1); res.frog = [Math.round(d0), Math.round(Math.hypot(p.x - f.x, p.y - f.y))]; }
  return res; })()`);
ok(r.kinds[0] && r.kinds[1], 'a frog and a snail in view: ' + JSON.stringify(r.kinds));
ok(r.frog && r.frog[0] < 10 && r.frog[1] > 18, 'a frog hops off from a hero close by: ' + JSON.stringify(r.frog));
ok(r.snail && r.snail[0] > 4 && r.snail[0] < 14 && r.snail[1] && r.snail[2] && r.shy[0] === 0 && r.shy[1], 'a snail creeps slowly leaving a trail, and keeps to its shell while a hero is near: ' + JSON.stringify([r.snail, r.shy]));
r = await g.ev(`(() => { ${setup} rain(true); WGDZ.k = 1; run(0.5); const F = wgSfx, M = Math.random, snd = []; wgSfx = (n) => snd.push([n, +WGS.t.toFixed(1)]);
  try { Math.random = () => 0; for (const c of WGDZ.live.values()) { c.x = c.hx; c.y = c.hy; } p.x += 60; run(10); } finally { wgSfx = F; Math.random = M; }
  const cr = snd.filter(s => s[0] === 'croak'); return [cr.length, cr.every((s, i) => !i || s[1] - cr[i - 1][1] >= 6.9)]; })()`);
ok(r[0] >= 1 && r[0] <= 2 && r[1], 'a frog croaks now and then, never two at once: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} rain(true); WGDZ.k = 1; run(0.5); const res = [WGDZ.live.size]; rain(false); run(20); res.push(+WGDZ.k.toFixed(2), WGDZ.live.size); run(25); res.push(WGDZ.k, WGDZ.live.size);
  rain(true); WGDZ.k = 1; run(0.2); res.push(WGDZ.live.size > 0); wgOpt().amb = 0; run(0.1); res.push(WGDZ.live.size); wgOpt().amb = 1; run(0.2); WGS.dim = 'u'; run(0.1); res.push(WGDZ.live.size, wgEntities(-1e5, -1e5, 1e5, 1e5).filter(e => e.draw === wgDrizDraw).length); WGS.dim = 'o'; rain(false); return res; })()`);
ok(r[0] > 0 && r[1] > 0.4 && r[1] < 0.55 && r[2] < r[0] && r[3] === 0 && r[4] === 0, 'as it dries they slip away: ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] && r[6] === 0 && r[7] === 0 && r[8] === 0, 'none with the ambient life off, none below ground: ' + JSON.stringify(r.slice(5)));
r = await g.ev(`(() => { ${setup} rain(true); WGDZ.k = 1; run(0.5); const D = ctx.drawImage.bind(ctx), arts = new Set(['frog0', 'frog1', 'snail', 'snail_l', 'shell', 'shell_l'].map(wgDrizArt)); let n = 0;
  ctx.drawImage = function (img) { if (arts.has(img)) n++; return D(...arguments); };
  try { for (const c of WGDZ.live.values()) c.born = WGS.t - 1; wgDrawWorld(); } finally { ctx.drawImage = D; } return [n, WGDZ.live.size]; })()`);
ok(r[0] >= 1 && r[0] <= r[1], 'drawn with the world: ' + JSON.stringify(r));
// a look: rain on a meadow by a pond, a frog or two and a snail about
await g.ev(`(() => { ${setup} for (let j = 2; j < 5; j++) for (let i = -9; i < -3; i++) wgSetGround(w, 'o', x + i, y + j, (i === -9 || i === -4 || j === 4) ? G_ID.shallow : G_ID.deep);
  for (const [i, j, o] of [[-7, -4, 'oak'], [7, -4, 'birch'], [9, 3, 'oak'], [3, 4, 'flower_y'], [-2, -3, 'flower_b'], [4, -2, 'tallgrass'], [-11, -1, 'oak'], [1, 3, 'tallgrass']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGDZ.spots.clear(); rain(true); WGS.day = 5; WGS.clock = 0.6; WGS.toast = null; WGS.inv[0] = { id: 'umbrella_y', n: 1 }; WGS.sel = 0; p.face = 'l'; Input.mx = 4; Input.my = 4;
  WGDZ.k = 1; run(0.3); const L = [...WGDZ.live.values()];
  const put = (c, dx, dy) => { c.hx = c.x = p.x + dx; c.hy = c.y = p.y + dy; c.next = WGS.t + 9; c.trail.length = 0; };
  const f = L.filter(c => c.kind === 'frog'), s = L.filter(c => c.kind === 'snail');
  if (f[0]) put(f[0], -40, 30); if (f[1]) put(f[1], 52, -26); if (s[0]) { put(s[0], 34, 22); s[0].dir = 3.14; for (let i = 6; i > 0; i--) s[0].trail.push(s[0].x + i * 2, s[0].y + (i % 2)); }
  for (const c of L) c.born = WGS.t - 1; })(); 0`);
await sleep(60); console.log('drizzle', await g.shot('wg_drizzle.png'));
await g.ev(`WGS.weather = null; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'DRIZZLE OK' : 'DRIZZLE FAIL'); g.close(); process.exit(pass ? 0 : 1);
