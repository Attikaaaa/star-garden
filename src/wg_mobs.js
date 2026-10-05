'use strict';
// Wildgrove: creatures. Passive ones wander and drop food, hostile ones hunt at night and in the caves.
const WG_MOBS = {
  sheep:   { name: 'SHEEP', hp: 8, spd: 14, pas: 1, w: 7, h: 5, drops: [['wool', 1, 2, 1], ['meat', 1, 1, 0.6]], dim: 'o', biomes: ['meadow', 'forest', 'hills'] },
  chicken: { name: 'CHICKEN', hp: 4, spd: 18, pas: 1, w: 5, h: 4, drops: [['feather', 1, 2, 1], ['egg', 1, 1, 0.5], ['meat', 1, 1, 0.5]], dim: 'o', biomes: ['meadow', 'forest', 'beach'] },
  fox:     { name: 'FOX', hp: 6, spd: 36, pas: 1, w: 5, h: 5, drops: [['meat', 1, 1, 0.8]], dim: 'o', biomes: ['forest', 'snow', 'highland'] },
  rabbit:  { name: 'RABBIT', hp: 3, spd: 30, pas: 1, w: 4, h: 4, drops: [['meat', 1, 1, 0.8], ['leather', 0, 1, 0.3]], dim: 'o', biomes: ['meadow', 'forest', 'highland'] },
  deer:    { name: 'DEER', hp: 12, spd: 24, pas: 1, w: 7, h: 6, drops: [['meat', 1, 2, 1], ['leather', 1, 2, 0.8]], dim: 'o', biomes: ['forest', 'highland', 'meadow'] },
  frog:    { name: 'FROG', hp: 2, spd: 22, pas: 1, w: 4, h: 3, drops: [['slime', 0, 1, 0.5]], dim: 'o', biomes: ['swamp', 'jungle'] },
  crab:    { name: 'CRAB', hp: 5, spd: 20, pas: 1, w: 5, h: 3, drops: [['shell', 1, 1, 0.7], ['meat', 1, 1, 0.4]], dim: 'o', biomes: ['beach'] },
  trader:  { name: 'TRADER', hp: 30, spd: 13, pas: 1, special: 1, w: 6, h: 7, drops: [['crystal', 1, 2, 0.7]], dim: 'o' },
  slime:   { name: 'SLIME', hp: 10, spd: 20, dmg: 3, w: 6, h: 5, drops: [['slime', 1, 2, 1]], dim: 'o', night: 1, cave: 1 },
  bonebag: { name: 'SKELETON', hp: 14, spd: 24, dmg: 4, w: 5, h: 6, shoot: 1, drops: [['bone', 1, 2, 1], ['arrow', 1, 3, 0.7]], dim: 'u', night: 1, cave: 1 },
  slimeking: { name: 'SLIME KING', hp: 140, spd: 22, dmg: 5, w: 15, h: 10, boss: 1, big: 1, drops: [['star_bar', 2, 3, 1], ['slime', 6, 10, 1], ['crystal', 2, 4, 1], ['apple', 2, 3, 1]], dim: 'o' },
  starwarden: { name: 'STAR WARDEN', hp: 320, spd: 30, dmg: 6, w: 12, h: 10, boss: 1, big: 1, fly: 1, star: 1, drops: [['star_bar', 4, 6, 1], ['crystal', 6, 8, 1], ['obsidian', 2, 3, 1], ['apple', 3, 4, 1]], dim: 'u' },
  ghoul:   { name: 'GHOUL', hp: 16, spd: 22, dmg: 4, w: 6, h: 6, drops: [['bone', 0, 1, 0.5], ['slime', 0, 1, 0.4]], dim: 'o', night: 1 },
  spider:  { name: 'CAVE SPIDER', hp: 9, spd: 34, dmg: 3, w: 6, h: 4, drops: [['string', 1, 2, 0.9]], dim: 'u', cave: 1 },
  bat:     { name: 'BAT', hp: 5, spd: 36, dmg: 2, w: 5, h: 4, fly: 1, drops: [['string', 1, 1, 0.5]], dim: 'u', cave: 1 },
};
function wgMobSpr(type, fr, hurt) {
  const key = 'm_' + type + '_' + fr + (hurt ? 'h' : '');
  if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(20, 18), P = (x, y, k) => wgPx(g, x, y, hurt ? 'w' : k), R = (x, y, w, h, k) => wgRc(g, x, y, w, h, hurt ? 'w' : k), b = fr % 2;
  if (type === 'sheep') {
    R(5, 13, 2, 3, 'u'); R(12, 13, 2, 3, 'u'); R(8, 13, 2, 3, 'n'); R(15, 13, 2, 3, 'n');
    wgBlob(g, 10, 9 + b * 0, 6.6, 4.8, hurt ? ['w', 'w', 'w', 'w'] : ['m', 'l', 'L', 'w']);
    wgBlob(g, 3, 8 + b, 2.6, 2.4, hurt ? ['w', 'w', 'w', 'w'] : ['u', 'n', 'N', 'O']); P(2, 8 + b, '0'); P(1, 10 + b, 'P');
  } else if (type === 'chicken') {
    R(8, 13, 1, 3, 'O'); R(11, 13, 1, 3, 'O'); wgBlob(g, 10, 10, 4.4, 3.6, hurt ? ['w', 'w', 'w', 'w'] : ['l', 'L', 'w', 'w']); R(13, 8, 3, 2, 'L');
    wgBlob(g, 6, 7 + b, 2.6, 2.6, hurt ? ['w', 'w', 'w', 'w'] : ['L', 'w', 'w', 'w']); R(3, 7 + b, 2, 1, 'o'); P(6, 6 + b, '0'); R(5, 4 + b, 2, 1, 'r');
  } else if (type === 'fox') {
    const w = b ? 1 : 0, H = (k) => hurt ? ['w', 'w', 'w', 'w'] : k;
    R(6, 13, 2, 3 - w, 'x'); R(9, 13, 2, 3 - (1 - w), 'u'); R(13, 13, 2, 3 - (1 - w), 'x'); R(16, 13, 2, 3 - w, 'u');
    wgBlob(g, 16, 10 + b, 2.6, 3.4, H(['n', 'o', 'O', 'O'])); R(15, 7 + b, 4, 2, hurt ? 'w' : 'w'); // tail with a pale tip
    wgBlob(g, 10, 10, 5.4, 3.4, H(['n', 'o', 'O', 'O'])); R(7, 11, 7, 2, hurt ? 'w' : 'L');
    wgBlob(g, 4, 8 + b, 2.8, 2.4, H(['n', 'o', 'O', 'O'])); R(3, 3 + b, 2, 3, hurt ? 'w' : 'o'); R(6, 3 + b, 2, 3, hurt ? 'w' : 'n'); P(3, 3 + b, 'x'); P(6, 3 + b, 'x'); P(1, 9 + b, '0'); P(3, 8 + b, '0'); R(2, 10 + b, 2, 1, 'L');
  } else if (type === 'rabbit') {
    const hop = b ? -1 : 0, H = (k) => hurt ? ['w', 'w', 'w', 'w'] : k;
    wgBlob(g, 11, 12 + hop, 4.4, 3.4, H(['n', 'N', 'O', 'a'])); wgBlob(g, 6, 10 + hop, 2.8, 2.6, H(['n', 'N', 'O', 'a'])); R(5, 4 + hop, 2, 4, 'N'); R(8, 4 + hop, 2, 4, 'n'); P(5, 5 + hop, 'q'); P(8, 5 + hop, 'P');
    P(4, 10 + hop, '0'); P(2, 11 + hop, 'q'); wgBlob(g, 16, 11 + hop, 1.6, 1.6, H(['w', 'w', 'L', 'L'])); R(7, 14 + hop, 3, 2, 'N'); R(12, 14 + hop, 3, 2, 'n');
  } else if (type === 'deer') {
    const w = b ? 1 : 0, H = (k) => hurt ? ['w', 'w', 'w', 'w'] : k;
    R(5, 12, 2, 5 - w, 'u'); R(8, 12, 2, 5 - (1 - w), 'n'); R(12, 12, 2, 5 - (1 - w), 'u'); R(15, 12, 2, 5 - w, 'n');
    wgBlob(g, 11, 9, 6.4, 3.8, H(['n', 'N', 'O', 'a'])); R(7, 9, 9, 1, 'e'); for (const x of [8, 11, 14]) P(x, 8, 'A'); // dappled back
    R(3, 3, 3, 5, H('N')[0] ? 'N' : 'w'); wgBlob(g, 3, 4, 2.4, 2.2, H(['n', 'N', 'O', 'a'])); P(2, 4, '0'); P(1, 5, '0');
    for (const [x, y] of [[2, 0], [3, 1], [5, 0], [4, 1], [6, 2]]) P(x, y, hurt ? 'w' : 'u'); P(17, 8, 'L');
  } else if (type === 'frog') {
    const sq = b ? 1 : 0, H = (k) => hurt ? ['w', 'w', 'w', 'w'] : k;
    wgBlob(g, 10, 12 - sq, 4.8, 3 + sq, H(['g', 'G', 'h', 'H'])); R(6, 14 - sq, 2, 2 + sq, 'g'); R(12, 14 - sq, 2, 2 + sq, 'g');
    wgBlob(g, 7, 9 - sq, 1.6, 1.6, H(['g', 'G', 'h', 'y'])); wgBlob(g, 13, 9 - sq, 1.6, 1.6, H(['g', 'G', 'h', 'y'])); P(7, 9 - sq, '0'); P(13, 9 - sq, '0'); R(8, 13 - sq, 4, 1, 'g'); P(10, 12 - sq, 'P');
  } else if (type === 'crab') {
    const w = b ? 1 : 0, H = (k) => hurt ? ['w', 'w', 'w', 'w'] : k;
    for (const s2 of [-1, 1]) for (let k = 0; k < 3; k++) wgLine(g, 10 + s2 * 3, 12 + k, 10 + s2 * (6 + k), 14 + k - (k + w) % 2, hurt ? 'w' : 'r');
    wgBlob(g, 10, 11, 4.6, 3, H(['r', 'R', 'O', 'a'])); R(5, 8 - w, 3, 3, hurt ? 'w' : 'o'); R(12, 8 - (1 - w), 3, 3, hurt ? 'w' : 'o'); P(5, 8 - w, 'Y'); P(14, 8 - (1 - w), 'Y');
    P(8, 7, 'w'); P(12, 7, 'w'); P(8, 8, '0'); P(12, 8, '0'); R(8, 6, 1, 1, hurt ? 'w' : 'r'); R(12, 6, 1, 1, hurt ? 'w' : 'r');
  } else if (type === 'trader') { // a wandering trader: plum robe, deep hood, a heavy pack
    const w = b ? 1 : 0;
    R(7, 15, 2, 2, 'x'); R(11, 15, 2 - w, 2, 'x'); R(4, 6, 5, 8 - w, 'n'); R(4, 6, 5, 1, 'N'); R(5, 5, 3, 2, 'N'); P(5, 9, 'O'); P(7, 11, 'y'); // the pack
    R(7, 7, 8, 9, 'v'); R(7, 7, 8, 1, 'V'); R(7, 7, 1, 9, 'V'); R(14, 8, 1, 8, 'p'); R(7, 15, 8, 1, 'p');
    wgBlob(g, 11, 5, 4, 4, ['v', 'V', 'V', 'P']); R(11, 4, 4, 4, '0'); R(13, 5, 2, 2, 's'); P(14, 5, '0'); P(13, 6, 'k'); R(15, 9, 3, 1, 'u'); P(17, 8, 'y'); P(17, 7, 'Y'); // a lantern on a stick
  } else if (type === 'slime') { // a bog ooze: dark and glistening, with a sick glow inside
    const sq = b ? 1 : 0, W = (k) => hurt ? ['w', 'w', 'w', 'w'] : k;
    wgBlob(g, 10, 11 - sq, 7 + sq, 5 - sq, W(['x', 'g', 'G', 'h']));
    for (const [x, y] of [[5, 7], [9, 5], [14, 6]]) { R(x, y - sq, 1, 2, 'x'); P(x, y - 1 - sq, 'X'); } // crown of spikes
    wgBlob(g, 10, 12 - sq, 3, 2, W(['g', 'G', 'h', 'H'])); // the glowing core
    R(6, 8 - sq, 3, 2, 'y'); R(11, 8 - sq, 3, 2, 'y'); P(7, 8 - sq, '0'); P(12, 8 - sq, '0'); R(7, 13 - sq, 6, 1, 'x'); for (const x of [8, 10, 12]) P(x, 13 - sq, 'w'); // eyes and teeth
    P(4, 15, 'g'); P(15, 14, 'g'); if (b) P(9, 16, 'G');
  } else if (type === 'bonebag') { // a hooded skeleton archer
    R(7, 13, 2, 4, 'l'); R(11, 13, 2, 4, 'l'); R(7, 16, 3, 1, 'm'); R(10, 16, 3, 1, 'm');
    R(5, 7, 10, 7, 'x'); R(5, 7, 10, 1, 'X'); R(6, 13, 8, 1, 'X'); // ragged cloak
    for (const y of [9, 11]) R(8, y, 4, 1, 'l'); R(9, 8, 2, 6, 'm');
    R(7, 1, 6, 6, 'x'); R(8, 2, 4, 5, 'L'); R(8, 2, 4, 1, 'w'); R(8, 4, 1, 2, 'r'); R(11, 4, 1, 2, 'r'); P(8, 4, 'R'); P(11, 4, 'R'); R(9, 6, 2, 1, 'm'); // hood and skull
    R(3, 8 + b, 2, 5, 'l'); R(15, 8 - b, 2, 5, 'l'); for (let k = 0; k < 7; k++) P(2 + (k < 4 ? 0 : 1), 5 + k + b, 'u'); P(2, 5 + b, 'n'); // bow
  } else if (type === 'ghoul') { // a night ghoul: stooped, ragged, glowing eyes
    const w = b ? 1 : 0;
    R(6, 13 + w, 3, 4 - w, 'z'); R(11, 13 + (1 - w), 3, 4 - (1 - w), 'z'); R(6, 16, 3, 1, 'x'); R(11, 16, 3, 1, 'x');
    wgBlob(g, 10, 10, 5, 4.4, hurt ? ['w', 'w', 'w', 'w'] : ['x', 'X', 'd', 'm']); R(6, 14, 8, 1, 'X'); P(8, 13, 'x'); P(12, 14, 'x'); // torn rags
    R(2, 8 + w * 2, 4, 2, hurt ? 'w' : 'g'); R(14, 8 + (1 - w) * 2, 4, 2, hurt ? 'w' : 'g'); P(2, 10 + w * 2, 'h'); P(17, 10 + (1 - w) * 2, 'h'); // reaching arms
    wgBlob(g, 10, 5, 3.6, 3.4, hurt ? ['w', 'w', 'w', 'w'] : ['z', 'g', 'G', 'h']); P(8, 5, 'y'); P(12, 5, 'y'); P(8, 4, 'Y'); P(12, 4, 'Y'); R(9, 7, 3, 2, '0'); P(10, 7, 'w'); P(11, 7, 'w'); // glowing eyes and open maw
    R(7, 2, 6, 1, 'x'); P(7, 3, 'x');
  } else if (type === 'spider') { // a cave spider
    const l = b ? 1 : 0, bl = hurt ? 'w' : 'x';
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const y0 = 9 + k * 1.6 | 0, up = (k + l) % 2 ? -1 : 0; wgLine(g, 10 + s * 2, y0, 10 + s * 6, y0 - 3 + up, bl); wgLine(g, 10 + s * 6, y0 - 3 + up, 10 + s * 8, y0 + 3, bl); }
    wgBlob(g, 10, 11, 4.6, 3.8, hurt ? ['w', 'w', 'w', 'w'] : ['x', 'X', 'X', 'd']); wgBlob(g, 10, 7, 2.6, 2.4, hurt ? ['w', 'w', 'w', 'w'] : ['x', 'X', 'd', 'd']);
    P(9, 7, 'r'); P(11, 7, 'r'); P(8, 6, 'R'); P(12, 6, 'R'); R(10, 10, 1, 3, hurt ? 'w' : 'p'); P(9, 9, hurt ? 'w' : 'P'); P(11, 9, hurt ? 'w' : 'P');
  } else if (type === 'bat') { // a cave bat: black leathery wings, red eyes, small fangs
    const up = b ? -3 : 1, W = hurt ? 'w' : 'x', M = hurt ? 'w' : 'X';
    wgBlob(g, 10, 9, 2.6, 3.2, hurt ? ['w', 'w', 'w', 'w'] : ['x', 'X', 'X', 'd']);
    for (const s of [-1, 1]) { for (let i = 0; i < 7; i++) { const yy = 8 + Math.round(up * i / 6) + (i > 4 ? 2 : 0); wgPx(g, 10 + s * (3 + i), yy, W); if (i > 1 && i < 6) { wgPx(g, 10 + s * (3 + i), yy + 1, M); wgPx(g, 10 + s * (3 + i), yy + 2, W); } } }
    P(9, 8, 'r'); P(11, 8, 'r'); P(9, 5, W); P(11, 5, W); P(8, 4, W); P(12, 4, W); P(9, 12, 'w'); P(11, 12, 'w');
  }
  wgOutline(c); WGA.cache[key] = c; return c;
}
function wgBossSpr(fr, hurt) {
  const key = 'm_king_' + fr + (hurt ? 'h' : '');
  if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(44, 34), b = fr % 2, sq = b ? 2 : 0, R = hurt ? ['w', 'w', 'w', 'w'] : ['g', 'G', 'h', 'H'];
  wgBlob(g, 22, 22 - sq, 18 + sq, 11 - sq, R);
  wgBlob(g, 22, 15 - sq, 11, 7, R);
  wgPx(g, 15, 19 - sq, 'w'); wgPx(g, 14, 18 - sq, 'w');
  for (const x of [16, 27]) { wgRc(g, x, 17 - sq, 3, 4, hurt ? 'w' : '0'); wgPx(g, x, 17 - sq, 'w'); }
  wgRc(g, 18, 25 - sq, 8, 1, hurt ? 'w' : 'g'); wgRc(g, 19, 26 - sq, 6, 1, hurt ? 'w' : 'g');
  // the crown
  const cr = hurt ? 'w' : 'y';
  wgRc(g, 15, 6 - sq, 14, 3, cr); for (const x of [15, 20, 25, 28]) wgRc(g, x, 3 - sq, 2, 3, cr); wgRc(g, 15, 6 - sq, 14, 1, hurt ? 'w' : 'Y'); wgPx(g, 21, 7 - sq, hurt ? 'w' : 'r'); wgPx(g, 26, 7 - sq, hurt ? 'w' : 'B');
  wgOutline(c); WGA.cache[key] = c; return c;
}
function wgStarSpr(fr, hurt) {
  const key = 'm_star_' + fr + (hurt ? 'h' : '');
  if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(44, 44), R = hurt ? ['w', 'w', 'w', 'w'] : ['o', 'y', 'Y', 'w'], cx = 22, cy = 22, pulse = fr % 2;
  for (let a = 0; a < 5; a++) { const t = -1.5708 + a * 1.2566; wgLine(g, cx, cy, Math.round(cx + Math.cos(t) * (17 + pulse)), Math.round(cy + Math.sin(t) * (17 + pulse)), hurt ? 'w' : 'y'); wgLine(g, cx + 1, cy, Math.round(cx + 1 + Math.cos(t) * (16 + pulse)), Math.round(cy + Math.sin(t) * (16 + pulse)), hurt ? 'w' : 'o'); wgLine(g, cx - 1, cy, Math.round(cx - 1 + Math.cos(t) * (16 + pulse)), Math.round(cy + Math.sin(t) * (16 + pulse)), hurt ? 'w' : 'Y'); }
  wgBlob(g, cx, cy, 10, 10, R); wgBlob(g, cx, cy, 6, 6, hurt ? R : ['y', 'Y', 'w', 'w']);
  wgRc(g, 16, 19, 4, 5, hurt ? 'w' : '0'); wgRc(g, 25, 19, 4, 5, hurt ? 'w' : '0'); wgPx(g, 17, 20, 'w'); wgPx(g, 26, 20, 'w'); wgRc(g, 19, 28, 7, 1, hurt ? 'w' : 'n');
  wgOutline(c); WGA.cache[key] = c; return c;
}
function wgDrawMob(e, cx0, cy0) {
  const m = e.m, sx = Math.round(m.x - cx0), sy = Math.round(m.y - cy0), d = WG_MOBS[m.type];
  const spr = d.star ? wgStarSpr(m.fr, m.hurt > 0) : d.big ? wgBossSpr(m.fr, m.hurt > 0) : wgMobSpr(m.type, m.fr, m.hurt > 0);
  const fly = d.fly ? (d.star ? 14 : 8) + Math.round(Math.sin(WGS.t * 5 + m.x) * 2) : 0;
  if (!d.fly) shadow(sx, sy, d.big ? 36 : d.w + 3); else shadow(sx, sy, 6);
  if (wgOpt().hc && !d.pas) { ctx.fillStyle = Math.floor(WGS.t * 4) % 2 ? 'rgba(255,60,80,0.55)' : 'rgba(255,60,80,0.3)'; const rw = d.big ? 20 : d.w + 5; ctx.fillRect(sx - rw, sy - 1, rw * 2, 2); ctx.fillRect(sx - rw + 2, sy - 2, rw * 2 - 4, 4); } // high contrast: a red ring marks hostile creatures
  ctx.save(); ctx.translate(sx, sy - 16 - fly + 2); if (m.flip) ctx.scale(-1, 1);
  if (d.star) ctx.drawImage(spr, -22, -22); else if (d.big) ctx.drawImage(spr, -22, 4 - 8); else ctx.drawImage(spr, -10, 0);
  ctx.restore();
  if (!d.big && m.hp < d.hp && m.hurt > 0) rect(sx - 6, sy - 24 - fly, Math.max(1, Math.round(12 * m.hp / d.hp)), 2, d.pas ? 'g' : 'r');
}
// who simulates the creatures here: the host, a solo player, or a guest who is not in the host's dimension
function wgSimHere() { return typeof WGN === 'undefined' || WGN.role !== 'client' || WGS.dim !== WGN.hd; }
function wgSpawnMob(type, x, y) {
  const d = WG_MOBS[type];
  const m = { id: ++WGS.mid, type, x, y, dim: WGS.dim, hp: d.hp, fr: 0, ft: 0, hurt: 0, vx: 0, vy: 0, dir: 0, wt: Math.random() * 2, cd: 1, flip: false };
  WGS.mobs.push(m); return m;
}
function wgMobSpawnTick(dt) {
  WGS.spawnT = (WGS.spawnT || 0) - dt; if (WGS.spawnT > 0) return;
  WGS.spawnT = 1.2;
  if (!wgSimHere()) return;
  const P = wgPlayers(); if (!P.length) return; const p = P[Math.floor(Math.random() * P.length)], dim = WGS.dim, night = dim === 'u' || wgNight(WGS.clock) > 0.5;
  let pas = 0, hos = 0; for (const m of WGS.mobs) if (m.dim === dim && !m.pet) WG_MOBS[m.type].pas ? pas++ : hos++;
  if (dim === 'o' && !night && Math.random() < 0.005 && !WGS.mobs.some(m => m.type === 'trader')) { const a = Math.random() * 6.283, x = p.x + Math.cos(a) * 130, y = p.y + Math.sin(a) * 130, tx = Math.floor(x / 16), ty = Math.floor(y / 16); if (!GROUND[wgGround(WGS.world, dim, tx, ty)].liq && !wgObjAt(WGS.world, dim, tx, ty)) { wgSpawnMob('trader', x, y); wgToast('A TRADER WANDERS BY', 3); } return; }
  const a = Math.random() * 6.283, r = 150 + Math.random() * 90, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
  const tx = Math.floor(x / 16), ty = Math.floor(y / 16), g = GROUND[wgGround(WGS.world, dim, tx, ty)];
  if (g.liq || wgObjAt(WGS.world, dim, tx, ty)) return;
  const list = Object.keys(WG_MOBS).filter(k => { const d = WG_MOBS[k]; if (d.special || d.dim !== dim && !(dim === 'o' && d.night)) return false; if (!d.pas && (WGS.world.meta.rules || {}).noMobs) return false; return d.pas ? !night && pas < 11 : (night || d.cave && dim === 'u') && hos < wgHosCap(dim); });
  if (!list.length) return;
  const t = list[Math.floor(Math.random() * list.length)], d = WG_MOBS[t];
  if (d.pas && d.biomes) { const b = wgSurface(WGS.world.seed, tx, ty).b; if (!d.biomes.includes(b)) return; }
  wgSpawnMob(t, x, y);
}
function wgHurtMob(m, dmg, fx, fy) {
  if (m.pet) return;
  m.hp -= dmg; m.hurt = 0.4; const a = Math.atan2(m.y - fy, m.x - fx); m.vx = Math.cos(a) * 90; m.vy = Math.sin(a) * 90;
  wgPart(m.x, m.y - 6, 5, { c: WG_MOBS[m.type].pas ? ['w', 'L'] : ['g', 'h'], s: 30, up: 18, life: 0.4 }); wgSfx('hit');
  if (m.hp <= 0) {
    m.dead = true; const d = WG_MOBS[m.type]; { const st = (WGS.world.meta.stats = WGS.world.meta.stats || { kills: 0, far: 0 }); if (!d.pas) st.kills++; if (m.type === 'slimeking' || m.type === 'starwarden') st[m.type] = 1; } if (d.boss) { wgToast('THE ' + d.name + ' FALLS!', 4); WGS.shake = 0.6; wgPart(m.x, m.y - 8, 30, { c: ['y', 'Y', 'w', 'h'], s: 70, up: 50, life: 0.9, sz: 2 }); }
    for (const [it, a2, b2, ch] of d.drops) if (Math.random() < ch) wgMobLoot(m.x, m.y - 4, it, a2 + Math.floor(Math.random() * (b2 - a2 + 1)));
    wgPart(m.x, m.y - 6, 10, { c: ['w', 'l', 'L'], s: 40, up: 26, life: 0.5 }); wgSfx('kill');
  }
}
function wgPlayers() {
  const a = WGS.server ? [] : [{ pid: 0, x: WGS.p.x, y: WGS.p.y, dim: WGS.dim }];
  if (typeof WGN !== 'undefined' && WGN.role === 'host') for (const L of WGN.peers) if (L.pid > 0 && L.dim === WGS.dim) a.push({ pid: L.pid, x: L.x, y: L.y, dim: L.dim, L });
  return a;
}
const WG_DIFF = ['peaceful', 'easy', 'survival', 'hard'], WG_DIFF_NAME = { peaceful: 'PEACEFUL', easy: 'EASY', survival: 'NORMAL', hard: 'HARD' };
const wgDiffMul = () => ({ easy: 0.6, hard: 1.5 }[WGS.world.meta.diff] || 1);
const wgHosCap = (dim) => Math.round((dim === 'u' ? 7 : 5) * ({ easy: 0.6, hard: 1.6 }[WGS.world.meta.diff] || 1));
function wgDamage(tg, dmg, fx, fy) {
  dmg = Math.max(1, Math.round(dmg * wgDiffMul()));
  if (!tg.pid) { wgHurtPlayer(dmg, fx, fy); return; }
  const now = performance.now(); if (now < (tg.L.hcd || 0)) return;
  tg.L.hcd = now + 700; wgnSend(tg.L, { t: 'dmg', dmg, fx, fy });
}
function wgUpdateMobs(dt) {
  if (!wgSimHere()) return; // the host runs the creatures (a guest in another dimension runs their own)
  const P = wgPlayers(); if (!P.length) return;
  if (WGS.p.pet && WGS.scr !== 'dead' && !WGS.mobs.some(m => m.pet)) { const f = wgSpawnMob(WGS.p.pet, WGS.p.x - 14, WGS.p.y + 6); f.pet = 1; } // the pet is never lost: it turns up beside you again after a trip or a load
  for (let i = WGS.mobs.length - 1; i >= 0; i--) {
    const m = WGS.mobs[i], d = WG_MOBS[m.type];
    if (m.dead || m.dim !== WGS.dim) { WGS.mobs.splice(i, 1); continue; }
    let tg = P[0], dist = 1e9;
    for (const q of P) { const dd = Math.hypot(q.x - m.x, q.y - m.y); if (dd < dist) { dist = dd; tg = q; } }
    const dx = tg.x - m.x, dy = tg.y - m.y;
    if (m.pet && dist > 200) { m.x = tg.x - 12; m.y = tg.y + 6; dist = 14; }
    if (dist > 340 && !d.boss && !m.pet) { WGS.mobs.splice(i, 1); continue; }
    m.hurt = Math.max(0, m.hurt - dt); m.cd -= dt;
    if (m.type === 'trader' && (m.life = (m.life === undefined ? 300 : m.life) - dt) <= 0) { WGS.mobs.splice(i, 1); wgToast('THE TRADER MOVES ON', 2); continue; }
    if (m.love > 0) { m.love -= dt; if (Math.random() < dt * 6) wgPart(m.x, m.y - 14, 1, { c: ['P', 'r'], s: 6, up: 14, life: 0.7, sz: 2 }); if (m.love <= 0) { m.love = 0; m.cool = WGS.t + 90; const b = wgSpawnMob(m.type, m.x + 10, m.y + 4); b.cool = WGS.t + 90; wgToast('A NEW ' + d.name + '!'); } }
    if (m.type === 'chicken' && !m.egg) m.egg = WGS.t + 70 + Math.random() * 80; if (m.type === 'chicken' && WGS.t > m.egg) { m.egg = 0; wgDrop(m.x, m.y, 'egg', 1); }
    let wx = 0, wy = 0;
    if (!d.pas && dist < 150 && dist > 1) { wx = dx / dist; wy = dy / dist; if (d.shoot && dist < 90) { wx *= -0.3; wy *= -0.3; } if (d.shoot && m.cd <= 0 && dist < 130) { m.cd = 2.2; WGS.arrows = WGS.arrows || []; WGS.arrows.push({ x: m.x, y: m.y - 8, vx: dx / dist * 110, vy: dy / dist * 110, life: 1.6, dim: WGS.dim }); } }
    else { m.wt -= dt; if (m.wt <= 0) { m.wt = 1 + Math.random() * 2.5; m.dir = Math.random() < 0.4 ? -1 : Math.random() * 6.283; } if (m.dir >= 0) { wx = Math.cos(m.dir) * 0.5; wy = Math.sin(m.dir) * 0.5; } }
    if (m.pet) { // follows at a trot, bites whatever hunts its friend
      if (dist > 30) { wx = dx / dist; wy = dy / dist; } else if (dist < 14 && dist > 1) { wx = -dx / dist * 0.4; wy = -dy / dist * 0.4; } m.fear = 0;
      if (m.cd <= 0) { const h = WGS.mobs.find(q => !WG_MOBS[q.type].pas && q.dim === m.dim && Math.hypot(q.x - m.x, q.y - m.y) < 26); if (h) { m.cd = 1.1; wgHurtMob(h, 2, m.x, m.y); } }
    }
    if (d.pas && m.fear > 0) { m.fear -= dt; if (dist > 1) { wx = -dx / dist; wy = -dy / dist; } }
    m.vx *= 0.82; m.vy *= 0.82;
    if (d.boss) { m.bt = (m.bt || 3) - dt; if (m.bt <= 0 && dist < 200) { m.bt = 4.5; m.bn = (m.bn || 0) + 1; if (m.bn % 2) { m.vx = dx / dist * 230; m.vy = dy / dist * 230; wgPart(m.x, m.y, 8, { c: ['g', 'h', 'H'], s: 40, up: 10, life: 0.4 }); } else for (let k = 0; k < 2; k++) wgSpawnMob('slime', m.x + (k ? 24 : -24), m.y + 6); } }
    if (d.star) { // hovers at a distance, throws a ring of stars, now and then dives at you
      m.bt = (m.bt || 2) - dt; if (dist < 90 && dist > 1) { wx = -dx / dist * 0.5; wy = -dy / dist * 0.5; }
      if (m.bt <= 0 && dist < 240) { m.bt = 2.6; m.bn = (m.bn || 0) + 1; if (m.bn % 4 === 0) { m.vx = dx / dist * 260; m.vy = dy / dist * 260; } else { const n = 8 + (m.bn % 2) * 4, o = m.bn * 0.4; WGS.arrows = WGS.arrows || []; for (let k = 0; k < n; k++) { const a = o + k / n * 6.283; WGS.arrows.push({ x: m.x, y: m.y - 14, vx: Math.cos(a) * 72, vy: Math.sin(a) * 72, life: 3, dim: WGS.dim, star: 1 }); } wgSfx('eshoot'); } }
    }
    const sp = d.spd * (wx || wy ? 1 : 0), vx = wx * sp + m.vx, vy = wy * sp + m.vy;
    if (d.fly) { m.x += vx * dt; m.y += vy * dt; } else { wgMoveBox(m, vx * dt, 0, d.big ? 6 : d.w, 2); wgMoveBox(m, 0, vy * dt, d.big ? 6 : d.w, 2); const g = GROUND[wgGround(WGS.world, WGS.dim, Math.floor(m.x / 16), Math.floor(m.y / 16))]; if (g.liq) { m.x -= vx * dt * 1.2; m.y -= vy * dt * 1.2; } }
    if (wx || wy) { m.ft += dt * 6; m.fr = Math.floor(m.ft) % 2; if (Math.abs(wx) > 0.1) m.flip = wx > 0; }
    if (!d.pas && d.dmg && dist < d.w + (d.big ? 14 : 8) && !d.shoot) wgDamage(tg, d.dmg, m.x, m.y);
    if (!d.pas && !d.boss && dist > 250 && wgNight(WGS.clock) < 0.2 && WGS.dim === 'o') WGS.mobs.splice(i, 1);
  }
  // skeleton arrows
  const A = WGS.arrows || [];
  for (let i = A.length - 1; i >= 0; i--) { const a = A[i]; a.x += a.vx * dt; a.y += a.vy * dt; a.life -= dt; if (a.life <= 0 || wgSolidAt(a.x, a.y) || a.dim !== WGS.dim) { A.splice(i, 1); continue; } for (const q of P) if (Math.hypot(a.x - q.x, a.y - 8 - q.y) < 7) { wgDamage(q, 3, a.x - a.vx, a.y - a.vy); A.splice(i, 1); break; } }
}
// a hit on a creature: the host judges it, a guest asks the host
function wgHitMob(m, dmg, fx, fy) {
  if (!wgSimHere()) { wgnSend(WGN.link, { t: 'hit', id: m.id, dmg }); m.hurt = 0.4; wgPart(m.x, m.y - 6, 4, { c: ['w', 'L'], s: 30, up: 18, life: 0.4 }); wgSfx('hit'); return; }
  wgHurtMob(m, dmg, fx, fy);
}
function wgMobLoot(x, y, id, n) {
  const to = WGS.lootTo;
  if (to > 0) { const L = WGN.peers.find(q => q.pid === to); if (L) { wgnSend(L, { t: 'loot', x, y, id, n }); return; } }
  wgDrop(x, y, id, n);
}
function wgHurtPlayer(dmg, fx, fy) {
  const p = WGS.p; if (p.inv > 0 || WGS.scr === 'dead') return;
  let red = 0; for (const s of ['head', 'body', 'feet']) if (p.armor[s]) red += WGI[p.armor[s]].def || 0;
  dmg = Math.max(1, Math.round(dmg * (1 - Math.min(0.7, red * 0.06))));
  p.hp -= dmg; p.inv = 0.7; p.hurt = 0.25; const a = Math.atan2(p.y - fy, p.x - fx); p.vx = Math.cos(a) * 110; p.vy = Math.sin(a) * 110;
  WGS.shake = 0.2; wgSfx('hurt'); wgPart(p.x, p.y - 8, 6, { c: ['r', 'R', 'p'], s: 34, up: 20, life: 0.4 });
  if (p.hp <= 0) wgDie();
}
function wgDie() {
  const p = WGS.p; p.hp = 0; WGS.scr = 'dead'; WGS.deadT = 0;
  // the pack spills where the hero fell; with KEEP INVENTORY on the pack stays; otherwise it spills and the drops wait
  const keep = WGS.world.meta.rules && WGS.world.meta.rules.keepInv, had = WGS.inv.some(Boolean);
  for (let i = 0; i < WGS.inv.length && !keep; i++) { const s = WGS.inv[i]; if (s) { wgDrop(p.x + (Math.random() - 0.5) * 20, p.y + (Math.random() - 0.5) * 12, s.id, s.n, { keep: 1 }); WGS.inv[i] = null; } }
  if (!keep && had) p.grave = { x: p.x, y: p.y, dim: WGS.dim };
  wgSfx('death');
}
function wgRespawn() {
  const p = WGS.p, sp = p.spawn || WGS.world.spawn;
  p.hp = p.maxHp; p.food = p.maxFood; p.inv = 2; p.vx = p.vy = 0; WGS.mobs = []; WGS.dim = sp.dim || 'o';
  p.x = sp.x; p.y = sp.y; WGS.scr = 'play';
}
function wgPlayerAttack() {
  const p = WGS.p, it = wgHeld(); if (p.swingCd > 0) return;
  const wp = it && it.kind === 'weapon' ? it : null, dmg = wp ? TIERS[wp.tier !== undefined ? wp.tier : 0].dmg + (wp.bonus || 0) : it && it.kind === 'tool' ? TIERS[it.tier].dmg - 1 : 1;
  p.swingCd = wp && wp.weapon === 'sword' ? 0.35 : 0.5; p.swing = 0.22;
  const fx = { d: [0, 1], u: [0, -1], l: [-1, 0], r: [1, 0] }[p.face];
  if (wp && wp.weapon === 'bow') { if (wgInvTake(WGS.inv, 'arrow', 1)) { WGS.parr = WGS.parr || []; const a = WGS.aim; WGS.parr.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, life: 1.2, dmg: dmg + 2, dim: WGS.dim }); wgSfx('shoot'); } else wgToast('NO ARROWS'); return; }
  if (wp && wp.weapon === 'wand') { WGS.parr = WGS.parr || []; const a = WGS.aim; WGS.parr.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, life: 1, dmg: dmg + 1, dim: WGS.dim, magic: wp.id }); wgSfx('shoot'); return; }
  const reach = wp && wp.weapon === 'spear' ? 30 : 22;
  for (const m of WGS.mobs) { if (m.dim !== WGS.dim) continue; const d = WG_MOBS[m.type]; const rx = m.x - p.x, ry = m.y - 6 - p.y; if (Math.hypot(rx, ry) < reach + d.w && (rx * fx[0] + ry * fx[1]) > -4) { wgHitMob(m, dmg, p.x, p.y); m.fear = 3; } }
  wgSfx('swing');
}
function wgUpdateShots(dt) {
  const P = WGS.parr || [];
  for (let i = P.length - 1; i >= 0; i--) {
    const a = P[i]; a.x += a.vx * dt; a.y += a.vy * dt; a.life -= dt;
    if (a.magic) wgPart(a.x, a.y, 1, { c: a.magic === 'wand_frost' ? ['c', 'C', 'w'] : ['p', 'q', 'w'], s: 8, life: 0.25 });
    let hit = a.life <= 0 || wgSolidAt(a.x, a.y);
    if (!hit) for (const m of WGS.mobs) if (m.dim === a.dim && Math.hypot(m.x - a.x, m.y - 6 - a.y) < WG_MOBS[m.type].w + 3) { wgHitMob(m, a.dmg, a.x - a.vx, a.y - a.vy); hit = true; break; }
    if (hit) P.splice(i, 1);
  }
}
