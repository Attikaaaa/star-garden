'use strict';
// The slot machines: the Star Slot (3x3, 5 lines) and the three land slots (5x3, 10 lines,
// scatters and free spins). Every reel is a fixed strip and every stop on it is equally
// likely (crypto randomness), so the return shown behind `i` is worked out exactly from
// the strips (slotRTP), never guessed, and nothing is steered to look like a near miss.

// ---------- The machines ----------
// sym: sprite names; pay[s]: [3, 4, 5 of a kind] per line bet (a 3-reel machine uses [0]);
// counts[reel][s]: how many times symbol s is on that reel's strip.
const SLOT_CLASSIC = {
  reels: 3, rows: 3,
  sym: ['sy_star', 'sy_gem', 'sy_heart', 'sy_bell', 'sy_moon', 'sy_coin', 'frog_0'],
  names: ['STAR', 'GEM', 'HEART', 'BELL', 'MOON', 'COIN', 'FROG'],
  pay: [[100], [50], [30], [20], [10], [5], [100]],
  two: 2, // two stars from the left
  wild: 6, scatter: -1, star: 0,
  lines: [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]],
  counts: [
    [2, 4, 2, 7, 6, 8, 1],
    [2, 4, 3, 6, 6, 8, 1],
    [3, 4, 3, 6, 6, 8, 1],
  ],
};
const LAND_SYMS = {
  meadow: ['slime_green_idle', 'bee_0', 'shroom_0', 'icon_honey', 'icon_clover', 'icon_horseshoe', 'coin_0'],
  beach: ['crab_0', 'puffer_0', 'jelly_0', 'starfish_0', 'shell', 'slime_blue_idle', 'coin_0'],
  crystal: ['bat_0', 'gmoth_0', 'wisp_0', 'gemlet_0', 'gem', 'slime_pink_idle', 'coin_0'],
};
const LAND_NAMES = {
  meadow: ['SLIME', 'BEE', 'SHROOM', 'HONEY POT', 'CLOVER', 'HORSESHOE', 'COIN'],
  beach: ['CRAB', 'PUFFER', 'JELLY', 'STARFISH', 'SHELL', 'SLIME', 'COIN'],
  crystal: ['BAT', 'MOTH', 'WISP', 'GEMLET', 'GEM', 'SLIME', 'COIN'],
};
const SLOT_LAND = {
  reels: 5, rows: 3,
  // 0 STAR, 1-4 the land's four, 5-7 the low three, 8 WILD (the frog), 9 SCATTER (the moon)
  pay: [[20, 100, 250], [15, 50, 200], [10, 30, 150], [8, 25, 100], [5, 20, 75], [3, 10, 40], [2, 8, 30], [2, 5, 20], [20, 100, 250], [0, 0, 0]],
  wild: 8, scatter: 9, star: 0,
  scat: [0, 0, 0, 2, 10, 50], // times the total bet, by how many scatters show
  free: 8, fmult: 2,
  lines: [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0]],
  counts: [
    [1, 2, 2, 3, 3, 6, 6, 8, 2, 2],
    [1, 1, 2, 4, 3, 6, 6, 8, 3, 2],
    [1, 2, 2, 4, 3, 6, 6, 8, 3, 2],
    [1, 1, 2, 4, 3, 6, 6, 8, 3, 2],
    [1, 2, 2, 4, 3, 6, 6, 8, 2, 2],
  ],
};
// A strip from symbol counts: each symbol spread evenly along it, the same every load.
function slotStrip(counts) {
  const L = counts.reduce((a, b) => a + b, 0), keys = [];
  counts.forEach((n, s) => { for (let j = 0; j < n; j++) keys.push([(j + 0.5 + s * 0.37 / (s + 1)) / n, s]); });
  keys.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const st = keys.map(k => k[1]);
  // no scatter twice in one window: swap a crowded one one step along
  for (let i = 0; i < L; i++) if (st[i] === 9 && (st[(i + 1) % L] === 9 || st[(i + 2) % L] === 9)) { const j = (i + 3) % L, t = st[(i + 1) % L]; st[(i + 1) % L] = st[j]; st[j] = t; }
  return st;
}
for (const M of [SLOT_CLASSIC, SLOT_LAND]) M.strips = M.counts.map(slotStrip);

