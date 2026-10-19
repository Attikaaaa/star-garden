// Wildgrove's autumn at home: windfalls lie beside ripe fruit trees in summer and autumn and acorns beside oaks in autumn
// only, on bare grass, a new few each day, none in spring or winter; walking onto one or USE picks it up once, counted, a
// full pack drops it, a new day starts over; acorns grow oak saplings, felled oaks may drop one; the woodpile stacks a
// handful of wood, up to its top, gives it all back, keeps it when the pack is full, is drawn log by log and drops its
// wood when knocked down; four quilted beds from the loom that set the spawn point; snow on the tops of chests, fences
// and woodpiles in winter, outdoors only, never on lights or trees, never indoors, in summer or underground; Hungarian;
// two looks.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'AUTUMN' }, seed: { v: '211' }, look: { skin: 3, hair: 1, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { windfall: 1 }; w.meta.stats = { kills: 0, far: 0 }; delete w.meta.fall; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0;
  p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999; WGS.day = 18; WGS.clock = 0.45;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0;
  const have = (id) => WGS.inv.reduce((n, s) => n + (s && s.id === id ? s.n : 0), 0);
  const D = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push(img); return D(...arguments); }; try { fn(); } finally { ctx.drawImage = D; } return L; };
  const whites = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8 && d[i] === 255 && d[i + 1] === 255 && d[i + 2] === 255) n++; return n; };`;
const orchard = `for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { wgSetObj(w, 'o', x - 18 + i * 3, y - 14 + j * 3, O_ID.tree_apple_r); wgSetObj(w, 'o', x + 2 + i * 3, y - 14 + j * 3, O_ID.oak); }
  const scan = () => { const L = []; for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { const F = wgFallAt(x + i, y + j); if (F && F.id !== 'pinecone') L.push([x + i, y + j, F.id]); } return L; };`; // pinecones are wg_wreath's
let r = await g.ev(`(() => { ${setup} ${orchard} const res = {};
  for (const d of [3, 9, 18, 19, 25]) { WGS.day = d; const L = scan(); res[d] = [L.filter(f => f[2] === 'apple').length, L.filter(f => f[2] === 'acorn').length, JSON.stringify(L.slice(0, 4))]; }
  WGS.day = 18; const L = scan();
  res.spot = L.every(([a, b, id]) => !wgObjAt(w, 'o', a, b) && wgGround(w, 'o', a, b) === G_ID.grass && WG_FALL_TREE.some(([i, j]) => (OBJ[wgObjAt(w, 'o', a + i, b + j)] || {}).id === (id === 'acorn' ? 'oak' : 'tree_apple_r')));
  wgSetObj(w, 'o', x - 18, y - 14, O_ID.tree_apple); res.bare = scan().some(([a, b]) => WG_FALL_TREE.some(([i, j]) => a + i === x - 18 && b + j === y - 14)); window._fl = L; return res; })()`);
ok(r[3][0] === 0 && r[3][1] === 0 && r[25][0] === 0 && r[25][1] === 0, 'none in spring or winter: ' + JSON.stringify([r[3], r[25]].map(a => a.slice(0, 2))));
ok(r[9][0] >= 6 && r[9][1] === 0 && r[18][0] >= 6 && r[18][1] >= 1 && r[18][1] < r[18][0] && r[18][2] !== r[19][2], 'fruit in summer and autumn, acorns in autumn only, fewer, a new few each day: ' + JSON.stringify([r[9], r[18], r[19]].map(a => a.slice(0, 2))));
ok(r.spot && !r.bare, 'on bare grass beside the tree or a row below it; a picked tree drops none: ' + JSON.stringify([r.spot, r.bare]));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, res = [], L = _fl, a = L.find(f => f[2] === 'apple'), b = L.filter(f => f[2] === 'apple')[1], c = L.find(f => f[2] === 'acorn');
  const have = (id) => WGS.inv.reduce((n, s) => n + (s && s.id === id ? s.n : 0), 0);
  const D = ctx.drawImage.bind(ctx); const imgs = (fn) => { const Q = []; ctx.drawImage = function (img) { Q.push(img); return D(...arguments); }; try { fn(); } finally { ctx.drawImage = D; } return Q; };
  WGS.cam.x = a[0] * 16 + 8; WGS.cam.y = a[1] * 16 + 8; const up = () => imgs(() => wgChunkUpkeep(w, 'o', Math.floor(a[0] / 32) - 1, Math.floor(a[1] / 32) - 1, Math.floor(a[0] / 32) + 1, Math.floor(a[1] / 32) + 1)).filter(c => c === WGA.cache.fall_apple).length;
  const n0 = up(); p.x = a[0] * 16 + 8; p.y = a[1] * 16 + 10; updateWG(1 / 60); res.push(have('apple'), w.meta.stats.fall, wgFallFound(a[0], a[1]), n0 - up());
  updateWG(1 / 60); res.push(have('apple'));
  p.x = b[0] * 16 + 8 + 40; p.y = b[1] * 16 + 10; res.push(wgUse(b[0], b[1]), have('apple'));
  p.x = c[0] * 16 + 8; p.y = c[1] * 16 + 10; updateWG(1 / 60); res.push(have('acorn'));
  const d = L.filter(f => f[2] === 'apple')[2]; for (let i = 0; i < 36; i++) WGS.inv[i] = { id: 'stone', n: 99 }; WGS.drops.length = 0; p.x = d[0] * 16 + 8; p.y = d[1] * 16 + 10; updateWG(1 / 60);
  res.push(WGS.drops.some(q => q.id === 'apple'), w.meta.stats.fall); WGS.day = 19; res.push(wgFallFound(a[0], a[1])); WGS.day = 18; res.push(wgFallFound(a[0], a[1]));
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; p.x = a[0] * 16 + 8; p.y = a[1] * 16 + 10;
  w.meta.ach = {}; w.meta.stats.fall = 19; wgAchTick(); res.push(!!w.meta.ach.windfall); w.meta.stats.fall = 20; wgAchTick(); res.push(!!w.meta.ach.windfall); return res; })()`);
