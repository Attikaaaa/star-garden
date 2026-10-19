// Wildgrove's foraging: four wild things, one a season (wild garlic, blueberries, chanterelles, rose hips), each in
// its own lands on bare ground, beside a tree where it should be, a new few each day; walking onto a patch or USE
// gathers one or two, once, with its name, counted per season, a full pack drops them; the day's finds are kept and a
// new day starts over; four dishes at the fire with icons, rose hip tea a tea for sitting down; FORAGER for all four;
// the flower press is a station whose USE opens the recipe book, five pressed flowers in frames from it, HERBARIUM for
// all five set out; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'FORAGE' }, seed: { v: '251' }, look: { skin: 2, hair: 0, shirt: 5 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const prep = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o'; WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  const have = (id) => WGS.inv.reduce((n, s) => n + (s && s.id === id ? s.n : 0), 0);`;
await g.ev(`(() => { const p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), seed = WGS.world.seed; // into the woods: the nearest forest's heart
  for (let d = 0; d < 400; d += 8) for (let i = -d; i <= d; i += 8) for (const [a, b] of [[i, -d], [i, d], [-d, i], [d, i]]) if (['forest', 'forest', 'forest', 'forest', 'forest', 'forest', 'forest', 'forest', 'forest'].every((k, n) => wgSurface(seed, x + a + (n % 3 - 1) * 12, y + b + (Math.floor(n / 3) - 1) * 12).b === k)) { p.x = (x + a) * 16 + 8; p.y = (y + b) * 16 + 10; return 1; }
  return 0; })()`);
let r = await g.ev(`(() => { ${prep} const res = {}, R = 90, scan = () => { const L = []; for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const F = wgForageAt(x + i, y + j); if (F) L.push([x + i, y + j, F.k]); } return L; };
  for (const d of [3, 9, 18, 26]) { WGS.day = d; const L = scan(), F = WG_FORAGE[wgSeason()];
    res[d] = [L.length, L.every(f => f[2] === wgSeason()), L.every(([a, b]) => !wgObjAt(w, 'o', a, b) && WG_FORAGE_ON.includes(GROUND[wgGround(w, 'o', a, b)].id) && F[4].includes(wgSurface(w.seed, a, b).b) && (!F[5] || WG_LEAF_N8.some(([i, j]) => { const o = OBJ[wgObjAt(w, 'o', a + i, b + j)]; return o && o.kind === 'tree'; })))]; }
  WGS.day = 19; const a = scan(); WGS.day = 18; const b = scan(); res.daily = JSON.stringify(a) !== JSON.stringify(b); window._fg = b; return res; })()`);
ok([3, 9, 18, 26].every(d => r[d][0] >= 3 && r[d][1] && r[d][2]), 'something wild every season, in its lands, on bare ground, beside a tree where it should be: ' + JSON.stringify(r));
ok(r.daily && r[18][0] < 181 * 181 / 100, 'a new few each day, never crowded: ' + JSON.stringify([r.daily, r[18][0]]));
r = await g.ev(`(() => { ${prep} WGS.day = 18; w.meta.ach = { forage: 1 }; w.meta.stats = { kills: 0, far: 0 }; delete w.meta.forage; for (let i = 0; i < 36; i++) WGS.inv[i] = null;
  const [a, b, c] = _fg, res = [], n0 = wgForageAt(a[0], a[1]).n;
  WGS.cam.x = a[0] * 16 + 8; WGS.cam.y = a[1] * 16 + 8; const D = ctx.drawImage.bind(ctx), drawn = () => { let n = 0; ctx.drawImage = function (img) { if (img === WGA.cache.forage_2) n++; return D(...arguments); }; try { wgChunkUpkeep(w, 'o', Math.floor(a[0] / 32) - 1, Math.floor(a[1] / 32) - 1, Math.floor(a[0] / 32) + 1, Math.floor(a[1] / 32) + 1); } finally { ctx.drawImage = D; } return n; };
  const d0 = drawn(); p.x = a[0] * 16 + 8; p.y = a[1] * 16 + 10; updateWG(1 / 60); res.push(have('chanterelle') === n0, WGS.toast && WGS.toast.msg, w.meta.stats.forage, wgForageFound(a[0], a[1]), d0 - drawn());
  updateWG(1 / 60); res.push(have('chanterelle') === n0);
  p.x = b[0] * 16 + 8 + 40; p.y = b[1] * 16 + 10; res.push(wgUse(b[0], b[1]), have('chanterelle') > n0);
  for (let i = 0; i < 36; i++) WGS.inv[i] = { id: 'stone', n: 99 }; WGS.drops.length = 0; p.x = c[0] * 16 + 8; p.y = c[1] * 16 + 10; updateWG(1 / 60); res.push(WGS.drops.some(q => q.id === 'chanterelle'));
  WGS.day = 19; res.push(wgForageFound(a[0], a[1])); WGS.day = 18; for (let i = 0; i < 36; i++) WGS.inv[i] = null; p.x = a[0] * 16 + 8; p.y = a[1] * 16 + 10;
  w.meta.ach = {}; w.meta.stats.forage = 4 | 1 | 2; wgAchTick(); res.push(!!w.meta.ach.forage); w.meta.stats.forage = 15; wgAchTick(); res.push(!!w.meta.ach.forage); return res; })()`);
