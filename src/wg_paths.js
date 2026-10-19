'use strict';
// Wildgrove: the paths pack. Paths are quicker to walk than the wild ground, so a road between home, the fields and
// the mine pays for itself: the dug dirt path, gravel, cobblestones, stepping stones in the grass, and a boardwalk that
// can also be laid over shallow water as a little bridge. Floors indoors stay at a walk. Ground ids are appended, so
// old worlds stay valid.
const WG_PATHS = [ // item, ground, name, speed, recipe, made
  ['path_gravel', 'p_gravel', 'GRAVEL PATH', 1.2, { stone: 2, sand: 1 }, 6],
  ['path_cobble', 'p_cobble', 'COBBLESTONES', 1.25, { stone: 3, clay: 1 }, 6],
  ['path_steps', 'p_steps', 'STEPPING STONES', 1.15, { stone: 2 }, 4],
  ['boardwalk', 'p_board', 'BOARDWALK', 1.2, { wood: 3, stick: 1 }, 4],
];
(function () {
  GROUND[G_ID.path].speed = 1.15; // the dug path too
  const look = { p_gravel: [['e', 'a', 'A', 'L'], 'sand', 5], p_cobble: [['d', 'm', 'l', 'L'], 'stone', 5], p_steps: [['g', 'G', 'h', 'H'], 'stone', 6], p_board: [['u', 'n', 'N', 'O'], 'wood', 7] };
  for (const [id, gid, name, speed, rec, n] of WG_PATHS) {
    const [ramp, step, pri] = look[gid];
    wgDefGround(gid, { name, pri, ramp, speed, step, path: 1 });
    PLACE_G[id] = gid; wgItem(id, name, 'place', { place: null, placeG: gid }); wgRec(id, n, rec, 'bench');
  }
})();
// A boardwalk may go over shallow water: a bridge across a stream.
const _wgCanPlacePaths = wgCanPlaceAt;
wgCanPlaceAt = function (tx, ty, item) {
  if (item.placeG === 'p_board' && wgGroundAtT(tx, ty).id === 'shallow') return true;
  return _wgCanPlacePaths(tx, ty, item);
};
const _wgTipPaths = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipPaths(s), it = WGI[s.id];
  if (it && (it.placeG === 'path' || (it.placeG && GROUND[G_ID[it.placeG]].path))) L.push('QUICKER TO WALK ON');
  if (s.id === 'boardwalk') L.push('ALSO OVER SHALLOW WATER');
  return L;
};
// ---------- the ground art: each path its own tile, calm enough for what stands on it ----------
const _wgTexPaths = wgGroundTex;
wgGroundTex = function (gid, v, tone) {
  const gr = GROUND[gid]; if (!gr || !gr.path) return _wgTexPaths(gid, v, tone);
  const key = 'g' + gid + '_' + v + (tone ? 't' + tone : ''); if (WGA.cache[key]) return WGA.cache[key];
  const R = gr.ramp, rng = wgRng(gid * 131 + v * 17 + 7), [c, g] = wgCv(16, 16, true);
  const stone = (x, y, w, h, lo, mid, hi) => { // a rounded stone lit from the top left
    wgRc(g, x + 1, y, w - 2, h, mid); wgRc(g, x, y + 1, w, h - 2, mid);
    wgRc(g, x + 1, y + h - 1, w - 2, 1, lo); wgRc(g, x + w - 1, y + 1, 1, h - 2, lo); wgRc(g, x + 1, y, w - 2, 1, hi); wgRc(g, x, y + 1, 1, h - 2, hi);
  };
  switch (gr.id) {
    case 'p_gravel': // pale grey grit with small pebbles, lit from the top left
      wgRc(g, 0, 0, 16, 16, 'l');
      for (let i = 0; i < 7; i++) { const x = 1 + Math.floor(rng() * 14), y = 1 + Math.floor(rng() * 14); wgPx(g, x, y, i % 3 ? 'm' : 'd'); wgPx(g, x - 1, y - 1, 'L'); }
      for (let i = 0; i < 4; i++) wgPx(g, Math.floor(rng() * 16), Math.floor(rng() * 16), 'm');
      break;
    case 'p_cobble': { // rows of rounded cobbles of different widths, the joints dark, every row shifted
      wgRc(g, 0, 0, 16, 16, R[1]);
      for (const y of [0, 8]) { let x = -Math.floor(rng() * 5); while (x < 16) { const w = 6 + Math.floor(rng() * 3); stone(x, y, w - 1, 7, R[1], R[2], R[3]); wgRc(g, x + 1, y + 6, w - 3, 1, R[1]); x += w; } }
      break;
    }
    case 'p_steps': { // grass with one big flat stone, never in the same spot twice in a row
      wgRc(g, 0, 0, 16, 16, R[1]);
      const x = 2 + Math.floor(rng() * 3), y = 2 + Math.floor(rng() * 3), w = 9 + Math.floor(rng() * 3), h = 7 + Math.floor(rng() * 2);
      wgBlob(g, x + w / 2, y + h / 2 + 1, w / 2, h / 2, [R[0], R[0], R[0], R[0]]); // its shadow in the grass
      wgBlob(g, x + w / 2, y + h / 2, w / 2, h / 2, ['m', 'l', 'l', 'L']); wgPx(g, x + 3, y + 2, 'w');
      if (v === 3) { wgPx(g, 13, 13, 'l'); wgPx(g, 14, 13, 'm'); }
      break;
    }
    case 'p_board': { // planks running across, dark gaps, a joint somewhere on each
      wgRc(g, 0, 0, 16, 16, R[2]);
      for (let y = 0; y < 16; y += 4) {
        wgRc(g, 0, y + 3, 16, 1, R[0]); wgRc(g, 0, y, 16, 1, R[3]);
        const j = (v * 7 + y * 3) % 13 + 1; wgRc(g, j, y + 1, 1, 2, R[0]);
      }
      break;
    }
  }
  if (tone && gr.id === 'p_steps') { const x = 1 + Math.floor(rng() * 3), y = 12 + Math.floor(rng() * 2); wgRc(g, x, y, 2, 1, tone === 1 ? R[0] : R[2]); }
  WGA.cache[key] = c; return c;
};
