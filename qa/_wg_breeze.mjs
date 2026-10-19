// Wildgrove's breeze pack: kites and pinwheels have art and recipes (a pinwheel turns through four frames); a kite in
// hand flies high over its hero outdoors and not underground, trails behind a walk, snaps up after a trip, gets a tug
// from USE; a friend's kite (sent with the hero's position) flies too; HIGH FLYER after a minute; the net messages carry
// the kite; tips, Hungarian; a look at a kite over a pinwheel garden.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BREEZE' }, seed: { v: '63' }, look: { skin: 0, hair: 2, shirt: 5 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const KITES = ['kite_r', 'kite_y', 'kite_b'], WHEELS = ['pinwheel_r', 'pinwheel_y', 'pinwheel_b', 'pinwheel_w', 'pinwheel_p'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(KITES.concat(WHEELS))}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); }
  for (const id of ${JSON.stringify(WHEELS)}) if (!WGA.obj[id] || WGA.obj[id].length !== 4 || !OBJ[O_ID[id]].anim) bad.push('no turning ' + id);
  return bad; })()`);
ok(!r.length, 'art and recipes: ' + JSON.stringify(r));
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -4; j < 4; j++) for (let i = -6; i < 7; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGS.weather = null; WGS.wk = null; WGS.clock = 0.35; WGS.toast = null;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'kite_b', n: 1 }; WGS.sel = 0; })(); 0`);
await sleep(2500);
r = await g.ev(`(() => { const K = WGKT.get(-1), p = WGS.p; return [wgKiteHeld(), !!K, K ? Math.round(p.y - K.y) : 0, K ? Math.round(K.x - p.x) : 0, Math.round(WGS.world.meta.stats.kite || 0)]; })()`);
ok(r[0] === 3 && r[1] && r[2] > 40 && r[2] < 90 && Math.abs(r[3]) < 60 && r[4] >= 1, 'a kite flies over its hero, the time counts: ' + JSON.stringify(r));
r = await g.ev(`(() => { const p = WGS.p, K = WGKT.get(-1), off = Math.round(K.x - p.x); p.x += 60; WGS.cam.x = p.x; return [off]; })()`);
await sleep(120);
r = r.concat(await g.ev(`(() => { const p = WGS.p, K = WGKT.get(-1); return [Math.round(K.x - p.x)]; })()`));
ok(r[1] < r[0] - 20, 'it trails behind a walk (its offset before and after a step): ' + JSON.stringify(r));
r = await g.ev(`(() => { const p = WGS.p; p.x += 2000; WGS.cam.x = p.x; return 0; })()`); await sleep(150);
r = await g.ev(`(() => { const p = WGS.p, K = WGKT.get(-1); return Math.round(Math.hypot(p.x - K.x, p.y - K.y)); })()`);
ok(r < 120, 'it snaps up after a trip: ' + r);
r = await g.ev(`(() => { const p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16) + 1; wgSetObj(WGS.world, WGS.dim, x, y, 0); const used = wgUse(x, y); return [used, WGS.t - WGKT.get(-1).tug < 0.1]; })()`);
ok(r[0] && r[1], 'USE gives it a tug: ' + JSON.stringify(r));
await g.ev(`WGS.remote = [{ pid: 2, x: WGS.p.x + 60, y: WGS.p.y + 10, face: 'd', moving: false, walkT: 0, dim: WGS.dim, hp: 20, name: 'FRIEND', look: { skin: 1, hair: 0, shirt: 2 }, swing: 0, kite: 1, inv: 0 }]; 0`); await sleep(300);
r = await g.ev(`[WGKT.has(2), WGKT.size]`);
ok(r[0] && r[1] === 2, "a friend's kite flies too: " + JSON.stringify(r));
await g.ev(`WGS.remote = []; 0`); await sleep(150);
r = await g.ev(`[WGKT.has(2), WGKT.size]`);
ok(!r[0] && r[1] === 1, 'and goes when they put it away: ' + JSON.stringify(r));
r = await g.ev(`(() => { WGS.dim = 'u'; drawWG(); const under = WGKT.size; WGS.dim = 'o'; const st = WGS.world.meta.stats; st.kite = 59; wgAchTick(); const not = !!WGS.world.meta.ach.kite; st.kite = 60; wgAchTick(); return [under, not, !!WGS.world.meta.ach.kite]; })()`);
ok(r[0] === 0 && !r[1] && r[2], 'no kite underground; HIGH FLYER: ' + JSON.stringify(r));
r = await g.ev(`(() => { const s = [...document.scripts].find(x => x.src.includes('wg_net')); return !!s; })()`);
const net = await (await import('fs')).promises.readFile(new URL('../src/wg_net.js', import.meta.url), 'utf8');
ok(r && /kt: typeof wgKiteHeld/.test(net) && /kite: wgnKite\(m\.kt\)/.test(net) && /kite: wgnKite\(a\[11\]\)/.test(net) && /L\.kite \| 0[,\]]/.test(net), 'the net messages carry the kite');
await g.ev(`WGS.remote = [{ pid: 3, x: WGS.p.x + 30, y: WGS.p.y, face: 'd', moving: false, walkT: 0, dim: WGS.dim, hp: 20, name: 'ODD', look: { skin: 1, hair: 0, shirt: 2 }, swing: 0, kite: 9, inv: 0 }]; 0`); await sleep(200);
r = await g.ev(`[wgnKite(9), wgnKite('x'), wgnKite(-1), wgnKite(2), wgnKite(undefined), WGKT.has(3)]`);
await g.ev(`WGS.remote = []; 0`);
ok(r[0] === 0 && r[1] === 0 && r[2] === 0 && r[3] === 2 && r[4] === 0 && !r[5], 'an unknown kite from the net is ignored: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'kite_r', n: 1 }).concat(wgTipLines({ id: 'pinwheel_w', n: 1 }))`);
ok(r.includes('HOLD IT TO FLY IT OUTDOORS') && r.includes('USE IT TO GIVE A TUG') && r.includes('SPINS IN THE BREEZE'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.kite_r.name), tr(WGI.kite_b.name), tr(OBJ[O_ID.pinwheel_p].name), tr('HIGH FLYER'), tr('HOLD IT TO FLY IT OUTDOORS'), tr('SPINS IN THE BREEZE')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['RED KITE', 'BLUE KITE', 'PURPLE PINWHEEL', 'HIGH FLYER', 'HOLD IT TO FLY IT OUTDOORS', 'SPINS IN THE BREEZE'][i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a red kite over a row of pinwheels, a friend with a yellow one
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 6, y0 = Math.floor(p.y / 16) - 2;
  for (let j = -4; j < 6; j++) for (let i = -2; i < 16; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  ${JSON.stringify(WHEELS)}.forEach((id, i) => wgSetObj(w, d, x0 + 2 + i * 2, y0 + 3, O_ID[id]));
  WGS.inv[0] = { id: 'kite_r', n: 1 }; p.x = (x0 + 5) * 16 + 8; p.y = (y0 + 2) * 16 + 8; WGS.cam.x = (x0 + 7) * 16; WGS.cam.y = y0 * 16 + 8; WGKT.clear();
  WGS.remote = [{ pid: 2, x: (x0 + 10) * 16 + 8, y: (y0 + 1) * 16 + 8, face: 'd', moving: false, walkT: 0, dim: d, hp: 20, name: 'FRIEND', look: { skin: 1, hair: 0, shirt: 2 }, swing: 0, kite: 2, inv: 0 }]; WGS.toast = null; })(); 0`);
await sleep(1800); console.log('kites', await g.shot('wg_breeze_kites.png'));
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BREEZE OK' : 'BREEZE FAIL'); g.close(); process.exit(pass ? 0 : 1);
