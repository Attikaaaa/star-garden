// Wildgrove's snow angels: an empty hand USEd on the snow under your feet makes one, flat and walkable, counted; not
// with something in hand, seated, off snow or on a tile with something on it; an empty hand on snow elsewhere still
// scoops a snowball; the fresh fall fills them in; SNOW ANGEL; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ANGELS' }, seed: { v: '824' }, look: { skin: 0, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.snow); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0; p.sit = null; p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 25; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const A = O_ID.snow_angel;`;
let r = await g.ev(`(() => { ${setup} const res = {}; st.angels = 0;
  res.make = [wgUse(x, y), wgObjAt(w, 'o', x, y) === A, st.angels, WGS.toast && WGS.toast.msg, OBJ[A].solid, OBJ[A].drops.length];
  WGS.toast = null; p.x += 16; wgUse(x + 1, y); res.second = [wgObjAt(w, 'o', x + 1, y) === A, st.angels, !!WGS.toast];
  p.x += 16; WGS.inv[0] = { id: 'stick', n: 1 }; wgUse(x + 2, y); res.held = wgObjAt(w, 'o', x + 2, y); WGS.inv[0] = null;
  wgSetGround(w, 'o', x + 2, y, G_ID.grass); wgUse(x + 2, y); res.grass = wgObjAt(w, 'o', x + 2, y); wgSetGround(w, 'o', x + 2, y, G_ID.snow);
  wgSetObj(w, 'o', x + 2, y, O_ID.picnic); wgSit(x + 2, y); res.sat = !!p.sit; wgUse(x + 2, y); res.seated = wgObjAt(w, 'o', x + 2, y) === O_ID.picnic; wgStand(); wgSetObj(w, 'o', x + 2, y, 0);
  p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.drops.length = 0; wgUse(x, y + 2); res.scoop = [wgObjAt(w, 'o', x, y + 2), WGS.drops.some(d => d.id === 'snowball')];
  const H = WG_ACH.find(a => a[0] === 'angel')[3]; res.ach = [H({ st: { angels: 1 }, seen: {} }), H({ st: {}, seen: {} })]; return res; })()`);
ok(r.make.join() === 'true,true,1,A SNOW ANGEL!,0,0' && r.second.join() === 'true,2,false', 'an empty hand on the snow under your feet makes one, flat, nothing to drop, counted: ' + JSON.stringify([r.make, r.second]));
ok(r.held === 0 && r.grass === 0 && r.sat && r.seated && r.scoop[0] === 0 && r.scoop[1] && r.ach.join() === 'true,false', 'not with something in hand, off snow or seated; elsewhere still a snowball; SNOW ANGEL: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; for (let i = -5; i <= 5; i++) wgSetObj(w, 'o', x + i, y + 3, A); const n = () => { let c = 0; for (let i = -5; i <= 5; i++) if (wgObjAt(w, 'o', x + i, y + 3) === A) c++; return c; };
  for (let k = 0; k < 40; k++) { WGS.growT = 0; wgGrowTick(1); } res.dry = n(); WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; for (let k = 0; k < 60; k++) { WGS.growT = 0; wgGrowTick(1); } res.wet = n(); WGS.weather = null;
  const D = ctx.drawImage.bind(ctx); let m = 0; const art = wgAngelArt(); ctx.drawImage = function (img) { if (img === art) m++; return D(...arguments); }; wgSetObj(w, 'o', x, y + 4, A);
  try { wgDrawObj(A, x, y + 4, 100, 100); } finally { ctx.drawImage = D; } res.drawn = m; return res; })()`);
ok(r.dry === 11 && r.wet < 8 && r.drawn === 1, 'the fresh fall fills them in, one by one; drawn flat: ' + JSON.stringify(r));
const EN = ['SNOW ANGEL', 'EMPTY HANDED, USE THE SNOW UNDER YOU', 'A SNOW ANGEL!'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { ${setup} for (const [i, j] of [[-2, 0], [0, 1], [2, -1]]) wgSetObj(w, 'o', x + i, y + j, A); for (const [i, j, k] of [[-5, -3, 'snowpine'], [5, -2, 'snowpine'], [4, 3, 'snowman']]) if (O_ID[k]) wgSetObj(w, 'o', x + i, y + j, O_ID[k]);
  p.x = (x + 1) * 16 + 8; WGS.cam.x = p.x; WGS.cam.y = p.y; window._an = setInterval(() => { WGS.clock = 0.45; }, 50); })(); 0`);
await sleep(400); console.log('angels', await g.shot('wg_angel.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'ANGEL OK' : 'ANGEL FAIL'); g.close(); process.exit(pass ? 0 : 1);
