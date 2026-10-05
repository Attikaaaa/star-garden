import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'WR' }, seed: { v: '12' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: true })`); await sleep(800);
const r = await g.ev(`(() => {
  WGS.scr='play'; WGS.hint=null; wgInvAdd(WGS.inv,'axe_wood',1); WGS.sel = WGS.inv.findIndex(s => s && s.id==='axe_wood');
  let n = 0; while (WGS.inv[WGS.sel] && n < 100) { wgWear(); n++; }
  const broke = !WGS.inv[WGS.sel] && n === 30;
  wgInvAdd(WGS.inv,'axe_wood',1); WGS.sel = WGS.inv.findIndex(s => s && s.id==='axe_wood'); WGS.world.meta.rules = { noWear: true };
  for (let i = 0; i < 80; i++) wgWear(); const kept = !!WGS.inv[WGS.sel] && !WGS.inv[WGS.sel].d;
  return JSON.stringify({ broke, n, kept });
})()`);
const rep = await g.ev(`(() => {
  WGS.world.meta.rules = {}; wgInvAdd(WGS.inv,'pick_copper',1); wgInvAdd(WGS.inv,'copper',2); WGS.sel = WGS.inv.findIndex(s => s && s.id==='pick_copper'); WGS.inv[WGS.sel].d = 50;
  const tx = Math.floor(WGS.p.x/16) + 2, ty = Math.floor(WGS.p.y/16); wgSetObj(WGS.world, 'o', tx, ty, O_ID.anvil);
  wgUse(tx, ty); return JSON.stringify({ d: WGS.inv[WGS.sel].d, bars: WGS.inv.filter(s => s && s.id==='copper').reduce((a, s) => a + s.n, 0) });
})()`);
console.log(rep); const rp = JSON.parse(rep);
await g.shot('wg_wear.png');
const o = JSON.parse(r); const ok = o.broke && o.kept && rp.d === 0 && rp.bars === 1; console.log(ok ? 'WEAR OK' : 'WEAR FAIL', r, JSON.stringify(g.realErrors())); process.exit(ok ? 0 : 1);
