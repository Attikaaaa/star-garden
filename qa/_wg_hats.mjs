// Wildgrove's hat pack: five hats with icons and recipes; USE puts one on and takes it off (it stays in the pack);
// the hat is drawn into the hero's sprite in every direction and walking frame, an unknown hat number draws none;
// HAT TRICK after three different hats; the net messages carry it; tips, Hungarian; a look at friends in their hats.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'HATS' }, seed: { v: '97' }, look: { skin: 0, hair: 3, shirt: 2 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  const same = (a, b) => { const x = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, y = b.getContext('2d').getImageData(0, 0, b.width, b.height).data; let n = 0; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) n++; return n; };
  WG_HATS.forEach(([id], i) => { if (!WGI[id]) { bad.push('no item ' + id); return; } if (px(wgIcon(id)) < 60) bad.push('thin icon ' + id); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id);
    for (const dir of ['d', 'u', 'l']) for (const fr of [0, 1]) { const L = { skin: 1, hair: 2, shirt: 3 }, a = wgPlayerSpr(dir, fr, L), b = wgPlayerSpr(dir, fr, Object.assign({ hat: i + 1 }, L)); if (same(a, b) < 40) bad.push('no hat drawn ' + id + ' ' + dir + fr); } });
  const L = { skin: 1, hair: 2, shirt: 3 }; if (wgPlayerSpr('d', 0, Object.assign({ hat: 99 }, L)) !== wgPlayerSpr('d', 0, L) || wgPlayerSpr('d', 0, Object.assign({ hat: 'x' }, L)) !== wgPlayerSpr('d', 0, L)) bad.push('odd hat drawn');
  return bad; })()`);
ok(!r.length, 'hats, icons, recipes, drawn into the hero: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = {};
  for (let j = -2; j < 3; j++) for (let i = -2; i < 4; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WG_HATS.forEach(([id], i) => { WGS.inv[i] = { id, n: 1 }; }); WGS.sel = 0;
  wgUse(x, y); res.on = p.look.hat; wgUse(x, y); res.off = p.look.hat; res.kept = wgInvCount(WGS.inv, 'hat_straw');
  WGS.sel = 1; wgUse(x, y); wgAchTick(); res.two = !!w.meta.ach.hats; WGS.sel = 2; wgUse(x, y); wgAchTick(); res.three = !!w.meta.ach.hats; res.worn = p.look.hat;
  return res; })()`);
ok(r.on === 1 && r.off === 0 && r.kept === 1 && !r.two && r.three && r.worn === 3, 'USE puts a hat on and off, HAT TRICK: ' + JSON.stringify(r));
const net = await (await import('fs')).promises.readFile(new URL('../src/wg_net.js', import.meta.url), 'utf8');
r = await g.ev(`[wgnHat(2), wgnHat(WG_HATS.length + 1), wgnHat('x'), wgnHat(-1), wgnHat(undefined)]`); // one past the last hat is odd
ok(/ht: \(p\.look && p\.look\.hat\) \| 0/.test(net) && /hat: wgnHat\(m\.ht\)/.test(net) && r.join() === '2,0,0,0,0', 'the net carries the hat, an odd one is dropped: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'hat_top', n: 1 })`);
ok(r.includes('USE IT TO PUT IT ON OR TAKE IT OFF') && r.includes('FRIENDS SEE IT TOO'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = WG_HATS.map(h => tr(h[1])).concat(tr('HAT TRICK'), tr('HAT ON'), tr('FRIENDS SEE IT TOO')); Save.settings.lang = 'en'; return a; })()`);
const en = (await g.ev(`WG_HATS.map(h => h[1])`)).concat('HAT TRICK', 'HAT ON', 'FRIENDS SEE IT TOO');
ok(r.every((s, i) => s !== en[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: you and four friends, each in a hat, facing different ways
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 6, y0 = Math.floor(p.y / 16) - 2;
  for (let j = -2; j < 6; j++) for (let i = -2; i < 16; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  p.look.hat = 1; p.x = (x0 + 2) * 16 + 8; p.y = (y0 + 2) * 16 + 8; p.face = 'd'; WGS.sel = 8;
  const looks = [[2, 1, 4, 'd'], [1, 4, 1, 'r'], [0, 0, 3, 'u'], [2, 3, 0, 'l']];
  WGS.remote = looks.map(([skin, hair, shirt, face], i) => ({ pid: i + 2, x: (x0 + 4 + i * 2) * 16 + 8, y: (y0 + 2) * 16 + 8, face, moving: false, walkT: 0, dim: d, hp: 20, name: '', look: { skin, hair, shirt, hat: i + 2 }, swing: 0, kite: 0, boat: 0, inv: 0 }));
  WGS.cam.x = (x0 + 6) * 16; WGS.cam.y = (y0 + 2) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.35; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(400); console.log('hats', await g.shot('wg_hats_friends.png'));
await g.ev(`WGS.remote = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'HATS OK' : 'HATS FAIL'); g.close(); process.exit(pass ? 0 : 1);
