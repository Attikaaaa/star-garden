'use strict';
// Wildgrove: a market stall. USE opens the `market` screen with today's three trades (`wgMarketDeals`, picked from
// `WG_DEALS` by the day and the seed, so every screen offers the same), each one a swap from the backpack. Each trade can
// be made once a day at each stall: the tile's meta is the day's mark (`wgMarketMark`, the day % 31 plus one) times eight
// plus a bit for each trade made, so it goes over co-op with the tile. Trades count in `stats.trades`; ten light MARKET DAY.
const WG_DEALS = [[{ wood: 12 }, ['iron', 1]], [{ stone: 16 }, ['copper', 2]], [{ fish: 3 }, ['pearl', 1]], [{ berry: 6 }, ['honey', 2]],
  [{ wheat: 8 }, ['egg', 3]], [{ fiber: 10 }, ['string', 3]], [{ apple: 4 }, ['sugar', 3]], [{ wool: 3 }, ['leather', 2]],
  [{ shell: 4 }, ['glass', 3]], [{ clay: 6 }, ['brick', 4]], [{ iron: 2 }, ['geode', 1]], [{ milk: 2 }, ['cheese', 1]],
  [{ coal: 6, stone: 4 }, ['crystal', 1]], [{ mush_b: 4 }, ['mush_r', 2]]]; // give, get
