// Wildgrove's paths pack: every path has a ground, art, an icon and a recipe; walking on a path is quicker than on
// grass (and a wood floor is not); a boardwalk goes over shallow water but not deep, the other paths over neither;
// tips, Hungarian; a look at a road of every path with a boardwalk across a stream.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ROADS' }, seed: { v: '71' }, look: { skin: 3, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const [id, gid, , speed] of WG_PATHS) { if (!WGI[id] || WGI[id].placeG !== gid) { bad.push('no item ' + id); continue; } if (G_ID[gid] === undefined || GROUND[G_ID[gid]].speed !== speed || speed <= 1) bad.push('ground ' + gid);
    if (px(wgIcon(id)) < 100) bad.push('thin icon ' + id); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id);
    for (let v = 0; v < 4; v++) if (px(wgGroundTex(G_ID[gid], v)) !== 256) bad.push('holes in ' + gid + v); }
  if (GROUND[G_ID.path].speed <= 1 || GROUND[G_ID.f_wood].speed !== 1) bad.push('path or floor speed');
  return bad; })()`);
ok(!r.length, 'grounds, art and recipes: ' + JSON.stringify(r));
const walk = async (gid) => g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let i = -2; i < 14; i++) for (let j = -1; j < 2; j++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID['${gid}']); }
  WGS.mobs = []; WGS.scr = 'play'; p.x = x * 16 + 8; p.y = y * 16 + 8; p.vx = p.vy = 0; const x0 = p.x; Input.down.ArrowRight = true; for (let i = 0; i < 60; i++) updateWG(1 / 60); Input.down.ArrowRight = false;
  const dx = p.x - x0; p.x = x0; return Math.round(dx); })()`);
const grass = await walk('grass'), cobble = await walk('p_cobble'), board = await walk('p_board'), floor = await walk('f_wood');
ok(cobble > grass * 1.15 && board > grass * 1.1 && Math.abs(floor - grass) <= 2, 'paths are quicker, floors are not: ' + JSON.stringify({ grass, cobble, board, floor }));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = [];
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const [item, ground] of [['boardwalk', 'shallow'], ['boardwalk', 'deep'], ['path_cobble', 'shallow']]) {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) wgSetGround(w, d, x + i, y + j, G_ID[ground === 'deep' ? 'deep' : 'grass']); // deep water out from the shore (wg_pier's boardwalks start at the shore)
    wgSetObj(w, d, x, y, 0); wgSetGround(w, d, x, y, G_ID[ground]); WGS.inv[0] = { id: item, n: 4 }; wgUse(x, y); res.push(GROUND[wgGround(w, d, x, y)].id);
  }
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) wgSetGround(w, d, x + i, y + j, G_ID.grass);
  return res; })()`);
ok(r[0] === 'p_board' && r[1] === 'deep' && r[2] === 'shallow', 'a boardwalk bridges shallow water, never out on open deep water: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'path_cobble', n: 1 }).concat(wgTipLines({ id: 'boardwalk', n: 1 }), wgTipLines({ id: 'path_dirt', n: 1 }))`);
ok(r.filter(s => s === 'QUICKER TO WALK ON').length === 3 && r.includes('ALSO OVER SHALLOW WATER'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = WG_PATHS.map(q => tr(q[2])).concat(tr('QUICKER TO WALK ON'), tr('ALSO OVER SHALLOW WATER')); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['GRAVEL PATH', 'COBBLESTONES', 'STEPPING STONES', 'BOARDWALK', 'QUICKER TO WALK ON', 'ALSO OVER SHALLOW WATER'][i]), 'Hungarian: ' + JSON.stringify(r));
// a look: four roads side by side, the boardwalk over a stream
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 9, y0 = Math.floor(p.y / 16) - 4;
  for (let j = -2; j < 11; j++) for (let i = -2; i < 22; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  for (let j = -2; j < 11; j++) { wgSetGround(w, d, x0 + 14, y0 + j, G_ID.shallow); wgSetGround(w, d, x0 + 15, y0 + j, G_ID.deep); wgSetGround(w, d, x0 + 16, y0 + j, G_ID.shallow); }
  ['path', 'p_gravel', 'p_cobble', 'p_steps'].forEach((gid, k) => { for (let i = 0; i < 14; i++) for (let j = 0; j < 2; j++) wgSetGround(w, d, x0 + i, y0 + k * 2 + j, G_ID[gid]); });
  for (let i = 12; i < 19; i++) for (let j = 4; j < 6; j++) wgSetGround(w, d, x0 + i, y0 + j, G_ID.p_board);
  wgSetObj(w, d, x0 + 3, y0 + 9, O_ID.pinwheel_r || O_ID.lantern); wgSetObj(w, d, x0 + 10, y0 + 9, O_ID.lantern);
  p.x = (x0 + 6) * 16 + 8; p.y = (y0 + 5) * 16 + 10; WGS.cam.x = (x0 + 10) * 16; WGS.cam.y = (y0 + 4) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.4; WGS.inv[0] = null; w.meta.hintDone = 1; WGS.hint = null; })(); 0`);
await sleep(500); console.log('roads', await g.shot('wg_paths_roads.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PATHS OK' : 'PATHS FAIL'); g.close(); process.exit(pass ? 0 : 1);
