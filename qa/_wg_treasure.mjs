// Wildgrove's treasure maps: a map is one of the gifts; read in hand, it picks a spot 40 to 90 tiles off on bare dry
// ground (the same spot when read again), pins it and opens its screen (a sketch with an X, how far and which way),
// even with the aim out of reach, not underground; the screen closes (not on the press that opened it); the X shows on
// the ground; a shovel at the X digs up the treasure (three things, a map spent, the pin gone, the shovel digging as
// it would), a shovel elsewhere just digs; TREASURE HUNTER for three; tips, Hungarian; two looks.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'TREASURE' }, seed: { v: '57' }, look: { skin: 1, hair: 0, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p; WGS.dim = 'o'; WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; w.meta.ach = { treasure: 1 }; w.meta.stats = { kills: 0, far: 0 }; WGS.mobs = []; WGS.remote = [];
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.inv[0] = { id: 'treasure_map', n: 2 }; WGS.inv[1] = { id: 'shovel_stone', n: 1 }; WGS.sel = 0; Input.lastAim = 'pad'; p.pin = null;
  const items = () => WGS.inv.reduce((n, s) => n + (s && s.id !== 'treasure_map' && s.id !== 'shovel_stone' ? s.n : 0), 0), maps = () => wgInvCount(WGS.inv, 'treasure_map');`;
let r = await g.ev(`(() => [WGI.treasure_map && WGI.treasure_map.kind, !!wgIcon('treasure_map'), WG_GIFTS.some(g => g[0] === 'treasure_map'), !!WGI.shovel_stone])()`);
ok(r[0] === 'tool' && r[1] && r[2] && r[3], 'a treasure map, one of the gifts: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} delete w.meta.tmap; delete w.meta.tmapN; const res = {}, px = Math.floor(p.x / 16), py = Math.floor(p.y / 16);
  res.read = wgUse(px + 1, py); const T = w.meta.tmap; res.spot = T && [Math.round(Math.hypot(T.x - px, T.y - py)), GROUND[wgGround(w, 'o', T.x, T.y)].id, wgObjAt(w, 'o', T.x, T.y)];
  res.pin = p.pin && [p.pin.x - T.x, p.pin.y - T.y, p.pin.dim]; res.scr = WGS.scr; res.maps = maps();
  updateWG(1 / 60); res.still = WGS.scr; WGS.t += 0.1; Input.hit.Escape = true; try { updateWG(1 / 60); } finally { delete Input.hit.Escape; } res.closed = WGS.scr;
  WGS.scr = 'play'; wgTmapRead(); res.again = [w.meta.tmap.x === T.x && w.meta.tmap.y === T.y, WGS.scr]; WGS.scr = 'play';
  WGS.dim = 'u'; WGS.toast = null; wgTmapRead(); res.under = [WGS.scr, WGS.toast && WGS.toast.msg]; WGS.dim = 'o';
  return res; })()`);
ok(r.read === true && r.spot && r.spot[0] >= 38 && r.spot[0] <= 92 && ['grass', 'sand', 'snow', 'dirt', 'jungle', 'moss'].includes(r.spot[1]) && !r.spot[2], 'read, it picks a spot 40 to 90 tiles off on bare dry ground: ' + JSON.stringify(r.spot));
ok(JSON.stringify(r.pin) === '[0.5,0.5,"o"]' && r.scr === 'tmap' && r.maps === 2, 'it pins the spot and opens its screen, the map kept: ' + JSON.stringify([r.pin, r.scr, r.maps]));
ok(r.still === 'tmap' && r.closed === 'play' && r.again[0] && r.again[1] === 'tmap', 'the screen closes (not on the press that opened it); read again, the same spot: ' + JSON.stringify([r.still, r.closed, r.again]));
ok(r.under[0] === 'play' && r.under[1] === 'THE MAP SHOWS THE LAND ABOVE', 'not underground: ' + JSON.stringify(r.under));
r = await g.ev(`(() => { ${setup} WGS.scr = 'play'; Input.lastAim = 'mouse'; Input.mx = 380; Input.my = 20; WGS.cam.x = p.x; WGS.cam.y = p.y; Input.rHit = true; updateWG(1 / 60); Input.rHit = false;
  const res = [WGS.target, WGS.scr]; Input.mx = 4; Input.my = 4; Input.lastAim = 'pad'; WGS.scr = 'play'; return res; })()`);
ok(r[0] === null && r[1] === 'tmap', 'with the aim out of reach it is read all the same: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const T = w.meta.tmap, W = wtext, said = []; WGS.scr = 'tmap'; WGS.tmapT = WGS.t - 1;
  wtext = function (s) { said.push(s); return W(...arguments); }; try { wgDrawTmap(); } finally { wtext = W; }
  const sk = wgTmapSketch(T); return [sk.width, sk.height, said.join('|')]; })()`);
ok(r[0] === 105 && r[1] === 65 && /TREASURE MAP\|.*ABOUT \d+ STEPS\|TO THE [A-Z-]+\|THE PIN SHOWS THE WAY/.test(r[2]), 'its screen: a sketch of the land with an X, how far and which way: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const T = w.meta.tmap; WGS.scr = 'play'; p.x = T.x * 16 + 8 + 40; p.y = T.y * 16 + 10; WGS.cam.x = p.x; WGS.cam.y = p.y; const R = rect; let n = 0;
  rect = function (a, b, c, d, k) { if (k === 'n') n++; return R(...arguments); };
  try { const C = WG.CS; wgChunkUpkeep(w, 'o', Math.floor(T.x / C) - 1, Math.floor(T.y / C) - 1, Math.floor(T.x / C) + 1, Math.floor(T.y / C) + 1); } finally { rect = R; } return n; })()`);
