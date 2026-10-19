// Wildgrove's hot springs: one snowy or highland chunk in a few has one, from the seed and the land alone; its chunk
// is made with the pool of shallow water, its rim cleared and pebbles about; wading in it heals a heart every few
// seconds (NICE AND WARM, the HOT SPRING star), not out of it, not without food; bubbles rise in it and steam curls up,
// only while its middle is still water; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SPRING' }, seed: { v: '33' }, look: { skin: 2, hair: 3, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, C = WG.CS, pcx = Math.floor(p.x / 16 / C), pcy = Math.floor(p.y / 16 / C); let n = 0, best = null, snowy = 0;
  for (let cy = pcy - 30; cy <= pcy + 30; cy++) for (let cx = pcx - 30; cx <= pcx + 30; cx++) {
    const S = wgSpringOf(w.seed, cx, cy); if (!S) continue; n++;
    const d = Math.hypot(cx - pcx, cy - pcy); if (!best || d < best[2]) { wgChunk(w, 'o', cx, cy); if (GROUND[wgGround(w, 'o', S.x, S.y)].liq === 'water') best = [cx, cy, d, S.x, S.y]; else snowy++; }
  }
  const [cx, cy, , x, y] = best, ch = wgChunk(w, 'o', cx, cy), res = { n, skipped: snowy, biome: wgSurface(w.seed, x, y).b };
  let water = 0, clear = 0, pebbles = 0, dry = 0;
  for (let j = -2; j <= 3; j++) for (let i = -4; i <= 3; i++) { const gid = wgGround(w, 'o', x + i, y + j), o = wgObjAt(w, 'o', x + i, y + j);
    if (wgSpringPool(i, j)) { if (gid === G_ID.shallow) water++; } else if (!GROUND[gid].liq) dry++;
    if (!o) clear++; else if (o === O_ID.pebbles) pebbles++; }
  window._sp = [x, y]; return Object.assign(res, { water, clear, pebbles, dry }); })()`);
ok(r.n >= 3 && ['snow', 'highland', 'mountain'].includes(r.biome), 'springs in the snow and the highlands, a few in a wide stretch: ' + JSON.stringify(r));
ok(r.water === 20 && r.dry === 28 && r.clear + r.pebbles === 48 && r.pebbles >= 1, 'its chunk is made with the pool, its rim cleared and pebbles about: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, [x, y] = _sp, res = [], seen = new Set(); WGS.dim = 'o'; WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.toast = null;
  const run = (s) => { for (let i = 0; i < s * 60; i++) { updateWG(1 / 60); if (WGS.toast) seen.add(WGS.toast.msg); } };
  p.x = (x + 3) * 16 + 8; p.y = (y + 3) * 16 + 10; p.hp = 5; p.food = 10; run(3); res.push(p.hp);
  p.x = x * 16 + 8; p.y = y * 16 + 10; run(2.7); res.push(p.hp, seen.has('NICE AND WARM'), !!w.meta.stats.spring); run(2.6); res.push(p.hp);
  p.food = 0; run(2.6); res.push(p.hp); p.food = 10; wgAchTick(); res.push(!!w.meta.ach.spring);
  p.x = (x + 3) * 16 + 8; p.y = (y + 3) * 16 + 10; p.hp = p.maxHp; return res; })()`);
ok(r[0] === 5, 'no healing out of it: ' + r[0]);
ok(r[1] === 6 && r[2] && r[3] && r[4] === 7 && r[5] <= 7 && r[6], 'wading in it heals a heart every few seconds while fed; NICE AND WARM, HOT SPRING: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, [x, y] = _sp, R = rect; let tint = 0, steam = 0; WGS.cam.x = x * 16 + 8; WGS.cam.y = y * 16 + 8; const cx0 = WGS.cam.x - 192, cy0 = WGS.cam.y - 108, res = {};
  const sx = x * 16 - cx0, sy = y * 16 - cy0; rect = function (a, b, c, d, k) { if ((k === 'C' || k === 'w') && c === 1 && d === 1 && a > sx - 52 && a < sx + 52 && b > sy - 20 && b < sy + 52) tint++; if (k === 'w' && ((c === 3 && d === 1) || (c === 5 && d === 2)) && ctx.globalAlpha < 0.66) steam++; return R(...arguments); };
  const draw = () => { tint = 0; steam = 0; const C = WG.CS, cx = Math.floor(x / C), cy = Math.floor(y / C); wgChunkUpkeep(w, 'o', cx - 1, cy - 1, cx + 1, cy + 1); wgDrawAmbient(cx0, cy0); return [tint, steam]; };
  try { res.on = draw(); const g0 = wgGround(w, 'o', x, y); wgSetGround(w, 'o', x, y, G_ID.snow); res.filled = draw(); res.at = wgSpringAt(x * 16 + 8, y * 16 + 8); wgSetGround(w, 'o', x, y, g0); } finally { rect = R; }
  return res; })()`);
ok(r.on[0] >= 4 && r.on[1] >= 4 && r.filled[0] === 0 && r.filled[1] === 0 && r.at === false, 'bubbles rise in it and steam curls up, while its middle is still water: ' + JSON.stringify(r));
const EN = ['HOT SPRING', 'SOAK IN A HOT SPRING', 'NICE AND WARM'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a morning soak among the snowy pines
await g.ev(`(() => { const w = WGS.world, p = WGS.p, [x, y] = _sp; p.x = (x - 1) * 16 + 8; p.y = y * 16 + 10; p.face = 'r'; WGS.cam.x = x * 16 + 8; WGS.cam.y = y * 16 + 4;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'hot_cider', n: 2 }; WGS.sel = 0; WGS.clock = 0.3; WGS.day = 26; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('spring', await g.shot('wg_spring.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SPRING OK' : 'SPRING FAIL'); g.close(); process.exit(pass ? 0 : 1);
