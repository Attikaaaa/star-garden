// Wildgrove's pond life pack: the dragonfly, its frame and the star have art, recipes and an album place; fish glide
// under deep water (drawn with the water) and leave when the pond is filled in; dragonflies hover over the shallows by
// day in spring and summer, never at night, in winter or in the rain; the bug net catches one (it stays away), a
// nearer butterfly wins the swing; one in hand is let go; POND DIPPER; a new world forgets the old ponds (the ducks
// too); tips, Hungarian; a look at a pond in summer.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'POND LIFE' }, seed: { v: '61' }, look: { skin: 2, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ['dragonfly', 'dfly_case']) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id); }
  if (!RECIPES.some(rc => rc.out === 'dfly_case')) bad.push('no frame recipe'); if (!WGA.obj.dfly_case || !O_ID.dfly_case) bad.push('no frame sprite');
  if (!WGI.dragonfly.album || !wgAlbumList().includes('dragonfly')) bad.push('not in the album');
  return bad; })()`);
ok(!r.length, 'art, recipes, album: ' + JSON.stringify(r));
// a fish pond and a reedy shallow, each round its cell's spot
r = await g.ev(`(() => { const w = WGS.world, d = 'o', p = WGS.p, C = WG_PL_C, gx = Math.floor(p.x / C), gy = Math.floor(p.y / C); let fish = null, fly = null;
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const h = hash(gx + i, gy + j, 7171 + (w.seed | 0)); if (!fish && h % 2 === 0) fish = [gx + i, gy + j]; }
  for (let j = -4; j <= 4 && !fly; j++) for (let i = -4; i <= 4; i++) { const h = hash(gx + i, gy + j, 7171 + (w.seed | 0)); if (h % 2 && h % 3 === 0 && Math.max(Math.abs(gx + i - fish[0]), Math.abs(gy + j - fish[1])) >= 2) { fly = [gx + i, gy + j]; break; } }
  const paint = (s, rx, ry, gid, ring) => { const x0 = Math.floor((s[1] - rx) / 16), x1 = Math.floor((s[1] + rx) / 16), y0 = Math.floor((s[2] - ry) / 16), y1 = Math.floor((s[2] + ry) / 16);
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) { wgSetObj(w, d, x, y, 0); wgSetGround(w, d, x, y, x < x0 || x > x1 || y < y0 || y > y1 ? ring : gid); } };
  const F = wgPondSpot(fish[0], fish[1], C), D = wgPondSpot(fly[0], fly[1], C);
  paint(F, 48, 32, G_ID.deep, G_ID.shallow); paint(D, 28, 18, G_ID.shallow, G_ID.sand); F[4] = 0; D[4] = 0;
  window._pl = { fish, fly, F: [F[1], F[2]], D: [D[1], D[2]] };
  return [wgPondSpot(fish[0], fish[1], C)[0], wgPondSpot(fly[0], fly[1], C)[0]]; })()`);
ok(r[0] === 0 && r[1] === 1, 'deep water holds fish, the shallows dragonflies: ' + JSON.stringify(r));
await g.ev(`(() => { const p = WGS.p; WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.world.meta.ach = {}; WGS.world.meta.stats = { kills: 0, far: 0 }; WGS.weather = null; WGS.wk = null; WGS.wxT = 9999;
  WGS.day = 8; WGS.clock = 0.4; p.x = _pl.D[0] + 40; p.y = _pl.D[1] + 40; WGS.cam.x = _pl.D[0]; WGS.cam.y = _pl.D[1]; WGS.hint = null; })(); 0`);
await sleep(400);
const seen = async () => g.ev(`WGPL.seen.length / 4`);
ok(await seen() >= 1, 'dragonflies over the shallows on a summer day: ' + await seen());
await g.ev(`WGS.clock = 0.9; 0`); await sleep(300); const night = await seen();
await g.ev(`WGS.clock = 0.4; WGS.day = 24; 0`); await sleep(300); const winter = await seen();
await g.ev(`WGS.day = 8; WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; WGS.wk = 'rain'; 0`); await sleep(300); const rain = await seen();
await g.ev(`WGS.weather = null; WGS.wk = null; WGS.day = 0; 0`); await sleep(300); const spring = await seen();
ok(!night && !winter && !rain && spring >= 1, 'none at night, in winter or in the rain; back in spring: ' + JSON.stringify([night, winter, rain, spring]));
// the net: stand under one and swing
r = await g.ev(`(() => { const S = WGPL.seen, p = WGS.p, key = S[0] * 4 + S[1]; for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'bugnet', n: 1 }; WGS.sel = 0;
  p.x = S[2]; p.y = S[3] + 10; WGBUG.seen.length = 0; WGS.drops = []; WGS.toast = null; const used = wgUse(Math.floor(p.x / 16), Math.floor(p.y / 16));
  const toast = WGS.toast && WGS.toast.msg; wgAchTick(); return { used, key, drops: WGS.drops.map(d => d.id), toast, gone: WGPL.gone.get(key) > WGS.t, star: !!WGS.world.meta.ach.dfly }; })()`);
ok(r.used && r.drops.join() === 'dragonfly' && r.toast === 'CAUGHT: DRAGONFLY', 'the net catches a dragonfly: ' + JSON.stringify(r));
ok(r.gone && r.star, 'it stays away, POND DIPPER: ' + JSON.stringify([r.gone, r.star]));
const key = r.key; await sleep(300);
r = await g.ev(`(() => { const S = WGPL.seen; for (let i = 0; i < S.length; i += 4) if (S[i] * 4 + S[i + 1] === ${key}) return true; return false; })()`);
ok(!r, 'the caught one is not drawn');
r = await g.ev(`(() => { const S = WGPL.seen; if (!S.length) return 'none left to test'; const p = WGS.p; p.x = S[2] + 6; p.y = S[3] + 10; WGS.drops = [];
  WGBUG.seen.length = 0; WGBUG.seen.push(0, 0, 0, p.x, p.y - 10, 1); const used = wgUse(Math.floor(p.x / 16), Math.floor(p.y / 16)); return [used, WGS.drops.map(d => d.id).join()]; })()`);
ok(r[0] === true && r[1] === 'bfly_c', 'a nearer butterfly wins the swing: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p; p.x += 3000; const x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16); wgSetObj(w, 'o', x, y, 0);
  WGS.inv[1] = { id: 'dragonfly', n: 2 }; WGS.sel = 1; WGS.toast = null; WGPL.free.length = 0; const a = wgUse(x, y); return [a, WGS.inv[1] && WGS.inv[1].n, WGS.toast && WGS.toast.msg, WGPL.free.length]; })()`);
