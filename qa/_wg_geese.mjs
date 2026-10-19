// Wildgrove's wild geese: flocks fly north in spring and south in autumn, none in summer or winter, moving with the
// world's clock; drawn as a V (one sprite and a shadow per goose) by day outdoors, none at night, underground or with the
// ambient life off; a flock right over the hero is noted and told once each way; WILD GEESE for both; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'GEESE' }, seed: { v: '83' }, look: { skin: 0, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const p = WGS.p, res = {}; WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.clock = 0.4;
  const big = () => wgGeeseList(p.x - 3000, p.y - 3000, p.x + 3000, p.y + 3000), near = (L, M) => M.find(b => b[0] === L[0] && Math.abs(b[1] - L[1]) < 1000);
  for (const [name, day] of [['spring', 2], ['summer', 10], ['autumn', 18], ['winter', 26]]) {
    WGS.day = day; const a = big(); WGS.clock += 10 / wgDayLen(); const b = big(); WGS.clock -= 10 / wgDayLen();
    const moves = a.map(L => { const M = near(L, b); return M ? Math.round(M[1] - L[1]) : null; }).filter(v => v !== null);
    res[name] = [a.length, moves.length ? Math.min(...moves) : 0, moves.length ? Math.max(...moves) : 0, a.every(L => L[2] >= 5 && L[2] <= 9)];
  } return res; })()`);
ok(r.spring[0] >= 3 && r.spring[1] === -240 && r.spring[2] === -240 && r.spring[3], 'in spring flocks fly north with the clock: ' + JSON.stringify(r.spring));
ok(r.autumn[0] >= 3 && r.autumn[1] === 240 && r.autumn[2] === 240 && r.autumn[3], 'in autumn south: ' + JSON.stringify(r.autumn));
ok(r.summer[0] === 0 && r.winter[0] === 0, 'none in summer or winter: ' + JSON.stringify([r.summer, r.winter]));
// drawn: look at a flock from right under it
r = await g.ev(`(() => { const p = WGS.p, res = {}; WGS.day = 18; WGS.clock = 0.4; const L = wgGeeseList(p.x - 3000, p.y - 3000, p.x + 3000, p.y + 3000)[0]; window._fl = L;
  const want = new Set(Object.keys(WGA.cache).filter(k => k.startsWith('goose_')).map(k => WGA.cache[k])), D = ctx.drawImage.bind(ctx), S = shadow; let n = 0, s = 0;
  const draw = () => { const cx0 = Math.round(L[0]) - VW / 2, cy0 = Math.round(L[1]) - VH / 2; wgGooseArt(1, 0); wgGooseArt(1, 1); want.add(WGA.cache.goose_1_0); want.add(WGA.cache.goose_1_1); n = 0; s = 0;
    ctx.drawImage = function (img) { if (want.has(img)) n++; return D(...arguments); }; shadow = function () { s++; return S(...arguments); };
    try { wgDrawAmbient(cx0, cy0); } finally { ctx.drawImage = D; shadow = S; } return [n, s]; };
  res.day = draw(); WGS.clock = 0.95; res.night = draw(); WGS.clock = 0.4; const o = wgOpt(), a0 = o.amb; o.amb = 0; res.off = draw(); o.amb = a0;
  const d0 = WGS.dim; WGS.dim = 'u'; res.under = draw(); WGS.dim = d0; res.n = L[2]; return res; })()`);
ok(r.day[0] === r.n && r.day[1] >= r.n && r.night[0] === 0 && r.off[0] === 0 && r.under[0] === 0, 'drawn as a V with shadows by day, none at night, off or underground: ' + JSON.stringify(r));
r = await g.ev(`(() => { const p = WGS.p, w = WGS.world, m = w.meta, res = []; m.ach = { geese: 1 }; m.stats = { kills: 0, far: 0 }; WGS.day = 18; WGS.clock = 0.4; const L = _fl;
  p.x = L[0] + 3000; p.y = L[1]; WGGS.t = 0; WGS.toast = null; updateWG(1 / 60); res.push(m.stats.geese | 0, WGS.toast);
  p.x = L[0]; p.y = L[1] + 60; WGGS.t = 0; updateWG(1 / 60); res.push(m.stats.geese | 0, WGS.toast && WGS.toast.msg); WGS.toast = null; WGGS.t = 0; updateWG(1 / 60); res.push(WGS.toast);
  m.ach = {}; wgAchTick(); res.push(!!m.ach.geese); WGS.day = 2; const S = wgGeeseList(p.x - 3000, p.y - 3000, p.x + 3000, p.y + 3000)[0]; p.x = S[0]; p.y = S[1] + 60; WGGS.t = 0; updateWG(1 / 60);
  res.push(m.stats.geese | 0, WGS.toast && WGS.toast.msg); wgAchTick(); res.push(!!m.ach.geese); return res; })()`);
ok(r[0] === 0 && r[1] === null && r[2] === 2 && r[3] === 'GEESE FLYING SOUTH' && r[4] === null, 'a flock right over the hero is noted and told once: ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] === false && r[6] === 3 && r[7] === 'GEESE FLYING NORTH' && r[8] === true, 'WILD GEESE for both ways: ' + JSON.stringify(r.slice(5)));
const EN = ['WILD GEESE', 'SEE GEESE FLY NORTH AND SOUTH', 'GEESE FLYING NORTH', 'GEESE FLYING SOUTH'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: an autumn flock passing over the meadow
await g.ev(`(() => { const p = WGS.p, L = _fl; WGS.day = 18; WGS.clock = 0.4; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; WGS.world.meta.ach.geese = 1;
  p.x = L[0] + 70; p.y = L[1] + 50; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y; })(); 0`);
await sleep(120); console.log('geese', await g.shot('wg_geese.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'GEESE OK' : 'GEESE FAIL'); g.close(); process.exit(pass ? 0 : 1);
