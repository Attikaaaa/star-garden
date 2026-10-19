// Wildgrove's cloud watching: seated outdoors on a fair day, a shaped cloud comes after a wait, is named halfway over
// and noted, and drifts off; the next is a shape not yet seen; nothing standing, at night, in the rain or seated on a
// floor; standing up lets it drift off; drawn over the view; CLOUD WATCHER for all six; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'CLOUDS' }, seed: { v: '512' }, look: { skin: 1, hair: 4, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; p.sit = null; p.x = x * 16 + 8; p.y = y * 16 + 10; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; WGCG.cur = null; WGCG.still = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  const wait = (s) => { for (let k = 0; k < s * 10; k++) { WGS.clock = 0.45; updateWG(0.1); } }, sit = (gid) => { wgSetGround(w, 'o', x, y, gid || G_ID.grass); wgSetObj(w, 'o', x, y, O_ID.picnic); p.sit = null; wgSit(x, y); };`;
let r = await g.ev(`(() => { ${setup} const res = {}; st.clouds = 0; wait(WG_CG_WAIT + 4); res.standing = !!WGCG.cur;
  sit(); wait(WG_CG_WAIT - 1); res.early = !!WGCG.cur; wait(1.3); const C = WGCG.cur; res.came = !!C && C.k; WGS.toast = null;
  wait(WG_CG_T * 0.4); res.before = [!!WGS.toast, st.clouds]; wait(WG_CG_T * 0.1); res.named = [WGS.toast && WGS.toast.msg, st.clouds === 1 << C.k]; wait(WG_CG_T * 0.55); res.gone = !!WGCG.cur && WGCG.cur !== C;
  const ks = [C.k]; for (let n = 0; n < 5; n++) { wait(WG_CG_WAIT + WG_CG_T + 1.5); }
  res.all = st.clouds; res.sat = !!p.sit; return res; })()`);
ok(!r.standing && !r.early && r.came !== false && r.before.join() === 'false,0', 'nothing standing; seated, a cloud comes after the wait: ' + JSON.stringify(r));
ok(/^THAT CLOUD LOOKS LIKE A [A-Z]+!$/.test(r.named[0]) && r.named[1] && !r.gone, 'named halfway over and noted, then gone: ' + JSON.stringify([r.named, r.gone]));
ok(r.all === 63 && r.sat, 'each next cloud a shape not yet seen, all six in six: ' + JSON.stringify([r.all, r.sat]));
r = await g.ev(`(() => { ${setup} const res = {}; const one = (prep, undo) => { WGCG.cur = null; WGCG.still = 0; sit(); prep(); for (let k = 0; k < (WG_CG_WAIT + 3) * 10; k++) updateWG(0.1); const s = !!WGCG.cur; undo(); return s; };
  res.night = one(() => { WGS.clock = 0.95; }, () => {}); res.rain = one(() => { WGS.weather = { kind: 'rain' }; }, () => { WGS.weather = null; });
  res.floor = one(() => { wgSetGround(w, 'o', x, y, G_ID.f_wood); }, () => { wgSetGround(w, 'o', x, y, G_ID.grass); });
  WGCG.cur = null; WGCG.still = 0; sit(); wait(WG_CG_WAIT + 1); const C = WGCG.cur; res.on = !!C; wgStand(); for (let k = 0; k < WG_CG_T * 4; k++) { WGS.clock = 0.45; updateWG(0.1); if (!WGCG.cur) break; } res.off = !WGCG.cur;
  sit(); wait(WG_CG_WAIT + 4); const D = ctx.drawImage.bind(ctx); let n = 0; const A = wgCloudShape(WGCG.cur.k); ctx.drawImage = function (img) { if (img === A) n++; return D(...arguments); };
  try { wgDrawWeatherFX(); } finally { ctx.drawImage = D; } res.drawn = n;
  const H = WG_ACH.find(a => a[0] === 'clouds')[3]; res.ach = [H({ st: { clouds: 63 }, seen: {} }), H({ st: { clouds: 31 }, seen: {} })];
  res.art = WG_CG_SHAPES.map((s, k) => { const c = wgCloudShape(k); return c.width === s[1][0].length + 2 && s[1].every(row => row.length === s[1][0].length); }); return res; })()`);
ok(!r.night && !r.rain && !r.floor, 'none at night, in the rain or seated on a floor: ' + JSON.stringify(r));
ok(r.on && r.off && r.drawn === 1 && r.ach.join() === 'true,false' && r.art.every(Boolean), 'standing up lets it drift off; drawn over the view; CLOUD WATCHER; the shapes: ' + JSON.stringify(r));
const EN = ['CLOUD WATCHER', 'SEE EVERY SHAPE IN THE CLOUDS'].concat(['BUNNY', 'FISH', 'HEART', 'SHIP', 'TEAPOT', 'DUCK'].map(s => 'THAT CLOUD LOOKS LIKE A ' + s + '!'));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { ${setup} sit(); for (const [i, j, k] of [[-5, -2, 'oak'], [4, -3, 'birch'], [-3, 2, 'flower_y'], [2, 1, 'flower_r']]) if (O_ID[k]) wgSetObj(w, 'o', x + i, y + j, O_ID[k]);
  WGCG.cur = { k: 0, t0: WGS.t - WG_CG_T * 0.4, told: 1, y: 14 }; window._cg = setInterval(() => { WGS.clock = 0.45; if (WGCG.cur) WGCG.cur.t0 = WGS.t - WG_CG_T * 0.4; }, 30); })(); 0`);
await sleep(400); console.log('clouds', await g.shot('wg_cloudgaze.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'CLOUDGAZE OK' : 'CLOUDGAZE FAIL'); g.close(); process.exit(pass ? 0 : 1);
