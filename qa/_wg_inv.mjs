// Wildgrove backpack and chest comfort: shift-click moves a whole stack, SORT tidies the backpack, a chest's
// TAKE ALL / STORE ALL, shift-click on a recipe makes five, the recipe list's arrows, the pad's RB, the hand
// refilling itself. Nothing is
// lost or made from nothing on the way. Hungarian patterns from lang_hu_wg.js are live.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BAG' }, seed: { v: '5' }, look: { skin: 1, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
// a click at play-view coordinates, with shift held when asked
await g.ev(`window.__click = (mx, my, shift) => new Promise(res => {
  const r = cv.getBoundingClientRect(), x = r.left + (mx + SCR.ox) / SCR.w * r.width, y = r.top + (my + SCR.oy) / SCR.h * r.height;
  if (shift) Input.down.ShiftLeft = true;
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
  setTimeout(() => { cv.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, button: 0, bubbles: true }));
    setTimeout(() => { window.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, button: 0, bubbles: true })); Input.down.ShiftLeft = false; setTimeout(res, 120); }, 80); }, 60);
});
window.__count = (arr) => { const n = {}; for (const s of arr) if (s) n[s.id] = (n[s.id] || 0) + s.n; return n; };
window.__same = (a, b) => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]])) === JSON.stringify(Object.keys(b).sort().map(k => [k, b[k]]));
WGS.world.meta.hintDone = 1; 0`);
// the backpack: hotbar slot 0 holds wood; a shift-click sends it to the backpack, onto the wood already there
await g.ev(`var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null;
  inv[0] = { id: 'wood', n: 30 }; inv[12] = { id: 'wood', n: 90 }; inv[20] = { id: 'stone', n: 7 }; inv[30] = { id: 'stick', n: 5 }; inv[14] = { id: 'stone', n: 4 }; inv[33] = { id: 'pick_wood', n: 1 };
  window.__all0 = __count(inv.concat([WGS.cur])); WGS.scr = 'inv'; WGS.ui = {}; WGS.cur = null; 0`);
await sleep(200);
await g.ev(`__click(24 + 9, 28 + 9, true)`);
let r = await g.ev(`[WGS.inv[0], WGS.inv[12], WGS.cur, __same(__count(WGS.inv), __all0)]`);
ok(!r[0] && r[1].n === 99 && !r[2] && r[3], 'shift-click sends a hotbar stack into the backpack: ' + JSON.stringify(r));
// a plain click still picks up (and puts back)
await g.ev(`__click(24 + 5 * 19 + 9, 54 + 9)`); r = await g.ev(`WGS.cur && WGS.cur.id`);
ok(r === 'stone', 'a plain click picks the stack up: ' + r);
await g.ev(`__click(24 + 5 * 19 + 9, 54 + 9)`);
// SORT: tools first, stacks merged, the hotbar untouched
await g.ev(`__click(156 + 19, 14 + 6)`);
r = await g.ev(`({ pack: WGS.inv.slice(9).map(s => s ? s.id + ':' + s.n : '-').join(' '), same: __same(__count(WGS.inv), __all0), hot: WGS.inv.slice(0, 9).every(s => !s) })`);
ok(r.same && r.hot && /^pick_wood:1 /.test(r.pack) && r.pack.includes('stone:11') && !/stone:\d+ .*stone/.test(r.pack), 'SORT tidies the backpack: ' + r.pack);
console.log('inv', await g.shot('wg_inv_sort.png'));
// shift-click on a recipe makes five: 5 wood -> 20 sticks
await g.ev(`var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[9] = { id: 'wood', n: 5 }; WGS.p.seen = { wood: 1 }; WGS.ui = {}; WGU.rq && (WGU.rq.v = ''); 0`);
await sleep(200);
await g.ev(`__click(210 + 75, 38 + 13, true)`);
r = await g.ev(`[wgInvCount(WGS.inv, 'wood'), wgInvCount(WGS.inv, 'stick')]`);
ok(r[0] === 0 && r[1] === 20, 'shift-click on a recipe makes five: ' + JSON.stringify(r));
await g.ev(`WGS.inv[10] = { id: 'wood', n: 3 }; 0`); await sleep(100);
await g.ev(`__click(210 + 75, 38 + 13)`);
r = await g.ev(`[wgInvCount(WGS.inv, 'wood'), wgInvCount(WGS.inv, 'stick')]`);
ok(r[0] === 2 && r[1] === 24, 'a plain click makes one: ' + JSON.stringify(r));
// the recipe list's arrows scroll it (touch has no wheel)
await g.ev(`var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; WGS.p.seen = Object.fromEntries(Object.keys(WGI).map(k => [k, 1])); WGS.ui = {}; 0`); await sleep(200);
await g.ev(`__click(345 + 7, 173 + 6)`); r = await g.ev(`WGS.ui.scroll`);
ok(r === 1, 'the down arrow scrolls the recipes: ' + r);
await g.ev(`__click(328 + 7, 173 + 6)`); r = await g.ev(`WGS.ui.scroll`);
ok(r === 0, 'the up arrow scrolls back: ' + r);
// a chest: TAKE ALL, STORE ALL (the hotbar stays), shift-click both ways
const cpos = await g.ev(`(() => { const tx = Math.floor(WGS.p.x / 16) + 2, ty = Math.floor(WGS.p.y / 16); wgSetObj(WGS.world, 'o', tx, ty, O_ID.chest); const c = wgCont(WGS.world, 'o', tx, ty, true);
  for (let i = 0; i < 27; i++) c[i] = null; c[0] = { id: 'iron', n: 12 }; c[5] = { id: 'coal', n: 40 }; c[26] = { id: 'wood', n: 50 };
  const inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: 'pick_wood', n: 1 }; inv[11] = { id: 'wood', n: 60 }; inv[20] = { id: 'fiber', n: 9 };
  window.__c = c; window.__all1 = __count(c.concat(inv)); WGS.chest = { tx, ty, dim: 'o' }; WGS.scr = 'chest'; WGS.ui = {}; WGS.cur = null; return [tx, ty]; })()`);
