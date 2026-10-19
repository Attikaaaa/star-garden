// Wildgrove's messages in bottles: a ship in a bottle and its recipe; bottles wash up on sand beside water, a new few
// each day, never inland; USE pulls the cork: the note screen with a note and a gift, the glass and the gift in the
// pack (dropped when the pack is full), counted, once; the press that opened it does not close it, Escape does; a found
// bottle is no longer drawn, a new day starts over; MESSAGE IN A BOTTLE; every line fits the paper; Hungarian; looks.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SEA' }, seed: { v: '72' }, look: { skin: 1, hair: 4, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'ship_bottle'); return [!!(WGA.obj.ship_bottle || [])[0], rc && rc.at, rc && JSON.stringify(rc.in), !!WGA.cache.bottle_0 && !!WGA.cache.bottle_1]; })()`);
ok(r[0] && r[1] === 'bench' && r[2] === '{"glass":2,"wood":1,"fiber":1}' && r[3], 'a ship in a bottle, its recipe, bottle art: ' + JSON.stringify(r));
// a striped shore (every sand row beside a water row) and an inland stretch of sand
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, x0 = Math.floor(p.x / 16), y0 = Math.floor(p.y / 16); WGS.dim = 'o'; WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { notes: 1 }; w.meta.stats = { kills: 0, far: 0 }; delete w.meta.bottles;
  for (let j = -12; j <= 12; j++) for (let i = -40; i <= 40; i++) { wgSetObj(w, 'o', x0 + i, y0 + j, 0); wgSetGround(w, 'o', x0 + i, y0 + j, j & 1 ? G_ID.shallow : G_ID.sand); }
  for (let j = 14; j <= 40; j++) for (let i = -40; i <= 40; i++) { wgSetObj(w, 'o', x0 + i, y0 + j, 0); wgSetGround(w, 'o', x0 + i, y0 + j, G_ID.sand); }
  const scan = (a, b) => { const L = []; for (let j = a; j <= b; j++) for (let i = -40; i <= 40; i++) if (wgBottleAt(x0 + i, y0 + j)) L.push([x0 + i, y0 + j]); return L; };
  WGS.day = 4; const a = scan(-12, 12), inland = scan(15, 40); WGS.day = 5; const b = scan(-12, 12); WGS.day = 4;
  const fine = a.every(([x, y]) => wgGround(w, 'o', x, y) === G_ID.sand && !wgObjAt(w, 'o', x, y));
  window._bt = a; window._b0 = [x0, y0]; return [a.length, b.length, inland.length, JSON.stringify(a) !== JSON.stringify(b), fine]; })()`);
ok(r[0] >= 3 && r[1] >= 3 && r[2] === 0 && r[3] && r[4], 'on sand beside water, a new few each day, never inland: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, [a, b] = _bt, res = [], has = (id) => WGS.inv.reduce((n, s) => n + (s && s.id === id ? s.n : 0), 0);
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.drops.length = 0; p.x = a[0] * 16 + 8; p.y = a[1] * 16 + 26;
  const B = wgBottleAt(a[0], a[1]); res.push(wgUse(a[0], a[1]), WGS.scr, WGS.note && WGS.note.n === B.n, has('glass'), WGS.note && has(WGS.note.gift[0]) >= WGS.note.gift[1], w.meta.stats.notes, wgBottleFound(a[0], a[1]));
  updateWG(1 / 60); res.push(WGS.scr); return res; })()`);
