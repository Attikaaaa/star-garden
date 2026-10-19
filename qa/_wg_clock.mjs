// Wildgrove's clocks: art and recipes; the time in words; USE tells it (a sundial only by day); a clock near the hero
// strikes at dawn, noon and dusk, a far one does not; the hands point at the hour; the sundial's shadow lies west in
// the morning, east in the evening, none by night; tips, Hungarian; a look at both in the garden.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'CLOCK' }, seed: { v: '29' }, look: { skin: 0, hair: 4, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`['grand_clock', 'sundial'].map(id => { const rc = RECIPES.find(x => x.out === id); return [!!(WGA.obj[id] || [])[0], rc && rc.at]; })`);
ok(r.every(a => a[0] && a[1] === 'bench'), 'art and recipes: ' + JSON.stringify(r));
r = await g.ev(`[0, 0.1, 0.3, 0.5, 0.6, 0.8, 0.95].map(wgTimeText)`);
ok(JSON.stringify(r) === JSON.stringify(['IT IS MIDNIGHT', 'IT IS 2 AT NIGHT', 'IT IS 7 IN THE MORNING', 'IT IS NOON', 'IT IS 2 IN THE AFTERNOON', 'IT IS 7 IN THE EVENING', 'IT IS 10 AT NIGHT']), 'the time in words: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -3; j < 4; j++) for (let i = -5; i < 6; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; wgSetObj(w, d, x + 1, y - 1, O_ID.grand_clock); wgSetObj(w, d, x + 3, y - 1, O_ID.sundial); window._ck = { x, y };
  const res = [], T = (c, tx) => { WGS.clock = c; WGS.toast = null; wgUse(tx, y - 1); return WGS.toast && WGS.toast.msg; };
  res.push(T(0.3, x + 1), T(0.95, x + 1), T(0.95, x + 3), T(0.6, x + 3)); return res; })()`);
ok(r.join('|') === 'IT IS 7 IN THE MORNING|IT IS 10 AT NIGHT|A SUNDIAL NEEDS THE SUN|IT IS 2 IN THE AFTERNOON', 'USE tells the time, a sundial only by day: ' + JSON.stringify(r));
r = await g.ev(`(() => { const S = wgSfx, heard = []; wgSfx = (k) => heard.push(k); const res = [];
  const at = (a, b) => { heard.length = 0; WGS.clock = a; WGCK.last = a; WGS.clock = b; updateWG(1 / 60); return heard.includes('bell'); };
  try { res.push(at(0.2499, 0.2501), at(0.4999, 0.5001), at(0.7499, 0.7501), at(0.3, 0.3001));
    const p = WGS.p, x0 = p.x; p.x += 16 * 9; res.push(at(0.4999, 0.5001)); p.x = x0; } finally { wgSfx = S; } return res; })()`);
ok(r.join() === 'true,true,true,false,false', 'a clock near the hero strikes at dawn, noon and dusk, a far one does not: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _ck, F = ctx.fillRect.bind(ctx), res = [];
  const draw = (id, c) => { const px = []; WGS.clock = c; ctx.fillRect = function (a, b) { px.push([ctx.fillStyle, a - 100, b - 100]); return F(...arguments); }; try { wgDrawObj(O_ID[id], x + 1, y - 1, 100, 100); } finally { ctx.fillRect = F; } return px; };
  const hour = (c) => draw('grand_clock', c).filter(q => q[0] === PAL['0']).map(q => q[1] + ',' + q[2]).join(' ');
  res.push(hour(0), hour(0.125), hour(0.25));
  const sh = (c) => { const L = draw('sundial', c).filter(q => q[0] === PAL.m); return [L.length, L.every(q => q[1] < 8), L.every(q => q[1] > 8)]; };
  res.push(sh(0.3), sh(0.7), sh(0.9)); return res; })()`);
ok(r[0] === '8,-6 8,-7' && r[1] === '9,-5 10,-5' && r[2] === '8,-4 8,-3', 'the hour hand points at the hour: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3][0] >= 3 && r[3][1] && r[4][0] >= 3 && r[4][2] && r[5][0] === 0, 'the shadow lies west in the morning, east in the evening, none by night: ' + JSON.stringify(r.slice(3)));
r = await g.ev(`[wgTipLines({ id: 'grand_clock', n: 1 }), wgTipLines({ id: 'sundial', n: 1 })]`);
ok(r[0].includes('STRIKES AT DAWN, NOON AND DUSK') && r[1].includes('ITS SHADOW FOLLOWS THE SUN'), 'tips: ' + JSON.stringify(r));
const EN = ['GRANDFATHER CLOCK', 'SUNDIAL', 'IT IS NOON', 'IT IS MIDNIGHT', 'IT IS 2 AT NIGHT', 'IT IS 7 IN THE MORNING', 'IT IS 3 IN THE AFTERNOON', 'IT IS 8 IN THE EVENING', 'A SUNDIAL NEEDS THE SUN',
  'USE IT TO HEAR THE TIME', 'STRIKES AT DAWN, NOON AND DUSK', 'ITS SHADOW FOLLOWS THE SUN', 'USE IT TO READ THE TIME'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]) && r[5] === 'REGGEL 7 ÓRA VAN', 'Hungarian: ' + JSON.stringify(r));
// a look: the clock and the sundial in the morning sun
await g.ev(`(() => { const { x, y } = _ck, p = WGS.p; p.x = x * 16 + 8; p.y = y * 16 + 12; p.face = 'r'; WGS.cam.x = x * 16 + 32; WGS.cam.y = y * 16 - 8;
  WGS.clock = 0.36; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('clock', await g.shot('wg_clock.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'CLOCK OK' : 'CLOCK FAIL'); g.close(); process.exit(pass ? 0 : 1);
