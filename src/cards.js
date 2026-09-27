'use strict';
// The card tables: blackjack and video poker. A card is a number, rank * 4 + suit: ranks
// 0..12 are A 2..10 J Q K, suits 0..3 are Star, Moon, Heart, Gem (su_ / sus_ sprites).

const RANK_TXT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_COL = ['1', '1', 'R', 'P'];
const cRank = (c) => c >> 2, cSuit = (c) => c & 3;

// ---------- A card on the table ----------
// { c, x, y, tx, ty, up, fl, wait }: it glides to (tx, ty), then turns face up when `up`
// (fl 0..1: the back, the back at half width, the edge, the face at half width, the face).
function tCard(c, x, y, up) { return { c, x, y, tx: x, ty: y, up: !!up, fl: 0, wait: 0 }; }
function tCardTick(k, dt) {
  const dx = k.tx - k.x, dy = k.ty - k.y, d = Math.hypot(dx, dy);
  if (d > 0.5) { const s = Math.min(d, Math.max(90, d * 12) * dt); k.x += dx / d * s; k.y += dy / d * s; return; }
  k.x = k.tx; k.y = k.ty;
  if (k.wait > 0) { k.wait -= dt; return; }
  if (k.up && k.fl < 1) k.fl = Math.min(1, k.fl + dt / 0.18);
}
function drawTCard(k) {
  const x = Math.round(k.x), y = Math.round(k.y), f = k.up ? k.fl : 0, b = cas().back;
  if (f < 0.2) drawS(S('cd_back_' + b), x, y);
  else if (f < 0.42) drawS(S('cd_half_' + b), x + 6, y);
  else if (f < 0.58) drawS(S('cd_edge'), x + 10, y);
  else if (f < 0.8) drawS(S('cd_halff'), x + 6, y);
  else drawCardFace(k.c, x, y);
}
// The face: the rank and a small suit in the top-left and bottom-right corners (so a
// card half hidden under the next one still reads), a big suit in the middle.
function drawCardFace(c, x, y) {
  const r = cRank(c), s = cSuit(c), col = SUIT_COL[s], t = RANK_TXT[r];
  drawS(S('cd_front'), x, y);
  text(t, x + 3, y + 6, col, 0, 0);
  drawS(S('sus_' + s), x + 3, y + 11);
  drawS(S('su_' + s), x + 9, y + 12);
  // the court cards wear a little crown over the suit
  if (r >= 10) { rect(x + 9, y + 9, 7, 1, 'y'); rect(x + 9, y + 8, 1, 1, 'y'); rect(x + 12, y + 7, 1, 2, 'y'); rect(x + 15, y + 8, 1, 1, 'y'); rect(x + 10, y + 9, 5, 1, 'O'); }
  text(t, x + 21, y + 26, col, 0, 2);
  drawS(S('sus_' + s), x + 20 - textW(t) - 6, y + 23);
}
const cardShoe = (decks) => { const a = []; for (let d = 0; d < decks; d++) for (let c = 0; c < 52; c++) a.push(c); return cshuffle(a); };
// A queue of timed steps: each waits its delay, then runs (steps may queue more).
function cq(Q, d, fn) { Q.push({ d, fn }); }
function cqTick(Q, dt) { if (Q.length && (Q[0].d -= dt) <= 0) Q.shift().fn(); }

