// Wildgrove's garden gnomes: three hats, made at the potter's wheel, set out; a gnome turns to the nearest hero (you or
// a friend) and with nobody about looks the way its tile says; it blinks now and then; a gnome in every hat set out
// lights GNOME FRIENDS; Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'GNOMES' }, seed: { v: '45' }, look: { skin: 1, hair: 1, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -6; j < 7; j++) for (let i = -10; i < 11; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { gnomes: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = []; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false;
  const fr = (pid, dx, dy) => ({ pid, x: p.x + dx, y: p.y + dy, face: 'd', moving: false, walkT: 0, dim: d, hp: 20, name: 'PIP', look: { skin: 1, hair: 2, shirt: 0 }, swing: 0, inv: 0 });`;
let r = await g.ev(`(() => WG_GNOMES.map(([id, , , , petal]) => { const R = RECIPES.find(q => q.out === id); return [R && R.at, R && R.in.clay, R && R.in[petal], WGI[id].kind, WGA.obj[id] && WGA.obj[id].length, !!wgIcon(id)]; }))()`);
ok(r.length === 3 && r.every(a => a[0] === 'potwheel' && a[1] === 3 && a[2] === 1 && a[3] === 'place' && a[4] === 2 && a[5]), 'three gnomes, made at the wheel, to set out: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 3, y, O_ID.gnome_r); const A = WGA.obj.gnome_r, D = ctx.drawImage.bind(ctx), res = {}; let which = -1;
  ctx.drawImage = function (img) { if (img === A[0].c) which = 0; if (img === A[1].c) which = 1; return D(...arguments); };
  const look = () => { which = -1; wgDrawObj(O_ID.gnome_r, x + 3, y, 100, 100); return which; };
  try {
    p.x = (x + 3) * 16 + 8 - 40; res.left = look(); p.x = (x + 3) * 16 + 8 + 40; res.right = look();
    p.x = (x + 3) * 16 + 8 - 400; res.far = look(); res.own = hash(x + 3, y, 9) & 1;
    WGS.remote = [fr(2, 0, 0)]; WGS.remote[0].x = (x + 3) * 16 + 8 + 30; WGS.remote[0].y = y * 16 + 12; res.friend = look();
    p.x = (x + 3) * 16 + 8 - 20; res.youNearer = look(); WGS.remote = [];
  } finally { ctx.drawImage = D; } return res; })()`);
ok(r.left === 1 && r.right === 0 && r.friend === 0 && r.youNearer === 1, 'a gnome turns to the nearest hero, you or a friend: ' + JSON.stringify(r));
ok(r.far === r.own, 'with nobody about it looks the way its tile says: ' + JSON.stringify([r.far, r.own]));
r = await g.ev(`(() => { ${setup} wgSetObj(w, d, x + 3, y, O_ID.gnome_b); const R = rect; let blinks = 0, frames = 0; const t0 = WGS.t;
  rect = function (a, b, c, e, k) { if (k === 's' && c === 1 && e === 1) blinks++; return R(...arguments); };
  try { for (let i = 0; i < 300; i++) { WGS.t = t0 + i / 60; wgDrawObj(O_ID.gnome_b, x + 3, y, 100, 100); frames++; } } finally { rect = R; WGS.t = t0; }
  return [blinks, frames]; })()`);
ok(r[0] >= 4 && r[0] <= 20, 'it blinks now and then: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} w.meta.ach = {}; const res = []; wgSetObj(w, d, x + 1, y - 2, O_ID.gnome_r); wgSetObj(w, d, x + 2, y - 2, O_ID.gnome_b); res.push(w.meta.stats.gnomes); wgAchTick(); res.push(!!w.meta.ach.gnomes);
  wgSetObj(w, d, x + 3, y - 2, O_ID.gnome_y); res.push(w.meta.stats.gnomes); wgAchTick(); res.push(!!w.meta.ach.gnomes); return res; })()`);
ok(r[0] === 3 && r[1] === false && r[2] === 7 && r[3] === true, 'a gnome in every hat set out lights GNOME FRIENDS: ' + JSON.stringify(r));
const EN = ['RED GNOME', 'BLUE GNOME', 'YELLOW GNOME', 'GNOME FRIENDS', 'SET OUT A GNOME IN EVERY HAT'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: three gnomes in a flower bed all watching the hero
await g.ev(`(() => { ${setup} for (const [i, j, id] of [[-3, -2, 'gnome_r'], [3, -2, 'gnome_b'], [0, -3, 'gnome_y'], [-2, -3, 'flower_r'], [2, -3, 'flower_y'], [-4, -1, 'flower_b'], [4, -1, 'flower_w'], [-6, 1, 'oak'], [6, 2, 'birch'], [-1, -4, 'pot_fern']]) wgSetObj(w, d, x + i, y + j, O_ID[id] || 0);
  p.y = y * 16 + 12; p.face = 'u'; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.day = 3; WGS.clock = 0.42; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; WGS.cam.x = p.x; WGS.cam.y = p.y - 16; })(); 0`);
await sleep(100); console.log('gnome', await g.shot('wg_gnome.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'GNOME OK' : 'GNOME FAIL'); g.close(); process.exit(pass ? 0 : 1);
