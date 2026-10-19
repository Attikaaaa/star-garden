// Wildgrove's little wonders: paper boats from a bench, USEd on water they float, drift with the wind, run ashore and
// rest, and are gone after a while, never set on land; a guest's launch is taken only from beside that guest; a
// terrarium from the furnace glows faintly and a dewdrop runs down its glass; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'WONDERS' }, seed: { v: '272' }, look: { skin: 6, hair: 1, shirt: 5 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; WGS.inv[WGS.sel] = null; WGPBT.list.length = 0; WGPBT.w = w;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const run = (s) => { for (let i = 0; i < s * 60; i++) updateWG(1 / 60); };
  const R = rect; const rects = (fn) => { const L = []; rect = function (a, b, c, e, k) { L.push([a, b, c, e, k]); return R(...arguments); }; try { fn(); } finally { rect = R; } return L; };`;
let r = await g.ev(`(() => { ${setup} for (let j = -12; j <= 12; j++) for (let i = -18; i <= 18; i++) if (Math.abs(i) > 1 || Math.abs(j) > 1) wgSetGround(w, 'o', x + i, y + j, G_ID.deep);
  const res = { at: (RECIPES.find(q => q.out === 'paper_boat') || {}).at, icon: !!wgIcon('paper_boat') }; WGS.inv[WGS.sel] = { id: 'paper_boat', n: 5 }; st.pboats = 0;
  res.land = !wgUse(x, y + 1) || WGPBT.list.length === 0; res.launch = wgUse(x + 2, y) && WGPBT.list.length === 1 && WGS.inv[WGS.sel].n === 4 && st.pboats === 1; const b = WGPBT.list[0], x0 = b.x, y0 = b.y;
  const a = wgWindA(); run(10); res.drift = (b.x - x0) * Math.cos(a) + (b.y - y0) * Math.sin(a) > 20 && !b.ashore; res.ents = wgEntities(p.x - 300, p.y - 200, p.x + 300, p.y + 200).some(e => e.b === b);
  run(WG_PB_T - 9); res.gone = WGPBT.list.length === 0; WGS.inv[WGS.sel] = null; return res; })()`);
ok(r.at === 'bench' && r.icon && r.land, 'paper boats from a bench, an icon, never set on land: ' + JSON.stringify([r.at, r.icon, r.land]));
ok(r.launch && r.drift && r.ents && r.gone, 'USEd on water one floats, drifts with the wind and is gone after a while: ' + JSON.stringify([r.launch, r.drift, r.ents, r.gone]));
r = await g.ev(`(() => { ${setup} for (let j = -1; j <= 1; j++) for (let i = 3; i <= 5; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.shallow); wgPbAdd(x * 16 + 4 * 16 + 8, y * 16 + 8, 'o', 7); const b = WGPBT.list[0];
  run(20); const res = { ashore: b.ashore > 0, inside: Math.floor(b.x / 16) >= x + 3 && Math.floor(b.x / 16) <= x + 5 && Math.floor(b.y / 16) >= y - 1 && Math.floor(b.y / 16) <= y + 1 }; const bx = b.x; run(3); res.rests = b.x === bx;
  const L = { pid: 1 }; WGS.remote = [{ pid: 1, x: p.x, y: p.y, dim: 'o' }]; const n0 = WGPBT.list.length; wgnHostMsg(L, { t: 'pboat', x: p.x + 20, y: p.y, d: 'o', s: 3 }); res.near = WGPBT.list.length - n0;
  L.pbT = 0; wgnHostMsg(L, { t: 'pboat', x: p.x + 500, y: p.y, d: 'o', s: 4 }); res.far = WGPBT.list.length - n0; WGS.remote = []; return res; })()`);
ok(r.ashore && r.inside && r.rests, 'on a small pond it runs ashore and rests: ' + JSON.stringify([r.ashore, r.inside, r.rests]));
ok(r.near === 1 && r.far === 1, "a guest's launch is taken only from beside that guest: " + JSON.stringify([r.near, r.far]));
r = await g.ev(`(() => { ${setup} const res = { at: (RECIPES.find(q => q.out === 'terrarium') || {}).at, light: OBJ[O_ID.terrarium].light, art: !!WGA.obj.terrarium, icon: !!wgIcon('terrarium') };
  wgSetObj(w, 'o', x + 2, y, O_ID.terrarium); let drops = 0; const t0 = WGS.t; for (let i = 0; i < 70; i++) { WGS.t = t0 + i * 0.1; drops += rects(() => wgDrawObj(O_ID.terrarium, x + 2, y, 100, 100)).filter(q => q[4] === 'w' && q[2] === 1).length; } WGS.t = t0;
  WGR.lights.length = 0; wgDrawObj(O_ID.terrarium, x + 2, y, 100, 100); res.lit = WGR.lights.length; res.drops = drops; return res; })()`);
ok(r.at === 'furnace' && r.light > 0 && r.art && r.icon && r.lit === 1 && r.drops >= 5 && r.drops <= 40, 'a terrarium from the furnace glows faintly, a dewdrop now and then: ' + JSON.stringify(r));
const EN = ['PAPER BOAT', 'USE IT ON WATER', 'IT DRIFTS WITH THE WIND', 'SET SAIL', 'FLOAT FIVE PAPER BOATS', 'TERRARIUM', 'A LITTLE GARDEN IN A JAR'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a pond with paper boats drifting, a terrarium on a little table by the bank
await g.ev(`(() => { ${setup} for (let j = -4; j <= 4; j++) for (let i = -2; i <= 12; i++) wgSetGround(w, 'o', x + i, y + j, Math.abs(j) < 3 && i > -1 && i < 11 ? G_ID.deep : G_ID.shallow);
  for (const [i, j, s, k] of [[2, -1, 11, 6], [5, 1, 23, 14], [8, -2, 37, 25], [4, 3, 41, 3]]) { wgPbAdd((x + i) * 16 + 8, (y + j) * 16 + 8, 'o', s); WGPBT.list[WGPBT.list.length - 1].t0 -= k; }
  wgSetObj(w, 'o', x - 4, y - 1, O_ID.table || O_ID.stool); wgSetObj(w, 'o', x - 4, y, O_ID.terrarium); for (const [i, j, o] of [[-7, -4, 'oak'], [14, -5, 'birch'], [-6, 4, 'reeds']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  p.x = (x - 3) * 16 + 8; p.y = (y + 1) * 16 + 10; WGS.cam.x = p.x + 70; WGS.cam.y = p.y - 10; WGS.clock = 0.82; p.face = 'r'; })(); 0`);
await sleep(250); console.log('wonders', await g.shot('wg_wonders.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'WONDERS OK' : 'WONDERS FAIL'); g.close(); process.exit(pass ? 0 : 1);
