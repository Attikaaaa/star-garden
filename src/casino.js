'use strict';
// European wheel order and the red numbers.
const ROU_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROU_RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
// The Star Casino: a hall you walk around, full of games played for star chips. Chips are
// never money: they come from Cosmo's welcome gift, the Cashier (vault coins in and out,
// capped per day), a comp when the purse is empty and the coins left at the end of a run.
// Fair play, always: every game draws from crypto randomness (never the seeded streams),
// commits its outcome before it animates (`c.pend`, paid on the next visit if the page
// closes mid-spin), shows its true odds behind the `i` button and never fakes a near miss.
// The games live in slot.js, cards.js, roulette.js, scratch.js, lounge.js and holdem.js, each an
// entry in CAS_GAMES: { name, enter(arg), update(dt), draw(), leave(), odds() }.

// ---------- Fair randomness ----------
const _cb = new Uint32Array(1);
const cu32 = () => (crypto.getRandomValues(_cb), _cb[0]);
// A whole number in [0, n), without modulo bias.
function crand(n) {
  const lim = 4294967296 - (4294967296 % n);
  let v;
  do v = cu32(); while (v >= lim);
  return v % n;
}
const crandf = () => cu32() / 4294967296;
// An index picked by whole-number weights.
function cpickW(w) {
  let t = 0;
  for (const x of w) t += x;
  let r = crand(t);
  for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0) return i;
  return w.length - 1;
}
function cshuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = crand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// ---------- The purse ----------
// live.json can override any of these under tuning.casino.
const CASINO_TUNING = {
  gift: 100, cashMax: 60, inRate: 10, inMax: 50, outRate: 25, outMax: 40,
  comp: 25, compH: 4, jackSeed: 500, jackFeed: 0.01, breakMin: 20, breakDown: 300, luck: 1.08,
  rainChip: 2, rainMax: 20, // Star Rain: chips that fall on the floor, a day's cap
};
function ctune(k) { const t = typeof liveTuning === 'function' ? liveTuning('casino', null) : null; return t && typeof t[k] === 'number' ? t[k] : CASINO_TUNING[k]; }
// The house edge of each game: comp points are the expected loss times ten.
const EDGE = { slot: 0.05, land: 0.06, bj: 0.006, rou: 0.027, vp: 0.027, wof: 0.08, scr: 0.125, sic: 0.03, hold: 50 / 550 }; // Hold'em: the house fee
const CAS_TIERS = [
  { name: 'BRONZE', at: 0, col: 'R' }, { name: 'SILVER', at: 2000, col: 'l' },
  { name: 'GOLD', at: 10000, col: 'Y' }, { name: 'STAR', at: 50000, col: 'c' },
];
const CAS_DEF = {
  chips: 0, wag: 0, won: 0, pts: 0, day: '', vin: 0, vout: 0, wheel: '', comp: 0, jack: 0,
  st: {}, own: [], pend: null, fs: {}, gift: false, lands: [], back: 'star', cab: 'plum', charm: 0, nudge: '', rain: 0,
};
function cas() {
  const c = Save.casino || (Save.casino = {});
  for (const k in CAS_DEF) {
    const d = CAS_DEF[k];
    if (c[k] === undefined || (d !== null && typeof c[k] !== typeof d) || (Array.isArray(d) && !Array.isArray(c[k]))) c[k] = d && typeof d === 'object' ? JSON.parse(JSON.stringify(d)) : d;
  }
  c.chips = Math.max(0, Math.floor(c.chips) || 0);
  if (!(c.jack >= ctune('jackSeed'))) c.jack = ctune('jackSeed');
  const day = dayKey();
  if (c.day !== day) { c.day = day; c.vin = 0; c.vout = 0; c.rain = 0; }
  return c;
}
// The games on the main floor (Sic Bo waits in the VIP lounge).
const CAS_FLOOR = ['slot', 'land', 'bj', 'rou', 'vp', 'wof', 'scr'];
// Visited, not hidden: the casino's quests, letter and constellation show up.
const casShown = () => !!(Save.casino && Save.casino.gift) && !Save.settings.noCasino && menuOpen('casino');
const casTier = () => { const p = cas().pts; let t = 0; CAS_TIERS.forEach((x, i) => { if (p >= x.at) t = i; }); return t; };
// Take a bet from the purse. false when it does not fit.
function casinoBet(g, n) {
  const c = cas(), t0 = casTier();
  n = Math.floor(n);
  if (!(n > 0) || n > c.chips) return false;
  c.chips -= n; c.wag += n; c.pts += n * (EDGE[g] || 0.05) * 10;
  const s = c.st[g] || (c.st[g] = { n: 0, bet: 0, won: 0, best: 0 });
  s.n++; s.bet += n;
  CAS.sess.net -= n; CAS.sess.wag = (CAS.sess.wag || 0) + n;
  c.jack += n * ctune('jackFeed'); // every bet in the casino feeds the Star Jackpot
  const t1 = casTier();
  if (t1 > t0) casTierUp(t1);
  note('cas', g, 'bet');
  return true;
}
function casinoPay(g, n) {
  const c = cas();
  // Quiet luck: every payout is nudged so each game returns `luck` of what is bet in the long
  // run (a little over 100%), rounded at random so small wins stay small. A player behind over
  // their whole history is paid a little more still, in step with how far behind, so nobody
  // stays down for long; this visit counts too, so a bad evening turns around within it.
  // A Hold'em prize is the pot, won by play: it is paid as it is.
  if (g !== 'hold') {
    const sw = CAS.sess.wag || 0;
    const behind = Math.max(c.wag > 0 ? Math.max(0, c.wag - c.won) / c.wag : 0, sw > 0 ? Math.max(0, -CAS.sess.net) / sw : 0);
    n *= (ctune('luck') + Math.min(0.6, behind * 3)) / (1 - (EDGE[g] || 0.05));
    n = Math.floor(n) + (crandf() < n % 1 ? 1 : 0);
  }
  if (!(n > 0)) return 0;
  c.chips += n; c.won += n;
  const s = c.st[g] || (c.st[g] = { n: 0, bet: 0, won: 0, best: 0 });
  s.won += n; s.best = Math.max(s.best, n);
  CAS.sess.net += n;
  return n;
}
// Commit what a round will pay before it animates; casSettle pays it.
function casPend(g, n) { cas().pend = { g, n: Math.max(0, n) }; Save.write(); } // casinoPay rounds
function casSettle() {
  const c = cas(), p = c.pend;
  if (!p || p.bj || p.vp || p.hold) return 0; // a hand still in play resumes at its table
  c.pend = null;
  const n = casinoPay(p.g, p.n);
  Save.write();
  return n;
}
function casTierUp(t) {
  const T = CAS_TIERS[t];
  G.banner = { title: T.name + ' CARD!', sub: t === 2 ? 'THE VIP LOUNGE IS OPEN' : t === 3 ? 'A NEW TITLE: HIGH ROLLER' : 'COSMO HAS A BIGGER COMP FOR YOU', t: 3, icon: 'card' };
  if (t === 3 && !Save.unl.titles.includes('HIGH ROLLER')) { Save.unl.titles.push('HIGH ROLLER'); addBadge('wardrobe'); }
  Audio_.sfx('item'); haptic('item');
}

