// Wildgrove's seasons on the trees: apple trees blossom in spring, summer is the art itself, autumn turns oaks orange,
// red or gold (a shape keeps its variant), birches gold and leaves citrus green, winter lays snow along the crowns'
// tops (pines too); back in spring the very same sprites return; ALL FOUR SEASONS after a year; a look at an autumn
// wood and a winter one.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TREES' }, seed: { v: '95' }, look: { skin: 2, hair: 0, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
await g.ev(`window.__count = (id, k) => { let n = 0; const rgb = parseInt(PAL[k].slice(1), 16); for (const sp of WGA.obj[id]) { const c = sp.c, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8 && ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]) === rgb) n++; } return n; }; WGS.scr = 'play'; WGS.world.meta.hintDone = 1; 0`);
const at = (day) => g.ev(`(() => { WGS.day = ${day}; drawWG(); return { oakN: WGA.obj.oak.length, oakG: __count('oak', 'G'), oakO: __count('oak', 'o') + __count('oak', 'r') + __count('oak', 'O'), oakW: __count('oak', 'w'), birchY: __count('birch', 'y'),
  pineW: __count('pine', 'w'), appleW: __count('tree_apple', 'w'), orangeSame: WGA.obj.tree_orange === WGSE.base.tree_orange, oakBase: WGA.obj.oak === WGSE.base.oak }; })()`);
const spring = await at(0), summer = await at(8), autumn = await at(16), winter = await at(24), again = await at(32);
ok(spring.appleW > summer.appleW && spring.oakBase && summer.oakBase, 'spring blossom on the apple trees: ' + JSON.stringify([spring.appleW, summer.appleW]));
ok(autumn.oakN === summer.oakN * 3 && autumn.oakG === 0 && autumn.oakO > 200 && autumn.birchY > 30 && autumn.orangeSame, 'autumn colours, citrus stays green: ' + JSON.stringify(autumn));
ok(winter.oakW > summer.oakW + 20 && winter.pineW > 20 && winter.oakN === summer.oakN, 'snow on the crowns in winter: ' + JSON.stringify(winter));
ok(again.oakBase && again.oakN === summer.oakN, 'the same sprites come back in spring: ' + JSON.stringify(again));
let r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; WGS.day = 31; wgAchTick(); const not = !!m.ach.year; WGS.day = 32; wgAchTick(); return [not, !!m.ach.year]; })()`);
ok(!r[0] && r[1], 'ALL FOUR SEASONS after a year: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr('ALL FOUR SEASONS'), tr('SEE A WHOLE YEAR GO BY')]; Save.settings.lang = 'en'; return a; })()`);
ok(r[0] !== 'ALL FOUR SEASONS' && r[1] !== 'SEE A WHOLE YEAR GO BY', 'Hungarian: ' + JSON.stringify(r));
// a look: the same little wood in autumn and in winter
const wood = (day) => g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 10, y0 = Math.floor(p.y / 16) - 5;
  for (let j = -2; j < 12; j++) for (let i = -2; i < 24; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  const T = ['oak', 'birch', 'oak', 'pine', 'tree_apple_r', 'oak', 'tree_cherry', 'birch', 'tree_orange_r', 'oak', 'tree_apple', 'pine'];
  T.forEach((t, k) => wgSetObj(w, d, x0 + 1 + (k % 6) * 3 + (Math.floor(k / 6) % 2), y0 + 2 + Math.floor(k / 6) * 5, O_ID[t]));
  p.x = (x0 + 10) * 16 + 8; p.y = (y0 + 5) * 16 + 8; WGS.cam.x = (x0 + 9) * 16; WGS.cam.y = (y0 + 4) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.35; WGS.day = ${day}; Input.mx = 4; Input.my = 4; })(); 0`);
await wood(16); await sleep(500); console.log('autumn', await g.shot('wg_trees_autumn.png'));
await wood(24); await sleep(500); console.log('winter', await g.shot('wg_trees_winter.png'));
await g.ev(`WGS.day = 0; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'TREES OK' : 'TREES FAIL'); g.close(); process.exit(pass ? 0 : 1);
