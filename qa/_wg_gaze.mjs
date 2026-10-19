// Wildgrove's stargazing pack: the telescope and the star chart have art and recipes; every sign's stars sit inside the
// eyepiece, apart from each other, with real lines; eight nights in a row bring all eight signs; the telescope does
// nothing by day, underground or in the rain (but works above the clouds), opens the sky at night and not on the press
// that opened it closes it; sweeping the view over the stars lights them, the sign goes onto the chart, a second look
// that night finds it whole; STARGAZER; the cross moves with the arrows; tips, Hungarian and fit; a look at both screens.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'STARS' }, seed: { v: '57' }, look: { skin: 2, hair: 1, shirt: 3 }, peace: true }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
let r = await g.ev(`(() => { const bad = [], px = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
  for (const id of ['telescope', 'star_chart']) { if (!WGI[id]) { bad.push('no item ' + id); continue; } if (px(wgIcon(id)) < 30) bad.push('thin icon ' + id); if (!RECIPES.some(rc => rc.out === id)) bad.push('no recipe ' + id); if (!WGA.obj[id]) bad.push('no sprite ' + id); }
  WG_SIGNS.forEach(([name, P, E], n) => {
    for (const [a, b] of E) if (!P[a] || !P[b] || a === b) bad.push(name + ' line ' + a + '-' + b);
    P.forEach((_, i) => { if (!E.some(e => e.includes(i))) bad.push(name + ' lone star ' + i); });
    for (let night = -3; night < 40; night++) { const S = wgGazeStars(n, night);
      S.forEach(([x, y], i) => { if (Math.hypot(x - WG_GAZE_X, y - WG_GAZE_Y) > WG_GAZE_R - 8) bad.push(name + ' star ' + i + ' at the rim, night ' + night);
        S.forEach(([x2, y2], j) => { if (j > i && Math.hypot(x2 - x, y2 - y) < 17) bad.push(name + ' stars ' + i + ',' + j + ' too close'); }); }); }
  });
  return [...new Set(bad)].slice(0, 12); })()`);
