import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(900); console.log(await g.shot('wgm_list.png'));
console.log(await g.ev(`WGS.scr`));
await g.ev(`WGU.create = { name: { v: 'TEST', max: 16 }, seed: { v: '', max: 12 }, look: { skin: 0, hair: 0, shirt: 0 }, who: { v: 'PIP', max: 10 }, peace: false }; WGS.scr = 'create'; WGS.ui = {}; 0`); await sleep(700); console.log(await g.ev(`WGS.scr`), await g.shot('wgm_create.png'));
console.log(JSON.stringify(g.realErrors())); process.exit(0);