(function () {
  wgObj('market', { name: 'MARKET STALL', kind: 'deco', tool: 'axe', hp: 5, market: 1, drops: [DR('market', 1, 1)] });
  wgItem('market', 'MARKET STALL', 'place', { place: 'market' }); PLACE.market = 'market'; wgRec('market', 1, { wood: 6, wool: 2, petal_y: 1 }, 'bench');
  WG_ACH.push(['market', 'MARKET DAY', 'MAKE TEN TRADES AT A MARKET STALL', (c) => (c.st.trades | 0) >= 10]);
})();
const wgMarketMark = () => (WGS.day | 0) % 31 + 1;
function wgMarketDeals() { // three different trades for today, of those whose items exist
  const L = WG_DEALS.filter(d => WGI[d[1][0]] && Object.keys(d[0]).every(k => WGI[k])), out = [];
  for (let i = 0; out.length < 3 && i < 40; i++) { const d = L[hash(WGS.day | 0, (WGS.world.seed | 0) + i, 73) % L.length]; if (!out.includes(d)) out.push(d); }
  return out;
}
const wgMarketDone = (m) => (m >> 3) === wgMarketMark() ? m & 7 : 0; // which of today's trades are made
const wgMarketCan = (d) => Object.keys(d[0]).every(k => wgInvCount(WGS.inv, k) >= d[0][k]);
function wgMarketTrade(i) {
  const M = WGS.mkt, w = WGS.world, id = w && wgObjAt(w, WGS.dim, M.tx, M.ty); if (!id || !OBJ[id].market) return false;
  const d = wgMarketDeals()[i], done = wgMarketDone(wgMetaAt(w, WGS.dim, M.tx, M.ty)); if (!d || done & (1 << i) || !wgMarketCan(d)) return false;
  for (const k in d[0]) wgInvTake(WGS.inv, k, d[0][k]);
  const left = wgInvAdd(WGS.inv, d[1][0], d[1][1]); if (left) wgDrop(WGS.p.x, WGS.p.y, d[1][0], left);
  wgSetObj(w, WGS.dim, M.tx, M.ty, id, wgMarketMark() * 8 + (done | (1 << i)));
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.trades = (st.trades | 0) + 1; wgSfx('pickup');
  return true;
}
const _wgUseMarket = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, id = w && wgObjAt(w, WGS.dim, tx, ty);
  if (!id || !OBJ[id].market) return _wgUseMarket(tx, ty);
  WGS.mkt = { tx, ty, t0: WGS.t }; WGS.scr = 'market'; WGS.ui = {}; wgSfx('select');
  return true;
};
const _wgUpdMarket = updateWG;
updateWG = function (dt) {
  _wgUpdMarket(dt);
  if (WGS.scr !== 'market' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  const M = WGS.mkt, id = M && wgObjAt(WGS.world, WGS.dim, M.tx, M.ty);
  if (!M || !id || !OBJ[id].market || WGS.t > M.t0 && pressed('Escape', 'PadB')) { WGS.scr = 'play'; WGS.mkt = null; } // not on the press that opened it
};
const _wgDrawMarket = drawWG;
drawWG = function () {
  _wgDrawMarket();
  if (WGS.scr !== 'market' || !WGS.world || !WGS.mkt) return;
  const M = WGS.mkt, ui = WGS.ui, deals = wgMarketDeals(), done = wgMarketDone(wgMetaAt(WGS.world, WGS.dim, M.tx, M.ty));
  const h = 64 + deals.length * 26, x = VW / 2 - 120, y0 = Math.round((VH - h) / 2) - 8;
  dim(0.45);
  rect(x, y0, 240, h, '0'); rect(x + 1, y0 + 1, 238, h - 2, 'd'); rect(x + 2, y0 + 2, 236, h - 4, '1'); rect(x + 2, y0 + 2, 236, 1, '2');
  wtext('MARKET STALL', VW / 2, y0 + 8, 'Y', 0, 1); wtext('NEW TRADES EVERY DAY', VW / 2, y0 + 20, 'l', 0, 1);
  wgUiBegin(ui);
  deals.forEach((d, i) => {
    const by = y0 + 34 + i * 26, sold = done & (1 << i), can = wgMarketCan(d), sel = ui.sel === ui.n;
    if (wgButton(ui, '', x + 8, by, 224, { h: 22, off: sold || !can })) wgMarketTrade(i);
    const col = sold || !can ? 'm' : sel ? '0' : 'w'; let ix = x + 14;
    for (const k in d[0]) { ctx.drawImage(wgIcon(k), ix, by + 3); wtext('X' + d[0][k], ix + 18, by + 8, col, 0); ix += 44; }
    wtext('>', x + 116, by + 8, col, 0, 1); ctx.drawImage(wgIcon(d[1][0]), x + 128, by + 3); wtext('X' + d[1][1], x + 146, by + 8, col, 0);
    wtext(sold ? 'DONE TODAY' : can ? 'TRADE' : 'NOT ENOUGH', x + 226, by + 8, col, 0, 2);
  });
  if (wgButton(ui, 'CLOSE', VW / 2 - 52, y0 + h - 22, 104)) { WGS.scr = 'play'; WGS.mkt = null; }
  wgUiEnd(ui);
};
function wgMarketArt() { // a stall under a striped awning, apples and carrots on its counter
  if (WGA.cache.market_stall) return WGA.cache.market_stall;
  return wgMake('market_stall', 20, 24, (g) => {
    wgRc(g, 3, 6, 14, 9, 'u'); // the shade under the awning
    wgRc(g, 2, 6, 1, 14, 'N'); wgRc(g, 17, 6, 1, 14, 'n'); // the posts
    for (let y = 1; y < 6; y++) for (let x = 1; x < 19; x++) wgPx(g, x, y, Math.floor((x - 1) / 3) % 2 ? (y === 1 ? 'L' : 'w') : y === 1 ? 'Y' : 'y'); // the awning
    for (let x = 1; x < 19; x += 3) wgRc(g, x, 6, 2, 1, Math.floor((x - 1) / 3) % 2 ? 'L' : 'o'); // its scalloped hem
    for (const [a, b] of [[5, 12], [7, 12], [6, 11], [9, 12]]) { wgRc(g, a, b, 2, 2, 'r'); wgPx(g, a, b, 'R'); } // apples
    for (const a of [12, 14]) { wgRc(g, a, 11, 1, 3, 'o'); wgPx(g, a, 10, 'G'); } wgRc(g, 15, 12, 1, 2, 'O'); wgPx(g, 15, 11, 'h'); // carrots
    wgRc(g, 1, 14, 18, 1, 'A'); wgRc(g, 1, 15, 18, 5, 'N'); wgRc(g, 1, 15, 1, 5, 'a'); wgRc(g, 18, 15, 1, 5, 'n'); for (const y of [16, 18]) wgRc(g, 2, y, 16, 1, 'n'); // the counter
    wgRc(g, 2, 20, 1, 3, 'u'); wgRc(g, 17, 20, 1, 3, 'u'); // its feet
  });
}
const _wgTipMarket = wgTipLines;
wgTipLines = function (s) { const L = _wgTipMarket(s); if (s.id === 'market') L.push('THREE NEW TRADES EVERY DAY'); return L; };
const _wgBuildMarket = wgBuildAll;
wgBuildAll = function () { _wgBuildMarket(); wgReg('market', [wgMarketArt()]); };
const _wgIconMarket = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'market' || WGA.cache[key]) return _wgIconMarket(id);
  const c = wgMake(key, 16, 16, (g) => { // the stall, small
    wgRc(g, 3, 5, 10, 5, 'u'); wgRc(g, 2, 5, 1, 9, 'N'); wgRc(g, 13, 5, 1, 9, 'n');
    for (let y = 1; y < 5; y++) for (let x = 1; x < 15; x++) wgPx(g, x, y, Math.floor((x - 1) / 2) % 2 ? 'w' : 'y');
    for (const a of [4, 6, 8]) wgRc(g, a, 8, 2, 2, 'r'); wgRc(g, 10, 8, 1, 2, 'o'); wgRc(g, 11, 8, 1, 2, 'o');
    wgRc(g, 1, 10, 14, 1, 'A'); wgRc(g, 1, 11, 14, 3, 'N'); wgRc(g, 1, 11, 1, 3, 'a'); wgRc(g, 14, 11, 1, 3, 'n');
  });
  WGA.cache[key] = c; return c;
};