ok(r[0] === true && r[1] === 'note' && r[2] && r[3] === 1 && r[4] && r[5] === 1 && r[6], 'USE pulls the cork: the note, the glass and a gift, counted: ' + JSON.stringify(r.slice(0, 7)));
ok(r[7] === 'note', 'the press that opened it does not close it: ' + r[7]);
await sleep(200); console.log('note', await g.shot('wg_bottle_note.png'));
await g.press('Escape'); await sleep(150);
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, [a, b] = _bt, res = [WGS.scr]; const n = w.meta.stats.notes;
  res.push(wgBottleAt(a[0], a[1]) && !wgBottleOpen(a[0], a[1]), w.meta.stats.notes === n, WGS.scr);
  for (let i = 0; i < 36; i++) WGS.inv[i] = { id: 'stone', n: 99 }; WGS.drops.length = 0; p.x = b[0] * 16 + 8; p.y = b[1] * 16 + 26; wgUse(b[0], b[1]);
  res.push(WGS.drops.some(d => d.id === 'glass'), WGS.drops.length >= 2, w.meta.stats.notes); WGS.scr = 'play'; WGS.note = null; for (let i = 0; i < 36; i++) WGS.inv[i] = null;
  WGS.day = 5; res.push(wgBottleFound(a[0], a[1])); WGS.day = 4; res.push(wgBottleFound(a[0], a[1])); return res; })()`);
ok(r[0] === 'play' && r[1] && r[2] && r[3] === 'play', 'Escape closes it; a bottle opens once: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4] && r[5] && r[6] === 2, 'a full pack drops the glass and the gift at the feet: ' + JSON.stringify(r.slice(4, 7)));
ok(r[7] === false && r[8] === true, "the day's finds are kept, a new day starts over: " + JSON.stringify(r.slice(7)));
r = await g.ev(`(() => { const w = WGS.world, [a, b, c] = _bt, D = ctx.drawImage.bind(ctx), want = new Set([WGA.cache.bottle_0, WGA.cache.bottle_1]); let n = 0;
  WGS.cam.x = a[0] * 16 + 8; WGS.cam.y = a[1] * 16 + 8; const draw = () => { n = 0; ctx.drawImage = function (img) { if (want.has(img)) n++; return D(...arguments); }; try { const C = WG.CS, cx = Math.floor(a[0] / C), cy = Math.floor(a[1] / C); wgChunkUpkeep(w, 'o', cx - 1, cy - 1, cx + 1, cy + 1); } finally { ctx.drawImage = D; } return n; };
  const found = draw(), B = w.meta.bottles; w.meta.bottles = null; const all = draw(); w.meta.bottles = B; return [found, all]; })()`);
ok(r[1] >= 1 && r[0] < r[1], 'drawn on the sand, a found one no longer: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.notes = 4; wgAchTick(); const a = !!m.ach.notes; m.stats.notes = 5; wgAchTick(); return [a, !!m.ach.notes]; })()`);
ok(!r[0] && r[1], 'MESSAGE IN A BOTTLE at five: ' + JSON.stringify(r));
r = await g.ev(`(() => { const bad = []; for (const lang of ['en', 'hu']) { Save.settings.lang = lang;
  for (const L of WG_NOTES) { for (const s of L.slice(0, 2)) if (textW(s, 0) > 204) bad.push(lang + ' ' + tr(s) + ' ' + textW(s, 0)); if (textW(L[2], 0) > 200) bad.push(lang + ' ' + tr(L[2])); }
  for (const s of ['TO WHOEVER FINDS THIS,', 'ALSO INSIDE:']) if (textW(s, 0) > 200) bad.push(lang + ' ' + s); if (textW('FOLD IT UP', 0) > 96) bad.push(lang + ' button'); }
  Save.settings.lang = 'en'; return bad; })()`);
ok(!r.length, 'every line fits the paper: ' + JSON.stringify(r));
const EN = ['SHIP IN A BOTTLE', 'MESSAGE IN A BOTTLE', 'READ FIVE MESSAGES IN BOTTLES', 'TO WHOEVER FINDS THIS,', 'ALSO INSIDE:', 'FOLD IT UP'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.concat(WG_NOTES.flat()).map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
const all = EN.concat(await g.ev(`WG_NOTES.flat()`));
ok(r.every((s, i) => s !== all[i]), 'Hungarian: ' + JSON.stringify(r.filter((s, i) => s === all[i])));
// a look: a bottle washed up on a sunny beach, a ship in a bottle on a little jetty
await g.ev(`(() => { const w = WGS.world, p = WGS.p, [x0, y0] = _b0; delete w.meta.bottles;
  for (let j = -8; j <= 8; j++) for (let i = -14; i <= 14; i++) { wgSetObj(w, 'o', x0 + i, y0 + j, 0); wgSetGround(w, 'o', x0 + i, y0 + j, j < -1 ? G_ID.shallow : j < 4 ? G_ID.sand : G_ID.grass); }
  for (let i = -14; i <= 14; i++) if (wgGround(w, 'o', x0 + i, y0 - 3) === G_ID.shallow) wgSetGround(w, 'o', x0 + i, y0 - 5, G_ID.deep);
  let spot = null; for (let d = 0; d < 400 && !spot; d++) { WGS.day = d; for (let i = -12; i <= 12 && !spot; i++) if (wgBottleAt(x0 + i, y0 - 1)) spot = [x0 + i, y0 - 1]; }
  if (spot) { p.x = spot[0] * 16 + 8 + 36; p.y = spot[1] * 16 + 30; wgSetObj(w, 'o', spot[0] - 3, spot[1] + 2, O_ID.ship_bottle); wgSetObj(w, 'o', spot[0] + 5, spot[1] + 1, O_ID.palm); window._spot = spot; }
  p.face = 'l'; WGS.clock = 0.4; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.inv[0] = null; })(); 0`);
await sleep(400); console.log('beach', await g.shot('wg_bottle_beach.png'), await g.ev(`JSON.stringify(window._spot || null)`));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BOTTLE OK' : 'BOTTLE FAIL'); g.close(); process.exit(pass ? 0 : 1);
