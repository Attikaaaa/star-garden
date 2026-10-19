// Wildgrove's easel: art and a recipe; USE opens the canvas; the keys walk a cursor, Space paints, the numbers pick the
// colour, Enter keeps it; the mouse dabs and drags, a right click rubs out, DONE keeps it; Escape keeps nothing; a bare
// canvas clears the picture; the picture stands on the easel in the world and goes with a broken easel; the net: the
// host checks a guest's picture, passes it on (not twice in a breath), drops a bad one; a guest takes the host's; the
// welcome carries them, checked; LITTLE ARTIST; tips, Hungarian; a look at the canvas and at the easel.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ART' }, seed: { v: '67' }, look: { skin: 1, hair: 2, shirt: 4 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 60); 0`);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'easel'); return [!!(WGA.obj.easel || [])[0], rc && rc.at, !!OBJ[O_ID.easel].paint]; })()`);
ok(r[0] && r[1] === 'bench' && r[2], 'art, a recipe: ' + JSON.stringify(r));
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { paint: 1 }; w.meta.stats = { kills: 0, far: 0 }; w.meta.paints = {}; wgSetObj(w, d, x + 1, y - 1, O_ID.easel);
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; window._pa = { x, y, k: d + (x + 1) + ',' + (y - 1) }; Input.mx = 4; Input.my = 4; Input.lastAim = 'keys';
  wgUse(x + 1, y - 1); })(); 0`);
r = await g.ev(`WGS.scr`);
await sleep(150); await g.press('ArrowRight'); await sleep(80); await g.press('Space'); await sleep(80); await g.press('Digit3'); await sleep(80); await g.press('ArrowDown'); await sleep(80); await g.press('Space'); await sleep(80); await g.press('Enter'); await sleep(150);
let s = await g.ev(`[WGS.scr, (WGS.world.meta.paints[_pa.k] || '').slice(72, 96), WGS.toast && WGS.toast.msg, !!WGS.world.meta.stats.paint]`);
ok(r === 'paint' && s[0] === 'play' && s[1] === '000000010000000000020000' && s[2] === 'THE PAINTING IS DONE' && s[3], 'the keys paint and Enter keeps it: ' + JSON.stringify([r, s]));
r = await g.ev(`(() => { const { x, y, k } = _pa, A = () => WGS.paintAt, L = wgPaintLayout(), at = (i, j) => { Input.mx = L.gx + i * L.cell + 3; Input.my = L.gy + j * L.cell + 3; }; wgUse(x + 1, y - 1); WGS.paintAt.t0 = WGS.t - 1;
  const res = []; A().col = 4; at(0, 0); Input.mouseDown = true; updateWG(1 / 60); at(1, 0); updateWG(1 / 60); at(2, 0); updateWG(1 / 60); Input.mouseDown = false; res.push(A().c.slice(0, 4).join(''));
  at(1, 0); Input.rDown = true; updateWG(1 / 60); Input.rDown = false; res.push(A().c.slice(0, 4).join(''));
  Input.mx = L.px + 22 * 3 + 4; Input.my = L.py + 4; Input.mouseHit = true; updateWG(1 / 60); Input.mouseHit = false; res.push(A().col);
  Input.mx = L.bx + 10; Input.my = L.by + 18 + 4; Input.mouseHit = true; updateWG(1 / 60); Input.mouseHit = false; res.push(WGS.scr, WGS.world.meta.paints[k].slice(0, 4));
  wgUse(x + 1, y - 1); WGS.paintAt.t0 = WGS.t - 1; WGS.paintAt.c.fill(3); wgPaintClose(false); res.push(WGS.world.meta.paints[k].slice(0, 4));
  wgUse(x + 1, y - 1); WGS.paintAt.t0 = WGS.t - 1; Input.mx = L.bx + 10; Input.my = L.by + 4; Input.mouseHit = true; updateWG(1 / 60); Input.mouseHit = false; wgPaintClose(true); res.push(k in WGS.world.meta.paints, WGS.toast && WGS.toast.msg);
  return res; })()`);
ok(r[0] === '4440' && r[1] === '4040' && r[2] === 3, 'the mouse dabs and drags, a right click rubs out, a paint is picked: ' + JSON.stringify(r.slice(0, 3)));
ok(r[3] === 'play' && r[4] === '4040' && r[5] === '4040', 'DONE keeps it, a cancel keeps nothing: ' + JSON.stringify(r.slice(3, 6)));
ok(r[6] === false && r[7] === 'THE CANVAS IS BARE', 'a bare canvas clears the picture: ' + JSON.stringify(r.slice(6)));
const PIC = ['555555555555', '553355555555', '553355522555', '555555222255', '555552222225', '555557777755', '555557717755', '555557717755', '444447717744', '444444444444', '444464444644', '444444444444'].join('');
r = await g.ev(`(() => { const { x, y, k } = _pa, w = WGS.world, d = WGS.dim, v = '${PIC}'; wgPaintSet(k, v); let n = 0; const C = wgPaintCanvas(v), D = ctx.drawImage.bind(ctx); ctx.drawImage = function (img) { if (img === C) n++; return D(...arguments); };
  try { wgDrawObj(O_ID.easel, x + 1, y - 1, 100, 100); } finally { ctx.drawImage = D; } const px = C.getContext('2d').getImageData(4, 9, 1, 1).data.slice(0, 3).join();
  wgSetObj(w, d, x + 1, y - 1, 0); const gone = !(k in w.meta.paints); wgSetObj(w, d, x + 1, y - 1, O_ID.easel); wgPaintSet(k, v); return [n, px, gone]; })()`);
ok(r[0] === 1 && r[1] === '60,196,90' && r[2], 'the picture stands on the easel, and goes with a broken easel: ' + JSON.stringify(r));
r = await g.ev(`(() => { const role = WGN.role, A = wgnAll, S = wgnSend, sent = [], { x, y, k } = _pa, L = { pid: 2, dim: WGS.dim, x: x * 16, y: y * 16 }, res = {}, v = '1'.repeat(144);
  wgnAll = (m, ex) => sent.push(['all', m.t, m.k, ex === L ? 'L' : ex === null ? 'none' : '?']); wgnSend = (to, m) => sent.push(['send', m.t, m.k]);
  try {
    WGN.role = 'host'; wgnHostMsg(L, { t: 'paint', k, v }); wgnHostMsg(L, { t: 'paint', k, v: '2'.repeat(144) }); res.host = [WGS.world.meta.paints[k][0], JSON.stringify(sent)];
    sent.length = 0; L.paintT = 0; wgnHostMsg(L, { t: 'paint', k, v: '9'.repeat(144) }); L.paintT = 0; wgnHostMsg(L, { t: 'paint', k, v: '1'.repeat(10) }); L.paintT = 0; wgnHostMsg(L, { t: 'paint', k: 'o0,0', v });
    const n0 = WGS.world.chunks.size; L.paintT = 0; wgnHostMsg(L, { t: 'paint', k: WGS.dim + '90000,90000', v }); L.paintT = 0; wgnHostMsg(L, { t: 'paint', k: 'q' + x + ',' + y, v });
    L.x += 16 * 20; L.paintT = 0; wgnHostMsg(L, { t: 'paint', k, v: '4'.repeat(144) }); L.x -= 16 * 20;
    res.bad = [sent.length, 'o0,0' in WGS.world.meta.paints, WGS.world.chunks.size - n0, WGS.world.meta.paints[k][0]];
    const wl = wgnWelcome({ pid: 3, guest: null }); res.welcome = !!(wl.paints && wl.paints[k]);
    WGN.role = 'client'; wgnClientMsg({}, { t: 'paint', k, v: '3'.repeat(144) }); res.guest = WGS.world.meta.paints[k][0];
  } finally { WGN.role = role; wgnAll = A; wgnSend = S; } return res; })()`);
ok(r.host[0] === '1' && r.host[1] === JSON.stringify([['all', 'paint', await g.ev('_pa.k'), 'L']]), "the host checks a guest's picture and passes it on, not twice in a breath: " + JSON.stringify(r.host));
ok(r.bad[0] === 0 && !r.bad[1] && r.bad[2] === 0 && r.bad[3] === '1' && r.welcome && r.guest === '3', "a bad one, a far one or one from far from the guest is dropped, no ground woken; the welcome carries them; a guest takes the host's: " + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.paint = 1; wgAchTick(); return !!m.ach.paint; })()`);
ok(r, 'LITTLE ARTIST');
r = await g.ev(`wgTipLines({ id: 'easel', n: 1 })`);
ok(r.includes('USE IT TO PAINT A PICTURE'), 'tips: ' + JSON.stringify(r));
const EN = ['EASEL', 'LITTLE ARTIST', 'PAINT A PICTURE ON AN EASEL', 'PAINT A PICTURE', 'THE PAINTING IS DONE', 'THE CANVAS IS BARE', 'USE IT TO PAINT A PICTURE', 'CLEAR', 'DONE', 'CANCEL', 'TAP OR DRAG TO PAINT', 'CLICK OR DRAG  RIGHT CLICK: RUB OUT  1-8: COLOUR', 'A: PAINT  X: RUB OUT  LB RB: COLOUR  START: DONE'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the canvas with a little house, then the easel in the garden
await g.ev(`(() => { const { x, y, k } = _pa; wgPaintSet(k, '${PIC}'); WGS.toast = null; WGS.clock = 0.35; WGS.weather = null; WGS.wxT = 9999; wgUse(x + 1, y - 1); WGS.paintAt.col = 2; WGS.paintAt.t0 = WGS.t + 999; Input.lastAim = 'mouse'; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(200); console.log('canvas', await g.shot('wg_paint.png'));
await g.ev(`(() => { const { x, y } = _pa, p = WGS.p; WGS.paintAt = null; WGS.scr = 'play'; p.x = x * 16 + 2; p.y = y * 16 + 12; p.face = 'r'; WGS.cam.x = x * 16 + 16; WGS.cam.y = y * 16 - 8; })(); 0`);
await sleep(200); console.log('easel', await g.shot('wg_paint_easel.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'PAINT OK' : 'PAINT FAIL'); g.close(); process.exit(pass ? 0 : 1);
