'use strict';
// Wildgrove art, part two: furniture, doors, the hero, and every item icon.
function wgBuildFurniture() {
  OBJ[O_ID.door].ramp = ['u', 'n', 'N', 'O']; OBJ[O_ID.irondoor].ramp = ['X', 'm', 'l', 'L'];
  const W4 = ['u', 'n', 'N', 'O'], S4 = ['d', 'm', 'l', 'L'];
  const one = (id, w, h, fn) => wgReg(id, [wgMake(id, w, h, fn)]);
  const box = (g, x, y, w, h, R) => { wgRc(g, x, y, w, h, R[1]); wgRc(g, x, y, w, 1, R[2]); wgRc(g, x, y, 1, h, R[2]); wgRc(g, x + w - 1, y + 1, 1, h - 1, R[0]); wgRc(g, x + 1, y + h - 1, w - 1, 1, R[0]); };
  const chest = (id, R, band) => one(id, 16, 14, (g) => { box(g, 1, 4, 14, 9, R); wgRc(g, 1, 2, 14, 3, R[2]); wgRc(g, 2, 1, 12, 1, R[3]); wgRc(g, 1, 6, 14, 1, R[0]); wgRc(g, 7, 2, 2, 11, band[1]); wgRc(g, 7, 2, 1, 11, band[3]); wgRc(g, 7, 7, 2, 3, 'y'); wgPx(g, 7, 7, 'Y'); });
  chest('chest', W4, ['d', 'm', 'l', 'L']); chest('ruin_chest', ['x', 'u', 'n', 'N'], ['e', 'a', 'A', 'w']);
  one('barrel', 14, 16, (g) => { wgBlob(g, 7, 3, 6, 2.4, W4); wgRc(g, 1, 4, 12, 10, W4[1]); wgRc(g, 1, 4, 3, 10, W4[2]); wgRc(g, 10, 4, 3, 10, W4[0]); for (const y of [6, 11]) { wgRc(g, 1, y, 12, 1, 'm'); wgRc(g, 1, y + 1, 12, 1, 'd'); } wgBlob(g, 7, 14, 6, 1.6, W4); wgRc(g, 4, 4, 1, 10, W4[0]); wgRc(g, 8, 4, 1, 10, W4[0]); });
  one('bench', 16, 16, (g) => { box(g, 0, 5, 16, 5, W4); wgRc(g, 1, 10, 2, 6, W4[0]); wgRc(g, 13, 10, 2, 6, W4[0]); wgRc(g, 1, 10, 1, 6, W4[1]); wgRc(g, 13, 10, 1, 6, W4[1]); wgRc(g, 3, 12, 10, 1, W4[0]); wgRc(g, 2, 2, 5, 2, 'l'); wgRc(g, 2, 2, 1, 2, 'L'); wgRc(g, 7, 3, 1, 2, 'n'); wgRc(g, 10, 1, 4, 3, 'm'); wgRc(g, 12, 3, 1, 2, 'n'); wgPx(g, 10, 1, 'l'); });
  one('furnace', 16, 18, (g) => { box(g, 1, 2, 14, 15, S4); wgRc(g, 0, 15, 16, 3, S4[0]); wgRc(g, 5, 0, 6, 3, S4[1]); wgRc(g, 5, 0, 6, 1, S4[2]); wgRc(g, 4, 8, 8, 8, '0'); wgBlob(g, 8, 13, 3, 3, ['r', 'o', 'O', 'y']); wgRc(g, 5, 7, 6, 1, S4[3]); for (const [x, y] of [[3, 4], [11, 5], [3, 11], [12, 11]]) wgPx(g, x, y, S4[0]); });
  one('anvil', 16, 13, (g) => { const I = ['x', 'X', 'm', 'l']; wgRc(g, 2, 1, 13, 4, I[1]); wgRc(g, 1, 2, 2, 2, I[1]); wgRc(g, 2, 1, 13, 1, I[3]); wgRc(g, 5, 5, 6, 3, I[0]); wgRc(g, 3, 8, 10, 4, I[1]); wgRc(g, 3, 8, 10, 1, I[2]); wgRc(g, 3, 11, 10, 1, I[0]); wgPx(g, 4, 2, 'w'); });
  one('alch', 16, 16, (g) => { box(g, 0, 6, 16, 4, W4); wgRc(g, 1, 10, 2, 6, W4[0]); wgRc(g, 13, 10, 2, 6, W4[0]); wgRc(g, 3, 12, 10, 1, W4[0]); for (const [x, c] of [[2, 'p'], [6, 'B'], [10, 'G']]) { wgRc(g, x, 2, 3, 4, c); wgRc(g, x, 2, 1, 4, 'w'); wgRc(g, x + 1, 1, 1, 1, 'L'); wgPx(g, x + 2, 5, '0'); } wgBlob(g, 13, 4, 2, 2.4, ['b', 'B', 'c', 'C']); });
  one('loom', 16, 18, (g) => { wgRc(g, 1, 1, 14, 2, W4[2]); wgRc(g, 1, 1, 14, 1, W4[3]); wgRc(g, 1, 14, 14, 3, W4[1]); wgRc(g, 1, 1, 2, 16, W4[1]); wgRc(g, 13, 1, 2, 16, W4[0]); for (let x = 4; x < 13; x += 2) wgRc(g, x, 3, 1, 10, 'L'); wgRc(g, 3, 9, 10, 2, 'r'); wgRc(g, 3, 11, 10, 1, 'R'); wgRc(g, 3, 6, 10, 1, 'B'); });
  wgReg('campfire', [0, 1].map(v => wgMake('campfire' + v, 16, 16, (g) => {
    wgLine(g, 2, 13, 12, 10, 'n'); wgLine(g, 2, 12, 12, 9, 'N'); wgLine(g, 3, 10, 13, 13, 'u'); wgLine(g, 3, 9, 13, 12, 'n'); wgBlob(g, 8, 13, 3, 1.4, ['d', 'm', 'l', 'L']);
    wgBlob(g, 8, 8, 3.4 + v * 0.4, 4.6 + v, ['r', 'o', 'O', 'y']); wgBlob(g, 8, 9, 1.8, 3, ['O', 'y', 'Y', 'w']); wgPx(g, 8 + (v ? 2 : -2), 4 - v, 'O');
  })));
  OBJ[O_ID.campfire].anim = 1;
  wgReg('torch', [0, 1].map(v => wgMake('torch' + v, 8, 16, (g) => { wgRc(g, 3, 6, 2, 9, 'n'); wgRc(g, 3, 6, 1, 9, 'N'); wgRc(g, 2, 5, 4, 2, 'u'); wgBlob(g, 4, 3, 2 + v * 0.4, 3.2 + v * 0.6, ['r', 'o', 'O', 'y']); wgPx(g, 4, 3, 'Y'); })));
  OBJ[O_ID.torch].anim = 1;
  one('lantern', 12, 20, (g) => { wgRc(g, 5, 8, 2, 11, 'x'); wgRc(g, 3, 18, 6, 2, 'x'); wgRc(g, 2, 1, 8, 2, 'x'); wgRc(g, 3, 0, 6, 1, 'X'); wgRc(g, 2, 3, 8, 6, 'Y'); wgRc(g, 3, 4, 6, 4, 'y'); wgRc(g, 4, 5, 2, 2, 'w'); wgRc(g, 2, 3, 1, 6, 'x'); wgRc(g, 9, 3, 1, 6, 'x'); wgRc(g, 2, 8, 8, 1, 'x'); });
  one('bed', 16, 16, (g) => { box(g, 0, 3, 16, 12, W4); wgRc(g, 1, 4, 14, 10, 'r'); wgRc(g, 1, 4, 14, 1, 'R'); wgRc(g, 1, 4, 1, 10, 'R'); wgRc(g, 1, 9, 14, 1, 'p'); wgRc(g, 2, 5, 5, 4, 'L'); wgRc(g, 2, 5, 5, 1, 'w'); wgRc(g, 6, 5, 1, 4, 'l'); wgRc(g, 1, 14, 14, 1, W4[0]); });
  one('table', 16, 16, (g) => { box(g, 0, 3, 16, 7, W4); wgRc(g, 1, 10, 2, 6, W4[0]); wgRc(g, 13, 10, 2, 6, W4[0]); wgRc(g, 1, 10, 1, 6, W4[1]); wgRc(g, 13, 10, 1, 6, W4[1]); wgRc(g, 2, 5, 12, 1, W4[3]); });
  one('chair', 12, 16, (g) => { wgRc(g, 2, 1, 8, 7, W4[1]); wgRc(g, 2, 1, 8, 1, W4[3]); wgRc(g, 2, 1, 1, 7, W4[2]); wgRc(g, 1, 8, 10, 3, W4[2]); wgRc(g, 1, 8, 10, 1, W4[3]); wgRc(g, 1, 10, 10, 1, W4[0]); wgRc(g, 2, 11, 2, 4, W4[0]); wgRc(g, 8, 11, 2, 4, W4[0]); wgRc(g, 4, 3, 4, 3, W4[0]); });
  one('sign', 14, 16, (g) => { wgRc(g, 6, 8, 2, 8, W4[0]); box(g, 0, 1, 14, 8, W4); for (const y of [3, 5]) wgRc(g, 2, y, 10, 1, W4[0]); wgPx(g, 2, 2, W4[3]); });
  one('bookshelf', 16, 22, (g) => { box(g, 0, 1, 16, 20, W4); wgRc(g, 1, 3, 14, 7, W4[0]); wgRc(g, 1, 12, 14, 7, W4[0]); for (const [y0, y1] of [[3, 9], [12, 18]]) { let x = 2; const cs = ['r', 'B', 'G', 'y', 'p', 'c']; for (let i = 0; i < 6 && x < 14; i++) { const w = 2 + (i + y0) % 2; wgRc(g, x, y0 + (i % 3 === 0 ? 1 : 0), w, y1 - y0 - (i % 3 === 0 ? 1 : 0), cs[(i + y0) % 6]); wgRc(g, x, y0 + (i % 3 === 0 ? 1 : 0), 1, y1 - y0 - (i % 3 === 0 ? 1 : 0), 'w'); x += w; } } wgRc(g, 0, 10, 16, 2, W4[2]); });
  one('scarecrow', 16, 26, (g) => { wgRc(g, 7, 8, 2, 17, 'n'); wgRc(g, 0, 11, 16, 2, 'n'); wgRc(g, 0, 11, 16, 1, 'N'); wgBlob(g, 8, 5, 4, 4, ['a', 'A', 'w', 'w']); wgRc(g, 4, 2, 8, 2, 'u'); wgRc(g, 5, 0, 6, 3, 'u'); wgPx(g, 6, 5, '0'); wgPx(g, 10, 5, '0'); wgRc(g, 5, 13, 6, 7, 'B'); wgRc(g, 5, 13, 2, 7, 'c'); wgRc(g, 9, 13, 2, 7, 'b'); for (const x of [0, 14]) wgRc(g, x, 13, 2, 3, 'N'); });
  one('well', 18, 20, (g) => { wgRc(g, 1, 8, 16, 11, S4[1]); wgRc(g, 1, 8, 16, 2, S4[3]); wgRc(g, 1, 16, 16, 3, S4[0]); wgRc(g, 3, 10, 12, 5, 'b'); wgRc(g, 3, 10, 12, 2, 'B'); wgRc(g, 0, 0, 3, 12, W4[1]); wgRc(g, 15, 0, 3, 12, W4[0]); wgRc(g, 0, 0, 18, 3, W4[2]); wgRc(g, 0, 0, 18, 1, W4[3]); wgRc(g, 8, 3, 1, 5, 'L'); wgRc(g, 7, 7, 3, 2, W4[0]); });
  one('stairs_down', 16, 16, (g) => { wgRc(g, 0, 0, 16, 16, S4[0]); wgRc(g, 1, 1, 14, 14, '0'); for (let i = 0; i < 4; i++) { wgRc(g, 2 + i, 2 + i * 3, 12 - i * 2, 3, i % 2 ? S4[1] : S4[2]); wgRc(g, 2 + i, 4 + i * 3, 12 - i * 2, 1, S4[0]); } });
  one('stairs_up', 16, 16, (g) => { wgRc(g, 0, 0, 16, 16, S4[0]); wgRc(g, 1, 1, 14, 14, S4[1]); for (let i = 0; i < 4; i++) { wgRc(g, 2, 2 + i * 3, 12, 3, i % 2 ? S4[2] : S4[3]); wgRc(g, 2, 4 + i * 3, 12, 1, S4[1]); } wgRc(g, 6, 5, 4, 1, 'y'); wgPx(g, 8, 4, 'Y'); });
  one('altar', 16, 20, (g) => { box(g, 1, 8, 14, 11, S4); wgRc(g, 0, 17, 16, 3, S4[0]); wgRc(g, 0, 6, 16, 3, S4[2]); wgRc(g, 0, 6, 16, 1, S4[3]); wgBlob(g, 8, 3, 3, 3, ['o', 'y', 'Y', 'w']); wgPx(g, 8, 0, 'Y'); wgPx(g, 8, 6, 'y'); wgPx(g, 5, 3, 'y'); wgPx(g, 11, 3, 'y'); wgRc(g, 7, 11, 2, 4, 'y'); });
  one('rift', 20, 24, (g) => { wgBlob(g, 10, 12, 8, 10, ['1', '2', '3', '4']); wgBlob(g, 10, 12, 5, 7, ['b', 'B', 'c', 'C']); wgBlob(g, 10, 12, 2.4, 4, ['w', 'w', 'w', 'w']); for (const [x, y] of [[3, 5], [17, 8], [4, 18], [16, 19]]) { wgPx(g, x, y, 'Y'); wgPx(g, x - 1, y, 'y'); wgPx(g, x + 1, y, 'y'); } });
  one('ruin_pillar', 14, 24, (g) => { wgRc(g, 2, 14, 10, 9, S4[1]); wgRc(g, 2, 14, 3, 9, S4[2]); wgRc(g, 10, 14, 2, 9, S4[0]); wgRc(g, 1, 21, 12, 3, S4[1]); wgRc(g, 1, 21, 12, 1, S4[3]); wgRc(g, 3, 8, 8, 6, S4[1]); wgRc(g, 3, 8, 3, 6, S4[2]); wgRc(g, 5, 5, 4, 3, S4[1]); wgLine(g, 4, 12, 8, 17, S4[0]); wgPx(g, 9, 9, 'G'); wgPx(g, 3, 20, 'G'); });
  // doors: a closed door is a wall block with a panel; an open one is a frame on the floor
  wgReg('door_open', [wgMake('door_open', 16, 18, (g) => { wgRc(g, 0, 0, 3, 18, W4[1]); wgRc(g, 13, 0, 3, 18, W4[0]); wgRc(g, 0, 0, 16, 3, W4[2]); wgRc(g, 0, 0, 16, 1, W4[3]); wgRc(g, 0, 0, 1, 18, W4[2]); wgRc(g, 3, 3, 2, 12, W4[1]); })]);
  wgReg('irondoor_open', [wgMake('irondoor_open', 16, 18, (g) => { const I = ['x', 'X', 'm', 'l']; wgRc(g, 0, 0, 3, 18, I[1]); wgRc(g, 13, 0, 3, 18, I[0]); wgRc(g, 0, 0, 16, 3, I[2]); wgRc(g, 0, 0, 16, 1, I[3]); wgRc(g, 3, 3, 2, 12, I[1]); })]);
  for (const id of ['fence']) {}
}
// a door block: the wall block plus a panel and a handle on top
function wgDoorSpr(id, mask) {
  const key = 'door_' + id + '_' + mask;
  if (WGA.cache[key]) return WGA.cache[key];
  const base = wgWall(id, mask & ~8 & ~2, 0), [c, g] = wgCv(16, 22), R = OBJ[id].ramp;
  g.drawImage(base, 0, 0);
  wgRc(g, 3, 2, 10, 12, R[1]); wgRc(g, 3, 2, 10, 1, R[3]); wgRc(g, 3, 2, 1, 12, R[3]); wgRc(g, 12, 3, 1, 11, R[0]); wgRc(g, 3, 13, 10, 1, R[0]);
  wgRc(g, 5, 4, 6, 4, R[2]); wgRc(g, 5, 9, 6, 3, R[2]); wgRc(g, 10, 8, 2, 2, 'y'); wgPx(g, 10, 8, 'Y');
  WGA.cache[key] = c;
  return c;
}
function wgFence(mask) {
  const key = 'fence_' + mask;
  if (WGA.cache[key]) return WGA.cache[key];
  const W4 = ['u', 'n', 'N', 'O'], [c, g] = wgCv(16, 20);
  if (mask & 2) { wgRc(g, 8, 8, 8, 2, W4[2]); wgRc(g, 8, 8, 8, 1, W4[3]); wgRc(g, 8, 12, 8, 2, W4[1]); wgRc(g, 8, 12, 8, 1, W4[2]); }
  if (mask & 8) { wgRc(g, 0, 8, 8, 2, W4[2]); wgRc(g, 0, 8, 8, 1, W4[3]); wgRc(g, 0, 12, 8, 2, W4[1]); wgRc(g, 0, 12, 8, 1, W4[2]); }
  if (mask & 1) { wgRc(g, 7, 0, 2, 8, W4[1]); wgRc(g, 7, 0, 1, 8, W4[2]); }
  if (mask & 4) { wgRc(g, 7, 15, 2, 5, W4[1]); wgRc(g, 7, 15, 1, 5, W4[2]); }
  wgRc(g, 6, 5, 4, 12, W4[1]); wgRc(g, 6, 5, 2, 12, W4[2]); wgRc(g, 9, 5, 1, 12, W4[0]); wgRc(g, 6, 4, 4, 1, W4[3]);
  wgOutline(c);
  WGA.cache[key] = c;
  return c;
}

