// The VIP lounge's Sic Bo and the prize counter (chips for keepsakes).

// ---------- Sic Bo ----------
// Three dice under a glass dome. Every spot pays on the dice alone (see sicPay).
const SIC_TOT = { 4: 60, 5: 30, 6: 17, 7: 12, 8: 8, 9: 6, 10: 6, 11: 6, 12: 6, 13: 8, 14: 12, 15: 17, 16: 30, 17: 60 };
// What a round returns (stakes included) for bets { spot id: chips } and three dice.
function sicPay(bets, d) {
  const sum = d[0] + d[1] + d[2], trip = d[0] === d[1] && d[1] === d[2];
  let r = 0;
  for (const k in bets) {
    let m = 0;
    if (k === 'small') m = !trip && sum <= 10 ? 2 : 0;
    else if (k === 'big') m = !trip && sum >= 11 ? 2 : 0;
    else if (k === 'odd') m = !trip && sum % 2 ? 2 : 0;
    else if (k === 'even') m = !trip && !(sum % 2) ? 2 : 0;
    else if (k === 'any') m = trip ? 31 : 0;
    else if (k[0] === 't') m = sum === +k.slice(1) ? SIC_TOT[sum] + 1 : 0;
    else if (k[0] === 'f') { const n = d.filter(v => v === +k.slice(1)).length; m = n ? n + 1 : 0; }
    r += bets[k] * m;
  }
  return r;
}
const SIC_SPOTS = (() => {
  const out = [], top = [['small', 'SMALL', '4-10  1:1', 78, 'B', 'c', 'b'], ['odd', 'ODD', '1:1', 56, 't', 'T', 'g'], ['any', 'ANY TRIPLE', '30:1', 80, 'o', 'O', 'n'], ['even', 'EVEN', '1:1', 56, 't', 'T', 'g'], ['big', 'BIG', '11-17  1:1', 78, 'B', 'c', 'b']];
  let x = 12;
  for (const [id, label, sub, w, col, hi, lo] of top) { out.push({ id, label, sub, x, y: 76, w, h: 28, col, hi, lo }); x += w + 3; }
  for (let n = 4; n <= 17; n++) out.push({ id: 't' + n, label: String(n), sub: String(SIC_TOT[n]), x: 11 + (n - 4) * 26, y: 108, w: 24, h: 22, col: 'p', hi: 'P', lo: '1' });
  for (let n = 1; n <= 6; n++) out.push({ id: 'f' + n, die: n, sub: 'PAYS 1-3', x: 14 + (n - 1) * 60, y: 134, w: 56, h: 30, col: 'z', hi: 'G', lo: 'g' });
  return out;
})();
// The long-run return of each spot, lifted to small's 97.2%: SIC_FIX[id] multiplies its pay.
const SIC_FIX = (() => {
  const out = {}, rtp = (id) => { let s = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) s += sicPay({ [id]: 1 }, [a, b, c]); return s / 216; };
  for (const sp of SIC_SPOTS) out[sp.id] = rtp('small') / rtp(sp.id);
  return out;
})();
// Does a spot win with these dice?
const sicWins = (id, d) => sicPay({ [id]: 1 }, d) > 0;
const SB = { bets: {}, undo: [], last: null, chip: 0, roll: null, dice: [1, 3, 5], show: [1, 3, 5], hist: [], win: 0, bet: 0, done: false };
const sicTotal = () => { let t = 0; for (const k in SB.bets) t += SB.bets[k]; return t; };
function sicRoll() {
  const total = sicTotal();
  if (!total || !casinoBet('sic', total)) { Audio_.sfx('deny'); return; }
  const d = [crand(6) + 1, crand(6) + 1, crand(6) + 1], pay = sicPay(SB.bets, d);
  let owed = 0; // every spot quietly returns what small / big do
  for (const k in SB.bets) owed += sicPay({ [k]: SB.bets[k] }, d) * SIC_FIX[k];
  casPend('sic', owed);
  SB.last = Object.assign({}, SB.bets);
  SB.roll = { t: 0, T: 1.7, d, pay, total, flip: 0 };
  SB.done = false; SB.undo = [];
  Audio_.sfx('dice');
}
let SIC_ART = null;
// The dome's felt plate and its glass, baked once.
function sicArt() {
  if (SIC_ART) return SIC_ART;
  const RX = 46, RY = 16, GX = 44, GY = 34;
  const inE = (x, y, rx, ry) => (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1;
  const plate = casBake(RX * 2 + 1, RY * 2 + 5, (x, y) => {
    const u = x - RX, v = y - RY;
    if (!inE(u, v, RX, RY)) return inE(u, v - 4, RX, RY) ? (v > 0 ? (y === RY * 2 + 4 || !inE(u, v - 3, RX, RY) ? '0' : 'n') : null) : null;
    if (!inE(u, v, RX - 1, RY - 1)) return '0';
    if (!inE(u, v, RX - 3, RY - 3)) return u + v < -RX * 0.5 ? 'Y' : u + v > RX * 0.4 ? 'n' : 'O';
    return inE(u + 14, v + 5, 12, 4) ? 'G' : 'z';
  });
  const glass = casBake(GX * 2 + 1, GY + 1, (x, y) => {
    const u = x - GX, v = y - GY;
    if (!inE(u, v, GX, GY)) return null;
    if (!inE(u, v, GX - 1, GY - 1)) return '0';
    if (!inE(u, v, GX - 2, GY - 2)) return u < -GX * 0.3 && v < -GY * 0.35 ? 'w' : 'c';
    // a bright streak up and left, a faint one down and right
    if (inE(u + 24, v + 20, 5, 9) && !inE(u + 22, v + 18, 5, 9)) return 'w';
    if (inE(u - 28, v + 10, 3, 7) && !inE(u - 26, v + 9, 3, 7)) return 'C';
    return null;
  });
  return (SIC_ART = { plate, glass, RX, RY, GX, GY });
}
function sicPlace(id) {
  const a = chipSet('sic')[SB.chip];
  if (casOver('sic', SB.bets[id] || 0, a)) return;
  if (sicTotal() + a > cas().chips) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('deny'); return; }
  if (SB.done) { SB.done = false; SB.win = 0; }
  SB.bets[id] = (SB.bets[id] || 0) + a; SB.undo.push([id, a]);
  Audio_.sfx('chip');
}
CAS_GAMES.sic = {
  name: 'SIC BO',
  enter() { SB.bets = {}; SB.undo = []; SB.roll = null; SB.done = false; SB.win = 0; Audio_.play('vip'); },
  leave() {},
  odds() {
    return ['THREE DICE. SMALL, BIG, ODD, EVEN PAY 1:1 BUT LOSE', 'ON ANY TRIPLE. ANY TRIPLE PAYS 30:1.', 'A TOTAL PAYS WHAT IS SHOWN ON ITS SPOT, TO 1.', 'A NUMBER PAYS 1:1, 2:1 OR 3:1 FOR ONE, TWO', 'OR THREE DICE SHOWING IT.', 'THE HOUSE KEEPS 3 OF EVERY 100 CHIPS ON SMALL,', 'BIG, ODD AND EVEN, AND UP TO 19 ON THE REST.'];
  },
  update(dt) {
    const busy = !!SB.roll;
    casTop(this, busy);
    for (const s of SIC_SPOTS) if (cbtn(s.id, s.x, s.y, s.w, s.h, '', { col: s.col, hi: s.hi, lo: s.lo, disabled: busy, quiet: true })) sicPlace(s.id);
    SB.chip = casChips(12, 192, SB.chip, busy, 'sic');
    const t = sicTotal();
    if (cbtn('clear', 138, 192, 44, 16, 'CLEAR', { keys: ['KeyC'], disabled: busy || !t })) { SB.bets = {}; SB.undo = []; }
    if (cbtn('undo', 186, 192, 44, 16, 'UNDO', { keys: ['KeyZ', 'Backspace'], disabled: busy || !SB.undo.length })) {
      const [id, a] = SB.undo.pop();
      SB.bets[id] -= a; if (SB.bets[id] <= 0) delete SB.bets[id];
      Audio_.sfx('chip');
    }
    if (cbtn('re', 234, 192, 50, 16, 'REPEAT', { keys: ['KeyR'], disabled: busy || !!t || !SB.last })) {
      const sum = Object.values(SB.last).reduce((a, b) => a + b, 0);
      if (sum > cas().chips) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('deny'); }
      else { SB.bets = Object.assign({}, SB.last); SB.undo = []; SB.done = false; Audio_.sfx('chip'); }
    }
    if (cbtn('roll', 290, 186, 84, 26, 'ROLL!', { primary: true, keys: ['PadX'], disabled: busy || !t })) sicRoll();
    if (!busy) return;
    const r = SB.roll;
    r.t += dt;
    // the faces tumble fast, then slower, then settle one die at a time
    if (r.t < r.T) {
      r.flip -= dt;
      if (r.flip <= 0) {
        r.flip = 0.06 + r.t * 0.06;
        for (let i = 0; i < 3; i++) if (r.t < r.T - 0.45 + i * 0.15) SB.show[i] = (SB.show[i] + 1 + crand(4)) % 6 + 1;
        Audio_.sfx('tick');
      }
      for (let i = 0; i < 3; i++) if (r.t >= r.T - 0.45 + i * 0.15) SB.show[i] = r.d[i];
      return;
    }
    SB.show = r.d.slice(); SB.dice = r.d;
    if (r.t < r.T + 0.35) return;
    SB.roll = null;
    casSettle();
    SB.win = r.pay; SB.bet = r.total; SB.done = true;
    SB.hist.unshift(r.d); SB.hist.length = Math.min(SB.hist.length, 8);
    Audio_.sfx('rstop');
    if (r.pay) casWin(r.pay, r.total, 192, 60);
    SB.bets = {};
  },
  draw() {
    ctx.drawImage(casFelt('vip'), 0, 0);
    drawCasTop(this);
    const A = sicArt(), cx = 192, cy = 54, r = SB.roll;
    const shake = r && r.t < r.T - 0.45 ? (Math.floor(r.t * 30) % 2 ? 1 : -1) : 0, lift = r ? 0 : SB.done ? 8 : 0;
    shadow(cx, cy + A.RY + 4, 60);
    ctx.drawImage(A.plate, cx - A.RX, cy - A.RY);
    const pos = [[-17, -1], [0, -7], [16, 1]];
    for (let i = 0; i < 3; i++) {
      const j = shake && (i + Math.floor(r.t * 20)) % 2 ? -1 : 0;
      drawS(S('cz_die_' + SB.show[i]), cx + pos[i][0] - 6 + shake, cy + pos[i][1] - 6 + j);
    }
    ctx.drawImage(A.glass, cx - A.GX + shake, cy - A.GY + 4 - lift);
    // the sum of the settled dice
    if (!r && SB.done) {
      const d = SB.dice, sum = d[0] + d[1] + d[2], trip = d[0] === d[1] && d[1] === d[2];
      text(trip ? 'TRIPLE ' + d[0] + '!' : sum + (sum <= 10 ? ' SMALL' : ' BIG'), cx, 26, trip ? 'Y' : 'w', 2, 1);
    }
    // left: the bet and the result; right: the last rolls
    const t = sicTotal();
    text('BET', 50, 32, '3', 0, 1);
    text(String(t || (r ? r.total : 0)), 50, 42, t || r ? 'Y' : '3', 2, 1);
    if (SB.done && !t) text(SB.win ? 'WIN ' + SB.win : 'NO WIN', 50, 56, SB.win ? 'Y' : '3', 2, 1);
    text('LAST ROLLS', 334, 26, '3', 0, 1);
    SB.hist.slice(0, 5).forEach((d, i) => {
      const s = d[0] + d[1] + d[2], trip = d[0] === d[1] && d[1] === d[2];
      text(d.join(' ') + '  ' + s, 334, 36 + i * 8, trip ? 'Y' : s <= 10 ? 'c' : 'h', 0, 1);
    });
    drawBtns();
    const blink = SB.done && Math.floor(G.time * 4) % 2;
    for (const s of SIC_SPOTS) {
      const mx = s.x + (s.w >> 1);
      if (s.die) { drawS(S('cz_die_' + s.die), mx - 6, s.y + 3); text(s.sub, mx, s.y + 19, '0', 0, 1); }
      else if (s.h === 28) { text(s.label, mx, s.y + 5, 'w', 2, 1); text(s.sub, mx, s.y + 17, '0', 0, 1); }
      else { text(s.label, mx, s.y + 3, 'w', 1, 1); text(s.sub, mx, s.y + 12, 'Y', 0, 1); }
      const a = SB.bets[s.id] || (r && SB.last ? SB.last[s.id] : 0);
      if (a) { drawS(S('cz_chip_' + [100, 25, 5, 1].find(v => a >= v)), s.x + s.w - 8, s.y - 3); text(String(a), s.x + s.w - 4, s.y - 1, 'w', 2, 2); }
      if (blink && sicWins(s.id, SB.dice)) {
        rect(s.x - 1, s.y - 1, s.w + 2, 1, 'y'); rect(s.x - 1, s.y + s.h, s.w + 2, 1, 'y');
        rect(s.x - 1, s.y, 1, s.h, 'y'); rect(s.x + s.w, s.y, 1, s.h, 'y');
      }
    }
  },
};

