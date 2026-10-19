// Wildgrove's deep winter: a hero's breath shows in the cold (outdoors in winter, or on snow in summer), puffing on a
// beat in front of the face, never facing away, wading, in summer on grass or with the ambient life off, a friend's
// too; wall and cliff tops are white with snow in winter, a face that shows gets icicles, never in summer, indoors or
// underground; thin ice along every shore of a pond in winter, none in summer, underground or with the weather effects
// off; bunting strings a rope of fluttering pennants between two posts, lighting VILLAGE FAIR; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'FROST' }, seed: { v: '223' }, look: { skin: 0, hair: 2, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { bunting: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0;
  p.x = x * 16 + 8; p.y = y * 16 + 10; p.face = 'l'; p.sit = null; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999; WGS.day = 25; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; WGS.cam.x = p.x; WGS.cam.y = p.y;
  const D = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push(img); return D(...arguments); }; try { fn(); } finally { ctx.drawImage = D; } return L; };
  const R = rect; const rects = (fn) => { const L = []; rect = function (a, b, c, e, k) { L.push([a, b, c, e, k]); return R(...arguments); }; try { fn(); } finally { rect = R; } return L; };
  const px = (c, k) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, v = parseInt(PAL[k].slice(1), 16); let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8 && ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]) === v) n++; return n; };`;
let r = await g.ev(`(() => { ${setup} const t0 = WGS.t, near = (q) => { let n = 0; for (let i = 0; i < 56; i++) { WGS.t = t0 + i * 0.05; n += rects(() => wgDrawAmbient(q.x - 200, q.y - 100)).filter(a => a[4] === 'w' && a[0] > 180 && a[0] < 220 && a[1] > 70 && a[1] < 96).length; } WGS.t = t0; return n; };
  const res = {}; res.winter = near(p); const side = rects(() => { WGS.t = t0 + 0.5; wgDrawAmbient(p.x - 200, p.y - 100); }); WGS.t = t0;
  p.face = 'u'; res.away = near(p); p.face = 'r'; res.right = near(p);
  WGS.day = 9; res.summer = near(p); wgSetGround(w, 'o', x, y, G_ID.snow); res.snow = near(p); wgSetGround(w, 'o', x, y, G_ID.shallow); res.wade = near(p); wgSetGround(w, 'o', x, y, G_ID.grass); WGS.day = 25;
  wgOpt().amb = 0; res.off = near(p); wgOpt().amb = 1;
  const f = { pid: 3, x: p.x + 64, y: p.y, face: 'd', dim: 'o' }; WGS.remote = [f]; p.hidden = true; res.friend = near(f); p.hidden = false; WGS.remote = []; return res; })()`);
ok(r.winter >= 10 && r.right >= 10, 'a puff of breath in front of the face in the winter cold, on a beat: ' + JSON.stringify([r.winter, r.right]));
ok(r.snow >= 10 && r.summer === 0, 'on snow in summer too, never on summer grass: ' + JSON.stringify([r.snow, r.summer]));
ok(r.away === 0 && r.wade === 0 && r.off === 0, 'never facing away, wading or with the ambient life off: ' + JSON.stringify([r.away, r.wade, r.off]));
ok(r.friend >= 10, "a friend's breath shows too: " + JSON.stringify(r.friend));
r = await g.ev(`(() => { ${setup} for (let i = 0; i < 4; i++) wgSetObj(w, 'o', x + 2 + i, y - 2, O_ID.w_stone); wgSetObj(w, 'o', x + 2, y - 3, O_ID.w_stone);
  wgSetGround(w, 'o', x + 8, y + 3, G_ID.f_wood); wgSetObj(w, 'o', x + 8, y + 3, O_ID.w_stone);
  const frame = () => { WGS.cam.x = p.x; WGS.cam.y = p.y; drawWG(); }, look = (i, j) => imgs(() => wgDrawObj(wgObjAt(w, 'o', x + i, y + j), x + i, y + j, 100, 100))[0];
  const base = (i, j, m) => wgWall(O_ID.w_stone, m, hash(x + i, y + j, 5) % 3), res = {};
  WGS.day = 25; frame(); const c = look(3, -2), b = base(3, -2, 2 | 8);
  res.snow = [c !== b, c === WGIC.art.get(b), px(c, 'L') > px(b, 'L') + 60, px(c, 'C') + px(c, 'c') > 0 && px(b, 'C') + px(b, 'c') === 0];
  const top = look(2, -3), tb = base(2, -3, 4); res.top = [top !== tb, px(top, 'L') > px(tb, 'L') + 60];
  res.indoor = look(8, 3) === base(8, 3, 0); WGS.day = 9; frame(); res.summer = look(3, -2) === b;
  WGS.day = 25; WGS.dim = 'u'; frame(); WGS.dim = 'o'; res.under = WGSC.on; frame();
  res.cliff = (() => { wgSetObj(w, 'o', x - 4, y + 4, O_ID.cliff); const q = look(-4, 4); return q !== wgWall(O_ID.cliff, 0, hash(x - 4, y + 4, 5) % 3); })();
  res.again = look(3, -2) === c; return res; })()`);
ok(r.snow.every(Boolean) && r.top.every(Boolean), 'in winter wall tops are white with snow and a face that shows gets icicles: ' + JSON.stringify([r.snow, r.top]));
ok(r.cliff && r.again, 'cliffs too, the same snowy piece every frame: ' + JSON.stringify([r.cliff, r.again]));
ok(r.indoor && r.summer && r.under === false, 'never indoors, in summer or underground: ' + JSON.stringify([r.indoor, r.summer, r.under]));
r = await g.ev(`(() => { ${setup} for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) wgSetGround(w, 'o', x + 3 + i, y + 2 + j, G_ID.shallow);
  const rims = () => imgs(() => wgChunkUpkeep(w, 'o', Math.floor(x / 32) - 1, Math.floor(y / 32) - 1, Math.floor(x / 32) + 1, Math.floor(y / 32) + 1)).filter(c => Object.keys(WGA.cache).some(k => k.startsWith('rim_') && WGA.cache[k] === c)).length;
  const res = [rims()]; WGS.day = 9; res.push(rims()); WGS.day = 25; wgOpt().wx = 0; res.push(rims()); wgOpt().wx = 1;
  res.push(imgs(() => wgChunkUpkeep(w, 'u', 0, 0, 1, 1)).filter(c => Object.keys(WGA.cache).some(k => k.startsWith('rim_') && WGA.cache[k] === c)).length);
  const a = wgFrostRim(0, 1); res.push(px(a, 'L') + px(a, 'w') >= 16, px(a, 'C') > 0, wgFrostRim(0, 1) === a); return res; })()`);
ok(r[0] === 12 && r[1] === 0 && r[2] === 0 && r[3] === 0, 'thin ice along every shore of a pond in winter, none in summer, with the weather effects off or underground: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4] && r[5] && r[6], 'a ragged pale band, baked once: ' + JSON.stringify(r.slice(4)));
r = await g.ev(`(() => { ${setup} const B = RECIPES.find(q => q.out === 'bunting_post'), res = [B && B.at, !!wgIcon('bunting_post'), wgTipLines({ id: 'bunting_post', n: 1 }).includes('PLACE TWO IN A ROW TO STRING BUNTING')];
  wgSetObj(w, 'o', x + 2, y, O_ID.bunting_post); res.push(!!w.meta.stats.bunting); wgSetObj(w, 'o', x + 6, y + 1, O_ID.bunting_post); res.push(!!w.meta.stats.bunting, JSON.stringify(wgBuntingTo(w, 'o', x + 2, y)));
  const L = rects(() => wgDrawObj(O_ID.bunting_post, x + 2, y, 100, 100)), rope = L.filter(a => a[4] === 'N' && a[2] === 1).length, flags = L.filter(a => a[2] === 3 && a[3] === 1).length;
  res.push(rope, flags, new Set(L.filter(a => a[2] === 3).map(a => a[4])).size, rects(() => wgDrawObj(O_ID.bunting_post, x + 6, y + 1, 164, 116)).filter(a => a[4] === 'N').length);
  wgSetObj(w, 'o', x + 6, y + 1, 0); wgSetObj(w, 'o', x + 10, y, O_ID.bunting_post); res.push(wgBuntingTo(w, 'o', x + 2, y)); w.meta.ach = {}; wgAchTick(); res.push(!!w.meta.ach.bunting); return res; })()`);
ok(r[0] === 'loom' && r[1] && r[2], 'a bunting post from the loom, an icon and a tip: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] === false && r[4] === true && r[5] !== 'null' && r[6] >= 60 && r[7] >= 10 && r[8] >= 5 && r[9] === 0, 'two posts string a rope of pennants in many colours, drawn by the left one; one alone lights nothing: ' + JSON.stringify(r.slice(3, 10)));
ok(r[10] === null && r[11], 'out of reach no string; VILLAGE FAIR: ' + JSON.stringify(r.slice(10)));
const EN = ['BUNTING POST', 'VILLAGE FAIR', 'STRING BUNTING BETWEEN TWO POSTS', 'PLACE TWO IN A ROW TO STRING BUNTING'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a winter village: snowy walls with icicles, a frozen-edged pond, bunting, the hero's breath
await g.ev(`(() => { ${setup} for (let i = -9; i <= -4; i++) wgSetObj(w, 'o', x + i, y - 3, O_ID.w_brick); for (let j = -6; j <= -4; j++) { wgSetObj(w, 'o', x - 9, y + j, O_ID.w_brick); wgSetObj(w, 'o', x - 4, y + j, O_ID.w_brick); }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) wgSetGround(w, 'o', x + 4 + i, y + 1 + j, G_ID.shallow); wgSetGround(w, 'o', x + 5, y + 4, G_ID.shallow);
  for (const [i, j, o] of [[-3, 2, 'bunting_post'], [1, 2, 'bunting_post'], [4, 2 - 2, 'oak'], [9, -3, 'snowpine'], [-12, 1, 'pine'], [2, -4, 'chest'], [-2, -4, 'woodpile']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  for (let i = 0; i < 3; i++) wgSetObj(w, 'o', x + 10 + i, y + 2, O_ID.cliff); WGS.day = 27; p.face = 'r'; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 8; })(); 0`);
await sleep(700); console.log('frost', await g.shot('wg_frost.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FROST OK' : 'FROST FAIL'); g.close(); process.exit(pass ? 0 : 1);
