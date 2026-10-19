// Wildgrove's beach day: a deck chair (a seat you can walk over) and a beach umbrella (solid), with recipes, three
// colours each picked by the tile; the umbrella casts a wide shade; sitting in a deck chair on sand lights BEACH DAY
// (not on grass); tips, Hungarian; a look at the beach.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SUN' }, seed: { v: '96' }, look: { skin: 4, hair: 2, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const a = RECIPES.find(x => x.out === 'deckchair'), b = RECIPES.find(x => x.out === 'parasol'), D = OBJ[O_ID.deckchair], P = OBJ[O_ID.parasol];
  return [WGA.obj.deckchair.length, WGA.obj.parasol.length, a && a.at, b && b.at, D.seat, D.solid, P.solid]; })()`);
ok(r.join() === '3,3,loom,loom,1,0,1', 'a deck chair (a seat to walk over) and a solid umbrella, three colours each, recipes: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -9; i < 10; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, j > 3 ? G_ID.deep : i < -4 ? G_ID.grass : G_ID.sand); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { beach: 1 }; w.meta.stats = { kills: 0, far: 0 }; window._bc = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; WGS.clock = 0.45; WGS.weather = null; WGS.wxT = 9999;
  const res = []; wgSetObj(w, d, x - 6, y, O_ID.deckchair); p.x = (x - 6) * 16 + 8; p.y = y * 16 + 14; wgUse(x - 6, y); res.push(!!p.sit); for (let i = 0; i < 10; i++) updateWG(1 / 60); res.push(!!w.meta.stats.beach);
  p.sit = null; wgSetObj(w, d, x + 1, y, O_ID.deckchair); p.x = (x + 1) * 16 + 8; p.y = y * 16 + 14; wgUse(x + 1, y); res.push(!!p.sit); for (let i = 0; i < 10; i++) updateWG(1 / 60); res.push(!!w.meta.stats.beach);
  const m = w.meta; m.ach = {}; wgAchTick(); res.push(!!m.ach.beach); return res; })()`);
ok(r.join() === 'true,false,true,true,true', 'BEACH DAY for a deck chair on sand, not on grass: ' + JSON.stringify(r));
r = await g.ev(`(() => { const D = ctx.drawImage.bind(ctx), S = shadow, seen = new Set(), shades = []; ctx.drawImage = function (img) { for (const id of ['deckchair', 'parasol']) { const i = WGA.obj[id].findIndex(q => q.c === img); if (i >= 0) seen.add(id + i); } return D(...arguments); };
  shadow = function (x, y, w) { shades.push(w); return S.apply(this, arguments); };
  try { for (let i = 0; i < 16; i++) { wgDrawObj(O_ID.deckchair, 40 + i, 7, 100, 100); wgDrawObj(O_ID.parasol, 40 + i, 9, 100, 100); } } finally { ctx.drawImage = D; shadow = S; }
  return [[...seen].sort().join(), shades.filter(w => w === 22).length]; })()`);
ok(r[0] === 'deckchair0,deckchair1,deckchair2,parasol0,parasol1,parasol2' && r[1] === 16, 'every colour shows along a row, the umbrella casts a wide shade: ' + JSON.stringify(r));
r = await g.ev(`[wgTipLines({ id: 'deckchair', n: 1 }), wgTipLines({ id: 'parasol', n: 1 })]`);
ok(r[0].includes('USE IT TO SIT AND REST') && r[1].includes('SHADE FOR A SUNNY DAY'), 'tips: ' + JSON.stringify(r));
const EN = ['DECK CHAIR', 'BEACH UMBRELLA', 'BEACH DAY', 'SIT IN A DECK CHAIR ON THE SAND', 'SHADE FOR A SUNNY DAY'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: umbrellas and deck chairs along the shore, the hero sitting in one
await g.ev(`(() => { const { x, y } = _bc, w = WGS.world, d = WGS.dim; for (const [i, j] of [[-2, 0], [2, -1], [6, 0]]) wgSetObj(w, d, x + i, y + j - 1, O_ID.parasol);
  for (const [i, j] of [[-1, 0], [3, -1], [5, 0], [7, 0]]) wgSetObj(w, d, x + i, y + j, O_ID.deckchair); wgSetObj(w, d, x + 1, y, 0); WGS.toast = null; Input.mx = 4; Input.my = 4;
  const p = WGS.p; p.sit = null; p.x = (x + 5) * 16 + 8; p.y = y * 16 + 14; wgUse(x + 5, y); })(); 0`);
await sleep(300); console.log('beach', await g.shot('wg_beach.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BEACH OK' : 'BEACH FAIL'); g.close(); process.exit(pass ? 0 : 1);
