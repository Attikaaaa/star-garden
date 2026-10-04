'use strict';
// Texas Hold'em in the VIP lounge: a sit-and-go against three bots. Everyone starts with the
// same stack of table chips (never purse chips), the blinds climb every few hands, and the
// last one with chips wins the pot (and, the first time, the Royal card back).
// Ribbit the frog plays tight, Hoot the owl plays the odds, Rusty the fox loves a bluff.
// Seats go clockwise: 0 you (bottom), 1 the frog (left), 2 the owl (top), 3 the fox (right).

const HE_BUY = 500, HE_FEE = 50, HE_STACK = 1000, HE_EVERY = 5, HE_PRIZE = HE_BUY * 4;
const HE_BLINDS = [[10, 20], [15, 30], [25, 50], [40, 80], [60, 120], [100, 200], [150, 300], [250, 500], [400, 800], [600, 1200]];
// loose: how much worse odds it still calls; aggro: how often strength turns into a raise
const HE_BOTS = [null,
  { name: 'RIBBIT', spr: 'frog_', style: 'PLAYS TIGHT', loose: -0.1, aggro: 0.7, bluff: 0.03 },
  { name: 'HOOT', spr: 'cz_owl_', style: 'PLAYS THE ODDS', loose: 0, aggro: 1, bluff: 0.07 },
  { name: 'RUSTY', spr: 'wfox_', style: 'LOVES A BLUFF', loose: 0.08, aggro: 1.3, bluff: 0.28 },
];

// ---------- The hand evaluator ----------
// The best five of 5 to 7 cards as one number: a bigger number is a better hand. The
// category (0 high card .. 8 straight flush) leads, then up to five ranks (ace high is 12).
const HE_NAMES = ['HIGH CARD', 'A PAIR', 'TWO PAIR', 'THREE OF A KIND', 'A STRAIGHT', 'A FLUSH', 'A FULL HOUSE', 'FOUR OF A KIND', 'A STRAIGHT FLUSH'];
const heCat = (score) => Math.floor(score / 371293); // 13 ** 5
const heName = (score) => (score === heSc(8, [12]) ? 'A ROYAL FLUSH' : HE_NAMES[heCat(score)]);
function heSc(cat, ks) { let v = cat; for (let i = 0; i < 5; i++) v = v * 13 + (ks[i] || 0); return v; }
// The highest straight in a rank mask (the ace also plays low), or -1.
function heStraight(b) {
  for (let h = 12; h >= 3; h--) {
    let ok = true;
    for (let k = 0; k < 5 && ok; k++) { const r = h - k; ok = !!(b & (1 << (r < 0 ? 12 : r))); }
    if (ok) return h;
  }
  return -1;
}
// The n highest ranks in a mask, leaving out `skip`.
function heTop(b, n, skip) { const o = []; for (let r = 12; r >= 0 && o.length < n; r--) if (b & (1 << r) && !(skip & (1 << r))) o.push(r); return o; }
function heScore(cs) {
  const cnt = new Array(13).fill(0), sb = [0, 0, 0, 0], sn = [0, 0, 0, 0];
  let bits = 0;
  for (const c of cs) { const r = (cRank(c) + 12) % 13, s = cSuit(c); cnt[r]++; sb[s] |= 1 << r; sn[s]++; bits |= 1 << r; }
  for (let s = 0; s < 4; s++) if (sn[s] >= 5) { const h = heStraight(sb[s]); if (h >= 0) return heSc(8, [h]); }
  const q = [], t = [], p = [];
  for (let r = 12; r >= 0; r--) { if (cnt[r] === 4) q.push(r); else if (cnt[r] === 3) t.push(r); else if (cnt[r] === 2) p.push(r); }
  if (q.length) return heSc(7, [q[0], heTop(bits, 1, 1 << q[0])[0]]);
  if (t.length && (t.length > 1 || p.length)) return heSc(6, [t[0], Math.max(t.length > 1 ? t[1] : -1, p.length ? p[0] : -1)]);
  for (let s = 0; s < 4; s++) if (sn[s] >= 5) return heSc(5, heTop(sb[s], 5, 0));
  const h = heStraight(bits);
  if (h >= 0) return heSc(4, [h]);
  if (t.length) return heSc(3, [t[0]].concat(heTop(bits, 2, 1 << t[0])));
  if (p.length >= 2) return heSc(2, [p[0], p[1], heTop(bits, 1, (1 << p[0]) | (1 << p[1]))[0]]);
  if (p.length) return heSc(1, [p[0]].concat(heTop(bits, 3, 1 << p[0])));
  return heSc(0, heTop(bits, 5, 0));
}
// A bot's sense of its chances: deal the unseen cards out many times against `opp` random
// hands and count its share of the wins (ties split).
function heEquity(hole, board, opp, n) {
  const seen = hole.concat(board), rest = [];
  for (let c = 0; c < 52; c++) if (!seen.includes(c)) rest.push(c);
  const need = 5 - board.length + opp * 2;
  let won = 0;
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < need; i++) { const j = i + crand(rest.length - i), x = rest[i]; rest[i] = rest[j]; rest[j] = x; }
    const B = board.concat(rest.slice(0, 5 - board.length)), me = heScore(hole.concat(B));
    let best = 0, ties = 0;
    for (let o = 0; o < opp; o++) {
      const at = 5 - board.length + o * 2, s = heScore([rest[at], rest[at + 1]].concat(B));
      if (s > best) best = s;
      if (s === me) ties++;
    }
    if (me > best) won++; else if (me === best) won += 1 / (ties + 1);
  }
  return won / n;
}

