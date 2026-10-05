import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'NT' }, seed: { v: '77' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: false })`); await sleep(800);
await g.ev(`WGS.scr='play'; WGS.hint=null; WGS.clock = 0.9; WGS.p.inv = 99; ['ghoul','bonebag','spider'].forEach((t,i)=>wgSpawnMob(t, WGS.p.x+60+i*30, WGS.p.y+20-i*12)); 0`); await sleep(1200);
await g.shot('wg_night1.png');
await g.ev(`wgGoDim('u', 3, 3); ['slime','bat','ghoul'].forEach((t,i)=>wgSpawnMob(t, WGS.p.x+50+i*26, WGS.p.y+14)); 0`); await sleep(1500);
await g.shot('wg_night2.png'); console.log(JSON.stringify(g.realErrors())); process.exit(0);