ok(r[0] && r[1] === 'CHANTERELLE' && r[2] === 4 && r[3] && r[4] === 1 && r[5], 'walking onto a patch gathers it once, with its name, counted, no longer drawn: ' + JSON.stringify(r.slice(0, 6)));
ok(r[6] === true && r[7] && r[8] && r[9] === false && !r[10] && r[11], 'USE gathers too, a full pack drops it, a new day starts over; FORAGER for all four seasons: ' + JSON.stringify(r.slice(6)));
r = await g.ev(`(() => { ${prep} const D = ['garlic_bread', 'blueberry_muffin', 'chanterelle_soup', 'rosehip_tea'], Rc = D.map(id => RECIPES.find(q => q.out === id));
  const res = [Rc.every(q => q && q.at === 'fire'), Rc[0].in.wild_garlic, Rc[1].in.blueberries, Rc[2].in.chanterelle, Rc[3].in.rosehip, WG_TEA.includes('rosehip_tea'),
    WG_FORAGE.map(f => f[1]).concat(D).every(id => WGI[id].kind === 'food' && !!wgIcon(id)), wgTipLines({ id: 'rosehip', n: 1 }).includes('FOUND ON BARE TWIGS IN WINTER')];
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'rosehip_tea', n: 1 }; WGS.sel = 0; p.sit = { tx: x, ty: y, dim: 'o', t: 0 }; p.hp = 5; p.food = 5; WGS.toast = null; wgEat(0); res.push(WGS.toast && WGS.toast.msg, p.hp > 5); p.sit = null; return res; })()`);
ok(r.slice(0, 8).every(Boolean), 'four dishes at the fire from what is gathered, icons, a tip; rose hip tea is a tea: ' + JSON.stringify(r.slice(0, 8)));
ok(r[8] === 'A NICE CUP OF TEA' && r[9], 'rose hip tea drunk sitting down: ' + JSON.stringify(r.slice(8)));
r = await g.ev(`(() => { ${prep} for (let j = -4; j < 5; j++) for (let i = -6; i < 7; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  w.meta.ach = { pressed: 1 }; w.meta.stats = { kills: 0, far: 0 }; const P = RECIPES.find(q => q.out === 'flower_press'), F = WG_PRESSED.map(v => RECIPES.find(q => q.out === v[0]));
  const res = [P && P.at, WG_AT.flower_press, F.every((q, k) => q && q.at === 'flower_press' && q.in[WG_PRESSED[k][2]] === 3), WG_PRESSED.every(v => !!WGA.obj[v[0]] && !!wgIcon(v[0])), !!wgIcon('flower_press')];
  wgSetObj(w, 'o', x + 2, y, O_ID.flower_press); WGS.scr = 'play'; wgUse(x + 2, y); res.push(WGS.scr, WGS.ui && WGS.ui.tab); WGS.scr = 'play';
  WG_PRESSED.slice(0, 4).forEach((v, k) => wgSetObj(w, 'o', x - 4 + k, y - 2, O_ID[v[0]])); wgAchTick(); w.meta.ach = {}; wgAchTick(); res.push(!!w.meta.ach.pressed, w.meta.stats.pressed);
  wgSetObj(w, 'o', x + 1, y - 2, O_ID.pressed_p); wgAchTick(); res.push(!!w.meta.ach.pressed); return res; })()`);
ok(r[0] === 'bench' && r[1] === 'AT A FLOWER PRESS' && r[2] && r[3] && r[4], 'a flower press from a bench, five pressed flowers from it, art and icons: ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] === 'inv' && r[6] === 'craft', 'USE on the press opens the recipe book: ' + JSON.stringify(r.slice(5, 7)));
ok(r[7] === false && r[8] === 15 && r[9], 'HERBARIUM once all five are set out: ' + JSON.stringify(r.slice(7)));
const EN = ['WILD GARLIC', 'BLUEBERRIES', 'CHANTERELLE', 'ROSE HIPS', 'GARLIC BREAD', 'BLUEBERRY MUFFIN', 'CHANTERELLE SOUP', 'ROSE HIP TEA', 'FORAGER', 'GATHER SOMETHING WILD IN EVERY SEASON',
  'FOUND IN THE WOODS IN SPRING', 'FOUND ON SUMMER HILLSIDES', 'FOUND BESIDE THE TREES IN AUTUMN', 'FOUND ON BARE TWIGS IN WINTER', 'FLOWER PRESS', 'AT A FLOWER PRESS', 'PRESSED POPPY', 'PRESSED BUTTERCUP',
  'PRESSED CORNFLOWER', 'PRESSED DAISY', 'PRESSED VIOLET', 'HERBARIUM', 'SET OUT A PRESSED FLOWER OF EVERY COLOUR', 'A FLOWER KEPT FOREVER'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: an autumn wood with chanterelles, a flower press and its frames on a table
await g.ev(`(() => { ${prep} const [a] = _fg; p.x = a[0] * 16 + 8 + 40; p.y = a[1] * 16 + 10; WGS.day = 18; delete w.meta.forage; WGS.clock = 0.45; const x2 = Math.floor(p.x / 16), y2 = Math.floor(p.y / 16);
  for (const [i, j, o] of [[2, 1, 'flower_press'], [-1, 2, 'pressed_r'], [0, 2, 'pressed_b'], [1, 2, 'pressed_y']]) { wgSetObj(w, 'o', x2 + i, y2 + j, O_ID[o]); }
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'chanterelle', n: 2 }; WGS.inv[1] = { id: 'chanterelle_soup', n: 1 }; WGS.inv[2] = { id: 'blueberry_muffin', n: 2 }; WGS.inv[3] = { id: 'rosehip_tea', n: 1 }; WGS.inv[4] = { id: 'garlic_bread', n: 1 };
  p.face = 'l'; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y; })(); 0`);
await sleep(150); console.log('forage', await g.shot('wg_forage.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FORAGE OK' : 'FORAGE FAIL'); g.close(); process.exit(pass ? 0 : 1);