// ---------- The table ----------
// HE.log is the hand in play: the stacks and the button it started with, its deck and every
// action taken (by anyone), saved in cas().pend.hold. A reload replays it to the same spot.
const HE = {
  phase: 'lobby', st: [0, 0, 0, 0], btn: 0, hand: 0, deck: [], hole: [[], [], [], []], board: [], gone: [],
  put: [0, 0, 0, 0], bet: [0, 0, 0, 0], fold: [true, true, true, true], acted: [], cur: -1, curBet: 0, minR: 0,
  street: 0, q: [], log: null, replay: false, wait: false, say: ['', '', '', ''], sayT: [0, 0, 0, 0],
  msg: '', place: 0, raiseI: 0, win: null, newBack: false, lvlShown: 0,
};
const HE_DECK = { x: 96, y: 26 };
const heBlinds = () => HE_BLINDS[Math.min(HE_BLINDS.length - 1, Math.floor(HE.hand / HE_EVERY))];
const heIn = (i) => HE.hole[i].length > 0 && !HE.fold[i];
const heLive = () => [0, 1, 2, 3].filter(heIn);
const heSum = (a) => a[0] + a[1] + a[2] + a[3];
const heWho = (i) => (i ? HE_BOTS[i].name : 'YOU');
// The next seat after i, clockwise, that passes `ok`.
function heNext(i, ok) { for (let k = 1; k <= 4; k++) { const j = (i + k) % 4; if (ok(j)) return j; } return -1; }
function heSave() { cas().pend = { g: 'hold', n: 0, hold: HE.log }; Save.write(); }
function hePost(i, n) { n = Math.max(0, Math.min(n, HE.st[i])); HE.st[i] -= n; HE.bet[i] += n; HE.put[i] += n; return n; }
function heSay(i, s) { HE.say[i] = s; HE.sayT[i] = 2.2; }
function heDraw(up) {
  if (!HE.replay) Audio_.sfx('card');
  return tCard(HE.deck.pop(), HE_DECK.x, HE_DECK.y, up);
}
// The last hand's cards slide back to the deck.
function heSweep() {
  for (const k of HE.board.concat(...HE.hole)) { k.tx = HE_DECK.x; k.ty = HE_DECK.y; k.up = false; k.fl = 0; HE.gone.push(k); }
  HE.board = []; HE.hole = [[], [], [], []];
}
function heBuyIn() {
  if (!casinoBet('hold', HE_BUY + HE_FEE)) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('deny'); return; }
  HE.st = [HE_STACK, HE_STACK, HE_STACK, HE_STACK]; HE.hand = 0; HE.btn = crand(4); HE.lvlShown = 0;
  HE.phase = 'play'; HE.place = 0; HE.newBack = false;
  Audio_.sfx('shuffle');
  heNewHand();
}
// Deal a hand: a fresh deck (or the saved one), the blinds, two cards each.
function heNewHand(log) {
  heSweep();
  if (log) { HE.st = log.st.slice(); HE.btn = log.btn; HE.hand = log.hand; HE.deck = cUnpack(log.deck); HE.log = log; }
  else {
    HE.btn = heNext(HE.btn, i => HE.st[i] > 0);
    HE.deck = cshuffle([...Array(52).keys()]);
    HE.log = { st: HE.st.slice(), btn: HE.btn, hand: HE.hand, deck: cPack(HE.deck), a: [] };
    heSave();
  }
  const alive = [0, 1, 2, 3].filter(i => HE.st[i] > 0), [sb, bb] = heBlinds();
  HE.put = [0, 0, 0, 0]; HE.bet = [0, 0, 0, 0]; HE.fold = [0, 1, 2, 3].map(i => HE.st[i] <= 0);
  HE.acted = [false, false, false, false]; HE.street = 0; HE.win = null; HE.cur = -1; HE.wait = false;
  HE.say = ['', '', '', '']; HE.msg = '';
  const lvl = Math.floor(HE.hand / HE_EVERY);
  if (lvl > HE.lvlShown) { HE.lvlShown = lvl; HE.msg = 'THE BLINDS GO UP: ' + sb + '/' + bb; }
  // heads up, the button posts the small blind
  const sbI = alive.length === 2 ? HE.btn : heNext(HE.btn, i => HE.st[i] > 0), bbI = heNext(sbI, i => HE.st[i] > 0);
  hePost(sbI, sb); hePost(bbI, bb);
  HE.curBet = bb; HE.minR = bb;
  let wait = 0.35;
  for (let r = 0; r < 2; r++) for (let k = 0; k < alive.length; k++) {
    const i = alive[(alive.indexOf(sbI) + k) % alive.length];
    cq(HE.q, wait, () => HE.hole[i].push(heDraw(i === 0))); wait = 0.16;
  }
  cq(HE.q, 0.3, () => { HE.cur = heNext(bbI, i => heIn(i) && HE.st[i] > 0); if (HE.cur < 0) heFlow(bbI); else heAsk(); });
}
// Someone is to act: the player picks with the buttons, a bot thinks for a moment.
function heAsk() {
  HE.wait = true;
  if (HE.replay || HE.cur === 0) { HE.raiseI = 0; return; }
  const i = HE.cur;
  cq(HE.q, heIn(0) ? 0.6 + crandf() * 0.6 : 0.3, () => heAct(heBot(i)));
}
// One action by the seat in turn: f fold, k check, c call, r<n> raise the bet to n.
function heAct(tok) {
  const i = HE.cur;
  if (i < 0 || !HE.wait) return;
  HE.wait = false;
  const call = HE.curBet - HE.bet[i], was = HE.curBet;
  let sfx = 'chip';
  if (tok === 'f' && call > 0) {
    HE.fold[i] = true; heSay(i, 'FOLD'); sfx = 'card';
    if (i) for (const k of HE.hole[i]) { k.tx = HE_DECK.x; k.ty = HE_DECK.y; k.up = false; k.fl = 0; } // yours stay to look at
  } else if (tok[0] !== 'r' || HE.st[i] <= call) {
    if (call > 0) { const n = hePost(i, call); heSay(i, HE.st[i] ? 'CALL ' + n : 'ALL IN'); }
    else { heSay(i, 'CHECK'); sfx = 'tick'; }
    tok = call > 0 ? 'c' : 'k';
  } else {
    const all = HE.st[i] + HE.bet[i], to = Math.min(all, Math.max(+tok.slice(1) || 0, HE.curBet + HE.minR));
    if (to - HE.curBet >= HE.minR) HE.minR = to - HE.curBet;
    hePost(i, to - HE.bet[i]);
    HE.curBet = Math.max(HE.curBet, to);
    for (let k = 0; k < 4; k++) if (k !== i) HE.acted[k] = false;
    heSay(i, HE.st[i] ? (was ? 'RAISE TO ' : 'BET ') + to : 'ALL IN');
    tok = 'r' + to;
  }
  HE.acted[i] = true;
  if (!HE.replay) { Audio_.sfx(sfx); HE.log.a.push(tok); heSave(); }
  heFlow(i);
}
// After an action: the next seat in turn, the next street, or the end of the hand.
function heFlow(last) {
  HE.cur = -1;
  const live = heLive(), actors = live.filter(i => HE.st[i] > 0);
  if (live.length === 1) { cq(HE.q, 0.5, heAward); return; }
  const owe = actors.filter(i => !HE.acted[i] || HE.bet[i] < HE.curBet);
  if (owe.length && !(actors.length === 1 && HE.bet[actors[0]] >= HE.curBet)) { HE.cur = heNext(last, i => owe.includes(i)); heAsk(); return; }
  cq(HE.q, 0.5, heStreet);
}
// The bets go in, and the next shared cards come out (all of them when nobody can bet).
function heStreet() {
  HE.bet = [0, 0, 0, 0]; HE.curBet = 0; HE.minR = heBlinds()[1]; HE.acted = [false, false, false, false];
  if (HE.street === 3) { heAward(); return; }
  HE.street++;
  HE.deck.pop(); // the burn card
  for (let k = 0; k < (HE.street === 1 ? 3 : 1); k++) cq(HE.q, k ? 0.16 : 0.1, () => HE.board.push(heDraw(true)));
  cq(HE.q, 0.4, () => {
    const actors = heLive().filter(i => HE.st[i] > 0);
    if (actors.length < 2) { cq(HE.q, 0.5, heStreet); return; }
    HE.cur = heNext(HE.btn, i => actors.includes(i)); heAsk();
  });
}
// Who gets the pot: the last one in, or the best hands at the showdown, pot by pot when
// someone is all in for less (each side pot goes to the best hand among those who paid in).
function heAward() {
  const live = heLive(), won = [0, 0, 0, 0], sc = [0, 0, 0, 0], board = HE.board.map(k => k.c);
  if (live.length === 1) won[live[0]] = heSum(HE.put);
  else {
    for (const i of live) { for (const k of HE.hole[i]) k.up = true; sc[i] = heScore(HE.hole[i].map(k => k.c).concat(board)); }
    let prev = 0;
    for (const L of [...new Set(HE.put.filter(p => p > 0))].sort((a, b) => a - b)) {
      let pot = 0;
      for (let j = 0; j < 4; j++) pot += Math.max(0, Math.min(HE.put[j], L) - prev);
      const elig = live.filter(j => HE.put[j] >= L), to = elig.length ? elig : live;
      const top = Math.max(...to.map(j => sc[j])), ws = to.filter(j => sc[j] === top), share = Math.floor(pot / ws.length);
      for (const j of ws) won[j] += share;
      won[heNext(HE.btn, j => ws.includes(j))] += pot - share * ws.length; // the odd chip
      prev = L;
    }
  }
  for (let j = 0; j < 4; j++) HE.st[j] += won[j];
  const ws = [0, 1, 2, 3].filter(j => won[j] > 0), show = live.length > 1;
  HE.win = { won, sc, show, ws };
  HE.put = [0, 0, 0, 0]; HE.bet = [0, 0, 0, 0]; HE.cur = -1; HE.wait = false;
  const what = show ? ' WITH ' + heName(sc[ws[0]]) : '';
  HE.msg = ws.length > 1 ? 'A SPLIT POT' + what : (ws[0] ? heWho(ws[0]) + ' WINS ' : 'YOU WIN ') + won[ws[0]] + what;
  if (!HE.replay) Audio_.sfx(ws.includes(0) ? 'cwin' : 'rstop');
  cq(HE.q, show ? 3 : 1.6, heEndHand);
}
// Out of chips is out. You busting, or the last one standing, ends the tournament.
function heEndHand() {
  const alive = [0, 1, 2, 3].filter(i => HE.st[i] > 0);
  if (HE.st[0] <= 0) { heOver(alive.length + 1); return; }
  if (alive.length === 1) { heOver(1); return; }
  HE.hand++;
  heNewHand();
}
function heOver(place) {
  HE.phase = 'over'; HE.place = place; HE.cur = -1; HE.wait = false; HE.q.length = 0; HE.log = null;
  const c = cas();
  casPend('hold', place === 1 ? HE_PRIZE : 0);
  const paid = casSettle();
  if (place === 1) {
    if (!c.own.includes('back_royal')) { c.own.push('back_royal'); HE.newBack = true; }
    note('cas', 'hold', 'hewin');
    casWin(paid, HE_BUY + HE_FEE, 192, 100);
    G.banner = { title: 'YOU WIN THE TABLE!', sub: '+' + paid + ' CHIPS', t: 3, icon: 'chip' };
  } else Audio_.sfx('rstop');
  Save.write();
}
// Leave the table for good: you finish behind everyone still holding chips.
function heForfeit() { HE.q.length = 0; heOver([0, 1, 2, 3].filter(i => i && HE.st[i] > 0).length + 1); }
function heResume(log) {
  HE.replay = true; HE.q.length = 0; HE.phase = 'play'; HE.place = 0;
  HE.lvlShown = Math.floor(log.hand / HE_EVERY);
  heNewHand({ st: log.st, btn: log.btn, hand: log.hand, deck: log.deck, a: log.a.slice() });
  const acts = log.a.slice();
  let i = 0;
  for (let guard = 0; guard < 3000; guard++) {
    if (HE.q.length) { HE.q.shift().fn(); continue; }
    if (HE.wait && i < acts.length) { heAct(acts[i++]); continue; }
    break;
  }
  HE.replay = false;
  heLayout();
  for (const k of HE.board.concat(...HE.hole)) { k.x = k.tx; k.y = k.ty; k.wait = 0; k.fl = k.up ? 1 : 0; }
  HE.gone = [];
  if (HE.phase === 'play') { HE.msg = 'YOUR SEAT WAITED FOR YOU'; if (HE.wait && HE.cur !== 0) { HE.wait = false; heAsk(); } }
}