await sleep(200);
console.log('chest', await g.shot('wg_chest.png'));
await g.ev(`__click(156 + 27, 18 + 6)`);
r = await g.ev(`({ c: __c.filter(Boolean).length, inv: __count(WGS.inv), hot: WGS.inv.slice(0, 9).filter(Boolean).length, same: __same(__count(__c.concat(WGS.inv)), __all1) })`);
ok(r.c === 0 && r.inv.iron === 12 && r.inv.wood === 110 && r.same && r.hot === 1, 'TAKE ALL empties the chest into the backpack: ' + JSON.stringify(r));
await g.ev(`__click(214 + 27, 18 + 6)`);
r = await g.ev(`({ c: __count(__c), hot: WGS.inv[0] && WGS.inv[0].id, pack: WGS.inv.slice(9).filter(Boolean).length, same: __same(__count(__c.concat(WGS.inv)), __all1) })`);
ok(r.hot === 'pick_wood' && r.pack === 0 && r.c.iron === 12 && r.same, 'STORE ALL fills the chest, the hotbar stays: ' + JSON.stringify(r));
const slotOf = await g.ev(`__c.findIndex(s => s && s.id === 'coal')`);
await g.ev(`__click(96 + (${slotOf} % 9) * 19 + 9, 32 + Math.floor(${slotOf} / 9) * 19 + 9, true)`);
r = await g.ev(`[wgInvCount(WGS.inv, 'coal'), __c.some(s => s && s.id === 'coal'), __same(__count(__c.concat(WGS.inv)), __all1)]`);
ok(r[0] === 40 && !r[1] && r[2], 'shift-click takes a stack out of the chest: ' + JSON.stringify(r));
await g.ev(`__click(96 + 9, 166 + 9, true)`);
r = await g.ev(`[WGS.inv[0], __c.some(s => s && s.id === 'pick_wood')]`);
ok(!r[0] && r[1], 'shift-click on the hotbar puts it in the chest: ' + JSON.stringify(r));
// the chest's contents are saved with its chunk
ok(await g.ev(`wgChunkAt(WGS.world, 'o', ${cpos[0]}, ${cpos[1]}).mod === true`), 'the chest marks its chunk to save');
// a pad: the stick moves the pointer, RB moves the whole stack
await g.ev(`(() => { const btn = () => ({ pressed: false, value: 0 }); window.__pad = { connected: true, index: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, btn) }; navigator.getGamepads = () => [__pad]; })();
  var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[1] = { id: 'stone', n: 33 }; WGS.scr = 'inv'; WGS.ui = {}; WGS.cur = null; Input.lastAim = 'pad'; 0`);
