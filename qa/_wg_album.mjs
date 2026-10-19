// Wildgrove's album: every food and the golden carp listed once, raw things before dishes; the pause menu's ALBUM
// button opens it, the arrows walk the grid by one and by a row, the pages turn, Escape goes back to the pause menu;
// FULL PANTRY lights at half; a look in English and Hungarian.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ALBUM' }, seed: { v: '17' }, look: { skin: 2, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
await g.ev(`window.__click = (mx, my) => new Promise(res => {
  const r = cv.getBoundingClientRect(), x = r.left + (mx + SCR.ox) / SCR.w * r.width, y = r.top + (my + SCR.oy) / SCR.h * r.height;
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
  setTimeout(() => { cv.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, button: 0, bubbles: true }));
    setTimeout(() => { window.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, button: 0, bubbles: true })); setTimeout(res, 120); }, 80); }, 60);
}); WGS.world.meta.hintDone = 1; 0`);
let r = await g.ev(`(() => { const L = wgAlbumList(), made = (id) => RECIPES.some(rc => rc.out === id), food = Object.values(WGI).filter(i => i.kind === 'food').map(i => i.id);
  const firstMade = L.findIndex(made); return { n: L.length, dup: L.length !== new Set(L).size, food: food.every(id => L.includes(id)), gold: L.includes('fish_gold'),
    order: firstMade > 0 && L.slice(firstMade).every(made), pages: Math.ceil(L.length / (WG_ALBUM_COLS * WG_ALBUM_ROWS)) }; })()`);
ok(r.n > 40 && !r.dup && r.food && r.gold && r.order, 'the list: ' + JSON.stringify(r));
const pages = r.pages, total = r.n;
// a few found, the rest still shapes
await g.ev(`WGS.p.seen = { wood: 1, apple: 1, bread: 1, fish_gold: 1, honey_tea: 1, omelette: 1 }; WGS.scr = 'pause'; WGS.ui = {}; 0`); await sleep(200);
await g.ev(`__click(194 + 31, 134 + 7)`);
r = await g.ev(`[WGS.scr, !!WGS.ui.album]`);
ok(r[0] === 'pause' && r[1], 'the pause menu opens it: ' + JSON.stringify(r));
console.log('en', await g.shot('wg_album_en.png'));
await g.press('ArrowDown'); await sleep(80); const s0 = await g.ev(`WGS.ui.sel`);
await g.press('ArrowRight'); await sleep(80); const s1 = await g.ev(`WGS.ui.sel`);
await g.press('ArrowDown'); await sleep(80); const s2 = await g.ev(`WGS.ui.sel`);
await g.press('ArrowUp'); await sleep(80); const s3 = await g.ev(`WGS.ui.sel`);
await g.press('ArrowLeft'); await sleep(80); const s4 = await g.ev(`WGS.ui.sel`);
ok(s0 === 0 && s1 === 1 && s2 === 13 && s3 === 1 && s4 === 0, 'the arrows walk the grid: ' + JSON.stringify([s0, s1, s2, s3, s4]));
console.log('pick', await g.shot('wg_album_pick.png'));
if (pages > 1) { await g.ev(`WGS.ui.sel = undefined; 0`); await g.ev(`__click(308 + 18, 182 + 7)`); r = await g.ev(`WGS.ui.pg`); ok(r === 1, 'the next page: ' + r); }
await g.press('Escape'); await sleep(120);
r = await g.ev(`[WGS.scr, !!WGS.ui.album]`);
ok(r[0] === 'pause' && !r[1], 'Escape goes back to the pause menu: ' + JSON.stringify(r));
r = await g.ev(`(() => { WGS.world.meta.ach = {}; const L = wgAlbumList(); WGS.p.seen = {}; L.slice(0, Math.ceil(L.length / 2) - 1).forEach(id => WGS.p.seen[id] = 1); wgAchTick(); const a = !!WGS.world.meta.ach.album;
  WGS.p.seen[L[L.length - 1]] = 1; wgAchTick(); return [a, !!WGS.world.meta.ach.album]; })()`);
ok(!r[0] && r[1], 'FULL PANTRY at half: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr('ALBUM'), tr('NOT FOUND YET'), tr('FOUND 3 OF ${total}'), tr('EVERY ONE FOUND!'), tr('FULL PANTRY'), tr('FILL HALF THE ALBUM')]; return a; })()`);
ok(r.every((s, i) => s !== ['ALBUM', 'NOT FOUND YET', 'FOUND 3 OF ' + total, 'EVERY ONE FOUND!', 'FULL PANTRY', 'FILL HALF THE ALBUM'][i] || i === 0), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`WGS.ui = { album: true, sel: 3 }; WGS.p.seen = { wood: 1, apple: 1, cherry: 1, fish_gold: 1, honey_tea: 1, omelette: 1, bread: 1 }; 0`); await sleep(250);
console.log('hu', await g.shot('wg_album_hu.png'));
await g.ev(`WGS.ui = {}; 0`); await sleep(200);
console.log('pause', await g.shot('wg_album_pause.png'));
await g.ev(`Save.settings.lang = 'en'; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'ALBUM OK' : 'ALBUM FAIL'); g.close(); process.exit(pass ? 0 : 1);