ok(r[0] === true && r[1] === 1 && r[2] === 'FLY FREE!' && r[3] === 3, 'one in hand is let go: ' + JSON.stringify(r));
// fish: drawn with the water, gone once the pond is filled
const fishDrawn = `(() => { let n = 0; const R = rect, cx0 = Math.round(_pl.F[0]) - 192, cy0 = Math.round(_pl.F[1]) - 108;
  rect = function (x, y, w, h, k) { if (k === 'b' && Math.abs(x + cx0 - _pl.F[0]) < 32 && Math.abs(y + cy0 - _pl.F[1]) < 20) n++; return R(x, y, w, h, k); }; // only the fish of this pond
  try { wgDrawLiquids(Math.floor(cx0 / 16), Math.floor(cy0 / 16), Math.floor(cx0 / 16) + 25, Math.floor(cy0 / 16) + 15, cx0, cy0); } finally { rect = R; } return n; })()`;
const fish0 = await g.ev(fishDrawn);
r = await g.ev(`(() => { const w = WGS.world, s = wgPondSpot(_pl.fish[0], _pl.fish[1], WG_PL_C); for (let y = -3; y <= 3; y++) for (let x = -4; x <= 4; x++) wgSetGround(w, 'o', Math.floor(s[1] / 16) + x, Math.floor(s[2] / 16) + y, G_ID.grass);
  s[4] = 0; return wgPondSpot(_pl.fish[0], _pl.fish[1], WG_PL_C)[0]; })()`);
