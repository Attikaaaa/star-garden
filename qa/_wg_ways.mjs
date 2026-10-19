// Wildgrove's waystones: art (a pulsing rune), an icon and a recipe; the world's list follows stones placed and broken;
// USE opens the others, nearest first and another dimension last, a sign beside one names it; standing still carries
// you beside the chosen stone (into a cave too), a step breaks the glow, a stone that is gone is dropped from the list;
// WAYFARER after three trips; the map shows them; the co-op welcome carries the list and a guest keeps only well-formed keys; tips,
// Hungarian; a look at the list and at a stone.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'WAYS' }, seed: { v: '44' }, look: { skin: 0, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const d = wgIcon('waystone').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  const rc = RECIPES.find(x => x.out === 'waystone'); return [(WGA.obj.waystone || []).length, n, rc && rc.at, !!OBJ[O_ID.waystone].light]; })()`);
ok(r[0] === 4 && r[1] >= 40 && r[2] === 'bench' && r[3], 'art, icon, recipe, a soft light: ' + JSON.stringify(r));
// three stones: here, a little way east, and down in a cave; each on cleared grass (the cave on its floor)
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), flat = (d, cx, cy) => { for (let j = -3; j < 4; j++) for (let i = -3; i < 4; i++) { wgSetObj(w, d, cx + i, cy + j, 0); if (d === 'o') wgSetGround(w, d, cx + i, cy + j, G_ID.grass); } };
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; w.meta.ways = []; WGS.mobs = [];
  flat('o', x + 2, y); flat('o', x + 40, y - 12); flat('o', x + 90, y + 5); flat('u', x + 5, y + 5);
  const g0 = wgGround(w, 'u', x + 5, y + 6); if (GROUND[g0].liq || GROUND[g0].void) wgSetGround(w, 'u', x + 5, y + 6, wgGround(w, 'u', x + 5, y + 5));
  wgSetObj(w, 'o', x + 2, y, O_ID.waystone); wgSetObj(w, 'o', x + 40, y - 12, O_ID.waystone); wgSetObj(w, 'u', x + 5, y + 5, O_ID.waystone); wgSetObj(w, 'o', x + 90, y + 5, O_ID.waystone);
  const a = w.meta.ways.slice(); wgSetObj(w, 'o', x + 90, y + 5, 0); const b = w.meta.ways.slice(); wgSetObj(w, 'o', x + 2, y, O_ID.waystone);
  window._w = { x, y }; return [a.length, b.length, b.join(' ')]; })()`);
ok(r[0] === 4 && r[1] === 3 && r[2].split(' ').every(k => /^[ou]-?\d+,-?\d+$/.test(k)), 'the list follows stones placed and broken: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _w, p = WGS.p; p.x = (x + 2) * 16 + 8; p.y = (y + 1) * 16 + 10; WGS.signs['o' + (x + 40) + ',' + (y - 11)] = 'MY FARM';
  const used = wgUse(x + 2, y), L = WGS.way && WGS.way.list; return [used, WGS.scr, L && L.map(e => [e.k, e.name.v, e.name.raw | 0, e.far])]; })()`);
ok(r[0] && r[1] === 'way' && r[2].length === 2 && r[2][0][1] === 'MY FARM' && r[2][0][2] === 1 && r[2][0][3] > 30 && r[2][1][0][0] === 'u' && r[2][1][3] === -1, 'USE lists the others, nearest first, a cave last, a sign names one: ' + JSON.stringify(r));
await sleep(300); console.log('list', await g.shot('wg_ways_list.png'));
// go: stand still and arrive beside the stone in the east
const go = (i, step) => g.ev(`(() => { const p = WGS.p, r = WGS.way.list[${i}]; wgWayGo(r); for (let f = 0; f < 90; f++) { if (${step} && f === 20) p.x += 10; updateWG(1 / 60); }
  return { scr: WGS.scr, dim: WGS.dim, x: Math.round(p.x), y: Math.round(p.y), toast: WGS.toast && WGS.toast.msg, trips: WGS.world.meta.stats.ways | 0, to: r.k }; })()`);
