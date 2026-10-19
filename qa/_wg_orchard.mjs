// Wildgrove's orchard pack: every fruit tree has bare and ripe art of one shape, every new item an icon and a recipe,
// wild fruit trees grow in the world, a ripe tree is picked by USE and grows its fruit back, a sapling grows into one,
// the axe still fells it, four fruit light the ORCHARD star; a look at the trees and the pack.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ORCHARD' }, seed: { v: '58' }, look: { skin: 1, hair: 2, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const KINDS = ['apple', 'cherry', 'orange', 'lemon'];
const ITEMS = ['cherry', 'orange', 'lemon', 'sap_apple', 'sap_cherry', 'sap_orange', 'sap_lemon', 'baked_apple', 'apple_pie', 'cherry_tart', 'jam_toast', 'orange_juice', 'lemonade', 'fruit_basket'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(ITEMS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } const n = px(wgIcon(id)); if (n < 30) bad.push('thin icon ' + id + ' ' + n); if (!RECIPES.some(rc => rc.out === id) && !['cherry', 'orange', 'lemon'].includes(id)) bad.push('no recipe ' + id); }
  for (const k of ${JSON.stringify(KINDS)}) { const a = WGA.obj['tree_' + k], b = WGA.obj['tree_' + k + '_r'];
    if (!a || !b || a.length !== 2 || b.length !== 2) { bad.push('art ' + k); continue; }
    for (let v = 0; v < 2; v++) { if (a[v].c.width !== b[v].c.width || a[v].c.height !== b[v].c.height) bad.push('size ' + k + v);
      const da = a[v].c.getContext('2d').getImageData(0, 0, 28, 36).data, db = b[v].c.getContext('2d').getImageData(0, 0, 28, 36).data; let diff = 0, same = 0;
      for (let i = 3; i < da.length; i += 4) { if ((da[i] > 0) !== (db[i] > 0)) diff++; else if (da[i]) same++; } if (diff > 12) bad.push('shape jumps ' + k + v + ' ' + diff); }
    if (!WGA.obj['sap_' + k]) bad.push('sapling art ' + k); }
  if (!WGA.obj.fruit_basket) bad.push('basket art');
  return bad; })()`);
ok(!r.length, 'icons, recipes, trees of one shape: ' + JSON.stringify(r));
// the wild ones: some oaks, birches, jungle trees and palms bear fruit, the same on a second generation
r = await g.ev(`(() => { const n = {}, seed = WGS.world.seed; let same = true;
  for (let cy = -6; cy < 6; cy++) for (let cx = -6; cx < 6; cx++) { const ch = wgNewChunk(cx, cy, 'o'); wgGenOver(seed, ch); const ch2 = wgNewChunk(cx, cy, 'o'); wgGenOver(seed, ch2);
    for (let k = 0; k < ch.o.length; k++) { const o = ch.o[k] && OBJ[ch.o[k]]; if (ch.o[k] !== ch2.o[k]) same = false; if (o && o.fruit) n[o.fruit] = (n[o.fruit] || 0) + 1; } }
  return [n, same]; })()`);
ok(r[0] && r[0].apple > 0 && r[0].cherry > 0 && r[1], 'wild fruit trees, the same every time: ' + JSON.stringify(r));
// pick, regrow, plant, fell
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, x = Math.floor(WGS.p.x / 16) + 1, y = Math.floor(WGS.p.y / 16), inv = WGS.inv, res = {};
  for (let j = -2; j < 3; j++) for (let i = -2; i < 4; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  for (const k of ${JSON.stringify(KINDS)}) {
    for (let i = 0; i < 36; i++) inv[i] = null; WGS.sel = 0; WGS.drops = []; WGS.toast = null;
    wgSetObj(w, d, x, y, O_ID['tree_' + k]); wgUse(x, y); const wait = WGS.toast && WGS.toast.msg;
    wgSetObj(w, d, x, y, O_ID['tree_' + k + '_r']); wgUse(x, y); const after = OBJ[wgObjAt(w, d, x, y)].id, fruit = WGS.drops.filter(q => q.id === WGI[OBJ[O_ID['tree_' + k]].fruit].id).length;
    inv[0] = { id: 'bonemeal', n: 2 }; wgUse(x, y); const meal = OBJ[wgObjAt(w, d, x, y)].id;
    // a sapling from two fruit and a stick, planted on grass, grows into a bare tree
    wgSetObj(w, d, x, y, 0); inv[0] = { id: 'sap_' + k, n: 1 }; wgUse(x, y); const sap = OBJ[wgObjAt(w, d, x, y)].id;
    inv[0] = { id: 'bonemeal', n: 1 }; wgUse(x, y); const grown = OBJ[wgObjAt(w, d, x, y)].id;
    res[k] = [wait, after, fruit, meal, sap, grown];
  }
  // the axe fells a ripe tree: wood and the fruit
  for (let i = 0; i < 36; i++) inv[i] = null; WGS.drops = []; wgSetObj(w, d, x, y, O_ID.tree_apple_r); wgBreak(x, y, true);
  res.fell = [wgObjAt(w, d, x, y) === O_ID.tree_apple_r, WGS.drops.some(q => q.id === 'wood'), WGS.drops.some(q => q.id === 'apple')];
  return res; })()`);