// ---------- Blackjack ----------
// Four decks, the dealer stands on soft 17 and peeks under an ace or a ten, blackjack
// pays 3 to 2, double on any two cards (also after a split), split to three hands, split
// aces take one card each, insurance pays 2 to 1.
const BJ_BETS = [2, 4, 10, 20, 50, 100, 200];
const BJ_DECKS = 4, BJ_CUT = 52; // the cut card: a fresh shoe once 3/4 of it is dealt
const bjVal = (c) => { const r = cRank(c); return r === 0 ? 11 : r >= 9 ? 10 : r + 1; };
function bjTotal(cards) {
  let t = 0, a = 0;
  for (const c of cards) { const v = bjVal(c); t += v; if (v === 11) a++; }
  while (t > 21 && a) { t -= 10; a--; }
  return { t, soft: a > 0 };
}
const bjNatural = (cards) => cards.length === 2 && bjTotal(cards).t === 21;
// Basic strategy for this table (4 decks, S17, DAS): 'H' hit, 'S' stand, 'D' double, 'P' split.
function bjHint(cards, up, canD, canP) {
  const u = bjVal(up), { t, soft } = bjTotal(cards);
  if (canP && cards.length === 2 && bjVal(cards[0]) === bjVal(cards[1])) {
    const v = bjVal(cards[0]);
    if (v === 11 || v === 8 || (v === 9 && u <= 9 && u !== 7) || (v === 7 && u <= 7) || (v === 6 && u <= 6) || (v === 4 && (u === 5 || u === 6)) || ((v === 2 || v === 3) && u <= 7)) return 'P';
  }
  const D = (yes, other) => yes ? (canD ? 'D' : other) : null;
  if (soft) {
    if (t >= 20) return 'S';
    if (t === 19) return D(u === 6, 'S') || 'S';
    if (t === 18) return D(u >= 3 && u <= 6, 'S') || (u >= 9 ? 'H' : 'S');
    if (t === 17) return D(u >= 3 && u <= 6, 'H') || 'H';
    if (t >= 15) return D(u >= 4 && u <= 6, 'H') || 'H';
    if (t >= 13) return D(u === 5 || u === 6, 'H') || 'H';
    return 'H';
  }
  if (t >= 17) return 'S';
  if (t >= 13) return u <= 6 ? 'S' : 'H';
  if (t === 12) return u >= 4 && u <= 6 ? 'S' : 'H';
  if (t === 11) return D(true, 'H');
  if (t === 10) return D(u <= 9, 'H') || 'H';
  if (t === 9) return D(u >= 3 && u <= 6, 'H') || 'H';
  return 'H';
}
const BJ_SAY = { H: 'HIT', S: 'STAND', D: 'DOUBLE', P: 'SPLIT' };
const BJ_SHOE = { x: 342, y: 30 }, BJ_TRAY = { x: 20, y: 30 };
const BJ = {
  shoe: [], spots: 1, betI: 2, hands: [], dealer: [], gone: [], out: 0, q: [],
  phase: 'bet', cur: -1, ins: 0, staked: 0, msg: '', hint: '',
};
function bjDraw(up) {
  if (!BJ.shoe.length) BJ.shoe = cardShoe(BJ_DECKS); // never with the cut card, but never empty
  Audio_.sfx('card');
  return tCard(BJ.shoe.pop(), BJ_SHOE.x, BJ_SHOE.y + 4, up);
}
const bjGive = (h) => h.cards.push(bjDraw(true));
const bjCards = (h) => h.cards.map(k => k.c);
// Where every card sits: the dealer's row fans out, each hand stacks up and to the right.
function bjLayout() {
  const n = BJ.dealer.length, dx = 16;
  BJ.dealer.forEach((k, i) => { k.tx = 192 - (24 + (n - 1) * dx) / 2 + i * dx; k.ty = 28; });
  const H = BJ.hands.length, sp = Math.min(110, 356 / Math.max(1, H));
  BJ.hands.forEach((h, j) => {
    h.cx = Math.round(192 + (j - (H - 1) / 2) * sp);
    const m = h.cards.length;
    const dx = Math.min(11, Math.floor((sp - 30) / Math.max(1, m - 1)));
    h.cards.forEach((k, i) => { k.tx = Math.round(h.cx - (24 + (m - 1) * dx) / 2) + i * dx; k.ty = 132 - Math.min(i, 4) * 4; });
  });
}
// The last round's cards slide to the tray on the left.
function bjSweep() {
  for (const k of BJ.dealer.concat(...BJ.hands.map(h => h.cards))) { k.tx = BJ_TRAY.x; k.ty = BJ_TRAY.y - Math.min(10, BJ.out / 16); k.up = false; k.fl = 0; BJ.gone.push(k); BJ.out++; }
  BJ.dealer = []; BJ.hands = [];
}
function bjDeal() {
  const bet = BJ_BETS[BJ.betI], n = BJ.spots;
  if (!casinoBet('bj', n * bet)) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('tick'); return; }
  bjSweep();
  BJ.staked = n * bet; BJ.ins = 0; BJ.hint = ''; BJ.cur = -1; BJ.phase = 'deal';
  BJ.msg = '';
  // ponytail: closing the tab mid-hand loses that hand's bet (casPend only guards the payout).
  let wait = 0.3;
  if (BJ.shoe.length < BJ_CUT) { BJ.shoe = cardShoe(BJ_DECKS); BJ.out = 0; BJ.msg = 'A FRESH SHOE'; Audio_.sfx('shuffle'); wait = 1; }
  for (let i = 0; i < n; i++) BJ.hands.push({ spot: i, cards: [], bet, done: false, dbl: false, split: false, aces: false, res: '', pay: 0 });
  for (let r = 0; r < 2; r++) {
    for (const h of BJ.hands) { cq(BJ.q, wait, () => bjGive(h)); wait = 0.28; }
    cq(BJ.q, 0.28, () => BJ.dealer.push(bjDraw(r === 0)));
  }
  cq(BJ.q, 0.45, bjAfterDeal);
}
const bjInsCost = () => Math.floor(BJ.hands[0].bet / 2) * BJ.hands.length;
function bjAfterDeal() {
  const up = BJ.dealer[0].c;
  if (bjVal(up) === 11 && bjInsCost() > 0 && cas().chips >= bjInsCost()) { BJ.phase = 'ins'; BJ.msg = 'INSURANCE?'; return; }
  bjPeek();
}
function bjInsure(yes) {
  if (yes && casinoBet('bj', bjInsCost())) { BJ.ins = bjInsCost(); BJ.staked += BJ.ins; Audio_.sfx('chip'); }
  BJ.hint = '';
  bjPeek();
}
// Under an ace or a ten the dealer checks for blackjack before anyone plays.
function bjPeek() {
  BJ.phase = 'deal';
  const up = bjVal(BJ.dealer[0].c), look = up >= 10;
  if (look && bjNatural(BJ.dealer.map(k => k.c))) {
    BJ.msg = 'DEALER HAS BLACKJACK';
    cq(BJ.q, 0.5, () => { BJ.dealer[1].up = true; Audio_.sfx('card'); });
    cq(BJ.q, 0.7, bjSettle);
    return;
  }
  BJ.msg = look ? (BJ.ins ? 'NO BLACKJACK: INSURANCE LOSES' : 'NO BLACKJACK') : '';
  for (const h of BJ.hands) if (bjNatural(bjCards(h))) { h.done = true; h.res = 'BJ'; }
  if (BJ.hands.some(h => h.res === 'BJ')) Audio_.sfx('cwin');
  cq(BJ.q, look ? 0.5 : 0.1, bjNext);
}
// The next hand to play (a split hand gets its second card first), else the dealer.
function bjNext() {
  const i = BJ.hands.findIndex(h => !h.done);
  BJ.cur = i;
  if (i < 0) { bjDealer(); return; }
  const h = BJ.hands[i];
  if (h.cards.length < 2) {
    BJ.phase = 'deal';
    cq(BJ.q, 0.2, () => bjGive(h));
    cq(BJ.q, 0.4, () => { if (h.aces) h.done = true; bjNext(); });
    return;
  }
  if (bjTotal(bjCards(h)).t >= 21) { h.done = true; bjNext(); return; }
  BJ.phase = 'play';
  BJ.msg = BJ.hands.length > 1 ? 'HAND ' + (i + 1) + ': ' + bjTotal(bjCards(h)).t : '';
}
function bjCan(h) {
  const c = bjCards(h), chips = cas().chips;
  const canD = c.length === 2 && !h.aces && chips >= h.bet;
  const canP = c.length === 2 && bjVal(c[0]) === bjVal(c[1]) && !h.aces && chips >= h.bet && BJ.hands.filter(o => o.spot === h.spot).length < 3;
  return { canD, canP };
}
function bjAct(a) {
  const h = BJ.hands[BJ.cur];
  BJ.hint = '';
  BJ.phase = 'deal';
  if (a === 'S') { h.done = true; bjNext(); return; }
  if (a === 'P') {
    if (!casinoBet('bj', h.bet)) return;
    BJ.staked += h.bet;
    const k = h.cards.pop(), aces = bjVal(k.c) === 11;
    h.split = true; h.aces = aces;
    BJ.hands.splice(BJ.cur + 1, 0, { spot: h.spot, cards: [k], bet: h.bet, done: false, dbl: false, split: true, aces, res: '', pay: 0 });
    Audio_.sfx('chip');
    cq(BJ.q, 0.25, bjNext);
    return;
  }
  if (a === 'D') {
    if (!casinoBet('bj', h.bet)) return;
    BJ.staked += h.bet; h.bet *= 2; h.dbl = true;
    Audio_.sfx('chip');
  }
  cq(BJ.q, 0.1, () => bjGive(h));
  cq(BJ.q, 0.4, () => {
    const t = bjTotal(bjCards(h)).t;
    if (t > 21) { h.res = 'BUST'; h.done = true; Audio_.sfx('rstop'); }
    if (a === 'D' || t >= 21) h.done = true;
    bjNext();
  });
}
// The hole card turns; the dealer draws to 17 unless every hand is already decided.
function bjDealer() {
  BJ.phase = 'deal'; BJ.cur = -1; BJ.msg = '';
  cq(BJ.q, 0.35, () => { BJ.dealer[1].up = true; Audio_.sfx('card'); });
  const live = BJ.hands.some(h => !h.res);
  const step = () => {
    if (live && bjTotal(BJ.dealer.map(k => k.c)).t < 17) { BJ.dealer.push(bjDraw(true)); cq(BJ.q, 0.55, step); }
    else cq(BJ.q, 0.35, bjSettle);
  };
  cq(BJ.q, 0.55, step);
}
// Pure: what each hand gets back (0, the bet, twice it, or 2.5 times for a blackjack).
function bjPay(hand, bet, res, dealer) {
  const d = bjTotal(dealer).t, dBJ = bjNatural(dealer), t = bjTotal(hand).t;
  if (res === 'BUST' || t > 21) return [0, 'BUST'];
  if (res === 'BJ') return dBJ ? [bet, 'PUSH'] : [bet * 2.5, 'BLACKJACK'];
  if (dBJ) return [0, 'LOSE'];
  if (d > 21 || t > d) return [bet * 2, 'WIN'];
  return t === d ? [bet, 'PUSH'] : [0, 'LOSE'];
}
function bjSettle() {
  const D = BJ.dealer.map(k => k.c), dBJ = bjNatural(D);
  let pay = dBJ ? BJ.ins * 3 : 0;
  for (const h of BJ.hands) { const [p, r] = bjPay(bjCards(h), h.bet, h.res, D); h.pay = p; h.res = r; pay += p; }
  casPend('bj', pay);
  casSettle();
  const net = pay - BJ.staked, d = bjTotal(D).t;
  BJ.msg = (dBJ ? 'DEALER BLACKJACK. ' : d > 21 ? 'DEALER BUSTS. ' : 'DEALER HAS ' + d + '. ') + (net > 0 ? 'YOU WIN ' + net : net === 0 ? 'A PUSH' : pay > 0 ? pay + ' BACK' : 'DEALER WINS');
  if (net > 0) casWin(pay, BJ.staked, 192, 110); else Audio_.sfx(pay > 0 ? 'chip' : 'rstop');
  BJ.phase = 'bet'; BJ.cur = -1;
}

