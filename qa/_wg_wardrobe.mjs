// Wildgrove's wardrobe: art, an icon and a recipe; USE opens it, the keys walk its buttons and change the skin, the hair
// and the tunic (a hat stays on); DONE or Escape closes it, NEW LOOK only for a real change; the net checks every look
// (a bad one from a friend is made safe, a guest's 'lk' is read and range-checked); tips, Hungarian; a look at it.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ROBE' }, seed: { v: '29' }, look: { skin: 0, hair: 0, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const d = wgIcon('wardrobe').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  const rc = RECIPES.find(x => x.out === 'wardrobe'); return [!!(WGA.obj.wardrobe || [])[0], n, rc && rc.at]; })()`);
ok(r[0] && r[1] >= 60 && r[2] === 'bench', 'art, icon, recipe: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; p.look = { skin: 0, hair: 0, shirt: 0, hat: 2 };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; wgSetObj(w, d, x + 1, y - 1, O_ID.wardrobe); window._rb = { x, y };
  Input.mx = 4; Input.my = 4; const used = wgUse(x + 1, y - 1); Input.lastAim = 'keys'; return [used, WGS.scr]; })()`); // the pointer off the buttons
ok(r[0] && r[1] === 'robe', 'USE opens the wardrobe: ' + JSON.stringify(r));
await sleep(150); await g.press('Enter'); await sleep(120); await g.press('ArrowDown'); await sleep(120); await g.press('Enter'); await sleep(120); await g.press('Enter'); await sleep(120);
await g.press('ArrowDown'); await sleep(120); await g.press('Enter'); await sleep(150);
r = await g.ev(`[WGS.p.look.skin, WGS.p.look.hair, WGS.p.look.shirt, WGS.p.look.hat, WGS.scr]`);
ok(r.join() === '1,2,1,2,robe', 'the keys change skin, hair and tunic, the hat stays: ' + JSON.stringify(r));
console.log('robe', await g.shot('wg_wardrobe.png'));
await g.press('Escape'); await sleep(150);
r = await g.ev(`[WGS.scr, !!WGS.world.meta.stats.look, WGS.toast && WGS.toast.msg]`);
ok(r[0] === 'play' && r[1] && (r[2] === 'LOOKING GOOD!' || r[2] === 'STAR: NEW LOOK'), 'Escape closes it, NEW LOOK for a change: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _rb, st = WGS.world.meta.stats; st.look = 0; wgUse(x + 1, y - 1); wgRobeDone(); const a = st.look; WGS.world.meta.ach = {}; st.look = 1; wgAchTick(); return [a, !!WGS.world.meta.ach.look]; })()`);
ok(!r[0] && r[1], 'no star for no change; NEW LOOK lights: ' + JSON.stringify(r));
// the net: a bad look is made safe, a guest's lk is read and checked
r = await g.ev(`[wgnLook({ skin: 'x', hair: 9, shirt: 2, hat: 3 }), wgnLook(null), wgnLook({ skin: 2, hair: 4, shirt: 4 }), wgnLookNum(124), wgnLookNum(999), wgnLookNum('12'), wgnLookNum(-1)].map(v => JSON.stringify(v)).join(' ')`);
ok(r === '{"skin":0,"hair":0,"shirt":2,"hat":3} {"skin":0,"hair":0,"shirt":0,"hat":0} {"skin":2,"hair":4,"shirt":4,"hat":0} {"skin":1,"hair":2,"shirt":4} null null null', 'looks from the net are checked: ' + r);
const net = await (await import('fs')).promises.readFile(new URL('../src/wg_net.js', import.meta.url), 'utf8');
ok(/L\.look = wgnLook\(m\.look\)/.test(net) && /look: wgnLook\(a\[9\]\)/.test(net) && /lk: /.test(net) && /wgnLookNum\(m\.lk\)/.test(net), 'the net reads and checks every look');
r = await g.ev(`wgTipLines({ id: 'wardrobe', n: 1 })`);
ok(r.includes('USE IT TO CHANGE YOUR LOOK') && r.includes('FRIENDS SEE IT TOO'), 'tips: ' + JSON.stringify(r));
const EN = ['WARDROBE', 'NEW LOOK', 'CHANGE YOUR LOOK AT A WARDROBE', 'LOOKING GOOD!', 'USE IT TO CHANGE YOUR LOOK'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`(() => { const { x, y } = _rb, p = WGS.p; WGS.scr = 'play'; p.x = (x + 2) * 16 + 8; p.y = y * 16 + 12; p.face = 'l'; WGS.cam.x = (x + 1) * 16 + 8; WGS.cam.y = y * 16; WGS.toast = null; WGS.clock = 0.35; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('room', await g.shot('wg_wardrobe_room.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'WARDROBE OK' : 'WARDROBE FAIL'); g.close(); process.exit(pass ? 0 : 1);
