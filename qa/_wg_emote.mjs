// Wildgrove's emotes: the bubble and six signs; G opens the row, the arrows walk it and Enter picks, a number picks at
// once, Escape closes with none; the bubble floats over the head for three seconds, a friend's over theirs; the net:
// the host takes a guest's, rate-limits it and passes it on with their pid, drops a bad one, sends its own with pid 0,
// a guest sends its own and shows the host's but not its own echo; the touch button only with friends; SAY IT WITH A
// SMILE; Hungarian; a look at the row and at two heroes talking.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'EMO' }, seed: { v: '37' }, look: { skin: 1, hair: 0, shirt: 3 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 60); 0`);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`[!!WGA.cache.emo_bub, [0, 1, 2, 3, 4, 5].every(k => WGA.cache['emo_' + k])]`);
ok(r[0] && r[1], 'the bubble and six signs');
await g.ev(`(() => { const w = WGS.world; WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGEM.me = null; Input.mx = 4; Input.my = 4; Input.lastAim = 'keys'; })(); 0`);
await sleep(100); await g.press('KeyG'); await sleep(150);
r = await g.ev(`WGS.scr`); const opened = r;
await g.press('ArrowRight'); await sleep(100); await g.press('ArrowRight'); await sleep(100); await g.press('ArrowLeft'); await sleep(100); await g.press('Enter'); await sleep(150);
r = await g.ev(`[WGS.scr, WGEM.me && WGEM.me.k, WGS.world.meta.stats.emo]`);
ok(opened === 'emote' && r[0] === 'play' && r[1] === 1 && r[2] === 2, 'G opens the row, the arrows walk it, Enter picks: ' + JSON.stringify([opened, r]));
await g.press('KeyG'); await sleep(150); await g.press('Digit4'); await sleep(150);
r = await g.ev(`[WGS.scr, WGEM.me && WGEM.me.k, WGS.world.meta.stats.emo]`);
ok(r[0] === 'play' && r[1] === 3 && r[2] === 10, 'a number picks at once: ' + JSON.stringify(r));
await g.ev(`WGEM.me = null; 0`); await g.press('KeyG'); await sleep(150); await g.press('Escape'); await sleep(150);
r = await g.ev(`[WGS.scr, WGEM.me]`);
ok(r[0] === 'play' && r[1] === null, 'Escape closes with none: ' + JSON.stringify(r));
r = await g.ev(`(() => { let n = 0; const D = ctx.drawImage.bind(ctx); ctx.drawImage = function (img) { if (img === WGA.cache.emo_bub) n++; return D(...arguments); }; const cx0 = WGS.cam.x - 192, cy0 = WGS.cam.y - 108, p = WGS.p, res = [];
  try { WGEM.me = { k: 1, t: WGS.t - 1 }; wgDrawAmbient(cx0, cy0); res.push(n); WGEM.me.t = WGS.t - 3.2; wgDrawAmbient(cx0, cy0); res.push(n);
    WGS.remote = [{ pid: 4, x: p.x + 30, y: p.y, dim: WGS.dim, face: 'd', look: { skin: 0, hair: 1, shirt: 2 } }]; WGEM.f.set(4, { k: 0, t: WGS.t }); wgDrawAmbient(cx0, cy0); res.push(n); WGS.remote = []; WGEM.f.clear(); return res; } finally { ctx.drawImage = D; } })()`);
