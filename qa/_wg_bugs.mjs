// Wildgrove's bug net pack: every new thing has art and a recipe; the net catches a butterfly by day and a firefly by
// night from the ambient life on screen (the caught one stays away), swings at nothing harmlessly, a bug in hand is let
// go; the bugs join the album, BUG CATCHER lights; tips, Hungarian, a look at a jar glowing at night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'BUGS' }, seed: { v: '12' }, look: { skin: 0, hair: 2, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const ITEMS = ['bugnet', 'bfly_p', 'bfly_c', 'bfly_o', 'bfly_w', 'firefly', 'firefly_jar', 'bcase_p', 'bcase_c', 'bcase_o', 'bcase_w'];
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ${JSON.stringify(ITEMS)}) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id);
    if (!/^bfly_|^firefly$/.test(id) && !RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); }
  for (const id of ['firefly_jar', 'bcase_p', 'bcase_w']) if (!WGA.obj[id]) bad.push('no sprite ' + id);
  const L = wgAlbumList(); for (const id of ['bfly_p', 'bfly_w', 'firefly']) if (!L.includes(id)) bad.push('not in the album ' + id);
  return bad; })()`);
ok(!r.length, 'art, recipes, album: ' + JSON.stringify(r));
await g.ev(`WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.world.meta.ach = {}; WGS.weather = null; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'bugnet', n: 1 }; WGS.sel = 0; 0`);
// look around for a bug of the kind wanted, then stand on it and swing
const hunt = async (night, kinds) => {
  for (let k = 0; k < 40; k++) {
    await g.ev(`(() => { const p = WGS.p; WGS.clock = ${night ? 0.85 : 0.3}; if (${k} > 0) { p.x += 320 * ((${k} % 7) - 3); p.y += 200 * (Math.floor(${k} / 7) % 3 - 1); } WGS.cam.x = p.x; WGS.cam.y = p.y; })(); 0`);
    await sleep(250);
    const hit = await g.ev(`(() => { const S = WGBUG.seen; for (let i = 0; i < S.length; i += 6) if (${JSON.stringify(kinds)}.includes(S[i + 5])) {
      const p = WGS.p, key = (S[i] * 65536 + S[i + 1]) * 4 + S[i + 2]; p.x = S[i + 3]; p.y = S[i + 4] + 10; WGS.drops = []; WGS.toast = null;
      const used = wgUse(Math.floor(p.x / 16), Math.floor(p.y / 16)); return { used, kind: S[i + 5], drops: WGS.drops.map(d => d.id), toast: WGS.toast && WGS.toast.msg, gone: WGBUG.gone.get(key) > WGS.t, key }; } return null; })()`);
    if (hit) return hit;
  }
  return null;
};
const day = await hunt(false, [0, 1, 2, 3]);
ok(day && day.used && day.drops.length === 1 && /^bfly_/.test(day.drops[0]) && /^CAUGHT: .* BUTTERFLY$/.test(day.toast) && day.gone, 'a butterfly by day: ' + JSON.stringify(day));
if (day) { await sleep(300); r = await g.ev(`(() => { const S = WGBUG.seen; for (let i = 0; i < S.length; i += 6) if ((S[i] * 65536 + S[i + 1]) * 4 + S[i + 2] === ${day.key}) return true; return false; })()`); ok(!r, 'the caught one stays away'); }
const night = await hunt(true, [4]);
ok(night && night.used && night.drops[0] === 'firefly' && night.toast === 'CAUGHT: FIREFLY', 'a firefly by night: ' + JSON.stringify(night));
r = await g.ev(`(() => { const st = WGS.world.meta.stats, had = st.bugs; st.bugs = 31; wgAchTick(); const star = !!WGS.world.meta.ach.bugs; st.bugs = had; return [had, star]; })()`);
ok(r[0] && r[1], 'BUG CATCHER: ' + JSON.stringify(r));
// a swing at nothing: no catch, no harm; a butterfly in hand is let go
r = await g.ev(`(() => { const p = WGS.p, w = WGS.world, d = WGS.dim; WGS.clock = 0.3; p.x += 4000; p.y += 4000; const x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16);
  wgSetObj(w, d, x, y, 0); WGBUG.seen.length = 0; WGS.drops = []; const a = wgUse(x, y), none = WGS.drops.length;
  WGS.inv[1] = { id: 'bfly_o', n: 2 }; WGS.sel = 1; WGS.toast = null; const b = wgUse(x, y); return [a, none, b, WGS.inv[1] && WGS.inv[1].n, WGS.toast && WGS.toast.msg, WGBF.length]; })()`);
ok(r[0] === true && r[1] === 0 && r[2] === true && r[3] === 1 && r[4] === 'FLY FREE!' && r[5] === 4, 'a swing at nothing, letting one go: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'bugnet', n: 1 }).concat(wgTipLines({ id: 'bfly_p', n: 1 }), wgTipLines({ id: 'firefly_jar', n: 1 }))`);
ok(r.includes('BUTTERFLIES BY DAY, FIREFLIES BY NIGHT') && r.includes('USE IT TO LET IT GO') && r.includes('A SOFT LIGHT THAT NEVER GOES OUT'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.bugnet.name), tr('CAUGHT: BLUE BUTTERFLY'), tr('FLY FREE!'), tr('BUG CATCHER'), tr(OBJ[O_ID.firefly_jar].name), tr(OBJ[O_ID.bcase_o].name)]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['BUG NET', 'CAUGHT: BLUE BUTTERFLY', 'FLY FREE!', 'BUG CATCHER', 'FIREFLY JAR', 'FRAMED ORANGE BUTTERFLY'][i]) && !/BLUE/.test(r[1]), 'Hungarian: ' + JSON.stringify(r));
// a look: jars glowing at night beside the four frames
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 5, y0 = Math.floor(p.y / 16) - 2;
  for (let j = -2; j < 5; j++) for (let i = -1; i < 12; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  wgSetObj(w, d, x0 + 1, y0, O_ID.firefly_jar); wgSetObj(w, d, x0 + 9, y0, O_ID.firefly_jar); ['bcase_p', 'bcase_c', 'bcase_o', 'bcase_w'].forEach((id, i) => wgSetObj(w, d, x0 + 3 + i * 1.5 | 0, y0, O_ID[id]));
  p.x = (x0 + 5) * 16 + 8; p.y = (y0 + 2) * 16 + 8; WGS.cam.x = (x0 + 5) * 16; WGS.cam.y = y0 * 16 + 16; WGS.toast = null; WGS.clock = 0.85; WGS.sel = 0; })(); 0`);
await sleep(500); console.log('night', await g.shot('wg_bugs_night.png'));
await g.ev(`WGS.clock = 0.3; WGS.scr = 'inv'; WGS.ui = {}; for (let i = 0; i < 36; i++) WGS.inv[i] = null; ${JSON.stringify(ITEMS)}.forEach((id, i) => WGS.inv[9 + i] = { id, n: 1 }); Input.mx = 300; Input.my = 200; 0`); await sleep(300);
console.log('icons', await g.shot('wg_bugs_icons.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'BUGS OK' : 'BUGS FAIL'); g.close(); process.exit(pass ? 0 : 1);
