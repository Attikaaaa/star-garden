// Wildgrove's bookshelf: art and a recipe; USE opens the tale the shelf has out, closing it (Escape, USE, THE END)
// puts the next one out, not on the press that opened it; every tale and title fits its page in English and Hungarian;
// all eight read light BOOKWORM; tips, Hungarian; a look at a tale.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BOOK' }, seed: { v: '47' }, look: { skin: 3, hair: 0, shirt: 5 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 60); 0`);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'bookshelf'); return [!!(WGA.obj.bookshelf || [])[0], rc && rc.at, WG_TALES.length, WG_TALES.every(T => !!WGI[T[1]])]; })()`);
ok(r[0] && r[1] === 'bench' && r[2] === 8 && r[3], 'art, a recipe, eight tales with their pictures: ' + JSON.stringify(r));
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { tales: 1 }; w.meta.stats = { kills: 0, far: 0 }; wgSetObj(w, d, x + 1, y - 1, O_ID.bookshelf); window._bk = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; Input.mx = 4; Input.my = 4; Input.lastAim = 'keys'; })(); 0`);
r = await g.ev(`(() => { const { x, y } = _bk; wgUse(x + 1, y - 1); updateWG(1 / 60); const h = hash(x + 1, y - 1, 77) % 8; window._bk.h = h; return [WGS.scr, WGS.tale && WGS.tale.n === h, WGS.world.meta.stats.tales === 1 << h]; })()`);
await sleep(100); await g.press('Escape'); await sleep(150);
let s = await g.ev(`[WGS.scr, wgMetaAt(WGS.world, WGS.dim, _bk.x + 1, _bk.y - 1)]`);
ok(r[0] === 'tale' && r[1] && r[2] && s[0] === 'play' && s[1] === 1, 'USE opens the tale the shelf has out, Escape puts the next one out: ' + JSON.stringify([r, s]));
await g.ev(`wgUse(_bk.x + 1, _bk.y - 1); 0`); await sleep(100); await g.press('KeyF'); await sleep(150);
s = await g.ev(`[WGS.scr, wgMetaAt(WGS.world, WGS.dim, _bk.x + 1, _bk.y - 1), WGS.world.meta.stats.tales === ((1 << _bk.h) | (1 << ((_bk.h + 1) % 8)))]`);
ok(s[0] === 'play' && s[1] === 2 && s[2], 'USE closes it too: ' + JSON.stringify(s));
r = await g.ev(`(() => { const { x, y } = _bk; WGS.t += 1; wgUse(x + 1, y - 1); WGS.tale.t0 = WGS.t; return WGS.scr; })()`);
s = await g.ev(`(() => { const W = wtext, seen = []; wtext = function (str) { seen.push(String(str)); return W.apply(this, arguments); }; try { wgDrawTale(); } finally { wtext = W; } const n = (_bk.h + 2) % 8; return [seen[0] === WG_TALES[n][0], seen.includes('THE END'), seen.includes((n + 1) + ' / 8')]; })()`);
ok(r === 'tale' && s[0] && s[1] && s[2], 'the page shows the title, the tale, its number and THE END: ' + JSON.stringify(s));
r = await g.ev(`(() => { const ui = WGS.ui; ui.sel = 0; Input.mx = VW / 2; Input.my = 22 + 170 - 34 + 6; Input.mouseHit = true; Input.lastAim = 'mouse'; try { wgDrawTale(); } finally { Input.mouseHit = false; } return [WGS.scr, wgMetaAt(WGS.world, WGS.dim, _bk.x + 1, _bk.y - 1)]; })()`);
ok(r[0] === 'play' && r[1] === 3, 'THE END closes it: ' + JSON.stringify(r));
r = await g.ev(`(() => { const fit = () => WG_TALES.map(T => [wrapText(T[2], 244 - 40).length, textW(T[0], 0)]); const en = fit(); Save.settings.lang = 'hu'; const hu = fit(); Save.settings.lang = 'en'; return { en, hu }; })()`);
ok([...r.en, ...r.hu].every(([n, w]) => n <= 7 && w <= 188), 'every tale and title fits its page, in English and Hungarian: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.tales = 127; wgAchTick(); const a = !!m.ach.tales; m.stats.tales = 255; wgAchTick(); return [a, !!m.ach.tales]; })()`);
ok(!r[0] && r[1], 'BOOKWORM after all eight: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'bookshelf', n: 1 })`);
ok(r.includes('USE IT TO READ A TALE'), 'tips: ' + JSON.stringify(r));
const EN = await g.ev(`WG_TALES.map(T => T[0]).concat(WG_TALES.map(T => T[2]), ['BOOKSHELF', 'BOOKWORM', 'READ ALL EIGHT TALES', 'THE END', 'USE IT TO READ A TALE', 'EIGHT TALES TO READ'])`);
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r.filter((s, i) => s === EN[i])));
// a look: a tale open over the garden
await g.ev(`(() => { const { x, y } = _bk; WGS.clock = 0.35; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; wgSetObj(WGS.world, WGS.dim, x + 1, y - 1, O_ID.bookshelf, 1); WGS.t += 1; wgUse(x + 1, y - 1); WGS.tale.t0 = WGS.t + 999; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(200); console.log('tale', await g.shot('wg_books.png'));
await g.ev(`(() => { WGS.tale = null; WGS.scr = 'play'; const { x, y } = _bk, p = WGS.p; p.x = x * 16 + 2; p.y = y * 16 + 12; WGS.cam.x = x * 16 + 16; WGS.cam.y = y * 16 - 8; })(); 0`);
await sleep(200); console.log('shelf', await g.shot('wg_books_shelf.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BOOKS OK' : 'BOOKS FAIL'); g.close(); process.exit(pass ? 0 : 1);