// ---------- the hero ----------
const WG_SKIN = [['k', 's', 'A'], ['u', 'k', 's'], ['n', 'N', 'k']];
const WG_HAIR = [['u', 'n', 'N'], ['x', 'X', 'm'], ['o', 'O', 'y'], ['p', 'P', 'q'], ['g', 'G', 'h']];
const WG_SHIRT = [['b', 'B', 'c'], ['p', 'r', 'R'], ['g', 'G', 'h'], ['1', '2', '3'], ['o', 'O', 'y']];
function wgPlayerSpr(dir, fr, look, act) {
  const key = ['p', dir, fr, look.skin, look.hair, look.shirt, act || ''].join('_');
  if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(18, 26), sk = WG_SKIN[look.skin % 3], hr = WG_HAIR[look.hair % 5], sh = WG_SHIRT[look.shirt % 5];
  const bob = fr === 1 || fr === 3 ? 1 : 0, ox = 1;
  const legA = fr === 1 ? 1 : fr === 3 ? -1 : 0;
  const side = dir === 'l';
  // legs and boots
  const leg = (x, dy) => { wgRc(g, x, 17 + bob, 3, 4 + dy, 'u'); wgRc(g, x, 17 + bob, 1, 4 + dy, 'n'); wgRc(g, x - (side ? 0 : 0), 21 + bob + dy, 3, 2, 'x'); wgPx(g, x, 21 + bob + dy, 'X'); };
  if (side) { leg(7 + ox, legA > 0 ? -1 : 0); leg(9 + ox, legA < 0 ? -1 : 0); } else { leg(5 + ox, legA > 0 ? -1 : 0); leg(9 + ox, legA < 0 ? -1 : 0); }
  // body
  const bx = side ? 5 : 4;
  wgRc(g, bx + ox, 10 + bob, side ? 7 : 8, 8, sh[1]); wgRc(g, bx + ox, 10 + bob, side ? 7 : 8, 1, sh[2]); wgRc(g, bx + ox, 10 + bob, 1, 8, sh[2]);
  wgRc(g, bx + ox + (side ? 6 : 7), 11 + bob, 1, 7, sh[0]); wgRc(g, bx + ox, 17 + bob, side ? 7 : 8, 1, sh[0]);
  wgRc(g, bx + ox, 15 + bob, side ? 7 : 8, 1, 'u'); wgPx(g, bx + ox + (side ? 3 : 4), 15 + bob, 'y');
  if (dir === 'd') { wgPx(g, 8 + ox, 12 + bob, 'Y'); wgPx(g, 7 + ox, 13 + bob, 'y'); wgPx(g, 9 + ox, 13 + bob, 'y'); wgPx(g, 8 + ox, 14 + bob, 'y'); } // the little star on the tunic
  // arms
  const sw = fr === 1 ? 1 : fr === 3 ? -1 : 0;
  if (!side) { wgRc(g, 2 + ox, 11 + bob + (sw > 0 ? 1 : 0), 2, 6, sh[1]); wgRc(g, 12 + ox, 11 + bob + (sw < 0 ? 1 : 0), 2, 6, sh[0]); wgRc(g, 2 + ox, 16 + bob + (sw > 0 ? 1 : 0), 2, 2, sk[1]); wgRc(g, 12 + ox, 16 + bob + (sw < 0 ? 1 : 0), 2, 2, sk[1]); }
  else { wgRc(g, 7 + ox, 11 + bob, 3, 6, sh[1]); wgRc(g, 8 + ox, 16 + bob, 2, 2, sk[1]); }
  // head
  const hx = side ? 5 : 4;
  wgBlob(g, hx + 4 + ox, 6 + bob, 4.6, 4.6, sk);
  if (dir === 'u') { wgBlob(g, hx + 4 + ox, 6 + bob, 4.8, 4.8, hr); wgRc(g, hx + 1 + ox, 9 + bob, 6, 1, hr[0]); }
  else {
    wgRc(g, hx + ox, 2 + bob, 9, 3, hr[1]); wgRc(g, hx + 1 + ox, 1 + bob, 7, 1, hr[2]); wgRc(g, hx + ox, 2 + bob, 2, 5, hr[1]); wgRc(g, hx + 7 + ox, 3 + bob, 2, 3, hr[0]); wgPx(g, hx + 2 + ox, 1 + bob, hr[2]);
    if (dir === 'd') { wgPx(g, hx + 2 + ox, 7 + bob, '0'); wgPx(g, hx + 6 + ox, 7 + bob, '0'); wgPx(g, hx + 1 + ox, 8 + bob, 'P'); wgPx(g, hx + 7 + ox, 8 + bob, 'P'); }
    else { wgPx(g, hx + 2 + ox, 7 + bob, '0'); wgPx(g, hx + 1 + ox, 8 + bob, sk[0]); }
  }
  wgOutline(c);
  WGA.cache[key] = c;
  return c;
}

