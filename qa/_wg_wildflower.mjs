// Wildgrove's wildflower seeds: tied by hand, now and then in cut grass; sown on bare grass, moss or dirt, not on sand
// or a taken tile; on the host a sprout comes up through a bud into the flower of its tile's colour, quicker in the rain;
// knocked out it gives its seed back; WILDFLOWER MEADOW for twenty; Hungarian; a look at every stage.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'MEADOW' }, seed: { v: '935' }, look: { skin: 2, hair: 3, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const S = O_ID.wild_sprout, N = (id) => wgInvCount(WGS.inv, id);
  const tick = (n) => { for (let k = 0; k < n; k++) { WGS.growT = 0; wgGrowTick(1); } };`;
let r = await g.ev(`(() => { ${setup} const res = {}; const R = RECIPES.find(q => q.out === 'wild_seeds'); res.rec = R && [R.at, R.n]; res.grass = OBJ[O_ID.tallgrass].drops.some(d => d[0] === 'wild_seeds');
  st.sown = 0; WGS.inv[0] = { id: 'wild_seeds', n: 10 };
  res.sow = [wgUse(x + 1, y), wgObjAt(w, 'o', x + 1, y) === S, N('wild_seeds'), st.sown]; wgSetGround(w, 'o', x + 2, y, G_ID.moss); wgUse(x + 2, y); wgSetGround(w, 'o', x + 3, y, G_ID.dirt); wgUse(x + 3, y);
  wgSetGround(w, 'o', x + 4, y, G_ID.sand); WGS.toast = null; wgUse(x + 4, y); res.sand = [wgObjAt(w, 'o', x + 4, y), WGS.toast && WGS.toast.msg]; wgSetObj(w, 'o', x + 5, y, O_ID.pebbles); wgUse(x + 5, y); res.taken = wgObjAt(w, 'o', x + 5, y) === O_ID.pebbles;
  res.kinds = [wgObjAt(w, 'o', x + 2, y) === S, wgObjAt(w, 'o', x + 3, y) === S, N('wild_seeds'), st.sown];
  for (let i = -6; i <= 6; i++) wgSetObj(w, 'o', x + i, y + 3, S, 0); const stage = () => { const c = [0, 0, 0]; for (let i = -6; i <= 6; i++) { const o = wgObjAt(w, 'o', x + i, y + 3); c[o === S ? wgMetaAt(w, 'o', x + i, y + 3) : 2]++; } return c; };
  tick(20); res.early = stage(); tick(900); res.late = stage(); res.right = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].every(i => wgObjAt(w, 'o', x + i, y + 3) === O_ID['flower_' + wgWildCol(x + i, y + 3)]);
  res.cols = new Set([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(i => wgWildCol(x + i, y + 3))).size;
  const reset = () => { for (let j = 4; j <= 6; j++) for (let i = -6; i <= 6; i++) wgSetObj(w, 'o', x + i, y + j, S, 0); }, n4 = () => { let c = 0; for (let j = 4; j <= 6; j++) for (let i = -6; i <= 6; i++) if (wgObjAt(w, 'o', x + i, y + j) !== S || wgMetaAt(w, 'o', x + i, y + j)) c++; return c; };
  reset(); tick(25); res.dryStep = n4(); reset(); WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; tick(25); res.wetStep = n4(); WGS.weather = null; return res; })()`);
ok(r.rec && r.rec[0] === 'hand' && r.rec[1] === 4 && r.grass, 'tied by hand, now and then in cut grass: ' + JSON.stringify([r.rec, r.grass]));
ok(r.sow.join() === 'true,true,9,1' && r.kinds.join() === 'true,true,7,3' && r.sand[0] === 0 && r.sand[1] === 'SOW THEM ON BARE GRASS OR SOIL' && r.taken, 'sown on bare grass, moss or dirt only: ' + JSON.stringify([r.sow, r.kinds, r.sand, r.taken]));
ok(r.early[2] < 4 && r.late[2] === 13 && r.right && r.cols >= 3, 'a sprout comes up through a bud into its tile\'s flower: ' + JSON.stringify([r.early, r.late, r.right, r.cols]));
ok(r.wetStep > r.dryStep, 'quicker in the rain: ' + JSON.stringify([r.dryStep, r.wetStep]));
r = await g.ev(`(() => { ${setup} const res = {}; res.drop = OBJ[S].drops.map(d => d[0]).join(); const H = WG_ACH.find(a => a[0] === 'meadow')[3]; res.ach = [H({ st: { sown: 20 }, seen: {} }), H({ st: { sown: 19 }, seen: {} })];
  res.tip = wgTipLines({ id: 'wild_seeds', n: 1 }).includes('SOW THEM ON BARE GRASS OR SOIL'); res.icon = wgIcon('wild_seeds').width;
  const D = ctx.drawImage.bind(ctx); let m = 0; ctx.drawImage = function (img) { if (Object.keys(WGA.cache).some(k => k.startsWith('wsprout') && WGA.cache[k] === img)) m++; return D(...arguments); };
  wgSetObj(w, 'o', x, y + 2, S, 1); try { wgDrawObj(S, x, y + 2, 100, 100); } finally { ctx.drawImage = D; } res.drawn = m; return res; })()`);
ok(r.drop === 'wild_seeds' && r.ach.join() === 'true,false' && r.tip && r.icon === 16 && r.drawn === 1, 'its seed back; WILDFLOWER MEADOW; tip; icon; drawn: ' + JSON.stringify(r));
const EN = ['WILDFLOWER SEEDS', 'WILDFLOWER SPROUT', 'WILDFLOWER MEADOW', 'SOW TWENTY WILDFLOWERS', 'SOW THEM ON BARE GRASS OR SOIL'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { ${setup} for (let i = -4; i <= 4; i++) for (let j = -1; j <= 1; j++) { const k = (i + 4 + j * 3) % 3; wgSetObj(w, 'o', x + i, y + j + 2, k === 2 ? O_ID['flower_' + wgWildCol(x + i, y + j + 2)] : S, k); }
  WGS.inv[0] = { id: 'wild_seeds', n: 6 }; WGS.cam.y = p.y + 16; window._wf = setInterval(() => { WGS.clock = 0.45; }, 50); })(); 0`);
await sleep(400); console.log('wildflower', await g.shot('wg_wildflower.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'WILDFLOWER OK' : 'WILDFLOWER FAIL'); g.close(); process.exit(pass ? 0 : 1);