// ---------- Screen state ----------
const CAS = {
  game: null, p: null, t: 0, shown: 0, fx: [], sess: { t0: 0, net: 0, nudged: false }, near: null,
  target: null, path: null, bg: null, felt: {}, crit: [], drops: [], spray: 0, rainT: 4,
};
// Every game registers here (see the files named at the top).
const CAS_GAMES = {};

// ---------- Immediate-mode buttons ----------
// Games call cbtn() from update(): it registers the button for drawing and returns true
// on the frame it is used (a click or tap, its hotkeys, or ENTER / E / A while focused).
// The arrow keys move the focus between buttons; SPACE always uses the primary button.
const CB = { list: [], focus: null, fired: false, nav: true };
function cbtnBegin() { CB.list = []; CB.fired = false; CB.nav = true; }
function cbtn(id, x, y, w, h, label, o) {
  o = o || {};
  const b = { id, x, y, w, h, label, o };
  CB.list.push(b);
  if (o.disabled || CB.fired) return false;
  const over = mouseOn() && Input.mx >= x && Input.mx < x + w && Input.my >= y && Input.my < y + h;
  if (over && (Input.mouseHit || Input.lastAim === 'mouse')) CB.focus = id;
  const go = (over && Input.mouseHit) || (o.keys && pressed(...o.keys)) || (CB.focus === id && pressed('Enter', 'KeyE', 'PadA')) || (o.primary && pressed('Space'));
  if (!go) return false;
  CB.fired = true; CB.focus = id; b.down = true;
  if (!o.quiet) Audio_.sfx('select');
  return true;
}
function cbtnEnd() {
  const L = CB.list.filter(b => !b.o.disabled && !b.o.nofocus);
  if (!L.length) return;
  if (!L.some(b => b.id === CB.focus)) CB.focus = (L.find(b => b.o.primary) || L[0]).id;
  if (!CB.nav || CB.fired) return;
  const d = pressed('ArrowLeft', 'PadLeft') ? [-1, 0] : pressed('ArrowRight', 'PadRight') ? [1, 0] : pressed('ArrowUp', 'PadUp') ? [0, -1] : pressed('ArrowDown', 'PadDown') ? [0, 1] : null;
  if (!d) return;
  const f = L.find(b => b.id === CB.focus), fx = f.x + f.w / 2, fy = f.y + f.h / 2;
  let best = null, bd = 1e9;
  for (const b of L) {
    if (b === f) continue;
    const dx = b.x + b.w / 2 - fx, dy = b.y + b.h / 2 - fy, along = dx * d[0] + dy * d[1];
    if (along <= 2) continue;
    const s = along + Math.abs(dx * d[1] + dy * d[0]) * 2.5;
    if (s < bd) { bd = s; best = b; }
  }
  if (best) { CB.focus = best.id; Audio_.sfx('select'); }
}
const KEY_NAME = { Space: 'SPACE', PadA: 'A', PadB: 'B', PadX: 'X', PadY: 'Y', Escape: 'ESC', Enter: 'ENTER', Backspace: 'BKSP' };
const keyLabel = (k) => KEY_NAME[k] || k.replace(/^Key|^Digit/, '');
// A chunky casino button: '0' outline, a lit top edge, a shaded bottom edge.
function drawBtn(b) {
  const { x, y, w, h, o } = b, dis = o.disabled, foc = b.id === CB.focus && !dis && Input.lastAim !== 'touch';
  const face = dis ? '1' : o.on ? 'y' : o.primary ? 'p' : o.col || '2', hi = dis ? '2' : o.on ? 'Y' : o.primary ? 'P' : o.col ? o.hi || 'w' : '3', lo = dis ? '0' : o.on ? 'O' : o.primary ? '1' : o.lo || '1';
  rect(x + 1, y, w - 2, h, '0'); rect(x, y + 1, w, h - 2, '0');
  rect(x + 1, y + 1, w - 2, h - 2, face);
  rect(x + 2, y + 1, w - 4, 1, hi);
  rect(x + 1, y + h - 2, w - 2, 1, lo);
  if (foc) {
    const c = Math.floor(G.time * 4) % 2 ? 'y' : 'w';
    rect(x + 1, y - 1, w - 2, 1, c); rect(x + 1, y + h, w - 2, 1, c); rect(x - 1, y + 1, 1, h - 2, c); rect(x + w, y + 1, 1, h - 2, c);
  }
  let lx = x + w / 2;
  if (o.icon) { const s = S(o.icon), tw = b.label ? textW(b.label) + 2 : 0; drawS(s, Math.round(lx - (s.w + tw) / 2), Math.round(y + h / 2 - s.h / 2)); lx += (s.w + 2) / 2; }
  if (b.label) text(b.label, lx, y + Math.floor((h - 7) / 2), dis ? '3' : o.on ? '1' : 'w', dis || o.on ? 0 : 1, 1);
  // the hotkey, for keyboards and controllers
  const k = o.keys && o.keys.find(c => (Input.lastAim === 'pad') === c.startsWith('Pad'));
  if (k && !dis && Input.lastAim !== 'touch' && Input.lastAim !== 'mouse') {
    const t = keyLabel(k), kw = textW(t) + 4;
    rect(x + w - kw + 2, y - 5, kw, 9, '0'); rect(x + w - kw + 3, y - 4, kw - 2, 7, 'Y');
    text(t, x + w - kw / 2 + 2, y - 4, '1', 0, 1);
  }
}
function drawBtns() { for (const b of CB.list) drawBtn(b); }