// ---------- The bots ----------
// Strength is the bot's share of wins against random hands, times the players in the hand
// (1 is an average hand). Pot odds decide a call; strength or a bluff makes a raise. Short
// stacks push all in or fold.
function heBot(i) {
  const B = HE_BOTS[i], n = heLive().length, r = crandf();
  const eq = heEquity(HE.hole[i].map(k => k.c), HE.board.map(k => k.c), n - 1, 200), s = eq * n;
  const call = HE.curBet - HE.bet[i], pot = heSum(HE.put), bb = heBlinds()[1], all = HE.st[i] + HE.bet[i];
  const raise = (to) => 'r' + Math.min(all, Math.max(Math.round(to / 5) * 5, HE.curBet + HE.minR));
  if (all <= 10 * bb) return s > 1.25 - B.loose * 2 || (!call && r < B.bluff) ? 'r' + all : call ? 'f' : 'k';
  if (!call) return s > 1.35 - B.loose || r < B.bluff ? raise(pot * (0.45 + 0.3 * B.aggro * crandf())) : 'k';
  const odds = call / (pot + call);
  if (eq < odds + 0.04 - B.loose) return r < B.bluff * 0.4 && call < pot / 2 ? raise(HE.curBet * 2.5) : 'f';
  if (s > 1.6 - B.loose && r < 0.5 * B.aggro) return raise(HE.curBet + pot * (0.6 + 0.4 * crandf()));
  return 'c';
}

