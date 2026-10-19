// Wildgrove's fishing pack: every new fish and dish has an icon and a recipe, the catch follows the water (sea, cold,
// fresh, night, caves), a real cast lands a catch in the pack, five kinds light the ANGLER star; a look at the icons.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'FISH' }, seed: { v: '44' }, look: { skin: 2, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const NEW = ['fish_salmon', 'fish_tropic', 'fish_ice', 'fish_glow', 'fish_gold', 'grilled_salmon', 'fish_skewer', 'fish_chowder', 'fish_trophy'];
let r = await g.ev(`(() => { const bad = [];
  for (const id of ${JSON.stringify(NEW)}) {
    if (!WGI[id]) { bad.push('no item ' + id); continue; }
    const c = wgIcon(id), d = c.getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
    if (n < 30) bad.push('thin icon ' + id + ' ' + n);
  }
  for (const id of ['grilled_salmon', 'fish_skewer', 'fish_chowder', 'fish_trophy']) if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id);
  if (!WGA.obj.fish_trophy) bad.push('no trophy sprite');
  return bad; })()`);
ok(!r.length, 'icons, recipes, the trophy: ' + JSON.stringify(r));
// the catch by place and time (the biome is set by hand, 3000 casts each)
r = await g.ev(`(() => {
  const real = wgSurface, F = { tx: 3, ty: 3 }, res = {};
  const run = (name, b, dim, clock) => { wgSurface = () => ({ b }); const d0 = WGS.dim, c0 = WGS.clock; WGS.dim = dim; WGS.clock = clock; const n = {}; for (let i = 0; i < 3000; i++) { const k = wgCatch(F); n[k] = (n[k] || 0) + 1; } WGS.dim = d0; WGS.clock = c0; res[name] = n; };
  run('sea', 'ocean', 'o', 0.3); run('snow', 'snow', 'o', 0.3); run('meadow', 'meadow', 'o', 0.3); run('night', 'meadow', 'o', 0.98); run('cave', 'meadow', 'u', 0.3);
  wgSurface = real; return res; })()`);
const has = (n, ...ids) => ids.every(i => n[i] > 0), not = (n, ...ids) => ids.every(i => !n[i]);
ok(has(r.sea, 'fish_tropic', 'pearl', 'shell', 'fish', 'fish_gold') && not(r.sea, 'fish_salmon', 'fish_ice', 'fish_glow'), 'the sea: ' + JSON.stringify(r.sea));
ok(has(r.snow, 'fish_ice', 'fish') && not(r.snow, 'fish_tropic', 'pearl', 'fish_salmon'), 'the cold: ' + JSON.stringify(r.snow));
ok(has(r.meadow, 'fish_salmon', 'fish') && not(r.meadow, 'fish_tropic', 'fish_ice', 'fish_glow', 'pearl'), 'fresh water: ' + JSON.stringify(r.meadow));
ok(r.night.fish_glow > 500, 'glowfish at night: ' + JSON.stringify(r.night));
ok(has(r.cave, 'fish_glow', 'fish') && not(r.cave, 'fish_salmon', 'fish_tropic'), 'caves: ' + JSON.stringify(r.cave));
// a real cast: water beside the hero, the rod in hand, the bite comes
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, x = Math.floor(WGS.p.x / 16) + 2, y = Math.floor(WGS.p.y / 16);
  wgSetObj(w, d, x, y, 0); wgSetGround(w, d, x, y, G_ID.water); var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: 'rod', n: 1 }; WGS.sel = 0; WGS.scr = 'play'; WGS.world.meta.hintDone = 1;
  const cast = wgUse(x, y); if (WGS.fish) WGS.fish.t = 0.05; return [cast, !!WGS.fish]; })()`);
await sleep(400);
const got = await g.ev(`[WGS.fish, WGS.inv.filter(Boolean).map(s => s.id), WGS.toast && WGS.toast.msg]`);
ok(r[0] && r[1] && !got[0] && got[1].length === 2 && /^(CAUGHT|STAR): /.test(got[2]), 'a cast lands a catch: ' + JSON.stringify([r, got]));
// five kinds: the ANGLER star; the first fish star takes any fish
r = await g.ev(`(() => { WGS.p.seen = { fish_salmon: 1 }; wgAchTick(); const a = !!WGS.world.meta.ach.fish;
  Object.assign(WGS.p.seen, { fish: 1, fish_tropic: 1, fish_ice: 1 }); wgAchTick(); const b = !!WGS.world.meta.ach.angler;
  WGS.p.seen.fish_glow = 1; wgAchTick(); return [a, b, !!WGS.world.meta.ach.angler]; })()`);
ok(r[0] && !r[1] && r[2], 'stars: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr('CAUGHT: ' + WGI.fish_salmon.name), tr('ANGLER'), tr(WGI.fish_chowder.name)]; Save.settings.lang = 'en'; return a; })()`);
ok(r[0] === 'FOGÁS: LAZAC' && r[1] === 'HORGÁSZ' && r[2] === 'HALLEVES', 'Hungarian: ' + JSON.stringify(r));
// a look: the trophy and the pack
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, x = Math.floor(WGS.p.x / 16) - 2, y = Math.floor(WGS.p.y / 16) - 2; wgSetObj(w, d, x, y, O_ID.fish_trophy); WGS.toast = null; })(); 0`); await sleep(300);
console.log('trophy', await g.shot('wg_fish_trophy.png'));
await g.ev(`WGS.scr = 'inv'; WGS.ui = {}; const inv = WGS.inv; ${JSON.stringify(NEW)}.forEach((id, i) => inv[9 + i] = { id, n: 2 }); Input.mx = 24 + 19 * 4 + 9; Input.my = 18 + 36 + 9; 0`); await sleep(300);
console.log('icons', await g.shot('wg_fish_icons.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'FISH OK' : 'FISH FAIL'); g.close(); process.exit(pass ? 0 : 1);
