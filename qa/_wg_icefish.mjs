// Wildgrove's ice fishing and snow globe: objects and a recipe; a rod on bare ice cuts a hole (not under your feet, not
// on grass), the rod on the hole fishes through it; icefin bite more there, the first catch lights ICE FISHER (not a
// catch elsewhere); a pick closes the hole and leaves nothing; the hole's ripple; a snow globe's snow drifts and whirls
// when shaken, then settles; tips, Hungarian; a look on a winter's day.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ICE' }, seed: { v: '50' }, look: { skin: 0, hair: 1, shirt: 5 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'snowglobe'); return [!!(WGA.obj.ice_hole || [])[0], !!(WGA.obj.snowglobe || [])[0], OBJ[O_ID.ice_hole].drops.length, rc && rc.at]; })()`);
ok(r[0] && r[1] && r[2] === 0 && r[3] === 'bench', 'a hole, a globe and its recipe: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -5; j < 6; j++) for (let i = -8; i < 9; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, i < -5 ? G_ID.grass : G_ID.ice); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { icefish: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 10; window._ic = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'rod', n: 1 }; WGS.sel = 0; WGS.fish = null; WGS.weather = null; WGS.wxT = 9999;
  const at = (i) => wgObjAt(w, d, x + i, y) === O_ID.ice_hole, res = [];
  wgUse(x, y); res.push(at(0)); wgUse(x - 7, y); res.push(wgObjAt(w, d, x - 7, y) === O_ID.ice_hole); WGS.toast = null; wgUse(x + 2, y); res.push(at(2), WGS.toast && WGS.toast.msg);
  wgUse(x + 2, y); res.push(WGS.fish && WGS.fish.ice, WGS.fish && WGS.fish.tx === x + 2); return res; })()`);
ok(r[0] === false && r[1] === false && r[2] && r[3] === 'YOU CUT A HOLE IN THE ICE', 'a rod cuts a hole in bare ice, not under your feet, not on grass: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4] === 1 && r[5], 'the rod on the hole fishes through it: ' + JSON.stringify(r.slice(4)));
r = await g.ev(`(() => { const { x, y } = _ic, R = Math.random, st = WGS.world.meta.stats, res = [];
  try { WGS.dim = 'o'; Math.random = () => 0.3; res.push(wgCatch({ tx: x + 2, ty: y })); res.push(!!st.icefish); res.push(wgCatch({ tx: x + 2, ty: y, ice: 1 }), !!st.icefish); Math.random = () => 0.9; res.push(wgCatch({ tx: x + 2, ty: y, ice: 1 })); }
  finally { Math.random = R; }
  WGS.fish = { tx: x + 2, ty: y, t: 0.01, ice: 1 }; WGS.toast = null; updateWG(1 / 60); updateWG(1 / 60); res.push(WGS.fish, WGS.toast && WGS.toast.msg.startsWith('CAUGHT'), WGS.inv.some(s => s && s.id !== 'rod'));
  WGS.drops.length = 0; wgBreak(x + 2, y, true); res.push(wgObjAt(WGS.world, WGS.dim, x + 2, y), WGS.drops.length); return res; })()`);
ok(r[1] === false && r[2] === 'fish_ice' && r[3] === true && r[4] !== 'fish_ice', 'icefin bite more through the ice, ICE FISHER for the first catch there (not elsewhere): ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] === null && r[6] && r[7], 'a catch through the hole lands in the pack: ' + JSON.stringify(r.slice(5, 8)));
ok(r[8] === 0 && r[9] === 0, 'a pick closes the hole and leaves nothing: ' + JSON.stringify(r.slice(8)));
r = await g.ev(`(() => { const { x, y } = _ic, w = WGS.world, d = WGS.dim, F = ctx.fillRect.bind(ctx); wgSetObj(w, d, x + 3, y, O_ID.ice_hole); wgSetObj(w, d, x - 3, y, O_ID.snowglobe);
  const count = (id, tx, col) => { let n = 0; const pts = []; ctx.fillRect = function (a, b) { if (ctx.fillStyle === PAL[col]) { n++; pts.push(a + ',' + b); } return F(...arguments); }; try { wgDrawObj(id, tx, y, 100, 100); } finally { ctx.fillRect = F; } return pts; };
  let rip = 0; const t0 = WGS.t; for (let k = 0; k < 16; k++) { WGS.t = t0 + k * 0.17; rip += count(O_ID.ice_hole, x + 3, 'c').length; } WGS.t = t0;
  const rest = count(O_ID.snowglobe, x - 3, 'w'); WGS.toast = null; wgUse(x - 3, y); const shaken = count(O_ID.snowglobe, x - 3, 'w'), was = WGSG.shake.has((x - 3) + ',' + y);
  WGS.t = t0 + 3; count(O_ID.snowglobe, x - 3, 'w'); const after = WGSG.shake.has((x - 3) + ',' + y); WGS.t = t0;
  return [rip, rest.length, shaken.length, rest.join() !== shaken.join(), was, after]; })()`);
ok(r[0] >= 2 && r[1] >= 3 && r[2] >= 3 && r[3] && r[4] && !r[5], "the hole's ripple; the globe's snow drifts, whirls when shaken, then settles: " + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; wgAchTick(); return [!!m.ach.icefish, wgTipLines({ id: 'rod', n: 1 }), wgTipLines({ id: 'snowglobe', n: 1 })]; })()`);
ok(r[0] && r[1].includes('ON ICE IT CUTS A HOLE TO FISH THROUGH') && r[2].includes('USE IT TO SHAKE IT'), 'ICE FISHER, tips: ' + JSON.stringify(r));
const EN = ['ICE HOLE', 'SNOW GLOBE', 'ICE FISHER', 'CATCH A FISH THROUGH THE ICE', 'YOU CUT A HOLE IN THE ICE', 'ON ICE IT CUTS A HOLE TO FISH THROUGH', 'USE IT TO SHAKE IT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: fishing through the ice on a winter's day, a snow globe on the shore
await g.ev(`(() => { const { x, y } = _ic, w = WGS.world, d = WGS.dim, p = WGS.p; wgSetObj(w, d, x + 3, y, 0); wgSetObj(w, d, x + 2, y + 1, O_ID.ice_hole); wgSetObj(w, d, x - 2, y - 2, O_ID.ice_hole);
  wgSetObj(w, d, x - 6, y + 1, O_ID.snowglobe); WGS.day = 25; WGS.clock = 0.45; p.x = x * 16 + 8; p.y = y * 16 + 14; p.face = 'r'; WGS.inv[0] = { id: 'rod', n: 1 }; WGS.sel = 0;
  WGS.fish = { tx: x + 2, ty: y + 1, t: 99, ice: 1 }; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('icefish', await g.shot('wg_icefish.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'ICEFISH OK' : 'ICEFISH FAIL'); g.close(); process.exit(pass ? 0 : 1);
