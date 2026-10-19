// Wildgrove's egg hunt: an item, a basket and its recipe, an icon; in spring eggs lie on grass beside growing things,
// a new set each day, none in summer; walking onto one picks it up (once, with a toast, counted), USE picks one too, a
// full pack drops it at the feet; the day's finds are kept in the world's meta and a new day starts over; a found egg is
// no longer drawn; EGG HUNT; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'EGGS' }, seed: { v: '28' }, look: { skin: 1, hair: 5, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'egg_basket'); return [!!WGI.painted_egg, !!(WGA.obj.egg_basket || [])[0], rc && JSON.stringify(rc.in), !!wgIcon('painted_egg')]; })()`);
ok(r[0] && r[1] && r[2] === '{"painted_egg":6,"fiber":3}' && r[3], 'an item, a basket and its recipe, an icon: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, x0 = Math.floor(p.x / 16), y0 = Math.floor(p.y / 16); WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { eggs: 1 }; w.meta.stats = { kills: 0, far: 0 }; delete w.meta.eggs;
  const scan = () => { const L = []; for (let j = -40; j <= 40; j++) for (let i = -40; i <= 40; i++) { const E = wgEggAt(x0 + i, y0 + j); if (E) L.push([x0 + i, y0 + j]); } return L; };
  WGS.day = 0; const a = scan(); WGS.day = 1; const b = scan(); WGS.day = 9; const c = scan(); WGS.day = 0;
  const ok8 = a.every(([x, y]) => { const gid = wgGround(w, 'o', x, y); return (gid === G_ID.grass || gid === G_ID.jungle) && !wgObjAt(w, 'o', x, y) && WG_LEAF_N8.some(([i, j]) => { const o = OBJ[wgObjAt(w, 'o', x + i, y + j)]; return o && (o.kind === 'plant' || o.id.startsWith('flower_')); }); });
  window._eg = a; return [a.length, b.length, c.length, JSON.stringify(a) !== JSON.stringify(b), ok8]; })()`);
ok(r[0] >= 3 && r[1] >= 3 && r[2] === 0 && r[3] && r[4], 'in spring, on bare grass beside growing things, a new set each day, none in summer: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, [a, b, c] = _eg, res = [], eggs = () => WGS.inv.reduce((n, s) => n + (s && s.id === 'painted_egg' ? s.n : 0), 0);
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.toast = null;
  p.x = a[0] * 16 + 8; p.y = a[1] * 16 + 10; updateWG(1 / 60); res.push(eggs(), WGS.toast && WGS.toast.msg, w.meta.stats.eggs, wgEggFound(a[0], a[1]));
  WGS.toast = null; updateWG(1 / 60); res.push(eggs(), WGS.toast);
  p.x = b[0] * 16 + 8 + 48; p.y = b[1] * 16 + 10; wgUse(b[0], b[1]); res.push(eggs(), w.meta.eggs.k.length);
  for (let i = 0; i < 36; i++) WGS.inv[i] = { id: 'stone', n: 99 }; WGS.drops.length = 0; p.x = c[0] * 16 + 8; p.y = c[1] * 16 + 10; updateWG(1 / 60);
  res.push(WGS.drops.some(d => d.id === 'painted_egg'), w.meta.stats.eggs);
  WGS.day = 1; res.push(wgEggFound(a[0], a[1])); WGS.day = 0; res.push(wgEggFound(a[0], a[1]));
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; p.x = a[0] * 16 + 8; p.y = a[1] * 16 + 10; return res; })()`); // back on a found egg, so the live frames find nothing
ok(r[0] === 1 && r[1] === 'A PAINTED EGG!' && r[2] === 1 && r[3] && r[4] === 1 && r[5] === null, 'walking onto one picks it up once, with a toast, counted: ' + JSON.stringify(r.slice(0, 6)));
ok(r[6] === 2 && r[7] === 2 && r[8] && r[9] === 3, 'USE picks one too, a full pack drops it at the feet: ' + JSON.stringify(r.slice(6, 10)));
ok(r[10] === false && r[11] === true, "the day's finds are kept, a new day starts over: " + JSON.stringify(r.slice(10)));
r = await g.ev(`(() => { const w = WGS.world, [a] = _eg, D = ctx.drawImage.bind(ctx), want = new Set(Object.keys(WGA.cache).filter(k => k.startsWith('egg_')).map(k => WGA.cache[k])); let n = 0;
  WGS.cam.x = a[0] * 16 + 8; WGS.cam.y = a[1] * 16 + 8; const draw = () => { n = 0; ctx.drawImage = function (img) { if (want.has(img)) n++; return D(...arguments); }; try { const C = WG.CS, cx = Math.floor(a[0] / C), cy = Math.floor(a[1] / C); wgChunkUpkeep(w, 'o', cx - 1, cy - 1, cx + 1, cy + 1); } finally { ctx.drawImage = D; } return n; };
  const found = draw(), E = w.meta.eggs; w.meta.eggs = null; const all = draw(); w.meta.eggs = E; WGS.day = 9; const summer = draw(); WGS.day = 0; return [found, all, summer]; })()`);
ok(r[1] >= 1 && r[0] === r[1] - 1 && r[2] === 0, 'drawn on the ground, a found one no longer, none in summer: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.eggs = 10; wgAchTick(); return [!!m.ach.eggs, wgTipLines({ id: 'painted_egg', n: 1 })]; })()`);
ok(r[0] && r[1].includes('HIDDEN IN THE GRASS IN SPRING'), 'EGG HUNT, tips: ' + JSON.stringify(r));
const EN = ['PAINTED EGG', 'EGG BASKET', 'EGG HUNT', 'FIND TEN PAINTED EGGS', 'A PAINTED EGG!', 'HIDDEN IN THE GRASS IN SPRING'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: eggs peeking out of the grass on a spring morning, a basket set out beside the hero
await g.ev(`(() => { const w = WGS.world, p = WGS.p; delete w.meta.eggs; let best = _eg[1], most = 0;
  for (const [x, y] of _eg) { const n = _eg.filter(([u, v]) => Math.abs(u - x) < 10 && Math.abs(v - y) < 5).length; if (n > most) { most = n; best = [x, y]; } }
  for (let j = -1; j <= 1; j++) for (let i = -2; i <= 2; i++) if (!wgObjAt(w, 'o', best[0] + i, best[1] + 2 + j) && !wgEggAt(best[0] + i, best[1] + 2 + j)) { wgSetObj(w, 'o', best[0] + i, best[1] + 2 + j, O_ID.egg_basket); i = j = 9; }
  p.x = best[0] * 16 + 8 + 40; p.y = best[1] * 16 + 40; WGS.clock = 0.38; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('eggs', await g.shot('wg_eggs.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'EGGS OK' : 'EGGS FAIL'); g.close(); process.exit(pass ? 0 : 1);
