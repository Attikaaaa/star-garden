// Wildgrove's cave life: glow worms on some rock faces with open floor below, never on a face over rock or something
// standing, nor on a built wall; drawn over the dark underground only, with the ambient life on; seen up close, GLOW
// WORMS, told once; drops fall from faces near the hero and splash, a few at a time; none above ground; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'CAVES' }, seed: { v: '731' }, look: { skin: 1, hair: 2, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'u';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetGround(w, 'u', x + i, y + j, G_ID.cave); wgSetObj(w, 'u', x + i, y + j, j < -2 || j > 4 ? O_ID.cliff : 0); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.cam.x = p.x; WGS.cam.y = p.y; wgOpt().amb = 1; WGCV.drips.length = 0; WGCV.next = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const faces = []; for (let i = -14; i < 15; i++) faces.push([x + i, y - 3]); const glowing = () => faces.filter(([a, b]) => wgGlowAt(a, b));`;
let r = await g.ev(`(() => { ${setup} const res = {}; const G = glowing(); res.n = G.length; const one = G[0], L = wgGlowAt(one[0], one[1]);
  res.shape = L.length >= 3 && L.length <= 6 && L.every(q => q[0] >= 1 && q[0] <= 14 && q[1] >= 2 && q[1] <= 7);
  res.inner = faces.filter(([a, b]) => wgGlowAt(a, b - 1)).length; wgSetObj(w, 'u', one[0], one[1] + 1, O_ID.pebbles); res.blocked = !wgGlowAt(one[0], one[1]); wgSetObj(w, 'u', one[0], one[1] + 1, 0);
  wgSetObj(w, 'u', one[0], one[1], O_ID.w_stone || O_ID.w_wood); res.built = !wgGlowAt(one[0], one[1]); wgSetObj(w, 'u', one[0], one[1], O_ID.cliff);
  const R = rect; let n = 0; const draw = () => { n = 0; rect = function () { n++; return R(...arguments); }; try { wgDrawLight(WGS.cam.x - 192, WGS.cam.y - 108); } finally { rect = R; } return n; };
  const n0 = draw(); res.drawn = n0 > 0; wgOpt().amb = 0; res.off = draw() === 0 || draw() < n0; wgOpt().amb = 1; return res; })()`);
ok(r.n >= 4 && r.n <= 20 && r.shape, 'some rock faces with open floor below hold glow worms: ' + JSON.stringify(r));
ok(r.inner === 0 && r.blocked && r.built && r.drawn && r.off, 'never over rock, over something standing or on a built wall; drawn, not with the ambient life off: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; st.glowworm = 0; const one = glowing()[0]; p.x = one[0] * 16 + 8; p.y = (one[1] + 2) * 16 + 4; WGS.cam.x = p.x; WGS.cam.y = p.y;
  drawWG(); updateWG(1 / 60); res.told = [WGS.toast && WGS.toast.msg, st.glowworm]; WGS.toast = null; drawWG(); updateWG(1 / 60); res.again = !!WGS.toast;
  p.x = x * 16 + 8; p.y = (y - 1) * 16 + 8; let most = 0, splash = 0, first = null; const PT = wgPart; wgPart = function (a, b, n, o) { if (o && o.c && o.c[0] === 'C') splash++; return PT.apply(this, arguments); };
  try { for (let k = 0; k < 1800; k++) { updateWG(1 / 60); most = Math.max(most, WGCV.drips.length); if (!first && WGCV.drips.length) first = Object.assign({}, WGCV.drips[0]); } } finally { wgPart = PT; }
  res.drips = [most, splash > 2]; const d = first; res.from = d ? [wgCaveWall(w, Math.floor(d.x / 16), Math.floor(d.y0 / 16)), d.y1 > d.y0] : null;
  WGS.dim = 'o'; updateWG(1 / 60); res.above = WGCV.drips.length; WGS.dim = 'u';
  const A = WG_ACH.find(a => a[0] === 'glowworm')[3]; res.ach = [A({ st: { glowworm: 1 }, seen: {} }), A({ st: {}, seen: {} })]; return res; })()`);
ok(r.told[0] === 'GLOW WORMS!' && r.told[1] === 1 && !r.again, 'seen up close: GLOW WORMS, told once: ' + JSON.stringify(r.told));
ok(r.drips[0] >= 1 && r.drips[0] <= 4 && r.drips[1] && r.from && r.from.join() === 'true,true' && r.above === 0 && r.ach.join() === 'true,false', 'drops fall from the faces and splash, a few at a time, none above ground: ' + JSON.stringify(r));
const EN = ['GLOW WORMS', 'FIND GLOW WORMS IN A CAVE', 'GLOW WORMS!'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { ${setup} for (const [i, j, k] of [[-3, 1, 'glowcap'], [4, 2, 'pebbles'], [2, 3, 'mush_brown']]) if (O_ID[k]) wgSetObj(w, 'u', x + i, y + j, O_ID[k]); WGS.cam.y = p.y - 24; })(); 0`);
await sleep(500); console.log('caves', await g.shot('wg_caves.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'CAVES OK' : 'CAVES FAIL'); g.close(); process.exit(pass ? 0 : 1);
