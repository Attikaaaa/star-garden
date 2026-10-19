// Wildgrove's festive tree: art and a recipe; out of winter USE says when gifts come; in winter a gift waits (drawn
// under the tree), USE opens it once a day (the tile's meta), the next day brings another; its lights twinkle in
// turn and glow at night; FESTIVE SPIRIT; tips, Hungarian; a look at a tree on a winter evening.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'FEST' }, seed: { v: '53' }, look: { skin: 1, hair: 5, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'festive_tree'); return [!!(WGA.obj.festive_tree || [])[0], rc && rc.at, !!wgSpr('fest_gift'), WG_FEST_GIFTS.every(([id]) => !!WGI[id])]; })()`);
ok(r[0] && r[1] === 'bench' && r[2] && r[3], 'art, a recipe, a gift box, gifts that exist: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { festive: 1 }; w.meta.stats = { kills: 0, far: 0 }; wgSetObj(w, d, x + 1, y - 1, O_ID.festive_tree); window._ft = { x, y };
  const res = [], use = () => { WGS.toast = null; WGS.drops.length = 0; wgUse(x + 1, y - 1); return [WGS.toast && WGS.toast.msg, WGS.drops.map(q => q.id + 'x' + q.n).join()]; };
  const gift = () => { const D = ctx.drawImage.bind(ctx); let n = 0; ctx.drawImage = function (img) { if (img === wgSpr('fest_gift')) n++; return D(...arguments); }; try { wgDrawObj(O_ID.festive_tree, x + 1, y - 1, 100, 100); } finally { ctx.drawImage = D; } return n; };
  WGS.day = 3; res.push(gift(), use());
  WGS.day = 25; res.push(gift(), use(), gift(), use(), !!w.meta.stats.festive);
  WGS.day = 26; res.push(gift(), use()[0]); return res; })()`);
ok(r[0] === 0 && r[1][0] === 'GIFTS COME IN WINTER' && !r[1][1], 'out of winter no gift, and USE says when: ' + JSON.stringify(r.slice(0, 2)));
ok(r[2] === 1 && r[3][0] === 'A GIFT UNDER THE TREE!' && r[3][1] && r[4] === 0 && r[5][0] === 'ANOTHER GIFT COMES TOMORROW' && !r[5][1] && r[6], 'in winter a gift waits and opens once a day: ' + JSON.stringify(r.slice(2, 7)));
ok(r[7] === 1 && r[8] === 'A GIFT UNDER THE TREE!', 'the next day brings another: ' + JSON.stringify(r.slice(7)));
r = await g.ev(`(() => { const { x, y } = _ft, F = ctx.fillRect.bind(ctx), frame = (t) => { const px = []; WGS.t = t; ctx.fillRect = function (a, b, w, h) { if (w === 1 && h === 1) px.push(ctx.fillStyle); return F(...arguments); }; try { wgDrawObj(O_ID.festive_tree, x + 1, y - 1, 100, 100); } finally { ctx.fillRect = F; } return px; };
  const a = frame(100), b = frame(100.1), c = frame(101); const L = WGR.lights, n0 = L.length, c0 = WGS.clock; WGS.clock = 0.95; frame(102); const night = L.length - n0; WGS.clock = 0.5; const n1 = L.length; frame(102); const day = L.length - n1; WGS.clock = c0;
  return [a.length, new Set(a).size, a.join() === b.join(), a.join() !== c.join(), night, day]; })()`);
ok(r[0] === 9 && r[1] >= 3 && r[2] && r[3] && r[4] === 1 && r[5] === 0, 'the lights twinkle in turn, calmly, and glow at night: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.festive = 1; wgAchTick(); return !!m.ach.festive; })()`);
ok(r, 'FESTIVE SPIRIT');
r = await g.ev(`wgTipLines({ id: 'festive_tree', n: 1 })`);
ok(r.includes('A GIFT WAITS UNDER IT EACH WINTER DAY'), 'tips: ' + JSON.stringify(r));
const EN = ['FESTIVE TREE', 'FESTIVE SPIRIT', 'OPEN A GIFT UNDER A FESTIVE TREE', 'GIFTS COME IN WINTER', 'ANOTHER GIFT COMES TOMORROW', 'A GIFT UNDER THE TREE!', 'A GIFT WAITS UNDER IT EACH WINTER DAY', 'ITS LIGHTS TWINKLE'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the tree on a snowy winter evening, a gift waiting
await g.ev(`(() => { const { x, y } = _ft, w = WGS.world, d = WGS.dim, p = WGS.p; for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) wgSetGround(w, d, x + i, y + j, G_ID.snow);
  WGS.day = 27; wgSetObj(w, d, x + 1, y - 1, O_ID.festive_tree, 0); wgSeasonTrees && wgSeasonTrees(); p.x = x * 16 + 2; p.y = y * 16 + 12; p.face = 'r'; WGS.cam.x = x * 16 + 16; WGS.cam.y = y * 16 - 8;
  WGS.drops.length = 0; WGS.clock = 0.9; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('festive', await g.shot('wg_festive.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FESTIVE OK' : 'FESTIVE FAIL'); g.close(); process.exit(pass ? 0 : 1);
