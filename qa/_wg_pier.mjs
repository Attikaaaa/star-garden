// Wildgrove's piers: a boardwalk goes out over deep water from the shore, a plank at a time, never floating alone or over
// something on the water; a line cast from the boardwalk bites sooner, one from the shore as before; fish caught off a
// pier count, OFF THE PIER for ten; tips; Hungarian; a look at a pier out over the sea, fishing at its end.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PIER' }, seed: { v: '967' }, look: { skin: 2, hair: 4, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, j < 0 ? G_ID.deep : j < 2 ? G_ID.sand : G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; p.sit = null; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999; WGS.fish = null;
  WGS.day = 9; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const B = WGI.boardwalk;`;
let r = await g.ev(`(() => { ${setup} const res = {};
  res.shore = wgCanPlaceAt(x, y - 1, B); res.alone = wgCanPlaceAt(x, y - 4, B); WGS.inv[0] = { id: 'boardwalk', n: 9 };
  const lay = (j) => { p.x = x * 16 + 8; p.y = (y + j + 1) * 16 + 10; return wgUse(x, y + j) && wgGround(w, 'o', x, y + j) === G_ID.p_board; };
  res.out = [lay(-1), lay(-2), lay(-3), lay(-4)]; res.far = wgCanPlaceAt(x + 3, y - 6, B); res.side = wgCanPlaceAt(x + 1, y - 4, B);
  if (O_ID.lilypad) { wgSetObj(w, 'o', x - 1, y - 2, O_ID.lilypad); res.lily = wgCanPlaceAt(x - 1, y - 2, B); } else res.lily = false;
  res.grass = wgCanPlaceAt(x + 2, y + 3, B); res.shallow = (wgSetGround(w, 'o', x + 5, y - 3, G_ID.shallow), wgCanPlaceAt(x + 5, y - 3, B)); return res; })()`);
ok(r.shore && !r.alone && r.out.every(Boolean), 'a boardwalk goes out over deep water from the shore, plank by plank: ' + JSON.stringify(r));
ok(!r.far && r.side && !r.lily && r.grass && r.shallow, 'never floating alone or over something on the water; land and shallows as before: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; for (let j = -1; j >= -4; j--) wgSetGround(w, 'o', x, y + j, G_ID.p_board); WGS.inv[0] = { id: 'rod', n: 1 };
  const cast = (px, py, tx, ty) => { const L = []; for (let k = 0; k < 30; k++) { WGS.fish = null; p.x = px * 16 + 8; p.y = py * 16 + 10; wgUse(tx, ty); if (WGS.fish) L.push([+WGS.fish.t.toFixed(2), WGS.fish.pier | 0]); } WGS.fish = null; return L; };
  const P = cast(x, y - 4, x + 1, y - 4), S = cast(x + 3, y, x + 3, y - 1);
  res.pier = [P.length, Math.max(...P.map(q => q[0])), Math.min(...P.map(q => q[0])), P.every(q => q[1] === 1)];
  res.shore = [S.length, Math.max(...S.map(q => q[0])), Math.min(...S.map(q => q[0])), S.every(q => q[1] === 0)];
  st.pier = 0; const a = wgCatch({ tx: x + 1, ty: y - 4, pier: 1 }), b = wgCatch({ tx: x + 3, ty: y - 1 }); res.count = [!!WGI[a], !!WGI[b], st.pier];
  const A = WG_ACH.find(q => q[0] === 'pier')[3]; res.ach = [A({ st: { pier: 10 }, seen: {} }), A({ st: { pier: 9 }, seen: {} })];
  res.tips = [wgTipLines({ id: 'boardwalk', n: 1 }).includes('OUT OVER DEEP WATER FROM THE SHORE'), wgTipLines({ id: 'rod', n: 1 }).includes('BITES COME SOONER ON A PIER')]; return res; })()`);
ok(r.pier[0] === 30 && r.pier[1] <= 7 * 0.66 + 0.01 && r.pier[3] && r.shore[0] === 30 && r.shore[2] >= 3 && r.shore[1] > 5 && r.shore[3], 'a line cast from the boardwalk bites sooner, one from the shore as before: ' + JSON.stringify([r.pier, r.shore]));
ok(r.count.join() === 'true,true,1' && r.ach.join() === 'true,false' && r.tips.join() === 'true,true', 'fish off a pier count, OFF THE PIER for ten; tips: ' + JSON.stringify([r.count, r.ach, r.tips]));
const EN = ['OFF THE PIER', 'CATCH TEN FISH FROM A BOARDWALK', 'OUT OVER DEEP WATER FROM THE SHORE', 'BITES COME SOONER ON A PIER'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a pier out over the sea with a T at its end, the hero fishing off it
await g.ev(`(() => { ${setup} for (let j = -1; j >= -6; j--) wgSetGround(w, 'o', x, y + j, G_ID.p_board); for (let i = -2; i <= 2; i++) wgSetGround(w, 'o', x + i, y - 6, G_ID.p_board);
  if (O_ID.lamppost) wgSetObj(w, 'o', x - 2, y - 6, O_ID.lamppost); WGS.inv[0] = { id: 'rod', n: 1 }; p.x = (x + 2) * 16 + 8; p.y = (y - 6) * 16 + 10; p.face = 'r'; wgUse(x + 3, y - 6);
  WGS.cam.x = x * 16 + 8; WGS.cam.y = (y - 3) * 16; window._pi = setInterval(() => { WGS.clock = 0.45; if (WGS.fish) WGS.fish.t = 5; }, 50); })(); 0`);
await sleep(300); console.log('pier', await g.shot('wg_pier.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PIER OK' : 'PIER FAIL'); g.close(); process.exit(pass ? 0 : 1);
