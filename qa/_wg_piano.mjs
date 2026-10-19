// Wildgrove's piano: from a bench; USE plays the next tune (the tile's meta), not over one still playing; its notes
// sound one by one as pno sounds and float up; a friend's tune (a tile from the net) plays here too when near, not far;
// TICKLE THE IVORIES for every tune; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'PIANO' }, seed: { v: '282' }, look: { skin: 0, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); WGPN.q.length = 0; WGPN.keys.clear(); WGOC.list.length = 0;
  const heard = []; const S0 = wgSfx; const listen = (fn) => { wgSfx = function (n) { heard.push(n); return S0.apply(this, arguments); }; try { fn(); } finally { wgSfx = S0; } return heard; };
  const run = (s) => { for (let i = 0; i < s * 30; i++) updateWG(1 / 30); };`;
let r = await g.ev(`(() => { ${setup} return { at: (RECIPES.find(q => q.out === 'piano') || {}).at, icon: !!wgIcon('piano') && wgIcon('piano').width === 16, tip: wgTipLines({ id: 'piano', n: 1 }).includes('USE IT TO PLAY A TUNE'),
  sounds: [0, 1, 2, 3, 4, 5, 6, 7].every(k => typeof Audio_ === 'object') }; })()`);
ok(r.at === 'bench' && r.icon && r.tip, 'a piano from a bench: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y - 1, O_ID.piano); st.piano = 0; const res = {}; res.used = wgUse(x + 2, y - 1); res.q = WGPN.q.length; res.meta = wgMetaAt(w, 'o', x + 2, y - 1);
  wgUse(x + 2, y - 1); res.busy = [WGPN.q.length, wgMetaAt(w, 'o', x + 2, y - 1)]; let shown = 0; const O0 = wgOcaShow; wgOcaShow = function () { shown++; return O0.apply(this, arguments); }; try { listen(() => run(3)); } finally { wgOcaShow = O0; } res.heard = heard.filter(n => /^pno[0-7]$/.test(n)).join(); res.floating = shown; res.key = WGPN.keys.has('o' + (x + 2) + ',' + (y - 1));
  for (let i = 1; i < 5; i++) { wgUse(x + 2, y - 1); run(3); } res.all = [st.piano, wgMetaAt(w, 'o', x + 2, y - 1)];
  const A = WG_ACH.find(a => a[0] === 'piano')[3]; res.ach = [A({ st: { piano: 31 }, seen: {} }), A({ st: { piano: 15 }, seen: {} })]; return res; })()`);
ok(r.used && r.q === 7 && r.meta === 1 && r.busy.join() === '7,1', 'USE plays the next tune, not over one still playing: ' + JSON.stringify([r.used, r.q, r.meta, r.busy]));
ok(r.heard === 'pno0,pno0,pno3,pno3,pno4,pno4,pno3' && r.floating === 7 && r.key, 'its notes sound one by one and float up: ' + JSON.stringify([r.heard, r.floating, r.key]));
ok(r.all.join() === '31,0' && r.ach.join() === 'true,false', 'every tune lights TICKLE THE IVORIES: ' + JSON.stringify([r.all, r.ach]));
r = await g.ev(`(() => { ${setup} wgSetObj(w, 'o', x + 2, y - 1, O_ID.piano, 0); wgSetObj(w, 'o', x + 40, y, O_ID.piano, 0); const res = {};
  WGN.applying = true; try { wgSetObj(w, 'o', x + 2, y - 1, O_ID.piano, 3); res.near = WGPN.q.length; WGPN.q.length = 0; wgSetObj(w, 'o', x + 40, y, O_ID.piano, 1); res.far = WGPN.q.length; wgSetObj(w, 'o', x + 3, y - 1, O_ID.piano, 0); res.fresh = WGPN.q.length; } finally { WGN.applying = false; }
  return res; })()`);
ok(r.near === 7 && r.far === 0 && r.fresh === 0, "a friend's tune plays here when near, not far, not for a new piano: " + JSON.stringify(r));
const EN = ['PIANO', 'TICKLE THE IVORIES', 'PLAY EVERY TUNE ON A PIANO', 'USE IT TO PLAY A TUNE'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a piano in a little room of wooden floor, a tune playing
await g.ev(`(() => { ${setup} for (let j = -3; j < 3; j++) for (let i = -4; i < 5; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.f_wood || G_ID.grass); wgSetObj(w, 'o', x + 1, y - 2, O_ID.piano, 3); wgUse(x + 1, y - 2); run(0.8); p.face = 'u'; })(); 0`);
await sleep(100); console.log('piano', await g.shot('wg_piano.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PIANO OK' : 'PIANO FAIL'); g.close(); process.exit(pass ? 0 : 1);
