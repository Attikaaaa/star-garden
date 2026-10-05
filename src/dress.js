'use strict';
// Floor dressing: edge tufts and a few small decals, baked into the room's
// static layer by renderRoomStatic (so it costs nothing per frame). Everything is hashed from
// room.seed, so every screen agrees, and it only lands on plain floor outside the door lanes:
// it never blocks anything and stays low-contrast behind bullets.
// Art rows: `.` clear, `1`-`9` the land's tile slots (palette.js THEMES), any other char a PAL key.
const stone = (hi, mid, lo) => ['.000.', '0' + hi + mid + lo + '0', '.000.'];
const DECALS = {
  tuft: { art: ['.3..3.3.', '31.313.3', '.1.1.1.1', '..1...1.'].map(r => r.slice(0, 7)) },
  clover: { art: ['.G.G.', 'GhGhG', '.GgG.', '..g..'] },
  mush: { sh: 1, art: ['..000..', '.0RwR0.', '0RrrwR0', '.00s00.', '..0s0..'] },
  bed: { art: ['..P...w..y.', '.PyP.wyw.yRy', '..g...g..g.', '.gGg.gGg.gGg', '..g...g..g.'].map(r => r.slice(0, 10)) },
  tulip: { art: ['.r.r.', 'rRrRr', '.g.g.', 'gGggG'] },
  fern: { art: ['G..G..G', '.GgGgG.', '..GgG..', '...g...'] },
  daisy: { art: ['.w.w.', 'wywyw', '.w.w.', '..g..', '.gGg.'] },
  bell: { art: ['.B.', 'BcB', '.b.', '.g.'] },
  stone: { sh: 1, art: stone('l', 'm', 'd') },
  sandst: { sh: 1, art: stone('A', 'a', 'e') },
  shell: { sh: 1, art: ['.0000.', '0qwqP0', '0PqPp0', '.0pp0.'] },
  star: { sh: 1, art: ['..0..', '.0O0.', '0OoO0', '.0o0.', '0.0.0'] },
  shard: { sh: 1, art: ['..0..', '.0C0.', '0CcB0', '0cBb0', '.000.'] },
  leaf: { art: ['.o.', 'OoO', '.n.'] },
  twig: { art: ['n....', '.nn..', '...nn'] },
  lump: { sh: 1, art: ['.0000.', '0wwwC0', '0wCCC0', '.0000.'] },
  ripple: { art: ['ee...ee', '.eeee..'] },
  scrap: { art: ['.0000', '0LLl0', '0lLl0', '.0000'] },
  crayon: { sh: 1, art: ['0rrrR0', '0RRRR0'] },
  coal: { sh: 1, art: ['.000.', '0XXx0', '0xxx0', '.000.'] },
  crack: { art: ['o..', '.oO', '..o'] },
  crater: { art: ['.dmm.', 'dm..m', '.mdd.'] },
  weed: { art: ['.g.g.', 'gTgTg', '.g.g.'] },
};
const DRESS = {
  meadow: { tuft: 1, path: ['e', 'a', 'A'], n: 12, decals: ['clover', 'mush', 'stone', 'bell', 'bell', 'daisy', 'bed', 'bed', 'tulip', 'fern'] },
  beach: { path: ['e', 'A', 'a'], n: 6, decals: ['shell', 'shell', 'star', 'sandst'] },
  crystal: { path: ['d', 'm', 'l'], n: 6, decals: ['shard', 'shard', 'stone'] },
  lantern: { tuft: 1, path: ['u', 'n', 'N'], n: 7, decals: ['leaf', 'leaf', 'leaf', 'twig', 'mush', 'stone'] },
  snow: { path: ['m', 'l', 'L'], n: 6, decals: ['lump', 'lump', 'shard', 'stone'] },
  sun: { path: ['e', 'A', 'a'], n: 6, decals: ['ripple', 'ripple', 'sandst', 'sandst'] },
  library: { n: 6, decals: ['scrap', 'scrap', 'crayon'] },
  forge: { n: 6, decals: ['coal', 'coal', 'crack', 'crack'] },
  deep: { n: 6, decals: ['weed', 'weed', 'shell', 'stone'] },
  moon: { tuft: 1, path: ['d', 'm', 'l'], n: 6, decals: ['crater', 'crater', 'tuft', 'star'] },
};