// ---------- Paying a line ----------
// Symbols from the left: the first one that is not a wild names the line; wilds stand in
// for it. A line of only wilds (or wilds then a short run) pays as whichever is more.
function linePay(M, syms) {
  const n = syms.length, W = M.wild;
  if (syms[0] === M.scatter) return { s: -1, k: 0, pay: 0 };
  let lead = 0;
  while (lead < n && syms[lead] === W) lead++;
  const s = lead < n ? syms[lead] : W;
  let k = lead;
  if (s !== M.scatter) while (k < n && (syms[k] === s || syms[k] === W)) k++;
  const pt = (sym, cnt) => cnt >= 3 && M.pay[sym] ? M.pay[sym][Math.min(M.pay[sym].length - 1, cnt - 3)] || 0 : 0;
  let best = { s, k, pay: s === M.scatter ? 0 : pt(s, k) };
  if (M.two && s === M.star && k === 2) best = { s, k, pay: M.two };
  const w = pt(W, lead);
  if (w > best.pay) best = { s: W, k: lead, pay: w };
  return best;
}
// The full result of one spin: stops[r] is the strip index shown in the middle row.
function slotEval(M, stops, lb, mult) {
  const grid = [];
  for (let r = 0; r < M.reels; r++) { const S = M.strips[r], L = S.length; grid.push([S[(stops[r] - 1 + L) % L], S[stops[r]], S[(stops[r] + 1) % L]]); }
  const wins = [];
  let total = 0;
  M.lines.forEach((ln, i) => {
    const syms = ln.map((row, r) => grid[r][row]), w = linePay(M, syms);
    if (w.pay) { const amt = w.pay * lb * mult; wins.push({ line: i, s: w.s, k: w.k, amt }); total += amt; }
  });
  let scat = 0;
  const scells = [];
  if (M.scatter >= 0) for (let r = 0; r < M.reels; r++) for (let y = 0; y < 3; y++) if (grid[r][y] === M.scatter) { scat++; scells.push([r, y]); }
  let spay = 0;
  if (scat >= 3) { spay = M.scat[Math.min(5, scat)] * lb * M.lines.length * mult; total += spay; }
  // the jackpot: five stars that are really stars, on a line, at the top line bet
  const jack = M.reels === 5 && wins.some(w => w.s === M.star && w.k === 5 && M.lines[w.line].every((row, r) => grid[r][row] === M.star));
  return { grid, wins, total, scat, scells, spay, jack, free: scat >= 3 };
}
const slotSpin = (M) => M.strips.map(S => crand(S.length));

// ---------- The exact return ----------
// Reels are independent and a line takes one cell per reel, whose symbol is distributed as
// that reel's strip, so a line's expected pay is a sum over every symbol combination.
function slotRTP(M) {
  const R = M.reels, nS = M.sym ? M.sym.length : M.pay.length;
  const P = M.strips.map(S => { const p = new Array(nS).fill(0); for (const s of S) p[s] += 1 / S.length; return p; });
  let line = 0;
  const syms = new Array(R);
  const walk = (r, pr) => {
    if (r === R) { line += pr * linePay(M, syms).pay; return; }
    for (let s = 0; s < nS; s++) if (P[r][s]) { syms[r] = s; walk(r + 1, pr * P[r][s]); }
  };
  walk(0, 1);
  // a line pays pay x lb and the bet is lines x lb, so per chip bet the lines return `line`
  let base = line;
  let p3 = 0;
  if (M.scatter >= 0) {
    // how many scatters each reel's window shows, then their sum over the reels
    let dist = [1];
    for (const S of M.strips) {
      const L = S.length, q = [0, 0, 0, 0];
      for (let i = 0; i < L; i++) q[[-1, 0, 1].filter(d => S[(i + d + L) % L] === M.scatter).length] += 1 / L;
      const nd = new Array(dist.length + 3).fill(0);
      dist.forEach((a, i) => q.forEach((b, j) => { nd[i + j] += a * b; }));
      dist = nd;
    }
    for (let k = 3; k < dist.length; k++) { base += dist[k] * M.scat[Math.min(5, k)]; p3 += dist[k]; }
    // free spins: every win times fmult; one retrigger adds the same again
    const fs = M.free * M.fmult * base * (1 + (1 - Math.pow(1 - p3, M.free)));
    return { rtp: base + p3 * fs, base, p3 };
  }
  return { rtp: base, base, p3 };
}