ok(r.join() === '1,1,2', "the bubble shows for three seconds, a friend's over theirs: " + JSON.stringify(r));
r = await g.ev(`(() => { const role = WGN.role, pid = WGN.pid, A = wgnAll, S = wgnSend, sent = [], L = { pid: 2 }, res = {};
  wgnAll = (m, ex) => sent.push(['all', m.t, m.pid, m.k, ex === L ? 'L' : ex === null ? 'none' : '?']); wgnSend = (to, m) => sent.push(['send', m.t, m.k]);
  try {
    WGN.role = 'host'; WGEM.f.clear();
    wgnHostMsg(L, { t: 'emo', k: 1 }); wgnHostMsg(L, { t: 'emo', k: 2 }); res.host = [WGEM.f.get(2) && WGEM.f.get(2).k, JSON.stringify(sent)];
    sent.length = 0; L.emoT = 0; wgnHostMsg(L, { t: 'emo', k: 9 }); L.emoT = 0; wgnHostMsg(L, { t: 'emo', k: 'x' }); wgnHostMsg({ pid: 0 }, { t: 'emo', k: 1 }); res.bad = sent.length;
    wgEmote(5); res.mine = JSON.stringify(sent);
    sent.length = 0; WGN.role = 'client'; WGN.pid = 3; WGEM.f.clear(); wgEmote(2); res.guest = JSON.stringify(sent);
    wgnClientMsg({}, { t: 'emo', pid: 0, k: 4 }); wgnClientMsg({}, { t: 'emo', pid: 3, k: 1 }); wgnClientMsg({}, { t: 'emo', pid: 1, k: 99 }); res.seen = [WGEM.f.get(0) && WGEM.f.get(0).k, WGEM.f.has(3), WGEM.f.has(1)];
  } finally { WGN.role = role; WGN.pid = pid; wgnAll = A; wgnSend = S; WGEM.f.clear(); } return res; })()`);
ok(r.host[0] === 1 && r.host[1] === '[["all","emo",2,1,"L"]]', "the host takes a guest's and passes it on, not twice in a breath: " + JSON.stringify(r.host));
ok(r.bad === 0 && r.mine === '[["all","emo",0,5,"none"]]', 'a bad one is dropped, the host sends its own with pid 0: ' + JSON.stringify([r.bad, r.mine]));
ok(r.guest === '[["send","emo",2]]' && r.seen.join() === '4,false,false', "a guest sends its own and shows the host's, not its own echo: " + JSON.stringify([r.guest, r.seen]));
r = await g.ev(`(() => { const role = WGN.role, a = !!wgTouchBtns().emo; WGN.role = 'host'; const B = wgTouchBtns(); let opened;
  try { WGS.scr = 'play'; wgTouchDown(B.emo[0], B.emo[1], { pointerId: 1 }); opened = WGS.scr; } finally { WGN.role = role; WGS.scr = 'play'; } return [a, !!B.emo, opened]; })()`);
ok(!r[0] && r[1] && r[2] === 'emote', 'the touch button only with friends: ' + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.emo = 31; wgAchTick(); const a = !!m.ach.emo; m.stats.emo = 63; wgAchTick(); return [a, !!m.ach.emo]; })()`);
ok(!r[0] && r[1], 'SAY IT WITH A SMILE for all six: ' + JSON.stringify(r));
const EN = ['SAY IT WITH A SMILE', 'SHOW ALL SIX EMOTES'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the row open, then two heroes talking
await g.ev(`(() => { WGS.toast = null; WGS.clock = 0.35; WGS.weather = null; WGS.wxT = 9999; wgEmoOpen(); WGS.ui.sel = 1; Input.lastAim = 'keys'; })(); 0`);
await sleep(200); console.log('row', await g.shot('wg_emote_row.png'));
await g.ev(`(() => { WGS.scr = 'play'; const p = WGS.p; p.face = 'r'; WGEM.me = { k: 1, t: WGS.t };
  WGS.remote = [{ pid: 4, x: p.x + 30, y: p.y, face: 'l', moving: 0, walkT: 0, dim: WGS.dim, hp: 10, name: 'MIRA', look: { skin: 3, hair: 2, shirt: 4, hat: 0 }, swing: 0, kite: 0, boat: 0, bike: 0, inv: 0 }]; WGEM.f.set(4, { k: 0, t: WGS.t }); })(); 0`);
await sleep(200); console.log('talk', await g.shot('wg_emote.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'EMOTE OK' : 'EMOTE FAIL'); g.close(); process.exit(pass ? 0 : 1);
