// Wildgrove's music pack: the music box and the gramophone have art and recipes, USE winds through the four tunes and
// rests after the last (lighting MUSIC LOVER), the song follows the nearest playing one in its reach (a gramophone
// reaches further), a shell chime close by tinkles; tips, Hungarian, and a look at a playing room.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TUNES' }, seed: { v: '29' }, look: { skin: 3, hair: 2, shirt: 0 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ['musicbox', 'gramophone']) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); if (!WGA.obj[id]) bad.push('no sprite ' + id); }
  return bad; })()`);
ok(!r.length, 'art and recipes: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16), res = {};
  for (let j = -12; j < 13; j++) for (let i = -12; i < 13; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; WGS.world.meta.hintDone = 1; WGS.world.meta.ach = {}; WGS.clock = 0.3; WGMU.t = -9; res.land = wgSong();
  wgSetObj(w, d, x + 3, y, O_ID.musicbox); WGMU.t = -9; res.quiet = wgSong();
  res.cycle = []; for (let k = 0; k < 5; k++) { wgUse(x + 3, y); res.cycle.push([wgMetaAt(w, d, x + 3, y), WGS.toast && WGS.toast.msg, wgSong()]); }
  wgAchTick(); res.star = !!WGS.world.meta.ach.tunes;
  wgUse(x + 3, y); WGMU.t = -9; res.near = wgSong();
  p.x -= 16 * 5; WGMU.t = -9; res.far = wgSong(); // eight tiles: past a music box's reach
  wgSetObj(w, d, x + 3, y, O_ID.gramophone, 4); WGMU.t = -9; res.gram = wgSong();
  WGS.clock = 0.8; WGMU.t = -9; res.night = wgSong(); WGS.clock = 0.3;
  p.x += 16 * 5; wgSetObj(w, d, x - 2, y, O_ID.musicbox, 2); WGMU.t = -9; res.nearest = wgSong();
  // a chime two tiles off tinkles
  wgSetObj(w, d, x + 3, y, 0); wgSetObj(w, d, x - 2, y, 0); wgSetObj(w, d, x, y - 2, O_ID.chime); const calls = [], S = Audio_.sfx; Audio_.sfx = (n) => calls.push(n);
  WGMU.t = -9; WGMU.chT = 0; for (let k = 0; k < 4; k++) updateWG(1 / 60); Audio_.sfx = S; res.chime = calls.filter(c => c === 'chime').length;
  return res; })()`);
ok(!/^mb_/.test(r.land) && r.quiet === r.land, 'the land song until one plays: ' + JSON.stringify([r.land, r.quiet]));
ok(JSON.stringify(r.cycle.map(c => c[0])) === '[1,2,3,4,0]' && r.cycle[0][1] === 'PLAYING: LULLABY' && r.cycle[3][1] === 'PLAYING: RAIN ON THE ROOF' && r.cycle[4][1] === 'THE MUSIC BOX RESTS'
  && r.cycle[0][2] === 'mb_lull' && r.cycle[2][2] === 'mb_waltz' && r.cycle[4][2] === r.land && r.star, 'USE winds through the tunes: ' + JSON.stringify([r.cycle, r.star]));
ok(r.near === 'mb_lull' && !/^mb_/.test(r.far) && r.gram === 'mb_rain' && r.night === 'mb_rain' && r.nearest === 'mb_dew', 'reach: ' + JSON.stringify([r.near, r.far, r.gram, r.night, r.nearest]));
ok(r.chime === 1, 'a shell chime tinkles: ' + r.chime);
r = await g.ev(`wgTipLines({ id: 'gramophone', n: 1 }).concat(wgTipLines({ id: 'chime', n: 1 }))`);
ok(r.includes('USE IT TO PLAY A TUNE') && r.includes('TINKLES IN THE BREEZE'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = [tr(OBJ[O_ID.musicbox].name), tr('PLAYING: STARRY WALTZ'), tr('MUSIC LOVER'), tr('THE GRAMOPHONE RESTS'), tr('USE IT TO PLAY A TUNE')]; Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== ['MUSIC BOX', 'PLAYING: STARRY WALTZ', 'MUSIC LOVER', 'THE GRAMOPHONE RESTS', 'USE IT TO PLAY A TUNE'][i]) && !/STARRY/.test(r[1]), 'Hungarian: ' + JSON.stringify(r));
// a look: a music box playing, a quiet one, a gramophone playing, a chime
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 4, y0 = Math.floor(p.y / 16) - 2;
  wgSetObj(w, d, x0 + 1, y0, O_ID.musicbox, 1); wgSetObj(w, d, x0 + 4, y0, O_ID.musicbox, 0); wgSetObj(w, d, x0 + 7, y0, O_ID.gramophone, 3); wgSetObj(w, d, x0 + 9, y0, O_ID.chime);
  p.x = (x0 + 4) * 16 + 8; p.y = (y0 + 2) * 16 + 8; WGS.cam.x = (x0 + 5) * 16; WGS.cam.y = y0 * 16 + 16; WGS.toast = null; WGS.weather = null; })(); 0`);
await sleep(700);
console.log('room', await g.shot('wg_music_room.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'MUSIC OK' : 'MUSIC FAIL'); g.close(); process.exit(pass ? 0 : 1);
