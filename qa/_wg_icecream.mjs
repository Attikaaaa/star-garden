// Wildgrove's ice cream: waffle cones at a fire, an ice cream cart from a bench that is a station (USE opens the recipe
// book), four cones and a sorbet made there; each tasted is a bit of stats.ices and a brain freeze now and then in
// summer only; ICE CREAM DREAM for all five; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ICECREAM' }, seed: { v: '278' }, look: { skin: 0, hair: 3, shirt: 5 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const ICES = ['ice_vanilla', 'ice_straw', 'ice_choc', 'ice_mint', 'ice_lemon'];
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const ICES = ${JSON.stringify(ICES)};
  const R0 = Math.random; const rig = (v, fn) => { Math.random = () => v; try { return fn(); } finally { Math.random = R0; } };`;
let r = await g.ev(`(() => { ${setup} const at = (id) => (RECIPES.find(q => q.out === id) || {}).at;
  return { at: ['waffle_cone', 'icecart'].concat(ICES).map(at), icons: ['waffle_cone', 'icecart'].concat(ICES).every(id => WGI[id] && wgIcon(id) && wgIcon(id).width === 16), food: ICES.every(id => WGI[id].kind === 'food' && WGI[id].food >= 3),
    where: WG_AT.icecart, tips: wgTipLines({ id: 'icecart', n: 1 }).includes('MAKES ICE CREAM') && wgTipLines({ id: 'waffle_cone', n: 1 }).includes('FOR ICE CREAM') }; })()`);
ok(r.at.join() === 'fire,bench,icecart,icecart,icecart,icecart,icecart' && r.icons && r.food && r.where === 'AT AN ICE CREAM CART' && r.tips, 'cones at a fire, a cart from a bench where four cones and a sorbet are made: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; res.before = !!wgStations().icecart; wgSetObj(w, 'o', x + 1, y, O_ID.icecart); res.near = !!wgStations().icecart; res.used = wgUse(x + 1, y); res.open = [WGS.scr, WGS.ui.tab];
  WGS.scr = 'play'; WGS.ui = {}; return res; })()`);
ok(!r.before && r.near && r.used && r.open.join() === 'inv,craft', 'the cart is a station and USE opens the recipe book: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; st.ices = 0; const eat = (id, day, v) => { WGS.day = day; WGS.toast = null; p.food = 2; WGS.inv[0] = { id, n: 1 }; rig(v, () => wgEat(0)); return WGS.toast ? WGS.toast.msg : ''; };
  res.summerCold = eat('ice_vanilla', 9, 0.05); res.summerFine = eat('ice_straw', 9, 0.9); res.spring = eat('ice_choc', 2, 0.05); res.winter = eat('ice_mint', 26, 0.05); res.bits = st.ices; eat('ice_lemon', 9, 0.9); res.all = st.ices;
  WGS.inv[0] = { id: 'bread', n: 1 }; p.food = 2; rig(0.05, () => wgEat(0)); res.bread = st.ices;
  const A = WG_ACH.find(a => a[0] === 'icecream')[3]; res.ach = [A({ st: { ices: 31 }, seen: {} }), A({ st: { ices: 15 }, seen: {} })]; return res; })()`);
ok(r.summerCold === 'BRAIN FREEZE!' && r.summerFine !== 'BRAIN FREEZE!' && r.spring !== 'BRAIN FREEZE!' && r.winter !== 'BRAIN FREEZE!', 'a brain freeze now and then, in summer only: ' + JSON.stringify(r));
ok(r.bits === 15 && r.all === 31 && r.bread === 31 && r.ach.join() === 'true,false', 'each tasted is a bit, ICE CREAM DREAM for all five: ' + JSON.stringify([r.bits, r.all, r.bread, r.ach]));
const EN = ['WAFFLE CONE', 'ICE CREAM CART', 'VANILLA CONE', 'STRAWBERRY CONE', 'CHOCOLATE CONE', 'MINT CONE', 'LEMON SORBET', 'AT AN ICE CREAM CART', 'ICE CREAM DREAM', 'TASTE EVERY ICE CREAM', 'BRAIN FREEZE!', 'MAKES ICE CREAM', 'FOR ICE CREAM'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the cart by a sunny path, the hero with a cone in hand and every ice in the hotbar
await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y - 1, O_ID.icecart); for (let i = -6; i < 7; i++) wgSetGround(w, 'o', x + i, y + 1, G_ID.gravel || G_ID.dirt);
  for (const [i, j, o] of [[-4, -3, 'oak'], [5, -4, 'birch']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  ICES.concat(['waffle_cone', 'icecart']).forEach((id, i) => WGS.inv[i] = { id, n: 1 + i }); WGS.sel = 3; p.face = 'r'; WGS.cam.x = p.x + 16; })(); 0`);
await sleep(200); console.log('icecream', await g.shot('wg_icecream.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'ICECREAM OK' : 'ICECREAM FAIL'); g.close(); process.exit(pass ? 0 : 1);
