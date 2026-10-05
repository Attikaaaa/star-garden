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
await g.shot('wg_wear.png');
const o = JSON.parse(r); const ok = o.broke && o.kept; console.log(ok ? 'WEAR OK' : 'WEAR FAIL', r, JSON.stringify(g.realErrors())); process.exit(ok ? 0 : 1);