// ---------- The screen ----------
// Where each seat draws: its cards (the left card, face down overlapping, spread at the
// showdown), the avatar, the name and stack, what it just said, its bet and the dealer button.
// al: 0 left, 1 centre, 2 right.
const HE_SEAT = [
  { cx: 166, cy: 136, dx: 26, nx: 152, ny: 140, al: 2, bx: 236, by: 152, dbx: 154, dby: 160 },
  { cx: 52, cy: 56, dx: 10, ax: 6, ay: 50, nx: 4, ny: 70, al: 0, sx: 4, sy: 90, bx: 98, by: 100, dbx: 92, dby: 60 },
  { cx: 206, cy: 24, dx: 10, ax: 183, ay: 26, nx: 180, ny: 26, al: 2, sx: 180, sy: 44, bx: 262, by: 62, dbx: 244, dby: 30 },
  { cx: 308, cy: 56, dx: 10, ax: 359, ay: 50, nx: 380, ny: 70, al: 2, sx: 380, sy: 90, bx: 286, by: 100, dbx: 283, dby: 60 },
];
function heLayout() {
  HE.board.forEach((k, i) => { k.tx = 128 + i * 26; k.ty = 76; });
  HE.hole.forEach((h, i) => {
    if (HE.fold[i] && i) return;
    const P = HE_SEAT[i], dx = i && HE.win && HE.win.show ? 16 : P.dx, x0 = i === 3 ? P.cx + P.dx - dx : P.cx;
    h.forEach((k, j) => { k.tx = x0 + j * dx; k.ty = P.cy; });
  });
}
// The raise sizes on offer: the minimum, half the pot, the pot, twice the pot (all below all in).
function heSizes() {
  const all = HE.st[0] + HE.bet[0], pot = heSum(HE.put), min = HE.curBet + HE.minR;
  const out = [...new Set([min, HE.curBet + pot / 2, HE.curBet + pot, HE.curBet + pot * 2].map(v => Math.round(Math.max(min, v) / 5) * 5))].filter(v => v < all);
  return out.length ? out : [all];
}
CAS_GAMES.hold = {
  name: "HOLD'EM",
  enter(pend) {
    HE.q.length = 0; HE.gone = []; HE.msg = '';
    if (pend && pend.hold) heResume(pend.hold);
    else { HE.phase = 'lobby'; heSweep(); HE.gone = []; }
    Audio_.play('vip');
  },
  leave() { HE.q.length = 0; heSweep(); HE.gone = []; },
  leaveAsk() {
    if (HE.phase !== 'play') return false;
    openModal({ title: 'LEAVE THE TABLE?', lines: ['YOUR SEAT WAITS: COME BACK ANY TIME', 'AND THE GAME GOES ON FROM HERE.', '', 'TO GIVE UP, FOLD THE TOURNAMENT:', 'YOU FINISH BEHIND EVERYONE WITH CHIPS.'],
      buttons: [{ label: 'STAY' }, { label: 'LEAVE', fn: casLeave }, { label: 'GIVE UP', col: 'R', fn: heForfeit }] });
    return true;
  },
  odds() {
    return ['FOUR SEATS: YOU, RIBBIT, HOOT AND RUSTY.', 'BUY IN ' + HE_BUY + ' + ' + HE_FEE + ' HOUSE FEE. EVERYONE STARTS', 'WITH ' + HE_STACK + ' TABLE CHIPS. NO LIMIT.', 'THE BLINDS GO UP EVERY ' + HE_EVERY + ' HANDS.', 'THE LAST ONE WITH CHIPS WINS ' + HE_PRIZE + ' CHIPS.', 'THE FIRST WIN ALSO GIVES THE ROYAL CARD BACK.', 'THE DECK IS SHUFFLED FAIRLY. THE BOTS SEE ONLY', 'THEIR OWN CARDS, JUST LIKE YOU.'];
  },
  update(dt) {
    casTop(this, false);
    cqTick(HE.q, dt);
    heLayout();
    for (const k of HE.board.concat(...HE.hole, HE.gone)) tCardTick(k, dt);
    HE.gone = HE.gone.filter(k => k.x !== k.tx || k.y !== k.ty);
    for (let i = 0; i < 4; i++) if (HE.sayT[i] > 0) HE.sayT[i] -= dt;
    if (HE.phase !== 'play') {
      if (cbtn('sit', 142, 188, 100, 22, (HE.phase === 'over' ? 'PLAY AGAIN ' : 'SIT DOWN ') + (HE_BUY + HE_FEE), { primary: true, keys: ['PadX'], disabled: cas().chips < HE_BUY + HE_FEE })) heBuyIn();
      return;
    }
    if (!(HE.wait && HE.cur === 0) || HE.q.length) return;
    const call = Math.min(HE.curBet - HE.bet[0], HE.st[0]), sizes = heSizes(), all = HE.st[0] + HE.bet[0];
    HE.raiseI = Math.min(HE.raiseI, sizes.length - 1);
    if (cbtn('fold', 6, 194, 46, 16, 'FOLD', { keys: ['KeyF', 'PadLB'], disabled: !call })) { heAct('f'); return; }
    if (cbtn('call', 56, 194, 74, 16, call ? 'CALL ' + call : 'CHECK', { primary: true, keys: ['KeyC', 'PadX'] })) { heAct(call ? 'c' : 'k'); return; }
    const can = HE.st[0] > call;
    HE.raiseI = casStepper('raise', 140, 194, HE.curBet ? 'RAISE TO' : 'BET', sizes, HE.raiseI, !can || sizes.length < 2);
    if (cbtn('raise', 222, 194, 62, 16, HE.curBet ? 'RAISE' : 'BET', { keys: ['KeyR', 'PadRB'], disabled: !can || sizes[HE.raiseI] >= all })) { heAct('r' + sizes[HE.raiseI]); return; }
    if (cbtn('allin', 290, 194, 60, 16, 'ALL IN', { col: 'r', hi: 'R', lo: 'p', keys: ['KeyA', 'PadRT'], disabled: !can })) heAct('r' + all);
  },
  draw() {
    ctx.drawImage(casFelt('felt'), 0, 0);
    drawCasTop(this);
    if (HE.phase !== 'play') { heDrawLobby(); drawBtns(); drawCasFx(); return; }
    const [sb, bb] = heBlinds();
    text('BLINDS ' + sb + '/' + bb, 6, 26, 'Y', 1);
    text('HAND ' + (HE.hand + 1), 6, 35, 'h', 0);
    // the deck, the five places on the board, the pot
    drawS(S('cd_back_' + cas().back), HE_DECK.x, HE_DECK.y);
    for (let i = HE.board.length; i < 5; i++) { const x = 128 + i * 26; rect(x, 76, 24, 32, 'g'); rect(x + 1, 77, 22, 30, 'z'); }
    for (const k of HE.gone) drawTCard(k);
    for (const k of HE.board) drawTCard(k);
    const pot = heSum(HE.put) - heSum(HE.bet);
    if (pot > 0) text('POT ' + pot, 192, 64, 'Y', 1, 1);
    for (let i = 0; i < 4; i++) heDrawSeat(i);
    if (HE.msg) text(HE.msg, 192, 114, HE.win && HE.win.ws.includes(0) ? 'Y' : 'w', 1, 1);
    // your best hand so far, under your cards
    if (HE.hole[0].length === 2 && HE.hole[0].every(k => k.fl >= 0.8)) {
      const sc = heScore(HE.hole[0].map(k => k.c).concat(HE.board.filter(k => k.fl >= 0.8).map(k => k.c)));
      text(heName(sc), 192, 172, HE.fold[0] ? '3' : 'c', 1, 1);
    }
    if (HE.wait && HE.cur === 0 && !HE.q.length) drawStepper('raise', heSizes()[HE.raiseI]);
    drawBtns();
    drawCasFx();
  },
};
function heDrawSeat(i) {
  const P = HE_SEAT[i], out = HE.st[i] <= 0 && !heIn(i) && HE.put[i] === 0, t = CAS.t;
  for (const k of HE.hole[i]) drawTCard(k);
  const turn = HE.cur === i && HE.wait;
  if (i) {
    const B = HE_BOTS[i], f = turn ? Math.floor(t * 4) % 2 : Math.floor(t * 1.5 + i) % 2, s = S(B.spr + f);
    drawS(s, P.ax + 9 - (s.w >> 1), P.ay + 16 - s.h);
    text(B.name, P.nx, P.ny, turn ? 'Y' : out || HE.fold[i] ? 'l' : 'w', 1, P.al);
    text(out ? 'OUT' : String(HE.st[i]), P.nx, P.ny + 9, out ? 'r' : 'h', 0, P.al);
    if (HE.sayT[i] > 0 && HE.say[i]) text(HE.say[i], P.sx, P.sy, HE.say[i] === 'FOLD' ? 'l' : 'Y', 1, P.al);
    if (turn) { const y = P.ay - 6 + (Math.floor(t * 4) % 2); rect(P.ax + 6, y, 7, 1, '0'); rect(P.ax + 7, y + 1, 5, 1, 'Y'); rect(P.ax + 8, y + 2, 3, 1, 'y'); }
  } else {
    text(Save.name, P.nx, P.ny, turn ? 'Y' : 'w', 1, P.al);
    text(String(HE.st[0]), P.nx, P.ny + 9, 'h', 0, P.al);
    if (turn) { const y = 128 + (Math.floor(t * 4) % 2); rect(187, y, 7, 1, '0'); rect(188, y + 1, 5, 1, 'Y'); rect(189, y + 2, 3, 1, 'y'); rect(190, y + 3, 1, 1, 'O'); }
  }
  if (HE.bet[i] > 0) drawChipAt(P.bx, P.by, HE.bet[i], true);
  if (HE.win && HE.win.won[i] > 0) text('+' + HE.win.won[i], P.bx, P.by - 14, 'Y', 2, 1);
  // the dealer button
  if (HE.btn === i && !out) { rect(P.dbx + 1, P.dby, 7, 9, '0'); rect(P.dbx, P.dby + 1, 9, 7, '0'); rect(P.dbx + 1, P.dby + 1, 7, 7, 'w'); text('D', P.dbx + 5, P.dby + 1, '1', 0, 1); }
}
function heDrawLobby() {
  const t = CAS.t;
  if (HE.phase === 'over') {
    const P = ['', '1ST', '2ND', '3RD', '4TH'][HE.place];
    text(HE.place === 1 ? 'YOU WIN THE TABLE!' : 'YOU FINISHED ' + P, 192, 34, HE.place === 1 ? 'Y' : 'w', 3, 1);
    text(HE.place === 1 ? '+' + HE_PRIZE + ' CHIPS' + (HE.newBack ? ' AND THE ROYAL CARD BACK' : '') : 'BETTER LUCK AT THE NEXT TABLE.', 192, 46, HE.place === 1 ? 'Y' : 'l', 1, 1);
  } else {
    text('A SIT-AND-GO: FOUR SEATS, ONE WINNER', 192, 32, 'Y', 1, 1);
    text('NO LIMIT TEXAS HOLD\'EM', 192, 44, 'h', 0, 1);
  }
  for (let i = 1; i < 4; i++) {
    const B = HE_BOTS[i], x = 76 + (i - 1) * 116, f = Math.floor(t * 1.5 + i) % 2, s = S(B.spr + f);
    rect(x - 52, 54, 104, 52, '0'); rect(x - 51, 55, 102, 50, 'g'); rect(x - 51, 55, 102, 1, 'G');
    drawS(s, x - (s.w >> 1), 78 - s.h);
    text(B.name, x, 82, 'w', 1, 1);
    text(B.style, x, 93, 'c', 0, 1);
  }
  const say = ['BUY IN ' + HE_BUY + ' + ' + HE_FEE + ' HOUSE FEE.', 'EVERYONE STARTS WITH ' + HE_STACK + ' TABLE CHIPS.', 'THE BLINDS GO UP EVERY ' + HE_EVERY + ' HANDS.', 'THE LAST ONE WITH CHIPS WINS ' + HE_PRIZE + ' CHIPS.'];
  wrapText(say.map(tr).join(' '), 360).forEach((l, k) => text(l, 192, 114 + k * 10, 'w', 0, 1));
  // the prize on show: the Royal back, until it is won
  if (!cas().own.includes('back_royal')) { drawS(S('cd_back_royal'), 112, 148); text('THE FIRST WIN ALSO GIVES', 142, 154, 'Y', 1); text('THE ROYAL CARD BACK.', 142, 164, 'Y', 1); }
  if (cas().chips < HE_BUY + HE_FEE) text('YOU NEED ' + (HE_BUY + HE_FEE) + ' CHIPS TO SIT DOWN', 192, 176, 'R', 0, 1);
}