CAS_GAMES.bj = {
  name: 'BLACKJACK',
  enter() { if (!BJ.shoe.length) BJ.shoe = cardShoe(BJ_DECKS); BJ.phase = 'bet'; BJ.msg = 'PLACE YOUR BET'; BJ.hint = ''; BJ.q.length = 0; },
  leave() { BJ.dealer = []; BJ.hands = []; BJ.gone = []; BJ.q.length = 0; },
  odds() {
    return ['FOUR DECKS. THE DEALER STANDS ON SOFT 17', 'AND PEEKS FOR BLACKJACK UNDER AN ACE OR A TEN.', 'BLACKJACK PAYS 3 TO 2, A WIN 1 TO 1.', 'INSURANCE PAYS 2 TO 1. IT IS NEVER WORTH IT.', 'DOUBLE ON ANY TWO CARDS, ALSO AFTER A SPLIT.', 'SPLIT TO THREE HANDS. SPLIT ACES TAKE ONE CARD.', 'PLAY LIKE COSMO SAYS AND THE HOUSE KEEPS', 'ABOUT 0.4 OF EVERY 100 CHIPS BET.'];
  },
  update(dt) {
    const busy = BJ.phase !== 'bet';
    casTop(this, busy);
    cqTick(BJ.q, dt);
    bjLayout();
    for (const h of BJ.hands) for (const k of h.cards) tCardTick(k, dt);
    for (const k of BJ.dealer) tCardTick(k, dt);
    for (const k of BJ.gone) tCardTick(k, dt);
    BJ.gone = BJ.gone.filter(k => k.x !== k.tx || k.y !== k.ty);
    if (BJ.phase === 'bet') {
      BJ.spots = 1 + casStepper('spots', 52, 196, 'HANDS', [1, 2, 3], BJ.spots - 1, false);
      BJ.betI = casStepper('bet', 150, 196, 'BET EACH', BJ_BETS, BJ.betI, false);
      const tot = BJ.spots * BJ_BETS[BJ.betI];
      if (cbtn('deal', 262, 190, 70, 20, 'DEAL ' + tot, { primary: true, keys: ['PadX', 'PadStart'], disabled: tot > cas().chips })) bjDeal();
    } else if (BJ.phase === 'ins') {
      if (cbtn('ins', 112, 194, 72, 16, 'INSURE ' + bjInsCost(), { keys: ['KeyY'] })) bjInsure(true);
      if (cbtn('noins', 190, 194, 72, 16, 'NO THANKS', { primary: true, keys: ['KeyN'] })) bjInsure(false);
      if (cbtn('hint', 290, 194, 40, 16, 'HINT', { keys: ['KeyT', 'PadRB'], icon: 'cz_owl_0' })) BJ.hint = 'NO INSURANCE';
    } else if (BJ.phase === 'play') {
      const h = BJ.hands[BJ.cur], { canD, canP } = bjCan(h);
      if (cbtn('hit', 40, 194, 56, 16, 'HIT', { keys: ['KeyH', 'PadX'] })) { bjAct('H'); return; }
      if (cbtn('stand', 102, 194, 56, 16, 'STAND', { keys: ['KeyS', 'PadB'] })) { bjAct('S'); return; }
      if (cbtn('dbl', 164, 194, 56, 16, 'DOUBLE', { keys: ['KeyD', 'PadLB'], disabled: !canD })) { bjAct('D'); return; }
      if (cbtn('split', 226, 194, 56, 16, 'SPLIT', { keys: ['KeyP', 'PadRT'], disabled: !canP })) { bjAct('P'); return; }
      if (cbtn('hint', 300, 194, 44, 16, 'HINT', { keys: ['KeyT', 'PadRB'], icon: 'cz_owl_0' })) BJ.hint = BJ_SAY[bjHint(bjCards(h), BJ.dealer[0].c, canD, canP)];
    }
  },
  draw() {
    ctx.drawImage(casFelt('felt'), 0, 0);
    drawCasTop(this);
    // the printing on the felt
    text('BLACKJACK PAYS 3 TO 2', 192, 80, 'Y', 1, 1);
    text('DEALER STANDS ON SOFT 17', 192, 89, 'h', 0, 1);
    text('INSURANCE PAYS 2 TO 1', 192, 97, 'h', 0, 1);
    // the discard tray and the shoe (a card back peeks out of its mouth)
    const tray = BJ_TRAY, sh = BJ_SHOE;
    rect(tray.x - 3, tray.y + 18, 30, 16, '0'); rect(tray.x - 2, tray.y + 19, 28, 14, 'n'); rect(tray.x - 2, tray.y + 19, 28, 1, 'N'); rect(tray.x - 2, tray.y + 19, 1, 14, 'N'); rect(tray.x - 2, tray.y + 32, 28, 1, 'u'); rect(tray.x + 25, tray.y + 20, 1, 13, 'u');
    const pile = Math.min(10, Math.ceil(BJ.out / 16));
    for (let i = 0; i < pile; i++) { rect(tray.x, tray.y + 17 - i, 24, 1, i % 2 ? 'l' : 'L'); }
    if (pile) rect(tray.x, tray.y + 17 - pile, 24, 1, '0');
    for (const k of BJ.gone) drawTCard(k);
    drawS(S('cd_back_' + cas().back), sh.x, sh.y - 4);
    rect(sh.x - 4, sh.y + 6, 32, 22, '0'); rect(sh.x - 3, sh.y + 7, 30, 20, 'n'); rect(sh.x - 3, sh.y + 7, 30, 1, 'N'); rect(sh.x - 3, sh.y + 7, 1, 20, 'N'); rect(sh.x - 3, sh.y + 26, 30, 1, 'u'); rect(sh.x + 26, sh.y + 8, 1, 19, 'u'); rect(sh.x - 3, sh.y + 7, 30, 2, 'Y'); rect(sh.x - 3, sh.y + 8, 30, 1, 'O');
    // how much of the shoe is left, with the cut card's mark
    const left = BJ.shoe.length / (BJ_DECKS * 52);
    rect(sh.x, sh.y + 21, 24, 3, '0'); rect(sh.x + 1, sh.y + 22, Math.round(22 * left), 1, 'Y');
    rect(sh.x + 1 + Math.round(22 * BJ_CUT / (BJ_DECKS * 52)), sh.y + 21, 1, 3, 'r');
    // the dealer
    for (const k of BJ.dealer) drawTCard(k);
    if (BJ.dealer.length) {
      const shown = BJ.dealer.filter(k => k.up && k.fl >= 0.8).map(k => k.c), last = BJ.dealer[BJ.dealer.length - 1];
      if (shown.length) bjBadge(Math.round(last.x) + 34, 44, bjTotalTxt(shown), bjTotal(shown).t > 21 ? 'r' : '1');
    }
    // the hands, each with its bet below and its total (then its result) above
    BJ.hands.forEach((h, j) => {
      for (const k of h.cards) drawTCard(k);
      const top = h.cards[h.cards.length - 1], cx = h.cx;
      const shown = h.cards.filter(k => k.fl >= 0.8).map(k => k.c);
      const ty = top ? Math.round(top.y) - 8 : 124;
      if (h.res && BJ.phase === 'bet') {
        const R = { WIN: ['WIN', 'G'], BLACKJACK: ['BLACKJACK', 'y'], PUSH: ['PUSH', '2'], BUST: ['BUST', 'r'], LOSE: ['LOSE', 'r'] }[h.res];
        bjBadge(cx, ty, R[0], R[1]);
      } else if (h.res === 'BJ') bjBadge(cx, ty, 'BLACKJACK', 'y');
      else if (h.res === 'BUST') bjBadge(cx, ty, 'BUST', 'r');
      else if (shown.length) bjBadge(cx, ty, bjTotalTxt(shown), '1');
      // whose turn: a bouncing gold arrow over the badge
      if (j === BJ.cur && BJ.phase === 'play') {
        const ay = ty - 12 + (Math.floor(G.time * 4) % 2);
        rect(cx - 3, ay, 7, 1, '0'); rect(cx - 2, ay + 1, 5, 1, 'Y'); rect(cx - 1, ay + 2, 3, 1, 'y'); rect(cx, ay + 3, 1, 1, 'O');
      }
      drawChipAt(cx, 171, h.bet, true);
      if (h.dbl) text('X2', cx + 8, 172, 'Y', 2, 0);
      if (h.pay && BJ.phase === 'bet') text('+' + Math.floor(h.pay), cx - 8, 172, 'Y', 2, 2);
    });
    // the message line; Cosmo's advice wins it
    if (BJ.hint) {
      const t = 'COSMO SAYS: ' + BJ.hint, w = textW(t) + 14;
      drawS(S('cz_owl_' + (Math.floor(G.time * 3) % 2)), 192 - w / 2 - 4, 58);
      text(t, 192 + 7, 68, 'Y', 1, 1);
    } else if (BJ.msg) text(BJ.msg, 192, 68, 'w', 1, 1);
    if (BJ.phase === 'bet') { drawStepper('spots', BJ.spots); drawStepper('bet', BJ_BETS[BJ.betI]); }
    drawBtns();
    drawCasFx();
  },
};
const bjTotalTxt = (c) => { const { t, soft } = bjTotal(c); return soft && t < 21 ? (t - 10) + '/' + t : String(t); };
// A small plate with a number or a word, centred on x.
function bjBadge(x, y, s, col) {
  const w = textW(s) + 6;
  rect(Math.round(x - w / 2), y - 5, w, 10, '0');
  rect(Math.round(x - w / 2) + 1, y - 4, w - 2, 8, col);
  rect(Math.round(x - w / 2) + 1, y - 4, w - 2, 1, col === '1' ? '2' : col === 'y' ? 'Y' : col === 'r' ? 'R' : col === 'G' ? 'h' : '3');
  text(s, x, y - 3, col === 'y' ? '1' : 'w', 0, 1);
}

