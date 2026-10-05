import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'CH' }, seed: { v: '12' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: false })`); await sleep(800);
// a wall of rock between a ghoul and the hero: does it get round?
const r = await g.ev(`(async () => {
  WGS.scr='play'; WGS.hint=null; WGS.clock=0.95; WGS.p.inv=0; WGS.p.hp=WGS.p.maxHp;
  const tx=Math.floor(WGS.p.x/16), ty=Math.floor(WGS.p.y/16);
  for (let y=-2;y<=2;y++) for (let x=2;x<=3;x++) { wgSetObj(WGS.world, 'o', tx+x, ty+y, O_ID.boulder || 0); }
  const m = wgSpawnMob('ghoul', WGS.p.x + 70, WGS.p.y);
  let best = 1e9; for (let i=0;i<300;i++) { await new Promise(r=>setTimeout(r,50)); WGS.p.hp=WGS.p.maxHp; best=Math.min(best, Math.hypot(m.x-WGS.p.x, m.y-WGS.p.y)); }
  return [Math.round(best), Math.round(m.x-WGS.p.x), Math.round(m.y-WGS.p.y), wgObjAt(WGS.world,'o',tx+2,ty), O_ID.boulder, WG_MOBS.ghoul.spd, m.hp];
})()`);
console.log(r, JSON.stringify(g.realErrors()).slice(0,200));
const ok = r[0] < 25; console.log(ok ? 'CHASE OK' : 'CHASE FAIL'); process.exit(ok ? 0 : 1);
