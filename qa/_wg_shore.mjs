// Wildgrove by the shore: a stone USEd on bare natural ground starts a cairn and each one after balances another on
// top, up to five, not on water, a floor, tilled soil or under your own feet; mined, it gives its stones back; tide
// pools on some sand beside the water, never away from it, each with a starfish, an anemone, an urchin or a crab, USE
// has a look and counts the kind; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SHORE' }, seed: { v: '270' }, look: { skin: 5, hair: 2, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; WGS.inv[WGS.sel] = null;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const stones = () => WGS.inv.reduce((a, s) => a + (s && s.id === 'stone' ? s.n : 0), 0);
  const DI = ctx.drawImage.bind(ctx); const imgs = (fn) => { const L = []; ctx.drawImage = function (img) { L.push([img, arguments[1], arguments[2]]); return DI(...arguments); }; try { fn(); } finally { ctx.drawImage = DI; } return L; };`;
let r = await g.ev(`(() => { ${setup} WGS.inv[WGS.sel] = { id: 'stone', n: 20 }; st.cairn = 0; const res = {};
  res.start = wgUse(x + 1, y) && OBJ[wgObjAt(w, 'o', x + 1, y)].id === 'cairn' && wgMetaAt(w, 'o', x + 1, y) === 0 && stones() === 19;
  for (let i = 0; i < 4; i++) wgUse(x + 1, y); res.top = [wgMetaAt(w, 'o', x + 1, y), stones(), st.cairn, WGS.toast && WGS.toast.msg]; wgUse(x + 1, y); res.full = stones() === 15 && wgMetaAt(w, 'o', x + 1, y) === 4;
  res.art = imgs(() => wgDrawObj(O_ID.cairn, x + 1, y, 100, 100)).some(q => q[0] === WGA.obj.cairn[4].c) && WGA.obj.cairn.length === 5 && WGA.obj.cairn.every((s, i) => i === 0 || s.c.height > WGA.obj.cairn[i - 1].c.height);
  wgSetGround(w, 'o', x + 2, y, G_ID.shallow); wgSetGround(w, 'o', x + 3, y, G_ID.f_wood); wgSetGround(w, 'o', x + 4, y, G_ID.tilled);
  res.not = [wgUse(x + 3, y), wgUse(x + 4, y), wgUse(x, y)].map(v => !!v).concat([x + 3, x + 4, x].map(i => wgObjAt(w, 'o', i, y))); res.kept = stones() === 15; wgUse(x + 2, y); res.not.push(wgObjAt(w, 'o', x + 2, y)); // on water a stone skips (wg_skip)
  wgBreak(x + 1, y, true); res.back = WGS.drops.filter(d => d.id === 'stone').reduce((a, d) => a + d.n, 0); WGS.inv[WGS.sel] = null; return res; })()`);
ok(r.start && r.top[0] === 4 && r.top[1] === 15 && r.top[2] === 1 && r.top[3] === 'A FINE CAIRN!' && r.full, 'a stone starts a cairn and four more balance on top, BALANCING ACT, no more after: ' + JSON.stringify([r.start, r.top, r.full]));
ok(r.art, 'drawn taller with each stone: ' + JSON.stringify(r.art));
ok(r.not.every(v => !v) && r.kept && r.back === 5, 'not on water, a floor, tilled soil or under your feet; mined, all five stones come back: ' + JSON.stringify([r.not, r.kept, r.back]));
r = await g.ev(`(() => { ${setup} for (let j = -16; j <= 16; j++) for (let i = -22; i <= 22; i++) wgSetGround(w, 'o', x + i, y + j, i < -2 ? G_ID.deep : i < 8 ? G_ID.sand : G_ID.grass);
  const res = {}; let near = 0, nN = 0, far = 0, grass = 0; const kinds = new Set(), found = [];
  for (let j = -16; j <= 16; j++) for (let i = -22; i <= 22; i++) { const P = wgPoolAt(x + i, y + j); if (i >= -2 && i <= -1) { nN++; if (P) { near++; kinds.add(P.k); found.push([x + i, y + j, P.k]); } } else if (i >= 2 && i < 8 && P) far++; else if (i >= 8 && P) grass++; }
  res.pools = [near, nN, far, grass, kinds.size]; st.pools = 0; WGS.inv[WGS.sel] = null; const seen = new Set(); res.use = [];
  for (const [a, b, k] of found) if (!seen.has(k)) { seen.add(k); res.use.push(wgUse(a, b) && WGS.toast.msg === WG_POOLS[k][1]); }
  res.bits = st.pools; res.ach = WG_ACH.find(q => q[0] === 'pools')[3]({ st: { pools: 15 }, seen: {} });
  const P0 = found[0]; p.x = P0[0] * 16 + 40; p.y = P0[1] * 16; WGS.cam.x = p.x; WGS.cam.y = p.y; res.drawn = imgs(() => wgChunkUpkeep(w, 'o', 0, 0, 0, 0)).some(q => q[0] === wgPoolArt('pool')); return res; })()`);
ok(r.pools[0] >= 1 && r.pools[0] <= r.pools[1] / 8 && r.pools[2] === 0 && r.pools[3] === 0, 'tide pools on some sand beside the water only: ' + JSON.stringify(r.pools));
ok(r.use.length === r.pools[4] && r.use.every(Boolean) && r.bits === (r.pools[4] === 4 ? 15 : r.bits) && r.ach && r.drawn, 'USE has a look and counts each kind, TIDE POOLER for all four, drawn on the sand: ' + JSON.stringify([r.use, r.bits, r.ach, r.drawn]));
const EN = ['STONE CAIRN', 'A FINE CAIRN!', 'IT IS AS TALL AS IT CAN BE', 'USE IT ON THE GROUND TO START A CAIRN', 'BALANCING ACT', 'STACK A CAIRN FIVE STONES HIGH', 'A STARFISH!', 'A SEA ANEMONE!', 'A SEA URCHIN!', 'A LITTLE CRAB!', 'TIDE POOLER', 'FIND ALL FOUR TIDE POOL CREATURES'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a beach with tide pools along the water and cairns of every height
await g.ev(`(() => { ${setup} for (let j = -16; j <= 16; j++) for (let i = -22; i <= 22; i++) wgSetGround(w, 'o', x + i, y + j, j < -4 ? G_ID.deep : j < -3 ? G_ID.shallow : j < 4 ? G_ID.sand : G_ID.grass);
  let best = 0, most = 0; for (let i = -8; i <= 8; i++) { let n = 0; for (let k = -10; k <= 10; k++) for (const j of [-3, -2]) if (wgPoolAt(x + i + k, y + j)) n++; if (n > most) { most = n; best = i; } }
  for (let n = 0; n < 5; n++) wgSetObj(w, 'o', x + best - 6 + n * 3, y + 2, O_ID.cairn, n); wgSetObj(w, 'o', x + best + 9, y + 4, O_ID.oak); wgSetObj(w, 'o', x + best - 10, y + 5, O_ID.birch);
  p.x = (x + best) * 16 + 8; WGS.cam.x = p.x; p.y = y * 16 + 10; WGS.cam.y = p.y - 16; p.face = 'u'; })(); 0`);
await sleep(250); console.log('shore', await g.shot('wg_shore.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SHORE OK' : 'SHORE FAIL'); g.close(); process.exit(pass ? 0 : 1);