// ---------- Baked backdrops ----------
// A canvas painted pixel by pixel from PAL keys (fn returns a key or null).
function casBake(w, h, fn) {
  const cv2 = document.createElement('canvas');
  cv2.width = w; cv2.height = h;
  const g = cv2.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = fn(x, y);
    if (!k) continue;
    const c = _col(k), i = (y * w + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv2;
}
// A tiny gold star (3x3 plus, bright centre) on a lattice.
const _star = (x, y, s) => { const u = ((x % s) + s) % s, v = ((y % s) + s) % s, c = s >> 1; return (u === c && v === c) ? 'y' : (Math.abs(u - c) + Math.abs(v - c) === 1) ? 'O' : null; };
// The game tables: felt ('z') for cards and roulette, plum velvet for the machines, night
// and gold for the VIP lounge. Each has a wooden rail around the play area.
function casFelt(kind) {
  if (CAS.felt[kind]) return CAS.felt[kind];
  const base = kind === 'felt' ? 'z' : kind === 'vip' ? '1' : 'v', dark = kind === 'felt' ? 'g' : kind === 'vip' ? '0' : '1', lite = kind === 'felt' ? 'G' : kind === 'vip' ? '2' : 'V';
  return (CAS.felt[kind] = casBake(VW, VH, (x, y) => {
    if (y < 22) return y === 21 ? '0' : y === 20 ? 'n' : y < 2 ? '0' : y === 2 ? '2' : '1';
    if (y > VH - 3) return 'n';
    // a soft diamond weave with gold stars at the crossings
    const s = _star(x - 12, y - 12, 24);
    if (s && kind !== 'felt') return s === 'y' ? 'O' : lite;
    if (((x + y) % 24 === 0 || (x - y + 480) % 24 === 0) && kind !== 'felt') return dark;
    if (kind === 'felt' && (x * 7 + y * 13) % 29 === 0) return lite;
    return base;
  }));
}
// The casino hall: walls, the neon sign's wall, the carpet and its gold border.
// The VIP lounge is the same room in night colours: a charcoal carpet, blue panels.
const VIP_WALL = { V: 'b', v: '1' }, VIP_FLOOR = { v: 'x', V: 'X', 1: '0' };
function casHall(kind = CAS.room) {
  const bg = CAS.bgs || (CAS.bgs = {});
  if (bg[kind]) return bg[kind];
  const map = (y, k) => (kind !== 'vip' || !k ? k : (y < 40 && y >= 22 ? VIP_WALL : y >= 40 && y < 200 ? VIP_FLOOR : {})[k] || k);
  return (bg[kind] = casBake(VW, VH, (x, y) => map(y, casHallPx(x, y))));
}
function casHallPx(x, y) {
  const inX = x >= 16 && x < 368;
  // the exit: a gap in the bottom wall
  if (y >= 200 && x >= 180 && x < 204) return y < 202 ? 'O' : y < 204 ? '1' : '0';
  if (y < 22 || (!inX && y < 200) || y >= 200) {
    if ((y === 21 && inX) || (y === 200 && x >= 15 && x < 369)) return 'y';
    if ((y === 20 && inX) || (y === 201 && x >= 15 && x < 369) || ((x === 15 || x === 368) && y >= 20 && y <= 201)) return 'O';
    const d = _star(x, y, 16);
    return d ? (d === 'y' ? '2' : null) || '1' : (x + y) % 8 === 0 ? '1' : '0';
  }
  if (y < 40) {
    // the wall face: plum panels between gold-capped pilasters, a rail at the bottom
    if (y === 38) return 'O';
    if (y === 39) return '0';
    const u = (x - 16) % 32;
    if (u === 0 || u === 31) return '0';
    if (u === 1 || u === 30) return y === 22 ? 'y' : 'v';
    if (y === 22) return '1';
    if (u > 4 && u < 27 && (y === 26 || y === 34) || (u === 5 || u === 26) && y > 26 && y < 34) return 'v';
    return 'V';
  }
  // the carpet
  if (x < 19 || x > 364 || y > 196) return x === 16 || x === 367 || y === 199 ? '0' : 'v';
  if (x === 19 || x === 364 || y === 196) return 'y';
  if (x === 20 || x === 363 || y === 195) return 'O';
  const s = _star(x - 8, y - 48, 16);
  if (s) return s;
  if ((x + y) % 16 === 0 || (x - y + 512) % 16 === 0) return 'V';
  return y < 42 ? '1' : 'v';
}

// ---------- The hall ----------
// w, h: the solid footprint around the feet (x, y). pass: not solid.
const CAS_SPOTS = [
  { id: 'cash', x: 40, y: 70, w: 18, h: 5, label: 'CASHIER', go: () => casCashier() },
  { id: 'slot', x: 90, y: 66, w: 9, h: 4, label: 'STAR SLOT', go: () => casPlay('slot') },
  { id: 'meadow', x: 116, y: 66, w: 9, h: 4, land: 'meadow', label: 'MEADOW SLOT', go: () => casLand('meadow') },
  { id: 'wheel', x: 192, y: 70, w: 20, h: 5, label: 'THE BIG WHEEL', go: () => casPlay('wof') },
  { id: 'shore', x: 268, y: 66, w: 9, h: 4, land: 'beach', label: 'SHORE SLOT', go: () => casLand('beach') },
  { id: 'crystal', x: 294, y: 66, w: 9, h: 4, land: 'crystal', label: 'CRYSTAL SLOT', go: () => casLand('crystal') },
  { id: 'prize', x: 344, y: 70, w: 18, h: 5, label: 'PRIZE COUNTER', go: () => casPlay('prize') },
  { id: 'bj', x: 104, y: 136, w: 26, h: 7, label: 'BLACKJACK', go: () => casPlay('bj') },
  { id: 'vp', x: 180, y: 126, w: 8, h: 4, label: 'VIDEO POKER', go: () => casPlay('vp') },
  { id: 'vp2', x: 204, y: 126, w: 8, h: 4, label: 'VIDEO POKER', go: () => casPlay('vp') },
  { id: 'rou', x: 280, y: 136, w: 30, h: 7, label: 'ROULETTE', go: () => casPlay('rou') },
  { id: 'scr', x: 48, y: 180, w: 12, h: 5, label: 'SCRATCH CARDS', go: () => casPlay('scr') },
  { id: 'owl', x: 160, y: 182, w: 6, h: 4, label: 'COSMO', go: () => casCosmo() },
  { id: 'vip', x: 336, y: 180, w: 20, h: 5, label: 'VIP LOUNGE', go: () => casVip() },
  { id: 'exit', x: 192, y: 198, w: 0, h: 0, pass: true, label: 'LEAVE', go: () => casExit() },
  { id: 'fount', x: 40, y: 124, w: 12, h: 4 }, // no go: just in the way, and pretty
];
// The VIP lounge (the Gold card): high limit tables, Sic Bo and Hold'em, out the way you came.
const VIP_SPOTS = [
  { id: 'sic', x: 120, y: 100, w: 20, h: 6, label: 'SIC BO', go: () => casPlay('sic') },
  { id: 'hold', x: 264, y: 98, w: 24, h: 7, label: "HOLD'EM", go: () => casPlay('hold') },
  { id: 'vbj', x: 100, y: 146, w: 26, h: 7, label: 'HIGH LIMIT BLACKJACK', go: () => casPlay('bj') },
  { id: 'vrou', x: 284, y: 146, w: 30, h: 7, label: 'HIGH LIMIT ROULETTE', go: () => casPlay('rou') },
  { id: 'vout', x: 192, y: 198, w: 0, h: 0, pass: true, label: 'THE MAIN FLOOR', go: () => casRoom('hall') },
  { id: 'bar', x: 56, y: 72, w: 18, h: 5 }, { id: 'bar2', x: 328, y: 72, w: 18, h: 5 }, // the bar: the lucky cats' corner
];
const casSpots = () => (CAS.room === 'vip' ? VIP_SPOTS : CAS_SPOTS);
// Walk from one room to the other (behind the wipe), standing by the door between them.
function casRoom(room) {
  Audio_.sfx('confirm');
  wipe(() => {
    CAS.room = room; CAS.target = null; CAS.path = null; CAS.drops.length = 0;
    Object.assign(CAS.p, room === 'vip' ? { x: 192, y: 186, face: 'u' } : { x: 336, y: 192, face: 'd' });
    Object.assign(CAS.pet, { x: CAS.p.x - 16, y: CAS.p.y });
    for (const k of CAS.crit) { k.x = CAS.p.x; k.y = Math.min(190, CAS.p.y); k.t = 0; }
    Audio_.play(room === 'vip' ? 'vip' : 'lounge');
  });
}
// The land slots open when that land's boss falls.
const casLandOpen = (land) => cas().lands.includes(land);
function casBlocked(x, y) {
  if (x < 24 || x > 360 || y < 46 || y > 194) return true;
  for (const s of casSpots()) if (!s.pass && Math.abs(x - s.x) < s.w + 5 && Math.abs(y - s.y) < s.h + 5) return true;
  return false;
}
function casNear() {
  const p = CAS.p;
  let best = null, bd = 26;
  for (const s of casSpots()) { const d = Math.hypot(p.x - s.x, (p.y - s.y - s.h) * 1.3); if (s.go && d < bd) { bd = d; best = s; } }
  return best;
}
function casSpotAt(x, y) {
  for (const s of casSpots()) if (s.go && Math.abs(x - s.x) < Math.max(10, s.w + 6) && y > s.y - (s.id === 'wheel' ? 40 : 30) && y < s.y + 8) return { o: s, tx: s.x, ty: Math.min(192, s.y + s.h + 9) };
  return null;
}

function enterCasino() {
  const c = cas();
  setState('casino');
  CAS.game = null; CAS.room = 'hall'; CAS.t = 0; CAS.fx.length = 0; CAS.target = null; CAS.path = null;
  CAS.p = { x: 192, y: 186, face: 'u', flip: false, moving: false, walkT: 0, idleT: 0 };
  CAS.pet = { x: 176, y: 190, flip: false, moving: false };
  CAS.sess = { t0: performance.now(), net: 0, nudged: false };
  // up to three of the Garden's critters come along and wander between the machines
  CAS.crit = Save.critters.slice(0, 3).map((k, i) => ({ c: k, x: 80 + i * 112, y: 104, tx: 80 + i * 112, ty: 104, t: i, moving: false, flip: false }));
  CAS.drops = []; CAS.rainT = 4; CAS.spray = 0;
  const paid = casSettle();
  CAS.shown = c.chips;
  Audio_.play('lounge');
  if (typeof track === 'function') track('casino', { chips: c.chips, tier: casTier() });
  if (!c.gift) { casWelcome(); return; }
  if (c.pend && CAS_GAMES[c.pend.g]) { toast('YOUR HAND IS STILL ON THE TABLE'); casPlay(c.pend.g, c.pend); return; }
  if (paid) toast('YOUR LAST ROUND PAID ' + paid + ' CHIPS');
  else if (Save.stats && G.chipsIn) toast('+' + G.chipsIn + ' CHIPS FROM YOUR LAST RUN');
  G.chipsIn = 0;
}
function casExit() {
  Audio_.sfx('select'); Audio_.stop(); Save.write();
  if (typeof track === 'function') track('casino_out', { mins: Math.round((performance.now() - CAS.sess.t0) / 60000), wag: CAS.sess.wag || 0, net: CAS.sess.net });
  titleReturn('CASINO');
}
// The floor's menu (TAB, Y, or a tap on the corner): the counters without the walk.
function casMenu() {
  openModal({ title: 'STAR CASINO', icon: 'icon_chip', lines: ['CHIPS: ' + cas().chips + '    ' + CAS_TIERS[casTier()].name + ' CARD'],
    buttons: [{ label: 'CASHIER', fn: casCashier }, { label: 'PRIZES', fn: () => casPlay('prize') }, { label: 'MY STATS', fn: casStats }, { label: 'LEAVE', col: 'h', fn: casExit }, { label: 'BACK' }] });
}
// Open a game screen (behind the diamond wipe).
function casPlay(id, arg) {
  const g = CAS_GAMES[id];
  if (!g) return;
  Audio_.sfx('confirm');
  wipe(() => { CAS.game = id; cbtnBegin(); CB.focus = null; g.enter(arg); });
}
function casLeave() {
  const g = CAS_GAMES[CAS.game];
  const paid = casSettle();
  if (paid) toast('+' + paid + ' CHIPS');
  wipe(() => { if (g && g.leave) g.leave(); CAS.game = null; Audio_.play(CAS.room === 'vip' ? 'vip' : 'lounge'); Save.write(); });
}
function casLand(land) {
  if (casLandOpen(land)) { casPlay('land', land); return; }
  const L = LANDS.find(l => l.theme === land || l.id === land);
  openModal({ title: 'A LOCKED MACHINE', icon: 'cz_lock', lines: ['BEAT THE BOSS OF ' + THEMES[L ? L.theme : land].name, 'AND THIS MACHINE LIGHTS UP.'], buttons: [{ label: 'OK' }] });
}

// ---------- The people ----------
function casWelcome() {
  const c = cas(), n = ctune('gift');
  openModal({
    title: 'COSMO THE OWL', icon: 'cz_owl_0', lead: true,
    lines: ['WELCOME TO THE STAR CASINO!', 'HERE ARE ' + n + ' STAR CHIPS, ON THE HOUSE.', 'CHIPS ARE NOT MONEY. THEY ARE JUST FOR FUN,', 'AND THE HOUSE ALWAYS HAS A SMALL EDGE.', 'EVERY GAME SHOWS ITS ODDS: PRESS I.'],
    buttons: [{ label: 'THANK YOU!', col: 'h', fn: () => { c.gift = true; c.chips += n; Save.write(); Audio_.sfx('coin'); casBurst(VW / 2, 110, 12); } }],
  });
}
const COSMO_TIPS = [
  'BLACKJACK HAS THE BEST ODDS. ASK ME AT THE TABLE.',
  'SLOTS PAY BACK 94 TO 95 OF EVERY 100 CHIPS.',
  'THE WHEEL AND THE SCRATCH CARDS KEEP THE MOST.',
  'SET A LIMIT, AND LEAVE WHILE IT IS STILL FUN.',
  'A HOT STREAK IS LUCK. THE ODDS NEVER CHANGE.',
  'LOSSES ARE NEVER "DUE" TO TURN AROUND.',
  'IN POKER, KEEP A PAIR OF JACKS OR BETTER.',
  'THE STAR JACKPOT NEEDS FIVE STARS AT MAX BET.',
  'COINS LEFT AFTER A RUN TURN INTO CHIPS.',
];
function casCosmo() {
  const c = cas(), t = casTier(), H = ctune('compH') * 3600000, now = Date.now();
  if (!c.gift) { casWelcome(); return; }
  if (c.chips < 5 && !c.pend && now - c.comp >= H) {
    const n = ctune('comp') * (t >= 1 ? 2 : 1);
    openModal({ title: 'COSMO THE OWL', icon: 'cz_owl_0', lead: true, lines: ['AN EMPTY PURSE? THE HOUSE HELPS A LITTLE:', n + ' CHIPS, AND A HOOT OF GOOD LUCK.', 'MAYBE A WALK IN THE GARDEN FIRST?'], buttons: [{ label: 'THANKS', col: 'h', fn: () => { c.comp = now; c.chips += n; Save.write(); Audio_.sfx('coin'); } }] });
    return;
  }
  const T = CAS_TIERS[t], nx = CAS_TIERS[t + 1], lines = [COSMO_TIPS[crand(COSMO_TIPS.length)], ''];
  lines.push('YOUR CARD: ' + T.name + (nx ? '  (' + Math.floor(c.pts) + ' / ' + nx.at + ' POINTS)' : ''));
  if (c.chips < 5 && now - c.comp < H) lines.push('THE NEXT COMP IN ' + fmtLeft(H - (now - c.comp)));
  openModal({ title: 'COSMO THE OWL', icon: 'cz_owl_0', lead: true, lines, buttons: [{ label: 'MY STATS', fn: casStats }, { label: 'THANKS' }] });
}
const CAS_NAMES = { slot: 'STAR SLOT', land: 'LAND SLOTS', bj: 'BLACKJACK', rou: 'ROULETTE', vp: 'VIDEO POKER', wof: 'THE BIG WHEEL', scr: 'SCRATCH CARDS', sic: 'SIC BO', hold: "HOLD'EM" };
function casStats() {
  const c = cas(), lines = [];
  for (const g in CAS_NAMES) { const s = c.st[g]; if (s && s.n) lines.push(CAS_NAMES[g] + ': ' + s.n + ' PLAYS, NET ' + (s.won - s.bet >= 0 ? '+' : '') + (s.won - s.bet)); }
  if (!lines.length) lines.push('NOTHING PLAYED YET.');
  lines.push('', 'ALL TIME: BET ' + c.wag + ', WON ' + c.won + ' (' + (c.won - c.wag >= 0 ? '+' : '') + (c.won - c.wag) + ')');
  openModal({ title: 'YOUR CASINO STATS', lines, buttons: [{ label: 'OK' }] });
}
function casCashier() {
  const c = cas(), inR = ctune('inRate'), outR = ctune('outRate'), inLeft = ctune('inMax') - c.vin, outLeft = ctune('outMax') - c.vout;
  const buy = (coins) => {
    const k = Math.min(coins, inLeft, Save.vault);
    if (k <= 0) { toast(inLeft <= 0 ? 'THE CASHIER IS CLOSED FOR TODAY' : 'NOT ENOUGH COINS IN THE VAULT'); return; }
    Save.vault -= k; c.vin += k; c.chips += k * inR; Save.write();
    Audio_.sfx('chip'); Audio_.sfx('coin'); toast('+' + k * inR + ' CHIPS');
  };
  const out = () => {
    const k = Math.min(Math.floor(c.chips / outR), outLeft);
    if (k <= 0) { toast(outLeft <= 0 ? 'NO MORE CASHING OUT TODAY' : outR + ' CHIPS MAKE ONE COIN'); return; }
    openModal({ title: 'CASH OUT', lines: [k * outR + ' CHIPS FOR ' + k + ' VAULT COINS?'], buttons: [{ label: 'YES', col: 'h', fn: () => { c.chips -= k * outR; c.vout += k; Save.vault += k; Save.write(); Audio_.sfx('coin'); toast('+' + k + ' VAULT COINS'); } }, { label: 'NO' }] });
  };
  openModal({
    title: 'THE CASHIER', icon: 'cz_bunny_0', lead: true,
    lines: ['NO REAL MONEY HERE, ONLY STAR CHIPS!', 'CHIPS: ' + c.chips + '    VAULT: ' + Save.vault + ' COINS', 'BUY: 1 COIN = ' + inR + ' CHIPS (' + Math.max(0, inLeft) + ' COINS LEFT TODAY)', 'CASH OUT: ' + outR + ' CHIPS = 1 COIN (' + Math.max(0, outLeft) + ' LEFT TODAY)'],
    buttons: [{ label: 'BUY ' + 5 * inR, fn: () => buy(5) }, { label: 'BUY ' + 10 * inR, fn: () => buy(10) }, { label: 'CASH OUT', col: 'h', fn: out }, { label: 'BACK' }],
  });
}
function casVip() {
  const c = cas();
  if (casTier() >= 2) { casRoom('vip'); return; }
  openModal({ title: 'THE VIP LOUNGE', icon: 'icon_card', lines: ['THE ROPE OPENS FOR GOLD CARDS.', 'YOUR POINTS: ' + Math.floor(c.pts) + ' / ' + CAS_TIERS[2].at, 'EVERY BET EARNS POINTS.'], buttons: [{ label: 'OK' }] });
}
// The one-time nudge per visit: after a long session or a big loss.
function casBreakCheck() {
  const s = CAS.sess;
  if (s.nudged || modalUp()) return;
  const mins = (performance.now() - s.t0) / 60000;
  if (mins < ctune('breakMin') && -s.net < ctune('breakDown')) return;
  s.nudged = true;
  openModal({ title: 'COSMO THE OWL', icon: 'cz_owl_0', lead: true, lines: [mins >= ctune('breakMin') ? 'YOU HAVE PLAYED FOR ' + Math.floor(mins) + ' MINUTES.' : 'YOU ARE ' + -s.net + ' CHIPS DOWN THIS VISIT.', 'HOW ABOUT A BREAK? THE GARDEN MISSES YOU.'], buttons: [{ label: 'TAKE A BREAK', col: 'h', fn: () => { if (CAS.game) casLeave(); casExit(); } }, { label: 'KEEP PLAYING' }] });
}

// ---------- Walking the hall ----------
function updateCasino(dt) {
  CAS.t += dt;
  if (G.banner && (G.banner.t -= dt) <= 0) G.banner = null;
  const c = cas();
  // the purse counts up and down to the real number
  if (CAS.shown !== c.chips) { const d = c.chips - CAS.shown, st = Math.max(1, Math.ceil(Math.abs(d) * dt * 5)); CAS.shown += Math.sign(d) * Math.min(Math.abs(d), st); if (d > 0 && Math.floor(CAS.t * 20) % 2) Audio_.sfx('tick'); }
  casFxUpdate(dt);
  if (CAS.game) {
    const g = CAS_GAMES[CAS.game];
    cbtnBegin();
    g.update(dt);
    cbtnEnd();
    if (!modalUp()) casBreakCheck();
    return;
  }
  const p = CAS.p;
  if (pressed(...K_BACK)) { if (CAS.room === 'vip') casRoom('hall'); else casExit(); return; }
  const e = screenEdges();
  if (pressed('Tab', 'PadY') || (Input.mouseHit && Input.mx < e.l + 60 && Input.my > e.b - 16)) { Audio_.sfx('select'); casMenu(); return; }
  const pad = Input.pad;
  let mx = (key(keyOf('right')) || key('ArrowRight') ? 1 : 0) - (key(keyOf('left')) || key('ArrowLeft') ? 1 : 0) + pad.mx;
  let my = (key(keyOf('down')) || key('ArrowDown') ? 1 : 0) - (key(keyOf('up')) || key('ArrowUp') ? 1 : 0) + pad.my;
  if (Input.mouseHit) {
    const hit = casSpotAt(Input.mx, Input.my);
    CAS.target = { x: hit ? hit.tx : Input.mx, y: hit ? hit.ty : Input.my, use: hit && hit.o };
    CAS.path = yardPath(p.x, p.y, CAS.target.x, CAS.target.y, casBlocked, 4);
  }
  if (mx || my) CAS.target = null;
  else if (CAS.target) {
    const T = CAS.target;
    const dir = pathDir(p, CAS.path, T.x, T.y, casBlocked), nb = T.use && casNear();
    if (Math.hypot(T.x - p.x, T.y - p.y) < 4 || (nb && nb === T.use)) {
      CAS.target = null;
      if (T.use) { p.face = 'u'; T.use.go(); return; }
    } else [mx, my] = dir;
  }
  const l = Math.hypot(mx, my);
  if (l > 1) { mx /= l; my /= l; }
  p.moving = !!(mx || my);
  if (p.moving) {
    if (!slideStep(p, mx, my, 90, dt, casBlocked) && CAS.target) CAS.target = null;
    p.walkT += dt; p.idleT = 0;
    if (Math.abs(mx) > Math.abs(my) * 1.1) { p.face = 's'; p.flip = mx < 0; } else p.face = my < 0 ? 'u' : 'd';
    // walking out through the door leaves
    if (p.y > 193 && Math.abs(p.x - 192) < 12 && my > 0) { if (CAS.room === 'vip') casRoom('hall'); else casExit(); return; }
  } else p.idleT += dt;
  CAS.near = casNear();
  if ((pressed(...K_OK) || pressed('PadX')) && CAS.near) { p.face = 'u'; Audio_.sfx('confirm'); CAS.near.go(); return; }
  casLife(dt);
  // the pet trots after the hero
  const q = CAS.pet, tx = p.x - (p.flip ? -1 : 1) * 16, ty = p.y + 3, dd = Math.hypot(tx - q.x, ty - q.y);
  q.moving = dd > 5;
  if (q.moving) { const k = Math.min(1, dt * 4); q.x += (tx - q.x) * k; q.y += (ty - q.y) * k; q.flip = tx < q.x; }
  casBreakCheck();
}

// ---------- Life on the floor ----------
// Critters stroll from machine to machine; in a Star Rain, stars fall and leave chips
// (rainChip each, rainMax a day); after a big win the fountain throws coins.
function casLife(dt) {
  const p = CAS.p, c = cas();
  for (const k of CAS.crit) {
    if ((k.t -= dt) <= 0) {
      const L = casSpots(), s = L[crand(L.length)];
      k.t = 2 + crandf() * 4; k.tx = s.x + crand(30) - 15; k.ty = Math.min(192, s.y + s.h + 8 + crand(10));
    }
    const dx = k.tx - k.x, dy = k.ty - k.y, d = Math.hypot(dx, dy);
    k.moving = d > 3;
    if (k.moving) { const nx = k.x + dx / d * 22 * dt, ny = k.y + dy / d * 22 * dt; if (!casBlocked(nx, ny)) { k.x = nx; k.y = ny; } else k.t = 0; k.flip = dx < 0; }
  }
  if (typeof showerAt === 'function' && showerAt(Date.now()) && c.rain < ctune('rainMax') && CAS.drops.length < 3 && (CAS.rainT -= dt) <= 0) {
    CAS.rainT = 8 + crandf() * 6;
    for (let k = 0; k < 20; k++) {
      const x = 30 + crand(324), y = 50 + crand(140);
      if (!casBlocked(x, y)) { CAS.drops.push({ x, y, fall: 0.6 }); Audio_.sfx('star'); break; }
    }
  }
  for (let i = CAS.drops.length - 1; i >= 0; i--) {
    const o = CAS.drops[i];
    if (o.fall > 0) { if ((o.fall -= dt) <= 0) casBurst(o.x, o.y, 4); continue; }
    if (Math.hypot(o.x - p.x, o.y - p.y) > 10) continue;
    CAS.drops.splice(i, 1);
    const n = Math.min(ctune('rainChip'), ctune('rainMax') - c.rain);
    if (n > 0) { c.rain += n; c.chips += n; Save.write(); Audio_.sfx('coin'); toast('STAR RAIN: +' + n + ' CHIPS'); }
  }
  if (CAS.spray > 0) { CAS.spray -= dt; if (Math.floor(CAS.spray * 5) !== Math.floor((CAS.spray + dt) * 5)) casBurst(40, 102, 2); }
}
// Halloween week: carved pumpkins by the walls, and an orange sign.
const CAS_PUMPKINS = [[68, 48], [318, 48], [30, 190], [354, 190], [124, 194], [260, 194]];
function drawFount(x, y) {
  drawFeet(S('cz_fount'), x, y + 1);
  // the water: a few drops arc up from the spout and fall back into the bowl
  for (let i = 0; i < 6; i++) {
    const u = (CAS.t * 0.9 + i / 6) % 1, side = i % 2 ? 1 : -1, dx = side * (2 + u * 8), dy = -20 * u * (1 - u) * 4;
    rect(Math.round(x + dx), Math.round(y - 20 + dy + u * 12), 1, 1, u < 0.5 ? 'w' : 'c');
  }
}

// ---------- Drawing the hall ----------
function drawCasino() {
  fillScreen(PAL['0']);
  const c = cas();
  if (CAS.game) { CAS_GAMES[CAS.game].draw(); drawCasFx(); if (G.banner) drawBanner(); return; }
  ctx.drawImage(casHall(CAS.room), 0, 0);
  const t = CAS.t, p = CAS.p;
  // the neon sign: STAR CASINO between two stars, one letter blinking now and then
  const flick = Math.floor(t * 7) % 37 === 0;
  const hall = typeof holiday === 'function' && holiday() === 'halloween';
  const sign = CAS.room === 'vip' ? 'VIP LOUNGE' : 'STAR CASINO';
  text(sign, 192, 8, flick ? '1' : CAS.room === 'vip' ? 'Y' : hall ? 'O' : 'P', 3, 1);
  drawS(S('bigstar'), 192 - textW(sign) / 2 - 22, 0);
  drawS(S('bigstar'), 192 + textW(sign) / 2 + 6, 0);
  // wall lamps
  for (let x = 48; x < 368; x += 64) { if (Math.abs(x - 192) < 30) continue; drawS(S('cz_lamp'), x - 3, 25); }
  const list = [];
  for (const s of casSpots()) list.push([s.y, () => drawCasSpot(s)]);
  for (const k of CAS.crit) list.push([k.y, () => { shadow(k.x, k.y, 6); drawFeet(S('crit_' + k.c + '_' + (k.moving ? Math.floor(t * 6) % 2 : Math.floor(t * 1.5) % 2)), k.x, k.y + 1, k.flip ? 1 : 0); }]);
  if (hall && CAS.room !== 'vip') for (const [x, y] of CAS_PUMPKINS) list.push([y, () => { shadow(x, y, 8); drawFeet(S('phop_' + (Math.floor(t * 2 + x) % 7 ? 0 : 1)), x, y + 1); }]);
  for (const o of CAS.drops) list.push([o.y, () => {
    if (o.fall > 0) { const k = o.fall / 0.6; drawS(S('sparkle_1'), Math.round(o.x - 60 * k) - 1, Math.round(o.y - 100 * k) - 1); return; }
    drawS(S('cz_chip'), o.x - 4, o.y - 6 - (Math.floor(t * 3) % 2));
  }]);
  if (Save.pet) list.push([CAS.pet.y, () => { const q = CAS.pet, f = q.moving ? Math.floor(t * 6) % 2 : Math.floor(t * 1.5) % 2; shadow(q.x, q.y, 7); drawFeet(S('pet_' + Save.pet + '_' + f), q.x, q.y + 1 - (Save.pet === 'bee' ? 7 : 0), q.flip ? 1 : 0); }]);
  list.push([p.y, () => {
    shadow(p.x, p.y, 12);
    const frame = p.moving ? HERO_WALK[Math.floor(p.walkT / 0.11) % 4] : 0, blink = !p.moving && p.face !== 'u' && p.idleT % 3.2 > 3.05;
    drawFeet(S(heroPre(heroUnlocked(Save.hero) ? Save.hero : 'pip') + p.face + frame + (blink ? 'b' : '') + SKIN[Save.skin]), p.x, p.y + 1, p.face === 's' && p.flip ? 1 : 0);
  }]);
  list.sort((a, b) => a[0] - b[0]);
  for (const [, fn] of list) fn();
  // what the hero stands next to
  const o = CAS.near;
  if (o && !modalUp()) {
    const tl = (IS_TOUCH ? '' : Input.lastAim === 'pad' ? 'A: ' : 'E: ') + o.label, w = textW(tl) + 10;
    panel(Math.round(p.x - w / 2), Math.round(p.y - 38), w, 13);
    text(tl, p.x, p.y - 34, 'Y', 0, 1);
  }
  casPurse(screenEdges().r - 6, screenEdges().t + 7);
  const e = screenEdges(), T = CAS_TIERS[casTier()];
  text(T.name + ' CARD', e.l + 6, e.t + 7, T.col, 2);
  const nx = CAS_TIERS[casTier() + 1];
  if (nx) { const f = Math.min(1, (c.pts - T.at) / (nx.at - T.at)); rect(e.l + 6, e.t + 17, 50, 3, '0'); rect(e.l + 7, e.t + 18, Math.round(48 * f), 1, T.col); }
  const out = CAS.room === 'vip' ? 'BACK' : 'LEAVE';
  text(IS_TOUCH ? 'MENU' : Input.lastAim === 'pad' ? 'Y: MENU   B: ' + out : 'TAB: MENU   ESC: ' + out, e.l + 6, e.b - 7, IS_TOUCH ? 'w' : '3', 2);
  drawCasFx();
  if (G.banner) drawBanner();
}
// The chip count in a corner (x is the right edge).
function casPurse(x, y) {
  const s = String(Math.round(CAS.shown));
  drawS(S('cz_chip'), x - textW(s) - 12, y - 4);
  text(s, x, y, 'Y', 2, 2);
}
// The Big Wheel's disk and the roulette wheel are drawn from polar tables, pixel by pixel,
// at the current angle (a fresh raster each frame, never a rotated bitmap). segCol(i)
// gives segment i's key; rings: [[r0, r1, fn(seg, angle, radius, screenAngle)]...] from
// the centre out (screenAngle does not turn, for light from the top left).
function wheelRaster(key, R, n, rings) {
  const W = R * 2 + 1;
  let w = WHEELS[key];
  if (!w) {
    const cv2 = document.createElement('canvas');
    cv2.width = cv2.height = W;
    const g = cv2.getContext('2d'), img = g.createImageData(W, W), ang = new Float32Array(W * W), rad = new Float32Array(W * W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = x - R, dy = y - R, i = y * W + x; ang[i] = Math.atan2(dx, -dy); rad[i] = Math.hypot(dx, dy); }
    w = WHEELS[key] = { cv: cv2, g, img, ang, rad, rot: null };
  }
  return (rot) => {
    if (w.rot === rot) return w.cv;
    w.rot = rot;
    const d = w.img.data, TAU = Math.PI * 2;
    for (let i = 0; i < W * W; i++) {
      const r = w.rad[i];
      let k = null;
      for (const [r0, r1, fn] of rings) if (r >= r0 && r < r1) { let a = (w.ang[i] - rot) % TAU; if (a < 0) a += TAU; k = fn(Math.floor(a / TAU * n + 0.5) % n, a, r, w.ang[i]); break; }
      const j = i * 4;
      if (!k) { d[j + 3] = 0; continue; }
      const c = _col(k);
      d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
    }
    w.g.putImageData(w.img, 0, 0);
    return w.cv;
  };
}
const WHEELS = {};
function drawCasSpot(s) {
  const x = s.x, y = s.y, t = CAS.t;
  if (s.id === 'exit') { drawS(S('cz_mat'), x - 12, y + 1); return; }
  if (s.id === 'fount') { shadow(x, y, 26); drawFount(x, y); return; }
  if (s.id === 'vout') { drawS(S('cz_mat'), x - 12, y + 1); return; }
  if (s.id === 'sic') { shadow(x, y, 40); drawFeet(S('cz_sic'), x, y + 1); return; }
  if (s.id === 'hold') {
    // the three regulars, always at their seats: the owl behind, the frog and the fox at the ends
    const f = Math.floor(t * 1.5) % 2, owl = S('cz_owl_' + f), frog = S('frog_' + ((f + 1) % 2)), fox = S('wfox_' + f);
    drawS(owl, x - (owl.w >> 1), y - 26 - owl.h + 8);
    drawS(frog, x - 34 - (frog.w >> 1), y - 8 - frog.h + 2);
    drawS(fox, x + 34 - (fox.w >> 1), y - 8 - fox.h + 2);
    shadow(x, y, 48); drawFeet(S('cz_poker'), x, y + 1); return;
  }
  if (s.id === 'bar' || s.id === 'bar2') { shadow(x, y, 34); drawFeet(S('cz_counter'), x, y + 1); drawS(S('pet_cat_' + (Math.floor(t * 2 + x) % 2)), x - 4, y - 26); return; }
  if (s.id === 'wheel') {
    // the Big Wheel hangs on the wall and idles round slowly
    shadow(x, y, 30);
    drawFeet(S('cz_wheelbase'), x, y + 1);
    const draw = wofDisk(18);
    ctx.drawImage(draw(Math.round(t * 6) / 60), x - 18, y - 52);
    drawS(S('cz_pointer'), x - 3, y - 56);
    return;
  }
  shadow(x, y, Math.min(34, s.w * 2 + 4));
  if (s.id === 'cash') { drawFeet(S('cz_bunny_' + (Math.floor(t * 1.6) % 2)), x, y - 9); drawFeet(S('cz_booth'), x, y + 1); return; }
  if (s.id === 'prize') { drawFeet(S(Math.floor(t * 2) % 2 ? 'frog_1' : 'frog_0'), x, y - 11); drawFeet(S('cz_counter'), x, y + 1); drawS(S('pet_cat_' + (Math.floor(t * 2) % 2)), x + 7, y - 26); return; }
  if (s.id === 'owl') { drawFeet(S('cz_perch'), x, y + 1); drawFeet(S('cz_owl_' + (t % 4 > 3.8 ? 1 : 0)), x, y - 8); return; }
  if (s.id === 'bj' || s.id === 'vbj') { drawFeet(S('cz_bj'), x, y + 1); return; }
  if (s.id === 'rou' || s.id === 'vrou') { drawFeet(S('cz_rou'), x, y + 1); const disk = rouDisk(8); ctx.drawImage(disk(-t * 2), x - 29, y - 22); return; }
  if (s.id === 'scr') { drawFeet(S('cz_kiosk'), x, y + 1); return; }
  if (s.id === 'vip') { drawFeet(S('cz_rope'), x, y + 1); if (casTier() < 2) drawS(S('cz_lock'), x - 3, y - 26); return; }
  if (s.id === 'vp' || s.id === 'vp2') { drawFeet(S('cz_vp'), x, y + 1); if (Math.floor(t * 2 + x) % 3 === 0) rect(x - 5, y - 19, 3, 1, 'y'); return; }
  // slot cabinets: a blinking marquee; land machines stay dark until opened
  const land = s.land, open = !land || casLandOpen(land);
  drawFeet(S('cz_cab_' + (land || (SLOT_FRAME[cas().cab] ? cas().cab : 'classic')) + (open ? '' : '_off')), x, y + 1);
  if (!open) { drawS(S('cz_lock'), x - 3, y - 20); return; }
  // the marquee chases; after a big win the whole bank flashes
  for (let i = 0; i < 4; i++) if (CAS.spray > 0 ? Math.floor(t * 8) % 2 : (Math.floor(t * 6) + i) % 4 === 0) rect(x - 6 + i * 4, y - 33, 2, 1, 'Y');
}

// ---------- Celebration ----------
// Coins that fly up and fall (screen space, pooled).
function casBurst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const f = CAS.fx.find(o => o.t <= 0) || (CAS.fx.length < 80 ? CAS.fx[CAS.fx.push({}) - 1] : null);
    if (!f) return;
    f.x = x + rnd(-8, 8); f.y = y; f.vx = rnd(-70, 70); f.vy = rnd(-150, -70); f.t = rnd(0.9, 1.5); f.s = i % 3 ? 'coin_' + (i % 2) : 'cz_chip';
  }
}
function casFxUpdate(dt) { for (const f of CAS.fx) if (f.t > 0) { f.t -= dt; f.vy += 300 * dt; f.x += f.vx * dt; f.y += f.vy * dt; } }
function drawCasFx() { for (const f of CAS.fx) if (f.t > 0) drawS(S(f.s), f.x - 4, f.y - 4); }
// A round is over: celebrate only a real win (more back than was bet).
function casWin(won, bet, x, y) {
  if (won > bet) {
    const big = won >= bet * 20;
    note('cas', CAS.game, 'win');
    if (big) { note('cas', CAS.game, 'big'); CAS.spray = 3; }
    Audio_.sfx(big ? 'bigwin' : 'cwin');
    haptic('item');
    casBurst(x || VW / 2, y || 100, big ? 24 : Math.min(12, 3 + Math.floor(won / bet)));
    if (big) G.banner = { title: 'BIG WIN!', sub: '+' + won + ' CHIPS', t: 2.2, icon: 'chip' };
  }
}