ok(r[0] === 1 && r[1] === 1 && r[2] && r[3] === 1 && r[4] === 1, 'walking onto one picks it up once, counted, and it is no longer drawn: ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] === true && r[6] === 2 && r[7] === 1 && r[8] && r[9] === 4, 'USE picks one too, acorns as well, a full pack drops it at the feet: ' + JSON.stringify(r.slice(5, 10)));
ok(r[10] === false && r[11] === true && !r[12] && r[13], "the day's finds are kept, a new day starts over; WINDFALL at twenty: " + JSON.stringify(r.slice(10)));
r = await g.ev(`(() => { const S = RECIPES.find(q => q.out === 'sap_oak' && q.in.acorn), P = RECIPES.find(q => q.out === 'woodpile'), Q = RECIPES.filter(q => WG_QUILTS.some(k => k[0] === q.out));
  return [S && S.in.acorn, OBJ[O_ID.oak].drops.some(d => d.id === 'acorn' || d[0] === 'acorn' || JSON.stringify(d).includes('acorn')), !!wgIcon('acorn'), wgTipLines({ id: 'acorn', n: 1 }).includes('FALLS FROM THE OAKS IN AUTUMN'),
    P && P.at, P && JSON.stringify(P.in), !!wgIcon('woodpile'), wgIcon('woodpile').width, wgTipLines({ id: 'woodpile', n: 1 }).includes('KEEPS YOUR FIREWOOD STACKED'),
    Q.length, Q.every(q => q.at === 'loom' && q.in.bed === 1 && q.in.wool === 2), WG_QUILTS.every(([id]) => OBJ[O_ID[id]].kind === 'bed' && WGA.obj[id][0].c.width === 16 && !!wgIcon(id))]; })()`);
ok(r[0] === 2 && r[1] && r[2] && r[3], 'two acorns grow an oak sapling, a felled oak may drop one, an icon and a tip: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4] === 'bench' && r[5] === '{"wood":4,"stick":4}' && r[6] && r[7] === 16 && r[8], 'a woodpile from a bench, an icon and a tip: ' + JSON.stringify(r.slice(4, 9)));
ok(r[9] === 4 && r[10] && r[11], 'four quilted beds from the loom, each a bed with its art and icon: ' + JSON.stringify(r.slice(9)));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y, O_ID.woodpile); const res = [], m = () => wgMetaAt(w, 'o', x + 2, y);
  WGS.inv[0] = { id: 'wood', n: 20 }; wgUse(x + 2, y); res.push(m(), have('wood'));
  WGS.inv[0] = { id: 'wood', n: 30 }; wgUse(x + 2, y); res.push(m(), have('wood')); WGS.toast = null; wgUse(x + 2, y); res.push(m(), WGS.toast && WGS.toast.msg);
  const drawn = (k) => { wgSetObj(w, 'o', x + 2, y, O_ID.woodpile, k); return imgs(() => wgDrawObj(O_ID.woodpile, x + 2, y, 100, 100)).includes(wgPileArt(Math.ceil(k / WG_PILE_LOG))); };
  res.push(drawn(0), drawn(13), drawn(36), WGA.cache.pile_4 !== WGA.cache.pile_9);
  wgSetObj(w, 'o', x + 2, y, O_ID.woodpile, 36); WGS.sel = 1; for (let i = 0; i < 36; i++) WGS.inv[i] = { id: 'stone', n: 99 }; WGS.toast = null; wgUse(x + 2, y); res.push(m(), WGS.toast && WGS.toast.msg);
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; wgUse(x + 2, y); res.push(m(), have('wood'));
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.toast = null; wgUse(x + 2, y); res.push(WGS.toast && WGS.toast.msg);
  wgSetObj(w, 'o', x + 2, y, O_ID.woodpile, 17); WGS.drops.length = 0; wgBreak(x + 2, y, true); res.push(wgObjAt(w, 'o', x + 2, y), WGS.drops.filter(d => d.id === 'wood').reduce((n, d) => n + d.n, 0), WGS.drops.some(d => d.id === 'woodpile')); return res; })()`);
ok(r[0] === 20 && r[1] === 0 && r[2] === 36 && r[3] === 14 && r[4] === 36 && r[5] === 'THE WOODPILE IS FULL', 'the woodpile stacks a whole handful of wood, up to its top: ' + JSON.stringify(r.slice(0, 6)));
ok(r[6] && r[7] && r[8] && r[9], 'it is drawn log by log as it fills: ' + JSON.stringify(r.slice(6, 10)));
ok(r[10] === 36 && r[11] === 'YOUR PACK IS FULL' && r[12] === 0 && r[13] === 36 && r[14] === 'STACK WOOD HERE', 'it gives it all back, keeps it when the pack is full: ' + JSON.stringify(r.slice(10, 15)));
ok(r[15] === 0 && r[16] === 17 && r[17], 'knocked down it drops its wood and itself: ' + JSON.stringify(r.slice(15)));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 3, y, O_ID.quilt_sky); WGS.clock = 0.5; WGS.toast = null; p.spawn = null; wgUse(x + 3, y); return [WGS.toast && WGS.toast.msg, !!p.spawn && p.spawn.x === (x + 3) * 16 + 8]; })()`);
ok(r[0] === 'SPAWN POINT SET' && r[1], 'a quilted bed sets the spawn point: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; for (const [i, o] of [[2, 'chest'], [4, 'lantern'], [6, 'oak'], [8, 'woodpile'], [10, 'fence']]) wgSetObj(w, 'o', x + i, y, O_ID[o]);
  wgSetGround(w, 'o', x + 2, y + 3, G_ID.f_wood); wgSetObj(w, 'o', x + 2, y + 3, O_ID.chest);
  const base = WGA.obj.chest, frame = () => { WGS.cam.x = p.x; WGS.cam.y = p.y; drawWG(); };
  const look = (i, j) => imgs(() => wgDrawObj(wgObjAt(w, 'o', x + i, y + j), x + i, y + j, 100, 100));
  WGS.day = 25; frame(); let L = look(2, 0); const cap = L.find(c => !base.some(s => s.c === c));
  res.chest = [!!cap, cap && whites(cap) > whites(base[0].c) + 4, WGA.obj.chest === base];
  res.light = look(4, 0).every(c => WGA.obj.lantern.some(s => s.c === c)); res.tree = look(6, 0).every(c => !WGSC.art.has(c) || WGSC.art.get(c) === c || !WGSC.lists.has(WGA.obj.oak));
  res.pile = look(8, 0).some(c => c === WGSC.art.get(wgPileArt(0)) && c !== wgPileArt(0));
  res.fence = look(10, 0).some(c => [...Array(16).keys()].some(k => c === wgSnowcapArt(wgFence(k)) && c !== wgFence(k)));
  res.indoor = look(2, 3).every(c => base.some(s => s.c === c));
  WGS.day = 9; frame(); res.summer = look(2, 0).every(c => base.some(s => s.c === c));
  WGS.day = 25; WGS.dim = 'u'; frame(); res.under = WGSC.on; WGS.dim = 'o'; frame(); return res; })()`);
ok(r.chest[0] && r.chest[1] && r.chest[2], 'in winter snow lies on the top of a chest outdoors, its own sprites kept: ' + JSON.stringify(r.chest));
ok(r.pile && r.fence, 'and on a woodpile and a fence: ' + JSON.stringify([r.pile, r.fence]));
ok(r.light && r.tree && r.indoor && r.summer && r.under === false, 'never on lights or (here) trees, never indoors, in summer or underground: ' + JSON.stringify([r.light, r.tree, r.indoor, r.summer, r.under]));
const EN = ['ACORN', 'WOODPILE', 'ROSE QUILT BED', 'SKY QUILT BED', 'SUNNY QUILT BED', 'LILAC QUILT BED', 'WINDFALL', 'GATHER TWENTY FALLEN FRUITS OR ACORNS', 'FALLS FROM THE OAKS IN AUTUMN',
  'KEEPS YOUR FIREWOOD STACKED', 'A BED UNDER A PATCHWORK QUILT', 'THE WOODPILE IS FULL', 'WOOD STACKED', 'STACK WOOD HERE'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: an autumn orchard, windfalls and acorns, a woodpile filling up
await g.ev(`(() => { ${setup} for (const [i, j, o] of [[-6, -2, 'tree_apple_r'], [-2, -3, 'oak'], [3, -2, 'tree_cherry_r'], [7, -3, 'oak'], [-8, 2, 'oak'], [5, 2, 'woodpile'], [6, 2, 'woodpile'], [-3, 3, 'quilt_rose'], [-2, 3, 'quilt_sun']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  wgSetObj(w, 'o', x + 5, y + 2, O_ID.woodpile, 36); wgSetObj(w, 'o', x + 6, y + 2, O_ID.woodpile, 14); WGS.day = 20; delete w.meta.fall;
  WGS.inv[0] = { id: 'acorn', n: 3 }; WGS.inv[1] = { id: 'wood', n: 12 }; p.face = 'u'; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 16; })(); 0`);
await sleep(100); console.log('autumn', await g.shot('wg_autumn.png'));
// a second look: the same yard in winter, snow on the woodpiles, a chest, a bench and the fence
await g.ev(`(() => { const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); for (let i = -4; i <= 0; i++) wgSetObj(w, 'o', x + i, y + 1, O_ID.fence);
  for (const [i, j, o] of [[2, 1, 'chest'], [3, 1, 'barrel'], [-6, 0, 'boulder'], [1, -2, 'sign']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]); WGS.day = 26; })(); 0`);
await sleep(100); console.log('winter', await g.shot('wg_autumn_winter.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'AUTUMN OK' : 'AUTUMN FAIL'); g.close(); process.exit(pass ? 0 : 1);
