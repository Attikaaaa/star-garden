// Wildgrove's still waters and fields: stars twinkle on deep water on clear nights, one tile in four, never by day, in
// the rain, on shallows or with the weather effects off; water lanterns go on water only, bob and glow at night; walking
// past a tree shakes snow off it in winter and leaves in autumn, then it rests, nothing in summer or with the particles
// off; crows peck beside some crops by day, never within reach of a scarecrow, at night, in the rain or with the
// ambient life off, and flap away from a hero; Hungarian; two looks.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'STILL' }, seed: { v: '263' }, look: { skin: 3, hair: 2, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y;
  const D = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, arguments[1], arguments[2]]); return D(...arguments); }; try { fn(); } finally { ctx.drawImage = D; } return L; };
  const R = rect; const rects = (fn) => { const L = []; rect = function (a, b, c, e, k) { L.push([a, b, c, e, k]); return R(...arguments); }; try { fn(); } finally { rect = R; } return L; };`;
let r = await g.ev(`(() => { ${setup} for (let j = -4; j <= 4; j++) for (let i = 2; i <= 14; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.deep); for (let i = 2; i <= 14; i++) wgSetGround(w, 'o', x + i, y + 5, G_ID.shallow);
  const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, up = () => rects(() => wgDrawLight(cx0, cy0));
  const stars = () => { const t0 = WGS.t, S = new Set(); for (let i = 0; i < 20; i++) { WGS.t = t0 + i * 0.3; for (const q of up()) if (q[2] === 1 && q[3] === 1 && (q[4] === 'w' || q[4] === 'Y')) S.add(Math.floor((q[0] + cx0) / 16) + ',' + Math.floor((q[1] + cy0) / 16)); } WGS.t = t0; return [...S]; };
  const res = {}; WGS.clock = 0; const L = stars(); res.night = L.length; res.where = L.every(k => { const [a, b] = k.split(',').map(Number); return GROUND[wgGround(w, 'o', a, b)].swim; });
  let n = 0, m = 0; for (let j = -4; j <= 4; j++) for (let i = 2; i <= 14; i++) { n++; if (wgStarWater(x + i, y + j)) m++; } res.share = [m, n];
  WGS.clock = 0.45; res.day = stars().length; WGS.clock = 0; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.rain = stars().length; WGS.weather = null; wgOpt().wx = 0; res.off = stars().length; wgOpt().wx = 1; return res; })()`);
ok(r.night >= 10 && r.where && r.share[1] / 8 < r.share[0] && r.share[0] < r.share[1] / 2, 'stars twinkle on deep water on a clear night, one tile in four or so: ' + JSON.stringify([r.night, r.where, r.share]));
ok(r.day === 0 && r.rain === 0 && r.off === 0, 'none by day, in the rain or with the weather effects off: ' + JSON.stringify([r.day, r.rain, r.off]));
r = await g.ev(`(() => { ${setup} wgSetGround(w, 'o', x + 2, y, G_ID.shallow); const it = WGI.water_lantern, Rc = RECIPES.find(q => q.out === 'water_lantern');
  const res = [Rc && Rc.at, wgCanPlaceAt(x + 2, y, it), wgCanPlaceAt(x + 3, y, it), !!wgIcon('water_lantern'), wgTipLines({ id: 'water_lantern', n: 1 }).includes('GLOWS AT NIGHT')];
  wgSetObj(w, 'o', x + 2, y, O_ID.water_lantern); const k = hash(x + 2, y, 29) % WG_WLAN_COLS.length, dr = () => imgs(() => wgDrawObj(O_ID.water_lantern, x + 2, y, 100, 100)).find(q => q[0] === wgWLanArt(k, true) || q[0] === wgWLanArt(k, false));
  WGS.clock = 0; const a = dr(), ys = new Set(); for (let i = 0; i < 30; i++) { WGS.t += 0.1; ys.add(dr()[2]); } WGS.clock = 0.45; const b = dr();
  WGR.lights.length = 0; dr(); res.push(a[0] === wgWLanArt(k, true), b[0] === wgWLanArt(k, false), ys.size >= 2, WGR.lights.length === 1); return res; })()`);
ok(r[0] === 'bench' && r[1] === true && r[2] === false && r[3] && r[4], 'a water lantern from a bench, on water only, an icon and a tip: ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] && r[6] && r[7] && r[8], 'it glows at night, not by day, bobs, and lights the dark: ' + JSON.stringify(r.slice(5)));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 1, y, O_ID.oak); p.x = x * 16 + 8 + 4; let walk = true; WGSHK.rest.clear(); const res = {}; for (const a of WG_ACH) w.meta.ach[a[0]] = 1; // no star's sparkle in the count
 
  const go = () => { WGS.parts.length = 0; const x0 = p.x; for (let i = 0; i < 12; i++) { if (walk) p.x = x0 + i * 0.5; updateWG(1 / 60); } p.x = x0; return WGS.parts.filter(q => q.y < y * 16 - 4).map(q => q.c); }; // what falls from the crown
  WGS.day = 25; let c = go(); res.winter = [c.length, c.every(k => k === 'w' || k === 'L')]; res.rest = go().length;
  WGSHK.rest.clear(); WGS.day = 18; c = go(); const want = wgDriftCols('oak', x + 1, y, 2); res.autumn = [c.length, !!want && c.every(k => want.includes(k))];
  WGSHK.rest.clear(); WGS.day = 9; res.summer = go().length; WGS.day = 25; WGSHK.rest.clear(); wgOpt().part = 0; res.off = go().length; wgOpt().part = 2;
  WGSHK.rest.clear(); walk = false; WGSHK.x = p.x; WGSHK.y = p.y; res.still = go().length; walk = true; p.x = x * 16 + 8 - 40; res.far = go().length; return res; })()`);