await sleep(150);
await g.ev(`Input.mx = 24 + 19 + 9; Input.my = 28 + 9; __pad.buttons[5] = { pressed: true, value: 1 }; 0`); await sleep(120); await g.ev(`__pad.buttons[5] = { pressed: false, value: 0 }; 0`); await sleep(120);
r = await g.ev(`[WGS.inv[1], WGS.inv.slice(9).filter(Boolean).map(s => s.id + ':' + s.n), WGS.cur]`);
ok(!r[0] && r[1].join() === 'stone:33' && !r[2], 'the pad RB moves the whole stack: ' + JSON.stringify(r));
// chests in reach: the recipe book counts them, crafting takes from them, STASH tops them up
r = await g.ev(`(() => {
  const w = WGS.world, d = WGS.dim, tx = Math.floor(WGS.p.x / 16) + 3, ty = Math.floor((WGS.p.y - 4) / 16);
  for (let y = ty - 7; y <= ty + 7; y++) for (let x = tx - 9; x <= tx + 5; x++) { const o = wgObjAt(w, d, x, y); if (o && OBJ[o].kind === 'storage') wgSetObj(w, d, x, y, 0); } // only this chest in reach
  wgSetObj(w, d, tx, ty, O_ID.chest); const c = wgCont(w, d, tx, ty, true); for (let i = 0; i < 27; i++) c[i] = null; c[0] = { id: 'wood', n: 10 }; c[1] = { id: 'flint', n: 3 };
  var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[9] = { id: 'wood', n: 2 }; inv[10] = { id: 'flint', n: 4 }; inv[11] = { id: 'stone', n: 6 };
  WGS.p.seen = { wood: 1 }; WGS.nearC = null; WGS.scr = 'inv'; WGS.ui = {}; WGS.cur = null; window.__chest = c; return [tx, ty];
})()`);
await sleep(250);
await g.ev(`__click(210 + 75, 38 + 13)`); // the first craftable recipe: sticks, 1 wood (the pack's own first)
r = await g.ev(`(() => { const L = RECIPES.filter(rc => rc.at === 'hand' && (WGS.p.seen[rc.out] || Object.keys(rc.in).every(k => WGS.p.seen[k]))); return [wgInvCount(WGS.inv, 'stick'), wgInvCount(WGS.inv, 'wood'), wgInvCount(__chest, 'wood')]; })()`);
ok(r[0] === 4 && r[1] + r[2] === 11, 'crafting near a chest: ' + JSON.stringify(r));
r = await g.ev(`(() => { const st = wgStations(); const pool = WGS.inv.concat(__chest); return [wgCanCraft(pool, RECIPES.find(rc => rc.out === 'chest')), wgCanCraft(WGS.inv, RECIPES.find(rc => rc.out === 'chest'))]; })()`);
ok(r[0] && !r[1], 'a chest recipe (8 wood) only works with the chest counted: ' + JSON.stringify(r));
await g.ev(`WGS.p.seen = { wood: 1, chest: 1 }; WGU.rq.v = 'CHEST'; WGS.ui = {}; 0`); await sleep(250);
await g.ev(`__click(210 + 75, 38 + 13)`);
r = await g.ev(`[wgInvCount(WGS.inv, 'chest'), wgInvCount(WGS.inv, 'wood') + wgInvCount(__chest, 'wood')]`);
ok(r[0] === 1 && r[1] === 3, 'the chest recipe takes wood from the pack, then the chest: ' + JSON.stringify(r));
await g.ev(`WGU.rq.v = ''; 0`);
await g.ev(`__click(24 + 88 + 20, 14 + 6)`); // STASH
r = await g.ev(`[wgInvCount(WGS.inv, 'flint'), wgInvCount(__chest, 'flint'), wgInvCount(WGS.inv, 'stone')]`);
ok(r[0] === 0 && r[1] === 7 && r[2] === 6, 'STASH puts flint with the flint, stone stays: ' + JSON.stringify(r));
console.log('stash', await g.shot('wg_inv_stash.png'));
// the hand refills itself in play: the same thing first, else the best tool of the kind; never after a drop
await g.ev(`navigator.getGamepads = () => []; Input.lastAim = 'keys'; var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: 'torch', n: 1 }; inv[20] = { id: 'torch', n: 30 }; WGS.sel = 0; WGS.scr = 'play'; WGS.ui = {}; 0`);
await sleep(150); await g.ev(`WGS.inv[0] = null; 0`); await sleep(150);
r = await g.ev(`[WGS.inv[0], WGS.inv[20]]`);
ok(r[0] && r[0].id === 'torch' && r[0].n === 30 && !r[1], 'the last torch placed: the hand refills: ' + JSON.stringify(r));
await g.ev(`var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: 'pick_stone', n: 1 }; inv[15] = { id: 'pick_wood', n: 1 }; inv[16] = { id: 'pick_iron', n: 1 }; inv[17] = { id: 'axe_star', n: 1 }; 0`);
await sleep(150); await g.ev(`WGS.inv[0] = null; 0`); await sleep(150);
r = await g.ev(`WGS.inv[0] && WGS.inv[0].id`);
ok(r === 'pick_iron', 'a worn-out pickaxe: the best pickaxe comes up: ' + r);
await g.ev(`var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: 'pick_stone', n: 1 }; inv[25] = { id: 'pick_wood', n: 1 }; 0`);
await sleep(150); await g.press('KeyQ'); await sleep(200);
r = await g.ev(`[WGS.inv[0], WGS.inv[25] && WGS.inv[25].id]`);
ok(!r[0] && r[1] === 'pick_wood', 'a tool dropped on purpose is not replaced: ' + JSON.stringify(r));
await g.ev(`var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: 'axe_stone', n: 1 }; inv[30] = { id: 'axe_iron', n: 1 }; WGS.scr = 'inv'; 0`);
await sleep(150); await g.ev(`WGS.inv[31] = WGS.inv[0]; WGS.inv[0] = null; 0`); await sleep(100); await g.ev(`WGS.scr = 'play'; 0`); await sleep(150);
r = await g.ev(`[WGS.inv[0], WGS.inv[30] && WGS.inv[30].n]`);
ok(!r[0], 'a slot emptied in the backpack screen stays empty: ' + JSON.stringify(r));
// Hungarian: the patterns lang_hu_wg.js adds are used
r = await g.ev(`(() => { const was = Save.settings.lang; Save.settings.lang = 'hu'; const a = [tr('NEAR: WORKBENCH'), tr('MADE ' + WGI.stick.name + ' X20'), tr('MADE ' + WGI.stick.name), tr('3 LEFT'), tr('SORT')]; Save.settings.lang = was; return a; })()`);
ok(!r[0].startsWith('NEAR') && !r[1].startsWith('MADE') && /20$/.test(r[1]) && !r[2].startsWith('MADE') && r[3] !== '3 KILÉPETT' && r[4] === 'RENDEZ', 'Hungarian patterns: ' + JSON.stringify(r));
await g.ev(`Save.settings.lang = 'hu'; WGS.scr = 'pause'; WGS.ui = { help: true }; 0`); await sleep(200);
console.log('help hu', await g.shot('wg_help_hu.png'));
// the tip under the pointer says what a thing does
r = await g.ev(`[wgTipLines({ id: 'stew', n: 1 }), wgTipLines({ id: 'sword_iron', n: 1, d: 10 }), wgTipLines({ id: 'coal', n: 3 }), wgTipLines({ id: 'chest', n: 1 }), wgTipLines({ id: 'helmet_x', n: 1 }), wgTipLines({ id: 'head_iron', n: 1 }),
  tr('+14 FOOD'), tr('70 / 80 USES LEFT'), tr('USED IN 4 RECIPES'), tr('NEAR: ' + tr('NOTHING') + ' + 1 CHEST')]`);