// ---------- The machine screen ----------
// Both machines share one screen: the cabinet in the middle, the paytable (in chips at the
// current bet) on the left, AUTO / TURBO and the machine's rules on the right. A round is
// decided and committed (casPend) the moment SPIN is pressed; the reels only show it.
const SLOT_TITLE = { meadow: 'MEADOW SLOT', beach: 'SHORE SLOT', crystal: 'CRYSTAL SLOT' };
const SLOT_FRAME = { classic: ['p', 'P', '1'], meadow: ['G', 'h', 'g'], beach: ['B', 'c', 'b'], crystal: ['2', '3', '1'], mint: ['t', 'T', 'g'], gold: ['o', 'y', 'n'], free: ['O', 'Y', 'o'] };
const LINE_COL = ['r', 'y', 'B', 'h', 'P', 'o', 'c', 'G', 'q', 'T'];
const SLOT_BETS = { slot: [1, 2, 5, 10, 25], land: [1, 2, 5, 10] };
const SL = { g: 'slot', key: 'classic', M: SLOT_CLASSIC, sym: SLOT_CLASSIC.sym, names: SLOT_CLASSIC.names, lb: 0, pos: [], spin: null, res: null, t: 0, wait: 0, auto: 0, turbo: false, lever: 0, done: null };
// where the reels sit
const slotGeo = () => {
  const n = SL.M.reels, cw = n === 3 ? 32 : 30, ch = 26, w = n * cw;
  return { n, cw, ch, x0: 192 - (w >> 1), y0: 48, w, h: ch * 3 };
};
const slotFree = () => { const f = cas().fs[SL.key]; return f && f.n > 0 ? f : null; };
const slotBusy = () => !!SL.spin;
function slotOpen(g, key) {
  const M = g === 'slot' ? SLOT_CLASSIC : SLOT_LAND;
  Object.assign(SL, { g, key, M, spin: null, res: null, t: 0, wait: 0, auto: 0, lever: 0, done: null });
  SL.sym = g === 'slot' ? M.sym : ['sy_star'].concat(LAND_SYMS[key], ['frog_0', 'sy_moon']);
  SL.names = g === 'slot' ? M.names : ['STAR'].concat(LAND_NAMES[key], ['FROG', 'MOON']);
  SL.pos = M.strips.map(S => crand(S.length));
  SL.lb = Math.min(SL.lb, SLOT_BETS[g].length - 1);
  const f = cas().fs;
  if (f[key] && !(f[key].n > 0)) delete f[key];
  if (slotFree()) { SL.wait = 1.2; toast(slotFree().n + ' FREE SPINS ARE WAITING'); }
}
// Press SPIN: take the bet, decide the round, commit what it pays, then start the reels.
function slotGo() {
  const c = cas(), M = SL.M, fs = slotFree(), bets = SLOT_BETS[SL.g];
  const lb = fs ? fs.lb : bets[SL.lb], bet = lb * M.lines.length;
  if (!fs && !casinoBet(SL.g, bet)) { Audio_.sfx('deny'); toast('NOT ENOUGH CHIPS'); SL.auto = 0; return; }
  const stops = slotSpin(M), r = slotEval(M, stops, lb, fs ? fs.mult : 1);
  let pay = r.total, jack = 0;
  if (r.jack && lb === bets[bets.length - 1]) { jack = c.jack; c.jack = ctune('jackSeed') * (typeof fullMoonAt === 'function' && fullMoonAt(Date.now()) ? 2 : 1); pay += jack; }
  let trig = false, done = null;
  if (fs) {
    fs.n--; fs.won += pay; fs.i++;
    if (r.free && !fs.retrig) { fs.retrig = true; fs.n += M.free; fs.of += M.free; trig = true; }
    if (fs.n <= 0) { done = fs; delete c.fs[SL.key]; }
  } else if (r.free) { c.fs[SL.key] = { n: M.free, of: M.free, i: 0, mult: M.fmult, lb, retrig: false, won: 0 }; trig = true; }
  casPend(SL.g, pay);
  const turbo = SL.turbo || SL.auto > 0, T0 = turbo ? 0.3 : 0.55, dT = turbo ? 0.1 : 0.22;
  SL.spin = { t: 0, stops, r, pay, jack, bet, trig, done, free: !!fs, stopAt: M.strips.map((S, i) => T0 + i * dT), land: M.strips.map(() => null), n: 0, v: turbo ? 26 : 18, tease: -1 };
  SL.res = null; SL.lever = 1;
  Audio_.sfx('reel');
}
// Tap SPIN again while the reels run: they stop at once, one after another.
function slotSlam() {
  const s = SL.spin;
  s.stopAt = s.stopAt.map((a, i) => Math.min(a, s.t + i * 0.04));
  s.tease = -1;
}
function slotUpdateReels(dt) {
  const s = SL.spin, M = SL.M;
  s.t += dt;
  M.strips.forEach((S, i) => {
    const L = S.length, ld = s.land[i];
    if (ld && ld.done) return;
    if (!ld) {
      SL.pos[i] = ((SL.pos[i] - s.v * dt) % L + L) % L;
      if (s.t < s.stopAt[i]) return;
      // land on the stop from above, with a small bounce
      const p = SL.pos[i];
      let p1 = s.stops[i];
      while (p1 > p - 2) p1 -= L;
      while (p1 < p - 2 - L) p1 += L;
      s.land[i] = { t: 0, p0: p, p1, T: SL.turbo || SL.auto ? 0.14 : 0.24 };
      return;
    }
    ld.t += dt;
    const u = Math.min(1, ld.t / ld.T), c1 = 1.4, e = 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
    SL.pos[i] = ld.p0 + (ld.p1 - ld.p0) * e;
    if (u < 1) return;
    ld.done = true; SL.pos[i] = s.stops[i]; s.n++;
    Audio_.sfx('rstop');
    // two moons showing: the reels still to stop take a little longer (it changes nothing)
    if (M.scatter >= 0 && s.n < M.reels && s.tease < 0) {
      let k = 0;
      for (let r = 0; r < M.reels; r++) if (s.land[r] && s.land[r].done) for (let y = 0; y < 3; y++) if (s.r.grid[r][y] === M.scatter) k++;
      if (k >= 2) { s.tease = s.n; for (let r = s.n; r < M.reels; r++) s.stopAt[r] = Math.max(s.stopAt[r], s.t + 0.5 + (r - s.n) * 0.5); }
    }
  });
  if (s.n === M.reels) slotEnd();
}
// Every reel has stopped: pay, celebrate and decide what comes next.
function slotEnd() {
  const s = SL.spin, c = cas();
  SL.spin = null;
  const paid = casSettle();
  SL.res = s; SL.t = 0;
  let big = false;
  if (s.jack) {
    Audio_.sfx('bigwin'); hapticAll('item'); casBurst(192, 90, 40);
    G.banner = { title: 'JACKPOT!', sub: '+' + s.jack + ' CHIPS', t: 3.5, icon: 'chip' };
    big = true;
  } else if (paid) { casWin(paid, s.bet, 192, 90); big = paid >= s.bet * 20; }
  else if (!s.trig) Audio_.sfx('rstop');
  if (s.trig) {
    Audio_.sfx('item'); haptic('item'); casBurst(192, 90, 12);
    G.banner = s.free ? { title: '+' + SL.M.free + ' FREE SPINS!', sub: 'THE MOONS CAME BACK', t: 2.2, icon: 'chip' } : { title: SL.M.free + ' FREE SPINS!', sub: 'EVERY WIN PAYS X' + SL.M.fmult, t: 2.4, icon: 'chip' };
    SL.auto = 0;
  }
  if (s.done) {
    SL.done = { won: s.done.won, t: 3 };
    Audio_.sfx(s.done.won > 0 ? 'cwin' : 'rstop');
  }
  if (big) SL.auto = 0;
  const lb = SLOT_BETS[SL.g][SL.lb];
  if (SL.auto > 0 && !slotFree() && lb * SL.M.lines.length > c.chips) { SL.auto = 0; toast('AUTO STOPPED: NOT ENOUGH CHIPS'); }
  const fast = SL.turbo || SL.auto > 0;
  SL.wait = s.trig ? 2.6 : s.done ? 3 : big ? 2.4 : paid ? (fast ? 0.9 : 1.4) : (fast ? 0.35 : 0.6);
}

