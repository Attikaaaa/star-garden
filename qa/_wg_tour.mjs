import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TR' }, seed: { v: '31' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: true })`); await sleep(800);
const bs = ['forest','swamp','snow','highland','jungle','mountain'];
for (const b of bs) {
  const pos = await g.ev(`(() => { const s = WGS.world.seed; for (let r = 4; r < 400; r += 4) for (let a = 0; a < 16; a++) { const x = Math.round(Math.cos(a) * r * 3), y = Math.round(Math.sin(a) * r * 3); const q = wgSurface(s, x, y); if (q.b === '${b}' && wgSurface(s, x+6, y).b === '${b}' && wgSurface(s, x-6, y).b === '${b}') return [x, y]; } return null; })()`);
  if (!pos) { console.log(b, 'none'); continue; }
  await g.ev(`WGS.scr='play'; WGS.hint=null; WGS.clock=0.4; WGS.day=0; WGS.p.x=${pos[0]*16+8}; WGS.p.y=${pos[1]*16+8}; WGS.cam.x=WGS.p.x; WGS.cam.y=WGS.p.y; 0`); await sleep(1500);
  console.log(b, await g.shot('wg_tour_' + b + '.png'));
}
console.log(JSON.stringify(g.realErrors())); process.exit(0);
