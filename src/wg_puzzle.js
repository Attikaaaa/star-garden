'use strict';
// Wildgrove: a jigsaw puzzle table. Each USE fits one more of its `WG_PUZ_N` pieces (in an order shuffled for each
// picture) until one of `WG_PUZ_PICS` is whole on the table; USE on a finished one breaks it up and starts the next
// picture. The tile's meta is the pieces in place plus the picture (`pieces + picture * 32`), so it goes over co-op with
// the tile and friends can puzzle together. Finished pictures count in `stats.puzzles`; three light PIECE BY PIECE.
const WG_PUZ_N = 16, WG_PUZ_PICS = 5; // pieces (four by four, each 3 by 2 pixels), pictures
(function () {
  wgObj('puzzle', { name: 'PUZZLE TABLE', kind: 'deco', tool: 'axe', hp: 3, puzzle: 1, drops: [DR('puzzle', 1, 1)] });
  wgItem('puzzle', 'PUZZLE TABLE', 'place', { place: 'puzzle' }); PLACE.puzzle = 'puzzle'; wgRec('puzzle', 1, { wood: 4, petal_b: 1, petal_y: 1 }, 'bench');
  WG_ACH.push(['puzzle', 'PIECE BY PIECE', 'FINISH THREE JIGSAW PUZZLES', (c) => (c.st.puzzles | 0) >= 3]);
})();
const wgPuzOrder = (pic) => { const L = [...Array(WG_PUZ_N).keys()]; for (let i = L.length - 1; i > 0; i--) { const j = hash(pic, i, 61) % (i + 1); [L[i], L[j]] = [L[j], L[i]]; } return L; };
const _wgUsePuz = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty);
  if (!id || !OBJ[id].puzzle) return _wgUsePuz(tx, ty);
  const m = wgMetaAt(w, dim, tx, ty), n = m & 31, pic = m >> 5;
  if (n >= WG_PUZ_N) { wgSetObj(w, dim, tx, ty, id, ((pic + 1) % WG_PUZ_PICS) << 5); wgToast('A NEW PUZZLE'); wgSfx('select'); return true; }
  wgSetObj(w, dim, tx, ty, id, m + 1); wgSfx('clack');
  if (n + 1 === WG_PUZ_N) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.puzzles = (st.puzzles | 0) + 1; wgToast('THE PICTURE IS WHOLE!', 2); wgSfx('chime'); wgPart(tx * 16 + 8, ty * 16, 6, { c: ['y', 'Y', 'w'], s: 16, up: 18, life: 0.6 }); }
  return true;
};
const _wgDrawObjPuz = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.puzzle) return _wgDrawObjPuz(id, tx, ty, sx, sy);
  const m = wgMetaAt(WGS.world, WGS.dim, tx, ty), n = Math.min(m & 31, WG_PUZ_N), pic = (m >> 5) % WG_PUZ_PICS, x = sx - 1, y = sy - 1;
  shadow(sx + 8, sy + 14, 16); ctx.drawImage(wgPuzArt('table'), x, y);
  const art = wgPuzArt('pic' + pic), ord = wgPuzOrder(pic);
  for (let i = 0; i < n; i++) { const k = ord[i], cx = (k & 3) * 3, cy = (k >> 2) * 2; ctx.drawImage(art, cx, cy, 3, 2, x + 3 + cx, y + 2 + cy, 3, 2); }
  if (n < WG_PUZ_N) { rect(x + 1, y + 3, 1, 1, 'b'); rect(x + 16, y + 6, 1, 1, 'P'); if (n < 12) rect(x + 1, y + 7, 1, 1, 'y'); } // loose pieces at the table's edges
};
function wgPuzArt(k) { // the table with the picture's cardboard bed, and the five pictures (12 by 8)
  const key = 'puz_' + k; if (WGA.cache[key]) return WGA.cache[key];
  if (k === 'table') return wgMake(key, 18, 17, (g) => {
    wgRc(g, 1, 1, 16, 10, 'N'); wgRc(g, 1, 1, 16, 1, 'A'); wgRc(g, 1, 1, 1, 10, 'a'); // the top, lit from the top left
    wgRc(g, 3, 2, 12, 8, 'a'); for (let i = 1; i < 4; i++) wgRc(g, 3 + i * 3, 2, 1, 8, 'e'); for (let j = 1; j < 4; j++) wgRc(g, 3, 2 + j * 2, 12, 1, 'e'); // the empty bed, ruled into pieces
    wgRc(g, 1, 11, 16, 2, 'n'); wgRc(g, 1, 11, 16, 1, 'N'); wgRc(g, 2, 13, 2, 3, 'u'); wgRc(g, 14, 13, 2, 3, 'u'); wgPx(g, 2, 13, 'n'); wgPx(g, 14, 13, 'n'); // the front and legs
  });
  const p = +k.slice(3);
  return wgMake(key, 12, 8, (g) => {
    if (p === 0) { // a sunset over the sea
      for (let y = 0; y < 5; y++) wgRc(g, 0, y, 12, 1, ['p', 'r', 'o', 'O', 'y'][y]); wgBlob(g, 6, 4.5, 2.4, 2, ['y', 'Y', 'Y', 'w']); wgRc(g, 0, 5, 12, 3, 'b'); wgRc(g, 3, 5, 6, 1, 'Y'); wgRc(g, 4, 6, 4, 1, 'O'); wgPx(g, 1, 7, 'B'); wgPx(g, 9, 6, 'B');
    } else if (p === 1) { // a snowy mountain
      wgRc(g, 0, 0, 12, 8, 'c'); wgRc(g, 0, 0, 12, 2, 'B'); for (let y = 1; y < 7; y++) wgRc(g, 6 - y, y, y * 2, 1, y < 3 ? 'w' : 'm'); for (let y = 4; y < 7; y++) wgRc(g, 6, y, y - 3, 1, 'd'); wgRc(g, 0, 6, 12, 2, 'G'); wgRc(g, 0, 7, 12, 1, 'g'); wgPx(g, 10, 1, 'w');
    } else if (p === 2) { // a meadow of flowers
      wgRc(g, 0, 0, 12, 3, 'C'); wgRc(g, 0, 3, 12, 5, 'G'); wgRc(g, 0, 3, 12, 1, 'h'); for (const [a, b, c] of [[1, 4, 'P'], [4, 5, 'y'], [7, 4, 'w'], [10, 6, 'P'], [2, 6, 'y'], [8, 7, 'q'], [5, 7, 'w']]) wgPx(g, a, b, c); wgPx(g, 9, 1, 'Y'); wgPx(g, 10, 1, 'y');
    } else if (p === 3) { // a starry night with the moon
      wgRc(g, 0, 0, 12, 8, '1'); wgRc(g, 0, 6, 12, 2, 'g'); wgRc(g, 0, 6, 12, 1, 'G'); wgBlob(g, 8.5, 2.5, 1.8, 1.8, ['y', 'Y', 'Y', 'w']); for (const [a, b] of [[1, 1], [4, 3], [2, 4], [11, 4], [6, 0]]) wgPx(g, a, b, 'w');
    } else { // a frog on a lily pad
      wgRc(g, 0, 0, 12, 8, 't'); wgRc(g, 0, 0, 12, 1, 'T'); wgBlob(g, 6, 6, 5, 1.8, ['g', 'G', 'G', 'h']); wgBlob(g, 6, 4, 2.6, 2, ['g', 'G', 'h', 'H']); wgPx(g, 5, 2, 'w'); wgPx(g, 7, 2, 'w'); wgPx(g, 5, 3, '0'); wgPx(g, 7, 3, '0'); wgRc(g, 5, 5, 3, 1, 'g');
    }
  }, false);
}
const _wgTipPuz = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPuz(s); if (s.id === 'puzzle') L.push('USE IT TO FIT A PIECE'); return L; };
const _wgBuildPuz = wgBuildAll;
wgBuildAll = function () { _wgBuildPuz(); wgReg('puzzle', [wgPuzArt('table')]); };
const _wgIconPuz = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'puzzle' || WGA.cache[key]) return _wgIconPuz(id);
  const pic = wgPuzArt('pic2'), c = wgMake(key, 16, 16, (g) => { // a smaller table, half a meadow done
    wgRc(g, 1, 3, 14, 8, 'N'); wgRc(g, 1, 3, 14, 1, 'A'); wgRc(g, 1, 3, 1, 8, 'a'); wgRc(g, 3, 4, 10, 6, 'a'); for (const i of [5, 8, 11]) wgRc(g, i, 4, 1, 6, 'e'); wgRc(g, 3, 7, 10, 1, 'e');
    g.drawImage(pic, 1, 0, 10, 3, 3, 4, 10, 3); wgRc(g, 1, 11, 14, 2, 'n'); wgRc(g, 1, 11, 14, 1, 'N'); wgRc(g, 2, 13, 2, 2, 'u'); wgRc(g, 12, 13, 2, 2, 'u');
  });
  WGA.cache[key] = c; return c;
};
