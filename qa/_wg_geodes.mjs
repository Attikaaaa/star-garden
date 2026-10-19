// Wildgrove's geodes: a boulder, an ore or rock broken by hand now and then gives one (not a tree, not by itself); USE it
// in hand, even with the aim out of reach, cracks it open for a mineral by weight; a mineral case from a bench takes one
// of each (the tile's meta), says what it holds, draws them behind the glass and gives them back when broken; ROCK
// HOUND for a full case; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'GEODES' }, seed: { v: '276' }, look: { skin: 2, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const MIN = ['amethyst', 'rose_quartz', 'citrine', 'jade', 'opal'];
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const count = (id) => WGS.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  const MIN = ${JSON.stringify(MIN)}; const R0 = Math.random; const rig = (v, fn) => { Math.random = () => v; try { return fn(); } finally { Math.random = R0; } };
  const DI = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, arguments[1], arguments[2]]); return DI(...arguments); }; try { fn(); } finally { ctx.drawImage = DI; } return L; };
  const names = (L) => L.map(q => Object.keys(WGA.cache).find(k => WGA.cache[k] === q[0])).filter(Boolean);`;
let r = await g.ev(`(() => { ${setup} const rec = (RECIPES.find(q => q.out === 'rock_case') || {}).at;
  return { rec, icons: ['geode', 'rock_case'].concat(MIN).every(id => WGI[id] && wgIcon(id) && wgIcon(id).width === 16), tips: wgTipLines({ id: 'geode', n: 1 }).includes('USE IT TO CRACK IT OPEN') && wgTipLines({ id: 'opal', n: 1 }).includes('SHOW IT IN A MINERAL CASE') && wgTipLines({ id: 'rock_case', n: 1 }).includes('A CASE FOR YOUR MINERALS') }; })()`);
ok(r.rec === 'bench' && r.icons && r.tips, 'a geode, five minerals and a mineral case from a bench, with icons and tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; const brk = (id, by, v) => { wgSetObj(w, 'o', x + 2, y, O_ID[id]); WGS.drops.length = 0; rig(v, () => wgBreak(x + 2, y, by)); return WGS.drops.filter(d => d.id === 'geode').length; };
  res.got = [brk('boulder', true, 0.01), brk('ore_iron', true, 0.01), brk('cliff', true, 0.01)]; res.not = [brk('boulder', false, 0.01), brk('oak', true, 0.01), brk('boulder', true, 0.2), brk('cliff', true, 0.04)];
  return res; })()`);
ok(r.got.join() === '1,1,1' && r.not.join() === '0,0,0,0', 'a rock broken by hand now and then gives a geode, not a tree, not by itself: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; WGS.inv[0] = { id: 'geode', n: 3 };
  res.first = [rig(0, () => wgUse(x + 1, y)), count('geode'), count('amethyst'), WGS.toast && WGS.toast.msg]; res.rare = [rig(0.99, () => wgUse(x + 1, y)), count('opal')];
  Input.lastAim = 'mouse'; Input.mx = 380; Input.my = 20; WGS.cam.x = p.x; WGS.cam.y = p.y; Input.rHit = true; rig(0.6, () => updateWG(1 / 60)); Input.rHit = false; res.far = [WGS.target, count('geode'), count('citrine') + count('jade')];
  WGS.inv[0] = { id: 'wood', n: 1 }; res.wood = [wgUse(x + 1, y), count('wood')]; return res; })()`);
ok(r.first[0] && r.first[1] === 2 && r.first[2] === 1 && r.first[3] === 'AMETHYST' && r.rare[1] === 1, 'USE cracks a geode for a mineral by weight: ' + JSON.stringify([r.first, r.rare]));
ok(!r.far[0] && r.far[1] === 0 && r.far[2] === 1 && !r.wood[0], 'even with the aim out of reach; nothing else cracks: ' + JSON.stringify([r.far, r.wood]));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y, O_ID.rock_case); st.rockcase = 0; const res = {}; const say = () => WGS.toast && WGS.toast.msg;
  wgUse(x + 2, y); res.empty = say(); MIN.forEach((id, i) => WGS.inv[i] = { id, n: 2 }); WGS.sel = 0; wgUse(x + 2, y); res.one = [wgMetaAt(w, 'o', x + 2, y), count('amethyst')]; wgUse(x + 2, y); res.again = [say(), count('amethyst')];
  WGS.sel = 6; wgUse(x + 2, y); res.tells = say(); const art = () => names(imgs(() => wgDrawObj(O_ID.rock_case, x + 2, y, 100, 100)));
  res.drawOne = art(); for (let i = 1; i < 5; i++) { WGS.sel = i; wgUse(x + 2, y); } res.full = [wgMetaAt(w, 'o', x + 2, y), st.rockcase, say()]; WGS.sel = 6; wgUse(x + 2, y); res.five = say(); res.drawAll = art();
  WGS.drops.length = 0; wgBreak(x + 2, y, true); res.back = WGS.drops.map(d => d.id).sort().join();
  const A = WG_ACH.find(a => a[0] === 'rockhound')[3]; res.ach = [A({ st: { rockcase: 1 }, seen: {} }), A({ st: {}, seen: {} })]; return res; })()`);
ok(r.empty === 'PUT A MINERAL IN IT' && r.one.join() === '1,1' && r.again.join() === 'THERE IS ONE IN IT ALREADY,1' && r.tells === '1 OF 5 MINERALS', 'a case takes one of each and says what it holds: ' + JSON.stringify([r.empty, r.one, r.again, r.tells]));
ok(r.full[0] === 31 && r.full[1] === 1 && r.full[2] === 'A FULL COLLECTION!' && r.five === '5 OF 5 MINERALS' && r.ach.join() === 'true,false', 'ROCK HOUND for a full case: ' + JSON.stringify([r.full, r.five, r.ach]));
ok(r.drawOne.join() === 'geo_case,geo_min0,geo_glint' && r.drawAll.join() === 'geo_case,geo_min0,geo_min1,geo_min2,geo_min3,geo_min4,geo_glint', 'drawn behind the glass: ' + JSON.stringify([r.drawOne, r.drawAll]));
ok(r.back === 'amethyst,citrine,jade,opal,rock_case,rose_quartz', 'broken, it gives them back: ' + r.back);
const EN = ['GEODE', 'AMETHYST', 'ROSE QUARTZ', 'CITRINE', 'JADE', 'OPAL', 'MINERAL CASE', 'ROCK HOUND', 'FILL A MINERAL CASE WITH ALL FIVE', 'USE IT TO CRACK IT OPEN', 'A CASE FOR YOUR MINERALS', 'FOUND IN A GEODE',
  'SHOW IT IN A MINERAL CASE', '3 OF 5 MINERALS', 'PUT A MINERAL IN IT', 'THERE IS ONE IN IT ALREADY', 'A FULL COLLECTION!'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: two cases, one full and one begun, the hero with a geode in hand and every mineral in the hotbar
await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y - 1, O_ID.rock_case, 31); wgSetObj(w, 'o', x + 4, y - 1, O_ID.rock_case, 5); for (const [i, j] of [[-4, -3], [-6, 1], [6, 2]]) wgSetObj(w, 'o', x + i, y + j, O_ID.boulder);
  ['geode', 'rock_case'].concat(MIN).forEach((id, i) => WGS.inv[i] = { id, n: 1 + i }); WGS.sel = 0; p.face = 'r'; WGS.cam.x = p.x + 24; })(); 0`);
await sleep(200); console.log('geodes', await g.shot('wg_geodes.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'GEODES OK' : 'GEODES FAIL'); g.close(); process.exit(pass ? 0 : 1);