// ---------- The prize counter ----------
// Chips buy keepsakes. Card backs and slot paint are picked again for free once owned.
const PRIZES = [
  { id: 'back_star', kind: 'back', v: 'star', l1: 'STAR', l2: 'CARDS', price: 0, icon: 'cd_back_star' },
  { id: 'back_moon', kind: 'back', v: 'moon', l1: 'MOON', l2: 'CARDS', price: 300, icon: 'cd_back_moon' },
  { id: 'back_frog', kind: 'back', v: 'frog', l1: 'FROG', l2: 'CARDS', price: 800, icon: 'cd_back_frog' },
  { id: 'back_gold', kind: 'back', v: 'gold', l1: 'GOLD', l2: 'CARDS', price: 2000, icon: 'cd_back_gold' },
  { id: 'charm', kind: 'charm', l1: 'LUCKY', l2: 'CHARM', price: 400, icon: 'sy_sun' },
  { id: 'title', kind: 'title', l1: 'LUCKY', l2: 'STAR', price: 2500, icon: 'sy_star' },
  { id: 'cab_plum', kind: 'cab', v: 'plum', l1: 'PLUM', l2: 'SLOT', price: 0 },
  { id: 'cab_mint', kind: 'cab', v: 'mint', l1: 'MINT', l2: 'SLOT', price: 600 },
  { id: 'cab_gold', kind: 'cab', v: 'gold', l1: 'GOLD', l2: 'SLOT', price: 1500 },
  { id: 'cat', kind: 'pet', l1: 'LUCKY', l2: 'CAT', price: 1200, icon: 'pet_cat_0' },
  { id: 'minislot', kind: 'decor', l1: 'TOY', l2: 'SLOT', price: 900, icon: 'cz_minislot' },
  { id: 'coinfount', kind: 'decor', l1: 'COIN', l2: 'FOUNTAIN', price: 1500, icon: 'cz_fount' },
];
const PRIZE_DESC = {
  back: 'A NEW BACK FOR EVERY CARD IN THE HOUSE.', cab: 'A NEW COAT OF PAINT FOR THE STAR SLOT.',
  charm: '+25 COINS WHEN YOUR NEXT RUN STARTS.', title: 'A TITLE FOR YOUR NAME: LUCKY STAR.',
  pet: 'A PET THAT FOLLOWS YOU. PICK IT IN THE WARDROBE.', decor: 'A KEEPSAKE FOR YOUR GARDEN.',
};
const prizeOwned = (P) => P.price === 0 || (P.kind === 'title' ? Save.unl.titles.includes('LUCKY STAR') : P.kind === 'decor' ? Save.decor.includes(P.id) : cas().own.includes(P.id));
const prizeInUse = (P) => (P.kind === 'back' && cas().back === P.v) || (P.kind === 'cab' && cas().cab === P.v);
const PZ = { sel: 0, say: '' };
function prizeUse(P) {
  const c = cas();
  if (P.kind === 'back') c.back = P.v; else c.cab = P.v;
  Save.write(); Audio_.sfx('confirm'); PZ.say = 'LOOKS GREAT ON YOU!';
}
function prizeBuy(P) {
  const c = cas();
  if (c.chips < P.price) { Audio_.sfx('deny'); toast('NOT ENOUGH CHIPS'); return; }
  c.chips -= P.price;
  if (P.kind === 'charm') c.charm++;
  else if (P.kind === 'title') { Save.unl.titles.push('LUCKY STAR'); addBadge('wardrobe'); }
  else if (P.kind === 'decor') Save.decor.push(P.id);
  else c.own.push(P.id);
  if (P.kind === 'back' || P.kind === 'cab') prizeUse(P);
  Save.write();
  Audio_.sfx('item'); haptic('item');
  casBurst(PZ.x || VW / 2, PZ.y || 100, 8);
  PZ.say = P.kind === 'decor' ? 'IT IS WAITING IN YOUR GARDEN!' : P.kind === 'pet' || P.kind === 'title' ? 'FIND IT IN THE WARDROBE!' : P.kind === 'charm' ? 'CHARMS: ' + c.charm : 'THANK YOU! RIBBIT!';
}
function prizePick(P) {
  if (prizeOwned(P) && P.kind !== 'charm') {
    if (P.kind === 'back' || P.kind === 'cab') { if (!prizeInUse(P)) prizeUse(P); return; }
    Audio_.sfx('deny'); PZ.say = 'YOU HAVE THAT ONE ALREADY!'; return;
  }
  openModal({
    title: P.l1 + ' ' + P.l2, icon: P.icon && S(P.icon).h <= 16 ? P.icon : 'icon_chip',
    lines: [PRIZE_DESC[P.kind], '', 'PRICE: ' + P.price + ' CHIPS', 'YOU HAVE: ' + cas().chips + ' CHIPS'],
    buttons: [{ label: 'BUY', col: 'h', fn: () => prizeBuy(P) }, { label: 'NOT NOW' }],
  });
}
const prizeAt = (i) => ({ x: 37 + (i % 6) * 52, y: 28 + Math.floor(i / 6) * 74 });
// A slot cabinet in miniature, in the paint's own colours.
function drawMiniCab(x, y, v) {
  const [p, P, q] = SLOT_FRAME[v === 'plum' ? 'classic' : v];
  rect(x + 1, y, 16, 26, '0'); rect(x, y + 1, 18, 24, '0');
  rect(x + 1, y + 1, 16, 24, p); rect(x + 2, y + 1, 14, 1, P); rect(x + 1, y + 2, 1, 22, P);
  rect(x + 1, y + 23, 16, 1, q);
  rect(x + 3, y + 6, 12, 9, '0'); rect(x + 4, y + 7, 10, 7, 'w');
  for (let k = 0; k < 3; k++) rect(x + 5 + k * 3, y + 9, 2, 3, ['R', 'y', 'c'][k]);
  rect(x + 3, y + 3, 12, 1, 'y'); rect(x + 5, y + 18, 8, 2, '0');
}
CAS_GAMES.prize = {
  name: 'THE PRIZE COUNTER',
  enter() { PZ.say = 'PICK A PRIZE, ANY PRIZE!'; },
  leave() {},
  odds() { return ['NO LUCK HERE: EVERY PRIZE HAS ITS PRICE.', 'CARD BACKS AND SLOT PAINT ARE YOURS TO SWAP', 'FOR FREE ONCE BOUGHT. A CHARM WORKS ONCE.']; },
  update() {
    casTop(this, false);
    PRIZES.forEach((P, i) => {
      const { x, y } = prizeAt(i);
      if (cbtn('pz' + i, x, y, 50, 70, '', { col: prizeInUse(P) ? 'O' : '2', hi: prizeInUse(P) ? 'Y' : '3', lo: prizeInUse(P) ? 'n' : '1' })) { PZ.sel = i; PZ.x = x + 25; PZ.y = y + 30; prizePick(P); }
      if (CB.focus === 'pz' + i) PZ.sel = i;
    });
  },
  draw() {
    ctx.drawImage(casFelt('plum'), 0, 0);
    drawCasTop(this);
    drawBtns();
    PRIZES.forEach((P, i) => {
      const { x, y } = prizeAt(i), mx = x + 25, own = prizeOwned(P) && P.kind !== 'charm';
      if (P.icon) { const s = S(P.icon); drawS(s, mx - (s.w >> 1), y + 38 - s.h); }
      else drawMiniCab(mx - 9, y + 11, P.v);
      text(P.l1, mx, y + 42, 'w', 1, 1);
      text(P.l2, mx, y + 51, 'w', 1, 1);
      text(prizeInUse(P) ? 'IN USE' : own ? 'OWNED' : String(P.price), mx, y + 61, prizeInUse(P) ? 'w' : own ? 'c' : 'Y', own && !prizeInUse(P) ? 0 : 1, 1);
      if (P.kind === 'charm' && cas().charm) text('X' + cas().charm, x + 46, y + 4, 'Y', 2, 2);
    });
    // the frog behind its counter, with the cat on top
    const t = CAS.t, P = PRIZES[PZ.sel];
    drawFeet(S(Math.floor(t * 2) % 2 ? 'frog_1' : 'frog_0'), 30, 192);
    drawFeet(S('cz_counter'), 30, 208);
    drawS(S('pet_cat_' + (Math.floor(t * 2) % 2)), 38, 176);
    text(PZ.say, 62, 186, 'Y', 1);
    if (P) text(PRIZE_DESC[P.kind], 62, 198, 'w', 0);
  },
};
