import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'DP' }, seed: { v: '21' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: true })`); await sleep(800);
await g.ev(`WGS.scr='play'; WGS.hint=null; wgGoDim('u', 5, 5); 0`); await sleep(1200);
for (const [n, x, y] of [['near', 5, 5], ['mid', 140, 60], ['deep', 300, 300]]) {
  await g.ev(`WGS.p.x=${x*16}; WGS.p.y=${y*16}; WGS.cam.x=WGS.p.x; WGS.cam.y=WGS.p.y; WGS.p.inv=0; 0`); await sleep(1500);
  console.log(n, await g.shot('wg_cave_' + n + '.png'));
}
console.log(JSON.stringify(g.realErrors())); process.exit(0);
