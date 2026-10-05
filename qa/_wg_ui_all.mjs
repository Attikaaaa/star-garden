import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'UI' }, seed: { v: '12' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: true })`); await sleep(800);
await g.ev(`WGS.scr='play'; WGS.hint=null; for (const id of ['wood','stone','stick','fiber','copper','iron','coal','flint','string']) wgInvAdd(WGS.inv, id, 12); 0`);
const scrs = [['inv', `WGS.scr='inv'; WGS.ui={tab:'craft'}`], ['pause', `WGS.scr='pause'; WGS.ui={}`], ['settings', `WGS.scr='settings'; WGS.ui={}`], ['book', `WGS.scr='book'; WGS.ui={}`], ['stars', `WGS.scr='stars'; WGS.ui={}`]];
for (const [n, js] of scrs) { await g.ev(js + '; 0'); await sleep(700); console.log(n, await g.ev('WGS.scr'), await g.shot('wgui_' + n + '.png')); }
console.log(JSON.stringify(g.realErrors()).slice(0, 300)); process.exit(0);
