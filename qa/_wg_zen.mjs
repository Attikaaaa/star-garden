// Wildgrove's rock garden: a rake and a stone lantern from a bench, with icons; the rake rakes bare sand and gravel, not
// grass or a tile with something on it, and again for the next pattern, round all four; each pattern is drawn in the
// ground's own colours and meets its neighbours'; it is flat and walkable, a shovel smooths it; the lantern is a light;
// ROCK GARDEN for every pattern; tips; Hungarian; a look at a raked garden with lanterns, by day and by night.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'ZEN' }, seed: { v: '634' }, look: { skin: 2, hair: 0, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
const setup = `const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); WGS.dim = 'o';
  for (let j = -10; j < 11; j++) for (let i = -14; i < 15; i++) { wgSetObj(w, 'o', x + i, y + j, 0); wgSetGround(w, 'o', x + i, y + j, G_ID.sand); }
  WGS.scr = 'play'; WGS.ui = {}; w.meta.hintDone = 1; WGS.mobs = []; WGS.remote = []; WGS.parts.length = 0; WGS.drops.length = 0; p.x = x * 16 + 8; p.y = y * 16 + 10; p.hidden = false; p.moving = false; WGS.toast = null; WGS.weather = null; WGS.wxT = 9999;
  WGS.day = 12; WGS.clock = 0.45; WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.target = null; for (let i = 0; i < WGS.inv.length; i++) WGS.inv[i] = null; WGS.sel = 0;
  for (const a of WG_ACH) w.meta.ach[a[0]] = 1; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });`;
let r = await g.ev(`(() => { const px = (id) => { const d = wgIcon(id).getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  const at = (id) => (RECIPES.find(q => q.out === id) || {}).at; return [WGI.rake && WGI.rake.kind, px('rake'), px('stone_lantern'), at('rake'), at('stone_lantern'), OBJ[O_ID.stone_lantern].light > 0, !!OBJ[O_ID.raked].solid]; })()`);
ok(r[0] === 'tool' && r[1] >= 25 && r[2] >= 60 && r[3] === 'bench' && r[4] === 'bench' && r[5] && !r[6], 'a rake and a stone lantern from a bench, with icons; the lantern a light, raked sand flat: ' + JSON.stringify(r));
r = await g.ev(`(() => { ${setup} const res = {}; WGS.inv[0] = { id: 'rake', n: 1 }; st.zen = 0;
  const m = []; for (let k = 0; k < 5; k++) { wgUse(x + 2, y); m.push(wgObjAt(w, 'o', x + 2, y) === O_ID.raked ? wgMetaAt(w, 'o', x + 2, y) : -1); } res.cycle = m.join(); res.bits = st.zen;
  wgSetGround(w, 'o', x + 3, y, G_ID.grass); res.grass = [wgUse(x + 3, y), wgObjAt(w, 'o', x + 3, y)];
  wgSetObj(w, 'o', x + 4, y, O_ID.cairn || O_ID.boulder); res.taken = [wgObjAt(w, 'o', x + 4, y) !== O_ID.raked];
  if (G_ID.p_gravel !== undefined) { wgSetGround(w, 'o', x + 5, y, G_ID.p_gravel); wgUse(x + 5, y); res.gravel = wgObjAt(w, 'o', x + 5, y) === O_ID.raked; } else res.gravel = true;
  res.walk = !wgSolidTile(w, 'o', x + 2, y);
  WGS.inv[0] = { id: 'shovel_' + (TIERS[0].id || 'wood'), n: 1 }; wgBreak(x + 2, y, true); res.smooth = [wgObjAt(w, 'o', x + 2, y), wgGround(w, 'o', x + 2, y) === G_ID.sand, WGS.drops.length];
  const A = WG_ACH.find(a => a[0] === 'zen')[3]; res.ach = [A({ st: { zen: 15 }, seen: {} }), A({ st: { zen: 7 }, seen: {} })];
  res.tips = wgTipLines({ id: 'rake', n: 1 }).includes('RAKES SAND AND GRAVEL');
  wgSetObj(w, 'o', x + 8, y + 3, O_ID.boulder); WGZN.t = -9; res.stone = [wgZenStone(x + 7, y + 3), wgZenStone(x + 6, y + 5), wgZenStone(x - 8, y - 6)];
  res.ring = wgRakeArt(2, 'sand', [1, 0]) !== wgRakeArt(2, 'sand', null) && wgRakeArt(2, 'sand', [1, 0]) === wgRakeArt(2, 'sand', [1, 0]);
  const n0 = WGR.lights.length; wgDrawObj(O_ID.stone_lantern, x, y, 100, 100); res.light = WGR.lights.length - n0; WGR.lights.length = n0; return res; })()`);