r = await go(0, false);
ok(r.scr === 'play' && r.dim === 'o' && Math.hypot(r.x - ((await g.ev('_w.x')) + 40) * 16 - 8, r.y - ((await g.ev('_w.y')) - 12) * 16 - 8) < 26 && r.trips === 1, 'standing still carries you beside it: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _w; wgUse(x + 40, y - 12); return WGS.way.list.map(e => e.k); })()`);
const step = await go(0, true);
ok(step.toast === 'THE GLOW FADES' && step.trips === 1, 'a step breaks the glow: ' + JSON.stringify(step));
await g.ev(`(() => { const { x, y } = _w; wgUse(x + 40, y - 12); })(); 0`);
const cave = await go(1, false);
ok(cave.dim === 'u' && cave.trips === 2, 'into the cave: ' + JSON.stringify(cave));
// a stone gone without the list hearing of it: the trip stops and the list forgets it
r = await g.ev(`(() => { const { x, y } = _w, w = WGS.world, ch = wgChunkAt(w, 'o', x + 2, y); ch.o[wgMod(y, WG.CS) * WG.CS + wgMod(x + 2, WG.CS)] = 0;
  wgUse(x + 5, y + 5); const L = WGS.way.list, i = L.findIndex(e => e.k === 'o' + (x + 2) + ',' + y); const p = WGS.p, x0 = p.x; wgWayGo(L[i]); for (let f = 0; f < 90; f++) updateWG(1 / 60);
  return [WGS.toast && WGS.toast.msg, WGS.dim, Math.round(p.x - x0), w.meta.ways.includes('o' + (x + 2) + ',' + y)]; })()`);
ok(r[0] === 'THE WAYSTONE IS GONE' && r[1] === 'u' && r[2] === 0 && !r[3], 'a stone that is gone is dropped: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; wgAchTick(); const a = !!m.ach.ways; m.stats.ways = 3; wgAchTick(); return [a, !!m.ach.ways]; })()`);
ok(!r[0] && r[1], 'WAYFARER after three trips: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'waystone', n: 1 })`);
ok(r.includes('USE ONE TO TRAVEL TO ANOTHER') && r.includes('A SIGN BESIDE IT GIVES ITS NAME'), 'tips: ' + JSON.stringify(r));
const EN = ['WAYSTONE', 'WAYSTONES', 'WHERE TO?', 'BUILD ANOTHER WAYSTONE TO TRAVEL', 'WAYFARER', 'TRAVEL BY WAYSTONE THREE TIMES', 'THE WAYSTONE IS GONE', 'USE ONE TO TRAVEL TO ANOTHER', 'A SIGN BESIDE IT GIVES ITS NAME', 'BELOW', 'ABOVE', 'UP HERE'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look at a stone by a sign
await g.ev(`(() => { const { x, y } = _w, w = WGS.world, p = WGS.p; WGS.dim = 'o'; WGS.mobs = []; wgSetObj(w, 'o', x + 41, y - 11, O_ID.sign); WGS.signs['o' + (x + 41) + ',' + (y - 11)] = 'MY FARM';
  p.x = (x + 39) * 16 + 8; p.y = (y - 10) * 16 + 10; p.face = 'r'; WGS.cam.x = (x + 40) * 16 + 8; WGS.cam.y = (y - 12) * 16 + 16; WGS.toast = null; WGS.clock = 0.85; Input.mx = 4; Input.my = 4; WGS.scr = 'play'; })(); 0`);
await sleep(500); console.log('stone', await g.shot('wg_ways_stone.png'));
r = await g.ev(`(() => { WGS.dim = 'o'; wgOpenMap(); const R = rect; let n = 0; rect = function (x, y, w, h, k) { if (k === 'c' && w === 1 && h === 2) n++; return R(x, y, w, h, k); };
  try { wgDrawMap(); } finally { rect = R; } WGS.scr = 'play'; return n; })()`);
ok(r === 1, 'the map shows the waystones of its dimension: ' + r);
// the co-op welcome carries the list; a guest keeps only well-formed keys
r = await g.ev(`(() => { const wl = wgnWelcome({ pid: 2, guest: null }); const has = Array.isArray(wl.ways) && wl.ways.length === WGS.world.meta.ways.length;
  wl.ways = wl.ways.concat(['bad', 'o1,2; drop', 5, 'q1,2']); wgnEnter(wl); return [has, WGS.world.meta.ways.length, WGS.world.meta.ways.every(k => /^[ouk]-?\\d+,-?\\d+$/.test(k))]; })()`);
ok(r[0] && r[1] === 2 && r[2], 'the welcome carries the list, a guest keeps good keys: ' + JSON.stringify(r));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'WAYS OK' : 'WAYS FAIL'); g.close(); process.exit(pass ? 0 : 1);