// ---------- Video poker: 8/5 Jacks or Better ----------
const VP_HANDS = ['ROYAL FLUSH', 'STRAIGHT FLUSH', 'FOUR OF A KIND', 'FULL HOUSE', 'FLUSH', 'STRAIGHT', 'THREE OF A KIND', 'TWO PAIR', 'JACKS OR BETTER'];
const VP_PAY = [250, 50, 25, 8, 5, 4, 3, 2, 1];
const VP_DENS = [1, 5, 25];
// what a hand pays per coin at `coins` coins (the royal jumps to 800 per coin at five)
const vpPays = (h, coins) => h === 0 && coins === 5 ? 4000 : VP_PAY[h] * coins;
// Pure: the hand's row in VP_HANDS, or -1 for no win.
const _vpN = new Int8Array(13);
function vpRank(cards) {
  _vpN.fill(0);
  let fl = true, lo = 13, hi = -1, pairs = 0, three = false, four = false, jacks = false;
  for (let i = 0; i < 5; i++) { const r = cards[i] >> 2; _vpN[r]++; if ((cards[i] & 3) !== (cards[0] & 3)) fl = false; }
  let kinds = 0;
  for (let r = 0; r < 13; r++) {
    const n = _vpN[r];
    if (!n) continue;
    kinds++; if (r < lo) lo = r; if (r > hi) hi = r;
    if (n === 4) four = true; else if (n === 3) three = true;
    else if (n === 2) { pairs++; if (r === 0 || r >= 10) jacks = true; }
  }
  const broad = kinds === 5 && _vpN[0] && _vpN[9] && _vpN[10] && _vpN[11] && _vpN[12];
  const st = kinds === 5 && (hi - lo === 4 || broad);
  if (st && fl) return broad ? 0 : 1;
  if (four) return 2;
  if (three && pairs) return 3;
  if (fl) return 4;
  if (st) return 5;
  if (three) return 6;
  if (pairs === 2) return 7;
  return jacks ? 8 : -1;
}
// Cosmo's advice: the hold with the best average pay (5 coins). Holds that draw three
// cards or fewer are counted exactly; bigger draws are sampled from a fixed sequence, so
// the same hand always gets the same advice.
function vpBestHold(hand) {
  const rest = [];
  for (let c = 0; c < 52; c++) if (!hand.includes(c)) rest.push(c);
  const pay = (r) => r < 0 ? 0 : vpPays(r, 5), h = [0, 0, 0, 0, 0];
  let best = -1, bestM = 0;
  for (let m = 0; m < 32; m++) {
    const keep = [], slots = [];
    for (let i = 0; i < 5; i++) if (m >> i & 1) keep.push(hand[i]); else slots.push(i);
    for (let i = 0; i < 5; i++) h[i] = hand[i];
    const k = slots.length;
    let sum = 0, n = 0;
    if (k <= 3) {
      const rec = (from, j) => {
        if (j === k) { sum += pay(vpRank(h)); n++; return; }
        for (let a = from; a < rest.length; a++) { h[slots[j]] = rest[a]; rec(a + 1, j + 1); }
      };
      rec(0, 0);
    } else {
      let s = 12345 + m;
      const pick = rest.slice();
      for (let t = 0; t < 3000; t++) {
        for (let j = 0; j < k; j++) { s = (s * 1103515245 + 12345) & 0x7fffffff; const a = j + s % (pick.length - j), x = pick[a]; pick[a] = pick[j]; pick[j] = x; h[slots[j]] = x; }
        sum += pay(vpRank(h)); n++;
      }
    }
    if (sum / n > best + 1e-9) { best = sum / n; bestM = m; }
  }
  vpBestHold.ev = best;
  return bestM;
}
const VP = { den: 0, coins: 5, cards: [], held: [], phase: 'bet', deck: [], res: -1, win: 0, bet: 0, advice: -1, blink: 0 };
const VP_X = (i) => 192 - 2 * 44 - 12 + i * 44, VP_Y = 110;
function vpDeal() {
  const bet = VP_DENS[VP.den] * VP.coins;
  if (!casinoBet('vp', bet)) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('tick'); return; }
  VP.bet = bet; VP.res = -1; VP.win = 0; VP.advice = -1;
  VP.deck = cardShoe(1);
  Audio_.sfx('shuffle');
  VP.cards = [0, 1, 2, 3, 4].map(i => { const k = tCard(VP.deck.pop(), VP_X(i), VP_Y, true); k.wait = 0.15 + i * 0.1; return k; });
  VP.held = [false, false, false, false, false];
  VP.phase = 'deal';
}
function vpDraw() {
  VP.advice = -1;
  let j = 0;
  VP.cards.forEach((k, i) => { if (!VP.held[i]) { k.c = VP.deck.pop(); k.fl = 0; k.wait = 0.1 + j++ * 0.1; } });
  // commit the pay before the cards turn
  const r = vpRank(VP.cards.map(k => k.c));
  VP.res = r; VP.win = r < 0 ? 0 : vpPays(r, VP.coins) * VP_DENS[VP.den];
  casPend('vp', VP.win);
  VP.phase = 'draw';
  if (!j) VP.cards[0].wait = 0.01;
}
const vpSettled = () => VP.cards.every(k => k.fl >= 1);
CAS_GAMES.vp = {
  name: 'VIDEO POKER',
  enter() { VP.phase = 'bet'; VP.cards = []; VP.res = -1; VP.advice = -1; },
  leave() {},
  odds() {
    return ['JACKS OR BETTER. ONE DECK, SHUFFLED EVERY HAND.', 'HOLD ANY CARDS, THEN DRAW NEW ONES FOR THE REST.', 'A PAIR OF JACKS, QUEENS, KINGS OR ACES PAYS.', 'A ROYAL FLUSH PAYS 4000 COINS WHEN 5 ARE BET.', 'WITH 5 COINS AND PERFECT PLAY IT PAYS BACK', '97.3 OF EVERY 100 CHIPS BET. COSMO KNOWS HOW.'];
  },
  update(dt) {
    const busy = VP.phase === 'deal' || VP.phase === 'draw';
    casTop(this, busy || VP.phase === 'hold');
    for (const k of VP.cards) {
      const was = k.fl;
      tCardTick(k, dt);
      if (was === 0 && k.fl > 0) Audio_.sfx('card');
    }
    if (VP.phase === 'deal' && vpSettled()) VP.phase = 'hold';
    if (VP.phase === 'draw' && vpSettled()) {
      VP.phase = 'bet';
      casSettle();
      if (VP.win) casWin(VP.win, VP.bet, 192, VP_Y + 16); else Audio_.sfx('rstop');
    }
    const choose = VP.phase === 'bet';
    VP.den = casStepper('den', 16, 196, 'CHIP VALUE', VP_DENS, VP.den, !choose);
    if (cbtn('one', 104, 190, 50, 20, 'BET ONE', { keys: ['KeyB', 'PadLB'], disabled: !choose })) { VP.coins = VP.coins % 5 + 1; Audio_.sfx('chip'); }
    if (cbtn('max', 160, 190, 50, 20, 'BET MAX', { keys: ['KeyM', 'PadRT'], disabled: !choose || VP.coins === 5 })) { VP.coins = 5; Audio_.sfx('chip'); }
    if (VP.phase === 'hold') {
      for (let i = 0; i < 5; i++) {
        const x = VP_X(i);
        let hit = cbtn('hold' + i, x - 4, VP_Y + 36, 32, 13, VP.held[i] ? 'HELD' : 'HOLD', { keys: ['Digit' + (i + 1), 'Numpad' + (i + 1)], on: VP.held[i], quiet: true });
        if (!hit && !CB.fired && Input.mouseHit && mouseOn() && Input.mx >= x && Input.mx < x + 24 && Input.my >= VP_Y && Input.my < VP_Y + 32) { hit = true; CB.fired = true; CB.focus = 'hold' + i; }
        if (hit) { VP.held[i] = !VP.held[i]; Audio_.sfx(VP.held[i] ? 'chip' : 'select'); }
      }
      if (cbtn('hint', 216, 190, 44, 20, 'HINT', { keys: ['KeyT', 'PadRB'], icon: 'cz_owl_0' })) VP.advice = vpBestHold(VP.cards.map(k => k.c));
      if (cbtn('draw', 290, 186, 80, 26, 'DRAW', { primary: true, keys: ['PadX', 'PadStart'] })) vpDraw();
    } else if (cbtn('deal', 290, 186, 80, 26, 'DEAL ' + VP_DENS[VP.den] * VP.coins, { primary: true, keys: ['PadX', 'PadStart'], disabled: busy || VP_DENS[VP.den] * VP.coins > cas().chips })) vpDeal();
  },
  draw() {
    ctx.drawImage(casFelt('plum'), 0, 0);
    drawCasTop(this);
    // the pay table: the column for the coins bet is lit, a winning row blinks
    const x0 = 8, y0 = 25, cw = 50, lx = 126, hand = VP.phase === 'hold' ? vpRank(VP.cards.map(k => k.c)) : VP.phase === 'bet' ? VP.res : -1;
    rect(x0 - 1, y0 - 1, VW - 2 * x0 + 2, 9 * 8 + 4, '0');
    rect(x0, y0, VW - 2 * x0, 9 * 8 + 2, 'b');
    rect(lx + (VP.coins - 1) * cw, y0, cw, 9 * 8 + 2, 'e');
    const blink = Math.floor(G.time * 3) % 2;
    VP_HANDS.forEach((nm, r) => {
      const y = y0 + 2 + r * 8, lit = r === hand;
      if (lit && blink) rect(x0, y - 1, VW - 2 * x0, 8, 'y');
      text(nm, x0 + 4, y, lit && blink ? '1' : 'Y', 0, 0);
      for (let c = 1; c <= 5; c++) text(String(vpPays(r, c)), lx + c * cw - 6, y, lit && blink ? '1' : c === VP.coins ? 'w' : 'c', 0, 2);
    });
    // the cards, the hold buttons, Cosmo's advice
    for (const k of VP.cards) drawTCard(k);
    VP.cards.forEach((k, i) => {
      if (VP.advice >= 0 && VP.advice >> i & 1 && VP.phase === 'hold') { const x = VP_X(i); rect(x - 2, VP_Y - 2, 28, 1, 'c'); rect(x - 2, VP_Y + 33, 28, 1, 'c'); rect(x - 2, VP_Y - 2, 1, 36, 'c'); rect(x + 25, VP_Y - 2, 1, 36, 'c'); }
      if (VP.held[i] && VP.phase !== 'hold') text('HELD', VP_X(i) + 12, VP_Y + 42, 'Y', 1, 1);
    });
    let msg = '', col = 'w';
    if (VP.phase === 'hold' && VP.advice >= 0) msg = VP.advice ? 'COSMO WOULD HOLD THE LIT CARDS' : 'COSMO WOULD DRAW FIVE NEW CARDS';
    else if (VP.phase === 'hold') msg = 'PICK THE CARDS TO HOLD, THEN DRAW';
    else if (VP.phase === 'bet' && VP.res >= 0) { msg = VP_HANDS[VP.res] + '! WIN ' + VP.win; col = 'Y'; }
    else if (VP.phase === 'bet' && VP.cards.length) { msg = 'NO WIN. DEAL AGAIN?'; col = '3'; }
    else if (VP.phase === 'bet') msg = 'PRESS DEAL';
    if (msg) {
      if (VP.advice >= 0 && VP.phase === 'hold') drawS(S('cz_owl_' + (Math.floor(G.time * 3) % 2)), 192 - textW(msg) / 2 - 18, 160);
      text(msg, 192, 170, col, 1, 1);
    }
    if (!VP.cards.length) for (let i = 0; i < 5; i++) drawS(S('cd_back_' + cas().back), VP_X(i), VP_Y);
    drawStepper('den', VP_DENS[VP.den]);
    drawBtns();
    drawCasFx();
  },
};
