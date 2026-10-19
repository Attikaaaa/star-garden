'use strict';
// Wildgrove: a fourth box of hats, appended to WG_HATS after wg_hats3's (never reordered): a cowboy hat with its brim
// curled up, a Santa hat whose white pompom hangs to the side, cat ears on a band and bee antennae. They work like
// every other hat (wg_hats). The HABERDASHER star for fifteen different ones.
(function () {
  for (const k of 'Nu') WG_HAT_KEY[k] = k; // the browns of the cowboy hat
  const more = [ // id, name, the sprite row of its top, the columns from its left (front view), its rows, recipe, where
    ['hat_cowboy', 'COWBOY HAT', 0, 3, ['....NNNNN....', 'N..NANNNnn..n', 'N..uuuuuuu..n', '.NNNNNNNNNnn.'], { leather: 2, wool: 1 }, 'loom'],
    ['hat_santa', 'SANTA HAT', 0, 4, ['.....rr....', '....rRrrww.', '...rRrrrww.', '..rRrrrrrp.', '.LLLLLLLLl.'], { wool: 2, petal_r: 1, petal_w: 1 }, 'loom'],
    ['hat_cat', 'CAT EARS', 1, 4, ['.x.......x.', 'xqx.....xqx', 'xxxXXXXXxxx'], { wool: 1, petal_p: 1 }, 'hand'],
    ['hat_bee', 'BEE ANTENNAE', 0, 4, ['.y.......y.', '..x.....x..', '...x...x...', '...xxxxx...'], { fiber: 2, petal_y: 1 }, 'hand'],
  ];
  for (const h of more) { WG_HATS.push(h); wgItem(h[0], h[1], 'res', { stack: 1, hat: 1 }); wgRec(h[0], 1, h[5], h[6]); }
  WG_ACH.push(['hats15', 'HABERDASHER', 'WEAR FIFTEEN DIFFERENT HATS', (c) => { let n = 0, b = c.st.hats | 0; while (b) { n += b & 1; b >>>= 1; } return n >= 15; }]);
})();