ok(r >= 14, 'the X shows on the ground: ' + r);
r = await g.ev(`(() => { ${setup} const T = w.meta.tmap, res = {}; wgSetGround(w, 'o', T.x, T.y, G_ID.grass); wgSetGround(w, 'o', T.x + 2, T.y, G_ID.grass); wgSetObj(w, 'o', T.x + 2, T.y, 0); p.x = T.x * 16 + 8 + 20; p.y = T.y * 16 + 10; p.pin = { x: T.x + 0.5, y: T.y + 0.5, dim: 'o' };
  WGS.sel = 1; wgUse(T.x + 2, T.y); res.elsewhere = [items(), !!w.meta.tmap, GROUND[wgGround(w, 'o', T.x + 2, T.y)].id];
  const seen = new Set(); WGS.toast = null; res.dug = wgUse(T.x, T.y); if (WGS.toast) seen.add(WGS.toast.msg);
  res.after = [items(), maps(), w.meta.tmap, w.meta.tmapN, w.meta.stats.treasure, p.pin, GROUND[wgGround(w, 'o', T.x, T.y)].id, seen.has('TREASURE!'), !!WGTM.dug];
  const D = ctx.drawImage.bind(ctx); let ch = 0; ctx.drawImage = function (img) { if (img === wgTmapChest()) ch++; return D(...arguments); };
  try { wgDrawAmbient(Math.round(WGS.cam.x) - VW / 2, Math.round(WGS.cam.y) - VH / 2); } finally { ctx.drawImage = D; } res.chest = ch;
  return res; })()`);
ok(r.elsewhere[0] === 0 && r.elsewhere[1] && r.elsewhere[2] === 'path', 'a shovel elsewhere just digs: ' + JSON.stringify(r.elsewhere));
ok(r.dug === true && r.after[0] >= 3 && r.after[2] === null && r.after[3] === 1 && r.after[4] === 1 && r.after[5] === null && r.after[6] === 'path' && r.after[7] && r.after[8] && r.chest === 1,
  'a shovel at the X digs up the treasure: things, a map spent, the pin gone, the shovel digs as it would, a chest pops up: ' + JSON.stringify([r.after, r.chest]));
ok(r.after[1] === 1 || r.after[1] === 2, 'one map spent (or one more found inside): ' + r.after[1]);
r = await g.ev(`(() => { ${setup} w.meta.ach = {}; w.meta.stats.treasure = 2; wgAchTick(); const a = !!w.meta.ach.treasure; w.meta.stats.treasure = 3; wgAchTick(); return [a, !!w.meta.ach.treasure, wgTipLines({ id: 'treasure_map', n: 1 })]; })()`);
ok(r[0] === false && r[1] === true && r[2].includes('DIG AT THE X WITH A SHOVEL'), 'TREASURE HUNTER for three; tips: ' + JSON.stringify(r));
const EN = ['TREASURE MAP', 'TREASURE HUNTER', 'DIG UP THREE TREASURES', 'TREASURE!', 'X MARKS THE SPOT: RIGHT HERE', 'ABOUT 63 STEPS', 'TO THE EAST', 'TO THE SOUTH-EAST', 'TO THE SOUTH', 'TO THE SOUTH-WEST', 'TO THE WEST', 'TO THE NORTH-WEST', 'TO THE NORTH', 'TO THE NORTH-EAST', 'THE PIN SHOWS THE WAY', 'OFF WE GO', 'THE MAP SHOWS THE LAND ABOVE', 'THE MAP IS TOO FADED TO READ', 'USE IT TO READ IT', 'DIG AT THE X WITH A SHOVEL'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]) && r[5].includes('63'), 'Hungarian: ' + JSON.stringify(r));
// two looks: the map read on a sunny day; the chest just dug up at the X
await g.ev(`(() => { ${setup} WGS.inv[0] = { id: 'treasure_map', n: 1 }; WGS.sel = 0; delete w.meta.tmap; WGS.day = 2; WGS.clock = 0.45; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; wgTmapRead(); WGS.tmapT = WGS.t - 1; })(); 0`);
await sleep(80); console.log('map', await g.shot('wg_treasure.png'));
await g.ev(`(() => { ${setup} WGS.scr = 'play'; const T = w.meta.tmap; p.x = T.x * 16 + 8 + 22; p.y = T.y * 16 + 12; p.face = 'l'; WGS.sel = 1; p.pin = null; WGS.cam.x = p.x - 10; WGS.cam.y = p.y; WGS.toast = null; WGTM.dug = { x: T.x * 16 + 8, y: T.y * 16 + 10, t: WGS.t - 0.6 }; })(); 0`);
await sleep(80); console.log('dig', await g.shot('wg_treasure_dig.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'TREASURE OK' : 'TREASURE FAIL'); g.close(); process.exit(pass ? 0 : 1);
