// Wildgrove signs: placing one opens the board, typed words are kept (Enter) or dropped (Esc), the letter grid
// answers a tap and the pad, the words show over the sign up close, break with it, ride in the save and the co-op
// welcome, and are never translated.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SIGNS' }, seed: { v: '31' }, look: { skin: 1, hair: 2, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const typ = async (s) => { for (const ch of s) { await g.press(ch === ' ' ? 'Space' : /\d/.test(ch) ? 'Digit' + ch : 'Key' + ch); await sleep(40); } };
// a free tile beside the hero with a sign in hand
let r = await g.ev(`(() => {
  const w = WGS.world, d = WGS.dim, x = Math.floor(WGS.p.x / 16) + 1, y = Math.floor((WGS.p.y - 4) / 16) - 1;
  for (let j = -2; j < 3; j++) for (let i = -3; i < 4; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  var inv = WGS.inv; for (let i = 0; i < 36; i++) inv[i] = null; inv[0] = { id: 'sign', n: 3 }; WGS.sel = 0; WGS.world.meta.hintDone = 1; Input.lastAim = 'keys';
  const placed = wgUse(x, y); window.__s = [x, y]; return [placed, WGS.scr, OBJ[wgObjAt(w, d, x, y)].id];
})()`);
ok(r[0] && r[1] === 'sign' && r[2] === 'sign', 'placing a sign opens the board: ' + JSON.stringify(r));
await sleep(150); await typ('HOME 12'); await g.press('Enter'); await sleep(200);
r = await g.ev(`[WGS.scr, wgSignText(__s[0], __s[1]), WGU.edit]`);
ok(r[0] === 'play' && r[1] === 'HOME 12' && r[2] === null, 'typed words are kept with Enter: ' + JSON.stringify(r));
// Esc leaves the words as they were; keys typed after the board closed reach the game again
await g.ev(`wgUse(__s[0], __s[1]); 0`); await sleep(150); await typ('XYZ'); await g.press('Escape'); await sleep(200);
r = await g.ev(`[WGS.scr, wgSignText(__s[0], __s[1])]`);
ok(r[0] === 'play' && r[1] === 'HOME 12', 'Esc keeps the old words: ' + JSON.stringify(r));
await g.press('KeyE'); await sleep(200); r = await g.ev(`WGS.scr`); ok(r === 'inv', 'the keyboard drives the game after the board: ' + r);
await g.ev(`WGS.scr = 'play'; 0`); await sleep(100);
// the grid by tap: clear with DEL, tap HI!, SAVE
await g.ev(`wgUse(__s[0], __s[1]); Input.lastAim = 'touch'; 0`); await sleep(150);
const tap = async (k) => { await g.ev(`(() => { for (const r of wgSignKeys()) for (const c of r) if (c.k === ${JSON.stringify(k)}) { Input.mx = c.x + 3; Input.my = c.y + 4; Input.mouseHit = true; } })(); 0`); await sleep(90); };
for (let i = 0; i < 7; i++) await tap('DEL');
for (const k of ['H', 'I', '!', 'SPACE', 'Ő']) await tap(k);
r = await g.ev(`WGU.signF.v`); ok(r === 'HI! Ő', 'tapping the letters: ' + JSON.stringify(r));
await tap('SAVE'); r = await g.ev(`[WGS.scr, wgSignText(__s[0], __s[1])]`);
ok(r[0] === 'play' && r[1] === 'HI! Ő', 'SAVE on the grid: ' + JSON.stringify(r));
// the pad: the cursor starts on A, right twice is C, down is P, A types, X deletes, Start saves
await g.ev(`(() => { const btn = () => ({ pressed: false, value: 0 }); window.__pad = { connected: true, index: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, btn) }; navigator.getGamepads = () => [__pad]; })(); wgUse(__s[0], __s[1]); Input.lastAim = 'pad'; 0`);
await sleep(150);
const btn = async (b) => { await g.ev(`__pad.buttons[${b}] = { pressed: true, value: 1 }; 0`); await sleep(90); await g.ev(`__pad.buttons[${b}] = { pressed: false, value: 0 }; 0`); await sleep(90); };
for (let i = 0; i < 6; i++) await btn(2); // X: delete
await btn(15); await btn(15); await btn(0); await btn(13); await btn(0); await btn(0); await btn(2);
r = await g.ev(`WGU.signF.v`); ok(r === 'CP', 'the pad walks the grid: ' + JSON.stringify(r));
await btn(9); r = await g.ev(`[WGS.scr, wgSignText(__s[0], __s[1])]`); ok(r[0] === 'play' && r[1] === 'CP', 'Start saves: ' + JSON.stringify(r));
await g.ev(`navigator.getGamepads = () => []; Input.lastAim = 'keys'; 0`);
// the bubble shows near, not far; the save keeps the words; the welcome carries them; a client takes them in
r = await g.ev(`(() => { WGS.signs[WGS.dim + __s[0] + ',' + __s[1]] = 'WELCOME HOME, FRIENDS OF THE GROVE'; WGU.signV++;
  const l = wgSignList(); const q = l.find(q => q.x === __s[0]); const snap = wgSnapshot();
  return [q && q.lines, snap.st.signs[WGS.dim + __s[0] + ',' + __s[1]], wgnWelcome({ guest: null, pid: 1 }).signs === WGS.signs]; })()`);
