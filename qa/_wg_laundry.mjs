// Wildgrove's clothesline: a post and its recipe; a post strings its rope to the next one on its right (up to six tiles,
// a row up or down), not past that and not to the left; the rope and washing are drawn, the same pieces every time, and
// they stir in the breeze; they drip in the rain only; the second post placed lights LAUNDRY DAY; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'WASH' }, seed: { v: '66' }, look: { skin: 0, hair: 4, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'laundry_post'); return [!!(WGA.obj.laundry_post || [])[0], rc && rc.at, rc && rc.n, rc && JSON.stringify(rc.in)]; })()`);
ok(r[0] && r[1] === 'bench' && r[2] === 2 && r[3] === '{"wood":2,"string":2,"wool":1}', 'a post and its recipe: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) - 6, y = Math.floor(p.y / 16) - 3, res = [];
  for (let j = -2; j < 8; j++) for (let i = -2; i < 18; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; window._lx = [x, y];
  wgSetObj(w, d, x, y, O_ID.laundry_post); res.push(!!w.meta.stats.laundry); wgSetObj(w, d, x + 4, y, O_ID.laundry_post); res.push(!!w.meta.stats.laundry); wgAchTick(); res.push(!!w.meta.ach.laundry);
  res.push(JSON.stringify(wgLaundryTo(w, d, x, y)), wgLaundryTo(w, d, x + 4, y));
  wgSetObj(w, d, x, y + 3, O_ID.laundry_post); wgSetObj(w, d, x + 7, y + 3, O_ID.laundry_post); res.push(wgLaundryTo(w, d, x, y + 3));
  wgSetObj(w, d, x + 9, y + 4, O_ID.laundry_post); res.push(JSON.stringify(wgLaundryTo(w, d, x + 7, y + 3))); return res; })()`);
ok(r[0] === false && r[1] === true && r[2] === true, 'the second post placed strings the first line, LAUNDRY DAY: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] === JSON.stringify([(await g.ev('_lx[0]')) + 4, await g.ev('_lx[1]')]) && r[4] === null && r[5] === null && r[6] === JSON.stringify([(await g.ev('_lx[0]')) + 9, (await g.ev('_lx[1]')) + 4]), 'to the next post on the right, up to six tiles, a row up or down: ' + JSON.stringify(r.slice(3)));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, [x, y] = _lx, cx0 = WGS.cam.x - 192, cy0 = WGS.cam.y - 108, D = ctx.drawImage.bind(ctx), F = ctx.fillRect.bind(ctx), R = rect, res = {};
  const want = () => new Set(Object.keys(WGA.cache).filter(k => k.startsWith('laund_')).map(k => WGA.cache[k]));
  const draw = () => { const W = want(), pcs = [], o = { rope: 0, drip: 0 }; ctx.drawImage = function (img, a) { if (W.has(img) || /laund/.test(Object.keys(WGA.cache).find(k => WGA.cache[k] === img) || '')) pcs.push(Object.keys(WGA.cache).find(k => WGA.cache[k] === img) + '@' + a); return D(...arguments); };
    ctx.fillRect = function () { if (ctx.fillStyle === PAL.a) o.rope++; return F(...arguments); }; rect = function (a, b, c, e, k) { if (k === 'c') o.drip++; return R(...arguments); };
    try { wgDrawObj(O_ID.laundry_post, x, y, x * 16 - cx0, y * 16 - cy0); } finally { ctx.drawImage = D; ctx.fillRect = F; rect = R; } return [pcs, o]; };
  WGS.weather = null; const a = draw(), b = draw(); res.n = a[0].length; res.same = a[0].map(s => s.split('@')[0]).join() === b[0].map(s => s.split('@')[0]).join(); res.rope = a[1].rope; res.dry = a[1].drip;
  const xs = new Set(); for (let k = 0; k < 30; k++) { WGS.t += 0.21; xs.add(draw()[0].join()); } res.stir = xs.size;
  WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6, storm: false }; res.wet = draw()[1].drip; WGS.weather = null;
  res.lone = (() => { let n = 0; ctx.fillRect = function () { if (ctx.fillStyle === PAL.a) n++; return F(...arguments); }; try { wgDrawObj(O_ID.laundry_post, x + 4, y, (x + 4) * 16 - cx0, y * 16 - cy0); } finally { ctx.fillRect = F; } return n; })();
  return res; })()`);
ok(r.n >= 3 && r.same && r.rope >= 50 && r.lone === 0, 'the rope and its washing, the same pieces every time; nothing from the last post: ' + JSON.stringify(r));
ok(r.stir >= 2 && r.dry === 0 && r.wet >= 3, 'it stirs in the breeze, drips in the rain only: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'laundry_post', n: 1 })`);
ok(r.includes('PLACE TWO IN A ROW TO HANG WASHING') && r.includes('UP TO 6 TILES APART'), 'tips: ' + JSON.stringify(r));
const EN = ['LAUNDRY POST', 'LAUNDRY DAY', 'HANG A CLOTHESLINE BETWEEN TWO POSTS', 'PLACE TWO IN A ROW TO HANG WASHING', 'UP TO 6 TILES APART'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: washing day behind a little house, two spans of line, flowers and a tree
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, [x, y] = _lx;
  for (let j = -4; j < 9; j++) for (let i = -4; i < 20; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, j === 5 ? G_ID.dirt : G_ID.grass); }
  for (const i of [1, 5, 10]) wgSetObj(w, d, x + i, y + 1, O_ID.laundry_post);
  for (const [i, j, id] of [[-2, -2, 'oak'], [14, 0, 'birch'], [3, 3, 'flower_r'], [4, 3, 'flower_y'], [8, 3, 'flower_b'], [12, 4, 'flower_p']]) if (O_ID[id]) wgSetObj(w, d, x + i, y + j, O_ID[id]);
  p.x = (x + 6) * 16 + 8; p.y = (y + 4) * 16 + 10; p.face = 'u'; WGS.clock = 0.42; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('laundry', await g.shot('wg_laundry.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'LAUNDRY OK' : 'LAUNDRY FAIL'); g.close(); process.exit(pass ? 0 : 1);