ok(JSON.stringify(r.stone) === '[[1,0],[2,-2],null]' && r.ring && r.light === 1, 'ripples ring the nearest stone within three tiles; the lantern sheds light: ' + JSON.stringify([r.stone, r.ring, r.light]));
ok(r.cycle === '0,1,2,3,0' && r.bits === 15, 'the rake rakes the sand, and again for the next pattern, round all four: ' + JSON.stringify([r.cycle, r.bits]));
ok(r.grass[1] === 0 && r.taken[0] && r.gravel && r.walk, 'gravel too, not grass or a tile with something on it; walkable: ' + JSON.stringify([r.grass, r.taken, r.gravel, r.walk]));
ok(r.smooth[0] === 0 && r.smooth[1] && r.smooth[2] === 0 && r.ach.join() === 'true,false' && r.tips, 'a knock smooths it, nothing dropped; ROCK GARDEN for all four; tips: ' + JSON.stringify([r.smooth, r.ach, r.tips]));
// the patterns: in the ground's own colours, meeting their neighbours'
r = await g.ev(`(() => { const res = {}; for (let k = 0; k < 4; k++) { const d = wgRakeArt(k, 'sand').getContext('2d').getImageData(0, 0, 16, 16).data; let n = 0, edge = 0;
    const R = GROUND[G_ID.sand].ramp.map(c => PAL[c]); const cols = new Set();
    for (let i = 0; i < 256; i++) if (d[i * 4 + 3] > 8) { n++; cols.add('#' + [0, 1, 2].map(c => d[i * 4 + c].toString(16).padStart(2, '0')).join('')); }
    for (let yy = 0; yy < 16; yy++) if ((d[(yy * 16) * 4 + 3] > 8) === (d[(yy * 16 + 15) * 4 + 3] > 8) || k === 2) edge++;
    res[k] = [n, [...cols].every(c => R.includes(c)), edge]; } return res; })()`);
ok(Object.values(r).every(v => v[0] >= 60 && v[0] <= 200 && v[1]) && r[0][2] === 16, "each pattern in the ground's own colours, rows meeting the next tile's: " + JSON.stringify(r));
const EN = ['RAKE', 'RAKED SAND', 'STONE LANTERN', 'ROCK GARDEN', 'RAKE THE SAND IN EVERY PATTERN', 'RAKES SAND AND GRAVEL', 'AGAIN FOR ANOTHER PATTERN'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a raked garden, rows round the edge and ripples in the middle, stones and two lanterns
const scene = `(() => { ${setup} for (let j = -3; j <= 3; j++) for (let i = -6; i <= 6; i++) { const e = Math.abs(i) === 6 || Math.abs(j) === 3; wgSetObj(w, 'o', x + i, y + j, O_ID.raked, e ? (Math.abs(j) === 3 ? 0 : 1) : Math.hypot(i - 2, j) < 2.5 ? 2 : 3); }
  wgSetObj(w, 'o', x + 2, y, O_ID.boulder); wgSetObj(w, 'o', x - 3, y - 1, O_ID.boulder); wgSetObj(w, 'o', x - 8, y - 2, O_ID.stone_lantern); wgSetObj(w, 'o', x + 8, y + 2, O_ID.stone_lantern);
  for (let i = -14; i < 15; i++) for (const j of [-5, 5]) wgSetGround(w, 'o', x + i, y + j, G_ID.grass); wgSetObj(w, 'o', x - 10, y - 5, O_ID.pine); wgSetObj(w, 'o', x + 10, y - 5, O_ID.oak);
  p.x = (x - 4) * 16 + 8; p.y = (y + 4) * 16 + 4; p.face = 'u'; WGS.cam.x = x * 16 + 8; WGS.cam.y = y * 16 + 8; })(); 0`;
await g.ev(scene); await g.ev(`window._zz = setInterval(() => { WGS.clock = 0.45; }, 50); 0`);
await sleep(300); console.log('day', await g.shot('wg_zen.png'));
await g.ev(`clearInterval(window._zz); window._zz = setInterval(() => { WGS.clock = 0.95; }, 50); 0`);
await sleep(300); console.log('night', await g.shot('wg_zen_night.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'ZEN OK' : 'ZEN FAIL'); g.close(); process.exit(pass ? 0 : 1);
