// Wildgrove's quiet nights and bright mornings: cows, sheep, chickens, deer and rabbits fall asleep where they stand
// in the deep of the night and stay put, not a fox, none by day; a hero close by or a hurt wakes one; the sleep goes
// out with the creatures and a guest reads it; an empty hand pats one (a heart, the GENTLE HANDS bits), nothing with
// an item in hand; the dawn chorus sings from the trees in the morning only, not in winter, the rain or with the
// ambient life off; Hungarian; two looks.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SLEEPY' }, seed: { v: '268' }, look: { skin: 0, hair: 3, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; WGBOW.t0 = -999; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; WGS.inv[WGS.sel] = null;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const DI = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, arguments[1], arguments[2]]); return DI(...arguments); }; try { fn(); } finally { ctx.drawImage = DI; } return L; };
  const R = rect; const rects = (fn) => { const L = []; rect = function (a, b, c, e, k) { L.push([a, b, c, e, k]); return R(...arguments); }; try { fn(); } finally { rect = R; } return L; };
  const herd = () => ['cow', 'sheep', 'chicken', 'deer', 'rabbit', 'fox'].map((t, i) => wgSpawnMob(t, p.x - 75 + i * 30, p.y + 50));
  const run = (n) => { for (let i = 0; i < n; i++) wgUpdateMobs(1 / 60); };`;
let r = await g.ev(`(() => { ${setup} const res = {}; WGS.clock = 0; const H = herd(); run(30); const at = H.map(m => [m.x, m.y]); run(90);
  res.zz = H.map(m => m.zz); res.still = H.slice(0, 5).every((m, i) => m.x === at[i][0] && m.y === at[i][1]);
  WGS.clock = 0.45; run(2); res.day = H.map(m => m.zz).join(''); WGS.clock = 0; run(2);
  p.x = H[0].x - 12; p.y = H[0].y; run(2); res.near = [H[0].zz, H[1].zz]; p.x = x * 16 + 8; p.y = y * 16 + 10; run(2);
  H[1].hurt = 0.5; run(1); res.hurt = H[1].zz; return res; })()`);
ok(r.zz.join('') === '111110' && r.still, 'cows, sheep, chickens, deer and rabbits sleep at night and stay put, not a fox: ' + JSON.stringify([r.zz, r.still]));
ok(r.day === '000000' && r.near[0] === 0 && r.near[1] === 1 && r.hurt === 0, 'none by day; a hero close by or a hurt wakes one: ' + JSON.stringify([r.day, r.near, r.hurt]));
r = await g.ev(`(() => { ${setup} WGS.clock = 0; const H = herd(); run(10); const l = H.map(m => [m.id, m.type, Math.round(m.x), Math.round(m.y), 0, 0, m.hp, 0, 'o']), msg = { t: 'mobs', l };
  wgnSend(null, msg, true); const sent = l.map(a => a[10] === 1 ? 1 : 0).join(''); for (const m of WGS.mobs) m.zz = 0; wgnMobs(l); return [sent, WGS.mobs.map(m => m.zz).join('')]; })()`);
ok(r[0] === '111110' && r[1] === '111110', 'the sleep goes out with the creatures and a guest reads it: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const H = herd(), res = {}; st.pat = 0; const tile = (m) => [Math.floor(m.x / 16), Math.floor((m.y - 6) / 16)];
  for (const m of H.slice(0, 3)) { p.x = m.x; p.y = m.y - 20; wgUse(...tile(m)); } res.bits = st.pat; res.at = H.slice(0, 3).every(m => m.patAt === WGS.t);
  const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2; res.heart = imgs(() => wgDrawMob({ m: H[0] }, cx0, cy0)).some(q => q[0] === wgPetHeart());
  WGS.inv[WGS.sel] = { id: 'wood', n: 5 }; H[3].patAt = undefined; wgUse(...tile(H[3])); res.item = H[3].patAt === undefined; WGS.inv[WGS.sel] = null;
  WGS.clock = 0; p.x = H[1].x + 60; p.y = H[1].y; run(5); WGZZ.list.length = 0; wgDrawMob({ m: H[1] }, cx0, cy0); res.z = rects(() => wgDrawLight(cx0, cy0)).some(q => q[4] === 'w' && q[2] === 4 && q[3] === 1); return res; })()`);