ok(r[0].join() === '+14 FOOD,HEALS OVER TIME' && r[1][0] === 'DAMAGE 6' && /USES LEFT$/.test(r[1][1]) && r[2][0] === 'BURNS AS FUEL' && /^USED IN \d+ RECIPES?$/.test(r[2][1]) && r[3].join() === 'KEEPS YOUR THINGS'
  && !r[4].length && /^DEFENSE \+\d$/.test(r[5][0]) && r[6] === '+14 ÉTEL' && r[7] === 'MÉG 70 / 80 HASZNÁLAT' && r[8] === '4 RECEPTHEZ KELL' && r[9] === 'KÖZELBEN: SEMMI + 1 LÁDA', 'item tips: ' + JSON.stringify(r));
await g.ev(`var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[9] = { id: 'sword_iron', n: 1, d: 10 }; inv[10] = { id: 'stew', n: 2 }; inv[17] = { id: 'coal', n: 5 }; WGS.scr = 'inv'; WGS.ui = {}; WGS.cur = null; Input.lastAim = 'mouse'; Input.mx = 24 + 9; Input.my = 18 + 36 + 9; 0`); await sleep(250);
console.log('tip hu', await g.shot('wg_tip_hu.png'));
await g.ev(`Input.mx = 24 + 8 * 19 + 9; 0`); await sleep(200);
console.log('tip edge', await g.shot('wg_tip_edge.png'));
// pinning a recipe: a right click pins it, a tap on the pin toggles without making it, the HUD box shows it, it is saved, making it unpins it
await g.ev(`Save.settings.lang = 'en'; window.__rclick = (mx, my) => new Promise(res => {
  const r = cv.getBoundingClientRect(), x = r.left + (mx + SCR.ox) / SCR.w * r.width, y = r.top + (my + SCR.oy) / SCR.h * r.height;
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
  setTimeout(() => { cv.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, button: 2, bubbles: true }));
    setTimeout(() => { window.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, button: 2, bubbles: true })); setTimeout(res, 120); }, 80); }, 60);
});
  var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[9] = { id: 'wood', n: 1 }; WGS.p.seen = { wood: 1 }; WGS.p.track = null; WGU.rq.v = ''; WGS.nearC = null;
  WGS.scr = 'inv'; WGS.ui = {}; WGS.cur = null; 0`);
