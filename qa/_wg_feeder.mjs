// Wildgrove's bird feeder: an object and a recipe; USE: seeds fill it two steps (to WG_FEED_FULL), other hands only
// hear about it; the visits come from the tile and the clock alone and bring all four birds over a day; a perched bird
// is drawn and spotted (once, with a toast), none beside a hero, by night, in the rain or at an empty feeder; the host
// lets them eat it down by day (not a guest, not by night); BIRDWATCHER; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BIRDS' }, seed: { v: '17' }, look: { skin: 2, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'birdfeeder'); return [!!(WGA.obj.birdfeeder || [])[0], rc && rc.at, WG_FEED_BIRDS.length, [0, 1, 2, 3].every(k => wgFeedBirdSpr(k, true, 0) && wgFeedBirdSpr(k, false, 1))]; })()`);
ok(r[0] && r[1] === 'bench' && r[2] === 4 && r[3], 'an object, a recipe, four birds: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -7; j < 8; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { birds: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 10; window._fd = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; WGS.clock = 0.45; WGS.weather = null; WGS.wxT = 9999; wgSetObj(w, d, x + 5, y - 2, O_ID.birdfeeder);
  const m = () => wgMetaAt(w, d, x + 5, y - 2), say = () => { WGS.toast = null; wgUse(x + 5, y - 2); return WGS.toast && WGS.toast.msg; }, res = [];
  res.push(say()); WGS.inv[0] = { id: 'seed_wheat', n: 5 }; res.push(say(), m(), WGS.inv[0].n); say(); say(); res.push(m(), say(), WGS.inv[0].n);
  WGS.inv[0] = { id: 'wood', n: 1 }; res.push(say()); return res; })()`);
ok(r[0] === 'IT NEEDS SEEDS' && r[1] === 'THE BIRDS WILL LOVE IT' && r[2] === 2 && r[3] === 4 && r[4] === 6 && r[5] === 'IT IS FULL OF SEEDS' && r[6] === 2 && r[7] === 'BIRDS COME HERE BY DAY', 'USE: seeds fill it two steps up to full, other hands hear about it: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _fd, kinds = new Set(); let n = 0; for (let T = 0; T < wgDayLen(); T += WG_FEED_SLOT) for (let b = 0; b < 2; b++) { const v = wgFeedVisit(x + 5, y - 2, b, T + 3); if (v) { n++; kinds.add(v.k); } }
  const a = JSON.stringify(wgFeedVisit(x + 5, y - 2, 0, 1234.5)), b = JSON.stringify(wgFeedVisit(x + 5, y - 2, 0, 1234.5)); return [[...kinds].sort().join(), n, a === b]; })()`);
