'use strict';
// Scratch cards: three tickets, a 3x3 grid of amounts under silver foil. Three matching
// amounts win that amount. The prize is decided (and owed, casPend) when the card is
// bought; scratching only shows it, so leaving early still pays.

// [multiplier of the price, chance]: each card pays back 87.5 of every 100 chips.
const SCR_TAB = [[1, 0.15], [2, 0.10], [5, 0.035], [10, 0.013], [20, 0.006], [100, 0.001]];
const SCR_SUN = [[1, 0.15], [2, 0.10], [5, 0.035], [10, 0.013], [20, 0.006], [250, 0.0004]];
const SCR_CARDS = [
  { name: 'LUCKY STAR', price: 5, sym: 'sy_star', tab: SCR_TAB, body: 'y', lite: 'Y', dark: 'O', band: 'p' },
  { name: 'MOON MONEY', price: 25, sym: 'sy_moon', tab: SCR_TAB, body: 'B', lite: 'c', dark: 'b', band: '1' },
  { name: 'SUNNY JACKPOT', price: 100, sym: 'sy_sun', tab: SCR_SUN, body: 'o', lite: 'O', dark: 'n', band: 'r' },
];
// the amount's colour grows with its size
const SCR_INK = ['l', 'c', 'T', 'h', 'P', 'Y'];
const scrRTP = (tab) => tab.reduce((s, [m, p]) => s + m * p, 0);
// Pure: the multiplier a uniform draw u in [0, 1) wins (0: no win).
function scrPick(tab, u) { for (const [m, p] of tab) { if (u < p) return m; u -= p; } return 0; }
// The nine amounts: a winner's three plus six others, never three of a kind by accident.
function scrGrid(tab, price, mult) {
  const pool = [];
  for (const [m] of tab) if (m !== mult) pool.push(m * price, m * price);
  const g = cshuffle(pool).slice(0, mult ? 6 : 9);
  if (mult) g.push(mult * price, mult * price, mult * price);
  return cshuffle(g);
}

