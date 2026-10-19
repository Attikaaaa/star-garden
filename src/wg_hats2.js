'use strict';
// Wildgrove: more hats, appended to WG_HATS (a hat is saved and sent as its place in that list, so never reorder it):
// a spotted mushroom cap, a chef's hat, a pumpkin hat with its stem and a pair of bunny ears. They work like every
// other hat (wg_hats). The HAT COLLECTOR star for six different ones.
(function () {
  for (const k of 'onqmbBhz') WG_HAT_KEY[k] = k; // the colours these hats use besides the first ones
  const more = [ // id, name, the sprite row of its top, the columns from its left (front view), its rows, recipe, where
    ['hat_mush', 'MUSHROOM CAP', 0, 4, ['...RRRRr...', '..RwRRRrr..', '.RRRRwRRrp.', 'RwRRRRRrwrp', 'aaaaaaaaaae'], { mush_r: 2, fiber: 1 }, 'hand'],
    ['hat_chef', 'CHEF HAT', 0, 4, ['.wwwwlwwww.', 'wwwwwwwwwwl', 'lwwwwwwwwll', '.LLLLLLLLl.'], { wool: 2 }, 'loom'],
    ['hat_pumpkin', 'PUMPKIN HAT', 0, 4, ['.....Gg....', '...oOOOon..', '..oOyOoOon.', '.oOOoOOoOon', '.nooonooonn'], { pumpkin: 1 }, 'hand'],
    ['hat_bunny', 'BUNNY EARS', 0, 5, ['.ww...ww.', '.wq...wq.', '.wq...wq.', '.ww...wl.', 'LLLLLLLLl'], { wool: 1, fiber: 2 }, 'hand'],
  ];
  for (const h of more) { WG_HATS.push(h); wgItem(h[0], h[1], 'res', { stack: 1, hat: 1 }); wgRec(h[0], 1, h[5], h[6]); }
  WG_ACH.push(['hats6', 'HAT COLLECTOR', 'WEAR SIX DIFFERENT HATS', (c) => { let n = 0, b = c.st.hats | 0; while (b) { n += b & 1; b >>= 1; } return n >= 6; }]);
})();
