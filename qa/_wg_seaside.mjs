// Wildgrove's seaside pack: a shovel on bare sand heaps a mound (not on grass, not under your feet), the shovel builds
// it up stage by stage, a shell finishes it with a flag (SANDCASTLE); empty-handed it asks for a shovel; it is drawn at
// its stage; mined it gives sand; the lighthouse: art and a recipe, a lamp and a sweeping beam by night (not by day),
// the beam turning with the world's clock; KEEPER OF THE LIGHT; tips, Hungarian; a look at the shore at night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SEA' }, seed: { v: '41' }, look: { skin: 1, hair: 2, shirt: 5 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'lighthouse'); return [(WGA.obj.sandcastle || []).length, !!(WGA.obj.lighthouse || [])[0], rc && rc.at]; })()`);
ok(r[0] === 5 && r[1] && r[2] === 'bench', 'five castle stages, a lighthouse and its recipe: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -5; j < 6; j++) for (let i = -8; i < 9; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, j > 2 ? G_ID.deep : i < -3 ? G_ID.grass : G_ID.sand); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { castle: 1, beacon: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 10; window._se = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'shovel_wood', n: 1 }; WGS.inv[1] = { id: 'shell', n: 2 }; WGS.sel = 0;
  const at = (i) => [wgObjAt(w, d, x + i, y) === O_ID.sandcastle, wgMetaAt(w, d, x + i, y)], res = [];
  wgUse(x - 5, y); res.push(wgObjAt(w, d, x - 5, y) === O_ID.sandcastle); wgUse(x, y); res.push(wgObjAt(w, d, x, y) === O_ID.sandcastle);
  wgUse(x + 2, y); res.push(at(2).join()); WGS.sel = 2; WGS.toast = null; wgUse(x + 2, y); res.push(WGS.toast && WGS.toast.msg, wgMetaAt(w, d, x + 2, y)); WGS.sel = 0;
  wgUse(x + 2, y); wgUse(x + 2, y); wgUse(x + 2, y); res.push(wgMetaAt(w, d, x + 2, y)); WGS.toast = null; wgUse(x + 2, y); res.push(WGS.toast && WGS.toast.msg, wgMetaAt(w, d, x + 2, y));
  WGS.sel = 1; wgUse(x + 2, y); res.push(wgMetaAt(w, d, x + 2, y), WGS.inv[1].n, !!w.meta.stats.castle); WGS.toast = null; wgUse(x + 2, y); res.push(WGS.toast && WGS.toast.msg, WGS.inv[1].n);
  return res; })()`);
ok(r[0] === false && r[1] === false && r[2] === 'true,0', 'a shovel on bare sand heaps a mound, not on grass, not under your feet: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] === 'BUILD IT UP WITH A SHOVEL' && r[4] === 0 && r[5] === 3 && r[6] === 'A SHELL WOULD FINISH IT' && r[7] === 3, 'the shovel builds it up stage by stage, empty hands only ask: ' + JSON.stringify(r.slice(3, 8)));
ok(r[8] === 4 && r[9] === 1 && r[10] && r[11] === 'WHAT A FINE SANDCASTLE!' && r[12] === 1, 'a shell finishes it with a flag, SANDCASTLE: ' + JSON.stringify(r.slice(8)));
r = await g.ev(`(() => { const { x, y } = _se, D = ctx.drawImage.bind(ctx), got = []; ctx.drawImage = function (img) { const i = WGA.obj.sandcastle.findIndex(q => q.c === img); if (i >= 0) got.push(i); return D(...arguments); };
  try { for (const m of [0, 2, 4]) { wgSetObj(WGS.world, WGS.dim, x + 2, y, O_ID.sandcastle, m); wgDrawObj(O_ID.sandcastle, x + 2, y, 100, 100); } } finally { ctx.drawImage = D; }
  WGS.drops.length = 0; wgBreak(x + 2, y, true); return [got.join(), WGS.drops.map(q => q.id).join(), wgObjAt(WGS.world, WGS.dim, x + 2, y)]; })()`);
ok(r[0] === '0,2,4' && r[1] === 'sand' && r[2] === 0, 'drawn at its stage; mined it gives sand: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _se, w = WGS.world, d = WGS.dim, L = WGR.lights; wgSetObj(w, d, x + 4, y - 2, O_ID.lighthouse);
  const draw = (c) => { WGS.clock = c; const n = L.length; wgDrawObj(O_ID.lighthouse, x + 4, y - 2, 100, 100); return L.slice(n); };
  const day = draw(0.5), night = draw(0.95), a = wgBeamA(); WGS.day += 0; const t0 = WGS.clock; WGS.clock = 0.95 + 1.5 / wgDayLen(); const later = draw(WGS.clock);
  return [day.length, night.length, night[0] && [night[0].x, night[0].y], night[3] && [night[3].x, night[3].y], later[3] && [later[3].x, later[3].y]]; })()`);
ok(r[0] === 0 && r[1] === 4 && r[2][0] === 108 && r[2][1] === 78 && JSON.stringify(r[3]) !== JSON.stringify(r[4]), 'a lamp and a sweeping beam by night, turning with the clock, nothing by day: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta, p = WGS.p; m.ach = {}; p.seen = p.seen || {}; p.seen.lighthouse = 1; wgAchTick(); return [!!m.ach.beacon, !!m.ach.castle]; })()`);
ok(r[0] && r[1], 'KEEPER OF THE LIGHT and SANDCASTLE: ' + JSON.stringify(r));
r = await g.ev(`[wgTipLines({ id: 'shovel_wood', n: 1 }), wgTipLines({ id: 'lighthouse', n: 1 })]`);
ok(r[0].includes('ON SAND IT BUILDS A SANDCASTLE') && r[1].includes('ITS BEAM SWEEPS ROUND AT NIGHT'), 'tips: ' + JSON.stringify(r));
const EN = ['SANDCASTLE', 'LIGHTHOUSE', 'KEEPER OF THE LIGHT', 'BUILD A SANDCASTLE WITH A FLAG', 'BUILD A LIGHTHOUSE', 'WHAT A FINE SANDCASTLE!', 'A SHELL WOULD FINISH IT', 'BUILD IT UP WITH A SHOVEL', 'ON SAND IT BUILDS A SANDCASTLE', 'ITS BEAM SWEEPS ROUND AT NIGHT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: castles at every stage and the lighthouse on the shore in the evening
await g.ev(`(() => { const { x, y } = _se, w = WGS.world, d = WGS.dim, p = WGS.p; for (let i = 0; i < 5; i++) wgSetObj(w, d, x - 2 + i, y + 1, O_ID.sandcastle, i);
  p.x = x * 16 + 8; p.y = y * 16 + 4; p.face = 'r'; WGS.clock = 0.86; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('seaside', await g.shot('wg_seaside.png'));
await g.ev(`WGS.clock = 0.45; 0`); await sleep(200); console.log('seaside day', await g.shot('wg_seaside_day.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SEASIDE OK' : 'SEASIDE FAIL'); g.close(); process.exit(pass ? 0 : 1);