ok(KINDS.every(k => r[k] && r[k][0] === 'THE FRUIT IS STILL GROWING' && r[k][1] === 'tree_' + k && r[k][2] >= 2 && r[k][3] === 'tree_' + k + '_r' && r[k][4] === 'sap_' + k && r[k][5] === 'tree_' + k), 'pick, bone meal, plant, grow: ' + JSON.stringify(r));
ok(!r.fell[0] && r.fell[1] && r.fell[2], 'the axe fells it: ' + JSON.stringify(r.fell));
// a bare tree in a loaded chunk ripens on its own
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, x = Math.floor(WGS.p.x / 16 / WG.CS) * WG.CS, y = Math.floor(WGS.p.y / 16 / WG.CS) * WG.CS; wgSetObj(w, d, x, y, O_ID.tree_cherry); const R = Math.random; Math.random = () => 0;
  WGS.growT = 0; wgGrowTick(0.1); Math.random = R; return OBJ[wgObjAt(w, d, x, y)].id; })()`);
ok(r === 'tree_cherry_r', 'it ripens with time: ' + r);
r = await g.ev(`(() => { WGS.p.seen = { apple: 1, cherry: 1, orange: 1 }; WGS.world.meta.ach = {}; wgAchTick(); const a = !!WGS.world.meta.ach.orchard; WGS.p.seen.lemon = 1; wgAchTick(); return [a, !!WGS.world.meta.ach.orchard]; })()`);
ok(!r[0] && r[1], 'the ORCHARD star: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.cherry_tart.name), tr(OBJ[O_ID.tree_lemon_r].name), tr(WGI.sap_orange.name), tr('THE FRUIT IS STILL GROWING'), tr('ORCHARD'), tr('GROWS INTO A FRUIT TREE')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['CHERRY TART', 'RIPE LEMON TREE', 'ORANGE SAPLING', 'THE FRUIT IS STILL GROWING', 'ORCHARD', 'GROWS INTO A FRUIT TREE'][i]), 'Hungarian: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'sap_cherry', n: 1 })`);
ok(r[0] === 'GROWS INTO A FRUIT TREE', 'sapling tip: ' + JSON.stringify(r));
// a look: each tree bare and ripe, both shapes, and a basket
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, x0 = Math.floor(WGS.p.x / 16) - 6, y0 = Math.floor(WGS.p.y / 16) - 3;
  for (let j = -3; j < 6; j++) for (let i = -2; i < 16; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  ${JSON.stringify(KINDS)}.forEach((k, i) => { for (let v = 0; v < 2; v++) wgSetObj(w, d, x0 + i * 3, y0 + v * 3, O_ID['tree_' + k + (v ? '_r' : '')]); });
  wgSetObj(w, d, x0 + 13, y0 + 3, O_ID.fruit_basket); for (let i = 0; i < 4; i++) wgSetObj(w, d, x0 + 13 + (i % 2), y0 + (i >> 1), O_ID['sap_' + ${JSON.stringify(KINDS)}[i]]);
  WGS.cam.x = (x0 + 7) * 16; WGS.cam.y = (y0 + 1) * 16; WGS.p.x = (x0 + 7) * 16 + 8; WGS.p.y = (y0 + 5) * 16 + 8; WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.clock = 0.3; WGS.toast = null; WGS.weather = null; })(); 0`);
await sleep(500);
console.log('trees', await g.shot('wg_orchard_trees.png'));
await g.ev(`WGS.scr = 'inv'; WGS.ui = {}; const inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; ${JSON.stringify(ITEMS)}.forEach((id, i) => inv[9 + i] = { id, n: 2 }); Input.mx = 300; Input.my = 200; 0`); await sleep(300);
console.log('icons', await g.shot('wg_orchard_icons.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'ORCHARD OK' : 'ORCHARD FAIL'); g.close(); process.exit(pass ? 0 : 1);
