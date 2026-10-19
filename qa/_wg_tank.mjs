// Wildgrove's fish tank: art and a recipe; every way to keep up to two fish has its own meta; USE with a fish lets
// it in (from the pack, the meta sorted), never a third; USE with anything else feeds them, an empty tank says how;
// the fish are drawn in the water, facing the way they swim; a broken tank lets its fish out; a glowfish lights it at
// night; FISH KEEPER; tips, Hungarian; a look at a tank of three.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TANK' }, seed: { v: '73' }, look: { skin: 2, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 60); 0`);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'fish_tank'), keys = new Set(WG_TANK.map(a => a.join()));
  return [!!(WGA.obj.fish_tank || [])[0], rc && rc.at, WG_TANK.length, keys.size, WG_TANK.every((a, i) => WG_TANK_IX.get(a.join()) === i && a.length <= 2)]; })()`);
ok(r[0] && r[1] === 'bench' && r[2] === 28 && r[3] === 28 && r[4], 'art, a recipe, a meta for every way to keep two: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { tank: 1 }; w.meta.stats = { kills: 0, far: 0 }; wgSetObj(w, d, x + 1, y - 1, O_ID.fish_tank); window._tk = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; const res = [];
  WGS.toast = null; WGS.inv[0] = { id: 'wood', n: 1 }; WGS.sel = 0; wgUse(x + 1, y - 1); res.push(WGS.toast && WGS.toast.msg);
  WGS.inv[0] = { id: 'fish_gold', n: 1 }; WGS.inv[20] = { id: 'fish_gold', n: 1 }; WGS.inv[1] = { id: 'fish', n: 2 }; WGS.inv[2] = { id: 'fish_glow', n: 1 };
  wgUse(x + 1, y - 1); res.push(WGS.toast && WGS.toast.msg, !!WGS.inv[0], !WGS.inv[20]);
  const half = !!w.meta.stats.tank; WGS.sel = 2; wgUse(x + 1, y - 1); res.push(wgTankFish(w, d, x + 1, y - 1).join(), !half && !!w.meta.stats.tank);
  WGS.toast = null; WGS.sel = 1; wgUse(x + 1, y - 1); res.push(WGS.toast && WGS.toast.msg, WGS.inv[1] && WGS.inv[1].n, wgTankFish(w, d, x + 1, y - 1).join());
  WGS.sel = 3; wgUse(x + 1, y - 1); res.push(WGTK.fed.get(d + (x + 1) + ',' + (y - 1)) === WGS.t);
  return res; })()`);
ok(r[0] === 'USE A FISH ON IT TO PUT IT IN', 'an empty tank says how: ' + JSON.stringify(r[0]));
ok(r[1] === 'A NEW FRIEND IN THE TANK' && r[2] && r[3] && r[4] === '4,5' && r[5], 'a fish in hand goes in, from the pack first, sorted; a full tank is a star: ' + JSON.stringify(r.slice(1, 6)));
ok(r[6] === 'THE TANK IS FULL' && r[7] === 2 && r[8] === '4,5' && r[9], 'never a third; anything else feeds them: ' + JSON.stringify(r.slice(6)));
r = await g.ev(`(() => { const { x, y } = _tk, D = ctx.drawImage.bind(ctx), seen = []; ctx.drawImage = function (img, a, b) { const i = WGTK.spr.indexOf(img); if (i >= 0) seen.push([i, a - 100, b - 97]); return D(...arguments); };
  const res = []; try { for (const t of [100, 103.3, 107.1]) { WGS.t = t; seen.length = 0; wgDrawObj(O_ID.fish_tank, x + 1, y - 1, 100, 100); res.push(seen.slice()); } } finally { ctx.drawImage = D; } return res; })()`);
const inside = r.every(f => f.length === 2 && f.every(([i, a, b]) => a >= 2 && a + 5 <= 14 && b >= 3 && b + 3 <= 11) && f[0][2] + 3 <= f[1][2]);
const moved = r.some((f, n) => n && f.some((q, j) => q[1] !== r[0][j][1]));
const kinds = r[0].map(q => q[0] >> 1).sort().join();
ok(inside && moved && kinds === '4,5', 'the fish swim in the water, each its own kind and lane: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _tk; let a = 0; const t = WGS.t, ph = hash(x + 1, y - 1, 50), sp = 0.45 + (ph % 100) / 400; const res = [];
  for (const dt of [0, 0.2]) { WGS.t = 200 + dt; const D = ctx.drawImage.bind(ctx); let got = null; ctx.drawImage = function (img, px) { const i = WGTK.spr.indexOf(img); if (i >= 0 && (i >> 1) === 4 && got === null) got = [i & 1, px]; return D(...arguments); };
    try { wgDrawObj(O_ID.fish_tank, x + 1, y - 1, 100, 100); } finally { ctx.drawImage = D; } res.push(got); }
  WGS.t = t; return res; })()`);
ok(r[0] && r[1] && (r[1][1] === r[0][1] || (r[1][1] > r[0][1]) === (r[0][0] === 1)), 'a fish faces the way it swims: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _tk, L = WGR.lights, n0 = L.length, c0 = WGS.clock; WGS.clock = 0.95; wgDrawObj(O_ID.fish_tank, x + 1, y - 1, 100, 100); const a = L.length - n0;
  WGS.clock = 0.5; const n1 = L.length; wgDrawObj(O_ID.fish_tank, x + 1, y - 1, 100, 100); const b = L.length - n1; WGS.clock = c0; return [a, b]; })()`);
ok(r[0] === 1 && r[1] === 0, 'a glowfish lights the tank at night, not by day: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _tk, w = WGS.world, d = WGS.dim; WGS.drops.length = 0; wgBreak(x + 1, y - 1, true); const ids = WGS.drops.map(q => q.id).sort();
  WGS.drops.length = 0; wgSetObj(w, d, x + 1, y - 1, O_ID.fish_tank, WG_TANK_IX.get('4,5')); return ids.join(); })()`);
ok(r === 'fish_glow,fish_gold,fish_tank', 'a broken tank lets its fish out: ' + r);
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.tank = 1; wgAchTick(); return !!m.ach.tank; })()`);
ok(r, 'FISH KEEPER');
r = await g.ev(`wgTipLines({ id: 'fish_tank', n: 1 })`);
ok(r.includes('USE A FISH ON IT TO PUT IT IN') && r.includes('USE IT TO FEED THE FISH'), 'tips: ' + JSON.stringify(r));
const EN = ['FISH TANK', 'FISH KEEPER', 'FILL A FISH TANK', 'THE TANK IS FULL', 'A NEW FRIEND IN THE TANK', 'USE A FISH ON IT TO PUT IT IN', 'USE IT TO FEED THE FISH'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: two tanks of two next to the hero, one just fed
await g.ev(`(() => { const { x, y } = _tk, p = WGS.p, w = WGS.world, d = WGS.dim; wgSetObj(w, d, x + 3, y - 1, O_ID.fish_tank, WG_TANK_IX.get('1,2')); p.x = x * 16 + 8; p.y = y * 16 + 12; p.face = 'r'; WGS.cam.x = x * 16 + 24; WGS.cam.y = y * 16 - 8;
  WGS.clock = 0.35; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; WGTK.fed.set(d + (x + 1) + ',' + (y - 1), WGS.t + 0.2); Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(700); console.log('tank', await g.shot('wg_tank.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'TANK OK' : 'TANK FAIL'); g.close(); process.exit(pass ? 0 : 1);
