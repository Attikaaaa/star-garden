// Developer check (nothing ships): the exact return of every casino game, from the
// game's own tables. node tools/casino_check.mjs
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = vm.createContext({ crypto: globalThis.crypto, Math, console });
for (const f of ['casino', 'slot', 'roulette', 'cards', 'scratch', 'lounge', 'holdem']) {
  const p = new URL('../src/' + f + '.js', import.meta.url);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f + '.js' });
}
const pct = (x) => (x * 100).toFixed(2) + '%';
const r = (e) => vm.runInContext(e, ctx);
const c = r('slotRTP(SLOT_CLASSIC)'), l = r('slotRTP(SLOT_LAND)');
console.log('STAR SLOT   ', pct(c.rtp), '(target 95.00%)', 'strip', r('SLOT_CLASSIC.strips.map(s=>s.length).join()'));
console.log('LAND SLOTS  ', pct(l.rtp), '+1% jackpot (target 93.00%)', 'base', pct(l.base), 'free spins 1 in', (1 / l.p3).toFixed(0));
const extra = r('typeof casinoRTPs === "function" ? casinoRTPs() : {}');
for (const k in extra) console.log(k.padEnd(12), pct(extra[k]));

// Blackjack: Cosmo's strategy over a million rounds of the real rules (4 decks, S17,
// peek, DAS, split to three hands, split aces one card, no insurance).
r(`(() => {
  const shoe = () => cardShoe(4);
  let S = shoe(), bet = 0, back = 0;
  const draw = () => S.pop();
  for (let n = 0; n < 1e6; n++) {
    if (S.length < 52) S = shoe();
    const hands = [{ c: [draw()], b: 1, aces: false }], D = [draw()];
    hands[0].c.push(draw()); D.push(draw());
    bet += 1;
    const up = D[0];
    if (bjVal(up) >= 10 && bjNatural(D)) { if (bjNatural(hands[0].c)) back += 1; continue; }
    if (bjNatural(hands[0].c)) { back += 2.5; continue; }
    for (let i = 0; i < hands.length; i++) {
      const h = hands[i];
      if (h.c.length < 2) { h.c.push(draw()); if (h.aces) continue; }
      for (;;) {
        if (bjTotal(h.c).t >= 21) break;
        const canD = h.c.length === 2 && !h.aces, canP = h.c.length === 2 && bjVal(h.c[0]) === bjVal(h.c[1]) && hands.length < 3;
        const a = bjHint(h.c, up, canD, canP);
        if (a === 'S') break;
        if (a === 'P') { bet += h.b; const k = h.c.pop(); h.aces = bjVal(k) === 11; hands.splice(i + 1, 0, { c: [k], b: h.b, aces: h.aces }); h.c.push(draw()); if (h.aces) break; continue; }
        if (a === 'D') { bet += h.b; h.b *= 2; h.c.push(draw()); break; }
        h.c.push(draw());
      }
    }
    if (hands.some(h => bjTotal(h.c).t <= 21)) while (bjTotal(D).t < 17) D.push(draw());
    for (const h of hands) { const [p] = bjPay(h.c, h.b, '', D); back += p; }
  }
  globalThis._bj = back / bet;
})()`);
console.log('BLACKJACK   ', pct(r('_bj')), '(simulated, basic strategy says about 99.6%)');
// Video poker: the best hold's exact average pay, over random deals.
console.log('VIDEO POKER ', pct(r(`(() => { let s = 0, N = 1500; for (let i = 0; i < N; i++) { vpBestHold(cardShoe(1).slice(0, 5)); s += vpBestHold.ev; } return s / N / 5; })()`)), '(1500 random deals, noisy: about ±3%; 8/5 Jacks or Better is exactly 97.30%)');
// Scratch cards: exact from the table; and 20000 grids must show exactly the prize bought.
if (r('typeof scrRTP') === 'function') {
  console.log('SCRATCH     ', r('SCR_CARDS.map(c => (scrRTP(c.tab) * 100).toFixed(2) + "%").join(" / ")'), '(target 87.50%)');
  const bad = r(`(() => { let bad = 0; for (let i = 0; i < 20000; i++) { const C = SCR_CARDS[i % 3], m = scrPick(C.tab, crandf()), g = scrGrid(C.tab, C.price, m), n = {};
    for (const v of g) n[v] = (n[v] || 0) + 1; const tri = Object.keys(n).filter(k => n[k] >= 3).map(Number);
    if (g.length !== 9 || (m ? tri.length !== 1 || tri[0] !== m * C.price : tri.length)) bad++; } return bad; })()`);
  console.log('SCRATCH GRID', bad ? bad + ' BAD GRIDS' : 'ok (20000 grids)');
}
// Sic Bo: exact, over all 216 rolls, for every spot.
if (r('typeof sicPay') === 'function') {
  console.log('SIC BO      ', r(`(() => { const ids = ['small', 'big', 'odd', 'even', 'any', 'f1']; for (let n = 4; n <= 17; n++) ids.push('t' + n);
    return ids.map(id => { let s = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) s += sicPay({ [id]: 1 }, [a, b, c]); return id + ' ' + (s / 2.16).toFixed(1) + '%'; }).join(', '); })()`),
    '(odds text: the house keeps 3 on small/big/odd/even, up to 19 on the rest)');
}
// Roulette: every spot on the table (all lattice points and the outside boxes), paid as rouSpin
// pays (36 / N per chip), over all 37 pockets.
if (r('typeof rouLattice') === 'function') {
  const rr = r(`(() => { const sets = new Map(); for (let n = 0; n <= 36; n++) sets.set(String(n), [n]);
    for (let gx = 0; gx < 23; gx++) for (let gy = 0; gy <= 5; gy++) { const a = rouLattice(gx, gy).filter(n => n >= 1 && n <= 36); if (a.length) sets.set(a.slice().sort((x, y) => x - y).join('/'), a); }
    for (const b of ROU_OUT.concat(ROU_DOZ, ROU_COL)) sets.set(b.id, rouNums(b.f));
    let lo = 9, hi = 0; for (const a of sets.values()) { let s = 0; for (let p = 0; p <= 36; p++) if (a.includes(p)) s += 36 / a.length; const x = s / 37; lo = Math.min(lo, x); hi = Math.max(hi, x); }
    return [sets.size, lo, hi]; })()`);
  console.log('ROULETTE    ', pct(rr[1]) + ' .. ' + pct(rr[2]), '(' + rr[0] + ' different spots, target 97.30%)');
}
// The Big Wheel: each symbol over the 54 segments, paid as wofSpin pays.
if (r('typeof WOF_SEGS') === 'object') {
  console.log('BIG WHEEL   ', r(`WOF_KINDS.map((K, k) => K.id + ' ' + (WOF_SEGS.filter(s => s === k).length * K.m / 54 * 100).toFixed(1) + '%').join(', ')`), '(odds text: the house keeps 7 to 11)');
  console.log('WHEEL GIFT  ', r(`(WOF_SEGS.reduce((s, k) => s + WOF_FREE[WOF_KINDS[k].id], 0) / 54).toFixed(1)`), 'chips on average from the free daily spin');
}
// Hold'em: every one of the 2,598,960 five-card hands through the evaluator, counted by kind
// against the textbook numbers, and a few seven-card spot checks (best five of seven).
if (r('typeof heScore') === 'function') {
  const got = r(`(() => { const n = new Array(9).fill(0), h = [0, 0, 0, 0, 0];
    for (h[0] = 0; h[0] < 48; h[0]++) for (h[1] = h[0] + 1; h[1] < 49; h[1]++) for (h[2] = h[1] + 1; h[2] < 50; h[2]++) for (h[3] = h[2] + 1; h[3] < 51; h[3]++) for (h[4] = h[3] + 1; h[4] < 52; h[4]++) n[heCat(heScore(h))]++;
    return n; })()`);
  const want = [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40];
  const okAll = want.every((w, i) => w === got[i]);
  console.log("HOLD'EM     ", okAll ? 'all 2,598,960 hands sort into the right kinds' : 'WRONG COUNTS ' + got.join() + ' (want ' + want.join() + ')');
  // c(rank 0..12 = A..K, suit): seven cards, and which side should win
  const spots = r(`(() => { const c = (r, s) => r * 4 + s, sc = (a) => heScore(a);
    return [
      sc([c(0, 0), c(1, 1), c(2, 2), c(3, 3), c(4, 0), c(12, 1), c(11, 2)]) > sc([c(9, 0), c(10, 1), c(11, 2), c(12, 3), c(8, 0), c(1, 1), c(2, 2)]) === false, // the wheel loses to a 9-K straight
      sc([c(0, 0), c(0, 1), c(12, 2), c(12, 3), c(12, 0), c(0, 2), c(4, 1)]) > sc([c(12, 0), c(12, 1), c(12, 2), c(0, 0), c(0, 1), c(4, 2), c(5, 3)]), // aces full beats kings full
      sc([c(0, 0), c(9, 0), c(10, 0), c(11, 0), c(12, 0), c(1, 1), c(2, 2)]) === heSc(8, [12]), // a royal flush
      sc([c(1, 0), c(1, 1), c(4, 0), c(4, 1), c(6, 2), c(6, 3), c(12, 0)]) === heSc(2, [5, 3, 11]), // three pairs (2s, 5s, 7s): the 7s, the 5s and the king (ace high: 2 is 0)
      sc([c(0, 0), c(1, 0), c(2, 0), c(3, 0), c(5, 0), c(4, 1), c(9, 2)]) === heSc(5, [12, 4, 2, 1, 0]), // A 6 4 3 2 of one suit: the flush beats the wheel beside it
    ]; })()`);
  console.log("HOLD'EM 7   ", spots.every(Boolean) ? 'five seven-card spot checks ok' : 'SPOT CHECK FAILED ' + spots.join());
}