ok(r.bits === 7 && r.at && r.heart && r.item, 'an empty hand pats a cow, a sheep and a chicken, a heart floats up; nothing with an item in hand: ' + JSON.stringify([r.bits, r.at, r.heart, r.item]));
ok(r.z, 'a sleeper has a z drifting up: ' + JSON.stringify(r.z));
r = await g.ev(`(() => { ${setup} for (const [i, j] of [[-6, -3], [5, -2], [-3, 4], [7, 3]]) wgSetObj(w, 'o', x + i, y + j, O_ID.oak); const res = {}; st.chorus = 0;
  const sf = wgSfx; let songs = 0; wgSfx = (n) => { if (n === 'song') songs++; return sf(n); }; const sing = () => { WGCH.list.length = 0; songs = 0; try { for (let i = 0; i < 300; i++) updateWG(1 / 60); } finally { } return songs; };
  WGS.clock = 0.2; res.dawn = sing(); WGCH.list.length || updateWG(1 / 60); res.told = [st.chorus]; const n = WGCH.list[0]; res.over = !!n && [[-6, -3], [5, -2], [-3, 4], [7, 3]].some(([i, j]) => Math.abs(n.x - ((x + i) * 16 + 8)) <= 4);
  const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2; res.drawn = imgs(() => wgDrawAmbient(cx0, cy0)).filter(q => [0, 1, 2, 3, 4, 5, 6, 7].some(k => q[0] === wgOcaNoteArt(k))).length > 0;
  WGS.clock = 0.45; res.noon = sing(); WGS.clock = 0.2; WGS.day = 25; res.winter = sing(); WGS.day = 9; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.rain = sing(); WGS.weather = null; wgOpt().amb = 0; res.off = sing(); wgOpt().amb = 1; wgSfx = sf; return res; })()`);
ok(r.dawn >= 2 && r.told[0] === 1 && r.over && r.drawn, 'the dawn chorus sings from the trees in the morning, notes over their crowns, told the first time: ' + JSON.stringify([r.dawn, r.told, r.over, r.drawn]));
ok(r.noon === 0 && r.winter === 0 && r.rain === 0 && r.off === 0, 'not at noon, in winter, in the rain or with the ambient life off: ' + JSON.stringify([r.noon, r.winter, r.rain, r.off]));
const EN = ['GENTLE HANDS', 'PAT A COW, A SHEEP AND A CHICKEN', 'EARLY BIRD', 'HEAR THE DAWN CHORUS', 'THE BIRDS ARE SINGING'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a field at night, the herd asleep under the dark
await g.ev(`(() => { ${setup} for (const [i, j] of [[-8, -4], [9, -3], [-10, 3]]) wgSetObj(w, 'o', x + i, y + j, O_ID.oak); WGS.clock = 0.02;
  for (const [t, i, j] of [['cow', -3, -1], ['cow', -1, 1], ['sheep', 2, -2], ['sheep', 3, 0], ['sheep', 4, 2], ['chicken', -4, 2], ['deer', 6, -3]]) wgSpawnMob(t, (x + i) * 16 + 8, (y + j) * 16 + 12);
  p.x = (x - 8) * 16; run(5); p.x = x * 16 + 8 - 60; p.y = y * 16 + 60; WGS.cam.x = x * 16 + 8; WGS.cam.y = y * 16 + 10; })(); 0`);
await sleep(250); console.log('sleepy', await g.shot('wg_sleepy.png'));
// a second look: dawn in the trees, notes rising
await g.ev(`(() => { ${setup} for (const [i, j] of [[-6, -3], [5, -2], [-3, 4], [7, 3], [-9, 1], [10, -4]]) wgSetObj(w, 'o', x + i, y + j, O_ID[(i + 20) % 2 ? 'birch' : 'oak']); WGS.clock = 0.21; WGCH.list.length = 0;
  for (let i = 0; i < 400; i++) updateWG(1 / 60); })(); 0`);
await sleep(150); console.log('dawn', await g.shot('wg_dawn.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SLEEPY OK' : 'SLEEPY FAIL'); g.close(); process.exit(pass ? 0 : 1);
