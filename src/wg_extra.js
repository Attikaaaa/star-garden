'use strict';
// Wildgrove: the decoration pack. Things to build the place you want: lamp posts, statues, banners, hay, planters,
// a couch, a clock, a fountain, hedges, tombstones, a cauldron and a trophy. New ids are appended, so old worlds stay valid.
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'pick', hp: 5, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id;
    wgRec(id, rec[0], rec[1], at);
  };
  wgDefGround('void', { name: 'THE SKY', pri: 0, void: 1, ramp: ['b', 'B', 'c', 'C'] });
  wgDefGround('cloud', { name: 'CLOUD', pri: 6, ramp: ['c', 'C', 'L', 'w'], step: 'snow' });
  wgObj('cloud_stairs', { name: 'CLOUD STAIRS', kind: 'stairs', solid: 0, tool: 'pick', hp: 8, sky: 1, light: 40, drops: [DR('cloud_stairs', 1, 1)] });
  wgItem('cloud_stairs', 'CLOUD STAIRS', 'place', { place: 'cloud_stairs' }); PLACE.cloud_stairs = 'cloud_stairs';
  wgRec('cloud_stairs', 1, { star_bar: 3, crystal: 2, feather: 4 }, 'anvil');
  wgObj('cloud_back', { name: 'WAY DOWN', kind: 'stairs', solid: 0, hp: 99999, skyup: 1, light: 40 });
  for (const [id, name, drop] of [['driftwood', 'DRIFTWOOD', 'wood'], ['starfish', 'STARFISH', 'shell'], ['beachgrass', 'BEACH GRASS', 'fiber']]) wgObj(id, { name, kind: 'plant', solid: 0, hp: 1, drops: [DR(drop, 1, 1)] });
  for (const [id, name, drop, tool] of [['fallen_log', 'FALLEN LOG', 'wood', 'axe'], ['frostbush', 'FROST BUSH', 'stick'], ['snowdrift', 'SNOWDRIFT', 'fiber']]) if (!OBJ[id]) wgObj(id, tool ? { name, kind: 'plant', solid: 1, tool, hp: 3, drops: [DR(drop, 1, 2)] } : { name, kind: 'plant', solid: 0, hp: 1, drops: [DR(drop, 1, 1)] });
  BIOMES.forest.veg.push(['fallen_log', 1.1]); BIOMES.snow.veg.push(['frostbush', 1.6], ['snowdrift', 1.4]);
  Object.assign(BIOMES.beach, { dens: 0.17 }); Object.assign(BIOMES.desert, { dens: 0.12 }); Object.assign(BIOMES.meadow, { dens: 0.18 }); Object.assign(BIOMES.snow, { dens: 0.18 }); BIOMES.beach.veg.push(['driftwood', 1.4], ['starfish', 1.1], ['beachgrass', 5], ['palm', 1.5]);
  dec('beehive', 'BEEHIVE', { kind: 'hive', tick: 1, tool: 'axe', hp: 4 }, [1, { wood: 6, fiber: 4 }], 'bench');
  dec('sprinkler', 'SPRINKLER', { kind: 'sprinkler', tick: 1, hp: 4, anim: 1 }, [1, { copper: 3, glass: 1 }], 'anvil');
  dec('lamppost', 'LAMP POST', { kind: 'light', light: 120, hp: 6 }, [1, { iron: 2, glass: 1, torch: 1 }], 'anvil');
  dec('statue', 'STATUE', { hp: 12 }, [1, { stone: 8, crystal: 1 }], 'bench');
  dec('banner', 'RED BANNER', { tool: 'axe', solid: 0, hp: 3 }, [1, { wool: 3, stick: 2, petal_r: 1 }], 'loom');
  dec('banner_b', 'BLUE BANNER', { tool: 'axe', solid: 0, hp: 3 }, [1, { wool: 3, stick: 2, petal_b: 1 }], 'loom');
  dec('hay', 'HAY BALE', { tool: 'axe', hp: 3 }, [1, { wheat: 4 }], 'hand');
  dec('planter', 'PLANTER', { tool: 'hand', hp: 2, solid: 0 }, [1, { clay: 2, petal_r: 1, petal_y: 1 }], 'bench');
  dec('mailbox', 'MAILBOX', { hp: 4 }, [1, { iron: 2, wood: 3 }], 'anvil');
  dec('couch', 'COUCH', { tool: 'axe', solid: 0, hp: 5 }, [1, { wood: 4, wool: 4 }], 'loom');
  dec('clock', 'GRANDFATHER CLOCK', { tool: 'axe', hp: 6 }, [1, { wood: 6, iron: 1, glass: 1 }], 'bench');
  dec('fountain', 'FOUNTAIN', { hp: 12, anim: 1 }, [1, { stone: 10, crystal: 1 }], 'bench');
  dec('hedge', 'HEDGE', { tool: 'axe', hp: 3 }, [2, { fiber: 6 }], 'hand');
  dec('tombstone', 'TOMBSTONE', { hp: 6 }, [1, { stone: 4 }], 'bench');
  dec('cauldron', 'CAULDRON', { hp: 8, anim: 1 }, [1, { iron: 4, slime: 1 }], 'anvil');
  dec('trophy', 'TROPHY', { hp: 6 }, [1, { star_bar: 2, stone: 2 }], 'anvil');
})();

