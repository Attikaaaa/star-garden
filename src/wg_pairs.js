'use strict';
// Wildgrove: a card table for a game of pairs. USE opens the `pairs` screen: sixteen cards face down, eight pairs of
// things from the wild (`WG_PAIR_POOL`, dealt with the screen's own shuffle, `wgPairsDeal`); turn two (`wgPairsPick`),
// a pair stays face up and two that differ turn back after `WG_PAIR_HOLD` s. The cards are picked with the pointer, a
// tap, or the arrows and the pad walking the grid. A game won counts in `stats.pairs`; one won in `WG_PAIR_SHARP` tries
// or fewer lights SHARP MEMORY. Each screen plays its own game.
const WG_PAIR_POOL = ['apple', 'berry', 'carrot', 'pumpkin', 'mush_r', 'fish', 'egg', 'honey', 'shell', 'pearl', 'feather', 'crystal', 'acorn', 'pinecone', 'cherry', 'lemon'];
const WG_PAIR_HOLD = 0.9, WG_PAIR_SHARP = 14, WG_PAIR_W = 22, WG_PAIR_H = 26; // seconds two odd cards show; tries for the star; a card's size
const WGPR = { deck: null, up: [], tries: 0, hold: 0, flip: [], won: 0 };
(function () {
  wgObj('card_table', { name: 'CARD TABLE', kind: 'deco', tool: 'axe', hp: 3, pairs: 1, drops: [DR('card_table', 1, 1)] });
  wgItem('card_table', 'CARD TABLE', 'place', { place: 'card_table' }); PLACE.card_table = 'card_table'; wgRec('card_table', 1, { wood: 4, fiber: 3, petal_b: 1 }, 'bench');
  WG_ACH.push(['pairs', 'SHARP MEMORY', 'FIND ALL PAIRS IN ' + WG_PAIR_SHARP + ' TRIES OR FEWER', (c) => (c.st.pairsBest | 0) > 0 && c.st.pairsBest <= WG_PAIR_SHARP]);
})();
function wgPairsDeal() { // eight things, two cards each, shuffled
  const pool = WG_PAIR_POOL.filter(k => WGI[k]);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const deck = pool.slice(0, 8).flatMap(id => [id, id]);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  WGPR.deck = deck.map(id => ({ id, got: false })); WGPR.up = []; WGPR.tries = 0; WGPR.hold = 0; WGPR.won = 0; WGPR.flip = deck.map(() => -9);
}
function wgPairsPick(i) { // turn card i face up: false when it cannot be turned now
  const D = WGPR.deck, c = D && D[i]; if (!c || c.got || WGPR.hold || WGPR.up.includes(i) || WGPR.up.length >= 2) return false;
  WGPR.up.push(i); WGPR.flip[i] = WGS.t; wgSfx('clack');
  if (WGPR.up.length < 2) return true;
  WGPR.tries++; const [a, b] = WGPR.up;
  if (D[a].id !== D[b].id) { WGPR.hold = WGS.t + WG_PAIR_HOLD; return true; }
  D[a].got = D[b].got = true; WGPR.up = []; wgSfx('pickup');
  if (D.every(q => q.got)) { // all found
    const st = WGS.world.meta.stats || (WGS.world.meta.stats = { kills: 0, far: 0 }); st.pairs = (st.pairs | 0) + 1;
    if (!st.pairsBest || WGPR.tries < st.pairsBest) st.pairsBest = WGPR.tries;
    WGPR.won = WGS.t; wgSfx('chime'); wgToast('ALL PAIRS IN # TRIES'.replace('#', WGPR.tries), 3);
  }
  return true;
}
const _wgUsePairs = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, id = w && wgObjAt(w, WGS.dim, tx, ty); if (!id || !OBJ[id].pairs) return _wgUsePairs(tx, ty);
  WGS.pairsAt = { tx, ty, t0: WGS.t }; if (!WGPR.deck || WGPR.won) wgPairsDeal(); WGS.scr = 'pairs'; WGS.ui = {}; wgSfx('select');
  return true;
};
const _wgUpdPairs = updateWG;
updateWG = function (dt) {
  _wgUpdPairs(dt);
  if (WGPR.hold && WGS.t >= WGPR.hold) { for (const i of WGPR.up) WGPR.flip[i] = WGS.t; WGPR.up = []; WGPR.hold = 0; } // the odd two turn back
  if (WGS.scr !== 'pairs' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  const A = WGS.pairsAt, id = A && wgObjAt(WGS.world, WGS.dim, A.tx, A.ty);
  if (!A || !id || !OBJ[id].pairs || WGS.t > A.t0 && pressed('Escape', 'PadB')) { WGS.scr = 'play'; WGS.pairsAt = null; }
};
function wgPairsMove(s) { // the arrows walk the grid of cards, then down to the buttons below it and back up
  if (s === undefined) return s;
  const L = pressed(...K_LEFT), R = pressed(...K_RIGHT), U = pressed(...K_UP), D = pressed(...K_DOWN);
  if (s < 16) {
    if (L) return s % 4 ? s - 1 : s; if (R) return s % 4 < 3 ? s + 1 : s;
    if (U) return s >= 4 ? s - 4 : s; if (D) return s < 12 ? s + 4 : 16 + (s % 4 >= 2 ? 1 : 0);
  } else { if (L) return 16; if (R) return 17; if (U) return 12 + (s === 17 ? 3 : 0); if (D) return s; }
  return s;
}
const _wgDrawPairs = drawWG;
drawWG = function () {
  _wgDrawPairs();
  if (WGS.scr !== 'pairs' || !WGS.world || !WGS.pairsAt || !WGPR.deck) return;
  const ui = WGS.ui, W = 128, H = 178, x = VW / 2 - W / 2, y0 = Math.round((VH - H) / 2) - 6, T = WGS.t;
  dim(0.45);
  rect(x, y0, W, H, '0'); rect(x + 1, y0 + 1, W - 2, H - 2, 'z'); rect(x + 2, y0 + 2, W - 4, 1, 'g'); // the green baize
  wtext(WGPR.won ? 'ALL PAIRS IN # TRIES'.replace('#', WGPR.tries) : 'TRIES: ' + WGPR.tries, VW / 2, y0 + 7, WGPR.won ? 'Y' : 'w', 0, 1);
  const was = ui.sel; wgUiBegin(ui); if (was !== undefined && (Input.lastAim === 'pad' || Input.lastAim === 'keys')) ui.sel = wgPairsMove(was);
  WGPR.deck.forEach((c, i) => {
    const cx = x + 12 + (i % 4) * (WG_PAIR_W + 5), cy = y0 + 20 + Math.floor(i / 4) * (WG_PAIR_H + 4), sel = ui.sel === ui.n;
    if (wgButton(ui, '', cx - 1, cy - 1, WG_PAIR_W + 2, { h: WG_PAIR_H + 2 })) wgPairsPick(i);
    const face = c.got || WGPR.up.includes(i), u = T - WGPR.flip[i], half = u >= 0 && u < 0.16; // turning: a narrow card for a moment
    const w = half ? 8 : WG_PAIR_W, ox = (WG_PAIR_W - w) >> 1;
    rect(cx + ox, cy, w, WG_PAIR_H, '0');
    if (half) { rect(cx + ox + 1, cy + 1, w - 2, WG_PAIR_H - 2, 'L'); return; }
    if (face) { rect(cx + 1, cy + 1, WG_PAIR_W - 2, WG_PAIR_H - 2, c.got ? 'A' : 'w'); rect(cx + 1, cy + 1, WG_PAIR_W - 2, 1, 'w'); ctx.drawImage(wgIcon(c.id), cx + 3, cy + 5); }
    else ctx.drawImage(wgPairsBack(), cx + 1, cy + 1);
    if (sel) { rect(cx - 2, cy - 2, WG_PAIR_W + 4, 1, 'Y'); rect(cx - 2, cy + WG_PAIR_H + 1, WG_PAIR_W + 4, 1, 'Y'); rect(cx - 2, cy - 1, 1, WG_PAIR_H + 2, 'Y'); rect(cx + WG_PAIR_W + 1, cy - 1, 1, WG_PAIR_H + 2, 'Y'); }
  });
  if (wgButton(ui, 'NEW GAME', x + 6, y0 + H - 22, 56)) { wgPairsDeal(); wgSfx('select'); }
  if (wgButton(ui, 'CLOSE', x + W - 62, y0 + H - 22, 56)) { WGS.scr = 'play'; WGS.pairsAt = null; }
  wgUiEnd(ui);
};
function wgPairsBack() { // a card's back: blue with a pale border and a little star
  return WGA.cache.pairs_back || wgMake('pairs_back', WG_PAIR_W - 2, WG_PAIR_H - 2, (g) => {
    const w = WG_PAIR_W - 2, h = WG_PAIR_H - 2; wgRc(g, 0, 0, w, h, 'b'); wgRc(g, 1, 1, w - 2, h - 2, 'B'); wgRc(g, 2, 2, w - 4, h - 4, 'b');
    for (let y = 3; y < h - 3; y += 2) for (let x = 3 + (y >> 1) % 2; x < w - 3; x += 2) wgPx(g, x, y, '2');
    const m = w >> 1, n = h >> 1; wgRc(g, m - 1, n - 3, 2, 6, 'Y'); wgRc(g, m - 3, n - 1, 6, 2, 'Y'); wgRc(g, m - 1, n - 1, 2, 2, 'w');
  }, false);
}
function wgPairsTable() { // the table with a few cards laid out on its baize
  return WGA.cache.card_table_up || wgMake('card_table_up', 18, 17, (g) => {
    wgRc(g, 1, 1, 16, 10, 'z'); wgRc(g, 1, 1, 16, 1, 'g'); wgRc(g, 1, 1, 1, 10, 'g'); // the baize top
    for (const [cx, cy, up] of [[3, 3, 0], [6, 3, 0], [9, 3, 1], [12, 3, 0], [3, 7, 0], [6, 7, 1], [9, 7, 0], [12, 7, 0]]) { wgRc(g, cx, cy, 2, 3, up ? 'w' : 'B'); if (up) wgPx(g, cx, cy + 1, 'r'); }
    wgRc(g, 1, 11, 16, 2, 'n'); wgRc(g, 1, 11, 16, 1, 'N'); wgRc(g, 2, 13, 2, 3, 'u'); wgRc(g, 14, 13, 2, 3, 'u'); wgPx(g, 2, 13, 'n'); wgPx(g, 14, 13, 'n'); // the front and legs
  });
}
const _wgDrawObjPairs = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.pairs) return _wgDrawObjPairs(id, tx, ty, sx, sy);
  shadow(sx + 8, sy + 14, 16); ctx.drawImage(wgPairsTable(), sx - 1, sy - 1);
};
const _wgTipPairs = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPairs(s); if (s.id === 'card_table') L.push('A GAME OF PAIRS'); return L; };
const _wgBuildPairs = wgBuildAll;
wgBuildAll = function () { _wgBuildPairs(); wgReg('card_table', [wgPairsTable()]); };
const _wgIconPairs = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'card_table' || WGA.cache[key]) return _wgIconPairs(id);
  const c = wgMake(key, 16, 16, (g) => { // two cards, one face up
    wgRc(g, 2, 3, 7, 10, 'b'); wgRc(g, 3, 4, 5, 8, 'B'); wgRc(g, 5, 6, 1, 4, 'Y'); wgRc(g, 4, 7, 3, 1, 'Y');
    wgRc(g, 8, 2, 7, 10, 'w'); wgRc(g, 8, 11, 7, 1, 'l'); wgRc(g, 10, 5, 3, 3, 'r'); wgPx(g, 10, 5, 'R'); wgPx(g, 11, 4, 'g');
  });
  WGA.cache[key] = c; return c;
};
