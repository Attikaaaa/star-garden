// Wildgrove's winter treats and toys: jungle trees now and then give cocoa beans, hot cocoa at the fire is a cup best
// enjoyed sitting down, gingerbread men bake at the fire and four make a gingerbread house whose windows glow; a toy
// train runs round its oval and puffs, USE stops it and sets it going again (the tile's meta), no puffs while it rests
// or with the particles off; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TREATS' }, seed: { v: '267' }, look: { skin: 2, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 25; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const R = rect; const rects = (fn) => { const L = []; rect = function (a, b, c, e, k) { L.push([a, b, c, e, k]); return R(...arguments); }; try { fn(); } finally { rect = R; } return L; };`;
let r = await g.ev(`(() => { ${setup} const rec = (id) => { const q = RECIPES.find(z => z.out === id); return q && [q.at, q.n, q.need || q.in || q.cost]; };
  return { drop: OBJ[O_ID.jungle].drops.find(d => d[0] === 'cocoa'), cocoa: rec('hot_cocoa'), tea: WG_TEA.includes('hot_cocoa'), food: [WGI.hot_cocoa.food, WGI.gingerbread.food], ginger: rec('gingerbread'), house: rec('ginger_house'),
    icons: ['cocoa', 'hot_cocoa', 'gingerbread', 'ginger_house', 'toy_train'].every(k => !!wgIcon(k)), tips: [wgTipLines({ id: 'cocoa', n: 1 }).includes('FROM JUNGLE TREES'), wgTipLines({ id: 'hot_cocoa', n: 1 }).includes('BEST ENJOYED SITTING DOWN'), wgTipLines({ id: 'toy_train', n: 1 }).includes('USE STOPS OR STARTS IT')] }; })()`);
ok(r.drop && r.drop[3] > 0 && r.drop[3] < 1, 'a jungle tree now and then gives cocoa beans: ' + JSON.stringify(r.drop));
ok(r.cocoa && r.cocoa[0] === 'fire' && r.tea && r.ginger && r.ginger[0] === 'fire' && r.house && r.house[0] === 'bench' && r.food[0] > 0 && r.food[1] > 0, 'hot cocoa and gingerbread at the fire, a cup for sitting, the house at a bench: ' + JSON.stringify([r.cocoa, r.tea, r.ginger, r.house, r.food]));
ok(r.icons && r.tips.every(Boolean), 'icons and tips: ' + JSON.stringify([r.icons, r.tips]));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y, O_ID.ginger_house); WGR.lights.length = 0; wgDrawObj(O_ID.ginger_house, x + 2, y, 100, 100); return [!!WGA.obj.ginger_house, WGR.lights.length]; })()`);
ok(r[0] && r[1] === 1, 'the gingerbread house stands and its windows glow: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y, O_ID.toy_train); const res = {}, T0 = WGS.t, cars = (t) => wgTrainCars(x + 2, y, t).map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).sort().join(' ');
  res.runs = cars(T0) !== cars(T0 + 0.5); res.drawn = rects(() => wgDrawObj(O_ID.toy_train, x + 2, y, 100, 100)).filter(q => q[4] === '0' && q[2] === 6).length;
  WGTR.puff.clear(); WGS.parts.length = 0; for (let i = 0; i < 4; i++) { WGS.t = T0 + i * 1; wgDrawObj(O_ID.toy_train, x + 2, y, 100, 100); } res.puffs = WGS.parts.length;
  st.train = 0; res.use1 = wgUse(x + 2, y) && wgMetaAt(w, 'o', x + 2, y) === 1 && WGS.toast.msg === 'THE TRAIN RESTS'; res.still = cars(T0) === cars(T0 + 0.5);
  WGTR.puff.clear(); WGS.parts.length = 0; for (let i = 0; i < 4; i++) { WGS.t = T0 + 10 + i; wgDrawObj(O_ID.toy_train, x + 2, y, 100, 100); } res.restPuffs = WGS.parts.length;
  res.use2 = wgUse(x + 2, y) && wgMetaAt(w, 'o', x + 2, y) === 0 && WGS.toast.msg === 'ALL ABOARD!' && st.train === 1;
  wgOpt().part = 0; WGTR.puff.clear(); WGS.parts.length = 0; for (let i = 0; i < 4; i++) { WGS.t = T0 + 20 + i; wgDrawObj(O_ID.toy_train, x + 2, y, 100, 100); } res.off = WGS.parts.length; wgOpt().part = 2; WGS.t = T0; return res; })()`);
ok(r.runs && r.drawn === 3 && r.puffs >= 3, 'the toy train runs round its oval with two cars and puffs: ' + JSON.stringify([r.runs, r.drawn, r.puffs]));
ok(r.use1 && r.still && r.restPuffs === 0 && r.use2 && r.off === 0, 'USE stops it and sets it going again; no puffs at rest or with the particles off: ' + JSON.stringify([r.use1, r.still, r.restPuffs, r.use2, r.off]));
const EN = ['COCOA BEANS', 'HOT COCOA', 'GINGERBREAD MAN', 'GINGERBREAD HOUSE', 'TOY TRAIN', 'ALL ABOARD!', 'THE TRAIN RESTS', 'GINGERBREAD HOME', 'ALL ABOARD', 'FROM JUNGLE TREES', 'USE STOPS OR STARTS IT', 'ITS WINDOWS GLOW AT NIGHT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a cozy room at dusk, a gingerbread house and a toy train on the carpet, a chair by them
await g.ev(`(() => { ${setup} for (let j = -4; j <= 4; j++) for (let i = -8; i <= 8; i++) wgSetGround(w, 'o', x + i, y + j, Math.abs(i) < 5 && Math.abs(j) < 3 ? G_ID.f_red : G_ID.f_wood);
  for (const [i, j, o] of [[2, -1, 'toy_train'], [-2, -1, 'ginger_house'], [3, 1, 'toy_train'], [-3, 1, 'chair'], [5, -2, 'candle'], [-5, -2, 'fireplace']]) if (O_ID[o]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGS.clock = 0.86; p.face = 'u'; WGS.inv[WGS.sel] = { id: 'hot_cocoa', n: 2 }; })(); 0`);
await sleep(250); console.log('treats', await g.shot('wg_treats.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'TREATS OK' : 'TREATS FAIL'); g.close(); process.exit(pass ? 0 : 1);