// ---------- the sky: floating islands high above the world, reached by cloud stairs ----------
function wgSkyLoot(h) {
  const t = ['crystal', 'star_ore', 'feather', 'apple', 'honey', 'pearl', 'glow_berry', 'star_bar'], out = [];
  for (let i = 0; i < 4 + h % 3; i++) { const it = t[hash(i, h, 17) % t.length]; out.push({ id: it, n: 1 + hash(i, h, 19) % (it === 'star_bar' ? 2 : 4) }); }
  if (hash(5, h, 3) % 4 === 0) out.push({ id: ['wand_star', 'longbow', 'head_star', 'body_star', 'feet_star'][hash(2, h, 5) % 5], n: 1 });
  return out;
}
function wgGenSky(seed, ch) {
  const CS = WG.CS, X0 = ch.cx * CS, Y0 = ch.cy * CS;
  for (let j = 0; j < CS; j++) for (let i = 0; i < CS; i++) {
    const x = X0 + i, y = Y0 + j, k = j * CS + i, n = WGW.f(seed + 81, x / 17, y / 17, 3) + WGW.n(seed + 82, x / 4, y / 4) * 0.06;
    if (n < 0.02) { ch.g[k] = G_ID.void; continue; }
    if (n < 0.1) { ch.g[k] = G_ID.cloud; continue; }
    ch.g[k] = G_ID.grass;
    if (n < 0.16) continue;
    const r = hash(x, y, seed + 83) % 1000;
    ch.o[k] = r < 3 ? O_ID.ruin_chest : r < 50 ? O_ID.oak : r < 80 ? O_ID.birch : r < 120 ? O_ID['flower_' + 'rybwp'[r % 5]] : r < 135 ? O_ID.boulder : r < 150 ? O_ID.berrybush : r < 156 ? O_ID.ore_star : r < 200 ? O_ID.tallgrass : 0;
    if (r < 3) ch.cont.set(k, wgSkyLoot(hash(x, y, seed + 84)));
  }
}
const wgSkyOk = (w, x, y) => GROUND[wgGround(w, 'k', x, y)].id === 'grass' && !wgObjAt(w, 'k', x, y);
function wgGoSky(tx, ty) {
  const w = WGS.world; w.meta.skyFrom = [tx, ty]; w.meta.stats = w.meta.stats || { kills: 0, far: 0 }; w.meta.stats.sky = 1;
  let best = null;
  for (let r = 0; r < 70 && !best; r++) { const n = Math.max(1, r * 6); for (let a = 0; a < n && !best; a++) { const t = a / n * 6.283, x = tx + Math.round(Math.cos(t) * r), y = ty + Math.round(Math.sin(t) * r); if (wgSkyOk(w, x, y) && wgSkyOk(w, x - 1, y + 1) && wgSkyOk(w, x, y + 1) && wgSkyOk(w, x + 1, y + 1)) best = [x, y]; } }
  best = best || [tx, ty];
  if (!wgObjAt(w, 'k', best[0], best[1]) || OBJ[wgObjAt(w, 'k', best[0], best[1])].id !== 'cloud_back') { wgSetGround(w, 'k', best[0], best[1], G_ID.grass); wgSetObj(w, 'k', best[0], best[1], O_ID.cloud_back); }
  wgGoDim('k', best[0], best[1]);
}
function wgLeaveSky() { const f = WGS.world.meta.skyFrom || [0, 0]; wgGoDim('o', f[0], f[1]); }
function wgFallFromSky() { wgHurtPlayer(3, WGS.p.x, WGS.p.y - 4); wgToast('YOU FELL THROUGH THE CLOUDS'); wgLeaveSky(); }
function wgDrawSkyBack(cx0, cy0) { // slow clouds drift past far below the islands
  const t = WGS.t, W = SCR.w, H = SCR.h, l = -SCR.ox, tp = -SCR.oy, night = wgNight(WGS.clock);
  ctx.fillStyle = 'rgba(47,79,196,0.3)'; ctx.fillRect(l, tp, W, Math.round(H * 0.34)); ctx.fillStyle = 'rgba(47,79,196,0.15)'; ctx.fillRect(l, tp + Math.round(H * 0.34), W, Math.round(H * 0.22));
  if (night > 0.4) for (let i = 0; i < 40; i++) { ctx.globalAlpha = (0.3 + 0.5 * Math.abs(Math.sin(t + i))) * Math.min(1, night); rect(Math.round(l + (i * 97.3) % W), Math.round(tp + (i * 53.7) % H), 1, 1, 'Y'); } ctx.globalAlpha = 1;
  for (let i = 0; i < 12; i++) {
    const sp = 3 + (i % 4) * 2, L = W + 140, x = (((i * 83 + t * sp - cx0 * (0.18 + 0.07 * (i % 3))) % L) + L) % L - 70, y = (i * 47 + 12 - cy0 * 0.1) % H, w = 26 + (i % 3) * 12;
    ctx.globalAlpha = 0.5; rect(Math.round(l + x), Math.round(tp + (y + H) % H), w, 5, 'w'); rect(Math.round(l + x + 5), Math.round(tp + (y + H) % H) - 3, w - 12, 4, 'w'); ctx.globalAlpha = 0.28; rect(Math.round(l + x + 3), Math.round(tp + (y + H) % H) + 5, w - 4, 2, 'C'); ctx.globalAlpha = 1;
  }
}
function wgSkyRim(g, x, y, N, E, S, W) { // the edge of an island: a bright lip on top, a rocky underside below
  if (N) wgRc(g, x, y, 16, 1, 'w'); if (E) wgRc(g, x + 15, y, 1, 16, 'C'); if (W) wgRc(g, x, y, 1, 16, 'C');
  if (S) { wgRc(g, x, y + 9, 16, 7, 'm'); wgRc(g, x, y + 9, 16, 1, 'l'); wgRc(g, x, y + 12, 16, 4, 'd'); wgRc(g, x, y + 15, 16, 1, '0'); for (const dx of [2, 7, 12]) { wgPx(g, x + dx, y + 13, 'X'); wgPx(g, x + dx + 1, y + 14, 'x'); } }
  if (N && W) g.clearRect(x, y, 1, 1); if (N && E) g.clearRect(x + 15, y, 1, 1); if (S && W) g.clearRect(x, y + 15, 1, 1); if (S && E) g.clearRect(x + 15, y + 15, 1, 1);
}

