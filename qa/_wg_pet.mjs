import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PT' }, seed: { v: '12' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: true })`); await sleep(800);
await g.ev(`WGS.scr='play'; WGS.hint=null; WGS.clock=0.4; wgInvAdd(WGS.inv,'meat',20); WGS.sel = WGS.inv.findIndex(s => s && s.id==='meat'); wgSpawnMob('fox', WGS.p.x+30, WGS.p.y); 0`); await sleep(300);
for (let i = 0; i < 40 && !(await g.ev(`WGS.p.pet`)); i++) { await g.ev(`(() => { const f = WGS.mobs.find(m => m.type==='fox'); if (f) { f.x = WGS.p.x+20; f.y = WGS.p.y; wgUse(Math.floor(f.x/16), Math.floor(f.y/16)); } })()`); await sleep(100); }
console.log('pet', await g.ev(`WGS.p.pet`));
await g.ev(`WGS.p.x += 300; 0`); await sleep(800);
const near = await g.ev(`(() => { const f = WGS.mobs.find(m => m.pet); return f ? Math.round(Math.hypot(f.x-WGS.p.x, f.y-WGS.p.y)) : -1; })()`);
await g.ev(`WGS.mobs = WGS.mobs.filter(m => !m.pet); 0`); await sleep(400);
const back = await g.ev(`WGS.mobs.some(m => m.pet)`);
await g.ev(`wgSpawnMob('ghoul', WGS.p.x+40, WGS.p.y); 0`); await sleep(2500);
const kill = await g.ev(`WGS.mobs.some(m => m.type==='ghoul') ? 'alive' : 'dead'`);
await g.shot('wg_pet.png');
const ok = near >= 0 && near < 60 && back;
console.log(ok ? 'PET OK' : 'PET FAIL', near, back, 'ghoul', kill, JSON.stringify(g.realErrors())); process.exit(ok ? 0 : 1);
