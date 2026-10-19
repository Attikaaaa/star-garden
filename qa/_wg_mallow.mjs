// Wildgrove's marshmallows: recipes and icons; USE on a campfire puts one on a stick over the flames (no crafting
// screen); pulled too soon it is still raw, golden it is TOASTED (GOLDEN BROWN, with a chime at the moment), brown it is
// toasted without the star, left too long it catches fire; a step back or a fire gone pulls it; a full pack drops it at
// the feet; the stick is drawn; tips, Hungarian; a look at a night by the campfire.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'MALLOW' }, seed: { v: '44' }, look: { skin: 2, hair: 3, shirt: 1 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 60); 0`);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const px = (id) => { const d = wgIcon(id).getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  const a = RECIPES.find(x => x.out === 'marshmallow'), b = RECIPES.find(x => x.out === 'mallow_sandwich');
  return [['marshmallow', 'toasted_mallow', 'burnt_mallow', 'mallow_sandwich'].map(px), a && a.n, a && a.at, b && Object.keys(b.in).sort().join(), ['marshmallow', 'toasted_mallow', 'burnt_mallow', 'mallow_sandwich'].every(id => WGI[id].kind === 'food')]; })()`);
ok(r[0].every(n => n >= 40) && r[1] === 3 && r[2] === 'hand' && r[3] === 'cookies,toasted_mallow' && r[4], 'recipes, icons, foods: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = {};
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGS.mallow = null;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'marshmallow', n: 5 }; WGS.sel = 0; wgSetObj(w, d, x + 1, y, O_ID.campfire);
  p.x = x * 16 + 8; p.y = y * 16 + 12; p.face = 'r'; window._mw = { x, y };
  const n = (id) => wgInvCount(WGS.inv, id), go = (age) => { WGS.toast = null; wgUse(x + 1, y); WGS.mallow.t0 = WGS.t - age; }, pull = () => { wgUse(x + 1, y); return WGS.toast && WGS.toast.msg; };
  go(0); res.start = [!!WGS.mallow, WGS.scr, n('marshmallow')];
  WGS.mallow.t0 = WGS.t - 1; res.raw = [pull(), n('marshmallow'), WGS.mallow];
  go(3); updateWG(1 / 60); const rang = WGS.mallow.rang; res.gold = [rang, pull(), n('toasted_mallow'), !!w.meta.stats.mallow];
  w.meta.stats.mallow = 0; go(4.5); res.brown = [pull(), n('toasted_mallow'), !!w.meta.stats.mallow];
  go(5.7); updateWG(1 / 60); res.burn = [WGS.mallow, WGS.toast && WGS.toast.msg, n('burnt_mallow')];
  go(3); p.x += 10; updateWG(1 / 60); res.step = [WGS.mallow, n('toasted_mallow')]; p.x -= 10;
  go(0.5); wgSetObj(w, d, x + 1, y, 0); updateWG(1 / 60); res.gone = [WGS.mallow, n('marshmallow')]; wgSetObj(w, d, x + 1, y, O_ID.campfire);
  return res; })()`);
ok(r.start.join() === 'true,play,4', 'USE on a campfire puts it over the flames: ' + JSON.stringify(r.start));
ok(r.raw[0] === 'NOT TOASTED YET' && r.raw[1] === 5 && r.raw[2] === null, 'pulled too soon it is still raw: ' + JSON.stringify(r.raw));
ok(r.gold[0] === true && r.gold[1] === 'GOLDEN BROWN!' && r.gold[2] === 1 && r.gold[3], 'golden: a chime, toasted, GOLDEN BROWN: ' + JSON.stringify(r.gold));
ok(r.brown[0] === 'NICELY TOASTED' && r.brown[1] === 2 && !r.brown[2], 'brown: toasted, no star: ' + JSON.stringify(r.brown));
ok(r.burn[0] === null && r.burn[1] === 'OOPS! IT CAUGHT FIRE' && r.burn[2] === 1, 'left too long it catches fire: ' + JSON.stringify(r.burn));
ok(r.step[0] === null && r.step[1] === 3 && r.gone[0] === null && r.gone[1] === 1, 'a step back or a fire gone pulls it: ' + JSON.stringify([r.step, r.gone]));
r = await g.ev(`(() => { const { x, y } = _mw; WGS.inv[0] = { id: 'marshmallow', n: 1 }; WGS.sel = 0; wgUse(x + 1, y); WGS.mallow.t0 = WGS.t - 3;
  for (let i = 0; i < 36; i++) WGS.inv[i] = { id: 'stone', n: WGI.stone.stack }; const d0 = WGS.drops.length; wgUse(x + 1, y); return [WGS.drops.length - d0, WGS.drops[WGS.drops.length - 1].id]; })()`);
ok(r[0] === 1 && r[1] === 'toasted_mallow', 'a full pack drops it at the feet: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _mw, R = rect; let n = 0; rect = function () { n++; return R.apply(this, arguments); }; const cx0 = WGS.cam.x - 192, cy0 = WGS.cam.y - 108;
  try { for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'marshmallow', n: 2 }; WGS.sel = 0; wgDrawAmbient(cx0, cy0); const a = n; wgUse(x + 1, y); WGS.mallow.t0 = WGS.t - 3; n = 0; wgDrawAmbient(cx0, cy0); return [a, n]; } finally { rect = R; } })()`);
ok(r[1] - r[0] >= 10, 'the stick and the marshmallow are drawn: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.mallow = 1; wgAchTick(); return !!m.ach.mallow; })()`);
ok(r, 'GOLDEN BROWN');
r = await g.ev(`wgTipLines({ id: 'marshmallow', n: 1 })`);
ok(r.includes('USE IT ON A CAMPFIRE TO TOAST IT') && r.includes('PULL IT OUT WHEN IT IS GOLDEN'), 'tips: ' + JSON.stringify(r));
const EN = ['MARSHMALLOW', 'TOASTED MARSHMALLOW', 'BURNT MARSHMALLOW', 'MALLOW SANDWICH', 'GOLDEN BROWN', 'TOAST A MARSHMALLOW JUST RIGHT', 'NOT TOASTED YET', 'OOPS! IT CAUGHT FIRE', 'GOLDEN BROWN!', 'NICELY TOASTED', 'USE IT ON A CAMPFIRE TO TOAST IT', 'PULL IT OUT WHEN IT IS GOLDEN'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a night by the campfire, a marshmallow going golden
await g.ev(`(() => { const p = WGS.p; WGS.mallow.t0 = WGS.t - 2.8; WGS.mallow.rang = true; WGS.cam.x = p.x + 8; WGS.cam.y = p.y - 8; WGS.clock = 0.9; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(200); console.log('mallow', await g.shot('wg_mallow.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'MALLOW OK' : 'MALLOW FAIL'); g.close(); process.exit(pass ? 0 : 1);
