// Wildgrove's post and pots pack: the mailbox and the pots have art and recipes, a letter waits each day (the flag is
// up), USE opens it with its gift dropped by the box, a second USE that day finds none, the next day brings another,
// five letters light PEN PAL; every letter line and gift fits the paper in English and Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'POST' }, seed: { v: '41' }, look: { skin: 1, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const ITEMS = ['mailbox', 'pot_r', 'pot_y', 'pot_b', 'pot_w', 'pot_p', 'pot_fern'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(ITEMS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); if (!WGA.obj[id]) bad.push('no sprite ' + id); }
  for (const [id] of WG_GIFTS) if (!WGI[id]) bad.push('no gift ' + id);
  return bad; })()`);
ok(!r.length, 'art, recipes, gifts: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = {};
  for (let j = -1; j < 2; j++) for (let i = -1; i < 2; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; delete w.meta.mail; WGS.drops = []; WGS.day = 3;
  wgSetObj(w, d, x, y, O_ID.mailbox); res.waits = wgMailWaits(); wgUse(x, y);
  res.open = [WGS.scr, !!WGS.mail, w.meta.mail, WGS.drops.length === 1 && WGS.drops[0].id === WGS.mail.gift[0], (w.meta.stats || {}).letters];
  updateWG(1 / 60); res.stays = WGS.scr; // the press that opened it does not close it
  return res; })()`);
ok(r.waits && r.open[0] === 'mail' && r.open[1] && r.open[2] === 3 && r.open[3] && r.open[4] === 1 && r.stays === 'mail', 'a letter waits and opens: ' + JSON.stringify(r));
await sleep(200); console.log('letter', await g.shot('wg_post_letter.png'));
await g.press('Escape'); await sleep(150);
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = {};
  res.closed = WGS.scr; WGS.toast = null; wgUse(x, y); res.again = [WGS.scr, WGS.toast && WGS.toast.msg, wgMailWaits()];
  const n0 = wgLetterToday(); WGS.day++; res.next = [wgMailWaits(), wgLetterToday() !== n0];
  for (let k = 0; k < 4; k++) { wgUse(x, y); WGS.scr = 'play'; WGS.mail = null; WGS.day++; } wgAchTick(); res.star = !!w.meta.ach.letters;
  return res; })()`);
ok(r.closed === 'play' && r.again[0] === 'play' && r.again[1] === 'NO NEW LETTER TODAY' && !r.again[2], 'once a day: ' + JSON.stringify([r.closed, r.again]));
ok(r.next[0] && r.next[1] && r.star, 'the next day, PEN PAL: ' + JSON.stringify([r.next, r.star]));
r = await g.ev(`(() => { const bad = []; for (const lang of ['en', 'hu']) { Save.settings.lang = lang;
  for (const L of WG_LETTERS) for (const s of L) if (textW(s, 0) > 206) bad.push(lang + ' ' + tr(s) + ' ' + textW(s, 0));
  for (const s of ['DEAR FRIEND,', 'TUCKED INSIDE:']) if (textW(s, 0) > 180) bad.push(lang + ' ' + s);
  for (const [id, n] of WG_GIFTS) if (textW(WGI[id].name, 0) + 14 > 176) bad.push(lang + ' gift ' + id); }
  Save.settings.lang = 'en'; return bad; })()`);
ok(!r.length, 'every line fits the paper: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(OBJ[O_ID.mailbox].name), tr('NO NEW LETTER TODAY'), tr(WG_LETTERS[4][0]), tr('PEN PAL'), tr(OBJ[O_ID.pot_p].name)]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['MAILBOX', 'NO NEW LETTER TODAY', 'A LITTLE BIRD SANG AT MY WINDOW.', 'PEN PAL', 'PURPLE FLOWER POT'][i]), 'Hungarian: ' + JSON.stringify(r));
await g.ev(`Save.settings.lang = 'hu'; WGS.mail = { n: 7, gift: ['cookies', 2], t0: WGS.t }; WGS.scr = 'mail'; WGS.ui = {}; 0`); await sleep(250);
console.log('hu', await g.shot('wg_post_hu.png'));
await g.ev(`Save.settings.lang = 'en'; WGS.scr = 'play'; WGS.mail = null; 0`);
// a look: a mailbox with a letter, one read (the world's day as read is drawn for both), the pots
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 5, y0 = Math.floor(p.y / 16) - 2;
  for (let j = -2; j < 5; j++) for (let i = -1; i < 12; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  wgSetObj(w, d, x0 + 1, y0, O_ID.mailbox); ['pot_r', 'pot_y', 'pot_b', 'pot_w', 'pot_p', 'pot_fern'].forEach((id, i) => wgSetObj(w, d, x0 + 3 + i, y0 + 1, O_ID[id]));
  delete w.meta.mail; p.x = (x0 + 1) * 16 + 8; p.y = (y0 + 2) * 16 + 8; WGS.cam.x = (x0 + 5) * 16; WGS.cam.y = y0 * 16 + 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.3; })(); 0`);
await sleep(400); console.log('yard', await g.shot('wg_post_yard.png'));
await g.ev(`WGS.world.meta.mail = WGS.day; 0`); await sleep(200); console.log('read', await g.shot('wg_post_read.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'POST OK' : 'POST FAIL'); g.close(); process.exit(pass ? 0 : 1);
