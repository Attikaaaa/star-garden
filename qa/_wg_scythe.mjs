// Wildgrove's scythe: from the anvil, with an icon; USE reaps the ripe crops in a three by three patch (each set growing
// again, the young ones left alone) and cuts the tall grass there; with nothing to reap USE does what it would anyway;
// the crops reaped count, BOUNTIFUL HARVEST at fifty; tips; Hungarian; a look at a reaped field.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SCYTHE' }, seed: { v: '412' }, look: { skin: 0, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 12; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); const count = (id) => WGS.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0) + WGS.drops.reduce((a, d) => a + (d.id === id ? d.n : 0), 0);`;
let r = await g.ev(`(() => { const d = wgIcon('scythe').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  const rc = RECIPES.find(q => q.out === 'scythe'); return [!!WGI.scythe, WGI.scythe.kind, n, rc && rc.at, wgTipLines({ id: 'scythe', n: 1 }).includes('REAPS THREE BY THREE')]; })()`);
ok(r[0] && r[1] === 'tool' && r[2] >= 30 && r[3] === 'anvil' && r[4], 'a tool from the anvil, with an icon and a tip: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; const C = O_ID.crop_wheat || O_ID[Object.keys(O_ID).find(k => k.startsWith('crop_'))];
  for (let j = -2; j <= 2; j++) for (let i = 2; i <= 6; i++) { wgSetGround(w, 'o', x + i, y + j, G_ID.tilled); wgSetObj(w, 'o', x + i, y + j, C, 3); }
  wgSetObj(w, 'o', x + 4, y, C, 1); wgSetObj(w, 'o', x + 3, y + 1, O_ID.tallgrass); wgSetGround(w, 'o', x + 3, y + 1, G_ID.grass);
  WGS.inv[0] = { id: 'scythe', n: 1 }; st.reap = 0; const ripe = () => { let n = 0; for (let j = -2; j <= 2; j++) for (let i = 2; i <= 6; i++) { const id = wgObjAt(w, 'o', x + i, y + j); if (id === C && wgMetaAt(w, 'o', x + i, y + j) >= 3) n++; } return n; };
  const r0 = ripe(); res.use = wgUse(x + 4, y); res.reaped = r0 - ripe(); res.replanted = [wgObjAt(w, 'o', x + 3, y - 1) === C, wgMetaAt(w, 'o', x + 3, y - 1)]; res.young = wgMetaAt(w, 'o', x + 4, y);
  res.grass = wgObjAt(w, 'o', x + 3, y + 1); res.outside = wgMetaAt(w, 'o', x + 6, y) >= 3 && wgMetaAt(w, 'o', x + 2, y + 2) >= 3; res.stat = st.reap; res.drops = WGS.drops.length + WGS.inv.filter(s => s && s.id !== 'scythe').length;
  res.swing = p.swing > 0; return res; })()`);
ok(r.use && r.reaped === 7 && r.replanted.join() === 'true,0' && r.young === 1 && r.stat === 7 && r.drops > 0, 'USE reaps the ripe crops three by three, each set growing again, the young one left: ' + JSON.stringify(r));
ok(r.grass === 0 && r.outside && r.swing, 'the tall grass there is cut, nothing beyond the patch, the scythe swings: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; WGS.inv[0] = { id: 'scythe', n: 1 }; res.empty = wgUse(x + 6, y);
  const A = WG_ACH.find(a => a[0] === 'reap')[3]; res.ach = [A({ st: { reap: 50 }, seen: {} }), A({ st: { reap: 49 }, seen: {} })]; return res; })()`);
ok(r.empty === false && r.ach.join() === 'true,false', 'with nothing to reap USE does what it would anyway; BOUNTIFUL HARVEST at fifty: ' + JSON.stringify(r));
const EN = ['SCYTHE', 'BOUNTIFUL HARVEST', 'REAP 50 CROPS WITH A SCYTHE', 'REAPS THREE BY THREE', 'RIPE CROPS GROW AGAIN'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a wheat field, a patch reaped, the scythe in hand
await g.ev(`(() => { ${setup} const C = O_ID.crop_wheat || O_ID[Object.keys(O_ID).find(k => k.startsWith('crop_'))];
  for (let j = -3; j <= 3; j++) for (let i = 1; i <= 8; i++) { wgSetGround(w, 'o', x + i, y + j, G_ID.tilled); wgSetObj(w, 'o', x + i, y + j, C, 3); }
  WGS.inv[0] = { id: 'scythe', n: 1 }; wgUse(x + 2, y); WGS.drops.length = 0; p.face = 'r'; WGS.cam.x = p.x + 56; Input.mx = 300; Input.my = 120; })(); 0`);
await sleep(300); console.log('field', await g.shot('wg_scythe.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SCYTHE OK' : 'SCYTHE FAIL'); g.close(); process.exit(pass ? 0 : 1);
