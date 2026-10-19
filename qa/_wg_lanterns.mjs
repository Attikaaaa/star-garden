// Wildgrove's sky lanterns: a recipe, an icon and four sizes; USE lets one go only at night under the open sky (by day
// or in a cave it stays in the pack); it rises, shrinks, fades and is gone after WG_SKY_T; drawn over the dark with its
// own light; the net: the host checks a guest's lantern, flies it and passes it on (not twice in a breath), a guest
// flies the host's, a bad one is dropped, your own goes out; LANTERN NIGHT; tips, Hungarian; a look at a lantern night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SKY' }, seed: { v: '63' }, look: { skin: 3, hair: 1, shirt: 2 }, peace: true }); 0`); await sleep(800);
await g.ev(`WGS.t = Math.max(WGS.t, 60); 0`); // a lantern's start is a time on this clock, so let it run a while
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const d = wgIcon('sky_lantern').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  const rc = RECIPES.find(x => x.out === 'sky_lantern'); return [n, rc && rc.n, rc && rc.at, ['skylt_0_0', 'skylt_0_1', 'skylt_1', 'skylt_2', 'skylt_3'].every(k => WGA.cache[k])]; })()`);
ok(r[0] >= 60 && r[1] === 2 && r[2] === 'hand' && r[3], 'recipe, icon, four sizes: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), st = () => w.meta.stats, res = {};
  for (let j = -3; j < 4; j++) for (let i = -4; i < 5; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGSL.list.length = 0;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'sky_lantern', n: 3 }; WGS.sel = 0; window._sk = { x, y };
  const use = () => { WGS.toast = null; const u = wgUse(x + 2, y); return [u, WGS.toast && WGS.toast.msg, wgInvCount(WGS.inv, 'sky_lantern'), WGSL.list.length]; };
  WGS.clock = 0.45; res.day = use(); WGS.clock = 0.95; WGS.dim = 'u'; res.cave = use(); WGS.dim = 'o'; res.night = use(); res.st = st().lanterns; return res; })()`);
ok(r.day.join() === 'true,IT SHINES BEST AT NIGHT,3,0' && r.cave.join() === 'true,IT NEEDS THE OPEN SKY,3,0', 'by day or in a cave it stays in the pack: ' + JSON.stringify([r.day, r.cave]));
ok(r.night.join() === 'true,MAKE A WISH...,2,1' && r.st === 1, 'at night under the sky it is let go: ' + JSON.stringify([r.night, r.st]));
r = await g.ev(`(() => { const l = WGSL.list[0], at = [0, 5, 10, 20, 30, 39].map(k => wgSkyAt(l, k)); return [at.map(P => P.size).join(), at.every((P, i) => !i || P.y < at[i - 1].y), Math.round(at[0].y - l.y), Math.round(at[5].y - l.y)]; })()`);
ok(r[0] === '0,0,1,2,3,3' && r[1] && r[2] === -26 && r[3] > -112 && r[3] < -92, 'it rises, slower as it climbs, and grows small: ' + JSON.stringify(r));
r = await g.ev(`(() => { let n = 0; const D = ctx.drawImage.bind(ctx), sk = new Set(['skylt_0_0', 'skylt_0_1', 'skylt_1', 'skylt_2', 'skylt_3'].map(k => WGA.cache[k]));
  ctx.drawImage = function (img) { if (sk.has(img)) n++; return D(...arguments); }; const cx0 = WGS.cam.x - 192, cy0 = WGS.cam.y - 108;
  try { WGR.lights.length = 0; wgDrawLight(cx0, cy0); const a = [n, WGR.lights.some(l => l.r === 22)]; WGS.dim = 'u'; WGR.lights.length = 0; wgDrawLight(cx0, cy0); WGS.dim = 'o'; return a.concat(n, WGR.lights.some(l => l.r === 22)); } finally { ctx.drawImage = D; } })()`);