function slotUpdate(g, dt) {
  const busy = slotBusy(), fs = slotFree(), bets = SLOT_BETS[SL.g], lines = SL.M.lines.length;
  casTop(g, busy);
  SL.t += dt;
  SL.lever = Math.max(0, SL.lever - dt * 2.5);
  if (SL.done && (SL.done.t -= dt) <= 0) SL.done = null;
  SL.lb = casStepper('lb', 100, 180, 'LINE BET', bets, SL.lb, busy || !!fs || SL.auto > 0);
  const auto = SL.auto > 0, bet = bets[SL.lb] * lines;
  const lbl = busy ? 'STOP' : fs ? 'FREE SPIN' : 'SPIN';
  if (cbtn('spin', 234, 172, 58, 30, lbl, { primary: true, keys: ['PadX'], disabled: !busy && !fs && bet > cas().chips })) {
    if (busy) slotSlam();
    else if (auto) SL.auto = 0;
    else slotGo();
  }
  if (cbtn('auto', 300, 30, 76, 16, auto ? 'STOP ' + SL.auto : 'AUTO', { keys: ['KeyA', 'PadLB'], on: auto, disabled: !!fs })) {
    if (auto) SL.auto = 0;
    else { SL.auto = SL.autoN === 10 ? 25 : 10; SL.autoN = SL.auto; if (!busy) SL.wait = 0.2; }
  }
  if (cbtn('turbo', 300, 50, 76, 16, 'TURBO', { keys: ['KeyT', 'PadRB'], on: SL.turbo })) SL.turbo = !SL.turbo;
  // the lever on the Star Slot pulls too
  if (SL.g === 'slot' && !busy && !auto && Input.mouseHit && mouseOn() && Input.mx >= 262 && Input.mx < 276 && Input.my >= 50 && Input.my < 118 && bet <= cas().chips) { Audio_.sfx('select'); slotGo(); }
  if (SL.spin) { slotUpdateReels(dt); return; }
  // free spins and AUTO spin on their own, after a pause to see the result
  if ((fs || auto) && !modalUp() && (SL.wait -= dt) <= 0) {
    if (auto && !fs) SL.auto--;
    slotGo();
  }
}
// The line a win runs along, through the middle of each cell.
function slotLinePts(i) {
  const q = slotGeo(), ln = SL.M.lines[i];
  return ln.map((row, r) => [q.x0 + r * q.cw + (q.cw >> 1), q.y0 + row * q.ch + (q.ch >> 1)]);
}
function slotStroke(pts, col) {
  for (const pass of [0, 1]) for (let j = 0; j + 1 < pts.length; j++) {
    let [x, y] = pts[j];
    const [x1, y1] = pts[j + 1], dx = Math.abs(x1 - x), dy = -Math.abs(y1 - y), sx = x < x1 ? 1 : -1, sy = y < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (pass) rect(x, y, 2, 2, col); else rect(x - 1, y - 1, 4, 4, '0');
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }
}
// What the win display is showing now: one winning line at a time, then the moons.
function slotShown() {
  const s = SL.res;
  if (!s) return null;
  const list = s.r.wins.slice();
  if (s.r.scat >= 3) list.push({ line: -1, amt: s.r.spay });
  if (!list.length) return null;
  return list[Math.floor(SL.t / 1.1) % list.length];
}
function slotSprite(s) {
  if (s === SL.M.wild && Math.floor(G.time * 2) % 5 === 0) return S('frog_1');
  return S(SL.sym[s]);
}
function slotDraw(g) {
  const fs = slotFree() || (SL.spin && SL.spin.free ? {} : null), q = slotGeo(), M = SL.M, t = G.time;
  ctx.drawImage(casFelt(fs ? 'vip' : 'plum'), 0, 0);
  drawCasTop(g);
  const [base, hi, lo] = SLOT_FRAME[fs ? 'free' : SL.key === 'classic' && SLOT_FRAME[cas().cab] ? cas().cab : SL.key];
  // the cabinet
  const cx0 = q.x0 - 18, cx1 = q.x0 + q.w + 18, cy0 = 26, cy1 = 152;
  rect(cx0 + 1, cy0, cx1 - cx0 - 2, cy1 - cy0, '0'); rect(cx0, cy0 + 1, cx1 - cx0, cy1 - cy0 - 2, '0');
  rect(cx0 + 1, cy0 + 1, cx1 - cx0 - 2, cy1 - cy0 - 2, base);
  rect(cx0 + 2, cy0 + 1, cx1 - cx0 - 4, 1, hi); rect(cx0 + 1, cy0 + 2, 1, cy1 - cy0 - 4, hi);
  rect(cx0 + 2, cy1 - 2, cx1 - cx0 - 3, 1, lo); rect(cx1 - 2, cy0 + 2, 1, cy1 - cy0 - 4, lo);
  // the marquee: a dark sign ringed with chasing bulbs
  const mx0 = cx0 + 6, mw = cx1 - cx0 - 12;
  rect(mx0, 29, mw, 14, '0'); rect(mx0 + 1, 30, mw - 2, 12, '1');
  const step = Math.floor(t * 8);
  for (let x = mx0 + 3, i = 0; x < mx0 + mw - 3; x += 6, i++) { rect(x, 31, 2, 1, (i + step) % 3 ? 'O' : 'Y'); rect(x, 40, 2, 1, (i - step + 99) % 3 ? 'O' : 'Y'); }
  const sign = SL.g === 'land' ? 'JACKPOT ' + Math.floor(cas().jack) : M.lines.length + ' LINES', sw = textW(sign, 1) + 8;
  rect(192 - (sw >> 1), 31, sw, 10, '1');
  text(sign, 192, 36, 'Y', 1, 1);
  // the reel window
  rect(q.x0 - 3, q.y0 - 3, q.w + 6, q.h + 6, '0');
  rect(q.x0 - 2, q.y0 - 2, q.w + 4, 1, 'Y'); rect(q.x0 - 2, q.y0 - 2, 1, q.h + 4, 'Y');
  rect(q.x0 - 2, q.y0 + q.h + 1, q.w + 4, 1, 'o'); rect(q.x0 + q.w + 1, q.y0 - 2, 1, q.h + 4, 'o');
  rect(q.x0 - 1, q.y0 - 1, q.w + 2, q.h + 2, 'O');
  const res = SL.res, shown = slotShown(), win = new Set(), bob = Math.floor(t * 4) % 2;
  if (shown && shown.line >= 0) M.lines[shown.line].slice(0, shown.k).forEach((row, r) => win.add(r * 3 + row));
  if (shown && shown.line < 0) res.r.scells.forEach(([r, y]) => win.add(r * 3 + y));
  ctx.save();
  ctx.beginPath(); ctx.rect(q.x0, q.y0, q.w, q.h); ctx.clip();
  for (let r = 0; r < q.n; r++) {
    const x = q.x0 + r * q.cw, S_ = M.strips[r], L = S_.length, p = SL.pos[r], f = Math.floor(p);
    // the reel's drum: lit on the top, shaded at the bottom
    rect(x, q.y0, q.cw, q.h, 'L');
    rect(x, q.y0, q.cw, 4, 'l'); rect(x, q.y0 + q.h - 4, q.cw, 4, 'l');
    rect(x, q.y0, q.cw, 1, 'm'); rect(x, q.y0 + q.h - 1, q.cw, 1, 'm');
    const tease = SL.spin && SL.spin.tease >= 0 && r >= SL.spin.tease && !(SL.spin.land[r] && SL.spin.land[r].done);
    if (tease) { rect(x, q.y0, q.cw, q.h, bob ? 'Y' : 'A'); }
    for (let j = f - 2; j <= f + 2; j++) {
      const s = S_[((j % L) + L) % L], cy = Math.round(q.y0 + (j - p + 1) * q.ch + q.ch / 2);
      const row = j - Math.round(p) + 1, lit = !SL.spin && row >= 0 && row < 3 && win.has(r * 3 + row);
      if (lit) {
        const bl = Math.floor(t * 6) % 2 ? 'y' : 'Y';
        rect(x + 1, cy - (q.ch >> 1) + 1, q.cw - 2, q.ch - 2, bl);
        rect(x + 2, cy - (q.ch >> 1) + 2, q.cw - 4, q.ch - 4, 'A');
      }
      const sp = slotSprite(s);
      drawS(sp, x + ((q.cw - sp.w) >> 1), cy - (sp.h >> 1) - (lit && bob ? 1 : 0));
    }
    if (r) rect(x, q.y0, 1, q.h, '0');
  }
  ctx.restore();
  // the payline tabs on both sides: the Star Slot's grouped by row with numbers, the land
  // slots' ten as plain colour chips spread down the window; the winning line's chip blinks
  const tabs = (side) => {
    const end = (i) => M.lines[i][side ? M.lines[i].length - 1 : 0], x = side ? q.x0 + q.w + 4 : q.x0 - 15;
    const tab = (i, y, h) => {
      const on = shown && shown.line === i;
      rect(x, y, 11, h, '0'); rect(x + 1, y + 1, 9, h - 2, on && bob ? 'w' : LINE_COL[i]);
      rect(x + 1, y + 1, 9, 1, on && bob ? 'w' : 'l');
      if (q.n === 3) text(String(i + 1), x + 6, y + (h >> 1), '0', 0, 1);
    };
    if (q.n === 3) {
      const groups = [[], [], []];
      M.lines.forEach((_, i) => groups[end(i)].push(i));
      groups.forEach((gr, row) => gr.forEach((i, k) => tab(i, q.y0 + row * q.ch + (q.ch >> 1) - (gr.length * 12 >> 1) + k * 12, 11)));
    } else {
      const list = M.lines.map((_, i) => i).sort((a, b) => end(a) - end(b) || a - b), st = q.h / list.length;
      list.forEach((i, k) => tab(i, Math.round(q.y0 + k * st), Math.floor(st)));
    }
  };
  tabs(0); tabs(1);
  if (shown && shown.line >= 0) slotStroke(slotLinePts(shown.line), LINE_COL[shown.line]);
  // the win display
  rect(q.x0, 132, q.w, 15, '0'); rect(q.x0 + 1, 133, q.w - 2, 13, 'x');
  let msg = '', col = 'l';
  const fsNow = slotFree();
  if (SL.done) { msg = 'FREE SPINS WON ' + SL.done.won; col = 'Y'; }
  else if (SL.spin) { msg = SL.spin.free ? 'FREE SPIN ' + (cas().fs[SL.key] ? cas().fs[SL.key].i : SL.spin.done ? SL.spin.done.i : '') : 'GOOD LUCK!'; col = SL.spin.free ? 'h' : 'l'; }
  else if (shown) {
    col = 'Y';
    if (shown.line < 0) msg = res.r.scat + ' MOONS PAY ' + shown.amt;
    else msg = shown.k + ' ' + SL.names[shown.s].replace(/([^AEIOU])Y$/, '$1IE') + 'S PAY ' + shown.amt;
  } else if (res) { msg = 'NO WIN'; col = '3'; }
  else if (fsNow) { msg = fsNow.n + ' FREE SPINS LEFT'; col = 'h'; }
  else msg = 'PRESS SPIN';
  text(msg, 192, 139, col, 0, 1);
  if (res && res.pay && !SL.spin) text('WIN ' + res.pay, 192, 160, 'Y', 2, 1);
  // the Star Slot's lever: a red ball on a rod that swings down when pulled
  if (SL.g === 'slot') {
    const lx = cx1, ly = 104, k = SL.lever, top = Math.round(ly - 48 + 60 * Math.sin(k * Math.PI / 2) * (k > 0 ? 1 : 0));
    rect(lx, ly - 4, 5, 12, '0'); rect(lx, ly - 3, 4, 10, 'n'); rect(lx, ly - 3, 4, 1, 'N');
    const y0 = Math.min(top, ly), y1 = Math.max(top, ly);
    rect(lx + 5, y0, 3, y1 - y0, '0'); rect(lx + 6, y0, 1, y1 - y0, 'l');
    rect(lx + 3, top - 4, 7, 7, '0'); rect(lx + 4, top - 5, 5, 9, '0');
    rect(lx + 4, top - 4, 5, 7, 'r'); rect(lx + 5, top - 5 + 1, 3, 1, 'R'); rect(lx + 4, top - 3, 1, 2, 'R'); rect(lx + 5, top - 3, 1, 1, 'w');
  }
  // the paytable, in chips at this bet
  const lb = fsNow ? fsNow.lb : SLOT_BETS[SL.g][SL.lb], mul = fsNow ? fsNow.mult : 1;
  panel(4, 26, 88, 180);
  text('PAYS', 48, 32, 'Y', 1, 1);
  if (q.n === 3) {
    SL.sym.forEach((_, s) => {
      const y = 40 + s * 19, sp = S(SL.sym[s]);
      const st = Math.max(10, sp.w + 1);
      for (let k = 0; k < 3; k++) drawS(sp, 8 + k * st, y + (16 - sp.h >> 1));
      text(String(M.pay[s][0] * lb * mul), 88, y + 8, s === M.wild ? 'h' : 'Y', 1, 2);
    });
    const y = 40 + 7 * 19;
    drawS(S('sy_star'), 8, y); drawS(S('sy_star'), 18, y);
    text(String(M.two * lb * mul), 88, y + 8, 'Y', 1, 2);
  } else {
    // five reels leave no room for chip sums: the land table shows times the line bet
    // (moons: times the total bet), and the rules panel says so
    text('X BET', 8, 41, '3', 0, 0);
    ['3', '4', '5'].forEach((h, k) => text(h, 48 + k * 20, 41, '3', 0, 2));
    const order = [0, M.wild, 1, 2, 3, 4, 5, 6, 7, M.scatter];
    order.forEach((s, i) => {
      const y = 45 + i * 16, sp = S(SL.sym[s]);
      drawS(sp, 7 + ((18 - sp.w) >> 1), y + ((16 - sp.h) >> 1));
      const v = s === M.scatter ? M.scat.slice(3) : M.pay[s];
      v.forEach((a, k) => text(String(a), 48 + k * 20, y + 8, s === M.scatter ? 'c' : s === M.wild ? 'h' : k === 2 ? 'Y' : 'w', 0, 2));
    });
  }
  // the machine's rules and the free spins, on the right
  panel(298, 72, 80, 134);
  const R = [];
  R.push(['FROG IS WILD', 'h']);
  if (q.n === 3) R.push(['2 STARS PAY TOO', 'Y'], ['5 LINES', 'l']);
  else R.push(['3 MOONS:', 'c'], [M.free + ' FREE SPINS', 'c'], ['WINS X' + M.fmult, 'c'], ['MOONS PAY', '3'], ['X TOTAL BET', '3'], ['', ''], ['5 STARS ON A', 'Y'], ['LINE AT BET ' + SLOT_BETS.land[SLOT_BETS.land.length - 1], 'Y'], ['WIN THE JACKPOT', 'Y']);
  R.forEach(([s, c], i) => s && text(s, 338, 82 + i * 10, c, 0, 1));
  if (fsNow) {
    rect(302, 160, 72, 40, '0'); rect(303, 161, 70, 38, 'g');
    text('FREE SPINS', 338, 168, 'H', 0, 1);
    text(fsNow.n + ' LEFT', 338, 180, 'w', 1, 1);
    text('WON ' + fsNow.won, 338, 192, 'Y', 1, 1);
  }
  drawStepper('lb', lb);
  text('TOTAL BET', 204, 171, '3', 0, 1);
  rect(184, 181, 40, 12, '0'); rect(185, 182, 38, 10, '1');
  text(fsNow ? 'FREE' : String(lb * M.lines.length), 204, 187, fsNow ? 'h' : 'Y', 0, 1);
  drawBtns();
}

