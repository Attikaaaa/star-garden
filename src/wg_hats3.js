'use strict';
// Wildgrove: a third box of hats, appended to WG_HATS after wg_hats2's (never reordered): a striped party hat with a
// pompom, a purple witch hat with a gold band, a sailor cap and a frog hat whose eyes look out over the brim. They work
// like every other hat (wg_hats). The MAD HATTER star for ten different ones.
(function () {
  for (const k of '123') WG_HAT_KEY[k] = k; // the purples of the witch hat
  const more = [ // id, name, the sprite row of its top, the columns from its left (front view), its rows, recipe, where
    ['hat_party', 'PARTY HAT', 0, 6, ['...w...', '...P...', '..qyP..', '.qPyPP.', 'qyPyPyP'], { petal_p: 1, petal_y: 1, fiber: 2 }, 'hand'],
    ['hat_witch', 'WITCH HAT', 0, 4, ['......1....', '.....21....', '....2221...', '....yyO1...', '32222222221'], { wool: 2, petal_p: 2 }, 'loom'],
    ['hat_sailor', 'SAILOR CAP', 1, 5, ['..wwwww..', '.wwwwwwl.', '.BBBBBBb.', 'wwwwwwwwl'], { wool: 2, petal_b: 1 }, 'loom'],
    ['hat_frog', 'FROG HAT', 0, 4, ['.ww.....ww.', 'wxwG...Gwxw', '.GGGGGGGGg.', 'GhGGGGGGGgg', '.gGGGGGGGg.'], { wool: 2, slime: 1 }, 'loom'],
  ];
  for (const h of more) { WG_HATS.push(h); wgItem(h[0], h[1], 'res', { stack: 1, hat: 1 }); wgRec(h[0], 1, h[5], h[6]); }
  WG_ACH.push(['hats10', 'MAD HATTER', 'WEAR TEN DIFFERENT HATS', (c) => { let n = 0, b = c.st.hats | 0; while (b) { n += b & 1; b >>= 1; } return n >= 10; }]);
})();
