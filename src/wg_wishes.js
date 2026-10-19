'use strict';
// Wildgrove: the frog's little wishes. Each day brings three small wishes, chosen from the day and the world's seed so
// every friend gets the same ones: chop a few trees, break some rocks, pick flowers, cut tall grass, eat, take a walk,
// send an emote. They show beside the pause menu with how far along they are; each one granted rings a chime, and
// all three bring a little gift from the frog (from WG_GIFTS). The count is each player's own (m.wish), started over
// on a new day. The LITTLE HELPER star after five days of wishes.
const WG_WISHES = [ // what is counted, the wish (# is the number), how many
  ['tree', 'CHOP # TREES', 3], ['rock', 'BREAK # ROCKS', 4], ['flower', 'PICK # FLOWERS', 3], ['grass', 'CUT # TALL GRASS', 6],
  ['eat', 'EAT # MEALS', 2], ['walk', 'WALK # TILES', 150], ['emote', 'SEND AN EMOTE', 1],
];
const WGWI = { x: 0, y: 0, w: null }; // where the hero was, to count the walk
(function () {
  WG_ACH.push(['wishes', 'LITTLE HELPER', 'GRANT THE FROG ALL THREE WISHES FIVE TIMES', (c) => (c.st.wishes | 0) >= 5]);
})();
function wgWishesToday() { // the day's three, the same on every screen
  const s = (WGS.world.seed | 0), day = WGS.day | 0, left = WG_WISHES.slice(), out = [];
  for (let i = 0; i < 3; i++) out.push(left.splice(hash(day, i, s * 31 + 919) % left.length, 1)[0]);
  return out;
}
function wgWishState() { // this day's progress, started over when the day turns
  const m = WGS.world.meta, day = WGS.day | 0;
  if (!m.wish || m.wish.day !== day) m.wish = { day, c: {}, done: [0, 0, 0], gift: 0 };
  return m.wish;
}
const wgWishText = (W) => W[1].replace('#', W[2]);
function wgWishCount(k, n) {
  if (!WGS.world || !WGS.p) return;
  const S = wgWishState(); S.c[k] = Math.min(99999, (S.c[k] || 0) + (n || 1));
}
// the counting
const _wgBreakWish = wgBreak;
wgBreak = function (tx, ty, byPlayer) {
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  const r = _wgBreakWish(tx, ty, byPlayer);
  if (o && byPlayer) {
    if (o.kind === 'tree') wgWishCount('tree'); else if (o.kind === 'rock') wgWishCount('rock');
    else if (o.id === 'tallgrass') wgWishCount('grass'); else if (o.kind === 'plant' && (o.drops || []).some(d => String(d[0]).startsWith('petal_'))) wgWishCount('flower');
  }
  return r;
};
const _wgEatWish = wgEat;
wgEat = function (slot) { const r = _wgEatWish(slot); if (r) wgWishCount('eat'); return r; };
if (typeof wgEmote === 'function') { const _wgEmoteWish = wgEmote; wgEmote = function (k) { _wgEmoteWish(k); wgWishCount('emote'); }; }
const _wgUpdWish = updateWG;
updateWG = function (dt) {
  _wgUpdWish(dt);
  const w = WGS.world, p = WGS.p; if (!w || !p) { WGWI.w = null; return; }
  if (WGWI.w !== w || WGWI.d !== WGS.dim) { WGWI.w = w; WGWI.d = WGS.dim; WGWI.x = p.x; WGWI.y = p.y; }
  if (WGS.scr !== 'play') return;
  const d = Math.hypot(p.x - WGWI.x, p.y - WGWI.y); WGWI.x = p.x; WGWI.y = p.y;
  if (d > 0 && d < 24) { WGWI.acc = (WGWI.acc || 0) + d / 16; if (WGWI.acc >= 1) { const n = Math.floor(WGWI.acc); WGWI.acc -= n; wgWishCount('walk', n); } } // a jump (a waystone, the feather) is no walk
  const S = wgWishState(), L = wgWishesToday();
  L.forEach((W, i) => { if (!S.done[i] && (S.c[W[0]] || 0) >= W[2]) { S.done[i] = 1; wgToast('WISH GRANTED!', 2.5); wgSfx('chime'); } });
  if (!S.gift && S.done.every(Boolean)) { // all three: the frog's thank-you
    S.gift = 1; const [id, n] = WG_GIFTS[hash(S.day, 7, (w.seed | 0) + 3) % WG_GIFTS.length];
    if (WGI[id]) { const left = wgInvAdd(WGS.inv, id, n); if (left) wgDrop(p.x, p.y, id, left); }
    wgToast('ALL WISHES GRANTED! A GIFT FROM THE FROG', 3.5); wgSfx('confirm'); wgPart(p.x, p.y - 14, 10, { c: ['G', 'h', 'y', 'w'], s: 34, up: 26, life: 0.8, sz: 2 });
    const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.wishes = (st.wishes | 0) + 1;
  }
};
// beside the pause menu: today's wishes, each with how far along it is
const _wgPauseWish = wgDrawPause;
wgDrawPause = function () {
  _wgPauseWish();
  const ui = WGS.ui; if (WGS.scr !== 'pause' || !WGS.world || ui.set || ui.ach || ui.mp || ui.help || ui.album) return;
  const S = wgWishState(), L = wgWishesToday(), x = 6, w = 100;
  const rows = L.map((W, i) => wrapText(wgWishText(W), w - 26).concat(!S.done[i] && W[2] > 1 ? [null] : [])), h = 24 + rows.reduce((a, r) => a + r.length * 9 + 5, 0); // null: the line for how far along
  panel(x, 22, w, h); wtext('WISHES', x + w / 2, 30, 'Y', 3, 1);
  let y = 44;
  L.forEach((W, i) => {
    const done = S.done[i], n = Math.min(W[2], S.c[W[0]] || 0);
    rect(x + 8, y, 9, 9, '0'); rect(x + 9, y + 1, 7, 7, done ? 'G' : '1'); if (done) { rect(x + 10, y + 4, 2, 2, 'w'); rect(x + 12, y + 5, 1, 2, 'w'); rect(x + 13, y + 3, 1, 3, 'w'); rect(x + 14, y + 2, 1, 2, 'w'); } // a tick
    rows[i].forEach((line, j) => line === null ? wgRawText(n + ' / ' + W[2], x + 21, y + 1 + j * 9, 'm', 1, 0) : wtext(line, x + 21, y + 1 + j * 9, done ? 'h' : 'w', 1, 0));
    y += rows[i].length * 9 + 5;
  });
};
