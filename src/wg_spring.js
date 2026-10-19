'use strict';
// Wildgrove: hot springs. Here and there in the snow and the highlands a small warm pool steams among pebbles: one
// chunk in `WG_SPRING_N` of those lands has one (`wgSpringOf`: from the seed and the land alone, cached by chunk), laid
// into the chunk as it is made by a `wgGenOver` wrapper, so every screen has the same. Bubbles rise in it (drawn on the
// water by a `wgChunkUpkeep` wrapper) and steam curls up from it (a `wgDrawAmbient` wrapper), while its middle is
// still water. Wading in it heals a heart every `WG_SPRING_HEAL` s while there is food in you, like a seat. The HOT
// SPRING star.
const WG_SPRING_N = 9, WG_SPRING_HEAL = 2.5, WG_SPRING_BIOMES = ['snow', 'highland', 'mountain'];
const WG_SPRING_POOL = ['.####.', '######', '######', '.####.']; // the pool, 6 by 4, its middle tile the third of the second row
const WGHS = { cache: new Map(), seed: null, t: 0, warm: false }; // springs by chunk; the heal clock
function wgSpringOf(seed, cx, cy) { // a chunk's spring: its middle tile, or null
  if (WGHS.seed !== seed) { WGHS.seed = seed; WGHS.cache.clear(); }
  const key = cx + ',' + cy, C = WGHS.cache; if (C.has(key)) return C.get(key);
  const h = hash(cx, cy, seed * 7 + 6151), CS = WG.CS; let s = null;
  if (h % WG_SPRING_N === 0) {
    const x = cx * CS + 4 + (h >>> 8) % (CS - 8), y = cy * CS + 4 + (h >>> 16) % (CS - 8);
    if (WG_SPRING_BIOMES.includes(wgSurface(seed, x, y).b) && x * x + y * y >= 400) {
      s = { x, y };
      for (let j = -2; j <= 3 && s; j++) for (let i = -4; i <= 3; i++) if (GROUND[wgSurface(seed, x + i, y + j).g].liq) { s = null; break; }
    }
  }
  if (C.size > 2000) C.clear(); C.set(key, s); return s;
}
const wgSpringPool = (i, j) => j >= -1 && j <= 2 && i >= -3 && i <= 2 && WG_SPRING_POOL[j + 1][i + 3] === '#';
const _wgGenSpring = wgGenOver;
wgGenOver = function (seed, ch) {
  _wgGenSpring(seed, ch);
  const S = wgSpringOf(seed, ch.cx, ch.cy); if (!S) return;
  const CS = WG.CS, h = hash(S.x, S.y, seed + 61), at = (i, j) => (S.y + j - ch.cy * CS) * CS + (S.x + i - ch.cx * CS);
  for (let j = -2; j <= 3; j++) for (let i = -4; i <= 3; i++) { // only over wild land: never over stairs, a house or a path
    const k = at(i, j), o = ch.o[k] && OBJ[ch.o[k]];
    if ((o && !['tree', 'plant', 'rock'].includes(o.kind)) || ch.g[k] !== wgSurface(seed, S.x + i, S.y + j).g) return;
  }
  for (let j = -2; j <= 3; j++) for (let i = -4; i <= 3; i++) {
    const k = at(i, j);
    ch.o[k] = 0;
    if (wgSpringPool(i, j)) ch.g[k] = G_ID.shallow;
    else if (hash(i + 4, j + 2, h) % 3 === 0) ch.o[k] = O_ID.pebbles; // pebbles round its rim
  }
  for (let j = 4; j <= 5; j++) for (let i = -4; i <= 3; i++) { const y = S.y + j - ch.cy * CS, k = at(i, j), o = y < CS && ch.o[k] && OBJ[ch.o[k]]; if (o && o.kind === 'tree') ch.o[k] = 0; } // no crown over the water
};
function wgSpringAt(x, y) { // is this world spot in a hot spring's water (outdoors)
  const w = WGS.world, CS = WG.CS, tx = Math.floor(x / 16), ty = Math.floor(y / 16), S = wgSpringOf(w.seed, Math.floor(tx / CS), Math.floor(ty / CS));
  return !!(S && wgSpringPool(tx - S.x, ty - S.y) && GROUND[wgGround(w, 'o', tx, ty)].liq === 'water' && GROUND[wgGround(w, 'o', S.x, S.y)].liq === 'water'); // its middle too: a spring the land had no room for is none
}
const _wgUpdSpring = updateWG;
updateWG = function (dt) { // a warm soak: a heart back every few seconds, like a seat
  _wgUpdSpring(dt);
  const w = WGS.world, p = WGS.p; if (!w || !p || WGS.scr !== 'play' || WGS.dim !== 'o' || p.hidden || p.hp <= 0) { WGHS.warm = false; return; }
  if (!wgSpringAt(p.x, p.y)) { WGHS.warm = false; WGHS.t = 0; return; }
  if (!WGHS.warm) { WGHS.warm = true; wgToast('NICE AND WARM', 2); const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.spring = 1; }
  if ((WGHS.t += dt) >= WG_SPRING_HEAL) { WGHS.t = 0; if (p.hp < p.maxHp && p.food > 0) { p.hp++; wgPart(p.x, p.y - 20, 3, { c: ['h', 'H', 'w'], s: 8, up: 16, life: 0.7 }); } }
};
(function () { WG_ACH.push(['spring', 'HOT SPRING', 'SOAK IN A HOT SPRING', (c) => c.st.spring]); })();
function wgSpringsInView(cb) { // each spring in view whose middle is still water, with its middle tile's top left on screen
  const w = WGS.world, CS = WG.CS, cx0 = Math.round(WGS.cam.x) - VW / 2, cy0 = Math.round(WGS.cam.y) - VH / 2, L = cx0 - SCR.ox, T = cy0 - SCR.oy;
  for (let cy = Math.floor((T - 64) / 16 / CS); cy <= Math.floor((T + SCR.h + 64) / 16 / CS); cy++) for (let cx = Math.floor((L - 64) / 16 / CS); cx <= Math.floor((L + SCR.w + 64) / 16 / CS); cx++) {
    const S = wgSpringOf(w.seed, cx, cy); if (S && GROUND[wgGround(w, 'o', S.x, S.y)].liq === 'water') cb(S, S.x * 16 - cx0, S.y * 16 - cy0);
  }
}
function wgSpringSpot(S, k, i) { // a spot in the pool's water for a bubble or a wisp, from a hash
  const h = hash(S.x + k * 13, S.y + i * 7, 811); let n = h % 20; // twenty water tiles
  for (let j = -1; j <= 2; j++) for (let c = -3; c <= 2; c++) if (wgSpringPool(c, j) && n-- === 0) return [c * 16 + 3 + (h >>> 8) % 10, j * 16 + 3 + (h >>> 12) % 10];
  return [0, 0];
}
const _wgUpkeepSpring = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) { // bubbles coming up through the warm water
  _wgUpkeepSpring(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world) return;
  const T = WGS.t;
  wgSpringsInView((S, sx, sy) => {
    for (let i = 0; i < 4; i++) {
      const life = 1.4, t = T + i * life / 4, u = (t % life) / life, [dx, dy] = wgSpringSpot(S, Math.floor(t / life), i), x = sx + dx, y = sy + dy;
      if (GROUND[wgGround(w, 'o', S.x + Math.floor(dx / 16), S.y + Math.floor(dy / 16))].liq !== 'water') continue;
      if (u < 0.55) rect(x, y, 1, 1, 'C'); // a bead rising
      else if (u < 0.85) { rect(x, y - 1, 1, 1, 'w'); rect(x - 1, y, 1, 1, 'w'); rect(x + 1, y, 1, 1, 'w'); rect(x, y + 1, 1, 1, 'C'); } // a bubble on the top
      else { rect(x - 2, y, 1, 1, 'C'); rect(x + 2, y, 1, 1, 'C'); } // popped
    }
  });
};
const _wgAmbSpring = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) { // steam curling up, thicker on a cold night; shaded underneath so it shows on snow
  _wgAmbSpring(cx0, cy0);
  if (WGS.dim !== 'o' || !WGS.world) return;
  const T = WGS.t, n = wgNight(WGS.clock) > 0.5 ? 14 : 10;
  wgSpringsInView((S, sx, sy) => {
    for (let i = 0; i < n; i++) {
      const life = 2.6, t = T + i * life / n, u = (t % life) / life, [dx, dy] = wgSpringSpot(S, Math.floor(t / life) + 50, i);
      const x = Math.round(sx + dx + Math.sin(u * 5 + i) * 3), y = Math.round(sy + dy - 4 - u * 18), big = u > 0.45; // over the water mostly, where it shows
      ctx.globalAlpha = 0.65 * Math.sin(u * Math.PI);
      if (big) { rect(x - 2, y - 1, 5, 2, 'w'); rect(x - 1, y + 1, 3, 1, 'l'); } else { rect(x, y, 3, 1, 'w'); rect(x + 1, y + 1, 2, 1, 'l'); }
      ctx.globalAlpha = 1;
    }
  });
};
