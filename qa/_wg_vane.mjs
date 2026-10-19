// Wildgrove's weather vane: an object, a recipe, five frames; the forecast from the weather and its timer, told on USE
// (still air underground); the host puts it in the clk message, a guest reads it (clamped, only from an open link) and
// tells it; WEATHER WISE when rain comes after the vane said so (not without); it turns with the wind through all five
// frames over a day, the same from the clock alone, side on underground; tips, Hungarian; a look.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'VANE' }, seed: { v: '52' }, look: { skin: 2, hair: 1, shirt: 4 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const rc = RECIPES.find(x => x.out === 'weathervane'); return [!!(WGA.obj.weathervane || [])[0], [0, 1, 2, 3, 4].every(i => WGA.cache['vane' + i]), rc && rc.at]; })()`);
ok(r[0] && r[1] && r[2] === 'anvil', 'an object, five frames, a recipe: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -5; j < 6; j++) for (let i = -8; i < 9; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = { vane: 1 }; w.meta.stats = { kills: 0, far: 0 }; p.x = x * 16 + 8; p.y = y * 16 + 10; window._vn = { x, y };
  for (let i = 0; i < 36; i++) WGS.inv[i] = null; WGS.sel = 0; wgSetObj(w, d, x + 2, y, O_ID.weathervane);
  const fc = (W, T) => { WGS.weather = W; WGS.wxT = T; return wgForecast(); }, rain = { kind: 'rain', dark: 0.12, wind: 0.6, storm: false }, storm = Object.assign({}, rain, { storm: true });
  const res = [fc(null, 200), fc(null, 50), fc(rain, 60), fc(storm, 60), fc(storm, 10)];
  WGS.weather = null; WGS.wxT = 50; WGS.toast = null; wgUse(x + 2, y); res.push(WGS.toast && WGS.toast.msg, WGVN.said === WGS.t);
  WGS.wxT = 300; WGS.toast = null; wgUse(x + 2, y); res.push(WGS.toast && WGS.toast.msg);
  wgSetObj(w, 'u', x + 2, y, O_ID.weathervane); WGS.dim = 'u'; WGS.toast = null; wgUse(x + 2, y); res.push(WGS.toast && WGS.toast.msg); WGS.dim = d; wgSetObj(w, 'u', x + 2, y, 0);
  return res; })()`);
ok(r.slice(0, 5).join() === '0,1,2,4,3', 'the forecast: fair, rain coming, rain that lasts, a storm that lasts, clearing soon: ' + JSON.stringify(r.slice(0, 5)));
ok(r[5] === 'RAIN IS ON ITS WAY' && r[6] && r[7] === 'FAIR WEATHER AHEAD' && r[8] === 'THE AIR IS STILL DOWN HERE', 'told on USE, still air underground: ' + JSON.stringify(r.slice(5)));
r = await g.ev(`(() => { const S = wgnSend, peers = WGN.peers, role = WGN.role, sent = [], res = {}, c0 = WGS.clock, d0 = WGS.day;
  try {
    wgnSend = (L, m) => sent.push(m); WGN.peers = [{ pid: 2 }]; WGS.weather = null; WGS.wxT = 40; wgnAll({ t: 'clk', c: 0.5, d: 0, wk: null, hd: 'o' }); res.host = sent[0] && sent[0].fc;
    WGN.role = 'client'; wgnClientMsg({ open: true }, { t: 'clk', c: c0, d: d0, wk: null, hd: 'o', fc: 3 }); res.read = wgForecast();
    wgnClientMsg({ open: true }, { t: 'clk', c: c0, d: d0, wk: null, hd: 'o', fc: 99 }); res.clamp = wgForecast();
    wgnClientMsg({ open: false }, { t: 'clk', c: c0, d: d0, wk: null, hd: 'o', fc: 1 }); res.shut = wgForecast();
    WGS.toast = null; wgUse(_vn.x + 2, _vn.y); res.told = WGS.toast && WGS.toast.msg;
  } finally { wgnSend = S; WGN.peers = peers; WGN.role = role; WGS.clock = c0; WGS.day = d0; WGS.wk = null; WGVN.fc = 0; } return res; })()`);
ok(r.host === 1 && r.read === 3 && r.clamp === 4 && r.shut === 4 && r.told === 'THE STORM WILL LAST A WHILE', 'the net: the host sends fc in clk, a guest reads it (clamped, open links only) and tells it: ' + JSON.stringify(r));
r = await g.ev(`(() => { const st = WGS.world.meta.stats, res = []; WGS.weather = null; WGS.wk = null; WGVN.wk = null; WGVN.said = -1e9; WGS.wxT = 0.001; updateWG(1 / 60); res.push(!!WGS.wk, !!st.vane);
  WGS.weather = null; WGS.wk = null; updateWG(1 / 60); WGS.wxT = 50; WGS.toast = null; wgUse(_vn.x + 2, _vn.y); res.push(WGS.toast && WGS.toast.msg); WGS.wxT = 0.001; updateWG(1 / 60); res.push(!!WGS.wk, !!st.vane);
  const m = WGS.world.meta; m.ach = {}; wgAchTick(); res.push(!!m.ach.vane); WGS.weather = null; WGS.wk = null; WGS.wxT = 9999; return res; })()`);
ok(r.join() === 'true,false,RAIN IS ON ITS WAY,true,true,true', 'WEATHER WISE when rain comes after the vane said so, not without: ' + JSON.stringify(r));
r = await g.ev(`(() => { const { x, y } = _vn, D = ctx.drawImage.bind(ctx), F = [0, 1, 2, 3, 4].map(i => WGA.cache['vane' + i]), seen = new Set(), c0 = WGS.clock, seq = []; let got = -1;
  ctx.drawImage = function (img) { const i = F.indexOf(img); if (i >= 0) got = i; return D(...arguments); };
  try {
    for (let k = 0; k < 240; k++) { WGS.clock = k / 240; got = -1; wgDrawObj(O_ID.weathervane, x + 2, y, 100, 100); seen.add(got); if (k < 4) seq.push(got); }
    WGS.clock = 0.3; got = -1; wgDrawObj(O_ID.weathervane, x + 2, y, 100, 100); const a = got; got = -1; wgDrawObj(O_ID.weathervane, x + 2, y, 100, 100); const b = got;
    WGS.dim = 'u'; got = -1; wgDrawObj(O_ID.weathervane, x + 2, y, 100, 100); const u = got; WGS.dim = 'o';
    return [[...seen].sort().join(), a === b, u];
  } finally { ctx.drawImage = D; WGS.clock = c0; } })()`);
ok(r[0] === '0,1,2,3,4' && r[1] && r[2] === 0, 'it turns through all five frames over a day, the same from the clock, side on underground: ' + JSON.stringify(r));
r = await g.ev(`wgTipLines({ id: 'weathervane', n: 1 })`);
ok(r.includes('USE IT FOR A FORECAST'), 'tips: ' + JSON.stringify(r));
const EN = ['WEATHER VANE', 'WEATHER WISE', 'HEAR FROM A WEATHER VANE THAT RAIN IS COMING', 'FAIR WEATHER AHEAD', 'RAIN IS ON ITS WAY', 'THE RAIN WILL LAST A WHILE', 'THE SKY WILL CLEAR SOON', 'THE STORM WILL LAST A WHILE', 'THE AIR IS STILL DOWN HERE', 'USE IT FOR A FORECAST'];
r = await g.ev(`(() => { Save.settings.lang = 'hu'; const a = ${JSON.stringify(EN)}.map(s => tr(s)); Save.settings.lang = 'en'; return a; })()`);
ok(r.every((s, i) => s !== EN[i]), 'Hungarian: ' + JSON.stringify(r));
// a look: a row of vanes by day, each turned its own way by a different hour
await g.ev(`(() => { const { x, y } = _vn, w = WGS.world, d = WGS.dim, p = WGS.p; for (let i = 0; i < 5; i++) wgSetObj(w, d, x - 3 + i * 2, y - 2, O_ID.weathervane);
  p.x = x * 16 + 8; p.y = y * 16 + 10; p.face = 'r'; WGS.clock = 0.4; WGS.weather = null; WGS.wxT = 9999; WGS.toast = null; Input.mx = 4; Input.my = 4; })(); 0`);
await sleep(300); console.log('vane', await g.shot('wg_vane.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'VANE OK' : 'VANE FAIL'); g.close(); process.exit(pass ? 0 : 1);
