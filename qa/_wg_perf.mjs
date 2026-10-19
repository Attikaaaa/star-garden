// Frame cost in Wildgrove: the world drawn while the hero runs across fresh land and while tiles are dug
// and tilled, plus how many chunk images are kept. Budget: no drawn frame over 12 ms after the first second.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PERF' }, seed: { v: '9' }, look: { skin: 0, hair: 0, shirt: 0 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.scr = 'play'; WGS.world.meta.hintDone = 1; window.__ft = []; const f0 = wgDrawWorld; wgDrawWorld = function () { const t = performance.now(), r = f0.apply(this, arguments); __ft.push(performance.now() - t); return r; }; 0`);
await sleep(1000);
const stat = async (what) => {
  const r = await g.ev(`(() => { const top = __ft.map((v, i) => [Math.round(v), i]).sort((x, y) => y[0] - x[0]).slice(0, 4), a = __ft.slice().sort((x, y) => x - y); __ft = []; return { top, n: a.length, p50: a[a.length >> 1], p95: a[Math.floor(a.length * 0.95)], max: a[a.length - 1] }; })()`);
  for (const k of ['p50', 'p95', 'max']) r[k] = Math.round(r[k] * 10) / 10;
  console.log(what, JSON.stringify(r)); return r;
};
await stat('settle');
// run east over new land: about three tiles a frame, far faster than a hero walks
await g.ev(`(() => { let n = 0; const step = () => { WGS.p.x += 3; WGS.cam.x = WGS.p.x; WGS.cam.y = WGS.p.y; if (++n < 420) requestAnimationFrame(step); }; requestAnimationFrame(step); })(); 0`);
await sleep(8000);
const run = await stat('run');
// dig and till a patch next to the hero, one tile a frame
await g.ev(`(() => { const tx = Math.floor(WGS.p.x / 16), ty = Math.floor(WGS.p.y / 16); let n = 0; const step = () => { const x = tx - 4 + n % 9, y = ty - 3 + Math.floor(n / 9); wgSetGround(WGS.world, WGS.dim, x, y, n % 2 ? G_ID.dirt : G_ID.tilled); wgSetObj(WGS.world, WGS.dim, x, y + 1, 0); if (++n < 54) requestAnimationFrame(step); }; requestAnimationFrame(step); })(); 0`);
await sleep(2500);
const dig = await stat('dig');
const kept = await g.ev(`[...WGS.world.chunks.values()].filter(c => c.art).length + ' of ' + WGS.world.chunks.size`);
console.log('chunk images kept', kept);
console.log('errors', JSON.stringify(g.realErrors()));
const ok = run.max < 12 && dig.max < 12 && !g.realErrors().length;
console.log(ok ? 'PERF OK' : 'PERF SLOW'); g.close(); process.exit(ok ? 0 : 1);