CAS_GAMES.slot = {
  name: 'STAR SLOT',
  enter() { slotOpen('slot', 'classic'); },
  leave() { SL.auto = 0; },
  leaveAsk() { if (SL.auto > 0) { SL.auto = 0; return true; } return false; },
  update(dt) { slotUpdate(this, dt); },
  draw() { slotDraw(this); },
  odds() {
    const r = slotRTP(SLOT_CLASSIC).rtp;
    return ['3 REELS, 5 LINES. EVERY STOP ON A REEL IS EQUALLY LIKELY.', 'A LINE PAYS 3 OF A KIND FROM THE LEFT, TIMES THE LINE BET:', 'STAR OR FROG 100, GEM 50, HEART 30, BELL 20, MOON 10, COIN 5.', 'TWO STARS FROM THE LEFT PAY 2. THE FROG IS WILD.', 'IT PAYS BACK ' + (r * 100).toFixed(1) + ' OF EVERY 100 CHIPS BET, IN THE LONG RUN.'];
  },
};
CAS_GAMES.land = {
  name: 'LAND SLOTS',
  enter(land) { this.name = SLOT_TITLE[land] || 'LAND SLOTS'; slotOpen('land', land); },
  leave() { SL.auto = 0; },
  leaveAsk() { if (SL.auto > 0) { SL.auto = 0; return true; } return false; },
  update(dt) { slotUpdate(this, dt); },
  draw() { slotDraw(this); },
  odds() {
    const r = slotRTP(SLOT_LAND).rtp;
    return ['5 REELS, 10 LINES. EVERY STOP ON A REEL IS EQUALLY LIKELY.', 'LINES PAY 3, 4 OR 5 OF A KIND FROM THE LEFT (SEE THE TABLE).', 'THE FROG IS WILD. 3 MOONS ANYWHERE: ' + SLOT_LAND.free + ' FREE SPINS, WINS X' + SLOT_LAND.fmult + '.', '1 OF EVERY 100 CHIPS FEEDS THE JACKPOT: 5 STARS ON A LINE AT THE TOP BET.', 'IT PAYS BACK ' + (r * 100).toFixed(1) + ' OF EVERY 100 CHIPS, PLUS THE JACKPOT.'];
  },
};
