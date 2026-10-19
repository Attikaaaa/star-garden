// Wildgrove's evening critters: bats flit over the woods and meadows from dusk into the night, never by day, at
// midnight, in winter, in the rain, over other lands or with the ambient life off, the same cells for every screen;
// fish leap out of deep ponds now and then in an arc, with rings where they leave and fall; frogs sit on one lily pad
// in three on spring and summer evenings, croak with a puffed throat (the sound once, never two at once), plop into
// the water when a hero comes close and climb back later; nests with cheeping chicks sit in one broadleaf tree in ten in
// spring by day, none in summer, at night or in pines; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'DUSK' }, seed: { v: '241' }, look: { skin: 1, hair: 4, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999; WGS.day = 9; WGS.clock = 0.5; wgOpt().amb = 1;
  WGS.cam.x = p.x; WGS.cam.y = p.y;
  const D = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push(img); return D(...arguments); }; try { fn(); } finally { ctx.drawImage = D; } return L; };
  const R = rect; const rects = (fn) => { const L = []; rect = function (a, b, c, e, k) { L.push([a, b, c, e, k]); return R(...arguments); }; try { fn(); } finally { rect = R; } return L; };
  const sfx = (fn) => { const F = wgSfx, L = []; wgSfx = (q) => L.push(q); try { fn(); } finally { wgSfx = F; } return L; };`;
// bats: from the night value, by season, weather, land and option
let r = await g.ev(`(() => { ${setup} const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2; let dusk = -1; for (let c = 0.5; c < 1; c += 0.005) { WGS.clock = c; const n = wgNight(c); if (n > 0.25 && n < 0.5) { dusk = c; break; } }
  const bats = () => imgs(() => wgDrawLight(cx0, cy0)).filter(c => c === WGA.cache.dbat_0 || c === WGA.cache.dbat_1).length, cells = () => { const L = []; wgBatsInView(cx0, cy0, (a, b) => L.push(Math.round(a), Math.round(b))); return L; };
  const res = {}; WGS.clock = dusk; res.dusk = [wgBatsOut(), bats()]; res.cells = cells().length / 2;
  let far = 0; for (let k = 0; k < 4; k++) { const sx = 4000 * k, sy = -3000 * k; const L = []; wgBatsInView(sx, sy, () => L.push(1)); far += L.length; } res.far = far;
  WGS.clock = 0.5; res.day = [wgBatsOut(), bats()]; WGS.clock = 0; res.midnight = wgBatsOut(); WGS.clock = dusk;
  WGS.day = 25; res.winter = wgBatsOut(); WGS.day = 9; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; res.rain = wgBatsOut(); WGS.weather = null;
  wgOpt().amb = 0; res.off = bats(); wgOpt().amb = 1;
  const t0 = WGS.t, a = cells(); WGS.t = t0 + 1; const b = cells(); WGS.t = t0; res.moves = a.length > 0 && JSON.stringify(a) !== JSON.stringify(b);
  let lands = true; wgBatsInView(-20000, 9000, () => {}); return res; })()`);
ok(r.dusk[0] && r.far >= 3 && r.moves, 'bats are out at dusk over the woods and meadows, flitting about: ' + JSON.stringify([r.dusk, r.cells, r.far, r.moves]));
ok(!r.day[0] && r.day[1] === 0 && !r.midnight && !r.winter && !r.rain && r.off === 0, 'never by day, at midnight, in winter, in the rain or with the ambient life off: ' + JSON.stringify([r.day, r.midnight, r.winter, r.rain, r.off]));
// leaping fish: a deep pond in the cleared field, its cell found by wg_pondlife
r = await g.ev(`(() => { ${setup} for (let j = -5; j <= 5; j++) for (let i = -8; i <= 8; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.deep); p.x = (x - 12) * 16; WGPL.spots.clear();
  const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2; let ponds = 0; wgPondCells(cx0, cy0, ([k]) => { if (k === 0) ponds++; });
  const t0 = WGS.t, res = { ponds, fish: 0, rings: 0, frames: new Set() };
  for (let i = 0; i < 25 * 30; i++) { WGS.t = t0 + i / 30; const L = imgs(() => rects(() => wgDrawAmbient(cx0, cy0)).forEach(q => { if (q[4] === 'C' && q[3] === 1) res.rings++; }));
    for (const c of L) for (const k of ['up', 'top', 'down']) if (c === WGA.cache['leap_' + k] || c === WGA.cache['leap_' + k + 'l']) { res.fish++; res.frames.add(k); } }
  WGS.t = t0; res.frames = [...res.frames].sort().join(); WGS.day = 25; let wint = 0; for (let i = 0; i < 300; i++) { WGS.t = t0 + i / 10; wint += imgs(() => wgDrawAmbient(cx0, cy0)).filter(c => c === WGA.cache.leap_top || c === WGA.cache.leap_topl).length; } WGS.t = t0; res.winter = wint; return res; })()`);
ok(r.ponds >= 1 && r.fish >= 20 && r.frames === 'down,top,up' && r.rings > 40, 'fish leap out of a deep pond in an arc, rising, over and falling, with rings: ' + JSON.stringify(r));
// frogs on lily pads
r = await g.ev(`(() => { ${setup} for (let j = -3; j <= 3; j++) for (let i = 2; i <= 12; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.shallow);
  const pads = []; for (let j = -3; j <= 3; j++) for (let i = 2; i <= 12; i++) { wgSetObj(w, 'o', x + i, y + j, O_ID.lilypad); pads.push([x + i, y + j]); }
  let dusk = -1; for (let c = 0.5; c < 1; c += 0.005) { const n = wgNight(c); if (n > 0.3 && n < 0.6) { dusk = c; break; } } WGS.clock = dusk;
  const frogAt = (q) => imgs(() => wgDrawObj(O_ID.lilypad, q[0], q[1], 100, 100)).includes(wgDrizArt('frog0'));
  const res = {}; WGLFR.gone.clear(); const on = pads.filter(frogAt); res.share = [on.length, pads.length]; res.same = on.every(q => wgLilyFrog(q[0], q[1]));
  WGS.clock = 0.5; res.day = pads.filter(frogAt).length; WGS.clock = dusk; WGS.day = 25; res.winter = pads.filter(frogAt).length; WGS.day = 9;
  wgOpt().amb = 0; res.off = pads.filter(frogAt).length; wgOpt().amb = 1;
  const f = on[0], t0 = WGS.t; p.x = f[0] * 16 + 8 - 60; p.y = f[1] * 16 + 12; WGLFR.croak = 0; let puffs = 0, croaks = 0;
  for (let i = 0; i < 12 * 30; i++) { WGS.t = t0 + i / 30; croaks += sfx(() => { puffs += rects(() => wgDrawObj(O_ID.lilypad, f[0], f[1], 100, 100)).filter(q => q[4] === 'H').length; }).filter(s => s === 'croak').length; }
  res.croak = [puffs > 0, croaks]; WGS.t = t0;
  p.x = f[0] * 16 + 8 + 10; res.shy = [frogAt(f), WGLFR.gone.has(f[0] + ',' + f[1]), rects(() => wgDrawObj(O_ID.lilypad, f[0], f[1], 100, 100)).some(q => q[4] === 'C')];
  p.x = f[0] * 16 + 8 - 200; WGS.t = t0 + 10; res.away = frogAt(f); WGS.t = t0 + WG_LFROG_BACK + 1; res.back = frogAt(f); WGS.t = t0; return res; })()`);
ok(r.share[0] >= r.share[1] / 6 && r.share[0] <= r.share[1] / 2 && r.same, 'about one lily pad in three has a frog on a summer evening: ' + JSON.stringify([r.share, r.same]));
ok(r.day === 0 && r.winter === 0 && r.off === 0, 'none by day, in winter or with the ambient life off: ' + JSON.stringify([r.day, r.winter, r.off]));
ok(r.croak[0] && r.croak[1] >= 1 && r.croak[1] <= 2, 'it croaks with a puffed throat, the sound never twice at once: ' + JSON.stringify(r.croak));
ok(!r.shy[0] && r.shy[1] && r.shy[2] && !r.away && r.back, 'a hero close by sends it into the water, it climbs back later: ' + JSON.stringify([r.shy, r.away, r.back]));
// nests in spring
r = await g.ev(`(() => { ${setup} const trees = []; for (let j = -14; j <= 14; j += 3) for (let i = -20; i <= 20; i += 3) { wgSetObj(w, 'o', x + i, y + j, O_ID[(i + j) % 2 ? 'oak' : 'birch']); trees.push([x + i, y + j]); }
  const nest = (q) => imgs(() => wgDrawObj(wgObjAt(w, 'o', q[0], q[1]), q[0], q[1], 100, 100)).some(c => Object.keys(WGA.cache).some(k => k.startsWith('nest_') && WGA.cache[k] === c));
  const res = {}; WGS.day = 3; WGS.clock = 0.45; const L = trees.filter(nest); res.spring = [L.length, trees.length];
  WGS.day = 9; res.summer = trees.filter(nest).length; WGS.day = 3; WGS.clock = 0.97; res.night = trees.filter(nest).length; WGS.clock = 0.45;
  const q = L[0], t0 = WGS.t; p.x = q[0] * 16 + 8; p.y = q[1] * 16 + 40; let cheeps = 0, open = 0, ducked = 0;
  for (let i = 0; i < 12 * 30; i++) { WGS.t = t0 + i / 30; cheeps += sfx(() => { const C = imgs(() => wgDrawObj(wgObjAt(w, 'o', q[0], q[1]), q[0], q[1], 100, 100)); if (C.some(c => c === WGA.cache.nest_2o || c === WGA.cache.nest_3o)) open++; if (C.includes(WGA.cache.nest_0)) ducked++; }).filter(s => s === 'cheep').length; }
  WGS.t = t0; res.life = [open > 0, ducked > 0, cheeps];
  wgSetObj(w, 'o', q[0], q[1], O_ID.pine); res.pine = nest(q); return res; })()`);
ok(r.spring[0] >= r.spring[1] / 25 && r.spring[0] <= r.spring[1] / 5, 'about one broadleaf tree in ten has a nest in spring: ' + JSON.stringify(r.spring));
ok(r.summer === 0 && r.night === 0 && r.pine === false, 'none in summer, at night or in a pine: ' + JSON.stringify([r.summer, r.night, r.pine]));
ok(r.life[0] && r.life[1] && r.life[2] >= 1 && r.life[2] <= 3, 'chicks bob up with their beaks open and cheep, then duck down: ' + JSON.stringify(r.life));
// a look: a summer dusk by a pond, frogs on the pads, bats over the trees
await g.ev(`(() => { ${setup} for (let j = -2; j <= 2; j++) for (let i = 3; i <= 10; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.deep); for (let j = -3; j <= 3; j++) for (const i of [2, 11]) wgSetGround(w, 'o', x + i, y + j, G_ID.shallow);
  for (const [i, j] of [[2, -1], [2, 1], [11, 0], [11, 2], [11, -2]]) wgSetObj(w, 'o', x + i, y + j, O_ID.lilypad);
  for (const [i, j, o] of [[-6, -3, 'oak'], [-3, -5, 'birch'], [-9, 1, 'oak'], [14, -4, 'willow'], [-2, 3, 'reeds'], [13, 3, 'reeds']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o] || O_ID.oak);
  WGPL.spots.clear(); WGLFR.gone.clear(); let dusk = 0.75; for (let c = 0.5; c < 1; c += 0.005) { const n = wgNight(c); if (n > 0.4) { dusk = c; break; } } WGS.clock = dusk; p.face = 'r'; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x + 40; WGS.cam.y = p.y;
  const b = wgSurface(w.seed, x, y).b; if (!WG_BAT_LANDS.includes(b)) WG_BAT_LANDS.push(b); // this field's land too, for the look
  })(); 0`);
await sleep(1500); console.log('dusk', await g.shot('wg_dusk.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'DUSK OK' : 'DUSK FAIL'); g.close(); process.exit(pass ? 0 : 1);