function dressFloor(g, room, theme) {
  const D = DRESS[theme], th = THEMES[theme];
  if (!D || room.type === 'boss' && !D.tone) return;
  let n = 0;
  const R = (lo, hi) => lo + hash(n++, 0x6d2b, room.seed) % (hi - lo + 1);
  const free = (px, py) => {
    const c = px >> 4, r = (py - OY) >> 4;
    return c >= 1 && c <= 22 && r >= 2 && r <= 11 && room.tiles[r * COLS + c] === T_FLOOR &&
      !(c >= 9 && c <= 12 && (r <= 3 || r >= 10)) && !(r >= 5 && r <= 8 && (c <= 2 || c >= 21));
  };
  const col = (ch) => PAL[/[1-9]/.test(ch) ? th[ch] : ch];
  const art = (rows, x, y) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') { g.fillStyle = col(row[i]); g.fillRect(x + i, y + j, 1, 1); } });
  if (D.tuft) for (let k = 0; k < 24; k++) { // grass leaning in from the walls
    const side = R(0, 3), t = R(0, 1000) / 1000;
    const x = side < 2 ? Math.round(24 + t * 336) : side === 2 ? 17 : 361, y = side === 0 ? OY + 34 : side === 1 ? OY + 186 : OY + 36 + Math.round(t * 140);
    if (free(x + 2, y)) art(DECALS.tuft.art, x, y - 2);
  }
  if (D.path) { // a worn trail from every door to a small crossing in the middle, under rocks and pits
    const pts = [], ends = { u: [192, OY + 32], d: [192, OY + 192], l: [16, OY + 104], r: [368, OY + 104] }, ph = R(0, 628) / 100;
    const open = Object.keys(room.doors || {}).filter(d => !hiddenDoor(room, d));
    for (const d of open.length ? open : ['u', 'd']) {
      const [x0, y0] = ends[d], hor = d === 'l' || d === 'r', len = hor ? Math.abs(192 - x0) : Math.abs(OY + 104 - y0);
      for (let i = 0; i <= len; i++) {
        const t = i / len, w = Math.round(Math.sin(ph + t * 5) * 5 * Math.min(1, (1 - t) * 4));
        pts.push(hor ? [x0 + (d === 'l' ? i : -i), y0 + w] : [x0 + w, y0 + (d === 'u' ? i : -i)]);
      }
    }
    g.save(); g.beginPath(); // only over plain ground: never into a wall, a pond or a crystal
    for (let r = 2; r <= 11; r++) for (let c = 1; c <= 22; c++) { const t = room.tiles[r * COLS + c]; if (t === T_FLOOR || t === T_ROCK || t === T_BRK) g.rect(c * 16, OY + r * 16, 16, 16); }
    g.clip();
    const fill = (w, c) => { g.fillStyle = col(c); for (const [x, y] of pts) g.fillRect(x - w / 2, y - w / 2, w, w); for (let y = -w; y <= w; y++) { const hw = Math.round(w * 1.15 * Math.sqrt(1 - (y / w) ** 2)); g.fillRect(192 - hw, OY + 104 + y, hw * 2, 1); } };
    fill(15, D.path[0]); fill(13, D.path[1]);
    g.fillStyle = col(D.path[2]);
    for (const [x, y] of pts) if (hash(x, y, room.seed) % 9 === 0) g.fillRect(x - 5 + hash(y, x, 3) % 10, y - 5 + hash(x, y, 5) % 10, 1, 1);
    g.restore();
  }
  const placed = [];
  for (let k = 0, tries = 0; k < (room.type === 'boss' ? 3 : D.n) && tries < 60; tries++) {
    const d = DECALS[D.decals[R(0, D.decals.length - 1)]], w = d.art[0].length, h = d.art.length;
    const x = R(20, 360 - w), y = R(OY + 38, OY + 186 - h);
    if (!free(x, y) || !free(x + w, y) || !free(x, y + h) || !free(x + w, y + h) || placed.some(p => Math.abs(p[0] - x) < 24 && Math.abs(p[1] - y) < 14)) continue;
    placed.push([x, y]); k++;
    if (d.sh) { g.fillStyle = SHADOW; g.fillRect(x + 1, y + h, w - 1, 1); }
    art(d.art, x, y);
  }
}
