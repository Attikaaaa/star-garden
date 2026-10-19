// Wildgrove's third box of hats: four hats appended after the others (the old ones keep their places), with recipes and
// icons; each goes on and off with USE and counts; each is drawn into the hero's sprite from every side; a friend's
// number for the last one is good, one past it is not; MAD HATTER for ten; Hungarian; a look at friends in their hats.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'HATS' }, seed: { v: '39' }, look: { skin: 1, hair: 2, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const NEW = ['hat_party', 'hat_witch', 'hat_sailor', 'hat_frog'];
let r = await g.ev(`(() => { const ids = WG_HATS.map(h => h[0]); return [ids.slice(0, 9).join(), ids.slice(9, 13).join(), ${JSON.stringify(NEW)}.every(id => WGI[id] && WGI[id].hat && RECIPES.some(x => x.out === id) && wgIcon(id))]; })()`);
ok(r[0] === 'hat_straw,hat_flowers,hat_beanie,hat_top,hat_crown,hat_mush,hat_chef,hat_pumpkin,hat_bunny' && r[1] === NEW.join() && r[2], 'four hats after the others, the old ones in their places, recipes and icons: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p; WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { hats: 1, hats6: 1, hats10: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.look.hat = 0;
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; const res = []; wgSetObj(w, WGS.dim, Math.floor(p.x / 16) + 1, Math.floor(p.y / 16), 0);
  for (const id of ${JSON.stringify(NEW)}) { WGS.inv[0] = { id, n: 1 }; wgUse(Math.floor(p.x / 16) + 1, Math.floor(p.y / 16)); const on = p.look.hat; wgUse(Math.floor(p.x / 16) + 1, Math.floor(p.y / 16)); res.push([on, WG_HATS[on - 1][0] === id, p.look.hat]); }
  return [res, w.meta.stats.hats]; })()`);
ok(r[0].every(([on, same, off], i) => on === 10 + i && same && off === 0) && r[1] === (1 << 10 | 1 << 11 | 1 << 12 | 1 << 13), 'each goes on and off with USE and counts: ' + JSON.stringify(r));
r = await g.ev(`(() => { const res = []; for (let k = 10; k <= 13; k++) for (const dir of ['d', 'u', 'l']) {
    const base = wgPlayerSpr(dir, 0, { skin: 1, hair: 2, shirt: 3 }), hat = wgPlayerSpr(dir, 0, { skin: 1, hair: 2, shirt: 3, hat: k });
    const a = base.getContext('2d').getImageData(0, 0, base.width, 10).data, b = hat.getContext('2d').getImageData(0, 0, hat.width, 10).data; let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 3] !== b[i + 3]) n++;
    res.push(n); } return res; })()`);
ok(r.every(n => n >= 12), 'each is drawn into the hero from every side: ' + JSON.stringify(r));
r = await g.ev(`[wgnHat(WG_HATS.length), wgnHat(WG_HATS.length + 1), WG_HATS.length]`);
ok(r[0] === r[2] && r[1] === 0 && r[2] >= 13, "a friend's number for the last hat is good, one past it is not: " + JSON.stringify(r));
r = await g.ev(`(() => { const m = WGS.world.meta; m.ach = {}; m.stats.hats = 0b1111111110; wgAchTick(); const a = !!m.ach.hats10; m.ach = {}; m.stats.hats = 0b11111111110; wgAchTick(); return [a, !!m.ach.hats10]; })()`);
ok(!r[0] && r[1], 'MAD HATTER for ten, not nine: ' + JSON.stringify(r));
const EN = ['PARTY HAT', 'WITCH HAT', 'SAILOR CAP', 'FROG HAT', 'MAD HATTER', 'WEAR TEN DIFFERENT HATS'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: the hero in the frog hat among friends in the others
await g.ev(`(() => { const p = WGS.p; p.look.hat = 13; p.face = 'd'; WGS.clock = 0.45; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4;
  WGS.remote = [10, 11, 12].map((k, i) => ({ pid: 2 + i, x: p.x - 40 + i * 40 + (i > 0 ? 40 : 0) - 20, y: p.y + 28, face: ['d', 'l', 'd'][i], moving: 0, walkT: 0, dim: WGS.dim, hp: 20, name: ['PIP', 'MAY', 'OLI'][i], look: { skin: i + 2, hair: i, shirt: i + 4, hat: k }, inv: 0 })); })(); 0`);
await sleep(300); console.log('hats3', await g.shot('wg_hats3.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'HATS3 OK' : 'HATS3 FAIL'); g.close(); process.exit(pass ? 0 : 1);
