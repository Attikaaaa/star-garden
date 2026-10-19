// The Wildgrove map: what was seen fills in, a click sets a pin, the HUD points at it and it is cleared on
// arrival; seen land and the pin survive a reload. A (fake) controller walks, aims, mines and picks hotbar slots.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'MAP' }, seed: { v: '21' }, look: { skin: 1, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
// walk a loop so a few chunks are seen
await g.ev(`WGS.scr = 'play'; WGS.world.meta.hintDone = 1; window.__home = [WGS.p.x, WGS.p.y]; 0`);
for (const [dx, dy] of [[700, 0], [0, 500], [-1200, 0], [0, -900], [500, 400]]) { await g.ev(`WGS.p.x += ${dx}; WGS.p.y += ${dy}; WGS.cam.x = WGS.p.x; WGS.cam.y = WGS.p.y; 0`); await sleep(250); }
const seen = await g.ev(`wgSeenOf(WGS.world).size`);
ok(seen >= 8, 'chunks seen on the walk: ' + seen);
await g.ev(`WGS.remote = [{ pid: 2, x: WGS.p.x + 300, y: WGS.p.y - 120, dim: 'o', name: 'PIP', look: { skin: 0, hair: 1, shirt: 2 } }]; WGS.p.grave = { x: __home[0] + 200, y: __home[1] + 100, dim: 'o' }; 0`);
await g.press('KeyM'); await sleep(400);
ok(await g.ev(`WGS.scr`) === 'map', 'M opens the map');
console.log('map', await g.shot('wg_map1.png'));
await g.ev(`WGM.z = 0.5; 0`); await sleep(300); console.log('map far', await g.shot('wg_map2.png'));
await g.ev(`WGM.z = 2; 0`); await sleep(300);
// a click 40 px right of the centre sets the pin 20 tiles east of it
const want = await g.ev(`(() => { const L = -SCR.ox, T0 = -SCR.oy, mx = Math.round((L + L + SCR.w) / 2), my = Math.round((T0 + T0 + SCR.h - 14) / 2), r = cv.getBoundingClientRect(), x = r.left + (mx + 40 + SCR.ox) / SCR.w * r.width, y = r.top + (my + SCR.oy) / SCR.h * r.height;
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true })); cv.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, button: 0, bubbles: true }));
  setTimeout(() => window.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, button: 0, bubbles: true })), 80); return Math.floor(WGM.cx + 20); })()`);
await sleep(400);
const pin = await g.ev(`WGS.p.pin`);
ok(pin && Math.floor(pin.x) === want, 'a click pins the spot: ' + JSON.stringify(pin) + ' want x ' + want);
console.log('map near', await g.shot('wg_map3.png'));
await g.press('Escape'); await sleep(300);
ok(await g.ev(`WGS.scr`) === 'play', 'Escape closes the map');
console.log('hud arrow', await g.shot('wg_map_hud.png'));
// save, reload: the seen land and the pin come back
const id = await g.ev(`WGS.world.meta.id`);
await g.ev(`wgSaveNow()`);
const back = await g.ev(`(async () => { const rec = await wgStoreGet(${JSON.stringify(id)}); wgLoadRecord(rec); return [wgSeenOf(WGS.world).size, WGS.p.pin && WGS.p.pin.x]; })()`);
ok(back[0] === seen || back[0] >= seen, 'seen land kept: ' + back[0]);
ok(back[1] === pin.x, 'pin kept');
// walking onto the pin clears it
await g.ev(`WGS.scr = 'play'; WGS.p.x = WGS.p.pin.x * 16; WGS.p.y = WGS.p.pin.y * 16 + 4; WGS.cam.x = WGS.p.x; WGS.cam.y = WGS.p.y; 0`); await sleep(400);
ok(!(await g.ev(`WGS.p.pin`)), 'arriving clears the pin');
// a controller: the stick walks, RB moves along the hotbar, A held on a tree chops it
await g.ev(`(() => { const btn = () => ({ pressed: false, value: 0 }); window.__pad = { connected: true, index: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, btn) }; navigator.getGamepads = () => [__pad]; })(); 0`);
const x0 = await g.ev(`WGS.p.x`);
await g.ev(`__pad.axes[0] = 1; 0`); await sleep(500); await g.ev(`__pad.axes[0] = 0; 0`); await sleep(100);
ok((await g.ev(`WGS.p.x`)) > x0 + 10, 'the left stick walks');
await g.ev(`WGS.sel = 0; __pad.buttons[5] = { pressed: true, value: 1 }; 0`); await sleep(120); await g.ev(`__pad.buttons[5] = { pressed: false, value: 0 }; 0`); await sleep(100);
ok(await g.ev(`WGS.sel`) === 1, 'RB picks the next slot');
const chop = await g.ev(`(async () => {
  const tx = Math.floor(WGS.p.x / 16) + 1, ty = Math.floor((WGS.p.y - 4) / 16); wgSetObj(WGS.world, 'o', tx, ty, O_ID.oak); WGS.p.face = 'r';
  __pad.axes[2] = 1; __pad.buttons[0] = { pressed: true, value: 1 };
  for (let i = 0; i < 80 && wgObjAt(WGS.world, 'o', tx, ty); i++) await new Promise(r => setTimeout(r, 100));
  __pad.axes[2] = 0; __pad.buttons[0] = { pressed: false, value: 0 };
  return !wgObjAt(WGS.world, 'o', tx, ty);
})()`);
ok(chop, 'A held on a tree chops it');
await g.ev(`__pad.buttons[8] = { pressed: true, value: 1 }; 0`); await sleep(120); await g.ev(`__pad.buttons[8] = { pressed: false, value: 0 }; 0`); await sleep(100);
ok(await g.ev(`WGS.scr`) === 'map', 'Back opens the map');
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'MAP OK' : 'MAP FAIL'); g.close(); process.exit(pass ? 0 : 1);
