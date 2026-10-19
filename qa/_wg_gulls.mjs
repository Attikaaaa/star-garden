// Wildgrove's seagulls: some cells of sand by the water hold one or two, slotted into the depth order by day only and
// not with the ambient life off; a hero close by sends one up (it is gone from the sand, flying), and it comes back
// once nobody is near; over open water one circles high; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'GULLS' }, seed: { v: '283' }, look: { skin: 1, hair: 3, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -30; j < 31; j++) for (let i = -40; i < 41; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, i > 20 ? G_ID.deep : ((x + i) & 3) < 2 ? G_ID.sand : G_ID.shallow); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; WGGL.spots.clear(); WGGL.fly.clear();
  const ents = (x0, y0, x1, y1) => wgEntities(x0, y0, x1, y1).filter(e => e.draw === wgGullDraw);
  const box = [p.x - 600, p.y - 440, p.x + 300, p.y + 440];`;
let r = await g.ev(`(() => { ${setup} const res = {}; const L = ents(...box); res.day = L.length; res.onSand = L.every(e => GROUND[wgGround(w, 'o', Math.floor(e.x / 16), Math.floor(e.y / 16))].id === 'sand' || GROUND[wgGround(w, 'o', Math.floor(e.x / 16), Math.floor(e.y / 16))].liq);
  WGS.clock = 0.97; res.night = ents(...box).length; WGS.clock = 0.45; wgOpt().amb = 0; res.off = ents(...box).length; wgOpt().amb = 1;
  let sea = 0; for (let gy = -3; gy <= 3; gy++) for (let gx = 0; gx < 6; gx++) { const s = wgGullSpot(Math.floor((p.x + 400) / 160) + gx, Math.floor(p.y / 160) + gy); if (s && s[4]) sea++; } res.sea = sea; return res; })()`);
ok(r.day >= 3 && r.night === 0 && r.off === 0, 'gulls on the sand by day, none at night or with the ambient life off: ' + JSON.stringify(r));
ok(r.sea >= 1, 'one circles over open water now and then: ' + JSON.stringify(r.sea));
r = await g.ev(`(() => { ${setup} const res = {}; const L = ents(...box), e = L[0]; res.before = L.length; p.x = e.x + 10; p.y = e.y + 4; WGS.cam.x = p.x; WGS.cam.y = p.y; updateWG(1 / 60);
  res.up = [WGGL.fly.has(e.k), ents(...box).some(q => q.k === e.k)];
  const S0 = ctx.drawImage.bind(ctx), seen = []; ctx.drawImage = function (img) { const k = Object.keys(WGA.cache).find(q => WGA.cache[q] === img); if (k && k.startsWith('gull_fly')) seen.push(k); return S0(...arguments); };
  try { WGS.t += 1; wgDrawAmbient(Math.round(WGS.cam.x) - VW / 2, Math.round(WGS.cam.y) - VH / 2); } finally { ctx.drawImage = S0; } res.flying = seen.length;
  WGS.t += 40; updateWG(1 / 60); res.stillNear = WGGL.fly.has(e.k); p.x = e.x + 120; WGS.cam.x = p.x; updateWG(1 / 60); res.back = !WGGL.fly.has(e.k); return res; })()`);
ok(r.up.join() === 'true,false' && r.flying >= 1, 'a hero close by sends one up, flying: ' + JSON.stringify(r));
ok(r.stillNear && r.back, 'it comes back once nobody is near: ' + JSON.stringify([r.stillNear, r.back]));
// a look: a sandy shore with gulls about, one just sent up
await g.ev(`(() => { ${setup} const L = ents(...box).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); if (L.length) { p.x = L[0].x - 60; p.y = L[0].y + 20; WGS.cam.x = p.x + 40; WGS.cam.y = p.y - 10; }
  if (L[1]) WGGL.fly.set(L[1].k, { t0: WGS.t - 1, d: 1 }); window._gl = setInterval(() => { WGS.clock = 0.45; }, 50); })(); 0`);
await sleep(400); console.log('gulls', await g.shot('wg_gulls.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'GULLS OK' : 'GULLS FAIL'); g.close(); process.exit(pass ? 0 : 1);
