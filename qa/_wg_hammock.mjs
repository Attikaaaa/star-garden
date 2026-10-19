// Wildgrove's hammock: art and a recipe; USE lies the hero back in it; it heals half as fast again as a chair and the
// time in it counts; LAZY DAY after a minute; its cloth is drawn, and drawn again over its rider, who sways with it (a
// friend too); z's rise after a while, not at once, and start over after standing up; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'LAZY' }, seed: { v: '45' }, look: { skin: 1, hair: 0, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'hammock'), o = OBJ[O_ID.hammock]; return [!!(WGA.obj.hammock || [])[0], rc && rc.at, rc && JSON.stringify(rc.in), o.seat, o.solid]; })()`);
ok(r[0] && r[1] === 'bench' && r[2] === '{"wood":4,"wool":3,"string":2}' && r[3] === 1 && r[4] === 0, 'art, a recipe, a seat you can walk through: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = [];
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { hammock: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; p.hp = p.maxHp; p.food = 20;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; window._hm = [x + 2, y];
  wgSetObj(w, d, x + 2, y, O_ID.hammock); wgSetObj(w, d, x - 2, y, O_ID.chair);
  const sit = (tx) => { p.sit = null; p.x = tx * 16 + 8; p.y = y * 16 + 30; wgUse(tx, y); const s = !!p.sit; for (let i = 0; i < 60; i++) updateWG(1 / 60); return [s, +p.sit.t.toFixed(2)]; };
  res.push(sit(x - 2), sit(x + 2), +(w.meta.stats.hammock || 0).toFixed(2), p.y === y * 16 + 12); return res; })()`);
ok(r[0][0] && r[1][0] && r[3], 'USE lies the hero back in it: ' + JSON.stringify(r));
ok(Math.abs(r[1][1] / r[0][1] - 1.5) < 0.05 && r[2] > 0.95 && r[2] < 1.05, 'half as fast again as a chair, and the time counts: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.hammock = 59; wgAchTick(); const a = !!m.ach.hammock; m.stats.hammock = 60; wgAchTick(); return [a, !!m.ach.hammock]; })()`);
ok(!r[0] && r[1], 'LAZY DAY after a minute: ' + JSON.stringify(r));
// drawn: the cloth alone, then over its rider; the rider sways with it; z's after a while
r = await g.ev(`(() => { const p = WGS.p, [tx, ty] = _hm, cx0 = WGS.cam.x - 192, cy0 = WGS.cam.y - 108, R = rect, T = ctx.translate.bind(ctx), Z = wgHamZ, res = {};
  let n = 0, tr = [], z = 0; rect = function (x, y, w, h, k) { if (k === 'A' || k === 'a') n++; return R(...arguments); }; ctx.translate = function (a, b) { tr.push(a + ',' + b); return T(a, b); }; wgHamZ = function () { z++; return Z(...arguments); };
  try {
    p.sit = null; n = 0; wgDrawObj(O_ID.hammock, tx, ty, tx * 16 - cx0, ty * 16 - cy0); res.empty = n;
    p.sit = { tx, ty, dim: WGS.dim, t: 0 }; p.x = tx * 16 + 8; p.y = ty * 16 + 12; p.face = 'd'; WGHM.clear();
    n = 0; tr = []; z = 0; wgDrawPlayer({ p, y: p.y }, cx0, cy0); res.rider = [n, tr.some(s => s.endsWith(',2')), z];
    const sw = new Set(); for (let k = 0; k < 40; k++) { WGS.t += 0.13; tr = []; wgDrawPlayer({ p, y: p.y }, cx0, cy0); sw.add(tr.find(s => s.endsWith(',2'))); } res.sway = [...sw].sort();
    for (let k = 0; k < 50; k++) { WGS.t += 0.2; z = 0; wgDrawPlayer({ p, y: p.y }, cx0, cy0); } res.nap = z;
    p.sit = null; WGS.t += 2; p.sit = { tx, ty, dim: WGS.dim, t: 0 }; z = 0; wgDrawPlayer({ p, y: p.y }, cx0, cy0); res.again = z; p.sit = null;
    const f = { pid: 7, x: tx * 16 + 8, y: ty * 16 + 12, face: 'S', moving: false, walkT: 0, dim: WGS.dim, hp: 20, name: 'MO', look: { skin: 0, hair: 2, shirt: 1 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, inv: 0 };
    n = 0; z = 0; wgDrawPlayer({ p: f, y: f.y }, cx0, cy0); res.friend = [n, z];
  } finally { rect = R; ctx.translate = T; wgHamZ = Z; } return res; })()`);
ok(r.empty >= 30 && r.rider[0] >= 10 && r.rider[1] && r.rider[2] === 0 && r.friend[0] >= 10 && r.friend[1] === 0, 'the cloth, and again over its rider (a friend too); no z at once: ' + JSON.stringify(r));
ok(r.sway.length >= 2 && r.nap >= 2 && r.again === 0, 'the rider sways with it; z after a while, over again after standing up: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'hammock', n: 1 })`);
ok(r.includes('HEALS HALF AS FAST AGAIN') && r.includes('USE IT TO SIT AND REST'), 'tips: ' + JSON.stringify(r));
const EN = ['HAMMOCK', 'LAZY DAY', 'REST IN A HAMMOCK FOR A MINUTE', 'HEALS HALF AS FAST AGAIN'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: three hammocks under the trees, you lying in one, a friend in another
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, [tx, ty] = _hm;
  for (let j = -5; j < 6; j++) for (let i = -9; i < 10; i++) { wgSetObj(w, d, tx + i, ty + j, 0); wgSetGround(w, d, tx + i, ty + j, G_ID.grass); }
  for (const [i, j] of [[-6, -3], [-1, -4], [5, -3], [7, 2], [-7, 3]]) wgSetObj(w, d, tx + i, ty + j, O_ID.oak);
  for (const i of [-3, 0, 3]) wgSetObj(w, d, tx + i, ty, O_ID.hammock); wgSetObj(w, d, tx + 1, ty + 3, O_ID.campfire);
  p.sit = { tx, ty, dim: d, t: 0 }; p.x = tx * 16 + 8; p.y = ty * 16 + 12; p.face = 'd'; WGHM.clear(); WGHM.set('me', [tx + ',' + ty, WGS.t - 20, WGS.t]);
  WGS.remote = [{ pid: 7, x: (tx - 3) * 16 + 8, y: ty * 16 + 12, face: 'S', moving: false, walkT: 0, dim: d, hp: 20, name: 'MO', look: { skin: 0, hair: 2, shirt: 1 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, inv: 0 }];
  WGS.clock = 0.62; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y; })(); 0`);
await sleep(300); console.log('hammock', await g.shot('wg_hammock.png'));
await g.ev(`WGS.remote = []; WGS.p.sit = null; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'HAMMOCK OK' : 'HAMMOCK FAIL'); g.close(); process.exit(pass ? 0 : 1);
