// Wildgrove's fish records: every fish caught gets a size in its kind's range, big ones rarer; the biggest of each kind
// is kept, a beaten record told in place of the catch's toast (not the first of a kind); shells and pearls have none;
// the angler board and the fish trophy open the board of records; FISH TALE for 50 cm; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'FISHLOG' }, seed: { v: '146' }, look: { skin: 1, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0; delete w.meta.fishrec; WGFL.pend = null;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });`;
let r = await g.ev(`(() => { ${setup} const res = {}; const sz = []; for (let k = 0; k <= 100; k++) sz.push(wgFishSize('fish_salmon', k / 100)); res.range = [sz[0], sz[50], sz[100], sz.filter(v => v >= 50).length];
  return res; })()`);
ok(r.range && r.range[0] === 30 && r.range[2] === 62 && r.range[3] > 5 && r.range[3] < 40, 'sizes in each kind\'s range, the big ones rarer: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; st.fishbig = 0; const R = Math.random; let seq = []; Math.random = () => seq.length ? seq.shift() : 0.5;
  const F = { tx: x + 3, ty: y }; wgSetGround(w, 'o', x + 3, y, G_ID.deep); const catch1 = (pick, size) => { seq = [pick, size]; const id = wgCatch(F); updateWG(1 / 60); return id; };
  try {
    // the plain catch picker: a draw of 0.3 inland by day gives a salmon, 0.9 a plain fish
    res.a = [catch1(0.3, 0.2), (w.meta.fishrec || {}).fish_salmon, WGS.toast && WGS.toast.msg]; WGS.toast = null;
    res.b = [catch1(0.3, 0.1), w.meta.fishrec.fish_salmon, !!WGS.toast]; WGS.toast = null;
    res.c = [catch1(0.3, 0.9), w.meta.fishrec.fish_salmon, WGS.toast && WGS.toast.msg, st.fishbig];
  } finally { Math.random = R; }
  res.biome = wgSurface(w.seed, x + 3, y).b;
  const H = WG_ACH.find(a => a[0] === 'fishbig')[3]; res.ach = [H({ st: { fishbig: 1 }, seen: {} }), H({ st: {}, seen: {} })]; return res; })()`);
ok(r.a[0] === 'fish_salmon' && r.a[1] === wgFishSizeHint(0.2) && r.a[2] === null, 'the first of a kind kept quietly: ' + JSON.stringify([r.a, r.biome]));
ok(r.b[1] === r.a[1] && !r.b[2] && r.c[1] === 56 && r.c[2] === 'A NEW RECORD: 56 CM!' && r.c[3] === 1 && r.ach.join() === 'true,false', 'a smaller one changes nothing; a bigger one is a new record, told; FISH TALE: ' + JSON.stringify([r.b, r.c, r.ach]));
function wgFishSizeHint(u) { return Math.round(46 * (0.65 + 0.7 * u * u)); }
r = await g.ev(`(() => { ${setup} const res = {}; w.meta.fishrec = { fish: 22, fish_salmon: 51 }; const R = RECIPES.find(q => q.out === 'fish_log'); res.rec = R && R.at;
  wgSetObj(w, 'o', x + 1, y, O_ID.fish_log); res.use = [wgUse(x + 1, y), WGS.scr]; drawWG(); res.btn = WGS.ui.cnt; WGS.t += 1; Input.hit.Escape = 1; updateWG(1 / 60); delete Input.hit.Escape; res.closed = WGS.scr;
  wgSetObj(w, 'o', x + 1, y, O_ID.fish_trophy); res.trophy = [wgUse(x + 1, y), WGS.scr]; WGS.scr = 'play';
  res.tips = [wgTipLines({ id: 'fish_log', n: 1 }).includes('KEEPS YOUR BIGGEST CATCHES'), wgIcon('fish_log').width]; return res; })()`);
ok(r.rec === 'bench' && r.use.join() === 'true,fishlog' && r.btn === 1 && r.closed === 'play' && r.trophy.join() === 'true,fishlog' && r.tips.join() === 'true,16', 'the angler board and the fish trophy open the records: ' + JSON.stringify(r));
const EN = ['ANGLER BOARD', 'FISH TALE', 'LAND A FISH OF 50 CM OR MORE', 'A NEW RECORD: 58 CM!', 'THE BIGGEST CATCHES', 'KEEPS YOUR BIGGEST CATCHES'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { ${setup} w.meta.fishrec = { fish: 22, fish_salmon: 51, fish_ice: 33, fish_glow: 15 }; wgSetObj(w, 'o', x + 1, y, O_ID.fish_log); wgUse(x + 1, y); })(); 0`);
await sleep(400); console.log('board', await g.shot('wg_fishlog.png'));
await g.ev(`(() => { WGS.scr = 'play'; const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); wgSetObj(w, 'o', x + 2, y, O_ID.fish_trophy); })(); 0`);
await sleep(300); console.log('world', await g.shot('wg_fishlog_world.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FISHLOG OK' : 'FISHLOG FAIL'); g.close(); process.exit(pass ? 0 : 1);
