// Wildgrove's puddles: the ground grows wet in the rain and dries after it; puddles come one by one as it gets wetter,
// only on grass, dirt and paths and never under a thing; stepping into one splashes and counts once per puddle; a
// friend's steps splash too, not every frame; drawn on the ground outdoors, not in a cave or with the weather effects
// off; PUDDLE JUMPER; Hungarian; a look at a rainy meadow.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PUD' }, seed: { v: '18' }, look: { skin: 0, hair: 3, shirt: 5 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.world.meta.ach = {}; WGS.world.meta.stats = { kills: 0, far: 0 }; WGS.wxT = 9999;
  WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; WGS.wk = 'rain'; WGPD.wet = 0.5; updateWG(0.5); const a = WGPD.wet;
  WGS.weather = null; WGS.wk = null; updateWG(0.5); const b = WGPD.wet; WGPD.wet = 0.001; updateWG(0.5); return [+(a - 0.5).toFixed(4), +(b - a).toFixed(4), WGPD.wet]; })()`);
ok(r[0] === 0.0125 && r[1] === -0.0042 && r[2] === 0, 'wet in the rain, dry after it: ' + JSON.stringify(r));
r = await g.ev(`(() => { const p = WGS.p, x0 = Math.floor(p.x / 16) - 40, y0 = Math.floor(p.y / 16) - 40, n = (wet) => { WGPD.wet = wet; let k = 0, big = 0, bad = 0; for (let y = y0; y < y0 + 80; y++) for (let x = x0; x < x0 + 80; x++) { const P = wgPuddle(x, y); if (P) { k++; if (P.size === 2) big++; const gr = GROUND[wgGround(WGS.world, 'o', x, y)].id; if (!WG_PUD_GROUNDS.includes(gr) || wgObjAt(WGS.world, 'o', x, y)) bad++; } } return [k, big, bad]; };
  return [n(0), n(0.2), n(0.5), n(1)]; })()`);
ok(r[0][0] === 0 && r[1][0] < r[2][0] && r[2][0] < r[3][0] && r[3][0] === r[3][1] && r[3][0] > 40 && r.every(a => a[2] === 0), 'puddles come one by one as it gets wetter, only on open ground: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, x0 = Math.floor(p.x / 16), y0 = Math.floor(p.y / 16); WGPD.wet = 1;
  let at = null; for (let d = 1; d < 60 && !at; d++) for (let y = y0 - d; y <= y0 + d && !at; y++) for (let x = x0 - d; x <= x0 + d && !at; x++) if (wgPuddle(x, y) && GROUND[wgGround(w, 'o', x, y)].id === 'grass') at = [x, y];
  const [x, y] = at; window._pd = at; wgSetGround(w, 'o', x, y, G_ID.sand); const sand = wgPuddle(x, y); wgSetGround(w, 'o', x, y, G_ID.grass);
  wgSetObj(w, 'o', x, y, O_ID.chest); const chest = wgPuddle(x, y); wgSetObj(w, 'o', x, y, 0); for (const [i, j] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) wgSetObj(w, 'o', x + i, y + j, 0);
  return [!!at, sand, chest, !!wgPuddle(x, y)]; })()`);
ok(r[0] && r[1] === null && r[2] === null && r[3], 'never on sand or under a chest: ' + JSON.stringify(r));
r = await g.ev(`(() => { const [x, y] = _pd, p = WGS.p, st = WGS.world.meta.stats, res = []; WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; WGS.wk = 'rain'; WGPD.wet = 1;
  p.x = (x - 1) * 16 + 8; p.y = y * 16 + 10; updateWG(1 / 60); res.push(st.splash | 0); p.x = x * 16 + 8; updateWG(1 / 60); res.push(st.splash | 0); p.x = x * 16 + 6; updateWG(1 / 60); res.push(st.splash | 0);
  p.x = (x - 1) * 16 + 8; updateWG(1 / 60); p.x = x * 16 + 8; updateWG(1 / 60); res.push(st.splash | 0);
  const n0 = WGS.parts.length; wgPudSplash(p.x, p.y, 2); res.push(WGS.parts.length > n0); return res; })()`);
ok(r.join() === '0,1,1,2,true', 'a step into a puddle splashes and counts once per puddle: ' + JSON.stringify(r));
r = await g.ev(`(() => { const [x, y] = _pd, p = WGS.p; p.x = (x - 3) * 16 + 8; WGS.remote = [{ pid: 5, x: x * 16 + 8, y: y * 16 + 10, dim: 'o', moving: 1, face: 'd', walkT: 0, look: { skin: 1, hair: 1, shirt: 1 } }];
  const S = wgPudSplash; let n = 0; wgPudSplash = function () { n++; return S.apply(this, arguments); };
  try { WGPD.fr.clear(); WGPD.wet = 1; updateWG(1 / 60); const a = n; updateWG(1 / 60); return [a, n - a]; } finally { wgPudSplash = S; WGS.remote = []; } })()`);
ok(r[0] === 1 && r[1] === 0, "a friend's steps splash too, not every frame: " + JSON.stringify(r));
r = await g.ev(`(() => { let n = 0; const D = ctx.drawImage.bind(ctx), pc = new Set(['pud_0', 'pud_1', 'pud_2'].map(k => WGA.cache[k])); ctx.drawImage = function (img) { if (pc.has(img)) n++; return D(...arguments); };
  try { WGPD.wet = 1; wgDrawWorld(); const a = n; wgOpt().wx = 0; wgDrawWorld(); wgOpt().wx = 1; const b = n - a; WGS.dim = 'u'; wgDrawWorld(); WGS.dim = 'o'; return [a, b, n - a - b]; } finally { ctx.drawImage = D; } })()`);
ok(r[0] > 3 && r[1] === 0 && r[2] === 0, 'drawn outdoors, not in a cave or with the weather effects off: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.splash = 19; wgAchTick(); const a = !!m.ach.splash; m.stats.splash = 20; wgAchTick(); return [a, !!m.ach.splash]; })()`);
ok(!r[0] && r[1], 'PUDDLE JUMPER after twenty: ' + JSON.stringify(r));
const EN = ['PUDDLE JUMPER', 'SPLASH THROUGH TWENTY PUDDLES'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a rainy meadow, the puddles full and ringing
await g.ev(`(() => { const [x, y] = _pd, p = WGS.p; p.x = x * 16 + 2; p.y = y * 16 + 4; p.face = 'd'; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.clock = 0.4; WGS.toast = null; Input.mx = 4; Input.my = 4;
  WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; WGS.wk = 'rain'; WGPD.wet = 1; })(); 0`);
await sleep(250); console.log('puddles', await g.shot('wg_puddles.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PUDDLES OK' : 'PUDDLES FAIL'); g.close(); process.exit(pass ? 0 : 1);