// ---------- Every table's frame ----------
// The top bar: BACK, the game's name, the purse and the odds button.
function casTop(g, busy) {
  if (cbtn('back', 4, 4, 40, 14, 'BACK', { keys: ['Escape', 'PadB'], disabled: busy, quiet: true })) { Audio_.sfx('select'); if (g.leaveAsk && g.leaveAsk()) return; casLeave(); }
  if (cbtn('info', VW - 20, 4, 16, 14, 'I', { keys: ['KeyI', 'PadY'] })) casOdds(g);
}
function drawCasTop(g) {
  text(g.name, VW / 2, 8, 'Y', 3, 1);
  casPurse(VW - 26, 8);
}
function casOdds(g) {
  openModal({ title: g.name + ': THE ODDS', lines: g.odds().concat(['', 'CHIPS ARE NOT MONEY. JUST FOR FUN.']), buttons: [{ label: 'OK' }] });
}
// A bet stepper: - VALUE +. Returns the new index into `steps`.
function casStepper(id, x, y, label, steps, i, busy) {
  if (cbtn(id + '-', x, y, 16, 14, '-', { keys: ['Minus', 'NumpadSubtract'], disabled: busy || i <= 0 })) { Audio_.sfx('chip'); i--; }
  if (cbtn(id + '+', x + 58, y, 16, 14, '+', { keys: ['Equal', 'NumpadAdd'], disabled: busy || i >= steps.length - 1 })) { Audio_.sfx('chip'); i++; }
  CAS.stepLbl = CAS.stepLbl || {};
  CAS.stepLbl[id] = [x + 37, y, label];
  return i;
}
function drawStepper(id, value) {
  const L = CAS.stepLbl && CAS.stepLbl[id];
  if (!L) return;
  text(L[2], L[0], L[1] - 9, '3', 0, 1);
  rect(L[0] - 20, L[1] + 1, 40, 12, '0');
  rect(L[0] - 19, L[1] + 2, 38, 10, '1');
  text(String(value), L[0], L[1] + 4, 'Y', 0, 1);
}

// ---------- Hooks into the rest of the game ----------
// Coins left at the end of a run become chips (a daily or weekly run adds a little).
// The land slots open when a land's boss falls. A Lucky Charm gives the next run coins.
if (typeof onNote === 'function') onNote((ev, a) => {
  if (!Save.casino && ev !== 'end') return;
  if (ev === 'end' && !(typeof isDuel === 'function' && isDuel()) && Save.stats.runs > 0) {
    const n = Math.min(ctune('cashMax'), Math.max(0, G.coins | 0)) + (G.daily ? 5 : 0);
    if (n > 0) { cas().chips += n; G.chipsIn = n; Save.write(); if (casShown()) logNews('chips', '+' + n + ' CHIPS FOR THE STAR CASINO', 'cz_chip'); }
  } else if (ev === 'boss' && G.floor && G.floor.land) {
    const c = cas(), id = G.floor.land.theme;
    if (!c.lands.includes(id)) { c.lands.push(id); Save.write(); }
  } else if (ev === 'start' && a === 'adv' && !G.daily && NET.role !== 'client') {
    const c = cas();
    if (c.charm > 0) { c.charm--; G.coins += 25; Save.write(); toast('LUCKY CHARM: +25 COINS'); }
  }
});