const fish1 = await g.ev(fishDrawn);
ok(fish0 >= 6 && r === -1 && fish1 === 0, 'fish under deep water, gone with the pond: ' + JSON.stringify([fish0, r, fish1]));
r = await g.ev(`(() => { WGPL.spots.set(123456789, [1, 0, 0, 0, 1e9, 3]); WGPL.w = {}; wgPondCells(0, 0, () => {}); const a = WGPL.spots.has(123456789) || WGPL.w !== WGS.world;
  WGDK.set(123456789, [0, 0, 0, 2]); WGDK.w = {}; return a; })()`);
await g.ev(`WGS.clock = 0.4; 0`); await sleep(300);
const ducks = await g.ev(`!WGDK.has(123456789) && WGDK.w === WGS.world`);
ok(!r && ducks, 'another world forgets the old ponds, ducks too: ' + JSON.stringify([r, ducks]));
r = await g.ev(`wgTipLines({ id: 'bugnet', n: 1 }).concat(wgTipLines({ id: 'dragonfly', n: 1 }))`);
ok(r.includes('DRAGONFLIES OVER THE SHALLOWS') && r.includes('BUTTERFLIES BY DAY, FIREFLIES BY NIGHT') && r.includes('USE IT TO LET IT GO'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(WGI.dragonfly.name), tr(OBJ[O_ID.dfly_case].name), tr('POND DIPPER'), tr('CATCH A DRAGONFLY'), tr('DRAGONFLIES OVER THE SHALLOWS'), tr('CAUGHT: DRAGONFLY')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['DRAGONFLY', 'FRAMED DRAGONFLY', 'POND DIPPER', 'CATCH A DRAGONFLY', 'DRAGONFLIES OVER THE SHALLOWS', 'CAUGHT: DRAGONFLY'][i]) && !/DRAGONFLY/.test(r[5]), 'Hungarian: ' + JSON.stringify(r));
// a look: a summer pond with fish under the water, dragonflies over the reeds, a framed one on the bank
await g.ev(`(() => { const w = WGS.world, d = 'o', p = WGS.p, s = wgPondSpot(_pl.fly[0], _pl.fly[1], WG_PL_C), cx = Math.floor(s[1] / 16), cy = Math.floor(s[2] / 16);
  for (let y = -6; y <= 7; y++) for (let x = -12; x <= 12; x++) { wgSetObj(w, d, cx + x, cy + y, 0); wgSetGround(w, d, cx + x, cy + y, G_ID.grass); }
  for (let y = -3; y <= 3; y++) for (let x = -5; x <= 5; x++) if (x * x / 30 + y * y / 12 < 1) wgSetGround(w, d, cx + x, cy + y, x * x / 12 + y * y / 4 < 1 ? G_ID.deep : G_ID.shallow);
  for (let y = -1; y <= 1; y++) for (let x = -2; x <= 2; x++) wgSetGround(w, d, cx + x, cy + y, G_ID.shallow);
  s[4] = 0; wgSetObj(w, d, cx + 7, cy - 1, O_ID.dfly_case); wgSetObj(w, d, cx - 7, cy - 2, O_ID.oak);
  WGS.inv[0] = { id: 'bugnet', n: 1 }; WGS.sel = 0; p.x = (cx + 5) * 16 + 8; p.y = (cy + 2) * 16 + 8; p.face = 'l';
  WGS.cam.x = cx * 16 + 8; WGS.cam.y = cy * 16; WGS.toast = null; WGS.weather = null; WGS.day = 8; WGS.clock = 0.4; WGPL.gone.clear(); Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(500); console.log('pond', await g.shot('wg_pondlife.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'POND LIFE OK' : 'POND LIFE FAIL'); g.close(); process.exit(pass ? 0 : 1);
