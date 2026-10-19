// Wildgrove's pinecones and wreath: icons, a felled pine may drop a pinecone, the wreath from a bench; in autumn
// pinecones lie beside the pines, a new few each day, none in the other seasons; walking onto one picks it up; the
// wreath looks different each season and seeing it lights a bit, WREATH FOR ALL SEASONS for all four; tips; Hungarian;
// a look at an autumn wreath among pines.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'WREATH' }, seed: { v: '523' }, look: { skin: 1, hair: 4, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 17; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0; delete w.meta.fall;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const count = (id) => WGS.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  const pines = () => { for (let j = -8; j <= 8; j += 4) for (let i = -12; i <= 12; i += 4) wgSetObj(w, 'o', x + i, y + j, O_ID[(i + j) % 8 ? 'pine' : 'snowpine']); };
  const cones = () => { let n = 0; for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { const F = wgFallAt(x + i, y + j); if (F && F.id === 'pinecone') n++; } return n; };`;
let r = await g.ev(`(() => { const px = (id) => { const d = wgIcon(id).getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  const rc = RECIPES.find(q => q.out === 'wreath'); return [!!WGI.pinecone, px('pinecone'), px('wreath'), rc && rc.at, rc && Object.keys(rc.in).join(), OBJ[O_ID.pine].drops.some(d => d[0] === 'pinecone' || d.id === 'pinecone' || JSON.stringify(d).includes('pinecone')), OBJ[O_ID.snowpine].drops.some(d => JSON.stringify(d).includes('pinecone'))]; })()`);
ok(r[0] && r[1] >= 40 && r[2] >= 60 && r[3] === 'bench' && r[4] === 'pinecone,fiber,stick' && r[5] && r[6], 'icons, a felled pine may drop a pinecone, the wreath from a bench: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} pines(); const res = {}; const by = {}; for (const d of [16, 17, 18, 19, 20]) { WGS.day = d; by[d] = cones(); } res.autumn = by;
  const seen = []; for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { WGS.day = 17; const F = wgFallAt(x + i, y + j); if (F && F.id === 'pinecone') seen.push([i, j]); } res.days = new Set(Object.values(by)).size > 1;
  res.beside = seen.every(([i, j]) => [[1, 0], [-1, 0], [1, -1], [0, -1], [-1, -1]].some(([a, b]) => { const id = wgObjAt(w, 'o', x + i + a, y + j + b); return id === O_ID.pine || id === O_ID.snowpine; }));
  res.other = [0, 9, 26].map(d => { WGS.day = d; return cones(); }); WGS.day = 17;
  const [i, j] = seen[0]; const c0 = count('pinecone'); p.x = (x + i) * 16 + 8; p.y = (y + j) * 16 + 10; updateWG(1 / 60); res.took = [count('pinecone') - c0, wgFallFound(x + i, y + j), cones() === by[17]]; return res; })()`);
ok(Object.values(r.autumn).every(n => n >= 3 && n < 60) && r.days && r.beside, 'in autumn pinecones lie beside the pines, a new few each day: ' + JSON.stringify([r.autumn, r.days, r.beside]));
ok(r.other.every(n => n === 0), 'none in spring, summer or winter: ' + JSON.stringify(r.other));
ok(r.took[0] === 1 && r.took[1], 'walking onto one picks it up: ' + JSON.stringify(r.took));
r = await g.ev(`(() => { ${setup} const res = {}; wgSetObj(w, 'o', x + 2, y, O_ID.wreath); st.wreath = 0; const keys = [];
  for (const d of [3, 11, 19, 27]) { WGS.day = d; keys.push(wgWreathArt(wgSeason()).toDataURL().length); wgDrawObj(O_ID.wreath, x + 2, y, 100, 100); res['s' + wgSeason()] = st.wreath; }
  res.differ = new Set(keys).size === 4; res.solid = !!OBJ[O_ID.wreath].solid;
  const A = WG_ACH.find(a => a[0] === 'wreath')[3]; res.ach = [A({ st: { wreath: 15 }, seen: {} }), A({ st: { wreath: 7 }, seen: {} })];
  res.tips = [wgTipLines({ id: 'pinecone', n: 1 }).includes('FALLS FROM THE PINES IN AUTUMN'), wgTipLines({ id: 'wreath', n: 1 }).includes('IT CHANGES WITH THE SEASONS')]; return res; })()`);
ok(r.differ && r.s0 === 1 && r.s1 === 3 && r.s2 === 7 && r.s3 === 15 && !r.solid, 'the wreath looks different each season, and each one seen counts: ' + JSON.stringify(r));
ok(r.ach.join() === 'true,false' && r.tips.join() === 'true,true', 'WREATH FOR ALL SEASONS for all four; tips: ' + JSON.stringify([r.ach, r.tips]));
const EN = ['PINECONE', 'WREATH', 'WREATH FOR ALL SEASONS', 'SEE A WREATH IN EVERY SEASON', 'FALLS FROM THE PINES IN AUTUMN', 'IT CHANGES WITH THE SEASONS'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: pines in autumn with pinecones about, a wreath by the path; the four seasons' wreaths drawn small in a row
await g.ev(`(() => { ${setup} pines(); wgSetObj(w, 'o', x + 2, y - 1, O_ID.wreath); for (let i = -14; i < 15; i++) wgSetGround(w, 'o', x + i, y + 1, G_ID.p_gravel || G_ID.path); WGS.day = 17; WGS.cam.x = p.x + 8; WGS.cam.y = p.y - 8;
  window._wr = setInterval(() => { WGS.clock = 0.45; }, 50); })(); 0`);
await sleep(300); console.log('autumn', await g.shot('wg_wreath.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'WREATH OK' : 'WREATH FAIL'); g.close(); process.exit(pass ? 0 : 1);
