'use strict';
// Wildgrove: the hat pack. USE a hat in hand to put it on, USE it again to take it off; it stays in your pack. A hat is
// part of the hero's look (p.look.hat), so it is drawn into the hero's own sprite and shows wherever the hero does:
// walking, seated, in a boat, wading. Friends see it: it rides in the look the host shares, and a guest sends theirs
// in the 'p' message (ht), checked against the list. It helps tell friends apart. HAT TRICK for three different hats.
const WG_HATS = [ // id, name, the sprite row of its top, the columns from its left (front view), its rows, recipe, where
  ['hat_straw', 'STRAW HAT', 1, 3, ['....Aaaae....', '...Aaaaaae...', '...rrrrrrr...', 'AAaaaaaaaaaae'], { wheat: 4 }, 'hand'],
  ['hat_flowers', 'FLOWER CROWN', 1, 5, ['.r..y..P.', 'grGyGwGrg'], { petal_r: 1, petal_y: 1, petal_w: 1, fiber: 2 }, 'hand'],
  ['hat_beanie', 'WOOL BEANIE', 0, 4, ['.....w.....', '...rRRRr...', '..rRRrrrp..', '.rRrrrrrrp.', '.LLLLLLLLl.'], { wool: 2, petal_r: 1 }, 'loom'],
  ['hat_top', 'TOP HAT', 0, 5, ['..XXxxx..', '..Xxxxx..', '..rrrrr..', 'XXxxxxxxx'], { wool: 2, leather: 1 }, 'loom'],
  ['hat_crown', 'GOLD CROWN', 1, 6, ['Y.Y.Y.Y', 'yYyyyyO', 'OrOcOrO'], { star_bar: 1 }, 'anvil'],
];
const WG_HAT_KEY = {}; for (const k of 'aAerRpPyYwGgLlxXOc') WG_HAT_KEY[k] = k;
(function () {
  for (const [id, name, , , , rec, at] of WG_HATS) { wgItem(id, name, 'res', { stack: 1, hat: 1 }); wgRec(id, 1, rec, at); }
  WG_ACH.push(['hats', 'HAT TRICK', 'WEAR THREE DIFFERENT HATS', (c) => { let n = 0, b = c.st.hats | 0; while (b) { n += b & 1; b >>= 1; } return n >= 3; }]);
})();
const wgHatOf = (look) => { const k = look ? look.hat | 0 : 0; return k >= 1 && k <= WG_HATS.length ? k : 0; };
const _wgUseHats = wgUse;
wgUse = function (tx, ty) {
  const r = _wgUseHats(tx, ty); if (r) return r;
  const s = WGS.inv[WGS.sel], k = s ? WG_HATS.findIndex(h => h[0] === s.id) + 1 : 0; if (!k) return r;
  const p = WGS.p, L = p.look || (p.look = { skin: 0, hair: 0, shirt: 0 });
  if (wgHatOf(L) === k) { L.hat = 0; wgToast('HAT OFF', 1.2); }
  else { L.hat = k; wgToast('HAT ON', 1.2); const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.hats = (st.hats | 0) | (1 << k); }
  wgSfx('select'); return true;
};
const _wgTipHats = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipHats(s);
  if (WGI[s.id] && WGI[s.id].hat) L.push('USE IT TO PUT IT ON OR TAKE IT OFF', 'FRIENDS SEE IT TOO');
  return L;
};
// The hat goes into the hero's sprite, outlined on its own so it sits apart from the hair.
const _wgPlayerSprHats = wgPlayerSpr;
wgPlayerSpr = function (dir, fr, look, act) {
  const base = _wgPlayerSprHats(dir, fr, look, act), k = wgHatOf(look); if (!k) return base;
  const key = ['ph', dir, fr, look.skin, look.hair, look.shirt, act || '', k].join('_'); if (WGA.cache[key]) return WGA.cache[key];
  const H = WG_HATS[k - 1], bob = fr === 1 || fr === 3 ? 1 : 0, [c, g] = wgCv(base.width, base.height), [hc, hg] = wgCv(base.width, 8);
  g.drawImage(base, 0, 0);
  wgPaint(hg, H[3] + (dir === 'l' ? 1 : 0), 1, H[4], WG_HAT_KEY); wgOutline(hc); // row 1 here is the hat's top, the row above for its outline
  g.drawImage(hc, 0, H[2] + bob - 1);
  WGA.cache[key] = c; return c;
};
const _wgIconHats = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, k = WG_HATS.findIndex(h => h[0] === id) + 1;
  if (WGA.cache[key] || !k) return _wgIconHats(id);
  const H = WG_HATS[k - 1], [c, g] = wgCv(16, 16);
  wgBlob(g, 8, 11, 4.6, 4.6, ['m', 'l', 'l', 'L']); wgPaint(g, H[3] - 1, 5 + H[2], H[4], WG_HAT_KEY); wgOutline(c); // on a little stand's head, as it sits on yours
  WGA.cache[key] = c; return c;
};
