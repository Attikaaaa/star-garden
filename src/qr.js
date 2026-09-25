'use strict';
// A small QR code encoder (byte mode, error correction level M, versions 1-10), so a
// friend can join a co-op game by pointing a phone camera at the host's screen.
// qrMatrix(text) returns rows of booleans (true = dark), without the quiet zone.

const QR_ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]; // codewords per block, level M
const QR_BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const QR_MASKS = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
  (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0,
];

function qrRawModules(v) {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
  return r;
}
const qrDataBytes = (v) => Math.floor(qrRawModules(v) / 8) - QR_ECC[v] * QR_BLOCKS[v];

function qrMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
  return z;
}
function qrEcc(data, deg) {
  const div = new Array(deg).fill(0), res = new Array(deg).fill(0);
  div[deg - 1] = 1;
  for (let i = 0, root = 1; i < deg; i++, root = qrMul(root, 2)) {
    for (let j = 0; j < deg; j++) { div[j] = qrMul(div[j], root); if (j + 1 < deg) div[j] ^= div[j + 1]; }
  }
  for (const b of data) {
    const f = b ^ res.shift(); res.push(0);
    for (let i = 0; i < deg; i++) res[i] ^= qrMul(div[i], f);
  }
  return res;
}

function qrMatrix(str) {
  const bytes = Array.from(new TextEncoder().encode(str));
  let v = 1;
  while (v < 10 && 4 + (v < 10 ? 8 : 16) + bytes.length * 8 > qrDataBytes(v) * 8) v++;
  const cap = qrDataBytes(v), cb = v < 10 ? 8 : 16;
  if (4 + cb + bytes.length * 8 > cap * 8) return null;
  // data bits: mode, length, bytes, terminator, padding
  const bits = [];
  const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, cb); bytes.forEach(b => put(b, 8));
  put(0, Math.min(4, cap * 8 - bits.length));
  put(0, (8 - bits.length % 8) % 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let p = 0xec; data.length < cap; p ^= 0xec ^ 0x11) data.push(p);
  // split into blocks, add error correction, interleave
  const nb = QR_BLOCKS[v], ec = QR_ECC[v], raw = Math.floor(qrRawModules(v) / 8);
  const short = nb - raw % nb, len = Math.floor(raw / nb), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const d = data.slice(k, k += len - ec + (i < short ? 0 : 1)), e = qrEcc(d, ec);
    if (i < short) d.push(0);
    blocks.push(d.concat(e));
  }
  const words = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== len - ec || j >= short) words.push(b[i]); });
  // function patterns
  const n = v * 4 + 17, M = [], F = [];
  for (let y = 0; y < n; y++) { M.push(new Array(n).fill(false)); F.push(new Array(n).fill(false)); }
  const set = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
  for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < n && y >= 0 && y < n) set(x, y, d !== 2 && d !== 4);
    }
  }
  if (v > 1) {
    const na = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2, pos = [6];
    for (let p = n - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
    pos.forEach((ax, i) => pos.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
  }
  const format = (mask) => {
    const d = mask; // level M = 0b00
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412, bit = (i) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i));
    set(8, n - 8, true);
  };
  format(0);
  if (v >= 7) {
    let r = v;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (v << 12) | r;
    for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) === 1, a = n - 11 + i % 3, c = Math.floor(i / 3); set(a, c, d); set(c, a, d); }
  }
  // codewords, zigzagging up and down in two-module columns
  let i = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, y = ((right + 1) & 2) === 0 ? n - 1 - vert : vert;
      if (!F[y][x] && i < words.length * 8) { M[y][x] = ((words[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
    }
  }
  // the mask with the lowest penalty wins
  const flip = (m) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!F[y][x] && QR_MASKS[m](x, y)) M[y][x] = !M[y][x]; };
  let best = 0, bestP = Infinity;
  for (let m = 0; m < 8; m++) {
    flip(m); format(m);
    const p = qrPenalty(M, n);
    if (p < bestP) { bestP = p; best = m; }
    flip(m);
  }
  flip(best); format(best);
  return M;
}
// Runs of five or more, 2x2 blocks, finder look-alikes and the dark/light balance.
function qrPenalty(M, n) {
  let p = 0, dark = 0;
  const at = (x, y, col) => (col ? M[x][y] : M[y][x]);
  for (let col = 0; col < 2; col++) for (let a = 0; a < n; a++) {
    let run = 1;
    for (let b = 1; b <= n; b++) {
      if (b < n && at(b, a, col) === at(b - 1, a, col)) run++;
      else { if (run >= 5) p += run - 2; run = 1; }
      if (b >= 10) {
        let s = '';
        for (let k = b - 10; k <= b; k++) s += k < n && at(k, a, col) ? '1' : '0';
        if (s === '10111010000' || s === '00001011101') p += 40;
      }
    }
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (M[y][x]) dark++;
    if (x < n - 1 && y < n - 1 && M[y][x] === M[y][x + 1] && M[y][x] === M[y + 1][x] && M[y][x] === M[y + 1][x + 1]) p += 3;
  }
  return p + Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
}