// ---------- item icons (16x16) ----------
const WG_TIER_R = TIERS.map(t => t.col);
const WG_BAR = { copper: ['n', 'N', 'O', 'Y'], iron: ['X', 'm', 'l', 'L'], star_bar: ['o', 'y', 'Y', 'w'] };
function wgIcon(id) {
  const key = 'ic_' + id;
  if (WGA.cache[key]) return WGA.cache[key];
  const it = WGI[id], [c, g] = wgCv(16, 16);
  const line = (a, b, c2, d, k) => wgLine(g, a, b, c2, d, k);
  const R = it.tier !== undefined ? WG_TIER_R[it.tier] : null;
  const handle = (x0, y0, x1, y1) => { line(x0, y0, x1, y1, 'n'); line(x0 + 1, y0, x1 + 1, y1, 'u'); line(x0, y0 - 1, x1, y1 - 1, 'N'); };
  const done = (o) => { if (o !== false) wgOutline(c); WGA.cache[key] = c; return c; };
  const blob = (x, y, rx, ry, r) => wgBlob(g, x, y, rx, ry, r);
  if (it.kind === 'tool') { // pickaxe, axe, shovel, hoe: a brown shaft rising to the right and a head in the tier's metal
    const H = it.tier === 0 ? ['u', 'e', 'a', 'A'] : R, px = (x, y, k) => { if (x >= 0 && x < 16 && y >= 0 && y < 16) wgPx(g, Math.round(x), Math.round(y), k); };
    const shaft = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; px(x, y, 'N'); px(x + 1, y, 'n'); px(x, y + 1, 'n'); } px(x0, y0, 'u'); px(x0 + 1, y0, 'u'); };
    if (it.tool === 'pick') {
      shaft(1, 14, 9, 5);
      for (let x = 2; x <= 15; x++) { const t = (x - 8.5) / 6.5, y = Math.round(2 + 5 * t * t); px(x, y, H[3]); px(x, y + 1, Math.abs(t) > 0.8 ? H[0] : H[2]); px(x, y + 2, H[1]); if (Math.abs(t) < 0.5) px(x, y + 3, H[0]); }
      px(8, 2, 'w'); px(9, 2, H[3]);
    } else if (it.tool === 'axe') {
      shaft(1, 14, 8, 4);
      for (let y = 1; y <= 9; y++) { const xr = 9 + Math.round(5.2 * Math.sin((y - 1) / 8 * Math.PI)); for (let x = 8; x <= xr; x++) px(x, y, x >= xr - 1 ? H[3] : y <= 3 ? H[2] : y >= 8 ? H[0] : H[1]); }
      px(9, 2, H[3]); px(10, 2, H[3]); px(8, 5, 'u'); px(8, 6, 'u');
    } else if (it.tool === 'shovel') {
      shaft(1, 14, 9, 7); px(9, 6, 'u'); px(10, 6, 'u'); px(9, 5, 'u'); // a T grip at the bottom
      for (let i = 0; i <= 8; i++) { const w = i < 2 ? 1 : i < 6 ? 2.6 : i < 8 ? 1.6 : 0.6, x0 = 9 + i * 0.8, y0 = 7 - i * 0.8; for (let u = -Math.ceil(w); u <= Math.ceil(w); u++) { if (Math.abs(u) > w) continue; px(x0 + u * 0.7, y0 + u * 0.7, u < -0.5 ? H[3] : u > 0.5 ? H[0] : H[2]); px(x0 + u * 0.7 + 1, y0 + u * 0.7, u > 0.5 ? H[0] : H[1]); } }
    } else { // hoe
      shaft(1, 14, 10, 5);
      for (let i = 0; i < 6; i++) { px(10 + i, 3 + i * 0.7, H[3]); px(10 + i, 4 + i * 0.7, H[2]); px(10 + i, 5 + i * 0.7, H[1]); } px(9, 3, H[3]); px(9, 4, H[2]); px(15, 7, H[0]); px(15, 8, H[0]);
    }
    return done();
  }
  if (it.kind === 'weapon' && it.weapon === 'sword') { line(3, 13, 5, 11, 'n'); wgRc(g, 4, 10, 4, 2, 'N'); wgPx(g, 3, 13, 'u'); for (let i = 0; i < 8; i++) { wgPx(g, 6 + i, 10 - i, R[2]); wgPx(g, 7 + i, 10 - i, R[1]); wgPx(g, 6 + i, 9 - i, R[3]); } wgPx(g, 14, 2, R[3]); wgPx(g, 5, 9, 'N'); return done(); }
  if (it.kind === 'weapon' && it.weapon === 'spear') { line(2, 14, 11, 5, 'n'); line(2, 13, 11, 4, 'N'); for (const [x, y] of [[12, 3], [13, 2], [12, 4], [11, 3], [14, 1], [13, 3], [12, 2]]) wgPx(g, x, y, R[2]); wgPx(g, 14, 1, R[3]); wgPx(g, 12, 4, R[1]); wgPx(g, 13, 3, R[1]); return done(); }
  if (it.kind === 'weapon' && it.weapon === 'bow') { const lg = id === 'longbow'; for (let i = 0; i < 12; i++) { const x = 11 - Math.round(Math.sin(i / 11 * 3.14) * 6), y = 2 + i; wgPx(g, x, y, lg ? 'y' : 'n'); wgPx(g, x + 1, y, lg ? 'Y' : 'N'); } line(11, 2, 11, 13, 'L'); line(4, 8, 13, 8, 'u'); wgPx(g, 13, 8, 'l'); wgPx(g, 12, 7, 'l'); wgPx(g, 12, 9, 'l'); return done(); }
  if (it.kind === 'weapon' && it.weapon === 'wand') { const gem = id === 'wand_frost' ? ['b', 'B', 'c', 'C'] : id === 'wand_star' ? ['o', 'y', 'Y', 'w'] : ['p', 'P', 'q', 'w']; line(3, 14, 10, 7, 'n'); line(4, 14, 11, 7, 'u'); blob(11, 5, 3, 3, gem); wgPx(g, 13, 2, 'w'); wgPx(g, 14, 4, 'w'); wgPx(g, 9, 2, gem[3]); return done(); }
  if (it.kind === 'armor') {
    const A = [['u', 'n', 'N', 'O'], ['n', 'N', 'O', 'Y'], ['X', 'm', 'l', 'L'], ['b', 'B', 'c', 'C'], ['o', 'y', 'Y', 'w']][it.tint];
    if (it.slot === 'head') { blob(8, 8, 5.5, 5, A); wgRc(g, 2, 10, 12, 3, A[1]); wgRc(g, 2, 12, 12, 1, A[0]); wgRc(g, 2, 10, 12, 1, A[2]); wgRc(g, 7, 4, 2, 6, A[2]); }
    else if (it.slot === 'body') { wgRc(g, 4, 3, 8, 11, A[1]); wgRc(g, 4, 3, 8, 1, A[2]); wgRc(g, 1, 3, 4, 4, A[2]); wgRc(g, 11, 3, 4, 4, A[0]); wgRc(g, 6, 3, 4, 2, 'x'); wgRc(g, 4, 11, 8, 1, 'u'); wgRc(g, 4, 13, 8, 1, A[0]); wgRc(g, 5, 4, 1, 7, A[3]); }
    else { for (const x of [2, 9]) { wgRc(g, x + 1, 3, 4, 7, A[1]); wgRc(g, x, 9, 6, 4, A[2]); wgRc(g, x, 12, 6, 1, A[0]); wgPx(g, x + 1, 3, A[3]); } }
    return done();
  }
  switch (id) {
    case 'wood': wgRc(g, 3, 5, 10, 7, 'n'); wgRc(g, 3, 5, 10, 2, 'N'); wgRc(g, 3, 11, 10, 1, 'u'); blob(3.5, 8.5, 3, 3.6, ['n', 'N', 'O', 'Y']); wgPx(g, 3, 8, 'n'); wgPx(g, 4, 8, 'n'); wgLine(g, 7, 7, 11, 7, 'u'); break;
    case 'stick': line(3, 13, 12, 4, 'n'); line(4, 13, 13, 4, 'u'); line(3, 12, 12, 3, 'N'); wgPx(g, 7, 6, 'N'); wgPx(g, 8, 5, 'n'); break;
    case 'stone': blob(8, 9, 5.5, 4.4, ['d', 'm', 'l', 'L']); wgLine(g, 8, 7, 10, 10, 'd'); break;
    case 'fiber': for (const x of [4, 6, 8, 10]) line(x, 13, x + (x % 4 ? 1 : -1), 4, x % 4 ? 'G' : 'h'); wgRc(g, 3, 8, 9, 2, 'a'); wgPx(g, 3, 8, 'A'); break;
    case 'flint': for (const [x, y] of [[8, 3], [9, 4], [10, 5], [11, 7], [10, 10], [8, 12], [5, 11], [4, 8], [5, 5], [6, 4]]) wgPx(g, x, y, 'X'); wgRc(g, 6, 5, 5, 6, 'x'); wgRc(g, 6, 5, 2, 5, 'X'); wgPx(g, 6, 5, 'm'); wgPx(g, 8, 4, 'l'); break;
    case 'coal': for (const [x, y, r] of [[5, 10, 3], [10, 9, 3.4], [8, 5, 2.8]]) blob(x, y, r, r * 0.9, ['0', 'x', 'X', 'm']); break;
    case 'copper_ore': case 'iron_ore': { blob(8, 9, 6, 5, ['d', 'm', 'l', 'L']); const f = id === 'copper_ore' ? ['n', 'N', 'O', 'Y'] : ['n', 'k', 'R', 's']; for (const [x, y] of [[5, 8], [9, 7], [8, 11], [11, 10]]) { wgRc(g, x, y, 2, 2, f[1]); wgPx(g, x, y, f[3]); } break; }
    case 'copper': case 'iron': case 'star_bar': { const B = WG_BAR[id]; wgRc(g, 3, 8, 11, 5, B[1]); wgRc(g, 4, 5, 9, 4, B[2]); wgRc(g, 4, 5, 9, 1, B[3]); wgRc(g, 3, 12, 11, 1, B[0]); wgRc(g, 13, 6, 1, 6, B[0]); wgPx(g, 5, 6, 'w'); break; }
    case 'crystal': for (let r = 0; r < 12; r++) { const hw = r < 6 ? 1 + r * 0.6 : 3.6 - (r - 6) * 0.6; for (let x = Math.round(8 - hw); x <= Math.round(8 + hw); x++) wgPx(g, x, 2 + r, x < 8 ? 'C' : x === 8 ? 'c' : 'B'); } wgPx(g, 7, 5, 'w'); wgPx(g, 7, 6, 'w'); break;
    case 'star_ore': blob(8, 9, 6, 5, ['d', 'm', 'l', 'L']); for (const [x, y] of [[5, 8], [10, 7], [8, 11]]) { wgPx(g, x, y, 'Y'); wgPx(g, x - 1, y, 'y'); wgPx(g, x + 1, y, 'y'); wgPx(g, x, y - 1, 'y'); wgPx(g, x, y + 1, 'o'); } break;
    case 'sand': blob(8, 11, 6.4, 3.6, ['e', 'a', 'A', 'w']); blob(8, 8, 4, 3.4, ['e', 'a', 'A', 'w']); break;
    case 'clay': blob(8, 9, 5, 4.6, ['n', 'N', 'k', 's']); wgPx(g, 6, 7, 's'); break;
    case 'glass': wgRc(g, 3, 3, 10, 10, 'C'); wgRc(g, 3, 3, 10, 1, 'w'); wgRc(g, 3, 3, 1, 10, 'w'); wgRc(g, 12, 4, 1, 9, 'c'); wgRc(g, 4, 12, 9, 1, 'c'); line(5, 10, 9, 5, 'w'); break;
    case 'brick': wgRc(g, 2, 5, 12, 7, 'R'); wgRc(g, 2, 5, 12, 1, 'N'); wgRc(g, 2, 11, 12, 1, 'n'); wgRc(g, 2, 8, 12, 1, 'n'); wgRc(g, 8, 5, 1, 3, 'n'); wgRc(g, 5, 9, 1, 2, 'n'); wgRc(g, 11, 9, 1, 2, 'n'); break;
    case 'leather': blob(8, 8, 6, 5, ['u', 'n', 'N', 'O']); wgPx(g, 4, 5, 'O'); wgPx(g, 11, 11, 'u'); wgLine(g, 6, 8, 10, 9, 'u'); break;
    case 'wool': for (const [x, y] of [[5, 9], [8, 6], [11, 9], [8, 10]]) blob(x, y, 3, 3, ['m', 'l', 'L', 'w']); break;
    case 'feather': line(3, 13, 12, 3, 'l'); for (let i = 0; i < 8; i++) { wgPx(g, 5 + i - 1, 12 - i, 'L'); wgPx(g, 5 + i + 1, 12 - i + 1, 'w'); wgPx(g, 6 + i, 11 - i, 'c'); } line(3, 13, 6, 10, 'n'); break;
    case 'bone': wgRc(g, 4, 7, 8, 2, 'L'); blob(4, 7, 2, 2, ['m', 'l', 'L', 'w']); blob(4, 10, 2, 2, ['m', 'l', 'L', 'w']); blob(12, 7, 2, 2, ['m', 'l', 'L', 'w']); blob(12, 10, 2, 2, ['m', 'l', 'L', 'w']); wgRc(g, 4, 8, 9, 2, 'L'); break;
    case 'slime': blob(8, 10, 6, 4.6, ['g', 'G', 'h', 'H']); blob(8, 6, 3.6, 3, ['g', 'G', 'h', 'H']); wgPx(g, 6, 7, 'w'); wgPx(g, 5, 10, 'w'); break;
    case 'string': for (let a = 0; a < 20; a++) wgPx(g, Math.round(8 + Math.cos(a / 20 * 6.283) * 4), Math.round(8 + Math.sin(a / 20 * 6.283) * 4), a % 2 ? 'L' : 'l'); wgRc(g, 8, 4, 5, 1, 'l'); wgPx(g, 13, 5, 'L'); break;
    case 'egg': blob(8, 9, 4, 5, ['a', 'A', 'w', 'w']); wgPx(g, 9, 11, 'e'); wgPx(g, 7, 8, 'e'); break;
    case 'honey': wgRc(g, 4, 5, 8, 8, 'O'); wgRc(g, 4, 5, 8, 2, 'y'); wgRc(g, 4, 12, 8, 1, 'o'); wgRc(g, 5, 3, 6, 2, 'N'); wgRc(g, 5, 3, 6, 1, 'n'); wgRc(g, 5, 7, 2, 4, 'Y'); break;
    case 'flour': wgRc(g, 4, 5, 8, 8, 'A'); wgRc(g, 4, 5, 8, 1, 'w'); wgRc(g, 4, 12, 8, 1, 'e'); wgRc(g, 4, 3, 8, 2, 'a'); wgRc(g, 7, 3, 2, 3, 'n'); wgRc(g, 6, 8, 4, 3, 'a'); break;
    case 'sugar': for (const [x, y] of [[4, 9], [8, 9], [6, 5]]) { wgRc(g, x, y, 4, 4, 'w'); wgRc(g, x + 3, y + 1, 1, 3, 'L'); wgRc(g, x, y + 3, 4, 1, 'l'); } break;
    case 'petal_r': case 'petal_y': case 'petal_b': case 'petal_w': case 'petal_p': { const col = { petal_r: ['p', 'r', 'R', 'q'], petal_y: ['o', 'y', 'Y', 'w'], petal_b: ['b', 'B', 'c', 'C'], petal_w: ['m', 'l', 'L', 'w'], petal_p: ['1', '2', '3', '4'] }[id]; for (const [x, y] of [[8, 4], [12, 8], [8, 12], [4, 8], [6, 6], [10, 6], [6, 10], [10, 10]]) blob(x, y, 2.4, 2.4, col); wgPx(g, 8, 8, 'y'); wgPx(g, 7, 8, 'Y'); break; }
    case 'ember': blob(8, 9, 4, 4.4, ['r', 'o', 'O', 'y']); blob(8, 8, 2, 2.4, ['O', 'y', 'Y', 'w']); wgPx(g, 12, 3, 'O'); wgPx(g, 3, 5, 'o'); break;
    case 'obsidian': for (const [x, y] of [[8, 2], [11, 5], [12, 10], [8, 13], [4, 11], [4, 5]]) wgPx(g, x, y, '1'); wgRc(g, 5, 4, 7, 9, 'x'); wgRc(g, 5, 4, 3, 8, '1'); wgPx(g, 6, 5, '3'); wgPx(g, 7, 6, 'w'); break;
    case 'pearl': blob(8, 8, 4.4, 4.4, ['m', 'l', 'L', 'w']); wgPx(g, 6, 6, 'w'); wgPx(g, 7, 6, 'w'); break;
    case 'shell': blob(8, 9, 5.4, 4.6, ['p', 'P', 'q', 'w']); for (const x of [5, 8, 11]) wgLine(g, 8, 12, x, 6, 'p'); break;
    case 'cactus_fruit': blob(8, 9, 4.4, 4.6, ['p', 'P', 'q', 'w']); for (const [x, y] of [[5, 6], [11, 8], [8, 4], [6, 12], [10, 12]]) wgPx(g, x, y, 'Y'); wgRc(g, 6, 3, 4, 1, 'g'); break;
    case 'ice_shard': for (let r = 0; r < 12; r++) { const hw = r < 7 ? 0.8 + r * 0.45 : 4 - (r - 7) * 0.8; for (let x = Math.round(8 - hw); x <= Math.round(8 + hw); x++) wgPx(g, x, 2 + r, x < 8 ? 'w' : x === 8 ? 'C' : 'c'); } break;
    case 'glow_berry': for (const [x, y] of [[5, 9], [10, 8], [8, 5], [7, 11]]) { blob(x, y, 2.4, 2.4, ['t', 'T', 'C', 'w']); } wgPx(g, 8, 3, 'g'); break;
    case 'arrow': line(2, 13, 12, 3, 'n'); for (const [x, y] of [[12, 3], [13, 2], [13, 4], [11, 2], [14, 1]]) wgPx(g, x, y, 'm'); wgPx(g, 13, 3, 'l'); for (const [x, y] of [[2, 11], [3, 12], [4, 13], [1, 12]]) wgPx(g, x, y, 'L'); break;
    case 'rod': line(2, 14, 12, 3, 'n'); line(12, 3, 14, 12, 'L'); wgRc(g, 13, 11, 2, 2, 'r'); wgRc(g, 13, 11, 1, 1, 'R'); wgRc(g, 4, 11, 2, 2, 'x'); break;
    case 'can': wgRc(g, 3, 6, 8, 7, 'm'); wgRc(g, 3, 6, 8, 1, 'l'); wgRc(g, 3, 12, 8, 1, 'd'); wgRc(g, 10, 6, 1, 7, 'd'); line(11, 8, 14, 5, 'm'); wgRc(g, 13, 4, 2, 2, 'l'); wgRc(g, 4, 3, 5, 1, 'm'); wgPx(g, 4, 4, 'm'); wgPx(g, 8, 4, 'm'); break;
    case 'bucket': case 'bucket_water': wgRc(g, 3, 6, 10, 8, 'm'); wgRc(g, 3, 6, 10, 1, 'l'); wgRc(g, 12, 7, 1, 7, 'd'); wgRc(g, 4, 13, 8, 1, 'd'); wgRc(g, 3, 3, 1, 3, 'x'); wgRc(g, 12, 3, 1, 3, 'x'); wgRc(g, 3, 3, 10, 1, 'X'); if (id === 'bucket_water') { wgRc(g, 4, 7, 8, 2, 'c'); wgRc(g, 5, 7, 3, 1, 'C'); } break;
    case 'shears': line(3, 13, 11, 5, 'm'); line(3, 5, 11, 13, 'l'); wgRc(g, 11, 3, 2, 3, 'x'); wgRc(g, 11, 12, 2, 3, 'x'); wgRc(g, 1, 12, 3, 3, 'r'); wgRc(g, 1, 3, 3, 3, 'r'); break;
    case 'torch': wgRc(g, 7, 7, 2, 8, 'n'); wgRc(g, 7, 7, 1, 8, 'N'); wgBlob(g, 8, 4, 2.6, 3.6, ['r', 'o', 'O', 'y']); wgPx(g, 8, 4, 'Y'); break;
    case 'apple': blob(8, 9, 5, 4.8, ['p', 'r', 'R', 'q']); wgRc(g, 8, 3, 1, 3, 'n'); wgRc(g, 9, 3, 3, 2, 'G'); wgPx(g, 6, 7, 'w'); break;
    case 'berry': for (const [x, y] of [[5, 9], [10, 8], [8, 11]]) { blob(x, y, 2.6, 2.6, ['p', 'r', 'R', 'q']); } wgRc(g, 7, 4, 3, 2, 'G'); wgLine(g, 5, 7, 8, 5, 'g'); break;
    case 'carrot': for (let r = 0; r < 10; r++) { const hw = 3 - r * 0.28; for (let x = Math.round(8 - hw); x <= Math.round(8 + hw); x++) wgPx(g, x, 5 + r, x < 8 ? 'O' : x === 8 ? 'o' : 'n'); } for (const dx of [-2, 0, 2]) line(8, 5, 8 + dx, 1, dx ? 'G' : 'h'); break;
    case 'potato': blob(8, 9, 5.6, 4.4, ['n', 'N', 'k', 's']); wgPx(g, 6, 8, 'n'); wgPx(g, 10, 10, 'n'); wgPx(g, 9, 7, 'k'); break;
    case 'wheat': for (const x of [5, 8, 11]) { line(x, 14, x, 5, 'a'); for (let k = 0; k < 3; k++) { wgPx(g, x - 1, 3 + k * 2, 'y'); wgPx(g, x + 1, 4 + k * 2, 'O'); } wgPx(g, x, 2, 'Y'); } break;
    case 'pumpkin': blob(8, 9, 6, 5, ['n', 'o', 'O', 'Y']); wgLine(g, 5, 5, 5, 13, 'n'); wgLine(g, 11, 5, 11, 13, 'n'); wgRc(g, 7, 2, 2, 3, 'g'); break;
    case 'mush_r': wgRc(g, 6, 8, 4, 5, 'L'); blob(8, 7, 5.6, 4, ['p', 'r', 'R', 'q']); wgPx(g, 6, 5, 'w'); wgPx(g, 10, 7, 'w'); break;
    case 'mush_b': wgRc(g, 6, 8, 4, 5, 'k'); blob(8, 7, 5.6, 4, ['u', 'n', 'N', 'O']); break;
    case 'fish': case 'cooked_fish': { const f = id === 'fish' ? ['b', 'B', 'c', 'C'] : ['u', 'n', 'N', 'O']; blob(8, 8, 5.6, 3.4, f); for (let y = 5; y <= 11; y++) wgPx(g, 13 + (y < 8 ? 0 : 0), y, f[1]); wgPx(g, 5, 7, 'w'); wgPx(g, 5, 7, '0'); wgLine(g, 13, 8, 15, 5, f[2]); wgLine(g, 13, 8, 15, 11, f[2]); break; }
    case 'meat': case 'cooked_meat': { const f = id === 'meat' ? ['p', 'P', 'q', 'w'] : ['u', 'n', 'N', 'O']; blob(8, 9, 5.4, 4.4, f); wgRc(g, 11, 4, 2, 4, 'L'); blob(12, 4, 1.6, 1.6, ['m', 'l', 'L', 'w']); wgPx(g, 5, 7, id === 'meat' ? 'w' : 'Y'); break; }
    case 'bread': blob(8, 9, 6.4, 4.4, ['n', 'N', 'O', 'Y']); for (const x of [5, 8, 11]) wgLine(g, x, 6, x + 1, 9, 'n'); break;
    case 'baked_potato': blob(8, 9, 5.6, 4.4, ['n', 'N', 'k', 's']); wgRc(g, 5, 7, 5, 2, 'Y'); wgPx(g, 7, 7, 'w'); break;
    case 'stew': case 'carrot_soup': { wgRc(g, 2, 8, 12, 5, 'x'); wgRc(g, 3, 13, 10, 1, 'x'); wgRc(g, 2, 8, 12, 1, 'X'); wgBlob(g, 8, 8, 5.4, 1.8, id === 'stew' ? ['u', 'n', 'N', 'O'] : ['n', 'o', 'O', 'y']); wgPx(g, 6, 7, 'w'); wgPx(g, 9, 4, 'w'); wgPx(g, 10, 2, 'l'); break; }
    case 'pie': wgRc(g, 2, 8, 12, 5, 'N'); wgBlob(g, 8, 8, 6.4, 3, ['n', 'N', 'O', 'Y']); for (const [x, y] of [[5, 8], [8, 7], [11, 8]]) wgPx(g, x, y, 'r'); wgRc(g, 2, 12, 12, 1, 'n'); break;
    case 'honey_cake': wgRc(g, 3, 7, 10, 6, 'N'); wgRc(g, 3, 5, 10, 3, 'O'); wgRc(g, 3, 5, 10, 1, 'Y'); wgRc(g, 3, 8, 10, 1, 'w'); wgPx(g, 6, 3, 'r'); wgRc(g, 6, 4, 1, 1, 'n'); wgRc(g, 4, 6, 3, 1, 'y'); break;
    default: break;
  }
  if (it.kind === 'seed') { wgRc(g, 6, 5, 4, 8, 'a'); wgRc(g, 6, 5, 4, 1, 'A'); wgRc(g, 7, 3, 2, 2, 'n'); const col = { wheat: 'O', carrot: 'o', potato: 'N', pumpkin: 'y', berrybush: 'r' }[it.crop]; wgRc(g, 7, 7, 2, 4, col); wgPx(g, 7, 7, 'w'); return done(); }
  if (it.kind === 'place') return wgPlaceIcon(id, c, g, done);
  return done();
}
function wgPlaceIcon(id, c, g, done) {
  const it = WGI[id];
  if (it.placeG) { const gid = G_ID[it.placeG], t = wgGroundTex(gid, 0); g.drawImage(t, 1, 3, 14, 10, 1, 3, 14, 10); g.drawImage(t, 0, 0, 16, 16, 1, 1, 14, 14); wgRc(g, 0, 0, 16, 1, '0'); wgRc(g, 0, 15, 16, 1, '0'); wgRc(g, 0, 0, 1, 16, '0'); wgRc(g, 15, 0, 1, 16, '0'); return done(false); }
  const oid = it.place && O_ID[it.place], o = oid && OBJ[oid];
  if (o && o.kind === 'wall' && !o.fence) { const w = wgWall(oid, 0, 0); g.drawImage(w, 0, 0, 16, 16, 0, 0, 16, 16); g.drawImage(w, 0, 16, 16, 6, 0, 10, 16, 6); wgRc(g, 0, 15, 16, 1, '0'); return done(false); }
  if (o && o.kind === 'door') { const w = wgDoorSpr(oid, 0); g.drawImage(w, 0, 0, 16, 22, 0, -3, 16, 22); return done(false); }
  if (o && o.fence) { const f = wgFence(10); g.drawImage(f, 0, 2, 16, 18, 0, 0, 16, 18); return done(false); }
  if (o && o.kind === 'plant' || o && o.kind === 'sapling') { const l = WGA.obj[o.id]; if (l) { const s = l[0].c; g.drawImage(s, Math.max(0, (16 - s.width) >> 1), Math.max(0, 16 - s.height), Math.min(16, s.width), Math.min(16, s.height), 0, 0, Math.min(16, s.width), Math.min(16, s.height)); } return done(false); }
  const l = o && WGA.obj[o.id];
  if (l) {
    const s = l[0].c, sx = Math.max(0, (s.width - 16) >> 1), sy = Math.max(0, s.height - 16);
    g.drawImage(s, sx, sy, Math.min(16, s.width), Math.min(16, s.height), (16 - Math.min(16, s.width)) >> 1, 16 - Math.min(16, s.height), Math.min(16, s.width), Math.min(16, s.height));
  }
  return done(false);
}
function wgBuildAll() {
  wgBuildNature(); wgBuildPlants(); wgBuildFurniture();
}
