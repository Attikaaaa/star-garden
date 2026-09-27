// Developer check (nothing ships): the exact return of every casino game, from the
// game's own tables. node tools/casino_check.mjs
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = vm.createContext({ crypto: globalThis.crypto, Math, console });
for (const f of ['casino', 'slot', 'roulette', 'cards', 'scratch', 'lounge']) {
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