ok(r.join() === '1,true,1,false', 'drawn over the dark with its own light, only in its own sky: ' + JSON.stringify(r));
r = await g.ev(`(() => { const l = WGSL.list[0]; l.t0 = WGS.t - WG_SKY_T - 0.1; updateWG(1 / 60); return WGSL.list.length; })()`);
ok(r === 0, 'gone after its flight: ' + r);
// the net
r = await g.ev(`(() => { const role = WGN.role, A = wgnAll, S = wgnSend, sent = [], L = { pid: 1 }, res = {};
  wgnAll = (m, ex) => sent.push(['all', m.t, m.x, ex === L ? 'L' : ex === null ? 'none' : '?']); wgnSend = (to, m) => sent.push(['send', m.t, m.x]);
  try {
    WGN.role = 'host'; WGSL.list.length = 0;
    wgnHostMsg(L, { t: 'sky', x: 100, y: 200, d: 'o', s: 7 }); wgnHostMsg(L, { t: 'sky', x: 101, y: 200, d: 'o', s: 8 }); res.host = [WGSL.list.length, JSON.stringify(sent)];
    L.skyT = 0; wgnHostMsg(L, { t: 'sky', x: 'abc', y: 2, d: 'o', s: 1 }); L.skyT = 0; wgnHostMsg(L, { t: 'sky', x: 5, y: 2, d: 'u', s: 1 }); L.skyT = 0; wgnHostMsg(L, { t: 'sky', x: 5e9, y: 2, d: 'o', s: 1 });
    res.bad = [WGSL.list.length, sent.length];
    sent.length = 0; WGS.clock = 0.95; WGS.inv[0] = { id: 'sky_lantern', n: 2 }; WGS.sel = 0; wgUse(_sk.x + 2, _sk.y); res.mine = JSON.stringify(sent);
    sent.length = 0; WGN.role = 'client'; WGSL.list.length = 0; wgnClientMsg({}, { t: 'sky', x: 9, y: 9, d: 'o', s: 3 }); wgUse(_sk.x + 2, _sk.y); res.guest = [WGSL.list.length, JSON.stringify(sent)];
  } finally { WGN.role = role; wgnAll = A; wgnSend = S; } return res; })()`);
ok(r.host[0] === 1 && r.host[1] === '[["all","sky",100,"L"]]', "the host flies a guest's lantern and passes it on, not twice in a breath: " + JSON.stringify(r.host));
ok(r.bad[0] === 1 && r.bad[1] === 1, 'a bad one is dropped: ' + JSON.stringify(r.bad));
ok(/^\[\["all","sky",-?\d+,"none"\]\]$/.test(r.mine) && r.guest[0] === 2 && /\["send","sky",/.test(r.guest[1]), "your own goes out, a guest flies the host's: " + JSON.stringify([r.mine, r.guest]));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.lanterns = 4; wgAchTick(); const a = !!m.ach.lanterns; m.stats.lanterns = 5; wgAchTick(); return [a, !!m.ach.lanterns]; })()`);
ok(!r[0] && r[1], 'LANTERN NIGHT after five: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'sky_lantern', n: 1 })`);
ok(r.includes('USE IT AT NIGHT UNDER THE OPEN SKY') && r.includes('FRIENDS SEE IT RISE'), 'tips: ' + JSON.stringify(r));
const EN = ['SKY LANTERN', 'LANTERN NIGHT', 'LET FIVE SKY LANTERNS GO', 'IT NEEDS THE OPEN SKY', 'IT SHINES BEST AT NIGHT', 'MAKE A WISH...', 'USE IT AT NIGHT UNDER THE OPEN SKY', 'FRIENDS SEE IT RISE'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a lantern night, lanterns of every age over the hero
await g.ev(`(() => { const { x, y } = _sk, p = WGS.p; WGS.scr = 'play'; WGS.clock = 0.97; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4;
  p.x = x * 16 + 8; p.y = y * 16 + 12; p.face = 'u'; WGS.cam.x = p.x; WGS.cam.y = p.y - 30; WGSL.list.length = 0;
  [[0, 1.5, 11], [-40, 6, 23], [36, 12, 41], [-70, 16, 52], [80, 24, 77], [-20, 33, 88], [55, 37, 95]].forEach(([dx, age, s]) => { wgSkyAdd(p.x + dx, p.y + 10, 'o', s); WGSL.list[WGSL.list.length - 1].t0 = WGS.t - age; }); })(); 0`);
await sleep(250); console.log('sky', await g.shot('wg_lanterns.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'LANTERNS OK' : 'LANTERNS FAIL'); g.close(); process.exit(pass ? 0 : 1);
