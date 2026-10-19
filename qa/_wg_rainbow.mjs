// Wildgrove's rainbow: a daytime rain that stops outdoors brings a rainbow that fades in and out (none at night or in a
// cave, none with the weather effects off); the arc's bands; OVER THE RAINBOW; Hungarian; a look at one.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BOW' }, seed: { v: '52' }, look: { skin: 1, hair: 2, shirt: 0 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 60); 0`); // a rainbow's start is a time on this clock, so let it run a while
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const stop = (clock, dim) => g.ev(`(() => { WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.world.meta.stats = { kills: 0, far: 0 }; WGS.dim = '${dim}'; WGS.clock = ${clock}; WGS.wxT = 9999; WGBOW.t0 = -1;
  WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; WGS.wk = 'rain'; updateWG(1 / 60); WGS.weather = null; WGS.wk = null; updateWG(1 / 60); WGS.dim = 'o';
  return [WGBOW.t0 >= 0, !!WGS.world.meta.stats.bow]; })()`);
const day = await stop(0.4, 'o'), night = await stop(0.9, 'o'), cave = await stop(0.4, 'u');
ok(day[0] && day[1] && !night[0] && !cave[0], 'a rainbow after a daytime rain outdoors only: ' + JSON.stringify({ day, night, cave }));
let r = await g.ev(`[wgBowAlpha(0), wgBowAlpha(2.5), wgBowAlpha(10), wgBowAlpha(40), wgBowAlpha(WG_BOW_T + 1)].map(a => +a.toFixed(2))`);
ok(r.join() === '0,0.15,0.3,0.15,0', 'it fades in and out: ' + JSON.stringify(r));
r = await g.ev(`(() => { const c = wgBowArt(), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, at = (x, y) => { const i = (y * c.width + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
  const x = c.width >> 1, y0 = Math.round(SCR.h * 1.4 - SCR.h * 1.34); let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
  return [at(x, y0).join(), at(x, y0 + 10).join(), n > c.width * 10, at(x, c.height - 1)[3]]; })()`);
ok(r[0] === '232,51,77,255' && r[1] === '79,140,255,255' && r[2] && r[3] === 0, 'the arc: red outside, blue in, clear below: ' + JSON.stringify(r));
r = await g.ev(`(() => { let n = 0; const D = ctx.drawImage.bind(ctx); ctx.drawImage = function (img) { if (img === WGBOW.c) n++; return D(...arguments); }; WGBOW.t0 = WGS.t - 10;
  try { wgDrawWeatherFX(); const a = n; wgOpt().wx = 0; wgDrawWeatherFX(); wgOpt().wx = 1; return [a, n]; } finally { ctx.drawImage = D; } })()`);
ok(r[0] === 1 && r[1] === 1, 'drawn, not with the weather effects off: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.bow = 1; wgAchTick(); return !!m.ach.bow; })()`);
ok(r, 'OVER THE RAINBOW');
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr('OVER THE RAINBOW'), tr('SEE A RAINBOW AFTER THE RAIN')]; Save.settings.lang = 'en'; return a; })()`);
ok(r[0] !== 'OVER THE RAINBOW' && r[1] !== 'SEE A RAINBOW AFTER THE RAIN', 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { WGS.toast = null; WGS.clock = 0.4; WGBOW.t0 = WGS.t - 12; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('bow', await g.shot('wg_rainbow.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'RAINBOW OK' : 'RAINBOW FAIL'); g.close(); process.exit(pass ? 0 : 1);
