// Wildgrove's cozy pack: every new thing has an icon and a sprite, bone meal moves a crop on (and is kept
// when the crop is ripe), ripens a berry bush and grows a sapling; a row of the new things is shot for a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'COZY' }, seed: { v: '12' }, look: { skin: 1, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const NEW = ['carpet_yellow', 'carpet_white', 'carpet_purple', 'banner_y', 'banner_w', 'banner_p', 'jacklantern', 'pearl_lamp', 'chime', 'wall_obsidian', 'bonemeal', 'mush_soup', 'fruit_salad'];
let r = await g.ev(`(() => { const bad = [];
  for (const id of ${JSON.stringify(NEW)}) {
    const it = WGI[id]; if (!it) { bad.push('no item ' + id); continue; }
    const c = wgIcon(id), d = c.getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
    if (n < 20) bad.push('empty icon ' + id + ' ' + n);
    if (it.place && !WGA.obj[it.place] && OBJ[O_ID[it.place]].kind !== 'wall') bad.push('no sprite ' + id);
    if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id);
  }
  return bad; })()`);
ok(!r.length, 'icons, sprites and recipes: ' + JSON.stringify(r));
// bone meal: a crop one stage on; a ripe crop keeps the meal; a bush ripens; a sapling grows
r = await g.ev(`(() => {
  const w = WGS.world, d = WGS.dim, x = Math.floor(WGS.p.x / 16) + 2, y = Math.floor(WGS.p.y / 16), inv = WGS.inv;
  for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: 'bonemeal', n: 5 }; WGS.sel = 0;
  wgSetGround(w, d, x, y, G_ID.tilled); wgSetObj(w, d, x, y, O_ID.crop_wheat, 0);
  wgUse(x, y); const s1 = wgMetaAt(w, d, x, y);
  wgSetObj(w, d, x, y, O_ID.crop_wheat, 3); wgUse(x, y); const kept = wgInvCount(inv, 'bonemeal');
  const bush = Object.keys(O_ID).find(k => OBJ[O_ID[k]].ripe); wgSetObj(w, d, x, y, O_ID[bush], 0); wgUse(x, y); const ripe = OBJ[wgObjAt(w, d, x, y)].id;
  wgSetObj(w, d, x, y, O_ID.sap_oak, 0); wgUse(x, y); const tree = OBJ[wgObjAt(w, d, x, y)].id;
  return [s1, kept, bush, ripe, tree, wgInvCount(inv, 'bonemeal')];
})()`);
ok(r[0] === 1 && r[1] === 4 && r[3] === (await g.ev(`OBJ[O_ID.${r[2]}].ripe`)) && r[4] === 'oak' && r[5] === 2, 'bone meal: ' + JSON.stringify(r));
// a row of the new things beside the hero, for a look
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, x0 = Math.floor(WGS.p.x / 16) - 6, y0 = Math.floor(WGS.p.y / 16) - 2;
  for (let j = -1; j < 5; j++) for (let i = -1; i < 14; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  ['f_yellow', 'f_white', 'f_purple'].forEach((gid, k) => { for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) wgSetGround(w, d, x0 + k * 4 + i, y0 + 3 + j, G_ID[gid]); });
  ['banner_y', 'banner_w', 'banner_p', 'jacklantern', 'pearl_lamp', 'chime'].forEach((o, k) => wgSetObj(w, d, x0 + k * 2, y0, O_ID[o]));
  for (let i = 0; i < 3; i++) wgSetObj(w, d, x0 + 13, y0 + i, O_ID.w_obsidian); wgSetObj(w, d, x0 + 12, y0 + 2, O_ID.w_obsidian);
  WGS.p.y += 40; WGS.cam.x = WGS.p.x; WGS.cam.y = WGS.p.y - 30; WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.clock = 0.3; })(); 0`);
await sleep(500);
console.log('day', await g.shot('wg_cozy_day.png'));
await g.ev(`WGS.clock = 0.8; 0`); await sleep(500);
console.log('night', await g.shot('wg_cozy_night.png'));
await g.ev(`WGS.scr = 'inv'; WGS.ui = {}; const inv = WGS.inv; ${JSON.stringify(NEW)}.forEach((id, i) => inv[9 + i] = { id, n: 3 }); 0`); await sleep(300);
console.log('icons', await g.shot('wg_cozy_icons.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'COZY OK' : 'COZY FAIL'); g.close(); process.exit(pass ? 0 : 1);
