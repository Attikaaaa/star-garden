// Wildgrove's ocarina: an icon and a recipe; the aim picks the note, low below and round through the left, up and right;
// USE plays it (its sound, a note floating up, counted), not twice at once; a chest under the aim still opens; with the
// aim out of reach it plays all the same; the host passes a guest's note on and shows it over their hero, a guest's
// own goes to the host, odd ones are dropped, and a note far away is seen but not heard; MELODY MAKER; tips, Hungarian;
// a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TUNE' }, seed: { v: '88' }, look: { skin: 2, hair: 2, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const d = wgIcon('ocarina').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  const rc = RECIPES.find(x => x.out === 'ocarina'); return [WGI.ocarina && WGI.ocarina.kind, n, rc && rc.at, rc && JSON.stringify(rc.in), [0, 1, 2, 3, 4, 5, 6, 7].map(i => wgOcaNote(i * Math.PI / 4))]; })()`);
ok(r[0] === 'tool' && r[1] >= 50 && r[2] === 'furnace' && r[3] === '{"clay":3,"petal_b":1}', 'an icon and a recipe: ' + JSON.stringify(r.slice(0, 4)));
ok(r[4].join() === '6,7,0,1,2,3,4,5', 'the aim picks the note, low below, round through the left and up: ' + JSON.stringify(r[4]));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = [], snd = [], S = wgSfx;
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { oca: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGOC.list.length = 0; WGOC.t = -1;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'ocarina', n: 1 }; WGS.sel = 0;
  wgSfx = (n) => { snd.push(n); return S(n); };
  try {
    WGS.aim = Math.PI / 2; res.push(wgUse(x, y + 1), WGOC.list.length, WGOC.list[0] && WGOC.list[0].k);
    res.push(wgUse(x, y + 1), WGOC.list.length); WGS.t += 0.13; WGS.aim = -Math.PI / 2; res.push(wgUse(x, y - 1), WGOC.list.length, WGOC.list[1] && WGOC.list[1].k);
    res.push(snd.filter(s => s.startsWith('oca')).join(), w.meta.stats.oca);
    wgSetObj(w, d, x + 1, y, O_ID.chest); WGS.t += 0.13; snd.length = 0; const n0 = WGOC.list.length; wgUse(x + 1, y); res.push(WGS.scr, WGOC.list.length === n0); WGS.scr = 'play'; WGS.ui = {};
  } finally { wgSfx = S; } return res; })()`);
ok(r[0] === true && r[1] === 1 && r[2] === 0 && r[3] === true && r[4] === 1 && r[5] === true && r[6] === 2 && r[7] === 4, 'USE plays the note, a note floats up, not twice at once: ' + JSON.stringify(r.slice(0, 8)));
ok(r[8] === 'oca0,oca4' && r[9] === (1 | 16), 'its sound, counted: ' + JSON.stringify(r.slice(8, 10)));
ok(r[10] !== 'play' && r[11], 'a chest under the aim still opens: ' + JSON.stringify(r.slice(10)));
// the aim out of reach: the mouse far off, USE pressed
r = await g.ev(`(() => { const p = WGS.p, n0 = WGOC.list.length; WGS.scr = 'play'; WGS.t += 0.2; Input.lastAim = 'mouse'; Input.mx = 380; Input.my = 20; WGS.cam.x = p.x; WGS.cam.y = p.y;
  Input.rHit = true; updateWG(1 / 60); Input.rHit = false; const a = [WGS.target, WGOC.list.length - n0, WGOC.list.length && WGOC.list[WGOC.list.length - 1].k]; Input.mx = 4; Input.my = 4; return a; })()`);
ok(r[0] === null && r[1] === 1 && r[2] === 5, 'with the aim out of reach it plays all the same: ' + JSON.stringify(r));
r = await g.ev(`(() => { const role = WGN.role, pid = WGN.pid, A = wgnAll, S = wgnSend, sent = [], snd = [], F = wgSfx, L = { pid: 2 }, p = WGS.p, res = {};
  wgnAll = (m, ex) => sent.push(['all', m.t, m.pid, m.k, ex === L ? 'L' : ex === null ? 'none' : '?']); wgnSend = (to, m) => sent.push(['send', m.t, m.k]); wgSfx = (n) => snd.push(n);
  const fr = (pid, dx) => ({ pid, x: p.x + dx, y: p.y, face: 'd', moving: false, walkT: 0, dim: WGS.dim, hp: 20, name: '', look: { skin: 0, hair: 0, shirt: 0 }, swing: 0, kite: 0, boat: 0, bike: 0, spark: 0, skate: 0, inv: 0 });
  try {
    WGN.role = 'host'; WGS.remote = [fr(2, 40)]; WGOC.list.length = 0;
    wgnHostMsg(L, { t: 'oca', k: 3 }); wgnHostMsg(L, { t: 'oca', k: 4 }); res.host = [WGOC.list.length, WGOC.list[0] && WGOC.list[0].k, snd.join(), JSON.stringify(sent)];
    sent.length = 0; L.ocaT = 0; wgnHostMsg(L, { t: 'oca', k: 8 }); L.ocaT = 0; wgnHostMsg(L, { t: 'oca', k: 'x' }); wgnHostMsg({ pid: 0 }, { t: 'oca', k: 1 }); res.bad = sent.length;
    sent.length = 0; snd.length = 0; WGN.role = 'client'; WGN.pid = 3; WGS.t += 0.2; WGOC.t = -1; WGS.aim = 0; wgOcaPlay(); res.guest = JSON.stringify(sent);
    WGS.remote = [fr(0, -30), fr(5, 2000)]; WGOC.list.length = 0; snd.length = 0;
    wgnClientMsg({}, { t: 'oca', pid: 0, k: 6 }); wgnClientMsg({}, { t: 'oca', pid: 3, k: 1 }); wgnClientMsg({}, { t: 'oca', pid: 5, k: 2 }); wgnClientMsg({}, { t: 'oca', pid: 0, k: 12 });
    res.seen = [WGOC.list.map(n => n.k).join(), snd.join()];
  } finally { WGN.role = role; WGN.pid = pid; wgnAll = A; wgnSend = S; wgSfx = F; WGS.remote = []; WGOC.list.length = 0; } return res; })()`);
ok(r.host[0] === 1 && r.host[1] === 3 && r.host[2] === 'oca3' && r.host[3] === '[["all","oca",2,3,"L"]]' && r.bad === 0, 'the host shows a guest note over them, passes it on, rate-limited; odd ones dropped: ' + JSON.stringify([r.host, r.bad]));
ok(r.guest === '[["send","oca",6]]' && r.seen[0] === '6,2' && r.seen[1] === 'oca6', "a guest's own goes to the host; a far note is seen but not heard: " + JSON.stringify([r.guest, r.seen]));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.oca = 127; wgAchTick(); const a = !!m.ach.oca; m.stats.oca = 255; wgAchTick(); return [a, !!m.ach.oca, wgTipLines({ id: 'ocarina', n: 1 })]; })()`);
ok(!r[0] && r[1] && r[2].includes('USE PLAYS A NOTE') && r[2].includes('WHERE YOU AIM PICKS WHICH'), 'MELODY MAKER for all eight, tips: ' + JSON.stringify(r));
const EN = ['OCARINA', 'MELODY MAKER', 'PLAY ALL EIGHT NOTES ON THE OCARINA', 'USE PLAYS A NOTE', 'WHERE YOU AIM PICKS WHICH'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: playing by a campfire in the evening, notes rising
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); wgSetObj(w, d, x + 1, y, 0); wgSetObj(w, d, x + 2, y + 1, O_ID.campfire);
  for (const [i, j] of [[-5, -3], [5, -3], [-6, 2], [6, 3]]) wgSetObj(w, d, x + i, y + j, O_ID.oak);
  WGS.inv[0] = { id: 'ocarina', n: 1 }; WGS.sel = 0; p.face = 'r'; WGS.clock = 0.8; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; WGOC.list.length = 0;
  for (let k = 0; k < 6; k++) WGOC.list.push({ x: p.x, y: p.y - 26, k: [0, 2, 4, 5, 4, 2][k], t: WGS.t - 1.3 + k * 0.24 }); Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(60); console.log('ocarina', await g.shot('wg_ocarina.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'OCARINA OK' : 'OCARINA FAIL'); g.close(); process.exit(pass ? 0 : 1);
