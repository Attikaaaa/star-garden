// Wildgrove's small comforts: a fourth box of hats appended after the frog hat (a cowboy hat, a Santa hat, cat ears,
// bee antennae), each made, worn with USE and drawn into the hero, HABERDASHER at fifteen; soft sounds of the place: rain
// patters outdoors in the rain, waves wash in beside open water, a fire crackles close by, none with the ambient life
// off; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'COMFORTS' }, seed: { v: '269' }, look: { skin: 4, hair: 0, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; WGS.inv[WGS.sel] = null; p.look.hat = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const sf = wgSfx; const sounds = (secs) => { const n = {}; wgSfx = (k) => { n[k] = (n[k] || 0) + 1; }; try { for (let i = 0; i < secs * 60; i++) updateWG(1 / 60); } finally { wgSfx = sf; } return n; };`;
let r = await g.ev(`(() => { ${setup} const ids = ['hat_cowboy', 'hat_santa', 'hat_cat', 'hat_bee'], at = WG_HATS.findIndex(h => h[0] === 'hat_frog'), res = {};
  res.order = ids.map(id => WG_HATS.findIndex(h => h[0] === id) - at); res.recipes = ids.map(id => (RECIPES.find(q => q.out === id) || {}).at);
  res.icons = ids.every(id => !!wgIcon(id)); const bare = wgPlayerSpr('d', 0, p.look); st.hats = 0; res.worn = [];
  for (const id of ids) { WGS.inv[WGS.sel] = { id, n: 1 }; wgUse(x + 40, y); const k = p.look.hat; res.worn.push(WG_HATS[k - 1] && WG_HATS[k - 1][0] === id && wgPlayerSpr('d', 0, p.look) !== bare); }
  wgUse(x + 40, y); res.off = p.look.hat === 0; res.bits = [1, 2, 3, 4].map(i => !!(st.hats & (1 << (at + 1 + i))));
  const A = WG_ACH.find(a => a[0] === 'hats15'); res.ach = [A[3]({ st: { hats: (1 << 16) - 2 }, seen: {} }), A[3]({ st: { hats: (1 << 15) - 2 }, seen: {} })]; WGS.inv[WGS.sel] = null; return res; })()`);
ok(r.order.join() === '1,2,3,4' && r.recipes.every(Boolean) && r.icons, 'four hats appended after the frog hat, each made somewhere, with icons: ' + JSON.stringify([r.order, r.recipes, r.icons]));
ok(r.worn.every(Boolean) && r.off && r.bits.every(Boolean), 'each worn with USE, drawn into the hero, taken off again, counted: ' + JSON.stringify([r.worn, r.off, r.bits]));
ok(r.ach[0] === true && r.ach[1] === false, 'HABERDASHER at fifteen different hats: ' + JSON.stringify(r.ach));
r = await g.ev(`(() => { ${setup} const res = {}; res.dry = sounds(8); WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.rain = sounds(8); WGS.weather = null;
  for (let j = -6; j <= 6; j++) for (let i = 2; i <= 12; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.deep); res.sea = sounds(12);
  for (let j = -6; j <= 6; j++) for (let i = 2; i <= 12; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.grass); wgSetObj(w, 'o', x - 2, y + 1, O_ID.campfire); res.fire = sounds(6);
  wgOpt().amb = 0; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.off = sounds(6); wgOpt().amb = 1; WGS.weather = null; wgSetObj(w, 'o', x - 2, y + 1, 0); p.x = (x - 12) * 16; return res; })()`);
ok(!r.dry.patter && !r.dry.surf && !r.dry.crackle, 'quiet on a dry day in a meadow: ' + JSON.stringify(r.dry));
ok(r.rain.patter >= 12 && r.sea.surf >= 1 && !r.sea.patter && r.fire.crackle >= 4, 'rain patters, waves wash in beside open water, a fire crackles: ' + JSON.stringify([r.rain.patter, r.sea.surf, r.fire.crackle]));
ok(!r.off.patter && !r.off.crackle && !r.off.surf, 'none with the ambient life off: ' + JSON.stringify(r.off));
const EN = ['COWBOY HAT', 'SANTA HAT', 'CAT EARS', 'BEE ANTENNAE', 'HABERDASHER', 'WEAR FIFTEEN DIFFERENT HATS'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: you in a cowboy hat and three friends in the other new hats, by a campfire
await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y, O_ID.campfire); for (const [i, j, o] of [[-6, -3, 'oak'], [7, -3, 'birch'], [-7, 3, 'pine']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  const H = (id) => WG_HATS.findIndex(h => h[0] === id) + 1; p.look.hat = H('hat_cowboy'); p.face = 'r';
  WGS.remote = [[1, 'hat_santa', 3, -1, 'd'], [2, 'hat_cat', 4, 1, 'l'], [3, 'hat_bee', 1, 2, 'u']].map(([pid, h, i, j, f]) => ({ pid, x: (x + i) * 16 + 8, y: (y + j) * 16 + 10, face: f, moving: 0, walkT: 0, dim: 'o', hp: 20, name: 'FRIEND' + pid, look: { skin: pid, hair: pid + 1, shirt: pid, hat: H(h) }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, umb: 0, inv: 0 }));
  WGS.clock = 0.8; })(); 0`);
await sleep(250); console.log('comforts', await g.shot('wg_comforts.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'COMFORTS OK' : 'COMFORTS FAIL'); g.close(); process.exit(pass ? 0 : 1);