ok(r[0] && r[0].join('|') === 'WELCOME HOME,|FRIENDS OF THE|GROVE' && r[1] && r[2], 'wrapped, saved and shared: ' + JSON.stringify(r));
await g.ev(`WGS.p.x = __s[0] * 16 + 8; WGS.p.y = __s[1] * 16 + 30; WGS.cam.x = WGS.p.x; WGS.cam.y = WGS.p.y; WGS.scr = 'play'; 0`); await sleep(300);
console.log('near', await g.shot('wg_sign_near.png'));
// the host checks the tile; a bad key or a sign that is not there is refused
r = await g.ev(`[wgSignSet('o9999,9999', 'X'), wgSignSet('nonsense', 'X'), wgSignSet(WGS.dim + __s[0] + ',' + __s[1], 'OK? *#~')]`);
ok(!r[0] && !r[1] && r[2] && (await g.ev(`wgSignText(__s[0], __s[1])`)) === 'OK?', 'the host checks keys, cleans words: ' + JSON.stringify(r));
// words are never translated
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = tr('BACK'); TR_RAW = true; const b = tr('BACK'); TR_RAW = false; return [a, b]; })()`);
ok(r[0] === 'VISSZA' && r[1] === 'BACK', 'player words skip the language table: ' + JSON.stringify(r));
await g.ev(`wgSignSet(WGS.dim + __s[0] + ',' + __s[1], 'BACK SOON'); WGS.p.y = __s[1] * 16 + 34; 0`); await sleep(300);
console.log('hu bubble', await g.shot('wg_sign_hu.png'));
await g.ev(`wgUse(__s[0], __s[1]); Input.lastAim = 'touch'; 0`); await sleep(300);
console.log('board hu', await g.shot('wg_sign_board.png'));
await g.ev(`wgSignClose(false); Save.settings.lang = 'en'; 0`);
// breaking it takes the words
r = await g.ev(`(() => { wgSetObj(WGS.world, WGS.dim, __s[0], __s[1], 0); return [wgSignText(__s[0], __s[1]), wgSignList().length]; })()`);
ok(r[0] === '' && r[1] === 0, 'a broken sign loses its words: ' + JSON.stringify(r));
// a client: the welcome's signs come in, a host message sets one
r = await g.ev(`(() => { const old = WGN.role; WGN.role = 'client'; WGS.signs = {}; wgSignSet('o1,2', 'HELLO'); const a = WGS.signs['o1,2']; WGN.role = old; return a; })()`);
ok(r === 'HELLO', 'a client takes the words of the host: ' + JSON.stringify(r));
// the host takes a guest's words for a sign beside the guest's hero only, and never wakes far ground for one
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, [x, y] = __s, role = WGN.role, A = wgnAll, sent = [], L = { pid: 2, dim: d, x: x * 16, y: y * 16 + 20 }, k = d + x + ',' + y;
  wgSetObj(w, d, x, y, O_ID.sign); WGS.signs = {}; wgnAll = (m) => sent.push(m.v); const n0 = w.chunks.size;
  try { WGN.role = 'host'; wgnHostMsg(L, { t: 'sign', k, v: 'NEAR' }); wgnHostMsg(L, { t: 'sign', k: d + '90000,90000', v: 'FAR' }); L.x += 16 * 20; wgnHostMsg(L, { t: 'sign', k, v: 'AWAY' }); }
  finally { WGN.role = role; wgnAll = A; } return [WGS.signs[k], sent.join(), w.chunks.size - n0]; })()`);
ok(r[0] === 'NEAR' && r[1] === 'NEAR' && r[2] === 0, "the host takes a guest's words beside the guest only: " + JSON.stringify(r));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'SIGN OK' : 'SIGN FAIL'); g.close(); process.exit(pass ? 0 : 1);
