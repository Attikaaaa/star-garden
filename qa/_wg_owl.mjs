// Wildgrove's owls: about one tree in eighteen has one on a dry night, never a palm or a cactus; drawn over its crown, it
// looks ahead, left and right and blinks; its eyes shine over the dark; none by day, in the rain or with the ambient
// life off; the nearest one close by hoots now and then (not at once), which lights NIGHT OWL; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'OWLS' }, seed: { v: '83' }, look: { skin: 2, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -8; j < 9; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { owl: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; wgOpt().amb = 1; WGS.weather = null; WGS.wxT = 9999; WGS.clock = 0.97;
  let T0 = null; for (let j = -5; j <= 5 && !T0; j++) for (let i = 2; i <= 9 && !T0; i++) if (wgOwlTree(x + i, y + j)) T0 = [x + i, y + j];
  wgSetObj(w, 'o', T0[0], T0[1], O_ID.oak); WGOW.list.length = 0; WGOW.next = 0;
  const R = rect; const draw = () => { WGOW.list.length = 0; let eyes = 0; wgDrawObj(wgObjAt(w, 'o', T0[0], T0[1]), T0[0], T0[1], 100, 100); const n = WGOW.list.length / 3; rect = function (a, b, c, d, k) { if (k === 'Y' && c === 3) eyes++; return R(...arguments); }; try { wgDrawLight(0, 0); } finally { rect = R; } return [n, eyes, WGOW.list.length]; };`;
let r = await g.ev(`(() => { ${setup} let n = 0, yes = 0; for (let j = 0; j < 100; j++) for (let i = 0; i < 100; i++) { n++; if (wgOwlTree(i, j)) yes++; } return [n, yes]; })()`);
ok(r[1] / r[0] > 0.035 && r[1] / r[0] < 0.08, 'about one tree in eighteen: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const a = draw(); const D = ctx.drawImage.bind(ctx), arts = { ahead: wgOwlArt('ahead'), left: wgOwlArt('left'), right: wgOwlArt('right'), blink: wgOwlArt('blink') }, seen = new Set();
  ctx.drawImage = function (img) { for (const k in arts) if (arts[k] === img) seen.add(k); return D(...arguments); }; const t0 = WGS.t;
  try { for (let i = 0; i < 5400; i++) { WGS.t = t0 + i / 60; wgDrawObj(O_ID.oak, T0[0], T0[1], 100, 100); } } finally { ctx.drawImage = D; WGS.t = t0; WGOW.list.length = 0; }
  wgSetObj(w, 'o', T0[0], T0[1], O_ID.palm); const palm = draw()[0]; wgSetObj(w, 'o', T0[0], T0[1], O_ID.oak); return [a, [...seen].sort().join(), palm]; })()`);
ok(r[0][0] === 1 && r[0][1] === 2 && r[0][2] === 0, 'on a dry night an owl sits on its tree, its eyes shining over the dark: ' + JSON.stringify(r[0]));
ok(r[1] === 'ahead,blink,left,right', 'it looks ahead, left and right, and blinks: ' + r[1]);
ok(r[2] === 0, 'never on a palm: ' + r[2]);
r = await g.ev(`(() => { ${setup} const res = []; WGS.clock = 0.5; res.push(draw()[0]); WGS.clock = 0.97; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.push(draw()[0]); WGS.weather = null;
  wgOpt().amb = 0; res.push(draw()[0]); wgOpt().amb = 1; res.push(draw()[0]); return res; })()`);
ok(r[0] === 0 && r[1] === 0 && r[2] === 0 && r[3] === 1, 'none by day, in the rain or with the ambient life off: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const F = wgSfx, snd = []; wgSfx = (n) => { if (n === 'hoot') snd.push(+WGS.t.toFixed(1)); }; const t0 = WGS.t;
  try { p.x = T0[0] * 16 + 8 - 60; for (let i = 0; i < 45 * 60; i++) { WGS.cam.x = p.x; WGS.cam.y = p.y; wgDrawObj(O_ID.oak, T0[0], T0[1], 100, 100); WGOW.list.length = 0; updateWG(1 / 60); } } finally { wgSfx = F; }
  const far = []; wgSfx = (n) => { if (n === 'hoot') far.push(1); }; try { p.x -= 400; for (let i = 0; i < 30 * 60; i++) { wgDrawObj(O_ID.oak, T0[0], T0[1], 100, 100); WGOW.list.length = 0; updateWG(1 / 60); } } finally { wgSfx = F; }
  w.meta.ach = {}; wgAchTick(); return [snd.length, snd[0] - t0 > 5, snd.every((s, i) => !i || s - snd[i - 1] >= 8.9), far.length, w.meta.stats.owl, !!w.meta.ach.owl]; })()`);
ok(r[0] >= 1 && r[0] <= 5 && r[1] && r[2] && r[3] === 0 && r[4] === 1 && r[5], 'the nearest one close by hoots now and then, not at once, lighting NIGHT OWL; none from afar: ' + JSON.stringify(r));
const EN = ['NIGHT OWL', 'HEAR AN OWL HOOT IN THE NIGHT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a wood at night, an owl or two watching from the crowns
await g.ev(`(() => { ${setup} let n = 0; for (let j = -4; j <= 3 && n < 3; j++) for (let i = -11; i <= 11 && n < 3; i++) if (Math.abs(i) > 2 && wgOwlTree(x + i, y + j) && (i * 7 + j) % 2 === 0) { wgSetObj(w, 'o', x + i, y + j, O_ID[n % 2 ? 'birch' : 'oak']); n++; }
  for (const [i, j, o] of [[-8, 3, 'pine'], [9, 2, 'oak'], [-4, -5, 'birch'], [6, -5, 'pine'], [-1, 3, 'fern'], [2, -2, 'mush_red']]) if (O_ID[o] && !wgObjAt(w, 'o', x + i, y + j)) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGS.day = 15; WGS.toast = null; for (let k = 0; k < 36; k++) WGS.inv[k] = null; p.face = 'u'; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(100); console.log('owl', await g.shot('wg_owl.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'OWL OK' : 'OWL FAIL'); g.close(); process.exit(pass ? 0 : 1);
