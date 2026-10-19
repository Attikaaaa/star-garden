// Wildgrove's calendar and the world's birthday: a calendar from a bench, with an icon and a tip; each day's marks agree
// with what the day brings (the frog's visit, meteors, the northern lights, a full moon, the birthday) and asking leaves
// the clock as it was; USE opens a season's page with eight days and its buttons, the pages turn a year either way and
// never before the first day, it closes on Escape or when the calendar is gone; on the world's birthday a toast and a
// gift, once; HAPPY BIRTHDAY; Hungarian; a look at a page.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'CALENDAR' }, seed: { v: '745' }, look: { skin: 1, hair: 1, shirt: 1 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.ui = {}; WGS.calAt = null; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 21; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0; w.meta.bday = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });`;
let r = await g.ev(`(() => { const d = wgIcon('calendar').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  return [n, (RECIPES.find(q => q.out === 'calendar') || {}).at, wgTipLines({ id: 'calendar', n: 1 }).includes('SEE WHAT THE DAYS WILL BRING')]; })()`);
ok(r[0] >= 80 && r[1] === 'bench' && r[2], 'a calendar from a bench, with an icon and a tip: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = { bad: [], n: {} }; WGS.clock = 0.3;
  for (let d = 0; d < 128; d++) { const ev = wgCalEvents(d); for (const k of ev) res.n[k] = (res.n[k] | 0) + 1;
    const sd = WGS.day, sc = WGS.clock; WGS.day = d; WGS.clock = 0.5; const frog = wgFrogDay(); WGS.clock = 0.6; const met = wgMeteorTonight(), aur = wgAuroraTonight(), moon = wgMoonPhase() === 4; WGS.day = sd; WGS.clock = sc;
    if (frog !== ev.includes('frog') || met !== ev.includes('meteor') || aur !== ev.includes('aurora') || moon !== ev.includes('moon') || (d > 0 && d % 32 === 0) !== ev.includes('bday')) res.bad.push(d);
    if (ev.includes('aurora') && Math.floor(d / 8) % 4 !== 3) res.bad.push('a' + d); if (ev.includes('meteor') && Math.floor(d / 8) % 4 % 3 === 0) res.bad.push('m' + d); }
  res.clock = [WGS.day, WGS.clock]; return res; })()`);
ok(!r.bad.length && r.n.frog >= 15 && r.n.moon === 16 && r.n.bday === 3 && r.n.aurora >= 8 && r.n.meteor >= 6, "each day's marks agree with what it brings: " + JSON.stringify(r));
ok(r.clock.join() === '21,0.3', 'asking leaves the clock as it was: ' + JSON.stringify(r.clock));
r = await g.ev(`(() => { ${setup} const res = {}; wgSetObj(w, 'o', x + 1, y, O_ID.calendar); res.use = wgUse(x + 1, y); res.scr = WGS.scr; drawWG(); res.buttons = WGS.ui.cnt; res.first = wgCalFirst();
  const pages = []; for (let i = 0; i < 6; i++) { wgCalTurn(1); pages.push(wgCalFirst()); } res.ahead = pages.join();
  const back = []; for (let i = 0; i < 12; i++) { wgCalTurn(-1); back.push(wgCalFirst()); } res.back = back.join();
  WGS.day = 3; WGCAL.pg = 0; wgCalTurn(-1); res.zero = [WGCAL.pg, wgCalFirst()];
  WGS.t += 1; Input.hits = Input.hits || {}; WGS.calAt.t0 = WGS.t - 1; wgSetObj(w, 'o', x + 1, y, 0); updateWG(1 / 60); res.gone = WGS.scr; return res; })()`);
ok(r.use && r.scr === 'cal' && r.buttons === 11 && r.first === 16, "USE opens the season's page: eight days and three buttons: " + JSON.stringify([r.use, r.scr, r.buttons, r.first]));
ok(r.ahead === '24,32,40,48,48,48' && r.back.startsWith('40,32,24,16,8,0,') && r.zero.join() === '0,0' && r.gone === 'play', 'the pages turn a year either way, never before the first day; it closes when the calendar is gone: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; st.bday = 0; WGS.day = 32; const g0 = WG_GIFTS[hash(32, w.seed | 0, 211) % WG_GIFTS.length]; const c0 = WGS.inv.reduce((a, s) => a + (s && s.id === g0[0] ? s.n : 0), 0);
  updateWG(1 / 60); res.first = [WGS.toast && WGS.toast.text || WGS.toast && WGS.toast.t || !!WGS.toast, w.meta.bday, st.bday, WGS.inv.reduce((a, s) => a + (s && s.id === g0[0] ? s.n : 0), 0) - c0 + WGS.drops.length];
  WGS.toast = null; updateWG(1 / 60); res.again = [!!WGS.toast, st.bday]; WGS.day = 33; updateWG(1 / 60); res.next = st.bday;
  const A = WG_ACH.find(a => a[0] === 'bday')[3]; res.ach = [A({ st: { bday: 1 }, seen: {} }), A({ st: {}, seen: {} })]; return res; })()`);
ok(r.first[0] && r.first[1] === 32 && r.first[2] === 1 && r.first[3] > 0 && r.again.join() === 'false,1' && r.next === 1 && r.ach.join() === 'true,false', "on the world's birthday a toast and a gift, once; HAPPY BIRTHDAY: " + JSON.stringify(r));
const EN = ['CALENDAR', 'HAPPY BIRTHDAY', 'CELEBRATE A YEAR IN WILDGROVE', 'THE FROG VISITS', 'SHOOTING STARS', 'NORTHERN LIGHTS', 'FULL MOON', 'BIRTHDAY OF THE WORLD', 'A QUIET DAY', 'SEE WHAT THE DAYS WILL BRING', 'HAPPY BIRTHDAY, WILDGROVE!', 'YEAR #'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s.replace('#', '2'))); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i].replace('#', '2')), 'Hungarian: ' + JSON.stringify(r));
// a look: a page in late summer, today ringed, a day picked
await g.ev(`(() => { ${setup} WGS.day = 13; wgSetObj(w, 'o', x + 1, y, O_ID.calendar); wgUse(x + 1, y); Input.lastAim = 'mouse'; WGCAL.sel = 6; window._cl = setInterval(() => { WGS.clock = 0.45; }, 50); })(); 0`);
await sleep(300); console.log('page', await g.shot('wg_calendar.png'));
await g.ev(`(() => { WGS.scr = 'play'; WGS.calAt = null; WGS.cam.x = WGS.p.x + 8; })(); 0`); await sleep(200); console.log('stand', await g.shot('wg_calendar_stand.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'CALENDAR OK' : 'CALENDAR FAIL'); g.close(); process.exit(pass ? 0 : 1);