ok(r.winter[0] >= 3 && r.winter[1] && r.rest === 0, 'walking past a tree in winter shakes snow off it, then it rests: ' + JSON.stringify([r.winter, r.rest]));
ok(r.autumn[0] >= 3 && r.autumn[1], 'in autumn its own leaves: ' + JSON.stringify(r.autumn));
ok(r.summer === 0 && r.off === 0 && r.still === 0 && r.far === 0, 'nothing in summer, with the particles off, standing still or far from it: ' + JSON.stringify([r.summer, r.off, r.still, r.far]));
r = await g.ev(`(() => { ${setup} const crops = []; for (let j = -5; j <= 5; j++) for (let i = -12; i <= 12; i++) { if (Math.abs(i) < 2 && Math.abs(j) < 2) continue; wgSetGround(w, 'o', x + i, y + j, G_ID.tilled); wgSetObj(w, 'o', x + i, y + j, O_ID.crop_wheat, 3); crops.push([x + i, y + j]); }
  const T = 16, crows = () => wgEntities((x - 14) * T, (y - 7) * T, (x + 14) * T, (y + 7) * T).filter(e => e.draw === wgCrowDraw);
  const res = {}; WGCW.gone.clear(); p.x = (x - 30) * 16; let L = crows(); res.share = [L.length, crops.length]; res.where = L.every(e => crops.some(([a, b]) => Math.abs(a * 16 + 8 - e.x) < 6 && b * 16 + 14 === e.y));
  wgSetObj(w, 'o', x, y - 3, O_ID.scarecrow); L = crows(); res.guard = L.every(e => Math.max(Math.abs(Math.floor(e.x / 16) - x), Math.abs(Math.floor(e.y / 16) - (y - 3))) > WG_CROW_GUARD) && L.length < res.share[0];
  WGS.clock = 0.97; res.night = crows().length; WGS.clock = 0.45; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.rain = crows().length; WGS.weather = null; wgOpt().amb = 0; res.off = crows().length; wgOpt().amb = 1;
  const c = crows()[0]; p.x = c.x + 20; p.y = c.y; const f = crows().find(e => e.C === undefined || (Math.abs(e.x - c.x) < 1 && e.y === c.y)); res.fly = !!f && f.s !== undefined;
  const t0 = WGS.t; WGS.t = t0 + 3; res.gone = !crows().some(e => e.x === c.x && e.y === c.y); p.x = (x - 30) * 16; WGS.t = t0 + WG_CROW_BACK + 1; res.back = crows().some(e => e.x === c.x && e.y === c.y && e.s === undefined); WGS.t = t0;
  f.draw(f, WGS.cam.x - VW / 2, WGS.cam.y - VH / 2); res.art = Object.keys(WGA.cache).some(k => k.startsWith('crow_')); return res; })()`);
ok(r.share[0] >= r.share[1] / 48 && r.share[0] <= r.share[1] / 12 && r.where, 'a crow pecks beside about one crop in twenty-four by day: ' + JSON.stringify([r.share, r.where]));
ok(r.guard, 'never within reach of a scarecrow: ' + JSON.stringify(r.guard));
ok(r.night === 0 && r.rain === 0 && r.off === 0, 'none at night, in the rain or with the ambient life off: ' + JSON.stringify([r.night, r.rain, r.off]));
ok(r.fly && r.gone && r.back && r.art, 'a hero close by sends it flapping away; it comes back later: ' + JSON.stringify([r.fly, r.gone, r.back, r.art]));
const EN = ['WATER LANTERN', 'GLOWS AT NIGHT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a clear night on a pond, stars on the water and lanterns floating
await g.ev(`(() => { ${setup} for (let j = -3; j <= 4; j++) for (let i = -2; i <= 12; i++) wgSetGround(w, 'o', x + i, y + j, Math.abs(j) < 3 && i > -1 && i < 11 ? G_ID.deep : G_ID.shallow);
  for (let j = -3; j <= 4; j++) for (const i of [-3, 13]) wgSetGround(w, 'o', x + i, y + j, G_ID.sand); p.x = (x - 5) * 16 + 8;
  for (const [i, j] of [[1, -1], [4, 1], [7, -2], [9, 2], [3, -3], [11, 0]]) wgSetObj(w, 'o', x + i, y + j, O_ID.water_lantern);
  for (const [i, j, o] of [[-7, -4, 'oak'], [-9, 2, 'birch'], [14, -5, 'pine'], [-6, 4, 'reeds']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGS.clock = 0.02; p.face = 'r'; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x + 80; WGS.cam.y = p.y; })(); 0`);
await sleep(200); console.log('still', await g.shot('wg_still.png'));
// a second look: a wheat field by day, crows pecking, a scarecrow keeping its corner
await g.ev(`(() => { ${setup} for (let j = -4; j <= 4; j++) for (let i = -10; i <= 10; i++) { if (Math.abs(i) < 2 && Math.abs(j) < 2) continue; wgSetGround(w, 'o', x + i, y + j, G_ID.tilled); wgSetObj(w, 'o', x + i, y + j, O_ID[(i + 20) % 3 ? 'crop_wheat' : 'crop_corn'] || O_ID.crop_wheat, 3); }
  wgSetObj(w, 'o', x + 6, y - 2, O_ID.scarecrow); WGCW.gone.clear(); WGS.clock = 0.45; p.face = 'd'; })(); 0`);
await sleep(200); console.log('crows', await g.shot('wg_crows.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'STILL OK' : 'STILL FAIL'); g.close(); process.exit(pass ? 0 : 1);