ok(r[0] === '0,1,2,3' && r[1] > 20 && r[2], 'visits from the tile and the clock alone bring all four birds over a day: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _fd, w = WGS.world, d = WGS.dim, p = WGS.p, cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, D = ctx.drawImage.bind(ctx);
  let T0 = -1; for (let c = 0.35; c < 0.62 && T0 < 0; c += 0.0005) { WGS.clock = c; const v = wgFeedVisit(x + 5, y - 2, 0, wgFeedT()); if (v && v.u > v.a + 0.15 && v.u < 0.8) T0 = c; }
  const draw = () => { let n = 0; ctx.drawImage = function (img) { if (Object.keys(WGA.cache).some(k => k.startsWith('fbird') && WGA.cache[k] === img)) n++; return D(...arguments); };
    try { wgDrawObj(O_ID.birdfeeder, x + 5, y - 2, (x + 5) * 16 - cx0, (y - 2) * 16 - cy0); wgDrawAmbient(cx0, cy0); } finally { ctx.drawImage = D; } return n; };
  const res = [T0 > 0]; WGS.clock = T0; WGS.toast = null; w.meta.stats.birds = 0; res.push(draw(), w.meta.stats.birds > 0, WGS.toast && WGS.toast.msg); const st = w.meta.stats.birds; WGS.toast = null; draw(); res.push(WGS.toast, w.meta.stats.birds === st);
  const px = p.x, py = p.y; p.x = (x + 5) * 16 + 8; p.y = (y - 2) * 16 + 20; res.push(draw()); p.x = px; p.y = py;
  WGS.clock = 0.95; res.push(draw()); WGS.clock = T0; WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6, storm: false }; res.push(draw()); WGS.weather = null;
  wgSetObj(w, d, x + 5, y - 2, O_ID.birdfeeder, 0); res.push(draw()); wgSetObj(w, d, x + 5, y - 2, O_ID.birdfeeder, 6); return res; })()`);
ok(r[0] && r[1] >= 1 && r[2] && /CAME TO EAT$/.test(r[3]) && r[4] === null && r[5], 'a perched bird is drawn and spotted once, with a toast: ' + JSON.stringify(r.slice(0, 6)));
ok(r[6] === 0 && r[7] === 0 && r[8] === 0 && r[9] === 0, 'none beside a hero, by night, in the rain or at an empty feeder: ' + JSON.stringify(r.slice(6)));
r = await g.ev(`(() => { const { x, y } = _fd, w = WGS.world, d = WGS.dim, R = Math.random, m = () => wgMetaAt(w, d, x + 5, y - 2), step = () => { WGFD.t = 0; updateWG(1 / 60); }, res = [];
  try { Math.random = () => 0; WGS.clock = 0.45; step(); res.push(m()); WGN.role = 'client'; step(); res.push(m()); WGN.role = null; WGS.clock = 0.95; step(); res.push(m()); }
  finally { Math.random = R; WGN.role = null; WGS.clock = 0.45; } return res; })()`);
ok(r.join() === '5,5,5', 'the host lets them eat it down by day, not a guest, not by night: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.birds = 7; wgAchTick(); const a = !!m.ach.birds; m.stats.birds = 15; wgAchTick(); return [a, !!m.ach.birds, wgTipLines({ id: 'birdfeeder', n: 1 })]; })()`);
ok(!r[0] && r[1] && r[2].includes('FILL IT WITH SEEDS') && r[2].includes('BIRDS VISIT BY DAY'), 'BIRDWATCHER for all four, tips: ' + JSON.stringify(r));
const EN = ['BIRD FEEDER', 'BIRDWATCHER', 'SEE ALL FOUR BIRDS AT A FEEDER', 'BIRDS COME HERE BY DAY', 'IT NEEDS SEEDS', 'IT IS FULL OF SEEDS', 'THE BIRDS WILL LOVE IT', 'FILL IT WITH SEEDS', 'BIRDS VISIT BY DAY',
  'A GOLDFINCH CAME TO EAT', 'A CARDINAL CAME TO EAT', 'A BLUEBIRD CAME TO EAT', 'A GREENFINCH CAME TO EAT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a row of full feeders with their birds by day, the hero a few steps off
await g.ev(`(() => { const { x, y } = _fd, w = WGS.world, d = WGS.dim; for (let i = 0; i < 6; i++) wgSetObj(w, d, x - 5 + i * 2, y - 2, O_ID.birdfeeder, 6);
  let best = 0.45, most = -1; for (let c = 0.36; c < 0.6; c += 0.001) { WGS.clock = c; const T = wgFeedT(); let n = 0; for (let i = 0; i < 6; i++) for (let b = 0; b < 2; b++) { const v = wgFeedVisit(x - 5 + i * 2, y - 2, b, T); if (v && v.u > v.a + 0.1 && v.u < 0.85) n++; } if (n > most) { most = n; best = c; } }
  WGS.clock = best; const p = WGS.p; p.x = x * 16 + 8; p.y = y * 16 + 40; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(30); console.log('feeder', await g.shot('wg_feeder.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FEEDER OK' : 'FEEDER FAIL'); g.close(); process.exit(pass ? 0 : 1);