ok(!r.length, 'art, recipes, every sign fits the eyepiece: ' + JSON.stringify(r));
r = await g.ev(`(() => { const seen = new Set(); for (let d = 10; d < 18; d++) { WGS.day = d; WGS.clock = 0.9; seen.add(wgSignTonight()); } WGS.day = 18; WGS.clock = 0.1; const late = wgSignTonight(); WGS.day = 17; WGS.clock = 0.9; return [seen.size, late === wgSignTonight()]; })()`);
ok(r[0] === 8 && r[1], 'eight nights, eight signs; after midnight it is still the same night: ' + JSON.stringify(r));
r = await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = {};
  for (let j = -1; j < 2; j++) for (let i = -1; i < 3; i++) { wgSetObj(w, d, x + i, y + j, 0); wgSetGround(w, d, x + i, y + j, G_ID.grass); }
  WGS.scr = 'play'; w.meta.hintDone = 1; w.meta.ach = {}; w.meta.stats = { kills: 0, far: 0 }; WGS.weather = null; WGS.wk = null;
  wgSetObj(w, d, x, y, O_ID.telescope); wgSetObj(w, d, x + 1, y, O_ID.star_chart);
  WGS.clock = 0.5; WGS.toast = null; wgUse(x, y); res.day = [WGS.scr, WGS.toast && WGS.toast.msg];
  WGS.clock = 0.92; WGS.weather = { kind: 'rain', dark: 0.12, wind: 0.6 }; WGS.toast = null; wgUse(x, y); res.rain = [WGS.scr, WGS.toast && WGS.toast.msg];
  for (const dm of ['k', 'u']) wgSetObj(w, dm, x, y, O_ID.telescope); WGS.dim = 'k'; wgUse(x, y); res.clouds = WGS.scr; wgGazeClose(); WGS.dim = 'u'; WGS.toast = null; wgUse(x, y); res.under = [WGS.scr, WGS.toast && WGS.toast.msg]; WGS.dim = d; WGS.weather = null;
  wgUse(x, y); res.open = [WGS.scr, WGS.gaze && WGS.gaze.mode]; updateWG(1 / 60); res.stays = WGS.scr;
  return res; })()`);
ok(r.day[0] === 'play' && r.day[1] === 'THE STARS COME OUT AT NIGHT' && r.rain[0] === 'play' && r.rain[1] === 'TOO CLOUDY TONIGHT', 'not by day, not in the rain: ' + JSON.stringify([r.day, r.rain]));
ok(r.clouds === 'gaze' && r.under[0] === 'play' && r.under[1] === 'NO SKY DOWN HERE', 'above the clouds yes, underground no: ' + JSON.stringify([r.clouds, r.under]));
ok(r.open[0] === 'gaze' && r.open[1] === 'sky' && r.stays === 'gaze', 'the sky opens at night and stays: ' + JSON.stringify(r.open));
// light all but one star, look, then the last
r = await g.ev(`(() => { const K = WGS.gaze, S = wgGazeStars(K.n, K.night); Input.lastAim = 'keys';
  for (let i = 0; i < S.length - 1; i++) { K.cx = S[i][0] - WG_GAZE_X + 3; K.cy = S[i][1] - WG_GAZE_Y - 2; updateWG(1 / 60); }
  K.cx = 40; K.cy = 50; return [K.lit.filter(Boolean).length, S.length, !!K.done]; })()`);
ok(r[0] === r[1] - 1 && !r[2], 'stars light under the view: ' + JSON.stringify(r));
await sleep(200); console.log('sky', await g.shot('wg_gaze_sky.png'));
r = await g.ev(`(() => { const K = WGS.gaze, S = wgGazeStars(K.n, K.night), i = S.length - 1; K.cx = S[i][0] - WG_GAZE_X; K.cy = S[i][1] - WG_GAZE_Y; updateWG(1 / 60);
  const st = WGS.world.meta.stats; return [!!K.done, K.isNew, st.signs === 1 << K.n, st.signN === K.night]; })()`);
ok(r.every(Boolean), 'the sign is found and charted: ' + JSON.stringify(r));
await g.ev(`WGS.gaze.done -= 2; 0`); await sleep(250); console.log('found', await g.shot('wg_gaze_found.png'));
r = await g.ev(`(() => { const K = WGS.gaze; Input.lastAim = 'keys'; K.cx = 0; K.cy = 0; Input.down.ArrowRight = true; for (let i = 0; i < 30; i++) updateWG(1 / 60); Input.down.ArrowRight = false;
  const moved = Math.round(K.cx); for (let i = 0; i < 200; i++) { Input.down.ArrowRight = true; updateWG(1 / 60); } Input.down.ArrowRight = false; return [moved, Math.round(Math.hypot(K.cx, K.cy)), WG_GAZE_R - 4]; })()`);
ok(r[0] > 40 && r[1] <= r[2], 'the arrows move the view, the rim holds it: ' + JSON.stringify(r));
await g.press('Escape'); await sleep(150);
r = await g.ev(`(() => { const w = WGS.world, p = WGS.p, x = Math.floor(p.x / 16) + 1, y = Math.floor(p.y / 16), res = {};
  res.closed = WGS.scr; wgUse(x, y); res.again = [WGS.scr, !!WGS.gaze.done, WGS.gaze.isNew, WGS.gaze.lit.every(Boolean)]; wgGazeClose();
  wgUse(x + 1, y); res.chart = [WGS.scr, WGS.gaze && WGS.gaze.mode];
  w.meta.stats.signs = 254; wgAchTick(); res.not = !!w.meta.ach.gaze; w.meta.stats.signs = 255; wgAchTick(); res.star = !!w.meta.ach.gaze;
  return res; })()`);
ok(r.closed === 'play' && r.again[0] === 'gaze' && r.again[1] && !r.again[2] && r.again[3], 'Escape closes; a second look that night finds it whole: ' + JSON.stringify([r.closed, r.again]));
ok(r.chart[0] === 'gaze' && r.chart[1] === 'chart' && !r.not && r.star, 'the chart opens; STARGAZER: ' + JSON.stringify([r.chart, r.not, r.star]));
await g.ev(`WGS.world.meta.stats.signs = 0b10110101; 0`); await sleep(250); console.log('chart', await g.shot('wg_gaze_chart.png'));
r = await g.ev(`wgTipLines({ id: 'telescope', n: 1 }).concat(wgTipLines({ id: 'star_chart', n: 1 }))`);
ok(r.includes('USE IT AT NIGHT TO WATCH THE STARS') && r.includes('SHOWS THE STAR SIGNS YOU FOUND'), 'tips: ' + JSON.stringify(r));
r = await g.ev(`(() => { const bad = [], a = []; for (const lang of ['en', 'hu']) { Save.settings.lang = lang;
  for (const [n] of WG_SIGNS) { if (textW(n, 0) > 62) bad.push(lang + ' cell ' + tr(n)); if (textW(n, 2) > 280) bad.push(lang + ' cell ' + tr(n)); if (lang === 'hu') a.push(tr(n)); }
  for (const s of ['FIND THE BRIGHT STARS']) if (textW(s, 1) > 290) bad.push(lang + ' ' + tr(s));
  for (const s of ['MAKE A WISH...', 'A NEW STAR SIGN!', 'IT IS ON YOUR CHART']) if (textW(s, 1) > 150) bad.push(lang + ' ' + tr(s));
  if (textW('STAR SIGNS 8/8', 1) > 250) bad.push(lang + ' count'); }
  Save.settings.lang = 'hu'; a.push(tr('STAR SIGNS 3/8'), tr(OBJ[O_ID.telescope].name), tr(OBJ[O_ID.star_chart].name), tr('STARGAZER'), tr('TOO CLOUDY TONIGHT')); Save.settings.lang = 'en'; return [bad, a]; })()`);
ok(!r[0].length, 'everything fits: ' + JSON.stringify(r[0]));
ok(r[1].every((s, i) => s !== ['FROG', 'TEAPOT', 'KITE', 'WHALE', 'ACORN', 'LANTERN', 'CAT', 'CROWN', 'STAR SIGNS 3/8', 'TELESCOPE', 'STAR CHART', 'STARGAZER', 'TOO CLOUDY TONIGHT'][i]), 'Hungarian: ' + JSON.stringify(r[1]));
await g.ev(`Save.settings.lang = 'hu'; 0`); await sleep(250); console.log('hu', await g.shot('wg_gaze_chart_hu.png'));
await g.ev(`Save.settings.lang = 'en'; wgGazeClose(); 0`);
// a look: the telescope and the chart in a garden at night
await g.ev(`(() => { const w = WGS.world, d = WGS.dim, p = WGS.p, x0 = Math.floor(p.x / 16) - 3, y0 = Math.floor(p.y / 16) - 2;
  for (let j = -2; j < 5; j++) for (let i = -2; i < 9; i++) { wgSetObj(w, d, x0 + i, y0 + j, 0); wgSetGround(w, d, x0 + i, y0 + j, G_ID.grass); }
  wgSetObj(w, d, x0 + 2, y0 + 1, O_ID.telescope); wgSetObj(w, d, x0 + 4, y0 + 1, O_ID.star_chart);
  p.x = (x0 + 3) * 16 + 8; p.y = (y0 + 2) * 16 + 12; WGS.cam.x = (x0 + 3) * 16; WGS.cam.y = (y0 + 1) * 16; WGS.toast = null; WGS.weather = null; WGS.clock = 0.3; })(); 0`);
await sleep(400); console.log('yard', await g.shot('wg_gaze_yard.png'));
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'GAZE OK' : 'GAZE FAIL'); g.close(); process.exit(pass ? 0 : 1);
