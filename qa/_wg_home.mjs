// Wildgrove's homing feather: it has art and a recipe; USE it, stand still, and it carries you to your bed, across
// dimensions too; a step or a hit breaks the glow; it is never used up; a door under the aim still opens; tips, Hungarian.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'HOME' }, seed: { v: '8' }, look: { skin: 2, hair: 0, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  return [!!WGI.home_feather, px(wgIcon('home_feather')), RECIPES.some(rc => rc.out === 'home_feather')]; })()`);
ok(r[0] && r[1] >= 30 && r[2], 'art and recipe: ' + JSON.stringify(r));
const run = (secs) => g.ev(`(() => { for (let i = 0; i < ${Math.round(secs * 60)}; i++) updateWG(1 / 60); return 0; })()`);
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p; WGS.scr = 'play'; w.meta.hintDone = 1; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'home_feather', n: 1 }; WGS.sel = 0;
  p.spawn = { x: p.x, y: p.y, dim: 'o' }; window.__home = [p.x, p.y]; p.x += 900; p.y += 400; const x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16);
  for (let j = -1; j < 2; j++) for (let i = -1; i < 3; i++) { wgSetObj(w, d, x + i - 1, y + j, 0); wgSetGround(w, d, x + i - 1, y + j, G_ID.grass); }
  wgUse(x, y); return [!!WGS.homing, WGS.toast && WGS.toast.msg]; })()`);
ok(r[0] && r[1] === 'STAND STILL...', 'USE starts the glow: ' + JSON.stringify(r));
await run(2);
r = await g.ev(`[WGS.p.x === __home[0] && WGS.p.y === __home[1], !WGS.homing, WGS.inv[0] && WGS.inv[0].id, WGS.toast && WGS.toast.msg, !!WGS.world.meta.stats.home]`);
ok(r[0] && r[1] && r[2] === 'home_feather' && r[3] === 'HOME AGAIN' && r[4], 'home again, the feather kept: ' + JSON.stringify(r));
// a step breaks it; a hit breaks it
r = await g.ev(`(() => { const p = WGS.p; p.x += 600; const x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16); wgSetObj(WGS.world, WGS.dim, x, y, 0); wgUse(x, y); updateWG(1 / 60); p.x += 8; updateWG(1 / 60);
  const a = [!WGS.homing, WGS.toast && WGS.toast.msg]; wgUse(x, y); updateWG(1 / 60); p.hp -= 2; updateWG(1 / 60); return a.concat([!WGS.homing, Math.abs(p.x - __home[0]) > 100]); })()`);
ok(r[0] && r[1] === 'THE GLOW FADES' && r[2] && r[3], 'a step or a hit breaks it: ' + JSON.stringify(r));
// across dimensions: from the caves to a bed on the surface
r = await g.ev(`(() => { const p = WGS.p; p.hp = p.maxHp; WGS.dim = 'u'; WGS.mobs = []; p.x = 40 * 16 + 8; p.y = 40 * 16 + 8; WGS.homing = null; wgHomeStart(); return 0; })()`);
await run(2);
r = await g.ev(`[WGS.dim, WGS.p.x === __home[0] && WGS.p.y === __home[1]]`);
ok(r[0] === 'o' && r[1], 'from the caves to the bed: ' + JSON.stringify(r));
// a door under the aim opens instead
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16); wgSetObj(w, d, x, y, O_ID.door); WGS.homing = null; wgUse(x, y); return [OBJ[wgObjAt(w, d, x, y)].id, !!WGS.homing]; })()`);
ok(r[0] === 'door_open' && !r[1], 'a door still opens: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'home_feather', n: 1 })`);
ok(r.includes('USE IT TO GO HOME TO YOUR BED') && r.includes('STAND STILL WHILE IT GLOWS'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.home_feather.name), tr('STAND STILL...'), tr('HOME AGAIN'), tr('THE GLOW FADES'), tr('USE IT TO GO HOME TO YOUR BED')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['HOMING FEATHER', 'STAND STILL...', 'HOME AGAIN', 'THE GLOW FADES', 'USE IT TO GO HOME TO YOUR BED'][i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { const p = WGS.p, w = WGS.world, d = WGS.dim, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16); wgSetObj(w, d, x, y, 0); p.x += 200; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.toast = null; WGS.clock = 0.3; wgHomeStart(); })(); 0`);
await run(0.9); await sleep(100); console.log('glow', await g.shot('wg_home_glow.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'HOME OK' : 'HOME FAIL'); g.close(); process.exit(pass ? 0 : 1);