function wgBuildExtra() {
  wgReg('driftwood', [wgMake('driftwood', 16, 10, (g) => { wgLine(g, 1, 7, 14, 5, 'A'); wgLine(g, 1, 8, 14, 6, 'e'); wgLine(g, 2, 4, 12, 7, 'a'); wgLine(g, 2, 5, 12, 8, 'e'); wgPx(g, 14, 5, 'n'); wgPx(g, 1, 7, 'n'); wgPx(g, 6, 3, 'A'); wgPx(g, 7, 2, 'A'); wgPx(g, 7, 3, 'e'); })]);
  wgReg('fallen_log', [wgMake('fallen_log', 26, 12, (g) => { wgRc(g, 1, 3, 23, 7, '0'); wgRc(g, 2, 4, 21, 5, 'N'); wgRc(g, 2, 4, 21, 1, 'O'); wgRc(g, 2, 8, 21, 1, 'n'); for (const x of [6, 11, 17]) wgPx(g, x, 6, 'n'); wgRc(g, 0, 3, 3, 7, '0'); wgRc(g, 1, 4, 2, 5, 'a'); wgPx(g, 2, 6, 'e'); wgRc(g, 22, 3, 3, 7, '0'); wgRc(g, 22, 4, 2, 5, 'n'); wgPx(g, 8, 2, 'h'); wgPx(g, 9, 2, 'G'); wgPx(g, 15, 2, 'G'); })]);
  wgReg('frostbush', [0, 1].map(v => wgMake('frostbush' + v, 14, 12, (g) => { for (const [x, y, c] of [[3, 6, 'n'], [5, 4, 'n'], [7, 2, 'N'], [9, 4, 'n'], [11, 6, 'n'], [7, 6, 'n'], [7, 9, 'u']]) { wgPx(g, x, y, c); wgPx(g, x, y + 1, c); } for (const [x, y] of [[2, 5], [4, 3], [6, 1], [8, 1], [10, 3], [12, 5], [7, 5]]) { wgRc(g, x, y, 2, 1, 'w'); wgPx(g, x + (v ? 1 : 0), y - 1, 'C'); } })));
  wgReg('snowdrift', [0, 1].map(v => wgMake('snowdrift' + v, 20, 8, (g) => { for (let x = 0; x < 20; x++) { const h = Math.round(Math.sin((x + v * 4) / 19 * Math.PI) * (4 + v)); for (let y = 7 - h; y < 8; y++) wgPx(g, x, y, y === 7 - h ? 'w' : y > 5 ? 'm' : 'L'); } })));
  wgReg('starfish', [wgMake('starfish', 9, 9, (g) => { for (const [x, y] of [[4, 0], [4, 1], [4, 2], [0, 3], [1, 3], [2, 3], [6, 3], [7, 3], [8, 3], [3, 4], [4, 4], [5, 4], [2, 6], [1, 7], [6, 6], [7, 7], [3, 5], [5, 5], [4, 3]]) wgPx(g, x, y, (x + y) % 3 ? 'o' : 'O'); wgPx(g, 4, 3, 'Y'); wgPx(g, 4, 1, 'Y'); })]);
  wgReg('beachgrass', [0, 1].map(v => wgMake('beachgrass' + v, 12, 14, (g) => { for (const [x, h, lean] of [[3, 9, -1], [6, 12, 0], [9, 8, 1], [5, 7, -1], [7, 6, 1]]) for (let y = 0; y < h; y++) wgPx(g, x + Math.round(lean * y * 0.25 * (v ? -1 : 1)), 13 - y, y > h - 3 ? 'H' : y % 3 ? 'h' : 'G'); })));

  const W4 = ['u', 'n', 'N', 'O'], S4 = ['d', 'm', 'l', 'L'], one = (id, w, h, fn) => wgReg(id, [wgMake(id, w, h, fn)]), two = (id, w, h, fn) => { wgReg(id, [0, 1].map(v => wgMake(id + v, w, h, (g) => fn(g, v)))); OBJ[O_ID[id]].anim = 1; };
  const cloudSteps = (g, arrow) => { wgBlob(g, 8, 11, 7.4, 5, ['c', 'C', 'L', 'w']); for (let i = 0; i < 4; i++) { wgRc(g, 4 + i, 9 - i * 2, 8 - i * 2, 2, i % 2 ? 'L' : 'w'); wgRc(g, 4 + i, 10 - i * 2, 8 - i * 2, 1, 'C'); } wgPx(g, 8, 1, 'Y'); wgPx(g, 7, 2, 'y'); wgPx(g, 9, 2, 'y'); wgPx(g, 3, 13, 'w'); wgPx(g, 13, 12, 'w'); if (arrow) { wgRc(g, 7, 6, 2, 5, 'B'); wgRc(g, 5, 9, 6, 1, 'B'); wgRc(g, 6, 10, 4, 1, 'B'); wgRc(g, 7, 11, 2, 1, 'B'); } };
  one('cloud_stairs', 16, 18, (g) => cloudSteps(g, false)); one('cloud_back', 16, 18, (g) => cloudSteps(g, true));
  one('beehive', 14, 18, (g) => { wgRc(g, 2, 14, 10, 3, W4[0]); wgRc(g, 1, 9, 12, 5, 'a'); wgRc(g, 2, 5, 10, 4, 'a'); wgRc(g, 4, 2, 6, 3, 'a'); for (const [y, w] of [[2, 6], [5, 10], [9, 12]]) { wgRc(g, 7 - w / 2, y, w, 1, 'A'); wgRc(g, 7 - w / 2, y + 2, w, 1, 'e'); } wgRc(g, 5, 11, 4, 3, 'x'); wgPx(g, 6, 12, 'y'); wgPx(g, 11, 6, '0'); wgPx(g, 12, 6, 'y'); wgPx(g, 3, 4, 'y'); wgPx(g, 3, 3, 'w'); });
  two('sprinkler', 12, 16, (g, v) => { wgRc(g, 5, 8, 2, 8, 'm'); wgRc(g, 5, 8, 1, 8, 'l'); wgRc(g, 3, 14, 6, 2, 'd'); wgBlob(g, 6, 6, 3, 2.4, ['d', 'm', 'l', 'L']); for (const [x, y] of v ? [[1, 3], [10, 4], [3, 1], [8, 0], [6, 1]] : [[0, 5], [11, 6], [2, 2], [9, 1], [6, 0]]) wgPx(g, x, y, 'C'); });
  one('lamppost', 12, 30, (g) => { wgRc(g, 5, 8, 2, 21, 'X'); wgRc(g, 5, 8, 1, 21, 'm'); wgRc(g, 3, 27, 6, 3, 'x'); wgRc(g, 4, 26, 4, 1, 'X'); wgRc(g, 2, 1, 8, 2, 'x'); wgRc(g, 3, 0, 6, 1, 'X'); wgRc(g, 2, 3, 8, 6, 'Y'); wgRc(g, 3, 4, 6, 4, 'y'); wgRc(g, 4, 5, 2, 2, 'w'); wgRc(g, 2, 3, 1, 6, 'x'); wgRc(g, 9, 3, 1, 6, 'x'); wgRc(g, 2, 9, 8, 1, 'x'); });
  one('statue', 14, 28, (g) => { wgRc(g, 1, 22, 12, 6, S4[1]); wgRc(g, 1, 22, 12, 1, S4[3]); wgRc(g, 1, 26, 12, 2, S4[0]); wgRc(g, 3, 20, 8, 2, S4[2]); wgRc(g, 4, 10, 6, 10, S4[1]); wgRc(g, 4, 10, 2, 10, S4[2]); wgRc(g, 9, 11, 1, 9, S4[0]); wgRc(g, 2, 11, 2, 7, S4[1]); wgRc(g, 10, 11, 2, 7, S4[0]); wgBlob(g, 7, 6, 3.2, 3.4, S4); wgPx(g, 6, 6, '0'); wgPx(g, 8, 6, '0'); wgRc(g, 6, 12, 2, 2, 'y'); wgPx(g, 6, 12, 'Y'); wgRc(g, 6, 0, 2, 1, 'y'); wgPx(g, 7, 0, 'Y'); });
  for (const [id, c] of [['banner', ['r', 'R', 'p', 'Y']], ['banner_b', ['b', 'B', 'c', 'Y']]]) one(id, 12, 26, (g) => { wgRc(g, 1, 1, 10, 2, W4[1]); wgRc(g, 1, 1, 10, 1, W4[3]); wgRc(g, 5, 3, 2, 22, W4[0]); wgRc(g, 2, 3, 8, 14, c[1]); wgRc(g, 2, 3, 8, 1, c[2]); wgRc(g, 2, 3, 1, 14, c[2]); wgRc(g, 9, 4, 1, 13, c[0]); wgPx(g, 3, 17, c[1]); wgPx(g, 4, 18, c[1]); wgPx(g, 5, 19, c[1]); wgPx(g, 7, 17, c[1]); wgPx(g, 6, 18, c[1]); wgRc(g, 5, 7, 2, 6, c[3]); wgRc(g, 4, 9, 4, 2, c[3]); wgRc(g, 3, 24, 6, 2, W4[0]); });
  one('hay', 16, 16, (g) => { wgRc(g, 1, 3, 14, 12, 'a'); wgRc(g, 1, 3, 14, 2, 'A'); wgRc(g, 1, 13, 14, 2, 'e'); wgRc(g, 1, 3, 2, 12, 'A'); wgRc(g, 13, 4, 2, 11, 'e'); for (const [x, y] of [[4, 6], [8, 8], [10, 5], [6, 11], [11, 11], [3, 9]]) { wgRc(g, x, y, 3, 1, 'e'); wgPx(g, x + 1, y - 1, 'Y'); } wgRc(g, 5, 3, 1, 12, 'n'); wgRc(g, 10, 3, 1, 12, 'n'); });
  one('planter', 14, 16, (g) => { wgRc(g, 2, 9, 10, 6, 'n'); wgRc(g, 2, 9, 10, 2, 'N'); wgRc(g, 1, 8, 12, 2, 'O'); wgRc(g, 3, 14, 8, 1, 'u'); wgRc(g, 2, 11, 1, 3, 'O'); wgRc(g, 4, 6, 6, 3, 'g'); for (const [x, y, c] of [[3, 3, 'r'], [7, 1, 'y'], [10, 4, 'P'], [5, 5, 'w']]) { wgRc(g, x, y, 3, 3, c); wgPx(g, x + 1, y + 1, 'Y'); wgRc(g, x + 1, y + 3, 1, 3, 'g'); } });
  one('mailbox', 10, 20, (g) => { wgRc(g, 4, 9, 2, 11, W4[1]); wgRc(g, 4, 9, 1, 11, W4[2]); wgBlob(g, 5, 5, 4.2, 3.6, ['b', 'B', 'c', 'C']); wgRc(g, 1, 4, 8, 5, 'B'); wgRc(g, 1, 4, 8, 1, 'c'); wgRc(g, 3, 6, 4, 1, '0'); wgRc(g, 8, 0, 1, 4, 'r'); wgRc(g, 8, 0, 2, 2, 'R'); });
  one('couch', 18, 16, (g) => { wgRc(g, 1, 2, 16, 7, 'p'); wgRc(g, 1, 2, 16, 2, 'P'); wgRc(g, 0, 6, 3, 8, 'v'); wgRc(g, 15, 6, 3, 8, 'v'); wgRc(g, 0, 6, 3, 2, 'V'); wgRc(g, 15, 6, 3, 2, 'V'); wgRc(g, 3, 8, 12, 5, 'r'); wgRc(g, 3, 8, 12, 2, 'R'); wgRc(g, 9, 8, 1, 5, 'p'); wgRc(g, 2, 13, 2, 3, W4[0]); wgRc(g, 14, 13, 2, 3, W4[0]); wgRc(g, 4, 5, 3, 2, 'Y'); });
  one('clock', 12, 30, (g) => { wgRc(g, 1, 4, 10, 25, W4[1]); wgRc(g, 1, 4, 2, 25, W4[2]); wgRc(g, 9, 5, 2, 24, W4[0]); wgRc(g, 0, 2, 12, 3, W4[2]); wgRc(g, 0, 2, 12, 1, W4[3]); wgRc(g, 3, 0, 6, 3, W4[2]); wgBlob(g, 6, 9, 3.8, 3.8, ['x', 'A', 'A', 'w']); wgPx(g, 6, 8, '0'); wgRc(g, 6, 9, 3, 1, '0'); wgRc(g, 3, 15, 6, 11, 'x'); wgRc(g, 4, 16, 4, 9, 'd'); wgRc(g, 5, 20, 2, 2, 'y'); wgPx(g, 5, 20, 'Y'); wgRc(g, 1, 28, 10, 2, W4[0]); });
  two('fountain', 20, 22, (g, v) => { wgBlob(g, 10, 17, 9, 4, S4); wgBlob(g, 10, 16, 7, 3, ['b', 'B', 'c', 'C']); wgRc(g, 9, 6, 2, 11, S4[1]); wgBlob(g, 10, 8, 4, 2, S4); wgBlob(g, 10, 7, 3, 1.4, ['B', 'c', 'C', 'w']); for (const [x, y] of v ? [[10, 2], [8, 3], [12, 3], [6, 5], [14, 5], [10, 4]] : [[10, 3], [7, 4], [13, 4], [6, 6], [14, 6], [10, 1]]) wgPx(g, x, y, y < 5 ? 'C' : 'w'); wgPx(g, 5 + v, 15, 'w'); wgPx(g, 14 - v, 17, 'C'); });
  one('hedge', 16, 20, (g) => { wgBlob(g, 8, 11, 8, 8, ['g', 'G', 'h', 'H']); wgBlob(g, 8, 8, 6, 5, ['G', 'h', 'H', 'H']); for (const [x, y] of [[3, 6], [10, 4], [12, 10], [5, 12], [8, 8], [2, 11]]) { wgPx(g, x, y, 'g'); wgPx(g, x + 1, y, 'H'); } wgPx(g, 11, 7, 'r'); wgPx(g, 4, 10, 'P'); wgRc(g, 4, 18, 8, 2, 'u'); });
  one('tombstone', 12, 18, (g) => { wgRc(g, 2, 5, 8, 12, S4[1]); wgBlob(g, 6, 5, 4, 3.4, S4); wgRc(g, 2, 5, 2, 12, S4[2]); wgRc(g, 8, 6, 2, 11, S4[0]); wgRc(g, 5, 4, 2, 7, S4[0]); wgRc(g, 3, 7, 6, 2, S4[0]); wgRc(g, 0, 16, 12, 2, S4[0]); wgPx(g, 1, 15, 'g'); wgPx(g, 9, 15, 'g'); wgPx(g, 10, 14, 'G'); });
  two('cauldron', 16, 16, (g, v) => { wgBlob(g, 8, 10, 6.4, 5, ['x', 'X', 'm', 'l']); wgRc(g, 2, 6, 12, 2, 'X'); wgBlob(g, 8, 6, 5, 1.8, ['g', 'G', 'h', 'H']); wgRc(g, 3, 14, 2, 2, 'x'); wgRc(g, 11, 14, 2, 2, 'x'); wgPx(g, 5 + v * 3, 4 - v, 'h'); wgPx(g, 9 - v * 2, 3 + v, 'H'); wgRc(g, 6, 12, 4, 1, 'x'); });
  one('trophy', 12, 22, (g) => { wgRc(g, 1, 17, 10, 5, S4[1]); wgRc(g, 1, 17, 10, 1, S4[3]); wgRc(g, 3, 15, 6, 2, S4[2]); wgRc(g, 5, 11, 2, 4, 'y'); wgRc(g, 2, 3, 8, 8, 'y'); wgRc(g, 2, 3, 8, 1, 'Y'); wgRc(g, 2, 3, 2, 8, 'Y'); wgRc(g, 8, 4, 2, 7, 'o'); wgRc(g, 0, 4, 2, 4, 'y'); wgRc(g, 10, 4, 2, 4, 'o'); wgPx(g, 5, 6, 'w'); wgRc(g, 5, 5, 2, 4, 'w'); wgRc(g, 4, 6, 4, 2, 'w'); });
}
const _wgBuildAll0 = wgBuildAll;
wgBuildAll = function () { _wgBuildAll0(); wgBuildExtra(); };
