// Wildgrove's little touches: rain rings spread on the water in view while it rains, only on water, none when dry or
// with the weather effects off; a hot drink in hand steams, nothing else does, nor while seated; walking through tall
// grass rustles it (a sound and a few bits), standing still or on bare ground does not, no bits with the particles off;
// a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'DETAILS' }, seed: { v: '273' }, look: { skin: 3, hair: 6, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -16; j < 17; j++) for (let i = -22; i < 23; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; p.sit = null; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 9; WGS.clock = 0.45; wgOpt().amb = 1; wgOpt().wx = 1; wgOpt().part = 2; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; WGS.inv[WGS.sel] = null; WGDT.rings.length = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1;
  const R = rect; const rects = (fn) => { const L = []; rect = function (a, b, c, e, k) { L.push([a, b, c, e, k]); return R(...arguments); }; try { fn(); } finally { rect = R; } return L; };
  const sf = wgSfx; const sounds = (fn) => { const n = {}; wgSfx = (k) => { n[k] = (n[k] || 0) + 1; }; try { fn(); } finally { wgSfx = sf; } return n; };`;
let r = await g.ev(`(() => { ${setup} for (let j = -6; j <= 6; j++) for (let i = 1; i <= 11; i++) wgSetGround(w, 'o', x + i, y + j, G_ID.deep); const res = {};
  WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; for (let i = 0; i < 60; i++) updateWG(1 / 60); res.n = WGDT.rings.length; res.water = WGDT.rings.every(q => GROUND[wgGround(w, 'o', Math.floor(q.x / 16), Math.floor(q.y / 16))].liq === 'water');
  res.drawn = rects(() => wgChunkUpkeep(w, 'o', 0, 0, 0, 0)).filter(q => (q[4] === 'C' || q[4] === 'w') && q[2] === 1).length >= res.n;
  WGS.weather = null; for (let i = 0; i < 60; i++) updateWG(1 / 60); res.dry = WGDT.rings.length; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; wgOpt().wx = 0; for (let i = 0; i < 60; i++) updateWG(1 / 60); res.off = WGDT.rings.length; wgOpt().wx = 1; WGS.weather = null; return res; })()`);
ok(r.n >= 8 && r.water && r.drawn, 'rain rings spread on the water in view, only on water: ' + JSON.stringify([r.n, r.water, r.drawn]));
ok(r.dry === 0 && r.off === 0, 'none when dry or with the weather effects off: ' + JSON.stringify([r.dry, r.off]));
r = await g.ev(`(() => { ${setup} const cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, steam = () => rects(() => wgDrawPlayer({ p }, cx0, cy0)).filter(q => q[4] === 'L').length; const res = {};
  WGS.inv[WGS.sel] = { id: 'hot_cocoa', n: 1 }; res.cocoa = steam(); WGS.inv[WGS.sel] = { id: 'mint_tea', n: 1 }; res.tea = steam(); WGS.inv[WGS.sel] = { id: 'wood', n: 1 }; res.wood = steam();
  WGS.inv[WGS.sel] = { id: 'hot_cocoa', n: 1 }; p.sit = { tx: x, ty: y, dim: 'o' }; res.sit = steam(); p.sit = null; WGS.inv[WGS.sel] = null; return res; })()`);
ok(r.cocoa >= 2 && r.tea >= 2 && r.wood === 0 && r.sit === 0, 'a hot drink in hand steams, nothing else, not while seated: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} for (let i = -3; i <= 3; i++) wgSetObj(w, 'o', x + i, y, O_ID.tallgrass); const res = {}, walk = (n) => { for (let i = 0; i < n; i++) { p.x += 0.6; updateWG(1 / 60); } };
  WGDT.rustle = -9; WGS.parts.length = 0; res.walk = sounds(() => walk(60)).rustle | 0; res.bits = WGS.parts.length; res.still = sounds(() => { for (let i = 0; i < 60; i++) updateWG(1 / 60); }).rustle | 0;
  p.y += 48; WGDT.rustle = -9; res.bare = sounds(() => walk(30)).rustle | 0; p.y -= 48; p.x = x * 16 - 40; wgOpt().part = 0; WGS.parts.length = 0; WGDT.rustle = -9; res.off = [sounds(() => walk(60)).rustle | 0, WGS.parts.length]; wgOpt().part = 2; return res; })()`);
ok(r.walk >= 3 && r.bits >= 2 && r.still === 0 && r.bare === 0, 'walking through tall grass rustles it, not standing still or on bare ground: ' + JSON.stringify([r.walk, r.bits, r.still, r.bare]));
ok(r.off[0] >= 3 && r.off[1] === 0, 'no bits with the particles off, the sound still: ' + JSON.stringify(r.off));
// a look: rain on a pond, a hot cocoa in hand
await g.ev(`(() => { ${setup} for (let j = -4; j <= 4; j++) for (let i = 1; i <= 12; i++) wgSetGround(w, 'o', x + i, y + j, Math.abs(j) < 3 && i > 1 && i < 12 ? G_ID.deep : G_ID.shallow);
  for (const [i, j, o] of [[-5, -3, 'oak'], [-3, 3, 'tallgrass'], [-2, 3, 'tallgrass'], [-4, 2, 'fern'], [13, -4, 'reeds']]) wgSetObj(w, 'o', x + i, y + j, O_ID[o]);
  WGS.inv[WGS.sel] = { id: 'hot_cocoa', n: 1 }; p.face = 'r'; WGS.weather = { kind: 'rain', dark: 0.1, wind: 0.5 }; WGS.cam.x = p.x + 60; for (let i = 0; i < 40; i++) updateWG(1 / 60); })(); 0`);
await sleep(150); console.log('details', await g.shot('wg_details.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'DETAILS OK' : 'DETAILS FAIL'); g.close(); process.exit(pass ? 0 : 1);
