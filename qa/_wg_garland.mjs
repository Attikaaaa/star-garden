// Wildgrove's string lights: art and a recipe; a post strings to the nearest post on its right (a row up or down at
// most, never too far, never to the left), drawn as a sagging wire with bulbs; lit at night with a soft glow, not by
// day; GLOWING GARDEN once two are strung (not for one alone, not for a friend's); tips, Hungarian; a look at night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'GARL' }, seed: { v: '91' }, look: { skin: 0, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'light_post'); return [!!(WGA.obj.light_post || [])[0], rc && rc.at, rc && rc.n]; })()`);
ok(r[0] && r[1] === 'bench', 'art and a recipe: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -4; j < 5; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.stats = { kills: 0, far: 0 }; window._gl = { x, y }; const P = O_ID.light_post, res = [];
  wgSetObj(w, d, x - 6, y - 2, P); res.push(!!w.meta.stats.garland, wgGarlandTo(w, d, x - 6, y - 2));
  WGN.applying = true; wgSetObj(w, d, x - 2, y - 2, P); WGN.applying = false; res.push(!!w.meta.stats.garland); wgSetObj(w, d, x - 2, y - 2, 0);
  wgSetObj(w, d, x - 2, y - 1, P); res.push(!!w.meta.stats.garland, JSON.stringify(wgGarlandTo(w, d, x - 6, y - 2)), wgGarlandTo(w, d, x - 2, y - 1));
  wgSetObj(w, d, x + 6, y - 1, P); res.push(wgGarlandTo(w, d, x - 2, y - 1)); wgSetObj(w, d, x + 3, y + 1, P); res.push(wgGarlandTo(w, d, x - 2, y - 1));
  wgSetObj(w, d, x + 3, y + 1, 0); wgSetObj(w, d, x + 6, y - 1, 0); return res; })()`);
const gl = await g.ev(`_gl`);
ok(r[0] === false && r[1] === null && r[2] === false, 'one post alone strings nothing, a friend\'s post lights no star: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] === true && r[4] === JSON.stringify([gl.x - 2, gl.y - 1]) && r[5] === null, 'two posts a row apart string together, GLOWING GARDEN: ' + JSON.stringify(r.slice(3, 6)));
ok(r[6] === null && r[7] === null, 'never too far, never two rows apart: ' + JSON.stringify(r.slice(6)));
r = await g.ev(`(() => { const { x, y } = _gl, F = ctx.fillRect.bind(ctx), L = WGR.lights, draw = (c) => { WGS.clock = c; const px = []; const n0 = L.length; ctx.fillRect = function (a, b) { px.push([ctx.fillStyle, a - 100, b - 100]); return F(...arguments); };
    try { wgDrawObj(O_ID.light_post, x - 6, y - 2, 100, 100); } finally { ctx.fillRect = F; } return [px, L.length - n0]; };
  const [day, dl] = draw(0.5), [night, nl] = draw(0.95), wire = day.filter(q => q[0] === PAL.x), bulbs = day.filter(q => WG_GARLAND_COLS.some(k => PAL[k] === q[0]));
  const ys = wire.map(q => q[2]), mid = wire[Math.floor(wire.length / 2)][2];
  return [wire.length, bulbs.length, Math.min(...wire.map(q => q[1])), Math.max(...wire.map(q => q[1])), mid > ys[0] && mid > ys[ys.length - 1] - 16, dl, nl, night.filter(q => q[0] === PAL.w).length]; })()`);
ok(r[0] === 63 && r[1] >= 14 && r[2] === 9 && r[3] === 71 && r[4], 'drawn as a sagging wire with bulbs from hook to hook: ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] === 0 && r[6] === 2 && r[7] >= 14, 'lit at night with a soft glow, not by day: ' + JSON.stringify(r.slice(5)));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; wgAchTick(); return !!m.ach.garland; })()`);
ok(r, 'the GLOWING GARDEN star');
r = await g.ev(`wgTipLines({ id: 'light_post', n: 1 })`);
ok(r.includes('PLACE TWO IN A ROW TO STRING LIGHTS'), 'tips: ' + JSON.stringify(r));
const EN = ['LIGHT POST', 'GLOWING GARDEN', 'STRING LIGHTS BETWEEN TWO POSTS', 'PLACE TWO IN A ROW TO STRING LIGHTS', 'UP TO 6 TILES APART'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a chain of three posts in the evening
await g.ev(`(() => { const { x, y } = _gl, w = WGS.world, d = WGS.dim, p = WGS.p; wgSetObj(w, d, x + 3, y - 2, O_ID.light_post); p.x = x * 16; p.y = y * 16 + 12; WGS.cam.x = x * 16; WGS.cam.y = y * 16 - 16;
  WGS.clock = 0.86; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('garland', await g.shot('wg_garland.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'GARLAND OK' : 'GARLAND FAIL'); g.close(); process.exit(pass ? 0 : 1);