await sleep(200);
await g.ev(`__click(352, 18 + 20 + 17)`);
r = await g.ev(`[WGS.p.track, wgInvCount(WGS.inv, 'wood')]`);
ok(r[0] && r[0].out === 'stick' && r[1] === 1, 'a tap on the pin pins without making: ' + JSON.stringify(r));
await g.ev(`__rclick(260, 18 + 20 + 27 + 8)`);
r = await g.ev(`[WGS.p.track, wgSnapshot().st.p.track]`);
ok(r[0] && r[0].out === 'chest' && r[1] && r[1].out === 'chest', 'a right click pins another, the save keeps it: ' + JSON.stringify(r));
await sleep(150); console.log('pin row', await g.shot('wg_pin_row.png'));
await g.ev(`WGS.scr = 'play'; 0`); await sleep(250);
console.log('tracker', await g.shot('wg_track.png'));
await g.ev(`WGS.inv[10] = { id: 'wood', n: 8 }; WGS.scr = 'inv'; WGS.ui = {}; 0`); await sleep(200);
await g.ev(`__click(260, 18 + 20 + 27 + 4)`);
r = await g.ev(`[WGS.p.track, wgInvCount(WGS.inv, 'chest'), wgInvCount(WGS.inv, 'wood')]`);
ok(!r[0] && r[1] === 1 && r[2] === 1, 'making the pinned recipe unpins it: ' + JSON.stringify(r));
await g.ev(`Save.settings.lang = 'en'; WGS.scr = 'play'; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'INV OK' : 'INV FAIL'); g.close(); process.exit(pass ? 0 : 1);