// The card and its grid on screen: cells 38x24 with a 4px gap.
const SCR_W = 150, SCR_H = 150, SCR_X = 192 - SCR_W / 2, SCR_Y = 26;
const SCR_CW = 38, SCR_CH = 24, SCR_GAP = 4, SCR_GW = 3 * SCR_CW + 2 * SCR_GAP, SCR_GH = 3 * SCR_CH + 2 * SCR_GAP;
const SCR_GX = 192 - (SCR_GW >> 1), SCR_GY = 74, SCR_R = 8;
const SC = { pick: 0, phase: 'bet', grid: null, mult: 0, win: 0, foil: null, fg: null, mask: null, cell: null, left: [], tot: [], open: [], auto: 0, snd: 0, lx: -1, ly: -1, dust: [], serial: 0, t: 0 };
// Which cell a grid pixel belongs to (-1: a gap or a cell's outline).
function scrCellAt(x, y) {
  const cx = Math.floor(x / (SCR_CW + SCR_GAP)), cy = Math.floor(y / (SCR_CH + SCR_GAP));
  const u = x - cx * (SCR_CW + SCR_GAP), v = y - cy * (SCR_CH + SCR_GAP);
  return cx < 3 && cy < 3 && u >= 1 && u < SCR_CW - 1 && v >= 1 && v < SCR_CH - 1 ? cy * 3 + cx : -1;
}
// Fresh foil: silver with diagonal sheen, sparkles and a lit edge on every cell.
function scrFoil() {
  SC.cell = SC.cell || Int8Array.from({ length: SCR_GW * SCR_GH }, (_, i) => scrCellAt(i % SCR_GW, Math.floor(i / SCR_GW)));
  SC.mask = new Uint8Array(SCR_GW * SCR_GH);
  SC.tot = new Array(9).fill(0);
  for (let i = 0; i < SC.cell.length; i++) if (SC.cell[i] >= 0) { SC.mask[i] = 1; SC.tot[SC.cell[i]]++; }
  SC.left = SC.tot.slice(); SC.open = new Array(9).fill(false);
  SC.foil = casBake(SCR_GW, SCR_GH, (x, y) => {
    const c = SC.cell[y * SCR_GW + x];
    if (c < 0) return null;
    const u = x % (SCR_CW + SCR_GAP), v = y % (SCR_CH + SCR_GAP);
    if (v === 1 || u === 1) return 'L';
    if (v === SCR_CH - 2 || u === SCR_CW - 2) return 'd';
    if ((u * 7 + v * 13) % 53 === 0) return 'w';
    return ((x + y) >> 2) % 3 === 0 ? 'l' : 'm';
  });
  SC.fg = SC.foil.getContext('2d');
}
// Scratch a round brush at a point on the grid (integer pixels, no soft edge).
function scrRub(px, py) {
  let n = 0;
  for (let dy = -SCR_R; dy <= SCR_R; dy++) {
    const y = py + dy;
    if (y < 0 || y >= SCR_GH) continue;
    const hw = Math.floor(Math.sqrt(SCR_R * SCR_R - dy * dy + 0.5)), x0 = Math.max(0, px - hw), x1 = Math.min(SCR_GW - 1, px + hw);
    if (x1 < x0) continue;
    for (let x = x0; x <= x1; x++) {
      const i = y * SCR_GW + x;
      if (SC.mask[i]) { SC.mask[i] = 0; SC.left[SC.cell[i]]--; n++; if (n % 9 === 0) scrDust(SCR_GX + x, SCR_GY + y); }
    }
    SC.fg.clearRect(x0, y, x1 - x0 + 1, 1);
  }
  return n;
}
// Rub along a line, a few pixels per step, so a fast drag leaves no gaps.
function scrLine(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), k = Math.max(1, Math.ceil(d / 3));
  let n = 0;
  for (let i = 0; i <= k; i++) n += scrRub(Math.round(x0 + (x1 - x0) * i / k), Math.round(y0 + (y1 - y0) * i / k));
  return n;
}
function scrDust(x, y) {
  const f = SC.dust.find(o => o.t <= 0) || (SC.dust.length < 60 ? SC.dust[SC.dust.push({}) - 1] : null);
  if (!f) return;
  f.x = x; f.y = y; f.vx = rnd(-20, 20); f.vy = rnd(-30, 0); f.t = rnd(0.3, 0.6); f.k = crand(3) ? 'l' : 'm';
}
function scrBuy() {
  const C = SCR_CARDS[SC.pick];
  if (!casinoBet('scr', C.price)) { toast('NOT ENOUGH CHIPS'); Audio_.sfx('tick'); return; }
  SC.mult = scrPick(C.tab, crandf());
  SC.win = SC.mult * C.price;
  casPend('scr', SC.win);
  SC.grid = scrGrid(C.tab, C.price, SC.mult);
  SC.serial = 1000 + crand(900000);
  scrFoil();
  SC.phase = 'scratch'; SC.auto = 0; SC.lx = -1; SC.t = 0;
  Audio_.sfx('card');
}
// Every cell half uncovered: the rest of the foil falls away and the card pays.
function scrCheck() {
  let all = true;
  for (let c = 0; c < 9; c++) {
    if (!SC.open[c] && SC.left[c] <= SC.tot[c] * 0.45) { SC.open[c] = true; Audio_.sfx('tick'); }
    all = all && SC.open[c];
  }
  if (!all) return;
  SC.fg.clearRect(0, 0, SCR_GW, SCR_GH);
  SC.mask.fill(0);
  SC.phase = 'done'; SC.t = 0;
  casSettle();
  if (SC.win) casWin(SC.win, SCR_CARDS[SC.pick].price, 192, SCR_GY + 40); else Audio_.sfx('rstop');
}
CAS_GAMES.scr = {
  name: 'SCRATCH CARDS',
  enter() { SC.phase = 'bet'; SC.grid = null; scrFoil(); },
  leave() { SC.dust.length = 0; },
  odds() {
    return ['MATCH THREE AMOUNTS TO WIN THAT AMOUNT.', 'ABOUT 1 CARD IN 3 WINS SOMETHING.', 'THE TOP PRIZE IS 100 TIMES THE PRICE,', '250 TIMES ON THE SUNNY JACKPOT (1 IN 2500).', 'THE PRIZE IS SET WHEN YOU BUY THE CARD.', 'EVERY CARD PAYS BACK 87.5 OF 100 CHIPS.'];
  },
  update(dt) {
    SC.t += dt;
    casTop(this, false);
    CB.nav = SC.phase !== 'scratch';
    for (const f of SC.dust) if (f.t > 0) { f.t -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; }
    SCR_CARDS.forEach((C, i) => {
      if (cbtn('card' + i, 16 + i * 62, 190, 58, 20, String(C.price), { icon: C.sym, on: SC.pick === i, keys: ['Digit' + (i + 1)], disabled: SC.phase === 'scratch', quiet: true })) { SC.pick = i; Audio_.sfx('chip'); if (SC.phase === 'done') { SC.phase = 'bet'; scrFoil(); } }
    });
    if (SC.phase === 'scratch') {
      let n = 0;
      // hold the button (or Space, X on a controller) and the card scratches itself
      const held = key('Space') || key('PadX') || key('PadA') || (Input.mouseDown && Input.mx >= 290 && Input.mx < 370 && Input.my >= 186 && Input.my < 212);
      cbtn('auto', 290, 186, 80, 26, 'SCRATCH', { primary: true, keys: ['PadX'], on: held });
      if (held) {
        SC.auto += dt * 300;
        const row = Math.floor(SC.auto / SCR_GW), u = SC.auto % SCR_GW, x = Math.round(row % 2 ? SCR_GW - 1 - u : u), y = 4 + row * 12;
        if (y > SCR_GH + 4) SC.auto = 0;
        else n += scrRub(x, Math.min(SCR_GH - 1, y));
      }
      const mx = Math.round(Input.mx) - SCR_GX, my = Math.round(Input.my) - SCR_GY;
      if (Input.mouseDown && mx > -SCR_R && mx < SCR_GW + SCR_R && my > -SCR_R && my < SCR_GH + SCR_R) {
        n += SC.lx < -900 ? 0 : scrLine(SC.lx < 0 && SC.ly < 0 ? mx : SC.lx, SC.lx < 0 && SC.ly < 0 ? my : SC.ly, mx, my);
        SC.lx = mx; SC.ly = my;
      } else { SC.lx = -1; SC.ly = -1; }
      if (n && (SC.snd -= dt) <= 0) { Audio_.sfx('scratch'); SC.snd = 0.08; }
      if (n) scrCheck();
    } else {
      const C = SCR_CARDS[SC.pick];
      if (cbtn('buy', 290, 186, 80, 26, (SC.phase === 'done' ? 'AGAIN ' : 'BUY ') + C.price, { primary: true, keys: ['PadX', 'PadStart'], disabled: C.price > cas().chips })) scrBuy();
    }
  },
  draw() {
    ctx.drawImage(casFelt('plum'), 0, 0);
    drawCasTop(this);
    const C = SCR_CARDS[SC.pick], x = SCR_X, y = SCR_Y, w = SCR_W, h = SCR_H;
    // the ticket: a coloured card, lit top left, with a perforated top edge
    rect(x + 1, y + 2, w, h, '0');
    rect(x, y, w, h, '0');
    rect(x + 1, y + 1, w - 2, h - 2, C.body);
    rect(x + 1, y + 1, w - 2, 1, C.lite); rect(x + 1, y + 1, 1, h - 2, C.lite);
    rect(x + 1, y + h - 2, w - 2, 1, C.dark); rect(x + w - 2, y + 2, 1, h - 3, C.dark);
    for (let i = 4; i < w - 4; i += 6) rect(x + i, y, 2, 1, '0');
    rect(x + 6, y + 5, w - 12, 20, '0'); rect(x + 7, y + 6, w - 14, 18, C.band); rect(x + 7, y + 6, w - 14, 1, C.lite);
    drawS(S(C.sym), x + 10, y + 7); drawS(S(C.sym), x + w - 26, y + 7);
    text(C.name, 192, y + 12, 'Y', 3, 1);
    text('MATCH 3 TO WIN', 192, y + 28, '0', 0, 1);
    text('TOP PRIZE ' + C.tab[C.tab.length - 1][0] * C.price, 192, y + 38, '0', 0, 1);
    // the grid: amounts on dark cells, then the foil still left over them
    rect(SCR_GX - 3, SCR_GY - 3, SCR_GW + 6, SCR_GH + 6, '0');
    rect(SCR_GX - 2, SCR_GY - 2, SCR_GW + 4, SCR_GH + 4, C.dark);
    const winning = SC.phase === 'done' && SC.win;
    for (let c = 0; c < 9; c++) {
      const cx = SCR_GX + (c % 3) * (SCR_CW + SCR_GAP), cy = SCR_GY + Math.floor(c / 3) * (SCR_CH + SCR_GAP);
      const hit = winning && SC.grid[c] === SC.win, blink = hit && Math.floor(SC.t * 4) % 2;
      rect(cx, cy, SCR_CW, SCR_CH, blink ? 'y' : '0');
      rect(cx + 1, cy + 1, SCR_CW - 2, SCR_CH - 2, hit ? '2' : '1');
      rect(cx + 1, cy + 1, SCR_CW - 2, 1, hit ? '3' : '2');
      if (SC.grid) {
        const m = SC.grid[c] / C.price, tier = C.tab.findIndex(t => t[0] === m);
        text(String(SC.grid[c]), cx + SCR_CW / 2, cy + 9, SCR_INK[tier], 2, 1);
      }
    }
    ctx.drawImage(SC.foil, SCR_GX, SCR_GY);
    for (const f of SC.dust) if (f.t > 0) rect(Math.round(f.x), Math.round(f.y), 1, 1, f.k);
    if (SC.grid) text('NO. ' + String(SC.serial).padStart(6, '0'), x + 8, y + h - 12, '1', 0, 0);
    text(C.price + ' CHIPS', x + w - 8, y + h - 12, '1', 0, 2);
    // the verdict
    let msg = '', col = 'w';
    if (SC.phase === 'bet') msg = 'PICK A CARD';
    else if (SC.phase === 'scratch') msg = IS_TOUCH ? 'RUB THE SILVER' : 'SCRATCH WITH THE MOUSE OR HOLD SPACE';
    else if (SC.win) { msg = 'YOU WIN ' + SC.win + '!'; col = 'Y'; }
    else { msg = 'NO MATCH THIS TIME'; col = '3'; }
    text(msg, 192, 179, col, 1, 1);
    drawBtns();
    drawCasFx();
  },
};
